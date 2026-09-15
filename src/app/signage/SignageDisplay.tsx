"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./signage.module.css";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  presentation: string | null;
  price: number;
  fractionUnit: string | null;
  fractionPrice: number | null;
  rubro: string;
  subrubro: string;
};

type Slide =
  | { type: "intro" }
  | { type: "hero"; product: Product }
  | { type: "grid"; title: string; products: Product[] };

const REFRESH_MS = 5 * 60 * 1000; // 5 min — la TV queda prendida horas, precios pueden cambiar mientras tanto.
const MAX_ROTATION = 24; // cuántos productos entran en una vuelta completa, elegidos al azar en cada refresco.
const HERO_DURATION = 7000;
const GRID_DURATION = 9000;
const INTRO_DURATION = 5000;

const RUBRO_ICONS: Record<string, string> = {
  "Accesorios para Animales": "🐾",
  "Alimentos Balanceados": "🥣",
  "Bazar y Varios": "🎁",
  "Cereales y Granos": "🌾",
  "Control de Plagas": "🦟",
  "Ferretería y Bazar": "🔧",
  Forrajes: "🌿",
  Jardinería: "🌱",
  Limpieza: "🧽",
  "Sanidad y Cuidado Animal": "💊",
};
const FALLBACK_ICON = "🛒";
const iconFor = (rubro: string) => RUBRO_ICONS[rubro] ?? FALLBACK_ICON;

// Misma familia tonal que el fondo general, distinta por rubro para que
// cada tanda de slides tenga identidad propia sin salirse del clima dark.
const PALETTE = [
  { a: "#123524", b: "#0a1712", accent: "#ffc93c" },
  { a: "#3a2312", b: "#170e08", accent: "#ff9a4c" },
  { a: "#132a3a", b: "#081218", accent: "#6fd6ff" },
  { a: "#301a35", b: "#140a17", accent: "#ff7fb8" },
  { a: "#2a2610", b: "#131106", accent: "#f4e04d" },
  { a: "#0f2e2a", b: "#081613", accent: "#5be8c9" },
];
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h;
}
const colorFor = (seed: string) => PALETTE[Math.abs(hash(seed)) % PALETTE.length];

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
}).format;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildSlides(products: Product[]): Slide[] {
  if (products.length === 0) return [];
  const pool = shuffle(products).slice(0, Math.min(MAX_ROTATION, products.length));
  const slides: Slide[] = [{ type: "intro" }];
  let i = 0;
  while (i < pool.length) {
    const makeGrid = slides.length % 4 === 0 && i + 3 <= pool.length;
    if (makeGrid) {
      const chunk = pool.slice(i, i + 3);
      slides.push({ type: "grid", title: `Destacados en ${chunk[0].rubro}`, products: chunk });
      i += 3;
    } else {
      slides.push({ type: "hero", product: pool[i] });
      i += 1;
    }
  }
  return slides;
}

function durationOf(slide: Slide): number {
  if (slide.type === "intro") return INTRO_DURATION;
  if (slide.type === "grid") return GRID_DURATION;
  return HERO_DURATION;
}

export function SignageDisplay() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [clock, setClock] = useState("--:--");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsButton, setShowFsButton] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideFsButtonRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    function resetHideTimer() {
      setShowFsButton(true);
      if (hideFsButtonRef.current) clearTimeout(hideFsButtonRef.current);
      hideFsButtonRef.current = setTimeout(() => setShowFsButton(false), 4000);
    }
    resetHideTimer();
    window.addEventListener("mousemove", resetHideTimer);
    window.addEventListener("touchstart", resetHideTimer);
    return () => {
      window.removeEventListener("mousemove", resetHideTimer);
      window.removeEventListener("touchstart", resetHideTimer);
      if (hideFsButtonRef.current) clearTimeout(hideFsButtonRef.current);
    };
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        // Algunos navegadores/TVs no permiten pantalla completa vía JS; F11 sigue funcionando.
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/signage", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setProducts(data.items ?? []);
      } catch {
        // Si falla un refresco, se sigue mostrando lo que ya había cargado.
      }
    }
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    }
    tick();
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, []);

  const slides = useMemo(() => (products ? buildSlides(products) : []), [products]);
  const safeCurrent = slides.length > 0 ? current % slides.length : 0;

  useEffect(() => {
    if (slides.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, durationOf(slides[safeCurrent]));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCurrent, slides]);

  const tickerItems = useMemo(() => {
    if (!products) return [];
    return shuffle(products)
      .slice(0, 16)
      .map((p) => `${p.name}${p.brand ? " · " + p.brand : ""} — ${money(p.price)}`);
  }, [products]);

  if (products === null) {
    return (
      <div className={styles.stage}>
        <div className={styles.emptyState}>
          <div className={styles.iconBadge}>📺</div>
          <div className={styles.tagline}>Cargando cartelería…</div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className={styles.stage}>
        <div className={styles.emptyState}>
          <div className={styles.iconBadge}>🐾</div>
          <div className={styles.headlineXl} style={{ fontSize: "clamp(28px,4vw,56px)" }}>
            Sin productos activos para mostrar
          </div>
          <div className={styles.tagline}>Cargá productos en el sistema para que aparezcan acá.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      <div className={styles.chromeTop}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>🐾</div>
          <div className={styles.brandText}>
            TU NEGOCIO
            <small>Forrajería &amp; Mascotas</small>
          </div>
        </div>
        <div className={styles.clockCol}>
          <div className={styles.clock}>{clock}</div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={styles.fsButton}
            style={{ opacity: showFsButton ? 1 : 0, pointerEvents: showFsButton ? "auto" : "none" }}
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? "⤡" : "⤢"}
          </button>
        </div>
      </div>

      {slides.map((slide, i) => {
        const seed =
          slide.type === "intro" ? "intro" : slide.type === "hero" ? slide.product.rubro : slide.title;
        const color = colorFor(seed);
        return (
          <div
            key={i}
            className={`${styles.slide} ${i === safeCurrent ? styles.slideActive : ""}`}
            style={
              {
                "--slide-a": color.a,
                "--slide-b": color.b,
              } as React.CSSProperties
            }
          >
            <div className={styles.slideBg} />
            {slide.type === "intro" && (
              <div className={`${styles.slideInner} ${styles.centerText}`}>
                <div className={styles.eyebrow} style={{ ["--accent" as string]: color.accent }}>
                  Esta semana en el local
                </div>
                <div className={styles.headlineXl}>Nuestros productos</div>
                <div className={styles.tagline}>
                  Precios actualizados directo desde el sistema — sin carteles para imprimir.
                </div>
              </div>
            )}
            {slide.type === "hero" && (
              <div className={`${styles.slideInner} ${styles.heroInner}`}>
                <div className={styles.iconBadge}>{iconFor(slide.product.rubro)}</div>
                <div className={styles.eyebrow} style={{ ["--accent" as string]: color.accent }}>
                  {slide.product.rubro}
                </div>
                <div className={styles.productName}>{slide.product.name}</div>
                <div className={styles.productMeta}>
                  {slide.product.brand && <span className={styles.metaChip}>{slide.product.brand}</span>}
                  {slide.product.presentation && (
                    <span className={styles.metaChip}>{slide.product.presentation}</span>
                  )}
                </div>
                <div className={styles.priceRow}>
                  <div className={styles.priceCurrent} style={{ ["--accent" as string]: color.accent }}>
                    {money(slide.product.price)}
                  </div>
                  {slide.product.fractionUnit && slide.product.fractionPrice != null && (
                    <div className={styles.priceFraction}>
                      {money(slide.product.fractionPrice)} / {slide.product.fractionUnit}
                    </div>
                  )}
                </div>
              </div>
            )}
            {slide.type === "grid" && (
              <div className={styles.slideInner} style={{ maxWidth: "100%" }}>
                <div className={styles.eyebrow} style={{ ["--accent" as string]: color.accent }}>
                  Destacados
                </div>
                <div className={styles.gridTitle}>{slide.title}</div>
                <div className={styles.gridWrap}>
                  {slide.products.map((p) => (
                    <div key={p.id} className={styles.gridCard}>
                      <div className={styles.iconBadge}>{iconFor(p.rubro)}</div>
                      <div className={styles.gridCardName}>{p.name}</div>
                      {p.brand && (
                        <div className={styles.gridCardBrand}>
                          {p.brand}
                          {p.presentation ? ` · ${p.presentation}` : ""}
                        </div>
                      )}
                      <div className={styles.gridCardPrice} style={{ ["--accent" as string]: color.accent }}>
                        {money(p.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.chromeBottom}>
        <div className={styles.progressRow}>
          {slides.map((slide, i) => (
            <div key={i} className={styles.progressSeg}>
              <div
                className={styles.progressFill}
                style={{
                  width: i < safeCurrent ? "100%" : i === safeCurrent ? "100%" : "0%",
                  transition: i === safeCurrent ? `width ${durationOf(slide)}ms linear` : "none",
                }}
              />
            </div>
          ))}
        </div>
        <div className={styles.ticker}>
          <div className={styles.tickerTrack}>
            {tickerItems.concat(tickerItems).map((text, i) => (
              <span key={i}>
                {text.split(" — ")[0]} — <b>{text.split(" — ")[1]}</b>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
