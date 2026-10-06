import libs from "@/styles/Libraries.module.css";
import { ReactNode } from "react";

type LibrarySectionProps = {
    title: string;
    actions?: ReactNode;
    children: ReactNode;
};

export default function LibrarySection({
    title,
    actions,
    children,
}: LibrarySectionProps) {
    return (
        <section className={libs.librarySection}>
            <div className={libs.libraryHeader}>
                <h2 className={libs.libraryTitle}>{title}</h2>

                {actions && (
                    <div className={libs.libraryActions}>
                        {actions}
                    </div>
                )}
            </div>

            <div className={libs.libraryBody}>
                {children}
            </div>
        </section>
    );
}