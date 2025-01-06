"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function arraysAreEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

export function useSearchParamState(paramName: string, defaultValue: string[]) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [value, setValue] = useState<string[]>(() => {
    const raw = searchParams.get(paramName);
    return raw ? raw.split(",") : defaultValue;
  });

  useEffect(() => {
    const raw = searchParams.get(paramName);
    const urlValue = raw ? raw.split(",") : defaultValue;

    // If they're the same, do nothing
    if (arraysAreEqual(value, urlValue)) return;

    // Otherwise, decide which one should "win".
    // For example, if your local state is more "authoritative":
    if (!arraysAreEqual(value, defaultValue)) {
      // Update the URL from state
      const newSearchParams = new URLSearchParams(searchParams.toString());
      if (value.length > 0) {
        newSearchParams.set(paramName, value.join(","));
      } else {
        newSearchParams.delete(paramName);
      }
      router.replace(`?${newSearchParams.toString()}`);
    } else {
      // If state is still default, adopt the URL's value
      setValue(urlValue);
    }
  }, [value, searchParams, defaultValue, paramName, router]);

  return [value, setValue] as const;
}
