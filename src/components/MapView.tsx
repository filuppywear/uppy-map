"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Point } from "geojson";
import type {
  GeoJSONSource,
  Map as MapboxMap,
  MapLayerMouseEvent,
  Marker as MapboxMarker,
  Popup as MapboxPopup,
} from "mapbox-gl";
import { formatCategoryLabel, hasStoreCoordinates, type Store } from "@/lib/types";

type MapboxModule = typeof import("mapbox-gl");

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const PIN_VARIANTS = ["/branding/1.svg", "/branding/2.svg", "/branding/3.svg", "/branding/4.svg"];

function loadPinImage(src: string, width: number, height: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image(width, height);
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function renderBlobImage(svgUrl: string, size: number): Promise<HTMLCanvasElement> {
  const response = await fetch(svgUrl);
  const svgText = await response.text();

  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = url;
  });
  URL.revokeObjectURL(url);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight) * 0.85;
  const dx = (size - image.naturalWidth * scale) / 2;
  const dy = (size - image.naturalHeight * scale) / 2;

  context.drawImage(image, dx, dy, image.naturalWidth * scale, image.naturalHeight * scale);
  return canvas;
}

/* ─── Blob image cache — pre-loads on module import ─── */
const blobCache = new Map<string, Promise<HTMLCanvasElement>>();

function getBlobImage(svgUrl: string, size: number): Promise<HTMLCanvasElement> {
  const key = `${svgUrl}@${size}`;
  if (!blobCache.has(key)) {
    blobCache.set(key, renderBlobImage(svgUrl, size));
  }
  return blobCache.get(key)!;
}

// Kick off all 6 fetches immediately at import time
for (const size of [48, 62, 80]) {
  getBlobImage("/branding/cluster-sx.svg", size);
  getBlobImage("/branding/cluster-dx.svg", size);
}

/* ─── City hotspots (from store data) ─── */
interface CityStat {
  count: number;
  lng: number;
  lat: number;
}

function buildCityStats(stores: Store[]): Map<string, CityStat> {
  const stats = new Map<string, { sumLng: number; sumLat: number; count: number }>();
  for (const store of stores) {
    if (!hasStoreCoordinates(store) || !store.city) continue;
    // key must be unique per city — disambiguate same-name cities via country
    const key = `${store.city}|${store.country ?? ""}`;
    const entry = stats.get(key) ?? { sumLng: 0, sumLat: 0, count: 0 };
    entry.sumLng += store.lng;
    entry.sumLat += store.lat;
    entry.count += 1;
    stats.set(key, entry);
  }
  const result = new Map<string, CityStat>();
  for (const [key, s] of stats) {
    result.set(key, { count: s.count, lng: s.sumLng / s.count, lat: s.sumLat / s.count });
  }
  return result;
}

function buildCityHotspotsGeoJSON(stats: Map<string, CityStat>) {
  return {
    type: "FeatureCollection" as const,
    features: Array.from(stats.entries()).map(([key, s]) => {
      const city = key.split("|")[0];
      return {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] as [number, number] },
        properties: {
          key,
          name: city,
          count: s.count,
          count_label: s.count >= 1000 ? `${(s.count / 1000).toFixed(1)}k` : String(s.count),
        },
      };
    }),
  };
}

function buildGeoJSON(stores: Store[]) {
  return {
    type: "FeatureCollection" as const,
    features: stores.filter(hasStoreCoordinates).map((store) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [store.lng, store.lat],
      },
      properties: {
        id: store.id,
        pin_variant: store.id % 4,
        name: store.name,
        category: store.category,
        city: store.city,
        country: store.country,
        rating: store.rating,
        website: store.website,
        description: store.description,
        instagram: store.instagram,
        image: store.images?.[0] || "",
      },
    })),
  };
}

// Escape text for safe HTML interpolation
function escHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function buildPopupHTML(props: Record<string, unknown>) {
  const name = escHtml(props.name);
  const category = formatCategoryLabel(String(props.category ?? ""));
  const city = String(props.city ?? "");
  const country = String(props.country ?? "");
  const rating = Number(props.rating) || 0;
  const address = escHtml([city, country].filter(Boolean).join(", "));
  const id = escHtml(props.id);

  const starsHtml = rating
    ? `<div class="mini-popup__rating"><span class="mini-popup__stars">${"&#9733;".repeat(
        Math.round(rating)
      )}${"&#9734;".repeat(5 - Math.round(rating))}</span> <span class="mini-popup__rating-text">${rating.toFixed(
        1
      )}</span></div>`
    : "";

  return `<div class="mini-popup">
    <div class="mini-popup__body">
      <div class="mini-popup__category">${escHtml(category)}</div>
      <div class="mini-popup__name">${name}</div>
      <div class="mini-popup__address">${address}</div>
      ${starsHtml}
      <button class="mini-popup__btn" data-store-id="${id}">Open store</button>
    </div>
  </div>`;
}

interface Props {
  stores: Store[];
  height?: string;
  visible?: boolean;
  interactionLocked?: boolean;
  initialView?: {
    center: [number, number];
    zoom: number;
  };
  onStoreSelect?: (store: Store) => void;
  onReady?: (flyTo: (lng: number, lat: number, zoom: number) => void) => void;
  onZoomOut?: () => void;
  onViewportChange?: (center: [number, number], zoom: number) => void;
}

function MapView({
  stores,
  height = "80vh",
  visible = true,
  interactionLocked = false,
  initialView,
  onStoreSelect,
  onReady,
  onZoomOut,
  onViewportChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupRef = useRef<MapboxPopup | null>(null);
  const vpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMarkerRef = useRef<MapboxMarker | null>(null);
  const mapboxRef = useRef<MapboxModule["default"] | null>(null);
  const storesRef = useRef(stores);
  const onStoreSelectRef = useRef(onStoreSelect);
  const onZoomOutRef = useRef(onZoomOut);
  const onViewportChangeRef = useRef(onViewportChange);

  const [locating, setLocating] = useState(false);

  useEffect(() => {
    storesRef.current = stores;
  }, [stores]);

  useEffect(() => {
    onStoreSelectRef.current = onStoreSelect;
  }, [onStoreSelect]);

  useEffect(() => {
    onZoomOutRef.current = onZoomOut;
  }, [onZoomOut]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    if (visible && mapRef.current) {
      setTimeout(() => mapRef.current?.resize(), 50);
    }
  }, [visible]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    container.style.pointerEvents = interactionLocked ? "none" : "auto";

    if (interactionLocked) {
      popupRef.current?.remove();
      popupRef.current = null;
      map.stop();
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.doubleClickZoom.disable();
      map.dragRotate.disable();
      map.keyboard.disable();
      map.touchZoomRotate.disable();
      return;
    }

    map.dragPan.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    map.doubleClickZoom.enable();
    map.dragRotate.enable();
    map.keyboard.enable();
    map.touchZoomRotate.enable();
  }, [interactionLocked]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!document.getElementById("mapbox-css")) {
      const link = document.createElement("link");
      link.id = "mapbox-css";
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.20.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    let cancelled = false;

    const initializeMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled) return;
        mapboxRef.current = mapboxgl;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const isMobile = window.innerWidth < 768;
        const map = new mapboxgl.Map({
          container: containerRef.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: initialView?.center || [10, 20],
          zoom: initialView?.zoom ?? (isMobile ? 1 : 1.8),
          projection: "mercator",
        });
        mapRef.current = map;

        const addStoreLayers = async () => {
          if (map.getSource("stores")) return;

          for (let i = 0; i < PIN_VARIANTS.length; i++) {
            const img = await loadPinImage(PIN_VARIANTS[i], 48, 75);
            if (!map.hasImage(`pin-${i}`)) {
              map.addImage(`pin-${i}`, img, { pixelRatio: 2 });
            }
          }

          for (const size of [48, 62, 80]) {
            const leftBlob = await getBlobImage("/branding/cluster-sx.svg", size);
            const rightBlob = await getBlobImage("/branding/cluster-dx.svg", size);
            const leftData = leftBlob.getContext("2d")?.getImageData(0, 0, size, size).data;
            const rightData = rightBlob.getContext("2d")?.getImageData(0, 0, size, size).data;

            if (leftData && !map.hasImage(`blob-sx-${size}`)) {
              map.addImage(
                `blob-sx-${size}`,
                { width: size, height: size, data: new Uint8Array(leftData) },
                { pixelRatio: 1.5 }
              );
            }

            if (rightData && !map.hasImage(`blob-dx-${size}`)) {
              map.addImage(
                `blob-dx-${size}`,
                { width: size, height: size, data: new Uint8Array(rightData) },
                { pixelRatio: 1.5 }
              );
            }

          }

          // Always populate stores source
          map.addSource("stores", {
            type: "geojson",
            data: buildGeoJSON(storesRef.current),
          });

          // Tint water to match Uppy aesthetic (warm tone instead of cold blue)
          const waterLayer = map.getStyle()?.layers?.find(l => l.id === "water");
          if (waterLayer) {
            map.setPaintProperty("water", "fill-color", "#c8c2b8");
          }

          // --- CITY mega-pin layer (always visible) ---

          const initialCityStats = buildCityStats(storesRef.current);
          map.addSource("city-hotspots", {
            type: "geojson",
            data: buildCityHotspotsGeoJSON(initialCityStats),
          });

          // Giant city mega-pin — always visible, fades out as you zoom into individual pins
          map.addLayer({
            id: "city-hotspots-pin",
            type: "symbol",
            source: "city-hotspots",
            maxzoom: 10,
            layout: {
              "icon-image": [
                "match",
                ["%", ["get", "count"], 4],
                0, "pin-0",
                1, "pin-1",
                2, "pin-2",
                3, "pin-3",
                "pin-0",
              ],
              "icon-size": ["*",
                ["interpolate", ["linear"], ["zoom"],
                  0, 0.4,
                  3, 0.6,
                  6, 0.9,
                  9, 0.5,
                ],
                ["interpolate", ["linear"], ["get", "count"],
                  1, 1.8,
                  50, 2.2,
                  500, 2.8,
                  2000, 3.2,
                ],
              ],
              "icon-anchor": "bottom",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            },
            paint: {
              "icon-opacity": [
                "interpolate", ["linear"], ["zoom"],
                7.5, 1,
                9.5, 0,
              ],
            },
          });

          // --- Individual store pins — always visible, fade in as you zoom past mega-pins ---
          map.addLayer({
            id: "stores-hit-area",
            type: "circle",
            source: "stores",
            minzoom: 6,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": 18,
              "circle-opacity": 0,
            },
          });

          map.addLayer({
            id: "stores-pins",
            type: "symbol",
            source: "stores",
            minzoom: 6,
            filter: ["!", ["has", "point_count"]],
            layout: {
              "icon-image": [
                "match",
                ["get", "pin_variant"],
                0, "pin-0",
                1, "pin-1",
                2, "pin-2",
                3, "pin-3",
                "pin-0",
              ],
              "icon-size": 1.3,
              "icon-anchor": "bottom",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            },
            paint: {
              "icon-opacity": [
                "interpolate", ["linear"], ["zoom"],
                6, 0,
                8, 1,
              ],
            },
          });

          // --- Pin hover layer (much bigger on desktop hover) ---
          map.addLayer({
            id: "stores-pins-hover",
            type: "symbol",
            source: "stores",
            filter: ["==", ["get", "id"], -1],
            layout: {
              "icon-image": [
                "match",
                ["get", "pin_variant"],
                0, "pin-0",
                1, "pin-1",
                2, "pin-2",
                3, "pin-3",
                "pin-0",
              ],
              "icon-size": 1.5,
              "icon-anchor": "bottom",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            },
            paint: {
              "icon-opacity": 1,
            },
          });

          const openStorePopup = (coords: [number, number], properties: Record<string, unknown>) => {
            popupRef.current?.remove();
            const storeId = String(properties.id ?? "");
            const store = storesRef.current.find((entry) => String(entry.id) === storeId);

            // Clear hover before opening popup
            map.setFilter("stores-pins-hover", ["==", ["get", "id"], -1]);

            // Smoothly center on the pin, then open popup
            map.stop();
            map.easeTo({ center: coords, duration: 300 });

            const isMobile = window.matchMedia("(max-width: 1024px)").matches;
            const popup = new mapboxgl.Popup({
              className: "sw-popup",
              offset: isMobile ? 20 : [0, -38],
              closeButton: true,
              closeOnClick: true,
              closeOnMove: false,
              focusAfterOpen: false,
              maxWidth: isMobile ? "calc(100vw - 32px)" : "280px",
            })
              .setLngLat(coords)
              .setHTML(buildPopupHTML(properties))
              .addTo(map);

            popupRef.current = popup;

            requestAnimationFrame(() => {
              const popupElement = popup.getElement();
              if (!popupElement || !store) return;

              const handlePopupClick = (popupEvent: MouseEvent) => {
                const target = popupEvent.target as HTMLElement | null;
                if (!target?.closest(".mini-popup__btn")) return;
                popupEvent.preventDefault();
                popupEvent.stopPropagation();
                if (onStoreSelectRef.current) {
                  map.stop();
                  popup.remove();
                  popupRef.current = null;
                  onStoreSelectRef.current(store);
                }
              };

              popupElement.addEventListener("click", handlePopupClick);
              // Always remove the listener when the popup closes — whether by
              // button click, close button, closeOnClick, or programmatic remove
              popup.once("close", () => {
                popupElement.removeEventListener("click", handlePopupClick);
              });
            });
          };

          // --- City mega-pin click: fly to city → show individual pins ---
          const handleCityClick = (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            if (!feature) return;
            const coords = (feature.geometry as Point).coordinates as [number, number];
            popupRef.current?.remove();
            map.flyTo({ center: coords, zoom: 13, speed: 1.4, essential: true });
          };

          map.on("click", "city-hotspots-pin", handleCityClick);

          let lastPinClickTime = 0;
          const handlePinClick = (event: MapLayerMouseEvent) => {
            // Debounce: both stores-hit-area and stores-pins fire for the same click
            const now = Date.now();
            if (now - lastPinClickTime < 100) return;
            lastPinClickTime = now;

            const feature = event.features?.[0];
            if (!feature) return;

            const coords = (feature.geometry as Point).coordinates as [number, number];
            openStorePopup(coords, feature.properties || {});
          };

          map.on("click", "stores-hit-area", handlePinClick);
          map.on("click", "stores-pins", handlePinClick);
          map.on("click", "stores-pins-hover", handlePinClick);

          // --- Hover effects (desktop only — no hover on touch devices) ---
          const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
          if (hasHover) {
            let isInteracting = false;
            const setCursor = (val: string) => {
              if (!isInteracting) map.getCanvas().style.cursor = val;
            };

            // While dragging/zooming, force grabbing cursor and clear hover highlights
            map.on("dragstart", () => {
              isInteracting = true;
              map.getCanvas().style.cursor = "grabbing";
              map.setFilter("stores-pins-hover", ["==", ["get", "id"], -1]);
            });
            map.on("zoomstart", () => {
              isInteracting = true;
              map.setFilter("stores-pins-hover", ["==", ["get", "id"], -1]);
            });
            map.on("dragend", () => {
              isInteracting = false;
              map.getCanvas().style.cursor = "";
            });
            map.on("zoomend", () => {
              isInteracting = false;
            });

            const handlePinEnter = (e: MapLayerMouseEvent) => {
              if (isInteracting) return;
              setCursor("pointer");
              const feature = e.features?.[0];
              if (!feature || popupRef.current) return;
              const id = Number(feature.properties?.id);
              if (!Number.isFinite(id)) return;
              map.setFilter("stores-pins-hover", ["==", ["get", "id"], id]);
            };
            const handlePinLeave = () => {
              setCursor("");
              map.setFilter("stores-pins-hover", ["==", ["get", "id"], -1]);
            };
            map.on("mouseenter", "stores-hit-area", handlePinEnter);
            map.on("mouseleave", "stores-hit-area", handlePinLeave);
            map.on("mouseenter", "stores-pins", handlePinEnter);
            map.on("mouseleave", "stores-pins", handlePinLeave);

            // City mega-pin hover: cursor pointer
            const handleCityEnter = () => { if (!isInteracting) setCursor("pointer"); };
            const handleCityLeave = () => setCursor("");
            map.on("mouseenter", "city-hotspots-pin", handleCityEnter);
            map.on("mouseleave", "city-hotspots-pin", handleCityLeave);
          }
        };

        map.on("load", async () => {
          await addStoreLayers();

          onReady?.((lng, lat, zoom) => {
            map.flyTo({ center: [lng, lat], zoom, speed: 1.2, essential: true });
          });

          const emitViewport = () => {
            if (vpTimerRef.current) clearTimeout(vpTimerRef.current);
            vpTimerRef.current = setTimeout(() => {
              vpTimerRef.current = null;
              const center = map.getCenter();
              onViewportChangeRef.current?.([center.lng, center.lat], map.getZoom());
            }, 300);
          };

          map.on("moveend", emitViewport);
          emitViewport();
        });
      } catch (error) {
        console.error("Mapbox init error:", error);
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      if (vpTimerRef.current) {
        clearTimeout(vpTimerRef.current);
        vpTimerRef.current = null;
      }
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initialView, onReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    popupRef.current?.remove();

    // Update city hotspots
    const cityStats = buildCityStats(stores);
    const citySource = map.getSource("city-hotspots") as GeoJSONSource | undefined;
    citySource?.setData(buildCityHotspotsGeoJSON(cityStats));

    // Update individual store pins (always populated)
    const source = map.getSource("stores") as GeoJSONSource | undefined;
    source?.setData(buildGeoJSON(stores));
  }, [stores]);

  const handleZoomOut = useCallback(() => {
    const mobileZoom = window.innerWidth < 768 ? 1 : 1.8;
    const center = initialView?.center || [10, 20];
    const zoom = initialView?.zoom ?? mobileZoom;
    popupRef.current?.remove();
    mapRef.current?.flyTo({ center, zoom, speed: 1.2, essential: true });
    onZoomOutRef.current?.();
  }, [initialView]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 13, speed: 0.8 });

        const mapboxgl = mapboxRef.current;
        const map = mapRef.current;
        if (mapboxgl && map) {
          userMarkerRef.current?.remove();

          const marker = document.createElement("div");
          marker.style.position = "relative";
          marker.style.width = "40px";
          marker.style.height = "40px";

          const pulse = document.createElement("div");
          pulse.className = "user-location-pulse";
          marker.appendChild(pulse);

          const dot = document.createElement("div");
          dot.className = "user-location-dot";
          dot.style.position = "absolute";
          dot.style.top = "50%";
          dot.style.left = "50%";
          dot.style.transform = "translate(-50%, -50%)";
          marker.appendChild(dot);

          userMarkerRef.current = new mapboxgl.Marker({ element: marker })
            .setLngLat([longitude, latitude])
            .addTo(map);
        }

        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <div className="relative w-full overflow-hidden" style={{ height, background: "#FFFFFF" }}>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}
      />

      <div className="absolute right-4 bottom-6 lg:bottom-auto lg:top-3 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomOut}
          aria-label="Reset map view"
          className="action-icon w-11 h-11 flex items-center justify-center"
          style={{
            background: "rgba(45,35,35,0.92)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(16px)",
            cursor: "pointer",
            color: "rgba(255,255,255,0.6)",
            transition: "color 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>

        <button
          onClick={handleLocate}
          aria-label="Find my location"
          className="action-icon w-11 h-11 flex items-center justify-center"
          style={{
            background: "rgba(45,35,35,0.92)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(16px)",
            cursor: "pointer",
            color: locating ? "#A58277" : "rgba(255,255,255,0.6)",
            transition: "color 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={locating ? { animation: "pulse 1.5s ease-in-out infinite" } : undefined}>
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(MapView);
