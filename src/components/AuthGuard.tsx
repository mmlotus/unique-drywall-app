"use client";

import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import styles from "@/styles/AppHeader.module.css";
import Link from "next/link";


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

    const pageTitles: Record<string, string> = {
        "/home": `Welcome back, ${session?.user?.name?.split(" ")[0] ?? "User"}!`,
        "/estimates": "Estimates",
        "/estimates/new": "New Estimate",
        "/customers": "Customers",
        "/builders": "Builders / Firms",
        "/materials": "Materials",
        "/categories": "Categories",
        "/units": "Units",
        "/areas": "Areas / Rooms",
    };

    const title =
        pageTitles[pathname] ??
        (pathname.startsWith("/estimates/")
            ? "Estimate Builder"
            : "Unique Drywall");

    const description =
        pathname === "/home"
            ? "Your estimating workspace, all in one place."
            : "Your estimating workspace.";

    const showHeader = Boolean(session) && !pathname.startsWith("/login");

    return (
        <>
            {showHeader && (
                <div className={styles.headerContainer}>
                    <Link
                        href="/home"
                        className={styles.homeLink}
                        aria-label="Return to homepage"
                    >
                        <header className={styles.welcome}>
                            <p className={styles.eyebrow}>UNIQUE DRYWALL</p>
                            <h1 className={styles.title}>{title}</h1>
                            <p className={styles.description}>{description}</p>
                        </header>
                    </Link>
                </div>
            )}
            {children}
        </>
    );
}