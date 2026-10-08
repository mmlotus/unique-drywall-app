import { cleanNullableString, cleanString, isValidDate, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { uuidPattern } from "@/lib/constants/other";
import { sql } from "@/lib/db";
import { EstimateRouteContext, UpdateEstimateBody } from "@/types";

export async function GET(_req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estiamte ID.");

        const estimates = await sql`
            SELECT *
            FROM estimates
            WHERE id = ${id}
        `;

        if (estimates.length === 0) return jsonError("Estimate not found.", 404);

        return jsonOk(estimates[0]);
    } catch (err) {
        return serverError("GET /api/estimates/[id]", err);
    }
}

export async function PATCH(req: Request, context: EstimateRouteContext) {
    try {
        const { id } = await context.params;

        if (!uuidPattern.test(id)) return jsonError("Invalid estiamte ID.");

        let body: UpdateEstimateBody;

        try {
            body = await req.json();

            if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Invalid request body.");
        } catch {
            return jsonError("Invalid JSON.");
        }

        const allowedFields = [
            "customerId",
            "builderFirmId",
            "estimateDate",
            "jobName",
            "jobSiteAddress",
            "jobSiteCity",
            "jobSiteState",
            "jobSiteZip",
            "primaryContactType",
            "customContactName",
            "customContactPhone",
            "customContactEmail",
            "notes",
        ];

        const keys = Object.keys(body);

        if (keys.length === 0 || keys.some((key) => !allowedFields.includes(key))) {
            return jsonError("Invalid estimate update fields.");
        }

        const has = (key: keyof UpdateEstimateBody) =>
            Object.prototype.hasOwnProperty.call(body, key);

        if (keys.some((key) => {
            const value = body[key as keyof UpdateEstimateBody];

            return (
                value !== null && typeof value !== "string"
            );
        })
        ) {
            return jsonError("Invalid field value.");
        }

        const customerId = cleanString(body.customerId);
        if (has("customerId") && !uuidPattern.test(customerId)) return jsonError("A valid customer is required.");

        const builderFirmId = cleanNullableString(body.builderFirmId);
        if (builderFirmId && !uuidPattern.test(builderFirmId)) return jsonError("Invalid builder or firm.");

        const estimateDate = cleanString(body.estimateDate);
        if (has("estimateDate") && !isValidDate(estimateDate)) return jsonError("Invalid estimate date.");

        if (has("primaryContactType") && !["customer", "builder", "custom"].includes(body.primaryContactType ?? "")) {
            return jsonError("Invalid primary contact type.");
        }

        const existing = await sql`
            SELECT *
            FROM estimates
            WHERE id = ${id}
        `;

        if (existing.length === 0) return jsonError("Estimate not found.", 404);

        const estimate = existing[0];

        if (estimate.status !== "draft") return jsonError("Only draft estimates can be edited. Reopen this estimate before making changes.", 409);

        if (has("customerId")) {
            const customers = await sql`
                SELECT id
                FROM customers
                WHERE id = ${customerId}
            `;

            if (customers.length === 0) return jsonError("Customer not found.", 404);
        }

        if (builderFirmId) {
            const builders = await sql`
                SELECT id
                FROM builder_firms
                WHERE id = ${builderFirmId}
            `;

            if (builders.length === 0) return jsonError("Builder or firm not found.", 404);
        }

        const primaryContactType = has("primaryContactType")
            ? body.primaryContactType
            : estimate.primary_contact_type;

        const effectiveBuilderId = has("builderFirmId")
            ? builderFirmId
            : estimate.builder_firm_id;

        const effectiveContactName = has("customContactName")
            ? cleanNullableString(body.customContactName)
            : estimate.custom_contact_name;

        if (primaryContactType === "builder" && !effectiveBuilderId) return jsonError("Select a builder or firm as the primary contact.");

        if (primaryContactType === "custom" && !effectiveContactName) return jsonError("A contact name is required.");

        const jobName = cleanNullableString(body.jobName);
        const jobSiteAddress = cleanNullableString(body.jobSiteAddress);
        const jobSiteCity = cleanNullableString(body.jobSiteCity);
        const jobSiteState = cleanNullableString(body.jobSiteState);
        const jobSiteZip = cleanNullableString(body.jobSiteZip);
        const customContactName = cleanNullableString(body.customContactName);
        const customContactPhone = cleanNullableString(body.customContactPhone);
        const customContactEmail = cleanNullableString(body.customContactEmail);
        const notes = cleanNullableString(body.notes);

        const updated = await sql`
            UPDATE estimates
            SET
                customer_id = CASE
                    WHEN ${has("customerId")}
                    THEN ${customerId || null}::uuid
                    ELSE customer_id
                END,

                builder_firm_id = CASE
                    WHEN ${has("builderFirmId")}
                    THEN ${builderFirmId}::uuid
                    ELSE builder_firm_id
                END,

                estimate_date = CASE
                    WHEN ${has("estimateDate")}
                    THEN ${estimateDate || null}::date
                    ELSE estimate_date
                END,

                job_name = CASE
                    WHEN ${has("jobName")}
                    THEN ${jobName}
                    ELSE job_name
                END,

                job_site_address = CASE
                    WHEN ${has("jobSiteAddress")}
                    THEN ${jobSiteAddress}
                    ELSE job_site_address
                END,

                job_site_city = CASE
                    WHEN ${has("jobSiteCity")}
                    THEN ${jobSiteCity}
                    ELSE job_site_city
                END,

                job_site_state = CASE
                    WHEN ${has("jobSiteState")}
                    THEN ${jobSiteState}
                    ELSE job_site_state
                END,

                job_site_zip = CASE
                    WHEN ${has("jobSiteZip")}
                    THEN ${jobSiteZip}
                    ELSE job_site_zip
                END,

                primary_contact_type = CASE
                    WHEN ${has("primaryContactType")}
                    THEN ${primaryContactType}
                    ELSE primary_contact_type
                END,

                custom_contact_name = CASE
                    WHEN ${has("customContactName")}
                    THEN ${customContactName}
                    ELSE custom_contact_name
                END,

                custom_contact_phone = CASE
                    WHEN ${has("customContactPhone")}
                    THEN ${customContactPhone}
                    ELSE custom_contact_phone
                END,

                custom_contact_email = CASE
                    WHEN ${has("customContactEmail")}
                    THEN ${customContactEmail}
                    ELSE custom_contact_email
                END,

                notes = CASE
                    WHEN ${has("notes")}
                    THEN ${notes}
                    ELSE notes
                END

            WHERE id = ${id}
                AND status = 'draft'
            
            RETURNING *
        `;

        if (updated.length === 0) return jsonError("This estimate is no longer available. Refresh and try again.", 409);

        return jsonOk(updated[0]);
    } catch (err) {
        return serverError("PATCH /api/estimates/[id]", err);
    }
}