import { AlertTriangle } from 'lucide-react';
import {  useCallback, useRef, useState } from 'react';
import type {ReactNode} from 'react';
import { Button } from '@/components/ui/button';

type ConfirmModalProps = {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    description?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    processing?: boolean;
};

const variantStyles = {
    danger: {
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    },
    warning: {
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
    },
    info: {
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
    },
};

export function ConfirmModal({
    open,
    onConfirm,
    onCancel,
    title = 'Are you sure?',
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    processing = false,
}: ConfirmModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const styles = variantStyles[variant];

    if (!open) {
return null;
}

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            {/* Backdrop — subtle iOS-style tint with light blur */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Centered panel */}
            <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto p-4">
                <div
                    ref={panelRef}
                    className="bg-background relative w-full max-w-lg transform overflow-hidden rounded-lg shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200"
                >
                    {/* Body */}
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10 ${styles.iconBg}`}>
                                <AlertTriangle className={`size-6 ${styles.iconColor}`} />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-foreground text-lg font-semibold leading-6">
                                    {title}
                                </h3>
                                {description ? (
                                    <div className="text-muted-foreground mt-2 text-sm">
                                        {description}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-muted/50 flex flex-row-reverse gap-2 px-6 py-4">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={onConfirm}
                            className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-semibold tracking-wide transition focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50 ${styles.confirmBtn}`}
                        >
                            {processing ? 'Processing…' : confirmText}
                        </button>
                        <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
                            {cancelText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook for managing confirm modal state.
 */
export function useConfirmModal() {
    const [state, setState] = useState<{
        open: boolean;
        resolve: ((confirmed: boolean) => void) | null;
    }>({ open: false, resolve: null });

    const confirm = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ open: true, resolve });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState({ open: false, resolve: null });
    }, [state]);

    const handleCancel = useCallback(() => {
        state.resolve?.(false);
        setState({ open: false, resolve: null });
    }, [state]);

    return {
        open: state.open,
        confirm,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
    };
}
