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

/* ─── 3-level fixed grid clustering ─────────────────── */
// Zoom thresholds: crossing these swaps the cluster dataset
const ZOOM_THRESHOLDS = [3.5, 7.5] as const;
// Grid cell sizes in degrees for levels 0 and 1; level 2 = individual pins
const GRID_SIZES = [8, 0.8] as const;

function getZoomLevel(zoom: number): 0 | 1 | 2 {
  if (zoom < ZOOM_THRESHOLDS[0]) return 0;
  if (zoom < ZOOM_THRESHOLDS[1]) return 1;
  return 2;
}

function buildGridClusters(stores: Store[], gridDeg: number) {
  const cells = new Map<string, { sumLat: number; sumLng: number; count: number }>();
  for (const store of stores) {
    if (!hasStoreCoordinates(store)) continue;
    const key = `${Math.floor(store.lat / gridDeg)}|${Math.floor(store.lng / gridDeg)}`;
    if (!cells.has(key)) cells.set(key, { sumLat: 0, sumLng: 0, count: 0 });
    const c = cells.get(key)!;
    c.sumLat += store.lat;
    c.sumLng += store.lng;
    c.count++;
  }
  let id = 0;
  const features: { type: "Feature"; geometry: { type: "Point"; coordinates: [number, number] }; properties: Record<string, unknown> }[] = [];
  for (const cell of cells.values()) {
    const count = cell.count;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [cell.sumLng / count, cell.sumLat / count] },
      properties: {
        cluster: true,
        id: id,
        cluster_id: id++,
        point_count: count,
        point_count_abbreviated: count >= 1000 ? `${Math.floor(count / 1000)}k` : String(count),
      },
    });
  }
  return { type: "FeatureCollection" as const, features };
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

function buildPopupHTML(props: Record<string, unknown>) {
  const name = props.name || "";
  const category = props.category || "";
  const city = props.city || "";
  const country = props.country || "";
  const rating = Number(props.rating) || 0;
  const address = [city, country].filter(Boolean).join(", ");
  const id = props.id || "";
  const description = (props.description as string) || "";
  const image = (props.image as string) || "";

  const imageHtml = image
    ? `<div class="mini-popup__image"><img src="${image}" alt="${name}" /></div>`
    : "";

  const starsHtml = rating
    ? `<div class="mini-popup__rating"><span class="mini-popup__stars">${"&#9733;".repeat(
        Math.round(rating)
      )}${"&#9734;".repeat(5 - Math.round(rating))}</span> <span class="mini-popup__rating-text">${rating.toFixed(
        1
      )}</span></div>`
    : "";

  const descHtml = description
    ? `<div class="mini-popup__desc">${
        description.length > 60 ? `${description.slice(0, 60)}...` : description
      }</div>`
    : "";

  return `<div class="mini-popup">
    ${imageHtml}
    <div class="mini-popup__body">
      <div class="mini-popup__category">${formatCategoryLabel(String(category))}</div>
      <div class="mini-popup__name">${name}</div>
      <div class="mini-popup__address">${address}</div>
      ${starsHtml}
      ${descHtml}
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

          const initialLevel = getZoomLevel(map.getZoom());
          map.addSource("stores", {
            type: "geojson",
            data: initialLevel === 0
              ? buildGridClusters(storesRef.current, GRID_SIZES[0])
              : initialLevel === 1
              ? buildGridClusters(storesRef.current, GRID_SIZES[1])
              : buildGeoJSON(storesRef.current),
          });

          // --- Cluster layers (normal + hover) ---
          map.addLayer({
            id: "clusters-hit-area",
            type: "circle",
            source: "stores",
            filter: ["has", "point_count"],
            paint: {
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                10,
                26,
                50,
                34,
              ],
              "circle-opacity": 0,
            },
          });

          map.addLayer({
            id: "clusters",
            type: "symbol",
            source: "stores",
            filter: ["has", "point_count"],
            layout: {
              "icon-image": [
                "step",
                ["get", "point_count"],
                ["case", ["==", ["%", ["get", "cluster_id"], 2], 0], "blob-sx-48", "blob-dx-48"],
                10,
                ["case", ["==", ["%", ["get", "cluster_id"], 2], 0], "blob-sx-62", "blob-dx-62"],
                50,
                ["case", ["==", ["%", ["get", "cluster_id"], 2], 0], "blob-sx-80", "blob-dx-80"],
              ],
              "icon-rotate": ["%", ["*", ["get", "cluster_id"], 37], 40],
              "icon-rotation-alignment": "map",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 12,
              "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            },
            paint: {
              "text-color": "#FFFFFF",
              "icon-opacity-transition": { duration: 300, delay: 0 },
              "text-opacity-transition": { duration: 300, delay: 0 },
            },
          });

          // --- Cluster hover layer (slightly bigger on desktop hover) ---
          map.addLayer({
            id: "clusters-hover",
            type: "symbol",
            source: "stores",
            filter: ["==", ["get", "cluster_id"], -1],
            layout: {
              "icon-image": [
                "step",
                ["get", "point_count"],
                ["case", ["==", ["%", ["get", "cluster_id"], 2], 0], "blob-sx-48", "blob-dx-48"],
                10,
                ["case", ["==", ["%", ["get", "cluster_id"], 2], 0], "blob-sx-62", "blob-dx-62"],
                50,
                ["case", ["==", ["%", ["get", "cluster_id"], 2], 0], "blob-sx-80", "blob-dx-80"],
              ],
              "icon-rotate": ["%", ["*", ["get", "cluster_id"], 37], 40],
              "icon-rotation-alignment": "map",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-size": 1.15,
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 13,
              "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            },
            paint: {
              "text-color": "#FFFFFF",
            },
          });

          // --- Pin layer (4 variants, random per store) ---
          map.addLayer({
            id: "stores-hit-area",
            type: "circle",
            source: "stores",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": 30,
              "circle-opacity": 0,
              "circle-translate": [0, -16],
            },
          });

          map.addLayer({
            id: "stores-pins",
            type: "symbol",
            source: "stores",
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
              "icon-opacity": 1,
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
              "icon-size": 1.8,
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

            // Save current view so we can cancel any auto-pan the popup triggers
            const savedCenter = map.getCenter();
            const savedZoom = map.getZoom();

            const popup = new mapboxgl.Popup({
              className: "sw-popup",
              offset: [0, -38],
              closeButton: true,
              closeOnClick: true,
              closeOnMove: false,
              focusAfterOpen: false,
              maxWidth: "280px",
              anchor: "bottom",
            })
              .setLngLat(coords)
              .setHTML(buildPopupHTML(properties))
              .addTo(map);

            // Immediately snap back — cancels any auto-pan without visible movement
            map.stop();
            map.jumpTo({ center: savedCenter, zoom: savedZoom });

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
                popupElement.removeEventListener("click", handlePopupClick);
              };

              popupElement.addEventListener("click", handlePopupClick);
            });
          };

          // --- Click handlers ---
          const handleClusterClick = (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            if (!feature) return;
            const coords = (feature.geometry as Point).coordinates as [number, number];
            const level = getZoomLevel(map.getZoom());
            popupRef.current?.remove();
            const targetZoom = level === 0 ? ZOOM_THRESHOLDS[0] + 1.5 : 14;
            map.flyTo({ center: coords, zoom: targetZoom, speed: 1.4, essential: true });
          };

          map.on("click", "clusters-hit-area", handleClusterClick);
          map.on("click", "clusters", handleClusterClick);

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
          const hasHover = window.matchMedia("(hover: hover)").matches;
          if (hasHover) {
            const handlePinEnter = (e: MapLayerMouseEvent) => {
              map.getCanvas().style.cursor = "pointer";
              const feature = e.features?.[0];
              if (!feature || popupRef.current) return;
              const id = Number(feature.properties?.id);
              if (!Number.isFinite(id)) return;
              map.setFilter("stores-pins-hover", ["==", ["get", "id"], id]);
            };
            const handlePinLeave = () => {
              map.getCanvas().style.cursor = "";
              map.setFilter("stores-pins-hover", ["==", ["get", "id"], -1]);
            };
            map.on("mouseenter", "stores-hit-area", handlePinEnter);
            map.on("mouseleave", "stores-hit-area", handlePinLeave);
            map.on("mouseenter", "stores-pins", handlePinEnter);
            map.on("mouseleave", "stores-pins", handlePinLeave);

            const handleClusterEnter = (e: MapLayerMouseEvent) => {
              map.getCanvas().style.cursor = "pointer";
              const feature = e.features?.[0];
              if (!feature) return;
              const clusterId = feature.properties?.cluster_id as number | undefined;
              if (clusterId == null) return;
              map.setFilter("clusters-hover", ["==", ["get", "cluster_id"], clusterId]);
            };
            const handleClusterLeave = () => {
              map.getCanvas().style.cursor = "";
              map.setFilter("clusters-hover", ["==", ["get", "cluster_id"], -1]);
            };
            map.on("mouseenter", "clusters-hit-area", handleClusterEnter);
            map.on("mouseleave", "clusters-hit-area", handleClusterLeave);
            map.on("mouseenter", "clusters", handleClusterEnter);
            map.on("mouseleave", "clusters", handleClusterLeave);
          }
        };

        map.on("load", async () => {
          await addStoreLayers();

          onReady?.((lng, lat, zoom) => {
            map.flyTo({ center: [lng, lat], zoom, speed: 1.2, essential: true });
          });

          // Swap cluster dataset when crossing zoom thresholds — fires every frame during animation
          let activeLevel: 0 | 1 | 2 = getZoomLevel(map.getZoom());
          map.on("zoom", () => {
            const newLevel = getZoomLevel(map.getZoom());
            if (newLevel === activeLevel) return;
            activeLevel = newLevel;
            const src = map.getSource("stores") as GeoJSONSource | undefined;
            if (!src) return;
            if (newLevel === 0) src.setData(buildGridClusters(storesRef.current, GRID_SIZES[0]));
            else if (newLevel === 1) src.setData(buildGridClusters(storesRef.current, GRID_SIZES[1]));
            else src.setData(buildGeoJSON(storesRef.current));
          });

          let vpTimer: ReturnType<typeof setTimeout> | null = null;
          const emitViewport = () => {
            if (vpTimer) clearTimeout(vpTimer);
            vpTimer = setTimeout(() => {
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
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initialView, onReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    popupRef.current?.remove();
    const source = map.getSource("stores") as GeoJSONSource | undefined;
    if (!source) return;
    const level = getZoomLevel(map.getZoom());
    if (level === 0) source.setData(buildGridClusters(stores, GRID_SIZES[0]));
    else if (level === 1) source.setData(buildGridClusters(stores, GRID_SIZES[1]));
    else source.setData(buildGeoJSON(stores));
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
