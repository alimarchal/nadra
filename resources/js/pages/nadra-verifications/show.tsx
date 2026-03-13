import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Printer, RefreshCw, Send, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
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
    id: string;
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
    reportFooterText: string;
};

export default function ShowNadraVerification({ verification, responseCodes, reportFooterText }: ShowProps) {
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
    const statusLabel = verification.is_successful ? 'VERIFIED' : verification.response_code ? 'FAILED' : 'PENDING';
    const requestReferenceData = verification.raw_request ?? {
        sessionId: verification.session_id,
        transactionId: verification.transaction_id,
        citizenNumber: verification.citizen_number,
        citizenContactNumber: verification.citizen_contact_number,
        fingerIndex: verification.finger_index,
        templateType: verification.template_type,
        areaName: verification.area_name,
        clientBranchId: verification.client_branch_id,
        clientMachineIdentifier: verification.client_machine_identifier,
        clientSessionId: verification.client_session_id,
        clientTimeStamp: verification.client_timestamp,
        latitude: verification.latitude,
        longitude: verification.longitude,
    };

    const handleCallApi = () => {
        router.post(`/nadra-verifications/${verification.id}/call-api`, {}, { preserveScroll: true });
    };

    const handleGetLastResult = () => {
        router.post(`/nadra-verifications/${verification.id}/last-result`, {}, { preserveScroll: true });
    };

    const handleDelete = async () => {
        playAlertSound();
        const confirmed = await deleteModal.confirm();

        if (confirmed) {
            router.delete(`/nadra-verifications/${verification.id}`);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const jsonOrDash = (value: unknown) => {
        if (value === null || value === undefined) {
            return '-';
        }

        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }

        return String(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Verification #${verification.id}`} />
            <style>{`
                @media screen {
                    .print-only {
                        display: none;
                    }

                    .print-footer {
                        display: none;
                    }
                }

                @media print {
                    @page {
                        margin: 4mm 8mm 8mm;
                    }

                    header,
                    aside,
                    nav,
                    [role='navigation'],
                    [data-slot='sidebar'],
                    [data-slot='sidebar-inset'] > header {
                        display: none !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .screen-only {
                        display: none !important;
                    }

                    .print-only {
                        display: block !important;
                    }

                    .print-page {
                        color: #000;
                        font-family: Arial, Helvetica, sans-serif;
                        margin: 0 !important;
                        padding: 0 0 18mm !important;
                        gap: 2px !important;
                    }

                    .print-page,
                    .print-page * {
                        color: #000 !important;
                    }

                    .print-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        border: 0;
                        padding: 2px 4px;
                        margin: 0 0 2px;
                    }

                    .print-title {
                        margin: 0;
                        font-size: 20px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                    }

                    .print-subtitle {
                        margin: 1px 0 0;
                        font-size: 11px;
                    }

                    .print-section-title {
                        margin-top: 3px;
                        border: 1px solid #000;
                        border-bottom: 0;
                        background: #000;
                        color: #fff;
                        padding: 2px 5px;
                        font-size: 12px;
                        font-weight: 700;
                        text-transform: uppercase;
                    }

                    .print-table {
                        width: 100%;
                        border: 1px solid #000;
                        border-collapse: collapse;
                    }

                    .print-table th,
                    .print-table td {
                        border: 1px solid #000;
                        padding: 3px 5px;
                        font-size: 10px;
                        vertical-align: top;
                        text-align: left;
                    }

                    .print-table th {
                        width: 24%;
                        background: #000;
                        color: #fff;
                        font-weight: 700;
                    }

                    .print-media-table th {
                        width: 50%;
                        text-align: center;
                    }

                    .print-media-table td {
                        text-align: center;
                        vertical-align: middle;
                        padding: 4px;
                    }

                    .print-pre {
                        margin: 0;
                        border: 1px solid #000;
                        border-top: 0;
                        padding: 4px;
                        font-size: 9px;
                        line-height: 1.2;
                        white-space: pre-wrap;
                        word-break: break-word;
                    }

                    .print-media-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0;
                        border: 1px solid #000;
                        border-top: 0;
                        border-bottom: 1px solid #000;
                        padding: 0;
                    }

                    .print-media-box {
                        border: 0;
                        padding: 2px;
                        display: flex;
                        flex-direction: column;
                    }

                    .print-media-box + .print-media-box {
                        border-left: 1px solid #000;
                    }

                    .print-media-title {
                        margin: 0 0 3px;
                        font-size: 10px;
                        font-weight: 700;
                        text-align: center;
                    }

                    .print-media-frame {
                        width: 170px;
                        height: 130px;
                        margin: 0 auto;
                        border: 1px solid #000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                    }

                    .print-media-img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        display: block;
                    }

                    .print-media-empty {
                        width: 100%;
                        height: 100%;
                        border: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0 2px;
                        text-align: center;
                        font-size: 10px;
                    }

                    .print-footer {
                        position: fixed;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 2mm 8mm;
                        border-top: 1px solid #000;
                        background: #fff;
                        font-size: 9px;
                        line-height: 1.2;
                    }

                }
            `}</style>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 print-page">
                <div className="flex items-center justify-between">
                    <Heading title={`Verification #${verification.id}`} description={`CNIC: ${verification.citizen_number}`} />
                    <div className="no-print flex gap-2">
                        <Button
                            size="sm"
                            onClick={handlePrint}
                            className="h-9 w-9 border border-black bg-black p-0 text-white shadow-sm transition hover:bg-black/90"
                            aria-label="Print report"
                            title="Print report"
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                        {auth?.can?.callNadraApi && (
                            <>
                                <Button size="sm" onClick={handleCallApi} className="h-9 gap-2">
                                    <Send className="h-4 w-4" />
                                    Call NADRA API
                                </Button>
                                {verification.session_id && (
                                    <Button variant="outline" size="sm" onClick={handleGetLastResult} className="h-9 gap-2">
                                        <RefreshCw className="h-4 w-4" />
                                        Get Last Result
                                    </Button>
                                )}
                            </>
                        )}
                        {Boolean(auth?.can?.updateNadraVerifications) && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-9 w-9 border border-black p-0"
                                aria-label="Edit verification"
                                title="Edit verification"
                            >
                                <Link href={`/nadra-verifications/${verification.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                        {Boolean(auth?.can?.deleteNadraVerifications) && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                className="h-9 w-9 p-0"
                                aria-label="Delete verification"
                                title="Delete verification"
                            >
                                <Trash2 className="h-4 w-4" />
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

                <div className="screen-only space-y-4">
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Created By User</CardTitle>
                            <CardDescription>User who created this verification record in bank system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                                    <p className="font-mono text-sm">{verification.user?.id ?? verification.user_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                                    <p>{verification.user?.name ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p>{verification.user?.email ?? '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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

                    <Card>
                        <CardHeader>
                            <CardTitle>User Submitted Input (Reference)</CardTitle>
                            <CardDescription>Exact request payload captured from user side for bank system reference.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted rounded p-4 text-xs overflow-auto max-h-80 font-mono">
                                {JSON.stringify(requestReferenceData, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>

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

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-8 text-sm text-muted-foreground">
                                <p>Created: {new Date(verification.created_at).toLocaleString()}</p>
                                <p>Updated: {new Date(verification.updated_at).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="print-only">
                    <div className="print-header">
                        <div>
                            <h1 className="print-title">NADRA VERIFICATION REPORT</h1>
                            <p className="print-subtitle">Bank of Azad Jammu & Kashmir</p>
                            <p className="print-subtitle">Generated: {new Date().toLocaleString()}</p>
                        </div>
                        <AppLogoIcon className="h-20 w-auto object-contain" alt="BAJK Logo" />
                    </div>

                    <table className="print-table">
                        <tbody>
                            <tr>
                                <th>Verification ID</th>
                                <td>{verification.id}</td>
                                <th>Status</th>
                                <td>{statusLabel}</td>
                            </tr>
                            <tr>
                                <th>Response Code</th>
                                <td>{verification.response_code ?? '-'}</td>
                                <th>Response Message</th>
                                <td>{responseCodeInfo?.message ?? verification.response_message ?? '-'}</td>
                            </tr>
                            <tr>
                                <th>Facial Result</th>
                                <td>{verification.facial_result ?? '-'}</td>
                                <th>Fingerprint Result</th>
                                <td>{verification.fingerprint_result ?? '-'}</td>
                            </tr>
                            <tr>
                                <th>Created At</th>
                                <td>{new Date(verification.created_at).toLocaleString()}</td>
                                <th>Updated At</th>
                                <td>{new Date(verification.updated_at).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 className="print-section-title">Citizen Information</h2>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <th>CNIC Number</th>
                                <td>{verification.citizen_number}</td>
                                <th>Contact Number</th>
                                <td>{verification.citizen_contact_number ?? '-'}</td>
                            </tr>
                            <tr>
                                <th>Area Name</th>
                                <td>{verification.area_name}</td>
                                <th>Submitted By</th>
                                <td>{verification.user?.name ?? '-'} ({verification.user?.email ?? '-'})</td>
                            </tr>
                            <tr>
                                <th>Created By User ID</th>
                                <td>{verification.user?.id ?? verification.user_id}</td>
                                <th>Created By Email</th>
                                <td>{verification.user?.email ?? '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 className="print-section-title">Biometric Information</h2>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <th>Finger Index</th>
                                <td>{verification.finger_index ?? '-'}</td>
                                <th>Template Type</th>
                                <td>{verification.template_type ?? '-'}</td>
                            </tr>
                            <tr>
                                <th>Has Fingerprint</th>
                                <td>{verification.finger_template ? 'Yes' : 'No'}</td>
                                <th>Has Photograph</th>
                                <td>{verification.photograph ? 'Yes' : 'No'}</td>
                            </tr>
                            <tr>
                                <th>Available Fingers</th>
                                <td colSpan={3}>{verification.available_fingers?.join(', ') ?? '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 className="print-section-title">BIOMETRIC IMAGES</h2>
                    <table className="print-table print-media-table">
                        <thead>
                            <tr>
                                <th>Citizen Photograph</th>
                                <th>Fingerprint Image</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div className="print-media-frame">
                                        {verification.photograph ? (
                                            <img
                                                src={`data:image/jpeg;base64,${verification.photograph}`}
                                                alt="Citizen Photograph"
                                                className="print-media-img"
                                            />
                                        ) : (
                                            <div className="print-media-empty">Photograph not available</div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="print-media-frame">
                                        {verification.finger_template ? (
                                            <img
                                                src={`data:image/png;base64,${verification.finger_template}`}
                                                alt="Fingerprint"
                                                className="print-media-img"
                                            />
                                        ) : (
                                            <div className="print-media-empty">Fingerprint not available</div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 className="print-section-title">Session and Client Information</h2>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <th>Session ID</th>
                                <td>{verification.session_id ?? '-'}</td>
                                <th>Transaction ID</th>
                                <td>{verification.transaction_id}</td>
                            </tr>
                            <tr>
                                <th>Client Branch ID</th>
                                <td>{verification.client_branch_id}</td>
                                <th>Machine Identifier</th>
                                <td>{verification.client_machine_identifier}</td>
                            </tr>
                            <tr>
                                <th>Client Session ID</th>
                                <td>{verification.client_session_id}</td>
                                <th>Client Timestamp</th>
                                <td>{verification.client_timestamp}</td>
                            </tr>
                            <tr>
                                <th>Latitude</th>
                                <td>{verification.latitude}</td>
                                <th>Longitude</th>
                                <td>{verification.longitude}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 className="print-section-title">Citizen Data</h2>
                    <pre className="print-pre">{jsonOrDash(verification.citizen_data)}</pre>

                    <h2 className="print-section-title">Raw Request</h2>
                    <pre className="print-pre">{jsonOrDash(verification.raw_request)}</pre>

                    <h2 className="print-section-title">Raw Response</h2>
                    <pre className="print-pre">{jsonOrDash(verification.raw_response)}</pre>
                </div>

                <div className="no-print flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/nadra-verifications">Back to List</Link>
                    </Button>
                </div>

                <div className="print-footer" aria-hidden="true">
                    <span>{reportFooterText}</span>
                    <span>Page 1 of 1</span>
                </div>
            </div>
            <ConfirmModal
                open={deleteModal.open}
                onConfirm={deleteModal.onConfirm}
                onCancel={deleteModal.onCancel}
                title="Delete verification"
                description="Are you sure you want to delete this verification record? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </AppLayout>
    );
}
