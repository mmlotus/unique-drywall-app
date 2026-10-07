import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { UnitFormData } from "@/types";

export async function GET() {
    try {
        const units = await sql`
            SELECT
                id,
                name,
                abbreviation,
                display_order,
                is_archived,
                created_at,
                updated_at
            FROM units
            ORDER BY LOWER(name), display_order, created_at
        `;

        return jsonOk(units);
    } catch (err) {
        return serverError("GET /api/units", err);
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as UnitFormData;

        const name = cleanString(body.name);
        const abbreviation = cleanString(body.abbreviation);

        if (!name) return jsonError("Unit Name is required.");

        const [unit] = await sql`
            INSERT INTO units (
                name,
                abbreviation,
                display_order
            )
            VALUES (
                ${name},
                ${abbreviation},
                (
                    SELECT COALESCE(MAX(display_order), 0) + 1
                    FROM units
                )
            )
            RETURNING
                id,
                name,
                abbreviation,
                display_order,
                is_archived,
                created_at,
                updated_at
        `;

        return jsonOk(unit, 201);
    } catch (err) {
        return serverError("POST /api/units", err);
    }
}