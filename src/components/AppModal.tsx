"use client";

import glob from "@/styles/Global.module.css";
import { AppModalProps } from "@/types";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export default function AppModal({
    open,
    title,
    children,
    onClose,
    busy = false,
}: AppModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            className={glob.modal}
            aria-labelledby={titleId}
            onCancel={(e) => {
                e.preventDefault();
                if (!busy) onClose();
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !busy) onClose();
            }}
        >
            <div className={glob.modalContext}>
                <div className={glob.modalHeader}>
                    <h2 id={titleId} className={glob.modalTitle}>
                        {title}
                    </h2>

                    <button
                        type="button"
                        className={glob.iconButton}
                        aria-label="Close dialog"
                        onClick={onClose}
                        disabled={busy}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={glob.modalBody}>
                    {children}
                </div>
            </div>
        </dialog>
    );
}