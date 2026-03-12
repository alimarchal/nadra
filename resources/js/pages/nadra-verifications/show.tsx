import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { ConfirmModal, useConfirmModal } from '@/components/confirm-modal';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { playAlertSound, playSuccessSound } from '@/lib/sounds';
import type { BreadcrumbItem } from '@/types';

type ResponseCode = { id: number; code: string; message: string };

type Verification = {
    id: number;
    user_id: number;
    session_id: string | null;
    citizen_number: string;
    citizen_contact_number: string | null;
    finger_index: string | null;
    template_type: string | null;
    finger_template: string | null;
    photograph: string | null;
    transaction_id: string;
    area_name: string;
    client_branch_id: string;
    client_machine_identifier: string;
    client_session_id: string;
    client_timestamp: string;
    latitude: string;
    longitude: string;
    response_code: string | null;
    response_message: string | null;
    facial_result: string | null;
    fingerprint_result: string | null;
    citizen_data: Record<string, unknown> | null;
    available_fingers: string[] | null;
    raw_request: Record<string, unknown> | null;
    raw_response: Record<string, unknown> | null;
    is_successful: boolean;
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string; email: string };
};

type ShowProps = {
    verification: Verification;
    responseCodes: ResponseCode[];
};

export default function ShowNadraVerification({ verification, responseCodes }: ShowProps) {
    const { auth, flash } = usePage().props;
    const deleteModal = useConfirmModal();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'NADRA Verifications', href: '/nadra-verifications' },
        { title: `#${verification.id}`, href: `/nadra-verifications/${verification.id}` },
    ];

    useEffect(() => {
        if (flash?.success) {
            playSuccessSound();
        }
    }, [flash?.success]);

    const responseCodeInfo = responseCodes.find((rc) => rc.code === verification.response_code);

    const handleCallApi = () => {
        router.post(`/nadra-verifications/${verification.id}/call-api`, {}, { preserveScroll: true });
    };

    const handleGetLastResult = () => {
        router.post(`/nadra-verifications/${verification.id}/last-result`, {}, { preserveScroll: true });
    };

    const handleDelete = async () => {
        playAlertSound();
        const confirmed = await deleteModal.confirm({
            title: 'Delete Verification Record',
            description: 'Are you sure you want to delete this verification record? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger',
        });
        if (confirmed) {
            router.delete(`/nadra-verifications/${verification.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Verification #${verification.id}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title={`Verification #${verification.id}`} description={`CNIC: ${verification.citizen_number}`} />
                    <div className="flex gap-2">
                        {auth?.can?.callNadraApi && (
                            <>
                                <Button size="sm" onClick={handleCallApi}>
                                    Call NADRA API
                                </Button>
                                {verification.session_id && (
                                    <Button variant="outline" size="sm" onClick={handleGetLastResult}>
                                        Get Last Result
                                    </Button>
                                )}
                            </>
                        )}
                        {auth?.can?.updateNadraVerifications && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/nadra-verifications/${verification.id}/edit`}>Edit</Link>
                            </Button>
                        )}
                        {auth?.can?.deleteNadraVerifications && (
                            <Button variant="destructive" size="sm" onClick={handleDelete}>
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {flash?.success && (
                    <Alert>
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}
                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {/* Verification Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Verification Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Overall Status</p>
                                <div className="mt-1">
                                    {verification.is_successful ? (
                                        <Badge className="bg-green-600 text-lg px-3 py-1">VERIFIED</Badge>
                                    ) : verification.response_code ? (
                                        <Badge variant="destructive" className="text-lg px-3 py-1">FAILED</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-lg px-3 py-1">PENDING</Badge>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Facial Result</p>
                                <p className="mt-1 text-lg font-semibold">
                                    {verification.facial_result === 'MATCH' ? (
                                        <span className="text-green-600">MATCH</span>
                                    ) : verification.facial_result === 'NOT_MATCH' ? (
                                        <span className="text-red-600">NOT MATCH</span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Fingerprint Result</p>
                                <p className="mt-1 text-lg font-semibold">
                                    {verification.fingerprint_result === 'MATCH' ? (
                                        <span className="text-green-600">MATCH</span>
                                    ) : verification.fingerprint_result === 'NOT_MATCH' ? (
                                        <span className="text-red-600">NOT MATCH</span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Response Code</p>
                                <p className="mt-1">
                                    {verification.response_code ? (
                                        <>
                                            <Badge variant={verification.response_code === '100' ? 'default' : 'secondary'}>
                                                {verification.response_code}
                                            </Badge>
                                            <span className="ml-2 text-sm">{responseCodeInfo?.message ?? verification.response_message}</span>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">No response yet</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Citizen Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Citizen Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">CNIC Number</p>
                                <p className="font-mono text-lg">{verification.citizen_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                                <p>{verification.citizen_contact_number || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Area</p>
                                <p>{verification.area_name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Biometric Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Biometric Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Finger Index</p>
                                <p>{verification.finger_index || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Template Type</p>
                                <p>{verification.template_type || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Has Fingerprint</p>
                                <p>{verification.finger_template ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Has Photograph</p>
                                <p>{verification.photograph ? 'Yes' : 'No'}</p>
                            </div>
                            {verification.photograph && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Photograph Preview</p>
                                    <img
                                        src={`data:image/jpeg;base64,${verification.photograph}`}
                                        alt="Citizen Photo"
                                        className="mt-1 h-32 w-auto rounded border"
                                    />
                                </div>
                            )}
                        </div>
                        {verification.available_fingers && verification.available_fingers.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-muted-foreground">Available Fingers for Retry</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {verification.available_fingers.map((f) => (
                                        <Badge key={f} variant="outline">{f}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Session & Transaction Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Session & Transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Session ID</p>
                                <p className="font-mono text-sm">{verification.session_id || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                                <p className="font-mono text-sm">{verification.transaction_id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                                <p>{verification.user?.name ?? '-'} ({verification.user?.email ?? '-'})</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Client Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Client Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Branch ID</p>
                                <p>{verification.client_branch_id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Machine Identifier</p>
                                <p className="font-mono text-sm">{verification.client_machine_identifier}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Client Session ID</p>
                                <p className="font-mono text-sm">{verification.client_session_id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Client Timestamp</p>
                                <p>{verification.client_timestamp}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                                <p>{verification.latitude}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                                <p>{verification.longitude}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Citizen Data (if available) */}
                {verification.citizen_data && Object.keys(verification.citizen_data).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Citizen Data (from NADRA)</CardTitle>
                            <CardDescription>Data returned by NADRA upon successful verification</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted rounded p-4 text-sm overflow-auto max-h-96">
                                {JSON.stringify(verification.citizen_data, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}

                {/* Raw Response (for debugging) */}
                {verification.raw_response && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Raw API Response</CardTitle>
                            <CardDescription>Complete response from NADRA API</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted rounded p-4 text-xs overflow-auto max-h-64 font-mono">
                                {JSON.stringify(verification.raw_response, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}

                {/* Timestamps */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <p>Created: {new Date(verification.created_at).toLocaleString()}</p>
                            <p>Updated: {new Date(verification.updated_at).toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/nadra-verifications">Back to List</Link>
                    </Button>
                </div>
            </div>
            <ConfirmModal isOpen={deleteModal.isOpen} options={deleteModal.options} onConfirm={deleteModal.handleConfirm} onCancel={deleteModal.handleCancel} />
        </AppLayout>
    );
}
