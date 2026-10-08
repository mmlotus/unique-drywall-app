import { Area, AreaFormData } from "@/types/areas";

export function areaToFormData(area: Area): AreaFormData {
    return {
        name: area.name,
        notes: area.notes ?? "",
    };
}