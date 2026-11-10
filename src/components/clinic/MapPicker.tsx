"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

function pinIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: '<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:var(--primary);border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

export function MapPicker({
  center,
  value,
  onChange,
  label,
}: {
  center: { lat: number; lng: number };
  value?: { lat: number; lng: number };
  onChange?: (v: { lat: number; lng: number }) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !ref.current || mapRef.current) return;
      const start = value ?? center;
      const map = L.map(ref.current, { scrollWheelZoom: false }).setView([start.lat, start.lng], value ? 16 : 12);
      L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
      const place = (lat: number, lng: number) => {
        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng], { icon: pinIcon(L), draggable: Boolean(onChangeRef.current) }).addTo(map);
          markerRef.current.on("dragend", () => {
            const p = markerRef.current!.getLatLng();
            onChangeRef.current?.({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
          });
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }
      };
      if (value) place(value.lat, value.lng);
      if (onChangeRef.current) {
        map.on("click", (e) => {
          place(e.latlng.lat, e.latlng.lng);
          onChangeRef.current?.({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) });
        });
      }
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The map is created once; later value changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !value || !markerRef.current) return;
    const cur = markerRef.current.getLatLng();
    if (cur.lat !== value.lat || cur.lng !== value.lng) markerRef.current.setLatLng([value.lat, value.lng]);
  }, [ready, value]);

  return <div ref={ref} role="application" aria-label={label} className="z-0 h-72 w-full overflow-hidden rounded-md border border-line" />;
}
