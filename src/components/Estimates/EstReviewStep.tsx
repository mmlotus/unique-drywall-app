"use client";

import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import rev from "@/styles/EstReview.module.css";
import toast from "react-hot-toast";
import { EstimateArea, EstimateMaterial, EstimateMeasurement, EstReviewStepProps } from "@/types";
import { useEffect, useState } from "react";
import LoadingSpinner from "../LoadingSpinner";
import { formatPhone } from "@/lib/formatters/phone";
import { money, numberText } from "@/lib/constants/other";
import { formatDate } from "@/lib/formatters/date";
import { toProperCase } from "@/lib/formatters/text";
import { Loader, Save } from "lucide-react";

export default function EstReviewStep({
    estimateId,
    estimate,
    customers,
    builders,
    editable,
    onEstimateUpdated,
    onBusyChange,
}: EstReviewStepProps) {
    const [areas, setAreas] = useState<EstimateArea[]>([]);
    const [measurements, setMeasurements] = useState<EstimateMeasurement[]>([]);
    const [materials, setMaterials] = useState<EstimateMaterial[]>([]);
    const [estNumber, setEstNumber] = useState(estimate.estimate_number ?? "");
    const [savingNum, setSavingNum] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadReview() {
            const urls = [
                `/api/estimates/${estimateId}/areas`,
                `/api/estimates/${estimateId}/measurements`,
                `/api/estimates/${estimateId}/materials`,
            ];

            const res = await Promise.all(urls.map((url) => fetch(url)));
            const data = await Promise.all(res.map((res) => res.json()));

            for (let i = 0; i < res.length; i++) {
                if (!res[i].ok) throw new Error(data[i].error || "Failed to load estimate review.");
            }

            return data;
        }

        loadReview()
            .then(([a, m, mat]) => {
                if (cancelled) return;
                setAreas(a as EstimateArea[]);
                setMeasurements(m as EstimateMeasurement[]);
                setMaterials(mat as EstimateMaterial[]);
                setLoadFailed(false);
            })
            .catch((err) => {
                if (!cancelled) {
                    setLoadFailed(true);
                    toast.error(err instanceof Error ? err.message : "Failed to load estimate review.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [estimateId]);

    async function saveEstNumber() {
        if (!editable || savingNum) return;

        const value = estNumber.trim();

        if (value && value === (estimate.estimate_number ?? "")) return;

        setSavingNum(true);
        onBusyChange(true);

        try {
            const res = await fetch(`/api/estimates/${estimateId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estimateNumber: value || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save estimate number.");

            setEstNumber(data.estimate_number ?? "");
            toast.success("Estimate number saved.", { duration: 4000 });
            onEstimateUpdated(data);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to save estimate number.");
        } finally {
            setSavingNum(false);
            onBusyChange(false);
        }
    }

    if (loading) return <LoadingSpinner />;
    if (loadFailed) {
        return (
            <p className={libs.emptyState}>Could not load the estimate rview. Please try opening this step again.</p>
        );
    }

    const customer = customers.find((c) => c.id === estimate.customer_id);
    const builder = builders.find((b) => b.id === estimate.builder_firm_id);

    const customerName = customer?.name ?? "Unknown Customer";
    const builderName = builder?.name ?? "None";

    const contactPhone = estimate.primary_contact_type === "custom"
        ? estimate.custom_contact_phone
        : estimate.primary_contact_type === "builder"
            ? builder?.phone
            : customer?.phone;

    const contactEmail = estimate.primary_contact_type === "custom"
        ? estimate.custom_contact_email
        : estimate.primary_contact_type === "builder"
            ? builder?.email
            : customer?.email;

    const contactName = estimate.primary_contact_type === "custom"
        ? estimate.custom_contact_name || "Not Provided"
        : estimate.primary_contact_type === "builder" ? builderName : customerName;

    const contactType = estimate.primary_contact_type === "builder"
        ? "Builder/Firm"
        : estimate.primary_contact_type === "custom" ? "Different Contact" : "Customer";

    const jobAddress = [
        estimate.job_site_address,
        [estimate.job_site_city, estimate.job_site_state].filter(Boolean).join(", "),
        estimate.job_site_zip,
    ].filter(Boolean).join("\n");

    const sortedAreas = [...areas].sort((a, b) => a.display_order - b.display_order);
    const totalSqFt = measurements.reduce((sum, m) => sum + Number(m.square_feet ?? 0), 0);
    const totalLinFt = measurements.reduce((sum, m) => sum + Number(m.linear_feet ?? 0), 0);
    const materialsTotal = materials.reduce((sum, m) => sum + Number(m.line_total ?? 0), 0);

    return (
        <>
            <main className={rev.review}>
                <header className={rev.documentHeader}>
                    <div>
                        <p className={rev.eyebrow}>ESTIMATE REVIEW</p>
                        <p className={rev.muted}>Review the information below. Use Back to make changes or Save &amp; Exit to continue later.</p>

                        <br />

                        <div className={rev.infoBlock}>
                            <div className={rev.estNumRow}>
                                <label className={glob.label}>Estimate #</label>
                                <input
                                    type="text"
                                    className={glob.input}
                                    value={estNumber}
                                    onChange={(e) => setEstNumber(e.target.value)}
                                    disabled={!editable || savingNum}
                                    placeholder="Leave blank to auto-assign"
                                />

                                <div className={rev.estNumAction}>
                                    {editable && estNumber.trim() !== "" && estNumber.trim() !== (estimate.estimate_number ?? "") && (
                                        <button
                                            type="button"
                                            className={glob.iconButton}
                                            onClick={saveEstNumber}
                                            disabled={savingNum}
                                        >
                                            {savingNum ? <Loader size={16} /> : estNumber.trim() ? <Save size={16} /> : ""}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={rev.documentMeta}>
                        <p><label className={glob.label}>Estimate Date</label> {formatDate(estimate.estimate_date.slice(0, 10))}</p>
                        <p><label className={glob.label}>Revision</label> {estimate.current_revision}</p>
                        <p><label className={glob.label}>Status</label> {toProperCase(estimate.status)}</p>
                    </div>
                </header>

                <section className={rev.parties} aria-label="Estimate Details">
                    <div className={rev.infoBlock}>
                        <h3 className={libs.sectionHeading}>Customer &amp; Contact</h3>

                        <div className={rev.detail}>
                            <label className={glob.label}>Customer:</label>
                            <p>{customerName}</p>
                        </div>

                        <div className={rev.detail}>
                            <label className={glob.label}>Builder/Firm:</label>
                            <p>{builderName}</p>
                        </div>

                        <div className={rev.detail}>
                            <label className={glob.label}>Primary Contact:</label>
                            {estimate.primary_contact_type === "custom" ? (
                                <p>{contactName}</p>
                            ) : (
                                <p>{contactType}</p>
                            )}
                        </div>

                        {contactPhone && (
                            <div className={rev.detail}>
                                <label className={glob.label}>Phone</label>
                                <p>{formatPhone(contactPhone)}</p>
                            </div>
                        )}

                        {contactEmail && (
                            <div className={rev.detail}>
                                <label className={glob.label}>Email</label>
                                <p>{contactEmail}</p>
                            </div>
                        )}
                    </div>

                    <div className={rev.infoBlock}>
                        <h3 className={libs.sectionHeading}>Job Site</h3>
                        <div className={rev.detail}>
                            <label className={glob.label}>Address</label>
                            <p className={rev.address}>{jobAddress || "Not Provided"}</p>
                        </div>

                        {estimate.notes && (
                            <div className={rev.detail}>
                                <label className={glob.label}>Notes</label>
                                <p>{estimate.notes}</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className={rev.scopeSection}>
                    <div className={rev.sectionHeading}>
                        <h3 className={libs.sectionHeading}>Scope of Work</h3>
                        <p className={rev.muted}>{sortedAreas.length} areas/rooms</p>
                    </div>

                    {sortedAreas.length === 0 && <p className={rev.empty}>No rooms added yet.</p>}

                    {sortedAreas.map((area) => {
                        const roomMeasurements = measurements
                            .filter((m) => m.estimate_area_id === area.id)
                            .sort((a, b) => a.display_order - b.display_order);
                        const roomMaterials = materials
                            .filter((m) => m.estimate_area_id === area.id)
                            .sort((a, b) => a.display_order - b.display_order);
                        const roomSqFt = roomMeasurements.reduce((sum, m) => sum + Number(m.square_feet ?? 0), 0);
                        const roomLinFt = roomMeasurements.reduce((sum, m) => sum + Number(m.linear_feet ?? 0), 0);
                        const roomTotal = roomMaterials.reduce((sum, m) => sum + Number(m.line_total ?? 0), 0);

                        return (
                            <section className={rev.room} key={area.id}>
                                <div className={rev.roomHeader}>
                                    <h4>{area.display_label}</h4>
                                    <p>{numberText(roomSqFt)} sq ft <span aria-hidden="true">·</span> {numberText(roomLinFt)} lin ft</p>
                                </div>

                                {area.notes && <p className={rev.roomNote}>{area.notes}</p>}

                                <h5 className={rev.subheading}>Measurements</h5>

                                {roomMeasurements.length === 0 ? (
                                    <p className={rev.empty}>No measurements saved.</p>
                                ) : (
                                    <>
                                        <div className={rev.tableScroll}>
                                            <table className={rev.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Description</th>
                                                        <th>Dimensions</th>
                                                        <th className={rev.numeric}>Qty</th>
                                                        <th className={rev.numeric}>Sq Ft</th>
                                                        <th className={rev.numeric}>Lin Ft</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {roomMeasurements.map((m) => (
                                                        <tr key={m.id}>
                                                            <td>
                                                                <strong>
                                                                    {m.description ||
                                                                        m.measurement_type.charAt(0).toUpperCase()
                                                                        + m.measurement_type.slice(1)
                                                                    }
                                                                </strong>
                                                                {m.notes && <p className={rev.cellNote}>{m.notes}</p>}
                                                            </td>

                                                            <td>{[

                                                                m.length_ft !== null ? `L ${numberText(Number(m.length_ft))} ft` : null,
                                                                m.width_ft !== null ? `W ${numberText(Number(m.width_ft))} ft` : null,
                                                                m.height_ft !== null ? `H ${numberText(Number(m.height_ft))} ft` : null,
                                                            ].filter(Boolean).join(" × ") || "-"}
                                                            </td>

                                                            <td className={rev.numeric}>{numberText(Number(m.quantity))}</td>
                                                            <td className={rev.numeric}>{m.square_feet === null ? "-" : numberText(Number(m.square_feet))}</td>
                                                            <td className={rev.numeric}>{m.linear_feet === null ? "-" : numberText(Number(m.linear_feet))}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>

                                                <tfoot>
                                                    <tr>
                                                        <td colSpan={3}>Room Measurements</td>
                                                        <td className={rev.numeric}>{numberText(roomSqFt)}</td>
                                                        <td className={rev.numeric}>{numberText(roomLinFt)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        <div className={rev.mobileList}>
                                            {roomMeasurements.map((m) => (
                                                <article className={rev.mobileItem} key={m.id}>
                                                    <h6>
                                                        {m.description ||
                                                            m.measurement_type.charAt(0).toUpperCase()
                                                            + m.measurement_type.slice(1)
                                                        }
                                                    </h6>
                                                    <p className={rev.mobileDimensions}>
                                                        {[
                                                            m.length_ft !== null ? `L ${numberText(Number(m.length_ft))} ft` : null,
                                                            m.width_ft !== null ? `W ${numberText(Number(m.width_ft))} ft` : null,
                                                            m.height_ft !== null ? `H ${numberText(Number(m.height_ft))} ft` : null,
                                                        ].filter(Boolean).join(" × ") || "No dimensions"}
                                                    </p>
                                                    <div className={rev.mobileRow}>
                                                        <p>Qty: {numberText(Number(m.quantity))}</p>
                                                        <p>{m.square_feet === null ? "-" : numberText(Number(m.square_feet))} sq ft · {m.linear_feet === null ? "-" : numberText(Number(m.linear_feet))} lin ft</p>
                                                    </div>
                                                    {m.notes && <p className={rev.cellNote}>{m.notes}</p>}
                                                </article>
                                            ))}
                                            <div className={rev.mobileSubtotal}>
                                                <strong>Full Room Measurements</strong>
                                                <strong>{numberText(roomSqFt)} sq ft · {numberText(roomLinFt)} lin ft</strong>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <h5 className={rev.subheading}>Materials</h5>

                                {roomMaterials.length === 0 ? (
                                    <p className={rev.empty}>No materials saved.</p>
                                ) : (
                                    <>
                                        <div className={rev.tableScroll}>
                                            <table className={rev.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Material</th>
                                                        <th className={rev.numeric}>Qty</th>
                                                        <th>Unit</th>
                                                        <th className={rev.numeric}>Unit Price</th>
                                                        <th className={rev.numeric}>Amount</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {roomMaterials.map((m) => (
                                                        <tr key={m.id}>
                                                            <td>
                                                                <strong>{m.material_name}{m.variant_name ? ` - ${m.variant_name}` : ""}</strong>
                                                                {m.notes && <p className={rev.cellNote}>{m.notes}</p>}
                                                            </td>
                                                            <td className={rev.numeric}>{numberText(Number(m.quantity))}</td>
                                                            <td>{m.unit_name || "-"}</td>
                                                            <td className={rev.numeric}>{m.unit_price === null ? "Not Set" : money(Number(m.unit_price))}</td>
                                                            <td className={rev.numeric}>{money(Number(m.line_total ?? 0))}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>

                                                <tfoot>
                                                    <tr>
                                                        <td colSpan={4}>Room Materials Total</td>
                                                        <td className={rev.numeric}>{money(roomTotal)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        <div className={rev.mobileList}>
                                            {roomMaterials.map((m) => (
                                                <article className={rev.mobileItem} key={m.id}>
                                                    <h6>{m.material_name}{m.variant_name ? ` - ${m.variant_name}` : ""}</h6>
                                                    <div className={rev.mobileRow}>
                                                        <p>Qty: {numberText(Number(m.quantity))} {m.unit_name || ""}</p>
                                                        <p>{money(Number(m.line_total ?? 0))}</p>
                                                    </div>
                                                    <p className={rev.mobileMuted}>Unit Price: {m.unit_price === null ? "Not Set" : money(Number(m.unit_price))}</p>
                                                    {m.notes && <p className={rev.cellNote}>{m.notes}</p>}
                                                </article>
                                            ))}
                                            <div className={rev.mobileSubtotal}>
                                                <strong>Room Materials Total</strong>
                                                <strong>{money(roomTotal)}</strong>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>
                        );
                    })}
                </section>

                <section className={rev.summary} aria-label="Estimate Totals">
                    <div className={rev.roomHeader}>
                        <h3>Estimate Summary</h3>
                    </div>

                    <div>
                        <p>{numberText(totalSqFt)} sq ft <span aria-hidden="true">·</span> {numberText(totalLinFt)} lin ft</p>
                        <p className={rev.muted}>Material pricing only; labor is not included.</p>
                    </div>

                    <div className={rev.grandTotal}>
                        <label className={glob.label}>Materials Total</label>
                        <p>{money(materialsTotal)}</p>
                    </div>
                </section>
            </main>
        </>
    );
}