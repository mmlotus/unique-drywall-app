import { jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { uuidPattern } from "@/lib/constants/other";
import { sql } from "@/lib/db";
import { calculateMeasurement } from "@/lib/helpers/measurementUtils";
import { EstimateMeasurement, EstimateMeasurementInput, EstimateRouteContext } from "@/types";

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

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);

        const measurements = await sql`
            SELECT
                em.id,
                em.estimate_area_id,
                em.measurement_type,
                em.description,
                em.length_ft,
                em.width_ft,
                em.height_ft,
                em.quantity,
                em.square_feet,
                em.linear_feet,
                em.override_square_feet,
                em.override_linear_feet,
                em.display_order,
                em.notes,
                em.created_at,
                em.updated_at
            FROM estimate_measurements em
            INNER JOIN estimate_areas ea
                ON ea.id = em.estimate_area_id
            WHERE ea.estimate_id = ${id}
            ORDER BY
                ea.display_order,
                em.display_order,
                em.created_at,
                em.id
        `;

        return jsonOk(measurements as EstimateMeasurement[]);
    } catch (err) {
        return serverError("GET /api/estimates/[id]/measurements", err);
    }
}

export async function POST(req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");

        let body: Partial<EstimateMeasurementInput>;

        try {
            body = await req.json();
            if (!body || typeof body !== "object" || Array.isArray(body)) {
                return jsonError("Invalid measurement data.");
            }
        } catch {
            return jsonError("Invalid measurement data.");
        }

        const {
            estimateAreaId,
            measurementType,
            description,
            lengthFt,
            widthFt,
            heightFt,
            quantity,
            squareFeet,
            linearFeet,
            overrideSquareFeet,
            overrideLinearFeet,
            notes,
        } = body;

        if (typeof estimateAreaId !== "string" || !uuidPattern.test(estimateAreaId)) return jsonError("Please select a valid area.");

        if (
            measurementType !== "wall" &&
            measurementType !== "ceiling" &&
            measurementType !== "other"
        ) {
            return jsonError("Please select a measurement type.");
        }

        if (!Number.isInteger(quantity) || quantity! <= 0) return jsonError("Quantity must be a positive whole number.");

        const dimensions = [lengthFt, widthFt, heightFt];

        if (dimensions.some((value) =>
            value !== undefined &&
            value !== null &&
            (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
        )) {
            return jsonError("Dimensions must be positive numbers.");
        }

        if ([squareFeet, linearFeet].some((value) =>
            value !== undefined &&
            value !== null &&
            (typeof value !== "number" || !Number.isFinite(value) || value < 0)
        )) {
            return jsonError("Measurement totals cannot be negative.");
        }

        if (
            (overrideSquareFeet !== undefined && typeof overrideSquareFeet !== "boolean") ||
            (overrideLinearFeet !== undefined && typeof overrideLinearFeet !== "boolean")
        ) {
            return jsonError("Invalid measurement override settings.");
        }

        if (overrideSquareFeet === true && (squareFeet === undefined || squareFeet === null)) return jsonError("Enter a square footage override.");
        if (overrideLinearFeet === true && (linearFeet === undefined || linearFeet === null)) return jsonError("Enter a linear footage override.");

        if (
            (description !== undefined && description !== null && typeof description !== "string") ||
            (notes !== undefined && notes !== null && typeof notes !== "string")
        ) {
            return jsonError("Invalid measurement description or notes.");
        }

        const estimates = await sql`
            SELECT id, status
            FROM estimates
            WHERE id = ${id}
            LIMIT 1
        `;

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);
        if (estimates[0].status !== "draft") return jsonError("Only draft estimates can be edited.", 409);

        const areas = await sql`
            SELECT id
            FROM estimate_areas
            WHERE id = ${estimateAreaId}
                AND estimate_id = ${id}
            LIMIT 1
        `;

        if (areas.length === 0) return jsonError("This area does not belong to the estimate.", 404);

        const calculated = calculateMeasurement({
            measurementType,
            lengthFt: lengthFt ?? null,
            widthFt: widthFt ?? null,
            heightFt: heightFt ?? null,
            quantity: quantity!,
        });

        const finalSquareFeet = overrideSquareFeet ? squareFeet! : calculated.squareFeet;
        const finalLinearFeet = overrideLinearFeet ? linearFeet! : calculated.linearFeet;

        const created = await sql`
            INSERT INTO estimate_measurements (
                estimate_area_id,
                measurement_type,
                description,
                length_ft,
                width_ft,
                height_ft,
                quantity,
                square_feet,
                linear_feet,
                override_square_feet,
                override_linear_feet,
                display_order,
                notes
            )
            VALUES (
                ${estimateAreaId},
                ${measurementType},
                ${description?.trim() || null},
                ${lengthFt ?? null},
                ${widthFt ?? null},
                ${heightFt ?? null},
                ${quantity!},
                ${finalSquareFeet ?? null},
                ${finalLinearFeet ?? null},
                ${overrideSquareFeet ?? false},
                ${overrideLinearFeet ?? false},
                (
                    SELECT COALESCE(MAX(display_order), 0) + 1
                    FROM estimate_measurements
                    WHERE estimate_area_id = ${estimateAreaId}
                ),
                ${notes?.trim() || null}
            )
            RETURNING *
        `;

        return jsonOk(created[0] as EstimateMeasurement, 201);
    } catch (err) {
        return serverError("POST /api/estimates/[id]/measurements", err);
    }
}