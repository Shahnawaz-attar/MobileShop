interface StoreMapProps {
  lat: number | null;
  lng: number | null;
  query: string;
  mapsUrl: string;
  title: string;
}

/**
 * Lightweight embedded map for the "Visit us" section.
 *
 * Uses a Google Maps iframe embed (no API key required for the basic
 * output=embed endpoint, no WebGL dependency, works on mid-range Android).
 * Falls back to an address-query embed when no coordinates are stored.
 * Lazy-loaded so it never blocks first paint.
 */
export function StoreMap({ lat, lng, query, mapsUrl, title }: StoreMapProps) {
  let src: string;

  if (lat != null && lng != null) {
    // Google Maps embed keyed by coordinates — no API key required, no WebGL needed
    src = `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`;
  } else {
    // Fallback: Google Maps embed keyed by the address / maps URL query
    const q = encodeURIComponent(query);
    src = `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
  }

  return (
    <div className="relative h-full w-full">
      <iframe
        title={`Map — ${title}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full min-h-[320px] w-full border-0 lg:min-h-full"
        allowFullScreen
      />
      {/* Overlay CTA */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-xl transition-transform hover:scale-105"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Get Directions
      </a>
    </div>
  );
}
