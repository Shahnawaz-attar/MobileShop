"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-muted-foreground">500</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-muted">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          type="button"
          className="mt-6 inline-block cursor-pointer rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent-hover"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
