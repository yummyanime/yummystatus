import { createHmac } from "node:crypto";

export function nodeKey(ip: string): string {
    const secret = process.env.PROVISIONER_TOKEN;
    if (!secret) {
        throw new Error("PROVISIONER_TOKEN is not set");
    }
    return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 16);
}
