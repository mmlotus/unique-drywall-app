import { Material, MaterialFormData } from "@/types/materials";

export function materialToFormData(m: Material): MaterialFormData {
    return {
        parentMaterialId: m.parent_material_id ?? "",

        name: m.name,

        categoryId: m.category_id ?? "",
        unitId: m.unit_id ?? "",

        sizeLabel: m.size_label ?? "",

        width: m.width?.toString() ?? "",
        length: m.length?.toString() ?? "",
        thickness: m.thickness?.toString() ?? "",

        coveragePerUnit: m.coverage_per_unit?.toString() ?? "",

        cost: m.cost?.toString() ?? "",
        sellPrice: m.sell_price?.toString() ?? "",
        markupPercent: m.markup_percent?.toString() ?? "",

        calculationMethod: m.calculation_method,

        customFormula: m.custom_formula ?? "",

        notes: m.notes ?? "",
    };
}