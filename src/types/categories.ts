export type Category = {
    id: string;

    name: string;
    notes: string | null;

    display_order: number;

    is_archived: boolean;

    created_at: string;
    updated_at: string;
};

export type CategoryFormData = {
    name: string;
    notes: string;
};

export const emptyCategoryFormData: CategoryFormData = {
    name: "",
    notes: "",
};