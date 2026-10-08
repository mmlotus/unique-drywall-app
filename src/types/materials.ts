export type Material = {
    id: string;

    parent_material_id: string | null;

    name: string;

    category_id: string | null;
    unit_id: string | null;

    size_label: string | null;

    width: number | null;
    length: number | null;
    thickness: number | null;

    coverage_per_unit: number | null;

    cost: number | null;
    sell_price: number | null;
    markup_percent: number | null;

    calculation_method:
    | "manual"
    | "measured_sqft"
    | "source_material_quantity"
    | "linear_footage"
    | "custom_formula";

    custom_formula: string | null;

    notes: string | null;

    display_order: number;

    is_archived: boolean;

    created_at: string;
    updated_at: string;
};

export type MaterialFormData = {
    parentMaterialId: string;

    name: string;

    categoryId: string;
    unitId: string;

    sizeLabel: string;

    width: string;
    length: string;
    thickness: string;

    coveragePerUnit: string;

    cost: string;
    sellPrice: string;
    markupPercent: string;

    calculationMethod:
    | "manual"
    | "measured_sqft"
    | "source_material_quantity"
    | "linear_footage"
    | "custom_formula";

    customFormula: string;

    notes: string;
};

export const emptyMaterialFormData: MaterialFormData = {
    parentMaterialId: "",

    name: "",

    categoryId: "",
    unitId: "",

    sizeLabel: "",

    width: "",
    length: "",
    thickness: "",

    coveragePerUnit: "",

    cost: "",
    sellPrice: "",
    markupPercent: "",

    calculationMethod: "measured_sqft",

    customFormula: "",

    notes: "",
}