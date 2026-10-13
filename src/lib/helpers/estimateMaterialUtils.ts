import { EstimateMeasurement, Material } from "@/types"
import { parseCustomFormula } from "./coverage";


type MaterialCalculationInput = {
    material: Pick<Material, "calculation_method" | "coverage_per_unit" | "custom_formula">;
    measurements: EstimateMeasurement[];
    sourceMaterialQuantity?: number | null;
};

export function calculateSuggestedMatQty({
    material,
    measurements,
    sourceMaterialQuantity = null,
}: MaterialCalculationInput): number | null {
    const method = material.calculation_method;
    if (method === "manual") return null;

    const totalSquareFeet = measurements.reduce((sum, item) => sum + Number(item.square_feet ?? 0), 0);
    const totalLinearFeet = measurements.reduce((sum, item) => sum + Number(item.linear_feet ?? 0), 0);
    const coverage = material.coverage_per_unit === null ? null : Number(material.coverage_per_unit);

    let result: number;

    if (method === "measured_sqft" || method === "linear_footage") {
        if (!measurements.length || coverage === null || !Number.isFinite(coverage) || coverage <= 0) return null;

        const measured = method === "measured_sqft" ? totalSquareFeet : totalLinearFeet;

        result = measured / coverage;
    } else if (method === "source_material_quantity") {
        if (sourceMaterialQuantity === null) return null;

        result = sourceMaterialQuantity;
    } else if (method === "custom_formula") {
        if (!material.custom_formula) return null;

        const { base, operation, value } = parseCustomFormula(material.custom_formula);

        if (!value.trim()) return null;

        const operand = Number(value);
        if (!Number.isFinite(operand)) return null;

        let baseQty: number;

        if (base === "measured_sqft") {
            if (!measurements.length) return null;
            baseQty = totalSquareFeet;
        } else if (base === "linear_footage") {
            if (!measurements.length) return null;
            baseQty = totalLinearFeet;
        } else {
            if (sourceMaterialQuantity === null) return null;
            baseQty = sourceMaterialQuantity;
        }

        switch (operation) {
            case "*":
                result = baseQty * operand;
                break;
            case "+":
                result = baseQty + operand;
                break;
            case "-":
                result = baseQty - operand;
                break;
            default:
                return null;
        }
    } else {
        return null;
    }

    if (!Number.isFinite(result) || result < 0) return null;

    return Math.ceil(result);
}