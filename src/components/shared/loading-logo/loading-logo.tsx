type LoadingLogoProps = {
    size?: "small" | "large";
    alt?: string;
};

export function LoadingLogo({ size = "small", alt = "" }: LoadingLogoProps) {
    return (
        <img
            src="/assets/logo.png"
            alt={alt}
            aria-hidden={alt ? undefined : true}
            className={size === "large" ? "loadingLogoSpinLarge" : "loadingLogoSpin"}
        />
    );
}
