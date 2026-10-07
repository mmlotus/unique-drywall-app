import { BuilderFirm, BuilderFirmFormData } from "@/types/builders";

export function builderFirmToFormData(
    builderFirm: BuilderFirm,
): BuilderFirmFormData {
    return {
        name: builderFirm.name,

        defaultContactName: builderFirm.default_contact_name ?? "",
        phone: builderFirm.phone ?? "",
        phone2: builderFirm.phone2 ?? "",
        email: builderFirm.email ?? "",
        website: builderFirm.website ?? "",

        officeAddressLine1: builderFirm.office_address_line1 ?? "",
        officeAddressLine2: builderFirm.office_address_line2 ?? "",
        officeCity: builderFirm.office_city ?? "",
        officeState: builderFirm.office_state ?? "",
        officeZip: builderFirm.office_zip ?? "",

        notes: builderFirm.notes ?? "",
    };
}