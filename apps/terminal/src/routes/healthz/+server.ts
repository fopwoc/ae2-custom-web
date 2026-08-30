import { json } from "@sveltejs/kit";

export const GET = () => json({ status: "ok", version: __APP_VERSION__ });
