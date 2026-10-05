"use client";

import { authClient } from "@/lib/auth-client";
import glob from "@/styles/Global.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get("email");
    const token = searchParams.get("token");
    const urlError = searchParams.get("error");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [invalidToken, setInvalidToken] = useState(urlError === "INVALID_TOKEN" || !token);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (!token) {
            setInvalidToken(true);
            return;
        }

        setIsSubmitting(true);

        try {
            await authClient.resetPassword({
                newPassword: password,
                token,
            });

            toast.success("Password reset successfully.");

            router.push("/login");
            router.refresh();
        } catch (err) {
            console.error("Password reset failed:", err);

            const message = err instanceof Error ? err.message.toLowerCase() : "";

            if (
                message.includes("invalid") ||
                message.includes("expired") ||
                message.includes("token")
            ) {
                setInvalidToken(true);
                toast.error("This password reset link is invalid or has expired.");
            } else {
                toast.error("Unable to reset password.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    if (invalidToken) {
        return (
            <main className={glob.container}>
                <div className={glob.form}>
                    <h1 className={glob.heading}>Reset Password</h1>

                    <p>This password reset link is invalid or has expired.</p>

                    <button
                        className={glob.button}
                        type="button"
                        onClick={() => router.push("/login/forgot-password")}
                    >
                        Request New Reset Link
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={glob.container}>
            <form className={glob.form} onSubmit={handleSubmit}>
                <h1 className={glob.heading}>Reset Password</h1>
                {email && (
                    <p className={glob.info}>
                        Reset password for: {email}
                    </p>
                )}

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>New Password</label>
                    <input
                        className={glob.input}
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Confirm New Password</label>
                    <input
                        className={glob.input}
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    className={glob.button}
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                </button>
            </form>
        </main>
    );
}