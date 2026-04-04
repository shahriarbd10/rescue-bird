"use client";

import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from "react-leaflet";

type MapUser = {
  _id: string;
  name: string;
  role: string;
  currentLocation?: { lat?: number | null; lng?: number | null } | null;
  lastLocationAt?: string | null;
};

type MapTeam = {
  _id: string;
  name: string;
  location?: { lat?: number | null; lng?: number | null } | null;
  coverageRadiusKm?: number;
  phone?: string;
  areaNames?: string[];
};

type MapAlert = {
  _id: string;
  area: string;
  status: "open" | "accepted" | "resolved";
  location?: { lat?: number | null; lng?: number | null } | null;
  createdAt: string;
};

type Props = {
  role: string;
  users: MapUser[];
  teams: MapTeam[];
  alerts: MapAlert[];
};

function valid(lat?: number | null, lng?: number | null) {
  return typeof lat === "number" && typeof lng === "number";
}

function toRad(v: number) {
  return (v * Math.PI) / 180;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * r * Math.asin(Math.sqrt(h));
}

export default function LiveMap({ role, users, teams, alerts }: Props) {
  const points: Array<{ lat: number; lng: number }> = [];
  const userPoint =
    role === "user" && users[0] && valid(users[0].currentLocation?.lat, users[0].currentLocation?.lng)
      ? {
          lat: users[0].currentLocation?.lat as number,
          lng: users[0].currentLocation?.lng as number
        }
      : null;

  users.forEach((user) => {
    const lat = user.currentLocation?.lat;
    const lng = user.currentLocation?.lng;
    if (valid(lat, lng)) points.push({ lat, lng } as { lat: number; lng: number });
  });

  teams.forEach((team) => {
    const lat = team.location?.lat;
    const lng = team.location?.lng;
    if (valid(lat, lng)) points.push({ lat, lng } as { lat: number; lng: number });
  });

  alerts.forEach((alert) => {
    const lat = alert.location?.lat;
    const lng = alert.location?.lng;
    if (valid(lat, lng)) points.push({ lat, lng } as { lat: number; lng: number });
  });

  const center = points.length > 0 ? [points[0].lat, points[0].lng] : [23.8103, 90.4125];

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer 
        center={center as [number, number]} 
        zoom={13} 
        zoomControl={false}
        scrollWheelZoom 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {users.map((user) => {
          const lat = user.currentLocation?.lat;
          const lng = user.currentLocation?.lng;
          if (!valid(lat, lng)) return null;
          return (
            <CircleMarker
              key={`user-${user._id}`}
              center={[lat as number, lng as number]}
              radius={8}
              pathOptions={{ 
                color: "#ffffff", 
                fillColor: "#2563eb", 
                fillOpacity: 1,
                weight: 3
              }}
            >
              <Popup className="premium-popup">
                <div className="stack" style={{ gap: "4px" }}>
                  <strong style={{ fontSize: "1rem" }}>{user.name}</strong>
                  <span className="tag hero-tag" style={{ fontSize: "10px", padding: "2px 6px" }}>{user.role.replace("_", " ")}</span>
                  {user.lastLocationAt && (
                    <small className="muted">Signal: {new Date(user.lastLocationAt).toLocaleTimeString()}</small>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {teams.map((team) => {
          const lat = team.location?.lat;
          const lng = team.location?.lng;
          if (!valid(lat, lng)) return null;
          const coverageMeters = Math.max(100, (team.coverageRadiusKm || 5) * 1000);
          const distanceKm = userPoint ? haversineKm(userPoint, { lat: lat as number, lng: lng as number }) : null;
          const isNear = distanceKm !== null ? distanceKm <= 5 : true;
          const teamColor = isNear ? "#10b981" : "#f59e0b";
          
          return (
            <div key={`team-${team._id}`}>
              <Circle
                center={[lat as number, lng as number]}
                radius={coverageMeters}
                pathOptions={{ color: teamColor, fillColor: teamColor, fillOpacity: 0.05, weight: 1 }}
              />
              <CircleMarker
                center={[lat as number, lng as number]}
                radius={10}
                pathOptions={{ 
                  color: "#ffffff", 
                  fillColor: teamColor, 
                  fillOpacity: 1,
                  weight: 3
                }}
              >
                <Popup className="premium-popup">
                  <div className="stack" style={{ gap: "8px" }}>
                    <strong style={{ fontSize: "1.05rem" }}>{team.name}</strong>
                    <div className="row" style={{ gap: "6px" }}>
                      <span className="tag ok">Active</span>
                      <small className="muted">{team.coverageRadiusKm || 5}km range</small>
                    </div>
                    {team.phone && <button className="secondary" style={{ width: "100%", padding: "8px" }}>Call Team</button>}
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}

        {alerts.map((alert) => {
          const lat = alert.location?.lat;
          const lng = alert.location?.lng;
          if (!valid(lat, lng)) return null;
          const urgentColor = alert.status === "open" ? "#ef4444" : "#f59e0b";
          return (
            <CircleMarker
              key={`alert-${alert._id}`}
              center={[lat as number, lng as number]}
              radius={9}
              pathOptions={{ 
                color: "#ffffff", 
                fillColor: urgentColor, 
                fillOpacity: 1,
                weight: 3
              }}
            >
              <Popup className="premium-popup">
                <div className="stack" style={{ gap: "6px" }}>
                  <strong style={{ color: "#ef4444" }}>EMERGENCY: {alert.area}</strong>
                  <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>Status: {alert.status.toUpperCase()}</p>
                  <small className="muted">{new Date(alert.createdAt).toLocaleString()}</small>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Tactical Legend */}
      <div style={{ 
        position: "absolute", 
        top: "100px", 
        right: "16px", 
        zIndex: 1000, 
        background: "var(--glass)", 
        backdropFilter: "blur(10px)",
        padding: "12px",
        borderRadius: "16px",
        boxShadow: "var(--shadow)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        border: "1px solid var(--line)",
        color: "var(--text)"
      }}>
        <div className="row" style={{ gap: "8px", fontSize: "0.75rem", fontWeight: 700 }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2563eb", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} /> User Assets
        </div>
        <div className="row" style={{ gap: "8px", fontSize: "0.75rem", fontWeight: 700 }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} /> Response Squads
        </div>
        <div className="row" style={{ gap: "8px", fontSize: "0.75rem", fontWeight: 700 }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} /> Active Signals
        </div>
      </div>
    </div>
  );
}
