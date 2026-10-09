"use client";

import { US_STATES } from "@/lib/constants/states";
import { normalizeEmail } from "@/lib/formatters/email";
import { formatPhone, normalizePhone } from "@/lib/formatters/phone";
import { formatZip } from "@/lib/formatters/stateZip";
import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import { CreateEstimateBody, emptyEstimateFormData, EstimateContactOption } from "@/types";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function NewEstimatePage() {
    const router = useRouter();

    const [form, setForm] = useState<CreateEstimateBody>(emptyEstimateFormData);
    const [customers, setCustomers] = useState<EstimateContactOption[]>([]);
    const [builders, setBuilders] = useState<EstimateContactOption[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchOptions() {
            const [customersRes, buildersRes] = await Promise.all([
                fetch("/api/customers"),
                fetch("/api/builderfirms"),
            ]);

            const customersData = await customersRes.json();
            const buildersData = await buildersRes.json();

            if (!customersRes.ok) throw new Error(customersData.error || "Failed to load customers.");
            if (!buildersRes.ok) throw new Error(buildersData.error || "Failed to load builders/firms.");

            return {
                customers: customersData as EstimateContactOption[],
                builders: buildersData as EstimateContactOption[],
            };
        }

        fetchOptions()
            .then((data) => {
                if (!cancelled) {
                    setCustomers(data.customers);
                    setBuilders(data.builders);
                }
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load estimate options.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    function updateField(field: keyof CreateEstimateBody, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function updateBuilder(value: string) {
        setForm((current) => ({
            ...current,
            builderFirmId: value,
            primaryContactType:
                !value && current.primaryContactType === "builder"
                    ? "customer" : current.primaryContactType,
        }));
    }

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            setSaving(true);

            const res = await fetch("/api/estimates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create estimate.");

            toast.success("Estimate created!");
            router.push(`/estimates/${data.id}?step=2`);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to create estimate.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>New Estimate</h1>

            <form className={glob.form} onSubmit={handleSubmit}>
                <h2 className={libs.sectionHeading}>Estimate Information</h2>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Job Name</label>
                    <input
                        id="est-job-name"
                        className={glob.input}
                        value={form.jobName ?? ""}
                        onChange={(e) => updateField("jobName", e.target.value)}
                    />
                </div>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Estimate Date</label>
                    <input
                        id="est-date"
                        type="date"
                        className={glob.input}
                        value={form.estimateDate ?? ""}
                        onChange={(e) => updateField("estimateDate", e.target.value)}
                    />
                    <small>Leave blank to use today&apos;s date.</small>
                </div>

                <section className={libs.section}>
                    <h2 className={libs.sectionHeading}>Customer & Builder</h2>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Customer</label>
                        <select
                            id="est-customer"
                            className={glob.input}
                            value={form.customerId ?? ""}
                            onChange={(e) => updateField("customerId", e.target.value)}
                            required
                            disabled={loading || saving}
                        >
                            <option value="">Select Customer</option>
                            {customers.filter((cust) => !cust.is_archived).map((cust) => (
                                <option key={cust.id} value={cust.id}>
                                    {cust.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Builder/Firm</label>
                        <select
                            id="est-builder"
                            className={glob.input}
                            value={form.builderFirmId ?? ""}
                            onChange={(e) => updateBuilder(e.target.value)}
                            disabled={loading || saving}
                        >
                            <option value="">None</option>
                            {builders.filter((b) => !b.is_archived).map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                <section className={libs.section}>
                    <h2 className={libs.sectionHeading}>Primary Contact</h2>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Contact Type</label>
                        <select
                            id="est-contact-type"
                            className={glob.input}
                            value={form.primaryContactType ?? "customer"}
                            onChange={(e) => updateField("primaryContactType", e.target.value)}
                            disabled={saving}
                        >
                            <option value="customer">Customer</option>
                            <option value="builder" disabled={!form.builderFirmId}>Builder/Firm</option>
                            <option value="custom">Different Contact</option>
                        </select>
                    </div>

                    {form.primaryContactType === "custom" && (
                        <>
                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Contact Name</label>
                                <input
                                    id="est-contact-name"
                                    className={glob.input}
                                    value={form.customContactName ?? ""}
                                    onChange={(e) => updateField("customContactName", e.target.value)}
                                    required
                                />
                            </div>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Contact Phone</label>
                                <input
                                    id="est-contact-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    className={glob.input}
                                    value={formatPhone(form.customContactPhone ?? "")}
                                    onChange={(e) => updateField("customContactPhone", normalizePhone(e.target.value))}
                                    maxLength={14}
                                />
                            </div>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Contact Email</label>
                                <input
                                    id="est-contact-email"
                                    type="email"
                                    className={glob.input}
                                    value={form.customContactEmail ?? ""}
                                    onChange={(e) => updateField("customContactEmail", normalizeEmail(e.target.value))}
                                />
                            </div>
                        </>
                    )}
                </section>

                <section className={libs.section}>
                    <h2 className={libs.sectionHeading}>Job Site</h2>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Street Address</label>
                        <input
                            id="est-job-addy"
                            className={glob.input}
                            value={form.jobSiteAddress ?? ""}
                            onChange={(e) => updateField("jobSiteAddress", e.target.value)}
                        />
                    </div>

                    <div className={libs.addressGrid}>
                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>City</label>
                            <input
                                id="est-job-city"
                                className={glob.input}
                                value={form.jobSiteCity ?? ""}
                                onChange={(e) => updateField("jobSiteCity", e.target.value)}
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>State</label>
                            <select
                                id="est-job-state"
                                className={glob.input}
                                value={form.jobSiteState ?? ""}
                                onChange={(e) => updateField("jobSiteState", e.target.value)}
                            >
                                <option value="">Select State</option>
                                {US_STATES.map((state) => (
                                    <option key={state.value} value={state.value}>
                                        {state.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Zip</label>
                            <input
                                id="est-job-zip"
                                className={glob.input}
                                value={form.jobSiteZip ?? ""}
                                onChange={(e) => updateField("jobSiteZip", formatZip(e.target.value))}
                            />
                        </div>
                    </div>
                </section>

                <section className={libs.section}>
                    <h2 className={libs.sectionHeading}>Additional Information</h2>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Notes</label>
                        <textarea
                            id="est-notes"
                            className={glob.input}
                            value={form.notes ?? ""}
                            onChange={(e) => updateField("notes", e.target.value)}
                        />
                    </div>
                </section>

                <button
                    className={glob.button}
                    type="submit"
                    disabled={saving || loading}
                >
                    {saving ? <Loader size={16} /> : "Save & Next"}
                </button>

                <button
                    className={glob.buttonTwo}
                    type="button"
                    onClick={() => router.push("/estimates")}
                    disabled={saving}
                >
                    Cancel
                </button>
            </form>
        </main>
    );
}