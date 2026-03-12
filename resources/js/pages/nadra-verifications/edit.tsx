import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { playSuccessSound } from '@/lib/sounds';
import type { BreadcrumbItem } from '@/types';

type AreaName = { id: number; name: string; label: string };
type FingerIndex = { id: number; name: string; label: string };
type TemplateType = { id: number; name: string; label: string };

type Verification = {
    id: string;
    citizen_number: string;
    citizen_contact_number: string | null;
    finger_index: string | null;
    template_type: string | null;
    finger_template: string | null;
    photograph: string | null;
    area_name: string;
    client_branch_id: string;
    client_machine_identifier: string;
    client_session_id: string;
    client_timestamp: string;
    latitude: string;
    longitude: string;
    session_id: string | null;
};

type EditProps = {
    verification: Verification;
    areaNames: AreaName[];
    fingerIndexes: FingerIndex[];
    templateTypes: TemplateType[];
};

export default function EditNadraVerification({ verification, areaNames, fingerIndexes, templateTypes }: EditProps) {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) {
            playSuccessSound();
        }
    }, [flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'NADRA Verifications', href: '/nadra-verifications' },
        { title: `#${verification.id}`, href: `/nadra-verifications/${verification.id}` },
        { title: 'Edit', href: `/nadra-verifications/${verification.id}/edit` },
    ];

    const form = useForm({
        citizen_number: verification.citizen_number ?? '',
        citizen_contact_number: verification.citizen_contact_number ?? '',
        finger_index: verification.finger_index ?? '',
        template_type: verification.template_type ?? 'RAW_IMAGE',
        finger_template: verification.finger_template ?? '',
        photograph: verification.photograph ?? '',
        area_name: verification.area_name ?? '',
        client_branch_id: verification.client_branch_id ?? '',
        client_machine_identifier: verification.client_machine_identifier ?? '',
        client_session_id: verification.client_session_id ?? '',
        client_timestamp: verification.client_timestamp ?? '',
        latitude: verification.latitude ?? '',
        longitude: verification.longitude ?? '',
    });
    const formErrors = form.errors as Record<string, string | undefined>;

    const [fingerprintImage, setFingerprintImage] = useState<string | null>(
        verification.finger_template ? `data:image/png;base64,${verification.finger_template}` : null,
    );
    const [photographImage, setPhotographImage] = useState<string | null>(
        verification.photograph ? `data:image/jpeg;base64,${verification.photograph}` : null,
    );
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const scannerRef = useRef<HTMLIFrameElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }

        setIsCameraOpen(false);
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    useEffect(() => {
        if (isCameraOpen && videoRef.current && cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;
        }
    }, [isCameraOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 640, facingMode: 'user' } });
            cameraStreamRef.current = stream;
            setIsCameraOpen(true);
        } catch {
            alert('Unable to access camera. Please check permissions.');
        }
    };

    const captureFromCamera = () => {
        if (!videoRef.current || !canvasRef.current) {
return;
}

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = 480;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
return;
}

        ctx.drawImage(video, 0, 0, 480, 640);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        const base64 = dataUrl.split(',')[1];
        form.setData('photograph', base64);
        setPhotographImage(dataUrl);
        stopCamera();
    };

    const handlePhotographUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
return;
}

        if (file.size > 30 * 1024) {
            alert('Photograph must be less than 30KB');

            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            form.setData('photograph', base64);
            setPhotographImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const captureFromScanner = () => {
        try {
            const imageSrc = localStorage.getItem('imageSrc');

            if (imageSrc) {
                const base64 = imageSrc.split(',')[1] || imageSrc;
                form.setData('finger_template', base64);
                setFingerprintImage(imageSrc.startsWith('data:') ? imageSrc : `data:image/png;base64,${imageSrc}`);
            } else {
                alert('No fingerprint captured. Please scan a fingerprint first.');
            }
        } catch {
            alert('Unable to read fingerprint data from scanner.');
        }
    };

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.put(`/nadra-verifications/${verification.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Verification #${verification.id}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title={`Edit Verification #${verification.id}`} description="Update the verification record" />

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

                <form onSubmit={submit} className="space-y-6">
                    {/* Citizen Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Citizen Information</CardTitle>
                            <CardDescription>Update citizen details</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="citizen_number">CNIC Number *</Label>
                                <Input id="citizen_number" value={form.data.citizen_number} onChange={(e) => form.setData('citizen_number', e.target.value)} placeholder="6110119876547" maxLength={13} />
                                <InputError message={formErrors.citizen_number} />
                            </div>
                            <div>
                                <Label htmlFor="citizen_contact_number">Contact Number</Label>
                                <Input id="citizen_contact_number" value={form.data.citizen_contact_number} onChange={(e) => form.setData('citizen_contact_number', e.target.value)} placeholder="03001234567" maxLength={16} />
                                <InputError message={formErrors.citizen_contact_number} />
                            </div>
                            <div>
                                <Label htmlFor="area_name">Area Name *</Label>
                                <select id="area_name" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={form.data.area_name} onChange={(e) => form.setData('area_name', e.target.value)}>
                                    <option value="">Select Area</option>
                                    {areaNames.map((a) => (
                                        <option key={a.name} value={a.name}>{a.label}</option>
                                    ))}
                                </select>
                                <InputError message={formErrors.area_name} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fingerprint Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fingerprint Data</CardTitle>
                            <CardDescription>Update or re-capture fingerprint</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <Label htmlFor="finger_index">Finger Index</Label>
                                    <select id="finger_index" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={form.data.finger_index} onChange={(e) => form.setData('finger_index', e.target.value)}>
                                        <option value="">Select Finger</option>
                                        {fingerIndexes.map((f) => (
                                            <option key={f.name} value={f.name}>{f.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={formErrors.finger_index} />
                                </div>
                                <div>
                                    <Label htmlFor="template_type">Template Type</Label>
                                    <select id="template_type" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={form.data.template_type} onChange={(e) => form.setData('template_type', e.target.value)}>
                                        <option value="">Select Type</option>
                                        {templateTypes.map((t) => (
                                            <option key={t.name} value={t.name}>{t.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={formErrors.template_type} />
                                </div>
                                <div className="flex items-end">
                                    <Button type="button" variant="outline" onClick={captureFromScanner}>
                                        Re-capture from Scanner
                                    </Button>
                                </div>
                            </div>

                            {fingerprintImage && (
                                <div className="flex items-center gap-4">
                                    <img src={fingerprintImage} alt="Fingerprint" className="h-32 w-auto rounded border" />
                                    <span className="text-sm text-green-600">Fingerprint available</span>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="finger_template">Finger Template (Base64)</Label>
                                <textarea id="finger_template" className="border-input bg-background flex min-h-[60px] w-full rounded-md border px-3 py-2 text-xs font-mono" value={form.data.finger_template} onChange={(e) => form.setData('finger_template', e.target.value)} rows={3} placeholder="Base64 encoded fingerprint template..." />
                                <InputError message={formErrors.finger_template} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Photograph Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Photograph</CardTitle>
                            <CardDescription>Capture from camera or upload citizen photograph (JPEG, max 30KB, 480x640 recommended)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Live Camera */}
                            <div>
                                <Label>Live Camera</Label>
                                <div className="mt-1 flex items-center gap-2">
                                    {!isCameraOpen ? (
                                        <Button type="button" variant="outline" onClick={startCamera}>Open Camera</Button>
                                    ) : (
                                        <>
                                            <Button type="button" onClick={captureFromCamera}>Capture Photo</Button>
                                            <Button type="button" variant="outline" onClick={stopCamera}>Close Camera</Button>
                                        </>
                                    )}
                                </div>
                                {isCameraOpen && (
                                    <div className="mt-2">
                                        <video ref={videoRef} autoPlay playsInline muted className="h-64 w-auto rounded border bg-black" />
                                    </div>
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            {/* File Upload */}
                            <div>
                                <Label htmlFor="photo_file">Or Upload Photo</Label>
                                <Input id="photo_file" type="file" accept="image/jpeg,image/jpg" onChange={handlePhotographUpload} />
                                <p className="text-xs text-muted-foreground mt-1">Max 30KB, JPEG format, 480×640 pixels recommended</p>
                            </div>
                            {photographImage && (
                                <div className="flex items-center gap-4">
                                    <img src={photographImage} alt="Photograph" className="h-32 w-auto rounded border" />
                                    <span className="text-sm text-green-600">Photo available</span>
                                </div>
                            )}
                            <div>
                                <Label htmlFor="photograph">Photograph (Base64)</Label>
                                <textarea id="photograph" className="border-input bg-background flex min-h-[60px] w-full rounded-md border px-3 py-2 text-xs font-mono" value={form.data.photograph} onChange={(e) => form.setData('photograph', e.target.value)} rows={3} placeholder="Base64 encoded JPEG photograph..." />
                                <InputError message={formErrors.photograph} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Client/Machine Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Information</CardTitle>
                            <CardDescription>Machine and location details</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="client_branch_id">Branch ID *</Label>
                                <Input id="client_branch_id" value={form.data.client_branch_id} onChange={(e) => form.setData('client_branch_id', e.target.value)} placeholder="123456" />
                                <InputError message={formErrors.client_branch_id} />
                            </div>
                            <div>
                                <Label htmlFor="client_machine_identifier">Machine Identifier *</Label>
                                <Input id="client_machine_identifier" value={form.data.client_machine_identifier} onChange={(e) => form.setData('client_machine_identifier', e.target.value)} placeholder="ac-de-hf-qw-03" />
                                <InputError message={formErrors.client_machine_identifier} />
                            </div>
                            <div>
                                <Label htmlFor="client_session_id">Client Session ID *</Label>
                                <Input id="client_session_id" value={form.data.client_session_id} onChange={(e) => form.setData('client_session_id', e.target.value)} placeholder="7894561234545" />
                                <InputError message={formErrors.client_session_id} />
                            </div>
                            <div>
                                <Label htmlFor="client_timestamp">Client Timestamp *</Label>
                                <Input id="client_timestamp" value={form.data.client_timestamp} onChange={(e) => form.setData('client_timestamp', e.target.value)} placeholder="12/03/2026" />
                                <InputError message={formErrors.client_timestamp} />
                            </div>
                            <div>
                                <Label htmlFor="latitude">Latitude *</Label>
                                <Input id="latitude" type="number" step="0.000001" value={form.data.latitude} onChange={(e) => form.setData('latitude', e.target.value)} placeholder="33.761" />
                                <InputError message={formErrors.latitude} />
                            </div>
                            <div>
                                <Label htmlFor="longitude">Longitude *</Label>
                                <Input id="longitude" type="number" step="0.000001" value={form.data.longitude} onChange={(e) => form.setData('longitude', e.target.value)} placeholder="73.096" />
                                <InputError message={formErrors.longitude} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fingerprint Scanner (iframe) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fingerprint Scanner</CardTitle>
                            <CardDescription>Digital Persona fingerprint scanner interface (requires Windows desktop app)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <iframe
                                ref={scannerRef}
                                src="/fingerprint-scanner/index.html"
                                className="h-[500px] w-full rounded border"
                                title="Fingerprint Scanner"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Updating...' : 'Update Verification Record'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/nadra-verifications/${verification.id}`}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
