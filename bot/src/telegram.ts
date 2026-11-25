type SentMessage = {
    messageId: number;
    hasPhoto: boolean;
};

type TelegramResponse = {
    ok: boolean;
    description?: string;
    result?: { message_id: number };
};

export const TOKEN = process.env.TG_BOT_TOKEN;
export const CHAT_ID = process.env.TG_CHAT_ID ?? "";
export const DRY_RUN = process.env.BOT_DRY_RUN === "1";

const SITE_URL = process.env.SITE_URL ?? "https://yummystatus.me";
const SCREENSHOT_URL =
    process.env.SCREENSHOT_URL ??
    "https://image.thum.io/get/viewportWidth/1400/width/1370/crop/590/refresh/60/wait/12/noanimate/{url}";
const SCREENSHOT_TARGET =
    process.env.SCREENSHOT_TARGET ?? `${SITE_URL}/?bare=1`;
const SCREENSHOT_TIMEOUT_MS = 90 * 1000;

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export async function sendAlert(
    caption: string,
    given?: Uint8Array<ArrayBuffer>
): Promise<SentMessage> {
    const image = given ?? (await fetchScreenshot());

    if (DRY_RUN) {
        console.log(
            `--- caption (${caption.length} симв., фото: ${Boolean(image)}) ---`
        );
        console.log(caption);
        return { messageId: 0, hasPhoto: Boolean(image) };
    }

    if (image) {
        const form = new FormData();
        form.set("chat_id", CHAT_ID);
        form.set("caption", caption);
        form.set("parse_mode", "HTML");
        form.set(
            "photo",
            new Blob([image], { type: "image/png" }),
            "status.png"
        );
        const message = await telegram("sendPhoto", form);
        return { messageId: message.message_id, hasPhoto: true };
    }

    return sendText(caption);
}

export async function sendText(text: string): Promise<SentMessage> {
    if (DRY_RUN) {
        console.log(`--- message (${text.length} симв.) ---`);
        console.log(text);
        return { messageId: 0, hasPhoto: false };
    }

    const message = await telegram("sendMessage", {
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
    });
    return { messageId: message.message_id, hasPhoto: false };
}

export async function editAlert(
    state: SentMessage,
    caption: string,
    given?: Uint8Array<ArrayBuffer> | null
): Promise<boolean> {
    const image = state.hasPhoto
        ? given === undefined
            ? await fetchScreenshot()
            : given
        : null;

    if (DRY_RUN) {
        console.log(
            `--- update (${caption.length} симв., фото: ${Boolean(image)}) ---`
        );
        console.log(caption);
        return true;
    }

    try {
        if (image) {
            const form = new FormData();
            form.set("chat_id", CHAT_ID);
            form.set("message_id", String(state.messageId));
            form.set(
                "media",
                JSON.stringify({
                    type: "photo",
                    media: "attach://photo",
                    caption,
                    parse_mode: "HTML",
                })
            );
            form.set(
                "photo",
                new Blob([image], { type: "image/png" }),
                "status.png"
            );
            await telegram("editMessageMedia", form);
        } else if (state.hasPhoto) {
            await telegram("editMessageCaption", {
                chat_id: CHAT_ID,
                message_id: state.messageId,
                caption,
                parse_mode: "HTML",
            });
        } else {
            await telegram("editMessageText", {
                chat_id: CHAT_ID,
                message_id: state.messageId,
                text: caption,
                parse_mode: "HTML",
                disable_web_page_preview: true,
            });
        }
        return true;
    } catch (error) {
        if (!messageGone(error)) throw error;
        console.error("Сообщение недоступно для правки:", errorMessage(error));
        return false;
    }
}

async function telegram(
    method: string,
    body: FormData | Record<string, unknown>
): Promise<{ message_id: number }> {
    const init =
        body instanceof FormData
            ? { method: "POST", body }
            : {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
              };
    const response = await fetch(
        `https://api.telegram.org/bot${TOKEN}/${method}`,
        init
    );
    const data = (await response.json()) as TelegramResponse;
    if (!data.ok || !data.result) {
        throw new Error(`${method}: ${data.description}`);
    }
    return data.result;
}

async function fetchScreenshot(): Promise<Uint8Array<ArrayBuffer> | null> {
    try {
        const response = await fetch(
            SCREENSHOT_URL.replace("{url}", SCREENSHOT_TARGET),
            {
                signal: AbortSignal.timeout(SCREENSHOT_TIMEOUT_MS),
            }
        );
        if (!response.ok) throw new Error(`screenshot: ${response.status}`);
        const image = new Uint8Array(await response.arrayBuffer());
        return image.byteLength > 0 ? image : null;
    } catch (error) {
        console.error("Скриншот не получен:", errorMessage(error));
        return null;
    }
}

function messageGone(error: unknown): boolean {
    return /message to edit not found|message can't be edited|MESSAGE_ID_INVALID/i.test(
        errorMessage(error)
    );
}
