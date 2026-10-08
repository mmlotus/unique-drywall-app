export type Area = {
    id: string;

    name: string;
    notes: string | null;

    display_order: number;

    is_archived: boolean;

    created_at: string;
    updated_at: string;
};

export type AreaFormData = {
    name: string;
    notes: string;
};

export const emptyAreaFormData: AreaFormData = {
    name: "",
    notes: "",
};