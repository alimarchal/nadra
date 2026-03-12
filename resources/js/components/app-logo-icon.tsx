import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/icons-images/BAJK logo.png"
            alt={alt ?? 'BAJK Logo'}
            className={className}
            {...props}
        />
    );
}
