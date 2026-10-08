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
import { Area, AreaFormData, emptyAreaFormData } from "@/types/areas";
import { areaToFormData } from "@/lib/mappers/areas";

function getAreaSearchText(area: Area): string {
    return [
        area.name,
        area.notes,
    ]
        .filter(Boolean)
        .join(" ");
}

export default function AreasRoomsPage() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [form, setForm] = useState(emptyAreaFormData);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
    const [updatingAreaId, setUpdatingAreaId] = useState<string | null>(null);
    const [showAllAreas, setShowAllAreas] = useState(false);

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
        records: areas,
        searchText: getAreaSearchText,
        filterRecord: (areas, query) => {
            if (query) return true;

            return (showAllAreas || !areas.is_archived);
        },
        initialPageSize: 10,
    });

    async function fetchAreas(): Promise<Area[]> {
        const res = await fetch("/api/areas");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load areas/rooms.");
        }

        return data;
    }

    async function loadAreas() {
        try {
            const data = await fetchAreas();
            setAreas(data);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to load areas/rooms."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        fetchAreas()
            .then((data) => {
                if (!cancelled) {
                    setAreas(data);
                }
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load areas/rooms.");
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

    function updateField(field: keyof AreaFormData, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function startEditing(a: Area) {
        setEditingAreaId(a.id);
        setForm(areaToFormData(a));

        window.scrollTo({ top: 0, behavior: "smooth", });
    }

    function cancelEditing() {
        setEditingAreaId(null);
        setForm(emptyAreaFormData);
    }

    async function toggleArchived(a: Area) {
        try {
            setUpdatingAreaId(a.id);

            const res = await fetch(`/api/areas/${a.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: !a.is_archived }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Failed to ${a.is_archived ? "restore" : "archive"} area/room.`);

            toast.success(a.is_archived ? "Area/Room restored!" : "Area/Room archived!");

            await loadAreas();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to update area/room.");
        } finally {
            setUpdatingAreaId(null);
        }
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);

            const editing = editingAreaId !== null;

            const res = await fetch(
                editing
                    ? `/api/areas/${editingAreaId}`
                    : "/api/areas",
                {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error ||
                (editing ? "Failed to update area/room." : "Failed to create area/room.")
            );

            setForm(emptyAreaFormData);
            setEditingAreaId(null);

            toast.success(editing ? "Area/Room updated!" : "Area/Room created!");
            await loadAreas();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to save area/room."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>Area/Room Library</h1>

            <LibraryPageLayout
                editor={
                    <form className={glob.form} onSubmit={handleSubmit}>
                        <h2 className={libs.sectionHeading}>
                            {editingAreaId ? "Edit Area/Room" : "New Area/Room"}
                        </h2>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Area/Room Name</label>
                            <input
                                id="area-name"
                                className={glob.input}
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                required
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Notes</label>
                            <textarea
                                id="area-notes"
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
                                : editingAreaId
                                    ? "Save Changes"
                                    : "Add Area/Room"}
                        </button>

                        {editingAreaId && (
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
                        title={`Areas/Rooms (${totalRecords})`}
                        actions={
                            <ToggleButton
                                active={showAllAreas}
                                onClick={() => {
                                    setShowAllAreas((current) => !current);
                                    setCurrentPage(1);
                                }}
                                activeLabel="View Active Only"
                                inactiveLabel="View All Areas/Rooms"
                            />
                        }
                    >
                        <LibrarySearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search rooms..."
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
                            <p>Loading rooms...</p>
                        ) : totalRecords === 0 ? (
                            <p className={libs.emptyState}>
                                {searchQuery
                                    ? "No areas or rooms match your search."
                                    : "No areas or rooms yet."
                                }
                            </p>
                        ) : (
                            <>
                                <div className={libs.recordList}>
                                    {paginatedRecords.map((a) => (
                                        <article
                                            key={a.id}
                                            className={`${libs.recordCard} ${a.is_archived ? libs.archivedRecord : ""}`}
                                        >
                                            <div className={libs.recordTitleRow}>
                                                <div className={libs.recordTitleGroup}>
                                                    <h3 className={libs.recordTitle}>{a.name}</h3>

                                                    {a.is_archived && (
                                                        <span className={libs.archivedBadge}>
                                                            Archived
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={glob.iconActions}>
                                                    {!a.is_archived && (
                                                        <button
                                                            className={glob.iconButton}
                                                            type="button"
                                                            aria-label={`Edit ${a.name}`}
                                                            title="Edit Area/Room"
                                                            onClick={() => startEditing(a)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}

                                                    <button
                                                        className={glob.iconButton}
                                                        type="button"
                                                        title={a.is_archived ? "Restore Area/Room" : "Archive Area/Room"}
                                                        disabled={updatingAreaId === a.id}
                                                        onClick={() => void toggleArchived(a)}
                                                    >
                                                        {updatingAreaId === a.id
                                                            ? <Loader size={16} />
                                                            : a.is_archived
                                                                ? <ArchiveRestore size={16} />
                                                                : <ArchiveX size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={libs.recordDetails}>
                                                {a.notes && (
                                                    <span>{a.notes}</span>
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