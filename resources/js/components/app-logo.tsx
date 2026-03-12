import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
                    <div className="flex h-9 w-9 items-center justify-center">
                        <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    BAJK
                </span>
            </div>
        </>
    );
}
