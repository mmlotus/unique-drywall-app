"use client";

import LibraryPagination from "@/components/Libraries/LibraryPagination";
import LibrarySearch from "@/components/Libraries/LibrarySearch";
import { useLibraryData } from "@/hooks/useLibraryData";
import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
import estStyles from "@/styles/Estimates.module.css";
import { EstimateSummary } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EstimatesPage() {
    const [estimates, setEstimates] = useState<EstimateSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        searchQuery,
        setSearchQuery,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedRecords,
        totalPages,
        totalRecords,
    } = useLibraryData({
        records: estimates,
        searchText: (estimate: EstimateSummary) =>
            [
                estimate.estimate_number,
                estimate.job_name,
                estimate.status,
                estimate.builder_firm_id,
                estimate.job_site_address,
                estimate.job_site_city,
                estimate.job_site_state,
                estimate.job_site_zip,
            ]
                .filter(Boolean)
                .join(" "),
        initialPageSize: 10,
    });

    useEffect(() => {
        async function loadEstimates() {
            try {
                const res = await fetch("/api/estimates");

                if (!res.ok) throw new Error("Failed to load estimates.");

                const data: EstimateSummary[] = await res.json();

                setEstimates(data);
            } catch (err) {
                console.error("Failed to load estimates:", err);
                toast.error("Failed to load estimates.");
            } finally {
                setLoading(false);
            }
        }

        void loadEstimates();
    }, []);

    return (
        <main className={glob.container}>
            <div className={glob.dashboard}>
                <section className={`${libs.libraryBody} ${glob.dashboardSection}`}>
                    <div
                        className={libs.libraryActions}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                        }}
                    >
                        <strong
                            style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "var(--accent-text)",
                            }}
                        >
                            {totalRecords} Total Records
                        </strong>

                        <Link
                            href="/estimates/new"
                            className={glob.button}
                            style={{
                                maxWidth: "150px",
                                marginLeft: "auto",
                            }}
                        >
                            + New Estimate
                        </Link>
                    </div>

                    <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "10px 0" }} />

                    <LibrarySearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search estimates..."
                    />

                    <LibraryPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalRecords={totalRecords}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />

                    {loading ? (
                        <p>Loading estimates...</p>
                    ) : totalRecords === 0 ? (
                        <p className={libs.emptyState}>
                            {searchQuery
                                ? "No estimates match your search."
                                : "No estimates yet."
                            }
                        </p>
                    ) : (
                        <>
                            <div className={`${libs.recordList} ${estStyles.summaryList}`}>
                                {paginatedRecords.map((est) => (
                                    <article
                                        key={est.id}
                                        className={estStyles.summaryCard}
                                    >
                                        <div className={estStyles.summaryCardHeader}>
                                            <h3 className={estStyles.summaryTitle}>
                                                {est.job_name ||
                                                    est.estimate_number ||
                                                    "Untitled Estimate"}
                                            </h3>

                                            <span className={estStyles.summaryStatus}>
                                                {est.status.charAt(0).toUpperCase() +
                                                    est.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className={estStyles.summaryDetails}>
                                            <div>
                                                <span className={estStyles.summaryLabel}>
                                                    ESTIMATE NUMBER
                                                </span>
                                                <strong>
                                                    {est.estimate_number || "Not Assigned"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span className={estStyles.summaryLabel}>
                                                    ESTIMATE DATE
                                                </span>
                                                <strong>{est.estimate_date.slice(0, 10)}</strong>
                                            </div>

                                            <div>
                                                <span className={estStyles.summaryLabel}>
                                                    REVISION
                                                </span>
                                                <strong>{est.current_revision}</strong>
                                            </div>

                                            <div>
                                                <span className={estStyles.summaryLabel}>
                                                    JOB SITE
                                                </span>
                                                <span>
                                                    {[
                                                        est.job_site_address,
                                                        est.job_site_city,
                                                        est.job_site_state,
                                                        est.job_site_zip,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ") || "Not provided"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={estStyles.summaryFooter}>
                                            <Link
                                                href={`/estimates/${est.id}`}
                                                className={glob.actionButton}
                                            >
                                                Open Estimate
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <LibraryPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                            />
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}