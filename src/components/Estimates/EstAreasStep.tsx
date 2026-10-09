"use client";

import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import est from "@/styles/Estimates.module.css";
import { Area, CreateEstimateAreaBody, EstimateArea } from "@/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "../LoadingSpinner";
import { Loader, Pencil, Save, Trash2, X } from "lucide-react";

type EstimateAreasStepProps = {
    estimateId: string;
    editable: boolean;
};

export default function EstimateAreasStep({ estimateId, editable }: EstimateAreasStepProps) {
    const [libAreas, setLibAreas] = useState<Area[]>([]);
    const [estAreas, setEstAreas] = useState<EstimateArea[]>([]);

    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [updatingAreaId, setUpdatingAreaId] = useState<string | null>(null);
    const [removingAreaId, setRemovingAreaId] = useState<string | null>(null);

    const [showCustomRoom, setShowCustomRoom] = useState(false);
    const [customRoomName, setCustomRoomName] = useState("");
    const [customRoomNotes, setCustomRoomNotes] = useState("");
    const [saveCustomToLib, setSaveCustomToLib] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            const [libRes, estRes] = await Promise.all([
                fetch("/api/areas"),
                fetch(`/api/estimates/${estimateId}/areas`),
            ]);

            const libData = await libRes.json();
            const estData = await estRes.json();

            if (!libRes.ok) throw new Error(libData.error || "Failed to load Areas/Rooms Library.");
            if (!estRes.ok) throw new Error(estData.error || "Failed to load estimate areas.");

            return {
                library: libData as Area[],
                estimate: estData as EstimateArea[],
            };
        }

        loadData()
            .then((data) => {
                if (cancelled) return;

                setLibAreas(data.library);
                setEstAreas(data.estimate);
            })
            .catch((err) => {
                console.error(err);

                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : "Failed to load Areas/Rooms.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [estimateId]);

    async function handleAddArea(areaId: string) {
        if (!editable || adding || updatingAreaId || removingAreaId) return;

        try {
            setAdding(true);

            const body: CreateEstimateAreaBody = {
                areaId,
            };

            const res = await fetch(`/api/estimates/${estimateId}/areas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to add area/room.");

            setEstAreas((current) => [
                ...current,
                data as EstimateArea,
            ]);

            toast.success("Area/Room added!");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to add area/room.");
        } finally {
            setAdding(false);
        }
    }

    function startEditing(area: EstimateArea) {
        setEditingAreaId(area.id);
        setEditLabel(area.display_label);
        setEditNotes(area.notes ?? "");
    }

    function cancelEditing() {
        setEditingAreaId(null);
        setEditLabel("");
        setEditNotes("");
    }

    async function handleUpdateArea(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!editable || !editingAreaId) return;
        if (!editLabel.trim()) {
            toast.error("Area/Room label is required.");
            return;
        }

        try {
            setUpdatingAreaId(editingAreaId);

            const res = await fetch(`/api/estimates/${estimateId}/areas/${editingAreaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayLabel: editLabel.trim(),
                    notes: editNotes.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to update area/room.");

            setEstAreas((current) => current.map((area) =>
                area.id === editingAreaId
                    ? (data as EstimateArea)
                    : area
            ));

            cancelEditing();
            toast.success("Area/Room updated!");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to update area/room.");
        } finally {
            setUpdatingAreaId(null);
        }
    }

    async function handleRemoveArea(area: EstimateArea) {
        if (!editable || removingAreaId || updatingAreaId || adding) return;

        const confirmed = window.confirm(
            `Remove "${area.display_label}" from this estimate?`
        );

        if (!confirmed) return;

        try {
            setRemovingAreaId(area.id);

            const res = await fetch(`/api/estimates/${estimateId}/areas/${area.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to remove area/room.");

            setEstAreas((current) => current.filter((item) => item.id !== area.id));

            if (editingAreaId === area.id) cancelEditing();

            toast.success("Area/Room removed!");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to remove area/room from this estimate.");
        } finally {
            setRemovingAreaId(null);
        }
    }

    function resetCustomRoom() {
        setCustomRoomName("");
        setCustomRoomNotes("");
        setSaveCustomToLib(false);
        setShowCustomRoom(false);
    }

    async function handleAddCustomRoom(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!editable || adding || updatingAreaId || removingAreaId) return;

        if (!customRoomName.trim()) {
            toast.error("Area/Room Name is required.");
            return;
        }

        try {
            setAdding(true);

            const body: CreateEstimateAreaBody = {
                name: customRoomName.trim(),
                notes: customRoomNotes.trim(),
                saveToLibrary: saveCustomToLib,
            };

            const res = await fetch(`/api/estimates/${estimateId}/areas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to add custom room.");

            setEstAreas((current) => [
                ...current,
                data as EstimateArea,
            ]);

            resetCustomRoom();
            toast.success("Custom Area/Room added!");

            if (body.saveToLibrary) {
                try {
                    const libRes = await fetch("/api/areas");
                    const libData = await libRes.json();

                    if (!libRes.ok) throw new Error("Failed to refresh Area/Rooms Library.");

                    setLibAreas(libData as Area[]);
                } catch (err) {
                    console.error(err);
                    toast.error("Room was saved, but the library list could not be refreshed.");
                }
            }
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to add custom room.");
        } finally {
            setAdding(false);
        }
    }

    if (loading) return <LoadingSpinner />;

    const activeAreas = libAreas.filter((area) => !area.is_archived);

    return (
        <main className={libs.section}>
            <h2 className={libs.sectionHeading}>Areas/Rooms</h2>

            <p>Tap an area or room to add it to this estimate. You can add the same room more than once.</p>

            {editable && (
                <>
                    <section className={libs.section}>
                        {activeAreas.length === 0 ? (
                            <p className={libs.emptyState}>
                                No active Areas/Rooms available. Please visit your Areas/Rooms Library to change this.
                            </p>
                        ) : (
                            <div className={est.selectionGrid}>
                                {activeAreas.map((area) => (
                                    <button
                                        key={area.id}
                                        type="button"
                                        className={`${glob.button} ${est.selectionTile}`}
                                        onClick={() => void handleAddArea(area.id)}
                                        disabled={adding || updatingAreaId !== null || removingAreaId !== null}
                                    >
                                        {area.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={libs.section}>
                        {!showCustomRoom ? (
                            <button
                                type="button"
                                className={glob.button}
                                onClick={() => setShowCustomRoom(true)}
                                disabled={adding || updatingAreaId !== null || removingAreaId !== null}
                            >
                                Custom Area/Room
                            </button>
                        ) : (
                            <form className={glob.form} onSubmit={handleAddCustomRoom}>
                                <h3 className={libs.sectionHeading}>Custom Area/Room</h3>

                                <div className={glob.fieldGroup}>
                                    <label className={glob.label}>Area/Room Name</label>
                                    <input
                                        className={glob.input}
                                        value={customRoomName}
                                        onChange={(e) => setCustomRoomName(e.target.value)}
                                        required
                                        disabled={adding}
                                        placeholder="e.g. Detached Workshop"
                                    />
                                </div>

                                <div className={glob.fieldGroup}>
                                    <label className={glob.label}>Notes</label>
                                    <input
                                        className={glob.input}
                                        value={customRoomNotes}
                                        onChange={(e) => setCustomRoomNotes(e.target.value)}
                                        disabled={adding}
                                    />
                                </div>

                                <div className={glob.fieldGroup}>
                                    <label className={glob.label}>
                                        <input
                                            type="checkbox"
                                            checked={saveCustomToLib}
                                            onChange={(e) => setSaveCustomToLib(e.target.checked)}
                                            disabled={adding}
                                        />
                                        {" "}Save this room to the Areas/Rooms Library
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className={glob.button}
                                    disabled={adding}
                                >
                                    {adding ? (
                                        <Loader size={16} />
                                    ) : (
                                        <>
                                            Add Custom Room
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className={glob.buttonTwo}
                                    onClick={resetCustomRoom}
                                    disabled={adding}
                                >
                                    Cancel
                                </button>
                            </form>
                        )}
                    </section>
                </>
            )}

            <section className={libs.section}>
                <h3 className={libs.sectionHeading}>Added Areas/Rooms ({estAreas.length})</h3>

                {estAreas.length === 0 ? (
                    <p className={libs.emptyState}>
                        No areas or rooms have been added yet.
                    </p>
                ) : (
                    <div className={libs.recordList}>
                        {estAreas.map((area) => (
                            <article
                                key={area.id}
                                className={libs.recordCard}
                            >
                                {editingAreaId === area.id ? (
                                    <form className={glob.form} onSubmit={handleUpdateArea}>
                                        <div className={libs.recordTitleGroup}>
                                            <h3 className={libs.sectionHeading}>Edit Area/Room</h3>

                                            <button
                                                className={glob.iconButton}
                                                type="submit"
                                                disabled={updatingAreaId !== null}
                                            >
                                                {updatingAreaId === area.id ? (
                                                    <Loader size={16} />
                                                ) : (
                                                    <>
                                                        <Save size={16} />
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                className={glob.iconButton}
                                                type="button"
                                                onClick={cancelEditing}
                                                disabled={updatingAreaId !== null}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className={glob.fieldGroup}>
                                            <label className={glob.label}>Display Label</label>
                                            <input
                                                className={glob.input}
                                                value={editLabel}
                                                onChange={(e) => setEditLabel(e.target.value)}
                                                required
                                                disabled={updatingAreaId !== null}
                                            />
                                        </div>

                                        <div className={glob.fieldGroup}>
                                            <label className={glob.label}>Notes</label>
                                            <textarea
                                                className={glob.input}
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                disabled={updatingAreaId !== null}
                                            />
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className={libs.recordTitleRow}>
                                            <div className={libs.recordTitleGroup}>
                                                <h3 className={libs.recordTitle}>
                                                    {area.display_label}
                                                </h3>
                                            </div>

                                            {editable && (
                                                <div className={glob.iconActions}>
                                                    <button
                                                        type="button"
                                                        className={glob.iconButton}
                                                        title="Edit Area/Room"
                                                        disabled={updatingAreaId !== null || removingAreaId !== null}
                                                        onClick={() => startEditing(area)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={glob.iconButton}
                                                        title="Remove Area/Room"
                                                        disabled={updatingAreaId !== null || removingAreaId !== null || adding}
                                                        onClick={() => void handleRemoveArea(area)}
                                                    >
                                                        {removingAreaId === area.id ? (
                                                            <Loader size={16} />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {area.notes && (
                                            <div className={libs.recordDetails}>
                                                <span>{area.notes}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}