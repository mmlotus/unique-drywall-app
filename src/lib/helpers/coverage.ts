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