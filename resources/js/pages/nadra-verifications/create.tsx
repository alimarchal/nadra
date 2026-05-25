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
import type { BreadcrumbItem } from '@/types';

declare global {
    interface Window {
        Fingerprint: {
            WebApi: new () => FingerprintWebApi;
            SampleFormat: { PngImage: number; Raw: number; Compressed: number; Intermediate: number };
            QualityCode: Record<number, string>;
            b64UrlTo64: (data: string) => string;
        };
    }
}

interface FingerprintWebApi {
    onDeviceConnected: ((e: unknown) => void) | null;
    onDeviceDisconnected: ((e: unknown) => void) | null;
    onCommunicationFailed: ((e: unknown) => void) | null;
    onSamplesAcquired: ((s: { samples: string }) => void) | null;
    onQualityReported: ((e: { quality: number }) => void) | null;
    enumerateDevices: () => Promise<string[]>;
    startAcquisition: (format: number, reader: string) => Promise<void>;
    stopAcquisition: () => Promise<void>;
}

type AreaName = { id: number; name: string; label: string };
type FingerIndex = { id: number; name: string; label: string };
type TemplateType = { id: number; name: string; label: string };

type CreateProps = {
    areaNames: AreaName[];
    fingerIndexes: FingerIndex[];
    templateTypes: TemplateType[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'NADRA Verifications', href: '/nadra-verifications' },
    { title: 'New Verification', href: '/nadra-verifications/create' },
];

export default function CreateNadraVerification({ areaNames, fingerIndexes, templateTypes }: CreateProps) {
    const { flash, auth } = usePage().props;

    const form = useForm({
        citizen_number: '',
        citizen_contact_number: '',
        finger_index: '',
        template_type: 'RAW_IMAGE',
        finger_template: '',
        photograph: '',
        area_name: '',
        client_branch_id: String(auth.user?.client_branch_id ?? ''),
        client_machine_identifier: String(auth.user?.client_machine_identifier ?? ''),
        client_session_id: '',
        client_timestamp: new Date().toLocaleDateString('en-GB'),
        latitude: '',
        longitude: '',
        session_id: '',
    });
    const { setData } = form;
    const formErrors = form.errors as Record<string, string | undefined>;

    const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
    const [photographImage, setPhotographImage] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);

    // Fingerprint scanner state
    const sdkRef = useRef<FingerprintWebApi | null>(null);
    const [scannerReady, setScannerReady] = useState(false);
    const [scannerStatus, setScannerStatus] = useState('Loading scanner...');
    const [scannerReaders, setScannerReaders] = useState<string[]>([]);
    const [selectedReader, setSelectedReader] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanQuality, setScanQuality] = useState('');
    const [scannedPreview, setScannedPreview] = useState<string | null>(null);
    const [scannedBase64, setScannedBase64] = useState<string | null>(null);
    const [isCaptured, setIsCaptured] = useState(false);

    // Load Digital Persona SDK scripts
    useEffect(() => {
        const scripts = [
            '/fingerprint-scanner/scripts/es6-shim.js',
            '/fingerprint-scanner/scripts/websdk.client.bundle.min.js',
            '/fingerprint-scanner/scripts/fingerprint.sdk.min.js',
        ];

        let loaded = 0;
        const loadNext = () => {
            if (loaded >= scripts.length) {
                initScanner();
                return;
            }

            const script = document.createElement('script');
            script.src = scripts[loaded];
            script.onload = () => {
                loaded++;
                loadNext();
            };
            script.onerror = () => {
                setScannerStatus('Failed to load scanner SDK');
            };
            document.body.appendChild(script);
        };

        loadNext();
    }, []);

    const initScanner = useCallback(() => {
        if (!window.Fingerprint) {
            setScannerStatus('Scanner SDK not available');
            return;
        }

        const sdk = new window.Fingerprint.WebApi();
        sdkRef.current = sdk;

        sdk.onDeviceConnected = () => setScannerStatus('Scanner connected - ready to scan');
        sdk.onDeviceDisconnected = () => setScannerStatus('Scanner disconnected');
        sdk.onCommunicationFailed = () => setScannerStatus('Communication failed - ensure the scanner service is running');
        sdk.onQualityReported = (e) => setScanQuality(window.Fingerprint.QualityCode[e.quality] || '');

        sdk.onSamplesAcquired = (s) => {
            const samples = JSON.parse(s.samples);
            const base64Image = window.Fingerprint.b64UrlTo64(samples[0]);
            const dataUrl = `data:image/png;base64,${base64Image}`;

            // Show preview only - don't save to form yet
            setScannedPreview(dataUrl);
            setScannedBase64(base64Image);
            setIsCaptured(false);
            setScannerStatus('Fingerprint scanned - click Capture to save');
        };

        // Enumerate readers and auto-start if one is found
        sdk.enumerateDevices().then((readers) => {
            setScannerReaders(readers);
            setScannerReady(true);

            if (readers.length === 0) {
                setScannerStatus('No scanner detected - please connect a scanner');
            } else if (readers.length === 1) {
                setSelectedReader(readers[0]);
                // Auto-start scanning
                sdk.startAcquisition(window.Fingerprint.SampleFormat.PngImage, readers[0]).then(() => {
                    setIsScanning(true);
                    setScannerStatus('Scanner ready - place your finger on the scanner');
                }).catch(() => {
                    setScannerStatus('Scanner ready - click Start Scan');
                });
            } else {
                setScannerStatus('Multiple scanners found - select one below');
            }
        }).catch(() => {
            setScannerStatus('Failed to detect scanners');
        });
    }, [form]);

    const startScan = useCallback(() => {
        if (!sdkRef.current || !selectedReader) return;

        // Reset previous scan
        setScannedPreview(null);
        setScannedBase64(null);
        setIsCaptured(false);
        setFingerprintImage(null);
        form.setData('finger_template', '');

        sdkRef.current.startAcquisition(window.Fingerprint.SampleFormat.PngImage, selectedReader).then(() => {
            setIsScanning(true);
            setScannerStatus('Place your finger on the scanner...');
            setScanQuality('');
        }).catch((error: Error) => {
            setScannerStatus(error.message || 'Failed to start scanning');
        });
    }, [selectedReader, form]);

    const stopScan = useCallback(() => {
        if (!sdkRef.current) return;

        sdkRef.current.stopAcquisition().then(() => {
            setIsScanning(false);
            if (scannedPreview) {
                setScannerStatus('Scanning stopped - click Capture to save');
            } else {
                setScannerStatus('Scanning stopped');
            }
        }).catch(() => {});
    }, [scannedPreview]);

    const captureFingerprint = useCallback(() => {
        if (!scannedBase64 || !scannedPreview) return;

        form.setData('finger_template', scannedBase64);
        setFingerprintImage(scannedPreview);
        setIsCaptured(true);
        setScannerStatus('Fingerprint captured successfully');

        // Stop scanning if still active
        if (sdkRef.current && isScanning) {
            sdkRef.current.stopAcquisition().then(() => setIsScanning(false)).catch(() => {});
        }
    }, [scannedBase64, scannedPreview, form, isScanning]);

    const clearFingerprint = useCallback(() => {
        setFingerprintImage(null);
        setScannedPreview(null);
        setScannedBase64(null);
        setIsCaptured(false);
        form.setData('finger_template', '');
        setScannerStatus('Scanner ready - click Start Scan');
        setScanQuality('');
    }, [form]);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (sdkRef.current) {
                sdkRef.current.stopAcquisition().catch(() => {});
            }
        };
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setData('latitude', pos.coords.latitude.toFixed(6));
                    setData('longitude', pos.coords.longitude.toFixed(6));
                },
                () => {},
            );
        }
    }, [setData]);

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

        ctx.translate(480, 0);
        ctx.scale(-1, 1);
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


    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.post('/nadra-verifications');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New NADRA Verification" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="New Verification" description="Create a new NADRA biometric verification record" />

                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}
                {formErrors.nadra && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{formErrors.nadra}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Citizen Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Citizen Information</CardTitle>
                            <CardDescription>Enter the citizen details for verification</CardDescription>
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
                            <div>
                                <Label htmlFor="session_id">Session ID (for retry)</Label>
                                <Input id="session_id" value={form.data.session_id} onChange={(e) => form.setData('session_id', e.target.value)} placeholder="Leave empty for new session" maxLength={19} />
                                <InputError message={formErrors.session_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fingerprint Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fingerprint Data</CardTitle>
                            <CardDescription>Select finger, then scan using the Digital Persona scanner</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="finger_index">Finger Index *</Label>
                                    <select id="finger_index" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={form.data.finger_index} onChange={(e) => form.setData('finger_index', e.target.value)}>
                                        <option value="">Select Finger</option>
                                        {fingerIndexes.map((f) => (
                                            <option key={f.name} value={f.name}>{f.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={formErrors.finger_index} />
                                </div>
                                <div>
                                    <Label htmlFor="template_type">Template Type *</Label>
                                    <select id="template_type" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={form.data.template_type} onChange={(e) => form.setData('template_type', e.target.value)}>
                                        <option value="">Select Type</option>
                                        {templateTypes.map((t) => (
                                            <option key={t.name} value={t.name}>{t.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={formErrors.template_type} />
                                </div>
                            </div>

                            {/* Scanner Controls & Preview */}
                            {scannerReaders.length > 1 && (
                                <div>
                                    <Label htmlFor="scanner_reader">Select Scanner</Label>
                                    <select id="scanner_reader" className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={selectedReader} onChange={(e) => setSelectedReader(e.target.value)}>
                                        <option value="">Select Scanner</option>
                                        {scannerReaders.map((r) => (
                                            <option key={r} value={r}>Digital Persona ({r})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Left: Controls & Status */}
                                <div className="flex flex-col gap-3">
                                    {/* Status */}
                                    <div className={`rounded-md border px-3 py-2 text-sm ${isScanning ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300' : isCaptured ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300' : 'border-input bg-muted/30 text-muted-foreground'}`}>
                                        {scannerStatus}
                                        {isScanning && (
                                            <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                                        )}
                                    </div>

                                    {scanQuality && (
                                        <p className="text-sm"><span className="text-muted-foreground">Scan Quality:</span> <span className="font-medium">{scanQuality}</span></p>
                                    )}

                                    {/* Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {!isScanning ? (
                                            <Button type="button" onClick={startScan} disabled={!scannerReady || !selectedReader}>
                                                Start Scan
                                            </Button>
                                        ) : (
                                            <Button type="button" variant="outline" onClick={stopScan}>
                                                Stop Scan
                                            </Button>
                                        )}

                                        {scannedPreview && !isCaptured && (
                                            <Button type="button" onClick={captureFingerprint}>
                                                Capture
                                            </Button>
                                        )}

                                        {(scannedPreview || isCaptured) && (
                                            <Button type="button" variant="outline" onClick={clearFingerprint}>
                                                Clear
                                            </Button>
                                        )}
                                    </div>

                                    <InputError message={formErrors.finger_template} />
                                </div>

                                {/* Right: Fingerprint Preview */}
                                <div className="flex flex-col gap-2">
                                    <div className={`flex flex-1 items-center justify-center rounded-md border ${isCaptured ? 'border-green-300 dark:border-green-700' : scannedPreview ? 'border-blue-300 dark:border-blue-700' : ''} bg-muted/30`} style={{ minHeight: '240px' }}>
                                        {scannedPreview || fingerprintImage ? (
                                            <img src={scannedPreview || fingerprintImage || ''} alt="Fingerprint" className="max-h-56 w-auto rounded p-2" />
                                        ) : (
                                            <div className="text-muted-foreground flex flex-col items-center gap-2 p-6 text-center text-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                                                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                                                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                                                    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                                                    <path d="M2 12a10 10 0 0 1 18-6" />
                                                    <path d="M2 16h.01" />
                                                    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
                                                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                                                    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                                                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                                                </svg>
                                                <span>Place finger on scanner</span>
                                            </div>
                                        )}
                                    </div>
                                    {isCaptured && (
                                        <p className="text-center text-sm font-medium text-green-600">Fingerprint captured successfully</p>
                                    )}
                                    {scannedPreview && !isCaptured && (
                                        <p className="text-center text-sm font-medium text-blue-600">Scanned - click Capture to save</p>
                                    )}
                                </div>
                            </div>

                            <input type="hidden" name="finger_template" value={form.data.finger_template} readOnly />
                        </CardContent>
                    </Card>

                    {/* Photograph Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Photograph</CardTitle>
                            <CardDescription>Capture from camera or upload citizen photograph (JPEG, max 30KB, 480x640 recommended)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Camera / Upload */}
                                <div className="space-y-3">
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
                                                <video ref={videoRef} autoPlay playsInline muted className="h-64 w-auto rounded border bg-black" style={{ transform: 'scaleX(-1)' }} />
                                            </div>
                                        )}
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>

                                    <div>
                                        <Label htmlFor="photo_file">Or Upload Photo</Label>
                                        <Input id="photo_file" type="file" accept="image/jpeg,image/jpg" onChange={handlePhotographUpload} />
                                        <p className="text-muted-foreground mt-1 text-xs">Max 30KB, JPEG format, 480x640 pixels recommended</p>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="flex flex-col gap-2">
                                    <Label>Captured Photo</Label>
                                    <div className="bg-muted/30 flex flex-1 items-center justify-center rounded-md border">
                                        {photographImage ? (
                                            <img src={photographImage} alt="Photograph" className="max-h-64 w-auto rounded p-2" />
                                        ) : (
                                            <div className="text-muted-foreground flex flex-col items-center gap-2 p-6 text-center text-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                                                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                                    <circle cx="12" cy="13" r="3" />
                                                </svg>
                                                <span>No photo captured yet</span>
                                            </div>
                                        )}
                                    </div>
                                    {photographImage && (
                                        <p className="text-center text-sm font-medium text-green-600">Photo captured successfully</p>
                                    )}
                                    <InputError message={formErrors.photograph} />
                                </div>
                            </div>

                            <input type="hidden" name="photograph" value={form.data.photograph} readOnly />
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


                    <div className="flex gap-2">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Creating...' : 'Create Verification Record'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/nadra-verifications">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
