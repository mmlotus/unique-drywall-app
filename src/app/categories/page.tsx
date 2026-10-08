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
import { Category, CategoryFormData } from "@/types/categories";
import { categoryToFormData } from "@/lib/mappers/categories";

const emptyform: CategoryFormData = {
    name: "",
    notes: "",
};

function getCategorySearchText(cat: Category): string {
    return [
        cat.name,
        cat.notes,
    ]
        .filter(Boolean)
        .join(" ");
}

export default function CategoriesPage() {
    const [cats, setCats] = useState<Category[]>([]);
    const [form, setForm] = useState(emptyform);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [updatingCatId, setUpdatingCatId] = useState<string | null>(null);
    const [showAllCats, setShowAllCats] = useState(false);

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
        records: cats,
        searchText: getCategorySearchText,
        filterRecord: (cats, query) => {
            if (query) return true;

            return (showAllCats || !cats.is_archived);
        },
        initialPageSize: 10,
    });

    async function fetchCategories(): Promise<Category[]> {
        const res = await fetch("/api/categories");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load categories.");
        }

        return data;
    }

    async function loadCategories() {
        try {
            const data = await fetchCategories();
            setCats(data);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to load categories."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        fetchCategories()
            .then((data) => {
                if (!cancelled) {
                    setCats(data);
                }
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load categories.");
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

    function updateField(field: keyof CategoryFormData, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function startEditing(cat: Category) {
        setEditingCatId(cat.id);
        setForm(categoryToFormData(cat));

        window.scrollTo({ top: 0, behavior: "smooth", });
    }

    function cancelEditing() {
        setEditingCatId(null);
        setForm(emptyform);
    }

    async function toggleArchived(cat: Category) {
        try {
            setUpdatingCatId(cat.id);

            const res = await fetch(`/api/categories/${cat.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: !cat.is_archived }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Failed to ${cat.is_archived ? "restore" : "archive"} category.`);

            toast.success(cat.is_archived ? "Category restored!" : "Category archived!");

            await loadCategories();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to update category.");
        } finally {
            setUpdatingCatId(null);
        }
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);

            const editing = editingCatId !== null;

            const res = await fetch(
                editing
                    ? `/api/categories/${editingCatId}`
                    : "/api/categories",
                {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error ||
                (editing ? "Failed to update category." : "Failed to create category.")
            );

            setForm(emptyform);
            setEditingCatId(null);

            toast.success(editing ? "Category updated!" : "Category created!");
            await loadCategories();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to save category."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>Category Library</h1>

            <LibraryPageLayout
                editor={
                    <form className={glob.form} onSubmit={handleSubmit}>
                        <h2 className={libs.sectionHeading}>
                            {editingCatId ? "Edit Category" : "New Category"}
                        </h2>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Category Name</label>
                            <input
                                id="cat-name"
                                className={glob.input}
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                required
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Notes</label>
                            <textarea
                                id="cat-notes"
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
                                : editingCatId
                                    ? "Save Changes"
                                    : "Add Category"}
                        </button>

                        {editingCatId && (
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
                        title={`Categories (${totalRecords})`}
                        actions={
                            <ToggleButton
                                active={showAllCats}
                                onClick={() => {
                                    setShowAllCats((current) => !current);
                                    setCurrentPage(1);
                                }}
                                activeLabel="View Active Only"
                                inactiveLabel="View All Categories"
                            />
                        }
                    >
                        <LibrarySearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search categories..."
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
                            <p>Loading categories...</p>
                        ) : totalRecords === 0 ? (
                            <p className={libs.emptyState}>
                                {searchQuery
                                    ? "No categories match your search."
                                    : "No categories yet."
                                }
                            </p>
                        ) : (
                            <>
                                <div className={libs.recordList}>
                                    {paginatedRecords.map((cat) => (
                                        <article
                                            key={cat.id}
                                            className={`${libs.recordCard} ${cat.is_archived ? libs.archivedRecord : ""}`}
                                        >
                                            <div className={libs.recordTitleRow}>
                                                <div className={libs.recordTitleGroup}>
                                                    <h3 className={libs.recordTitle}>{cat.name}</h3>

                                                    {cat.is_archived && (
                                                        <span className={libs.archivedBadge}>
                                                            Archived
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={glob.iconActions}>
                                                    {!cat.is_archived && (
                                                        <button
                                                            className={glob.iconButton}
                                                            type="button"
                                                            aria-label={`Edit ${cat.name}`}
                                                            title="Edit Category"
                                                            onClick={() => startEditing(cat)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}

                                                    <button
                                                        className={glob.iconButton}
                                                        type="button"
                                                        title={cat.is_archived ? "Restore Category" : "Archive Category"}
                                                        disabled={updatingCatId === cat.id}
                                                        onClick={() => void toggleArchived(cat)}
                                                    >
                                                        {updatingCatId === cat.id
                                                            ? <Loader size={16} />
                                                            : cat.is_archived
                                                                ? <ArchiveRestore size={16} />
                                                                : <ArchiveX size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={libs.recordDetails}>
                                                {cat.notes && (
                                                    <span>{cat.notes}</span>
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