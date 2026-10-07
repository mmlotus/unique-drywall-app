import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { BuilderFirmFormData } from "@/types/builders";
import { sql } from "@/lib/db";

export async function GET() {
    try {
        const builderFirms = await sql`
            SELECT
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
            FROM builder_firms
            ORDER BY LOWER(name), created_at
        `;

        return jsonOk(builderFirms);
    } catch (err) {
        return serverError("GET /api/builderfirms", err);
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as BuilderFirmFormData;

        const name = cleanString(body.name);

        if (!name) return jsonError("Builder/Firm Name is required.", 400);

        const [builderFirm] = await sql`
            INSERT INTO builder_firms (
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
                notes
            )
            VALUES (
                ${name},
                ${cleanString(body.defaultContactName)},
                ${cleanString(body.phone)},
                ${cleanString(body.phone2)},
                ${cleanString(body.email)},
                ${cleanString(body.website)},
                ${cleanString(body.officeAddressLine1)},
                ${cleanString(body.officeAddressLine2)},
                ${cleanString(body.officeCity)},
                ${cleanString(body.officeState)},
                ${cleanString(body.officeZip)},
                ${cleanString(body.notes)}
            )
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

        return jsonOk(builderFirm, 201);
    } catch (err) {
        return serverError("POST /api/builderfirms", err);
    }
}