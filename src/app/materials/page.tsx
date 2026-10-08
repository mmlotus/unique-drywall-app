"use client";

import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArchiveRestore, ArchiveX, Loader, Pencil } from "lucide-react";
import ToggleButton from "@/components/ToggleButton";
import LibrarySection from "@/components/Libraries/LibrarySection";
import LibraryPageLayout from "@/components/Libraries/LibraryPageLayout";
import { useLibraryData } from "@/hooks/useLibraryData";
import LibrarySearch from "@/components/Libraries/LibrarySearch";
import LibraryPagination from "@/components/Libraries/LibraryPagination";
import { Category, emptyMaterialFormData, Material, MaterialFormData, Unit } from "@/types";
import { materialToFormData } from "@/lib/mappers/materials";
import { buildCustomFormula, calculateCoverage, CustomFormulaBase, CustomFormulaOperation, parseCustomFormula } from "@/lib/helpers/coverage";

function getMaterialSearchText(m: Material): string {
    return [
        m.name,
        m.size_label,
        m.notes,
        m.calculation_method,
    ]
        .filter(Boolean)
        .join(" ");
}

export default function MaterialsPage() {
    const [mats, setMats] = useState<Material[]>([]);
    const [cats, setCats] = useState<Category[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    const [form, setForm] = useState<MaterialFormData>(emptyMaterialFormData);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingMatId, setEditingMatId] = useState<string | null>(null);
    const [updatingMatId, setUpdatingMatId] = useState<string | null>(null);
    const [showAllMats, setShowAllMats] = useState(false);

    const [customFormulaBase, setCustomFormulaBase] = useState<CustomFormulaBase>("measured_sqft");
    const [customFormulaOperation, setCustomFormulaOperation] = useState<CustomFormulaOperation>("*");
    const [customFormulaValue, setCustomFormulaValue] = useState("");

    function updateCustomFormula(
        base: CustomFormulaBase,
        operation: CustomFormulaOperation,
        value: string
    ) {
        setCustomFormulaBase(base);
        setCustomFormulaOperation(operation);
        setCustomFormulaValue(value);

        updateField("customFormula", buildCustomFormula(base, operation, value));
    }

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
        records: mats,
        searchText: getMaterialSearchText,
        filterRecord: (mats, query) => {
            if (query) return true;

            return (showAllMats || !mats.is_archived);
        },
        initialPageSize: 10,
    });

    const activeCats = useMemo(() => cats.filter((cat) => !cat.is_archived), [cats]);
    const activeUnits = useMemo(() => units.filter((unit) => !unit.is_archived), [units]);
    const availableParentMats = useMemo(() => mats.filter((mat) => !mat.is_archived && mat.id !== editingMatId), [mats, editingMatId]);

    async function fetchMaterials(): Promise<Material[]> {
        const res = await fetch("/api/materials");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load materials.");
        }

        return data;
    }

    async function fetchCategories(): Promise<Category[]> {
        const res = await fetch("/api/categories");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load categories.");
        }

        return data;
    }

    async function fetchUnits(): Promise<Unit[]> {
        const res = await fetch("/api/units");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load units.");
        }

        return data;
    }

    async function loadMaterials() {
        try {
            const data = await fetchMaterials();
            setMats(data);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to load materials."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function loadInitialData() {
            try {
                const matsData = await fetchMaterials();

                if (!cancelled) setMats(matsData);
            } catch (err) {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load materials.");
                }
            }

            try {
                const catsData = await fetchCategories();

                if (!cancelled) setCats(catsData);
            } catch (err) {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load categories.");
                }
            }

            try {
                const unitsData = await fetchUnits();

                if (!cancelled) setUnits(unitsData);
            } catch (err) {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load units.");
                }
            }

            if (!cancelled) setLoading(false);
        }

        void loadInitialData();

        return () => {
            cancelled = true;
        };
    }, []);

    function updateField(field: keyof MaterialFormData, value: string) {
        setForm((current) => {
            const next = {
                ...current,
                [field]: value,
            };

            if (
                field === "width" ||
                field === "length" ||
                field === "calculationMethod"
            ) {
                next.coveragePerUnit = calculateCoverage(
                    next.calculationMethod,
                    next.width,
                    next.length
                );
            }

            return next;
        });
    }

    function startEditing(m: Material) {
        setEditingMatId(m.id);

        const editForm = materialToFormData(m);
        const parsedFormula = parseCustomFormula(editForm.customFormula);

        setCustomFormulaBase(parsedFormula.base);
        setCustomFormulaOperation(parsedFormula.operation);
        setCustomFormulaValue(parsedFormula.value);

        if (
            editForm.calculationMethod === "measured_sqft" ||
            editForm.calculationMethod === "linear_footage"
        ) {
            editForm.coveragePerUnit = calculateCoverage(
                editForm.calculationMethod,
                editForm.width,
                editForm.length
            );
        }

        setForm(editForm);

        window.scrollTo({ top: 0, behavior: "smooth", });
    }

    function cancelEditing() {
        setEditingMatId(null);
        setForm(emptyMaterialFormData);

        setCustomFormulaBase("measured_sqft");
        setCustomFormulaOperation("*");
        setCustomFormulaValue("");
    }

    async function toggleArchived(m: Material) {
        try {
            setUpdatingMatId(m.id);

            const res = await fetch(`/api/materials/${m.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: !m.is_archived }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Failed to ${m.is_archived ? "restore" : "archive"} material.`);

            toast.success(m.is_archived ? "Material restored!" : "Material archived!");

            await loadMaterials();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to update material.");
        } finally {
            setUpdatingMatId(null);
        }
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);

            const editing = editingMatId !== null;

            const res = await fetch(
                editing
                    ? `/api/materials/${editingMatId}`
                    : "/api/materials",
                {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error ||
                (editing ? "Failed to update material." : "Failed to create material.")
            );

            setForm(emptyMaterialFormData);
            setEditingMatId(null);

            setCustomFormulaBase("measured_sqft");
            setCustomFormulaOperation("*");
            setCustomFormulaValue("");

            toast.success(editing ? "Material updated!" : "Material created!");
            await loadMaterials();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error
                ? err.message : "Failed to save material."
            );
        } finally {
            setSaving(false);
        }
    }

    function getCatName(catId: string | null): string | null {
        if (!catId) return null;

        return (
            cats.find((cat) => cat.id === catId)?.name ?? null
        );
    }

    function getUnitName(uId: string | null): string | null {
        if (!uId) return null;

        return (
            units.find((u) => u.id === uId)?.name ?? null
        );
    }

    function getParentMatName(pMatId: string | null): string | null {
        if (!pMatId) return null;

        return (
            mats.find((mat) => mat.id === pMatId)?.name ?? null
        );
    }

    const coverageIsCalculated =
        form.calculationMethod === "measured_sqft" ||
        form.calculationMethod === "linear_footage";

    const coverageIsLinear =
        form.calculationMethod === "linear_footage";

    return (
        <main className={glob.container}>
            <h1 className={glob.heading}>Materials Library</h1>

            <LibraryPageLayout
                editor={
                    <form className={glob.form} onSubmit={handleSubmit}>
                        <h2 className={libs.sectionHeading}>
                            {editingMatId ? "Edit Material" : "New Material"}
                        </h2>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Material Name</label>
                            <input
                                id="mat-name"
                                className={glob.input}
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                required
                            />
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Parent Material</label>
                            <select
                                id="mat-parent"
                                className={glob.input}
                                value={form.parentMaterialId}
                                onChange={(e) => updateField("parentMaterialId", e.target.value)}
                            >
                                <option value="">No parent material</option>

                                {availableParentMats.map((mat: Material) => (
                                    <option key={mat.id} value={mat.id}>
                                        {mat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Category</label>

                            <select
                                id="mat-category"
                                className={glob.input}
                                value={form.categoryId}
                                onChange={(e) => updateField("categoryId", e.target.value)}
                            >
                                <option value="">No category</option>

                                {activeCats.map((cat: Category) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Unit</label>

                            <select
                                id="mat-unit"
                                className={glob.input}
                                value={form.unitId}
                                onChange={(e) => updateField("unitId", e.target.value)}
                            >
                                <option value="">No unit</option>

                                {activeUnits.map((u: Unit) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                        {u.abbreviation
                                            ? ` (${u.abbreviation})`
                                            : ""
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Size / Description</label>

                            <input
                                id="mat-size-label"
                                className={glob.input}
                                value={form.sizeLabel}
                                onChange={(e) => updateField("sizeLabel", e.target.value)}
                            />
                        </div>

                        <section className={libs.section}>
                            <h2 className={libs.sectionHeading}>Calculation</h2>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Calculation Method</label>

                                <select
                                    id="mat-calculation-method"
                                    className={glob.input}
                                    value={form.calculationMethod}
                                    onChange={(e) => updateField("calculationMethod", e.target.value)}
                                >
                                    <option value="measured_sqft">Measured Square Footage</option>
                                    <option value="source_material_quantity">Source Material Quantity</option>
                                    <option value="linear_footage">Linear Footage</option>
                                    <option value="manual">Manual</option>
                                    <option value="custom_formula">Custom Formula</option>
                                </select>
                            </div>

                            {form.calculationMethod === "custom_formula" && (
                                <>
                                    <div className={glob.fieldGroup}>
                                        <label className={glob.label}>Calculate From</label>
                                        <select
                                            className={glob.input}
                                            value={customFormulaBase}
                                            onChange={(e) =>
                                                updateCustomFormula(
                                                    e.target.value as CustomFormulaBase,
                                                    customFormulaOperation,
                                                    customFormulaValue
                                                )}
                                        >
                                            <option value="measured_sqft">Measured Square Footage</option>
                                            <option value="linear_footage">Linear Footage</option>
                                            <option value="material_quantity">Material Quantity</option>
                                        </select>
                                    </div>

                                    <div className={glob.fieldGroup}>
                                        <label className={glob.label}>Operation</label>

                                        <select
                                            className={glob.input}
                                            value={customFormulaOperation}
                                            onChange={(e) =>
                                                updateCustomFormula(
                                                    customFormulaBase,
                                                    e.target.value as CustomFormulaOperation,
                                                    customFormulaValue
                                                )}
                                        >
                                            <option value="*">Multiply By</option>
                                            <option value="+">Add</option>
                                            <option value="-">Subtract</option>
                                        </select>
                                    </div>

                                    <div className={glob.fieldGroup}>
                                        <label className={glob.label}>Value</label>

                                        <input
                                            className={glob.input}
                                            type="number"
                                            step="any"
                                            value={customFormulaValue}
                                            onChange={(e) =>
                                                updateCustomFormula(
                                                    customFormulaBase,
                                                    customFormulaOperation,
                                                    e.target.value
                                                )}
                                            required
                                        />
                                    </div>

                                    {customFormulaValue && (
                                        <div className={glob.fieldGroup}>
                                            <label className={glob.label}>Formula Preview</label>

                                            <div>
                                                {customFormulaBase === "measured_sqft"
                                                    ? "Measured Square Footage"
                                                    : customFormulaBase === "linear_footage"
                                                        ? "Linear Footage"
                                                        : "Material Quantity"
                                                }
                                                {" "}
                                                {customFormulaOperation === "*"
                                                    ? "×"
                                                    : customFormulaOperation
                                                }
                                                {" "}
                                                {customFormulaValue}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>

                        <section className={libs.section}>
                            <h2 className={libs.sectionHeading}>Dimensions</h2>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Width</label>

                                <input
                                    id="mat-width"
                                    className={glob.input}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.width}
                                    onChange={(e) => updateField("width", e.target.value)}
                                    readOnly={coverageIsLinear}
                                    disabled={coverageIsLinear}
                                />
                            </div>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Length</label>

                                <input
                                    id="mat-length"
                                    className={glob.input}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.length}
                                    onChange={(e) => updateField("length", e.target.value)}
                                />
                            </div>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Thickness</label>

                                <input
                                    id="mat-thickness"
                                    className={glob.input}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.thickness}
                                    onChange={(e) => updateField("thickness", e.target.value)}
                                    readOnly={coverageIsLinear}
                                    disabled={coverageIsLinear}
                                />
                            </div>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Coverage Per Unit</label>

                                <input
                                    id="mat-coverage"
                                    className={glob.input}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.coveragePerUnit}
                                    onChange={(e) => updateField("coveragePerUnit", e.target.value)}
                                    readOnly={coverageIsCalculated}
                                    disabled={coverageIsCalculated}
                                />
                            </div>
                        </section>

                        <section className={libs.section}>
                            <h2 className={libs.sectionHeading}>Pricing</h2>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Cost</label>

                                <input
                                    id="mat-cost"
                                    className={glob.input}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.cost}
                                    onChange={(e) => updateField("cost", e.target.value)}
                                />
                            </div>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Sell Price</label>

                                <input
                                    id="mat-sell-price"
                                    className={glob.input}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.sellPrice}
                                    onChange={(e) => updateField("sellPrice", e.target.value)}
                                />
                            </div>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>Markup %</label>

                                <input
                                    id="mat-markup"
                                    className={glob.input}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.markupPercent}
                                    onChange={(e) => updateField("markupPercent", e.target.value)}
                                />
                            </div>
                        </section>

                        <div className={glob.fieldGroup}>
                            <div className={libs.sectionHeading}>Notes</div>

                            <textarea
                                id="mat-notes"
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
                                : editingMatId
                                    ? "Save Changes"
                                    : "Add Material"}
                        </button>

                        {editingMatId && (
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
                    < LibrarySection
                        title={`Materials (${totalRecords})`}
                        actions={
                            < ToggleButton
                                active={showAllMats}
                                onClick={() => {
                                    setShowAllMats((current) => !current);
                                    setCurrentPage(1);
                                }}
                                activeLabel="View Active Only"
                                inactiveLabel="View All Materials"
                            />
                        }
                    >
                        <LibrarySearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search materials..."
                        />

                        <LibraryPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalRecords={totalRecords}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                        />

                        {
                            loading ? (
                                <p>Loading materials...</p>
                            ) : totalRecords === 0 ? (
                                <p className={libs.emptyState}>
                                    {searchQuery
                                        ? "No materials match your search."
                                        : "No materials yet."
                                    }
                                </p>
                            ) : (
                                <>
                                    <div className={libs.recordList}>
                                        {paginatedRecords.map((m) => {
                                            const catName = getCatName(m.category_id);
                                            const unitName = getUnitName(m.unit_id);
                                            const parentName = getParentMatName(m.parent_material_id);

                                            return (
                                                <article
                                                    key={m.id}
                                                    className={`${libs.recordCard} ${m.is_archived ? libs.archivedRecord : ""}`}
                                                >
                                                    <div className={libs.recordTitleRow}>
                                                        <div className={libs.recordTitleGroup}>
                                                            <h3 className={libs.recordTitle}>{m.name}</h3>

                                                            {m.is_archived && (
                                                                <span className={libs.archivedBadge}>
                                                                    Archived
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className={glob.iconActions}>
                                                            {!m.is_archived && (
                                                                <button
                                                                    className={glob.iconButton}
                                                                    type="button"
                                                                    aria-label={`Edit ${m.name}`}
                                                                    title="Edit Material"
                                                                    onClick={() => startEditing(m)}
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                            )}

                                                            <button
                                                                className={glob.iconButton}
                                                                type="button"
                                                                title={m.is_archived ? "Restore Material" : "Archive Material"}
                                                                disabled={updatingMatId === m.id}
                                                                onClick={() => void toggleArchived(m)}
                                                            >
                                                                {updatingMatId === m.id
                                                                    ? <Loader size={16} />
                                                                    : m.is_archived
                                                                        ? <ArchiveRestore size={16} />
                                                                        : <ArchiveX size={16} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className={libs.recordDetails}>
                                                        {m.size_label && (
                                                            <span>{m.size_label}</span>
                                                        )}

                                                        {catName && (
                                                            <span>Category:{" "}{catName}</span>
                                                        )}

                                                        {unitName && (
                                                            <span>Unit:{" "}{unitName}</span>
                                                        )}

                                                        {parentName && (
                                                            <span>Parent:{" "}{parentName}</span>
                                                        )}

                                                        {m.coverage_per_unit !== null && (
                                                            <span>Coverage:{" "}{m.coverage_per_unit}</span>
                                                        )}

                                                        {m.cost !== null && (
                                                            <span>Cost: ${Number(m.cost).toFixed(2)}</span>
                                                        )}

                                                        {m.sell_price !== null && (
                                                            <span>Price: ${Number(m.sell_price).toFixed(2)}</span>
                                                        )}

                                                        {m.markup_percent !== null && (
                                                            <span>Markup:{" "}{m.markup_percent}%</span>
                                                        )}

                                                        {m.notes && (
                                                            <span>{m.notes}</span>
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        })}
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
                            )
                        }
                    </LibrarySection >
                }
            />
        </main >
    );
}