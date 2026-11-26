import { type ProbePin, probePins } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { eq } from "drizzle-orm";
import type {
    Location,
    MeasurementRequest,
    MeasurementResponse,
    Probe,
} from "./globalping.ts";

export type Slot = ProbePin["slots"][number];
export type Pin = Pick<ProbePin, "set" | "measurementId" | "slots">;
type ProbeInfo = { location: Probe; tags: string[] };
export type PinnedMeasurement = MeasurementResponse<unknown> & { id: string };

const PROBES_URL = "https://api.globalping.io/v1/probes";
const DAY = 24 * 60 * 60 * 1000;
const MAX_REPLACEMENTS = 3;
const STRIKE_LIMIT = 2;

export async function loadPin(set: Pin["set"]): Promise<Pin> {
    const [row] = await db
        .select()
        .from(probePins)
        .where(eq(probePins.set, set));
    return row ?? { set, measurementId: "", slots: [] };
}

export function syncSlots(
    pin: Pin,
    locations: readonly Pick<Location, "country" | "city">[]
): Pin {
    const slots = locations.map(
        ({ country, city }) =>
            pin.slots.find(
                (slot) => slot.country === country && slot.city === city
            ) ?? freshSlot(country, city)
    );
    return slots.length === pin.slots.length &&
        slots.every((slot, index) => slot === pin.slots[index])
        ? pin
        : { ...pin, slots, measurementId: "" };
}

export async function runPinned<M extends PinnedMeasurement>(
    pin: Pin,
    tags: string[],
    run: (locations: MeasurementRequest["locations"]) => Promise<M | null>
): Promise<M | null> {
    if (pin.measurementId) {
        const measurement = await run(pin.measurementId);
        if (measurement) return measurement;
        console.error(
            `[PIN] Baseline ${pin.measurementId} of ${pin.set} rejected, rebuilding from slots`
        );
    }
    const measurement = await run(
        pin.slots.map(({ country, city, asn, network }) => ({
            country,
            city,
            ...(asn ? { asn } : {}),
            ...(network ? { network } : {}),
            ...(tags.length ? { tags } : {}),
            limit: 1,
        }))
    );
    if (measurement) return measurement;
    console.error(
        `[PIN] Slots of ${pin.set} matched no probes, retrying by city only`
    );
    return run(
        pin.slots.map(({ country, city }) => ({
            country,
            city,
            ...(tags.length ? { tags } : {}),
            limit: 1,
        }))
    );
}

export async function commitPin(
    pin: Pin,
    { id, results }: PinnedMeasurement
): Promise<void> {
    pin.measurementId = id;
    matchSlots(pin.slots, results).forEach((entry, index) => {
        if (!entry) return;
        const { asn, network } = entry.probe;
        pin.slots[index] = { ...pin.slots[index], asn, network };
    });
    await savePin(pin);
}

export function matchSlots<R extends { probe: Probe }>(
    slots: Slot[],
    results: R[]
): (R | undefined)[] {
    const used = new Set<R>();
    return slots.map((slot) => {
        const entry = results.find(
            (result) =>
                !used.has(result) &&
                result.probe.country === slot.country &&
                result.probe.city === slot.city &&
                (!slot.asn || result.probe.asn === slot.asn)
        );
        if (entry) used.add(entry);
        return entry;
    });
}

export function applyStrikes(pin: Pin, failed: boolean[]): number[] {
    pin.slots.forEach((slot, index) => {
        slot.strikes = failed[index] ? slot.strikes + 1 : 0;
    });
    return pin.slots.flatMap(({ strikes }, index) =>
        strikes >= STRIKE_LIMIT ? [index] : []
    );
}

export async function replaceSuspect(
    pin: Pin,
    suspects: number[],
    tags: string[],
    anyCity: boolean
): Promise<boolean> {
    if (
        !suspects.length ||
        (pin.slots.length > 1 && suspects.length * 3 > pin.slots.length)
    ) {
        console.error(
            `[PIN] ${suspects.length}/${pin.slots.length} slots of ${pin.set} suspect, not replacing`
        );
        return false;
    }
    const probes = await fetchProbes();
    for (const index of suspects) {
        const slot = pin.slots[index];
        const recent = slot.replacements.filter(
            (time) => time > Date.now() - DAY
        );
        if (recent.length >= MAX_REPLACEMENTS) {
            console.error(
                `[PIN] Slot ${index} of ${pin.set} hit replacement limit`
            );
            continue;
        }
        const replacement = await findReplacement(
            pin.slots,
            index,
            tags,
            probes,
            anyCity
        );
        if (!replacement) {
            console.error(
                `[PIN] No replacement for slot ${index} of ${pin.set} (${slot.city} AS${slot.asn})`
            );
            continue;
        }
        pin.slots[index] = {
            ...replacement,
            strikes: 0,
            replacements: [...recent, Date.now()],
        };
        pin.measurementId = "";
        await savePin(pin);
        console.log(
            `[PIN] Replaced slot ${index} of ${pin.set}: ${slot.city} AS${slot.asn} ${slot.network} -> ${replacement.city} AS${replacement.asn} ${replacement.network}`
        );
        return true;
    }
    return false;
}

export async function pickSlots(
    country: string,
    tags: string[],
    count: number,
    excludeCities: string[] = []
): Promise<Slot[]> {
    const counts = new Map<string, number>();
    for (const { location } of matching(await fetchProbes(), country, tags)) {
        if (!excludeCities.includes(location.city)) {
            counts.set(location.city, (counts.get(location.city) ?? 0) + 1);
        }
    }
    return [...counts]
        .sort(([nameA, a], [nameB, b]) => b - a || nameA.localeCompare(nameB))
        .slice(0, count)
        .map(([city]) => freshSlot(country, city));
}

function freshSlot(country: string, city: string): Slot {
    return { country, city, asn: 0, network: "", strikes: 0, replacements: [] };
}

async function savePin({ set, measurementId, slots }: Pin): Promise<void> {
    await db
        .insert(probePins)
        .values({ set, measurementId, slots })
        .onConflictDoUpdate({
            target: probePins.set,
            set: { measurementId, slots, updatedAt: new Date() },
        });
}

async function findReplacement(
    slots: Slot[],
    index: number,
    tags: string[],
    probes: ProbeInfo[],
    anyCity: boolean
): Promise<Slot | null> {
    const slot = slots[index];
    const others = slots.filter((_, other) => other !== index);
    const candidates = matching(probes, slot.country, tags)
        .map(({ location }) => location)
        .filter(
            ({ city, asn, network }) =>
                !others.some(
                    (other) =>
                        other.city === city &&
                        other.asn === asn &&
                        other.network === network
                )
        );
    const found =
        candidates.find(
            ({ city, asn, network }) =>
                city === slot.city &&
                asn === slot.asn &&
                network === slot.network
        ) ??
        candidates.find(
            ({ city, asn }) => city === slot.city && asn === slot.asn
        ) ??
        candidates.find(({ city }) => city === slot.city);
    if (found) {
        const { country, city, asn, network } = found;
        return { ...slot, country, city, asn, network };
    }
    if (!anyCity) return null;
    const [other] = await pickSlots(slot.country, tags, 1, [
        slot.city,
        ...others.map(({ city }) => city),
    ]);
    return other ?? null;
}

async function fetchProbes(): Promise<ProbeInfo[]> {
    const response = await fetch(PROBES_URL);
    if (!response.ok) {
        throw new Error(`probes list responded ${response.status}`);
    }
    return (await response.json()) as ProbeInfo[];
}

function matching(
    probes: ProbeInfo[],
    country: string,
    tags: string[]
): ProbeInfo[] {
    return probes.filter(
        ({ location, tags: probeTags }) =>
            location.country === country &&
            tags.every((tag) => probeTags.includes(tag))
    );
}
