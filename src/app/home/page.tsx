"use client";

import LoadingSpinner from "@/components/LoadingSpinner";
import { authClient } from "@/lib/auth-client";
import glob from "@/styles/Global.module.css";
import home from "@/styles/Home.module.css";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Building2, ClipboardList, FilePlus2, FolderOpen, House, Layers3, Ruler, Tags, Users } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const libraries = [
    {
        name: "Customers",
        description: "Manage customer information.",
        href: "/customers",
        icon: Users,
    },
    {
        name: "Builders / Firms",
        description: "Manage builders and contractors.",
        href: "/builders",
        icon: Building2,
    },
    {
        name: "Materials",
        description: "Manage materials and pricing.",
        href: "/materials",
        icon: Layers3,
    },
    {
        name: "Categories",
        description: "Organize material categories.",
        href: "/categories",
        icon: Tags,
    },
    {
        name: "Units",
        description: "Manage measurement units.",
        href: "/units",
        icon: Ruler,
    },
    {
        name: "Areas / Rooms",
        description: "Manage estimate area templates.",
        href: "/areas",
        icon: House,
    },
];

export default function HomePage() {
    const { data: isPending } = authClient.useSession();

    if (isPending) return <LoadingSpinner />;

    return (
        <main className={glob.container}>
            <div className={glob.dashboard}>
                {/* Overview */}
                <section className={glob.dashboardSection}>
                    <div className={home.sectionHeader}>
                        <div>
                            <h2 className={home.sectionTitle}>Overview</h2>
                            <p className={home.sectionDescription}>
                                A quick look at your estimates.
                            </p>
                        </div>
                    </div>

                    <div className={home.statsGrid}>
                        <div className={home.statCard}>
                            <label className={home.statLabel}>Drafts</label>
                            <strong className={home.statValue}>-</strong>
                            <span className={home.statDescription}>In Progress</span>
                        </div>

                        <div className={home.statCard}>
                            <label className={home.statLabel}>Finalized</label>
                            <strong className={home.statValue}>-</strong>
                            <span className={home.statDescription}>Ready to Send</span>
                        </div>

                        <div className={home.statCard}>
                            <label className={home.statLabel}>Total</label>
                            <strong className={home.statValue}>-</strong>
                            <span className={home.statDescription}>All Estimates</span>
                        </div>
                    </div>

                    <p className={home.placeholderNote}>
                        Estimate statistics will be connected next.
                    </p>
                </section>

                {/* Estimate Actions */}
                <section className={glob.dashboardSection}>
                    <div className={home.sectionHeader}>
                        <div className={home.sectionHeadingRow}>
                            <div className={home.sectionIcon}>
                                <BookOpen size={22} />
                            </div>
                            <div>
                                <h2 className={home.sectionTitle}>Estimates</h2>
                                <p className={home.sectionDescription}>
                                    Create & manage your estimates.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={home.actionGrid}>
                        <Link href="/estimates/new" className={home.primaryCard}>
                            <div className={home.primaryCardHeader}>
                                <div className={home.actionIcon}>
                                    <FilePlus2 size={24} />
                                </div>

                                <h3>New Estimate</h3>

                                <ArrowRight size={20} className={home.actionArrow} />
                            </div>

                            <p>
                                Start a new estimate using your
                                saved customers, rooms, & materials.
                            </p>
                        </Link>

                        <Link href="/estimates" className={home.secondaryCard}>
                            <div className={home.primaryCardHeader}>
                                <div className={home.actionIcon}>
                                    <ClipboardList size={24} />
                                </div>

                                <h3>Manage Estimates</h3>

                                <ArrowRight size={20} className={home.actionArrow} />
                            </div>

                            <p>
                                Continue drafts, review finalized
                                estimates, & manage estimate history.
                            </p>
                        </Link>
                    </div>
                </section>

                {/* Libraries */}
                < section className={glob.dashboardSection}>
                    <div className={home.sectionHeader}>
                        <div className={home.sectionHeadingRow}>
                            <div className={home.sectionIcon}>
                                <FolderOpen size={24} />
                            </div>

                            <div>
                                <h2 className={home.sectionTitle}>Libraries</h2>
                                <p className={home.sectionDescription}>
                                    Manage the information used throughout your estimates.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={home.libraryGrid}>
                        {libraries.map((lib) => {
                            const Icon = lib.icon;

                            return (
                                <Link
                                    key={lib.href}
                                    href={lib.href}
                                    className={home.libraryCard}
                                >
                                    <div className={home.libraryIcon}>
                                        <Icon size={21} />
                                    </div>

                                    <div className={home.libraryInfo}>
                                        <h3>{lib.name}</h3>
                                        <p>{lib.description}</p>
                                    </div>

                                    <ArrowUpRight
                                        size={18}
                                        className={home.libraryArrow}
                                    />
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* LOGOUT */}
                <section className={glob.dashboardSection}>
                    <div className={home.sectionHeader}>
                        <LogoutButton />
                    </div>
                </section>
            </div>
        </main>
    );
}