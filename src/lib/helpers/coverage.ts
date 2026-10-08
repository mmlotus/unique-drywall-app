import { MaterialFormData } from "@/types";

export function calculateCoverage(
    calculationMethod: MaterialFormData["calculationMethod"],
    width: string,
    length: string
): string {
    const widthNumber = Number(width);
    const lengthNumber = Number(length);

    if (calculationMethod === "measured_sqft") {
        if (
            !width ||
            !length ||
            !Number.isFinite(widthNumber) ||
            !Number.isFinite(lengthNumber)
        ) {
            return "";
        }

        return String(widthNumber * lengthNumber);
    }

    if (calculationMethod === "linear_footage") {
        if (
            !length ||
            !Number.isFinite(lengthNumber)
        ) {
            return "";
        }

        return String(lengthNumber);
    }

    return "";
}

export type CustomFormulaBase =
    | "measured_sqft"
    | "linear_footage"
    | "material_quantity";

export type CustomFormulaOperation =
    | "*"
    | "+"
    | "-";

export function buildCustomFormula(
    base: CustomFormulaBase,
    operation: CustomFormulaOperation,
    value: string
): string {
    if (!value.trim()) return "";

    return `${base} ${operation} ${value.trim()}`;
}

export function parseCustomFormula(formula: string | null | undefined): {
    base: CustomFormulaBase;
    operation: CustomFormulaOperation;
    value: string;
} {
    const match = formula?.match(
        /^(measured_sqft|linear_footage|material_quantity)\s([*+-])\s(.+)$/
    );

    if (!match) return {
        base: "measured_sqft",
        operation: "*",
        value: "",
    };

    return {
        base: match[1] as CustomFormulaBase,
        operation: match[2] as CustomFormulaOperation,
        value: match[3],
    };
}