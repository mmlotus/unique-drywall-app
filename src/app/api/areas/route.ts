import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { AreaFormData } from "@/types/areas";

export async function GET() {
    try {
        const areas = await sql`
            SELECT
                id,
                name,
                notes,
                display_order,
                is_archived,
                created_at,
                updated_at
            FROM areas
            ORDER BY LOWER(name), display_order, created_at
        `;

        return jsonOk(areas);
    } catch (err) {
        return serverError("GET /api/areas", err);
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as AreaFormData;

        const name = cleanString(body.name);

        if (!name) return jsonError("Area/Room Name is required.", 400);

        const [area] = await sql`
            INSERT INTO areas (
                name,
                notes,
                display_order
            )
            VALUES (
                ${name},
                ${cleanString(body.notes)},
                (
                    SELECT COALESCE(MAX(display_order), 0) + 1
                    FROM areas
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

        return jsonOk(area, 201);
    } catch (err) {
        return serverError("POST /api/areas", err);
    }
}