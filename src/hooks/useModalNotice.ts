
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useModalNotice() {
    const [notice, setNotice] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearNotice = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        setNotice(null);
    }, []);

    const showNotice = useCallback((message: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setNotice(message);
        timeoutRef.current = setTimeout(() => {
            setNotice(null);
            timeoutRef.current = null;
        }, 4000);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return { notice, showNotice, clearNotice };
}
