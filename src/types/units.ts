export type Unit = {
    id: string;

    name: string;
    abbreviation: string | null;

    display_order: number;

    is_archived: boolean;

    created_at: string;
    updated_at: string;
};

export type UnitFormData = {
    name: string;
    abbreviation: string;
};

export const emptyUnitFormData: UnitFormData = {
    name: "",
    abbreviation: "",
};