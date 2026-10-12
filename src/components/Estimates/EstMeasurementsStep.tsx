"use client";

import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import est from "@/styles/Estimates.module.css";
import { emptyMeasurementForm, EstimateArea, EstimateMeasurement, EstimateMeasurementInput, EstMeasurementsStepProps, MeasurementForm, MeasurementType } from "@/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "../LoadingSpinner";
import { Loader, Pencil, Trash2 } from "lucide-react";
import AppModal from "../AppModal";
import { formatMeasurementNumber, getCalculatedMeasurement, measurementToForm, parseMeasurementNumber } from "@/lib/helpers/measurementUtils";

function typeLabel(type: MeasurementType) {
    return type === "wall" ? "Wall" : type === "ceiling" ? "Lid" : "Other";
}

export default function EstMeasurementsStep({
    estimateId,
    editable,
    onDraftChange,
    onBusyChange,
}: EstMeasurementsStepProps) {
    const [estAreas, setEstAreas] = useState<EstimateArea[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [measurements, setMeasurements] = useState<EstimateMeasurement[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [removingMeasurementId, setRemovingMeasurementId] = useState<string | null>(null);
    const [measurementToRemove, setMeasurementToRemove] = useState<EstimateMeasurement | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const [editingMeasId, setEditingMeasId] = useState<string | null>(null);
    const [estimateAreaId, setEstimateAreaId] = useState("");

    const [measurementType, setMeasurementType] = useState<MeasurementType>("wall");
    const [description, setDescription] = useState("");
    const [lengthFt, setLengthFt] = useState("");
    const [widthFt, setWidthFt] = useState("");
    const [heightFt, setHeightFt] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [squareFeet, setSquareFeet] = useState("");
    const [linearFeet, setLinearFeet] = useState("");
    const [notes, setNotes] = useState("");

    const [overrideSquareFeet, setOverrideSquareFeet] = useState(false);
    const [overrideLinearFeet, setOverrideLinearFeet] = useState(false);

    const calculated = getCalculatedMeasurement({
        measurementType,
        description,
        lengthFt,
        widthFt,
        heightFt,
        quantity,
        squareFeet,
        linearFeet,
        notes,
        overrideSquareFeet,
        overrideLinearFeet,
    });

    const totals = {
        squareFeet: overrideSquareFeet
            ? parseMeasurementNumber(squareFeet)
            : calculated.squareFeet,
        linearFeet: overrideLinearFeet
            ? parseMeasurementNumber(linearFeet)
            : calculated.linearFeet,
    };

    const editingMeasurement = measurements.find((item) => item.id === editingMeasId);

    const hasChanges = editingMeasurement ? (
        measurementType !== editingMeasurement.measurement_type ||
        description !== (editingMeasurement.description ?? "") ||
        lengthFt !== (editingMeasurement.length_ft?.toString() ?? "") ||
        widthFt !== (editingMeasurement.width_ft?.toString() ?? "") ||
        heightFt !== (editingMeasurement.height_ft?.toString() ?? "") ||
        quantity !== editingMeasurement.quantity.toString() ||
        notes !== (editingMeasurement.notes ?? "") ||
        overrideSquareFeet !== editingMeasurement.override_square_feet ||
        overrideLinearFeet !== editingMeasurement.override_linear_feet ||
        (overrideSquareFeet && squareFeet !== (editingMeasurement.square_feet?.toString() ?? "")) ||
        (overrideLinearFeet && linearFeet !== (editingMeasurement.linear_feet?.toString() ?? ""))
    ) : (
        measurementType !== "wall" ||
        description !== "" ||
        lengthFt !== "" ||
        widthFt !== "" ||
        heightFt !== "" ||
        quantity !== "1" ||
        notes !== "" ||
        overrideSquareFeet ||
        overrideLinearFeet
    );

    const busy = saving || removingMeasurementId !== null;

    useEffect(() => {
        onDraftChange?.(showForm);
    }, [showForm, onDraftChange]);

    useEffect(() => {
        onBusyChange?.(loading || busy);
    }, [loading, busy, onBusyChange]);

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            const [areasRes, measurementsRes] = await Promise.all([
                fetch(`/api/estimates/${estimateId}/areas`),
                fetch(`/api/estimates/${estimateId}/measurements`),
            ]);
            const areasData = await areasRes.json();
            const measurementsData = await measurementsRes.json();

            if (!areasRes.ok) throw new Error(areasData.error || "Failed to load areas/rooms.");
            if (!measurementsRes.ok) throw new Error(measurementsData.error || "Failed to load measurements.");

            return {
                areas: areasData as EstimateArea[],
                measurements: measurementsData as EstimateMeasurement[],
            };
        }

        loadData()
            .then((data) => {
                if (cancelled) return;

                setEstAreas(data.areas);
                setMeasurements(data.measurements);
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load measurements.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [estimateId]);

    function setFields(values: MeasurementForm) {
        setMeasurementType(values.measurementType);
        setDescription(values.description);
        setLengthFt(values.lengthFt);
        setWidthFt(values.widthFt);
        setHeightFt(values.heightFt);
        setQuantity(values.quantity);
        setSquareFeet(values.squareFeet);
        setLinearFeet(values.linearFeet);
        setNotes(values.notes);
        setOverrideSquareFeet(values.overrideSquareFeet);
        setOverrideLinearFeet(values.overrideLinearFeet);
    }

    function closeForm() {
        setShowForm(false);
        setEditingMeasId(null);
        setEstimateAreaId("");
        setFields(emptyMeasurementForm);
    }

    function startAdding(areaId: string) {
        if (!editable || busy || showForm) return;
        setFields(emptyMeasurementForm);
        setEstimateAreaId(areaId);
        setEditingMeasId(null);
        setShowForm(true);
    }

    function startEditing(measurement: EstimateMeasurement) {
        if (!editable || busy || showForm) return;
        setFields(measurementToForm(measurement));
        setEstimateAreaId(measurement.estimate_area_id);
        setEditingMeasId(measurement.id);
        setShowForm(true);
    }

    function requestCloseForm() {
        if (saving || !showForm) return;
        if (hasChanges) setShowDiscardConfirm(true);
        else closeForm();
    }

    function handleTypeChange(type: MeasurementType) {
        setMeasurementType(type);
        if (type === "wall") setWidthFt("");
        else setHeightFt("");
    }

    async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editable || busy || !showForm || !estimateAreaId) return;

        const count = Number(quantity);
        if (!Number.isInteger(count) || count <= 0) {
            toast.error("Quantity must be a positive whole number.");
            return;
        }

        const dimensions = [lengthFt, measurementType === "wall" ? heightFt : widthFt];
        if (dimensions.some((value) => value.trim() !== "" &&
            (!Number.isFinite(Number(value)) || Number(value) <= 0))) {
            toast.error("Dimensions must be positive numbers.");
            return;
        }

        if (overrideSquareFeet && (squareFeet.trim() === "" ||
            !Number.isFinite(Number(squareFeet)) || Number(squareFeet) < 0)) {
            toast.error("Enter a valid square footage override.");
            return;
        }

        if (overrideLinearFeet && (linearFeet.trim() === "" ||
            !Number.isFinite(Number(linearFeet)) || Number(linearFeet) < 0)) {
            toast.error("Enter a valid linear footage override.");
            return;
        }

        const selectedWidth: number | null =
            measurementType === "wall"
                ? null
                : parseMeasurementNumber(widthFt);

        const selectedHeight: number | null =
            measurementType === "wall"
                ? parseMeasurementNumber(heightFt)
                : null;

        const body: EstimateMeasurementInput = {
            estimateAreaId: estimateAreaId,
            measurementType: measurementType,
            description: description.trim() || null,
            lengthFt: parseMeasurementNumber(lengthFt),
            widthFt: selectedWidth,
            heightFt: selectedHeight,
            quantity: count,
            notes: notes.trim() || null,
        };

        body.overrideSquareFeet = overrideSquareFeet;
        body.overrideLinearFeet = overrideLinearFeet;

        if (overrideSquareFeet) {
            body.squareFeet = Number(squareFeet);
        }

        if (overrideLinearFeet) {
            body.linearFeet = Number(linearFeet);
        }

        const editing = editingMeasId !== null;
        try {
            setSaving(true);

            const res = await fetch(editing
                ? `/api/estimates/${estimateId}/measurements/${editingMeasId}`
                : `/api/estimates/${estimateId}/measurements`,
                {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save measurements.");

            setMeasurements((current) => editing
                ? current.map((item) => item.id === editingMeasId ? data as EstimateMeasurement : item)
                : [...current, data as EstimateMeasurement]);
            closeForm();
            toast.success(editing ? "Measurement updated!" : "Measurement added!");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to save measurements.");
        } finally {
            setSaving(false);
        }
    }

    async function confirmRemove() {
        if (!editable || busy || !measurementToRemove) return;

        const measurement = measurementToRemove;

        try {
            setRemovingMeasurementId(measurement.id);

            const res = await fetch(`/api/estimates/${estimateId}/measurements/${measurement.id}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to remove measurement.");
            setMeasurements((current) => current.filter((item) => item.id !== measurement.id));
            setMeasurementToRemove(null);
            toast.success("Measurement removed!");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to remove measurement.");
        } finally {
            setRemovingMeasurementId(null);
        }
    }

    if (loading) return <LoadingSpinner />;

    const selectedRoom = estAreas.find((area) => area.id === selectedRoomId) ?? estAreas[0];

    const roomMeasurements = selectedRoom
        ? measurements.filter((item) => item.estimate_area_id === selectedRoom.id)
            .sort((a, b) => a.display_order - b.display_order)
        : [];

    const roomTotalSF = roomMeasurements.reduce((sum, item) => sum + Number(item.square_feet ?? 0), 0);
    const roomTotalLF = roomMeasurements.reduce((sum, item) => sum + Number(item.linear_feet ?? 0), 0);

    return (
        <>
            <main className={libs.section}>
                <h2 className={libs.sectionHeading}>Measurements</h2>

                <p>Add measurements for each area/room. Calculated totals can be overridden when needed.</p>

                {estAreas.length === 0 ? (
                    <p className={libs.emptyState}>Please go back to Step 2 and add a room first.</p>
                ) : (
                    <>
                        <section className={libs.section}>
                            <h3 className={libs.sectionHeading}>Select Area/Room</h3>

                            <div className={est.selectionGrid}>
                                {estAreas.map((area) => {
                                    const count = measurements.filter((item) => item.estimate_area_id === area.id).length;

                                    const isSelected = selectedRoom?.id === area.id;

                                    return (
                                        <button
                                            key={area.id}
                                            type="button"
                                            className={`${glob.button} ${est.selectionTile}`}
                                            style={isSelected ? { backgroundColor: "var(--orange)" } : undefined}
                                            onClick={() => setSelectedRoomId(area.id)}
                                            aria-pressed={isSelected}
                                            disabled={busy || showForm}
                                        >
                                            {area.display_label} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />

                        {selectedRoom && (
                            <section className={libs.section}>
                                <h3 className={libs.sectionHeading}>
                                    {selectedRoom.display_label}
                                </h3>

                                {editable && (
                                    <button
                                        type="button"
                                        className={glob.button}
                                        onClick={() => startAdding(selectedRoom.id)}
                                        disabled={busy || showForm}
                                    >
                                        Add Measurement
                                    </button>
                                )}

                                {roomMeasurements.length === 0 ? (
                                    <p className={libs.emptyState}>
                                        No measurements added yet.
                                    </p>
                                ) : (
                                    <>
                                        <div className={libs.recordList}>
                                            {roomMeasurements.map((item) => (
                                                <article
                                                    key={item.id}
                                                    className={libs.recordCard}
                                                >
                                                    <div className={libs.recordTitleRow}>
                                                        <div className={libs.recordTitleGroup}>
                                                            <h3 className={libs.recordTitle}>
                                                                {item.description || typeLabel(item.measurement_type)}
                                                            </h3>
                                                        </div>

                                                        {editable && (
                                                            <div className={glob.iconActions}>
                                                                <button
                                                                    type="button"
                                                                    className={glob.iconButton}
                                                                    onClick={() => startEditing(item)}
                                                                    title="Edit Measurement"
                                                                    disabled={busy || showForm}
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className={glob.iconButton}
                                                                    onClick={() => setMeasurementToRemove(item)}
                                                                    title="Remove Measurement"
                                                                    disabled={busy || showForm}
                                                                >
                                                                    {removingMeasurementId === item.id ? (
                                                                        <Loader size={16} />
                                                                    ) : (
                                                                        <Trash2 size={16} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={libs.recordDetails}>
                                                        <span>
                                                            Type: {typeLabel(item.measurement_type)}
                                                        </span>

                                                        {item.length_ft !== null && (
                                                            <span>
                                                                Length: {formatMeasurementNumber(item.length_ft)} ft
                                                            </span>
                                                        )}

                                                        {item.width_ft !== null && (
                                                            <span>
                                                                Width: {formatMeasurementNumber(item.width_ft)} ft
                                                            </span>
                                                        )}

                                                        {item.height_ft !== null && (
                                                            <span>
                                                                Height: {formatMeasurementNumber(item.height_ft)} ft
                                                            </span>
                                                        )}

                                                        <span>Quantity: {item.quantity}</span>

                                                        <span>
                                                            Square Feet: {item.square_feet === null
                                                                ? "-"
                                                                : formatMeasurementNumber(item.square_feet)} sq ft
                                                        </span>

                                                        <span>
                                                            Linear Feet: {item.linear_feet === null
                                                                ? "-"
                                                                : formatMeasurementNumber(item.linear_feet)} lin ft
                                                        </span>

                                                        {item.notes && (
                                                            <span>Notes: {item.notes}</span>
                                                        )}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>

                                        <p style={{ marginTop: "24px" }}>
                                            <strong>
                                                Area Total: {formatMeasurementNumber(roomTotalSF)} sq ft
                                                {" | "}
                                                {formatMeasurementNumber(roomTotalLF)} lin ft
                                            </strong>
                                        </p>
                                    </>
                                )}
                            </section>
                        )}
                    </>
                )}

                {measurements.length > 0 && (
                    <section
                        className={libs.section}
                        style={{
                            marginTop: "20px",
                            paddingTop: "20px",
                            borderTop: "1px solid #e5e7eb",
                        }}
                    >
                        <h3 className={libs.sectionHeading}>Estimate Totals</h3>
                        <p><strong>
                            {formatMeasurementNumber(measurements.reduce((sum, item) => sum + Number(item.square_feet ?? 0), 0))} sq ft
                            {" | "}
                            {formatMeasurementNumber(measurements.reduce((sum, item) => sum + Number(item.linear_feet ?? 0), 0))} lin ft
                        </strong></p>
                    </section>
                )}
            </main>

            <AppModal
                open={showForm}
                title={editingMeasId ? "Edit Measurement" : "Add Measurement"}
                onClose={requestCloseForm}
                busy={saving}
            >
                <form className={glob.form} onSubmit={handleSave}>
                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Area/Room</label>
                        <input
                            className={glob.input}
                            value={estAreas.find((area) => area.id === estimateAreaId)?.display_label ?? ""}
                            readOnly
                        />
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Measurement Type</label>
                        <select
                            className={glob.input}
                            value={measurementType}
                            onChange={(e) => handleTypeChange(e.target.value as MeasurementType)}
                            disabled={saving}
                        >
                            <option value="wall">Wall</option>
                            <option value="ceiling">Lid</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Description</label>
                        <input
                            className={glob.input}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={saving}
                            placeholder="e.g. North Wall"
                        />
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Length (ft)</label>
                        <input
                            type="number"
                            min="0.0001"
                            step="any"
                            className={glob.input}
                            value={lengthFt}
                            onChange={(e) => setLengthFt(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    {measurementType === "wall" ? (
                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Height (ft)</label>
                            <input
                                type="number"
                                min="0.0001"
                                step="any"
                                className={glob.input}
                                value={heightFt}
                                onChange={(e) => setHeightFt(e.target.value)}
                                disabled={saving}
                            />
                        </div>
                    ) : (
                        <div className={glob.fieldGroup}>
                            <label className={glob.label}>Width (ft)</label>
                            <input
                                type="number"
                                min="0.0001"
                                step="any"
                                className={glob.input}
                                value={widthFt}
                                onChange={(e) => setWidthFt(e.target.value)}
                                disabled={saving}
                            />
                        </div>
                    )}

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Quantity</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            className={glob.input}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Square Feet (sq ft)</label>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className={glob.input}
                            value={overrideSquareFeet ? squareFeet : calculated.squareFeet ?? ""}
                            onChange={(e) => setSquareFeet(e.target.value)}
                            disabled={saving || !overrideSquareFeet}
                        />

                        <label className={glob.label}>
                            <input
                                type="checkbox"
                                checked={overrideSquareFeet}
                                disabled={saving}
                                onChange={(e) => {
                                    if (e.target.checked) setSquareFeet(calculated.squareFeet?.toString() ?? "");
                                    setOverrideSquareFeet(e.target.checked);
                                }} />{" "}Manually override square footage
                        </label>
                    </div>

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Linear Feet (lin ft)</label>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className={glob.input}
                            value={overrideLinearFeet ? linearFeet : calculated.linearFeet ?? ""}
                            onChange={(e) => setLinearFeet(e.target.value)}
                            disabled={saving || !overrideLinearFeet}
                        />

                        <label className={glob.label}>
                            <input
                                type="checkbox"
                                checked={overrideLinearFeet}
                                disabled={saving}
                                onChange={(e) => {
                                    if (e.target.checked) setLinearFeet(calculated.linearFeet?.toString() ?? "");
                                    setOverrideLinearFeet(e.target.checked);
                                }} />{" "}Manually override linear footage
                        </label>
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

                    <div className={glob.fieldGroup}>
                        <label className={glob.label}>Result:</label>
                        <p>
                            {totals.squareFeet === null ? "-" : formatMeasurementNumber(totals.squareFeet)} sq ft
                            {" | "}{totals.linearFeet === null ? "-" : formatMeasurementNumber(totals.linearFeet)} lin ft
                        </p>
                    </div>

                    <div className={glob.modalActions}>
                        <button
                            type="button"
                            className={glob.buttonTwo}
                            onClick={closeForm}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className={glob.button}
                            disabled={saving}
                        >
                            {saving ? <Loader size={16} /> : editingMeasId ? "Save Changes" : "Add Measurement"}
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
                    You have unsaved changes to this measurement.
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
                            closeForm();
                        }}
                    >
                        Discard Changes
                    </button>
                </div>
            </AppModal>

            <AppModal
                open={measurementToRemove !== null}
                title="Remove Measurement"
                onClose={() => setMeasurementToRemove(null)}
                busy={removingMeasurementId !== null}
            >
                <p>
                    Are you sure you want to remove{" "}
                    <strong>{(measurementToRemove ? typeLabel(measurementToRemove.measurement_type) : "this measurement")}</strong>{" "}
                    from this estimate?
                </p>

                <div className={glob.modalActions}>
                    <button
                        type="button"
                        className={glob.buttonTwo}
                        onClick={() => setMeasurementToRemove(null)}
                        disabled={removingMeasurementId !== null}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className={glob.button}
                        onClick={() => void confirmRemove()}
                        disabled={removingMeasurementId !== null}
                    >
                        {removingMeasurementId !== null ? <Loader size={16} /> : "Remove Measurement"}
                    </button>
                </div>
            </AppModal>
        </>
    );
}