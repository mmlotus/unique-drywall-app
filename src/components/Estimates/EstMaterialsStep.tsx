"use client";

import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import est from "@/styles/Estimates.module.css";
import { CreateEstimateMaterialBody, EstimateArea, EstimateMaterial, EstimateMeasurement, EstMaterialsStepProps, Material, UpdateEstimateMaterialBody } from "@/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "../LoadingSpinner";
import { Loader, Pencil, Trash2 } from "lucide-react";
import AppModal from "../AppModal";
import { calculateSuggestedMatQty } from "@/lib/helpers/estimateMaterialUtils";

const money = (value: number) => value.toLocaleString("en-US", {
    style: "currency", currency: "USD",
});

const numberText = (value: number) => value.toLocaleString("en-US", {
    maximumFractionDigits: 3,
});

export default function EstMaterialsStep({
    estimateId,
    editable,
    onDraftChange,
    onBusyChange,
}: EstMaterialsStepProps) {
    const [estAreas, setEstAreas] = useState<EstimateArea[]>([]);
    const [measurements, setMeasurements] = useState<EstimateMeasurement[]>([]);
    const [library, setLibrary] = useState<Material[]>([]);
    const [saved, setSaved] = useState<EstimateMaterial[]>([]);
    const [selectedAreaId, setSelectedAreaId] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [removingId, setRemovingId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<EstimateMaterial | null>(null);
    const [toRemove, setToRemove] = useState<EstimateMaterial | null>(null);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const [materialId, setMaterialId] = useState("");
    const [variantId, setVariantId] = useState("");
    const [browseParentId, setBrowseParentId] = useState("");
    const [useOverride, setUseOverride] = useState(false);
    const [quantityText, setQuantityText] = useState("");
    const [notes, setNotes] = useState("");

    const busy = saving || removingId !== null;
    const openForm = showAdd || editing !== null;

    useEffect(() => {
        onDraftChange?.(openForm);
    }, [openForm, onDraftChange]);

    useEffect(() => {
        onBusyChange?.(loading || busy);
    }, [loading, busy, onBusyChange]);

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            const urls = [
                `/api/estimates/${estimateId}/areas`,
                `/api/estimates/${estimateId}/measurements`,
                `/api/materials`,
                `/api/estimates/${estimateId}/materials`,
            ];
            const responses = await Promise.all(urls.map((url) => fetch(url)));
            const data = await Promise.all(responses.map((res) => res.json()));

            for (let i = 0; i < responses.length; i++) {
                if (!responses[i].ok) throw new Error(data[i].error || "Failed to load materials.");
            }
            return data;
        }

        loadData()
            .then(([a, m, l, s]) => {
                if (cancelled) return;

                setEstAreas(a as EstimateArea[]);
                setMeasurements(m as EstimateMeasurement[]);
                setLibrary(l as Material[]);
                setSaved(s as EstimateMaterial[]);
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load materials.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [estimateId]);

    const selectedArea = estAreas.find((a) => a.id === selectedAreaId) ?? estAreas[0];
    const roomMeasurements = measurements.filter((m) => m.estimate_area_id === selectedArea?.id);
    const roomSaved = saved.filter((m) => m.estimate_area_id === selectedArea?.id)
        .sort((a, b) => a.display_order - b.display_order);
    const parents = library.filter((m) => !m.is_archived && !m.parent_material_id);
    const browseVariants = library.filter((m) => !m.is_archived && m.parent_material_id === browseParentId);
    const variants = library.filter((m) => !m.is_archived && m.parent_material_id === materialId);
    const selectedMaterial = library.find((m) => m.id === (variantId || materialId));
    const suggested = selectedMaterial ? calculateSuggestedMatQty({
        material: selectedMaterial,
        measurements: roomMeasurements,
        sourceMaterialQuantity: null,
    }) : null;
    const roomSqFt = roomMeasurements.reduce((sum, m) => sum + Number(m.square_feet ?? 0), 0);
    const roomLinFt = roomMeasurements.reduce((sum, m) => sum + Number(m.linear_feet ?? 0), 0);
    const roomTotal = roomSaved.reduce((sum, m) => sum + Number(m.line_total ?? 0), 0);
    const estimateTotal = saved.reduce((sum, m) => sum + Number(m.line_total ?? 0), 0);

    function resetForm() {
        setShowAdd(false);
        setEditing(null);
        setMaterialId("");
        setVariantId("");
        setUseOverride(false);
        setQuantityText("");
        setNotes("");
    }

    function beginAdd(m: Material, variant?: Material) {
        if (!editable || busy || openForm || !selectedArea) return;
        resetForm();
        setMaterialId(m.id);
        setVariantId(variant?.id ?? "");
        setShowAdd(true);
    }

    function beginEdit(item: EstimateMaterial) {
        if (!editable || busy || openForm) return;
        setShowAdd(false);
        setEditing(item);
        setQuantityText(String(item.quantity));
        setNotes(item.notes ?? "");
    }

    function requestClose() {
        if (busy) return;
        if (editing) {
            if (quantityText !== String(editing.quantity) || notes !== (editing.notes ?? "")) {
                setShowDiscardConfirm(true);
                return;
            }
        } else if (showAdd) {
            if (useOverride || quantityText.trim() !== "" || notes.trim() !== "") {
                setShowDiscardConfirm(true);
                return;
            }
        }
        resetForm();
    }

    async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editable || busy || !selectedArea || !materialId) return;

        if (variants.length > 0 && !variantId) {
            toast.error("Please select a material variant.");
            return;
        }

        if (suggested === null && !quantityText.trim()) {
            toast.error("Enter a quantity for this material.");
            return;
        }

        const count = Number(quantityText);
        if ((useOverride || suggested === null) && (!quantityText.trim() || !Number.isFinite(count) || count < 0)) {
            toast.error("Quantity must be zero or greater.");
            return;
        }

        const body: CreateEstimateMaterialBody = {
            estimateAreaId: selectedArea.id,
            materialId,
            materialVariantId: variantId || null,
            notes: notes.trim() || null,
            ...((useOverride || suggested === null) ? { quantity: count } : {}),
        };

        try {
            setSaving(true);

            const res = await fetch(`/api/estimates/${estimateId}/materials`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add material.");

            setSaved((current) => [...current, data as EstimateMaterial]);
            resetForm();
            toast.success("Material added!");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to add material.");
        } finally {
            setSaving(false);
        }
    }

    async function handleEdit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editable || busy || !editing) return;

        const count = Number(quantityText);
        if (!quantityText.trim() || !Number.isFinite(count) || count < 0) {
            toast.error("Quantity must be zero or greater.");
            return;
        }

        const body: UpdateEstimateMaterialBody = {
            quantity: count,
            notes: notes.trim() || null,
        };

        try {
            setSaving(true);

            const res = await fetch(`/api/estimates/${estimateId}/materials/${editing.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update material.");

            setSaved((current) => current.map((m) => m.id === editing.id ? data as EstimateMaterial : m));
            resetForm();
            toast.success("Material updated!");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to update material.");
        } finally {
            setSaving(false);
        }
    }

    async function confirmRemove() {
        if (!editable || busy || !toRemove) return;

        const item = toRemove;

        try {
            setRemovingId(item.id);

            const res = await fetch(`/api/estimates/${estimateId}/materials/${item.id}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to remove material.");

            setSaved((current) => current.filter((m) => m.id !== item.id));
            setToRemove(null);
            toast.success("Material removed!");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to remove material.");
        } finally {
            setRemovingId(null);
        }
    }

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <main className={libs.section}>
                <h2 className={libs.sectionHeading}>Materials</h2>
                <p>Select materials for each area/room. Suggested quantities are calculated from saved measurements when available.</p>

                {estAreas.length === 0 ? (
                    <p className={libs.emptyState}>Please go back to Step 2 and add a room first.</p>
                ) : (
                    <>
                        <section className={libs.section}>
                            <h3 className={libs.sectionHeading}>Select Area/Room</h3>

                            <div className={est.selectionGrid}>
                                {estAreas.map((area) => {
                                    const count = saved.filter((m) => m.estimate_area_id === area.id).length;
                                    const isSelected = area.id === selectedArea?.id;

                                    return (
                                        <button
                                            key={area.id}
                                            type="button"
                                            className={`${glob.button} ${est.selectionTile}`}
                                            style={isSelected ? { backgroundColor: "var(--orange)" } : undefined}
                                            onClick={() => {
                                                setSelectedAreaId(area.id);
                                                setBrowseParentId("");
                                            }}
                                            aria-pressed={isSelected}
                                            disabled={busy || openForm}
                                        >
                                            {area.display_label} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />

                        <section className={libs.section}>
                            <h3 className={libs.sectionHeading}>
                                {selectedArea?.display_label}
                            </h3>
                            <p>{numberText(roomSqFt)} sq ft | {numberText(roomLinFt)} lin ft</p>

                            {editable && (
                                <section className={libs.section}>
                                    <h3 className={libs.sectionHeading}>Select Material</h3>

                                    {parents.length === 0 ? (
                                        <p className={libs.emptyState}>
                                            No active materials available.
                                        </p>
                                    ) : (
                                        <div className={est.selectionGrid}>
                                            {parents.map((m) => {
                                                const hasVariants = library.some((item) =>
                                                    !item.is_archived &&
                                                    item.parent_material_id === m.id
                                                );

                                                const active = browseParentId === m.id;

                                                return (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        className={`${glob.button} ${est.selectionTile}`}
                                                        style={active ? { backgroundColor: "var(--orange)" } : undefined}
                                                        aria-pressed={active}
                                                        disabled={busy || openForm}
                                                        onClick={() => {
                                                            if (hasVariants) {
                                                                setBrowseParentId(active ? "" : m.id);
                                                            } else {
                                                                beginAdd(m);
                                                            }
                                                        }}
                                                    >
                                                        {m.name}
                                                        {m.size_label ? ` (${m.size_label})` : ""}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            )}

                            <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />

                            {roomSaved.length === 0 ? (
                                <p className={libs.emptyState}>
                                    No materials added yet.
                                </p>
                            ) : (
                                <div className={libs.recordList}>
                                    {roomSaved.map((item) => (
                                        <article
                                            key={item.id}
                                            className={libs.recordCard}
                                        >
                                            <div className={libs.recordTitleRow}>
                                                <div className={libs.recordTitleGroup}>
                                                    <h3 className={libs.recordTitle}>
                                                        {item.material_name}{item.variant_name ? ` - ${item.variant_name}` : ""}
                                                    </h3>
                                                </div>

                                                {editable && (
                                                    <div className={glob.iconActions}>
                                                        <button
                                                            type="button"
                                                            className={glob.iconButton}
                                                            onClick={() => beginEdit(item)}
                                                            title="Edit Material"
                                                            disabled={busy || openForm}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={glob.iconButton}
                                                            onClick={() => setToRemove(item)}
                                                            title="Remove Material"
                                                            disabled={busy || openForm}
                                                        >
                                                            {removingId === item.id ? (
                                                                <Loader size={16} />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={libs.recordDetails}>
                                                <span>Quantity: {numberText(Number(item.quantity))}{item.unit_name ? ` ${item.unit_name}` : ""}</span>
                                                <span>Suggested: {item.suggested_quantity === null ? "Manual / unavailable" : numberText(Number(item.suggested_quantity))}</span>
                                                <span>Unit Price: {item.unit_price === null ? "Not set" : money(Number(item.unit_price))}</span>
                                                <span>Line Total: {money(Number(item.line_total ?? 0))}</span>
                                                {item.notes && <span>Notes: {item.notes}</span>}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                            <p style={{ marginTop: "24px" }}>
                                <strong>Area Materials Total: {money(roomTotal)}</strong>
                            </p>
                        </section>
                    </>
                )}

                {saved.length > 0 && (
                    <section className={libs.section} style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
                        <h3 className={libs.sectionHeading}>Estimate Materials Total</h3>
                        <p><strong>{money(estimateTotal)}</strong></p>
                    </section>
                )}
            </main>

            <AppModal
                open={browseParentId !== ""}
                title="Select Material Variant"
                onClose={() => setBrowseParentId("")}
            >
                <p>
                    Select a variant for{" "}
                    <strong>{parents.find((m) => m.id === browseParentId)?.name}</strong>.
                </p>

                <div className={est.selectionGrid}>
                    {browseVariants.map((variant) => {
                        const parent = parents.find((m) => m.id === browseParentId);

                        return (
                            <button
                                key={variant.id}
                                type="button"
                                className={`${glob.button} ${est.selectionTile}`}
                                disabled={busy}
                                onClick={() => {
                                    if (!parent) return;

                                    setBrowseParentId("");
                                    beginAdd(parent, variant);
                                }}
                            >
                                {variant.name}
                                {variant.size_label
                                    ? ` (${variant.size_label})`
                                    : ""
                                }
                            </button>
                        );
                    })}
                </div>

                <div className={glob.modalActions}>
                    <button
                        type="button"
                        className={glob.buttonTwo}
                        onClick={() => setBrowseParentId("")}
                    >
                        Cancel
                    </button>
                </div>
            </AppModal>

            <AppModal
                open={showAdd}
                title={"Add Material"}
                onClose={requestClose}
                busy={saving}
            >
                <form className={glob.form} onSubmit={handleSave}>
                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Area/Room</label>
                        <input
                            className={glob.input}
                            value={selectedArea?.display_label ?? ""}
                            readOnly
                        />
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Selected Material</label>
                        <input
                            className={glob.input}
                            value={
                                [
                                    parents.find((m) => m.id === materialId)?.name,
                                    variants.find((m) => m.id === variantId)?.name,
                                ]
                                    .filter(Boolean)
                                    .join(" - ")
                            }
                            readOnly
                        />
                    </div>

                    {selectedMaterial && (variants.length === 0 || variantId) && (
                        <>
                            <p>Suggested Quantity: <strong>{suggested === null
                                ? "Not available - enter manually"
                                : numberText(suggested)}</strong>
                            </p>

                            <p>Unit Price: <strong>{selectedMaterial.sell_price === null
                                ? "Not set"
                                : money(Number(selectedMaterial.sell_price))}</strong>
                            </p>

                            <div className={glob.fieldGroup}>
                                <label className={glob.label}>
                                    <input
                                        type="checkbox"
                                        checked={useOverride}
                                        disabled={saving || suggested === null}
                                        onChange={(e) => {
                                            setUseOverride(e.target.checked);
                                            setQuantityText("");
                                        }}
                                    />
                                    {" "}
                                    Manually override suggested quantity
                                </label>
                            </div>

                            {(useOverride || suggested === null) && (
                                <div className={glob.fieldGroup}>
                                    <label className={glob.label}>Quantity</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        className={glob.input}
                                        value={quantityText}
                                        onChange={(e) => setQuantityText(e.target.value)}
                                        disabled={saving}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Notes</label>
                        <textarea
                            className={glob.input}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div className={glob.modalActions}>
                        <button
                            type="button"
                            className={glob.buttonTwo}
                            onClick={requestClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className={glob.button}
                            disabled={saving}
                        >
                            {saving ? <Loader size={16} /> : "Add Material"}
                        </button>
                    </div>
                </form>
            </AppModal>

            <AppModal
                open={editing !== null}
                title="Edit Material"
                onClose={requestClose}
                busy={saving}
            >
                <form className={glob.form} onSubmit={handleEdit}>
                    <p>
                        <strong>{editing?.material_name}{editing?.variant_name
                            ? ` - ${editing.variant_name}` : ""}</strong>
                    </p>

                    <p>
                        Suggested Quantity: {editing?.suggested_quantity === null
                            ? "Unavailable"
                            : numberText(Number(editing?.suggested_quantity ?? 0))}
                    </p>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Quantity</label>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className={glob.input}
                            value={quantityText}
                            onChange={(e) => setQuantityText(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Notes</label>
                        <textarea
                            className={glob.input}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div className={glob.modalActions}>
                        <button
                            type="button"
                            className={glob.buttonTwo}
                            onClick={requestClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className={glob.button}
                            disabled={saving}
                        >
                            {saving ? <Loader size={16} /> : "Save Changes"}
                        </button>
                    </div>
                </form>
            </AppModal>

            <AppModal
                open={showDiscardConfirm}
                title="Discard Changes?"
                onClose={() => setShowDiscardConfirm(false)}
            >
                <p>
                    You have unsaved changes to this material.
                    Are you sure you want to discard them?
                </p>

                <div className={glob.modalActions}>
                    <button
                        type="button"
                        className={glob.buttonTwo}
                        onClick={() => setShowDiscardConfirm(false)}
                    >
                        Keep Editing
                    </button>

                    <button
                        type="button"
                        className={glob.button}
                        onClick={() => {
                            setShowDiscardConfirm(false);
                            resetForm();
                        }}
                    >
                        Discard Changes
                    </button>
                </div>
            </AppModal>

            <AppModal
                open={toRemove !== null}
                title="Remove Material"
                onClose={() => setToRemove(null)}
                busy={removingId !== null}
            >
                <p>
                    Are you sure you want to remove{" "}
                    <strong>{toRemove?.material_name}</strong>{" "}
                    from this area/room?
                </p>

                <div className={glob.modalActions}>
                    <button
                        type="button"
                        className={glob.buttonTwo}
                        onClick={() => setToRemove(null)}
                        disabled={removingId !== null}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className={glob.button}
                        onClick={() => void confirmRemove()}
                        disabled={removingId !== null}
                    >
                        {removingId !== null ? <Loader size={16} /> : "Remove Material"}
                    </button>
                </div>
            </AppModal>
        </>
    );
}