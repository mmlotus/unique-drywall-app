"use client";

import { authClient } from "@/lib/auth-client";
import glob from "@/styles/Global.module.css";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        setIsSubmitting(true);

        try {
            await authClient.requestPasswordReset({
                email,
                redirectTo: `${window.location.origin}/login/reset-password?email=${encodeURIComponent(email)}`,
            });

            toast.success("Password reset email sent.");
        } catch (err) {
            console.error("Password reset request failed:", err);
            toast.error("Unable to send password reset email.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className={glob.container}>
            <form className={glob.form} onSubmit={handleSubmit}>
                <h1 className={glob.heading}>Reset Password</h1>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Email</label>
                    <input
                        className={glob.input}
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <button
                    className={glob.button}
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                </button>

                <button
                    className={glob.link}
                    type="button"
                    onClick={() => router.push("/login")}
                >
                    Back to Sign In
                </button>
            </form>
        </main>
    );
}