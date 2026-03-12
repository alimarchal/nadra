import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div
            className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
            style={{
                backgroundImage: 'url(/icons-images/background.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <Link
                                href={home()}
                                className="mx-auto inline-flex items-center justify-center"
                            >
                                <AppLogoIcon className="h-24 w-auto object-contain" />
                            </Link>
                            <CardTitle className="text-xl" dir="auto">
                                {title}
                            </CardTitle>
                            <CardDescription dir="auto">{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8" dir="auto">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
