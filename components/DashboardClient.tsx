"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import SculptureLoader from "@/components/SculptureLoader";
import BrandLogo from "@/components/BrandLogo";
import { BoltIcon, CompassIcon, MailIcon, ShieldIcon, UsersIcon } from "@/components/BrandIcons";
import Spinner from "@/components/Spinner";

import BottomSheet, { SnapPoint } from "@/components/BottomSheet";
import ThemeToggle from "@/components/ThemeToggle";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="full-screen-map-layout stack center" style={{ background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <SculptureLoader lines={3} />
      <p className="muted">Initializing Tactical Map...</p>
    </div>
  )
});

type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "rescue_team" | "user" | "team_staff";
  teamId?: string | null;
};

type Team = {
  _id: string;
  name: string;
  areaNames: string[];
  coverageRadiusKm: number;
  location?: { lat?: number | null; lng?: number | null } | null;
  phone?: string;
};

type Alert = {
  _id: string;
  area: string;
  note: string;
  voiceNoteUrl: string;
  status: "open" | "accepted" | "resolved";
  assignedTeamId?: string | null;
  createdAt: string;
};

type Message = {
  _id: string;
  body: string;
  senderNameSnapshot: string;
  senderRoleSnapshot: string;
  createdAt: string;
};

type TabId = "overview" | "alerts" | "operations" | "messages" | "admin";
type GeoSearchResult = { label: string; lat: number; lng: number; score?: number };

type MapData = {
  role: string;
  users: Array<{
    _id: string;
    name: string;
    role: string;
    currentLocation?: { lat?: number | null; lng?: number | null } | null;
    lastLocationAt?: string | null;
  }>;
  teams: Array<{
    _id: string;
    name: string;
    location?: { lat?: number | null; lng?: number | null } | null;
    coverageRadiusKm?: number;
    phone?: string;
    areaNames?: string[];
  }>;
  alerts: Array<{
    _id: string;
    area: string;
    status: "open" | "accepted" | "resolved";
    location?: { lat?: number | null; lng?: number | null } | null;
    createdAt: string;
  }>;
};

export default function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [audit, setAudit] = useState<{ messages: Message[]; users: User[] } | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [areaInput, setAreaInput] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [voiceNoteInput, setVoiceNoteInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationResults, setLocationResults] = useState<GeoSearchResult[]>([]);

  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState("");
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [syncingLocation, setSyncingLocation] = useState(false);
  const [teamLocationQuery, setTeamLocationQuery] = useState("");
  const [teamLocationSearching, setTeamLocationSearching] = useState(false);
  const [teamLocationResults, setTeamLocationResults] = useState<GeoSearchResult[]>([]);
  const [teamLatInput, setTeamLatInput] = useState("");
  const [teamLngInput, setTeamLngInput] = useState("");
  const autoSyncedUserRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<BlobPart[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [snapPoint, setSnapPoint] = useState<SnapPoint>("mini");
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const isUser = user?.role === "user";
  const isAdmin = user?.role === "admin";
  const isTeamSide = useMemo(
    () => !!user && ["rescue_team", "team_staff", "admin"].includes(user.role),
    [user]
  );
  const openAlerts = alerts.filter((item) => item.status !== "resolved").length;

  const visibleTabs: TabId[] = useMemo(() => {
    if (!user) return [];
    const list: TabId[] = ["overview", "alerts", "messages"];
    if (["rescue_team", "admin"].includes(user.role)) list.push("operations");
    if (user.role === "admin") list.push("admin");
    return list;
  }, [user]);

  const loadBase = useCallback(async () => {
    const [meRes, teamRes, alertRes, mapRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/teams"),
      fetch("/api/alerts"),
      fetch("/api/map")
    ]);

    if (meRes.status === 401) {
      router.push("/login");
      return;
    }

    const meJson = await meRes.json();
    const teamJson = await teamRes.json();
    const alertJson = await alertRes.json();
    const mapJson = mapRes.ok ? await mapRes.json() : null;

    setUser(meJson.user);
    setTeams(teamJson.teams || []);
    setAlerts(alertJson.alerts || []);
    setMapData(mapJson);

    if (Array.isArray(teamJson.teams) && teamJson.teams[0]?.location) {
      const lat = teamJson.teams[0]?.location?.lat;
      const lng = teamJson.teams[0]?.location?.lng;
      if (typeof lat === "number") {
        setTeamLatInput((prev) => (prev ? prev : lat.toString()));
      }
      if (typeof lng === "number") {
        setTeamLngInput((prev) => (prev ? prev : lng.toString()));
      }
    }

    const teamId = meJson.user?.teamId || teamJson.teams?.[0]?._id || "";
    setSelectedTeamId((prev) => prev || teamId);

    if (meJson.user?.role === "admin") {
      const auditRes = await fetch("/api/admin/audit");
      if (auditRes.ok) setAudit(await auditRes.json());
    } else {
      setAudit(null);
    }

    if (meJson.user?.role === "user") setActiveTab("alerts");
    if (["rescue_team", "team_staff"].includes(meJson.user?.role)) setActiveTab("overview");
    if (meJson.user?.role === "admin") setActiveTab("admin");
  }, [router]);

  const loadMessages = useCallback(async (teamId: string) => {
    if (!teamId) return;
    const res = await fetch(`/api/messages?teamId=${teamId}`);
    if (!res.ok) return;
    const json = await res.json();
    setMessages(json.messages || []);
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (selectedTeamId) loadMessages(selectedTeamId);
  }, [selectedTeamId, loadMessages]);

  useEffect(() => {
    return () => {
      if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [voicePreviewUrl]);

  useEffect(() => {
    // When switching tabs, ensure sheet is open at standard point
    setIsSheetOpen(true);
    setSnapPoint("standard");
  }, [activeTab]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function submitAlert() {
    setStatus("");
    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (!areaInput.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      setStatus("Area and valid latitude/longitude are required.");
      return;
    }
    setSendingAlert(true);

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        area: areaInput.trim(),
        lat,
        lng,
        note: noteInput.trim(),
        voiceNoteUrl: voiceNoteInput.trim()
      })
    });
    const json = await res.json();
    setSendingAlert(false);
    setStatus(res.ok ? "Emergency alert sent successfully." : json.error || "Failed to create alert");
    if (res.ok) {
      setNoteInput("");
      setVoiceNoteInput("");
    }
    await loadBase();
  }

  async function uploadVoiceNote(blob: Blob) {
    setUploadingVoice(true);
    const form = new FormData();
    form.append("file", blob, "voice-note.webm");
    const res = await fetch("/api/upload/voice", {
      method: "POST",
      body: form
    });
    const json = await res.json();
    setUploadingVoice(false);
    if (!res.ok) {
      setStatus(json.error || "Voice upload failed");
      return;
    }
    setVoiceNoteInput(String(json.url || ""));
    setStatus("Voice note uploaded successfully.");
  }

  async function startVoiceRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Voice recording is not supported on this device/browser.");
      return;
    }
    try {
      setStatus("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      voiceChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) voiceChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(voiceChunksRef.current, { type: "audio/webm" });
        const preview = URL.createObjectURL(blob);
        setVoicePreviewUrl(preview);
        await uploadVoiceNote(blob);
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      recorder.start();
      setRecordingVoice(true);
      setStatus("Recording started. Press stop when done.");
    } catch {
      setStatus("Unable to access microphone. Please allow mic permission.");
    }
  }

  function stopVoiceRecording() {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecordingVoice(false);
    setStatus("Processing voice note...");
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported on this device.");
      return;
    }

    setLocating(true);
    setStatus("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatInput(position.coords.latitude.toFixed(6));
        setLngInput(position.coords.longitude.toFixed(6));
        setLocating(false);
        setStatus("Location detected and filled.");
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("Location permission denied. Please allow location access.");
          return;
        }
        setStatus("Unable to detect location right now. Please enter coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function searchLocation(query: string, target: "user" | "team", silent = false) {
    const clean = query.trim();
    if (clean.length < 3) {
      if (target === "user") setLocationResults([]);
      if (target === "team") setTeamLocationResults([]);
      if (!silent) setStatus("Type at least 3 characters to search location.");
      return;
    }

    if (target === "user") setLocationSearching(true);
    if (target === "team") setTeamLocationSearching(true);

    try {
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(clean)}`);
      const json = await res.json();

      if (target === "user") setLocationSearching(false);
      if (target === "team") setTeamLocationSearching(false);

      if (!res.ok) {
        if (!silent) setStatus(json.error || "Location search failed.");
        return;
      }

      const results = (json.results || []) as GeoSearchResult[];
      if (target === "user") setLocationResults(results);
      if (target === "team") setTeamLocationResults(results);
      if (!results.length && !silent) setStatus("No matching location found.");
    } catch {
      if (target === "user") setLocationSearching(false);
      if (target === "team") setTeamLocationSearching(false);
      if (!silent) setStatus("Location search failed.");
    }
  }

  const syncLocationByCoordinates = useCallback(async (lat: number, lng: number, successText: string) => {
    setSyncingLocation(true);
    await fetch("/api/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng })
    });
    setSyncingLocation(false);
    await loadBase();
    setStatus(successText);
  }, [loadBase]);

  async function pickUserLocation(result: GeoSearchResult) {
    setLocationQuery(result.label);
    setLatInput(result.lat.toFixed(6));
    setLngInput(result.lng.toFixed(6));
    if (!areaInput.trim()) {
      const labelArea = result.label.split(",")[0]?.trim() || "";
      if (labelArea) setAreaInput(labelArea);
    }
    setLocationResults([]);
    await syncLocationByCoordinates(result.lat, result.lng, "Location selected and synced from search.");
  }

  function pickTeamLocation(result: GeoSearchResult) {
    setTeamLocationQuery(result.label);
    setTeamLatInput(result.lat.toFixed(6));
    setTeamLngInput(result.lng.toFixed(6));
    setTeamLocationResults([]);
    setStatus("Team base location selected from search.");
  }

  const syncCurrentLocation = useCallback(async (options?: PositionOptions) => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported on this device.");
      return;
    }
    setSyncingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        await syncLocationByCoordinates(lat, lng, "Live location synced on map.");
      },
      () => {
        setSyncingLocation(false);
        setStatus("Unable to sync location. Please allow location access.");
      },
      options || { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [syncLocationByCoordinates]);

  useEffect(() => {
    if (!user) return;
    const shouldAutoSync = user.role === "user" || user.role === "rescue_team" || user.role === "team_staff";
    if (!shouldAutoSync) return;

    const userId = String(user._id);
    if (autoSyncedUserRef.current === userId) return;
    autoSyncedUserRef.current = userId;

    void syncCurrentLocation({ enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 });
  }, [user, syncCurrentLocation]);

  useEffect(() => {
    const clean = locationQuery.trim();
    if (clean.length < 3) {
      setLocationResults([]);
      setLocationSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      void searchLocation(clean, "user", true);
    }, 350);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  useEffect(() => {
    const clean = teamLocationQuery.trim();
    if (clean.length < 3) {
      setTeamLocationResults([]);
      setTeamLocationSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      void searchLocation(clean, "team", true);
    }, 350);
    return () => clearTimeout(timer);
  }, [teamLocationQuery]);

  async function teamCreateOrUpdate(formData: FormData) {
    setStatus("");
    const payload = {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      phone: String(formData.get("phone") || ""),
      areaNames: String(formData.get("areaNames") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      location: {
        lat: Number(formData.get("lat") || 0),
        lng: Number(formData.get("lng") || 0)
      },
      coverageRadiusKm: Number(formData.get("coverageRadiusKm") || 5)
    };
    const isUpdate = String(formData.get("teamId") || "");
    const method = isUpdate ? "PATCH" : "POST";
    const body = isUpdate ? { ...payload, teamId: isUpdate } : payload;

    const res = await fetch("/api/teams", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    setStatus(res.ok ? "Team profile saved." : json.error || "Team save failed");
    await loadBase();
  }

  async function addStaff(formData: FormData) {
    setStatus("");
    const payload = {
      mode: "staff",
      teamId: String(formData.get("teamId") || ""),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      password: String(formData.get("password") || "")
    };
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    setStatus(res.ok ? "Team staff created." : json.error || "Failed to add staff");
  }

  async function sendMessage(formData: FormData) {
    setStatus("");
    const payload = {
      teamId: String(formData.get("teamId") || selectedTeamId),
      body: String(formData.get("body") || "")
    };

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    setStatus(res.ok ? "Message sent." : json.error || "Failed to send message");
    await loadMessages(payload.teamId);
  }

  async function updateAlertState(alertId: string, action: "accept" | "resolve") {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "action", alertId, action })
    });
    const json = await res.json();
    setStatus(res.ok ? `Alert ${action}ed.` : json.error || "Action failed");
    await loadBase();
  }

  function statusTagClass(statusValue: Alert["status"]) {
    if (statusValue === "resolved") return "tag ok";
    if (statusValue === "accepted") return "tag warn";
    return "tag danger";
  }

  const activeResponders = useMemo(() => {
    // Mock logic for responders if not in data
    return mapData?.users.filter(u => u.role !== "user").length || 0;
  }, [mapData]);

  function tabIcon(tabId: TabId) {
    if (tabId === "overview") return <BoltIcon size={16} />;
    if (tabId === "alerts") return <CompassIcon size={16} />;
    if (tabId === "messages") return <MailIcon size={16} />;
    if (tabId === "operations") return <UsersIcon size={16} />;
    return <ShieldIcon size={16} />;
  }

  if (!user) {
    return (
      <div className="stack center" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SculptureLoader lines={3} />
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* Background Layer: Tactical Map */}
      <div className="full-screen-map-layout">
        {mapData ? (
          <LiveMap role={mapData.role} users={mapData.users} teams={mapData.teams} alerts={mapData.alerts} />
        ) : (
          <div className="stack center" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
             <SculptureLoader lines={3} />
          </div>
        )}
      </div>

      {/* Professional Command Header (Desktop/Mobile Adaptive) */}
      <header className="tactical-header" style={{ zIndex: 2000 }}>
        <div className="row space header-inner" style={{ height: "100%", padding: "0 20px" }}>
          <div className="row" style={{ gap: "10px" }}>
             <BrandLogo size={28} color="#3b82f6" />
             <div className="desktop-only stack" style={{ gap: 0 }}>
                <strong style={{ fontSize: "0.9rem", color: "var(--text)" }}>Rescue Bird</strong>
                <small className="muted" style={{ fontSize: "0.6rem" }}>Tactical Network</small>
             </div>
             <ThemeToggle />
          </div>

          <nav className="row" style={{ gap: "4px", flex: 1, justifyContent: "center" }}>
             {visibleTabs.map(tab => (
               <button 
                 key={tab} 
                 className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
                 onClick={() => { setActiveTab(tab); setIsSheetOpen(true); setSnapPoint("standard"); }}
               >
                 {tabIcon(tab)}
                 <span className="desktop-only">{tab}</span>
               </button>
             ))}
          </nav>

          <div className="row" style={{ gap: "10px" }}>
            <div className="row" style={{ gap: "4px", background: "var(--panel-soft)", padding: "4px 8px", borderRadius: "10px", border: "1px solid var(--line)" }}>
               <div className="mini-pill">
                 <span className="v" style={{ fontSize: "0.85rem" }}>{openAlerts}</span>
                 <span className="l desktop-only" style={{ fontSize: "0.6rem" }}>Alerts</span>
               </div>
               <div className="mini-pill">
                 <span className="v" style={{ fontSize: "0.85rem" }}>{activeResponders}</span>
                 <span className="l desktop-only" style={{ fontSize: "0.6rem" }}>Teams</span>
               </div>
            </div>
            <button className="secondary" style={{ width: "40px", height: "40px", borderRadius: "12px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)" }} onClick={logout} title="Sign Out">
              <BoltIcon size={18} className="danger" />
            </button>
          </div>
        </div>
      </header>

      <style jsx>{`
        @media (max-width: 1023px) {
          .desktop-only { display: none; }
        }
        @media (min-width: 1024px) {
           .top-nav-shell { width: 400px !important; }
        }
      `}</style>

      {/* Search and Location Overlays remain separate for map control */}

      {/* Floating Action Buttons */}
      <div className="fab-container">
        <button className="fab secondary" onClick={() => syncCurrentLocation()} disabled={syncingLocation}>
          <CompassIcon size={24} />
        </button>
        {isUser && (
          <button className="fab" onClick={() => { setActiveTab("alerts"); setIsSheetOpen(true); setSnapPoint("standard"); }}>
            <BoltIcon size={32} />
          </button>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Dashboard navigation">
        {visibleTabs.map((tabId) => (
          <button
            key={`mobile-${tabId}`}
            className={`mobile-nav-item ${activeTab === tabId ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tabId);
              setIsSheetOpen(true);
              setSnapPoint("standard");
            }}
          >
            {tabIcon(tabId)}
            <span>{tabId}</span>
          </button>
        ))}
      </nav>

      {status ? (
        <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 1600 }}>
          <span className="tag status-msg" style={{ boxShadow: "var(--shadow)" }}>{status}</span>
        </div>
      ) : null}

      {/* Interactive Bottom Sheet content */}
      <BottomSheet 
        isOpen={isSheetOpen} 
        snapPoint={snapPoint} 
        onSnapChange={setSnapPoint}
        onClose={() => setIsSheetOpen(false)}
      >
        {activeTab === "overview" && (
          <section className="stack">
            <div className="row space" style={{ marginBottom: "20px", alignItems: "center" }}>
               <h2 className="subhead">Live Updates</h2>
               <div className="tag success pulse">System Online</div>
            </div>

            {!isSheetOpen && !isDesktop && (
              <div className="row" style={{ gap: "10px", marginBottom: "16px", padding: "12px", background: "var(--panel-soft)", borderRadius: "14px" }}>
                 <div className="row" style={{ gap: "6px" }}>
                    <BoltIcon size={14} className="danger" /> <strong>{openAlerts} Alerts</strong>
                 </div>
                 <div className="row" style={{ gap: "6px" }}>
                    <UsersIcon size={14} className="brand" /> <strong>{activeResponders} Teams</strong>
                 </div>
              </div>
            )}

            <div className="kpi-grid">
              <div className="kpi">
                <p className="l">Active Alerts</p>
                <p className="v">{openAlerts}</p>
              </div>
              <div className="kpi">
                <p className="l">Rescue Teams</p>
                <p className="v">{activeResponders}</p>
              </div>
            </div>
            
            <div className="list">
               <div className="tactical-card">
                  <div className="card-header">
                     <strong className="card-title">Safety Status</strong>
                  </div>
                  <p className="card-body">
                    {isUser 
                      ? "The area is currently stable. Several rescue teams are patrolling nearby to help if needed. Estimated response time is under 5 minutes."
                      : "Monitoring all active alerts. Teams are being sent to help those in need across all sectors."}
                  </p>
               </div>
            </div>

            <div className="section-image-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Image className="section-image" src="/images/rescue-operations.svg" alt="Ops" width={400} height={250} />
              <Image className="section-image" src="/images/rescue-teamwork.svg" alt="Work" width={400} height={250} />
            </div>

            <div className="stack" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
               <button 
                 className="secondary danger-text" 
                 style={{ width: "100%", padding: "14px", borderRadius: "14px", justifyContent: "center", display: "flex", alignItems: "center", gap: "10px" }}
                 onClick={logout}
               >
                 <BoltIcon size={16} />
                 Log Out
               </button>
               <p className="muted" style={{ textAlign: "center", fontSize: "0.75rem", marginTop: "12px" }}>
                 Logged in as <strong>{user.email}</strong>
               </p>
            </div>
          </section>
        )}

        {activeTab === "alerts" && (
          <section className="stack">
            <div className="card-header">
               <h2 className="subhead">Help & Alerts</h2>
            </div>
            
            {isUser && snapPoint !== "mini" && (
              <div className="stack" style={{ gap: "16px", marginBottom: "20px" }}>
                <div className="tag danger pulse" style={{ width: "fit-content" }}>Emergency Signal Ready</div>
                <form
                  className="grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitAlert();
                  }}
                >
                  <input
                    name="area"
                    placeholder="Sector / Area (e.g. Mirpur 12)"
                    required
                    value={areaInput}
                    onChange={(event) => setAreaInput(event.target.value)}
                  />
                  <div className="location-search">
                    <div className="location-field" style={{ flex: 1 }}>
                      <input
                        placeholder="Search landmark..."
                        value={locationQuery}
                        onChange={(event) => setLocationQuery(event.target.value)}
                      />
                      {locationResults.length > 0 && (
                        <div className="suggestion-dropdown">
                          {locationResults.map((result, idx) => (
                            <button
                              key={`${result.label}-${idx}`}
                              type="button"
                              className="suggestion-item"
                              onClick={() => pickUserLocation(result)}
                            >
                              <span>{result.label}</span>
                              <small>{result.lat.toFixed(4)}, {result.lng.toFixed(4)}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <textarea
                    name="note"
                    placeholder="Brief SITREP (Situation Report)..."
                    value={noteInput}
                    onChange={(event) => setNoteInput(event.target.value)}
                  />

                  <button type="submit" className="danger" style={{ padding: "16px", borderRadius: "18px", fontSize: "1.1rem", border: "4px solid rgba(255,255,255,0.2)" }} disabled={sendingAlert}>
                    {sendingAlert ? <Spinner label="Transmitting..." /> : "ACTIVATE EMERGENCY BEACON"}
                  </button>
                </form>
              </div>
            )}

            <div className="list">
              <p className="muted" style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Operations</p>
              {alerts.length === 0 && <p className="muted">Zero signals in this quadrant.</p>}
              {alerts.map((alert) => (
                <div className="tactical-card" key={alert._id}>
                  <div className="card-header">
                    <strong className="card-title">{alert.area}</strong>
                    <span className={statusTagClass(alert.status)} style={{ fontSize: "10px" }}>{alert.status}</span>
                  </div>
                  <div className="card-meta">
                    <div className="meta-item">
                       <CompassIcon size={12} /> 2.4 km away
                    </div>
                    <div className="meta-item">
                       <ShieldIcon size={12} /> {new Date(alert.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  {alert.note && <p className="card-body">{alert.note}</p>}
                  {isTeamSide && alert.status !== "resolved" && (
                    <div className="card-actions">
                       {alert.status === "open" && <button className="brand" onClick={() => updateAlertState(alert._id, "accept")}>Intercept</button>}
                       <button className="secondary" onClick={() => updateAlertState(alert._id, "resolve")}>Close Case</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "operations" && (
          <section className="stack">
            <h2 className="subhead">Logistics & Asset Control</h2>
            <div className="list" style={{ marginTop: "12px" }}>
              <p className="muted" style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Registered Squads</p>
              {teams.map((team) => (
                <div className="tactical-card" key={team._id}>
                  <div className="card-header">
                    <strong className="card-title">{team.name}</strong>
                    <div className="row" style={{ gap: "4px" }}>
                      <span className="status-dot online" />
                    </div>
                  </div>
                  <div className="card-meta">
                     <div className="meta-item"><UsersIcon size={12} /> 4 Personnel</div>
                     <div className="meta-item"><CompassIcon size={12} /> {team.coverageRadiusKm}km Coverage</div>
                  </div>
                  <div className="card-actions">
                     <button className="secondary" onClick={() => { if(team.phone) window.location.href=`tel:${team.phone}` }}>Direct Comms</button>
                     <button className="secondary">Inventory</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "messages" && (
           <section className="stack">
              <h2 className="subhead">Comm-Link Channel</h2>
              <div className="tactical-card" style={{ background: "var(--panel-soft)", border: "1px solid var(--line)" }}>
                 <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} style={{ background: "transparent", border: "none", fontWeight: 800, padding: 0, color: "var(--text)" }}>
                    <option value="">Switch Frequency...</option>
                    {teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}
                 </select>
                 <textarea name="body" placeholder="Broadcast message to squad..." style={{ height: "60px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "12px", color: "var(--text)" }} />
                 <button className="brand" onClick={() => {
                    const body = (document.querySelector('textarea[name="body"]') as HTMLTextAreaElement).value;
                    if (body) {
                      const fd = new FormData();
                      fd.append("teamId", selectedTeamId);
                      fd.append("body", body);
                      sendMessage(fd);
                    }
                 }} disabled={!selectedTeamId}>Transmit</button>
              </div>
              <div className="list" style={{ marginTop: "12px" }}>
                 {messages.map((m) => (
                    <div key={m._id} className="chat-bubble" style={{ border: "1px solid var(--line)", background: m.senderRoleSnapshot === 'user' ? 'var(--panel-soft)' : 'var(--bg-2)', boxShadow: 'var(--shadow-soft)', color: "var(--text)" }}>
                       <div className="row space" style={{ marginBottom: "4px" }}>
                          <strong style={{ fontSize: "0.85rem", color: m.senderRoleSnapshot === 'user' ? 'var(--brand)' : 'var(--text)' }}>{m.senderNameSnapshot}</strong>
                          <small className="muted" style={{ fontSize: "0.65rem" }}>{new Date(m.createdAt).toLocaleTimeString()}</small>
                       </div>
                       <p style={{ margin: 0, fontSize: "0.9rem" }}>{m.body}</p>
                    </div>
                 ))}
              </div>
           </section>
        )}

        {activeTab === "admin" && (
          <section className="stack">
             <h2 className="subhead">Global Oversight</h2>
             <div className="kpi-grid">
                <div className="kpi">
                   <p className="l">Total Assets</p>
                   <p className="v">{audit?.users.length || 0}</p>
                </div>
                <div className="kpi">
                   <p className="l">Signal Volume</p>
                   <p className="v">{audit?.messages.length || 0}</p>
                </div>
             </div>
             <div className="list" style={{ marginTop: "16px" }}>
                {audit?.messages.slice(0, 10).map((m) => (
                   <div key={m._id} className="tactical-card" style={{ padding: "12px" }}>
                      <div className="row space">
                         <strong>{m.senderNameSnapshot}</strong>
                         <small className="muted">{new Date(m.createdAt).toLocaleTimeString()}</small>
                      </div>
                      <p className="card-body" style={{ fontSize: "0.85rem" }}>{m.body}</p>
                   </div>
                ))}
             </div>
          </section>
        )}
      </BottomSheet>
    </div>
  );
}
