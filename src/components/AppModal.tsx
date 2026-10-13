"use client";

import glob from "@/styles/Global.module.css";
import { AppModalProps } from "@/types";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import toast, { useToasterStore } from "react-hot-toast";

export default function AppModal({
    open,
    title,
    children,
    onClose,
    busy = false,
}: AppModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const { toasts } = useToasterStore();
    const toastsRef = useRef(toasts);
    const [dialogReady, setDialogReady] = useState(false);

    useEffect(() => {
        toastsRef.current = toasts;
    }, [toasts]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) {
            toastsRef.current
                .filter((t) => t.type === "error")
                .forEach((t) => toast.remove(t.id));

            dialog.showModal();
            setDialogReady(true);
        } else if (!open && dialog.open) {
            toastsRef.current
                .filter((t) => t.type === "error")
                .forEach((t) => toast.remove(t.id));

            setDialogReady(false);
            dialog.close();
        }
    }, [open]);

    const currentError = dialogReady && open
        ? toasts.find((t) => t.visible && t.type === "error")
        : null;

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
                {currentError && (
                    <div
                        role="alert"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "12px 16px",
                            marginBottom: "16px",
                            borderRadius: "8px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            fontSize: "14px",
                            fontWeight: 500,
                        }}
                    >
                        <span aria-hidden="true">❌</span>
                        <span>
                            {typeof currentError.message === "function"
                                ? currentError.message(currentError)
                                : currentError.message}
                        </span>
                    </div>
                )}

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