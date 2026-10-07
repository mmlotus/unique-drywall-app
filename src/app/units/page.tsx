"use client";

import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArchiveRestore, ArchiveX, Loader, Pencil } from "lucide-react";
import ToggleButton from "@/components/ToggleButton";
import LibrarySection from "@/components/Libraries/LibrarySection";
import LibraryPageLayout from "@/components/Libraries/LibraryPageLayout";
import { useLibraryData } from "@/hooks/useLibraryData";
import LibrarySearch from "@/components/Libraries/LibrarySearch";
import LibraryPagination from "@/components/Libraries/LibraryPagination";
import { Unit, UnitFormData } from "@/types";
import { unitToFormData } from "@/lib/mappers/units";

const emptyform: UnitFormData = {
    name: "",
    abbreviation: "",
};

function getUnitSearchText(unit: Unit): string {
    return [
        unit.name,
        unit.abbreviation,
    ]
        .filter(Boolean)
        .join(" ");
}

export default function UnitsPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [form, setForm] = useState(emptyform);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
    const [updatingUnitId, setUpdatingUnitId] = useState<string | null>(null);
    const [showAllUnits, setShowAllUnits] = useState(false);

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
        records: units,
        searchText: getUnitSearchText,
        filterRecord: (units, query) => {
            if (query) return true;

            return (showAllUnits || !units.is_archived);
        },
        initialPageSize: 10,
    });

    async function fetchUnits(): Promise<Unit[]> {
        const res = await fetch("/api/units");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load units.");
        }

        return data;
    }

    async function loadUnits() {
        try {
            const data = await fetchUnits();
            setUnits(data);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to load units."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        fetchUnits()
            .then((data) => {
                if (!cancelled) {
                    setUnits(data);
                }
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load units.");
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

    function updateField(field: keyof UnitFormData, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function startEditing(u: Unit) {
        setEditingUnitId(u.id);
        setForm(unitToFormData(u));

        window.scrollTo({ top: 0, behavior: "smooth", });
    }

    function cancelEditing() {
        setEditingUnitId(null);
        setForm(emptyform);
    }

    async function toggleArchived(u: Unit) {
        try {
            setUpdatingUnitId(u.id);

            const res = await fetch(`/api/units/${u.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: !u.is_archived }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Failed to ${u.is_archived ? "restore" : "archive"} unit.`);

            toast.success(u.is_archived ? "Unit restored!" : "Unit archived!");

            await loadUnits();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to update unit.");
        } finally {
            setUpdatingUnitId(null);
        }
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);

            const editing = editingUnitId !== null;

            const res = await fetch(
                editing
                    ? `/api/units/${editingUnitId}`
                    : "/api/units",
                {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error ||
                (editing ? "Failed to update unit." : "Failed to create unit.")
            );

            setForm(emptyform);
            setEditingUnitId(null);

            toast.success(editing ? "Unit updated!" : "Unit created!");
            await loadUnits();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to save unit."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>Unit Library</h1>

            <LibraryPageLayout
                editor={
                    <form className={glob.form} onSubmit={handleSubmit}>
                        <h2 className={libs.sectionHeading}>
                            {editingUnitId ? "Edit Unit" : "New Unit"}
                        </h2>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Unit Name</label>
                            <input
                                id="unit-name"
                                className={glob.input}
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                required
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Abbreviation</label>
                            <input
                                id="unit-abbreviation"
                                className={glob.input}
                                value={form.abbreviation}
                                onChange={(e) => updateField("abbreviation", e.target.value)}
                            />
                        </div>

                        <button
                            className={glob.button}
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingUnitId
                                    ? "Save Changes"
                                    : "Add Unit"}
                        </button>

                        {editingUnitId && (
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
                        title={`Units (${totalRecords})`}
                        actions={
                            <ToggleButton
                                active={showAllUnits}
                                onClick={() => {
                                    setShowAllUnits((current) => !current);
                                    setCurrentPage(1);
                                }}
                                activeLabel="View Active Only"
                                inactiveLabel="View All Units"
                            />
                        }
                    >
                        <LibrarySearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search units..."
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
                            <p>Loading units...</p>
                        ) : totalRecords === 0 ? (
                            <p className={libs.emptyState}>
                                {searchQuery
                                    ? "No units match your search."
                                    : "No units yet."
                                }
                            </p>
                        ) : (
                            <>
                                <div className={libs.recordList}>
                                    {paginatedRecords.map((u) => (
                                        <article
                                            key={u.id}
                                            className={`${libs.recordCard} ${u.is_archived ? libs.archivedRecord : ""}`}
                                        >
                                            <div className={libs.recordTitleRow}>
                                                <div className={libs.recordTitleGroup}>
                                                    <h3 className={libs.recordTitle}>{u.name}</h3>

                                                    {u.is_archived && (
                                                        <span className={libs.archivedBadge}>
                                                            Archived
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={glob.iconActions}>
                                                    {!u.is_archived && (
                                                        <button
                                                            className={glob.iconButton}
                                                            type="button"
                                                            aria-label={`Edit ${u.name}`}
                                                            title="Edit Unit"
                                                            onClick={() => startEditing(u)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}

                                                    <button
                                                        className={glob.iconButton}
                                                        type="button"
                                                        title={u.is_archived ? "Restore Unit" : "Archive Unit"}
                                                        disabled={updatingUnitId === u.id}
                                                        onClick={() => void toggleArchived(u)}
                                                    >
                                                        {updatingUnitId === u.id
                                                            ? <Loader size={16} />
                                                            : u.is_archived
                                                                ? <ArchiveRestore size={16} />
                                                                : <ArchiveX size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={libs.recordDetails}>
                                                {u.abbreviation && (
                                                    <span>{u.abbreviation}</span>
                                                )}
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