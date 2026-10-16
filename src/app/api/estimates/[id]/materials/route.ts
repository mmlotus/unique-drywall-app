import { jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { uuidPattern } from "@/lib/constants/other";
import { sql } from "@/lib/db";
import { calculateSuggestedMatQty } from "@/lib/helpers/estimateMaterialUtils";
import { CreateEstimateMaterialBody, EstimateMaterial, EstimateMeasurement, EstimateRouteContext } from "@/types";

export async function GET(_req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;
        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");

        const estimates = await sql`
            SELECT id
            FROM estimates
            WHERE id = ${id}
            LIMIT 1
        `;

        if (!estimates.length) return jsonError("Estimate not found.", 404);

        const rows = await sql`
            SELECT em.*
            FROM estimate_materials em
            JOIN estimate_areas ea
                ON ea.id = em.estimate_area_id
            WHERE ea.estimate_id = ${id}
            ORDER BY ea.display_order, em.display_order, em.created_at, em.id
        `;

        return jsonOk(rows as EstimateMaterial[]);
    } catch (err) {
        return serverError("GET /api/estimates/[id]/materials", err);
    }
}

export async function POST(req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;
        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");

        let body: CreateEstimateMaterialBody;

        try {
            body = await req.json();

            if (!body || typeof body !== "object" || Array.isArray(body)) {
                return jsonError("Invalid material data.");
            }
        } catch {
            return jsonError("Invalid material data.");
        }

        if (typeof body.estimateAreaId !== "string" || !uuidPattern.test(body.estimateAreaId)) {
            return jsonError("Please select a valid area/room.");
        }

        if (typeof body.materialId !== "string" || !uuidPattern.test(body.materialId)) {
            return jsonError("Please select a valid material.");
        }

        if (body.materialVariantId != null &&
            (typeof body.materialVariantId !== "string" || !uuidPattern.test(body.materialVariantId))) {
            return jsonError("Invalid material variant.");
        }

        if (body.quantity !== undefined &&
            (typeof body.quantity !== "number" || !Number.isFinite(body.quantity) || body.quantity < 0)) {
            return jsonError("Quantity must be zero or greater.");
        }

        if (body.notes != null && typeof body.notes !== "string") return jsonError("Invalid notes.");

        const estimates = await sql`
            SELECT id, status
            FROM estimates
            WHERE id = ${id}
            LIMIT 1
        `;

        if (!estimates.length) return jsonError("Estimate not found.", 404);
        if (estimates[0].status !== "draft") return jsonError("Only draft estimates can be edited.", 409);

        const areas = await sql`
            SELECT id
            FROM estimate_areas
            WHERE id = ${body.estimateAreaId}
                AND estimate_id = ${id}
            LIMIT 1     
        `;

        if (!areas.length) return jsonError("This area does not belong to the estimate.", 404);

        const materials = await sql`
            SELECT
                m.id,
                m.name,
                m.parent_material_id,
                m.calculation_method,
                m.custom_formula,
                m.coverage_per_unit,
                m.quantity_per_unit,
                m.cost,
                m.sell_price,
                m.markup_percent,
                m.unit_id,

                u.name AS unit_name

            FROM materials m
            LEFT JOIN units u
                ON u.id = m.unit_id
            WHERE m.id = ${body.materialId}
                AND m.is_archived = false
            LIMIT 1
        `;

        if (!materials.length) return jsonError("Material not found or archived.", 404);

        const parentMaterialName = String(materials[0].name);
        let material = materials[0];

        let variantName: string | null = null;
        if (body.materialVariantId) {
            const variants = await sql`
                SELECT
                    m.id,
                    m.name,
                    m.parent_material_id,
                    m.calculation_method,
                    m.custom_formula,
                    m.coverage_per_unit,
                    m.quantity_per_unit,
                    m.cost,
                    m.sell_price,
                    m.markup_percent,
                    m.unit_id,

                    u.name AS unit_name

                FROM materials m
                LEFT JOIN units u
                    ON u.id = m.unit_id
                WHERE m.id = ${body.materialVariantId}
                    AND m.parent_material_id = ${body.materialId}
                    AND m.is_archived = false
                LIMIT 1
            `;

            if (!variants.length) return jsonError("Variant does not belong to this material.");
            variantName = String(variants[0].name);
            material = variants[0];
        }

        const measurements = await sql`
            SELECT *
            FROM estimate_measurements
            WHERE estimate_area_id = ${body.estimateAreaId}
            ORDER BY display_order, created_at, id
        `;

        const sourceMaterialQuantity: number | null = null;
        const suggestedQuantity = calculateSuggestedMatQty({
            material: {
                calculation_method: material.calculation_method,
                coverage_per_unit: material.coverage_per_unit === null
                    ? null : Number(material.coverage_per_unit),
                quantity_per_unit: material.quantity_per_unit === null
                    ? null : Number(material.quantity_per_unit),
                custom_formula: material.custom_formula,
            },
            measurements: measurements as EstimateMeasurement[],
            sourceMaterialQuantity,
        });

        const quantity = body.quantity ?? suggestedQuantity ?? 0;
        const quatityOverridden = body.quantity !== undefined;
        const unitCost = material.cost === null ? null : Number(material.cost);
        const unitPrice = material.sell_price === null ? null : Number(material.sell_price);
        const coveragePerUnit = material.coverage_per_unit === null ? null : Number(material.coverage_per_unit);
        const lineTotal = Number((quantity * (unitPrice ?? 0)).toFixed(2));
        const totalCoverage = coveragePerUnit === null ? null : quantity * coveragePerUnit;

        const rows = await sql`
            INSERT INTO estimate_materials (
                estimate_area_id,
                material_id,
                material_variant_id,
                material_name,
                variant_name,
                unit_name,
                calculation_method,
                calculation_settings,
                suggested_quantity,
                quantity,
                quantity_overridden,
                coverage_per_unit,
                total_coverage,
                unit_cost,
                unit_price,
                markup_percent,
                line_total,
                display_order,
                notes
            ) VALUES (
                ${body.estimateAreaId},
                ${body.materialId},
                ${body.materialVariantId ?? null},
                ${parentMaterialName},
                ${variantName},
                ${material.unit_name ?? null},
                ${material.calculation_method},
                '{}'::jsonb,
                ${suggestedQuantity},
                ${quantity},
                ${quatityOverridden},
                ${coveragePerUnit},
                ${totalCoverage},
                ${unitCost},
                ${unitPrice},
                ${material.markup_percent === null ? null : Number(material.markup_percent)},
                ${lineTotal},
                (
                    SELECT COALESCE(MAX(display_order), 0) + 1
                    FROM estimate_materials
                    WHERE estimate_area_id = ${body.estimateAreaId}
                ),
                ${body.notes?.trim() || null}
            )
            RETURNING *
        `;

        return jsonOk(rows[0] as EstimateMaterial, 201);
    } catch (err) {
        return serverError("POST /api/estimates/[id]/materials", err);
    }
}