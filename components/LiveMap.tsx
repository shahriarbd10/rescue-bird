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
          const distanceKm = userPoint ? haversineKm(userPoint, { lat: lat as number, lng: lng as number }) : null;
          const isNear = distanceKm !== null ? distanceKm <= 5 : true;
          const teamStroke = role === "user" ? (isNear ? "#0f9a72" : "#f0a310") : "#0f9a72";
          const teamFill = role === "user" ? (isNear ? "#20c592" : "#f0b33c") : "#20c592";
          return (
            <div key={`team-${team._id}`}>
              <Circle
                center={[lat as number, lng as number]}
                radius={coverageMeters}
                pathOptions={{ color: teamStroke, fillColor: teamFill, fillOpacity: 0.08 }}
              />
              <CircleMarker
                center={[lat as number, lng as number]}
                radius={8}
                pathOptions={{ color: teamStroke, fillColor: teamFill, fillOpacity: 0.9 }}
              >
                <Popup>
                  <strong>{team.name}</strong>
                  <br />
                  Coverage: {team.coverageRadiusKm || 5} km
                  {distanceKm !== null ? (
                    <>
                      <br />
                      Distance from you: {distanceKm.toFixed(2)} km
                    </>
                  ) : null}
                  {team.phone ? (
                    <>
                      <br />
                      Phone: {team.phone}
                    </>
                  ) : null}
                  {team.areaNames?.length ? (
                    <>
                      <br />
                      Areas: {team.areaNames.slice(0, 4).join(", ")}
                    </>
                  ) : null}
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
        {role === "user" ? (
          <>
            <span className="legend-item">
              <i className="dot squad-near" /> Nearby squad
            </span>
            <span className="legend-item">
              <i className="dot squad-far" /> Farther squad
            </span>
          </>
        ) : null}
        <span className="legend-item">
          <i className="dot alert" /> Live alert
        </span>
        <span className="muted">Role view: {role}</span>
      </div>
    </div>
  );
}
