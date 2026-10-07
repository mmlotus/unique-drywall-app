import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { CategoryFormData } from "@/types/categories";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        const body = (await request.json()) as | CategoryFormData | { isArchived: boolean };

        if ("isArchived" in body) {
            const [category] = await sql`
                UPDATE categories
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

            if (!category) return jsonError("Category not found.", 404);

            return jsonOk(category);
        }

        const name = cleanString(body.name);

        if (!name) return jsonError("Category Name is required.", 400);

        const [category] = await sql`
            UPDATE categories
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

        if (!category) return jsonError("Category not found.", 404);

        return jsonOk(category);
    } catch (err) {
        return serverError("PATCH /api/categories/[id]", err);
    }
}