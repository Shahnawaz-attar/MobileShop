import Image from "next/image";

type HeroDeviceType = "PHONE" | "TABLET" | "OTHER" | "WATCH";

interface PhoneFrameProps {
  src?: string | null;
  alt?: string | null;
  /** Drives the device frame shape. Default PHONE. */
  deviceType?: HeroDeviceType;
  className?: string;
  priority?: boolean;
  /** Show a small dynamic-island pill (phones only). Default true. */
  island?: boolean;
}

/**
 * A pure-CSS device mockup — the signature "showroom" visual.
 * Renders the correct frame for the device type:
 *  - PHONE  → tall rounded handset with a dynamic island
 *  - TABLET → wider rounded tablet (no island)
 *  - OTHER / WATCH → clean rounded square showcase (no phone bezel)
 * Uses only Tailwind — no images, no heavy libs, mobile-first.
 */
export function PhoneFrame({
  src,
  alt,
  deviceType = "PHONE",
  className = "",
  priority = false,
  island = true,
}: PhoneFrameProps) {
  const isPhone = deviceType === "PHONE";
  const isTablet = deviceType === "TABLET";

  // Watch / OTHER get a simple rounded "screen" showcase instead of a phone bezel
  if (!isPhone && !isTablet) {
    return (
      <div className={`relative select-none ${className}`} aria-hidden={src ? undefined : true}>
        <div className="relative aspect-square w-full overflow-hidden rounded-[2.2rem] border border-black/10 bg-ink shadow-[0_40px_80px_-24px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-[3.5%] overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-slate-100 to-white">
            {src ? (
              <Image
                src={src}
                alt={alt ?? "Device photo"}
                fill
                priority={priority}
                sizes="(max-width: 480px) 70vw, 380px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">⌚</div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_28%)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative select-none ${className}`}
      aria-hidden={src ? undefined : true}
    >
      {/* Bezel */}
      <div className="relative mx-auto w-full rounded-[2.6rem] border border-black/10 bg-ink p-[3.5%] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.45),inset_0_0_0_1.5px_rgba(255,255,255,0.12)]">
        {/* Screen */}
        <div
          className={`relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-100 to-white ${
            isTablet ? "aspect-[4/3]" : "aspect-[9/19]"
          }`}
        >
          {src ? (
            <Image
              src={src}
              alt={alt ?? "Device photo"}
              fill
              priority={priority}
              sizes="(max-width: 480px) 70vw, 380px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">
              📱
            </div>
          )}

          {/* Dynamic island — phones only */}
          {isPhone && island && (
            <div className="absolute left-1/2 top-[1.6%] h-[1.9%] w-[30%] -translate-x-1/2 rounded-full bg-black/90" />
          )}

          {/* Screen glare */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_28%)]" />
        </div>
      </div>
    </div>
  );
}
