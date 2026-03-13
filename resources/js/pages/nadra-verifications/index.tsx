import { Head, Link, router, usePage } from '@inertiajs/react';
import { Filter, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal, useConfirmModal } from '@/components/confirm-modal';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { playAlertSound, playSuccessSound } from '@/lib/sounds';
import type { BreadcrumbItem } from '@/types';

type VerificationRow = {
    id: string;
    user_id: number;
    session_id: string | null;
    citizen_number: string;
    area_name: string;
    finger_index: string | null;
    template_type: string | null;
    response_code: string | null;
    response_message: string | null;
    facial_result: string | null;
    fingerprint_result: string | null;
    is_successful: boolean;
    created_at: string;
    user?: { id: number; name: string; email: string };
};

type PaginatorLink = { url: string | null; label: string; active: boolean };

type VerificationPaginator = {
    data: VerificationRow[];
    links: PaginatorLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Filters = {
    citizen_number?: string | null;
    area_name?: string | null;
    response_code?: string | null;
    is_successful?: string | null;
    session_id?: string | null;
    date_from?: string | null;
    date_to?: string | null;
};

type AreaName = { id: number; name: string; label: string };
type ResponseCode = { id: number; code: string; message: string };

type IndexProps = {
    verifications: VerificationPaginator;
    filters: Filters;
    sort?: string | null;
    areaNames: AreaName[];
    responseCodes: ResponseCode[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'NADRA Verifications', href: '/nadra-verifications' }];

export default function NadraVerificationsIndex({ verifications, filters, areaNames, responseCodes }: IndexProps) {
    const { auth, flash } = usePage().props;
    const deleteModal = useConfirmModal();
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState<Filters>({
        citizen_number: filters.citizen_number ?? '',
        area_name: filters.area_name ?? '',
        response_code: filters.response_code ?? '',
        is_successful: filters.is_successful ?? '',
        session_id: filters.session_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const filterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (flash?.success) {
            playSuccessSound();
        }
    }, [flash?.success]);

    const hasActiveFilters = useMemo(
        () => Object.values(filters).some((v) => v !== null && v !== '' && v !== undefined),
        [filters],
    );

    const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const applyFilters = useCallback(
        (e?: FormEvent) => {
            e?.preventDefault();
            const params: Record<string, string> = {};
            Object.entries(localFilters).forEach(([k, v]) => {
                if (v) {
                    params[`filter[${k}]`] = v;
                }
            });
            router.get('/nadra-verifications', params, { preserveState: true, preserveScroll: true });
        },
        [localFilters],
    );

    const clearFilters = useCallback(() => {
        setLocalFilters({ citizen_number: '', area_name: '', response_code: '', is_successful: '', session_id: '', date_from: '', date_to: '' });
        router.get('/nadra-verifications', {}, { preserveState: true, preserveScroll: true });
    }, []);

    const handleFilterMouseLeave = useCallback(() => {
        filterTimerRef.current = setTimeout(() => setShowFilters(false), 5000);
    }, []);

    const handleFilterMouseEnter = useCallback(() => {
        if (filterTimerRef.current) {
            clearTimeout(filterTimerRef.current);
            filterTimerRef.current = null;
        }
    }, []);

    const deleteVerification = useCallback(
        async (id: string) => {
            setDeleteTargetId(id);
            playAlertSound();
            const confirmed = await deleteModal.confirm();

            if (confirmed) {
                router.delete(`/nadra-verifications/${id}`, { preserveScroll: true });
            }

            setDeleteTargetId(null);
        },
        [deleteModal],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="NADRA Verifications" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="NADRA Verifications" description="Biometric verification records" />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                            <Filter className="mr-1 h-4 w-4" />
                            Filters
                            {hasActiveFilters && <Badge className="ml-1" variant="secondary">Active</Badge>}
                        </Button>
                        {auth?.can?.createNadraVerifications && (
                            <Button asChild size="sm">
                                <Link href="/nadra-verifications/create">New Verification</Link>
                            </Button>
                        )}
                    </div>
                </div>

                {flash?.success && (
                    <Alert className="border-green-500/30 bg-green-500/5">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}
                {flash?.error && (
                    <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {showFilters && (
                    <Card
                        ref={filterRef}
                        onMouseLeave={handleFilterMouseLeave}
                        onMouseEnter={handleFilterMouseEnter}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Filters</CardTitle>
                                <button type="button" onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={applyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                                <div>
                                    <Label htmlFor="f-cnic">CNIC</Label>
                                    <Input id="f-cnic" value={localFilters.citizen_number ?? ''} onChange={(e) => handleFilterChange('citizen_number', e.target.value)} placeholder="13 digit CNIC" />
                                </div>
                                <div>
                                    <Label htmlFor="f-session">Session ID</Label>
                                    <Input id="f-session" value={localFilters.session_id ?? ''} onChange={(e) => handleFilterChange('session_id', e.target.value)} placeholder="Session ID" />
                                </div>
                                <div>
                                    <Label htmlFor="f-area">Area</Label>
                                    <select id="f-area" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={localFilters.area_name ?? ''} onChange={(e) => handleFilterChange('area_name', e.target.value)}>
                                        <option value="">All Areas</option>
                                        {areaNames.map((a) => (
                                            <option key={a.name} value={a.name}>{a.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="f-code">Response Code</Label>
                                    <select id="f-code" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={localFilters.response_code ?? ''} onChange={(e) => handleFilterChange('response_code', e.target.value)}>
                                        <option value="">All Codes</option>
                                        {responseCodes.map((rc) => (
                                            <option key={rc.code} value={rc.code}>{rc.code} - {rc.message}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="f-status">Status</Label>
                                    <select id="f-status" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={localFilters.is_successful ?? ''} onChange={(e) => handleFilterChange('is_successful', e.target.value)}>
                                        <option value="">All</option>
                                        <option value="1">Successful</option>
                                        <option value="0">Failed</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="f-from">Date From</Label>
                                    <Input id="f-from" type="date" value={localFilters.date_from ?? ''} onChange={(e) => handleFilterChange('date_from', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="f-to">Date To</Label>
                                    <Input id="f-to" type="date" value={localFilters.date_to ?? ''} onChange={(e) => handleFilterChange('date_to', e.target.value)} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button type="submit" size="sm">Apply</Button>
                                    {hasActiveFilters && (
                                        <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Verification Records</CardTitle>
                        <CardDescription>
                            {verifications.total > 0
                                ? `Showing ${verifications.from} to ${verifications.to} of ${verifications.total} records`
                                : 'No records found'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-2 font-medium">#</th>
                                        <th className="p-2 font-medium">CNIC</th>
                                        <th className="p-2 font-medium">Area</th>
                                        <th className="p-2 font-medium">Session ID</th>
                                        <th className="p-2 font-medium">Response</th>
                                        <th className="p-2 font-medium">Status</th>
                                        <th className="p-2 font-medium">Date</th>
                                        {auth?.can?.viewAllNadraVerifications && <th className="p-2 font-medium">User</th>}
                                        <th className="p-2 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {verifications.data.map((v) => (
                                        <tr key={v.id} className="border-b">
                                            <td className="p-2 font-mono text-xs" title={v.id}>{v.id.slice(0, 8)}</td>
                                            <td className="p-2 font-mono">{v.citizen_number}</td>
                                            <td className="p-2">{v.area_name}</td>
                                            <td className="p-2 font-mono text-xs">{v.session_id ?? '-'}</td>
                                            <td className="p-2">
                                                {v.response_code ? (
                                                    <Badge variant={v.response_code === '100' ? 'default' : 'secondary'}>
                                                        {v.response_code}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">Pending</span>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {v.is_successful ? (
                                                    <Badge className="bg-green-600">Verified</Badge>
                                                ) : v.response_code ? (
                                                    <Badge variant="destructive">Failed</Badge>
                                                ) : (
                                                    <Badge variant="outline">Pending</Badge>
                                                )}
                                            </td>
                                            <td className="p-2 text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
                                            {auth?.can?.viewAllNadraVerifications && (
                                                <td className="p-2 text-xs">{v.user?.name ?? '-'}</td>
                                            )}
                                            <td className="p-2">
                                                <div className="flex gap-1">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/nadra-verifications/${v.id}`}>View</Link>
                                                    </Button>
                                                    {auth?.can?.updateNadraVerifications && (
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/nadra-verifications/${v.id}/edit`}>Edit</Link>
                                                        </Button>
                                                    )}
                                                    {auth?.can?.deleteNadraVerifications && (
                                                        <Button variant="destructive" size="sm" onClick={() => deleteVerification(v.id)}>
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {verifications.data.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                                No verification records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {verifications.links.length > 3 && (
                            <div className="mt-4 flex items-center justify-center gap-1">
                                {verifications.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} preserveScroll dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <ConfirmModal
                open={deleteModal.open}
                onConfirm={deleteModal.onConfirm}
                onCancel={deleteModal.onCancel}
                title="Delete verification"
                description={
                    deleteTargetId
                        ? `Are you sure you want to delete verification #${deleteTargetId.slice(0, 8)}? This action cannot be undone.`
                        : 'Are you sure you want to delete this verification record? This action cannot be undone.'
                }
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </AppLayout>
    );
}
