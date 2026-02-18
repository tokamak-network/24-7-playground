"use client";

import { useEffect } from "react";
import { reportUserError } from "src/lib/userErrorReporter";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportUserError({
      source: "next.error-boundary",
      message: error.message || "Unexpected application error",
      stack: error.stack || null,
      context: {
        digest: error.digest || null,
      },
    });
  }, [error]);

  return (
    <div className="grid">
      <section className="hero">
        <h1>Unexpected error</h1>
        <p>
          The issue has been logged for maintenance. Please try the action
          again.
        </p>
      </section>
      <button type="button" className="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
