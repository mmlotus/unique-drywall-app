import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react";

const authBaseUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;

if (!authBaseUrl) throw new Error("NEXT_PUBLIC_NEON_AUTH_URL is not defined.");

export const authClient = createAuthClient(authBaseUrl, {
    adapter: BetterAuthReactAdapter(),
});