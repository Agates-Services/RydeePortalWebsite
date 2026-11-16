import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ActiveRider } from "@/types/rider";

interface LiveMapProps {
  riders: ActiveRider[];
}

export default function LiveMap({ riders }: LiveMapProps) {
  return (
    <MapContainer
      center={[24.8607, 67.0011]}
      zoom={12}
      style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 200px)" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {riders.map((rider) => (
        <CircleMarker
          key={rider.id}
          center={[rider.lat, rider.lng]}
          radius={10}
          pathOptions={{
            fillColor: "#0d8f6e",
            fillOpacity: 0.9,
            color: "#ffffff",
            weight: 2,
          }}
        >
          <Popup>
            <div className="min-w-40 font-sans">
              <p className="mb-1 text-sm font-semibold text-slate-900">{rider.name}</p>
              <p className="text-xs text-slate-500">📍 {rider.area}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
