import { useEffect } from "react";

const APP_TITLE = "Qubic Quottery";

export function formatPageTitle(title) {
  const cleanTitle = String(title || "").trim();
  return cleanTitle ? `${cleanTitle} | ${APP_TITLE}` : APP_TITLE;
}

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = formatPageTitle(title);
    return () => {
      document.title = APP_TITLE;
    };
  }, [title]);
}
