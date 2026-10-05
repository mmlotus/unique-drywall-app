"use client";

import { authClient } from "@/lib/auth-client";
import glob from "@/styles/Global.module.css";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        try {
            await authClient.signOut();

            toast.success("Signed out successfully!");

            router.push("/login");
            router.refresh();
        } catch (err) {
            console.error("Logout failed:", err);
            toast.error("Unable to sign out.");
        }
    }

    return (
        <button
            className={glob.button}
            type="button"
            onClick={handleLogout}
        >
            Sign Out
        </button>
    );
}