import libs from "@/styles/Libraries.module.css";
import { ReactNode } from "react";

type LibraryPageLayoutProps = {
    library: ReactNode;
    editor: ReactNode;
};

export default function LibraryPageLayout({
    library,
    editor,
}: LibraryPageLayoutProps) {
    return (
        <div className={libs.libraryPageLayout}>
            <div className={libs.editorPane}>
                {editor}
            </div>

            <div className={libs.libraryPane}>
                {library}
            </div>
        </div>
    );
}