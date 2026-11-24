const MEASUREMENTS_URL = "https://api.globalping.io/v1/measurements";
const CREATE_RETRY_BASE_DELAY = 2000;
const CREATE_RETRY_MAX_DELAY = 15000;
const CREATE_RETRY_MAX_WINDOW = 60000;
const POLL_DELAY = 2000;

export type Location = {
    country: string;
    city: string;
    tags?: string[];
};

export type Probe = Pick<Location, "country" | "city"> & {
    asn: number;
    network: string;
};

export type MeasurementResponse<R> = {
    status: string;
    results: { probe: Probe; result: R }[];
};

export type MeasurementRequest = {
    target: string;
    type: "http" | "ping";
    locations: (Location & { limit: number })[] | string;
    measurementOptions: Record<string, unknown>;
};

export class MeasurementTimeoutError extends Error {}

export async function createMeasurementWithRetry(
    request: MeasurementRequest,
    apiKey: string,
    intervalMs: number
): Promise<Response> {
    const requestOptions: RequestInit = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(request),
    };
    const deadline =
        Date.now() +
        Math.min(Math.floor(intervalMs / 2), CREATE_RETRY_MAX_WINDOW);
    let attempt = 0;
    while (true) {
        const response = await fetch(MEASUREMENTS_URL, requestOptions);
        if (response.ok || response.status < 500) {
            return response;
        }
        const delay = Math.min(
            CREATE_RETRY_BASE_DELAY * 2 ** attempt,
            CREATE_RETRY_MAX_DELAY
        );
        if (Date.now() + delay >= deadline) {
            return response;
        }
        await sleep(delay);
        attempt += 1;
    }
}

export async function pollMeasurement<R>(
    id: string,
    target: string,
    timeoutMs: number
): Promise<MeasurementResponse<R>> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        const response = await fetch(`${MEASUREMENTS_URL}/${id}`);

        if (!response.ok) {
            if (response.status >= 500) {
                await sleep(POLL_DELAY);
                continue;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as MeasurementResponse<R>;
        if (data.status === "finished") {
            return data;
        }

        await sleep(POLL_DELAY);
    }
    throw new MeasurementTimeoutError(
        `Measurement ${id} for ${target} did not complete in ${timeoutMs / 1000}s.`
    );
}

export function toNonNegativeNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
        return null;
    }

    return numericValue;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
