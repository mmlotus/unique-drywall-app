"use client";

import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatPhone, normalizePhone } from "@/lib/formatters/phone";
import { normalizeEmail } from "@/lib/formatters/email";
import { US_STATES } from "@/lib/constants/states";
import { formatZip } from "@/lib/formatters/stateZip";
import { ArchiveRestore, ArchiveX, Loader, Pencil } from "lucide-react";
import ToggleButton from "@/components/ToggleButton";
import LibrarySection from "@/components/Libraries/LibrarySection";
import LibraryPageLayout from "@/components/Libraries/LibraryPageLayout";
import { useLibraryData } from "@/hooks/useLibraryData";
import LibrarySearch from "@/components/Libraries/LibrarySearch";
import LibraryPagination from "@/components/Libraries/LibraryPagination";
import { BuilderFirm, BuilderFirmFormData } from "@/types/builders";
import { builderFirmToFormData } from "@/lib/mappers/builders";

const emptyform: BuilderFirmFormData = {
    name: "",
    defaultContactName: "",
    phone: "",
    phone2: "",
    email: "",
    website: "",

    officeAddressLine1: "",
    officeAddressLine2: "",
    officeCity: "",
    officeState: "",
    officeZip: "",

    notes: "",
};

function getBuilderSearchText(builder: BuilderFirm): string {
    return [
        builder.name,
        builder.default_contact_name,
        builder.phone,
        formatPhone(builder.phone),
        builder.phone2,
        formatPhone(builder.phone2),
        builder.email,
        builder.website,

        builder.office_address_line1,
        builder.office_address_line2,
        builder.office_city,
        builder.office_state,
        builder.office_zip,

        builder.notes,
    ]
        .filter(Boolean)
        .join(" ");
}

export default function BuilderFirmsPage() {
    const [builders, setBuilders] = useState<BuilderFirm[]>([]);
    const [form, setForm] = useState(emptyform);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingBuilderId, setEditingBuilderId] = useState<string | null>(null);
    const [updatingBuilderId, setUpdatingBuilderId] = useState<string | null>(null);
    const [showAllBuilders, setShowAllBuilders] = useState(false);

    const {
        searchQuery,
        setSearchQuery,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedRecords,
        totalPages,
        totalRecords,
    } = useLibraryData({
        records: builders,
        searchText: getBuilderSearchText,
        filterRecord: (builders, query) => {
            if (query) return true;

            return (showAllBuilders || !builders.is_archived);
        },
        initialPageSize: 10,
    });

    async function fetchBuilders(): Promise<BuilderFirm[]> {
        const res = await fetch("/api/builderfirms");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load builders/firms.");
        }

        return data;
    }

    async function loadBuilders() {
        try {
            const data = await fetchBuilders();
            setBuilders(data);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to load builders/firms."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        fetchBuilders()
            .then((data) => {
                if (!cancelled) {
                    setBuilders(data);
                }
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load builders/firms.");
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

    function updateField(field: keyof BuilderFirmFormData, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function startEditing(builder: BuilderFirm) {
        setEditingBuilderId(builder.id);
        setForm(builderFirmToFormData(builder));

        window.scrollTo({ top: 0, behavior: "smooth", });
    }

    function cancelEditing() {
        setEditingBuilderId(null);
        setForm(emptyform);
    }

    async function toggleArchived(builder: BuilderFirm) {
        try {
            setUpdatingBuilderId(builder.id);

            const res = await fetch(`/api/builderfirms/${builder.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: !builder.is_archived }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Failed to ${builder.is_archived ? "restore" : "archive"} builder/firm.`);

            toast.success(builder.is_archived ? "Builder restored!" : "Builder archived!");

            await loadBuilders();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to update builder/firm.");
        } finally {
            setUpdatingBuilderId(null);
        }
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);

            const editing = editingBuilderId !== null;

            const res = await fetch(
                editing
                    ? `/api/builderfirms/${editingBuilderId}`
                    : "/api/builderfirms",
                {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error ||
                (editing ? "Failed to update builder/firm." : "Failed to create builder/firm.")
            );

            setForm(emptyform);
            setEditingBuilderId(null);

            toast.success(editing ? "Builder updated!" : "Builder created!");
            await loadBuilders();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to save builder/firm."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>Builder/Firm Library</h1>

            <LibraryPageLayout
                editor={
                    <form className={glob.form} onSubmit={handleSubmit}>
                        <h2 className={libs.sectionHeading}>
                            {editingBuilderId ? "Edit Builder/Firm" : "New Builder/Firm"}
                        </h2>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Builder/Firm Name</label>
                            <input
                                id="builder-name"
                                className={glob.input}
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                required
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Phone</label>
                            <input
                                id="builder-phone"
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
                                id="builder-email"
                                className={glob.input}
                                type="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={(e) => updateField("email", normalizeEmail(e.target.value))}
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Website</label>
                            <input
                                id="builder-website"
                                className={glob.input}
                                type="text"
                                autoComplete="url"
                                value={form.website}
                                onChange={(e) => updateField("website", e.target.value)}
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Default Contact Name</label>
                            <input
                                id="default-contact-name"
                                className={glob.input}
                                value={form.defaultContactName}
                                onChange={(e) => updateField("defaultContactName", e.target.value)}
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Contact Phone (optional)</label>
                            <input
                                id="builder-phone2"
                                className={glob.input}
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                value={formatPhone(form.phone2)}
                                onChange={(e) => updateField("phone2", normalizePhone(e.target.value))}
                                maxLength={14}
                            />
                        </div>

                        <section className={libs.section}>
                            <h2 className={libs.sectionHeading}>Office Address</h2>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Address Line 1</label>
                                <input
                                    id="office-address-1"
                                    className={glob.input}
                                    value={form.officeAddressLine1}
                                    onChange={(e) => updateField("officeAddressLine1", e.target.value)}
                                />
                            </div>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Address Line 2</label>
                                <input
                                    id="office-address-2"
                                    className={glob.input}
                                    value={form.officeAddressLine2}
                                    onChange={(e) => updateField("officeAddressLine2", e.target.value)}
                                />
                            </div>

                            <div className={libs.addressGrid}>
                                <div className={glob.fieldGroup}>
                                    <label className={glob.label}>City</label>
                                    <input
                                        id="office-city"
                                        className={glob.input}
                                        value={form.officeCity}
                                        onChange={(e) => updateField("officeCity", e.target.value)}
                                    />
                                </div>

                                <div className={glob.fieldGroup}>
                                    <label className={glob.label}>State</label>
                                    <select
                                        id="office-state"
                                        className={glob.input}
                                        value={form.officeState}
                                        onChange={(e) => updateField("officeState", e.target.value)}
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
                                        id="office-zip"
                                        className={glob.input}
                                        value={form.officeZip}
                                        onChange={(e) => updateField("officeZip", formatZip(e.target.value))}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Notes</label>
                            <textarea
                                id="builder-notes"
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
                                : editingBuilderId
                                    ? "Save Changes"
                                    : "Add Builder/Firm"}
                        </button>

                        {editingBuilderId && (
                            <button
                                className={glob.buttonTwo}
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
                        title={`Builders/Firms (${totalRecords})`}
                        actions={
                            <ToggleButton
                                active={showAllBuilders}
                                onClick={() => {
                                    setShowAllBuilders((current) => !current);
                                    setCurrentPage(1);
                                }}
                                activeLabel="View Active Only"
                                inactiveLabel="View All Builders/Firms"
                            />
                        }
                    >
                        <LibrarySearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search builders..."
                        />

                        <LibraryPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalRecords={totalRecords}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                        />

                        {loading ? (
                            <p>Loading builders/firms...</p>
                        ) : totalRecords === 0 ? (
                            <p className={libs.emptyState}>
                                {searchQuery
                                    ? "No builders or firms match your search."
                                    : "No builders or firms yet."
                                }
                            </p>
                        ) : (
                            <>
                                <div className={libs.recordList}>
                                    {paginatedRecords.map((builder) => (
                                        <article
                                            key={builder.id}
                                            className={`${libs.recordCard} ${builder.is_archived ? libs.archivedRecord : ""}`}
                                        >
                                            <div className={libs.recordTitleRow}>
                                                <div className={libs.recordTitleGroup}>
                                                    <h3 className={libs.recordTitle}>{builder.name}</h3>

                                                    {builder.is_archived && (
                                                        <span className={libs.archivedBadge}>
                                                            Archived
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className={glob.iconActions}>
                                                    {!builder.is_archived && (
                                                        <button
                                                            className={glob.iconButton}
                                                            type="button"
                                                            aria-label={`Edit ${builder.name}`}
                                                            title="Edit Builder/Firm"
                                                            onClick={() => startEditing(builder)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}

                                                    <button
                                                        className={glob.iconButton}
                                                        type="button"
                                                        title={builder.is_archived ? "Restore Builder" : "Archive Builder"}
                                                        disabled={updatingBuilderId === builder.id}
                                                        onClick={() => void toggleArchived(builder)}
                                                    >
                                                        {updatingBuilderId === builder.id
                                                            ? <Loader size={16} />
                                                            : builder.is_archived
                                                                ? <ArchiveRestore size={16} />
                                                                : <ArchiveX size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={libs.recordDetails}>
                                                {builder.phone && (
                                                    <span>{formatPhone(builder.phone)}</span>
                                                )}

                                                {builder.email && (
                                                    <span>{builder.email}</span>
                                                )}

                                                {builder.website && (
                                                    <span>{builder.website}</span>
                                                )}

                                                {builder.default_contact_name && (
                                                    <span>{builder.default_contact_name}</span>
                                                )}

                                                {builder.phone2 && (
                                                    <span>{formatPhone(builder.phone2)}</span>
                                                )}

                                                <div className={libs.recordAddress}>
                                                    <div>
                                                        {builder.office_address_line1}
                                                    </div>

                                                    {builder.office_address_line2 && (
                                                        <div>
                                                            {builder.office_address_line2}
                                                        </div>
                                                    )}

                                                    <div>
                                                        {(builder.office_city ||
                                                            builder.office_state ||
                                                            builder.office_zip) && (
                                                                <div>
                                                                    {[
                                                                        builder.office_city,
                                                                        builder.office_state,
                                                                        builder.office_zip,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(", ")
                                                                    }
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <LibraryPagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalRecords={totalRecords}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                />
                            </>
                        )}
                    </LibrarySection>
                }
            />
        </main>
    );
}