import { sql } from "@/lib/db";
import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { normalizePhone } from "@/lib/formatters/phone";
import { normalizeEmail } from "@/lib/formatters/email";
import { normalizeState, normalizeZip } from "@/lib/formatters/stateZip";

export async function GET() {
    try {
        const customers = await sql`
            SELECT
                id,
                name,
                phone,
                email,
                billing_address_line1,
                billing_address_line2,
                billing_city,
                billing_state,
                billing_zip,
                job_address_line1,
                job_address_line2,
                job_city,
                job_state,
                job_zip,
                notes,
                is_archived,
                created_at,
                updated_at
            FROM customers
            ORDER BY name ASC
        `;

        return jsonOk(customers);
    } catch (err) {
        return serverError("GET /api/customers", err);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const name = cleanString(body.name);
        const phone = normalizePhone(cleanString(body.phone));
        const email = normalizeEmail(cleanString(body.email));

        const billingAddressLine1 = cleanString(body.billingAddressLine1);
        const billingAddressLine2 = cleanString(body.billingAddressLine2);
        const billingCity = cleanString(body.billingCity);
        const billingState = normalizeState(cleanString(body.billingState));
        const billingZip = normalizeZip(cleanString(body.billingZip));

        const jobAddressLine1 = cleanString(body.jobAddressLine1);
        const jobAddressLine2 = cleanString(body.jobAddressLine2);
        const jobCity = cleanString(body.jobCity);
        const jobState = normalizeState(cleanString(body.jobState));
        const jobZip = normalizeZip(cleanString(body.jobZip));

        const notes = cleanString(body.notes);

        if (!name) return jsonError("Customer name is required.");

        if (!billingAddressLine1 || !billingCity || !billingState || !billingZip) {
            return jsonError("Complete billing address is required.");
        }

        if (!jobAddressLine1 || !jobCity || !jobState || !jobZip) {
            return jsonError("Complete default job site address is required.");
        }

        const [customer] = await sql`
            INSERT INTO customers (
                name,
                phone,
                email,
                billing_address_line1,
                billing_address_line2,
                billing_city,
                billing_state,
                billing_zip,
                job_address_line1,
                job_address_line2,
                job_city,
                job_state,
                job_zip,
                notes
            )
            VALUES (
                ${name},
                ${phone || null},
                ${email || null},
                ${billingAddressLine1},
                ${billingAddressLine2 || null},
                ${billingCity},
                ${billingState},
                ${billingZip},
                ${jobAddressLine1},
                ${jobAddressLine2 || null},
                ${jobCity},
                ${jobState},
                ${jobZip},
                ${notes || null}
            )
            RETURNING *;
        `;

        return jsonOk(customer, 201);
    } catch (err) {
        return serverError("POST /api/customers", err);
    }
}