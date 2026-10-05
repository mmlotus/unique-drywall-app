"use client";

import glob from "@/styles/Global.module.css";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";


export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        setIsSubmitting(true);

        try {
            await authClient.signIn.email({
                email, password,
            });

            toast.success("Signed in successfully!");
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Login error:", error);

            const message = error instanceof Error ? error.message.toLowerCase() : "";

            if (
                message.includes("invalid email or password") ||
                message.includes("invalid credentials")
            ) {
                toast.error("Incorrect email or password.");
            } else {
                toast.error("Unable to sign in.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className={glob.container}>
            <form className={glob.form} onSubmit={handleSubmit}>
                <h1 className={glob.heading}>Unique Drywall</h1>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Email</label>
                    <input
                        className={glob.input}
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Password</label>
                    <input
                        className={glob.input}
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                <div className={glob.linkGroup}>
                    <button
                        className={glob.link}
                        type="button"
                        onClick={() => router.push("/login/signup")}
                        disabled={isSubmitting}
                    >
                        Sign Up
                    </button>

                    <button
                        className={glob.link}
                        type="button"
                        onClick={() => router.push("/login/forgot-password")}
                        disabled={isSubmitting}
                    >
                        Forgot Password?
                    </button>
                </div>

                <button
                    className={glob.button}
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
            </form>
        </main>
    );
}