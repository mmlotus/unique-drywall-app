import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { UnitFormData } from "@/types";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        const body = (await request.json()) as | UnitFormData | { isArchived: boolean };

        if ("isArchived" in body) {
            const [unit] = await sql`
                UPDATE units
                SET
                    is_archived = ${body.isArchived},
                    updated_at = NOW()
                WHERE id = ${id}
                RETURNING
                    id,
                    name,
                    abbreviation,
                    display_order,
                    is_archived,
                    created_at,
                    updated_at
            `;

            if (!unit) return jsonError("Unit not found.", 404);

            return jsonOk(unit);
        }

        const name = cleanString(body.name);
        const abbreviation = cleanString(body.abbreviation);

        if (!name) return jsonError("Unit name is required.", 400);

        const [unit] = await sql`
            UPDATE units
            SET
                name = ${name},
                abbreviation = ${abbreviation},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING
                id,
                name,
                abbreviation,
                display_order,
                is_archived,
                created_at,
                updated_at
        `;

        if (!unit) return jsonError("Unit not found.", 404);

        return jsonOk(unit);
    } catch (err) {
        return serverError("PATCH /api/units/[id]", err);
    }
}