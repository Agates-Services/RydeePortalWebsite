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
            fillColor: "#15803d",
            fillOpacity: 0.9,
            color: "#ffffff",
            weight: 2,
          }}
        >
          <Popup>
            <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif", minWidth: 160 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{rider.name}</p>
              <p style={{ fontSize: 12, color: "#4a6b5e", marginBottom: 2 }}>📍 {rider.area}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
