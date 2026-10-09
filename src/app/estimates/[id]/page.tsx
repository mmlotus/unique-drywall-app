"use client";

import EstimateAreasStep from "@/components/Estimates/EstAreasStep";
import LoadingSpinner from "@/components/LoadingSpinner";
import { US_STATES } from "@/lib/constants/states";
import { normalizeEmail } from "@/lib/formatters/email";
import { formatPhone, normalizePhone } from "@/lib/formatters/phone";
import { formatZip } from "@/lib/formatters/stateZip";
import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import est from "@/styles/Estimates.module.css";
import { EstimateContactOption, EstimateDetail, UpdateEstimateBody } from "@/types";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EstimateDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [currentStep, setCurrentStep] = useState(1);

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

                setCurrentStep(
                    new URLSearchParams(window.location.search).get("step") === "2"
                        ? 2
                        : 1
                );

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
            setCurrentStep(2);
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
            <div className={est.builderShell}>
                <div className={est.builderFrame}>
                    <header className={est.builderHeader}>
                        <div className={est.builderHeaderInfo}>
                            <h1 className={est.builderTitle}>
                                {estimate.job_name || "Untitled Estimate"}
                            </h1>

                            <div className={est.builderMetadata}>
                                <span>
                                    {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                                </span>
                                <span>Revision {estimate.current_revision}</span>
                                <span>
                                    Estimate {estimate.estimate_number || "- Assigned Upon Review"}
                                </span>
                            </div>
                        </div>

                        <Link href="/estimates" className={glob.actionButton}>
                            Exit
                        </Link>
                    </header>

                    <nav className={est.stepProgress}>
                        {[
                            "Info",
                            "Rooms",
                            "Measure",
                            "Materials",
                            "Review",
                        ].map((label, index) => (
                            <div
                                key={label}
                                className={`${est.progressStep} ${currentStep === index + 1
                                    ? est.progressActive
                                    : currentStep > index + 1
                                        ? est.progressCompleted
                                        : ""
                                    }`}
                            >
                                <span className={est.progressNumber}>
                                    {index + 1}
                                </span>
                                <span className={est.progressLabel}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </nav>

                    <div className={est.builderBody}>
                        {currentStep === 1 && (
                            <form className={`${glob.form} ${est.builderForm}`} onSubmit={handleSubmit}>
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
                                        {saving ? <Loader size={16} /> : "Save & Next"}
                                    </button>
                                )}
                            </form>
                        )}

                        {currentStep === 2 && (
                            <div className={est.builderStep}>
                                <EstimateAreasStep
                                    estimateId={id}
                                    editable={editable}
                                />

                                <div className={est.stepNavigation}>
                                    <button
                                        type="button"
                                        className={glob.buttonTwo}
                                        onClick={() => setCurrentStep(1)}
                                    >
                                        <ChevronLeft size={16} /> Back
                                    </button>

                                    <button
                                        type="button"
                                        className={glob.button}
                                        onClick={() => setCurrentStep(3)}
                                    >
                                        <ChevronRight size={16} /> Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}