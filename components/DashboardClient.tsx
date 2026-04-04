"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SculptureLoader from "@/components/SculptureLoader";
import BrandLogo from "@/components/BrandLogo";
import { BoltIcon, CompassIcon, ShieldIcon } from "@/components/BrandIcons";
import Spinner from "@/components/Spinner";

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
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<BlobPart[]>([]);

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
    const [meRes, teamRes, alertRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/teams"),
      fetch("/api/alerts")
    ]);

    if (meRes.status === 401) {
      router.push("/login");
      return;
    }

    const meJson = await meRes.json();
    const teamJson = await teamRes.json();
    const alertJson = await alertRes.json();

    setUser(meJson.user);
    setTeams(teamJson.teams || []);
    setAlerts(alertJson.alerts || []);

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

  if (!user) {
    return (
      <div className="stack">
        <SculptureLoader lines={3} />
        <SculptureLoader lines={5} />
      </div>
    );
  }

  return (
    <div className="stack rescue-shell dashboard-root">
      <section className="hero stack rescue-hero">
        <div className="row space">
          <div>
            <div className="row">
              <BrandLogo size={32} />
              <span className="tag hero-tag">
                <ShieldIcon size={14} />
                Emergency Operations
              </span>
            </div>
            <h1 className="title" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>
              Rescue Control
            </h1>
            <p style={{ marginTop: 6 }}>
              {user.name} ({user.role}) | {user.email}
            </p>
          </div>
          <button className="secondary" onClick={logout}>
            Logout
          </button>
        </div>
        <div className="kpi-grid">
          <div className="kpi kpi-rich">
            <span className="icon-pill">
              <BoltIcon />
            </span>
            <p className="v">{alerts.length}</p>
            <p className="l">Alerts in view</p>
          </div>
          <div className="kpi kpi-rich">
            <span className="icon-pill">
              <CompassIcon />
            </span>
            <p className="v">{openAlerts}</p>
            <p className="l">Pending alerts</p>
          </div>
          <div className="kpi kpi-rich">
            <span className="icon-pill">
              <ShieldIcon />
            </span>
            <p className="v">{teams.length}</p>
            <p className="l">Available teams</p>
          </div>
          <div className="kpi kpi-rich">
            <span className="icon-pill">
              <BoltIcon />
            </span>
            <p className="v">{messages.length}</p>
            <p className="l">Current chat messages</p>
          </div>
        </div>
        {status ? <span className="tag">{status}</span> : null}
      </section>

      <section className="card">
        <div className="tabs">
          {visibleTabs.map((tabId) => (
            <button
              key={tabId}
              className={`tab ${activeTab === tabId ? "active" : ""}`}
              onClick={() => setActiveTab(tabId)}
            >
              {tabId}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "overview" ? (
        <section className="card stack">
          <h2 className="subhead">Operational Overview</h2>
          <div className="list alerts-list">
            <div className="tile">
              <strong>Your role focus</strong>
              <p className="muted">
                {isUser
                  ? "Use Alerts to quickly request help and stay connected with rescue teams."
                  : "Monitor incoming incidents, coordinate with team members, and close alerts quickly."}
              </p>
            </div>
            <div className="tile">
              <strong>Message stream</strong>
              <p className="muted">Select a team in Messages to view the latest conversation thread.</p>
            </div>
            <div className="tile">
              <strong>Coverage intelligence</strong>
              <p className="muted">Team matching uses both configured area names and base location radius.</p>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "alerts" ? (
        <section className="card stack">
          <h2 className="subhead">Alerts</h2>

          {isUser ? (
            <div className="card soft stack">
              <span className="tag danger pulse">Emergency Form</span>
              <form
                className="grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitAlert();
                }}
              >
                <input
                  name="area"
                  placeholder="Area (Mirpur, Dhanmondi, Gulshan...)"
                  required
                  value={areaInput}
                  onChange={(event) => setAreaInput(event.target.value)}
                />
                <div className="row">
                  <input
                    name="lat"
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    required
                    value={latInput}
                    onChange={(event) => setLatInput(event.target.value)}
                  />
                  <input
                    name="lng"
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    required
                    value={lngInput}
                    onChange={(event) => setLngInput(event.target.value)}
                  />
                </div>
                <button type="button" className="secondary" onClick={detectLocation} disabled={locating}>
                  {locating ? <Spinner label="Detecting location" /> : "Use My Location"}
                </button>
                <textarea
                  name="note"
                  placeholder="Short note about your emergency situation"
                  value={noteInput}
                  onChange={(event) => setNoteInput(event.target.value)}
                />
                <input
                  name="voiceNoteUrl"
                  placeholder="Voice note URL (optional)"
                  value={voiceNoteInput}
                  onChange={(event) => setVoiceNoteInput(event.target.value)}
                />
                <div className="btn-row">
                  {!recordingVoice ? (
                    <button type="button" className="secondary" onClick={startVoiceRecording} disabled={uploadingVoice}>
                      Start Voice Recording
                    </button>
                  ) : (
                    <button type="button" className="danger" onClick={stopVoiceRecording}>
                      Stop Recording
                    </button>
                  )}
                  {uploadingVoice ? <span className="muted"><Spinner label="Uploading voice" /></span> : null}
                </div>
                {voicePreviewUrl ? <audio controls src={voicePreviewUrl} style={{ width: "100%" }} /> : null}
                <div className="btn-row">
                  <button type="submit" className="danger" disabled={sendingAlert}>
                    {sendingAlert ? <Spinner label="Sending emergency alert" /> : "Send Emergency Alert"}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="list">
            {alerts.length === 0 ? <p className="muted">No alerts found right now.</p> : null}
            {alerts.map((alert) => (
              <div className="tile stack" key={alert._id}>
                <div className="row space">
                  <span className={statusTagClass(alert.status)}>{alert.status}</span>
                  <small className="muted">{new Date(alert.createdAt).toLocaleString()}</small>
                </div>
                <strong>{alert.area}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  {alert.note || "No note provided"}
                </p>
                {alert.voiceNoteUrl ? (
                  <a href={alert.voiceNoteUrl} target="_blank" className="muted">
                    Open voice note
                  </a>
                ) : null}
                {isTeamSide ? (
                  <div className="btn-row">
                    {alert.status === "open" ? (
                      <button onClick={() => updateAlertState(alert._id, "accept")}>Accept</button>
                    ) : null}
                    {alert.status !== "resolved" ? (
                      <button className="secondary" onClick={() => updateAlertState(alert._id, "resolve")}>
                        Resolve
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "operations" ? (
        <section className="ops-grid">
          <section className="card stack">
            <h2 className="subhead">Team Coverage Setup</h2>
            <form className="grid" action={teamCreateOrUpdate}>
              <input name="teamId" placeholder="Team ID (fill to update existing team)" />
              <input name="name" placeholder="Team name" required />
              <input name="description" placeholder="Description" />
              <input name="phone" placeholder="Team phone number" />
              <input name="areaNames" placeholder="Covered areas, comma separated" />
              <div className="row">
                <input name="lat" type="number" step="any" placeholder="Base latitude" />
                <input name="lng" type="number" step="any" placeholder="Base longitude" />
              </div>
              <input name="coverageRadiusKm" type="number" min="1" max="50" defaultValue={5} />
              <button type="submit">Save Team Profile</button>
            </form>
          </section>

          <section className="card stack">
            <h2 className="subhead">Add Team Staff</h2>
            <form className="grid" action={addStaff}>
              <input name="teamId" placeholder="Team ID" required />
              <input name="name" placeholder="Staff name" required />
              <input name="email" type="email" placeholder="Staff email" required />
              <input name="phone" placeholder="Staff phone number" />
              <input name="password" type="password" placeholder="Temporary password" required />
              <button type="submit">Create Staff Account</button>
            </form>
          </section>
        </section>
      ) : null}

      {activeTab === "messages" ? (
        <section className="card stack chat-layout">
          <h2 className="subhead">Team Messaging</h2>
          <div className="stack">
            <div className="row">
              <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}>
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <button className="secondary" onClick={() => loadMessages(selectedTeamId)}>
                Refresh
              </button>
            </div>

            <form className="grid" action={sendMessage}>
              <input type="hidden" name="teamId" value={selectedTeamId} />
              <textarea name="body" placeholder="Type your message..." required />
              <button type="submit" disabled={!selectedTeamId}>
                Send Message
              </button>
            </form>
          </div>

          <div className="list">
            {messages.length === 0 ? <p className="muted">No messages yet for this team.</p> : null}
            {messages.map((message) => (
              <div key={message._id} className="chat-bubble">
                <small className="muted">
                  {message.senderNameSnapshot} ({message.senderRoleSnapshot}) |{" "}
                  {new Date(message.createdAt).toLocaleString()}
                </small>
                <p style={{ marginBottom: 0 }}>{message.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "admin" && isAdmin ? (
        <section className="card stack">
          <h2 className="subhead">Admin Oversight</h2>
          <p className="muted">
            Users: {audit?.users.length || 0} | Recent messages: {audit?.messages.length || 0}
          </p>
          <div className="list">
            {(audit?.messages || []).slice(0, 20).map((item) => (
              <div key={item._id} className="tile">
                <small className="muted">
                  {item.senderNameSnapshot} ({item.senderRoleSnapshot}) | {new Date(item.createdAt).toLocaleString()}
                </small>
                <p style={{ marginBottom: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
