import { Lock } from 'lucide-react';
import { type FormEvent, useCallback, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type PasswordConfirmModalProps = {
    open: boolean;
    onConfirmed: () => void;
    onCancel: () => void;
    title?: string;
    description?: string;
};

export function PasswordConfirmModal({
    open,
    onConfirmed,
    onCancel,
    title = 'Confirm your password',
    description = 'For security, please confirm your password before continuing.',
}: PasswordConfirmModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setPassword('');
        setError('');
        setProcessing(false);
    };

    const handleCancel = () => {
        reset();
        onCancel();
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setProcessing(true);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

            const response = await fetch('/user/confirm-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                reset();
                onConfirmed();
            } else if (response.status === 422) {
                const data = await response.json();
                setError(data.errors?.password?.[0] ?? data.message ?? 'The provided password is incorrect.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            {/* Backdrop — subtle iOS-style tint with light blur */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity"
                onClick={handleCancel}
                aria-hidden="true"
            />

            {/* Centered panel */}
            <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto p-4">
                <div className="bg-background relative w-full max-w-md transform overflow-hidden rounded-lg shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200">
                    {/* Body */}
                    <div className="px-6 pt-6 pb-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-full">
                                <Lock className="text-primary size-6" />
                            </div>
                            <h3 className="text-foreground text-lg font-semibold">{title}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Password</Label>
                                <PasswordInput
                                    id="confirm-password"
                                    ref={inputRef}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    autoFocus
                                />
                                <InputError message={error} />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleCancel}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" disabled={processing || !password}>
                                    {processing ? <Spinner className="mr-2" /> : null}
                                    Confirm
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook for managing password confirmation modal state.
 */
export function usePasswordConfirmModal() {
    const [state, setState] = useState<{
        open: boolean;
        resolve: ((confirmed: boolean) => void) | null;
    }>({ open: false, resolve: null });

    const confirm = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ open: true, resolve });
        });
    }, []);

    const handleConfirmed = useCallback(() => {
        state.resolve?.(true);
        setState({ open: false, resolve: null });
    }, [state.resolve]);

    const handleCancel = useCallback(() => {
        state.resolve?.(false);
        setState({ open: false, resolve: null });
    }, [state.resolve]);

    return {
        open: state.open,
        confirm,
        onConfirmed: handleConfirmed,
        onCancel: handleCancel,
    };
}
