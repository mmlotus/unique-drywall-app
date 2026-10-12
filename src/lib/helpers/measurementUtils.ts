import { EstimateMeasurement, MeasurementCalculations, MeasurementDimensions, MeasurementForm } from "@/types";

function roundMeasurement(value: number): number {
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function calculateMeasurement(dimensions: MeasurementDimensions): MeasurementCalculations {
    const {
        measurementType,
        lengthFt,
        widthFt,
        heightFt,
        quantity,
    } = dimensions;

    const validQty = Number.isInteger(quantity) && quantity > 0;
    if (!validQty) return {
        squareFeet: null,
        linearFeet: null,
    };

    const validLength =
        lengthFt !== null &&
        Number.isFinite(lengthFt) &&
        lengthFt > 0;

    const validWidth =
        widthFt !== null &&
        Number.isFinite(widthFt) &&
        widthFt > 0;

    const validHeight =
        heightFt !== null &&
        Number.isFinite(heightFt) &&
        heightFt > 0;

    const linearFeet = validLength ? roundMeasurement(lengthFt * quantity) : null;

    if (measurementType === "wall") {
        return {
            squareFeet: validLength && validHeight ? roundMeasurement(lengthFt * heightFt * quantity) : null,
            linearFeet,
        };
    }

    if (measurementType === "ceiling") {
        return {
            squareFeet: validLength && validWidth ? roundMeasurement(lengthFt * widthFt * quantity) : null,
            linearFeet,
        };
    }

    return {
        squareFeet: validLength && validWidth ? roundMeasurement(lengthFt * widthFt * quantity) : null,
        linearFeet,
    };
}

export function parseMeasurementNumber(
    value: string
): number | null {
    return value.trim() === "" ? null : Number(value);
}

export function formatMeasurementNumber(
    value: number | string | null
): string {
    if (value === null) return "0";

    return Number(value).toLocaleString("en-US", {
        maximumFractionDigits: 4,
    });
}

export function getCalculatedMeasurement(
    form: MeasurementForm
): MeasurementCalculations {
    return calculateMeasurement({
        measurementType: form.measurementType,
        lengthFt: parseMeasurementNumber(form.lengthFt),
        widthFt: parseMeasurementNumber(form.widthFt),
        heightFt: parseMeasurementNumber(form.heightFt),
        quantity: Number(form.quantity),
    });
}

export function getMeasurementTotals(
    form: MeasurementForm
): MeasurementCalculations {
    const calculated = getCalculatedMeasurement(form);

    return {
        squareFeet: form.overrideSquareFeet
            ? parseMeasurementNumber(form.squareFeet)
            : calculated.squareFeet,
        linearFeet: form.overrideLinearFeet
            ? parseMeasurementNumber(form.linearFeet)
            : calculated.linearFeet,
    };
}

export function measurementToForm(
    measurement: EstimateMeasurement
): MeasurementForm {
    const form: MeasurementForm = {
        measurementType: measurement.measurement_type,
        description: measurement.description ?? "",
        lengthFt: measurement.length_ft === null
            ? ""
            : String(measurement.length_ft),
        widthFt: measurement.width_ft === null
            ? ""
            : String(measurement.width_ft),
        heightFt: measurement.height_ft === null
            ? ""
            : String(measurement.height_ft),
        quantity: String(measurement.quantity),
        squareFeet: measurement.square_feet === null
            ? ""
            : String(measurement.square_feet),
        linearFeet: measurement.linear_feet === null
            ? ""
            : String(measurement.linear_feet),
        notes: measurement.notes ?? "",
        overrideSquareFeet: false,
        overrideLinearFeet: false,
    };

    form.overrideSquareFeet = measurement.override_square_feet;
    form.overrideLinearFeet = measurement.override_linear_feet;

    return form;
}
