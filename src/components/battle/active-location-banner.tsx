import type { LocationCardData } from "./types";

type ActiveLocationBannerProps = {
  location: LocationCardData | null;
  large?: boolean;
};

export function ActiveLocationBanner({ location, large = false }: ActiveLocationBannerProps) {
  return (
    <section className={`rounded-xl border border-amber-400/40 bg-amber-500/10 ${large ? "px-4 pt-4 pb-2" : "p-2"} overflow-hidden ${large ? "min-h-[200px]" : ""}`}>
      <p className="text-[11px] uppercase tracking-wide text-amber-200/80">Location ativo</p>

      {location ? (
        <div className={`mt-2 ${large ? "flex flex-col items-start gap-2" : "flex items-center gap-2"}`}>
          <p className={`${large ? "text-lg" : "text-sm"} line-clamp-2 font-semibold text-amber-100`}>{location.name}</p>
          <img
            src={location.imageUrl}
            alt={location.name}
            className={large
              ? "h-48 w-full rounded border border-amber-300/40 object-contain object-left object-top rotate-90"
              : "h-10 w-16 rounded border border-amber-300/40 object-cover"}
          />
        </div>
      ) : (
        <p className="mt-1 text-sm text-amber-100">-</p>
      )}
    </section>
  );
}
