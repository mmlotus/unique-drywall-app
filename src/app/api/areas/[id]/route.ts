import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { AreaFormData } from "@/types/areas";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        const body = (await request.json()) as | AreaFormData | { isArchived: boolean };

        if ("isArchived" in body) {
            const [area] = await sql`
                UPDATE areas
                SET
                    is_archived = ${body.isArchived},
                    updated_at = NOW()
                WHERE id = ${id}
                RETURNING
                    id,
                    name,
                    notes,
                    display_order,
                    is_archived,
                    created_at,
                    updated_at
            `;

            if (!area) return jsonError("Area/Room not found.", 404);

            return jsonOk(area);
        }

        const name = cleanString(body.name);

        if (!name) return jsonError("Area/Room Name is required.", 400);

        const [area] = await sql`
            UPDATE areas
            SET
                name = ${name},
                notes = ${cleanString(body.notes)},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING
                id,
                name,
                notes,
                display_order,
                is_archived,
                created_at,
                updated_at
        `;

        if (!area) return jsonError("Area/Room not found.", 404);

        return jsonOk(area);
    } catch (err) {
        return serverError("PATCH /api/areas/[id]", err);
    }
}