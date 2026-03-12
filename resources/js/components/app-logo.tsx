export default function AppLogo() {
    return (
        <>
            <div className="flex h-9 w-9 items-center justify-center">
                <img
                    src="/favicon-32x32.png"
                    alt="BAJK Icon"
                    className="h-8 w-8 object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    BAJK
                </span>
            </div>
        </>
    );
}
