"use client";

import { authClient } from "@/lib/auth-client";
import glob from "@/styles/Global.module.css";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        setIsSubmitting(true);

        try {
            const res = await authClient.signUp.email({
                name, email, password,
            });

            if (res.error) {
                console.error("Signup failed:", res.error);
                toast.error(res.error.message || "Unable to create account.");
                return;
            }

            toast.success("Account created successfully.");

            router.push("/");
            router.refresh();
        } catch (err) {
            console.error("Signup error:", err);
            toast.error("Unable to create account.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className={glob.container}>
            <form className={glob.form} onSubmit={handleSubmit}>
                <h1 className={glob.heading}>Create Account</h1>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Name</label>
                    <input
                        className={glob.input}
                        id="name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                </div>

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

                <button
                    className={glob.link}
                    type="button"
                    onClick={() => router.push("/login")}
                >
                    Already have an account?
                </button>

                <button
                    className={glob.button}
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
            </form>
        </main>
    );
}