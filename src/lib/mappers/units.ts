import { Unit, UnitFormData } from "@/types";

export function unitToFormData(unit: Unit): UnitFormData {
    return {
        name: unit.name,
        abbreviation: unit.abbreviation ?? "",
    };
}