"use client";

import LibraryPagination from "@/components/Libraries/LibraryPagination";
import LibrarySearch from "@/components/Libraries/LibrarySearch";
import { useLibraryData } from "@/hooks/useLibraryData";
import glob from "@/styles/Global.module.css";
import libs from "@/styles/Libraries.module.css";
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
            <div className={libs.libraryHeader}>
                <h1 className={libs.libraryTitle}>Estimates</h1>

                <div className={libs.libraryActions}>
                    <Link href="/estimates/new" className={glob.button}>+ New Estimate</Link>
                </div>
            </div>

            <div className={libs.libraryBody}>
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
                        <div className={libs.recordList}>
                            {paginatedRecords.map((est) => (
                                <article
                                    key={est.id}
                                    className={libs.recordCard}
                                >
                                    <div className={libs.recordTitleRow}>
                                        <div className={libs.recordTitleGroup}>
                                            <h3 className={libs.recordTitle}>
                                                {est.job_name ||
                                                    est.estimate_number ||
                                                    "Untitled Estimate"
                                                }
                                            </h3>
                                        </div>
                                    </div>

                                    <div className={libs.recordDetails}>
                                        <span>
                                            <strong>Estimate:</strong>{" "}
                                            {est.estimate_number || "Not Assigned"}
                                        </span>

                                        <span>
                                            <strong>Date:</strong>{" "}
                                            {est.estimate_date.slice(0, 10)}
                                        </span>

                                        <span>
                                            <strong>Revision:</strong>{" "}
                                            {est.current_revision}
                                        </span>

                                        <span>
                                            <strong>Status:</strong>{" "}
                                            {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                                        </span>

                                        {(est.job_site_address ||
                                            est.job_site_city ||
                                            est.job_site_state ||
                                            est.job_site_zip) && (
                                                <div className={libs.recordAddress}>
                                                    <strong>Job Site:</strong>{" "}
                                                    {[
                                                        est.job_site_address,
                                                        est.job_site_city,
                                                        est.job_site_state,
                                                        est.job_site_zip,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </div>
                                            )}
                                    </div>

                                    <div className={glob.iconActions}>
                                        <Link href={`/estimates/${est.id}`} className={glob.actionButton}>Open Estimate</Link>
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
            </div>
        </main>
    );
}