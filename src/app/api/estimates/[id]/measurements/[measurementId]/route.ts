import { jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { uuidPattern } from "@/lib/constants/other";
import { sql } from "@/lib/db";
import { calculateMeasurement } from "@/lib/helpers/measurementUtils";
import { EstimateMeasurement, EstimateMeasurementInput, EstimateMeasurementRouteContext, MeasurementType } from "@/types";

export async function PATCH(req: Request, context: EstimateMeasurementRouteContext) {
    try {
        const { id, measurementId } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");
        if (!uuidPattern.test(measurementId)) return jsonError("Invalid measurement ID.");

        let body: Partial<EstimateMeasurementInput>;

        try {
            body = await req.json();
            if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Invalid measurement data.");
        } catch {
            return jsonError("Invalid measurement data.");
        }

        const estimates = await sql`
            SELECT id, status
            FROM estimates
            WHERE id = ${id}
            LIMIT 1
        `;

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);
        if (estimates[0].status !== "draft") return jsonError("Only draft estimates can be edited.", 409);

        const existing = await sql`
            SELECT em.*
            FROM estimate_measurements em
            INNER JOIN estimate_areas ea
                ON ea.id = em.estimate_area_id
            WHERE em.id = ${measurementId}
                AND ea.estimate_id = ${id}
            LIMIT 1
        `;

        if (existing.length === 0) return jsonError("Measurement not found.", 404);

        const current = existing[0] as EstimateMeasurement;

        if (
            (body.overrideSquareFeet !== undefined &&
                typeof body.overrideSquareFeet !== "boolean") ||
            (body.overrideLinearFeet !== undefined &&
                typeof body.overrideLinearFeet !== "boolean")
        ) {
            return jsonError("Invalid measurement override settings.");
        }

        const overrideSquareFeet = body.overrideSquareFeet ?? current.override_square_feet;
        const overrideLinearFeet = body.overrideLinearFeet ?? current.override_linear_feet;

        const measurementType = body.measurementType ?? current.measurement_type;
        if (measurementType !== "wall" && measurementType !== "ceiling" && measurementType !== "other") return jsonError("Please select a valid measurement type.");

        const quantity = body.quantity ?? Number(current.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) return jsonError("Quantity must be a positive whole number.");

        const lengthFt = body.lengthFt === undefined ? current.length_ft : body.lengthFt;
        const widthFt = body.widthFt === undefined ? current.width_ft : body.widthFt;
        const heightFt = body.heightFt === undefined ? current.height_ft : body.heightFt;
        const dimensions = [lengthFt, widthFt, heightFt];

        if (dimensions.some((value) =>
            value !== null &&
            (typeof value !== "number" &&
                typeof value !== "string" ||
                !Number.isFinite(Number(value)) ||
                Number(value) <= 0)
        )) {
            return jsonError("Dimensions must be positive numbers.");
        }

        const description = body.description === undefined ? current.description : body.description;
        const notes = body.notes === undefined ? current.notes : body.notes;

        if (
            (description !== null && typeof description !== "string") ||
            (notes !== null && typeof notes !== "string")
        ) {
            return jsonError("Invalid description or notes.");
        }

        const calculated = calculateMeasurement({
            measurementType: measurementType as MeasurementType,
            lengthFt: lengthFt === null ? null : Number(lengthFt),
            widthFt: widthFt === null ? null : Number(widthFt),
            heightFt: heightFt === null ? null : Number(heightFt),
            quantity,
        });

        const squareFeet = overrideSquareFeet ? body.squareFeet !== undefined ? body.squareFeet : current.square_feet : calculated.squareFeet;
        const linearFeet = overrideLinearFeet ? body.linearFeet !== undefined ? body.linearFeet : current.linear_feet : calculated.linearFeet;

        if ([squareFeet, linearFeet].some((value) =>
            value !== null &&
            (typeof value !== "number" &&
                typeof value !== "string" ||
                !Number.isFinite(Number(value)) ||
                Number(value) < 0)
        )) {
            return jsonError("Measurement totals cannot ne negative.");
        }

        if (overrideSquareFeet && squareFeet === null) return jsonError("Enter a square footage override.");
        if (overrideLinearFeet && linearFeet === null) return jsonError("Enter a linear footage override.");

        const updated = await sql`
            UPDATE estimate_measurements em
            SET
                measurement_type = ${measurementType},
                description = ${description?.trim() || null},
                length_ft = ${lengthFt === null ? null : Number(lengthFt)},
                width_ft = ${widthFt === null ? null : Number(widthFt)},
                height_ft = ${heightFt === null ? null : Number(heightFt)},
                quantity = ${quantity},
                square_feet = ${squareFeet === null ? null : Number(squareFeet)},
                linear_feet = ${linearFeet === null ? null : Number(linearFeet)},
                override_square_feet = ${overrideSquareFeet},
                override_linear_feet = ${overrideLinearFeet},
                notes = ${notes?.trim() || null},
                updated_at = NOW()
            FROM estimate_areas ea, estimates e
            WHERE em.id = ${measurementId}
                AND ea.id = em.estimate_area_id
                AND ea.estimate_id = e.id
                AND e.id = ${id}
                AND e.status = 'draft'
            RETURNING em.*
        `;

        if (updated.length === 0) return jsonError("Measurement could not be updated.", 409);

        return jsonOk(updated[0] as EstimateMeasurement);
    } catch (err) {
        return serverError("PATCH /api/estimates/[id]/measurements/[measurementId]", err);
    }
}

export async function DELETE(_req: Request, context: EstimateMeasurementRouteContext) {
    try {
        const { id, measurementId } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");
        if (!uuidPattern.test(measurementId)) return jsonError("Invalid measurement ID.");

        const estimates = await sql`
            SELECT id, status
            FROM estimates
            WHERE id = ${id}
            LIMIT 1
        `;

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);
        if (estimates[0].status !== 'draft') return jsonError("Only draft estimates can be edited.", 409);

        const deleted = await sql`
            DELETE FROM estimate_measurements em
            USING estimate_areas ea, estimates e
            WHERE em.id = ${measurementId}
                AND em.estimate_area_id = ea.id
                AND ea.estimate_id = e.id
                AND e.id = ${id}
                AND e.status = 'draft'
            RETURNING em.id
        `;

        if (deleted.length === 0) return jsonError("Measurement not found.", 404);

        return jsonOk({ success: true });
    } catch (err) {
        return serverError("DELETE /api/estimates/[id]/measurements/[measurementId]", err);
    }
}