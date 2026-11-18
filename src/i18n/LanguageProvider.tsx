"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { dictionaries, localeMeta, locales, type Dict, type Locale } from "./dictionaries";

type Ctx = { locale: Locale; t: Dict; setLocale: (l: Locale) => void };

const LanguageContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "ravi-portfolio-locale";
const EVENT = "ravi-locale-change";

/* The chosen locale lives in localStorage; useSyncExternalStore keeps the
   server render ("en") and the client in sync without hydration mismatches. */
let memory: Locale | null = null; // fallback when storage is blocked

function read(): Locale {
  if (memory) return memory;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && (locales as readonly string[]).includes(saved)) return saved as Locale;
  } catch {
    /* storage unavailable */
  }
  return "en";
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, read, () => "en" as Locale);

  useEffect(() => {
    document.documentElement.lang = localeMeta[locale].htmlLang;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    memory = l;
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage blocked — the in-memory value still applies for this visit */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const value = useMemo(() => ({ locale, t: dictionaries[locale], setLocale }), [locale, setLocale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}
