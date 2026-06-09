"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import StatusBadge from "./StatusBadge";

// Fix for default Leaflet marker icon in webpack/turbopack bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createPin(status: string) {
  const color =
    status === "resolved" ? "#22c55e" :
    status === "reviewed" ? "#3b82f6" :
    "#f59e0b";

  return L.divIcon({
    className: "",
    html: `<div style="
      width:12px;height:12px;
      background:${color};
      border:2px solid rgba(255,255,255,0.5);
      border-radius:50%;
      box-shadow:0 0 0 3px ${color}40;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
  });
}

export interface ReportPin {
  id: string;
  lat: number;
  lng: number;
  imageUrl: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: Date | null;
}

function MapFit({ reports }: { reports: ReportPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (reports.length === 0) return;
    const bounds = L.latLngBounds(reports.map((r) => [r.lat, r.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [reports, map]);
  return null;
}

export default function ReportsMap({ reports }: { reports: ReportPin[] }) {
  const center: [number, number] =
    reports.length > 0 ? [reports[0].lat, reports[0].lng] : [20.5937, 78.9629];

  return (
    <MapContainer center={center} zoom={12} style={{ width: "100%", height: "100%" }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />
      {reports.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={createPin(r.status)}>
          <Popup>
            <div style={{ width: 200, padding: "12px", fontFamily: "Inter, sans-serif" }}>
              {r.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.imageUrl}
                  alt="Report"
                  style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
                />
              )}
              <StatusBadge status={r.status} />
              <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
                {r.description}
              </p>
              {r.createdAt && (
                <p style={{ color: "var(--text-3)", fontSize: 11, marginTop: 6 }}>
                  {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      {reports.length > 0 && <MapFit reports={reports} />}
    </MapContainer>
  );
}
