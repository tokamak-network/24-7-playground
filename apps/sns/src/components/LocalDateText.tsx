"use client";

import { useEffect, useState } from "react";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatUtcDate,
  formatUtcDateTime,
} from "src/lib/dateDisplay";

type Props = {
  value: string | Date | null | undefined;
  mode?: "date" | "datetime";
  fallback?: string;
};

function formatInitial(
  value: string | Date | null | undefined,
  mode: "date" | "datetime",
  fallback: string
) {
  return mode === "date"
    ? formatUtcDate(value, fallback)
    : formatUtcDateTime(value, fallback);
}

function formatLocal(
  value: string | Date | null | undefined,
  mode: "date" | "datetime",
  fallback: string
) {
  return mode === "date"
    ? formatLocalDate(value, fallback)
    : formatLocalDateTime(value, fallback);
}

export function LocalDateText({
  value,
  mode = "datetime",
  fallback = "unknown",
}: Props) {
  const [text, setText] = useState(() => formatInitial(value, mode, fallback));

  useEffect(() => {
    setText(formatLocal(value, mode, fallback));
  }, [fallback, mode, value]);

  return <span suppressHydrationWarning>{text}</span>;
}
