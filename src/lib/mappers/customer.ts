import { Customer, CustomerFormData } from "@/types/customer";


export function customerToFormData(customer: Customer): CustomerFormData {
    return {
        name: customer.name,
        phone: customer.phone ?? "",
        email: customer.email ?? "",

        billingAddressLine1: customer.billing_address_line1,
        billingAddressLine2: customer.billing_address_line2 ?? "",
        billingCity: customer.billing_city,
        billingState: customer.billing_state,
        billingZip: customer.billing_zip,

        jobAddressLine1: customer.job_address_line1,
        jobAddressLine2: customer.job_address_line2 ?? "",
        jobCity: customer.job_city,
        jobState: customer.job_state,
        jobZip: customer.job_zip,

        notes: customer.notes ?? "",
    };
}