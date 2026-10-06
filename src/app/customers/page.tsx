"use client";

import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import { Customer, CustomerFormData } from "@/types/customer";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatPhone, normalizePhone } from "@/lib/formatters/phone";
import { normalizeEmail } from "@/lib/formatters/email";
import { US_STATES } from "@/lib/constants/states";
import { formatZip } from "@/lib/formatters/stateZip";
import { customerToFormData } from "@/lib/mappers/customer";
import { ArchiveRestore, ArchiveX, Loader, Pencil } from "lucide-react";
import ToggleButton from "@/components/ToggleButton";
import LibrarySection from "@/components/Libraries/LibrarySection";
import LibraryPageLayout from "@/components/Libraries/LibraryPageLayout";

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

    const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
    const [updatingCustomerId, setUpdatingCustomerId] = useState<string | null>(null);
    const [showAllCustomers, setShowAllCustomers] = useState(false);

    const visibleCustomers = showAllCustomers
        ? customers
        : customers.filter((customer) => !customer.is_archived);

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

    function startEditing(customer: Customer) {
        setEditingCustomerId(customer.id);
        setForm(customerToFormData(customer));

        window.scrollTo({ top: 0, behavior: "smooth", });
    }

    function cancelEditing() {
        setEditingCustomerId(null);
        setForm(emptyform);
    }

    async function toggleArchived(customer: Customer) {
        try {
            setUpdatingCustomerId(customer.id);

            const res = await fetch(`/api/customers/${customer.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: !customer.is_archived }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Failed to ${customer.is_archived ? "restore" : "archive"} customer.`);

            toast.success(customer.is_archived ? "Customer restored!" : "Customer archived!");

            await loadCustomers();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to update customer.");
        } finally {
            setUpdatingCustomerId(null);
        }
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);

            const editing = editingCustomerId !== null;

            const res = await fetch(
                editing
                    ? `/api/customers/${editingCustomerId}`
                    : "/api/customers",
                {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error ||
                (editing ? "Failed to update customer." : "Failed to create customer.")
            );

            setForm(emptyform);
            setEditingCustomerId(null);

            toast.success(editing ? "Customer updated!" : "Customer created!");
            await loadCustomers();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to save customer."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>Customer Library</h1>

            <LibraryPageLayout
                editor={
                    <form className={glob.form} onSubmit={handleSubmit}>
                        <h2 className={libs.sectionHeading}>
                            {editingCustomerId ? "Edit Customer" : "New Customer"}
                        </h2>

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

                        <section className={libs.section}>
                            <h2 className={libs.sectionHeading}>Billing Address</h2>

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

                            <div className={libs.addressGrid}>
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

                        <section className={libs.section}>
                            <h2 className={libs.sectionHeading}>Default Job Site</h2>

                            <div className={libs.copyButtonRow}>
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

                            <div className={libs.addressGrid}>
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
                            {saving
                                ? "Saving..."
                                : editingCustomerId
                                    ? "Save Changes"
                                    : "Add Customer"}
                        </button>

                        {editingCustomerId && (
                            <button
                                className={glob.button}
                                type="button"
                                onClick={cancelEditing}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        )}
                    </form>
                }

                library={
                    <LibrarySection
                        title="Customers"
                        actions={
                            <ToggleButton
                                active={showAllCustomers}
                                onClick={() => setShowAllCustomers((current) => !current)}
                                activeLabel="View Active Only"
                                inactiveLabel="View All Customers"
                            />
                        }
                    >
                        {loading ? (
                            <p>Loading customers...</p>
                        ) : visibleCustomers.length === 0 ? (
                            <p className={libs.emptyState}>
                                No customers yet.
                            </p>
                        ) : (
                            <div className={libs.recordList}>
                                {visibleCustomers.map((customer) => (
                                    <article
                                        key={customer.id}
                                        className={`${libs.recordCard} ${customer.is_archived ? libs.archivedRecord : ""}`}
                                    >
                                        <div className={libs.recordTitleRow}>
                                            <h3 className={libs.recordTitle}>{customer.name}</h3>

                                            {customer.is_archived && (
                                                <span className={libs.archivedBadge}>
                                                    Archived
                                                </span>
                                            )}
                                        </div>

                                        <div className={libs.recordDetails}>
                                            {customer.phone && (
                                                <span>{formatPhone(customer.phone)}</span>
                                            )}

                                            {customer.email && (
                                                <span>{customer.email}</span>
                                            )}

                                            <div className={libs.recordAddress}>
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

                                            <div className={glob.iconActions}>
                                                {!customer.is_archived && (
                                                    <button
                                                        className={glob.iconButton}
                                                        type="button"
                                                        aria-label={`Edit ${customer.name}`}
                                                        title="Edit Customer"
                                                        onClick={() => startEditing(customer)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    className={glob.iconButton}
                                                    type="button"
                                                    title={customer.is_archived ? "Restore Customer" : "Archive Customer"}
                                                    disabled={updatingCustomerId === customer.id}
                                                    onClick={() => void toggleArchived(customer)}
                                                >
                                                    {updatingCustomerId === customer.id
                                                        ? <Loader size={16} />
                                                        : customer.is_archived
                                                            ? <ArchiveRestore size={16} />
                                                            : <ArchiveX size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </LibrarySection>
                }
            />
        </main>
    );
}