import { cleanNullableNumber, cleanNullableString, cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { MaterialFormData } from "@/types";

export async function GET() {
    try {
        const mats = await sql`
            SELECT
                id,
                parent_material_id,
                name,
                category_id,
                unit_id,
                size_label,
                width,
                length,
                thickness,
                coverage_per_unit,
                cost,
                sell_price,
                markup_percent,
                calculation_method,
                custom_formula,
                notes,
                display_order,
                is_archived,
                created_at,
                updated_at
            FROM materials
            ORDER BY LOWER(name), display_order, created_at
        `;

        return jsonOk(mats);
    } catch (err) {
        return serverError("GET /api/materials", err);
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as MaterialFormData;

        const name = cleanString(body.name);

        if (!name) return jsonError("Material Name is required.", 400);

        if (body.calculationMethod === "custom_formula" && !cleanString(body.customFormula)) {
            return jsonError("Custom Formula is required when Calculation Method is Custom Formula.", 400);
        }

        const [mat] = await sql`
            INSERT INTO materials (
                parent_material_id,
                name,
                category_id,
                unit_id,
                size_label,
                width,
                length,
                thickness,
                coverage_per_unit,
                cost,
                sell_price,
                markup_percent,
                calculation_method,
                custom_formula,
                notes,
                display_order
            )
            VALUES (
                ${cleanNullableString(body.parentMaterialId)},
                ${name},
                ${cleanNullableString(body.categoryId)},
                ${cleanNullableString(body.unitId)},
                ${cleanString(body.sizeLabel)},
                ${cleanNullableNumber(body.width)},
                ${cleanNullableNumber(body.length)},
                ${cleanNullableNumber(body.thickness)},
                ${cleanNullableNumber(body.coveragePerUnit)},
                ${cleanNullableNumber(body.cost)},
                ${cleanNullableNumber(body.sellPrice)},
                ${cleanNullableNumber(body.markupPercent)},
                ${body.calculationMethod},
                ${cleanString(body.customFormula)},
                ${cleanString(body.notes)},
                (
                    SELECT COALESCE(MAX(display_order), 0) + 1
                    FROM materials
                )
            )
            RETURNING
                id,
                parent_material_id,
                name,
                category_id,
                unit_id,
                size_label,
                width,
                length,
                thickness,
                coverage_per_unit,
                cost,
                sell_price,
                markup_percent,
                calculation_method,
                custom_formula,
                notes,
                display_order,
                is_archived,
                created_at,
                updated_at
        `;

        return jsonOk(mat, 201);
    } catch (err) {
        return serverError("POST /api/materials", err);
    }
}