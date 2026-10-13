import { jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { uuidPattern } from "@/lib/constants/other";
import { sql } from "@/lib/db";
import { EstimateMaterial, EstimateMaterialRouteContext, UpdateEstimateMaterialBody } from "@/types";

export async function PATCH(req: Request, context: EstimateMaterialRouteContext) {
    try {
        const { id, estMatId } = await context.params;
        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");
        if (!uuidPattern.test(estMatId)) return jsonError("Invalid estimate material ID.");

        let body: UpdateEstimateMaterialBody;

        try {
            body = await req.json();
            if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Invalid material data.");
        } catch {
            return jsonError("Invalid material data.");
        }

        if (body.quantity !== undefined &&
            (typeof body.quantity !== "number" || !Number.isFinite(body.quantity) || body.quantity < 0)) {
            return jsonError("Quantity must be zero or greater.");
        }

        if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") return jsonError("Invalid notes.");

        const estimates = await sql`
            SELECT id, status
            FROM estimates
            WHERE id = ${id}
            LIMIT 1
        `;

        if (!estimates.length) return jsonError("Estimate not found.", 404);
        if (estimates[0].status !== "draft") return jsonError("Only draft estimates can be edited.", 409);

        const existing = await sql`
            SELECT em.*
            FROM estimate_materials em
            JOIN estimate_areas ea
                ON ea.id = em.estimate_area_id
            WHERE em.id = ${estMatId}
                AND ea.estimate_id = ${id}
            LIMIT 1
        `;

        if (!existing.length) return jsonError("Estimate material not found.", 404);

        const current = existing[0];
        const quantity = body.quantity ?? Number(current.quantity);
        const coverage = current.coverage_per_unit === null ? null : Number(current.coverage_per_unit);
        const price = current.unit_price === null ? 0 : Number(current.unit_price);
        const notes = body.notes === undefined ? current.notes : body.notes?.trim() || null;

        const updated = await sql`
            UPDATE estimate_materials em
            SET
                quantity = ${quantity},
                quantity_overridden = ${body.quantity !== undefined ? true : current.quantity_overridden},
                total_coverage = ${coverage === null ? null : quantity * coverage},
                line_total = ${Number((quantity * price).toFixed(2))},
                notes = ${notes},
                updated_at = NOW()
            FROM estimate_areas ea, estimates e
            WHERE em.id = ${estMatId}
                AND ea.id = em.estimate_area_id
                AND ea.estimate_id = e.id
                AND e.id = ${id}
                    AND e.status = 'draft'
            RETURNING em.*
        `;

        if (!updated.length) return jsonError("Estimate material could not be updated.", 409);
        return jsonOk(updated[0] as EstimateMaterial);
    } catch (err) {
        return serverError("PATCH /api/estimates/[id]/materials/[estMatId]", err);
    }
}

export async function DELETE(_req: Request, context: EstimateMaterialRouteContext) {
    try {
        const { id, estMatId } = await context.params;
        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");
        if (!uuidPattern.test(estMatId)) return jsonError("Invalid estimate material ID.");

        const estimates = await sql`
            SELECT id, status
            FROM estimates
            WHERE id = ${id}
            LIMIT 1
        `;

        if (!estimates.length) return jsonError("Estimate not found.", 404);
        if (estimates[0].status !== "draft") return jsonError("Only draft estimates can be edited.", 409);

        const deleted = await sql`
            DELETE FROM estimate_materials em
            USING estimate_areas ea, estimates e
            WHERE em.id = ${estMatId}
                AND ea.id = em.estimate_area_id
                AND ea.estimate_id = e.id
                AND e.id = ${id}
                    AND e.status = 'draft'
            RETURNING em.id
        `;

        if (!deleted.length) return jsonError("Estimate material not found.", 404);
        return jsonOk({ success: true });
    } catch (err) {
        return serverError("DELETE /api/estimates/[id]/materials/[estMatId]", err);
    }
}