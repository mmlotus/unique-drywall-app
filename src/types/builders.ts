export type BuilderFirm = {
    id: string;

    name: string;
    default_contact_name: string | null;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    website: string | null;

    office_address_line1: string | null;
    office_address_line2: string | null;
    office_city: string | null;
    office_state: string | null;
    office_zip: string | null;

    notes: string | null;

    is_archived: boolean;

    created_at: string;
    updated_at: string;
};

export type BuilderFirmFormData = {
    name: string;
    defaultContactName: string;
    phone: string;
    phone2: string;
    email: string;
    website: string;

    officeAddressLine1: string;
    officeAddressLine2: string;
    officeCity: string;
    officeState: string;
    officeZip: string;

    notes: string;
};

export const emptyBuilderFirmFormData: BuilderFirmFormData = {
    name: "",

    defaultContactName: "",
    phone: "",
    phone2: "",
    email: "",
    website: "",

    officeAddressLine1: "",
    officeAddressLine2: "",
    officeCity: "",
    officeState: "",
    officeZip: "",

    notes: "",
};