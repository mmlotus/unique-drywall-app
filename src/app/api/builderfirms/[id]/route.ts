import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { sql } from "@/lib/db";
import { BuilderFirmFormData } from "@/types/builders";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        const body = (await request.json()) as | BuilderFirmFormData | { isArchived: boolean };

        if ("isArchived" in body) {
            const [builderFirm] = await sql`
                UPDATE builder_firms
                SET
                    is_archived = ${body.isArchived},
                    updated_at = NOW()
                WHERE id = ${id}
                RETURNING
                    id,
                    name,
                    default_contact_name,
                    phone,
                    phone2,
                    email,
                    website,
                    office_address_line1,
                    office_address_line2,
                    office_city,
                    office_state,
                    office_zip,
                    notes,
                    is_archived,
                    created_at,
                    updated_at
                `;

            if (!builderFirm) return jsonError("Builder/Firm not found.", 404);

            return jsonOk(builderFirm);
        }

        const name = cleanString(body.name);

        if (!name) return jsonError("Builder/Firm Name is required.", 400);

        const [builderFirm] = await sql`
            UPDATE builder_firms
            SET
                name = ${name},
                default_contact_name = ${cleanString(body.defaultContactName)},
                phone = ${cleanString(body.phone)},
                phone2 = ${cleanString(body.phone2)},
                email = ${cleanString(body.email)},
                website = ${cleanString(body.website)},
                office_address_line1 = ${cleanString(body.officeAddressLine1)},
                office_address_line2 = ${cleanString(body.officeAddressLine2)},
                office_city = ${cleanString(body.officeCity)},
                office_state = ${cleanString(body.officeState)},
                office_zip = ${cleanString(body.officeZip)},
                notes = ${cleanString(body.notes)},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING
                id,
                name,
                default_contact_name,
                phone,
                phone2,
                email,
                website,
                office_address_line1,
                office_address_line2,
                office_city,
                office_state,
                office_zip,
                notes,
                is_archived,
                created_at,
                updated_at
            `;

        if (!builderFirm) return jsonError("Builder/Firm not found.", 404);

        return jsonOk(builderFirm);
    } catch (err) {
        return serverError("PATCH /api/builderfirms/[id]", err);
    }
}