import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { uuidPattern } from "@/lib/constants/other";
import { sql } from "@/lib/db";
import { EstimateRouteContext } from "@/types";

export async function GET(_req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");

        const estimates = await sql`
            SELECT id
            FROM estimates
            WHERE id = ${id}
        `;

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);

        const areas = await sql`
            SELECT
                id,
                estimate_id,
                area_id,
                area_name,
                instance_number,
                display_label,
                display_order,
                notes
            FROM estimate_areas
            WHERE estimate_id = ${id}
            ORDER BY display_order, instance_number, id
        `;

        return jsonOk(areas);
    } catch (err) {
        return serverError("GET /api/estimates/[id]/areas", err);
    }
}

export async function POST(req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estimate ID.");

        let body: {
            areaId?: string;
            name?: string;
            notes?: string;
            saveToLibrary?: boolean;
        };

        try {
            body = await req.json();

            if (!body || typeof body !== "object" || Array.isArray(body)) {
                return jsonError("Invalid request body.");
            }
        } catch {
            return jsonError("Invalid JSON.");
        }

        const areaId = cleanString(body.areaId);
        const name = cleanString(body.name);
        const notes = cleanString(body.notes);
        const saveToLibrary = body.saveToLibrary ?? false;

        if (typeof saveToLibrary !== "boolean") return jsonError("Invalid library selection.");
        if (areaId && name) return jsonError("Select a library room or enter a custom room, not both.");
        if (!areaId && !name) return jsonError("Select or enter an Area/Room.");
        if (areaId && !uuidPattern.test(areaId)) return jsonError("Select a valid area/room.");
        if (areaId && saveToLibrary) return jsonError("Selected library rooms are already saved.");

        const estimates = await sql`
            SELECT id, status
            FROM estimates
            WHERE id = ${id}
        `;

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);
        if (estimates[0].status !== "draft") return jsonError("Only draft estimates can be edited. Reopen this estimate before making changes.", 409);

        if (areaId) {
            const libraryAreas = await sql`
            SELECT id, name
            FROM areas
            WHERE id = ${areaId}
                AND is_archived = false
        `;

            if (libraryAreas.length === 0) return jsonError("Area/Room not found or archived.", 404);

            const areaName = libraryAreas[0].name as string;

            const [created] = await sql`
            INSERT INTO estimate_areas (
                estimate_id,
                area_id,
                area_name,
                instance_number,
                display_label,
                display_order
            )
            SELECT
                ${id},
                ${areaId}::uuid,
                ${areaName},
                (
                    SELECT COALESCE(MAX(instance_number), 0) + 1
                    FROM estimate_areas
                    WHERE estimate_id = ${id}
                        AND area_id = ${areaId}
                ),
                ${areaName} || ' #' || (
                    SELECT COALESCE(MAX(instance_number), 0) + 1
                    FROM estimate_areas
                    WHERE estimate_id = ${id}
                        AND area_id = ${areaId}
                ),
                (
                    SELECT COALESCE(MAX(display_order), 0) + 1
                    FROM estimate_areas
                    WHERE estimate_id = ${id}
                )
            WHERE EXISTS (
                SELECT 1
                FROM estimates
                WHERE id = ${id}
                    AND status = 'draft'
            )
            RETURNING
                id,
                estimate_id,
                area_id,
                area_name,
                instance_number,
                display_label,
                display_order,
                notes
        `;

            if (!created) return jsonError("Estimate is no longer editable.", 409);

            return jsonOk(created, 201);
        }

        if (saveToLibrary) {
            const existingLibraryArea = await sql`
                SELECT id
                FROM areas
                WHERE LOWER(name) = LOWER(${name})
                LIMIT 1
            `;

            if (existingLibraryArea.length > 0) return jsonError("An Area/Room with this name already exists in the library.", 409);

            const [created] = await sql`
                WITH new_library_area AS (
                    INSERT INTO areas (
                        name,
                        notes,
                        display_order
                    )
                    SELECT
                        ${name},
                        ${notes},
                        (
                            SELECT COALESCE(MAX(display_order), 0) + 1
                            FROM areas
                        )
                    WHERE EXISTS (
                        SELECT 1
                        FROM estimates
                        WHERE id = ${id}
                            AND status = 'draft'
                    )
                    RETURNING id, name
                )
                INSERT INTO estimate_areas (
                    estimate_id,
                    area_id,
                    area_name,
                    instance_number,
                    display_label,
                    display_order,
                    notes
                )
                SELECT
                    ${id},
                    new_library_area.id,
                    new_library_area.name,
                    1,
                    new_library_area.name || ' #1',
                    (
                        SELECT COALESCE(MAX(display_order), 0) + 1
                        FROM estimate_areas
                        WHERE estimate_id = ${id}
                    ),
                    ${notes || null}
                FROM new_library_area
                RETURNING
                    id,
                    estimate_id,
                    area_id,
                    area_name,
                    instance_number,
                    display_label,
                    display_order,
                    notes
            `;

            if (!created) return jsonError("Estimate is no longer editable.", 409);

            return jsonOk(created, 201);
        }

        const [created] = await sql`
            INSERT INTO estimate_areas (
                estimate_id,
                area_id,
                area_name,
                instance_number,
                display_label,
                display_order,
                notes
            )
            SELECT
                ${id},
                NULL,
                ${name},
                (
                    SELECT COALESCE(MAX(instance_number), 0) + 1
                    FROM estimate_areas
                    WHERE estimate_id = ${id}
                        AND area_id IS NULL
                        AND LOWER(area_name) = LOWER(${name})
                ),
                ${name} || ' #' || (
                    SELECT COALESCE(MAX(instance_number), 0) + 1
                    FROM estimate_areas
                    WHERE estimate_id = ${id}
                        AND area_id IS NULL
                        AND LOWER(area_name) = LOWER(${name})
                ),
                (
                    SELECT COALESCE(MAX(display_order), 0) + 1
                    FROM estimate_areas
                    WHERE estimate_id = ${id}
                ),
                ${notes || null}
            WHERE EXISTS (
                SELECT 1
                FROM estimates
                WHERE id = ${id}
                    AND status = 'draft'
            )
            RETURNING
                id,
                estimate_id,
                area_id,
                area_name,
                instance_number,
                display_label,
                display_order,
                notes
        `;

        if (!created) return jsonError("Estimate is no longer editable.", 409);

        return jsonOk(created, 201);
    } catch (err) {
        return serverError("POST /api/estimates/[id]/areas", err);
    }
}