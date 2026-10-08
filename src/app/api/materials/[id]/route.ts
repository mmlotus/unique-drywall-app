import { cleanNullableNumber, cleanNullableString, cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { MaterialFormData } from "@/types";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        const body = (await req.json()) as | MaterialFormData | { isArchived: boolean };

        if ("isArchived" in body) {
            const [mat] = await sql`
                UPDATE materials
                SET
                    is_archived = ${body.isArchived},
                    updated_at = NOW()
                WHERE id = ${id}
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

            if (!mat) return jsonError("Material not found.", 404);

            return jsonOk(mat);
        }

        const name = cleanString(body.name);

        if (!name) return jsonError("Material Name is required.", 400);

        if (body.calculationMethod === "custom_formula" && !cleanString(body.customFormula)) {
            return jsonError("Custom Formula is required when Calculation Method is Custom Formula.", 400);
        }

        if (cleanNullableString(body.parentMaterialId) === id) return jsonError("A material cannot be its own parent.", 400);

        const [mat] = await sql`
                UPDATE materials
                SET
                    parent_material_id = ${cleanNullableString(body.parentMaterialId)},
                    name = ${name},
                    category_id = ${cleanNullableString(body.categoryId)},
                    unit_id = ${cleanNullableString(body.unitId)},
                    size_label = ${cleanString(body.sizeLabel)},
                    width = ${cleanNullableNumber(body.width)},
                    length = ${cleanNullableNumber(body.length)},
                    thickness = ${cleanNullableNumber(body.thickness)},
                    coverage_per_unit = ${cleanNullableNumber(body.coveragePerUnit)},
                    cost = ${cleanNullableNumber(body.cost)},
                    sell_price = ${cleanNullableNumber(body.sellPrice)},
                    markup_percent = ${cleanNullableNumber(body.markupPercent)},
                    calculation_method = ${body.calculationMethod},
                    custom_formula = ${cleanString(body.customFormula)},
                    notes = ${cleanString(body.notes)},
                    updated_at =  NOW()
                WHERE id = ${id}
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

        if (!mat) return jsonError("Material not found.", 404);

        return jsonOk(mat);
    } catch (err) {
        return serverError("PATCH /api/materials/[id]", err);
    }
}