import { cleanNullableString, isValidUuid, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { CreateEstimateRevisionBody, EstimateRouteContext } from "@/types";

export async function GET(_req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;

        if (!isValidUuid(id)) return jsonError("Invalid estimate ID.");

        const estimates = await sql`
            SELECT id
            FROM estimates
            WHERE id = ${id}
        `;

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);

        const revisions = await sql`
            SELECT
                id,
                estimate_id,
                revision_number,
                revision_notes,
                created_at
            FROM estimate_revisions
            WHERE estimate_id = ${id}
            ORDER BY revision_number DESC
        `;

        return jsonOk(revisions);
    } catch (err) {
        return serverError("GET /api/estimates/[id]/revisions", err);
    }
}

export async function POST(req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;

        if (!isValidUuid(id)) return jsonError("Invalid estimate ID.");

        let body: CreateEstimateRevisionBody;

        try {
            body = await req.json();

            if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Invalid request body.");
        } catch {
            return jsonError("Invalid JSON.");
        }

        const keys = Object.keys(body);

        if (keys.some((key) => key !== "notes")) return jsonError("Invalid revision fields.");
        if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") return jsonError("Invalid revision notes.");
        const notes = cleanNullableString(body.notes);

        const result = await sql`
            SELECT start_estimate_revision(
                ${id}::uuid,
                ${notes}
            ) AS revision_number
        `;

        return jsonOk(
            {
                estimateId: id,
                revisionNumber: result[0].revision_number,
                status: "draft",
            },
            201
        );
    } catch (err) {
        return serverError("POST /api/estimates/[id]/revisions", err);
    }
}