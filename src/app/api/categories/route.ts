import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { CategoryFormData } from "@/types/categories";

export async function GET() {
    try {
        const categories = await sql`
            SELECT
                id,
                name,
                notes,
                display_order,
                is_archived,
                created_at,
                updated_at
            FROM categories
            ORDER BY display_order, LOWER(name), created_at
        `;

        return jsonOk(categories);
    } catch (err) {
        return serverError("GET /api/categories", err);
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as CategoryFormData;

        const name = cleanString(body.name);

        if (!name) return jsonError("Category Name is required.", 400);

        const [category] = await sql`
            INSERT INTO categories (
                name,
                notes,
                display_order
            )
            VALUES (
                ${name},
                ${cleanString(body.notes)},
                (
                    SELECT COALESCE(MAX(display_order), 0) + 1
                    FROM categories
                )
            )
            RETURNING
                id,
                name,
                notes,
                display_order,
                is_archived,
                created_at,
                updated_at
        `;

        return jsonOk(category, 201);
    } catch (err) {
        return serverError("POST /api/categories", err);
    }
}