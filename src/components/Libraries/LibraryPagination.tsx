"use client";

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

import styles from "@/styles/Libraries.module.css";

type LibraryPaginationProps = {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
};

export default function LibraryPagination({
    currentPage,
    totalPages,
    totalRecords,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: LibraryPaginationProps) {
    if (totalRecords === 0) {
        return null;
    }

    const startIndex =
        (currentPage - 1) * pageSize + 1;

    const endIndex = Math.min(
        currentPage * pageSize,
        totalRecords
    );

    return (
        <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
                {startIndex === endIndex
                    ? `${startIndex} of ${totalRecords}`
                    : `${startIndex}-${endIndex} of ${totalRecords}`}
            </span>

            <div className={styles.paginationControls}>
                <label className={styles.paginationPageSize}>
                    <span>Per Page</span>

                    <select
                        value={pageSize}
                        onChange={(event) => {
                            onPageSizeChange(
                                Number(event.target.value)
                            );
                            onPageChange(1);
                        }}
                        className={styles.pageSizeSelect}
                        aria-label="Records per page"
                    >
                        {[5, 10, 15, 25, 50, 100].map(
                            (value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {value}
                                </option>
                            )
                        )}
                    </select>
                </label>

                <div className={styles.paginationButtons}>
                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        aria-label="First page"
                        title="First page"
                    >
                        <ChevronsLeft size={14} />
                    </button>

                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() =>
                            onPageChange(
                                Math.max(currentPage - 1, 1)
                            )
                        }
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                        title="Previous page"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() =>
                            onPageChange(
                                Math.min(
                                    currentPage + 1,
                                    totalPages
                                )
                            )
                        }
                        disabled={currentPage >= totalPages}
                        aria-label="Next page"
                        title="Next page"
                    >
                        <ChevronRight size={14} />
                    </button>

                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() =>
                            onPageChange(totalPages)
                        }
                        disabled={currentPage >= totalPages}
                        aria-label="Last page"
                        title="Last page"
                    >
                        <ChevronsRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}