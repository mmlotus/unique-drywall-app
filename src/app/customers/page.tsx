"use client";

import glob from "@/styles/Global.module.css";
import cust from "@/styles/Customers.module.css";
import { Customer, CustomerFormData } from "@/types/customer";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatPhone, normalizePhone } from "@/lib/formatters/phone";
import { normalizeEmail } from "@/lib/formatters/email";
import { US_STATES } from "@/lib/constants/states";
import { formatZip } from "@/lib/formatters/stateZip";

const emptyform: CustomerFormData = {
    name: "",
    phone: "",
    email: "",

    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingState: "",
    billingZip: "",

    jobAddressLine1: "",
    jobAddressLine2: "",
    jobCity: "",
    jobState: "",
    jobZip: "",

    notes: "",
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [form, setForm] = useState(emptyform);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    async function fetchCustomers(): Promise<Customer[]> {
        const res = await fetch("/api/customers");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load customers.");
        }

        return data;
    }

    async function loadCustomers() {
        try {
            const data = await fetchCustomers();
            setCustomers(data);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to load customers."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        fetchCustomers()
            .then((data) => {
                if (!cancelled) {
                    setCustomers(data);
                }
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load customers.");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    function updateField(field: keyof CustomerFormData, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function copyBillingToJobSite() {
        setForm((current) => ({
            ...current,
            jobAddressLine1: current.billingAddressLine1,
            jobAddressLine2: current.billingAddressLine2,
            jobCity: current.billingCity,
            jobState: current.billingState,
            jobZip: current.billingZip,
        }));
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);

            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create customer.");

            setForm(emptyform);
            toast.success("Customer created!");
            await loadCustomers();
        } catch (err) {
            toast.error(err instanceof Error
                ? err.message : "Failed to create customer."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>Customer Library</h1>

            <form className={glob.form} onSubmit={handleSubmit}>
                <h2 className={cust.sectionHeading}>New Customer</h2>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Customer Name</label>
                    <input
                        id="customer-name"
                        className={glob.input}
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        required
                    />
                </div>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Phone</label>
                    <input
                        id="customer-phone"
                        className={glob.input}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={formatPhone(form.phone)}
                        onChange={(e) => updateField("phone", normalizePhone(e.target.value))}
                        maxLength={14}
                    />
                </div>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Email</label>
                    <input
                        id="customer-email"
                        className={glob.input}
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => updateField("email", normalizeEmail(e.target.value))}
                    />
                </div>

                <section className={cust.section}>
                    <h2 className={cust.sectionHeading}>Billing Address</h2>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Address Line 1</label>
                        <input
                            id="billing-address-1"
                            className={glob.input}
                            value={form.billingAddressLine1}
                            onChange={(e) => updateField("billingAddressLine1", e.target.value)}
                            required
                        />
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Address Line 2</label>
                        <input
                            id="billing-address-2"
                            className={glob.input}
                            value={form.billingAddressLine2}
                            onChange={(e) => updateField("billingAddressLine2", e.target.value)}
                        />
                    </div>

                    <div className={cust.addressGrid}>
                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>City</label>
                            <input
                                id="billing-city"
                                className={glob.input}
                                value={form.billingCity}
                                onChange={(e) => updateField("billingCity", e.target.value)}
                                required
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>State</label>
                            <select
                                id="billing-state"
                                className={glob.input}
                                value={form.billingState}
                                onChange={(e) => updateField("billingState", e.target.value)}
                                required
                            >
                                <option value="">Select state</option>

                                {US_STATES.map((state) => (
                                    <option key={state.value} value={state.value}>{state.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Zip</label>
                            <input
                                id="billing-zip"
                                className={glob.input}
                                value={form.billingZip}
                                onChange={(e) => updateField("billingZip", formatZip(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                </section>

                <section className={cust.section}>
                    <h2 className={cust.sectionHeading}>Default Job Site</h2>

                    <div className={cust.copyButtonRow}>
                        <button
                            className={glob.button}
                            type="button"
                            onClick={copyBillingToJobSite}
                        >
                            Same as Billing
                        </button>
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Address Line 1</label>
                        <input
                            id="job-address-1"
                            className={glob.input}
                            value={form.jobAddressLine1}
                            onChange={(e) => updateField("jobAddressLine1", e.target.value)}
                            required
                        />
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Address Line 2</label>
                        <input
                            id="job-address-2"
                            className={glob.input}
                            value={form.jobAddressLine2}
                            onChange={(e) => updateField("jobAddressLine2", e.target.value)}
                        />
                    </div>

                    <div className={cust.addressGrid}>
                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>City</label>
                            <input
                                id="job-city"
                                className={glob.input}
                                value={form.jobCity}
                                onChange={(e) => updateField("jobCity", e.target.value)}
                                required
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>State</label>
                            <select
                                id="job-state"
                                className={glob.input}
                                value={form.jobState}
                                onChange={(e) => updateField("jobState", e.target.value)}
                                required
                            >
                                <option value="">Select state</option>

                                {US_STATES.map((state) => (
                                    <option key={state.value} value={state.value}>{state.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Zip</label>
                            <input
                                id="job-zip"
                                className={glob.input}
                                value={form.jobZip}
                                onChange={(e) => updateField("jobZip", formatZip(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                </section>

                <div className={glob.fieldGroup}>
                    <label className={glob.label}>Notes</label>
                    <textarea
                        id="customer-notes"
                        className={glob.input}
                        value={form.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                    />
                </div>

                <button
                    className={glob.button}
                    type="submit"
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Add Customer"}
                </button>
            </form>

            <section className={cust.section}>
                <h2 className={cust.sectionHeading}>Customers</h2>

                {loading ? (
                    <p>Loading customers...</p>
                ) : customers.length === 0 ? (
                    <p className={cust.emptyState}>
                        No customers yet.
                    </p>
                ) : (
                    <div className={cust.customerList}>
                        {customers.map((customer) => (
                            <article key={customer.id} className={cust.customerCard}>
                                <h3 className={cust.customerName}>{customer.name}</h3>
                                <div className={cust.customerDetails}>
                                    {customer.phone && (
                                        <span>{formatPhone(customer.phone)}</span>
                                    )}

                                    {customer.email && (
                                        <span>{customer.email}</span>
                                    )}

                                    <div className={cust.customerAddress}>
                                        <div>
                                            {customer.job_address_line1}
                                        </div>

                                        {customer.job_address_line2 && (
                                            <div>
                                                {customer.job_address_line2}
                                            </div>
                                        )}

                                        <div>
                                            {customer.job_city},{" "}
                                            {customer.job_state},{" "}
                                            {customer.job_zip}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}