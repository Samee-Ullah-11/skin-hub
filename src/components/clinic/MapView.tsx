"use client";

import { MapPicker } from "./MapPicker";

export function MapView({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return <MapPicker center={{ lat, lng }} value={{ lat, lng }} label={label} />;
}
