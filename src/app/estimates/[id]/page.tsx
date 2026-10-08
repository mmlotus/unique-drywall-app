"use client";

import LibrarySection from "@/components/Libraries/LibrarySection";
import LoadingSpinner from "@/components/LoadingSpinner";
import { US_STATES } from "@/lib/constants/states";
import { normalizeEmail } from "@/lib/formatters/email";
import { formatPhone, normalizePhone } from "@/lib/formatters/phone";
import { formatZip } from "@/lib/formatters/stateZip";
import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import { EstimateContactOption, EstimateDetail, UpdateEstimateBody } from "@/types";
import { Loader } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EstimateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
    const [form, setForm] = useState<UpdateEstimateBody>({});

    const [customers, setCustomers] = useState<EstimateContactOption[]>([]);
    const [builders, setBuilders] = useState<EstimateContactOption[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchEstimateData() {
            const [estimateRes, customersRes, buildersRes] = await Promise.all([
                fetch(`/api/estimates/${id}`),
                fetch("/api/customers"),
                fetch("/api/builderfirms"),
            ]);

            const estimateData = await estimateRes.json();
            const customersData = await customersRes.json();
            const buildersData = await buildersRes.json();

            if (!estimateRes.ok) {
                throw new Error(estimateData.error || "Failed to load estimate.");
            }

            if (!customersRes.ok) {
                throw new Error(customersData.error || "Failed to load customers.");
            }

            if (!buildersRes.ok) {
                throw new Error(buildersData.error || "Failed to load builders/firms.");
            }

            return {
                estimate: estimateData as EstimateDetail,
                customers: customersData as EstimateContactOption[],
                builders: buildersData as EstimateContactOption[],
            };
        }

        fetchEstimateData()
            .then((data) => {
                if (cancelled) return;

                setEstimate(data.estimate);
                setCustomers(data.customers);
                setBuilders(data.builders);

                setForm({
                    customerId: data.estimate.customer_id,
                    builderFirmId: data.estimate.builder_firm_id ?? "",
                    estimateDate: data.estimate.estimate_date.slice(0, 10),
                    jobName: data.estimate.job_name ?? "",
                    jobSiteAddress: data.estimate.job_site_address ?? "",
                    jobSiteCity: data.estimate.job_site_city ?? "",
                    jobSiteState: data.estimate.job_site_state ?? "",
                    jobSiteZip: data.estimate.job_site_zip ?? "",
                    primaryContactType: data.estimate.primary_contact_type,
                    customContactName: data.estimate.custom_contact_name ?? "",
                    customContactPhone: data.estimate.custom_contact_phone ?? "",
                    customContactEmail: data.estimate.custom_contact_email ?? "",
                    notes: data.estimate.notes ?? "",
                });
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(
                        err instanceof Error
                            ? err.message
                            : "Failed to load estimate."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    function updateField(field: keyof UpdateEstimateBody, value: string) {
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
                    ? "customer"
                    : current.primaryContactType,
        }));
    }

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!estimate || estimate.status !== "draft") return;

        try {
            setSaving(true);

            const res = await fetch(`/api/estimates/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to save estimate.");

            setEstimate(data as EstimateDetail);
            toast.success("Estimate updated!");
            router.push("/estimates");
        } catch (err) {
            console.error(err);
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to save estimate."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <LoadingSpinner />;

    if (!estimate) {
        return (
            <main className={glob.container}>
                <p>Estimate not found or could not be loaded.</p>
                <Link href="/estimates" className={glob.actionButton}>
                    Back to Estimates
                </Link>
            </main>
        );
    }

    const editable = estimate.status === "draft";

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>
                {estimate.job_name || "Untitled Estimate"}
            </h1>

            <LibrarySection
                title="Estimate Information"
                actions={
                    <Link href="/estimates" className={glob.actionButton}>
                        Back to Estimates
                    </Link>
                }
            >
                <div className={libs.recordDetails}>
                    <span>
                        <strong>Estimate:</strong>{" "}
                        {estimate.estimate_number || "Not Assigned"}
                    </span>

                    <span>
                        <strong>Revision:</strong>{" "}
                        {estimate.current_revision}
                    </span>

                    <span>
                        <strong>Status:</strong>{" "}
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                    </span>
                </div>
            </LibrarySection>

            <form className={glob.form} onSubmit={handleSubmit}>
                <h2 className={libs.sectionHeading}>Estimate Information</h2>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Job Name</label>
                    <input
                        id="est-job-name"
                        className={glob.input}
                        value={form.jobName ?? ""}
                        onChange={(e) => updateField("jobName", e.target.value)}
                        disabled={!editable || saving}
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
                        required
                        disabled={!editable || saving}
                    />
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
                            disabled={!editable || saving}
                        >
                            <option value="">Select Customer</option>
                            {customers.filter((cust) => !cust.is_archived || cust.id === form.customerId).map((cust) => (
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
                            disabled={!editable || saving}
                        >
                            <option value="">None</option>
                            {builders.filter((b) => !b.is_archived || b.id === form.builderFirmId).map((b) => (
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
                            disabled={!editable || saving}
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
                                    disabled={!editable || saving}
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
                                    disabled={!editable || saving}
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
                                    disabled={!editable || saving}
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
                            disabled={!editable || saving}
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
                                disabled={!editable || saving}
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>State</label>
                            <select
                                id="est-job-state"
                                className={glob.input}
                                value={form.jobSiteState ?? ""}
                                onChange={(e) => updateField("jobSiteState", e.target.value)}
                                disabled={!editable || saving}
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
                                disabled={!editable || saving}
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
                            disabled={!editable || saving}
                        />
                    </div>
                </section>

                {editable && (
                    <button
                        className={glob.button}
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? <Loader size={16} /> : "Save Changes"}
                    </button>
                )}

                <button
                    className={glob.buttonTwo}
                    type="button"
                    onClick={() => router.push("/estimates")}
                    disabled={saving}
                >
                    Back to Estimates
                </button>
            </form>
        </main>
    );
}