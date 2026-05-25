import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "es";

const STORAGE_KEY = "shift-evidence-locale";

type SeoMeta = {
  title: string;
  description: string;
  canonical: string;
  ogUrl: string;
  ogLocale: string;
};

const SEO_META: Record<Locale, SeoMeta> = {
  en: {
    title: "Shift Evidence | VMware to Proxmox Migration Audit",
    description:
      "Plan VMware to Proxmox migrations, VMware replacement projects, and Broadcom licensing exits with a read-only readiness audit, cost model, migration pipeline, and executive decision criteria.",
    canonical: "https://shiftevidence.com/",
    ogUrl: "https://shiftevidence.com/",
    ogLocale: "en_US",
  },
  es: {
    title: "Shift Evidence | AuditorÃ­a de MigraciÃ³n de VMware a Proxmox",
    description:
      "Planifica migraciones de VMware a Proxmox, reemplazos de VMware y salidas de licenciamiento Broadcom con una auditorÃ­a en solo lectura, modelo de costos, pipeline de migraciÃ³n y criterios ejecutivos.",
    canonical: "https://shiftevidence.com/es/",
    ogUrl: "https://shiftevidence.com/es/",
    ogLocale: "es_ES",
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  t: (en: string, es?: string) => string;
  seo: SeoMeta;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const getPathLocale = () => {
  if (typeof window === "undefined") return null;
  const pathname = window.location.pathname.toLowerCase();
  if (pathname === "/es" || pathname.startsWith("/es/")) return "es" as const;
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en" as const;
  return null;
};

const getBrowserLocale = (): Locale => {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
};

const buildLocalePath = (locale: Locale) => {
  if (typeof window === "undefined") return "/";

  const { pathname, search, hash } = window.location;
  const stripped = pathname
    .replace(/^\/es(\/|$)/i, "/")
    .replace(/^\/en(\/|$)/i, "/")
    .replace(/\/+/g, "/");

  const basePath = stripped === "/" ? "/" : stripped;
  const targetPath =
    locale === "es"
      ? basePath === "/"
        ? "/es/"
        : `/es${basePath}`
      : basePath;

  return `${targetPath}${search}${hash}`;
};

const applySeo = (locale: Locale) => {
  if (typeof document === "undefined") return;
  const meta = SEO_META[locale];
  document.documentElement.lang = locale;
  document.title = meta.title;

  const setMeta = (selector: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement("meta");
      const attr = selector.match(/\[(.+?)="(.+?)"\]/);
      if (attr) {
        el.setAttribute(attr[1], attr[2]);
      }
      document.head.appendChild(el);
    }
    if (selector.includes('name="description"')) {
      el.setAttribute("name", "description");
    }
    if (selector.includes('property="og:title"')) {
      el.setAttribute("property", "og:title");
    }
    if (selector.includes('property="og:description"')) {
      el.setAttribute("property", "og:description");
    }
    if (selector.includes('property="og:url"')) {
      el.setAttribute("property", "og:url");
    }
    if (selector.includes('property="og:locale"')) {
      el.setAttribute("property", "og:locale");
    }
    if (selector.includes('name="twitter:title"')) {
      el.setAttribute("name", "twitter:title");
    }
    if (selector.includes('name="twitter:description"')) {
      el.setAttribute("name", "twitter:description");
    }
    if (selector.includes('name="twitter:image"')) {
      el.setAttribute("name", "twitter:image");
    }
    el.setAttribute(
      "content",
      selector.includes("description")
        ? meta.description
        : selector.includes("og:locale")
          ? meta.ogLocale
          : selector.includes("og:url")
            ? meta.ogUrl
            : selector.includes("og:title") || selector.includes("twitter:title")
              ? meta.title
              : selector.includes("twitter:description") ||
                  selector.includes("og:description")
                ? meta.description
                : meta.canonical,
    );
  };

  setMeta('meta[name="description"]');
  setMeta('meta[property="og:title"]');
  setMeta('meta[property="og:description"]');
  setMeta('meta[property="og:url"]');
  setMeta('meta[property="og:locale"]');
  setMeta('meta[name="twitter:title"]');
  setMeta('meta[name="twitter:description"]');

  const canonical =
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ??
    (() => {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
      return link;
    })();
  canonical.href = meta.canonical;

  const alternates = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"]'),
  );
  alternates.forEach((link) => link.remove());

  const en = document.createElement("link");
  en.rel = "alternate";
  en.hreflang = "en";
  en.href = "https://shiftevidence.com/";
  document.head.appendChild(en);

  const es = document.createElement("link");
  es.rel = "alternate";
  es.hreflang = "es";
  es.href = "https://shiftevidence.com/es/";
  document.head.appendChild(es);

  const xDefault = document.createElement("link");
  xDefault.rel = "alternate";
  xDefault.hreflang = "x-default";
  xDefault.href = "https://shiftevidence.com/";
  document.head.appendChild(xDefault);
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const pathLocale = getPathLocale();
    const stored = typeof window !== "undefined"
      ? window.localStorage.getItem(STORAGE_KEY)
      : null;
    const browserLocale = getBrowserLocale();
    return (pathLocale ?? stored ?? browserLocale) as Locale;
  });

  useEffect(() => {
    const pathLocale = getPathLocale();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!pathLocale && !stored && getBrowserLocale() === "es") {
      const nextPath = buildLocalePath("es");
      window.history.replaceState({}, "", nextPath);
      setLocaleState("es");
    }
  }, []);

  useEffect(() => {
    applySeo(locale);
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    const onPopState = () => {
      const next = getPathLocale();
      if (next) {
        setLocaleState(next);
      } else {
        setLocaleState(window.localStorage.getItem(STORAGE_KEY) === "es" ? "es" : "en");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: (next: Locale) => {
        if (next === locale) return;
        window.history.pushState({}, "", buildLocalePath(next));
        setLocaleState(next);
      },
      toggleLocale: () => {
        const next = locale === "en" ? "es" : "en";
        window.history.pushState({}, "", buildLocalePath(next));
        setLocaleState(next);
      },
      t: (en, es) => (locale === "es" ? es ?? en : en),
      seo: SEO_META[locale],
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return value;
}
