import { isValidUuid, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { EstimateRouteContext, UpdateEstimateStatusBody } from "@/types";

export async function PATCH(req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;

        if (!isValidUuid(id)) return jsonError("Invalid estimate ID.");

        let body: UpdateEstimateStatusBody;

        try {
            body = await req.json();

            if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Invalid request body.");
        } catch {
            return jsonError("Invalid JSON.");
        }

        const keys = Object.keys(body);

        if (keys.length !== 1 || keys[0] !== "status" || !["accepted", "denied"].includes(body.status)) return jsonError("Invalid estimate status.");

        const updated = await sql`
            UPDATE estimates
            SET
                status = ${body.status},
                accepted_at = CASE
                    WHEN ${body.status} = 'accepted'
                    THEN NOW()
                    ELSE NULL
                END,
                denied_at = CASE
                    WHEN ${body.status} = 'denied'
                    THEN NOW()
                    ELSE NULL
                END
            WHERE id = ${id}
                AND status = 'draft'
            RETURNING *
        `;

        if (updated.length === 0) {
            const existing = await sql`
                SELECT id, status
                FROM estimates
                WHERE id = ${id}
            `;

            if (existing.length === 0) return jsonError("Estimate not found.", 404);

            return jsonError("Only draft estimates can be accepted or denied.", 409);
        }

        return jsonOk(updated[0]);
    } catch (err) {
        return serverError("PATCH /api/estimates/[id]/status", err);
    }
}