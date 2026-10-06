import { cleanString, jsonError, jsonOk, serverError } from "@/lib/api/apiUtils";
import { US_STATES } from "@/lib/constants/states";
import { sql } from "@/lib/db";
import { normalizeEmail } from "@/lib/formatters/email";
import { normalizePhone } from "@/lib/formatters/phone";

function isValidState(value: string) {
    return US_STATES.some((state) => state.value === value);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!id) return jsonError("Customer ID is required.");

        if (typeof body.isArchived === "boolean") {
            const [customer] = await sql`
                UPDATE customers
                SET
                    is_archived = ${body.isArchived},
                    updated_at = NOW()
                WHERE id = ${id}
                RETURNING *;
            `;

            if (!customer) return jsonError("Customer not found.", 404);

            return jsonOk(customer);
        }

        const name = cleanString(body.name);
        const phone = normalizePhone(body.phone);
        const email = normalizeEmail(body.email);

        const billingAddressLine1 = cleanString(body.billingAddressLine1);
        const billingAddressLine2 = cleanString(body.billingAddressLine2);
        const billingCity = cleanString(body.billingCity);
        const billingState = cleanString(body.billingState);
        const billingZip = cleanString(body.billingZip);

        const jobAddressLine1 = cleanString(body.jobAddressLine1);
        const jobAddressLine2 = cleanString(body.jobAddressLine2);
        const jobCity = cleanString(body.jobCity);
        const jobState = cleanString(body.jobState);
        const jobZip = cleanString(body.jobZip);

        const notes = cleanString(body.notes);

        if (!name) return jsonError("Customer name is required.");

        if (
            !billingAddressLine1 ||
            !billingCity ||
            !billingState ||
            !billingZip
        ) {
            return jsonError("Complete billing address is required.");
        }

        if (
            !jobAddressLine1 ||
            !jobCity ||
            !jobState ||
            !jobZip
        ) {
            return jsonError("Complete default job site address is required.");
        }

        if (!isValidState(billingState)) return jsonError("Billing state is invalid.");
        if (!isValidState(jobState)) return jsonError("Job site state is invalid.");

        const [customer] = await sql`
            UPDATE customers
            SET
                name = ${name},
                phone = ${phone || null},
                email = ${email || null},

                billing_address_line1 = ${billingAddressLine1},
                billing_address_line2 = ${billingAddressLine2 || null},
                billing_city = ${billingCity},
                billing_state = ${billingState},
                billing_zip = ${billingZip},

                job_address_line1 = ${jobAddressLine1},
                job_address_line2 = ${jobAddressLine2 || null},
                job_city = ${jobCity},
                job_state = ${jobState},
                job_zip = ${jobZip},

                notes = ${notes || null},

                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *;
        `;

        if (!customer) return jsonError("Customer not found.", 404);

        return jsonOk(customer);
    } catch (err) {
        return serverError("PATCH /api/customers/[id]", err);
    }
}