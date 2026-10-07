import { Category, CategoryFormData } from "@/types/categories";

export function categoryToFormData(category: Category): CategoryFormData {
    return {
        name: category.name,
        notes: category.notes ?? "",
    };
}