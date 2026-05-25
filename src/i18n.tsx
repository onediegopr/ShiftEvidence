import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "de" | "fr" | "es" | "pt" | "it";

export const LANGUAGE_OPTIONS: Array<{ code: Locale; label: string }> = [
  { code: "en", label: "Inglés" },
  { code: "de", label: "Alemán" },
  { code: "fr", label: "Francés" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Portugués" },
  { code: "it", label: "Italiano" },
];

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
  de: {
    title: "Shift Evidence | VMware-zu-Proxmox-Migrationsaudit",
    description:
      "Planen Sie VMware-zu-Proxmox-Migrationen, VMware-Ersatzprojekte und Broadcom-Lizenzausstiege mit einem Read-only-Readiness-Audit, Kostenmodell, Migrationspipeline und Executive-Entscheidungskriterien.",
    canonical: "https://shiftevidence.com/de/",
    ogUrl: "https://shiftevidence.com/de/",
    ogLocale: "de_DE",
  },
  fr: {
    title: "Shift Evidence | Audit de migration VMware vers Proxmox",
    description:
      "Planifiez les migrations VMware vers Proxmox, les projets de remplacement VMware et les sorties de licences Broadcom avec un audit en lecture seule, un modèle de coûts, une pipeline de migration et des critères de décision exécutifs.",
    canonical: "https://shiftevidence.com/fr/",
    ogUrl: "https://shiftevidence.com/fr/",
    ogLocale: "fr_FR",
  },
  es: {
    title: "Shift Evidence | Auditoría de Migración de VMware a Proxmox",
    description:
      "Planifica migraciones de VMware a Proxmox, reemplazos de VMware y salidas de licenciamiento Broadcom con una auditoría en solo lectura, modelo de costos, pipeline de migración y criterios ejecutivos.",
    canonical: "https://shiftevidence.com/es/",
    ogUrl: "https://shiftevidence.com/es/",
    ogLocale: "es_ES",
  },
  pt: {
    title: "Shift Evidence | Auditoria de Migração VMware para Proxmox",
    description:
      "Planeje migrações VMware para Proxmox, projetos de substituição VMware e saídas de licenciamento Broadcom com uma auditoria somente leitura, modelo de custos, pipeline de migração e critérios executivos.",
    canonical: "https://shiftevidence.com/pt/",
    ogUrl: "https://shiftevidence.com/pt/",
    ogLocale: "pt_PT",
  },
  it: {
    title: "Shift Evidence | Audit di migrazione VMware verso Proxmox",
    description:
      "Pianifica migrazioni VMware verso Proxmox, progetti di sostituzione VMware e uscite di licenze Broadcom con un audit in sola lettura, modello di costi, pipeline di migrazione e criteri decisionali esecutivi.",
    canonical: "https://shiftevidence.com/it/",
    ogUrl: "https://shiftevidence.com/it/",
    ogLocale: "it_IT",
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
  if (pathname === "/" || pathname === "") return null;
  const code = pathname.slice(1, 3);
  if (["en", "de", "fr", "es", "pt", "it"].includes(code)) {
    return code as Locale;
  }
  return null;
};

const getBrowserLocale = (): Locale => {
  if (typeof navigator === "undefined") return "en";
  const lower = navigator.language.toLowerCase();
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("it")) return "it";
  return "en";
};

const buildLocalePath = (locale: Locale) => {
  if (typeof window === "undefined") return "/";

  const { pathname, search, hash } = window.location;
  const stripped = pathname
    .replace(/^\/(en|de|fr|es|pt|it)(\/|$)/i, "/")
    .replace(/\/+/g, "/");

  const basePath = stripped === "/" ? "/" : stripped;
  const targetPath = basePath === "/" ? `/${locale}/` : `/${locale}${basePath}`;

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

  for (const option of LANGUAGE_OPTIONS) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = option.code;
    link.href = SEO_META[option.code].canonical;
    document.head.appendChild(link);
  }

  const xDefault = document.createElement("link");
  xDefault.rel = "alternate";
  xDefault.hreflang = "x-default";
  xDefault.href = SEO_META.en.canonical;
  document.head.appendChild(xDefault);
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const pathLocale = getPathLocale();
    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY) as Locale | null)
        : null;
    const browserLocale = getBrowserLocale();
    return (pathLocale ?? stored ?? browserLocale) as Locale;
  });

  useEffect(() => {
    const pathLocale = getPathLocale();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const browserLocale = getBrowserLocale();
    if (!pathLocale && !stored && browserLocale !== "en") {
      const nextPath = buildLocalePath(browserLocale);
      window.history.replaceState({}, "", nextPath);
      setLocaleState(browserLocale);
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
        const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
        setLocaleState(stored && ["en", "de", "fr", "es", "pt", "it"].includes(stored) ? stored : "en");
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
        window.location.assign(buildLocalePath(next));
      },
      toggleLocale: () => {
        const next = locale === "en" ? "es" : "en";
        window.location.assign(buildLocalePath(next));
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
