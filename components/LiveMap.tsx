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

export default function LiveMap({ role, users, teams, alerts }: Props) {
  const points: Array<{ lat: number; lng: number }> = [];

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
    <div className="map-wrap">
      <MapContainer center={center as [number, number]} zoom={12} scrollWheelZoom style={{ height: 360, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {users.map((user) => {
          const lat = user.currentLocation?.lat;
          const lng = user.currentLocation?.lng;
          if (!valid(lat, lng)) return null;
          return (
            <CircleMarker
              key={`user-${user._id}`}
              center={[lat as number, lng as number]}
              radius={7}
              pathOptions={{ color: "#0b67c1", fillColor: "#3fa2f6", fillOpacity: 0.85 }}
            >
              <Popup>
                <strong>{user.name}</strong>
                <br />
                {user.role}
                {user.lastLocationAt ? (
                  <>
                    <br />
                    {new Date(user.lastLocationAt).toLocaleString()}
                  </>
                ) : null}
              </Popup>
            </CircleMarker>
          );
        })}

        {teams.map((team) => {
          const lat = team.location?.lat;
          const lng = team.location?.lng;
          if (!valid(lat, lng)) return null;
          const coverageMeters = Math.max(100, (team.coverageRadiusKm || 5) * 1000);
          return (
            <div key={`team-${team._id}`}>
              <Circle
                center={[lat as number, lng as number]}
                radius={coverageMeters}
                pathOptions={{ color: "#0f9a72", fillColor: "#19ba8a", fillOpacity: 0.08 }}
              />
              <CircleMarker
                center={[lat as number, lng as number]}
                radius={8}
                pathOptions={{ color: "#0f9a72", fillColor: "#20c592", fillOpacity: 0.9 }}
              >
                <Popup>
                  <strong>{team.name}</strong>
                  <br />
                  Coverage: {team.coverageRadiusKm || 5} km
                </Popup>
              </CircleMarker>
            </div>
          );
        })}

        {alerts.map((alert) => {
          const lat = alert.location?.lat;
          const lng = alert.location?.lng;
          if (!valid(lat, lng)) return null;
          const color = alert.status === "open" ? "#ce3a42" : "#f0a310";
          return (
            <CircleMarker
              key={`alert-${alert._id}`}
              center={[lat as number, lng as number]}
              radius={7}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}
            >
              <Popup>
                <strong>Alert: {alert.area}</strong>
                <br />
                Status: {alert.status}
                <br />
                {new Date(alert.createdAt).toLocaleString()}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="map-legend">
        <span className="legend-item">
          <i className="dot user" /> User
        </span>
        <span className="legend-item">
          <i className="dot team" /> Team
        </span>
        <span className="legend-item">
          <i className="dot alert" /> Live alert
        </span>
        <span className="muted">Role view: {role}</span>
      </div>
    </div>
  );
}
