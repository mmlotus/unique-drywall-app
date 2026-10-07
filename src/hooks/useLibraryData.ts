import { useMemo, useState } from "react";


type UseLibraryDataOptions<T> = {
    records: T[];
    searchText: (record: T) => string;
    filterRecord?: (record: T, searchQuery: string) => boolean;
    initialPageSize?: number;
};

export function useLibraryData<T>({
    records,
    searchText,
    filterRecord,
    initialPageSize = 10,
}: UseLibraryDataOptions<T>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const filteredRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return records.filter((record) => {
            const matchesSearch = !query || searchText(record).toLowerCase().includes(query);
            const matchesFilter = !filterRecord || filterRecord(record, query);

            return matchesSearch && matchesFilter;
        });
    }, [records, searchQuery, searchText, filterRecord]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;

        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safeCurrentPage, pageSize]);

    function updateSearchQuery(value: string) {
        setSearchQuery(value);
        setCurrentPage(1);
    }

    function updatePageSize(value: number) {
        setPageSize(value);
        setCurrentPage(1);
    }

    return {
        searchQuery,
        setSearchQuery: updateSearchQuery,

        currentPage: safeCurrentPage,
        setCurrentPage,

        pageSize,
        setPageSize: updatePageSize,

        paginatedRecords,
        totalPages,
        totalRecords: filteredRecords.length,
    };
}