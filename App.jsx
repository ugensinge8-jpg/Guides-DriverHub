// ===== BHUTAN TOURISM HUB — FILE VERSION 17 — 14 AUG — VERIFIED CLEAN =====
import React, { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Compass, Car, Building2, ShieldCheck, ImagePlus, X, Check, Clock, Send,
  BadgeCheck, MapPin, Inbox, ChevronLeft, Star, Phone, Mail, Briefcase,
  Search, LogOut, Newspaper, User, CalendarCheck, MessageCircle,
  Map as MapIcon, MessageSquare, Users, Download, Mic, Video as VideoIcon, Heart, Share2, Trash2, Maximize2, Upload, Loader2, ArrowRight,
  Award, UserX, RefreshCw, FileCheck2, ExternalLink, UserPlus, Send as SendIcon, Lock, Eye, EyeOff, CalendarDays, UserCheck, Plus, CheckCheck, Camera, Navigation as NavIcon, Bell, Smartphone, Share, PhoneCall,
  ShieldAlert, Store, Sparkles,
} from "lucide-react";
import mapImg from "./map.jpg";
import { supabase } from "./supabase.js";

/* Bhutan Tourism Hub design system — paper, pine forest, temple gold, kemar red. */
const C = {
  bg: "#F4F5F1", card: "#FFFFFF", ink: "#1A241E", muted: "#6E7A72",
  line: "#E4E7E0", lineSoft: "#EEF0EB", pine: "#21402F", pineDeep: "#16281E",
  gold: "#C0872B", goldSoft: "#F3E8CF", maroon: "#7A2E2E", maroonSoft: "#F7E9E7", pineSoft: "#E4EFE7",
};

/* ------------------------------ Seed data -------------------------------- */
const TALENT = [];

const ACCOUNTS = [];


const HOUR = 3600e3;
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
let PROFILE_DIR = {};
const profileToTalent = (p) => ({
  id: p.id, role: p.role, name: (p.role === "business" && p.company_name) || p.full_name || "Member", base: p.base || "",
  handle: p.handle || null,
  initials: initialsOf((p.role === "business" && p.company_name) || p.full_name || "?"),
  years: licenseExperienceYears(p.license_no) ?? 0,
  trips: 0, rating: p.guest_rating ?? null, ratingCount: p.guest_review_count || 0,
  verified: p.license_status === "verified", licenseStatus: p.license_status || "none",
  guideClass: p.guide_class || null, licenseNo: p.license_no || null, licenseExpiry: p.license_expiry || null, licensePath: p.license_path || null,
  grades: {}, tags: Array.isArray(p.tags) ? p.tags : [],
  languages: Array.isArray(p.languages) ? p.languages : [],
  phone: p.phone || "", email: p.email || "", pitch: p.pitch || "", vehicle: p.vehicle || null,
  availability: p.availability || "open", availableFrom: p.available_from || null, availableNote: p.availability_note || "",
  payment: p.payment_info || null,
  joinedAt: p.created_at ? new Date(p.created_at).getTime() : null,
});
const talentById = (id) => TALENT.find((t) => t.id === id) || PROFILE_DIR[id] || null;
const initialsOf = (name) => (String(name || "?").trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("") || "?").toUpperCase();
const isoDay = (offset = 0) => new Date(Date.now() + offset * 86400e3).toISOString().slice(0, 10);
const sysMsg = (text) => ({ id: uid(), senderId: null, kind: "system", body: text, photo: null, ts: Date.now() });

/* ── Cloud (Supabase) ── posts are global when configured; everything falls back to local demo mode when not. */
const CLOUD = Boolean(supabase);
const DEMO_MODE = false;   // set true only for local demos without a database
const BUILD = "BUILD 16 — 14 Aug";   // bump every deploy; shown at the top of the welcome screen

/* ---- Install state ---- */
// 43 characters of randomness — not guessable
function makeReviewToken() {
  const bytes = new Uint8Array(32);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 43);
}

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/* ---- Device notifications ----
   Shows a system notification when new activity arrives while the app is open or
   backgrounded. Closed-app push: ensurePushSubscription below + the push-lead Edge Function. */
async function askNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try { return await Notification.requestPermission(); } catch { return "denied"; }
}

function showDeviceNotification(title, body, tag) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") return;   // don't nag while they're looking at it
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification(title, { body, tag, icon: "/icon-192.png", badge: "/icon-192.png" }))
      .catch(() => { new Notification(title, { body, tag }); });
  } catch (e) {}
}

/* ---- Closed-app push ----
   Registers this device for Web Push and stores the subscription in
   push_subscriptions. The push-lead Edge Function fires a push whenever an
   operator posts a job listing or sends a direct request. */
const VAPID_PUBLIC_KEY = "BPMQ0hmX3HvMWkKjkcWJAa_O9uDuWMxQVXyl0mUNGuIz1toU6dl4jJ-sr8X0eiCeG8u27dI6CVwYEbiPCH4cbZ0";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

let deferredInstallPrompt = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    try { window.dispatchEvent(new Event("bth-installable")); } catch (err) {}
  });
}
const isStandaloneApp = () =>
  typeof window !== "undefined" &&
  ((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true);

async function ensurePushSubscription(profileId) {
  try {
    if (!CLOUD || !profileId) return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    if (!("Notification" in window) || Notification.permission !== "granted") return false;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const j = sub.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      { endpoint: sub.endpoint, profile_id: profileId, p256dh: j.keys.p256dh, auth: j.keys.auth },
      { onConflict: "endpoint" }
    );
    if (error) console.error("push_subscriptions.upsert failed:", error.message);
    return !error;
  } catch (e) { console.error("push subscribe failed:", e); return false; }
}

async function removePushSubscription() {
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    if (CLOUD) await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  } catch (e) {}
}

// wrap a Supabase write so failures are visible in the console instead of silent
// Record admin actions for accountability. Never blocks the action itself.
async function auditLog(actorId, action, targetId, detail) {
  if (!CLOUD) return;
  try {
    await supabase.from("audit_log").insert({
      actor_id: actorId, action, target_id: targetId || null,
      detail: detail ? String(detail).slice(0, 500) : null,
    });
  } catch (e) { console.error("auditLog failed:", e); }
}

async function dbWrite(label, promise) {
  const { error } = await promise;
  if (error) console.error(`${label} failed:`, error.message);
  return !error;
}

async function shrinkImage(dataUri, maxW = 1280, quality = 0.82) {
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUri; });
    const scale = Math.min(1, maxW / img.width);
    if (scale === 1 && dataUri.length < 900000) return dataUri;
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } catch { return dataUri; }
}

function videoDuration(file) {
  return new Promise((res) => {
    try {
      const v = document.createElement("video");
      v.preload = "metadata";
      const url = URL.createObjectURL(file);
      v.onloadedmetadata = () => { const d = v.duration; URL.revokeObjectURL(url); res(isFinite(d) ? d : null); };
      v.onerror = () => { URL.revokeObjectURL(url); res(null); };
      v.src = url;
    } catch (e) { res(null); }
  });
}

/* ---- Photo enhancement: Bhutan-graded presets + per-photo adjustments ---- */
const LUTS = [
  { id: "none", n: "Original", p: { bright: 1, contrast: 1, sat: 1, warmth: 0, auto: false } },
  { id: "auto", n: "Auto fix", p: { bright: 1, contrast: 1.05, sat: 1.07, warmth: 0, auto: true } },
  { id: "himalaya", n: "Himalaya", p: { bright: 1.02, contrast: 1.14, sat: 1.12, warmth: -0.35, auto: false } },
  { id: "dzong", n: "Dzong Gold", p: { bright: 1.05, contrast: 1.06, sat: 1.18, warmth: 0.55, auto: false } },
  { id: "monsoon", n: "Monsoon", p: { bright: 1.03, contrast: 1.08, sat: 0.82, warmth: -0.2, auto: false } },
  { id: "festival", n: "Festival", p: { bright: 1.02, contrast: 1.1, sat: 1.38, warmth: 0.2, auto: false } },
  { id: "mist", n: "Mist", p: { bright: 1.08, contrast: 0.92, sat: 0.9, warmth: 0.12, auto: false } },
];

const enhanceCss = (p) => [
  `brightness(${p.bright})`, `contrast(${p.contrast})`, `saturate(${p.sat})`,
  p.warmth > 0 ? `sepia(${(p.warmth * 0.28).toFixed(3)}) saturate(1.05)` : "",
  p.warmth < 0 ? `hue-rotate(${(p.warmth * 10).toFixed(1)}deg)` : "",
  p.auto ? "contrast(1.04)" : "",
].filter(Boolean).join(" ");

function bakeEnhance(dataUri, p) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const d = id.data;
        let lo = 0, hi = 255;
        if (p.auto) {
          const hist = new Uint32Array(256);
          for (let i = 0; i < d.length; i += 4) hist[(d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0]++;
          const total = d.length / 4;
          let acc = 0;
          for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > total * 0.01) { lo = v; break; } }
          acc = 0;
          for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > total * 0.01) { hi = v; break; } }
          if (hi - lo < 24) { lo = 0; hi = 255; }
        }
        const stretch = 255 / Math.max(1, hi - lo);
        const B = (p.bright - 1) * 150;
        const C2 = p.contrast, S = p.sat, W = p.warmth || 0;
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i], g = d[i + 1], b = d[i + 2];
          if (p.auto) { r = (r - lo) * stretch; g = (g - lo) * stretch; b = (b - lo) * stretch; }
          r = (r - 128) * C2 + 128 + B; g = (g - 128) * C2 + 128 + B; b = (b - 128) * C2 + 128 + B;
          const l = r * 0.299 + g * 0.587 + b * 0.114;
          r = l + (r - l) * S; g = l + (g - l) * S; b = l + (b - l) * S;
          r += W * 18; g += W * 4; b -= W * 14;
          d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
          d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
          d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
        }
        ctx.putImageData(id, 0, 0);
        resolve(c.toDataURL("image/jpeg", 0.9));
      } catch (e) { resolve(dataUri); }
    };
    img.onerror = () => resolve(dataUri);
    img.src = dataUri;
  });
}

async function compressVideo(file, onProgress) {
  // Re-encodes on the device: decode -> draw to a 720p canvas -> record at ~2.5 Mbps.
  // Turns any 30s phone clip into ~8-12 MB before upload. Returns null when unsupported.
  let url = null;
  try {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
    const mime = ["video/mp4", 'video/webm;codecs=vp9', "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
    if (!mime) return null;
    url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.src = url; v.playsInline = true; v.preload = "auto";
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error("decode")); });
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth || 1280, v.videoHeight || 720));
    const w = Math.max(2, Math.round((v.videoWidth * scale) / 2) * 2);
    const h = Math.max(2, Math.round((v.videoHeight * scale) / 2) * 2);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    const stream = new MediaStream(canvas.captureStream(30).getVideoTracks());
    try {
      const els = v.captureStream ? v.captureStream() : v.mozCaptureStream ? v.mozCaptureStream() : null;
      if (els) els.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch (e) {}
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000, audioBitsPerSecond: 96000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const finished = new Promise((res) => { rec.onstop = res; });
    let raf = 0;
    const draw = () => {
      ctx.drawImage(v, 0, 0, w, h);
      onProgress && onProgress(v.currentTime || 0, v.duration || 0);
      raf = requestAnimationFrame(draw);
    };
    v.onended = () => { cancelAnimationFrame(raf); try { rec.stop(); } catch (e) {} };
    rec.start(500);
    try { await v.play(); } catch (e) { v.muted = true; await v.play(); }
    draw();
    await finished;
    cancelAnimationFrame(raf);
    URL.revokeObjectURL(url); url = null;
    if (!chunks.length) return null;
    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    return blob.size > 0 ? blob : null;
  } catch (e) {
    console.error("compressVideo failed:", e.message || e);
    if (url) URL.revokeObjectURL(url);
    return null;
  }
}

function dataUriToBlob(dataUri) {
  // Manual conversion: works under any Content-Security-Policy, unlike fetch(dataUri).
  const [head, b64] = String(dataUri).split(",");
  const mime = (head.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function uploadPostMedia(talentId, media) {
  try {
    const dataUri = media.kind === "photo" ? await shrinkImage(media.dataUri) : media.dataUri;
    const blob = dataUriToBlob(dataUri);
    const ext = (blob.type.split("/")[1] || "bin").split(";")[0];
    const path = `${talentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("post-media").upload(path, blob, { contentType: blob.type });
    if (error) return { media_url: null, media_kind: null };
    const { data } = supabase.storage.from("post-media").getPublicUrl(path);
    return { media_url: data.publicUrl, media_kind: media.kind };
  } catch { return { media_url: null, media_kind: null }; }
}

const rowToPost = (r) => ({
  id: r.id, talentId: r.talent_id, text: r.body || "",
  media: r.media_url ? { kind: r.media_kind || "photo", dataUri: r.media_url, slides: r.media_slides || null, ratio: r.media_ratio || null } : null,
  location: r.lat != null ? { lat: r.lat, lng: r.lng, place: r.place, description: r.loc_desc, source: r.loc_source, altitude: r.loc_altitude ?? null, bearing: r.loc_bearing ?? null, takenOn: r.loc_taken_on ?? null, outside: r.loc_outside ?? false } : null,
  status: r.status, reason: r.reject_reason, createdAt: new Date(r.created_at).getTime(),
});

const ACTOR_FALLBACK = {};
const actorName = (id) => talentById(id)?.name || ACTOR_FALLBACK[id]?.name || "Member";
const actorInitials = (id) => talentById(id)?.initials || ACTOR_FALLBACK[id]?.initials || "?";

const SEED_POSTS = [];

const SEED_JOBS = [];

const SEED_TRIPS = [];

const SEED_LISTINGS = [];

const LANG_OPTIONS = ["English", "Hindi", "Japanese", "Mandarin", "German", "French"];

/* ================================== App =================================== */
/* ===== Error boundary — shows crashes on screen instead of a blank page ===== */
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null, info: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { this.setState({ info }); console.error("App crashed:", err, info); }
  render() {
    if (!this.state.err) return this.props.children;
    const msg = String(this.state.err?.message || this.state.err);
    const stack = String(this.state.info?.componentStack || "").split("\n").slice(0, 6).join("\n");
    return (
      <div style={{ padding: 20, fontFamily: "system-ui", background: "#F4F5F1", minHeight: "100dvh" }}>
        <div style={{ background: "#fff", border: "1px solid #E4E7E0", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#7A2E2E", marginBottom: 8 }}>Something went wrong</div>
          <p style={{ fontSize: 13.5, color: "#6E7A72", marginBottom: 12 }}>
            Please screenshot this and send it to support — it tells us exactly what to fix.
          </p>
          <div style={{ background: "#F7E9E7", borderRadius: 10, padding: 12, fontSize: 12.5, color: "#7A2E2E", wordBreak: "break-word", fontFamily: "monospace" }}>
            {msg}
          </div>
          {stack && (
            <pre style={{ marginTop: 10, background: "#F4F5F1", borderRadius: 10, padding: 12, fontSize: 11, color: "#6E7A72", overflowX: "auto", whiteSpace: "pre-wrap" }}>{stack}</pre>
          )}
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 14, width: "100%", height: 46, borderRadius: 12, border: "none", background: "#21402F", color: "#fff", fontSize: 15, fontWeight: 600 }}>
            Reload the app
          </button>
        </div>
      </div>
    );
  }
}

// Check for a newer build and swap to it — stops stale caches serving old code
function useAutoUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
    const check = () => navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {});
    check();
    const iv = setInterval(check, 60 * 1000);
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, []);
}

export default function App() {
  useAutoUpdate();
  // A guest arriving on a review link never signs in — they see only the review form.
  const reviewToken = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get("review"); }
    catch (e) { return null; }
  }, []);
  const realUserRef = useRef(null);   // current signed-in id — set below, used by every action
  const [accountId, setAccountId] = useState(null);
  const [posts, setPosts] = useState(CLOUD ? [] : SEED_POSTS);
  const [jobs, setJobs] = useState(CLOUD ? [] : SEED_JOBS);
  const [trips, setTrips] = useState(CLOUD ? [] : SEED_TRIPS);
  const [listings, setListings] = useState(CLOUD ? [] : SEED_LISTINGS);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [session, setSession] = useState(null);
  const [myProfile, setMyProfile] = useState(null);   // null=loading · false=none · object=exists
  const [profileTick, setProfileTick] = useState(0);
  const [dirTick, setDirTick] = useState(0);
  const [dms, setDms] = useState([]);
  const [authBusy, setAuthBusy] = useState(false);   // true while the signup/reset wizard is running
  const [follows, setFollows] = useState([]);
  const [stories, setStories] = useState([]);

  const loadProfiles = async () => {
    if (!CLOUD) return;
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) { console.error("loadProfiles failed:", error.message); return; }
    if (data) { PROFILE_DIR = {}; data.forEach((p) => { PROFILE_DIR[p.id] = profileToTalent(p); }); setDirTick((t) => t + 1); }
  };
  const reloadMe = () => { setProfileTick((t) => t + 1); loadProfiles(); };

  /* ---- Stories (24h, then the file itself is deleted) ---- */
  const fetchStories = async () => {
    if (!CLOUD) return;
    const cutoff = new Date(Date.now() - 24 * 3600e3).toISOString();
    const { data, error: stErr } = await supabase.from("stories").select("*").gt("created_at", cutoff).order("created_at", { ascending: true });
    if (stErr) console.error("fetchStories failed:", stErr.message);
    if (data) setStories(data.map((r) => ({
      id: r.id, authorId: r.author_id, kind: r.kind, url: r.media_url, path: r.media_path,
      caption: r.caption || "", ts: new Date(r.created_at).getTime(),
    })));
    // housekeeping: remove anything already expired, files included
    const { data: old } = await supabase.from("stories").select("id, media_path").lte("created_at", cutoff);
    if (old && old.length) {
      const paths = old.map((o) => o.media_path).filter(Boolean);
      if (paths.length) await supabase.storage.from("stories").remove(paths);
      { const { error: _e } = await supabase.from("stories").delete().in("id", old.map((o) => o.id)); if (_e) console.error("stories.purge failed:", _e.message); }
    }
  };
  useEffect(() => {
    if (!CLOUD) return;
    fetchStories();
    const iv = setInterval(fetchStories, 5 * 60 * 1000);
    const ch = supabase.channel("stories-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, fetchStories)
      .subscribe();
    return () => { clearInterval(iv); supabase.removeChannel(ch); };
  }, []);

  const addStory = async ({ kind, dataUri, caption, fromPostUrl }) => {
    const me = realUserRef.current;
    if (!CLOUD || !me) return;
    let url = fromPostUrl || null, path = null;
    if (!url && dataUri) {
      try {
        const small = kind === "photo" ? await shrinkImage(dataUri, 1280, 0.82) : dataUri;
        const blob = dataUriToBlob(small);
        const ext = kind === "video" ? "mp4" : "jpg";
        path = `${me}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("stories").upload(path, blob, { contentType: blob.type || (kind === "video" ? "video/mp4" : "image/jpeg") });
        if (error) return;
        url = supabase.storage.from("stories").getPublicUrl(path).data.publicUrl;
      } catch (e) { return; }
    }
    if (!url) return;
    await dbWrite("stories.insert", supabase.from("stories").insert({ author_id: me, kind, media_url: url, media_path: path, caption: caption || null }));
    fetchStories();
  };

  const deleteStory = async (st) => {
    if (!CLOUD) return;
    if (st.path) await supabase.storage.from("stories").remove([st.path]);
    await supabase.from("stories").delete().eq("id", st.id);
    fetchStories();
  };

  const fetchFollows = async () => {
    if (!CLOUD) return;
    const { data, error } = await supabase.from("follows").select("*");
    if (error) console.error("fetchFollows failed:", error.message);
    if (data) setFollows(data.map((f) => ({ follower: f.follower_id, following: f.following_id })));
  };
  useEffect(() => {
    if (!CLOUD) return;
    fetchFollows();
    const ch = supabase.channel("follows-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, fetchFollows)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const toggleFollow = async (targetId) => {
    const me = realUserRef.current;
    if (!me || me === targetId) return;
    const already = follows.some((f) => f.follower === me && f.following === targetId);
    setFollows((F) => (already ? F.filter((f) => !(f.follower === me && f.following === targetId)) : [...F, { follower: me, following: targetId }]));
    if (!CLOUD) return;
    if (already) await dbWrite("follows.delete", supabase.from("follows").delete().eq("follower_id", me).eq("following_id", targetId));
    else await dbWrite("follows.insert", supabase.from("follows").insert({ follower_id: me, following_id: targetId }));
    fetchFollows();
  };

  const setAvailability = async (status, from, note) => {
    const me = realUserRef.current;
    if (!CLOUD || !me) return;
    await dbWrite("profiles.availability", supabase.from("profiles").update({
      availability: status,
      available_from: from || null,
      availability_note: note || null,
    }).eq("id", me));
    reloadMe();
  };

  const fetchDms = async () => {
    if (!CLOUD) return;
    const { data, error } = await supabase.from("direct_messages").select("*").order("created_at", { ascending: true });
    if (error) console.error("fetchDms failed:", error.message);
    if (data) setDms(data.map((r) => ({
      id: r.id, from: r.sender_id, to: r.recipient_id, body: r.body,
      sharedPostId: r.shared_post_id ?? null, photo: r.photo_url ?? null,
      lat: r.lat ?? null, lng: r.lng ?? null,
      accuracy: r.accuracy_m ?? null, altitude: r.altitude_m ?? null,
      ts: new Date(r.created_at).getTime(), read: r.read,
    })));
  };
  useEffect(() => {
    if (!CLOUD) return;
    fetchDms();
    const ch = supabase.channel("dm-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, fetchDms)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const sendDm = async (to, body, sharedPostId = null, extra = {}) => {
    const me = realUserRef.current;
    if (!me) { console.error("sendDm: no signed-in user"); return { ok: false, reason: "not signed in" }; }
    const tempId = uid();
    setDms((D) => [...D, { id: tempId, from: me, to, body, sharedPostId, photo: extra.photoDataUri || null, lat: extra.lat ?? null, lng: extra.lng ?? null, accuracy: extra.accuracy ?? null, altitude: extra.altitude ?? null, ts: Date.now(), read: false, sending: true }]);
    if (!CLOUD) return;
    let photoUrl = null;
    if (extra.photoDataUri) {
      try {
        const small = await shrinkImage(extra.photoDataUri, 1280, 0.82);
        const blob = dataUriToBlob(small);
        const path = `dm/${me}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("post-media").upload(path, blob, { contentType: "image/jpeg" });
        if (!upErr) photoUrl = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      } catch (e) { console.error("dm photo failed", e); }
    }
    const base = { sender_id: me, recipient_id: to, body };
    const full = { ...base };
    if (sharedPostId) full.shared_post_id = sharedPostId;
    if (photoUrl) full.photo_url = photoUrl;
    if (extra.lat != null) { full.lat = extra.lat; full.lng = extra.lng; }
    if (extra.accuracy != null) full.accuracy_m = extra.accuracy;
    if (extra.altitude != null) full.altitude_m = extra.altitude;

    let { error } = await supabase.from("direct_messages").insert(full);
    if (error) {
      console.error("sendDm insert failed:", error.message, full);
      // a missing column shouldn't stop the message — retry with text only
      const retry = await supabase.from("direct_messages").insert(base);
      if (retry.error) {
        console.error("sendDm retry failed:", retry.error.message);
        setDms((D) => D.filter((m) => m.id !== tempId));    // drop the optimistic bubble
        fetchDms();
        return { ok: false, reason: retry.error.message };
      }
      console.warn("sendDm: sent without extras — run the column migration");
    }
    fetchDms();
    return { ok: true };
  };
  const sharePostTo = async (recipients, post, note) => {
    for (const to of recipients) {
      await sendDm(to, note?.trim() || "Shared a post", post.id);
    }
  };
  const markRead = async (withId) => {
    const me = realUserRef.current;
    if (!CLOUD || !me) return;
    { const { error: _e } = await supabase.from("direct_messages").update({ read: true }).eq("sender_id", withId).eq("recipient_id", me).eq("read", false); if (_e) console.error("direct_messages.markRead failed:", _e.message); }
  };

  useEffect(() => {
    if (!CLOUD) return;
    loadProfiles();
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sn) => setSession(sn));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!CLOUD || !session) { setMyProfile(null); return; }
    let on = true;
    supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => { if (on) setMyProfile(data || false); });
    return () => { on = false; };
  }, [session, profileTick]);

  // Keep this device registered for closed-app push once signed in.
  useEffect(() => {
    if (!CLOUD || !session || !myProfile || typeof myProfile !== "object") return;
    ensurePushSubscription(session.user.id);
  }, [session, myProfile]);

  const realUser = CLOUD && !authBusy && session && myProfile && typeof myProfile === "object"
    ? { id: session.user.id, kind: myProfile.role, talentId: session.user.id, name: myProfile.full_name,
        initials: initialsOf(myProfile.full_name || "?"), licenseStatus: myProfile.license_status || "none",
        isAdmin: myProfile.role === "admin" }
    : null;
  const user = realUser || (DEMO_MODE ? ACCOUNTS.find((a) => a.id === accountId) : null) || null;
  realUserRef.current = user ? (user.talentId || user.id) : null;

  const fetchPosts = async () => {
    if (!CLOUD) return;
    const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (!error && data) setPosts(data.map(rowToPost));
  };

  useEffect(() => {
    if (!CLOUD) return;
    fetchPosts();
    const ch = supabase.channel("posts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, fetchPosts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const addPost = async ({ talentId, text, media, location }) => {
    if (!CLOUD) {
      setPosts((p) => [{ id: uid(), talentId, text, media: media || null, location: location || null, status: "pending", reason: null, createdAt: Date.now() }, ...p]);
      return;
    }
    // Guard: the signed-in identity must match the author. Switching accounts in
    // another tab swaps the shared session and would make the database reject the post.
    const { data: sessData } = await supabase.auth.getSession();
    const liveUid = sessData?.session?.user?.id || null;
    if (!liveUid) return { ok: false, reason: "auth" };
    if (liveUid !== talentId) {
      console.error("addPost: session/user mismatch", { liveUid, talentId });
      return { ok: false, reason: "session" };
    }
    let up = { media_url: null, media_kind: null };
    let slideUrls = [];
    if (media) {
      if (media.kind === "photo" && media.slides && media.slides.length > 1) {
        for (const slide of media.slides) {
          const r = await uploadPostMedia(talentId, { kind: "photo", dataUri: slide });
          if (r.media_url) slideUrls.push(r.media_url);
        }
        up = { media_url: slideUrls[0] || null, media_kind: "photo" };
        if (slideUrls.length < (media.slides || []).length) {
          console.error("addPost: only", slideUrls.length, "of", media.slides.length, "photos uploaded");
          return { ok: false, reason: "upload" };
        }
      } else {
        up = await uploadPostMedia(talentId, media);
        if (!up.media_url) {
          console.error("addPost: media upload failed");
          return { ok: false, reason: "upload" };
        }
      }
    }
    const { error: postErr } = await supabase.from("posts").insert({
      talent_id: talentId, body: text || null,
      media_url: up.media_url, media_kind: up.media_kind,
      media_slides: slideUrls.length > 1 ? slideUrls : null, media_ratio: media?.ratio || null,
      lat: location && isValidLatLng(location.lat, location.lng) ? location.lat : null,
      lng: location && isValidLatLng(location.lat, location.lng) ? location.lng : null,
      place: location && isValidLatLng(location.lat, location.lng) ? (location.place ?? null) : null,
      loc_desc: location?.description ?? null, loc_source: location?.source ?? null,
      loc_altitude: location?.altitude ?? null, loc_bearing: location?.bearing ?? null, loc_taken_on: location?.takenOn ?? null,
      loc_outside: (location && isValidLatLng(location.lat, location.lng)) ? (location.outside ?? false) : false,
    });
    if (postErr) { console.error("posts.insert failed:", postErr.message); return { ok: false, reason: "insert" }; }
    fetchPosts();
    return { ok: true };
  };
  const approve = async (id) => {
    if (!CLOUD) { setPosts((p) => p.map((x) => (x.id === id ? { ...x, status: "approved", reason: null } : x))); return; }
    auditLog(realUserRef.current, "post.approve", id);
    { const { error: _e } = await supabase.from("posts").update({ status: "approved", reject_reason: null }).eq("id", id); if (_e) console.error("posts.approve failed:", _e.message); }
    fetchPosts();
  };
  const reject = async (id, reason) => {
    if (!CLOUD) { setPosts((p) => p.map((x) => (x.id === id ? { ...x, status: "rejected", reason } : x))); return; }
    auditLog(realUserRef.current, "post.reject", id, reason);
    { const { error: _e } = await supabase.from("posts").update({ status: "rejected", reject_reason: reason }).eq("id", id); if (_e) console.error("posts.reject failed:", _e.message); }
    fetchPosts();
  };
  const fetchEngagement = async () => {
    if (!CLOUD) return;
    const [{ data: L }, { data: Cm }] = await Promise.all([
      supabase.from("post_likes").select("*"),
      supabase.from("post_comments").select("*").order("created_at", { ascending: true }),
    ]);
    if (L) setLikes(L.map((r) => ({ post_id: r.post_id, liker_id: r.liker_id })));
    if (Cm) setComments(Cm.map((r) => ({ id: r.id, post_id: r.post_id, author_id: r.author_id, body: r.body, ts: new Date(r.created_at).getTime() })));
  };

  useEffect(() => {
    if (!CLOUD) return;
    fetchEngagement();
    const ch = supabase.channel("engagement-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, fetchEngagement)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, fetchEngagement)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggleLike = async (postId, me) => {
    const mine = likes.some((l) => l.post_id === postId && l.liker_id === me);
    setLikes((L) => (mine ? L.filter((l) => !(l.post_id === postId && l.liker_id === me)) : [...L, { post_id: postId, liker_id: me }]));
    if (!CLOUD) return;
    const { error: likeErr } = mine
      ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("liker_id", me)
      : await supabase.from("post_likes").insert({ post_id: postId, liker_id: me });
    if (likeErr) console.error("post_likes failed:", likeErr.message);
    fetchEngagement();
  };
  const addComment = async (postId, me, body) => {
    setComments((Cm) => [...Cm, { id: uid(), post_id: postId, author_id: me, body, ts: Date.now() }]);
    if (!CLOUD) return;
    { const { error: _e } = await supabase.from("post_comments").insert({ post_id: postId, author_id: me, body }); if (_e) console.error("post_comments.insert failed:", _e.message); }
    fetchEngagement();
  };
  const deleteComment = async (id) => {
    setComments((Cm) => Cm.filter((c) => c.id !== id));
    if (!CLOUD) return;
    { const { error: _e } = await supabase.from("post_comments").delete().eq("id", id); if (_e) console.error("post_comments.delete failed:", _e.message); }
  };
  const deletePost = async (id) => {
    auditLog(realUserRef.current, "post.delete", id);
    setPosts((P) => P.filter((p) => p.id !== id));
    setLikes((L) => L.filter((l) => l.post_id !== id));
    setComments((Cm) => Cm.filter((c) => c.post_id !== id));
    if (!CLOUD) return;
    { const { error: _e } = await supabase.from("posts").delete().eq("id", id); if (_e) console.error("posts.delete failed:", _e.message); }
    fetchPosts();
  };

  /* ---- Jobs in the database (listings + applicants + direct requests) ---- */
  const rowToListing = (l, apps) => ({
    id: l.id, operatorId: l.operator_id, operator: l.operator_name, title: l.title, role: l.role,
    start: l.start_date, end: l.end_date, languages: l.languages || [], notes: l.notes || "",
    urgent: !!l.urgent, status: l.status, createdAt: new Date(l.created_at).getTime(),
    applicants: (apps || []).filter((a) => a.listing_id === l.id).map((a) => {
      const t = talentById(a.talent_id);
      return { talentId: a.talent_id, name: t?.name || "Member", initials: t?.initials || "?", rating: t?.rating || null,
        message: a.message || "", status: a.status, appliedAt: new Date(a.created_at).getTime() };
    }),
  });
  const rowToRequest = (j) => ({
    id: j.id, operatorId: j.operator_id, operator: j.operator_name, toTalentId: j.talent_id,
    title: j.title, role: j.role_needed, start: j.start_date, end: j.end_date,
    languages: j.languages || [], notes: j.notes || "", status: j.status, createdAt: new Date(j.created_at).getTime(),
  });

  const fetchJobs = async () => {
    if (!CLOUD) return;
    const [{ data: L }, { data: A }, { data: R }] = await Promise.all([
      supabase.from("job_listings").select("*").order("created_at", { ascending: false }),
      supabase.from("job_applicants").select("*"),
      supabase.from("job_requests").select("*").order("created_at", { ascending: false }),
    ]);
    if (L) setListings(L.map((l) => rowToListing(l, A || [])));
    if (R) setJobs(R.map(rowToRequest));
  };
  useEffect(() => {
    if (!CLOUD) return;
    fetchJobs();
    const ch = supabase.channel("jobs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_listings" }, fetchJobs)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_applicants" }, fetchJobs)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_requests" }, fetchJobs)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dirTick]);

  const sendJob = async (job) => {
    if (!CLOUD) { setJobs((j) => [{ id: uid(), status: "pending", createdAt: Date.now(), ...job }, ...j]); return; }
    const { error: jrErr } = await supabase.from("job_requests").insert({
      operator_id: realUserRef.current, operator_name: job.operator, talent_id: job.toTalentId,
      title: job.title, role_needed: job.role, start_date: job.start, end_date: job.end,
      languages: job.languages || [], notes: job.notes || null,
    });
    if (jrErr) console.error("job_requests.insert failed:", jrErr.message);
    fetchJobs();
  };

  /* ---- Trips in the database ---- */
  const fetchTrips = async () => {
    if (!CLOUD) return;
    const [{ data: T, error: tErr }, { data: M }, { data: MS }, { data: IT }] = await Promise.all([
      supabase.from("trips").select("*").order("start_date", { ascending: true }),
      supabase.from("trip_members").select("*"),
      supabase.from("trip_messages").select("*").order("created_at", { ascending: true }),
      supabase.from("trip_itinerary").select("*").order("day_no", { ascending: true }),
    ]);
    if (tErr) console.error("fetchTrips failed:", tErr.message);
    if (!T) return;
    setTrips(T.map((tr) => ({
      id: tr.id, operatorId: tr.operator_id, operator: tr.operator_name, title: tr.title,
      start: tr.start_date, end: tr.end_date, meetingPoint: tr.meeting_point || "To be set by operator",
      meetingSet: !!tr.meeting_point, meetingLat: tr.meeting_lat ?? null, meetingLng: tr.meeting_lng ?? null, meetingNote: tr.meeting_note || "",
      members: (M || []).filter((m) => m.trip_id === tr.id).map((m) => {
        const p = talentById(m.user_id);
        return { id: m.user_id, name: p?.name || m.display_name || "Member", initials: p?.initials || initialsOf(m.display_name || "?"), roleInTrip: m.role_in_trip };
      }),
      itinerary: (IT || []).filter((i) => i.trip_id === tr.id).map((i) => ({ day: i.day_no, title: i.title })),
      chat: {
        state: tr.chat_state || "active",
        messages: (MS || []).filter((m) => m.trip_id === tr.id).map((m) => ({
          id: m.id, senderId: m.sender_id, kind: m.kind, body: m.body,
          photo: m.photo_url || null, ts: new Date(m.created_at).getTime(),
        })),
      },
      createdAt: new Date(tr.created_at).getTime(),
    })));
  };
  useEffect(() => {
    if (!CLOUD) return;
    fetchTrips();
    const ch = supabase.channel("trips-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, fetchTrips)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_members" }, fetchTrips)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_messages" }, fetchTrips)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_itinerary" }, fetchTrips)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dirTick]);

  const createTripCloud = async (job) => {
    const opId = job.operatorId || realUserRef.current;
    const t = talentById(job.toTalentId);
    // one trip per operator + date range: join the existing one if it's there
    const { data: found, error: findErr } = await supabase.from("trips").select("id")
      .eq("operator_id", opId).eq("start_date", job.start).eq("end_date", job.end).maybeSingle();
    if (findErr) console.error("trips.find failed:", findErr.message);
    let tripId = found?.id;
    if (!tripId) {
      const scheduled = new Date(job.start + "T00:00").getTime() - 3 * 86400e3 > Date.now();
      const { data: created, error } = await supabase.from("trips").insert({
        operator_id: opId, operator_name: job.operator, title: job.title,
        start_date: job.start, end_date: job.end, chat_state: scheduled ? "scheduled" : "active",
      }).select("id").single();
      if (error || !created) return;
      tripId = created.id;
      await supabase.from("trip_members").insert({ trip_id: tripId, user_id: opId, display_name: job.operator, role_in_trip: "operator" });
      { const { error: _e } = await supabase.from("trip_messages").insert({ trip_id: tripId, sender_id: null, kind: "system", body: "Trip created from a confirmed booking." }); if (_e) console.error("trip_messages.system failed:", _e.message); }
    }
    const { error: tmErr } = await supabase.from("trip_members").upsert({
      trip_id: tripId, user_id: job.toTalentId, display_name: t?.name || "Member", role_in_trip: t?.role || "guide",
    });
    if (tmErr) console.error("trip_members.upsert failed:", tmErr.message);
    { const { error: _e } = await supabase.from("trip_messages").insert({ trip_id: tripId, sender_id: null, kind: "system", body: `${t?.name || "A crew member"} joined the trip.` }); if (_e) console.error("trip_messages.join failed:", _e.message); }
    fetchTrips();
  };

  const createTripFromJob = (job) => {
    if (CLOUD) { createTripCloud(job); return; }
    const t = talentById(job.toTalentId);
    const talentMember = { id: job.toTalentId, name: t.name, initials: t.initials, roleInTrip: t.role };
    setTrips((prev) => {
      const existing = prev.find((tr) => tr.operator === job.operator && tr.start === job.start && tr.end === job.end);
      if (existing) {
        if ((existing.members || []).some((m) => m.id === job.toTalentId)) return prev;
        return prev.map((tr) => tr.id === existing.id
          ? { ...tr, members: [...tr.members, talentMember], chat: { ...tr.chat, messages: [...tr.chat.messages, sysMsg(`${t.name} joined the trip.`)] } }
          : tr);
      }
      const scheduled = new Date(job.start + "T00:00").getTime() - 3 * 86400e3 > Date.now();
      return [{
        id: uid(), jobId: job.id, operator: job.operator, title: job.title,
        start: job.start, end: job.end, meetingPoint: "To be set by operator",
        members: [{ id: job.operatorId || "operator", name: job.operator, initials: initialsOf(job.operator), roleInTrip: "operator" }, talentMember],
        itinerary: [],
        chat: {
          state: scheduled ? "scheduled" : "active",
          messages: [sysMsg("Trip created from an accepted job request."), sysMsg(scheduled ? "The group chat opens 3 days before departure." : "The group chat is live — say hello!")],
        },
        createdAt: Date.now(),
      }, ...prev];
    });
  };

  const setJobStatus = async (id, status) => {
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, status } : x)));
    const job = jobs.find((x) => x.id === id);
    if (CLOUD) { const { error: jsErr } = await supabase.from("job_requests").update({ status }).eq("id", id); if (jsErr) console.error("job_requests.status failed:", jsErr.message); fetchJobs(); }
    if (status === "accepted" && job) createTripFromJob(job);
  };

  const postChat = async (tripId, msg) => {
    setTrips((prev) => prev.map((tr) => (tr.id === tripId ? { ...tr, chat: { ...tr.chat, messages: [...tr.chat.messages, msg] } } : tr)));
    if (!CLOUD) return;
    let photoUrl = null;
    if (msg.kind === "photo" && msg.photo) {
      try {
        const small = await shrinkImage(msg.photo, 1280, 0.82);
        const blob = dataUriToBlob(small);
        const path = `${tripId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error } = await supabase.storage.from("post-media").upload(path, blob, { contentType: "image/jpeg" });
        if (!error) photoUrl = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      } catch (e) {}
    }
    await dbWrite("trip_messages.insert", supabase.from("trip_messages").insert({
      trip_id: tripId, sender_id: msg.senderId, kind: msg.kind,
      body: msg.kind === "text" ? msg.body : null, photo_url: photoUrl,
    }));
    fetchTrips();
  };
  const openChat = async (tripId) => {
    setTrips((prev) => prev.map((tr) => (tr.id === tripId ? { ...tr, chat: { ...tr.chat, state: "active" } } : tr)));
    if (!CLOUD) return;
    await supabase.from("trips").update({ chat_state: "active" }).eq("id", tripId);
    fetchTrips();
  };

  const postListing = async (l) => {
    if (!CLOUD) { setListings((L) => [{ id: uid(), status: "open", createdAt: Date.now(), applicants: [], ...l }, ...L]); return; }
    const { error: jlErr } = await supabase.from("job_listings").insert({
      operator_id: realUserRef.current, operator_name: l.operator, title: l.title, role: l.role,
      start_date: l.start, end_date: l.end, languages: l.languages || [], notes: l.notes || null, urgent: !!l.urgent,
    });
    if (jlErr) console.error("job_listings.insert failed:", jlErr.message);
    fetchJobs();
  };
  const applyToListing = async (listingId, applicant) => {
    if (!CLOUD) {
      setListings((L) => L.map((l) => (l.id === listingId ? ((l.applicants || []).some((a) => a.talentId === applicant.talentId) ? l : { ...l, applicants: [...l.applicants, { status: "applied", appliedAt: Date.now(), ...applicant }] }) : l)));
      return;
    }
    const { error: jaErr } = await supabase.from("job_applicants").upsert({ listing_id: listingId, talent_id: applicant.talentId, message: applicant.message || null, status: "applied" });
    if (jaErr) console.error("job_applicants.upsert failed:", jaErr.message);
    fetchJobs();
  };
  const setApplicant = async (listingId, talentId, status) => {
    setListings((L) => L.map((l) => (l.id === listingId ? { ...l, applicants: (l.applicants || []).map((a) => (a.talentId === talentId ? { ...a, status } : a)) } : l)));
    if (!CLOUD) return;
    { const { error: _e } = await supabase.from("job_applicants").update({ status }).eq("listing_id", listingId).eq("talent_id", talentId); if (_e) console.error("job_applicants.status failed:", _e.message); }
    fetchJobs();
  };
  const hireApplicant = async (listing, applicant) => {
    await setApplicant(listing.id, applicant.talentId, "hired");
    // A guide+driver listing stays open until one of each is hired.
    const hiredRoles = new Set(
      (listing.applicants || [])
        .filter((a) => a.status === "hired" || a.talentId === applicant.talentId)
        .map((a) => talentById(a.talentId)?.role)
    );
    const filled = listing.role === "both" ? (hiredRoles.has("guide") && hiredRoles.has("driver")) : true;
    if (filled) {
      setListings((L) => L.map((l) => (l.id === listing.id ? { ...l, status: "filled" } : l)));
      if (CLOUD) { const { error: jfErr } = await supabase.from("job_listings").update({ status: "filled" }).eq("id", listing.id); if (jfErr) console.error("job_listings.filled failed:", jfErr.message); }
    }
    if (CLOUD) fetchJobs();
    createTripFromJob({ id: `${listing.id}_${applicant.talentId}`, toTalentId: applicant.talentId, operator: listing.operator, title: listing.title, start: listing.start, end: listing.end });
  };

  if (reviewToken) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen w-full flex justify-center" style={{ background: C.bg }}>
          <div className="w-full max-w-[430px] flex flex-col" style={{ minHeight: "100dvh", background: C.bg }}>
            <GuestReview token={reviewToken} />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full flex justify-center" style={{ background: C.bg }}>
      <style>{`
        *{ font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        html, body { overscroll-behavior-y: none; }
        :root { --sa-top: env(safe-area-inset-top, 0px); --sa-bottom: env(safe-area-inset-bottom, 0px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
        .safe-top { padding-top: env(safe-area-inset-top, 0px); }
        input, textarea, select { font-size: 16px; }   /* stops iOS zooming on focus */
        .hidescroll { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
        img, video { -webkit-user-drag: none; }
        button, a { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
        .tap{ transition: transform .12s ease, background .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .tap:active{ transform: scale(.985); }
        .hidescroll::-webkit-scrollbar{ display:none; }
        @media (prefers-reduced-motion: no-preference){ .fade{ animation: fade .28s ease both; } .dropin{ animation: dropin .26s ease both; } }
        @keyframes fade{ from{ opacity:0; transform: translateY(4px);} }
        @keyframes dropin{ from{ opacity:0; transform: translateY(-28px);} }
        .fade{ animation-duration:.2s; }
        textarea:focus, input:focus{ outline:none; border-color:${C.pine}!important; box-shadow:0 0 0 3px ${C.pine}1f; }
        textarea::placeholder, input::placeholder{ color:${C.muted}; opacity:.7; }
      `}</style>

      <div className="w-full max-w-md flex flex-col" style={{ height: "100dvh", color: C.ink }}>
        {!user ? (
          <Login onPick={setAccountId} session={session} myProfile={myProfile} onAuthed={reloadMe} onBusy={setAuthBusy} />
        ) : (
          <Shell key={user.id} user={user} posts={posts} jobs={jobs} trips={trips} listings={listings} dirTick={dirTick}
            actions={{ addPost, approve, reject, deletePost, reloadDirectory: loadProfiles, fetchTrips, setAvailability, toggleFollow, sendJob, setJobStatus, postChat, openChat, postListing, applyToListing, setApplicant, hireApplicant }} engagement={{ likes, comments, toggleLike, addComment, deleteComment, follows, toggleFollow, stories, addStory, deleteStory }} dm={{ dms, sendDm, markRead, sharePostTo }} onLogout={async () => { if (session) { await Promise.race([removePushSubscription(), new Promise((res) => setTimeout(res, 1500))]); supabase.auth.signOut(); } setAccountId(null); }} />
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}

/* ================================ Welcome ================================= */
function Login({ onPick, session, myProfile, onAuthed, onBusy }) {
  const [authView, setAuthView] = useState(null);
  useEffect(() => { onBusy && onBusy(!!authView); return () => onBusy && onBusy(false); }, [authView]);
  if (authView) {
    return (
      <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
        <Onboard mode={authView} session={session}
          onBack={() => { setAuthView(null); onBusy && onBusy(false); }}
          onDone={() => { onBusy && onBusy(false); setAuthView(null); onAuthed(); }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
      {/* brand */}
      <div className="px-6 pt-3">
        <div className="rounded-lg px-2.5 py-1 inline-block text-[10px] font-bold tracking-[.1em]"
          style={{ background: C.pineSoft, color: C.pine }}>{BUILD}</div>
      </div>

      <div className="px-6 pt-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.pine, boxShadow: `0 6px 14px ${C.pine}33` }}>
          <Compass size={20} color={C.goldSoft} strokeWidth={1.9} />
        </div>
        <div>
          <div className="text-[17px] font-semibold tracking-[-0.01em] leading-none" style={{ color: C.ink }}>Bhutan Tourism Hub</div>
          <div className="text-[10px] font-semibold tracking-[.14em] uppercase mt-1" style={{ color: C.gold }}>Guides · Drivers · Operators</div>
        </div>
      </div>

      {/* prototype badge */}
      <div className="px-6 mt-4">
        <div className="inline-flex items-center gap-2 rounded-full pl-2.5 pr-3 py-1.5" style={{ background: C.goldSoft }}>
          <span className="w-2 h-2 rounded-full" style={{ background: C.gold }} />
          <span className="text-[11.5px] font-bold tracking-[.08em] uppercase" style={{ color: "#7a5a1e" }}>Early access · Prototype</span>
        </div>
      </div>

      {/* hero */}
      <div className="px-6 mt-4">
        <h1 className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em]" style={{ color: C.ink }}>
          Be one of the first<br />guides on the hub.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
          We're building Bhutan's verified marketplace for licensed guides and drivers — where
          tour operators find you by your <b style={{ color: C.ink }}>skills</b>, not by who they
          already know.
        </p>
      </div>

      {/* map — its own block, whole image visible, fixed gap below */}
      <div className="px-6" style={{ marginTop: 28, marginBottom: 32 }}>
        <div className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: "16 / 9", background: C.card, border: `1px solid ${C.lineSoft}` }}>
          <img src={mapImg} alt="Relief map of Bhutan"
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
        </div>
      </div>

      {/* actions — separate block, never overlapped */}
      <div className="px-6">
        <button onClick={() => setAuthView("signup")}
          className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16.5px] font-semibold"
          style={{ height: 56, background: C.pine, color: "#fff", boxShadow: `0 10px 24px ${C.pine}40` }}>
          Join the hub <ArrowRight size={19} strokeWidth={2.4} />
        </button>

        <button onClick={() => setAuthView("signin")}
          className="tap w-full rounded-2xl text-[15px] font-semibold mt-3"
          style={{ height: 52, background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}>
          I already have an account
        </button>

        <p className="text-center text-[12.5px] mt-4" style={{ color: C.muted }}>
          Free for licensed guides, drivers and tour operators.
        </p>
      </div>

      {/* onboarding in batches — honest framing */}
      <div className="px-6 mt-6">
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}>
              <Clock size={17} color={C.gold} />
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: C.ink }}>We're onboarding in small batches</div>
              <p className="text-[13px] leading-snug mt-1" style={{ color: C.muted }}>
                Only <b style={{ color: C.ink }}>30 verification codes</b> are sent each hour while we
                grow carefully. If your code doesn't arrive, wait an hour and try again — your place
                isn't lost. The earlier you build your profile, the more jobs you'll be matched to.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* what you get */}
      <div className="px-6 mt-7">
        <div className="text-[11.5px] font-semibold tracking-[.14em] uppercase mb-3.5" style={{ color: C.gold }}>What you get</div>
        <div className="space-y-4">
          <WelcomeBullet Icon={BadgeCheck} title="Verified, not just listed"
            body="Every licence is checked before anyone can be booked. Operators know exactly who they're hiring." />
          <WelcomeBullet Icon={Award} title="A profile that proves your skill"
            body="Culture and dzong, alpine trekking, birding, spiritual routes — plus languages and years of experience." />
          <WelcomeBullet Icon={Star} title="A trip record you own"
            body="Reliability, punctuality and awareness, graded by operators after every trip. It follows you through your career." />
          <WelcomeBullet Icon={MapPin} title="Proof of where you've worked"
            body="Photos pinned to the exact spot in Bhutan. Your portfolio, not a line on a list." />
          <WelcomeBullet Icon={Briefcase} title="Work that finds you"
            body="Operators post jobs and you apply — including short-notice work when someone drops out." />
        </div>
      </div>

      {/* honest about the stage */}
      <div className="px-6 mt-7 pb-16">
        <div className="rounded-2xl p-4" style={{ background: C.pineSoft }}>
          <div className="text-[13.5px] font-semibold mb-1.5" style={{ color: C.pine }}>Built in Bhutan, for Bhutan</div>
          <p className="text-[12.5px] leading-snug" style={{ color: C.pine, opacity: .9 }}>
            This is an early version, and it will grow with the people who use it. We're working
            towards recognition with the Department of Tourism and the Guides Association so that a
            profile here becomes a trusted mark of a licensed professional. Tell us what you need —
            we'll build it.
          </p>
        </div>
        <p className="text-center text-[10px] mt-4" style={{ color: C.line }}>{BUILD}</p>
      </div>
    </div>
  );
}

function WelcomeBullet({ Icon, title, body }) {
  return (
    <div className="flex gap-3.5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.goldSoft }}>
        <Icon size={17} color={C.gold} strokeWidth={2} />
      </div>
      <div>
        <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{title}</div>
        <div className="text-[13px] leading-snug" style={{ color: C.muted }}>{body}</div>
      </div>
    </div>
  );
}

/* ================================= Shell ================================== */
const NAV = {
  guide: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "trips", label: "Trips", Icon: Briefcase }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  driver: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "trips", label: "Trips", Icon: Briefcase }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  operator: [{ id: "discover", label: "Discover", Icon: Search }, { id: "trips", label: "Trips", Icon: Briefcase }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "post", label: "Feed", Icon: Newspaper }, { id: "profile", label: "Profile", Icon: User }],
  business: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "bookings", label: "Bookings", Icon: CalendarDays }, { id: "discover", label: "Discover", Icon: Search }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  admin: [{ id: "review", label: "Review", Icon: ShieldCheck }, { id: "users", label: "Users", Icon: Users }, { id: "feed", label: "Feed", Icon: Newspaper }, { id: "discover", label: "Discover", Icon: Search }, { id: "chats", label: "Messages", Icon: MessageSquare }],
};
const DEFAULT_TAB = { guide: "post", driver: "post", operator: "discover", business: "post", admin: "review" };

function Shell({ user, posts, jobs, trips, listings, actions, engagement, dm, dirTick, onLogout }) {
  const [tab, setTab] = useState(DEFAULT_TAB[user.kind]);
  const [overlay, setOverlay] = useState(null); // {type:'profile'|'request', talentId}
  const [dmWith, setDmWith] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [bkRows] = useBookings("business_id", user.kind === "business" ? user.talentId : null);
  const pendingBookings = user.kind === "business" ? bkRows.filter((b) => b.status === "requested").length : 0;
  const lastAlertCount = useRef(0);
  const [notifyOn, setNotifyOn] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const [installSheet, setInstallSheet] = useState(false);
  const [firstRun, setFirstRun] = useState(() => {
    try { return CLOUD && !localStorage.getItem("bth_seen_intro_" + (user.talentId || user.id)); } catch (e) { return false; }
  });
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallEvent(e); };
    const onInstalled = () => { setInstalled(true); setInstallSheet(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // nudge once, a little after they've settled in
    const t = setTimeout(() => {
      const dismissedAt = Number(localStorage.getItem("bth_install_dismissed") || 0);
      if (!isStandalone() && Date.now() - dismissedAt > 7 * 86400000) setInstallSheet(true);
    }, 45000);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); clearTimeout(t); };
  }, []);

  const nav = NAV[user.kind];
  const actorId = user.talentId || user.id;
  const eng = { ...engagement, me: actorId, isAdmin: user.kind === "admin", sharePostTo: dm?.sharePostTo };

  const alertItems = useMemo(() => {
    try {
    const out = [];
    const seen = new Set();
    const add = (o) => { if (!seen.has(o.id)) { seen.add(o.id); out.push(o); } };

    // messages sent to me
    (dm?.dms || []).filter((m) => m.to === actorId && !m.read).forEach((m) =>
      add({ id: `dm-${m.id}`, kind: m.sharedPostId ? "share" : "message", who: m.from, text: m.body, ts: m.ts }));

    // likes and comments on my posts
    (engagement?.likes || []).forEach((l) => {
      const p = (posts || []).find((x) => x && x.id === l.post_id && x.talentId === actorId);
      if (p && l.liker_id !== actorId) add({ id: `like-${l.post_id}-${l.liker_id}`, kind: "like", who: l.liker_id, text: p.text || "your post", ts: p.createdAt });
    });
    (engagement?.comments || []).forEach((c) => {
      const p = (posts || []).find((x) => x && x.id === c.post_id && x.talentId === actorId);
      if (p && c.author_id !== actorId) add({ id: `cm-${c.id}`, kind: "comment", who: c.author_id, text: c.body, ts: c.ts });
    });

    // new followers
    (engagement?.follows || []).filter((f) => f.following === actorId).forEach((f) =>
      add({ id: `fl-${f.follower}`, kind: "follow", who: f.follower, text: "", ts: Date.now() }));

    // direct job requests to me
    (jobs || []).filter((j) => j && j.toTalentId === actorId && j.status === "pending").forEach((j) =>
      add({ id: `job-${j.id}`, kind: "job", who: j.operatorId, text: j.title, ts: j.createdAt }));

    // open listings matching my role (guides see guide jobs, drivers see driver jobs)
    if (user.kind === "guide" || user.kind === "driver") {
      (listings || []).filter((l) => l && l.status === "open" && (l.role === user.kind || l.role === "both") &&
        !(l.applicants || []).some((a) => a && a.talentId === actorId)).forEach((l) =>
        add({ id: `lst-${l.id}`, kind: "listing", who: l.operatorId, text: l.title, ts: l.createdAt, urgent: l.urgent }));
    }

    // applicants on my listings (operators)
    if (user.kind === "operator") {
      (listings || []).filter((l) => l && (l.operatorId ? l.operatorId === actorId : l.operator === user.name))
        .forEach((l) => (l.applicants || []).filter((a) => a && a.status === "applied").forEach((a) =>
          add({ id: `app-${l.id}-${a.talentId}`, kind: "applicant", who: a.talentId, text: l.title, ts: a.appliedAt })));
    }

    // new people joining the platform (last 7 days)
    const weekAgo = Date.now() - 7 * 86400e3;
    Object.values(PROFILE_DIR).forEach((p) => {
      if (p.id !== actorId && p.joinedAt && p.joinedAt > weekAgo)
        add({ id: `new-${p.id}`, kind: "joined", who: p.id, text: roleLabel(p.role), ts: p.joinedAt });
    });

    return out.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 50);
    } catch (e) { console.error('alertItems failed:', e); return []; }
  }, [dm?.dms, engagement?.likes, engagement?.comments, engagement?.follows, jobs, listings, posts, actorId, dirTick]);

  // notify the device when something new arrives
  useEffect(() => {
    const n = alertItems.length;
    if (n > lastAlertCount.current && lastAlertCount.current > 0) {
      const latest = alertItems[0];
      const who = talentById(latest.who)?.name || "Someone";
      const verbs = { message: "sent you a message", share: "shared a post", like: "liked your post",
        comment: "commented on your post", follow: "started following you", job: "sent a job request",
        listing: "posted a job you can apply for", applicant: "applied to your job", joined: "joined the hub" };
      showDeviceNotification("Bhutan Tourism Hub", `${who} ${verbs[latest.kind] || "sent you an update"}`, latest.id);
    }
    lastAlertCount.current = n;
  }, [alertItems.length]);
  const myFollowing = (engagement?.follows || []).filter((f) => f.follower === actorId).map((f) => f.following);
  const unreadDm = (dm?.dms || []).filter((m) => m.to === actorId && !m.read).length;

  const pendingModCount = posts.filter((p) => p.status === "pending").length;
  const myTalent = user.talentId ? talentById(user.talentId) : null;
  const myJobsPending = myTalent ? jobs.filter((j) => j.toTalentId === myTalent.id && j.status === "pending").length : 0;
  const availableListings = myTalent ? listings.filter((l) => l.status === "open" && (l.role === user.kind || l.role === "both") && !(l.applicants || []).some((a) => a.talentId === myTalent.id)).length : 0;
  const jobsBadge = myJobsPending + availableListings;

  const openProfile = (talentId) => setOverlay({ type: "profile", talentId });
  const openRequest = (talentId) => setOverlay({ type: "request", talentId });

  return (
    <>
      <PortalBar user={user} />
      <TopBar user={user} onLogout={onLogout} alerts={alertItems.length} onOpenAlerts={() => setAlertsOpen(true)}
        onSearch={(term) => { setOverlay(null); setTab(["operator", "business"].includes(user.kind) ? "discover" : "post"); setSearchTerm(term); }} />

      <div className="flex-1 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        <VerifyBanner user={user} />
        {overlay ? (
          overlay.type === "profile" ? (
            <TalentProfile talent={talentById(overlay.talentId)} posts={posts} eng={eng}
              onOpenProfile={openProfile}
              onMessage={(id) => { setOverlay(null); setTab("chats"); setDmWith(id); }}
              onProfileSaved={actions.reloadDirectory}
              canRequest={user.kind === "operator" && ["guide", "driver"].includes(talentById(overlay.talentId)?.role)} viewer={user} self={user.talentId === overlay.talentId} contactOnly={["operator", "admin"].includes(user.kind)}
              onRequest={() => setOverlay({ type: "request", talentId: overlay.talentId })}
              onBack={() => setOverlay(null)} />
          ) : (
            <RequestForm talent={talentById(overlay.talentId)} operator={user.name}
              onBack={() => setOverlay({ type: "profile", talentId: overlay.talentId })}
              onSend={(job) => { actions.sendJob(job); setOverlay(null); setTab("requests"); }} />
          )
        ) : (
          <div key={tab} className="fade">
            {tab === "post" && <PostTab user={user} posts={posts} onAdd={actions.addPost} eng={eng} onOpenProfile={openProfile} />}
            {["trips", "jobs", "requests"].includes(tab) && (
              <WorkHub user={user} jobs={jobs} listings={listings} posts={posts} trips={trips} actions={actions} eng={eng}
                onOpenProfile={openProfile} onMessage={(id) => { setTab("chats"); setDmWith(id); }}
                initialDial={tab === "trips" ? "trips" : "hiring"} />
            )}
            {tab === "chats" && <ChatsTab user={user} me={actorId} dm={dm} trips={trips} actions={actions} posts={posts} dirTick={dirTick} onOpenPost={setSharedPost} openWith={dmWith} onOpened={() => setDmWith(null)} onOpenProfile={openProfile} />}
            {tab === "profile" && (user.kind === "operator"
              ? <OperatorDesk user={user} trips={trips} listings={listings} jobs={jobs} actions={actions} onOpenProfile={openProfile} onNavigate={setTab} />
              : <TalentProfile talent={talentById(user.talentId)} posts={posts} eng={eng} self onSetAvailability={actions.setAvailability} onOpenProfile={openProfile} onProfileSaved={actions.reloadDirectory} onBack={null} />)}
            {tab === "discover" && <Discover onOpen={openProfile} initialQuery={searchTerm} dirTick={dirTick} viewerKind={user.kind} />}
            {tab === "bookings" && <BusinessBookings user={user} />}
            {tab === "feed" && <Feed posts={posts} eng={eng} admin={user.kind === "admin"} onDelete={actions.deletePost} onOpenProfile={openProfile} following={myFollowing} />}
            {tab === "review" && <Review posts={posts} onApprove={actions.approve} onReject={actions.reject} eng={eng} />}
            {tab === "users" && <AdminUsers onChanged={actions.reloadDirectory} currentAdminId={actorId} />}
          </div>
        )}
      </div>

      {sharedPost && (
        <PostDetail items={[sharedPost]} index={0} author={talentById(sharedPost.talentId)} eng={eng} onClose={() => setSharedPost(null)} />
      )}

      {firstRun && (
        <Tutorial user={user} nav={nav} setTab={setTab}
          onDone={() => {
            setFirstRun(false);
            try { localStorage.setItem("bth_seen_intro_" + (user.talentId || user.id), "1"); } catch (e) {}
          }} />
      )}

      {installSheet && !installed && (
        <InstallSheet installEvent={installEvent}
          onClose={() => { setInstallSheet(false); try { localStorage.setItem("bth_install_dismissed", String(Date.now())); } catch (e) {} }} />
      )}

      {alertsOpen && (
        <AlertsSheet items={alertItems} onClose={() => setAlertsOpen(false)}
          notifyOn={notifyOn}
          onEnableNotify={async () => { if (typeof Notification !== "undefined" && Notification.permission === "denied") { window.alert("Notifications are blocked for this app. To turn them on: open your phone Settings, find Bhutan Tourism Hub under Apps, and allow Notifications."); return; } const r = await askNotificationPermission(); setNotifyOn(r === "granted"); if (r === "granted") { ensurePushSubscription(actorId); } else if (r === "denied") { window.alert("Notifications were declined. You can turn them on anytime from your phone Settings under Apps."); } }}
          installed={installed}
          onInstall={() => { setAlertsOpen(false); setInstallSheet(true); }}
          onOpenProfile={(id) => { setAlertsOpen(false); openProfile(id); }}
          onOpenMessages={() => { setAlertsOpen(false); setTab("chats"); }}
          onOpenJobs={() => { setAlertsOpen(false); setTab(user.kind === "operator" ? "requests" : "jobs"); }} />
      )}

      <BottomNav nav={nav} tab={tab}
        setTab={(t) => { setOverlay(null); setSharedPost(null); setTab(t); }}
        badges={{ jobs: jobsBadge, review: pendingModCount, chats: unreadDm, bookings: pendingBookings }} />
    </>
  );
}

function PortalBar({ user }) {
  const names = { guide: "Guide Portal", driver: "Driver Portal", operator: "Operator Portal", business: "Business Portal", admin: "Admin Portal" };
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = String(user.name || "").split(" ")[0] || "there";
  return (
    <div className="shrink-0 flex items-center justify-between px-3.5" style={{ height: "calc(32px + var(--sa-top))", paddingTop: "var(--sa-top)", background: `linear-gradient(90deg, ${C.pine} 0%, #2E5741 100%)` }}>
      <span className="text-[10px] font-bold tracking-[.16em] uppercase" style={{ color: C.goldSoft }}>{names[user.kind] || "Portal"}</span>
      <span className="text-[11.5px] font-medium" style={{ color: "rgba(255,255,255,.92)" }}>{greet}, {first}</span>
    </div>
  );
}

function TopBar({ user, onLogout, onSearch, alerts, onOpenAlerts }) {
  const [q, setQ] = useState("");
  const submit = () => { const t = q.trim(); if (t && onSearch) onSearch(t); };

  return (
    <div className="shrink-0 flex items-center gap-2 px-2.5" style={{ height: 56, background: C.bg, borderBottom: `1px solid ${C.lineSoft}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}>
        <Compass size={16} color={C.goldSoft} />
      </div>

      <div className="relative flex-1 min-w-0">
        <Search size={15} color={C.muted} className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Search people or add friends"
          className="w-full h-9 pl-9 pr-3 rounded-full text-[13.5px]"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
      </div>

      <button onClick={onOpenAlerts} className="tap relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Notifications">
        <Bell size={16} color={C.ink} />
        {alerts > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[9.5px] font-bold text-white"
            style={{ background: C.maroon }}>{alerts > 9 ? "9+" : alerts}</span>
        )}
      </button>

      <button onClick={onLogout} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Sign out">
        <LogOut size={15} color={C.muted} />
      </button>
    </div>
  );
}

function BottomNav({ nav, tab, setTab, badges }) {
  return (
    <div className="shrink-0 flex safe-bottom" style={{ background: C.card, borderTop: `1px solid ${C.line}`, position: "relative", zIndex: 240 }}>
      {nav.map((n) => {
        const on = tab === n.id;
        const badge = badges[n.id] || 0;
        return (
          <button key={n.id} onClick={() => setTab(n.id)} className="tap flex-1 py-2.5 flex flex-col items-center gap-1 relative">
            <div className="relative">
              <n.Icon size={21} color={on ? C.pine : C.muted} strokeWidth={on ? 2.4 : 2} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: C.maroon }}>{badge}</span>
              )}
            </div>
            <span className="text-[11px] font-semibold" style={{ color: on ? C.pine : C.muted }}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================== Shared bits =============================== */
function Avatar({ initials, size = 40, ring = null, ringDashed = false }) {
  const ringStyle = !ring ? {} : ringDashed
    ? { outline: `2.5px dashed ${ring}`, outlineOffset: 1.5 }
    : { boxShadow: `0 0 0 2.5px ${ring}` };
  return (
    <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: C.pine, ...ringStyle }}>
      <span className="font-semibold" style={{ color: C.goldSoft, fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}
function relTime(ts) {
  if (!ts || isNaN(ts)) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function fmtDate(d) { return new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
function Stars({ score, light }) {
  const full = Math.round(score);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} color={i <= full ? C.gold : (light ? "#ffffff55" : C.line)} fill={i <= full ? C.gold : "transparent"} strokeWidth={2} />
      ))}
    </div>
  );
}
function SectionLabel({ children, trailing }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.gold }}>{children}</div>
      {trailing && <div className="text-[12.5px]" style={{ color: C.muted }}>{trailing}</div>}
    </div>
  );
}
function StatusBadge({ status, reason }) {
  const m = {
    pending: { bg: C.goldSoft, fg: "#7a5a1e", Icon: Clock, label: "Pending review" },
    approved: { bg: C.pineSoft, fg: C.pine, Icon: Check, label: "Live" },
    rejected: { bg: C.maroonSoft, fg: C.maroon, Icon: X, label: "Not approved" },
    accepted: { bg: C.pineSoft, fg: C.pine, Icon: Check, label: "Accepted" },
    declined: { bg: C.maroonSoft, fg: C.maroon, Icon: X, label: "Declined" },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: m.bg, color: m.fg }}>
      <m.Icon size={13} strokeWidth={2.6} /> {m.label}{status === "rejected" && reason ? ` · ${reason}` : ""}
    </span>
  );
}
function PostMedia({ media }) {
  if (!media) return null;
  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
      <MediaCarousel media={media} />
    </div>
  );
}

function Empty({ Icon, title, body }) {
  return (
    <div className="rounded-2xl px-6 py-10 flex flex-col items-center text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.goldSoft }}><Icon size={22} color={C.gold} /></div>
      <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{title}</div>
      <p className="text-[13.5px] mt-1 max-w-[240px]" style={{ color: C.muted }}>{body}</p>
    </div>
  );
}
// Bhutan numbers: accept 17123456 / 77123456 / +975... and return a dialable +975 form
function dialNumber(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  const bare = digits.replace(/^0+/, "");
  if (bare.startsWith("975")) return "+" + bare;
  if (bare.length === 8) return "+975" + bare;          // local mobile
  return "+" + bare;
}
function prettyNumber(raw) {
  const d = dialNumber(raw);
  if (!d) return "";
  if (d.startsWith("+975") && d.length === 12) return `+975 ${d.slice(4, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return d;
}

const GUIDE_CLASSES = {
  cultural:          { label: "Cultural Guide",      short: "Cultural",    color: "#2B5FA3", rank: 1 },
  cultural_trekking: { label: "Cultural & Trekking", short: "Cul & Trek",  color: "#1F6B45", rank: 2 },
  senior:            { label: "Senior Guide",        short: "Senior",      color: "#7A1F2B", rank: 3 },
  tour_leader:       { label: "Tour Leader",         short: "Tour Leader", color: "#E8531F", rank: 4 },
};
const licenseJoinYear = (no) => {
  // The Department of Tourism encodes the year of joining as the two digits
  // right after the class prefix (e.g. CTG19... -> joined 2019).
  const m = String(no || "").trim().toUpperCase().match(/^(CTG|CG|STG|TL)\s?-?\s?(\d{2})(\d{2,6})$/);
  if (!m) return null;
  const yy = parseInt(m[2], 10);
  const nowY = new Date().getFullYear();
  const y2000 = 2000 + yy;
  return y2000 <= nowY ? y2000 : 1900 + yy;
};
const licenseExperienceYears = (no) => {
  const jy = licenseJoinYear(no);
  return jy == null ? null : Math.max(0, new Date().getFullYear() - jy);
};

const parseGuideClass = (no) => {
  const m = String(no || "").trim().toUpperCase().match(/^(CTG|CG|STG|TL)\s?-?\s?\d{4,8}$/);
  if (!m) return null;
  return { CG: "cultural", CTG: "cultural_trekking", STG: "senior", TL: "tour_leader" }[m[1]] || null;
};
const guideClassRank = (t) => (t.guideClass && GUIDE_CLASSES[t.guideClass] ? GUIDE_CLASSES[t.guideClass].rank : 9);

const roleLabel = (r) => (r === "guide" ? "Guide" : r === "operator" ? "Tour Operator" : r === "business" ? "Business" : r === "admin" ? "Admin" : r === "both" ? "Guide + Driver" : "Driver");

/* ======================== Feed tab (guides & drivers) ===================== */
function PushNudgeCard({ profileId }) {
  // Browsers only grant notification permission from a deliberate user tap —
  // the silent auto-ask at sign-in dies every time. This card supplies the tap,
  // states the reason, and disappears forever once this device is subscribed.
  const [state, setState] = useState("checking"); // checking | show | blocked | busy | install | done
  const [installBusy, setInstallBusy] = useState(false);
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
          if (on) setState("done"); return;
        }
        if (Notification.permission === "denied") { if (on) setState("blocked"); return; }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (on) setState(sub ? "done" : "show");
      } catch (e) { if (on) setState("done"); }
    })();
    return () => { on = false; };
  }, []);
  const enable = async () => {
    setState("busy");
    try {
      const perm = await askNotificationPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "blocked" : "error"); return; }
      await ensurePushSubscription(profileId);
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub && deferredInstallPrompt && !isStandaloneApp()) setState("install");
      else setState(sub ? "done" : "error");
    } catch (e) {
      setState(Notification.permission === "denied" ? "blocked" : "error");
    }
  };
  const installNow = async () => {
    const p = deferredInstallPrompt;
    if (!p) { setState("done"); return; }
    deferredInstallPrompt = null;
    setInstallBusy(true);
    try { p.prompt(); await p.userChoice; } catch (e) {}
    setInstallBusy(false);
    setState("done");
  };
  if (state === "checking" || state === "done") return null;
  if (state === "install") return (
    <div className="rounded-2xl p-4 mb-5" style={{ background: C.pineSoft, border: `1.5px solid ${C.pine}` }}>
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
          <Plus size={18} color="#fff" strokeWidth={2.6} />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold" style={{ color: C.pine }}>Notifications on — one more step</div>
          <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: C.pine }}>
            Add Bhutan Tourism Hub to your home screen: it opens full-screen like a real app,
            and alerts behave at their best.
          </p>
        </div>
      </div>
      <button onClick={installNow} disabled={installBusy}
        className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-3"
        style={{ background: C.pine, color: "#fff" }}>
        {installBusy ? "Opening installer…" : "Add the app to my home screen"}
      </button>
      <button onClick={() => setState("done")} className="tap w-full text-center text-[12px] mt-2" style={{ color: C.muted }}>
        Maybe later
      </button>
    </div>
  );
  return (
    <div className="rounded-2xl p-4 mb-5" style={{ background: C.pineSoft, border: `1.5px solid ${C.pine}` }}>
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
          <Bell size={17} color="#fff" />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold" style={{ color: C.pine }}>Turn on notifications</div>
          <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: C.pine }}>
            Get realtime updates the moment they happen — job offers, booking requests, messages and
            admin approvals reach your phone instantly, even when the app is closed.
          </p>
        </div>
      </div>
      {state === "blocked" ? (
        <p className="text-[12px] mt-2.5" style={{ color: C.maroon }}>
          Notifications are blocked for this site — allow them in your browser's site settings, then reopen the app.
        </p>
      ) : (
        <>
          <button onClick={enable} disabled={state === "busy"}
            className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-3"
            style={{ background: C.pine, color: "#fff" }}>
            {state === "busy" ? "Turning on…" : "Enable notifications"}
          </button>
          {state === "error" && (
            <p className="text-[12px] mt-2" style={{ color: C.maroon }}>
              Couldn't finish enabling — check your connection and tap once more. If a permission
              box appeared, choose Allow.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PostTab({ user, posts, onAdd, eng, onOpenProfile }) {
  const me = user.talentId;
  const t = talentById(me) || { id: me, name: user.name || "You", initials: user.initials || "?" };
  const visible = posts.filter((p) => p.status === "approved" || p.talentId === me);
  return (
    <div className="px-5 py-4">
      <PushNudgeCard profileId={me} />
      <Composer talent={t} onAdd={onAdd} />
      <div className="mt-7"><SectionLabel trailing={`${visible.length}`}>Feed</SectionLabel></div>
      {visible.length === 0 ? (
        <Empty Icon={Inbox} title="Nothing here yet" body="Approved highlights from every guide and driver appear here — share the first one." />
      ) : (
        <div className="space-y-3.5">
          {visible.map((p) => {
            const author = talentById(p.talentId);
            const mine = p.talentId === me;
            return (
              <div key={p.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => onOpenProfile(p.talentId)} className="tap flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Avatar initials={author?.initials || "?"} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{mine ? "You" : (author?.name || "Member")}</span>
                      {author?.verified && <BadgeCheck size={15} color={C.pine} />}
                    </div>
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}>
                      <MapPin size={11} /> {author?.base || ""} · {relTime(p.createdAt)}
                    </div>
                  </div>
                  </button>
                  {mine && p.status !== "approved" && <StatusBadge status={p.status} reason={p.reason} />}
                </div>
                {p.text && <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.ink }}>{p.text}</p>}
                {p.location && !p.location.outside && p.media && p.media.kind === "photo" && !(p.media.slides && p.media.slides.length > 1) ? (
                  <div className="mt-3"><MapCinema location={p.location} photo={p.media.dataUri} /></div>
                ) : (<>
                  <PostMedia media={p.media} />
                  <PostLocation location={p.location} />
                </>)}
                <PostEngagement post={p} eng={eng} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Composer({ talent, onAdd }) {
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);       // { kind:'photo'|'video', dataUri, slides, ratio }
  const [cropping, setCropping] = useState(null);  // slides currently being reframed
  const [compressing, setCompressing] = useState(null); // { cur, dur } while shrinking a video
  const [enhancing, setEnhancing] = useState(false); // colour / light touch-ups
  const [location, setLocation] = useState(null); // { lat, lng, place, description?, source? }
  const [picking, setPicking] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);
  const inputRef = useRef();

  const flash = (m) => { setNote(m); setTimeout(() => setNote(null), 3200); };

  const pick = (e) => {
    const files = Array.from(e.target.files || []); e.target.value = "";
    if (!files.length) return;
    const existing = media && media.kind === "photo" ? (media.slides || [media.dataUri]) : [];
    if (files.length + existing.length > 10) return setError("Up to 10 photos per post.");

    const vid = files.find((f) => f.type.startsWith("video/"));
    if (vid) {
      if (vid.size > 150 * 1024 * 1024) return setError("That video is over 150 MB — export a smaller version first.");
      videoDuration(vid).then(async (secs) => {
        if (secs != null && secs > 30.5) { setError(`Videos are limited to 30 seconds — yours is ${Math.round(secs)}s. Trim it and try again.`); return; }
        let out = vid;
        if (vid.size > 25 * 1024 * 1024) {
          setError(null);
          setCompressing({ cur: 0, dur: secs || 0 });
          const small = await compressVideo(vid, (cur, dur) => setCompressing({ cur, dur }));
          setCompressing(null);
          if (!small) { setError("This phone couldn't compress the video — trim it under 25 MB and try again."); return; }
          if (small.size > 25 * 1024 * 1024) { setError("Even compressed it stays over 25 MB — pick a shorter clip."); return; }
          out = small;
        }
        setError(null);
        const r = new FileReader();
        r.onload = () => setMedia({ kind: "video", dataUri: r.result });
        r.readAsDataURL(out);
      });
      return;
    }

    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return setError("Upload photos or a video.");
    if (imgs.some((f) => f.size > 6 * 1024 * 1024)) return setError("Each photo must be under 6 MB.");
    setError(null);

    Promise.all(imgs.map((f) => new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    }))).then((uris) => {
      const slides = [...existing, ...uris];
      setMedia({ kind: "photo", dataUri: slides[0], slides, ratio: media?.ratio || "4 / 5" });
      setCropping(slides);
      // read location from the first photo only
      if (!existing.length) readExifGps(imgs[0]).then((gps) => {
        if (gps && isValidLatLng(gps.lat, gps.lng)) {
          const inBT = insideBhutan(gps.lat, gps.lng);
          setLocation({
            lat: gps.lat, lng: gps.lng, place: nearestPlace(gps.lat, gps.lng), source: "photo",
            outside: !inBT,
            altitude: gps.altitude ?? null, bearing: gps.bearing ?? null, takenOn: gps.takenOn ?? null,
          });
          if (inBT) {
            const bits = ["Location read from the photo"];
            if (gps.altitude != null) bits.push(`${gps.altitude}m`);
            flash(bits.join(" · "));
          } else {
            flash("This photo was taken outside Bhutan — it won't appear on the Bhutan map.");
          }
        }
      });
    });
  };

  const post = () => {
    if (!text.trim() && !media) return;
    Promise.resolve(onAdd({ talentId: talent.id, text: text.trim(), media, location })).then((res) => {
      if (res && res.ok === false) setError(
        res.reason === "upload" ? "Some photos didn't finish uploading — check your connection and try again."
        : res.reason === "session" ? "Your signed-in account changed (another tab?). Close and reopen the app, then post again."
        : res.reason === "auth" ? "You've been signed out — sign in again to post."
        : "The post couldn't be saved — please try again.");
    });
    setText(""); setMedia(null); setLocation(null); setPicking(false); setManual(false);
  };
  const canPost = text.trim() || media;
  const chipLabel = placeLabel(location);

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar initials={talent.initials} size={36} />
        <div><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{talent.name}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>Share a trip highlight</div></div>
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={300} placeholder="Write a caption — what made this trip special?"
        className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, minHeight: 92 }} />
      <div className="flex justify-end mt-1">
        <span className="text-[11px]" style={{ color: text.length > 270 ? C.maroon : C.muted }}>{text.length}/300</span>
      </div>

      {media && (
        <div className="mt-3">
          {media.kind === "video" ? (
            <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
              <video src={media.dataUri} controls playsInline className="w-full block" style={{ maxHeight: 240 }} />
              <button onClick={() => setMedia(null)} className="tap absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}><X size={16} color="#fff" /></button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto hidescroll pb-1" style={{ scrollbarWidth: "none" }}>
                {(media.slides || [media.dataUri]).map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 104, height: 104, border: `1px solid ${C.line}` }}>
                    <img src={src} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
                    <button onClick={() => {
                      const rest = (media.slides || [media.dataUri]).filter((_, k) => k !== i);
                      setMedia(rest.length ? { kind: "photo", dataUri: rest[0], slides: rest } : null);
                    }} className="tap absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.6)" }}>
                      <X size={12} color="#fff" />
                    </button>
                    {i === 0 && (media.slides || []).length > 1 && (
                      <span className="absolute left-1 bottom-1 text-[9.5px] font-bold rounded px-1.5 py-0.5" style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>COVER</span>
                    )}
                  </div>
                ))}
                <button onClick={() => inputRef.current?.click()} className="tap shrink-0 rounded-xl flex flex-col items-center justify-center"
                  style={{ width: 104, height: 104, background: C.bg, border: `1.5px dashed ${C.line}` }}>
                  <Plus size={20} color={C.gold} strokeWidth={2.6} />
                  <span className="text-[10.5px] mt-1 font-semibold" style={{ color: C.ink }}>Add more</span>
                  <span className="text-[9.5px]" style={{ color: C.muted }}>up to 10</span>
                </button>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11.5px] font-semibold tracking-[.1em] uppercase" style={{ color: C.gold }}>Shape</span>
                  <button onClick={() => setEnhancing(true)} className="tap inline-flex items-center gap-1 text-[11.5px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
                    <Sparkles size={12} /> Enhance{(media.slides || []).length > 1 ? ` all ${media.slides.length}` : ""}
                  </button>
                </div>
                <div className="flex gap-2">
                  {RATIOS.map((r) => {
                    const on = (media.ratio || "4 / 5") === r.id;
                    return (
                      <button key={r.id} onClick={() => setCropping(media.slides || [media.dataUri])}
                        className="tap flex-1 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
                        style={{ background: on ? C.pine : C.card, border: `1px solid ${on ? C.pine : C.line}` }}>
                        <span className="rounded-sm" style={{
                          width: r.w >= r.h ? 20 : 20 * (r.w / r.h), height: r.h >= r.w ? 20 : 20 * (r.h / r.w),
                          border: `1.5px solid ${on ? "#fff" : C.muted}`,
                        }} />
                        <span className="text-[10.5px] font-semibold" style={{ color: on ? "#fff" : C.ink }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setCropping(media.slides || [media.dataUri])}
                  className="tap w-full h-10 rounded-xl mt-2 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold"
                  style={{ background: C.goldSoft, color: "#7a5a1e" }}>
                  <Maximize2 size={14} /> Crop & reposition
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {enhancing && media && media.kind === "photo" && (
        <EnhanceEditor slides={media.slides || [media.dataUri]}
          onClose={() => setEnhancing(false)}
          onDone={(out) => { setMedia({ ...media, dataUri: out[0], slides: out }); setEnhancing(false); }} />
      )}
      {cropping && (
        <CropEditor slides={cropping} initialRatio={media?.ratio || "4 / 5"}
          onClose={() => setCropping(null)}
          onDone={(cropped, ratio) => {
            setMedia({ kind: "photo", dataUri: cropped[0], slides: cropped, ratio });
            setCropping(null);
          }} />
      )}

      {note && <div className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium rounded-full px-2.5 py-1" style={{ background: C.pineSoft, color: C.pine }}><MapPin size={12} color={C.pine} /> {note}</div>}

      {location && !picking && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-semibold" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
              <MapPin size={14} color={C.gold} /> {chipLabel}
            </span>
            <button onClick={() => setPicking(true)} className="text-[12.5px] font-semibold" style={{ color: C.pine }}>Change</button>
            <button onClick={() => setLocation(null)} className="text-[12.5px] font-semibold" style={{ color: C.muted }}>Remove</button>
          </div>
          {location.description && <p className="text-[12.5px] leading-snug mt-1.5" style={{ color: C.muted }}>{location.description}</p>}
        </div>
      )}

      {picking && (
        <div className="mt-3 fade">
          <select value="" onChange={(e) => { const v = VIEWPOINTS[e.target.value]; if (v) { setLocation({ lat: v.lat, lng: v.lng, place: v.n, description: v.d, source: "viewpoint" }); setManual(false); } }}
            className="w-full h-11 px-3 rounded-xl text-[14px] mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
            <option value="">Choose an iconic viewpoint…</option>
            {VIEWPOINTS.map((v, i) => <option key={i} value={i}>{v.n}</option>)}
          </select>
          {location && location.source === "viewpoint" && !manual ? (
            <>
              <MapCinema key={location.place} location={location} />
              <button onClick={() => setManual(true)} className="tap text-[12.5px] font-semibold mt-2" style={{ color: C.pine }}>Adjust on the map</button>
            </>
          ) : (
            <>
              <div className="text-[12.5px] mb-2" style={{ color: C.muted }}>…or tap the map for a custom spot.</div>
              <BhutanMap value={location} onPick={(loc) => setLocation({ ...loc, source: "map" })} />
            </>
          )}
          <button onClick={() => {
            if (!navigator.geolocation) { setError("This phone doesn't share location."); return; }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude: glat, longitude: glng, altitude, accuracy } = pos.coords;
                if (!isValidLatLng(glat, glng)) { setError("Couldn't read a valid position — try again outdoors."); return; }
                const inBT = insideBhutan(glat, glng);
                setError(null); setManual(false);
                setLocation({
                  lat: +glat.toFixed(6), lng: +glng.toFixed(6),
                  place: nearestPlace(glat, glng), source: "gps", outside: !inBT,
                  altitude: altitude != null ? Math.round(altitude) : null,
                });
                flash(`Exact position captured · ±${Math.round(accuracy || 0)}m`);
              },
              () => setError("Location was blocked — allow it in your browser settings to use exact GPS."),
              { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
            );
          }} className="tap w-full h-11 rounded-xl text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 mt-2"
            style={{ background: C.pineSoft, color: C.pine }}>
            <NavIcon size={15} /> Use my exact location (GPS)
          </button>
          {location && location.description && <p className="text-[12.5px] leading-snug mt-2" style={{ color: C.ink }}>{location.description}</p>}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[12.5px]" style={{ color: C.muted }}>{location ? `${location.lat}, ${location.lng}${location.source === "map" ? " · approx." : location.source === "gps" ? " · exact GPS" : ""}` : "No pin yet"}</span>
            <button onClick={() => setPicking(false)} className="tap text-[13px] font-semibold rounded-full px-3 py-1.5" style={{ background: C.pine, color: "#fff" }}>Done</button>
          </div>
        </div>
      )}

      {compressing && (
        <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 mt-2 fade" style={{ background: C.pineSoft }}>
          <Loader2 size={15} color={C.pine} className="animate-spin shrink-0" />
          <span className="text-[13px] font-medium" style={{ color: C.pine }}>
            Compressing video… {Math.floor(compressing.cur)}s / {Math.round(compressing.dur)}s — big files shrink before upload.
          </span>
        </div>
      )}
      {error && <p className="text-[12.5px] mt-2" style={{ color: C.maroon }}>{error}</p>}

      {!media && (
        <div className="rounded-xl px-3.5 py-2.5 mt-3 flex items-start gap-2.5" style={{ background: C.bg, border: `1px dashed ${C.line}` }}>
          <ImagePlus size={15} color={C.gold} className="shrink-0 mt-0.5" />
          <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
            Add up to <b style={{ color: C.ink }}>10 photos</b> — they become a swipeable set.
            On Android, <b style={{ color: C.ink }}>press and hold</b> the first photo to pick several at once,
            or add them one at a time.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => inputRef.current?.click()} className="tap inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
          <ImagePlus size={16} /> {media && media.kind === "photo" ? "Add another" : media ? "Change" : "Add photos"}
        </button>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={pick} className="hidden" />
        {!location && (
          <button onClick={() => setPicking(true)} className="tap inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>
            <MapPin size={16} color={C.gold} /> Pin
          </button>
        )}
        <button onClick={post} disabled={!canPost} className="tap ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold" style={{ background: canPost ? C.pine : "#C7CEC7", color: "#fff", cursor: canPost ? "pointer" : "not-allowed" }}>
          <Send size={16} /> Post
        </button>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
        <Clock size={13} color={C.muted} /><span className="text-[12px]" style={{ color: C.muted }}>Reviewed by an admin before going live.</span>
      </div>
    </div>
  );
}

/* ========================= Jobs inbox (talent) =========================== */
function JobsInbox({ user, jobs, onSet }) {
  const mine = jobs.filter((j) => j.toTalentId === user.talentId);
  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={`${mine.length} total`}>Job requests</SectionLabel>
      {mine.length === 0 ? (
        <Empty Icon={Briefcase} title="No requests yet" body="When an operator invites you to a trip, it shows up here." />
      ) : (
        <div className="space-y-3">
          {mine.map((j) => (
            <div key={j.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{j.title}</div>
                {j.status !== "pending" && <StatusBadge status={j.status} />}
              </div>
              <div className="text-[13px] mt-1" style={{ color: C.muted }}>from {j.operator}</div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Pill Icon={CalendarCheck}>{fmtDate(j.start)} – {fmtDate(j.end)}</Pill>
                {j.languages?.map((l) => <Pill key={l}>{l}</Pill>)}
              </div>
              {j.notes && <p className="text-[13.5px] leading-snug mt-3" style={{ color: C.ink }}>{j.notes}</p>}
              {j.status === "pending" && (
                <div className="flex gap-2.5 mt-3.5">
                  <button onClick={() => onSet(j.id, "declined")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.card, border: `1.5px solid ${C.maroon}`, color: C.maroon }}><X size={17} /> Decline</button>
                  <button onClick={() => onSet(j.id, "accepted")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#fff" }}><Check size={17} /> Accept</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Pill({ Icon, children }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>{Icon && <Icon size={13} color={C.gold} />}{children}</span>;
}

/* ============================ Discover (operator) ========================= */
function Discover({ onOpen, initialQuery, dirTick, viewerKind }) {
  const [q, setQ] = useState(initialQuery || "");
  useEffect(() => { if (initialQuery) setQ(initialQuery); }, [initialQuery]);
  const bizViewer = viewerKind === "business";
  const [tab, setTab] = useState(bizViewer ? "operator" : "guide");
  const [lang, setLang] = useState(null);
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [bizType, setBizType] = useState(null);
  const [gClass, setGClass] = useState(null);

  const roles = bizViewer ? ["operator", "business"] : ["guide", "driver", "business"];
  const POOL = useMemo(() => [...TALENT.filter((t) => roles.includes(t.role)), ...Object.values(PROFILE_DIR).filter((p) => roles.includes(p.role))], [dirTick, viewerKind]);
  const counts = useMemo(() => ({
    guide: POOL.filter((t) => t.role === "guide").length,
    driver: POOL.filter((t) => t.role === "driver").length,
    operator: POOL.filter((t) => t.role === "operator").length,
    business: POOL.filter((t) => t.role === "business").length,
  }), [POOL]);

  const isBiz = tab === "business";
  const peopleTab = tab === "guide" || tab === "driver";
  const list = POOL.filter((t) => t.role === tab)
    .filter((t) => (!onlyVerified || t.verified))
    .filter((t) => (tab !== "guide" || !gClass || t.guideClass === gClass))
    .filter((t) => (!peopleTab || !onlyFree || (t.availability || "open") === "open"))
    .filter((t) => (!peopleTab || !lang || (t.languages || []).some((l) => l && l.n === lang)))
    .filter((t) => (!isBiz || !bizType || (t.tags || []).includes(bizType)))
    .filter((t) => {
      const hay = `${t.name || ""} ${t.base || ""} ${(t.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => (tab === "guide" ? guideClassRank(a) - guideClassRank(b) : 0) || (b.rating || 0) - (a.rating || 0) || String(a.name).localeCompare(String(b.name)));

  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={`${list.length} listed`}>{bizViewer ? (isBiz ? "Fellow places" : "Your customers") : isBiz ? "Find a place" : "Find talent"}</SectionLabel>

      <Segmented value={tab} onChange={(v) => { setTab(v); setBizType(null); setGClass(null); }}
        options={bizViewer
          ? [["operator", `Tour Operators (${counts.operator})`], ["business", `Hotels (${counts.business})`]]
          : [["guide", `Guides (${counts.guide})`], ["driver", `Drivers (${counts.driver})`], ["business", `Hotels (${counts.business})`]]} />

      <div className="relative mt-3 mb-3">
        <Search size={16} color={C.muted} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={bizViewer && tab === "operator" ? "Search tour operators" : isBiz ? "Search hotels, farmstays, shops or towns" : "Search name, base or speciality"}
          className="w-full h-11 pl-10 pr-4 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
      </div>

      {isBiz ? (
        <div className="flex gap-2 overflow-x-auto hidescroll pb-1 mb-1.5" style={{ scrollbarWidth: "none" }}>
          <Chip on={!bizType} onClick={() => setBizType(null)}>All places</Chip>
          {ONB_BUSINESS.map((t) => <Chip key={t} on={bizType === t} onClick={() => setBizType(bizType === t ? null : t)}>{t}</Chip>)}
          <Chip on={onlyVerified} onClick={() => setOnlyVerified((v) => !v)}>Verified only</Chip>
        </div>
      ) : tab === "operator" ? (
        <div className="flex gap-2 overflow-x-auto hidescroll pb-1 mb-1.5" style={{ scrollbarWidth: "none" }}>
          <Chip on={onlyVerified} onClick={() => setOnlyVerified((v) => !v)}>Verified only</Chip>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto hidescroll pb-1 mb-1.5" style={{ scrollbarWidth: "none" }}>
          <Chip on={onlyFree} onClick={() => setOnlyFree((v) => !v)}>Available now</Chip>
          <Chip on={onlyVerified} onClick={() => setOnlyVerified((v) => !v)}>Verified only</Chip>
          {tab === "guide" && Object.entries(GUIDE_CLASSES).map(([k, v]) => (
            <button key={k} onClick={() => setGClass(gClass === k ? null : k)} className="tap shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium inline-flex items-center gap-1.5"
              style={{ background: gClass === k ? v.color : C.card, border: `1px solid ${gClass === k ? v.color : C.line}`, color: gClass === k ? "#fff" : C.ink }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: gClass === k ? "#fff" : v.color }} /> {v.short}
            </button>
          ))}
          <Chip on={!lang} onClick={() => setLang(null)}>All languages</Chip>
          {LANG_OPTIONS.map((l) => <Chip key={l} on={lang === l} onClick={() => setLang(lang === l ? null : l)}>{l}</Chip>)}
        </div>
      )}
      <p className="text-[11.5px] mb-3" style={{ color: C.muted }}>
        {bizViewer && tab === "operator" ? "These operators bring the tours. Open one and message them to pitch your rooms and offers." : isBiz ? "Hotels, farmstays, boutiques and local businesses \u2014 tap one to see its live availability calendar." : "Tap a person to see their full profile, reviews and availability."}
      </p>

      {list.length === 0 ? (
        <Empty Icon={Search} title="No matches" body={isBiz ? "Try another place type, or clear the filters." : "Try a different language or clear the filters."} />
      ) : (
        <div className="space-y-3">{list.map((t) => <TalentCard key={t.id} t={t} onOpen={() => onOpen(t.id)} />)}</div>
      )}
    </div>
  );
}
function Chip({ on, onClick, children }) {
  return <button onClick={onClick} className="tap shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium" style={{ background: on ? C.pine : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? "#fff" : C.ink }}>{children}</button>;
}

function TalentCard({ t, onOpen }) {
  const gc = t.role === "guide" && t.guideClass ? GUIDE_CLASSES[t.guideClass] || null : null;
  return (
    <button onClick={onOpen} className="tap w-full text-left rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-3.5">
        <Avatar initials={t.initials} size={48} ring={gc ? gc.color : null} ringDashed={gc ? !t.verified : false} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15.5px] font-semibold truncate" style={{ color: C.ink }}>{t.name}</span>
            {t.verified && <BadgeCheck size={15} color={C.pine} />}
          </div>
          <div className="flex items-center gap-1 text-[12.5px]" style={{ color: C.muted }}><MapPin size={12} /> {roleLabel(t.role)} · {t.base}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ background: C.goldSoft }}>
            <Star size={12} color={C.gold} fill={C.gold} /><span className="text-[12.5px] font-semibold" style={{ color: "#7a5a1e" }}>{typeof t.rating === "number" ? t.rating.toFixed(1) : "New"}</span>
          </div>
          <div className="text-[11.5px] mt-1" style={{ color: C.muted }}>{t.years} yrs</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {gc && (
          <span className="text-[11px] font-bold rounded-full px-2 py-1" style={{ background: gc.color, color: "#fff", opacity: t.verified ? 1 : 0.65 }}>
            {gc.short}{t.verified ? "" : " · pending"}
          </span>
        )}
        <AvailabilityChip talent={t} />
        {(t.languages || []).slice(0, 3).map((l) => (
          <span key={l.n} className="text-[11.5px] rounded-md px-1.5 py-0.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{l.n}</span>
        ))}
      </div>
    </button>
  );
}

/* ======================= Sent requests (operator) ======================== */
function SentRequests({ operator, operatorId, jobs, onOpen }) {
  const mine = jobs.filter((j) => (j.operatorId ? j.operatorId === operatorId : j.operator === operator));
  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={`${mine.length} sent`}>Job requests</SectionLabel>
      {mine.length === 0 ? (
        <Empty Icon={Briefcase} title="No requests sent" body="Open a guide or driver from Discover and send them a job request." />
      ) : (
        <div className="space-y-3">
          {mine.map((j) => {
            const t = talentById(j.toTalentId);
            return (
              <div key={j.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => onOpen(j.toTalentId)} className="flex items-center gap-2.5 text-left">
                    <Avatar initials={t.initials} size={38} />
                    <div>
                      <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{t.name}</div>
                      <div className="text-[12px]" style={{ color: C.muted }}>{roleLabel(t.role)} · {t.base}</div>
                    </div>
                  </button>
                  <StatusBadge status={j.status} />
                </div>
                <div className="text-[14px] font-medium mt-3" style={{ color: C.ink }}>{j.title}</div>
                <div className="flex flex-wrap gap-2 mt-2"><Pill Icon={CalendarCheck}>{fmtDate(j.start)} – {fmtDate(j.end)}</Pill>{j.languages?.map((l) => <Pill key={l}>{l}</Pill>)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================= Feed (operator & admin) ======================== */
function Feed({ posts, eng, admin, onDelete, onOpenProfile, following }) {
  const [scope, setScope] = useState("all");
  const base = admin ? posts : posts.filter((p) => p.status === "approved");
  const live = scope === "following" && following?.length ? base.filter((p) => following.includes(p.talentId)) : base;
  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={admin ? `${live.length} total` : undefined}>Highlights</SectionLabel>
      {!admin && following?.length > 0 && (
        <div className="flex gap-2 mb-3.5">
          <Chip on={scope === "all"} onClick={() => setScope("all")}>Everyone</Chip>
          <Chip on={scope === "following"} onClick={() => setScope("following")}>Following · {following.length}</Chip>
        </div>
      )}
      {live.length === 0 ? (
        <Empty Icon={Inbox} title="No highlights yet" body="Approved posts from guides and drivers appear here." />
      ) : (
        <div className="space-y-3.5">
          {live.map((p) => {
            const t = talentById(p.talentId);
            return (
              <div key={p.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => onOpenProfile(p.talentId)} className="tap flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Avatar initials={t?.initials || "?"} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5"><span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{t?.name || "Member"}</span>{t?.verified && <BadgeCheck size={15} color={C.pine} />}</div>
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}><MapPin size={11} /> {t?.base || ""} · {relTime(p.createdAt)}</div>
                  </div>
                  </button>
                  {admin && p.status !== "approved" && <StatusBadge status={p.status} reason={p.reason} />}
                  {admin && <DeletePost onConfirm={() => onDelete(p.id)} />}
                </div>
                {p.text && <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.ink }}>{p.text}</p>}
                {p.location && !p.location.outside && p.media && p.media.kind === "photo" && !(p.media.slides && p.media.slides.length > 1) ? (
                  <div className="mt-3"><MapCinema location={p.location} photo={p.media.dataUri} /></div>
                ) : (<>
                  <PostMedia media={p.media} />
                  <PostLocation location={p.location} showMap />
                </>)}
                <PostEngagement post={p} eng={eng} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeletePost({ onConfirm }) {
  const [arm, setArm] = useState(false);
  if (!arm) return (
    <button onClick={() => setArm(true)} className="tap w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: C.maroonSoft }} aria-label="Delete post">
      <Trash2 size={15} color={C.maroon} />
    </button>
  );
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button onClick={onConfirm} className="tap text-[12px] font-bold rounded-full px-2.5 py-1.5" style={{ background: C.maroon, color: "#fff" }}>Delete</button>
      <button onClick={() => setArm(false)} className="tap text-[12px] font-semibold rounded-full px-2 py-1.5" style={{ background: C.bg, color: C.muted }}>Keep</button>
    </div>
  );
}

/* ============================== Review (admin) =========================== */
function Review({ posts, onApprove, onReject, eng }) {
  const [tab, setTab] = useState("pending");
  const pending = posts.filter((p) => p.status === "pending");
  const reviewed = posts.filter((p) => p.status !== "pending");
  const list = tab === "pending" ? pending : reviewed;
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-4">
        {[["pending", `Pending (${pending.length})`], ["reviewed", `Reviewed (${reviewed.length})`]].map(([k, l]) => {
          const on = tab === k;
          return <button key={k} onClick={() => setTab(k)} className="tap px-3.5 py-2 rounded-full text-[13px] font-semibold" style={{ background: on ? C.pine : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? "#fff" : C.ink }}>{l}</button>;
        })}
      </div>
      {list.length === 0 ? (
        <Empty Icon={Check} title={tab === "pending" ? "All clear" : "Nothing reviewed yet"}
          body={tab === "pending" ? "New posts land here for review." : "Posts you approve or reject appear here."} />
      ) : (
        <div className="space-y-3">{list.map((p) => <ModCard key={p.id} post={p} onApprove={onApprove} onReject={onReject} eng={eng} />)}</div>
      )}
    </div>
  );
}
const REASONS = ["Blurry or low quality", "Off-topic", "Inappropriate", "Other"];
function ModCard({ post, onApprove, onReject, eng }) {
  const [rejecting, setRejecting] = useState(false);
  const t = talentById(post.talentId);
  const pending = post.status === "pending";
  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-3">
        <Avatar initials={t.initials} size={40} />
        <div className="flex-1"><div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{t.name}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{roleLabel(t.role)} · {relTime(post.createdAt)}</div></div>
        {!pending && <StatusBadge status={post.status} reason={post.reason} />}
      </div>
      {post.text && <p className="text-[14.5px] leading-snug mt-3" style={{ color: C.ink }}>{post.text}</p>}
      <PostMedia media={post.media} />
      <PostLocation location={post.location} showMap />
      <PostEngagement post={post} eng={eng} />
      {!pending && (
        <div className="flex gap-2.5 mt-3.5">
          {post.status !== "approved" && (
            <button onClick={() => onApprove(post.id)} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
              style={{ background: C.pineSoft, color: C.pine }}><Check size={15} /> Approve instead</button>
          )}
          {post.status !== "rejected" && (
            <button onClick={() => onReject(post.id, "Changed on review")} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
              style={{ background: C.maroonSoft, color: C.maroon }}><X size={15} /> Reject instead</button>
          )}
        </div>
      )}

      {pending && !rejecting && (
        <div className="flex gap-2.5 mt-3.5">
          <button onClick={() => setRejecting(true)} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.card, border: `1.5px solid ${C.maroon}`, color: C.maroon }}><X size={17} /> Reject</button>
          <button onClick={() => onApprove(post.id)} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#fff" }}><Check size={17} /> Approve</button>
        </div>
      )}
      {pending && rejecting && (
        <div className="mt-3.5 fade">
          <div className="text-[12.5px] font-medium mb-2" style={{ color: C.ink }}>Reason for rejecting</div>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => <button key={r} onClick={() => onReject(post.id, r)} className="tap rounded-full px-3 py-1.5 text-[13px] font-medium" style={{ background: C.maroonSoft, color: C.maroon, border: `1px solid ${C.maroon}22` }}>{r}</button>)}
          </div>
          <button onClick={() => setRejecting(false)} className="text-[13px] font-medium mt-2.5" style={{ color: C.muted }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

/* ============================= Talent profile ============================ */
function TalentProfile({ talent, posts, canRequest, viewer, self, contactOnly, eng, onRequest, onMessage, onSetAvailability, onOpenProfile, onProfileSaved, onBack }) {
  const t = talent;
  const live = posts.filter((p) => p.talentId === t.id && p.status === "approved").length;
  const located = posts.filter((p) => p.talentId === t.id && p.status === "approved" && p.location);
  const gallery = posts.filter((p) => p.talentId === t.id && p.status === "approved" && p.media && p.media.kind === "photo");
  const allFollows = eng?.follows || [];
  const followerCount = allFollows.filter((f) => f.following === t.id).length;
  const followingCount = allFollows.filter((f) => f.follower === t.id).length;
  const iFollow = allFollows.some((f) => f.follower === eng?.me && f.following === t.id);
  // Contact details are an operator feature. Guides and drivers message instead.
  const canSeeContact = Boolean(self || canRequest || contactOnly);
  const gcp = t.role === "guide" && t.guideClass ? GUIDE_CLASSES[t.guideClass] : null;
  const [opEmail, setOpEmail] = useState(null);
  useEffect(() => {
    let on = true;
    setOpEmail(null);
    if (!CLOUD || self || !["operator", "admin"].includes(viewer?.kind)) return;
    supabase.from("profile_emails").select("email").eq("profile_id", t.id).maybeSingle()
      .then(({ data }) => { if (on) setOpEmail(data?.email || null); });
    return () => { on = false; };
  }, [t.id, viewer?.kind, self]);
  const myStories = (eng?.stories || []).filter((st) => st.authorId === t.id);
  const [viewStories, setViewStories] = useState(false);
  const [addStory, setAddStory] = useState(false);
  const [shareToStory, setShareToStory] = useState(null);
  const [listMode, setListMode] = useState(null);
  const [credsOpen, setCredsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [askOperator, setAskOperator] = useState(false);
  return (
    <div className="pb-6">
      <div className="relative">
        {onBack && (
          <button onClick={onBack} className="tap absolute left-4 top-4 z-10 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.9)", border: `1px solid ${C.line}` }}><ChevronLeft size={19} color={C.ink} /></button>
        )}
        <div className="h-24 relative" style={{ background: gcp
          ? `radial-gradient(130% 150% at 80% 0%, ${gcp.color} 0%, ${gcp.color}E6 45%, #16241B 105%)`
          : `radial-gradient(120% 140% at 80% 0%, ${C.pine} 0%, ${C.pineDeep} 70%)` }}>
          {gcp && (
            <span className="absolute left-4 bottom-2.5 text-[10px] font-bold tracking-[.18em] uppercase" style={{ color: "rgba(255,255,255,.9)" }}>
              {gcp.label}{t.verified ? " ✓" : ""}
            </span>
          )}
        </div>
        <div className="px-5">
          <div className="-mt-9 mb-3 flex items-end gap-3">
            <button onClick={() => myStories.length && setViewStories(true)} className="relative" style={{ cursor: myStories.length ? "pointer" : "default" }}>
              <div className="rounded-2xl flex items-center justify-center" style={{ width: 72, height: 72, background: C.pine, border: `3px solid ${C.bg}`,
                boxShadow: myStories.length ? `0 0 0 3px ${C.gold}` : gcp ? `0 0 0 3px ${gcp.color}` : "none" }}>
                <span className="text-[23px] font-semibold" style={{ color: C.goldSoft }}>{t.initials}</span>
              </div>
              {myStories.length > 0 && (
                <span className="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: C.gold, color: "#fff" }}>{myStories.length}</span>
              )}
            </button>
            {self && (
              <button onClick={() => setAddStory(true)} className="tap mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                style={{ background: C.goldSoft, color: "#7a5a1e" }}>
                <Plus size={14} strokeWidth={3} /> Add story
              </button>
            )}
          </div>
          <div>
            <div>
              <div className="flex items-start gap-1.5">
                <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]" style={{ color: C.ink, wordBreak: "break-word" }}>{t.name}</h1>
                {t.handle && <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>@{t.handle}</div>}
                {t.verified && <BadgeCheck size={17} color={C.pine} className="shrink-0 mt-1" />}
              </div>
              <div className="flex items-center gap-1 text-[13.5px] mt-1" style={{ color: C.muted }}><MapPin size={13} /> {t.role === "guide" && t.guideClass && GUIDE_CLASSES[t.guideClass]
                  ? <span className="font-bold" style={{ color: GUIDE_CLASSES[t.guideClass].color }}>{GUIDE_CLASSES[t.guideClass].label}</span>
                  : roleLabel(t.role)}{t.base ? ` · ${t.base}` : ""}</div>
              {!["operator", "business"].includes(t.role) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {gcp && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[.06em] uppercase rounded-lg px-2.5 py-1.5"
                      style={{ background: gcp.color, color: "#fff" }}>
                      {t.verified && <BadgeCheck size={12} />} {gcp.label}
                    </span>
                  )}
                  <AvailabilityChip talent={t} />
                </div>
              )}
              {(t.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {(t.tags || []).slice(0, 6).map((tag) => (
                    <span key={tag} className="text-[11.5px] rounded-full px-2.5 py-1" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{tag}</span>
                  ))}
                  {(t.tags || []).length > 6 && <span className="text-[11.5px] py-1" style={{ color: C.muted }}>+{(t.tags || []).length - 6} more</span>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center mt-4 mb-1">
            <Stat n={gallery.length} label="posts" />
            <Stat n={followerCount} label={followerCount === 1 ? "follower" : "followers"} onClick={() => setListMode("followers")} />
            <Stat n={followingCount} label="following" onClick={() => setListMode("following")} />
            {["guide", "driver"].includes(t.role) && <Stat n={t.years} label="yrs" />}
          </div>

          {self && ["guide", "driver"].includes(t.role) && (
            <button onClick={() => setEditOpen(true)} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-3"
              style={{ background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}>Edit profile</button>
          )}
          {!self && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => eng?.toggleFollow && eng.toggleFollow(t.id)}
                className="tap flex-1 h-10 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: iFollow ? C.card : C.pine, border: iFollow ? `1px solid ${C.line}` : "none", color: iFollow ? C.ink : "#fff" }}>
                {iFollow ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
              </button>
              <button onClick={() => onMessage && onMessage(t.id)}
                className="tap flex-1 h-10 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                <MessageCircle size={15} /> Message
              </button>
              {canSeeContact && t.phone && (
                <>
                  <a href={`tel:${dialNumber(t.phone)}`}
                    className="tap w-11 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: C.pineSoft, border: `1px solid ${C.line}` }} aria-label="Call">
                    <PhoneCall size={16} color={C.pine} />
                  </a>
                  <a href={`https://wa.me/${dialNumber(t.phone).replace("+", "")}`} target="_blank" rel="noreferrer"
                    className="tap w-11 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(37,211,102,.13)", border: "1px solid rgba(37,211,102,.45)" }} aria-label="WhatsApp">
                    <MessageCircle size={16} color="#1FA855" />
                  </a>
                </>
              )}
            </div>
          )}
          {!self && canSeeContact && t.phone && (
            <div className="mt-2.5 text-[12.5px]" style={{ color: C.muted }}>
              {prettyNumber(t.phone)}{opEmail ? ` · ${opEmail}` : ""}
            </div>
          )}
          {!self && viewer?.kind === "business" && (
            <div className="mt-2.5 text-[12px]" style={{ color: C.muted }}>
              Email: ••••••@•••••• — full contact is visible to tour operators only.
            </div>
          )}
        </div>
      </div>

      <div className="px-5">
        {self && t.role === "guide" && licenseJoinYear(t.licenseNo) == null && (
          <div className="rounded-2xl p-4 mt-5" style={{ background: C.goldSoft, border: `1.5px solid ${C.gold}` }}>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} color={C.gold} />
              <span className="text-[14px] font-semibold" style={{ color: "#7a5a1e" }}>Your experience shows 0 years</span>
            </div>
            <p className="text-[12.5px] mt-1.5 leading-snug" style={{ color: "#7a5a1e" }}>
              Experience is read straight from your Department of Tourism licence number \u2014 no separate document needed.
              Add your licence number below and it appears automatically.
            </p>
          </div>
        )}
        {self && !["operator", "business"].includes(t.role) && <TalentAvailability talent={t} onSet={onSetAvailability} />}

        <ProfileTabs
          cv={
            <>
              {["guide", "driver"].includes(t.role) && <GuestReviews talentId={t.id} isAdmin={eng?.isAdmin} isSelf={self} onAskOperator={() => setAskOperator(true)} />}

              <div className="mt-6" />

              {["guide", "driver"].includes(t.role) && <CharacterChart talentId={t.id} />}

              {t.role === "business" && <BusinessAvailability business={t} viewer={viewer} />}
              {["guide", "driver"].includes(t.role) && !self && ["operator", "admin"].includes(viewer?.kind) && <TalentAvailability talent={t} viewerOnly />}

              {t.pitch && <div className="mt-5 pl-4" style={{ borderLeft: `3px solid ${C.gold}` }}><p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{t.pitch}</p></div>}

              {["guide", "driver"].includes(t.role) && (self || ["operator", "admin"].includes(viewer?.kind)) && (
                <div className="mt-5">
                  <button onClick={() => setCredsOpen(true)} className="tap w-full rounded-2xl p-4 flex items-center gap-3 text-left"
                    style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `4px solid ${t.guideClass && GUIDE_CLASSES[t.guideClass] ? GUIDE_CLASSES[t.guideClass].color : C.gold}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: t.guideClass && GUIDE_CLASSES[t.guideClass] ? `${GUIDE_CLASSES[t.guideClass].color}18` : C.goldSoft }}>
                      <FileCheck2 size={18} color={t.guideClass && GUIDE_CLASSES[t.guideClass] ? GUIDE_CLASSES[t.guideClass].color : C.gold} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>Credentials & Licence</div>
                      <div className="text-[12px]" style={{ color: C.muted }}>{t.guideClass && GUIDE_CLASSES[t.guideClass] ? GUIDE_CLASSES[t.guideClass].label + " · " : ""}DOT licence & certificates</div>
                    </div>
                    <ChevronLeft size={17} color={C.muted} style={{ transform: "rotate(180deg)" }} />
                  </button>
                </div>
              )}
              {self && t.role === "guide" && <GuideLicenseCard talent={t} onSaved={onProfileSaved} />}

              {t.tags && t.tags.length > 0 && (
                <div className="mt-6"><SectionLabel>{t.role === "guide" ? "Specialities" : t.role === "business" ? "What we offer" : "Drives"}</SectionLabel>
                  <div className="flex flex-wrap gap-2">{(t.tags || []).map((x) => <span key={x} className="rounded-full px-3 py-1.5 text-[13.5px] font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{x}</span>)}</div>
                  {t.vehicle && <div className="mt-2.5 text-[13.5px]" style={{ color: C.muted }}><Car size={14} color={C.gold} className="inline mr-1" /> {t.vehicle}</div>}
                </div>
              )}

              {t.languages && t.languages.length > 0 && (
                <div className="mt-6"><SectionLabel>Languages</SectionLabel>
                  <div className="flex flex-wrap gap-2">{(t.languages || []).map((l) => (
                    <span key={l.n} className="inline-flex items-center gap-2 rounded-full pl-3.5 pr-2 py-1.5 text-[13.5px] font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{l.n}<span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: C.goldSoft, color: "#7a5a1e" }}>{l.l}</span></span>
                  ))}</div>
                </div>
              )}

              {located.length > 0 && (
                <div className="mt-6"><SectionLabel trailing={`${located.length} pins`}>Where they've worked</SectionLabel>
                  <BhutanMap readOnly pins={located.map((p) => p.location)} />
                </div>
              )}
            </>
          }
          gallery={
            gallery.length > 0
              ? <PhotoGrid items={gallery} author={t} eng={eng} onShareStory={self ? setShareToStory : null} />
              : <Empty Icon={ImagePlus} title="No photos yet" body="Approved trip photos appear here as a gallery." />
          }
          galleryCount={gallery.length}
        />

      </div>

      {canRequest && !contactOnly && (
        <div className="px-5 mt-6 flex gap-3">
          <button onClick={() => onMessage && onMessage(t.id)} className="tap h-12 px-5 rounded-xl flex items-center justify-center gap-2 text-[14.5px] font-semibold" style={{ background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}><MessageCircle size={18} /> Message</button>
          <button onClick={onRequest} className="tap flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ background: C.pine, color: "#fff", boxShadow: `0 6px 16px ${C.pine}33` }}><Briefcase size={18} /> Send job request</button>
        </div>
      )}

      {self && (
        <>
          <div className="px-5 mt-6"><div className="rounded-xl px-4 py-3 text-[13px] text-center" style={{ background: C.goldSoft, color: "#7a5a1e" }}>This is how operators see your profile.</div></div>
          <div className="px-5 mt-4"><PrivacyPanel talent={t} /></div>
        </>
      )}

      {viewStories && myStories.length > 0 && (
        <StoryViewer stories={myStories} author={t} canDelete={self} onDelete={eng?.deleteStory} onClose={() => setViewStories(false)} />
      )}
      {addStory && <AddStory onClose={() => setAddStory(false)} onAdd={eng?.addStory} />}
      {askOperator && <OperatorInvite user={{ name: t.name, talentId: t.id, id: t.id, kind: t.role }} trip={null} onClose={() => setAskOperator(false)} />}

      {editOpen && <EditProfileSheet talent={t} onClose={() => setEditOpen(false)} onSaved={onProfileSaved} />}
      {credsOpen && <CredentialsPage talent={t} self={self} onClose={() => setCredsOpen(false)} />}
      {listMode && (
        <FollowListSheet mode={listMode} talent={t} eng={eng} onClose={() => setListMode(null)}
          onOpenProfile={(id) => { setListMode(null); onOpenProfile && onOpenProfile(id); }} />
      )}
      {shareToStory && (
        <ConfirmShareStory post={shareToStory} onClose={() => setShareToStory(null)}
          onConfirm={async () => { await eng?.addStory({ kind: "photo", fromPostUrl: shareToStory.media.dataUri, caption: shareToStory.text }); setShareToStory(null); setViewStories(true); }} />
      )}
    </div>
  );
}

/* ============================ Job request form =========================== */
function RequestForm({ talent, operator, onBack, onSend }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [langs, setLangs] = useState([]);
  const [notes, setNotes] = useState("");
  const canSend = title.trim() && start && end;

  const toggle = (l) => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]));

  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <span className="text-[15px] font-semibold" style={{ color: C.ink }}>New job request</span>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-2xl p-3.5 flex items-center gap-3 mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <Avatar initials={talent.initials} size={42} />
          <div><div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{talent.name}</div><div className="text-[12.5px]" style={{ color: C.muted }}>{roleLabel(talent.role)} · {talent.base}</div></div>
        </div>

        <Label>Trip title</Label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 7-day Western Cultural Tour" className="w-full h-12 px-4 rounded-xl text-[15px] mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><Label>Start</Label><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full h-12 px-3.5 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} /></div>
          <div><Label>End</Label><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full h-12 px-3.5 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} /></div>
        </div>

        <Label>Languages needed</Label>
        <div className="flex flex-wrap gap-2 mb-4">{LANG_OPTIONS.map((l) => <Chip key={l} on={langs.includes(l)} onClick={() => toggle(l)}>{l}</Chip>)}</div>

        <Label>Notes</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Group size, route, anything they should know." className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <button onClick={() => canSend && onSend({ operator, toTalentId: talent.id, title: title.trim(), role: talent.role, start, end, languages: langs, notes: notes.trim() })}
          disabled={!canSend} className="tap w-full rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ height: 52, background: canSend ? C.pine : "#C7CEC7", color: "#fff", cursor: canSend ? "pointer" : "not-allowed" }}>
          <Send size={18} /> Send request to {String(talent.name || "them").split(" ")[0]}
        </button>
      </div>
    </div>
  );
}
function Label({ children }) { return <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>{children}</div>; }

/* ============================== Trips + chat ============================== */
function tripStateNow(trip) {
  const end = new Date(trip.end + "T23:59").getTime();
  if (Date.now() > end) return "completed";
  return trip.chat.state; // scheduled | active
}
function TripStateBadge({ state }) {
  const m = {
    scheduled: { bg: C.goldSoft, fg: "#7a5a1e", label: "Opens soon" },
    active: { bg: C.pineSoft, fg: C.pine, label: "Live" },
    completed: { bg: C.bg, fg: C.muted, label: "Completed" },
  }[state];
  return <span className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: m.bg, color: m.fg }}>{m.label}</span>;
}
function CrewAvatars({ members, size = 26 }) {
  return (
    <div className="flex items-center">
      {members.slice(0, 4).map((m, i) => (
        <div key={m.id} className="rounded-lg flex items-center justify-center" style={{ width: size, height: size, background: C.pine, border: `2px solid ${C.card}`, marginLeft: i ? -8 : 0 }}>
          <span className="font-semibold" style={{ color: C.goldSoft, fontSize: size * 0.34 }}>{m.initials}</span>
        </div>
      ))}
    </div>
  );
}

function OperatorDesk({ user, trips, listings, jobs, actions, onOpenProfile, onNavigate }) {
  const me = user.talentId;
  const t = talentById(me) || { id: me, name: user.name || "You", initials: user.initials || "?", role: "operator", tags: [] };
  const todayIso = new Date().toISOString().slice(0, 10);
  const addD = (iso, k) => { const d = new Date(iso + "T00:00"); d.setDate(d.getDate() + k); return d.toISOString().slice(0, 10); };
  const daysTo = (iso) => Math.ceil((new Date(iso + "T00:00") - new Date(todayIso + "T00:00")) / 86400000);
  const fD = (x) => new Date(x + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const myTrips = (trips || []).filter((x) => x.operatorId === me);
  const myListings = (listings || []).filter((l) => l.operatorId === me);
  const myJobs = (jobs || []).filter((j) => j.operatorId === me);

  const [rv, setRv] = useState({ reviews: [], tokens: [] });
  const [inviteTrip, setInviteTrip] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const loadRv = async () => {
    const ids = myTrips.map((x) => x.id);
    if (!ids.length) { setRv({ reviews: [], tokens: [] }); return; }
    const [{ data: R }, { data: T }] = await Promise.all([
      supabase.from("guest_reviews").select("trip_id, rating, body, guest_name, created_at").in("trip_id", ids),
      supabase.from("review_tokens").select("trip_id, token, used_at, expires_at, guest_phone").in("trip_id", ids),
    ]);
    setRv({ reviews: R || [], tokens: T || [] });
  };
  useEffect(() => { loadRv(); }, [myTrips.length]);

  const compAvg = rv.reviews.length ? rv.reviews.reduce((a, r) => a + r.rating, 0) / rv.reviews.length : null;
  const quotes = rv.reviews.filter((r) => r.body && r.body.length > 12)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 2);

  const soon = myTrips.filter((x) => x.start && x.start >= todayIso && x.start <= addD(todayIso, 7));
  const openL = myListings.filter((l) => l.status !== "filled");
  const pendApps = openL.reduce((a, l) => a + (l.applicants || []).filter((ap) => ap.status === "applied").length, 0);
  const pendReq = myJobs.filter((j) => j.status === "pending").length;
  const attention = openL.length + pendApps + pendReq + soon.length;

  const crewMap = {};
  myTrips.slice().sort((a, b) => ((a.start || "") < (b.start || "") ? -1 : 1)).forEach((x) => {
    (x.members || []).forEach((m) => {
      if (m.id === me || m.roleInTrip === "operator") return;
      crewMap[m.id] = { id: m.id, last: x };
    });
  });
  const crew = Object.values(crewMap).map((c) => ({ ...c, p: talentById(c.id) })).filter((c) => c.p);

  const tripReviewRow = (x) => {
    const revs = rv.reviews.filter((r) => r.trip_id === x.id);
    const toks = rv.tokens.filter((k) => k.trip_id === x.id);
    const openTok = toks.find((k) => !k.used_at && (!k.expires_at || k.expires_at > new Date().toISOString()));
    const avg = revs.length ? (revs.reduce((a, r) => a + r.rating, 0) / revs.length).toFixed(1) : null;
    const resend = () => {
      if (!openTok) return;
      const link = `https://www.bhutantourismhub.com/?review=${openTok.token}`;
      const msg = `Kuzuzangpo la! A gentle reminder from ${t.name} — we'd love your review of your Bhutan trip "${x.title}". It takes one minute, no sign-in: ${link}`;
      const num = (openTok.guest_phone || "").replace(/[^0-9]/g, "");
      window.open(num ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    };
    return (
      <div key={x.id} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{x.title}</div>
          <div className="text-[11.5px]" style={{ color: C.muted }}>{x.start ? fD(x.start) : ""}{x.end && x.end !== x.start ? ` \u2013 ${fD(x.end)}` : ""}</div>
        </div>
        {revs.length > 0 ? (
          <span className="text-[12px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: C.pineSoft, color: C.pine }}>
            \u2605 {avg} \u00b7 {revs.length}
          </span>
        ) : openTok ? (
          <button onClick={resend} className="tap text-[12px] font-semibold rounded-full px-3 py-1.5 shrink-0" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
            Awaiting \u00b7 resend
          </button>
        ) : (
          <button onClick={() => setInviteTrip(x)} className="tap text-[12px] font-semibold rounded-full px-3 py-1.5 shrink-0" style={{ background: C.pine, color: "#fff" }}>
            Send invite
          </button>
        )}
      </div>
    );
  };

  const AV = { open: ["Available", C.pine, C.pineSoft], busy: ["On a trip", "#7a5a1e", C.goldSoft] };

  return (
    <div className="px-5 py-4 pb-8">
      {/* header */}
      <div className="flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[19px] font-semibold shrink-0"
          style={{ background: C.pineDeep, color: C.goldSoft }}>{t.initials}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[19px] font-semibold leading-tight truncate" style={{ color: C.ink }}>{t.name}</div>
          {t.handle && <div className="text-[12.5px]" style={{ color: C.muted }}>@{t.handle}</div>}
          <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>Tour operator{t.base ? ` \u00b7 ${t.base}` : ""}</div>
        </div>
      </div>
      <div className="flex gap-2 mt-3.5">
        <button onClick={() => setEditOpen(true)} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Edit profile</button>
        <button onClick={() => onOpenProfile(me)} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>View public profile</button>
      </div>

      {/* attention strip */}
      <div className="mt-6"><SectionLabel>Needs your attention</SectionLabel></div>
      {attention === 0 ? (
        <div className="rounded-xl px-4 py-3.5 text-[13px]" style={{ background: C.pineSoft, color: C.pine }}>
          All clear — nothing is waiting on you right now.
        </div>
      ) : (
        <div className="space-y-2">
          {openL.length > 0 && (
            <button onClick={() => onNavigate("requests")} className="tap w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left"
              style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
              <Briefcase size={16} color={C.gold} />
              <span className="flex-1 text-[13.5px] font-medium" style={{ color: C.ink }}>
                {openL.length} role{openL.length > 1 ? "s" : ""} still hiring{pendApps > 0 ? ` \u00b7 ${pendApps} new applicant${pendApps > 1 ? "s" : ""}` : ""}
              </span>
              <ChevronLeft size={15} color={C.muted} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
          {pendReq > 0 && (
            <button onClick={() => onNavigate("requests")} className="tap w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left"
              style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <SendIcon size={15} color={C.pine} />
              <span className="flex-1 text-[13.5px] font-medium" style={{ color: C.ink }}>{pendReq} direct request{pendReq > 1 ? "s" : ""} awaiting reply</span>
              <ChevronLeft size={15} color={C.muted} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
          {soon.map((x) => (
            <button key={x.id} onClick={() => onNavigate("trips")} className="tap w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left"
              style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <MapIcon size={15} color={C.pine} />
              <span className="flex-1 text-[13.5px] font-medium" style={{ color: C.ink }}>
                {x.title} starts in {daysTo(x.start)} day{daysTo(x.start) === 1 ? "" : "s"}
              </span>
              <ChevronLeft size={15} color={C.muted} style={{ transform: "rotate(180deg)" }} />
            </button>
          ))}
        </div>
      )}

      {/* review command */}
      <div className="mt-6"><SectionLabel>Review command</SectionLabel></div>
      <div className="rounded-2xl px-4 py-4 mb-2.5" style={{ background: C.pine }}>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldSoft }}>Company crew rating</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#ffffffb3" }}>{rv.reviews.length} guest review{rv.reviews.length === 1 ? "" : "s"} across your trips</div>
          </div>
          <div className="text-right">
            <div className="text-[30px] font-semibold leading-none text-white">{compAvg ? compAvg.toFixed(1) : "New"}</div>
            <div className="mt-1 flex justify-end"><Stars score={compAvg || 0} light /></div>
          </div>
        </div>
        {quotes.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {quotes.map((q, i) => (
              <p key={i} className="text-[12.5px] leading-snug" style={{ color: "#ffffffd9" }}>
                \u201c{q.body.length > 90 ? q.body.slice(0, 90) + "\u2026" : q.body}\u201d \u2014 {q.guest_name || "Guest"}
              </p>
            ))}
          </div>
        )}
      </div>
      {myTrips.length === 0 ? (
        <p className="text-[12.5px] py-2" style={{ color: C.muted }}>Your trips appear here once a crew is hired — each with its review status.</p>
      ) : (
        <div className="space-y-2">
          {myTrips.slice().sort((a, b) => ((a.start || "") > (b.start || "") ? -1 : 1)).slice(0, 6).map(tripReviewRow)}
        </div>
      )}

      {/* crew book */}
      <div className="mt-6"><SectionLabel trailing={crew.length ? `${crew.length}` : null}>Crew book</SectionLabel></div>
      {crew.length === 0 ? (
        <p className="text-[12.5px] py-2" style={{ color: C.muted }}>Everyone you hire joins your crew book — with their rating and live availability for quick re-hiring.</p>
      ) : (
        <div className="space-y-2">
          {crew.map(({ p, last }) => {
            const av = AV[p.availability] || AV.open;
            return (
              <button key={p.id} onClick={() => onOpenProfile(p.id)} className="tap w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left"
                style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-semibold shrink-0"
                  style={{ background: C.pineDeep, color: C.goldSoft }}>{p.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{p.name}</div>
                  <div className="text-[11.5px] truncate" style={{ color: C.muted }}>
                    {roleLabel(p.role)}{typeof p.rating === "number" ? ` \u00b7 \u2605 ${p.rating.toFixed(1)}` : ""} \u00b7 last: {last.title}
                  </div>
                </div>
                <span className="text-[11px] font-semibold rounded-full px-2 py-1 shrink-0" style={{ background: av[2], color: av[1] }}>{av[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {inviteTrip && <ReviewInvite user={user} trip={inviteTrip} onClose={() => { setInviteTrip(null); loadRv(); }} />}
      {editOpen && <EditProfileSheet talent={t} onClose={() => setEditOpen(false)} onSaved={actions.reloadDirectory} />}
    </div>
  );
}

function CharacterChart({ talentId }) {
  const [marks, setMarks] = useState(null);
  useEffect(() => {
    let on = true;
    supabase.from("character_marks").select("kind, grade, created_at").eq("profile_id", talentId)
      .then(({ data }) => { if (on) setMarks(data || []); });
    return () => { on = false; };
  }, [talentId]);
  const grades = (marks || []).filter((m) => m.kind === "grade");
  const viol = (marks || []).filter((m) => m.kind === "violation").length;
  const avg = grades.length ? grades.reduce((a, m) => a + m.grade, 0) / grades.length : null;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
      <div className="px-4 py-3.5 flex items-center justify-between" style={{ background: C.pine }}>
        <div>
          <div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldSoft }}>Character chart</div>
          <div className="text-[12.5px] mt-0.5" style={{ color: "#ffffffcc" }}>Graded by operators after every trip</div>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-semibold leading-none text-white">{avg ? avg.toFixed(1) : "New"}</div>
          <div className="mt-1 flex justify-end"><Stars score={avg || 0} light /></div>
        </div>
      </div>
      {viol > 0 && (
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#FBEBEC" }}>
          <X size={13} color={C.maroon} />
          <span className="text-[12.5px] font-semibold" style={{ color: C.maroon }}>
            {viol} no-show violation{viol > 1 ? "s" : ""} reported by operators
          </span>
        </div>
      )}
      <div className="px-4 py-4" style={{ background: C.card }}>
        {marks === null ? (
          <p className="text-[13px]" style={{ color: C.muted }}>Loading…</p>
        ) : grades.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: C.muted }}>
            No grades yet — the operator grades each crew member when a trip completes.
            Signed commitments and kept promises build this chart.
          </p>
        ) : (
          <p className="text-[13.5px]" style={{ color: C.ink }}>
            <b>{grades.length}</b> trip{grades.length > 1 ? "s" : ""} graded — every grade comes from the operator who ran the trip.
          </p>
        )}
      </div>
    </div>
  );
}

function TripCalendar({ user, trips }) {
  const me = user.talentId;
  const isOp = user.kind === "operator";
  const mine = (trips || []).filter((t) => (isOp ? t.operatorId === me : (t.members || []).some((m) => m.id === me)));
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [sel, setSel] = useState(null);
  const [notes, setNotes] = useState([]);
  const [adding, setAdding] = useState(false);
  const [nTitle, setNTitle] = useState("");
  const [nBody, setNBody] = useState("");
  const [nEnd, setNEnd] = useState("");
  const [busy, setBusy] = useState(false);

  const [fests, setFests] = useState([]);
  const load = async () => {
    const { data } = await supabase.from("calendar_notes").select("*").eq("profile_id", me).order("date");
    setNotes(data || []);
    const { data: F } = await supabase.from("festivals").select("*").order("start_date");
    setFests(F || []);
  };
  useEffect(() => { load(); }, [me]);

  // Each trip = one colored ribbon in a stable lane; ribbons stop dead on end day.
  const TRIP_COLORS = ["#1F6B45", "#B8862D", "#7A1F2B", "#2B7A78", "#3D5A80", "#6D4C7D", "#C05B2E"];

  const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const fD = (x) => new Date(x + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const inRange = (day, a, b) => !!a && day >= a && day <= (b || a);
  const tripsOn = (day) => mine.filter((t) => inRange(day, t.start, t.end));
  const notesOn = (day) => notes.filter((x) => inRange(day, x.date, x.end_date));

  const first = new Date(ym.y, ym.m, 1);
  const startPad = first.getDay();
  const dim = new Date(ym.y, ym.m + 1, 0).getDate();
  const monthName = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  const curYm = `${ym.y}-${String(ym.m + 1).padStart(2, "0")}`;
  const monthTrips = mine.filter((t) => t.start && t.start.slice(0, 7) <= curYm && (t.end || t.start).slice(0, 7) >= curYm)
    .sort((a, b) => ((a.start || "") < (b.start || "") ? -1 : 1));
  const tripMeta = {};
  {
    const laneEnds = [];
    monthTrips.forEach((t, i) => {
      let lane = laneEnds.findIndex((e) => e < t.start);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(""); }
      laneEnds[lane] = t.end || t.start;
      tripMeta[t.id] = { color: TRIP_COLORS[i % TRIP_COLORS.length], lane };
    });
  }
  const festsOn = (day) => fests.filter((f) => inRange(day, f.start_date, f.end_date));

  const addNote = async () => {
    if (!nTitle.trim() || !sel || busy) return;
    setBusy(true);
    await supabase.from("calendar_notes").insert({
      profile_id: me, date: sel, end_date: nEnd || null, title: nTitle.trim(), body: nBody.trim() || null,
    });
    setBusy(false); setAdding(false); setNTitle(""); setNBody(""); setNEnd("");
    load();
  };
  const delNote = async (id) => { await supabase.from("calendar_notes").delete().eq("id", id); load(); };

  const shift = (d) => {
    const nm = new Date(ym.y, ym.m + d, 1);
    setYm({ y: nm.getFullYear(), m: nm.getMonth() });
    setSel(null); setAdding(false);
  };

  return (
    <div className="px-5 py-4">
      <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => shift(-1)} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <ChevronLeft size={17} color={C.ink} />
          </button>
          <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{monthName}</div>
          <button onClick={() => shift(1)} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <ChevronLeft size={17} color={C.ink} style={{ transform: "rotate(180deg)" }} />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10.5px] font-semibold py-1" style={{ color: C.muted }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: startPad }).map((_, i) => <div key={"p" + i} />)}
          {Array.from({ length: dim }).map((_, i) => {
            const d = i + 1;
            const day = iso(ym.y, ym.m, d);
            const hasTrip = tripsOn(day).length > 0;
            const hasNote = notesOn(day).length > 0;
            const isSel = sel === day;
            const isToday = day === todayIso;
            const dayTrips = tripsOn(day);
            const hasFest = festsOn(day).length > 0;
            return (
              <button key={d} onClick={() => { setSel(isSel ? null : day); setAdding(false); }}
                className="tap relative h-12 rounded-lg flex flex-col items-center pt-1"
                style={{ border: isSel ? `2px solid ${C.pine}` : isToday ? `1.5px dashed ${C.gold}` : "1.5px solid transparent" }}>
                <span className="text-[12.5px] font-medium leading-none" style={{ color: hasTrip ? C.pine : C.ink }}>{d}</span>
                {hasNote && <span className="absolute rounded-full" style={{ top: 3, right: 4, width: 5, height: 5, background: C.gold }} />}
                {hasFest && <span className="absolute rounded-full" style={{ top: 3, left: 4, width: 5, height: 5, border: `1.5px solid ${C.gold}` }} />}
                <span className="absolute left-0 right-0 flex flex-col" style={{ bottom: 4, gap: 2 }}>
                  {[0, 1, 2].map((lane) => {
                    const tr = dayTrips.find((x) => tripMeta[x.id] && tripMeta[x.id].lane === lane);
                    if (!tr) return <span key={lane} style={{ height: 3 }} />;
                    const m2 = tripMeta[tr.id];
                    const isStart = day === tr.start;
                    const isEnd = day === (tr.end || tr.start);
                    return (
                      <span key={lane} style={{
                        height: 3, background: m2.color,
                        marginLeft: isStart ? 3 : 0, marginRight: isEnd ? 3 : 0,
                        borderTopLeftRadius: isStart ? 3 : 0, borderBottomLeftRadius: isStart ? 3 : 0,
                        borderTopRightRadius: isEnd ? 3 : 0, borderBottomRightRadius: isEnd ? 3 : 0,
                      }} />
                    );
                  })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {monthTrips.length > 0 && (
        <div className="mt-4">
          <SectionLabel trailing={`${monthTrips.length}`}>Trips this month</SectionLabel>
          <div className="space-y-2">
            {monthTrips.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <span className="rounded-full shrink-0" style={{ width: 4, height: 30, background: (tripMeta[t.id] || {}).color || C.pine }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{t.title}</div>
                  <div className="text-[12px]" style={{ color: C.muted }}>{fD(t.start)}{t.end && t.end !== t.start ? ` \u2013 ${fD(t.end)}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        {!sel ? (
          <p className="text-[12.5px] text-center py-3" style={{ color: C.muted }}>Tap a day to see its trips and notes — or to add a note.</p>
        ) : (
          <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-[14px] font-semibold mb-2.5" style={{ color: C.ink }}>
              {new Date(sel + "T00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {festsOn(sel).map((f) => (
              <div key={f.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-2" style={{ background: C.goldSoft }}>
                <Star size={14} color="#7a5a1e" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: "#7a5a1e" }}>{f.name}</div>
                  <div className="text-[11.5px] truncate" style={{ color: "#7a5a1e" }}>{f.place}</div>
                </div>
              </div>
            ))}
            {tripsOn(sel).map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-2"
                style={{ background: `${(tripMeta[t.id] || {}).color || C.pine}14` }}>
                <MapIcon size={15} color={(tripMeta[t.id] || {}).color || C.pine} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: C.pine }}>{t.title}</div>
                  <div className="text-[11.5px]" style={{ color: C.pine }}>{fD(t.start)}{t.end && t.end !== t.start ? ` \u2013 ${fD(t.end)}` : ""}</div>
                </div>
              </div>
            ))}
            {notesOn(sel).map((x) => (
              <div key={x.id} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 mb-2" style={{ background: C.goldSoft }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: "#7a5a1e" }}>{x.title}</div>
                  {x.body && <div className="text-[12px] mt-0.5 leading-snug" style={{ color: "#7a5a1e" }}>{x.body}</div>}
                  {x.end_date && <div className="text-[11px] mt-0.5" style={{ color: "#7a5a1e" }}>until {fD(x.end_date)}</div>}
                </div>
                <button onClick={() => delNote(x.id)} className="tap w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(122,90,30,.12)" }}>
                  <X size={13} color="#7a5a1e" />
                </button>
              </div>
            ))}
            {tripsOn(sel).length === 0 && notesOn(sel).length === 0 && !adding && (
              <p className="text-[12.5px] mb-2" style={{ color: C.muted }}>Nothing on this day yet.</p>
            )}
            {!adding ? (
              <button onClick={() => setAdding(true)} className="tap w-full h-10 rounded-xl text-[13px] font-semibold" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
                + Add a note
              </button>
            ) : (
              <div className="mt-1">
                <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} maxLength={60} placeholder="Title — e.g. Airport pickup, Hotel booked"
                  className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-2" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                <textarea value={nBody} onChange={(e) => setNBody(e.target.value)} rows={2} maxLength={200} placeholder="Details — optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] resize-none mb-2" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px]" style={{ color: C.muted }}>Until (optional)</span>
                  <input type="date" value={nEnd} min={sel} onChange={(e) => setNEnd(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl text-[13px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: nEnd ? C.ink : C.muted }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setAdding(false); setNTitle(""); setNBody(""); setNEnd(""); }}
                    className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
                  <button onClick={addNote} disabled={busy || !nTitle.trim()}
                    className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: nTitle.trim() ? C.pine : "#C7CEC7", color: "#fff" }}>
                    {busy ? "Saving\u2026" : "Save note"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FestivalsDial() {
  const [fests, setFests] = useState(null);
  useEffect(() => {
    supabase.from("festivals").select("*").order("start_date").then(({ data }) => setFests(data || []));
  }, []);
  const fD = (x) => new Date(x + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const todayIso = new Date().toISOString().slice(0, 10);
  const years = [...new Set((fests || []).map((f) => f.start_date.slice(0, 4)))];
  return (
    <div className="px-5 py-4 pb-8">
      <div className="rounded-xl px-3.5 py-3 mb-4 text-[12px] leading-snug" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
        Festival dates follow the Bhutanese lunar calendar as announced by the Department of Tourism —
        always reconfirm close to travel. These days fill hotels and crews fast: plan trips around them.
      </div>
      {fests === null ? (
        <p className="text-[13px] text-center py-6" style={{ color: C.muted }}>Loading…</p>
      ) : years.map((yr) => (
        <div key={yr} className="mb-5">
          <SectionLabel trailing={`${fests.filter((f) => f.start_date.startsWith(yr)).length}`}>{yr} festivals</SectionLabel>
          <div className="space-y-2">
            {(() => { const yf = fests.filter((f) => f.start_date.startsWith(yr)); let lastM = ""; return yf.map((f) => {
              const mm = f.start_date.slice(5, 7);
              const head = mm !== lastM ? ((lastM = mm),
                <div className="text-[11px] font-semibold uppercase tracking-[.08em] pt-2" style={{ color: C.muted }}>
                  {new Date(f.start_date + "T00:00").toLocaleDateString("en-GB", { month: "long" })}
                </div>) : null;
              const upcoming = (f.end_date || f.start_date) >= todayIso;
              const soon = upcoming && f.start_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
              return (<React.Fragment key={f.id}>{head}
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-3"
                  style={{ background: C.card, border: soon ? `1.5px solid ${C.gold}` : `1px solid ${C.line}`, opacity: upcoming ? 1 : 0.55 }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{f.name}</div>
                    <div className="text-[11.5px] truncate" style={{ color: C.muted }}>{f.place}</div>
                  </div>
                  <span className="text-right shrink-0">
                    <span className="text-[12px] font-semibold rounded-full px-2.5 py-1 inline-block"
                      style={{ background: soon ? C.goldSoft : C.bg, color: soon ? "#7a5a1e" : C.muted, border: soon ? "none" : `1px solid ${C.line}` }}>
                      {fD(f.start_date)}{f.end_date && f.end_date !== f.start_date ? ` \u2013 ${fD(f.end_date)}` : ""}
                    </span>
                    {!f.confirmed && <span className="block text-[10px] mt-0.5" style={{ color: C.muted }}>tentative</span>}
                  </span>
                </div>
              </React.Fragment>);
            }); })()}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkHub({ user, jobs, listings, posts, trips, actions, eng, onOpenProfile, onMessage, initialDial }) {
  const [dial, setDial] = useState(initialDial || "hiring");
  useEffect(() => { if (initialDial) setDial(initialDial); }, [initialDial]);
  const isOp = user.kind === "operator";
  const DIALS = [
    { id: "hiring", label: isOp ? "Hiring" : "Jobs" },
    { id: "trips", label: isOp ? "Confirmed trips" : "My trips" },
    { id: "cal", label: "Calendar" },
    { id: "fest", label: "Festivals" },
  ];
  return (
    <div>
      <div className="px-5 pt-4 pb-1">
        <div className="flex gap-2">
          {DIALS.map((d) => (
            <button key={d.id} onClick={() => setDial(d.id)}
              className="tap px-3.5 h-10 rounded-full text-[13px] font-semibold"
              style={dial === d.id
                ? { background: C.pineDeep, color: "#fff" }
                : { background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      {dial === "hiring" && (isOp
        ? <OperatorJobs user={user} jobs={jobs} listings={listings} posts={posts} actions={actions} eng={eng} onOpen={onOpenProfile} />
        : <JobsHub user={user} jobs={jobs} listings={listings} actions={actions} />)}
      {dial === "trips" && <TripsTab user={user} trips={trips} actions={actions} onMessage={onMessage} />}
      {dial === "cal" && <TripCalendar user={user} trips={trips} />}
      {dial === "fest" && <FestivalsDial />}
    </div>
  );
}

function TripsTab({ user, trips, actions, onMessage }) {
  const [openId, setOpenId] = useState(null);
  const meId = user.talentId || user.id;
  const mineId = user.talentId || user.id;
  const mine = trips.filter((tr) => (tr.members || []).some((m) => m.id === mineId) || (tr.operatorId && tr.operatorId === mineId));

  // signatures across my trips: mine (to gate confirmation) + per-trip tallies (operator view)
  const [sigRows, setSigRows] = useState([]);
  useEffect(() => {
    const ids = mine.map((tr) => tr.id);
    if (!ids.length) { setSigRows([]); return; }
    supabase.from("trip_signatures").select("trip_id, profile_id").in("trip_id", ids)
      .then(({ data }) => setSigRows(data || []));
  }, [trips.length, mineId]);
  const iSigned = (tr) => sigRows.some((r) => r.trip_id === tr.id && r.profile_id === mineId);
  const sigTally = (tr) => {
    const crewIds = (tr.members || []).filter((m) => m.roleInTrip !== "operator").map((m) => m.id);
    return { signed: sigRows.filter((r) => r.trip_id === tr.id && crewIds.includes(r.profile_id)).length, total: crewIds.length };
  };

  const todayIso = new Date().toISOString().slice(0, 10);
  const amCrew = (tr) => (tr.members || []).some((m) => m.id === mineId && m.roleInTrip !== "operator");
  const awaiting = mine.filter((tr) => amCrew(tr) && !iSigned(tr) && (!tr.end || tr.end >= todayIso));
  const confirmed = mine.filter((tr) => !awaiting.includes(tr));
  const live = confirmed.filter((tr) => tr.start && tr.start <= todayIso && (tr.end || tr.start) >= todayIso);
  const upcoming = confirmed.filter((tr) => tr.start && tr.start > todayIso);
  const completed = confirmed.filter((tr) => (tr.end || tr.start || "") < todayIso)
    .sort((a, b) => ((a.end || a.start) < (b.end || b.start) ? 1 : -1));

  const open = mine.find((tr) => tr.id === openId);
  if (open) return <TripHub user={user} meId={meId} trip={open} actions={actions} onMessage={onMessage} onBack={() => setOpenId(null)} />;

  const Section = ({ label, list, tone }) => list.length === 0 ? null : (
    <div className="mb-5">
      <SectionLabel trailing={`${list.length}`}>{label}</SectionLabel>
      <div className="space-y-3">
        {list.map((tr) => (
          <TripCard key={tr.id} trip={tr} onOpen={() => setOpenId(tr.id)} tone={tone}
            needsSign={tone === "sign"} tally={tr.operatorId === mineId ? sigTally(tr) : null} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="px-5 py-4">
      {mine.length === 0 ? (
        <Empty Icon={MapIcon} title="No trips yet" body="When a job request is accepted, the trip and its group chat appear here." />
      ) : (
        <>
          <Section label="Awaiting your signature" list={awaiting} tone="sign" />
          <Section label="Live now" list={live} tone="live" />
          <Section label="Upcoming" list={upcoming} />
          <Section label="Completed" list={completed} tone="done" />
        </>
      )}
    </div>
  );
}

function TripCard({ trip, onOpen, tone, needsSign, tally }) {
  const msgs = (trip.chat?.messages || []).filter((m) => m.kind !== "system");
  const border = tone === "sign" ? `1.5px solid ${C.gold}` : tone === "live" ? `1.5px solid ${C.pine}` : `1px solid ${C.line}`;
  return (
    <button onClick={onOpen} className="tap w-full text-left rounded-2xl p-4"
      style={{ background: C.card, border, opacity: tone === "done" ? 0.82 : 1 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{trip.title}</div>
        <TripStateBadge state={tripStateNow(trip)} />
      </div>
      <div className="flex items-center gap-1 text-[12.5px] mt-1" style={{ color: C.muted }}><CalendarCheck size={12} /> {fmtDate(trip.start)} – {fmtDate(trip.end)}</div>
      <div className="flex items-center justify-between mt-3">
        <CrewAvatars members={trip.members} />
        <div className="flex items-center gap-1 text-[12.5px]" style={{ color: C.muted }}><MessageSquare size={13} /> {msgs.length}</div>
      </div>
      {needsSign && (
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 mt-3" style={{ background: C.goldSoft }}>
          <BadgeCheck size={13} color="#7a5a1e" />
          <span className="text-[12px] font-semibold" style={{ color: "#7a5a1e" }}>Sign the tour commitment to confirm this trip</span>
        </div>
      )}
      {tally && tally.total > 0 && (
        <div className="text-[11.5px] mt-2" style={{ color: tally.signed === tally.total ? C.pine : "#9a7a2e" }}>
          {tally.signed}/{tally.total} crew signed the commitment
        </div>
      )}
    </button>
  );
}

function TripHub({ user, meId, trip, actions, onMessage, onBack }) {
  const state = tripStateNow(trip);
  const [inviting, setInviting] = useState(false);
  const isTripOperator = trip.operatorId === meId;
  const [mpEdit, setMpEdit] = useState(false);
  const [mpPlace, setMpPlace] = useState("");
  const [mpNote, setMpNote] = useState("");
  const [mpLat, setMpLat] = useState(null);
  const [mpLng, setMpLng] = useState(null);
  const [mpAcc, setMpAcc] = useState(null);
  const [mpBusy, setMpBusy] = useState(false);
  const [mpErr, setMpErr] = useState(null);
  const openMpEdit = () => {
    setMpPlace(trip.meetingSet ? trip.meetingPoint : "");
    setMpNote(trip.meetingNote || "");
    setMpLat(trip.meetingLat); setMpLng(trip.meetingLng);
    setMpAcc(null); setMpErr(null); setMpEdit(true);
  };
  const mpPin = () => {
    if (!navigator.geolocation) { setMpErr("This phone doesn't share location."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!isValidLatLng(latitude, longitude)) { setMpErr("Couldn't read a valid position."); return; }
        setMpErr(null);
        setMpLat(+latitude.toFixed(6)); setMpLng(+longitude.toFixed(6));
        setMpAcc(Math.round(accuracy || 0));
      },
      () => setMpErr("Location was blocked — allow it in browser settings, or save without a pin."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };
  const mpSave = async () => {
    if (!mpPlace.trim()) { setMpErr("Name the meeting place — e.g. Clock Tower Square, Thimphu."); return; }
    setMpBusy(true); setMpErr(null);
    const { error } = await supabase.from("trips").update({
      meeting_point: mpPlace.trim(),
      meeting_note: mpNote.trim() || null,
      meeting_lat: mpLat, meeting_lng: mpLng,
    }).eq("id", trip.id);
    setMpBusy(false);
    if (error) { setMpErr(error.message || "Couldn't save."); return; }
    setMpEdit(false);
    actions.fetchTrips && actions.fetchTrips();
  };

  // ---- Tour commitment + character marks ----
  const [sigs, setSigs] = useState([]);
  const [tripMarks, setTripMarks] = useState([]);
  const [signName, setSignName] = useState("");
  const [signBusy, setSignBusy] = useState(false);
  const [nsConfirm, setNsConfirm] = useState(null);
  const todayIso2 = new Date().toISOString().slice(0, 10);
  const isCrewMember = (trip.members || []).some((mm) => mm.id === meId && mm.roleInTrip !== "operator");
  const mySigned = sigs.some((sg) => sg.profile_id === meId);
  const loadAccountability = async () => {
    const [{ data: S }, { data: M }] = await Promise.all([
      supabase.from("trip_signatures").select("profile_id, signed_at").eq("trip_id", trip.id),
      supabase.from("character_marks").select("profile_id, kind, grade").eq("trip_id", trip.id),
    ]);
    setSigs(S || []); setTripMarks(M || []);
  };
  useEffect(() => { loadAccountability(); }, [trip.id]);
  const signCommit = async () => {
    if (!signName.trim() || signBusy) return;
    setSignBusy(true);
    const { error } = await supabase.from("trip_signatures").insert({
      trip_id: trip.id, profile_id: meId, signed_name: signName.trim(),
    });
    setSignBusy(false);
    if (!error) { setSignName(""); loadAccountability(); }
  };
  const setGrade = async (pid, g) => {
    await supabase.from("character_marks").upsert(
      { trip_id: trip.id, profile_id: pid, operator_id: meId, kind: "grade", grade: g },
      { onConflict: "trip_id,profile_id,operator_id,kind" });
    loadAccountability();
  };
  const reportNoShow = async (pid) => {
    setNsConfirm(null);
    await supabase.from("character_marks").upsert(
      { trip_id: trip.id, profile_id: pid, operator_id: meId, kind: "violation", grade: null },
      { onConflict: "trip_id,profile_id,operator_id,kind" });
    loadAccountability();
  };
  const [askingOperator, setAskingOperator] = useState(false);
  const tripDone = state === "active" || state === "completed";
  const canInvite = tripDone && (user.kind === "operator" || user.kind === "admin");
  const isTalent = user.kind === "guide" || user.kind === "driver";
  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{trip.title}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{fmtDate(trip.start)} – {fmtDate(trip.end)}</div></div>
        <TripStateBadge state={state} />
      </div>

      <div className="px-5 py-4">
        {isCrewMember && !mySigned && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
            <div className="flex items-center gap-2 mb-2.5">
              <BadgeCheck size={17} color={C.gold} />
              <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>Tour Commitment — signature required</span>
            </div>
            <div className="rounded-xl px-3.5 py-3 text-[12.5px] leading-relaxed mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>
              By signing, I confirm my place on <b>{trip.title}</b> and commit to:
              <br />1. Being present and ready at the meeting point on the start date.
              <br />2. Giving the operator at least 7 days' notice if I must withdraw, so a replacement can be found.
              <br />3. Understanding that a no-show or late cancellation without genuine emergency is recorded as a
              violation on my <b>Character Chart</b> — visible to every operator on this platform — and may affect future hiring.
            </div>
            <input value={signName} onChange={(e) => setSignName(e.target.value)} maxLength={60}
              placeholder="Type your full name to sign"
              className="w-full h-11 px-3.5 rounded-xl text-[15px] mb-2"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontStyle: signName ? "italic" : "normal" }} />
            <button onClick={signCommit} disabled={signBusy || !signName.trim()}
              className="tap w-full h-11 rounded-xl text-[14px] font-semibold"
              style={{ background: signName.trim() ? C.pine : "#C7CEC7", color: "#fff" }}>
              {signBusy ? "Signing…" : "Sign the commitment"}
            </button>
            <p className="text-[11px] mt-2 leading-snug" style={{ color: C.muted }}>
              The meeting point unlocks once you sign. Your typed name and the timestamp are stored as your signature.
            </p>
          </div>
        )}
        {isCrewMember && mySigned && (
          <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 mb-4" style={{ background: C.pineSoft }}>
            <BadgeCheck size={15} color={C.pine} />
            <span className="text-[12.5px] font-medium" style={{ color: C.pine }}>Tour commitment signed</span>
          </div>
        )}
        {(!isCrewMember || mySigned) && (<>
        <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${trip.meetingSet ? C.line : C.gold}` }}>
          <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: C.ink }}>
            <MapPin size={15} color={C.gold} /> <span className="flex-1">Meeting point</span>
            {isTripOperator && !mpEdit && (
              <button onClick={openMpEdit} className="tap text-[12.5px] font-semibold" style={{ color: C.pine }}>{trip.meetingSet ? "Edit" : "Set"}</button>
            )}
          </div>

          {!mpEdit && (
            <>
              <div className="text-[13.5px] mt-1" style={{ color: trip.meetingSet ? C.ink : C.muted, fontWeight: trip.meetingSet ? 600 : 400 }}>{trip.meetingPoint}</div>
              {trip.meetingNote ? <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>{trip.meetingNote}</div> : null}
              {isValidLatLng(trip.meetingLat, trip.meetingLng) && (
                <button onClick={() => window.open(`https://www.google.com/maps?q=${trip.meetingLat},${trip.meetingLng}`, "_blank", "noopener")}
                  className="tap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 mt-2 text-[12.5px] font-semibold"
                  style={{ background: C.pineSoft, color: C.pine }}>
                  Open in Google Maps <ExternalLink size={12} />
                </button>
              )}
            </>
          )}

          {mpEdit && (
            <div className="mt-2.5">
              <input value={mpPlace} onChange={(e) => setMpPlace(e.target.value)} maxLength={80}
                placeholder="Place — e.g. Clock Tower Square, Thimphu"
                className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-2" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              <input value={mpNote} onChange={(e) => setMpNote(e.target.value)} maxLength={120}
                placeholder="Note — e.g. 7:30 AM, white Coaster bus · optional"
                className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-2" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              <div className="flex items-center gap-2 mb-2">
                <button onClick={mpPin} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                  style={{ background: C.pineSoft, color: C.pine }}>
                  <NavIcon size={14} /> {isValidLatLng(mpLat, mpLng) ? "Re-pin my location" : "Pin my exact location"}
                </button>
                {isValidLatLng(mpLat, mpLng) && (
                  <button onClick={() => { setMpLat(null); setMpLng(null); setMpAcc(null); }} className="tap h-10 px-3 rounded-xl text-[12.5px] font-semibold"
                    style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>Remove pin</button>
                )}
              </div>
              {isValidLatLng(mpLat, mpLng) && (
                <p className="text-[12px] mb-2" style={{ color: C.pine }}>Pinned ✓ {mpLat}, {mpLng}{mpAcc != null ? ` · ±${mpAcc}m` : ""} — crew get a one-tap Google Maps button.</p>
              )}
              {mpErr && <p className="text-[12.5px] mb-2" style={{ color: C.maroon }}>{mpErr}</p>}
              <div className="flex gap-2">
                <button onClick={() => setMpEdit(false)} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
                <button onClick={mpSave} disabled={mpBusy || !mpPlace.trim()} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: mpPlace.trim() ? C.pine : "#C7CEC7", color: "#fff" }}>{mpBusy ? "Saving…" : "Save"}</button>
              </div>
            </div>
          )}
        </div>
        </>)}

        {canInvite && (
          <button onClick={() => setInviting(true)}
            className="tap w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left"
            style={{ background: C.pineSoft, border: `1px solid ${C.pine}33` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
              <Star size={18} color={C.goldSoft} fill={C.goldSoft} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ color: C.pine }}>Ask a guest for a review</div>
              <div className="text-[12.5px] mt-0.5" style={{ color: C.pine, opacity: .8 }}>
                Creates a one-time link. Best shared face to face on the last day.
              </div>
            </div>
            <ChevronLeft size={17} color={C.pine} style={{ transform: "rotate(180deg)" }} />
          </button>
        )}

        {isTalent && tripDone && (
          <button onClick={() => setAskingOperator(true)}
            className="tap w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left"
            style={{ background: C.goldSoft, border: `1px solid ${C.gold}33` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.gold }}>
              <Star size={18} color="#fff" fill="#fff" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ color: "#7a5a1e" }}>Get a review for this trip</div>
              <div className="text-[12.5px] mt-0.5 leading-snug" style={{ color: "#7a5a1e", opacity: .85 }}>
                Ask {trip.operator || "your operator"} to send your guests a review link.
              </div>
            </div>
            <ChevronLeft size={17} color="#7a5a1e" style={{ transform: "rotate(180deg)" }} />
          </button>
        )}

        {inviting && <ReviewInvite user={user} trip={trip} onClose={() => setInviting(false)} />}
        {askingOperator && <OperatorInvite user={user} trip={trip} onClose={() => setAskingOperator(false)} />}

        {isTripOperator && (trip.members || []).some((mm) => mm.roleInTrip !== "operator") && (
          <p className="text-[11.5px] mb-2" style={{ color: C.muted }}>
            {sigs.filter((sg) => (trip.members || []).some((mm) => mm.id === sg.profile_id && mm.roleInTrip !== "operator")).length}
            /{(trip.members || []).filter((mm) => mm.roleInTrip !== "operator").length} crew have signed the tour commitment
          </p>
        )}

        <SectionLabel>Crew</SectionLabel>
        <div className="rounded-2xl divide-y mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
          {(trip.members || []).map((m) => {
            const mp = m.id === meId ? null : talentById(m.id)?.phone;
            const dial = mp ? dialNumber(mp) : null;
            const sigSigned = sigs.some((sg) => sg.profile_id === m.id);
            const myGrade = (tripMarks.find((k2) => k2.profile_id === m.id && k2.kind === "grade") || {}).grade || 0;
            const hasViolation = tripMarks.some((k2) => k2.profile_id === m.id && k2.kind === "violation");
            const showOps = isTripOperator && m.roleInTrip !== "operator";
            return (
              <div key={m.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar initials={m.initials} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{m.name}</div>
                  <div className="text-[12px] capitalize" style={{ color: C.muted }}>{String(m.roleInTrip || "crew").replace("_", " ")}{dial ? ` · ${dial}` : ""}</div>
                </div>
                {m.id === meId ? (
                  <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: C.goldSoft, color: "#7a5a1e" }}>You</span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onMessage && (
                      <button onClick={() => onMessage(m.id)} className="tap w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: C.bg, border: `1px solid ${C.line}` }} aria-label={`Message ${m.name}`}>
                        <MessageCircle size={15} color={C.ink} />
                      </button>
                    )}
                    {dial && (
                      <a href={`tel:${dial}`} className="tap w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: C.pineSoft, border: `1px solid ${C.line}` }} aria-label={`Call ${m.name}`}>
                        <PhoneCall size={15} color={C.pine} />
                      </a>
                    )}
                    {dial && (
                      <a href={`https://wa.me/${dial.replace("+", "")}`} target="_blank" rel="noreferrer"
                        className="tap w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(37,211,102,.13)", border: "1px solid rgba(37,211,102,.45)" }} aria-label={`WhatsApp ${m.name}`}>
                        <MessageCircle size={15} color="#1FA855" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              {m.roleInTrip !== "operator" && !sigSigned && (
                <div className="text-[10.5px] font-semibold mt-1" style={{ color: "#9a7a2e", marginLeft: 48 }}>Commitment not signed yet</div>
              )}
              {showOps && trip.start <= todayIso2 && (
                <div className="flex items-center gap-3 mt-2" style={{ marginLeft: 48 }}>
                  {trip.end && trip.end < todayIso2 && (
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((g) => (
                        <button key={g} onClick={() => setGrade(m.id, g)} className="tap p-0.5" aria-label={`Grade ${g}`}>
                          <Star size={15} color={g <= myGrade ? C.gold : C.line} fill={g <= myGrade ? C.gold : "none"} />
                        </button>
                      ))}
                    </span>
                  )}
                  {hasViolation ? (
                    <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: "#FBEBEC", color: C.maroon }}>No-show reported</span>
                  ) : nsConfirm === m.id ? (
                    <button onClick={() => reportNoShow(m.id)} className="tap text-[11px] font-semibold rounded-full px-2.5 py-1"
                      style={{ background: C.maroon, color: "#fff" }}>Confirm no-show report</button>
                  ) : (
                    <button onClick={() => setNsConfirm(m.id)} className="tap text-[11px] font-semibold rounded-full px-2.5 py-1"
                      style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.maroon }}>No-show?</button>
                  )}
                </div>
              )}
              </div>
            );
          })}
        </div>

        {trip.itinerary.length > 0 && (
          <>
            <SectionLabel>Itinerary</SectionLabel>
            <div className="space-y-2 mb-5">
              {(trip.itinerary || []).map((it) => (
                <div key={it.day} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}><span className="text-[12px] font-bold" style={{ color: C.goldSoft }}>{it.day}</span></div>
                  <span className="text-[14px] font-medium" style={{ color: C.ink }}>{it.title}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <SectionLabel>Group chat</SectionLabel>
        <div className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}><MessageSquare size={17} color={C.goldSoft} /></div>
          <div className="flex-1 text-[13.5px]" style={{ color: C.muted }}>Crew chat for this trip lives in <b style={{ color: C.ink }}>Messages</b>.</div>
        </div>
      </div>
    </div>
  );
}

function Chat({ user, meId, trip, state, actions }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState(null);
  const inputRef = useRef();
  const scrollRef = useRef();

  const member = (id) => (trip.members || []).find((m) => m.id === id);
  const flash = (msg) => { setNote(msg); setTimeout(() => setNote(null), 2600); };

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [trip.chat.messages.length]);

  const send = () => {
    if (!text.trim() || state !== "active") return;
    actions.postChat(trip.id, { id: uid(), senderId: meId, kind: "text", body: text.trim(), photo: null, ts: Date.now() });
    setText("");
  };
  const pickPhoto = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    if (f.size > 6 * 1024 * 1024) return flash("That image is over 6 MB.");
    const r = new FileReader();
    r.onload = () => actions.postChat(trip.id, { id: uid(), senderId: meId, kind: "photo", body: null, photo: r.result, ts: Date.now() });
    r.readAsDataURL(f);
  };
  const exportChat = () => {
    const keep = (trip.chat?.messages || []).filter((m) => m.kind === "text" || m.kind === "photo");
    const bundle = {
      trip: { title: trip.title, start: trip.start, end: trip.end, meetingPoint: trip.meetingPoint },
      crew: (trip.members || []).map((m) => ({ name: m.name, role: m.roleInTrip })),
      exportedAt: new Date().toISOString(),
      note: "Text and photos only. Voice and video are shared live and never saved.",
      messages: keep.map((m) => ({ from: member(m.senderId)?.name || "Unknown", kind: m.kind, text: m.body || null, photo: m.photo || null, at: new Date(m.ts).toISOString() })),
    };
    try {
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `trip-${String(trip.title || "trip").replace(/\s+/g, "-").toLowerCase()}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      flash(`Exported ${keep.length} messages to your device.`);
    } catch { flash("Export isn't available in this preview."); }
  };

  const disabled = state !== "active";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
      {state === "scheduled" && (
        <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: C.goldSoft }}>
          <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "#7a5a1e" }}><Clock size={14} /> Chat opens 3 days before departure.</div>
          <button onClick={() => actions.openChat(trip.id)} className="tap text-[12px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.pine, color: "#fff" }}>Open now</button>
        </div>
      )}
      {state === "completed" && (
        <div className="px-4 py-3 flex items-center gap-2 text-[12.5px]" style={{ background: C.bg, color: C.muted }}><Clock size={14} /> Trip complete — chat is read-only. Export it to keep it.</div>
      )}

      {/* messages */}
      <div ref={scrollRef} className="hidescroll px-3.5 py-3 space-y-2.5 overflow-y-auto" style={{ background: C.bg, maxHeight: "44vh", scrollbarWidth: "none" }}>
        {(trip.chat?.messages || []).map((m) => {
          if (m.kind === "system") return <div key={m.id} className="text-center"><span className="text-[11.5px] rounded-full px-2.5 py-1" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>{m.body}</span></div>;
          const mine = m.senderId === meId;
          const who = member(m.senderId);
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div style={{ maxWidth: "80%" }}>
                {!mine && <div className="text-[11px] font-semibold mb-0.5 ml-1" style={{ color: C.muted }}>{who?.name?.split(" ")[0]}</div>}
                <div className="rounded-2xl px-3 py-2" style={{ background: mine ? C.pine : C.card, border: mine ? "none" : `1px solid ${C.line}`, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4 }}>
                  {m.kind === "photo"
                    ? <img src={m.photo} alt="" className="rounded-lg block" style={{ maxHeight: 200, objectFit: "cover" }} />
                    : <span className="text-[14px] leading-snug" style={{ color: mine ? "#fff" : C.ink }}>{m.body}</span>}
                </div>
                <div className={`text-[10.5px] mt-0.5 ${mine ? "text-right mr-1" : "ml-1"}`} style={{ color: C.muted }}>{relTime(m.ts)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {note && <div className="px-4 py-2 text-[12px] text-center" style={{ background: "#111", color: "#fff" }}>{note}</div>}

      {/* composer */}
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: C.card, borderTop: `1px solid ${C.line}` }}>
        <button onClick={() => inputRef.current?.click()} disabled={disabled} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.goldSoft, opacity: disabled ? 0.5 : 1 }}><ImagePlus size={17} color={C.gold} /></button>
        <input ref={inputRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} disabled={disabled}
          placeholder={disabled ? "Chat isn't open yet" : "Message the crew…"} className="flex-1 h-10 px-3.5 rounded-full text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
        <button onClick={() => flash("Voice is shared live only — not saved to the trip.")} disabled={disabled} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.bg, border: `1px solid ${C.line}`, opacity: disabled ? 0.5 : 1 }}><Mic size={16} color={C.muted} /></button>
        <button onClick={() => flash("Video is shared live only — not saved to the trip.")} disabled={disabled} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.bg, border: `1px solid ${C.line}`, opacity: disabled ? 0.5 : 1 }}><VideoIcon size={16} color={C.muted} /></button>
        <button onClick={send} disabled={disabled || !text.trim()} className="tap w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: !disabled && text.trim() ? C.pine : "#C7CEC7" }}><Send size={17} color="#fff" /></button>
      </div>

      {/* footer */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: C.card, borderTop: `1px solid ${C.lineSoft}` }}>
        <span className="text-[11.5px]" style={{ color: C.muted }}>Photos kept · voice & video live-only</span>
        <button onClick={exportChat} className="tap inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: C.pine }}><Download size={14} /> Export</button>
      </div>
    </div>
  );
}

/* ============================== Jobs board =============================== */
function Segmented({ options, value, onChange, small }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(([k, l]) => {
        const on = value === k;
        return (
          <button key={k} onClick={() => onChange(k)} className="tap rounded-full font-semibold"
            style={{ padding: small ? "6px 12px" : "8px 14px", fontSize: small ? 12 : 13, background: on ? C.pine : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? "#fff" : C.ink }}>{l}</button>
        );
      })}
    </div>
  );
}

function ShortNotice() {
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0" style={{ background: C.maroonSoft, color: C.maroon }}><Clock size={11} strokeWidth={2.6} /> Short notice</span>;
}

function AppStatusBadge({ status }) {
  const m = {
    applied: { bg: C.goldSoft, fg: "#7a5a1e", label: "Applied" },
    shortlisted: { bg: "#E7EEF6", fg: "#2b5a8a", label: "Shortlisted" },
    hired: { bg: C.pineSoft, fg: C.pine, label: "Hired" },
    declined: { bg: C.maroonSoft, fg: C.maroon, label: "Not selected" },
  }[status];
  return <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: m.bg, color: m.fg }}>{m.label}</span>;
}

/* ---- Talent: jobs hub ---- */
function JobsHub({ user, jobs, listings, actions }) {
  const [sub, setSub] = useState("board");
  const t = talentById(user.talentId);
  const open = listings.filter((l) => l.status === "open" && (l.role === user.kind || l.role === "both"));
  const notApplied = open.filter((l) => !(l.applicants || []).some((a) => a.talentId === t.id));
  const applied = listings.filter((l) => (l.applicants || []).some((a) => a.talentId === t.id));
  const invitesPending = jobs.filter((j) => j.toTalentId === t.id && j.status === "pending").length;
  return (
    <div>
      <div className="px-5 pt-4 pb-1">
        <Segmented value={sub} onChange={setSub} options={[
          ["board", `Find work${notApplied.length ? ` · ${notApplied.length}` : ""}`],
          ["invites", `Invites${invitesPending ? ` · ${invitesPending}` : ""}`],
          ["applied", `Applied${applied.length ? ` · ${applied.length}` : ""}`],
        ]} />
      </div>
      {sub === "board" && <OpenBoard talent={t} listings={open} onApply={actions.applyToListing} />}
      {sub === "invites" && <JobsInbox user={user} jobs={jobs} onSet={actions.setJobStatus} />}
      {sub === "applied" && <MyApplications talent={t} listings={applied} />}
    </div>
  );
}

function OpenBoard({ talent, listings, onApply }) {
  const sorted = [...listings].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || new Date(a.start) - new Date(b.start));
  if (!sorted.length) return <div className="px-5 pt-3 pb-4"><Empty Icon={Briefcase} title="No open jobs right now" body="New jobs that match your role show up here — worth checking back." /></div>;
  return <div className="px-5 pt-3 pb-4 space-y-3">{sorted.map((l) => <ListingCard key={l.id} listing={l} talent={talent} onApply={onApply} />)}</div>;
}

function ListingCard({ listing, talent, onApply }) {
  const applied = (listing.applicants || []).some((a) => a.talentId === talent.id);
  const [applying, setApplying] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${listing.urgent ? "#e6c9c4" : C.line}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{listing.title}</div>
        {listing.urgent && <ShortNotice />}
      </div>
      <div className="text-[13px] mt-1" style={{ color: C.muted }}>{listing.operator}</div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Pill Icon={CalendarCheck}>{fmtDate(listing.start)} – {fmtDate(listing.end)}</Pill>
        {(listing.languages || []).map((l) => <Pill key={l}>{l}</Pill>)}
      </div>
      {listing.notes && <p className="text-[13.5px] leading-snug mt-3" style={{ color: C.ink }}>{listing.notes}</p>}

      {applied ? (
        <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ background: C.pineSoft, color: C.pine }}><Check size={15} strokeWidth={2.6} /> Applied</div>
      ) : applying ? (
        <div className="mt-3.5 fade">
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} maxLength={200} placeholder="Add a short note (optional)"
            className="w-full px-3.5 py-2.5 rounded-xl text-[14px] resize-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setApplying(false)} className="tap flex-1 h-10 rounded-xl text-[13.5px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
            <button onClick={() => onApply(listing.id, { talentId: talent.id, name: talent.name, initials: talent.initials, rating: talent.rating, message: msg.trim() })}
              className="tap flex-[2] h-10 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#fff" }}><Send size={15} /> Apply now</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setApplying(true)} className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2 mt-3.5" style={{ background: C.pine, color: "#fff" }}><Briefcase size={17} /> Apply</button>
      )}
    </div>
  );
}

function MyApplications({ talent, listings }) {
  if (!listings.length) return <div className="px-5 pt-3 pb-4"><Empty Icon={Briefcase} title="No applications yet" body="Jobs you apply to from Find work will be tracked here." /></div>;
  return (
    <div className="px-5 pt-3 pb-4 space-y-3">
      {listings.map((l) => {
        const a = (l.applicants || []).find((x) => x.talentId === talent.id);
        return (
          <div key={l.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-start justify-between gap-3">
              <div><div className="text-[14.5px] font-semibold leading-snug" style={{ color: C.ink }}>{l.title}</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>{l.operator}</div></div>
              <AppStatusBadge status={a.status} />
            </div>
            <div className="flex flex-wrap gap-2 mt-2.5"><Pill Icon={CalendarCheck}>{fmtDate(l.start)} – {fmtDate(l.end)}</Pill></div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Operator: jobs hub ---- */
function OperatorJobs({ user, jobs, listings, posts, actions, eng, onOpen }) {
  const myId = user.talentId || user.id;
  const [sub, setSub] = useState("open");
  const [posting, setPosting] = useState(false);
  const [manageId, setManageId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const mine = listings.filter((l) => (l.operatorId ? l.operatorId === myId : l.operator === user.name));
  const manage = mine.find((l) => l.id === manageId);
  const openCount = mine.filter((l) => l.status === "open").length;

  if (profileId) return <TalentProfile talent={talentById(profileId)} posts={posts} eng={eng} canRequest onBack={() => setProfileId(null)} />;
  if (posting) return <ListingForm operator={user.name} onBack={() => setPosting(false)} onPost={(l) => { actions.postListing(l); setPosting(false); setSub("open"); }} />;
  if (manage) return <ManageApplicants listing={manage} actions={actions} onViewProfile={setProfileId} onBack={() => setManageId(null)} />;

  return (
    <div>
      <div className="px-5 pt-4 pb-1">
        <Segmented value={sub} onChange={setSub} options={[["open", `Open jobs${openCount ? ` · ${openCount}` : ""}`], ["direct", "Direct requests"]]} />
      </div>
      {sub === "open" && <OperatorListings listings={mine} onPost={() => setPosting(true)} onManage={setManageId} />}
      {sub === "direct" && <SentRequests operator={user.name} operatorId={myId} jobs={jobs} onOpen={onOpen} />}
    </div>
  );
}

function OperatorListings({ listings, onPost, onManage }) {
  return (
    <div className="px-5 pt-3 pb-4">
      <button onClick={onPost} className="tap w-full h-12 rounded-xl text-[14.5px] font-semibold inline-flex items-center justify-center gap-2 mb-4" style={{ background: C.pine, color: "#fff", boxShadow: `0 6px 16px ${C.pine}33` }}>
        <span className="text-[18px] leading-none">+</span> Post a job
      </button>
      {listings.length === 0 ? (
        <Empty Icon={Briefcase} title="No open jobs" body="Post a job and any qualified guide or driver can apply." />
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const pending = (l.applicants || []).filter((a) => a.status === "applied").length;
            return (
              <button key={l.id} onClick={() => onManage(l.id)} className="tap w-full text-left rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{l.title}</div>
                  {l.urgent && <ShortNotice />}
                </div>
                <div className="flex flex-wrap gap-2 mt-2.5"><Pill Icon={CalendarCheck}>{fmtDate(l.start)} – {fmtDate(l.end)}</Pill><Pill>{roleLabel(l.role)}</Pill></div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <span className="text-[13px] font-medium" style={{ color: l.applicants.length ? C.pine : C.muted }}>
                    {l.applicants.length} applicant{l.applicants.length === 1 ? "" : "s"}{pending ? ` · ${pending} new` : ""}
                  </span>
                  <span className="text-[12px] font-semibold rounded-full px-2 py-0.5" style={{ background: l.status === "open" ? C.pineSoft : C.bg, color: l.status === "open" ? C.pine : C.muted }}>{l.status === "open" ? "Open" : l.status === "filled" ? "Filled" : "Closed"}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ManageApplicants({ listing, actions, onViewProfile, onBack }) {
  const isBoth = listing.role === "both";
  const [side, setSide] = useState("guide");
  const all = (listing.applicants || []).map((a) => ({ ...a, _role: talentById(a.talentId)?.role }));
  const guideApps = all.filter((a) => a._role === "guide");
  const driverApps = all.filter((a) => a._role === "driver");
  const shown = isBoth ? (side === "guide" ? guideApps : driverApps) : all;
  const gHired = guideApps.some((a) => a.status === "hired");
  const dHired = driverApps.some((a) => a.status === "hired");
  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{listing.title}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{fmtDate(listing.start)} – {fmtDate(listing.end)} · {listing.applicants.length} applicant{listing.applicants.length === 1 ? "" : "s"}</div></div>
      </div>

      {isBoth && (
        <div className="px-5 pt-4">
          <Segmented value={side} onChange={setSide}
            options={[["guide", `Guides (${guideApps.length})${gHired ? " \u2713" : ""}`], ["driver", `Drivers (${driverApps.length})${dHired ? " \u2713" : ""}`]]} />
          {(gHired || dHired) && !(gHired && dHired) && (
            <p className="text-[12px] mt-2" style={{ color: C.muted }}>{gHired ? "Guide hired \u2014 now pick the driver to complete the pair." : "Driver hired \u2014 now pick the guide to complete the pair."}</p>
          )}
        </div>
      )}

      <div className="px-5 py-4">
        {shown.length === 0 ? (
          <Empty Icon={Briefcase} title="No applicants yet" body="Guides and drivers who match will see this job and can apply." />
        ) : (
          <div className="space-y-3">
            {shown.map((a) => (
              <div key={a.talentId} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <Avatar initials={a.initials} size={44} />
                  <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold" style={{ color: C.ink }}>{a.name}</div>
                    <div className="inline-flex items-center gap-1 mt-0.5"><Star size={12} color={C.gold} fill={C.gold} /><span className="text-[12.5px] font-semibold" style={{ color: "#7a5a1e" }}>{typeof a.rating === "number" ? a.rating.toFixed(1) : "New"}</span></div></div>
                  {a.status !== "applied" && <AppStatusBadge status={a.status} />}
                </div>
                {a.message && <p className="text-[13.5px] leading-snug mt-3" style={{ color: C.ink }}>“{a.message}”</p>}
                {(() => {
                  const p = talentById(a.talentId);
                  if (!p) return null;
                  return (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <AvailabilityChip talent={p} />
                        {p.verified && <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold rounded-full px-2 py-1" style={{ background: C.pineSoft, color: C.pine }}><BadgeCheck size={12} /> Verified</span>}
                        {p.years > 0 && <span className="text-[11.5px] rounded-full px-2 py-1" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{p.years} yrs</span>}
                        {p.base && <span className="text-[11.5px] rounded-full px-2 py-1" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{p.base}</span>}
                      </div>
                      {p.languages?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {(p.languages || []).slice(0, 4).map((l) => <span key={l.n} className="text-[11px] rounded-md px-1.5 py-0.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{l.n}</span>)}
                        </div>
                      )}
                      <button onClick={() => onViewProfile(a.talentId)} className="tap w-full h-10 rounded-xl text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5"
                        style={{ background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}>
                        <User size={15} /> View full profile & reviews
                      </button>
                    </div>
                  );
                })()}
                {a.status === "applied" && (
                  <div className="flex gap-2.5 mt-3">
                    <button onClick={() => actions.setApplicant(listing.id, a.talentId, "declined")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.card, border: `1.5px solid ${C.maroon}`, color: C.maroon }}><X size={17} /> Decline</button>
                    <button onClick={() => actions.hireApplicant(listing, a)} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#fff" }}><Check size={17} /> Hire</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingForm({ operator, onBack, onPost }) {
  const [title, setTitle] = useState("");
  const [needGuide, setNeedGuide] = useState(true);
  const [needDriver, setNeedDriver] = useState(false);
  const role = needGuide && needDriver ? "both" : needDriver ? "driver" : "guide";
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [langs, setLangs] = useState([]);
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const toggle = (l) => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]));
  const canPost = title.trim() && start && end && (needGuide || needDriver);
  const submit = () => {
    if (!canPost) return;
    const soon = new Date(start + "T00:00").getTime() - 3 * 86400e3 < Date.now();
    onPost({ operator, title: title.trim(), role, start, end, languages: langs, notes: notes.trim(), urgent: urgent || soon });
  };
  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <span className="text-[15px] font-semibold" style={{ color: C.ink }}>Post a job</span>
      </div>
      <div className="px-5 py-4">
        <Label>Trip title</Label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Guide for 5-day cultural tour" className="w-full h-12 px-4 rounded-xl text-[15px] mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <Label>Who do you need? Turn on one or both</Label>
        <div className="flex gap-2.5 mb-1.5">
          {[["Guide", needGuide, setNeedGuide, Compass], ["Driver", needDriver, setNeedDriver, Car]].map(([lbl, on, set, Ic]) => (
            <button key={lbl} onClick={() => set((v) => !v)} className="tap flex-1 rounded-xl p-3 flex items-center gap-2.5"
              style={{ background: on ? C.pineSoft : C.card, border: `1.5px solid ${on ? C.pine : C.line}` }}>
              <Ic size={18} color={on ? C.pine : C.muted} />
              <span className="flex-1 text-left text-[14px] font-semibold" style={{ color: on ? C.pine : C.muted }}>{lbl}</span>
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: on ? C.pine : C.card, border: `1.5px solid ${on ? C.pine : C.line}` }}>{on && <Check size={12} color="#fff" strokeWidth={3} />}</span>
            </button>
          ))}
        </div>
        <p className="text-[12px] mb-4" style={{ color: C.muted }}>{role === "both" ? "One post, one trip: hire a guide\u2013driver pair together." : "Applicants will be " + (role === "guide" ? "guides" : "drivers") + " only."}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><Label>Start</Label><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full h-12 px-3.5 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} /></div>
          <div><Label>End</Label><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full h-12 px-3.5 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} /></div>
        </div>

        <Label>Languages needed</Label>
        <div className="flex flex-wrap gap-2 mb-4">{LANG_OPTIONS.map((l) => <Chip key={l} on={langs.includes(l)} onClick={() => toggle(l)}>{l}</Chip>)}</div>

        <Label>Notes</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Group size, route, anything applicants should know." className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <button onClick={() => setUrgent((u) => !u)} className="tap w-full rounded-xl p-3.5 flex items-center gap-3 mb-5" style={{ background: C.card, border: `1px solid ${urgent ? C.maroon : C.line}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.maroonSoft }}><Clock size={17} color={C.maroon} /></div>
          <div className="flex-1 text-left"><div className="text-[14px] font-semibold" style={{ color: C.ink }}>Short notice</div><div className="text-[12.5px]" style={{ color: C.muted }}>Highlight to available talent. Auto-on within 3 days.</div></div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: urgent ? C.maroon : C.card, border: `1.5px solid ${urgent ? C.maroon : C.line}` }}>{urgent && <Check size={13} color="#fff" strokeWidth={3} />}</div>
        </button>

        <button onClick={submit} disabled={!canPost} className="tap w-full rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ height: 52, background: canPost ? C.pine : "#C7CEC7", color: "#fff", cursor: canPost ? "pointer" : "not-allowed" }}><Send size={18} /> Post job</button>
      </div>
    </div>
  );
}

/* ============================== Bhutan map =============================== */
const BT = { W: 88.6994, E: 92.1706, N: 28.385, S: 26.645 };
const BT_VBW = (BT.E - BT.W) * 100;
const BT_VBH = (BT.N - BT.S) * 100;
const btX = (lng) => (lng - BT.W) * 100;
const btY = (lat) => (BT.N - lat) * 100;
const btPctX = (lng) => ((lng - BT.W) / (BT.E - BT.W)) * 100;
const btPctY = (lat) => ((BT.N - lat) / (BT.N - BT.S)) * 100;

const BT_BORDER = [
  [89.00, 28.16], [89.55, 28.30], [90.10, 28.12], [90.75, 28.14], [91.30, 28.08], [91.75, 27.92], [91.95, 27.65],
  [92.08, 27.35], [92.02, 27.12], [91.80, 26.86], [91.40, 26.79], [90.95, 26.82], [90.45, 26.86], [89.95, 26.80],
  [89.58, 26.73], [89.34, 26.85], [89.12, 27.08], [88.90, 27.26], [88.80, 27.55], [88.83, 27.86], [88.95, 28.05],
];
const BT_PLACES = [
  { n: "Thimphu", lat: 27.47, lng: 89.64 }, { n: "Paro", lat: 27.43, lng: 89.42 },
  { n: "Punakha", lat: 27.59, lng: 89.87 }, { n: "Wangdue", lat: 27.49, lng: 89.90 },
  { n: "Haa", lat: 27.39, lng: 89.28 }, { n: "Gangtey", lat: 27.46, lng: 90.18 },
  { n: "Trongsa", lat: 27.50, lng: 90.51 }, { n: "Bumthang", lat: 27.55, lng: 90.75 },
  { n: "Mongar", lat: 27.27, lng: 91.24 }, { n: "Trashigang", lat: 27.33, lng: 91.55 },
  { n: "Lhuentse", lat: 27.67, lng: 91.18 }, { n: "S. Jongkhar", lat: 26.80, lng: 91.50 },
  { n: "Gelephu", lat: 26.87, lng: 90.49 }, { n: "Phuentsholing", lat: 26.86, lng: 89.39 },
];
const BT_LABELS = ["Paro", "Thimphu", "Punakha", "Bumthang", "Trashigang", "Phuentsholing"];
const btBorderPath = BT_BORDER.map(([lng, lat]) => `${btX(lng).toFixed(1)},${btY(lat).toFixed(1)}`).join(" ");

const BT_MAP_AR = 2.1722;

// Iconic photography viewpoints — selecting one fills exact coordinates + a description.
const VIEWPOINTS = [
  { n: "Tiger's Nest (Paro Taktsang)", lat: 27.4917, lng: 89.3639, d: "Cliffside monastery on a 900 m granite face — the classic Bhutan shot, best in morning light." },
  { n: "Dochula Pass (108 Chortens)", lat: 27.4903, lng: 89.7511, d: "108 chortens on a ridge with a Himalayan panorama on clear winter mornings." },
  { n: "Punakha Dzong", lat: 27.5852, lng: 89.8615, d: "Fortress at the meeting of the Pho and Mo rivers; lilac jacaranda in spring." },
  { n: "Punakha Suspension Bridge", lat: 27.5980, lng: 89.8880, d: "One of Bhutan’s longest footbridges, strung with prayer flags over the Po Chhu." },
  { n: "Chele La Pass", lat: 27.3670, lng: 89.3450, d: "Bhutan’s highest motorable pass (~3,988 m); prayer flags and views toward Jomolhari." },
  { n: "Rinpung Dzong (Paro)", lat: 27.4256, lng: 89.4200, d: "Classic whitewashed fortress above Paro town and its valley." },
  { n: "Buddha Dordenma (Thimphu)", lat: 27.4442, lng: 89.6375, d: "51 m gilded Buddha above Thimphu — glows at golden hour." },
  { n: "Tashichho Dzong (Thimphu)", lat: 27.4894, lng: 89.6353, d: "Riverside seat of government, beautifully floodlit at dusk." },
  { n: "Gangtey / Phobjikha Valley", lat: 27.4600, lng: 90.1800, d: "Glacial valley and winter home of black-necked cranes; sweeping meadows." },
  { n: "Trongsa Dzong", lat: 27.5030, lng: 90.5070, d: "Bhutan’s largest dzong, dramatic on its ridge above the gorge." },
  { n: "Jakar Dzong (Bumthang)", lat: 27.5460, lng: 90.7520, d: "The ‘castle of the white bird’ over the Chamkhar valley." },
  { n: "Haa Valley", lat: 27.3870, lng: 89.2820, d: "Quiet alpine valley near the Tibetan border, framed by pine ridges." },
];

// Read GPS coordinates from a JPEG photo's EXIF metadata (no dependencies).
async function readExifGps(file) {
  try {
    if (!file || !/jpe?g/i.test(file.type)) return null;
    const view = new DataView(await file.arrayBuffer());
    if (view.getUint16(0) !== 0xFFD8) return null;
    let off = 2; const len = view.byteLength;
    while (off < len) {
      const marker = view.getUint16(off);
      if (marker === 0xFFE1) {
        if (view.getUint32(off + 4) === 0x45786966) return parseExifGps(view, off + 10);
      }
      if ((marker & 0xFF00) !== 0xFF00) break;
      off += 2 + view.getUint16(off + 2);
    }
    return null;
  } catch (e) { return null; }
}

function parseExifGps(view, tiff) {
  const little = view.getUint16(tiff) === 0x4949;
  const u16 = (o) => view.getUint16(o, little);
  const u32 = (o) => view.getUint32(o, little);
  if (u16(tiff + 2) !== 0x002A) return null;
  const ifd0 = tiff + u32(tiff + 4);
  let gps = 0;
  const n0 = u16(ifd0);
  for (let i = 0; i < n0; i++) { const e = ifd0 + 2 + i * 12; if (u16(e) === 0x8825) { gps = tiff + u32(e + 8); break; } }
  if (!gps) return null;
  const rat = (e, count) => { const v = tiff + u32(e + 8); const out = []; for (let i = 0; i < count; i++) { const num = u32(v + i * 8), den = u32(v + i * 8 + 4); out.push(den ? num / den : 0); } return out; };
  let latRef, lngRef, lat, lng, altRef = 0, alt = null, bearing = null, dateStamp = null;
  const n = u16(gps);
  for (let i = 0; i < n; i++) {
    const e = gps + 2 + i * 12, tag = u16(e);
    if (tag === 1) latRef = String.fromCharCode(view.getUint8(e + 8));
    else if (tag === 3) lngRef = String.fromCharCode(view.getUint8(e + 8));
    else if (tag === 2) lat = rat(e, 3);
    else if (tag === 4) lng = rat(e, 3);
    else if (tag === 5) altRef = view.getUint8(e + 8);          // 0 above sea level, 1 below
    else if (tag === 6) { const a = rat(e, 1); alt = a && a[0] != null ? a[0] : null; }
    else if (tag === 17) { const b = rat(e, 1); bearing = b && b[0] != null ? b[0] : null; }  // direction the camera faced
    else if (tag === 29) {                                       // GPS date stamp, "YYYY:MM:DD"
      try {
        const off = tiff + u32(e + 8);
        let str = "";
        for (let k = 0; k < 10; k++) str += String.fromCharCode(view.getUint8(off + k));
        dateStamp = str;
      } catch (err) {}
    }
  }
  if (!lat || !lng) return null;
  const dec = (d) => d[0] + d[1] / 60 + d[2] / 3600;
  let la = dec(lat), lo = dec(lng);
  if (latRef === "S") la = -la;
  if (lngRef === "W") lo = -lo;
  // Zeroed or impossible GPS tags mean "no location" — 0,0 is Null Island in the
  // Atlantic, where every broken GPS reading on earth ends up. Never a real photo.
  if (!isFinite(la) || !isFinite(lo)) return null;
  if (Math.abs(la) < 0.0005 && Math.abs(lo) < 0.0005) return null;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  return {
    lat: +la.toFixed(6), lng: +lo.toFixed(6),
    altitude: alt != null ? Math.round(altRef === 1 ? -alt : alt) : null,
    bearing: bearing != null ? Math.round(bearing) : null,
    takenOn: dateStamp && /^\d{4}:\d{2}:\d{2}$/.test(dateStamp) ? dateStamp.replace(/:/g, "-") : null,
  };
}

// Is this coordinate inside Bhutan? (small margin for border areas)
function insideBhutan(lat, lng) {
  const m = 0.05;
  return lat >= BT.S - m && lat <= BT.N + m && lng >= BT.W - m && lng <= BT.E + m;
}

// Roughly how far apart, in km
function kmBetween(aLat, aLng, bLat, bLng) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function isValidLatLng(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    && !(Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001);   // 0,0 = Null Island = broken GPS
}

function placeLabel(loc) {
  if (!loc) return "";
  if (loc.outside || !insideBhutan(loc.lat, loc.lng)) return `Outside Bhutan (${Number(loc.lat).toFixed(3)}\u00b0, ${Number(loc.lng).toFixed(3)}\u00b0)`;
  if (!loc.place) return "Pinned in Bhutan";
  return loc.source === "viewpoint" ? loc.place : `Near ${loc.place}`;
}

function nearestPlace(lat, lng) {
  if (!insideBhutan(lat, lng)) return null;         // never guess a Bhutanese name abroad
  let best = null, bd = Infinity;
  for (const p of BT_PLACES) {
    const d = kmBetween(lat, lng, p.lat, p.lng);
    if (d < bd) { bd = d; best = p; }
  }
  // only name it if genuinely close — otherwise say nothing rather than mislead
  return best && bd <= 25 ? best.n : null;
}

function BhutanMap({ value, onPick, readOnly, pins, showMeta }) {
  const ref = useRef();
  const points = pins || (value ? [value] : []);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const pressTimer = useRef(null);
  const pinchStart = useRef(null);
  const moved = useRef(false);

  const toLatLng = (clientX, clientY) => {
    const r = ref.current.getBoundingClientRect();
    // account for the current zoom so a tap lands where the user sees it
    const fxView = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const fyView = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    const fx = Math.min(1, Math.max(0, origin.x / 100 + (fxView - origin.x / 100) / zoom));
    const fy = Math.min(1, Math.max(0, origin.y / 100 + (fyView - origin.y / 100) / zoom));
    return { lat: BT.N - fy * (BT.N - BT.S), lng: BT.W + fx * (BT.E - BT.W) };
  };

  const handleTap = (e) => {
    if (moved.current) { moved.current = false; return; }
    if (readOnly || !onPick) return;
    const { lat, lng } = toLatLng(e.clientX, e.clientY);
    onPick({ lat: +lat.toFixed(6), lng: +lng.toFixed(6), place: nearestPlace(lat, lng) });
  };

  // long press to zoom in at that point; long press again to zoom out
  const startPress = (e) => {
    const t = e.touches ? e.touches[0] : e;
    if (e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      pinchStart.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom };
      clearTimeout(pressTimer.current);
      return;
    }
    const r = ref.current.getBoundingClientRect();
    const ox = ((t.clientX - r.left) / r.width) * 100;
    const oy = ((t.clientY - r.top) / r.height) * 100;
    pressTimer.current = setTimeout(() => {
      moved.current = true;
      setOrigin({ x: ox, y: oy });
      setZoom((z) => (z > 1.6 ? 1 : 3));
      if (navigator.vibrate) navigator.vibrate(12);
    }, 420);
  };

  const movePress = (e) => {
    if (e.touches && e.touches.length === 2 && pinchStart.current) {
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const next = Math.min(6, Math.max(1, pinchStart.current.zoom * (d / pinchStart.current.dist)));
      setZoom(next);
      moved.current = true;
      return;
    }
    clearTimeout(pressTimer.current);
  };

  const endPress = () => { clearTimeout(pressTimer.current); pinchStart.current = null; };

  const zoomed = zoom > 1.02;

  const outsideBT = points.length === 1 && points[0] && !insideBhutan(points[0].lat, points[0].lng);

  if (outsideBT) {
    const pt = points[0];
    return (
      <div className="relative">
        <div className="rounded-xl overflow-hidden flex flex-col items-center justify-center text-center px-5 py-7"
          style={{ background: C.card, border: `1px dashed ${C.line}`, aspectRatio: BT_MAP_AR }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.goldSoft }}>
            <NavIcon size={22} color={C.gold} />
          </div>
          <div className="text-[14px] font-semibold" style={{ color: C.ink }}>Outside Bhutan</div>
          <p className="text-[12.5px] leading-snug mt-1 mb-3" style={{ color: C.muted }}>
            This location isn't on the Bhutan map. View it on Google Maps instead.
          </p>
          <div className="text-[11.5px] font-mono mb-3" style={{ color: C.muted }}>
            {Number(pt.lat).toFixed(5)}, {Number(pt.lng).toFixed(5)}
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${pt.lat},${pt.lng}`} target="_blank" rel="noreferrer"
            className="tap inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold"
            style={{ background: C.pine, color: "#fff" }}>
            <ExternalLink size={14} /> Open in Google Maps
          </a>
        </div>
        {showMeta && <LocationMeta loc={pt} />}
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={ref}
        onClick={handleTap}
        onTouchStart={startPress} onTouchMove={movePress} onTouchEnd={endPress}
        onMouseDown={startPress} onMouseMove={movePress} onMouseUp={endPress} onMouseLeave={endPress}
        className="relative rounded-xl overflow-hidden select-none"
        style={{ aspectRatio: BT_MAP_AR, background: "#eef1ee", cursor: readOnly ? "default" : "crosshair", touchAction: "none" }}>

        <div className="absolute inset-0" style={{
          transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: pinchStart.current ? "none" : "transform .45s cubic-bezier(.22,.61,.36,1)",
        }}>
          <img src={mapImg} alt="Relief map of Bhutan" draggable="false"
            className="absolute inset-0 w-full h-full pointer-events-none" style={{ objectFit: "cover" }} />

          {points.map((pt, i) => (
            <div key={i} className="absolute pointer-events-none"
              style={{ left: `${btPctX(pt.lng)}%`, top: `${btPctY(pt.lat)}%`, transform: `translate(-50%, -100%) scale(${1 / Math.max(1, zoom * 0.75)})`, transformOrigin: "50% 100%" }}>
              <MapPin size={pins && pins.length > 1 ? 20 : 26} color={C.maroon} fill={C.maroon} strokeWidth={1.4}
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" }} />
              {pt.bearing != null && (
                <div className="absolute left-1/2 top-0" style={{ transform: `translate(-50%,-118%) rotate(${pt.bearing}deg)` }}>
                  <NavIcon size={13} color={C.pine} fill={C.pine} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.35))" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {zoomed && (
          <button onClick={(e) => { e.stopPropagation(); moved.current = true; setZoom(1); }}
            className="tap absolute top-2 right-2 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}>
            {Number(zoom || 1).toFixed(1)}× · reset
          </button>
        )}

        {!zoomed && !readOnly && (
          <span className="absolute bottom-2 left-2 rounded-full px-2 py-1 text-[10.5px]"
            style={{ background: "rgba(0,0,0,.45)", color: "#fff" }}>Tap to pin · long press to zoom</span>
        )}
        {!zoomed && readOnly && points.length > 0 && (
          <span className="absolute bottom-2 left-2 rounded-full px-2 py-1 text-[10.5px]"
            style={{ background: "rgba(0,0,0,.45)", color: "#fff" }}>Long press or pinch to zoom</span>
        )}
      </div>

      {showMeta && points.length === 1 && points[0] && (
        <LocationMeta loc={points[0]} />
      )}
    </div>
  );
}

function LocationMeta({ loc }) {
  const rows = [
    ["Coordinates", `${Number(loc.lat).toFixed(6)}, ${Number(loc.lng).toFixed(6)}`],
    loc.altitude != null ? ["Elevation", `${loc.altitude} m`] : null,
    loc.bearing != null ? ["Camera faced", `${loc.bearing}° ${compassName(loc.bearing)}`] : null,
    loc.takenOn ? ["Taken on", loc.takenOn] : null,
    ["Region", insideBhutan(loc.lat, loc.lng) ? (loc.place || "Bhutan") : "Outside Bhutan"],
    ["Source", loc.source === "photo" ? "Photo GPS metadata"
      : loc.source === "viewpoint" ? "Chosen viewpoint" : "Pinned on the map"],
  ].filter(Boolean);

  return (
    <div className="mt-2 rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      {rows.map(([k, v], i) => (
        <div key={k} className="flex items-center justify-between px-3.5 py-2"
          style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
          <span className="text-[12px]" style={{ color: C.muted }}>{k}</span>
          <span className="text-[12px] font-medium" style={{ color: C.ink, fontFamily: k === "Coordinates" ? "monospace" : "inherit" }}>{v}</span>
        </div>
      ))}
      <a href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`} target="_blank" rel="noreferrer"
        className="tap flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-semibold"
        style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.pine }}>
        <ExternalLink size={13} /> Open in Google Maps
      </a>
    </div>
  );
}

function compassName(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

function PostLocation({ location, showMap }) {
  if (!location) return null;
  const outside = location.outside || !insideBhutan(location.lat, location.lng);
  const valid = isValidLatLng(location.lat, location.lng);
  const openMaps = () => window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, "_blank", "noopener");
  return (
    <div className="mt-2.5">
      {outside && valid ? (
        <button onClick={openMaps} className="tap inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium"
          style={{ background: C.goldSoft, color: "#7a5a1e" }}>
          <MapPin size={13} color={C.gold} /> {Number(location.lat).toFixed(4)}°, {Number(location.lng).toFixed(4)}° · Google Maps <ExternalLink size={11} />
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
          <MapPin size={13} color={C.gold} /> {placeLabel(location)}
        </span>
      )}
      {location.description && <p className="text-[12.5px] leading-snug mt-1.5" style={{ color: C.muted }}>{location.description}</p>}
      {showMap && !outside && <div className="mt-2.5"><BhutanMap readOnly value={location} showMeta /></div>}
    </div>
  );
}

/* ============================ Post engagement ============================ */
function PostEngagement({ post, eng }) {
  const { likes, comments, me, isAdmin, toggleLike, addComment, deleteComment } = eng;
  const postLikes = likes.filter((l) => l.post_id === post.id);
  const liked = postLikes.some((l) => l.liker_id === me);
  const list = comments.filter((c) => c.post_id === post.id);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [note, setNote] = useState(null);

  const [sharing, setSharing] = useState(false);
  const shareExternal = async () => {
    const line = `${actorName(post.talentId)} on Bhutan Tourism Hub${post.text ? `: “${post.text}”` : ""}`;
    const url = window.location.origin;
    try {
      if (navigator.share) { await navigator.share({ title: "Bhutan Tourism Hub", text: line, url }); }
      else { await navigator.clipboard.writeText(`${line}\n${url}`); setNote("Link copied"); setTimeout(() => setNote(null), 2000); }
    } catch (e) {}
  };
  const share = () => setSharing(true);
  const send = () => { const t = text.trim(); if (!t) return; addComment(post.id, me, t); setText(""); setOpen(true); };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
      <div className="flex items-center gap-5">
        <button onClick={() => toggleLike(post.id, me)} className="tap inline-flex items-center gap-1.5" aria-label="Like">
          <Heart size={18} color={liked ? C.maroon : C.muted} fill={liked ? C.maroon : "transparent"} strokeWidth={2} />
          {postLikes.length > 0 && <span className="text-[13px] font-semibold" style={{ color: liked ? C.maroon : C.muted }}>{postLikes.length}</span>}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="tap inline-flex items-center gap-1.5" aria-label="Comments">
          <MessageCircle size={18} color={open ? C.pine : C.muted} strokeWidth={2} />
          {list.length > 0 && <span className="text-[13px] font-semibold" style={{ color: C.muted }}>{list.length}</span>}
        </button>
        <button onClick={share} className="tap inline-flex items-center gap-1.5 ml-auto" aria-label="Share">
          <Share2 size={17} color={C.muted} strokeWidth={2} />
        </button>
      </div>
      {note && <div className="text-[12px] mt-1.5" style={{ color: C.pine }}>{note}</div>}
      {sharing && (
        <SharePostSheet post={post} eng={eng} onExternal={shareExternal}
          onClose={() => setSharing(false)}
          onSent={(n) => { setNote(`Sent to ${n} ${n === 1 ? "person" : "people"}`); setTimeout(() => setNote(null), 2600); }} />
      )}

      {open && (
        <div className="mt-3 space-y-2.5 fade">
          {list.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar initials={actorInitials(c.author_id)} size={28} />
              <div className="flex-1 rounded-xl px-3 py-2" style={{ background: C.bg }}>
                <div className="flex items-baseline gap-2">
                  <span className="text-[12.5px] font-semibold" style={{ color: C.ink }}>{actorName(c.author_id)}</span>
                  <span className="text-[10.5px]" style={{ color: C.muted }}>{relTime(c.ts)}</span>
                  {isAdmin && (
                    <button onClick={() => deleteComment(c.id)} className="ml-auto tap" aria-label="Delete comment">
                      <Trash2 size={13} color={C.maroon} />
                    </button>
                  )}
                </div>
                <p className="text-[13.5px] leading-snug mt-0.5" style={{ color: C.ink }}>{c.body}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} maxLength={240}
              placeholder={"Reply…"} className="flex-1 h-10 px-3.5 rounded-full text-[13.5px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            <button onClick={send} disabled={!text.trim()} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: text.trim() ? C.pine : "#C7CEC7" }} aria-label="Send reply">
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============== Map cinema (square · zoom → reveal → fullscreen) ============== */
function MapCinema({ location, photo }) {
  const S = 3;
  const fH = 1 / BT_MAP_AR;                    // map height inside the square (letterboxed)
  const padY = (1 - fH) / 2;
  const px = btPctX(location.lng);
  const py = (padY + (btPctY(location.lat) / 100) * fH) * 100;
  const [phase, setPhase] = useState(0);        // 0 full map · 1 zoomed · 2 photo
  const [full, setFull] = useState(false);
  const ref = useRef(); const started = useRef(false); const timer = useRef();

  const start = () => {
    if (started.current) return;
    started.current = true;
    setPhase(1);
    if (photo) timer.current = setTimeout(() => setPhase(2), 1500);
  };
  useEffect(() => {
    let io; const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) start();
    else {
      io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { start(); io.disconnect(); } }, { threshold: 0.3 });
      io.observe(el);
    }
    return () => { if (io) io.disconnect(); clearTimeout(timer.current); };
  }, []);

  const zoomed = phase >= 1;
  const showPhoto = phase === 2;
  const onTap = () => {
    if (!photo || !started.current) return;
    if (showPhoto) setFull(true); else setPhase(2);
  };

  return (
    <>
      <div ref={ref} onClick={onTap} className="relative rounded-xl overflow-hidden select-none"
        style={{ aspectRatio: "1 / 1", background: "#e8eae5", cursor: photo ? "pointer" : "default", border: `1px solid ${C.line}` }}>
        <div className="absolute inset-0"
          style={{ transform: zoomed ? `translate(${50 - px}%, ${50 - py}%) scale(${S})` : "none", transformOrigin: `${px}% ${py}%`, transition: "transform 1.4s cubic-bezier(.22,.61,.36,1)" }}>
          <img src={mapImg} alt="" draggable="false" className="absolute inset-0 w-full h-full" style={{ objectFit: "contain" }} />
        </div>

        <div className="absolute pointer-events-none"
          style={{ left: zoomed ? "50%" : `${px}%`, top: zoomed ? "50%" : `${py}%`, transform: "translate(-50%, -100%)",
            transition: "left 1.4s cubic-bezier(.22,.61,.36,1), top 1.4s cubic-bezier(.22,.61,.36,1), opacity .4s", opacity: showPhoto ? 0 : 1 }}>
          <MapPin size={26} color={C.maroon} fill={C.maroon} strokeWidth={1.4} style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,.35))" }} />
        </div>

        {photo && (
          <img src={photo} alt="" className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", opacity: showPhoto ? 1 : 0, transform: showPhoto ? "scale(1)" : "scale(1.06)", transition: "opacity .7s ease, transform .9s ease", pointerEvents: "none" }} />
        )}

        <div className="absolute left-2.5 bottom-2.5 flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", opacity: zoomed ? 1 : 0, transition: "opacity .6s .5s" }}>
          <MapPin size={12} color="#fff" />
          <span className="text-[11.5px] font-semibold text-white">{location.place ? (location.source === "viewpoint" ? location.place : `Near ${location.place}`) : "Bhutan"}</span>
        </div>

        {photo && showPhoto && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setPhase(1); }} className="tap absolute right-2.5 top-2.5 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.5)" }} aria-label="Show location on map">
              <MapIcon size={15} color="#fff" />
            </button>
            <div className="absolute right-2.5 bottom-2.5 w-7 h-7 rounded-full flex items-center justify-center pointer-events-none" style={{ background: "rgba(0,0,0,.45)" }}>
              <Maximize2 size={13} color="#fff" />
            </div>
          </>
        )}
      </div>
      {full && <Lightbox src={photo} onClose={() => setFull(false)} />}
    </>
  );
}

function Lightbox({ src, onClose }) {
  return createPortal((
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(8,10,8,.96)", zIndex: 210 }} onClick={onClose}>
      <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.15)" }} aria-label="Close">
        <X size={20} color="#fff" />
      </button>
      <div className="absolute bottom-5 left-0 right-0 text-center text-[12px]" style={{ color: "rgba(255,255,255,.55)" }}>Tap anywhere to close</div>
    </div>
  ), document.body);
}

/* ====================== Profile gallery (Instagram grid) ================== */
function PhotoGrid({ items, author, eng, onShareStory }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <>
      <div className="overflow-hidden" style={{ marginLeft: -20, marginRight: -20 }}>
        <div className="grid grid-cols-3 gap-[2px]" style={{ background: C.line }}>
          {items.map((p, i) => {
            const likes = (eng?.likes || []).filter((l) => l.post_id === p.id).length;
            const comments = (eng?.comments || []).filter((c) => c.post_id === p.id).length;
            return (
              <button key={p.id} onClick={() => setOpenIdx(i)} className="relative overflow-hidden group" style={{ aspectRatio: "1 / 1", background: C.bg }} aria-label="Open post">
                <img src={p.media.dataUri} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
                {p.location && (
                  <span className="absolute left-1 top-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.45)" }}>
                    <MapPin size={10} color="#fff" />
                  </span>
                )}
                {p.media?.slides?.length > 1 && (
                  <span className="absolute right-1 top-1 text-[9.5px] font-bold rounded px-1.5 py-0.5" style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}>
                    {p.media.slides.length}
                  </span>
                )}
                {(likes > 0 || comments > 0) && (
                  <span className="absolute left-1 right-1 bottom-1 flex items-center justify-center gap-2.5 rounded-md py-0.5" style={{ background: "rgba(0,0,0,.42)" }}>
                    {likes > 0 && <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-white"><Heart size={10} color="#fff" fill="#fff" /> {likes}</span>}
                    {comments > 0 && <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-white"><MessageCircle size={10} color="#fff" /> {comments}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {openIdx != null && (
        <PostDetail items={items} index={openIdx} author={author} eng={eng} onShareStory={onShareStory} onClose={() => setOpenIdx(null)} />
      )}
    </>
  );
}

/* ============ Post wall — full posts, scrollable, opens at a tile ========== */
function PostDetail({ items, index, author, eng, onShareStory, onClose }) {
  const scroller = useRef(null);
  const refs = useRef({});

  // jump to the tapped post on open, without animation
  useEffect(() => {
    const el = refs.current[items[index]?.id];
    if (el && scroller.current) scroller.current.scrollTop = el.offsetTop;
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: C.bg, zIndex: 200, height: "100dvh", paddingBottom: "calc(62px + var(--sa-bottom))" }}>
      <div ref={scroller} className="flex-1 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        <div className="h-14 px-3 flex items-center gap-3" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}` }} aria-label="Back">
            <ChevronLeft size={19} color={C.ink} />
          </button>
          <div className="flex-1">
            <div className="text-[15px] font-semibold" style={{ color: C.ink }}>Posts</div>
            <div className="text-[11.5px]" style={{ color: C.muted }}>{author?.name || "Member"} · {items.length}</div>
          </div>
        </div>
        {items.map((p) => (
          <div key={p.id} ref={(el) => { refs.current[p.id] = el; }} style={{ borderBottom: `8px solid ${C.bg}` }}>
            <WallPost post={p} author={author} eng={eng} onShareStory={onShareStory} onClose={onClose} />
          </div>
        ))}
        <div className="py-10 text-center text-[12.5px]" style={{ color: C.muted }}>You're all caught up</div>
      </div>
    </div>
  ), document.body);
}

function WallPost({ post: p, author, eng, onShareStory, onClose }) {
  const [showMap, setShowMap] = useState(false);
  return (
    <div style={{ background: C.card }}>
      {/* author */}
      <div className="px-4 py-3 flex items-center gap-3">
        <Avatar initials={author?.initials || "?"} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold" style={{ color: C.ink }}>{author?.name || "Member"}</span>
            {author?.verified && <BadgeCheck size={14} color={C.pine} />}
          </div>
          <div className="text-[11.5px]" style={{ color: C.muted }}>{relTime(p.createdAt)}</div>
        </div>
      </div>

      <MediaCarousel media={p.media} />

      <div className="px-4 pt-3 pb-4">
        {p.text && <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{p.text}</p>}

        {p.location && (
          <div className="mt-2.5">
            <button onClick={() => setShowMap((v) => !v)} className="tap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
              <MapPin size={13} color={C.gold} />
              {placeLabel(p.location)}
            </button>
            {p.location.description && <p className="text-[12.5px] leading-snug mt-2" style={{ color: C.muted }}>{p.location.description}</p>}
            {showMap && <div className="mt-2.5"><BhutanMap readOnly value={p.location} showMeta /></div>}
          </div>
        )}

        {onShareStory && (
          <button onClick={() => { onShareStory(p); onClose && onClose(); }} className="tap w-full h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-2 mt-3"
            style={{ background: C.goldSoft, color: "#7a5a1e" }}>
            <Plus size={14} strokeWidth={3} /> Share to your story
          </button>
        )}

        {eng ? <PostEngagement post={p} eng={eng} /> : (
          <div className="mt-3 pt-3 text-[12.5px]" style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.muted }}>Sign in to like, comment or share.</div>
        )}
      </div>
    </div>
  );
}

/* ===================== Profile tabs (swipeable CV / Gallery) ===================== */
function ProfileTabs({ cv, gallery, galleryCount }) {
  const [tab, setTab] = useState(0);           // 0 = Posts · 1 = Reviews
  const startX = useRef(null);
  const startY = useRef(null);
  const locked = useRef(false);

  const onStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    startX.current = t.clientX; startY.current = t.clientY; locked.current = false;
  };
  const onMove = (e) => {
    if (startX.current == null) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX.current, dy = t.clientY - startY.current;
    if (!locked.current && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4) locked.current = true;
  };
  const onEnd = (e) => {
    if (startX.current == null) return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - startX.current;
    // only switch on a deliberate horizontal drag; a tap (tiny dx) always reaches the tile
    if (locked.current && Math.abs(dx) > 60) setTab(dx < 0 ? 1 : 0);   // left = Reviews, right = Posts
    startX.current = null; locked.current = false;
  };

  const TABS = [{ label: "Posts", Icon: ImagePlus, count: galleryCount }, { label: "Portfolio", Icon: Award }];

  return (
    <div className="mt-5">
      {/* tab bar */}
      <div className="relative flex" style={{ borderBottom: `1px solid ${C.line}`, background: C.bg }}>
        {TABS.map((x, i) => {
          const on = tab === i;
          return (
            <button key={x.label} onClick={() => setTab(i)} className="tap flex-1 pb-2.5 flex items-center justify-center gap-1.5">
              <x.Icon size={16} color={on ? C.pine : C.muted} strokeWidth={on ? 2.4 : 2} />
              <span className="text-[14px] font-semibold" style={{ color: on ? C.pine : C.muted }}>{x.label}</span>
              {x.count > 0 && <span className="text-[11px] font-bold rounded-full px-1.5 py-0.5" style={{ background: on ? C.pine : C.lineSoft, color: on ? "#fff" : C.muted }}>{x.count}</span>}
            </button>
          );
        })}
        <div className="absolute bottom-0 h-[2.5px] rounded-full"
          style={{ background: C.pine, width: "50%", left: tab === 0 ? "0%" : "50%", transition: "left .28s cubic-bezier(.22,.61,.36,1)" }} />
      </div>

      {/* panes — only the active one is rendered, so taps always hit the right thing */}
      <div className="overflow-hidden" onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
        <div key={tab} className="pt-4 fade">{tab === 0 ? gallery : cv}</div>
      </div>
    </div>
  );
}

/* ============================ Admin · Users console ============================ */
const SUPA_PROJECT_URL = "https://supabase.com/dashboard/project/nxnsdnayzimzfiwjrkvv";

function AdminUsers({ onChanged, currentAdminId }) {
  const [rows, setRows] = useState(null);      // null = loading
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | submitted | verified | guide | driver | operator
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState(null);
  const [openId, setOpenId] = useState(null);

  const flash = (m) => { setNote(m); setTimeout(() => setNote(null), 2600); };

  const load = async () => {
    if (!CLOUD) { setRows([]); return; }
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) { flash("Couldn't load users."); setRows([]); return; }
    const { data: vault } = await supabase.from("profile_emails").select("profile_id, email");
    const emailById = {};
    (vault || []).forEach((v) => { emailById[v.profile_id] = v.email; });
    setRows((data || []).map((r) => ({ ...r, email: r.email || emailById[r.id] || null })));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    setBusyId(id);
    auditLog(currentAdminId, `licence.${status}`, id);
    const { error } = await supabase.from("profiles").update({ license_status: status }).eq("id", id);
    setBusyId(null);
    if (error) { flash("Update failed — check the admin policy is applied."); return; }
    setRows((R) => R.map((r) => (r.id === id ? { ...r, license_status: status } : r)));
    flash(status === "verified" ? "Verified." : status === "rejected" ? "Rejected." : "Updated.");
    onChanged && onChanged();
  };

  const removeUser = async (u) => {
    setBusyId(u.id);
    auditLog(currentAdminId, "user.delete", u.id, u.email);
    // remove their content first so nothing is orphaned, then the profile
    { const { error: _e } = await supabase.from("post_comments").delete().eq("author_id", u.id); if (_e) console.error("post_comments.adminPurge failed:", _e.message); }
    await supabase.from("post_likes").delete().eq("liker_id", u.id);
    await supabase.from("posts").delete().eq("talent_id", u.id);
    if (u.license_path) await supabase.storage.from("licenses").remove([u.license_path]);
    const { error } = await supabase.from("profiles").delete().eq("id", u.id);
    setBusyId(null);
    if (error) { flash("Delete failed — check the admin policy is applied."); return; }
    setRows((R) => R.filter((r) => r.id !== u.id));
    setOpenId(null);
    flash("Profile and content removed.");
    onChanged && onChanged();
  };

  const viewLicense = async (u) => {
    if (!u.license_path) { flash("No license uploaded."); return; }
    const { data, error } = await supabase.storage.from("licenses").createSignedUrl(u.license_path, 300);
    if (error || !data) { flash("Couldn't open the document."); return; }
    window.open(data.signedUrl, "_blank");
  };

  const list = (rows || []).filter((r) => {
    if (filter === "submitted" && r.license_status !== "submitted") return false;
    if (filter === "verified" && r.license_status !== "verified") return false;
    if (["guide", "driver", "operator", "business"].includes(filter) && r.role !== filter) return false;
    const hay = `${r.full_name || ""} ${r.email || ""} ${r.base || ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const pending = (rows || []).filter((r) => r.license_status === "submitted").length;

  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={rows ? `${rows.length} total` : ""}>Users</SectionLabel>

      <div className="relative mb-3">
        <Search size={16} color={C.muted} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or base"
          className="w-full h-11 pl-10 pr-4 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
      </div>

      <div className="flex gap-2 overflow-x-auto hidescroll pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
        <Chip on={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
        <Chip on={filter === "submitted"} onClick={() => setFilter("submitted")}>Pending{pending ? ` · ${pending}` : ""}</Chip>
        <Chip on={filter === "verified"} onClick={() => setFilter("verified")}>Verified</Chip>
        <Chip on={filter === "guide"} onClick={() => setFilter("guide")}>Guides</Chip>
        <Chip on={filter === "driver"} onClick={() => setFilter("driver")}>Drivers</Chip>
        <Chip on={filter === "operator"} onClick={() => setFilter("operator")}>Operators</Chip>
        <Chip on={filter === "business"} onClick={() => setFilter("business")}>Business</Chip>
      </div>

      {note && <div className="rounded-xl px-3 py-2 text-[12.5px] mb-3" style={{ background: C.pineSoft, color: C.pine }}>{note}</div>}

      {rows === null ? (
        <div className="flex items-center gap-2 text-[14px] py-6 justify-center" style={{ color: C.muted }}><Loader2 size={17} className="animate-spin" /> Loading…</div>
      ) : list.length === 0 ? (
        <Empty Icon={Users} title="No users" body="Signed-up guides, drivers and operators appear here." />
      ) : (
        <div className="space-y-3">
          {list.map((u) => {
            const open = openId === u.id;
            const st = u.license_status || "none";
            const stMap = {
              verified: { bg: C.pineSoft, fg: C.pine, label: "Verified" },
              submitted: { bg: C.goldSoft, fg: "#7a5a1e", label: "Pending review" },
              rejected: { bg: C.maroonSoft, fg: C.maroon, label: "Rejected" },
              none: { bg: C.bg, fg: C.muted, label: "No license" },
            }[st];
            return (
              <div key={u.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <Avatar initials={initialsOf(u.full_name)} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{u.full_name || "Unnamed"}</div>
                    <div className="text-[12.5px]" style={{ color: C.muted }}>{roleLabel(u.role)}{u.base ? ` · ${u.base}` : ""}</div>
                  </div>
                  <span className="text-[11.5px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: stMap.bg, color: stMap.fg }}>{stMap.label}</span>
                </div>

                <div className="text-[12.5px] mt-2 break-all" style={{ color: C.muted }}>{u.email}</div>
                {u.role === "guide" && (u.license_no || u.guide_class) && (
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {u.guide_class && GUIDE_CLASSES[u.guide_class] && (
                      <span className="text-[11px] font-bold rounded-full px-2 py-0.5" style={{ background: GUIDE_CLASSES[u.guide_class].color, color: "#fff" }}>{GUIDE_CLASSES[u.guide_class].label}</span>
                    )}
                    <span className="text-[12px]" style={{ color: C.muted }}>{u.license_no || "no number"}{u.license_expiry ? ` · exp ${u.license_expiry}` : ""}{licenseJoinYear(u.license_no) != null ? ` · joined ${licenseJoinYear(u.license_no)} (${licenseExperienceYears(u.license_no)}y)` : ""}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button onClick={() => viewLicense(u)} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: u.license_path ? C.ink : C.muted }}>
                    <FileCheck2 size={15} /> License
                  </button>
                  {st !== "verified" && (
                    <button onClick={() => setStatus(u.id, "verified")} disabled={busyId === u.id}
                      className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5" style={{ background: C.pine, color: "#fff" }}>
                      {busyId === u.id ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> Verify</>}
                    </button>
                  )}
                  {st === "verified" && (
                    <button onClick={() => setStatus(u.id, "submitted")} disabled={busyId === u.id}
                      className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>
                      <RefreshCw size={14} /> Un-verify
                    </button>
                  )}
                  <button onClick={() => setOpenId(open ? null : u.id)} className="tap w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: C.card, border: `1px solid ${C.line}` }} aria-label="More">
                    <span className="text-[16px] leading-none" style={{ color: C.muted }}>⋯</span>
                  </button>
                </div>

                {open && (
                  <div className="mt-3 pt-3 fade" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                    {st !== "rejected" && (
                      <button onClick={() => setStatus(u.id, "rejected")} className="tap w-full h-10 rounded-xl text-[13.5px] font-semibold mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>
                        Reject license
                      </button>
                    )}
                    <ConfirmDelete onConfirm={() => removeUser(u)} busy={busyId === u.id} />
                    <a href={`${SUPA_PROJECT_URL}/auth/users`} target="_blank" rel="noreferrer"
                      className="tap w-full h-10 rounded-xl text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 mt-2" style={{ background: C.bg, color: C.muted }}>
                      <ExternalLink size={13} /> Remove login in Supabase
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>Database</div>
        <div className="space-y-2">
          {[["Table editor", "/editor"], ["SQL editor", "/sql/new"], ["Auth users", "/auth/users"], ["Storage", "/storage/buckets"]].map(([label, path]) => (
            <a key={label} href={`${SUPA_PROJECT_URL}${path}`} target="_blank" rel="noreferrer"
              className="tap flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ background: C.bg }}>
              <span className="text-[13.5px] font-medium" style={{ color: C.ink }}>{label}</span>
              <ExternalLink size={14} color={C.muted} />
            </a>
          ))}
        </div>
        <p className="text-[11.5px] mt-3" style={{ color: C.muted }}>Deleting here removes the profile, posts, likes, comments and license file. The login itself is removed in Supabase → Auth users.</p>
      </div>
    </div>
  );
}

function ConfirmDelete({ onConfirm, busy }) {
  const [arm, setArm] = useState(false);
  if (!arm) return (
    <button onClick={() => setArm(true)} className="tap w-full h-10 rounded-xl text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5"
      style={{ background: C.maroonSoft, color: C.maroon }}>
      <UserX size={15} /> Delete user & content
    </button>
  );
  return (
    <div className="rounded-xl p-3" style={{ background: C.maroonSoft }}>
      <p className="text-[12.5px] mb-2.5" style={{ color: "#6b4a46" }}>This removes their profile, posts, likes, comments and license file. It can't be undone.</p>
      <div className="flex gap-2">
        <button onClick={() => setArm(false)} className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold" style={{ background: C.card, color: C.muted }}>Cancel</button>
        <button onClick={onConfirm} disabled={busy} className="tap flex-1 h-9 rounded-lg text-[13px] font-bold inline-flex items-center justify-center gap-1.5" style={{ background: C.maroon, color: "#fff" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
        </button>
      </div>
    </div>
  );
}

/* ================== Business bookings: calendar & requests ================= */
const DAY_MS = 86400000;
const bkDay = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const eachBookedDay = (s, e) => { const out = []; let d = new Date(s + "T00:00:00"); const end = new Date(e + "T00:00:00"); while (d <= end && out.length < 400) { out.push(bkDay(d)); d = new Date(d.getTime() + DAY_MS); } return out; };
const bookingMarks = (rows) => {
  const marks = {};
  (rows || []).forEach((b) => {
    const kind = b.status === "confirmed" ? "booked" : b.status === "blocked" ? "blocked" : b.status === "requested" ? "pending" : null;
    if (!kind) return;
    eachBookedDay(b.start_date, b.end_date).forEach((d) => { if (marks[d] !== "booked") marks[d] = kind; });
  });
  return marks;
};
const fmtRange = (a, b) => (a === b ? fmtDate(a) : `${fmtDate(a)} – ${fmtDate(b)}`);

function useBookings(filterCol, id) {
  const [rows, setRows] = useState([]);
  const load = async () => {
    if (!CLOUD || !id) return;
    const { data, error } = await supabase.from("business_bookings").select("*").eq(filterCol, id).order("start_date");
    if (error) { console.error("bookings load failed:", error.message); return; }
    setRows(data || []);
  };
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!CLOUD || !id) return;
    const ch = supabase.channel(`bookings-live-${filterCol}-${id}-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_bookings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);
  return [rows, load];
}

function BLabel({ children }) { return <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>{children}</div>; }

function MonthCal({ ym, marks, onPrev, onNext, onDay }) {
  const [y, m] = ym;
  const startPad = (new Date(y, m, 1).getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const todayIso = bkDay(new Date());
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  return (
    <div className="rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between mb-2.5">
        <button onClick={onPrev} className="tap w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.bg }} aria-label="Previous month"><ChevronLeft size={16} color={C.ink} /></button>
        <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{MON[m]} {y}</div>
        <button onClick={onNext} className="tap w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.bg }} aria-label="Next month"><ChevronLeft size={16} color={C.ink} style={{ transform: "rotate(180deg)" }} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <div key={d} className="text-center text-[10.5px] font-semibold" style={{ color: C.muted }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`pad${i}`} />;
          const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const mark = marks[iso];
          const past = iso < todayIso;
          const bg = mark === "booked" ? C.pine : mark === "blocked" ? "#AEB9AE" : mark === "pending" ? C.gold : C.bg;
          return (
            <button key={iso} onClick={() => onDay && !past && onDay(iso, mark)} className="tap rounded-lg flex items-center justify-center text-[12.5px] font-medium"
              style={{ height: 38, background: bg, border: `1px solid ${mark ? "transparent" : C.line}`, color: mark ? "#fff" : past ? "#C3CBC3" : C.ink, outline: iso === todayIso ? `2px solid ${C.gold}` : "none", outlineOffset: -2 }}>
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {[["Booked", C.pine], ["Blocked", "#AEB9AE"], ["Pending", C.gold]].map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: C.muted }}><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} /> {l}</span>
        ))}
      </div>
    </div>
  );
}

/* Business owner: manage the calendar and incoming requests */
function BusinessBookings({ user }) {
  const now = new Date();
  const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]);
  const [rows, reload] = useBookings("business_id", user.talentId);
  const [busyId, setBusyId] = useState(null);
  const [pay, setPay] = useState(null);
  const [payEdit, setPayEdit] = useState(false);
  const [payForm, setPayForm] = useState({ bank: "", account_name: "", account_number: "", note: "" });
  const [paySaving, setPaySaving] = useState(false);
  useEffect(() => {
    if (!CLOUD || !user.talentId) return;
    supabase.from("profiles").select("payment_info").eq("id", user.talentId).maybeSingle()
      .then(({ data }) => { if (data?.payment_info) { setPay(data.payment_info); setPayForm({ bank: "", account_name: "", account_number: "", note: "", ...data.payment_info }); } });
  }, [user.talentId]);
  const savePay = async () => {
    const clean = { bank: payForm.bank.trim(), account_name: payForm.account_name.trim(), account_number: payForm.account_number.trim(), note: payForm.note.trim() };
    if (!clean.bank || !clean.account_number) return;
    setPaySaving(true);
    const { error } = await supabase.from("profiles").update({ payment_info: clean }).eq("id", user.talentId);
    setPaySaving(false);
    if (error) { console.error("payment_info save failed:", error.message); return; }
    setPay(clean); setPayEdit(false);
  };
  const marks = useMemo(() => bookingMarks(rows), [rows]);
  const pending = rows.filter((b) => b.status === "requested");
  const todayIso = bkDay(new Date());
  const upcoming = rows.filter((b) => b.status === "confirmed" && b.end_date >= todayIso).slice(0, 12);

  const nav = (dir) => setYm(([y, m]) => { const d = new Date(y, m + dir, 1); return [d.getFullYear(), d.getMonth()]; });
  const dayTap = async (iso, mark) => {
    if (mark === "booked" || mark === "pending") return;
    if (!mark) {
      const { error } = await supabase.from("business_bookings").insert({ business_id: user.talentId, business_name: user.name, start_date: iso, end_date: iso, status: "blocked" });
      if (error) console.error("block day failed:", error.message); else reload();
    } else {
      const row = rows.find((b) => b.status === "blocked" && b.start_date <= iso && b.end_date >= iso);
      if (!row) return;
      const { error } = await supabase.from("business_bookings").delete().eq("id", row.id);
      if (error) console.error("unblock day failed:", error.message); else reload();
    }
  };
  const setStatus = async (id, status) => {
    setBusyId(id);
    const { error } = await supabase.from("business_bookings").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) console.error("booking update failed:", error.message); else reload();
  };

  return (
    <div className="px-5 py-4">
      <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${pay ? C.line : C.gold}` }}>
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-bold tracking-[.1em] uppercase" style={{ color: C.pine }}>Get paid</div>
          {pay && !payEdit && <button onClick={() => setPayEdit(true)} className="tap text-[12.5px] font-semibold" style={{ color: C.pine }}>Edit</button>}
        </div>
        {!payEdit && pay ? (
          <>
            <div className="text-[13.5px] mt-2 leading-relaxed" style={{ color: C.ink }}>
              {[pay.bank, pay.account_name, pay.account_number].filter(Boolean).join(" · ")}{pay.note ? ` · ${pay.note}` : ""}
            </div>
            <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>Operators see these details the moment you confirm their booking.</p>
          </>
        ) : !payEdit ? (
          <>
            <p className="text-[12.5px] mt-1.5 leading-snug" style={{ color: C.muted }}>Add your bank or MBoB details once — every operator sees them instantly when you confirm a booking. No chasing payments.</p>
            <button onClick={() => setPayEdit(true)} className="tap w-full h-10 rounded-xl text-[13.5px] font-semibold mt-2.5" style={{ background: C.pine, color: "#fff" }}>Add payment details</button>
          </>
        ) : (
          <div className="mt-2.5">
            {[["bank", "Bank (e.g. BOB, BNB)"], ["account_name", "Account name"], ["account_number", "Account number"], ["note", "Note (e.g. MBoB 17xxxxxx) · optional"]].map(([k, ph]) => (
              <input key={k} value={payForm[k]} onChange={(e) => setPayForm((f) => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-2" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            ))}
            <div className="flex gap-2">
              <button onClick={() => setPayEdit(false)} className="tap flex-1 h-10 rounded-xl text-[13.5px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
              <button onClick={savePay} disabled={paySaving || !payForm.bank.trim() || !payForm.account_number.trim()} className="tap flex-1 h-10 rounded-xl text-[13.5px] font-semibold" style={{ background: C.pine, color: "#fff" }}>{paySaving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}
      </div>

      <SectionLabel trailing={pending.length ? `${pending.length} pending` : null}>Your calendar</SectionLabel>
      <MonthCal ym={ym} marks={marks} onPrev={() => nav(-1)} onNext={() => nav(1)} onDay={dayTap} />
      <p className="text-[12px] mt-2 mb-5" style={{ color: C.muted }}>Tap a free day to block it. Tap a grey day to free it again. Operators see this calendar live.</p>

      {pending.length > 0 && (<>
        <SectionLabel>Booking requests</SectionLabel>
        {pending.map((b) => (
          <div key={b.id} className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{b.operator_name || "Tour operator"}</div>
            <div className="flex flex-wrap gap-2 mt-2"><Pill Icon={CalendarCheck}>{fmtRange(b.start_date, b.end_date)}</Pill>{b.guests ? <Pill Icon={Users}>{b.guests} guests</Pill> : null}</div>
            {b.note && <p className="text-[13.5px] mt-2.5 leading-snug" style={{ color: C.muted }}>{b.note}</p>}
            <div className="flex gap-2 mt-3.5">
              <button disabled={busyId === b.id} onClick={() => setStatus(b.id, "confirmed")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold" style={{ background: C.pine, color: "#fff" }}>Confirm</button>
              <button disabled={busyId === b.id} onClick={() => setStatus(b.id, "declined")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>Decline</button>
            </div>
          </div>
        ))}
      </>)}

      <SectionLabel>Upcoming stays</SectionLabel>
      {upcoming.length === 0 && <p className="text-[13.5px]" style={{ color: C.muted }}>No confirmed bookings yet. Post photos of your place to the feed — that’s your shop window.</p>}
      {upcoming.map((b) => (
        <div key={b.id} className="rounded-2xl p-4 mb-3 flex items-center justify-between gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div>
            <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{b.operator_name || "Tour operator"}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>{fmtRange(b.start_date, b.end_date)}{b.guests ? ` · ${b.guests} guests` : ""}</div>
          </div>
          <button onClick={() => setStatus(b.id, "cancelled")} className="tap text-[12.5px] font-semibold px-3 py-2 rounded-lg" style={{ color: C.maroon, border: `1px solid ${C.line}` }}>Cancel</button>
        </div>
      ))}
    </div>
  );
}

/* On a business profile: live availability + the operator booking form */
function BusinessAvailability({ business, viewer }) {
  const now = new Date();
  const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]);
  const [rows] = useBookings("business_id", business.id);
  const marks = useMemo(() => bookingMarks(rows.filter((b) => ["confirmed", "blocked"].includes(b.status) || (viewer && b.operator_id === viewer.talentId))), [rows, viewer]);
  const isOperator = viewer && viewer.kind === "operator";
  const mine = viewer ? rows.filter((b) => b.operator_id === viewer.talentId && ["requested", "confirmed"].includes(b.status)) : [];
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [guests, setGuests] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [bizPay, setBizPay] = useState(null);
  const [payCopied, setPayCopied] = useState(false);
  useEffect(() => {
    if (!CLOUD || !isOperator || !business?.id) return;
    if (!rows.some((b) => b.operator_id === viewer.talentId && b.status === "confirmed")) return;
    supabase.from("profiles").select("payment_info").eq("id", business.id).maybeSingle()
      .then(({ data }) => setBizPay(data?.payment_info || null));
  }, [rows, business?.id, isOperator]);
  const payText = bizPay ? [bizPay.bank, bizPay.account_name, bizPay.account_number, bizPay.note].filter(Boolean).join(" · ") : "";
  const copyPay = async () => {
    try { await navigator.clipboard?.writeText(payText); setPayCopied(true); setTimeout(() => setPayCopied(false), 2200); } catch (e) {}
  };
  const nav = (dir) => setYm(([y, m]) => { const d = new Date(y, m + dir, 1); return [d.getFullYear(), d.getMonth()]; });

  const request = async () => {
    if (!start || !end || end < start) { setMsg("Pick a valid date range first."); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("business_bookings").insert({
      business_id: business.id, operator_id: viewer.talentId,
      business_name: business.name, operator_name: viewer.name,
      start_date: start, end_date: end,
      guests: guests ? Number(guests) : null, note: note.trim() || null, status: "requested",
    });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setStart(""); setEnd(""); setGuests(""); setNote("");
    setMsg("Request sent — you’ll get a notification when they respond.");
  };
  const cancelMine = async (id) => {
    const { error } = await supabase.from("business_bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) console.error("cancel failed:", error.message);
  };

  return (
    <div className="mt-6">
      <SectionLabel>Availability</SectionLabel>
      <MonthCal ym={ym} marks={marks} onPrev={() => nav(-1)} onNext={() => nav(1)} onDay={null} />

      {isOperator && (
        <div className="rounded-2xl p-4 mt-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[14.5px] font-semibold mb-3" style={{ color: C.ink }}>Request a booking</div>
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div><BLabel>Check-in</BLabel><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full h-12 px-3 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} /></div>
            <div><BLabel>Check-out</BLabel><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full h-12 px-3 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} /></div>
          </div>
          <BLabel>Guests</BLabel>
          <input value={guests} onChange={(e) => setGuests(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} inputMode="numeric" placeholder="How many people?"
            className="w-full h-12 px-3.5 rounded-xl text-[15px] mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <BLabel>Note</BLabel>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={200} placeholder="Group details, arrival time, rooms needed…"
            className="w-full px-3.5 py-3 rounded-xl text-[15px] resize-none mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          {msg && <p className="text-[13px] mb-2.5" style={{ color: msg.startsWith("Request sent") ? C.pine : C.maroon }}>{msg}</p>}
          <button disabled={busy} onClick={request} className="tap w-full rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold"
            style={{ height: 50, background: C.pine, color: "#fff" }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <>Send booking request <ArrowRight size={17} strokeWidth={2.4} /></>}
          </button>
        </div>
      )}

      {mine.length > 0 && (
        <div className="mt-3">
          {mine.map((b) => (
            <div key={b.id} className="rounded-2xl p-3.5 mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13.5px] font-semibold" style={{ color: b.status === "confirmed" ? C.pine : C.ink }}>{b.status === "confirmed" ? "Confirmed" : "Awaiting reply"}</div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>{fmtRange(b.start_date, b.end_date)}{b.guests ? ` · ${b.guests} guests` : ""}</div>
                </div>
                <button onClick={() => cancelMine(b.id)} className="tap text-[12.5px] font-semibold px-3 py-2 rounded-lg" style={{ color: C.maroon, border: `1px solid ${C.line}` }}>Cancel</button>
              </div>
              {b.status === "confirmed" && bizPay && (
                <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <div className="text-[10.5px] font-bold tracking-[.12em] uppercase mb-1" style={{ color: C.pine }}>Pay {business.name}</div>
                  <div className="text-[12.5px] leading-relaxed" style={{ color: C.ink }}>{payText}</div>
                  <button onClick={copyPay} className="tap w-full h-9 rounded-lg text-[12.5px] font-semibold mt-2" style={{ background: C.pineSoft, color: C.pine }}>{payCopied ? "Copied ✓" : "Copy payment details"}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ Onboarding (real signup · role → details → OTP → license) ============ */
const ONB_SPECS = ["Culture & Dzong", "Alpine Trekking & Camping", "Birdwatching & Wildlife", "Spiritual & Meditation", "Adventure & Outdoors"];
const ONB_DRIVES = ["Long-distance touring", "Mountain & high passes", "Excursion & day trips", "Airport transfers", "Off-road & trailheads"];
const ONB_VEHICLES = ["Sedan", "SUV", "Hiace Van", "Coaster Bus", "Large Coach"];
const ONB_LANGS = ["Dzongkha", "English", "Hindi", "Nepali", "Japanese", "Mandarin", "German", "French", "Spanish", "Korean"];
const ONB_YEARS = [["0–2 yrs", 1], ["3–5 yrs", 4], ["6–10 yrs", 8], ["10+ yrs", 12]];
const LICENSE_LABEL = { guide: "Guide license (Department of Tourism)", driver: "Driving licence (RSTA)", operator: "Tour Operator licence (Department of Tourism)", business: "Trade licence (MoICE)" };
const ONB_BUSINESS = ["Hotel", "Farmstay / Homestay", "Boutique & Handicrafts", "Restaurant / Caf\u00e9", "Wellness & Spa", "Textiles & Art"];

function OLabel({ children }) { return <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>{children}</div>; }
function OInput(props) { return <input {...props} className="w-full h-12 px-4 rounded-xl text-[15px] mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />; }
function OCta({ children, onClick, disabled, busy }) {
  return (
    <button onClick={onClick} disabled={disabled || busy} className="tap w-full rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold"
      style={{ height: 52, background: disabled ? "#C7CEC7" : C.pine, color: "#fff", cursor: disabled ? "not-allowed" : "pointer" }}>
      {busy ? <Loader2 size={18} className="animate-spin" /> : <>{children} <ArrowRight size={18} strokeWidth={2.4} /></>}
    </button>
  );
}

function Onboard({ mode: initialMode, session, onBack, onDone }) {
  const [mode, setMode] = useState(initialMode);
  const signin = mode === "signin";
  const [step, setStep] = useState(signin ? "auth" : "role");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [uid, setUid] = useState(session?.user?.id || null);
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [base, setBase] = useState("");
  const [company, setCompany] = useState("");
  const [years, setYears] = useState(4);
  const [pitch, setPitch] = useState("");
  const [langs, setLangs] = useState([]);
  const [tags, setTags] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [email, setEmail] = useState(session?.user?.email || (typeof localStorage !== "undefined" ? localStorage.getItem("bth_email") || "" : ""));
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saved, setSaved] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [reset, setReset] = useState(false);
  const [licPreview, setLicPreview] = useState(null);
  const [licNo, setLicNo] = useState("");
  const [licExpiry, setLicExpiry] = useState("");
  const licClass = role === "guide" ? parseGuideClass(licNo) : null;
  const licValid = licExpiry ? new Date(licExpiry + "T00:00") > new Date() : false;
  const licRef = useRef();
  const licCamRef = useRef();
  const [licSrcOpen, setLicSrcOpen] = useState(false);
  const [licCamOpen, setLicCamOpen] = useState(false);
  const effUid = uid || session?.user?.id || null;

  const toggleTag = (t) => setTags((T) => (T.includes(t) ? T.filter((x) => x !== t) : [...T, t]));
  const cycleLang = (n) => setLangs((L) => {
    const cur = L.find((x) => x.n === n);
    if (!cur) return [...L, { n, l: "Fluent" }];
    if (cur.l === "Fluent") return L.map((x) => (x.n === n ? { ...x, l: "Basic" } : x));
    return L.filter((x) => x.n !== n);
  });

  const sendCode = async () => {
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: !signin } });
    setBusy(false);
    if (error) setErr(/sending|smtp|confirmation/i.test(error.message || "")
      ? "We couldn't send to that address. Check it's spelled correctly and try again."
      : error.message);
    else setStep("code");
  };
  const signInWithPassword = async () => {
    setBusy(true); setErr(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) {
      setErr(/invalid login/i.test(error.message || "")
        ? "That email and password don't match. Try again, or use 'Forgot password'."
        : error.message);
      return;
    }
    try { if (remember) localStorage.setItem("bth_email", email.trim()); else localStorage.removeItem("bth_email"); } catch (e) {}
    const { data: prof, error: profErr } = await supabase.from("profiles").select("id").eq("id", data.session.user.id).maybeSingle();
    if (profErr) console.error("profile lookup failed:", profErr.message);
    if (prof) onDone(); else { setUid(data.session.user.id); setStep("role"); }
  };

  const pwStrength = (p) => {
    if (!p || p.length < 8) return { ok: false, msg: "At least 8 characters." };
    if (!/[0-9]/.test(p)) return { ok: false, msg: "Include at least one number." };
    if (!/[a-zA-Z]/.test(p)) return { ok: false, msg: "Include at least one letter." };
    if (/^(123456|password|12345678|qwerty|abc123)/i.test(p)) return { ok: false, msg: "That password is too common." };
    return { ok: true, msg: "Strong enough." };
  };

  const savePassword = async () => {
    const st = pwStrength(pw);
    if (!st.ok) { setErr(st.msg); return; }
    if (pw !== pw2) { setErr("The two passwords don't match."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    try { localStorage.setItem("bth_email", email.trim()); } catch (e) {}
    setSaved(true);
    setTimeout(() => { if (reset) onDone(); else setStep("license"); }, 1200);
  };

  const verify = async () => {
    setBusy(true); setErr(null);
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error || !data?.session) { setErr("That code didn't match — check the newest email and try again."); return; }
    setUid(data.session.user.id);
    setPw(""); setPw2("");
    setStep("password");
  };
  const finish = async (licensePath) => {
    setBusy(true); setErr(null);
    // make sure the session is live before writing (avoids row-level security rejection)
    const { data: sess } = await supabase.auth.getSession();
    if (!sess?.session) {
      setBusy(false);
      setErr("Your session expired. Tap Resend code and verify again.");
      return;
    }
    const vaultEmail = (email || session?.user?.email || "").trim() || null;
    const { error } = await supabase.from("profiles").upsert({
      id: effUid, email: null, role,
      full_name: name.trim(), phone: phone.trim() || null, base: base.trim() || null,
      company_name: ["operator", "business"].includes(role) ? (company.trim() || name.trim()) : null,
      years, pitch: pitch.trim() || null, languages: langs, tags,
      vehicle: role === "driver" ? vehicle : null,
      guide_class: role === "guide" && licClass && licValid ? licClass : null,
      license_no: role === "guide" ? (licNo.trim() || null) : null,
      license_expiry: role === "guide" ? (licExpiry || null) : null,
      license_path: licensePath || null, license_status: licensePath ? "submitted" : "none",
    });
    if (!error && vaultEmail) {
      const { error: veErr } = await supabase.from("profile_emails").upsert({ profile_id: effUid, email: vaultEmail });
      if (veErr) console.error("email vault save failed:", veErr.message);
    }
    setBusy(false);
    if (error) {
      console.error("PROFILE SAVE FAILED", error, "uid:", effUid, "session uid:", sess.session.user.id);
      setErr("Profile step: " + (error.message || "database rejected the profile"));
      return;
    }
    onDone();
  };
  const [licCrop, setLicCrop] = useState(null);
  const pickLicense = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !f.type.startsWith("image/")) { setErr("Please choose a photo of your license."); return; }
    setErr(null);
    const r = new FileReader(); r.onload = () => setLicCrop([r.result]); r.readAsDataURL(f);
  };
  const submitLicense = async () => {
    setBusy(true); setErr(null);
    try {
      const small = await shrinkImage(licPreview, 1600, 0.85);
      const blob = dataUriToBlob(small);
      const path = `${effUid}/license.jpg`;
      const { error } = await supabase.storage.from("licenses").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) {
        console.error("LICENSE UPLOAD FAILED", error);
        setBusy(false);
        setErr("Upload step: " + (error.message || "storage rejected the file"));
        return;
      }
      setBusy(false);
      await finish(path);
    } catch (e) {
      console.error("LICENSE UPLOAD EXCEPTION", e);
      setBusy(false);
      setErr("Upload step: " + (e.message || "something went wrong"));
    }
  };

  const ORDER = signin ? ["auth", "code", "password"] : ["role", "about", "details", "email", "code", "password", "license"];
  const backStep = () => {
    const i = ORDER.indexOf(step);
    if (i <= 0 || step === "code") { if (step === "code") setStep("email"); else onBack(); return; }
    setStep(ORDER[i - 1]);
  };
  const detailsNext = () => { if (effUid) setStep("license"); else setStep("email"); };
  const detailsOk = role === "operator" ? true : role === "business" ? tags.length > 0 : (tags.length > 0 && langs.length > 0 && (role !== "driver" || vehicle));

  return (
    <div className="px-6 pt-5 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={backStep} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Back">
          <ChevronLeft size={19} color={C.ink} />
        </button>
        <div className="flex gap-1.5">
          {ORDER.map((k) => <span key={k} className="rounded-full" style={{ width: k === step ? 18 : 7, height: 7, background: ORDER.indexOf(k) <= ORDER.indexOf(step) ? C.pine : C.lineSoft, transition: "width .25s" }} />)}
        </div>
      </div>

      {step === "role" && (
        <div className="fade">
          <div className="relative flex rounded-2xl p-1 mb-6" style={{ background: C.lineSoft }}>
            <div className="absolute top-1 bottom-1 rounded-xl" style={{ width: "calc(50% - 4px)", left: "50%", background: C.card, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }} />
            <button onClick={() => { setMode("signin"); setStep("auth"); setErr(null); }} className="relative flex-1 py-2.5 text-[14.5px] font-semibold" style={{ color: C.muted }}>Sign in</button>
            <button className="relative flex-1 py-2.5 text-[14.5px] font-semibold" style={{ color: C.ink }}>Create account</button>
          </div>

          <h2 className="text-[26px] font-semibold tracking-[-0.02em] mb-1" style={{ color: C.ink }}>How do you work with tours?</h2>
          <p className="text-[14.5px] mb-5" style={{ color: C.muted }}>This shapes your whole profile — pick the one that fits.</p>

          {[
            { id: "guide", label: "Guide", sub: "I lead trips and share Bhutan", Icon: Compass,
              points: ["Show your specialities and languages", "Build a trip record operators trust", "Apply for jobs and short-notice work"] },
            { id: "driver", label: "Driver", sub: "I drive guests on tour", Icon: Car,
              points: ["List your vehicle and the routes you know", "Get found for airport runs and long hauls", "Freelance owner-drivers welcome"] },
            { id: "operator", label: "Tour Operator", sub: "I book guides and drivers", Icon: Building2,
              points: ["Search verified guides and drivers", "Post jobs and hire in minutes", "Run every trip in one place"] },
            { id: "business", label: "Business", sub: "I run a hotel, boutique or shop", Icon: Store,
              points: ["A verified page guides and operators can find", "Share rooms, products and offers on the feed", "Direct messages from every tour passing through"] },
          ].map(({ id, label, sub: subT, Icon, points }) => (
            <button key={id} onClick={() => { setRole(id); setStep("about"); }} className="tap w-full text-left rounded-2xl p-4 mb-3"
              style={{ background: C.card, border: `1.5px solid ${role === id ? C.pine : C.line}` }}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
                  <Icon size={22} color={C.goldSoft} strokeWidth={1.9} />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-semibold" style={{ color: C.ink }}>{label}</div>
                  <div className="text-[13px]" style={{ color: C.muted }}>{subT}</div>
                </div>
                <ArrowRight size={18} color={C.muted} />
              </div>
              <div className="mt-3 pl-[62px] space-y-1.5">
                {points.map((p) => (
                  <div key={p} className="flex items-start gap-2">
                    <Check size={13} color={C.gold} strokeWidth={3} className="shrink-0 mt-[3px]" />
                    <span className="text-[12.5px] leading-snug" style={{ color: C.muted }}>{p}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}

          <div className="rounded-xl p-3.5 flex gap-2.5 mt-1" style={{ background: C.goldSoft }}>
            <ShieldCheck size={16} color={C.maroon} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: "#5a4a2e" }}>
              You'll upload your licence at the end. Nothing is visible to operators until our team verifies it.
            </p>
          </div>
        </div>
      )}

      {step === "about" && (
        <div className="fade">
          <h2 className="text-[24px] font-semibold tracking-[-0.01em] mb-5" style={{ color: C.ink }}>Tell us who you are</h2>
          <OLabel>{["operator", "business"].includes(role) ? "Your name" : "Full name"}</OLabel>
          <OInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          {["operator", "business"].includes(role) && (<><OLabel>{role === "business" ? "Business name" : "Agency name"}</OLabel><OInput value={company} onChange={(e) => setCompany(e.target.value)} placeholder={role === "business" ? "Your hotel or shop name" : "Your agency name"} /></>)}
          <OLabel>Phone</OLabel>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold" style={{ color: C.muted }}>+975</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
              placeholder="17 12 34 56" inputMode="tel"
              className="w-full h-12 pl-[68px] pr-4 rounded-xl text-[15px]"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          <p className="text-[12px] -mt-2 mb-4" style={{ color: C.muted }}>Operators call this number directly — make sure it's right.</p>
          {role !== "operator" && (<><OLabel>{role === "business" ? "Town / location" : "Home base"}</OLabel><OInput value={base} onChange={(e) => setBase(e.target.value)} placeholder="Paro" /></>)}
          <OCta disabled={name.trim().length < 2} onClick={() => setStep("details")}>Continue</OCta>
        </div>
      )}

      {step === "details" && (
        <div className="fade">
          <h2 className="text-[24px] font-semibold tracking-[-0.01em] mb-5" style={{ color: C.ink }}>{role === "guide" ? "Your specialities" : role === "driver" ? "What you drive" : role === "business" ? "About your business" : "About your agency"}</h2>
          <OLabel>Years of experience</OLabel>
          <div className="flex flex-wrap gap-2 mb-5">{ONB_YEARS.map(([l, v]) => <Chip key={l} on={years === v} onClick={() => setYears(v)}>{l}</Chip>)}</div>
          {role === "guide" && (<>
            <OLabel>Specialities — pick all that fit</OLabel>
            <div className="flex flex-wrap gap-2 mb-5">{ONB_SPECS.map((t) => <Chip key={t} on={tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Chip>)}</div>
          </>)}
          {role === "driver" && (<>
            <OLabel>Your vehicle</OLabel>
            <div className="flex flex-wrap gap-2 mb-5">{ONB_VEHICLES.map((v) => <Chip key={v} on={vehicle === v} onClick={() => setVehicle(v)}>{v}</Chip>)}</div>
            <OLabel>Comfortable with</OLabel>
            <div className="flex flex-wrap gap-2 mb-5">{ONB_DRIVES.map((t) => <Chip key={t} on={tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Chip>)}</div>
          </>)}
          {role === "business" && (<>
            <OLabel>What kind of business? Pick all that fit</OLabel>
            <div className="flex flex-wrap gap-2 mb-5">{ONB_BUSINESS.map((t) => <Chip key={t} on={tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Chip>)}</div>
          </>)}
          {role !== "operator" && (<>
            <OLabel>Languages — tap once for Fluent, twice for Basic</OLabel>
            <div className="flex flex-wrap gap-2 mb-5">
              {ONB_LANGS.map((n) => {
                const cur = langs.find((x) => x.n === n);
                return (
                  <button key={n} onClick={() => cycleLang(n)} className="tap rounded-full pl-3 pr-2.5 py-1.5 text-[13px] font-medium inline-flex items-center gap-1.5"
                    style={{ background: cur ? C.pine : C.card, border: `1px solid ${cur ? C.pine : C.line}`, color: cur ? "#fff" : C.ink }}>
                    {n}{cur && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: C.gold, color: "#fff" }}>{cur.l}</span>}
                  </button>
                );
              })}
            </div>
          </>)}
          {["operator", "business"].includes(role) && (<>
            <OLabel>{role === "business" ? "Describe your place" : "What should the crew know about you?"}</OLabel>
            <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={3} maxLength={220} placeholder={role === "business" ? "Rooms, products, opening hours \u2014 what should visiting tours know?" : "Routes you run, group sizes, what you value."}
              className="w-full px-3.5 py-3 rounded-xl text-[15px] resize-none mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </>)}
          <OCta disabled={!detailsOk} onClick={detailsNext}>Continue</OCta>
        </div>
      )}

      {step === "auth" && (
        <div className="fade">
          {/* segmented toggle */}
          <div className="relative flex rounded-2xl p-1 mb-6" style={{ background: C.lineSoft }}>
            <div className="absolute top-1 bottom-1 rounded-xl" style={{ width: "calc(50% - 4px)", left: signin ? 4 : "50%", background: C.card, boxShadow: "0 1px 3px rgba(0,0,0,.08)", transition: "left .26s cubic-bezier(.22,.61,.36,1)" }} />
            <button onClick={() => { setMode("signin"); setStep("auth"); setErr(null); }} className="relative flex-1 py-2.5 text-[14.5px] font-semibold" style={{ color: signin ? C.ink : C.muted }}>Sign in</button>
            <button onClick={() => { setMode("signup"); setStep("role"); setErr(null); }} className="relative flex-1 py-2.5 text-[14.5px] font-semibold" style={{ color: signin ? C.muted : C.ink }}>Create account</button>
          </div>

          <h2 className="text-[26px] font-semibold tracking-[-0.02em] mb-1" style={{ color: C.ink }}>Welcome back</h2>
          <p className="text-[14.5px] mb-6" style={{ color: C.muted }}>Sign in to your account.</p>

          <OLabel>Email</OLabel>
          <div className="relative mb-4">
            <Mail size={16} color={C.muted} className="absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" autoCapitalize="none" autoComplete="email"
              className="w-full h-13 pl-11 pr-4 rounded-2xl text-[16px]" style={{ height: 52, background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>

          <OLabel>Password</OLabel>
          <div className="relative mb-3">
            <Lock size={16} color={C.muted} className="absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={pw} onChange={(e) => setPw(e.target.value)} type={showPw ? "text" : "password"} autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && /\S+@\S+\.\S+/.test(email) && pw.length >= 6 && signInWithPassword()}
              placeholder="Your password" className="w-full pl-11 pr-12 rounded-2xl text-[16px]"
              style={{ height: 52, background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
            <button onClick={() => setShowPw((v) => !v)} className="tap absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" aria-label="Show password">
              {showPw ? <EyeOff size={17} color={C.muted} /> : <Eye size={17} color={C.muted} />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setRemember((v) => !v)} className="tap inline-flex items-center gap-2">
              <span className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: remember ? C.pine : C.card, border: `1.5px solid ${remember ? C.pine : C.line}` }}>
                {remember && <Check size={12} color="#fff" strokeWidth={3.2} />}
              </span>
              <span className="text-[13.5px]" style={{ color: C.ink }}>Remember me</span>
            </button>
            <button onClick={() => { if (!/\S+@\S+\.\S+/.test(email)) { setErr("Enter your email first."); return; } setReset(true); setErr(null); setPw(""); setPw2(""); sendCode(); }}
              className="tap text-[13.5px] font-semibold" style={{ color: C.pine }}>Forgot password?</button>
          </div>

          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
          <OCta disabled={!/\S+@\S+\.\S+/.test(email) || pw.length < 6} busy={busy} onClick={signInWithPassword}>Sign in</OCta>

          <p className="text-center text-[13px] mt-5" style={{ color: C.muted }}>
            New here? <button onClick={() => { setMode("signup"); setStep("role"); }} className="tap font-semibold" style={{ color: C.pine }}>Create an account</button>
          </p>
        </div>
      )}

      {step === "email" && (
        <div className="fade">
          <h2 className="text-[26px] font-semibold tracking-[-0.02em] mb-1" style={{ color: C.ink }}>Verify your email</h2>
          <p className="text-[14.5px] mb-6" style={{ color: C.muted }}>We'll send a code to confirm it's you.</p>
          <OLabel>Email</OLabel>
          <div className="relative mb-4">
            <Mail size={16} color={C.muted} className="absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" autoCapitalize="none" autoComplete="email"
              className="w-full pl-11 pr-4 rounded-2xl text-[16px]" style={{ height: 52, background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
          <OCta disabled={!/\S+@\S+\.\S+/.test(email)} busy={busy} onClick={sendCode}>Send code</OCta>
        </div>
      )}

      {step === "code" && (
        <div className="fade">
          <h2 className="text-[24px] font-semibold tracking-[-0.01em] mb-1" style={{ color: C.ink }}>Enter your code</h2>
          <p className="text-[14px] mb-5" style={{ color: C.muted }}>Sent to <b style={{ color: C.ink }}>{email}</b> — check spam too.</p>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" placeholder="000000"
            className="w-full h-14 rounded-xl text-center text-[26px] font-semibold mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, letterSpacing: "0.4em" }} />
          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
          <OCta disabled={code.length < 6} busy={busy} onClick={verify}>Verify</OCta>
          <button onClick={sendCode} className="tap w-full text-[13.5px] font-medium mt-3" style={{ color: C.muted }}>Resend code</button>
        </div>
      )}

      {step === "password" && (
        <div className="fade">
          {saved ? (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.pine }}>
                <Check size={30} color="#fff" strokeWidth={3} />
              </div>
              <div className="text-[18px] font-semibold" style={{ color: C.ink }}>Password saved</div>
              <p className="text-[14px] mt-1.5" style={{ color: C.muted }}>Use it next time you sign in.</p>
            </div>
          ) : (
            <>
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] mb-1" style={{ color: C.ink }}>{reset ? "Set a new password" : "Create a password"}</h2>
              <p className="text-[14.5px] mb-6" style={{ color: C.muted }}>
                {reset ? "Your code checked out. Choose a new password for your account." : "So you can sign in quickly next time — no code needed."}
              </p>

              <OLabel>{reset ? "New password" : "Password"}</OLabel>
              <div className="relative mb-3">
                <Lock size={16} color={C.muted} className="absolute left-4 top-1/2 -translate-y-1/2" />
                <input value={pw} onChange={(e) => setPw(e.target.value)} type={showPw ? "text" : "password"} autoComplete="new-password"
                  placeholder="At least 6 characters" className="w-full pl-11 pr-12 rounded-2xl text-[16px]"
                  style={{ height: 52, background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                <button onClick={() => setShowPw((v) => !v)} className="tap absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" aria-label="Show password">
                  {showPw ? <EyeOff size={17} color={C.muted} /> : <Eye size={17} color={C.muted} />}
                </button>
              </div>

              <OLabel>Confirm password</OLabel>
              <div className="relative mb-2">
                <Lock size={16} color={C.muted} className="absolute left-4 top-1/2 -translate-y-1/2" />
                <input value={pw2} onChange={(e) => setPw2(e.target.value)} type={showPw ? "text" : "password"} autoComplete="new-password"
                  onKeyDown={(e) => e.key === "Enter" && pw.length >= 6 && pw === pw2 && savePassword()}
                  placeholder="Type it again" className="w-full pl-11 pr-4 rounded-2xl text-[16px]"
                  style={{ height: 52, background: C.card, border: `1px solid ${pw2 && pw !== pw2 ? C.maroon : C.line}`, color: C.ink }} />
              </div>
              <p className="text-[12.5px] mb-4" style={{ color: pwStrength(pw).ok && pw === pw2 ? C.pine : C.muted }}>
                {!pwStrength(pw).ok ? pwStrength(pw).msg : pw2 && pw !== pw2 ? "Passwords don't match yet." : pw === pw2 && pw2 ? "Strong enough." : "Type it again to confirm."}
              </p>

              {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
              <OCta disabled={!pwStrength(pw).ok || pw !== pw2} busy={busy} onClick={savePassword}>{reset ? "Save new password" : "Continue"}</OCta>
            </>
          )}
        </div>
      )}

      {step === "license" && (
        <div className="fade">
          <h2 className="text-[24px] font-semibold tracking-[-0.01em] mb-1" style={{ color: C.ink }}>Verify your license</h2>
          <p className="text-[14px] mb-5" style={{ color: C.muted }}>{LICENSE_LABEL[role] || "Your license"} — our team checks it, and your Verified badge appears once it clears.</p>
          {licPreview ? (
            <div className="relative rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
              <img src={licPreview} alt="" className="w-full block" style={{ maxHeight: 280, objectFit: "cover" }} />
              <button onClick={() => setLicPreview(null)} className="tap absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}><X size={16} color="#fff" /></button>
            </div>
          ) : (
            <button onClick={() => setLicSrcOpen(true)} className="tap w-full rounded-2xl p-8 flex flex-col items-center justify-center text-center mb-4"
              style={{ background: C.card, border: `1.5px dashed ${C.line}` }}>
              <div className="rounded-2xl flex items-center justify-center mb-3" style={{ width: 52, height: 52, background: C.goldSoft }}><Upload size={23} color={C.gold} /></div>
              <div className="text-[15px] font-semibold" style={{ color: C.ink }}>Upload a photo of your license</div>
              <div className="text-[13px] mt-1" style={{ color: C.muted }}>Front side — we crop and scan it into a clean record</div>
            </button>
          )}
          <input ref={licRef} type="file" accept="image/*" onChange={pickLicense} className="hidden" />
          <input ref={licCamRef} type="file" accept="image/*" capture="environment" onChange={pickLicense} className="hidden" />
          {licSrcOpen && (
            <PhotoSourceSheet title="Licence photo" onClose={() => setLicSrcOpen(false)}
              onCamera={() => { setLicSrcOpen(false); if (navigator.mediaDevices?.getUserMedia) setLicCamOpen(true); else licCamRef.current?.click(); }}
              onUpload={() => { setLicSrcOpen(false); licRef.current?.click(); }} />
          )}
          {licCamOpen && (
            <CameraCaptureSheet onClose={() => setLicCamOpen(false)} onFallback={() => licCamRef.current?.click()}
              onShot={(uri) => { setLicCamOpen(false); setErr(null); setLicCrop([uri]); }} />
          )}
          {licCrop && (
            <CardScanEditor image={licCrop[0]}
              onClose={() => setLicCrop(null)}
              onDone={async (flat) => {
                setLicCrop(null);
                try { setLicPreview(await bakeEnhance(flat, { bright: 1.02, contrast: 1.1, sat: 1.05, warmth: 0, auto: true })); }
                catch (e) { setLicPreview(flat); }
              }} />
          )}
          {role === "guide" && (
            <div className="mb-4">
              <input value={licNo} onChange={(e) => setLicNo(e.target.value.toUpperCase())} autoCapitalize="characters"
                placeholder="License number — e.g. CTG930769"
                className="w-full h-12 px-4 rounded-xl text-[15px] mb-2" style={{ background: C.card, border: `1px solid ${licNo && !licClass ? C.maroon : C.line}`, color: C.ink }} />
              <input type="date" value={licExpiry} onChange={(e) => setLicExpiry(e.target.value)}
                className="w-full h-12 px-4 rounded-xl text-[15px] mb-2" style={{ background: C.card, border: `1px solid ${licExpiry && !licValid ? C.maroon : C.line}`, color: licExpiry ? C.ink : C.muted }} />
              {licNo && !licClass && (
                <p className="text-[12.5px]" style={{ color: C.maroon }}>Number not recognised — it starts with CG, CTG, STG or TL as printed on your card.</p>
              )}
              {licClass && (
                <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: `${GUIDE_CLASSES[licClass].color}14`, border: `1.5px solid ${GUIDE_CLASSES[licClass].color}` }}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: GUIDE_CLASSES[licClass].color }} />
                  <span className="text-[13.5px] font-semibold" style={{ color: GUIDE_CLASSES[licClass].color }}>
                    {GUIDE_CLASSES[licClass].label}{licExpiry ? (licValid ? " · valid" : " · EXPIRED") : ""}
                  </span>
                </div>
              )}
              {licClass && licExpiry && !licValid && (
                <p className="text-[12.5px] mt-1.5" style={{ color: C.maroon }}>This license has expired — renew with the Department of Tourism. Your class colour switches on once a valid expiry is set.</p>
              )}
              <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>Your class is read from the number and confirmed by our team against the photo.</p>
            </div>
          )}
          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
          <OCta disabled={!licPreview || (role === "guide" && (!licClass || !licExpiry))} busy={busy} onClick={submitLicense}>Submit & enter the hub</OCta>
          <button onClick={() => finish(null)} disabled={busy} className="tap w-full text-[13.5px] font-medium mt-3" style={{ color: C.muted }}>Skip for now — I’ll add it later</button>
          <div className="rounded-xl p-3 flex gap-2.5 mt-4" style={{ background: C.goldSoft }}>
            <ShieldCheck size={16} color={C.maroon} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: "#5a4a2e" }}>Your license is stored privately and never shown to other users — only our review team sees it.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Messages · unified inbox (trips + DMs) ==================== */
function ChatsTab({ user, me, dm, trips, actions, posts, dirTick, onOpenPost, openWith, onOpened, onOpenProfile }) {
  const [withId, setWithId] = useState(openWith || null);
  const [tripId, setTripId] = useState(null);
  const [find, setFind] = useState(false);
  const msgs = dm?.dms || [];

  useEffect(() => { if (openWith) { setWithId(openWith); onOpened && onOpened(); } }, [openWith]);

  const meId = user.talentId || user.id;
  const myTrips = (trips || []).filter((tr) => (tr.members || []).some((m) => m.id === meId) || (tr.operatorId && tr.operatorId === meId));

  const threads = useMemo(() => {
    // plain object, not a JS Map — nothing here can collide with an icon name
    const byPerson = {};
    msgs.forEach((m) => {
      if (m.from !== me && m.to !== me) return;
      const other = m.from === me ? m.to : m.from;
      const prev = byPerson[other];
      if (!prev || m.ts > prev.ts) byPerson[other] = { other, ts: m.ts, body: m.body, fromMe: m.from === me, unread: 0 };
    });
    Object.keys(byPerson).forEach((k) => {
      byPerson[k].unread = msgs.filter((x) => x.from === k && x.to === me && !x.read).length;
    });
    return Object.values(byPerson).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [msgs, me]);

  const openTrip = myTrips.find((t) => t.id === tripId);
  if (openTrip) return <TripChatView user={user} meId={me} trip={openTrip} actions={actions} onBack={() => setTripId(null)} />;
  if (withId) return <DmThread me={me} otherId={withId} dm={dm} posts={posts} onOpenPost={onOpenPost} onBack={() => setWithId(null)} onOpenProfile={onOpenProfile} />;
  if (find) return <PickContact me={me} dirTick={dirTick} onPick={(id) => { setFind(false); setWithId(id); }} onBack={() => setFind(false)} />;

  return (
    <div className="px-5 py-4">
      {/* TRIP CHANNELS */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[11.5px] font-semibold tracking-[.14em] uppercase" style={{ color: C.gold }}>Trip channels</div>
        <span className="text-[11.5px]" style={{ color: C.muted }}>{myTrips.length}</span>
      </div>
      {myTrips.length === 0 ? (
        <div className="rounded-xl px-4 py-3 mb-6 text-[13px]" style={{ background: C.card, border: `1px dashed ${C.line}`, color: C.muted }}>
          No trips yet — a channel opens automatically when a booking is confirmed.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden mb-6" style={{ border: `1px solid ${C.line}` }}>
          {myTrips.map((tr, idx) => {
            const state = tripStateNow(tr);
            const last = [...tr.chat.messages].reverse().find((m) => m.kind !== "system");
            const live = state === "active";
            return (
              <button key={tr.id} onClick={() => setTripId(tr.id)} className="tap w-full text-left px-4 py-3.5 flex items-center gap-3"
                style={{ background: C.card, borderTop: idx ? `1px solid ${C.lineSoft}` : "none" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: live ? C.pine : C.bg }}>
                  <span className="text-[15px] font-bold" style={{ color: live ? C.goldSoft : C.muted }}>#</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-semibold truncate" style={{ color: C.ink }}>{tr.title}</div>
                  <div className="text-[12px] truncate" style={{ color: C.muted }}>
                    {last ? `${last.senderId === me ? "You: " : ""}${last.kind === "photo" ? "Photo" : last.body}` : `${fmtDate(tr.start)} – ${fmtDate(tr.end)}`}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <CrewAvatars members={tr.members} size={22} />
                  <TripStateBadge state={state} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* DIRECT MESSAGES */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[11.5px] font-semibold tracking-[.14em] uppercase" style={{ color: C.gold }}>Direct messages</div>
        <button onClick={() => setFind(true)} className="tap inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: C.pine }}>
          <UserPlus size={14} /> New
        </button>
      </div>

      {threads.length === 0 ? (
        <button onClick={() => setFind(true)} className="tap w-full rounded-2xl px-6 py-8 flex flex-col items-center text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.goldSoft }}><MessageCircle size={22} color={C.gold} /></div>
          <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>No messages yet</div>
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>Tap to message a guide, driver or operator.</p>
        </button>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {threads.map((t, idx) => {
            const p = talentById(t.other);
            return (
              <button key={t.other} onClick={() => setWithId(t.other)} className="tap w-full text-left px-4 py-3 flex items-center gap-3"
                style={{ background: C.card, borderTop: idx ? `1px solid ${C.lineSoft}` : "none" }}>
                <Avatar initials={p?.initials || "?"} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{p?.name || "Member"}</span>
                    {p?.verified && <BadgeCheck size={14} color={C.pine} />}
                  </div>
                  <div className="text-[12.5px] truncate" style={{ color: t.unread ? C.ink : C.muted, fontWeight: t.unread ? 600 : 400 }}>{t.fromMe ? "You: " : ""}{t.body}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px]" style={{ color: C.muted }}>{relTime(t.ts)}</div>
                  {t.unread > 0 && <span className="inline-block mt-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white leading-[18px]" style={{ background: C.maroon }}>{t.unread}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* trip channel opened from the inbox — chat first, details behind the ⋯ menu */
function TripChatView({ user, meId, trip, actions, onBack }) {
  const [showDetails, setShowDetails] = useState(false);
  const state = tripStateNow(trip);
  return (
    <div className="fade">
      <div className="h-14 px-3 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.card }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}` }}><ChevronLeft size={19} color={C.ink} /></button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}># {trip.title}</div>
          <div className="text-[11.5px]" style={{ color: C.muted }}>{trip.members.length} in crew · {fmtDate(trip.start)} – {fmtDate(trip.end)}</div>
        </div>
        <TripStateBadge state={state} />
        <button onClick={() => setShowDetails((v) => !v)} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}` }} aria-label="Trip details">
          <span className="text-[16px] leading-none" style={{ color: C.muted }}>⋯</span>
        </button>
      </div>

      {showDetails && (
        <div className="px-5 py-4 fade" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <div className="rounded-xl p-3.5 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: C.ink }}><MapPin size={14} color={C.gold} /> Meeting point</div>
            <div className="text-[13px] mt-1" style={{ color: C.muted }}>{trip.meetingPoint}</div>
          </div>
          <div className="rounded-xl divide-y mb-3" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
            {(trip.members || []).map((m) => {
              const mp = m.id === meId ? null : talentById(m.id)?.phone;
              const dial = mp ? dialNumber(mp) : null;
              return (
                <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Avatar initials={m.initials} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{m.name}</div>
                    <div className="text-[11.5px] capitalize" style={{ color: C.muted }}>{String(m.roleInTrip || "crew").replace("_", " ")}{dial ? ` · ${dial}` : ""}</div>
                  </div>
                  {m.id === meId ? (
                    <span className="text-[10.5px] font-semibold rounded-full px-2 py-0.5" style={{ background: C.goldSoft, color: "#7a5a1e" }}>You</span>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => { setTripId(null); setWithId(m.id); }} className="tap w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: C.bg, border: `1px solid ${C.line}` }} aria-label={`Message ${m.name}`}>
                        <MessageCircle size={14} color={C.ink} />
                      </button>
                      {dial && (
                        <a href={`tel:${dial}`} className="tap w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: C.pineSoft, border: `1px solid ${C.line}` }} aria-label={`Call ${m.name}`}>
                          <PhoneCall size={14} color={C.pine} />
                        </a>
                      )}
                      {dial && (
                        <a href={`https://wa.me/${dial.replace("+", "")}`} target="_blank" rel="noreferrer"
                          className="tap w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(37,211,102,.13)", border: "1px solid rgba(37,211,102,.45)" }} aria-label={`WhatsApp ${m.name}`}>
                          <MessageCircle size={14} color="#1FA855" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {trip.itinerary.length > 0 && (
            <div className="space-y-2">
              {(trip.itinerary || []).map((it) => (
                <div key={it.day} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: C.pine }}><span className="text-[11px] font-bold" style={{ color: C.goldSoft }}>{it.day}</span></div>
                  <span className="text-[13.5px] font-medium" style={{ color: C.ink }}>{it.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-5 py-4">
        <Chat user={user} meId={meId} trip={trip} state={state} actions={actions} />
      </div>
    </div>
  );
}

function PickContact({ me, dirTick, onPick, onBack }) {
  const [q, setQ] = useState("");
  const [people, setPeople] = useState(null);   // null = loading
  const [err, setErr] = useState(null);

  // fetch directly — never rely on cached module state for something this important
  useEffect(() => {
    let on = true;
    (async () => {
      if (!CLOUD) { setPeople(TALENT.filter((p) => p.id !== me)); return; }
      const { data, error } = await supabase
        .from("profiles").select("*").order("full_name", { ascending: true });
      if (!on) return;
      if (error) { console.error("PickContact load failed:", error.message); setErr(error.message); setPeople([]); return; }
      const list = (data || []).map(profileToTalent).filter((p) => p.id !== me);
      list.forEach((p) => { PROFILE_DIR[p.id] = p; });   // keep the cache warm too
      setPeople(list);
    })();
    return () => { on = false; };
  }, [me, dirTick]);

  const list = (people || []).filter((p) =>
    `${p.name} ${p.handle || ""} ${p.base || ""} ${roleLabel(p.role)}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <span className="text-[15px] font-semibold" style={{ color: C.ink }}>New message</span>
      </div>
      <div className="px-5 py-4">
        <div className="relative mb-3">
          <Search size={16} color={C.muted} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people"
            className="w-full h-11 pl-10 pr-4 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        </div>

        {people === null ? (
          <div className="flex items-center gap-2 justify-center py-10 text-[14px]" style={{ color: C.muted }}>
            <Loader2 size={17} className="animate-spin" /> Loading people…
          </div>
        ) : err ? (
          <div className="rounded-xl p-4 text-[13px]" style={{ background: C.maroonSoft, color: C.maroon }}>
            Couldn't load people: {err}
          </div>
        ) : list.length === 0 ? (
          <Empty Icon={Users} title={q ? "Nobody found" : "No one else yet"}
            body={q ? "Try a different name." : "Guides, drivers and operators appear here once they've signed up."} />
        ) : (
          <div className="space-y-2.5">
            {list.map((p) => (
              <button key={p.id} onClick={() => onPick(p.id)} className="tap w-full text-left rounded-2xl p-3.5 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <Avatar initials={p.initials} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{p.name}</span>
                    {p.verified && <BadgeCheck size={14} color={C.pine} />}
                  </div>
                  <div className="text-[12.5px]" style={{ color: C.muted }}>{roleLabel(p.role)}{p.base ? ` · ${p.base}` : ""}</div>
                </div>
                <MessageCircle size={17} color={C.muted} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DmThread({ me, otherId, dm, posts, onOpenPost, onBack, onOpenProfile }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState(null);
  const [failed, setFailed] = useState(null);
  const scrollRef = useRef();
  const fileRef = useRef();
  const p = talentById(otherId);
  const thread = (dm?.dms || [])
    .filter((m) => m && ((m.from === me && m.to === otherId) || (m.from === otherId && m.to === me)))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));

  useEffect(() => { dm?.markRead && dm.markRead(otherId); }, [otherId, thread.length]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [thread.length]);

  const flash = (m) => { setNote(m); setTimeout(() => setNote(null), 2400); };

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setText("");
    setSending(true);
    const res = await dm.sendDm(otherId, t);
    setSending(false);
    if (res && res.ok === false) {
      setText(t);                       // give them their words back
      setFailed(res.reason || "Message didn't send. Check your connection and try again.");
      setTimeout(() => setFailed(null), 6000);
    }
  };

  const sendPhoto = async (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    if (f.size > 8 * 1024 * 1024) return flash("Photo is over 8 MB.");
    const r = new FileReader();
    r.onload = async () => { await dm.sendDm(otherId, "Photo", null, { photoDataUri: r.result }); };
    r.readAsDataURL(f);
  };

  const sendLocation = () => {
    if (!navigator.geolocation) return flash("Location isn't available on this device.");
    flash("Getting an accurate fix…");
    let best = null;
    // watch briefly and keep the most accurate reading — a single sample is often
    // 100m+ out in mountain terrain, and improves as the GPS settles
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= 15) finish();
      },
      (e) => { if (!best) { navigator.geolocation.clearWatch(id); flash(e.code === 1 ? "Location permission denied." : "Couldn't get your location."); } },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
    const timer = setTimeout(finish, 12000);
    function finish() {
      clearTimeout(timer);
      navigator.geolocation.clearWatch(id);
      if (!best) return flash("Couldn't get a fix — try again outdoors.");
      const acc = Math.round(best.coords.accuracy);
      dm.sendDm(otherId, "Shared a location", null, {
        lat: +best.coords.latitude.toFixed(6),
        lng: +best.coords.longitude.toFixed(6),
        accuracy: acc,
        altitude: best.coords.altitude != null ? Math.round(best.coords.altitude) : null,
      });
      flash(acc <= 20 ? `Sent · accurate to ${acc}m` : `Sent · approx. ${acc}m — GPS is weak here`);
    }
  };

  // group by day
  const dayLabel = (ts) => {
    const d = new Date(ts || Date.now()), now = new Date();
    if (isNaN(d.getTime())) return "";
    const same = (a, b) => a.toDateString() === b.toDateString();
    if (same(d, now)) return "Today";
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (same(d, y)) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  let lastDay = null;

  return (
    <div className="fade flex flex-col" style={{ height: "100%" }}>
      <div className="shrink-0 h-14 px-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.card }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}` }}><ChevronLeft size={19} color={C.ink} /></button>
        <button onClick={() => onOpenProfile && onOpenProfile(otherId)} className="tap flex items-center gap-2.5 flex-1 min-w-0 text-left">
          <Avatar initials={p?.initials || "?"} size={36} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{p?.name || "Member"}</span>
              {p?.verified && <BadgeCheck size={14} color={C.pine} />}
            </div>
            <div className="text-[11.5px]" style={{ color: C.muted }}>{p ? roleLabel(p.role) : ""}{p?.base ? ` · ${p.base}` : ""}</div>
          </div>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto hidescroll px-4 py-4 space-y-1.5" style={{ background: C.bg, scrollbarWidth: "none" }}>
        {thread.length === 0 && (
          <div className="text-center py-10">
            <Avatar initials={p?.initials || "?"} size={56} />
            <p className="text-[14px] font-semibold mt-3" style={{ color: C.ink }}>{p?.name}</p>
            <p className="text-[13px] mt-1" style={{ color: C.muted }}>Say hello — messages are private between you two.</p>
          </div>
        )}
        {thread.map((m, idx) => {
          const mine = m.from === me;
          const prev = thread[idx - 1];
          const next = thread[idx + 1];
          const label = dayLabel(m.ts || Date.now());
          const showDay = label !== lastDay;
          lastDay = label;
          const grouped = prev && prev.from === m.from && m.ts - prev.ts < 4 * 60000;
          const lastOfGroup = !next || next.from !== m.from || next.ts - m.ts >= 4 * 60000;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="text-center my-3">
                  <span className="text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>{label}</span>
                </div>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`} style={{ marginTop: grouped ? 2 : 8 }}>
                <div style={{ maxWidth: "82%" }}>
                  <div className="overflow-hidden" style={{
                    background: mine ? C.pine : C.card,
                    border: mine ? "none" : `1px solid ${C.line}`,
                    borderRadius: 18,
                    borderBottomRightRadius: mine && lastOfGroup ? 5 : 18,
                    borderBottomLeftRadius: !mine && lastOfGroup ? 5 : 18,
                  }}>
                    {m.sharedPostId && (() => {
                      const sp = (posts || []).find((x) => x.id === m.sharedPostId);
                      if (!sp) return <div className="px-3.5 pt-2.5 text-[12.5px]" style={{ color: mine ? "#ffffffcc" : C.muted }}>Shared post unavailable</div>;
                      const a = talentById(sp.talentId);
                      return (
                        <button onClick={() => onOpenPost && onOpenPost(sp)} className="tap block w-full text-left">
                          {sp.media?.dataUri && <img src={sp.media.dataUri} alt="" className="w-full block" style={{ maxHeight: 190, objectFit: "cover" }} />}
                          <div className="px-3 py-2" style={{ background: mine ? "rgba(255,255,255,.12)" : C.bg }}>
                            <div className="text-[12px] font-semibold" style={{ color: mine ? "#fff" : C.ink }}>{a?.name || "Member"}</div>
                            {sp.text && <div className="text-[11.5px] truncate" style={{ color: mine ? "#ffffffcc" : C.muted }}>{sp.text}</div>}
                          </div>
                        </button>
                      );
                    })()}

                    {m.photo && <img src={m.photo} alt="" className="w-full block" style={{ maxHeight: 260, objectFit: "cover" }} />}

                    {m.lat != null && m.lng != null && (
                      <div className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <NavIcon size={15} color={mine ? "#fff" : C.gold} />
                          <span className="text-[13.5px] font-semibold" style={{ color: mine ? "#fff" : C.ink }}>Location shared</span>
                        </div>
                        <div className="text-[11.5px] mt-0.5 font-mono" style={{ color: mine ? "#ffffffcc" : C.muted }}>{m.lat}, {m.lng}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: mine ? "#ffffffaa" : C.muted }}>
                          {m.accuracy != null ? `±${m.accuracy}m` : "accuracy unknown"}{m.altitude != null ? ` · ${m.altitude}m elevation` : ""}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <a href={`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`} target="_blank" rel="noreferrer"
                            className="tap flex-1 h-9 rounded-lg text-[12px] font-semibold inline-flex items-center justify-center"
                            style={{ background: mine ? "rgba(255,255,255,.16)" : C.bg, color: mine ? "#fff" : C.ink }}>Open in Maps</a>
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`} target="_blank" rel="noreferrer"
                            className="tap flex-1 h-9 rounded-lg text-[12px] font-semibold inline-flex items-center justify-center"
                            style={{ background: mine ? "rgba(255,255,255,.16)" : C.bg, color: mine ? "#fff" : C.ink }}>Directions</a>
                        </div>
                        <button onClick={() => { navigator.clipboard?.writeText(`${m.lat}, ${m.lng}`); }}
                          className="tap w-full h-8 rounded-lg text-[11.5px] font-medium mt-1.5"
                          style={{ background: "transparent", color: mine ? "#ffffffaa" : C.muted }}>Copy coordinates</button>
                      </div>
                    )}

                    {m.body && !(m.photo && m.body === "Photo") && !(m.lat != null && m.body === "Shared a location") && (
                      <div className="px-3.5 py-2.5">
                        <span className="text-[14.5px] leading-snug" style={{ color: mine ? "#fff" : C.ink }}>{m.body}</span>
                      </div>
                    )}
                  </div>

                  {lastOfGroup && (
                    <div className={`flex items-center gap-1 text-[10.5px] mt-0.5 ${mine ? "justify-end mr-1" : "ml-1"}`} style={{ color: C.muted }}>
                      {relTime(m.ts || Date.now())}
                      {mine && (m.sending ? <Clock size={11} /> : m.read ? <CheckCheck size={12} color={C.pine} /> : <Check size={11} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {note && <div className="px-4 py-2 text-[12px] text-center" style={{ background: C.pineSoft, color: C.pine }}>{note}</div>}
      {failed && (
        <div className="px-4 py-2.5 flex items-start gap-2" style={{ background: C.maroonSoft }}>
          <ShieldAlert size={14} color={C.maroon} className="shrink-0 mt-0.5" />
          <span className="text-[12px] leading-snug" style={{ color: C.maroon }}>{failed}</span>
        </div>
      )}

      <div className="shrink-0 px-2.5 py-2 flex items-end gap-1.5 safe-bottom" style={{ background: C.card, borderTop: `1px solid ${C.line}` }}>
        <button onClick={() => fileRef.current?.click()} className="tap w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.bg }} aria-label="Send photo">
          <Camera size={18} color={C.muted} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={sendPhoto} className="hidden" />
        <button onClick={sendLocation} className="tap w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.bg }} aria-label="Send location">
          <MapPin size={18} color={C.muted} />
        </button>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Message…" className="flex-1 px-4 py-2.5 rounded-2xl text-[15px] resize-none"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, maxHeight: 100, minHeight: 40 }} />
        <button onClick={send} disabled={!text.trim()} className="tap w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: text.trim() ? C.pine : "#C7CEC7" }} aria-label="Send">
          <SendIcon size={17} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ===================== Share a post to people (in-app) ==================== */
function SharePostSheet({ post, eng, onExternal, onClose, onSent }) {
  const [picked, setPicked] = useState([]);
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const me = eng?.me;
  const follows = eng?.follows || [];
  const iFollow = follows.filter((f) => f.follower === me).map((f) => f.following);
  const followsMe = follows.filter((f) => f.following === me).map((f) => f.follower);
  const circle = [...new Set([...iFollow, ...followsMe])];

  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    let on = true;
    (async () => {
      if (!CLOUD) { setFetched(TALENT.filter((p) => p.id !== me)); return; }
      const { data, error } = await supabase.from("profiles").select("*").order("full_name", { ascending: true });
      if (!on) return;
      if (error) { console.error("SharePostSheet load failed:", error.message); setFetched([]); return; }
      const list = (data || []).map(profileToTalent).filter((p) => p.id !== me);
      list.forEach((p) => { PROFILE_DIR[p.id] = p; });
      setFetched(list);
    })();
    return () => { on = false; };
  }, [me]);
  const unique = fetched || [];
  const inCircle = unique.filter((p) => circle.includes(p.id));
  const others = unique.filter((p) => !circle.includes(p.id));
  const match = (p) => `${p.name} ${p.handle || ""} ${p.base || ""}`.toLowerCase().includes(q.toLowerCase());

  const toggle = (id) => setPicked((P) => (P.includes(id) ? P.filter((x) => x !== id) : [...P, id]));

  const send = async () => {
    if (!picked.length || !eng?.sharePostTo) return;
    setBusy(true);
    await eng.sharePostTo(picked, post, note);
    setBusy(false);
    onSent && onSent(picked.length);
    onClose();
  };

  const Row = ({ p }) => (
    <button onClick={() => toggle(p.id)} className="tap w-full text-left px-1 py-2 flex items-center gap-3">
      <Avatar initials={p.initials} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{p.name}</span>
          {p.verified && <BadgeCheck size={14} color={C.pine} />}
        </div>
        <div className="text-[12px]" style={{ color: C.muted }}>{roleLabel(p.role)}{p.base ? ` · ${p.base}` : ""}</div>
      </div>
      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: picked.includes(p.id) ? C.pine : C.card, border: `1.5px solid ${picked.includes(p.id) ? C.pine : C.line}` }}>
        {picked.includes(p.id) && <Check size={13} color="#fff" strokeWidth={3} />}
      </span>
    </button>
  );

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 220 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "88dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Send this post</div>
          <p className="text-[13px] mt-0.5 mb-3" style={{ color: C.muted }}>It arrives in their Messages.</p>
          <div className="relative">
            <Search size={16} color={C.muted} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people"
              className="w-full h-11 pl-10 pr-4 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hidescroll px-4" style={{ scrollbarWidth: "none" }}>
          {inCircle.filter(match).length > 0 && (
            <>
              <div className="text-[11.5px] font-semibold tracking-[.12em] uppercase mt-1 mb-1" style={{ color: C.gold }}>Followers & following</div>
              {inCircle.filter(match).map((p) => <Row key={p.id} p={p} />)}
            </>
          )}
          {others.filter(match).length > 0 && (
            <>
              <div className="text-[11.5px] font-semibold tracking-[.12em] uppercase mt-3 mb-1" style={{ color: C.gold }}>Everyone else</div>
              {others.filter(match).map((p) => <Row key={p.id} p={p} />)}
            </>
          )}
          {unique.filter(match).length === 0 && (
            <p className="text-[13.5px] text-center py-8" style={{ color: C.muted }}>Nobody found.</p>
          )}
        </div>

        <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} placeholder="Add a message (optional)"
            className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-2.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <button onClick={send} disabled={!picked.length || busy}
            className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            style={{ background: picked.length ? C.pine : "#C7CEC7", color: "#fff" }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><SendIcon size={17} /> Send{picked.length ? ` to ${picked.length}` : ""}</>}
          </button>
          <button onClick={() => { onExternal(); onClose(); }} className="tap w-full h-11 rounded-xl text-[13.5px] font-semibold mt-2 inline-flex items-center justify-center gap-2"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
            <Share2 size={15} /> Share outside the app
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}

/* ==================== Followers / Following list sheet =================== */
function FollowListSheet({ mode, talent, eng, onClose, onOpenProfile }) {
  const follows = eng?.follows || [];
  const me = eng?.me;
  const ids = mode === "followers"
    ? follows.filter((f) => f.following === talent.id).map((f) => f.follower)
    : follows.filter((f) => f.follower === talent.id).map((f) => f.following);
  const people = ids.map((id) => talentById(id)).filter(Boolean);

  return createPortal((
    <div className="fixed inset-0 flex flex-col fade" style={{ background: C.bg, zIndex: 220, paddingTop: "var(--sa-top)" }}>
      <div className="w-full flex-1 min-h-0 flex flex-col" style={{ background: C.bg }} onClick={(e) => e.stopPropagation()}>
        <div className="h-14 px-4 flex items-center gap-3 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.card }}>
          <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.bg }}>
            <ChevronLeft size={19} color={C.ink} />
          </button>
          <div className="text-[16px] font-semibold" style={{ color: C.ink }}>
            {mode === "followers" ? "Followers" : "Following"} · {people.length}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto hidescroll px-4 pb-5" style={{ scrollbarWidth: "none" }}>
          {people.length === 0 ? (
            <p className="text-[13.5px] text-center py-10" style={{ color: C.muted }}>
              {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          ) : people.map((p) => {
            const iFollowThem = follows.some((f) => f.follower === me && f.following === p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <button onClick={() => onOpenProfile(p.id)} className="tap flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Avatar initials={p.initials} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{p.name}</span>
                      {p.verified && <BadgeCheck size={14} color={C.pine} />}
                    </div>
                    <div className="text-[12px]" style={{ color: C.muted }}>{roleLabel(p.role)}{p.base ? ` · ${p.base}` : ""}</div>
                  </div>
                </button>
                {p.id !== me && (
                  <button onClick={() => eng?.toggleFollow && eng.toggleFollow(p.id)}
                    className="tap shrink-0 h-9 px-3.5 rounded-lg text-[13px] font-semibold"
                    style={{ background: iFollowThem ? C.card : C.pine, border: iFollowThem ? `1px solid ${C.line}` : "none", color: iFollowThem ? C.ink : "#fff" }}>
                    {iFollowThem ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  ), document.body);
}

/* ======================= Edit profile (bio + joining date) ======================= */
function EditProfileSheet({ talent, onClose, onSaved }) {
  const [bio, setBio] = useState(talent.pitch || "");
  const [name, setName] = useState(talent.name || "");
  const [handle, setHandle] = useState(talent.handle || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const handleClean = handle.trim().toLowerCase().replace(/^@+/, "");
  const handleValid = !handleClean || /^[a-z0-9_.]{3,20}$/.test(handleClean);

  const save = async () => {
    if (!name.trim()) { setErr("Your name can't be empty."); return; }
    if (!handleValid) { setErr("Handles are 3\u201320 characters: letters, numbers, dots or underscores."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("profiles").update({
      pitch: bio.trim() || null,
      full_name: name.trim(),
      handle: handleClean || null,
    }).eq("id", talent.id);
    setBusy(false);
    if (error) {
      setErr(error.code === "23505" || /handle/i.test(error.message || "")
        ? "That handle is already taken \u2014 try another."
        : (error.message || "Couldn't save \u2014 try again."));
      return;
    }
    onSaved && onSaved();
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex flex-col fade" style={{ background: C.bg, zIndex: 225, paddingTop: "var(--sa-top)" }}>
      <div className="h-14 px-4 flex items-center gap-3 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.card }}>
        <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.bg }}>
          <ChevronLeft size={19} color={C.ink} />
        </button>
        <div className="text-[16px] font-semibold flex-1" style={{ color: C.ink }}>Edit profile</div>
        <button onClick={save} disabled={busy} className="tap h-9 px-4 rounded-full text-[14px] font-semibold" style={{ background: C.pine, color: "#fff" }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hidescroll px-5 py-5" style={{ scrollbarWidth: "none" }}>
        <div className="text-[13px] font-semibold mb-1.5" style={{ color: C.ink }}>Name</div>
        <input value={name} onChange={(e) => { setName(e.target.value); setErr(null); }} maxLength={60}
          className="w-full h-12 px-3.5 rounded-xl text-[15px] mb-4"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <div className="text-[13px] font-semibold mb-1.5" style={{ color: C.ink }}>Handle <span className="font-normal" style={{ color: C.muted }}>· optional</span></div>
        <div className="relative mb-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px]" style={{ color: C.muted }}>@</span>
          <input value={handle} onChange={(e) => { setHandle(e.target.value); setErr(null); }} maxLength={21}
            placeholder="yourname" autoCapitalize="none" autoCorrect="off"
            className="w-full h-12 pl-8 pr-3.5 rounded-xl text-[15px]"
            style={{ background: C.card, border: `1px solid ${handleValid ? C.line : C.maroon}`, color: C.ink }} />
        </div>
        <p className="text-[11.5px] mb-4" style={{ color: handleValid ? C.muted : C.maroon }}>
          A unique short name people can search you by \u2014 letters, numbers, dots, underscores.
        </p>

        <div className="text-[13px] font-semibold mb-1.5" style={{ color: C.ink }}>About you</div>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={240}
          placeholder="A short bio — who you are, what you show travellers, and what makes your trips yours."
          className="w-full px-3.5 py-3 rounded-xl text-[14.5px] leading-relaxed resize-none"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        <div className="text-[11px] text-right mt-1" style={{ color: C.muted }}>{bio.length}/240</div>

        <div className="rounded-xl px-3.5 py-3 mt-5" style={{ background: C.pineSoft }}>
          <div className="text-[12.5px] font-semibold" style={{ color: C.pine }}>Experience is automatic</div>
          <p className="text-[11.5px] mt-1 leading-snug" style={{ color: C.pine }}>
            Your years of experience are read straight from your Department of Tourism licence number \u2014 no separate
            entry needed here. Set it once under My licence and it stays current forever.
          </p>
        </div>
        {err && <p className="text-[12.5px] mt-2" style={{ color: C.maroon }}>{err}</p>}
      </div>
    </div>
  ), document.body);
}

/* ==================== Credentials page (licence + certificates) ==================== */
function CredentialsPage({ talent, self, onClose }) {
  const t = talent;
  const gc = t.guideClass ? GUIDE_CLASSES[t.guideClass] : null;
  const [licUrl, setLicUrl] = useState(null);
  const [certs, setCerts] = useState(null);
  const [certUrls, setCertUrls] = useState({});
  const [adding, setAdding] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [certCrop, setCertCrop] = useState(null);
  const [certImg, setCertImg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [bigView, setBigView] = useState(null);
  const certFileRef = useRef();
  const certCamRef = useRef();
  const [certSrcOpen, setCertSrcOpen] = useState(false);
  const [certCamOpen, setCertCamOpen] = useState(false);

  const load = async () => {
    if (t.licensePath) {
      const { data } = await supabase.storage.from("licenses").createSignedUrl(t.licensePath, 600);
      setLicUrl(data?.signedUrl || null);
    }
    const { data: rows, error } = await supabase.from("certificates").select("*").eq("profile_id", t.id).order("created_at", { ascending: false });
    if (error) { setCerts([]); return; }
    setCerts(rows || []);
    const urls = {};
    for (const c of rows || []) {
      const { data } = await supabase.storage.from("certs").createSignedUrl(c.file_path, 600);
      if (data?.signedUrl) urls[c.id] = data.signedUrl;
    }
    setCertUrls(urls);
  };
  useEffect(() => { load(); }, [t.id]);

  const pickCert = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader(); r.onload = () => setCertCrop([r.result]); r.readAsDataURL(f);
  };
  const saveCert = async () => {
    if (!cTitle.trim() || !certImg) { setErr("Give it a title and add the photo."); return; }
    setBusy(true); setErr(null);
    try {
      const small = await shrinkImage(certImg, 1600, 0.85);
      const blob = dataUriToBlob(small);
      const path = `${t.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("certs").upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("certificates").insert({ profile_id: t.id, title: cTitle.trim(), file_path: path });
      if (insErr) throw insErr;
      setCTitle(""); setCertImg(null); setAdding(false);
      load();
    } catch (e2) { setErr(e2.message || "Couldn't save the certificate."); }
    setBusy(false);
  };
  const removeCert = async (c) => {
    await supabase.storage.from("certs").remove([c.file_path]);
    await supabase.from("certificates").delete().eq("id", c.id);
    load();
  };

  return createPortal((
    <div className="fixed inset-0 flex flex-col fade" style={{ background: C.bg, zIndex: 225, paddingTop: "var(--sa-top)" }}>
      <div className="h-14 px-4 flex items-center gap-3 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.card }}>
        <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.bg }}>
          <ChevronLeft size={19} color={C.ink} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-semibold truncate" style={{ color: C.ink }}>Credentials</div>
          <div className="text-[11.5px]" style={{ color: C.muted }}>{t.name}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hidescroll px-5 py-4" style={{ scrollbarWidth: "none" }}>
        {t.role === "guide" && (
        <>
        <SectionLabel>Department of Tourism licence</SectionLabel>
        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `2px solid ${gc ? gc.color : C.line}` }}>
          {licUrl ? (
            <button onClick={() => setBigView(licUrl)} className="tap w-full block">
              <img src={licUrl} alt="Licence" className="w-full block" style={{ maxHeight: 240, objectFit: "cover" }} />
            </button>
          ) : (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: C.muted }}>No licence photo on record.</div>
          )}
          <div className="p-4">
            {gc && (
              <span className="text-[12px] font-bold rounded-full px-2.5 py-1" style={{ background: gc.color, color: "#fff" }}>{gc.label}</span>
            )}
            <div className="text-[13px] mt-2.5" style={{ color: C.ink }}>
              {t.licenseNo || "Number not on file"}{t.licenseExpiry ? ` · expires ${t.licenseExpiry}` : ""}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2 text-[12.5px] font-semibold rounded-full px-2.5 py-1"
              style={{ background: t.verified ? C.pineSoft : C.goldSoft, color: t.verified ? C.pine : "#7a5a1e" }}>
              {t.verified ? <><BadgeCheck size={13} /> Verified by admin with DOT & GAB</> : <><Clock size={13} /> Pending admin verification</>}
            </div>
          </div>
        </div>
        </>
        )}

        <div className="mt-6 flex items-center justify-between">
          <SectionLabel trailing={certs ? `${certs.length}` : null}>Other certificates</SectionLabel>
          {self && !adding && (
            <button onClick={() => setAdding(true)} className="tap text-[13px] font-semibold" style={{ color: C.pine }}>+ Add</button>
          )}
        </div>

        {self && adding && (
          <div className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} maxLength={60} placeholder="Certificate title — e.g. Wilderness First Aid 2025"
              className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-2" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            {certImg ? (
              <div className="relative rounded-xl overflow-hidden mb-2" style={{ border: `1px solid ${C.line}` }}>
                <img src={certImg} alt="" className="w-full block" style={{ maxHeight: 200, objectFit: "cover" }} />
                <button onClick={() => setCertImg(null)} className="tap absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}><X size={14} color="#fff" /></button>
              </div>
            ) : (
              <button onClick={() => setCertSrcOpen(true)} className="tap w-full rounded-xl p-5 flex flex-col items-center mb-2"
                style={{ background: C.bg, border: `1.5px dashed ${C.line}` }}>
                <Upload size={19} color={C.gold} />
                <span className="text-[13px] font-semibold mt-1.5" style={{ color: C.ink }}>Add certificate photo</span>
                <span className="text-[11.5px] mt-0.5" style={{ color: C.muted }}>Cropped and scanned automatically</span>
              </button>
            )}
            <input ref={certFileRef} type="file" accept="image/*" onChange={pickCert} className="hidden" />
            <input ref={certCamRef} type="file" accept="image/*" capture="environment" onChange={pickCert} className="hidden" />
            {certSrcOpen && (
              <PhotoSourceSheet title="Certificate photo" onClose={() => setCertSrcOpen(false)}
                onCamera={() => { setCertSrcOpen(false); if (navigator.mediaDevices?.getUserMedia) setCertCamOpen(true); else certCamRef.current?.click(); }}
                onUpload={() => { setCertSrcOpen(false); certFileRef.current?.click(); }} />
            )}
            {certCamOpen && (
              <CameraCaptureSheet onClose={() => setCertCamOpen(false)} onFallback={() => certCamRef.current?.click()}
                onShot={(uri) => { setCertCamOpen(false); setCertCrop([uri]); }} />
            )}
            {err && <p className="text-[12.5px] mb-2" style={{ color: C.maroon }}>{err}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setAdding(false); setCertImg(null); setErr(null); }} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
              <button onClick={saveCert} disabled={busy} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: C.pine, color: "#fff" }}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}

        {certs === null ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[13px]" style={{ color: C.muted }}><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : certs.length === 0 && !adding ? (
          <p className="text-[13px] py-6 text-center" style={{ color: C.muted }}>
            {self ? "Add first-aid, trekking, language or any other certificates — operators see them here." : "No additional certificates on record."}
          </p>
        ) : (
          certs.map((c) => (
            <div key={c.id} className="rounded-2xl overflow-hidden mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              {certUrls[c.id] && (
                <button onClick={() => setBigView(certUrls[c.id])} className="tap w-full block">
                  <img src={certUrls[c.id]} alt="" className="w-full block" style={{ maxHeight: 190, objectFit: "cover" }} />
                </button>
              )}
              <div className="px-4 py-3 flex items-center gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{c.title}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: c.status === "verified" ? C.pine : C.muted }}>
                    {c.status === "verified" ? "Admin verified ✓" : "As provided by the guide"}
                  </div>
                </div>
                {self && <button onClick={() => removeCert(c)} className="tap text-[12px] font-semibold shrink-0" style={{ color: C.maroon }}>Remove</button>}
              </div>
            </div>
          ))
        )}
        <div className="h-6" />
      </div>

      {certCrop && (
        <CardScanEditor image={certCrop[0]}
          onClose={() => setCertCrop(null)}
          onDone={async (flat) => {
            setCertCrop(null);
            try { setCertImg(await bakeEnhance(flat, { bright: 1.02, contrast: 1.1, sat: 1.05, warmth: 0, auto: true })); }
            catch (e) { setCertImg(flat); }
          }} />
      )}
      {bigView && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(8,10,8,.92)", zIndex: 260 }} onClick={() => setBigView(null)}>
          <img src={bigView} alt="" className="max-w-full max-h-full" style={{ objectFit: "contain" }} />
          <button onClick={() => setBigView(null)} className="tap absolute w-10 h-10 rounded-full flex items-center justify-center" style={{ top: "calc(var(--sa-top) + 10px)", right: 14, background: "rgba(255,255,255,.14)" }}><X size={19} color="#fff" /></button>
        </div>
      )}
    </div>
  ), document.body);
}

/* ===================== Guide licence self-service card ===================== */
function GuideLicenseCard({ talent, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [no, setNo] = useState(talent.licenseNo || "");
  const [exp, setExp] = useState(talent.licenseExpiry || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoCrop, setPhotoCrop] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState(null);
  const photoRef = useRef();
  const photoCamRef = useRef();
  const [photoSrcOpen, setPhotoSrcOpen] = useState(false);
  const [photoCamOpen, setPhotoCamOpen] = useState(false);
  const pickPhoto = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader(); r.onload = () => setPhotoCrop([r.result]); r.readAsDataURL(f);
  };
  const savePhoto = async (scannedUri) => {
    setPhotoBusy(true); setPhotoMsg(null);
    try {
      const small = await shrinkImage(scannedUri, 1600, 0.85);
      const blob = dataUriToBlob(small);
      const path = `${talent.id}/lic-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("licenses").upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { error: prErr } = await supabase.from("profiles").update({ license_path: path, license_status: "submitted" }).eq("id", talent.id);
      if (prErr) throw prErr;
      setPhotoMsg("Photo saved — scanned and pending admin re-verification.");
      onSaved && onSaved();
    } catch (e2) { setPhotoMsg(e2.message || "Couldn't save the photo — try again."); }
    setPhotoBusy(false);
  };
  const cls = parseGuideClass(no);
  const valid = exp ? new Date(exp + "T00:00") > new Date() : false;
  const current = talent.guideClass ? GUIDE_CLASSES[talent.guideClass] : null;
  const expired = talent.licenseExpiry && new Date(talent.licenseExpiry + "T00:00") <= new Date();

  const save = async () => {
    if (!cls || !exp) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      license_no: no.trim(), license_expiry: exp,
      guide_class: cls && valid ? cls : null,
      license_status: "submitted",
    }).eq("id", talent.id);
    setBusy(false);
    if (error) { console.error("license update failed:", error.message); return; }
    setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 3200);
  };

  return (
    <div className="mt-6">
      <SectionLabel>My licence</SectionLabel>
      <div className="rounded-2xl p-4" style={{ background: C.card, border: `1.5px solid ${current ? current.color : expired ? C.maroon : C.line}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {current ? (
              <span className="text-[12px] font-bold rounded-full px-2.5 py-1" style={{ background: current.color, color: "#fff" }}>
                {current.label}{talent.verified ? "" : " · pending"}
              </span>
            ) : (
              <span className="text-[12.5px] font-semibold" style={{ color: expired ? C.maroon : C.muted }}>
                {expired ? "Licence expired — class removed" : "No class yet"}
              </span>
            )}
          </div>
          {!editing && <button onClick={() => setEditing(true)} className="tap text-[12.5px] font-semibold" style={{ color: C.pine }}>{talent.licenseNo ? "Update" : "Add"}</button>}
        </div>
        {!editing && (talent.licenseNo || talent.licenseExpiry) && (
          <div className="text-[12.5px] mt-2" style={{ color: C.muted }}>
            {talent.licenseNo || "No number"}{talent.licenseExpiry ? ` · expires ${talent.licenseExpiry}` : ""}
          </div>
        )}
        {saved && <p className="text-[12.5px] mt-2 font-medium" style={{ color: C.pine }}>Saved — pending admin re-verification with DOT.</p>}
        {editing && (
          <div className="mt-3">
            <input value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} placeholder="Licence number — e.g. STG082308"
              className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-2" style={{ background: C.bg, border: `1px solid ${no && !cls ? C.maroon : C.line}`, color: C.ink }} />
            <input type="date" value={exp} onChange={(e) => setExp(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-2" style={{ background: C.bg, border: `1px solid ${exp && !valid ? C.maroon : C.line}`, color: exp ? C.ink : C.muted }} />
            {cls && (
              <div className="rounded-lg px-3 py-2 mb-2 text-[12.5px] font-semibold" style={{ background: `${GUIDE_CLASSES[cls].color}14`, color: GUIDE_CLASSES[cls].color }}>
                {GUIDE_CLASSES[cls].label}{exp ? (valid ? " · valid" : " · EXPIRED") : ""}
                {licenseJoinYear(no) != null ? ` · joined ${licenseJoinYear(no)} · ${licenseExperienceYears(no)} yrs experience` : ""}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
              <button onClick={save} disabled={busy || !cls || !exp} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: C.pine, color: "#fff" }}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2.5 mt-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <div className="flex-1 text-[12.5px]" style={{ color: talent.licensePath ? C.pine : C.muted }}>
            {photoBusy ? "Scanning & uploading…" : talent.licensePath ? "Licence photo on record ✓" : "No licence photo yet — operators see it in Credentials."}
          </div>
          <button onClick={() => setPhotoSrcOpen(true)} disabled={photoBusy}
            className="tap h-9 px-3.5 rounded-xl text-[12.5px] font-semibold shrink-0"
            style={{ background: talent.licensePath ? C.card : C.gold, border: talent.licensePath ? `1px solid ${C.line}` : "none", color: talent.licensePath ? C.pine : "#fff" }}>
            {talent.licensePath ? "Replace photo" : "Add photo"}
          </button>
          <input ref={photoRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
          <input ref={photoCamRef} type="file" accept="image/*" capture="environment" onChange={pickPhoto} className="hidden" />
        </div>
        {photoSrcOpen && (
          <PhotoSourceSheet title="Licence photo" onClose={() => setPhotoSrcOpen(false)}
            onCamera={() => { setPhotoSrcOpen(false); if (navigator.mediaDevices?.getUserMedia) setPhotoCamOpen(true); else photoCamRef.current?.click(); }}
            onUpload={() => { setPhotoSrcOpen(false); photoRef.current?.click(); }} />
        )}
        {photoCamOpen && (
          <CameraCaptureSheet onClose={() => setPhotoCamOpen(false)} onFallback={() => photoCamRef.current?.click()}
            onShot={(uri) => { setPhotoCamOpen(false); setPhotoCrop([uri]); }} />
        )}
        <div className="hidden">
        </div>
        {photoMsg && <p className="text-[12px] mt-1.5" style={{ color: photoMsg.startsWith("Photo saved") ? C.pine : C.maroon }}>{photoMsg}</p>}
        {photoCrop && (
          <CardScanEditor image={photoCrop[0]}
            onClose={() => setPhotoCrop(null)}
            onDone={async (flat) => {
              setPhotoCrop(null);
              let scanned = flat;
              try { scanned = await bakeEnhance(flat, { bright: 1.02, contrast: 1.1, sat: 1.05, warmth: 0, auto: true }); } catch (e) {}
              savePhoto(scanned);
            }} />
        )}
        <p className="text-[11px] mt-2.5" style={{ color: C.muted }}>Class is read from the number. Every change goes back to admin for verification with DOT & GAB.</p>
      </div>
    </div>
  );
}

/* ===================== Verification status banner ===================== */
function VerifyBanner({ user }) {
  const st = user.licenseStatus;
  if (!st || st === "verified") return null;
  const map = {
    submitted: { bg: C.goldSoft, fg: "#7a5a1e", Icon: Clock,
      title: "Verification pending",
      body: "Our team is checking your licence. You can use the app meanwhile — your Verified badge appears once it clears." },
    rejected: { bg: C.maroonSoft, fg: C.maroon, Icon: ShieldAlert,
      title: "Licence not approved",
      body: "We couldn't verify the document. Upload a clearer photo of a current licence from your profile." },
    none: { bg: C.goldSoft, fg: "#7a5a1e", Icon: Upload,
      title: "Licence needed",
      body: "Add your licence to get verified — operators prioritise verified guides and drivers." },
  }[st];
  if (!map) return null;
  return (
    <div className="shrink-0 px-4 py-2.5 flex items-start gap-2.5" style={{ background: map.bg }}>
      <map.Icon size={16} color={map.fg} className="shrink-0 mt-0.5" />
      <div>
        <div className="text-[12.5px] font-semibold" style={{ color: map.fg }}>{map.title}</div>
        <div className="text-[12px] leading-snug" style={{ color: map.fg, opacity: .85 }}>{map.body}</div>
      </div>
    </div>
  );
}

/* ========================= Availability (talent-set) ========================= */
const AVAIL = {
  open:   { label: "Available for work", bg: "#E4EFE7", fg: "#21402F", dot: "#2E7D4F" },
  busy:   { label: "On a trip",          bg: "#F3E8CF", fg: "#7a5a1e", dot: "#C0872B" },
  closed: { label: "Not taking work",    bg: "#F7E9E7", fg: "#7A2E2E", dot: "#9C4B4B" },
};

function AvailabilityChip({ talent }) {
  const st = AVAIL[talent?.availability] || AVAIL.open;
  const until = talent?.availableFrom ? ` · free from ${fmtDate(talent.availableFrom)}` : "";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: st.bg, color: st.fg }}>
      <span className="rounded-full" style={{ width: 7, height: 7, background: st.dot }} />
      {st.label}{until}
    </span>
  );
}

function TalentAvailability({ talent, onSet, viewerOnly = false }) {
  const now = new Date();
  const [open, setOpen] = useState(viewerOnly);
  const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]);
  const [blocks, setBlocks] = useState(null);
  const [bs, setBs] = useState("");
  const [be, setBe] = useState("");
  const [bl, setBl] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [status, setStatus] = useState(talent?.availability || "open");
  const [from, setFrom] = useState(talent?.availableFrom || "");
  const [note, setNote] = useState(talent?.availableNote || "");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!CLOUD) { setBlocks([]); return; }
    const { data } = await supabase.from("talent_blocks").select("*").eq("talent_id", talent.id).order("start_date");
    setBlocks(data || []);
  };
  useEffect(() => { if (open) load(); }, [open, talent.id]);

  const marks = useMemo(() => {
    const m = {};
    (blocks || []).forEach((b) => eachBookedDay(b.start_date, b.end_date).forEach((d) => { m[d] = "booked"; }));
    return m;
  }, [blocks]);

  const [yy, mmn] = ym;
  const dim = new Date(yy, mmn + 1, 0).getDate();
  let blockedInMonth = 0;
  for (let d = 1; d <= dim; d++) {
    const iso = `${yy}-${String(mmn + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (marks[iso]) blockedInMonth++;
  }
  const openDays = dim - blockedInMonth;
  const monthName = new Date(yy, mmn, 1).toLocaleString("en", { month: "long" });
  const totalBlocked = Object.keys(marks).length;
  const cur = AVAIL[talent?.availability] || AVAIL.open;

  const addBlock = async () => {
    if (!bs || !be || be < bs) return;
    setAddBusy(true);
    const { error } = await supabase.from("talent_blocks").insert({ talent_id: talent.id, start_date: bs, end_date: be, label: bl.trim() || null });
    setAddBusy(false);
    if (error) { console.error("block add failed:", error.message); return; }
    setBs(""); setBe(""); setBl("");
    load();
  };
  const delBlock = async (id) => { await supabase.from("talent_blocks").delete().eq("id", id); load(); };

  const save = async () => {
    if (!onSet) return;
    setBusy(true);
    await onSet(status, status === "busy" ? from : null, note);
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const dirty = status !== (talent?.availability || "open") || from !== (talent?.availableFrom || "") || note !== (talent?.availableNote || "");

  return (
    <div className="rounded-2xl mt-5 overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <button onClick={() => setOpen((v) => !v)} className="tap w-full px-4 py-3 flex items-center gap-2.5">
        <CalendarDays size={16} color={C.gold} />
        <span className="text-[14px] font-semibold flex-1 text-left" style={{ color: C.ink }}>{viewerOnly ? "Availability calendar" : "Availability"}</span>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: C.muted }}>
          <span className="rounded-full" style={{ width: 8, height: 8, background: cur.dot }} />
          {cur.label}{totalBlocked > 0 && !open ? ` · ${totalBlocked}d` : ""}
        </span>
        <ChevronLeft size={15} color={C.muted} style={{ transform: open ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform .18s" }} />
      </button>

      {open && (
        <div className="px-4 pb-4 fade">
          {!viewerOnly && (
            <>
              <div className="space-y-1.5 mb-2.5">
                {Object.entries(AVAIL).map(([k, v]) => (
                  <button key={k} onClick={() => setStatus(k)} className="tap w-full rounded-xl px-3 py-2 flex items-center gap-2.5"
                    style={{ background: status === k ? C.bg : C.card, border: `1px solid ${status === k ? C.pine : C.line}` }}>
                    <span className="rounded-full shrink-0" style={{ width: 8, height: 8, background: v.dot }} />
                    <span className="text-[13px] font-medium flex-1 text-left" style={{ color: C.ink }}>{v.label}</span>
                    {status === k && <Check size={14} color={C.pine} strokeWidth={2.6} />}
                  </button>
                ))}
              </div>
              {status === "busy" && (
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-[13px] mb-2 fade" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              )}
              <div className="flex gap-2 mb-3">
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="Note — e.g. weekends only"
                  className="flex-1 h-10 px-3 rounded-xl text-[13px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                <button onClick={save} disabled={busy || !dirty} className="tap h-10 px-4 rounded-xl text-[13px] font-semibold shrink-0"
                  style={{ background: dirty ? C.pine : "#C7CEC7", color: "#fff" }}>{busy ? "…" : saved ? "Saved ✓" : "Save"}</button>
              </div>
              <div className="pt-3 mb-2.5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <div className="text-[13px] font-semibold" style={{ color: C.ink }}>Committed trips</div>
                <p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: C.muted }}>
                  Enter this year's confirmed trips — those days block out. Every open day is your opportunity for new work.
                </p>
              </div>
            </>
          )}
          {viewerOnly && (
            <p className="text-[11.5px] mb-2.5 leading-snug" style={{ color: C.muted }}>
              Green days are committed trips. Open days are free — send a request for the dates you need.
            </p>
          )}

          {blocks === null ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[13px]" style={{ color: C.muted }}>
              <Loader2 size={15} className="animate-spin" /> Loading calendar…
            </div>
          ) : (
            <>
              <MonthCal ym={ym} marks={marks}
                onPrev={() => setYm(([y, m]) => { const d = new Date(y, m - 1, 1); return [d.getFullYear(), d.getMonth()]; })}
                onNext={() => setYm(([y, m]) => { const d = new Date(y, m + 1, 1); return [d.getFullYear(), d.getMonth()]; })}
                onDay={null} />
              <div className="text-[12px] font-semibold mt-2" style={{ color: C.pine }}>
                {monthName}: {openDays} open day{openDays === 1 ? "" : "s"} — {viewerOnly ? "available to request" : "your opportunities"}
              </div>

              {!viewerOnly && (
                <>
                  <div className="flex gap-2 mt-3">
                    <input type="date" value={bs} onChange={(e) => setBs(e.target.value)}
                      className="flex-1 min-w-0 h-10 px-2 rounded-xl text-[12.5px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: bs ? C.ink : C.muted }} />
                    <input type="date" value={be} onChange={(e) => setBe(e.target.value)}
                      className="flex-1 min-w-0 h-10 px-2 rounded-xl text-[12.5px]" style={{ background: C.bg, border: `1px solid ${be && be < bs ? C.maroon : C.line}`, color: be ? C.ink : C.muted }} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input value={bl} onChange={(e) => setBl(e.target.value)} maxLength={40} placeholder="Label — e.g. Bumthang group"
                      className="flex-1 min-w-0 h-10 px-3 rounded-xl text-[13px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                    <button onClick={addBlock} disabled={addBusy || !bs || !be || be < bs}
                      className="tap h-10 px-4 rounded-xl text-[13px] font-semibold shrink-0"
                      style={{ background: bs && be && be >= bs ? C.pine : "#C7CEC7", color: "#fff" }}>{addBusy ? "…" : "Add"}</button>
                  </div>
                  {(blocks || []).map((b) => (
                    <div key={b.id} className="flex items-center gap-2 mt-2 rounded-xl px-3 py-2" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                      <span className="rounded-full shrink-0" style={{ width: 8, height: 8, background: C.pine }} />
                      <div className="flex-1 min-w-0 text-[12.5px] truncate" style={{ color: C.ink }}>
                        <span className="font-medium">{fmtRange(b.start_date, b.end_date)}</span>
                        {b.label ? <span style={{ color: C.muted }}> · {b.label}</span> : null}
                      </div>
                      <button onClick={() => delBlock(b.id)} className="tap text-[13px] font-semibold shrink-0" style={{ color: C.maroon }}>✕</button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
function StoryViewer({ stories, author, canDelete, onDelete, onClose }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const st = stories[i];
  const startX = useRef(null);

  useEffect(() => {
    if (paused || !st) return;
    const ms = st.kind === "video" ? 15000 : 5000;
    const t = setTimeout(() => { if (i < stories.length - 1) setI(i + 1); else onClose(); }, ms);
    return () => clearTimeout(t);
  }, [i, paused, stories.length]);

  if (!st) return null;
  const hoursLeft = Math.max(0, 24 - Math.floor((Date.now() - st.ts) / 3600e3));

  const tap = (e) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const w = e.currentTarget.offsetWidth;
    if (x < w * 0.32) { if (i > 0) setI(i - 1); }
    else if (i < stories.length - 1) setI(i + 1);
    else onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: "#08090880", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", zIndex: 220 }}>
      <div className="flex-1 flex flex-col" style={{ background: "#0b0d0b" }}>
        <div className="flex gap-1 px-3 pt-3">
          {stories.map((_, k) => (
            <div key={k} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.25)" }}>
              <div style={{ width: k < i ? "100%" : k === i ? "100%" : "0%", height: "100%", background: "#fff",
                transition: k === i ? `width ${st.kind === "video" ? 15 : 5}s linear` : "none" }} />
            </div>
          ))}
        </div>

        <div className="px-4 py-3 flex items-center gap-2.5">
          <Avatar initials={author?.initials || "?"} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold text-white">{author?.name || "Member"}</div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,.6)" }}>{relTime(st.ts)} · {hoursLeft}h left</div>
          </div>
          {canDelete && (
            <button onClick={() => { onDelete && onDelete(st); onClose(); }} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.14)" }} aria-label="Delete story">
              <Trash2 size={16} color="#fff" />
            </button>
          )}
          <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.14)" }} aria-label="Close">
            <X size={18} color="#fff" />
          </button>
        </div>

        <div className="flex-1 relative" onClick={tap}
          onTouchStart={(e) => { startX.current = e.touches[0].clientX; setPaused(true); }}
          onTouchEnd={(e) => { setPaused(false); const dx = e.changedTouches[0].clientX - (startX.current ?? 0);
            if (dx < -50 && i < stories.length - 1) setI(i + 1); if (dx > 50 && i > 0) setI(i - 1); }}>
          {st.kind === "video" ? (
            <video src={st.url} autoPlay playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: "contain" }} />
          ) : (
            <img src={st.url} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "contain" }} />
          )}
          {st.caption && (
            <div className="absolute left-0 right-0 bottom-0 px-5 py-6" style={{ background: "linear-gradient(to top, rgba(0,0,0,.7), transparent)" }}>
              <p className="text-[15px] leading-snug text-white">{st.caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}

function AddStory({ onClose, onAdd }) {
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [compressing, setCompressing] = useState(null);
  const inputRef = useRef();

  const pick = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    if (!isVideo && !f.type.startsWith("image/")) return setErr("Choose a photo or a video.");
    if (isVideo && f.size > 150 * 1024 * 1024) return setErr("Video is over 150 MB — export a smaller version first.");
    if (!isVideo && f.size > 8 * 1024 * 1024) return setErr("Photo is over 8 MB.");
    const finish = () => {
      setErr(null);
      const r = new FileReader();
      r.onload = () => setMedia({ kind: isVideo ? "video" : "photo", dataUri: r.result });
      r.readAsDataURL(f);
    };
    if (isVideo) {
      videoDuration(f).then(async (secs) => {
        if (secs != null && secs > 15.5) { setErr(`Stories play for 15 seconds — this clip is ${Math.round(secs)}s. Trim it first.`); return; }
        let out = f;
        if (f.size > 25 * 1024 * 1024) {
          setErr(null);
          setCompressing({ cur: 0, dur: secs || 0 });
          const small = await compressVideo(f, (cur, dur) => setCompressing({ cur, dur }));
          setCompressing(null);
          if (!small) { setErr("This phone couldn't compress the video — trim it under 25 MB."); return; }
          if (small.size > 25 * 1024 * 1024) { setErr("Even compressed it stays over 25 MB — pick a shorter clip."); return; }
          out = small;
        }
        setErr(null);
        const r = new FileReader();
        r.onload = () => setMedia({ kind: "video", dataUri: r.result });
        r.readAsDataURL(out);
      });
    } else {
      finish();
    }
  };


  const post = async () => {
    if (!media) return;
    setBusy(true);
    await onAdd({ kind: media.kind, dataUri: media.dataUri, caption: caption.trim() });
    setBusy(false);
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 220 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 safe-bottom" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
        <div className="text-[17px] font-semibold mb-1" style={{ color: C.ink }}>Add to your story</div>
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>Photo or short video. Disappears after 24 hours.</p>

        {media ? (
          <div className="relative rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${C.line}` }}>
            {media.kind === "video"
              ? <video src={media.dataUri} controls playsInline className="w-full block" style={{ maxHeight: 260 }} />
              : <img src={media.dataUri} alt="" className="w-full block" style={{ maxHeight: 260, objectFit: "cover" }} />}
            <button onClick={() => setMedia(null)} className="tap absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}><X size={16} color="#fff" /></button>
          </div>
        ) : (
          <button onClick={() => inputRef.current?.click()} className="tap w-full rounded-2xl p-8 flex flex-col items-center mb-3" style={{ background: C.bg, border: `1.5px dashed ${C.line}` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5" style={{ background: C.goldSoft }}><ImagePlus size={22} color={C.gold} /></div>
            <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>Choose photo or video</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>Video up to 30 MB</div>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*,video/*" onChange={pick} className="hidden" />

        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="Add a caption (optional)"
          className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

        {compressing && (
          <div className="mb-2 rounded-xl px-3 py-2.5" style={{ background: C.pineSoft }}>
            <div className="text-[12.5px] font-medium" style={{ color: C.pine }}>
              Optimising video{compressing.dur ? ` · ${Math.min(100, Math.round((compressing.cur / compressing.dur) * 100))}%` : "…"}
            </div>
            <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "rgba(31,107,69,.18)" }}>
              <div className="h-full rounded-full" style={{ width: `${compressing.dur ? Math.min(100, (compressing.cur / compressing.dur) * 100) : 8}%`, background: C.pine, transition: "width .3s" }} />
            </div>
          </div>
        )}
        {err && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{err}</p>}

        <button onClick={post} disabled={!media || busy} className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
          style={{ background: media ? C.pine : "#C7CEC7", color: "#fff" }}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Share to story"}
        </button>
      </div>
    </div>
  ), document.body);
}

function ConfirmShareStory({ post, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 220 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 safe-bottom" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
        <div className="text-[17px] font-semibold mb-1" style={{ color: C.ink }}>Share this post to your story?</div>
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>It stays visible for 24 hours. Your original post is unchanged.</p>
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
          <img src={post.media.dataUri} alt="" className="w-full block" style={{ maxHeight: 220, objectFit: "cover" }} />
        </div>
        <button onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }} disabled={busy}
          className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#fff" }}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Share to story"}
        </button>
        <button onClick={onClose} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
      </div>
    </div>
  ), document.body);
}

function Stat({ n, label, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`flex-1 text-center ${onClick ? "tap" : ""}`}>
      <div className="text-[17px] font-semibold leading-none" style={{ color: C.ink }}>{n}</div>
      <div className="text-[11.5px] mt-1" style={{ color: onClick ? C.pine : C.muted }}>{label}</div>
    </Tag>
  );
}

/* ============================== Notifications ============================= */
function AlertsSheet({ items, onClose, onOpenProfile, onOpenMessages, onOpenJobs, notifyOn, onEnableNotify, installed, onInstall }) {
  const meta = {
    message:   { Icon: MessageCircle, bg: C.pineSoft,   fg: C.pine,     verb: "sent you a message" },
    share:     { Icon: Share2,        bg: C.pineSoft,   fg: C.pine,     verb: "shared a post with you" },
    like:      { Icon: Heart,         bg: C.maroonSoft, fg: C.maroon,   verb: "liked your post" },
    comment:   { Icon: MessageSquare, bg: C.goldSoft,   fg: "#7a5a1e",  verb: "commented on your post" },
    follow:    { Icon: UserPlus,      bg: C.pineSoft,   fg: C.pine,     verb: "started following you" },
    job:       { Icon: Briefcase,     bg: C.goldSoft,   fg: "#7a5a1e",  verb: "sent you a job request" },
    listing:   { Icon: Briefcase,     bg: C.goldSoft,   fg: "#7a5a1e",  verb: "posted a job you can apply for" },
    applicant: { Icon: UserCheck,     bg: C.pineSoft,   fg: C.pine,     verb: "applied to your job" },
    joined:    { Icon: UserPlus,      bg: C.goldSoft,   fg: "#7a5a1e",  verb: "joined Bhutan Tourism Hub" },
  };

  const today = items.filter((a) => Date.now() - a.ts < 86400e3);
  const earlier = items.filter((a) => Date.now() - a.ts >= 86400e3);

  return createPortal((
    <div className="fixed inset-0 flex items-start" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-b-3xl flex flex-col dropin" style={{ background: C.card, maxHeight: "82dvh", paddingTop: "var(--sa-top)", boxShadow: "0 18px 40px rgba(8,10,8,.35)" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Notifications</div>
            <span className="text-[12.5px]" style={{ color: C.muted }}>{items.length}</span>
          </div>
          {!notifyOn && (!installed ? (
            <button onClick={onInstall} className="tap w-full rounded-xl px-3.5 py-2.5 mt-3 flex items-center gap-2.5 text-left" style={{ background: C.goldSoft }}>
              <Download size={16} color={C.gold} className="shrink-0" />
              <span className="text-[12.5px] leading-snug" style={{ color: "#7a5a1e" }}>
                <b>Get the app</b> — install it for fast notifications and instant updates. Tap to see how.
              </span>
            </button>
          ) : (
            <button onClick={onEnableNotify} className="tap w-full rounded-xl px-3.5 py-2.5 mt-3 flex items-center gap-2.5 text-left" style={{ background: C.goldSoft }}>
              <Bell size={16} color={C.gold} className="shrink-0" />
              <span className="text-[12.5px] leading-snug" style={{ color: "#7a5a1e" }}>
                <b>Turn on alerts</b> — get notified about jobs and messages even when the app isn't open.
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto hidescroll px-4 pb-5" style={{ scrollbarWidth: "none" }}>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: C.goldSoft }}><Bell size={22} color={C.gold} /></div>
              <p className="text-[14px] font-semibold" style={{ color: C.ink }}>You're all caught up</p>
              <p className="text-[13px] mt-1" style={{ color: C.muted }}>Messages, likes, follows and job requests appear here.</p>
            </div>
          ) : (
            <>
              {[["New", today], ["Earlier", earlier]].map(([label, group]) => group.length === 0 ? null : (
                <div key={label}>
                  <div className="text-[11.5px] font-semibold tracking-[.12em] uppercase mt-3 mb-1" style={{ color: C.gold }}>{label}</div>
                  {group.map((a) => {
                    const m = meta[a.kind] || meta.message;
                    const p = talentById(a.who);
                    const go = () => {
                      if (a.kind === "message" || a.kind === "share") return onOpenMessages();
                      if (a.kind === "job" || a.kind === "listing" || a.kind === "applicant") return onOpenJobs();
                      if (p) return onOpenProfile(a.who);
                    };
                    return (
                      <button key={a.id} onClick={go} className="tap w-full text-left flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                        <div className="relative shrink-0">
                          <Avatar initials={p?.initials || "?"} size={42} />
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: m.bg, border: `2px solid ${C.card}` }}>
                            <m.Icon size={10} color={m.fg} />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] leading-snug" style={{ color: C.ink }}>
                            <b>{p?.name || "Someone"}</b> <span style={{ color: C.muted }}>{m.verb}</span>
                            {a.urgent && <span className="ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: C.maroonSoft, color: C.maroon }}>URGENT</span>}
                          </div>
                          {a.text && a.kind !== "follow" && <div className="text-[12.5px] truncate mt-0.5" style={{ color: C.muted }}>{a.text}</div>}
                          <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{relTime(a.ts)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}

/* ============================ Install the app ============================= */
function InstallSheet({ installEvent, onClose }) {
  const ios = isIOS();
  const [busy, setBusy] = useState(false);
  const [, bump] = useState(0);
  useEffect(() => {
    const onAvail = () => bump((x) => x + 1);
    window.addEventListener("bth-installable", onAvail);
    return () => window.removeEventListener("bth-installable", onAvail);
  }, []);
  const ev = installEvent || deferredInstallPrompt;

  const install = async () => {
    if (!ev) return;
    setBusy(true);
    ev.prompt();
    try { await ev.userChoice; } catch (e) {}
    deferredInstallPrompt = null;
    setBusy(false);
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 safe-bottom" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />

        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
            <Compass size={22} color={C.goldSoft} />
          </div>
          <div>
            <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Install Bhutan Tourism Hub</div>
            <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>Takes a second, and makes a real difference.</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-4">
          <InstallReason Icon={Bell} title="Job alerts reach you"
            body={ios ? "On iPhone, notifications only work once the app is installed — a browser tab gets none."
                      : "Get notified about new jobs and messages without opening the app."} />
          <InstallReason Icon={NavIcon} title="Works with poor signal"
            body="Opens instantly and keeps working on the road, where data is weak." />
          <InstallReason Icon={Smartphone} title="Opens like a normal app"
            body="Its own icon on your home screen — no browser bar, full screen." />
        </div>

        {ios ? (
          <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>On iPhone (Safari)</div>
            <ol className="space-y-2">
              {[["1", <>Tap the <b>Share</b> button <Share size={13} className="inline" /> at the bottom of Safari</>],
                ["2", <>Scroll down and tap <b>Add to Home Screen</b></>],
                ["3", <>Tap <b>Add</b> — then open it from your home screen</>]].map(([n, t]) => (
                <li key={n} className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: C.pine, color: "#fff" }}>{n}</span>
                  <span className="text-[13px] leading-snug" style={{ color: C.ink }}>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : ev ? (
          <button onClick={install} disabled={busy} className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            style={{ background: C.pine, color: "#fff" }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={17} strokeWidth={3} /> Install now</>}
          </button>
        ) : (
          <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>On Android (Chrome)</div>
            <ol className="space-y-2">
              {[["1", <>Tap the <b>⋮</b> menu, top right</>],
                ["2", <>Tap <b>Add to Home screen</b> or <b>Install app</b></>],
                ["3", <>Confirm — then open it from your home screen</>]].map(([n, t]) => (
                <li key={n} className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: C.pine, color: "#fff" }}>{n}</span>
                  <span className="text-[13px] leading-snug" style={{ color: C.ink }}>{t}</span>
                </li>
              ))}
            </ol>
            <p className="text-[12px] mt-2.5" style={{ color: C.muted }}>
              Already installed it before? Just open it from your home screen — no need to repeat this.
            </p>
          </div>
        )}

        <button onClick={onClose} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-2.5"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Maybe later</button>
      </div>
    </div>
  ), document.body);
}

function InstallReason({ Icon, title, body }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.goldSoft }}>
        <Icon size={15} color={C.gold} />
      </div>
      <div>
        <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{title}</div>
        <div className="text-[12.5px] leading-snug" style={{ color: C.muted }}>{body}</div>
      </div>
    </div>
  );
}

/* ============================ First-run tutorial ========================== */
function Tutorial({ user, nav, setTab, onDone }) {
  const [i, setI] = useState(0);
  const talent = user.kind === "guide" || user.kind === "driver";
  const first = (user.name || "").split(" ")[0];

  // steps point at real tabs; tabIndex tells the highlight which nav item to ring
  const steps = talent
    ? [
        { kind: "intro", title: `Welcome, ${first}`, body: "You're one of the first on the hub. Two minutes and you'll know your way around." },
        { kind: "tab", tab: "post", title: "Your Feed", body: "Share photos from your trips, pinned to where you took them. Every approved post builds your portfolio." },
        { kind: "tab", tab: "jobs", title: "Jobs", body: "Operators post work here. Apply to anything matching your skills — including short-notice jobs when someone drops out." },
        { kind: "tab", tab: "trips", title: "Trips", body: "Once you're hired, the trip appears here with its itinerary and meeting point." },
        { kind: "tab", tab: "chats", title: "Messages", body: "Crew chat for each trip, plus direct messages with operators and other guides." },
        { kind: "tab", tab: "profile", title: "Your Profile", body: "Set your availability, add specialities and languages. This is what operators see before booking you." },
        { kind: "top", title: "Search & alerts", body: "Search anyone by name, and tap the bell for jobs, messages and follows." },
        { kind: "outro", title: "One last thing", body: user.licenseStatus === "submitted"
            ? "Your licence is with our review team. Everything works meanwhile — your Verified badge appears once it clears."
            : "Add your licence from your profile to get the Verified badge. Operators prioritise verified guides and drivers." },
      ]
    : user.kind === "business"
    ? [
        { kind: "intro", title: `Welcome, ${first}`, body: "You're one of the first businesses on the hub. A quick tour of your new page." },
        { kind: "tab", tab: "post", title: "Your Feed", body: "Post your rooms, products and offers \u2014 every guide and operator on the hub sees this feed." },
        { kind: "tab", tab: "bookings", title: "Bookings", body: "Your live calendar. Tap days to block them, and confirm operator requests right here." },
        { kind: "tab", tab: "discover", title: "Discover", body: "Browse verified guides, drivers and fellow businesses across Bhutan." },
        { kind: "tab", tab: "chats", title: "Messages", body: "Operators and guides can message you directly to plan stops and stays." },
        { kind: "tab", tab: "profile", title: "Your Page", body: "Photos, what you offer, and your location \u2014 this is what passing tours see." },
        { kind: "top", title: "Search & alerts", body: "Search anyone by name, and tap the bell for messages and follows." },
        { kind: "outro", title: "One last thing", body: user.licenseStatus === "submitted"
            ? "Your trade licence is with our review team. Everything works meanwhile \u2014 your Verified badge appears once it clears."
            : "Add your trade licence from your profile to get the Verified badge. Tours trust verified businesses." },
      ]
    : [
        { kind: "intro", title: `Welcome, ${first}`, body: "You're one of the first operators here. Quick tour so you can start booking." },
        { kind: "tab", tab: "discover", title: "Discover", body: "Every verified guide and driver, filtered by speciality, language and who's available right now." },
        { kind: "tab", tab: "requests", title: "Jobs", body: "Post a job and let qualified people apply, or send a request directly to someone you want." },
        { kind: "tab", tab: "trips", title: "Trips", body: "Every confirmed booking becomes a trip — crew, itinerary and meeting point in one place." },
        { kind: "tab", tab: "chats", title: "Messages", body: "A chat channel per trip, plus direct messages with any guide or driver." },
        { kind: "tab", tab: "feed", title: "Feed", body: "Recent posts from guides and drivers — a good way to spot people worth booking." },
        { kind: "top", title: "Search & alerts", body: "Search people by name, and tap the bell when someone applies to your job." },
        { kind: "outro", title: "You're set", body: "Post your first job and see who applies. Tell us what's missing — we're still building." },
      ];

  const step = steps[i];
  const navIndex = step.kind === "tab" ? nav.findIndex((n) => n.id === step.tab) : -1;

  // move the app to the tab being explained
  useEffect(() => { if (step.kind === "tab") setTab(step.tab); }, [i]);

  const next = () => { if (i < steps.length - 1) setI(i + 1); else onDone(); };
  const back = () => { if (i > 0) setI(i - 1); };

  const tabCount = nav.length;
  const highlightLeft = navIndex >= 0 ? `${(navIndex / tabCount) * 100}%` : null;
  const highlightWidth = `${(1 / tabCount) * 100}%`;

  return createPortal((
    <div className="fixed inset-0" style={{ zIndex: 250 }}>
      {/* dim everything */}
      <div className="absolute inset-0" style={{ background: "rgba(8,10,8,.72)" }} onClick={next} />

      {/* ring around the tab being explained */}
      {navIndex >= 0 && (
        <div className="absolute" style={{ left: highlightLeft, width: highlightWidth, bottom: 0, height: 62, pointerEvents: "none" }}>
          <div className="absolute inset-1 rounded-2xl" style={{ border: `2.5px solid ${C.gold}`, boxShadow: `0 0 0 4px ${C.gold}33`, background: "rgba(255,255,255,.10)" }} />
        </div>
      )}

      {/* ring around the top bar */}
      {step.kind === "top" && (
        <div className="absolute left-2 right-2 rounded-2xl" style={{ top: 4, height: 52, border: `2.5px solid ${C.gold}`, boxShadow: `0 0 0 4px ${C.gold}33`, pointerEvents: "none" }} />
      )}

      {/* card */}
      <div className="absolute left-0 right-0 px-5" style={{ bottom: navIndex >= 0 ? 86 : "auto", top: step.kind === "top" ? 70 : "auto",
        ...(step.kind === "intro" || step.kind === "outro" ? { top: "50%", transform: "translateY(-50%)" } : {}) }}>
        <div className="rounded-2xl p-5" style={{ background: C.card, boxShadow: "0 20px 40px rgba(0,0,0,.35)" }}>
          {(step.kind === "intro" || step.kind === "outro") && (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.pine }}>
              <Compass size={22} color={C.goldSoft} strokeWidth={1.8} />
            </div>
          )}

          <div className="text-[18px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>{step.title}</div>
          <p className="text-[14px] leading-relaxed mt-1.5" style={{ color: C.muted }}>{step.body}</p>

          {/* progress dots */}
          <div className="flex items-center gap-1.5 mt-4 mb-4">
            {steps.map((_, k) => (
              <span key={k} className="rounded-full" style={{ width: k === i ? 16 : 6, height: 6,
                background: k <= i ? C.pine : C.lineSoft, transition: "width .25s" }} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {i > 0 && (
              <button onClick={back} className="tap h-11 px-4 rounded-xl text-[14px] font-semibold"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Back</button>
            )}
            <button onClick={next} className="tap flex-1 h-11 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
              style={{ background: C.pine, color: "#fff" }}>
              {i === steps.length - 1 ? "Start using the hub" : "Next"}
              {i < steps.length - 1 && <ArrowRight size={17} strokeWidth={2.4} />}
            </button>
          </div>

          {i < steps.length - 1 && (
            <button onClick={onDone} className="tap w-full text-[12.5px] font-medium mt-2.5" style={{ color: C.muted }}>Skip the tour</button>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}

/* ==================== Privacy, data rights & policy ===================== */
function PrivacyPanel({ talent }) {
  const [open, setOpen] = useState(null);   // 'privacy' | 'terms' | 'data' | null
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  const exportMyData = async () => {
    setBusy(true);
    try {
      const me = talent.id;
      const [prof, posts, dms, follows, stories] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", me).maybeSingle(),
        supabase.from("posts").select("*").eq("talent_id", me),
        supabase.from("direct_messages").select("*").or(`sender_id.eq.${me},recipient_id.eq.${me}`),
        supabase.from("follows").select("*").or(`follower_id.eq.${me},following_id.eq.${me}`),
        supabase.from("stories").select("*").eq("author_id", me),
      ]);
      const bundle = {
        exported_at: new Date().toISOString(),
        note: "Your data from Bhutan Tourism Hub. Licence documents are not included — request those from support.",
        profile: prof.data || null,
        posts: posts.data || [],
        messages: dms.data || [],
        follows: follows.data || [],
        stories: stories.data || [],
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `my-data-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setNote("Downloaded to your device.");
    } catch (e) {
      console.error("export failed:", e);
      setNote("Couldn't export right now — try again.");
    }
    setBusy(false);
    setTimeout(() => setNote(null), 4000);
  };

  const requestDeletion = () => {
    const subject = encodeURIComponent("Account deletion request");
    const body = encodeURIComponent(
      `I would like my account and all my data deleted from Bhutan Tourism Hub.\n\nName: ${talent.name}\nEmail: ${talent.email || ""}\n`
    );
    window.location.href = `mailto:support@bhutantourismhub.com?subject=${subject}&body=${body}`;
  };

  const Sheet = ({ title, children }) => createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={() => setOpen(null)}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "86dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>{title}</div>
        </div>
        <div className="flex-1 overflow-y-auto hidescroll px-5 pb-6" style={{ scrollbarWidth: "none" }}>{children}</div>
      </div>
    </div>
  ), document.body);

  const P = ({ children }) => <p className="text-[13.5px] leading-relaxed mb-3" style={{ color: C.muted }}>{children}</p>;
  const H = ({ children }) => <div className="text-[14px] font-semibold mt-4 mb-1.5" style={{ color: C.ink }}>{children}</div>;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="px-4 pt-3.5 pb-1 flex items-center gap-2">
        <ShieldCheck size={16} color={C.gold} />
        <span className="text-[13.5px] font-semibold" style={{ color: C.ink }}>Privacy & your data</span>
      </div>

      {note && <div className="mx-4 mb-2 rounded-lg px-3 py-2 text-[12.5px]" style={{ background: C.pineSoft, color: C.pine }}>{note}</div>}

      {[
        ["Privacy policy", () => setOpen("privacy")],
        ["Terms of use", () => setOpen("terms")],
        ["What we store about you", () => setOpen("data")],
        [busy ? "Preparing…" : "Download my data", exportMyData],
        ["Request account deletion", requestDeletion],
      ].map(([label, fn], i) => (
        <button key={label} onClick={fn} disabled={busy}
          className="tap w-full text-left px-4 py-3 flex items-center justify-between"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <span className="text-[13.5px]" style={{ color: i === 4 ? C.maroon : C.ink }}>{label}</span>
          <ChevronLeft size={16} color={C.muted} style={{ transform: "rotate(180deg)" }} />
        </button>
      ))}

      {open === "privacy" && (
        <Sheet title="Privacy policy">
          <P>Last updated: August 2026. Bhutan Tourism Hub is operated by Expo Bhutan.</P>
          <H>What we collect</H>
          <P>Your name, email address, phone number, home base, role, years of experience, specialities, languages, and the licence document you upload. We also store what you post, your messages, and who you follow.</P>
          <H>Why we collect it</H>
          <P>To verify that you are a licensed professional, to let tour operators find and book you, and to run the platform. We do not sell your data or share it with advertisers.</P>
          <H>Who can see what</H>
          <P>Your profile, specialities, languages, approved posts and trip record are visible to other users of the platform. Your phone number and email are shown so operators can contact you for work. Your licence document is private — only you and our verification team can see it. Your direct messages are private to you and the person you are messaging.</P>
          <H>Where it is stored</H>
          <P>On Supabase servers, encrypted in transit and at rest. Email is sent through Resend. The site is served over HTTPS by Cloudflare.</P>
          <H>How long we keep it</H>
          <P>Your profile and posts remain until you ask us to delete them. Stories are deleted automatically after 24 hours. Trip chats are cleared after a trip ends.</P>
          <H>Your rights</H>
          <P>You may download everything we hold about you at any time using "Download my data" above, correct anything on your profile, or request full deletion. We will action a deletion request within 30 days.</P>
          <H>Contact</H>
          <P>support@bhutantourismhub.com</P>
        </Sheet>
      )}

      {open === "terms" && (
        <Sheet title="Terms of use">
          <H>Who may use this platform</H>
          <P>Bhutan Tourism Hub is for licensed guides, licensed drivers, and licensed tour operators working in Bhutan. You must hold a valid licence issued by the Department of Tourism or the Road Safety and Transport Authority, as applicable to your role.</P>
          <H>Honest representation</H>
          <P>You must provide accurate information about your licence, experience, skills and availability. Submitting a false or altered licence document will result in permanent removal, and may be reported to the relevant authority.</P>
          <H>Conduct</H>
          <P>Treat other members professionally. Do not post content that is misleading, offensive, or that infringes someone else's rights. Do not use another person's account.</P>
          <H>Bookings and payment</H>
          <P>Bhutan Tourism Hub connects professionals with operators. Any agreement, payment or contract for work is between you and the other party. We are not a party to it and do not process payments.</P>
          <H>Verification</H>
          <P>A Verified badge means our team has reviewed the licence document you submitted. It is not a guarantee of the quality of anyone's work, and it does not replace your own due diligence.</P>
          <H>This is an early version</H>
          <P>The platform is under active development. Features may change and occasional issues may occur. We will tell you about anything that materially affects you.</P>
          <H>Ending your account</H>
          <P>You may request deletion at any time. We may suspend an account that breaches these terms.</P>
        </Sheet>
      )}

      {open === "data" && (
        <Sheet title="What we store about you">
          <div className="rounded-xl p-3.5 mb-3" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.ink }}>Visible to other users</div>
            {["Name and role", "Home base", "Specialities and languages", "Years of experience", "Approved posts and photos", "Trip record and reviews", "Availability status", "Phone number and email (so operators can contact you)"].map((x) => (
              <div key={x} className="flex items-start gap-2 mb-1">
                <Eye size={12} color={C.muted} className="shrink-0 mt-1" />
                <span className="text-[12.5px]" style={{ color: C.muted }}>{x}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3.5" style={{ background: C.pineSoft }}>
            <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.pine }}>Private — never shown to other users</div>
            {["Your licence document", "Your direct messages", "Your password", "Your login history"].map((x) => (
              <div key={x} className="flex items-start gap-2 mb-1">
                <Lock size={12} color={C.pine} className="shrink-0 mt-1" />
                <span className="text-[12.5px]" style={{ color: C.pine }}>{x}</span>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ====================== Media carousel (multi-photo posts) ================= */
function MediaCarousel({ media, rounded }) {
  const [i, setI] = useState(0);
  const startX = useRef(null);
  if (!media) return null;

  if (media.kind === "video") {
    return (
      <div className="w-full" style={{ background: "#0c0e0c", borderRadius: rounded ? 12 : 0, overflow: "hidden" }}>
        <video src={media.dataUri} controls playsInline preload="metadata" className="w-full block" style={{ maxHeight: "62dvh" }} />
      </div>
    );
  }

  const slides = media.slides && media.slides.length ? media.slides : [media.dataUri];
  const many = slides.length > 1;
  const ratio = media.ratio || "4 / 5";   // one shape for the whole post, Instagram-style

  const onStart = (e) => { startX.current = (e.touches ? e.touches[0] : e).clientX; };
  const onEnd = (e) => {
    if (startX.current == null || !many) return;
    const dx = (e.changedTouches ? e.changedTouches[0] : e).clientX - startX.current;
    if (dx < -45 && i < slides.length - 1) setI(i + 1);
    if (dx > 45 && i > 0) setI(i - 1);
    startX.current = null;
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ background: C.bg, borderRadius: rounded ? 12 : 0 }}
      onTouchStart={onStart} onTouchEnd={onEnd}>
      <div className="flex" style={{ transform: `translateX(-${i * 100}%)`, transition: "transform .34s cubic-bezier(.22,.61,.36,1)" }}>
        {slides.map((src, k) => (
          <div key={k} className="shrink-0 w-full relative overflow-hidden" style={{ aspectRatio: ratio, background: C.bg }}>
            <img src={src} alt="" loading={k === 0 ? "eager" : "lazy"} decoding="async"
              className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>

      {many && (
        <>
          <span className="absolute top-2.5 right-2.5 text-[11px] font-bold rounded-full px-2 py-1"
            style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}>{i + 1}/{slides.length}</span>

          {i > 0 && (
            <button onClick={() => setI(i - 1)} className="tap absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,.45)" }} aria-label="Previous photo">
              <ChevronLeft size={18} color="#fff" />
            </button>
          )}
          {i < slides.length - 1 && (
            <button onClick={() => setI(i + 1)} className="tap absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,.45)" }} aria-label="Next photo">
              <ChevronLeft size={18} color="#fff" style={{ transform: "rotate(180deg)" }} />
            </button>
          )}

          <div className="absolute left-0 right-0 bottom-2.5 flex items-center justify-center gap-1.5">
            {slides.map((_, k) => (
              <span key={k} className="rounded-full" style={{
                width: k === i ? 7 : 5, height: k === i ? 7 : 5,
                background: k === i ? "#fff" : "rgba(255,255,255,.55)",
                boxShadow: "0 0 3px rgba(0,0,0,.5)", transition: "all .2s",
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ======================= Crop & reframe (Instagram-style) ================= */
const RATIOS = [
  { id: "1 / 1",  label: "Square",    w: 1,    h: 1,    hint: "1:1" },
  { id: "4 / 5",  label: "Portrait",  w: 4,    h: 5,    hint: "4:5" },
  { id: "16 / 9", label: "Landscape", w: 16,   h: 9,    hint: "16:9" },
];

function EnhanceEditor({ slides, onDone, onClose }) {
  const [i, setI] = useState(0);
  const [params, setParams] = useState(() => slides.map(() => ({ preset: "none", bright: 1, contrast: 1, sat: 1, warmth: 0, auto: false })));
  const [busy, setBusy] = useState(false);
  const cur = params[i];
  const setCur = (patch) => setParams((ps) => ps.map((p, k) => (k === i ? { ...p, ...patch, preset: "custom", ...(patch.preset ? { preset: patch.preset } : {}) } : p)));
  const pickPreset = (l) => setParams((ps) => ps.map((p, k) => (k === i ? { preset: l.id, ...l.p } : p)));
  const copyAll = () => setParams((ps) => ps.map(() => ({ ...cur })));
  const many = slides.length > 1;

  const apply = async () => {
    setBusy(true);
    const out = [];
    for (let k = 0; k < slides.length; k++) {
      const p = params[k];
      const untouched = !p.auto && p.bright === 1 && p.contrast === 1 && p.sat === 1 && p.warmth === 0;
      out.push(untouched ? slides[k] : await bakeEnhance(slides[k], p));
    }
    setBusy(false);
    onDone(out);
  };

  const Slider = ({ label, min, max, step, value, onChange, mid }) => (
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-medium text-white" style={{ opacity: .85 }}>{label}</span>
        <button onClick={() => onChange(mid)} className="tap text-[10.5px]" style={{ color: "rgba(255,255,255,.5)" }}>reset</button>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full" style={{ accentColor: C.gold }} />
    </div>
  );

  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0b0d0b", zIndex: 240, height: "100dvh" }}>
      <div className="shrink-0 h-14 px-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.12)" }}>
          <X size={18} color="#fff" />
        </button>
        <span className="text-[15px] font-semibold text-white">Enhance{many ? ` · ${i + 1}/${slides.length}` : ""}</span>
        <button onClick={apply} disabled={busy} className="tap h-9 px-4 rounded-full text-[14px] font-semibold" style={{ background: C.gold, color: "#fff" }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : "Done"}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center relative px-3">
        <img src={slides[i]} alt="" className="max-w-full max-h-full rounded-lg" style={{ filter: enhanceCss(cur), objectFit: "contain" }} />
        {many && i > 0 && (
          <button onClick={() => setI(i - 1)} className="tap absolute left-2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.5)" }}><ChevronLeft size={18} color="#fff" /></button>
        )}
        {many && i < slides.length - 1 && (
          <button onClick={() => setI(i + 1)} className="tap absolute right-2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.5)" }}><ChevronLeft size={18} color="#fff" style={{ transform: "rotate(180deg)" }} /></button>
        )}
      </div>

      <div className="shrink-0 px-4 pt-3 pb-5 safe-bottom" style={{ borderTop: "1px solid rgba(255,255,255,.12)" }}>
        <div className="flex gap-2 overflow-x-auto hidescroll pb-2.5" style={{ scrollbarWidth: "none" }}>
          {LUTS.map((l) => (
            <button key={l.id} onClick={() => pickPreset(l)} className="tap shrink-0 flex flex-col items-center gap-1">
              <div className="rounded-lg overflow-hidden" style={{ width: 56, height: 56, border: `2px solid ${cur.preset === l.id ? C.gold : "rgba(255,255,255,.15)"}` }}>
                <img src={slides[i]} alt="" className="w-full h-full" style={{ objectFit: "cover", filter: enhanceCss(l.p) }} />
              </div>
              <span className="text-[10px] font-medium" style={{ color: cur.preset === l.id ? C.gold : "rgba(255,255,255,.65)" }}>{l.n}</span>
            </button>
          ))}
        </div>
        <Slider label="Brightness" min={0.7} max={1.3} step={0.01} value={cur.bright} mid={1} onChange={(v) => setCur({ bright: v })} />
        <Slider label="Contrast" min={0.7} max={1.4} step={0.01} value={cur.contrast} mid={1} onChange={(v) => setCur({ contrast: v })} />
        <Slider label="Colour" min={0} max={1.8} step={0.01} value={cur.sat} mid={1} onChange={(v) => setCur({ sat: v })} />
        <Slider label="Warmth" min={-1} max={1} step={0.01} value={cur.warmth} mid={0} onChange={(v) => setCur({ warmth: v })} />
        {many && (
          <button onClick={copyAll} className="tap w-full h-9 rounded-lg text-[12.5px] font-semibold mt-1" style={{ background: "rgba(255,255,255,.1)", color: "#fff" }}>
            Apply this look to all {slides.length} photos
          </button>
        )}
      </div>
    </div>
  ), document.body);
}

/* ================= Card scanning: perspective warp + auto corner detect ================= */
/* Rung 2: a 4-point homography solved by Gaussian elimination (the classical
   getPerspectiveTransform), then inverse-mapped with bilinear sampling.
   Rung 3: a lean gradient heuristic that finds the card's corners on clean
   shots and falls back to an inset rectangle when unsure. No dependencies. */

function solveHomography(dst, src) {
  // Returns [a..h] such that:  srcX=(a x+b y+c)/(g x+h y+1), srcY=(d x+e y+f)/(g x+h y+1)
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = dst[i], [X, Y] = src[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X, X]);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y, Y]);
  }
  for (let col = 0; col < 8; col++) {
    let piv = col;
    for (let r = col + 1; r < 8; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (Math.abs(A[piv][col]) < 1e-10) return null;
    if (piv !== col) { const t = A[piv]; A[piv] = A[col]; A[col] = t; }
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let c = col; c < 9; c++) A[r][c] -= f * A[col][c];
    }
  }
  const h = new Array(8);
  for (let i = 0; i < 8; i++) {
    h[i] = A[i][8] / A[i][i];
    if (!isFinite(h[i])) return null;
  }
  return h;
}

function PhotoSourceSheet({ title, onCamera, onUpload, onClose }) {
  return createPortal((
    <div className="fixed inset-0 flex items-end fade" style={{ background: "rgba(15,23,18,.5)", zIndex: 252 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 pb-9" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
        <div className="text-[15px] font-semibold mb-3.5" style={{ color: C.ink }}>{title}</div>
        <button onClick={onCamera} className="tap w-full rounded-2xl flex items-center gap-3 px-4 mb-2.5" style={{ background: C.pine, height: 54 }}>
          <Camera size={19} color="#fff" />
          <span className="text-[14.5px] font-semibold text-white flex-1 text-left">Take a photo of the card</span>
        </button>
        <button onClick={onUpload} className="tap w-full rounded-2xl flex items-center gap-3 px-4" style={{ background: C.bg, border: `1px solid ${C.line}`, height: 54 }}>
          <Upload size={18} color={C.ink} />
          <span className="text-[14.5px] font-semibold flex-1 text-left" style={{ color: C.ink }}>Upload from this phone</span>
        </button>
      </div>
    </div>
  ), document.body);
}

function CameraCaptureSheet({ onShot, onClose, onFallback }) {
  // Live camera with a card-shaped template — the licence lands where the
  // detector expects it. Falls back to the phone's own camera app if blocked.
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 } }, audio: false,
        });
        if (!live) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) { if (live) setErr(true); }
    })();
    return () => { live = false; try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch (e) {} };
  }, []);
  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch (e) {}
    onShot(c.toDataURL("image/jpeg", 0.92));
  };
  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: "#000", zIndex: 252, height: "100dvh" }}>
      {err ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <p className="text-[14.5px] leading-relaxed" style={{ color: "rgba(255,255,255,.88)" }}>
            The in-app camera couldn't open — your phone's own camera works exactly the same.
          </p>
          <button onClick={() => { onClose(); onFallback && onFallback(); }}
            className="tap h-11 px-5 rounded-xl text-[14px] font-semibold mt-5" style={{ background: C.gold, color: "#fff" }}>
            Open phone camera
          </button>
          <button onClick={onClose} className="tap text-[13px] mt-4" style={{ color: "rgba(255,255,255,.7)" }}>Cancel</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
          <div className="absolute inset-0 flex flex-col">
            <div className="text-center" style={{ paddingTop: "calc(var(--sa-top) + 20px)" }}>
              <span className="text-[13.5px] font-medium px-3.5 py-1.5 rounded-full" style={{ color: "#fff", background: "rgba(0,0,0,.45)" }}>
                Place the licence inside the frame
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="w-full rounded-2xl" style={{ aspectRatio: "1.586", border: "2.5px solid rgba(255,255,255,.95)", boxShadow: "0 0 0 9999px rgba(0,0,0,.45)" }} />
            </div>
            <div className="pb-10 pt-4 flex items-center justify-center gap-10">
              <button onClick={onClose} className="tap text-[14px] font-medium w-16" style={{ color: "rgba(255,255,255,.85)" }}>Cancel</button>
              <button onClick={shoot} className="tap rounded-full" style={{ width: 72, height: 72, background: "#fff", border: "5px solid rgba(255,255,255,.35)" }} />
              <span className="w-16" />
            </div>
          </div>
        </>
      )}
    </div>
  ), document.body);
}

function deskewCardCanvas(oc) {
  // Measure the angle of the card's own white strip (name/number area) via PCA
  // and rotate the output level. Guarantees horizontal scans even when the
  // corners were set carelessly. Silent no-op on any doubt.
  try {
    const w = oc.width, h = oc.height;
    const D = oc.getContext("2d").getImageData(0, 0, w, h).data;
    const x0 = (w * 0.03) | 0, x1 = (w * 0.60) | 0;
    const y0 = (h * 0.70) | 0, y1 = (h * 0.97) | 0;
    const xs = [], ys = [];
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const i = (y * w + x) * 4;
        const r = D[i], g = D[i + 1], b = D[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (r > 168 && g > 168 && b > 168 && mx - mn < 42) { xs.push(x); ys.push(y); }
      }
    }
    const n = xs.length;
    if (n < 300) return oc;
    let mx2 = 0, my2 = 0;
    for (let i = 0; i < n; i++) { mx2 += xs[i]; my2 += ys[i]; }
    mx2 /= n; my2 /= n;
    let cxx = 0, cxy = 0, cyy = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx2, dy = ys[i] - my2;
      cxx += dx * dx; cxy += dx * dy; cyy += dy * dy;
    }
    let a = 0.5 * Math.atan2(2 * cxy, cxx - cyy) * 180 / Math.PI;
    if (a > 45) a -= 90;
    if (a < -45) a += 90;
    if (Math.abs(a) <= 0.3 || Math.abs(a) > 15) return oc;
    const rc = document.createElement("canvas");
    rc.width = w; rc.height = h;
    const rctx = rc.getContext("2d");
    rctx.translate(w / 2, h / 2);
    rctx.rotate(-a * Math.PI / 180);
    rctx.drawImage(oc, -w / 2, -h / 2);
    const k = 0.012, cw = (w * (1 - 2 * k)) | 0, ch = (h * (1 - 2 * k)) | 0;
    const cc = document.createElement("canvas");
    cc.width = cw; cc.height = ch;
    cc.getContext("2d").drawImage(rc, (w * k) | 0, (h * k) | 0, cw, ch, 0, 0, cw, ch);
    return cc;
  } catch (e) { return oc; }
}

function warpCardFromImage(imgEl, ptsNatural, outW, outH) {
  // Cap the working size for speed; scale the corner points to match.
  const natW = imgEl.naturalWidth, natH = imgEl.naturalHeight;
  const cap = 1600;
  const k = Math.min(1, cap / Math.max(natW, natH));
  const sw = Math.max(1, Math.round(natW * k)), sh = Math.max(1, Math.round(natH * k));
  const sc = document.createElement("canvas");
  sc.width = sw; sc.height = sh;
  const sctx = sc.getContext("2d");
  sctx.drawImage(imgEl, 0, 0, sw, sh);
  const srcData = sctx.getImageData(0, 0, sw, sh);
  const S = srcData.data;
  const srcPts = ptsNatural.map(([x, y]) => [x * k, y * k]);
  const dstPts = [[0, 0], [outW, 0], [outW, outH], [0, outH]];
  const h = solveHomography(dstPts, srcPts);

  const oc = document.createElement("canvas");
  oc.width = outW; oc.height = outH;
  const octx = oc.getContext("2d");

  if (!h) {
    // Degenerate quad: never fail hard — fall back to the quad's bounding box.
    const xs = srcPts.map((p) => p[0]), ys = srcPts.map((p) => p[1]);
    const x0 = Math.max(0, Math.min(...xs)), y0 = Math.max(0, Math.min(...ys));
    const bw = Math.max(2, Math.min(sw, Math.max(...xs)) - x0);
    const bh = Math.max(2, Math.min(sh, Math.max(...ys)) - y0);
    octx.drawImage(sc, x0, y0, bw, bh, 0, 0, outW, outH);
    return deskewCardCanvas(oc).toDataURL("image/jpeg", 0.92);
  }

  const [a, b, c, d, e, f, g, hh] = h;
  const out = octx.createImageData(outW, outH);
  const O = out.data;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const den = g * x + hh * y + 1;
      const sx = (a * x + b * y + c) / den;
      const sy = (d * x + e * y + f) / den;
      const di = (y * outW + x) * 4;
      if (sx < 0 || sy < 0 || sx > sw - 1 || sy > sh - 1) {
        O[di] = O[di + 1] = O[di + 2] = 245; O[di + 3] = 255;
        continue;
      }
      const x0 = sx | 0, y0 = sy | 0;
      const x1 = Math.min(sw - 1, x0 + 1), y1 = Math.min(sh - 1, y0 + 1);
      const fx = sx - x0, fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4, i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4, i11 = (y1 * sw + x1) * 4;
      const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
      O[di]     = S[i00] * w00 + S[i10] * w10 + S[i01] * w01 + S[i11] * w11;
      O[di + 1] = S[i00 + 1] * w00 + S[i10 + 1] * w10 + S[i01 + 1] * w01 + S[i11 + 1] * w11;
      O[di + 2] = S[i00 + 2] * w00 + S[i10 + 2] * w10 + S[i01 + 2] * w01 + S[i11 + 2] * w11;
      O[di + 3] = 255;
    }
  }
  octx.putImageData(out, 0, 0);
  return deskewCardCanvas(oc).toDataURL("image/jpeg", 0.92);
}

function refineCardQuad(imgEl, quadNat) {
  // Coarse-to-fine: each edge slides along its normal to the outermost point
  // where (R - B) rises from card-level and stays risen — white and teal keep
  // R\u2248B; every surround (gold, skin, fabric) runs red-heavy. Glare bands on the
  // card also rise but the true edge is the LAST card-origin crossing.
  try {
    const natW = imgEl.naturalWidth, natH = imgEl.naturalHeight;
    const cap = 1600;
    const k = Math.min(1, cap / Math.max(natW, natH));
    const w = Math.max(2, Math.round(natW * k)), h = Math.max(2, Math.round(natH * k));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.drawImage(imgEl, 0, 0, w, h);
    const D = ctx.getImageData(0, 0, w, h).data;
    const rb = (x, y) => {
      const xi = Math.round(x), yi = Math.round(y);
      if (xi < 0 || yi < 0 || xi >= w || yi >= h) return 60;
      const i = (yi * w + xi) * 4;
      return D[i] - D[i + 2];
    };
    let fq = quadNat.map(([x, y]) => [x * k, y * k]);

    const onePass = (Q) => {
      const cx = (Q[0][0] + Q[1][0] + Q[2][0] + Q[3][0]) / 4;
      const cy = (Q[0][1] + Q[1][1] + Q[2][1] + Q[3][1]) / 4;
      const edge = (p, q) => {
        let ex = q[0] - p[0], ey = q[1] - p[1];
        const L = Math.hypot(ex, ey);
        if (L < 20) return null;
        ex /= L; ey /= L;
        let nx = -ey, ny = ex;
        const mx2 = (p[0] + q[0]) / 2, my2 = (p[1] + q[1]) / 2;
        if ((mx2 - cx) * nx + (my2 - cy) * ny < 0) { nx = -nx; ny = -ny; }
        const pts = [];
        const nSamp = Math.max(10, Math.round(L / 22));
        for (let i = 1; i < nSamp; i++) {
          const t = i / nSamp;
          const bx = p[0] + ex * L * t, by = p[1] + ey * L * t;
          const prof = [];
          for (let sIdx = -55; sIdx <= 80; sIdx += 2) prof.push(rb(bx + nx * sIdx, by + ny * sIdx));
          const S = prof.map((_, j) => {
            let acc = 0, cnt = 0;
            for (let m = -2; m <= 2; m++) {
              const jj = j + m;
              if (jj >= 0 && jj < prof.length) { acc += prof[jj]; cnt++; }
            }
            return acc / cnt;
          });
          let chosen = -1;
          for (let kk = 7; kk < S.length - 7; kk++) {
            let pre = 0;
            for (let m = kk - 6; m < kk; m++) pre += S[m];
            pre /= 6;
            let post = 0;
            for (let m = kk + 1; m <= kk + 7; m++) post += S[m];
            post /= 7;
            let far = 0;
            for (let m = kk + 4; m <= kk + 7; m++) far += S[m];
            far /= 4;
            if (pre < 10 && post - pre > 18 && far - pre > 14) chosen = kk;
          }
          if (chosen < 0) continue;
          const sVal = -55 + 2 * chosen;
          pts.push([bx + nx * sVal, by + ny * sVal]);
        }
        return pts.length >= 5 ? pts : null;
      };
      const fitL = (pts, vertical) => {
        let U = pts.map((p) => (vertical ? p[1] : p[0]));
        let V2 = pts.map((p) => (vertical ? p[0] : p[1]));
        const solve = () => {
          let su = 0, sv = 0, suu = 0, suv = 0;
          const m2 = U.length;
          for (let i = 0; i < m2; i++) { su += U[i]; sv += V2[i]; suu += U[i] * U[i]; suv += U[i] * V2[i]; }
          const dd = m2 * suu - su * su;
          if (Math.abs(dd) < 1e-9) return null;
          const a2 = (m2 * suv - su * sv) / dd;
          return [a2, (sv - a2 * su) / m2];
        };
        let ab = solve();
        if (!ab) return null;
        const res = U.map((u, i) => Math.abs(V2[i] - (ab[0] * u + ab[1])));
        const med = res.slice().sort((p2, q2) => p2 - q2)[res.length >> 1] || 0;
        const thr = Math.max(3, 2.2 * med);
        const kept = [];
        for (let i = 0; i < U.length; i++) if (res[i] < thr) kept.push(i);
        if (kept.length >= 5) {
          U = kept.map((i) => U[i]); V2 = kept.map((i) => V2[i]);
          const ab2 = solve();
          if (ab2) ab = ab2;
        }
        return ab;
      };
      const tp = edge(Q[0], Q[1]), bp = edge(Q[3], Q[2]);
      const lp = edge(Q[0], Q[3]), rp = edge(Q[1], Q[2]);
      if (!tp || !bp || !lp || !rp) return null;
      const T = fitL(tp, false), Bo = fitL(bp, false), Lf = fitL(lp, true), Rf = fitL(rp, true);
      if (!T || !Bo || !Lf || !Rf) return null;
      const hv = (ha, hb, va, vb) => {
        const y = (ha * vb + hb) / (1 - ha * va);
        return [va * y + vb, y];
      };
      return [hv(T[0], T[1], Lf[0], Lf[1]), hv(T[0], T[1], Rf[0], Rf[1]),
              hv(Bo[0], Bo[1], Rf[0], Rf[1]), hv(Bo[0], Bo[1], Lf[0], Lf[1])];
    };

    for (let pass = 0; pass < 2; pass++) {
      const nq = onePass(fq);
      if (!nq) break;
      fq = nq.map(([x, y]) => [Math.max(0, Math.min(w - 1, x)), Math.max(0, Math.min(h - 1, y))]);
    }
    return fq.map(([x, y]) => [x / k, y / k]);
  } catch (e) { return null; }
}

function detectCardCorners(imgEl) {
  // Careless-path detector: finds the licence by its colour physics (card white
  // has R\u2248B; gold/skin/pink never do; card bodies are saturated), isolates the
  // central connected blob so screenshots and backgrounds can't hijack corners,
  // demands thickness at every border (glints are thin, cards are thick), and
  // locks opposite edges to coherent slopes. Returns natural coords or null.
  try {
    const natW = imgEl.naturalWidth, natH = imgEl.naturalHeight;
    const dw = 256, dh = Math.max(48, Math.round((natH / natW) * dw));
    const c = document.createElement("canvas");
    c.width = dw; c.height = dh;
    const ctx = c.getContext("2d");
    ctx.drawImage(imgEl, 0, 0, dw, dh);
    const D = ctx.getImageData(0, 0, dw, dh).data;
    const mask = new Uint8Array(dw * dh);
    for (let i = 0; i < dw * dh; i++) {
      const r = D[i * 4], g = D[i * 4 + 1], b = D[i * 4 + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const v = (r + g + b) / 3;
      const vv = v + 1e-6;
      const isWhite = Math.abs(r - b) / vv < 0.14 && (mx - mn) / vv < 0.30 && vv > 55;
      const isBody = (mx - mn) / vv > 0.22 && vv > 22 && !((r - b) / vv > 0.18) && g >= r - 6;
      if (isWhite || isBody) mask[i] = 1;
    }
    // largest connected blob among center seeds
    const seen = new Uint8Array(dw * dh);
    const seeds = [
      [dw >> 1, dh >> 1], [dw >> 1, (dh * 0.38) | 0], [dw >> 1, (dh * 0.62) | 0],
      [(dw * 0.35) | 0, dh >> 1], [(dw * 0.65) | 0, dh >> 1],
    ];
    let best = null;
    for (const [sx0, sy0] of seeds) {
      const s0 = sy0 * dw + sx0;
      if (!mask[s0] || seen[s0]) continue;
      const stack = [s0]; const pts = []; seen[s0] = 1;
      while (stack.length) {
        const p = stack.pop(); pts.push(p);
        const px = p % dw, py = (p / dw) | 0;
        if (px > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack.push(p - 1); }
        if (px < dw - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack.push(p + 1); }
        if (py > 0 && mask[p - dw] && !seen[p - dw]) { seen[p - dw] = 1; stack.push(p - dw); }
        if (py < dh - 1 && mask[p + dw] && !seen[p + dw]) { seen[p + dw] = 1; stack.push(p + dw); }
      }
      if (!best || pts.length > best.length) best = pts;
    }
    if (!best || best.length < dw * dh * 0.10) return null;
    const blob = new Uint8Array(dw * dh);
    for (const p of best) blob[p] = 1;

    const RUN = 4, THICK = 10, FILL = 0.8;
    const colOK = (x, y) => {
      let cnt = 0;
      for (let k = 0; k < THICK; k++) cnt += blob[Math.min(dh - 1, y + k) * dw + x];
      return cnt / THICK > FILL;
    };
    const colOKup = (x, y) => {
      let cnt = 0;
      for (let k = 0; k < THICK; k++) cnt += blob[Math.max(0, y - k) * dw + x];
      return cnt / THICK > FILL;
    };
    const rowOK = (x, y) => {
      let cnt = 0;
      for (let k = 0; k < THICK; k++) cnt += blob[y * dw + Math.min(dw - 1, x + k)];
      return cnt / THICK > FILL;
    };
    const rowOKleft = (x, y) => {
      let cnt = 0;
      for (let k = 0; k < THICK; k++) cnt += blob[y * dw + Math.max(0, x - k)];
      return cnt / THICK > FILL;
    };

    const topP = [], botP = [], lefP = [], rigP = [];
    for (let x = 4; x < dw - 4; x += 4) {
      for (let y = 1; y < dh - RUN; y++) {
        if (blob[y * dw + x] && colOK(x, y)) { topP.push([x, y]); break; }
      }
      for (let y = dh - 2; y >= RUN; y--) {
        if (blob[y * dw + x] && colOKup(x, y)) { botP.push([x, y]); break; }
      }
    }
    for (let y = 4; y < dh - 4; y += 4) {
      for (let x = 1; x < dw - RUN; x++) {
        if (blob[y * dw + x] && rowOK(x, y)) { lefP.push([y, x]); break; }
      }
      for (let x = dw - 2; x >= RUN; x--) {
        if (blob[y * dw + x] && rowOKleft(x, y)) { rigP.push([y, x]); break; }
      }
    }

    const fitLine = (pts) => {
      const solve = (P) => {
        let su = 0, sv = 0, suu = 0, suv = 0;
        const n2 = P.length;
        for (const [u, v] of P) { su += u; sv += v; suu += u * u; suv += u * v; }
        const dd = n2 * suu - su * su;
        if (Math.abs(dd) < 1e-9) return null;
        const a = (n2 * suv - su * sv) / dd;
        return [a, (sv - a * su) / n2];
      };
      if (pts.length < 6) return null;
      let ab = solve(pts);
      if (!ab) return null;
      const res = pts.map(([u, v]) => Math.abs(v - (ab[0] * u + ab[1])));
      const med = res.slice().sort((p, q) => p - q)[res.length >> 1] || 0;
      const keep = pts.filter((_, i) => res[i] < Math.max(2.5, 2.5 * med));
      if (keep.length >= 6) { const ab2 = solve(keep); if (ab2) ab = ab2; }
      return ab;
    };

    const T = fitLine(topP), Bo = fitLine(botP), L = fitLine(lefP), Rg = fitLine(rigP);
    if (!T || !Bo) return null;
    let [ta, tb] = T, [ba, bb2] = Bo;
    const deg = (m) => Math.atan(m) * 180 / Math.PI;
    if (Math.abs(deg(ta) - deg(ba)) > 1.6) {
      const meds = topP.map(([u, v]) => v - ba * u).sort((p, q) => p - q);
      tb = meds[meds.length >> 1]; ta = ba;
    }
    const edgeL = L ? [L[0], L[1]] : [0, 1];
    const edgeR = Rg ? [Rg[0], Rg[1]] : [0, dw - 2];
    const hv = (ha, hb, va, vb) => {
      const y = (ha * vb + hb) / (1 - ha * va);
      return [va * y + vb, y];
    };
    let quad = [hv(ta, tb, edgeL[0], edgeL[1]), hv(ta, tb, edgeR[0], edgeR[1]),
                hv(ba, bb2, edgeR[0], edgeR[1]), hv(ba, bb2, edgeL[0], edgeL[1])];
    quad = quad.map(([x, y]) => [Math.max(0, Math.min(dw - 1, x)), Math.max(0, Math.min(dh - 1, y))]);

    const area = Math.abs(
      (quad[1][0] - quad[0][0]) * (quad[3][1] - quad[0][1]) - (quad[3][0] - quad[0][0]) * (quad[1][1] - quad[0][1]) +
      (quad[2][0] - quad[1][0]) * (quad[3][1] - quad[1][1]) - (quad[3][0] - quad[1][0]) * (quad[2][1] - quad[1][1])
    ) / 2;
    if (area < dw * dh * 0.15 || area > dw * dh * 0.97) return null;
    const side = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const minSide = Math.min(side(quad[0], quad[1]), side(quad[1], quad[2]), side(quad[2], quad[3]), side(quad[3], quad[0]));
    if (minSide < Math.min(dw, dh) * 0.18) return null;

    const kx = natW / dw, ky = natH / dh;
    let natQuad = quad.map(([x, y]) => [x * kx, y * ky]);
    natQuad = refineCardQuad(imgEl, natQuad) || natQuad;
    return natQuad;
  } catch (e) { return null; }
}


function CardScanEditor({ image, onDone, onClose }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const [view, setView] = useState(null);        // { scale, offX, offY, natW, natH }
  const [pts, setPts] = useState(null);          // natural coords, TL TR BR BL
  const [note, setNote] = useState("Finding the card…");
  const [busy, setBusy] = useState(false);
  const dragIdx = useRef(-1);
  const [dragging, setDragging] = useState(-1); // which handle is held — powers the loupe

  const measure = () => {
    const wrap = wrapRef.current, img = imgRef.current;
    if (!wrap || !img || !img.naturalWidth) return;
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    setView({
      scale,
      offX: (cw - img.naturalWidth * scale) / 2,
      offY: (ch - img.naturalHeight * scale) / 2,
      natW: img.naturalWidth, natH: img.naturalHeight,
    });
  };

  const runAuto = () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const found = detectCardCorners(img);
    if (found) {
      setPts(found);
      setNote("Card detected — drag any corner to fine-tune.");
    } else {
      const w = img.naturalWidth, h = img.naturalHeight, ix = w * 0.1, iy = h * 0.1;
      setPts([[ix, iy], [w - ix, iy], [w - ix, h - iy], [ix, h - iy]]);
      setNote("Drag the four corners onto the card's corners.");
    }
  };

  const onImgLoad = () => { measure(); runAuto(); };
  useEffect(() => {
    const onR = () => measure();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const toScreen = ([x, y]) => [view.offX + x * view.scale, view.offY + y * view.scale];
  const toImage = (cx, cy) => {
    const r = wrapRef.current.getBoundingClientRect();
    const x = (cx - r.left - view.offX) / view.scale;
    const y = (cy - r.top - view.offY) / view.scale;
    return [Math.max(0, Math.min(view.natW, x)), Math.max(0, Math.min(view.natH, y))];
  };

  const startDrag = (i) => (e) => {
    e.preventDefault();
    dragIdx.current = i;
    setDragging(i);
    const move = (ev) => {
      if (dragIdx.current < 0 || !view) return;
      const t = ev.touches ? ev.touches[0] : ev;
      const p = toImage(t.clientX, t.clientY);
      setPts((P) => P.map((q, k) => (k === dragIdx.current ? p : q)));
    };
    const up = () => {
      dragIdx.current = -1;
      setDragging(-1);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const scan = () => {
    if (!pts || !imgRef.current || busy) return;
    setBusy(true);
    setTimeout(() => {
      try {
        const flat = warpCardFromImage(imgRef.current, pts, 1280, 807);
        onDone(flat);
      } catch (e) {
        console.error("scan failed:", e);
        setBusy(false);
        setNote("Couldn't scan — adjust the corners and try again.");
        return;
      }
    }, 30);
  };

  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0b0d0b", zIndex: 245, height: "100dvh" }}>
      <div className="shrink-0 h-14 px-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,.12)", paddingTop: "var(--sa-top)" }}>
        <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.12)" }}>
          <X size={18} color="#fff" />
        </button>
        <span className="text-[15px] font-semibold text-white">Scan card</span>
        <button onClick={scan} disabled={busy || !pts} className="tap h-9 px-4 rounded-full text-[14px] font-semibold inline-flex items-center gap-1.5" style={{ background: C.gold, color: "#fff" }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <>Scan <Check size={15} strokeWidth={2.6} /></>}
        </button>
      </div>

      <div ref={wrapRef} className="flex-1 min-h-0 relative overflow-hidden">
        <img ref={imgRef} src={image} alt="" onLoad={onImgLoad}
          className="absolute inset-0 w-full h-full" style={{ objectFit: "contain" }} draggable={false} />
        {view && pts && (
          <svg className="absolute inset-0 w-full h-full" style={{ touchAction: "none" }}>
            <polygon points={pts.map((p) => toScreen(p).join(",")).join(" ")}
              fill="rgba(212,164,76,0.12)" stroke={C.gold} strokeWidth="2.5" />
            {pts.map((p, i) => {
              const [sx, sy] = toScreen(p);
              return (
                <g key={i} onPointerDown={startDrag(i)} style={{ cursor: "grab" }}>
                  <circle cx={sx} cy={sy} r="24" fill="rgba(212,164,76,0.12)" />
                  <circle cx={sx} cy={sy} r="11" fill="#fff" stroke={C.gold} strokeWidth="3" />
                </g>
              );
            })}
          </svg>
        )}
        {dragging >= 0 && pts && view && (() => {
          // Magnifier: your thumb hides the corner — this box shows it zoomed,
          // floating in whichever half of the screen your finger isn't.
          const Zn = 1.5, SZ = 132;
          const p = pts[dragging];
          const sy = view.offY + p[1] * view.scale;
          const half = (wrapRef.current ? wrapRef.current.clientHeight : 600) / 2;
          const place = sy < half ? { bottom: 16 } : { top: 16 };
          return (
            <div className="absolute left-1/2 -translate-x-1/2 rounded-2xl overflow-hidden pointer-events-none"
              style={{ width: SZ, height: SZ, ...place, border: `2.5px solid ${C.gold}`,
                boxShadow: "0 5px 20px rgba(0,0,0,.55)", backgroundColor: "#111",
                backgroundImage: `url(${image})`, backgroundRepeat: "no-repeat",
                backgroundSize: `${view.natW * Zn}px ${view.natH * Zn}px`,
                backgroundPosition: `${-(p[0] * Zn - SZ / 2)}px ${-(p[1] * Zn - SZ / 2)}px` }}>
              <div className="absolute left-1/2 top-0 bottom-0" style={{ width: 1, background: "rgba(212,164,76,.9)" }} />
              <div className="absolute top-1/2 left-0 right-0" style={{ height: 1, background: "rgba(212,164,76,.9)" }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 15, height: 15, border: `2px solid ${C.gold}` }} />
            </div>
          );
        })()}
      </div>

      <div className="shrink-0 px-4 pt-3 pb-5 safe-bottom" style={{ borderTop: "1px solid rgba(255,255,255,.12)" }}>
        <div className="flex items-center gap-2.5">
          <p className="flex-1 text-[12.5px] leading-snug" style={{ color: "rgba(255,255,255,.75)" }}>{note}</p>
          <button onClick={runAuto} className="tap h-9 px-3.5 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 shrink-0"
            style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
            <Sparkles size={13} /> Auto
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}

function CropEditor({ slides, initialRatio, onDone, onClose }) {
  const [ratio, setRatio] = useState(initialRatio || "4 / 5");
  const [idx, setIdx] = useState(0);
  const [frames, setFrames] = useState(() => slides.map(() => ({ zoom: 1, x: 0, y: 0 })));
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);
  const drag = useRef(null);
  const pinch = useRef(null);

  const f = frames[idx] || { zoom: 1, x: 0, y: 0 };
  const setF = (patch) => setFrames((F) => F.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  const onStart = (e) => {
    if (e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom: f.zoom };
      return;
    }
    const t = e.touches ? e.touches[0] : e;
    drag.current = { sx: t.clientX, sy: t.clientY, ox: f.x, oy: f.y };
  };
  const onMove = (e) => {
    if (e.touches && e.touches.length === 2 && pinch.current) {
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      setF({ zoom: Math.min(4, Math.max(1, pinch.current.zoom * (d / pinch.current.d))) });
      return;
    }
    if (!drag.current) return;
    const t = e.touches ? e.touches[0] : e;
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const lim = ((f.zoom - 1) / 2) * 100;
    const nx = drag.current.ox + ((t.clientX - drag.current.sx) / r.width) * 100;
    const ny = drag.current.oy + ((t.clientY - drag.current.sy) / r.height) * 100;
    setF({ x: Math.max(-lim, Math.min(lim, nx)), y: Math.max(-lim, Math.min(lim, ny)) });
  };
  const onEnd = () => { drag.current = null; pinch.current = null; };

  // render each photo into the chosen frame, at the chosen position
  const apply = async () => {
    setBusy(true);
    const [rw, rh] = ratio.split("/").map((v) => parseFloat(v.trim()));
    const outW = 1280;
    const outH = Math.round((outW * rh) / rw);

    const done = [];
    for (let i = 0; i < slides.length; i++) {
      const fr = frames[i] || { zoom: 1, x: 0, y: 0 };
      const img = await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = slides[i];
      });
      const cv = document.createElement("canvas");
      cv.width = outW; cv.height = outH;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#F4F5F1";
      ctx.fillRect(0, 0, outW, outH);

      // cover the frame, then apply the user's zoom and offset
      const scale = Math.max(outW / img.width, outH / img.height) * fr.zoom;
      const dw = img.width * scale, dh = img.height * scale;
      const dx = (outW - dw) / 2 + (fr.x / 100) * outW;
      const dy = (outH - dh) / 2 + (fr.y / 100) * outH;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, dx, dy, dw, dh);
      done.push(cv.toDataURL("image/jpeg", 0.88));
    }
    setBusy(false);
    onDone(done, ratio);
  };

  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0b0d0b", zIndex: 240, height: "100dvh" }}>
      <div className="shrink-0 h-14 px-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.12)" }}>
          <X size={18} color="#fff" />
        </button>
        <span className="text-[15px] font-semibold text-white">Reframe</span>
        <button onClick={apply} disabled={busy} className="tap h-9 px-4 rounded-full text-[14px] font-semibold" style={{ background: C.gold, color: "#fff" }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : "Done"}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div ref={boxRef}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          className="relative w-full overflow-hidden rounded-xl"
          style={{ aspectRatio: ratio, background: "#000", touchAction: "none", maxHeight: "56dvh", cursor: "grab" }}>
          <img src={slides[idx]} alt="" draggable="false" className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", transform: `translate(${f.x}%, ${f.y}%) scale(${f.zoom})`, transition: drag.current || pinch.current ? "none" : "transform .15s" }} />
          {/* rule-of-thirds guides */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: .35 }}>
            <div className="absolute" style={{ left: "33.33%", top: 0, bottom: 0, width: 1, background: "#fff" }} />
            <div className="absolute" style={{ left: "66.66%", top: 0, bottom: 0, width: 1, background: "#fff" }} />
            <div className="absolute" style={{ top: "33.33%", left: 0, right: 0, height: 1, background: "#fff" }} />
            <div className="absolute" style={{ top: "66.66%", left: 0, right: 0, height: 1, background: "#fff" }} />
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 safe-bottom">
        {/* zoom slider */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[11px] text-white opacity-60">1×</span>
          <input type="range" min="1" max="4" step="0.01" value={f.zoom}
            onChange={(e) => setF({ zoom: parseFloat(e.target.value) })}
            className="flex-1" style={{ accentColor: C.gold }} />
          <span className="text-[11px] text-white opacity-60">4×</span>
        </div>

        {/* shape picker — applies to every photo in the post */}
        <div className="flex gap-2 mb-3">
          {RATIOS.map((r) => (
            <button key={r.id} onClick={() => setRatio(r.id)}
              className="tap flex-1 h-11 rounded-xl text-[13px] font-semibold flex flex-col items-center justify-center"
              style={{ background: ratio === r.id ? C.gold : "rgba(255,255,255,.12)", color: "#fff" }}>
              {r.label}
              <span className="text-[10px] opacity-70">{r.hint}</span>
            </button>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hidescroll" style={{ scrollbarWidth: "none" }}>
            {slides.map((src, k) => (
              <button key={k} onClick={() => setIdx(k)} className="tap relative shrink-0 rounded-lg overflow-hidden"
                style={{ width: 56, height: 56, border: k === idx ? `2.5px solid ${C.gold}` : "2.5px solid transparent", opacity: k === idx ? 1 : .55 }}>
                <img src={src} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-[11.5px] mt-2.5" style={{ color: "rgba(255,255,255,.55)" }}>
          Drag to reposition · pinch or slide to zoom{slides.length > 1 ? " · tap a photo to reframe it" : ""}
        </p>
      </div>
    </div>
  ), document.body);
}

/* ========================================================================== */
/*  GUEST REVIEW — opened from a one-time link. No account, no sign-in.       */
/* ========================================================================== */
function GuestReview({ token }) {
  const [state, setState] = useState("loading");   // loading | form | done | invalid | used | expired
  const [info, setInfo] = useState(null);          // { mode, trip_id, trip_label, guest_name, members[] }
  const [ratings, setRatings] = useState({});
  const [notes, setNotes] = useState({});
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [live, setLive] = useState({});            // fresh profile stats after publish

  useEffect(() => {
    let on = true;
    (async () => {
      if (!CLOUD) { setState("invalid"); return; }
      const { data: tok } = await supabase.from("review_tokens").select("used_at, expires_at").eq("token", token).maybeSingle();
      if (!on) return;
      if (!tok) { setState("invalid"); return; }
      if (tok.used_at) { setState("used"); return; }
      if (new Date(tok.expires_at) < new Date()) { setState("expired"); return; }
      const { data, error } = await supabase.rpc("review_crew", { p_token: token });
      if (!on) return;
      if (error || !data || !(data.members || []).length) { setState("invalid"); return; }
      setInfo(data);
      setState("form");
    })();
    return () => { on = false; };
  }, [token]);

  const members = info?.members || [];
  const allRated = members.length > 0 && members.every((m) => (ratings[m.id] || 0) > 0);

  const submit = async () => {
    if (!allRated) { setErr(members.length > 1 ? "Please rate each of them — every star becomes part of their record." : "Please choose a rating."); return; }
    setBusy(true); setErr(null);
    const rows = members.map((m) => ({
      token,
      talent_id: m.id,
      trip_id: info.trip_id || null,
      guest_name: info.guest_name || null,
      guest_country: country.trim() || null,
      rating: ratings[m.id],
      body: (notes[m.id] || "").trim() || null,
      trip_label: info.trip_label || null,
    }));
    const { error } = await supabase.from("guest_reviews").insert(rows);
    if (error) {
      setBusy(false);
      setErr("We couldn't save your review — this link may already have been used.");
      return;
    }
    await supabase.from("review_tokens").update({ used_at: new Date().toISOString() }).eq("token", token);
    const { data: fresh } = await supabase.from("profiles").select("id, guest_rating, guest_review_count").in("id", members.map((m) => m.id));
    const map = {};
    (fresh || []).forEach((p) => { map[p.id] = { rating: p.guest_rating, count: p.guest_review_count }; });
    setLive(map);
    setBusy(false);
    setState("done");
  };

  const Shell = ({ children }) => (
    <div className="flex-1 overflow-y-auto hidescroll px-6 py-8" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center gap-2.5 mb-7">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.pine }}>
          <Compass size={20} color={C.goldSoft} strokeWidth={1.9} />
        </div>
        <div>
          <div className="text-[16px] font-semibold leading-none" style={{ color: C.ink }}>Bhutan Tourism Hub</div>
          <div className="text-[10px] font-semibold tracking-[.14em] uppercase mt-1" style={{ color: C.gold }}>Verified guest review</div>
        </div>
      </div>
      {children}
    </div>
  );

  const Message = ({ Icon, title, body: b, tone }) => (
    <Shell>
      <div className="rounded-2xl p-6 text-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: tone === "good" ? C.pineSoft : C.goldSoft }}>
          <Icon size={26} color={tone === "good" ? C.pine : C.gold} />
        </div>
        <div className="text-[17px] font-semibold" style={{ color: C.ink }}>{title}</div>
        <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: C.muted }}>{b}</p>
      </div>
    </Shell>
  );

  if (state === "loading") return (
    <Shell><div className="flex items-center justify-center gap-2 py-16 text-[14px]" style={{ color: C.muted }}>
      <Loader2 size={18} className="animate-spin" /> Opening your review…
    </div></Shell>
  );

  if (state === "invalid") return <Message Icon={ShieldAlert} title="This link isn't valid"
    body="Please check the link in your message, or ask your tour operator to send a new one." />;

  if (state === "used") return <Message Icon={CheckCheck} title="This review is already submitted"
    body="Thank you — each link can only be used once. If you meant to write another review, ask your operator for a new link." tone="good" />;

  if (state === "expired") return <Message Icon={Clock} title="This link has expired"
    body="Review links stay open for 14 days. Ask your tour operator to send a new one and we'll be glad to hear from you." />;

  const Stars = ({ value, onChange, size = 36 }) => (
    <div className="flex justify-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} className="tap" aria-label={`${n} out of 5`}>
          <Star size={size} strokeWidth={1.4}
            color={n <= value ? C.gold : C.line}
            fill={n <= value ? C.gold : "transparent"}
            style={{ transition: "transform .12s", transform: n === value ? "scale(1.08)" : "none" }} />
        </button>
      ))}
    </div>
  );

  if (state === "done") return (
    <Shell>
      <div className="text-center mb-6 fade">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: C.pineSoft }}>
          <Check size={30} color={C.pine} strokeWidth={2.5} />
        </div>
        <div className="text-[21px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>
          Tashi Delek{info?.guest_name ? `, ${String(info.guest_name).split(" ")[0]}` : ""}!
        </div>
        <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: C.muted }}>
          Your review is published and live. This is exactly what you just gave:
        </p>
      </div>

      {members.map((m) => (
        <div key={m.id} className="rounded-2xl p-4 mb-3 fade" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3">
            <Avatar initials={initialsOf(m.name || "?")} size={44} />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{m.name}</div>
              <div className="text-[12px]" style={{ color: C.muted }}>{roleLabel(m.role)}</div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={15} color={n <= (ratings[m.id] || 0) ? C.gold : C.line} fill={n <= (ratings[m.id] || 0) ? C.gold : "transparent"} />
              ))}
            </div>
          </div>
          {(notes[m.id] || "").trim() && <p className="text-[13.5px] leading-snug mt-2.5" style={{ color: C.ink }}>“{(notes[m.id] || "").trim()}”</p>}
          <div className="mt-3 pt-3 text-[12.5px] font-medium" style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.pine }}>
            Live now ✓ You are review #{live[m.id]?.count ?? "1"} on {String(m.name || "their").split(" ")[0]}'s verified profile
            {typeof live[m.id]?.rating === "number" ? ` · rating now ${Number(live[m.id].rating).toFixed(1)}` : ""}
          </div>
        </div>
      ))}

      <div className="rounded-2xl p-4 text-center mt-2 fade" style={{ background: C.pineSoft }}>
        <p className="text-[13px] leading-relaxed" style={{ color: C.pine }}>
          Thank you for travelling with us in Bhutan — and for strengthening the people who made your journey.
          Your words now guide the next traveller. Kadrinche la.
        </p>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="text-[19px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>
          {info?.guest_name ? `${String(info.guest_name).split(" ")[0]}, how` : "How"} was your journey?
        </div>
        {info?.trip_label && (
          <div className="inline-block mt-2 text-[12.5px] rounded-full px-3 py-1"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>
            {info.trip_label}
          </div>
        )}
        {members.length > 1 && (
          <p className="text-[12.5px] mt-2.5 leading-relaxed" style={{ color: C.muted }}>
            Each rating goes to that person's own verified record — a moment for each of them.
          </p>
        )}
      </div>

      {members.map((m) => (
        <div key={m.id} className="rounded-2xl p-5 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3 mb-4">
            <Avatar initials={initialsOf(m.name || "?")} size={48} />
            <div>
              <div className="text-[16px] font-semibold" style={{ color: C.ink }}>{m.name}</div>
              <div className="text-[12.5px]" style={{ color: C.muted }}>Your {m.role === "driver" ? "driver" : "guide"} on this trip</div>
            </div>
          </div>
          <Stars value={ratings[m.id] || 0} onChange={(n) => { setRatings((r) => ({ ...r, [m.id]: n })); setErr(null); }} />
          <div className="text-center text-[13px] font-semibold mt-2" style={{ color: (ratings[m.id] || 0) ? C.gold : "transparent" }}>
            {[null, "Poor", "Fair", "Good", "Great", "Excellent"][ratings[m.id] || 0] || "\u00a0"}
          </div>
          {(ratings[m.id] || 0) > 0 && (
            <textarea value={notes[m.id] || ""} onChange={(e) => setNotes((x) => ({ ...x, [m.id]: e.target.value }))} rows={3} maxLength={600}
              placeholder={m.role === "driver" ? "A line about the driving, the vehicle, the care on the road…" : "A line about what they showed you, what you'll remember…"}
              className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none mt-3 fade"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          )}
        </div>
      ))}

      <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Where are you from? <span style={{ color: C.muted }}>· optional</span></div>
        <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={40} placeholder="e.g. Australia"
          className="w-full h-11 px-3.5 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
      </div>

      {err && <p className="text-[13px] mb-3 text-center" style={{ color: C.maroon }}>{err}</p>}

      <button onClick={submit} disabled={busy} className="tap w-full rounded-xl flex items-center justify-center gap-2 text-[15.5px] font-semibold"
        style={{ height: 54, background: allRated ? C.pine : "#C7CEC7", color: "#fff" }}>
        {busy ? <Loader2 size={19} className="animate-spin" /> : <>Publish my review{members.length > 1 ? "s" : ""} <ArrowRight size={18} strokeWidth={2.4} /></>}
      </button>
      <p className="text-[11.5px] text-center mt-3" style={{ color: C.muted }}>
        No account needed. Published instantly to their public profile on bhutantourismhub.com.
      </p>
    </Shell>
  );
}

const REVIEW_CCODES = [
  ["+91", "IN +91"], ["+1", "US +1"], ["+44", "UK +44"], ["+61", "AU +61"], ["+49", "DE +49"],
  ["+33", "FR +33"], ["+65", "SG +65"], ["+81", "JP +81"], ["+86", "CN +86"], ["+971", "AE +971"],
  ["+66", "TH +66"], ["+977", "NP +977"], ["+880", "BD +880"], ["+975", "BT +975"], ["+7", "RU +7"],
  ["+34", "ES +34"], ["+39", "IT +39"], ["+31", "NL +31"], ["+41", "CH +41"], ["+64", "NZ +64"],
];

function ReviewInvite({ user, trip, onClose }) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [ccode, setCcode] = useState("+91");
  const [ccodeOther, setCcodeOther] = useState("");
  const [phoneNat, setPhoneNat] = useState("");
  const codeVal = ccode === "other" ? ("+" + ccodeOther) : ccode;
  const guestPhone = phoneNat.trim() ? (codeVal + phoneNat).replace(/[^0-9+]/g, "") : "";
  const phoneValid = /^\+[1-9][0-9]{7,14}$/.test(guestPhone);
  const [issued, setIssued] = useState([]);
  const [made, setMade] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);

  const meId = user.talentId || user.id;
  const isAdmin = user.kind === "admin";
  const MAX_PER_TRIP = 12;

  // who is being reviewed — never the person issuing the invite
  const crew = (trip.members || []).filter((m) => m.roleInTrip !== "operator" && m.id !== meId);
  const [subject, setSubject] = useState(crew.length > 1 ? "ALL" : (crew[0]?.id || ""));

  const load = async () => {
    if (!CLOUD) return;
    const { data, error } = await supabase
      .from("review_tokens").select("*").eq("trip_id", trip.id).order("created_at", { ascending: false });
    if (error) { console.error("review_tokens load failed:", error.message); return; }
    setIssued(data || []);
  };
  useEffect(() => { load(); }, [trip.id]);

  const create = async () => {
    if (!subject) { setErr("Choose which crew member the review is for."); return; }
    const emailValid = /\S+@\S+\.\S+/.test(guestEmail);
    if (phoneNat.trim() && !phoneValid) { setErr("That WhatsApp number isn't valid — check the country code and digits."); return; }
    if (!emailValid && !phoneValid) { setErr("Add the guest's email or a valid WhatsApp number — the review needs a verified way to reach them."); return; }
    if (issued.length >= MAX_PER_TRIP) { setErr(`Up to ${MAX_PER_TRIP} guests per trip.`); return; }

    setBusy(true); setErr(null);
    const token = makeReviewToken();
    const { error } = await supabase.from("review_tokens").insert({
      token,
      talent_id: subject === "ALL" ? null : subject,
      trip_id: trip.id,
      trip_label: trip.title,
      guest_name: guestName.trim() || null,
      guest_email: guestEmail.trim() || null,
      guest_phone: phoneValid ? guestPhone : null,
      issued_by: meId,
      issuer_role: isAdmin ? "admin" : "operator",
    });
    setBusy(false);
    if (error) {
      console.error("review_tokens.insert failed:", error.message);
      setErr(/row-level security/i.test(error.message)
        ? "Only tour operators and admins can request reviews."
        : "Couldn't create the link. Please try again.");
      return;
    }
    setMade(`${window.location.origin}/?review=${token}`);
    setGuestName(""); setGuestEmail("");
    load();
  };

  // Kept short on purpose: WhatsApp truncates long pre-filled messages on some phones,
  // and the link must sit on its own line so it is detected and previewed correctly.
  const guestMessage = () =>
`Thank you for travelling with us in Bhutan.

Before the memories fade, we would be grateful for a one-minute review of ${subjectName}. Reviews form their verified professional record on Bhutan Tourism Hub and directly support their livelihood.

${made}

The link works once and expires in 14 days.`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(made); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch (e) { setErr("Couldn't copy — press and hold the link instead."); }
  };

  const sendWhatsApp = () => {
    const digits = String(guestPhone || "").replace(/[^\d]/g, "");
    const text = encodeURIComponent(guestMessage());
    // with a number: opens that person's chat directly. without: WhatsApp asks who to send to.
    const url = digits.length >= 8
      ? `https://wa.me/${digits}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener");
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Review your trip", text: guestMessage() });
      else copy();
    } catch (e) {}
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`A quick review for ${subjectName}?`);
    window.location.href = `mailto:${guestEmail || ""}?subject=${subject}&body=${encodeURIComponent(guestMessage())}`;
  };

  const subjectName = subject === "ALL" ? (crew.map((m) => String(m.name || "").split(" ")[0]).filter(Boolean).join(" and ") || "your crew") : ((trip.members || []).find((m) => m.id === subject)?.name || "the guide");

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "90dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Ask a guest for a review</div>
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>{trip.title} · {fmtDate(trip.start)} – {fmtDate(trip.end)}</p>
        </div>

        <div className="flex-1 overflow-y-auto hidescroll px-5 pb-5" style={{ scrollbarWidth: "none" }}>
          {crew.length === 0 ? (
            <Empty Icon={Users} title="No crew to review"
              body="Reviews are for the guides and drivers on this trip. You cannot request a review of yourself." />
          ) : (
            <>
              <div className="text-[12.5px] font-medium mb-1.5" style={{ color: C.ink }}>Review is for</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {crew.length > 1 && <Chip on={subject === "ALL"} onClick={() => setSubject("ALL")}>Whole crew · one link</Chip>}
                {crew.map((m) => (
                  <Chip key={m.id} on={subject === m.id} onClick={() => setSubject(m.id)}>{m.name}</Chip>
                ))}
              </div>

              <div className="text-[12.5px] font-medium mb-1.5" style={{ color: C.ink }}>Guest name</div>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={60}
                placeholder="e.g. Sarah Whitfield"
                className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

              <div className="text-[12.5px] font-medium mb-1.5" style={{ color: C.ink }}>Guest email</div>
              <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} inputMode="email" autoCapitalize="none"
                placeholder="guest@email.com"
                className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-1.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              <p className="text-[11.5px] mb-4" style={{ color: C.muted }}>
                Kept private, never shown on the review. It exists so a disputed review can be traced.
              </p>

              <div className="text-[12.5px] font-medium mb-1.5" style={{ color: C.ink }}>Guest WhatsApp number</div>
              <div className="flex gap-2 mb-1.5">
                <select value={ccode} onChange={(e) => setCcode(e.target.value)} className="h-11 px-1.5 rounded-xl text-[13px]"
                  style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, width: 96 }}>
                  {REVIEW_CCODES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                  <option value="other">Other</option>
                </select>
                {ccode === "other" && (
                  <input value={ccodeOther} onChange={(e) => setCcodeOther(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} inputMode="numeric" placeholder="Code"
                    className="h-11 px-2 rounded-xl text-[14px] text-center" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, width: 62 }} />
                )}
                <input value={phoneNat} onChange={(e) => setPhoneNat(e.target.value.replace(/[^0-9 ]/g, "").slice(0, 16))} inputMode="tel" placeholder="Number"
                  className="flex-1 h-11 px-3.5 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${phoneNat.trim() && !phoneValid ? C.maroon : phoneValid ? C.pine : C.line}`, color: C.ink }} />
              </div>
              <p className="text-[11.5px] mb-4" style={{ color: phoneNat.trim() && !phoneValid ? C.maroon : phoneValid ? C.pine : C.muted }}>
                {phoneNat.trim() && !phoneValid ? "Not a valid number for that code yet — keep typing or fix the code." : phoneValid ? `Verified format ✓ WhatsApp will open straight to ${guestPhone}` : "Pick the country code first — the number is validated before anything sends."}
              </p>

              {err && <p className="text-[13px] mb-2.5" style={{ color: C.maroon }}>{err}</p>}

              {made ? (
                <div className="rounded-2xl p-4 mb-4" style={{ background: C.pineSoft }}>
                  <div className="text-[13.5px] font-semibold mb-1" style={{ color: C.pine }}>Link ready</div>
                  <p className="text-[12px] mb-2.5" style={{ color: C.pine, opacity: .85 }}>
                    Works once, expires in 14 days. Best shared with the guest in person on the last day.
                  </p>
                  <div className="rounded-lg px-3 py-2 mb-2.5 break-all text-[11.5px] font-mono" style={{ background: C.card, color: C.ink }}>{made}</div>
                  <button onClick={sendWhatsApp}
                    className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-2"
                    style={{ background: "#25D366", color: "#fff" }}>
                    <MessageCircle size={17} /> Send on WhatsApp
                  </button>
                  <div className="flex gap-2">
                    <button onClick={sendEmail} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}><Mail size={14} /> Email</button>
                    <button onClick={share} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}><Share2 size={14} /> Share</button>
                    <button onClick={copy} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{copied ? "Copied" : "Copy"}</button>
                  </div>
                  <button onClick={() => setMade(null)} className="tap w-full h-9 rounded-lg text-[12.5px] font-medium mt-2" style={{ color: C.pine }}>
                    Create another for the next guest
                  </button>
                </div>
              ) : (
                <button onClick={create} disabled={busy || issued.length >= MAX_PER_TRIP}
                  className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-4"
                  style={{ background: issued.length >= MAX_PER_TRIP ? "#C7CEC7" : C.pine, color: "#fff" }}>
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={17} strokeWidth={3} /> Create link for {String(subjectName).split(" ")[0]}</>}
                </button>
              )}
            </>
          )}

          {issued.length > 0 && (
            <>
              <div className="text-[11.5px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.gold }}>
                Requests for this trip · {issued.length}/{MAX_PER_TRIP}
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                {issued.map((t, i) => {
                  const used = Boolean(t.used_at);
                  const expired = !used && new Date(t.expires_at) < new Date();
                  return (
                    <div key={t.token} className="px-3.5 py-2.5 flex items-center gap-2.5"
                      style={{ background: C.card, borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: used ? C.pineSoft : expired ? C.maroonSoft : C.goldSoft }}>
                        {used ? <Check size={13} color={C.pine} /> : expired ? <X size={13} color={C.maroon} /> : <Clock size={13} color={C.gold} />}
                      </span>
                      <span className="flex-1 text-[13px] truncate" style={{ color: C.ink }}>{t.guest_name || t.guest_email || "Guest"}</span>
                      <span className="text-[11.5px] shrink-0" style={{ color: C.muted }}>
                        {used ? "Reviewed" : expired ? "Expired" : "Waiting"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="rounded-xl p-3.5 flex gap-2.5 mt-4" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <ShieldCheck size={16} color={C.gold} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
              Guides and drivers cannot request reviews of themselves — only the operator running the trip,
              or an admin, can. Every request is recorded against the trip, so a rating can always be traced
              back to real work.
            </p>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}

/* ========================================================================== */
/*  GUEST REVIEWS on a profile — with visible provenance                      */
/* ========================================================================== */
function GuestReviews({ talentId, isAdmin, isSelf, onAskOperator, onCount }) {
  const [rows, setRows] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    if (!CLOUD) { setRows([]); return; }
    const { data, error } = await supabase
      .from("guest_reviews").select("*")
      .eq("talent_id", talentId).eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) { console.error("guest_reviews load failed:", error.message); setRows([]); return; }
    setRows(data || []);
    onCount && onCount((data || []).length);
  };
  useEffect(() => { load(); }, [talentId]);

  const hide = async (id) => {
    setBusyId(id);
    const { error } = await supabase.from("guest_reviews").update({ status: "hidden" }).eq("id", id);
    setBusyId(null);
    if (error) { console.error("hide review failed:", error.message); return; }
    load();
  };

  if (rows === null) {
    return <div className="flex items-center gap-2 justify-center py-8 text-[13.5px]" style={{ color: C.muted }}>
      <Loader2 size={16} className="animate-spin" /> Loading reviews…
    </div>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl px-5 py-8 flex flex-col items-center text-center"
        style={{ background: C.card, border: `1px dashed ${C.line}` }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.goldSoft }}>
          <Star size={22} color={C.gold} />
        </div>
        <div className="text-[15px] font-semibold" style={{ color: C.ink }}>No guest reviews yet</div>
        <p className="text-[13px] leading-snug mt-1.5 mb-3" style={{ color: C.muted }}>
          {isSelf
            ? "Reviews are sent by the tour operator who ran your trip. Ask them after your next trip ends."
            : "Guest reviews appear here once an operator invites guests to review this person."}
        </p>
        {isSelf && onAskOperator && (
          <button onClick={onAskOperator} className="tap h-10 px-4 rounded-xl text-[13.5px] font-semibold inline-flex items-center gap-1.5"
            style={{ background: C.pine, color: "#fff" }}>
            <Send size={14} /> Ask your operator
          </button>
        )}
      </div>
    );
  }

  const avg = rows.length ? rows.reduce((a, r) => a + (Number(r.rating) || 0), 0) / rows.length : 0;
  const facet = (key) => {
    const vals = rows.map((r) => r[key]).filter((v) => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const facets = [["Knowledge", facet("knowledge")], ["Care", facet("care")], ["Communication", facet("communication")]]
    .filter(([, v]) => v !== null);

  return (
    <div>
      {/* summary */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
        <div className="px-4 py-3.5 flex items-center justify-between" style={{ background: C.pine }}>
          <div>
            <div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldSoft }}>Guest reviews</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: "#ffffffcc" }}>{rows.length} {rows.length === 1 ? "review" : "reviews"}</div>
          </div>
          <div className="text-right">
            <div className="text-[26px] font-semibold leading-none text-white">{Number(avg || 0).toFixed(1)}</div>
            <div className="mt-1 flex justify-end"><Stars score={Number(avg) || 0} light /></div>
          </div>
        </div>
        {facets.length > 0 && (
          <div className="px-4 py-3.5 space-y-3" style={{ background: C.card }}>
            {facets.map(([label, v]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[13px] font-medium" style={{ color: C.ink }}>{label}</span>
                  <span className="text-[12.5px] font-semibold" style={{ color: C.pine }}>{Number(v || 0).toFixed(1)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.lineSoft }}>
                  <div className="h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, background: `linear-gradient(90deg, ${C.gold}, #D9A94E)` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* individual reviews */}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}>
                <span className="text-[13px] font-semibold" style={{ color: "#7a5a1e" }}>
                  {(r.guest_name || "G").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-semibold" style={{ color: C.ink }}>{r.guest_name || "Guest"}</span>
                  {r.guest_country && <span className="text-[12px]" style={{ color: C.muted }}>· {r.guest_country}</span>}
                </div>
                <div className="mt-1"><Stars score={Number(r.rating) || 0} /></div>
              </div>
              {isAdmin && (
                <button onClick={() => hide(r.id)} disabled={busyId === r.id}
                  className="tap w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: C.maroonSoft }} aria-label="Hide review">
                  {busyId === r.id ? <Loader2 size={13} className="animate-spin" color={C.maroon} /> : <Trash2 size={13} color={C.maroon} />}
                </button>
              )}
            </div>

            {r.body && <p className="text-[14px] leading-relaxed mt-2.5" style={{ color: C.ink }}>{r.body}</p>}

            {/* provenance — this is what makes the review trustworthy */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {r.trip_label && (
                <span className="text-[11px] rounded-full px-2 py-1" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>
                  {r.trip_label}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-1"
                style={{ background: r.issuer_role === "admin" ? C.goldSoft : C.pineSoft,
                         color: r.issuer_role === "admin" ? "#7a5a1e" : C.pine }}>
                <ShieldCheck size={10} />
                {r.issuer_role === "admin" ? "Verified by Bhutan Tourism Hub" : "Invited by the tour operator"}
              </span>
              <span className="text-[11px]" style={{ color: C.muted }}>{relTime(new Date(r.created_at).getTime())}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11.5px] text-center mt-4 leading-snug" style={{ color: C.muted }}>
        Each review comes from a one-time link tied to a specific trip. We show who sent the invite so
        you can judge it for yourself.
      </p>
    </div>
  );
}

/* ========================================================================== */
/*  INVITE YOUR OPERATOR                                                      */
/*  A guide cannot request their own reviews — so this is how they get one:   */
/*  they invite the operator who ran the trip. That operator joins to issue   */
/*  the review, and becomes a user of the platform in the process.            */
/* ========================================================================== */
function OperatorInvite({ user, trip, onClose }) {
  const [company, setCompany] = useState(trip?.operator || "");
  const [opPhone, setOpPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(null);

  const first = String(user.name || "").split(" ")[0] || "your guide";
  const joinLink = `${window.location.origin}/?invited_by=${encodeURIComponent(user.talentId || user.id)}`;

  // Deliberately short. WhatsApp truncates long pre-filled messages on some phones,
  // and the link is placed on its own line so it is detected and previewed properly.
  const message =
`Kuzu Zangpo la${company ? ` ${company}` : ""},

There's a new platform in Bhutan — Bhutan Tourism Hub — where licensed guides and drivers keep a verified professional record, and where guest reviews are stored permanently against real trips.

What makes it different: a guide cannot write or request their own reviews. Only the tour operator who ran the trip can invite a guest to review. That's what keeps the ratings honest.

${trip ? `Would you send our guests from "${trip.title}" a review link? ` : "Would you send my guests a review link after our trips? "}It takes a minute, and it builds a record that actually means something.

Free to join:
${joinLink}

Kadrinchhey la,
${user.name || ""}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2400); }
    catch (e) { setNote("Couldn't copy — press and hold the message to copy it."); }
  };

  const shareWhatsApp = () => {
    const digits = String(opPhone || "").replace(/[^\d]/g, "");
    const withCode = digits.length === 8 ? `975${digits}` : digits;   // bare Bhutanese mobile
    const text = encodeURIComponent(message);
    const url = withCode.length >= 8
      ? `https://wa.me/${withCode}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener");
  };

  const shareNative = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Bhutan Tourism Hub", text: message });
      else copy();
    } catch (e) {}
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Bhutan Tourism Hub — guest reviews for our trips");
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(message)}`;
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "90dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Ask your operator for reviews</div>
          <p className="text-[13px] mt-1 leading-snug" style={{ color: C.muted }}>
            Guides can't request their own reviews — that's what makes the ratings worth something.
            Invite the operator who ran the trip and they can send your guests a review link.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto hidescroll px-5 pb-5" style={{ scrollbarWidth: "none" }}>
          <div className="text-[12.5px] font-medium mb-1.5" style={{ color: C.ink }}>Operator or agency name</div>
          <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={60}
            placeholder="e.g. Druk Journeys"
            className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

          <div className="text-[12.5px] font-medium mb-1.5" style={{ color: C.ink }}>Their WhatsApp number <span style={{ color: C.muted }}>· optional</span></div>
          <input value={opPhone} onChange={(e) => setOpPhone(e.target.value)} inputMode="tel"
            placeholder="17 12 34 56 — or with country code"
            className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-1.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <p className="text-[11.5px] mb-4" style={{ color: C.muted }}>
            Add it and WhatsApp opens straight to their chat. A Bhutanese 8-digit number works on its own.
          </p>

          <div className="text-[11.5px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.gold }}>Message</div>
          <div className="rounded-xl p-3.5 mb-3 text-[12.5px] leading-relaxed whitespace-pre-wrap"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, maxHeight: 240, overflowY: "auto" }}>
            {message}
          </div>

          {note && <p className="text-[12.5px] mb-2" style={{ color: C.maroon }}>{note}</p>}

          <div className="space-y-2">
            <button onClick={shareWhatsApp}
              className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
              style={{ background: "#25D366", color: "#fff" }}>
              <MessageCircle size={17} /> Send on WhatsApp
            </button>
            <div className="flex gap-2">
              <button onClick={shareEmail} className="tap flex-1 h-11 rounded-xl text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                <Mail size={15} /> Email
              </button>
              <button onClick={shareNative} className="tap flex-1 h-11 rounded-xl text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                <Share2 size={15} /> Share
              </button>
              <button onClick={copy} className="tap flex-1 h-11 rounded-xl text-[13.5px] font-semibold"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="rounded-xl p-3.5 flex gap-2.5 mt-4" style={{ background: C.goldSoft }}>
            <Star size={16} color={C.gold} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: "#7a5a1e" }}>
              <b>Tip:</b> ask on the last day of the trip, while the guests are still with you.
              A review written the same week is far more specific — and far more useful to the next operator reading it.
            </p>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}
