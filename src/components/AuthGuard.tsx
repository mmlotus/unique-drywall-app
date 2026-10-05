"use client";

import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";


export default function AuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { data: session, isPending } = authClient.useSession();

    const hasResetToken = searchParams.has("token");
    const hasResetError = searchParams.has("error");

    const isResetPage =
        pathname === "/login/reset-password" &&
        (hasResetToken || hasResetError);

    const isPublicAuthPage =
        pathname === "/login" ||
        pathname === "/login/signup" ||
        pathname === "/login/forgot-password" ||
        isResetPage;

    const shouldRedirectLoggedInUser =
        pathname === "/login" ||
        pathname === "/login/signup" ||
        pathname === "/login/forgot-password";

    useEffect(() => {
        if (isPending) return;

        if (!session && !isPublicAuthPage) {
            router.replace("/login");
            return;
        }

        if (session && shouldRedirectLoggedInUser) {
            router.replace("/");
        }
    }, [
        session,
        isPending,
        isPublicAuthPage,
        shouldRedirectLoggedInUser,
        router,
    ]);

    if (isPending) return null;

    if (!session && !isPublicAuthPage) return null;

    if (session && shouldRedirectLoggedInUser) return null;

    return <>{children}</>;
}