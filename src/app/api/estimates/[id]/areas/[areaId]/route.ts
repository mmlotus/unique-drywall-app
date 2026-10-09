import { cleanNullableString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { uuidPattern } from "@/lib/constants/other";
import { sql } from "@/lib/db";
import { EstimateAreaRouteContext, UpdateEstimateAreaBody } from "@/types";

export async function PATCH(req: Request, context: EstimateAreaRouteContext) {
    try {
        const { id, areaId } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");
        if (!uuidPattern.test(areaId)) return jsonError("Invalid area ID.");

        let body: UpdateEstimateAreaBody;

        try {
            body = await req.json();

            if (!body || typeof body !== "object" || Array.isArray(body)) {
                return jsonError("Invalid request body.");
            }
        } catch {
            return jsonError("Invalid JSON.");
        }

        const keys = Object.keys(body);
        const allowedFields = ["displayLabel", "notes"];

        if (
            keys.length === 0 ||
            keys.some((key) => !allowedFields.includes(key))
        ) {
            return jsonError("Invalid area update fields.");
        }

        if (
            (body.displayLabel !== undefined && typeof body.displayLabel !== "string") ||
            (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string")
        ) {
            return jsonError("Invalid field value.");
        }

        const hasLabel = Object.prototype.hasOwnProperty.call(body, "displayLabel");
        const hasNotes = Object.prototype.hasOwnProperty.call(body, "notes");

        const displayLabel = body.displayLabel?.trim() ?? "";

        if (hasLabel && !displayLabel) return jsonError("Area/Room label is required.");

        const notes = cleanNullableString(body.notes);

        const [updated] = await sql`
            UPDATE estimate_areas
            SET
                display_label = CASE
                    WHEN ${hasLabel}
                    THEN ${displayLabel}
                    ELSE display_label
                END,
                notes = CASE
                    WHEN ${hasNotes}
                    THEN ${notes}
                    ELSE notes
                END
            WHERE id = ${areaId}
                AND estimate_id = ${id}
                AND EXISTS (
                    SELECT 1
                    FROM estimates
                    WHERE estimates.id = ${id}
                        AND estimates.status = 'draft'
                )
            RETURNING
                id,
                estimate_id,
                area_id,
                area_name,
                instance_number,
                display_label,
                display_order,
                notes
        `;

        if (!updated) return jsonError("Area/Room not found or estimate is not editable.", 404);

        return jsonOk(updated);
    } catch (err) {
        return serverError("PATCH /api/estimates/[id]/areas/[areaId]", err);
    }
}

export async function DELETE(_req: Request, context: EstimateAreaRouteContext) {
    try {
        const { id, areaId } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");
        if (!uuidPattern.test(areaId)) return jsonError("Invalid area ID.");

        const estimates = await sql`
            SELECT id, status
            FROM estimates
            WHERE id = ${id}
        `;

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);
        if (estimates[0].status !== "draft") return jsonError("Only draft estimates can be edited. Reopen this estimate before making changes.", 409);

        const [area] = await sql`
            SELECT id
            FROM estimate_areas
            WHERE id = ${areaId}
                AND estimate_id = ${id}
        `;

        if (!area) return jsonError("Area/Room not found.", 404);

        const [dependencies] = await sql`
            SELECT
                (
                    SELECT COUNT(*)::integer
                    FROM estimate_measurements
                    WHERE estimate_area_id = ${areaId}
                ) AS measurement_count,
                (
                    SELECT COUNT(*)::integer
                    FROM estimate_materials
                    WHERE estimate_area_id = ${areaId}
                ) AS material_count
        `;

        if (
            Number(dependencies.measurement_count) > 0 ||
            Number(dependencies.material_count) > 0
        ) {
            return jsonError("This area contains measurements or materials and cannot be removed until those items are removed.", 409);
        }

        const [deleted] = await sql`
                DELETE FROM estimate_areas
                WHERE id = ${areaId}
                    AND estimate_id = ${id}
                    AND EXISTS (
                        SELECT 1
                        FROM estimates
                        WHERE estimates.id = ${id}
                            AND estimates.status = 'draft'
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM estimate_measurements
                        WHERE estimate_area_id = ${areaId}
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM estimate_materials
                        WHERE estimate_area_id = ${areaId}
                    )
                RETURNING id
            `;

        if (!deleted) return jsonError("Area/Room could not be removed. Refresh and try again.", 409);

        return jsonOk({ id: deleted.id });
    } catch (err) {
        return serverError("DELETE /api/estimates/[id]/areas/[areaId]", err);
    }
}