import { cleanNullableString, cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { uuidPattern } from "@/lib/constants/other";
import { sql } from "@/lib/db";
import { CreateEstimateBody } from "@/types";

export async function GET() {
    try {
        const estimates = await sql`
            SELECT
                id,
                estimate_number,
                customer_id,
                builder_firm_id,
                estimate_date,
                status,
                job_name,
                job_site_address,
                job_site_city,
                job_site_state,
                job_site_zip,
                primary_contact_type,
                current_revision,
                created_at,
                updated_at
            FROM estimates
            ORDER BY created_at DESC, id DESC
        `;

        return jsonOk(estimates);
    } catch (err) {
        return serverError("GET /api/estimates", err);
    }
}

export async function POST(req: Request) {
    try {
        let body: CreateEstimateBody;

        try {
            body = await req.json();

            if (!body || typeof body !== "object" || Array.isArray(body)) {
                return jsonError("Invalid request body.");
            }
        } catch {
            return jsonError("Invalid JSON.");
        }

        const customerId = cleanString(body.customerId);
        const builderFirmId = cleanNullableString(body.builderFirmId);
        const primaryContactType = body.primaryContactType ?? "customer";

        if (!uuidPattern.test(customerId)) return jsonError("A valid customer is required.");

        if (builderFirmId && !uuidPattern.test(builderFirmId)) return jsonError("Invalid builder or firm.");

        if (!["customer", "builder", "custom"].includes(primaryContactType)) return jsonError("Invalid primary contact type.");

        if (primaryContactType === "builder" && !builderFirmId) return jsonError("Select a builder or firm as the primary contact.");

        const customContactName = cleanNullableString(body.customContactName);

        if (primaryContactType === "custom" && !customContactName) return jsonError("A contact name is required.");

        const estimateDate = cleanNullableString(body.estimateDate);

        if (estimateDate !== null) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(estimateDate)) return jsonError("Invalid estimate date.");

            const date = new Date(`${estimateDate}T00:00:00.000Z`);

            if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== estimateDate) return jsonError("Invalid estimate date.");
        }

        const jobName = cleanNullableString(body.jobName);
        const jobSiteAddress = cleanNullableString(body.jobSiteAddress);
        const jobSiteCity = cleanNullableString(body.jobSiteCity);
        const jobSiteState = cleanNullableString(body.jobSiteState);
        const jobSiteZip = cleanNullableString(body.jobSiteZip);

        const customContactPhone = cleanNullableString(body.customContactPhone);
        const customContactEmail = cleanNullableString(body.customContactEmail);
        const notes = cleanNullableString(body.notes);

        const customers = await sql`
            SELECT id
            FROM customers
            WHERE id = ${customerId}
        `;

        if (customers.length === 0) return jsonError("Customer not found.", 404);

        if (builderFirmId) {
            const builders = await sql`
                SELECT id
                FROM builder_firms
                WHERE id = ${builderFirmId}
            `;

            if (builders.length === 0) return jsonError("Builder or firm not found.", 404);
        }

        const created = await sql`
            INSERT INTO estimates (
                customer_id,
                builder_firm_id,
                estimate_date,
                status,
                job_name,
                job_site_address,
                job_site_city,
                job_site_state,
                job_site_zip,
                primary_contact_type,
                custom_contact_name,
                custom_contact_phone,
                custom_contact_email,
                notes
            )
            VALUES (
                ${customerId},
                ${builderFirmId},
                COALESCE(${estimateDate}::date, CURRENT_DATE),
                'draft',
                ${jobName},
                ${jobSiteAddress},
                ${jobSiteCity},
                ${jobSiteState},
                ${jobSiteZip},
                ${primaryContactType},
                ${primaryContactType === "custom" ? customContactName : null},
                ${primaryContactType === "custom" ? customContactPhone : null},
                ${primaryContactType === "custom" ? customContactEmail : null},
                ${notes}
            )
            RETURNING *
        `;

        return jsonOk(created[0], 201);
    } catch (err) {
        return serverError("POST /api/estimates", err);
    }
}