// ===== BHUTAN TOURISM HUB — FILE VERSION 17 — 14 AUG — VERIFIED CLEAN =====
import React, { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, ArrowRight, Award, BadgeCheck, BarChart3, Bell, Briefcase, Building2, CalendarCheck, CalendarDays, Camera, Car, Check, CheckCheck, ChevronLeft, ChevronRight, Clock, Compass, Download, ExternalLink, Eye, EyeOff, FileCheck2, FileDown, Heart, ImagePlus, Inbox, Loader2, Lock, LogOut, Mail, Map as MapIcon, MapPin, Maximize2, MessageCircle, MessageSquare, Mic, Navigation as NavIcon, Newspaper, Phone, PhoneCall, Plus, RefreshCw, Search, Send, Send as SendIcon, Share, Share2, ShieldAlert, ShieldCheck, Sparkles, Star, Store, Trash2, Upload, User, UserCheck, UserPlus, Users, UserX, Video as VideoIcon, Wallet, X,
} from "lucide-react";
import mapImg from "./map.jpg";
import { supabase } from "./supabase.js";

/* The Druk Pah trip engine, from pristinebhutantravels.com.

   These are UMD files: they assign to module.exports when that exists, and fall
   back to window otherwise. Which path a bundler takes is not ours to choose -
   Vite's CommonJS plugin sees module.exports and treats them as CommonJS, so
   the exports are handed to us and window is never touched. Under plain ESM the
   opposite happens. So take the namespace AND keep the global as a fallback,
   and resolve at call time rather than at load.

   The brain is imported first either way: under ESM the engine reads it off the
   global as it evaluates. */
import brainDefault, * as brainMod from "./itinerary-brain.js";
import pahDefault, * as pahMod from "./drukpah-engine.js";

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
const allProfiles = () => Object.values(PROFILE_DIR);
const profileToTalent = (p) => ({
  id: p.id, role: p.role, name: (p.role === "business" && p.company_name) || p.full_name || "Member", base: p.base || "",
  handle: p.handle || null,
  taUrl: p.tripadvisor_url || null, gUrl: p.google_reviews_url || null,
  rateLow: p.rate_low != null ? Number(p.rate_low) : null,
  photoUrl: p.photo_url || null,
  starRating: p.star_rating || null,
  stayKind: p.stay_kind || null,
  rateHigh: p.rate_high != null ? Number(p.rate_high) : null,
  rateNote: p.rate_note || null,
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

/* Whichever way the bundle was made, find the engine: the CommonJS default
   export, the ESM namespace itself, or the UMD global. `probe` is a function
   the real object must have, so a half-loaded module is never mistaken for a
   working one. */
function resolveEngine(mod, globalName, probe, direct) {
  if (direct && typeof direct[probe] === "function") return direct;
  const d = mod && mod.default;
  if (d && typeof d[probe] === "function") return d;
  if (mod && typeof mod[probe] === "function") return mod;
  const g = typeof window !== "undefined" ? window[globalName] : null;
  if (g && typeof g[probe] === "function") return g;
  return null;
}
const brainOf = () => resolveEngine(brainMod, "ItineraryBrain", "draft", brainDefault);
const drukPahOf = () => resolveEngine(pahMod, "DrukPah", "session", pahDefault);

/* Which route worked, for the error message if none did. */
function engineDiag() {
  const w = typeof window !== "undefined" ? window : {};
  return [
    "direct=" + (brainDefault ? "yes" : "no"),
    "brain.default=" + (brainMod && brainMod.default ? "yes" : "no"),
    "brain.draft=" + (brainMod && typeof brainMod.draft === "function" ? "yes" : "no"),
    "window.ItineraryBrain=" + (w.ItineraryBrain ? "yes" : "no"),
    "pah.default=" + (pahMod && pahMod.default ? "yes" : "no"),
    "window.DrukPah=" + (w.DrukPah ? "yes" : "no"),
  ].join(", ");
}
const DEMO_MODE = false;   // set true only for local demos without a database
const BUILD = "BUILD 75 — 02 Sep";   // bump every deploy; shown at the top of the welcome screen

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

/* ---- A tour operator with the link. No account, no sign-in, one decision. ---- */
/* Module scope on purpose. Declared inside a component this became a new
   component type on every render, so React destroyed the children it wraps
   and anyone typing lost the field. */
function VerifyShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
      <div className="px-6 pt-6 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.pine }}>
          <Compass size={16} color={C.goldSoft} strokeWidth={2.1} />
        </div>
        <div className="text-[13.5px] font-semibold" style={{ color: C.pine }}>Bhutan Tourism Hub</div>
      </div>
      <div className="flex-1 px-6 pb-10">{children}</div>
    </div>
  );
}

/* ---- Someone invited to a trip, arriving before they have an account. ---- */
function TripInvitePage({ token, session }) {
  const [inv, setInv] = useState(undefined);
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("trip_invite_peek", { t: token });
      const r = Array.isArray(data) ? data[0] : data;
      setInv(error || !r ? null : r);
    })();
  }, [token]);

  // Once they have an account, put them on the trip.
  const claim = async () => {
    setClaiming(true); setMsg(null);
    const { data, error } = await supabase.rpc("claim_trip_invite", { t: token });
    setClaiming(false);
    if (error) { setMsg("Could not join the trip. Check your connection and try again."); return; }
    const r = String(data || "");
    if (r === "ok" || r === "already_yours") { setDone(true); return; }
    if (r.startsWith("double_booked:")) {
      setMsg(`You are already on "${r.split(":").slice(1).join(":")}" across these dates. A guide or driver can only be on one trip at a time. Tell the operator so they can sort it out.`);
      return;
    }
    setMsg(r === "taken" ? "Someone else has already used this invitation."
         : r === "cancelled" ? "This invitation was withdrawn."
         : r === "missing" ? "This invitation link is not valid."
         : "Could not join the trip.");
  };

  useEffect(() => { if (session && inv && inv.status === "sent" && !done) claim(); }, [session, inv]);

  if (inv === undefined) return <VerifyShell><p className="text-[14px] mt-8" style={{ color: C.muted }}>Opening the invitation…</p></VerifyShell>;

  if (inv === null) return (
    <VerifyShell>
      <div className="rounded-2xl p-5 mt-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-[16px] font-semibold" style={{ color: C.ink }}>This invitation is not working</div>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: C.muted }}>
          It may have been withdrawn, or the link was cut short when it was sent. Ask the operator to send it again.
        </p>
      </div>
    </VerifyShell>
  );

  if (done) return (
    <VerifyShell>
      <div className="rounded-2xl p-5 mt-6 text-center" style={{ background: C.card, border: `1.5px solid ${C.pine}` }}>
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: C.pineSoft }}>
          <Check size={26} color={C.pine} strokeWidth={2.6} />
        </div>
        <div className="text-[18px] font-semibold mt-3" style={{ color: C.ink }}>You are on the trip</div>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: C.muted }}>
          {inv.trip_title} is now in your Trips, with the crew chat and the meeting point.
        </p>
        <a href="/" className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[15.5px] font-semibold mt-5"
          style={{ height: 52, background: C.pine, color: "#fff", textDecoration: "none" }}>
          Open the app <ArrowRight size={18} strokeWidth={2.4} />
        </a>
      </div>
    </VerifyShell>
  );

  return (
    <VerifyShell>
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3" style={{ background: C.goldSoft }}>
        <UserPlus size={13} color={C.gold} />
        <span className="text-[11.5px] font-bold tracking-[.08em] uppercase" style={{ color: C.gold }}>Invitation</span>
      </div>

      <h1 className="text-[24px] leading-tight font-semibold" style={{ color: C.ink }}>
        {inv.operator_name} wants you on a trip
      </h1>
      <p className="text-[14px] mt-2 leading-relaxed" style={{ color: C.muted }}>
        Hello {inv.invited_name}. You have been invited as the {inv.role === "driver" ? "driver" : "guide"}.
      </p>

      <div className="rounded-2xl p-4 mt-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-[16px] font-semibold" style={{ color: C.ink }}>{inv.trip_title}</div>
        <div className="text-[13px] mt-1" style={{ color: C.muted }}>
          {fmtRange(inv.starts, inv.ends)}
        </div>
        {inv.meeting_point && (
          <div className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: C.muted }}>
            <MapPin size={13} color={C.gold} /> {inv.meeting_point}
          </div>
        )}
      </div>

      {msg && <p className="text-[13px] mt-4 leading-snug" style={{ color: C.maroon }}>{msg}</p>}

      {session ? (
        <button onClick={claim} disabled={claiming}
          className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16px] font-semibold mt-5"
          style={{ height: 54, background: C.pine, color: "#fff" }}>
          {claiming ? "Joining…" : "Join this trip"}
        </button>
      ) : (
        <>
          <a href={`/?invite=${token}&signup=1`}
            className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16px] font-semibold mt-5"
            style={{ height: 54, background: C.pine, color: "#fff", textDecoration: "none" }}>
            Create my account <ArrowRight size={18} strokeWidth={2.4} />
          </a>
          <p className="text-[12.5px] mt-3 leading-snug text-center" style={{ color: C.muted }}>
            Takes two minutes. Once you are in, this trip is already waiting for you — you do not have to find it.
          </p>
        </>
      )}
    </VerifyShell>
  );
}

function VerifyReview({ token }) {
  const [row, setRow] = useState(undefined);   // undefined=loading  null=bad link
  const [who, setWho] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);      // "verified" | "declined"
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("legacy_review_peek", { t: token });
      if (error) { setRow(null); return; }
      const r = Array.isArray(data) ? data[0] : data;
      setRow(r || null);
      if (r && ["verified", "declined"].includes(r.status)) setDone(r.status);
    })();
  }, [token]);

  const decide = async (d) => {
    if (busy) return;
    setBusy(true); setErr(null);
    const { data, error } = await supabase.rpc("legacy_review_decide", { t: token, d, who: who.trim() || null });
    setBusy(false);
    if (error) { setErr("Could not save that. Check your connection and try once more."); return; }
    if (data === "done") { setDone("verified"); return; }
    if (data !== "ok") { setErr("This link is no longer active."); return; }
    setDone(d);
  };


  if (row === undefined) return <VerifyShell><p className="text-[14px] mt-8" style={{ color: C.muted }}>Opening the review…</p></VerifyShell>;

  if (row === null) return (
    <VerifyShell>
      <div className="rounded-2xl p-5 mt-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-[16px] font-semibold" style={{ color: C.ink }}>This link is not working</div>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: C.muted }}>
          It may have been withdrawn, or the link was cut short when it was sent. Ask the guide to send it again.
        </p>
      </div>
    </VerifyShell>
  );

  if (done) return (
    <VerifyShell>
      <div className="rounded-2xl p-5 mt-6 text-center" style={{ background: C.card, border: `1.5px solid ${done === "verified" ? C.pine : C.line}` }}>
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: done === "verified" ? C.pineSoft : C.bg }}>
          {done === "verified" ? <BadgeCheck size={26} color={C.pine} /> : <X size={26} color={C.muted} />}
        </div>
        <div className="text-[18px] font-semibold mt-3" style={{ color: C.ink }}>
          {done === "verified" ? "Thank you. It is verified." : "Thank you for your honesty."}
        </div>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: C.muted }}>
          {done === "verified"
            ? `This review is now live on ${row.guide_name}'s page, with your company name on it as the operator who confirmed it.`
            : "Nothing will be published. A review nobody can stand behind is worth less than no review at all."}
        </p>
      </div>

      {done === "verified" && (
        <div className="rounded-2xl p-5 mt-4" style={{ background: C.pineSoft }}>
          <div className="text-[15px] font-semibold" style={{ color: C.pine }}>You just did something only you could do</div>
          <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: C.pine, opacity: .92 }}>
            No app can confirm a trip you ran. That is why your word counts here. Tour operators on the hub search
            verified guides and drivers by language, skill and free days, keep every trip on one calendar, and
            hire without ringing round.
          </p>
          <a href="/" className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[15.5px] font-semibold mt-4"
            style={{ height: 52, background: C.pine, color: "#fff", textDecoration: "none" }}>
            See the hub <ArrowRight size={18} strokeWidth={2.4} />
          </a>
          <p className="text-center text-[12px] mt-2.5" style={{ color: C.pine, opacity: .75 }}>Free for licensed tour operators.</p>
        </div>
      )}
    </VerifyShell>
  );

  return (
    <VerifyShell>
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3" style={{ background: C.goldSoft }}>
        <Clock size={13} color={C.gold} />
        <span className="text-[11.5px] font-bold tracking-[.08em] uppercase" style={{ color: C.gold }}>Waiting for you</span>
      </div>

      <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>
        Did this trip happen?
      </h1>
      <p className="text-[14px] mt-2 leading-relaxed" style={{ color: C.muted }}>
        {row.guide_name} says {row.operator_name || "your company"} ran this trip, and wants to put this old guest
        review on their page. Only you can say if it is true.
      </p>

      <div className="rounded-2xl p-4 mt-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-semibold shrink-0"
            style={{ background: C.pineDeep, color: C.goldSoft }}>{row.guide_initials}</div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{row.guide_name}</div>
            <div className="text-[12.5px]" style={{ color: C.muted }}>
              {row.guide_role === "driver" ? "Driver" : "Guide"}{row.trip_label ? ` · ${row.trip_label}` : ""}{row.trip_year ? ` · ${row.trip_year}` : ""}
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3.5 mt-3.5" style={{ background: C.bg }}>
          <p className="text-[14.5px] leading-relaxed" style={{ color: C.ink }}>{row.body}</p>
          <div className="text-[12.5px] mt-2.5" style={{ color: C.muted }}>
            {row.guest_name || "Guest"}{row.guest_country ? ` · ${row.guest_country}` : ""}{row.trip_year ? ` · ${row.trip_year}` : ""}
          </div>
        </div>

        {row.photo_url && (
          <a href={row.photo_url} target="_blank" rel="noopener noreferrer"
            className="tap w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[13.5px] font-semibold mt-3"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, textDecoration: "none" }}>
            <Camera size={15} /> See the original note
          </a>
        )}
      </div>

      <div className="mt-5">
        <BLabel>Your name (optional)</BLabel>
        <input value={who} onChange={(e) => setWho(e.target.value)} maxLength={60} placeholder="Who is confirming this?"
          className="w-full h-12 px-3.5 rounded-xl text-[15px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
      </div>

      {err && <p className="text-[13px] mt-3" style={{ color: C.maroon }}>{err}</p>}

      <button onClick={() => decide("verified")} disabled={busy}
        className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16px] font-semibold mt-4"
        style={{ height: 54, background: C.pine, color: "#fff", boxShadow: `0 10px 24px ${C.pine}40` }}>
        <Check size={19} strokeWidth={2.6} /> {busy ? "Saving…" : "Yes, this is true"}
      </button>
      <button onClick={() => decide("declined")} disabled={busy}
        className="tap w-full rounded-2xl text-[15px] font-semibold mt-2.5"
        style={{ height: 50, background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>
        No, this is not right
      </button>

      <p className="text-[12.5px] mt-4 leading-snug text-center" style={{ color: C.muted }}>
        You do not need an account. Please say no if anything is wrong — that honesty is what keeps
        every review on the hub worth reading.
      </p>
    </VerifyShell>
  );
}

export default function App() {
  // One source of truth for which experience is showing, shared with the shell
  // so the container width and the layout can never disagree.
  const wideView = useIsDesktop();
  useAutoUpdate();
  // A guest arriving on a review link never signs in — they see only the review form.
  const reviewToken = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get("review"); }
    catch (e) { return null; }
  }, []);
  // A tour operator arriving on a verify link never signs in either.
  const verifyToken = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get("verify"); }
    catch (e) { return null; }
  }, []);
  // Someone invited onto a trip, who may not have an account yet.
  const inviteToken = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get("invite"); }
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

  // Stamp when this person was last about, so trip channels can show it.
  // On open and every 4 minutes: enough to be useful, far cheaper on 4G than
  // holding a socket open for every member of every trip.
  useEffect(() => {
    if (!CLOUD) return;
    let stop = false;
    const beat = async () => {
      try {
        const { data: { user: u } = {} } = await supabase.auth.getUser();
        if (!u || stop) return;
        await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", u.id);
      } catch (e) {}
    };
    beat();
    const iv = setInterval(beat, 240000);
    const onWake = () => { if (document.visibilityState === "visible") beat(); };
    document.addEventListener("visibilitychange", onWake);
    return () => { stop = true; clearInterval(iv); document.removeEventListener("visibilitychange", onWake); };
  }, []);
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
    else if (job.toTalentId) {
      // "End to end": the guide should not have to go looking for it.
      const fmt = (d) => { try { return new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return d; } };
      const when = job.start === job.end ? fmt(job.start) : `${fmt(job.start)} to ${fmt(job.end)}`;
      const lines = [
        `Job request: ${job.title}`,
        `Dates: ${when}`,
        job.languages && job.languages.length ? `Languages: ${job.languages.join(", ")}` : null,
        job.notes ? `Notes: ${job.notes}` : null,
        `Open your Trips tab to accept or decline.`,
      ].filter(Boolean);
      await sendDm(job.toTalentId, lines.join("\n"));
    }
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
      itinerary: (IT || []).filter((i) => i.trip_id === tr.id).map((i) => ({ day: i.day_no, title: i.title, detail: i.detail || null })),
      specialNotes: tr.special_notes || null,
      guestName: tr.guest_name || null,
      guestCountry: tr.guest_country || null,
      partySize: tr.party_size || null,
      allergies: tr.allergies || null,
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
    if (tmErr) {
      // The database refuses a crew member who is already on an overlapping trip.
      // Say so plainly instead of creating a trip that quietly has no crew.
      console.error("trip_members.upsert failed:", tmErr.message);
      const clash = String(tmErr.message || "").match(/DOUBLE_BOOKED:\s*(.*)$/);
      await supabase.from("trip_messages").insert({
        trip_id: tripId, sender_id: null, kind: "system",
        body: clash
          ? `${t?.name || "That person"} could NOT be added — ${clash[1]}. A guide or driver can only be on one trip at a time.`
          : `${t?.name || "That person"} could not be added to this trip.`,
      });
      fetchTrips();
      return;   // do not announce a join that did not happen
    }
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

  if (verifyToken) return <VerifyReview token={verifyToken} />;
  if (inviteToken && !session) return <TripInvitePage token={inviteToken} session={session} />;
  if (reviewToken) {
    return (
      <ErrorBoundary>
        <div className="w-full flex justify-center" style={{ background: C.bg, minHeight: "100dvh" }}>
          <div className="w-full max-w-[430px] flex flex-col" style={{ minHeight: "100dvh", background: C.bg }}>
            <GuestReview token={reviewToken} />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full flex justify-center" style={{ background: C.bg, minHeight: "100dvh" }}>
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
        /* Printing a trip: only the document goes on paper. */
        /* The shell must always be exactly one screen tall. vh first for older
           phones that do not know dvh, then dvh for those that do. Without the
           fallback the column has no height at all and the bottom bar floats. */
        .app-shell { height: 100vh; height: 100dvh; }
        /* Belt and braces: even if the flex chain is broken by a future change,
           the bar stays on the bottom edge of the screen. */
        .nav-pinned { position: sticky; position: -webkit-sticky; bottom: 0; }
        @supports not (height: 100dvh) {
          .app-shell { height: 100vh; }
        }
        @media print {
          .no-print { display: none !important; }
          .print-page { max-width: none !important; padding: 0 !important; }
          .print-row { break-inside: avoid; page-break-inside: avoid; }
          body { background: #fff !important; }
        }
        /* The app switches to the dashboard at 900px. Tailwind's lg: is 1024px,
           so content laid out with lg: would change 124px later than the chrome.
           These mirror it at the right width. */
        @media (min-width: 900px) {
          .w-grid2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
          .w-grid2 > * { margin-bottom:0 !important; }
          .w-read  { max-width:42rem; margin-left:auto; margin-right:auto; }
        }
        @media (min-width: 1280px) {
          .w-grid3 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
          .w-grid3 > * { margin-bottom:0 !important; }
        }
      `}</style>

      <div className="w-full flex flex-col app-shell" style={{ color: C.ink, maxWidth: wideView ? "none" : 448 }}>
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
/* --------------------------- Role welcome pitches ------------------------- */
const ROLE_PITCH = {
  guide: {
    label: "Guide", sub: "I take guests around Bhutan", Icon: Compass,
    eyebrow: "For guides",
    title: "Get more trips.",
    lede: "Today you wait for someone to call you. Here, operators search and find you. Your licence shows them you are a real guide.",
    cta: "Sign up as a guide",
    points: [
      { Icon: BadgeCheck, title: "We check your licence one time",
        body: "After that, every operator can see you are real. You do not send your licence again and again." },
      { Icon: Award, title: "Show what you are good at",
        body: "Culture, trekking, birds, temples. Your languages too. Your years are read from your licence number." },
      { Icon: Briefcase, title: "See jobs and apply",
        body: "Operators put trips here. You tap and apply. Even last minute work when someone drops out." },
      { Icon: CalendarDays, title: "Mark the days you are busy",
        body: "Tap a day to close it. Operators see only your free days, so they stop calling you on the wrong dates." },
      { Icon: PhoneCall, title: "Call or message anyone here",
        body: "One tap to call. One tap for WhatsApp. Or chat inside the app. No hunting for a number." },
      { Icon: Star, title: "Your good work is saved",
        body: "After each trip the operator scores you. That score stays with you for your whole career." },
      { Icon: MapPin, title: "Show where you have worked",
        body: "Put photos on the map at the exact place. Much better than a list of names." },
      { Icon: Lock, title: "Your papers stay private",
        body: "Your licence photo is locked away. Only you, our team and tour operators can open it. Other guides cannot." },
    ],
  },
  driver: {
    label: "Driver", sub: "I drive guests", Icon: Car,
    eyebrow: "For drivers",
    title: "Drive more. Earn more.",
    lede: "You do not need an agency behind you. Operators look for the car a trip needs, and they book the driver straight away.",
    cta: "Sign up as a driver",
    points: [
      { Icon: BadgeCheck, title: "We check your licence one time",
        body: "After that, an operator hiring you already knows you are real." },
      { Icon: Car, title: "Show your vehicle",
        body: "Sedan, SUV, Hiace, Coaster or large coach. They see it before they call, so nobody wastes a call." },
      { Icon: Briefcase, title: "See jobs and apply",
        body: "Airport pickups. Long trips to the east. Last minute work when another driver drops out." },
      { Icon: CalendarDays, title: "Mark the days you are busy",
        body: "Tap a day to close it. Operators see only your free days and book you on those." },
      { Icon: PhoneCall, title: "Call or message anyone here",
        body: "One tap to call. One tap for WhatsApp. Or chat inside the app." },
      { Icon: Star, title: "Your good work is saved",
        body: "After each trip the operator scores you on time keeping and care on the road." },
      { Icon: Lock, title: "Your papers stay private",
        body: "Your licence photo is locked away. Only you, our team and tour operators can open it." },
    ],
  },
  operator: {
    label: "Tour Operator", sub: "I book guides and drivers", Icon: Building2,
    eyebrow: "For tour operators",
    title: "Hire in minutes, not days.",
    lede: "No more calling ten people to find one free guide. Search, see who is free, and book them.",
    cta: "Sign up as an operator",
    points: [
      { Icon: Briefcase, title: "Every enquiry and trip in one place",
        body: "Keep a guest enquiry here while you are still pricing it. When they say yes it becomes a trip, and it stays on your record for the year." },
      { Icon: Lock, title: "Nobody can be double booked",
        body: "A guide or driver can never be on two trips that overlap. Anyone already busy cannot be picked, and it shows you why. Your crew turns up." },
      { Icon: MessageSquare, title: "A chat for each trip",
        body: "Every trip gets its own channel with the crew in it. No more hunting through WhatsApp for the group from last Tuesday." },
      { Icon: UserPlus, title: "Bring your own guides and drivers",
        body: "Invite the people you already work with. Once they join, you put them straight onto the trip." },
      { Icon: Search, title: "Search for the right person",
        body: "By language, skill, guide class, home town, and who is free. Not just who is saved in your phone." },
      { Icon: BadgeCheck, title: "Licences are already checked",
        body: "We check the class, the number and the date. Expired ones drop off on their own." },
      { Icon: ShieldCheck, title: "Everyone signs before the trip",
        body: "The crew sign the tour commitment. If someone does not turn up, it goes on their record." },
      { Icon: Star, title: "Guests review your crew",
        body: "The guide asks the guest on the last day. You confirm it before it appears, so your name stands behind it." },
    ],
  },
  business: {
    label: "Hotel or business", sub: "I have a hotel or shop", Icon: Store,
    eyebrow: "For hotels, shops and studios",
    title: "All your bookings in one place.",
    lede: "Right now your bookings sit in WhatsApp, on the phone and in a book. Here every operator books you in one place, and you say yes or no with one tap.",
    cta: "Sign up as a business",
    points: [
      { Icon: CalendarCheck, title: "Requests come to you",
        body: "You see who is asking, the dates, how many guests and what they need. Tap Confirm or Decline." },
      { Icon: CalendarDays, title: "One calendar, everyone sees it",
        body: "Free days, held days and full days. Operators look at the same calendar before they ask, so nobody asks for a day you are full." },
      { Icon: Lock, title: "Close the days you are full",
        body: "Tap a day to shut it. Tap it again to open it. Operators see the change straight away." },
      { Icon: Wallet, title: "Get paid without chasing",
        body: "Save your bank or MBoB number one time. The operator gets it the moment you say yes." },
      { Icon: Bell, title: "You never miss a request",
        body: "A number sits on your Bookings tab showing how many are waiting for an answer." },
      { Icon: Store, title: "Your own page",
        body: "Your photos, your rooms, what you sell. Tour operators look here when they plan where a group will stay." },
      { Icon: Newspaper, title: "Put news on the feed",
        body: "Offers, new rooms, things in season. Seen by the people who plan the trips." },
      { Icon: MessageSquare, title: "They can message you",
        body: "Tour operators message you here. The guide bringing the group can reach you too, if they are running late." },
    ],
  },
};
const ROLE_ORDER = ["guide", "driver", "operator", "business"];

function RolePitch({ role, onCreate, onSignin, onBack }) {
  const p = ROLE_PITCH[role];
  if (!p) return null;
  return (
    <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
      <div className="px-6 pt-5 flex items-center gap-3">
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Back">
          <ChevronLeft size={19} color={C.ink} />
        </button>
        <div className="text-[13px] font-semibold" style={{ color: C.muted }}>Bhutan Tourism Hub</div>
      </div>

      <div className="px-6 mt-5">
        <div className="inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5" style={{ background: C.pineSoft }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.pine }}>
            <p.Icon size={13} color={C.goldSoft} strokeWidth={2.1} />
          </div>
          <span className="text-[11px] font-bold tracking-[.1em] uppercase" style={{ color: C.pine }}>{p.eyebrow}</span>
        </div>

        <h1 className="text-[29px] leading-[1.14] font-semibold tracking-[-0.02em] mt-4" style={{ color: C.ink }}>{p.title}</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>{p.lede}</p>
      </div>

      <div className="px-6 mt-7">
        <div className="text-[11.5px] font-semibold tracking-[.14em] uppercase mb-3.5" style={{ color: C.gold }}>How this helps you</div>
        <div className="space-y-4">
          {p.points.map((b) => <WelcomeBullet key={b.title} Icon={b.Icon} title={b.title} body={b.body} />)}
        </div>
      </div>

      <div className="px-6 mt-7">
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}>
              <Clock size={17} color={C.gold} />
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: C.ink }}>We are letting people in slowly</div>
              <p className="text-[13px] leading-snug mt-1" style={{ color: C.muted }}>
                We send only <b style={{ color: C.ink }}>30 codes every hour</b>. If your code does not come,
                wait one hour and try again. Your place is safe.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        <button onClick={onCreate}
          className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16.5px] font-semibold"
          style={{ height: 56, background: C.pine, color: "#fff", boxShadow: `0 10px 24px ${C.pine}40` }}>
          {p.cta} <ArrowRight size={19} strokeWidth={2.4} />
        </button>
        <button onClick={onSignin}
          className="tap w-full rounded-2xl text-[15px] font-semibold mt-3"
          style={{ height: 52, background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}>
          I already have an account
        </button>
        <button onClick={onBack} className="tap w-full text-center text-[13px] font-semibold mt-4" style={{ color: C.muted }}>
          See the other roles
        </button>
        <p className="text-center text-[12.5px] mt-4" style={{ color: C.muted }}>
          Free for licensed guides, drivers and tour operators.
        </p>
      </div>

      <div className="px-6 mt-7 pb-16">
        <div className="rounded-2xl p-4" style={{ background: C.pineSoft }}>
          <div className="text-[13.5px] font-semibold mb-1.5" style={{ color: C.pine }}>Built in Bhutan, for Bhutan</div>
          <p className="text-[12.5px] leading-snug" style={{ color: C.pine, opacity: .9 }}>
            This app is new and it will grow with the people who use it. We are working with the Department
            of Tourism and the Guides Association so that a page here becomes proof of a licensed
            professional. Tell us what you need and we will build it.
          </p>
        </div>
        <p className="text-center text-[10px] mt-4" style={{ color: C.line }}>{BUILD}</p>
      </div>
    </div>
  );
}

/* Shown on the login page and in settings. Not a question anyone must answer:
   the app picks for itself, and this exists for when it picks wrong. */
function ViewSwitch({ compact }) {
  const [pref, setPref] = useState(() => readViewPref());
  const auto = useIsDesktop();
  const showing = pref === "auto" ? (auto ? "Website" : "Phone app") : (pref === "web" ? "Website" : "Phone app");
  const set = (v) => { writeViewPref(v); setPref(v); };

  return (
    <div className={compact ? "" : "mt-6"}>
      <div className="text-[11.5px] text-center mb-2" style={{ color: C.muted }}>
        Showing the <b style={{ color: C.ink }}>{showing}</b> view.
        {pref === "auto" ? " Chosen from your screen size." : " You set this."}
      </div>
      <div className="flex gap-1.5">
        {[["auto", "Automatic"], ["app", "Phone app"], ["web", "Website"]].map(([v, label]) => {
          const on = pref === v;
          return (
            <button key={v} onClick={() => set(v)}
              className="tap flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
              style={{ background: on ? C.pine : C.card, color: on ? "#fff" : C.ink, border: `1px solid ${on ? C.pine : C.line}` }}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Login({ session, onAuthed, onBusy }) {
  const [authView, setAuthView] = useState(null);
  const [pitchRole, setPitchRole] = useState(null);
  useEffect(() => { onBusy && onBusy(!!authView); return () => onBusy && onBusy(false); }, [authView]);
  if (authView) {
    return (
      <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
        <Onboard mode={authView} session={session} presetRole={authView === "signup" ? pitchRole : null}
          onBack={() => { setAuthView(null); onBusy && onBusy(false); }}
          onDone={() => { onBusy && onBusy(false); setAuthView(null); onAuthed(); }} />
      </div>
    );
  }
  if (pitchRole) {
    return <RolePitch role={pitchRole}
      onCreate={() => setAuthView("signup")}
      onSignin={() => setAuthView("signin")}
      onBack={() => setPitchRole(null)} />;
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
Guides, drivers and<br />operators. One app.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
          Find work. Hire good people. Stop asking around for a phone number.
          Tap what you do and we will show you how it helps.
        </p>
      </div>

      {/* map — its own block, whole image visible, fixed gap below */}
      <div className="px-6" style={{ marginTop: 28, marginBottom: 30 }}>
        <div className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: "16 / 9", background: C.card, border: `1px solid ${C.lineSoft}` }}>
          <img src={mapImg} alt="Relief map of Bhutan"
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
        </div>
      </div>

      {/* role branch — the first real decision */}
      <div className="px-6">
        <div className="text-[11.5px] font-semibold tracking-[.14em] uppercase mb-3" style={{ color: C.gold }}>
          Tap what you do
        </div>
        {ROLE_ORDER.map((id) => {
          const r = ROLE_PITCH[id];
          return (
            <button key={id} onClick={() => setPitchRole(id)}
              className="tap w-full text-left rounded-2xl p-3.5 mb-2.5 flex items-center gap-3.5"
              style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
                <r.Icon size={21} color={C.goldSoft} strokeWidth={1.9} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15.5px] font-semibold" style={{ color: C.ink }}>{r.label}</div>
                <div className="text-[12.5px] leading-snug" style={{ color: C.muted }}>{r.sub}</div>
              </div>
              <ArrowRight size={17} color={C.muted} className="shrink-0" />
            </button>
          );
        })}

        <button onClick={() => setAuthView("signin")}
          className="tap w-full rounded-2xl text-[15px] font-semibold mt-3"
          style={{ height: 52, background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}>
          I already have an account
        </button>

        <p className="text-center text-[12.5px] mt-4" style={{ color: C.muted }}>
          Free for licensed guides, drivers and tour operators.
        </p>
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
        <ViewSwitch />
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
  operator: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "trips", label: "Trips", Icon: Briefcase }, { id: "discover", label: "Find", Icon: Search }, { id: "hotels", label: "Hotels", Icon: Store }, { id: "action", label: "Action", Icon: Sparkles }, { id: "profile", label: "Profile", Icon: User }],
  business: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "bookings", label: "Bookings", Icon: CalendarDays }, { id: "discover", label: "Discover", Icon: Search }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  admin: [{ id: "review", label: "Review", Icon: ShieldCheck }, { id: "users", label: "Users", Icon: Users }, { id: "feed", label: "Feed", Icon: Newspaper }],
};
const DEFAULT_TAB = { guide: "post", driver: "post", operator: "post", business: "post", admin: "review" };

function Shell({ user, posts, jobs, trips, listings, actions, engagement, dm, dirTick, onLogout }) {
  const [tab, setTab] = useState(DEFAULT_TAB[user.kind]);
  // Which experience: the website, or the app. Defaults to the app, so a phone
  // and a first paint always get the layout that is known to work.
  const desktop = useIsDesktop();
  const [overlay, setOverlay] = useState(null); // {type:'profile'|'request', talentId}
  const [dmWith, setDmWith] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [bkRows] = useBookings("business_id", user.kind === "business" ? user.talentId : null);
  const pendingBookings = user.kind === "business" ? bkRows.filter((b) => b.status === "requested").length : 0;
  const lastAlertCount = useRef(0);
  const [notifyOn, setNotifyOn] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const [installSheet, setInstallSheet] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // Ask once the app has actually been used, never twice in a fortnight, never after they answer.
  useEffect(() => {
    let t;
    try {
      if (localStorage.getItem("bth_feedback_sent")) return;
      const seen = Number(localStorage.getItem("bth_feedback_asked") || 0);
      if (Date.now() - seen < 14 * 86400000) return;
      const opens = Number(localStorage.getItem("bth_opens") || 0) + 1;
      localStorage.setItem("bth_opens", String(opens));
      if (opens < 3) return;
      t = setTimeout(() => setFeedbackOpen(true), 90000);
    } catch (e) {}
    return () => clearTimeout(t);
  }, []);
  const [firstRun, setFirstRun] = useState(() => {
    try { return CLOUD && !localStorage.getItem("bth_seen_intro_" + (user.talentId || user.id)); } catch (e) { return false; }
  });
  // "Show me around again" from settings, wherever in the tree it is tapped
  useEffect(() => {
    const replay = () => setFirstRun(true);
    window.addEventListener("bth-replay-tour", replay);
    return () => window.removeEventListener("bth-replay-tour", replay);
  }, []);
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

  const nav = useMemo(() => {
    const base = NAV[user.kind] || [];
    if (desktop && user.kind === "operator") {
      return [...base.slice(0, 2),
        { id: "itinerary", label: "Itinerary", Icon: Compass },
        { id: "reports", label: "Reports", Icon: BarChart3 },
        ...base.slice(2)];
    }
    return base;
  }, [user.kind, desktop]);

  // Itinerary exists only on the desktop dashboard. If someone is on it and the
  // window narrows to the phone layout, that tab vanishes from the bar and they
  // would be stranded on a page with no way back. Send them to Trips instead.
  useEffect(() => {
    if (!nav.some((n) => n.id === tab)) setTab(DEFAULT_TAB[user.kind] || nav[0]?.id || "post");
  }, [nav, tab, user.kind]);
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
      {!desktop && (
        <>
          <PortalBar user={user} />
          <TopBar onLogout={onLogout} alerts={alertItems.length} onOpenAlerts={() => setAlertsOpen(true)}
            onSearch={(term) => { setOverlay(null); setTab(["operator", "business"].includes(user.kind) ? "discover" : "post"); setSearchTerm(term); }} />
        </>
      )}

      <div className="flex-1 flex min-h-0">
        {desktop && (
          <WebSideNav user={user} nav={nav} tab={tab}
            setTab={(t) => { setOverlay(null); setSharedPost(null); setTab(t); }}
            badges={{ jobs: jobsBadge, review: pendingModCount, chats: unreadDm, bookings: pendingBookings }}
            onLogout={onLogout} />
        )}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {desktop && (
            <WebTopBar tab={tab} nav={nav} alerts={alertItems.length}
              onOpenAlerts={() => setAlertsOpen(true)}
              onSearch={(term) => { setOverlay(null); setTab(["operator", "business"].includes(user.kind) ? "discover" : "post"); setSearchTerm(term); }} />
          )}

      <div className="flex-1 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        <div className={desktop ? "w-full px-6 py-3" : "w-full"}>
        <VerifyBanner user={user} />
        {overlay ? (
          overlay.type === "profile" ? (
            <TalentProfile talent={talentById(overlay.talentId)} posts={posts} trips={trips} eng={eng}
              onOpenProfile={openProfile}
              onMessage={(id) => { setOverlay(null); setTab("chats"); setDmWith(id); }}
              onProfileSaved={actions.reloadDirectory}
              canRequest={user.kind === "operator" && ["guide", "driver"].includes(talentById(overlay.talentId)?.role)} viewer={user} self={user.talentId === overlay.talentId} contactOnly={["operator", "admin"].includes(user.kind)}
              onRequest={(start, end) => setOverlay({ type: "request", talentId: overlay.talentId, start, end })}
              onBack={() => setOverlay(null)} />
          ) : (
            <RequestForm talent={talentById(overlay.talentId)} operator={user.name}
              presetStart={overlay.start} presetEnd={overlay.end}
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
            {tab === "chats" && <ChatsTab user={user} me={actorId} dm={dm} trips={trips} posts={posts} dirTick={dirTick} onOpenPost={setSharedPost} openWith={dmWith} onOpened={() => setDmWith(null)} onOpenProfile={openProfile} />}
            {tab === "profile" && (user.kind === "operator"
              ? <OperatorDesk user={user} trips={trips} listings={listings} jobs={jobs} actions={actions} onOpenProfile={openProfile} onNavigate={setTab} />
              : <TalentProfile talent={talentById(user.talentId)} posts={posts} trips={trips} eng={eng} self onSetAvailability={actions.setAvailability} onOpenProfile={openProfile} onProfileSaved={actions.reloadDirectory} onBack={null} />)}
            {tab === "discover" && <Discover onOpen={openProfile} initialQuery={searchTerm} dirTick={dirTick} viewerKind={user.kind} />}
            {tab === "reports" && <ReportsTab user={user} />}

            {tab === "itinerary" && (
              <div className="px-5 py-5">
                <h1 className="text-[22px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>Itinerary builder</h1>
                <p className="text-[13px] mt-1 mb-5 leading-snug" style={{ color: C.muted }}>
                  Druk Pah drafts a route from your own engine, then you make it yours. Nothing is sent anywhere:
                  it runs on this device, with or without a signal.
                </p>
                <button onClick={() => setBuildOpen(true)}
                  className="tap w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-[15.5px] font-semibold"
                  style={{ background: C.pine, color: "#fff" }}>
                  <Compass size={19} /> Start a new itinerary
                </button>
                <p className="text-[12px] mt-3 leading-snug" style={{ color: C.muted }}>
                  To save days onto a trip, open that trip and use <b>Itinerary</b> there. Drafting here is for
                  trying shapes out and building up your own touches.
                </p>
                {buildOpen && <ItineraryBuilder user={user} trip={null} onClose={() => setBuildOpen(false)} />}
              </div>
            )}

            {tab === "action" && <ActionTab user={user} unread={unreadDm} onOpenMessages={() => setTab("chats")}
              onOpenTrip={(id) => { PENDING_TRIP_ID = id; setTab("trips"); }} onGoTab={(t) => setTab(t)} />}
            {tab === "hotels" && <HotelsTab user={user} onOpenProfile={openProfile} />}
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

      {/* Floating smart search. Feed only, operator only. */}
      {tab === "post" && user.kind === "operator" && !smartOpen && !overlay && !alertsOpen && !installSheet && !feedbackOpen && (
        <div className="fixed left-0 right-0 flex justify-center px-5"
          style={{ bottom: "calc(74px + env(safe-area-inset-bottom, 0px))", zIndex: 241, pointerEvents: "none" }}>
          <button onClick={() => setSmartOpen(true)}
            className="tap w-full max-w-md rounded-full pl-4 pr-2 py-2 flex items-center gap-2.5"
            style={{ background: C.pine, color: "#fff", boxShadow: "0 10px 30px rgba(8,10,8,.28)", pointerEvents: "auto" }}>
            <Sparkles size={18} color={C.goldSoft} className="shrink-0" />
            <span className="flex-1 text-left leading-tight">
              <span className="block text-[14.5px] font-semibold" style={{ color: "#fff" }}>Find your guide</span>
              <span className="block text-[11px]" style={{ color: "rgba(255,255,255,.72)" }}>
                Smart search · guides, drivers, hotels
              </span>
            </span>
            <span className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold shrink-0"
              style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>Search</span>
          </button>
        </div>
      )}
      {smartOpen && <SmartSearchSheet onClose={() => setSmartOpen(false)} onOpenProfile={openProfile} />}

      {feedbackOpen && (
        <FeedbackSheet user={user}
          onClose={() => { setFeedbackOpen(false); try { localStorage.setItem("bth_feedback_asked", String(Date.now())); } catch (e) {} }} />
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

      {!desktop && (
        <BottomNav nav={nav} tab={tab}
          setTab={(t) => { setOverlay(null); setSharedPost(null); setTab(t); }}
          badges={{ jobs: jobsBadge, review: pendingModCount, chats: unreadDm, bookings: pendingBookings }} />
      )}
        </div>
        </div>
      </div>
    </>
  );
}

/* ============ The website: a dashboard. Desktop only. ============
   Navigation down the left where a desktop user's eye and mouse already are,
   work on the right. The phone keeps PortalBar + TopBar + BottomNav, untouched. */
function WebSideNav({ user, nav, tab, setTab, badges, onLogout }) {
  const names = { guide: "Guide Portal", driver: "Driver Portal", operator: "Operator Portal", business: "Business Portal", admin: "Admin Portal" };
  return (
    <div className="shrink-0 flex flex-col" style={{ width: 236, background: C.card, borderRight: `1px solid ${C.line}` }}>
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
          <Compass size={19} color={C.goldSoft} strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold leading-tight truncate" style={{ color: C.ink }}>Bhutan</div>
          <div className="text-[14px] font-semibold leading-tight truncate" style={{ color: C.ink }}>Tourism Hub</div>
        </div>
      </div>

      <div className="flex-1 px-3 pt-3 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        {nav.map((n) => {
          const on = tab === n.id;
          const badge = badges[n.id] || 0;
          return (
            <button key={n.id} onClick={() => setTab(n.id)}
              className="tap w-full rounded-xl px-3 py-2.5 mb-1 flex items-center gap-3"
              style={{ background: on ? C.pineSoft : "transparent" }}>
              <n.Icon size={19} color={on ? C.pine : C.muted} strokeWidth={on ? 2.3 : 2} />
              <span className="flex-1 text-left text-[14px] font-semibold" style={{ color: on ? C.pine : C.ink }}>{n.label}</span>
              {badge > 0 && (
                <span className="min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center text-[10.5px] font-bold text-white"
                  style={{ background: C.maroon }}>{badge > 9 ? "9+" : badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3.5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
        <div className="text-[10px] font-bold tracking-[.14em] uppercase mb-1" style={{ color: C.gold }}>
          {names[user.kind] || "Portal"}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0"
            style={{ background: C.pineDeep, color: C.goldSoft }}>{initialsOf(user.name || "?")}</div>
          <div className="flex-1 min-w-0 text-[12.5px] font-medium truncate" style={{ color: C.ink }}>{user.name}</div>
          <button onClick={onLogout} className="tap shrink-0" aria-label="Sign out">
            <LogOut size={15} color={C.muted} />
          </button>
        </div>
        <div className="text-[10px] mt-2.5" style={{ color: C.line }}>{BUILD}</div>
      </div>
    </div>
  );
}

function WebTopBar({ tab, nav, alerts, onOpenAlerts, onSearch }) {
  const [q, setQ] = useState("");
  const submit = () => { const t = q.trim(); if (t && onSearch) onSearch(t); };
  const here = (nav.find((n) => n.id === tab) || {}).label || "";
  return (
    <div className="shrink-0 flex items-center gap-3 px-6"
      style={{ height: 60, background: C.bg, borderBottom: `1px solid ${C.lineSoft}` }}>
      <div className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>{here}</div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 h-10 px-3.5 rounded-full" style={{ background: C.card, border: `1px solid ${C.line}`, width: 260 }}>
        <Search size={15} color={C.muted} />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Search people"
          className="flex-1 bg-transparent outline-none text-[13.5px]" style={{ color: C.ink }} />
      </div>
      <button onClick={onOpenAlerts} className="tap w-10 h-10 rounded-full flex items-center justify-center relative shrink-0"
        style={{ background: C.card, border: `1px solid ${C.line}` }} aria-label="Alerts">
        <Bell size={17} color={C.ink} />
        {alerts > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: C.maroon }}>{alerts > 9 ? "9+" : alerts}</span>
        )}
      </button>
    </div>
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

function TopBar({ onLogout, onSearch, alerts, onOpenAlerts }) {
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

/* Is there room for two panes? Defaults to false so the very first paint is the
   phone layout: if anything goes wrong we fail to the layout that always works.
   Matches Tailwind's lg breakpoint exactly, so JS and CSS can never disagree. */
/* Set by the dashboard just before switching to Trips, read once by TripsTab
   when it mounts, then cleared. A baton, not shared state. */
let PENDING_TRIP_ID = null;

/* 900px, not 1024px. Chrome's "Desktop site" on a phone reports a 980px
   viewport: at a 1024px threshold that fell on the phone side, so the app kept
   its 448px column and the browser shrank the lot into a narrow strip. */
const WEB_MIN_WIDTH = 900;
const VIEW_PREF_KEY = "bth_view_pref";      // "auto" | "app" | "web"

function readViewPref() {
  try { return localStorage.getItem(VIEW_PREF_KEY) || "auto"; } catch (e) { return "auto"; }
}
function writeViewPref(v) {
  try { localStorage.setItem(VIEW_PREF_KEY, v); } catch (e) {}
  try { window.dispatchEvent(new Event("bth-view-pref")); } catch (e) {}
}

function useIsDesktop() {
  const [wide, setWide] = useState(false);
  const [pref, setPref] = useState("auto");

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(min-width: ${WEB_MIN_WIDTH}px)`);
    const apply = () => setWide(mq.matches);
    apply();
    setPref(readViewPref());
    const onPref = () => setPref(readViewPref());
    window.addEventListener("bth-view-pref", onPref);
    if (mq.addEventListener) {
      mq.addEventListener("change", apply);
      return () => { mq.removeEventListener("change", apply); window.removeEventListener("bth-view-pref", onPref); };
    }
    mq.addListener(apply);
    return () => { mq.removeListener(apply); window.removeEventListener("bth-view-pref", onPref); };
  }, []);

  // An explicit choice always wins over the guess.
  if (pref === "app") return false;
  if (pref === "web") return true;
  return wide;
}

function BottomNav({ nav, tab, setTab, badges }) {
  return (
    <div className="shrink-0 flex safe-bottom nav-pinned" style={{ background: C.card, borderTop: `1px solid ${C.line}`, zIndex: 240 }}>
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
function Avatar({ initials, url, size = 40, ring = null, ringDashed = false }) {
  // `url` is optional, so all 23 existing callers keep working untouched:
  // a photo when one has been set, initials when it has not, initials again if
  // the image fails so a broken picture never appears.
  const [failed, setFailed] = useState(false);
  const ringStyle = !ring ? {} : ringDashed
    ? { outline: `2.5px dashed ${ring}`, outlineOffset: 1.5 }
    : { boxShadow: `0 0 0 2.5px ${ring}` };
  if (url && !failed) {
    return (
      <div className="rounded-xl overflow-hidden shrink-0" style={{ width: size, height: size, background: C.lineSoft, ...ringStyle }}>
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
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
        <div className="space-y-3.5 w-read">
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
          : [["guide", `Guides (${counts.guide})`], ["driver", `Drivers (${counts.driver})`]]} />

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
        {bizViewer && tab === "operator" ? "These operators bring the tours. Open one and message them to pitch your rooms and offers." : isBiz ? "Hotels, farmstays, boutiques and local businesses — tap one to see its live availability calendar." : "Tap a person to see their full profile, reviews and availability."}
      </p>

      {list.length === 0 ? (
        <Empty Icon={Search} title="No matches" body={isBiz ? "Try another place type, or clear the filters." : "Try a different language or clear the filters."} />
      ) : (
        <div className="space-y-3 w-grid2 w-grid3">{list.map((t) => <TalentCard key={t.id} t={t} onOpen={() => onOpen(t.id)} />)}</div>
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
        <div className="space-y-3.5 w-read">
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
/* ---- Open days: what an operator sees before asking someone for dates ---- */
function OpenDaysStrip({ profileId, self }) {
  const [blocked, setBlocked] = useState(null);
  const DAYS = 21;
  useEffect(() => {
    let dead = false;
    (async () => {
      const from = new Date(); from.setHours(0, 0, 0, 0);
      const to = new Date(from); to.setDate(to.getDate() + DAYS);
      const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const { data } = await supabase.from("blocked_days").select("day")
        .eq("profile_id", profileId).gte("day", isoOf(from)).lte("day", isoOf(to));
      if (!dead) setBlocked(new Set((data || []).map((r) => r.day)));
    })();
    return () => { dead = true; };
  }, [profileId]);

  if (!blocked) return null;
  const out = [];
  const cur = new Date(); cur.setHours(0, 0, 0, 0);
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(cur); d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ iso, d, off: blocked.has(iso) });
  }
  const freeCount = out.filter((x) => !x.off).length;

  return (
    <div className="mt-6">
      <SectionLabel trailing={`${freeCount} of ${DAYS} free`}>Free days</SectionLabel>
      <div className="flex gap-1.5 overflow-x-auto hidescroll pb-1" style={{ scrollbarWidth: "none" }}>
        {out.map(({ iso, d, off }) => (
          <div key={iso} className="rounded-xl flex flex-col items-center justify-center shrink-0"
            style={{ width: 42, height: 52, background: off ? C.maroonSoft : C.pineSoft,
                     border: `1px solid ${off ? "rgba(122,46,46,.25)" : "rgba(33,64,47,.18)"}` }}>
            <span className="text-[9.5px] font-semibold uppercase tracking-[.04em]" style={{ color: off ? C.maroon : C.pine, opacity: .75 }}>
              {d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2)}
            </span>
            <span className="text-[14px] font-semibold leading-tight" style={{ color: off ? C.maroon : C.pine,
              textDecoration: off ? "line-through" : "none" }}>{d.getDate()}</span>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] mt-2 leading-snug" style={{ color: C.muted }}>
        {self
          ? "Crossed days are the days you said you are busy. Operators see this before they call you. Keep it correct and the right jobs will come."
          : "They marked these days themselves. Crossed days are busy."}
      </p>
    </div>
  );
}

function TalentProfile({ talent, posts, trips = [], canRequest, viewer, self, contactOnly, eng, onRequest, onMessage, onSetAvailability, onOpenProfile, onProfileSaved, onBack }) {
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
  const photoRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState(null);
  const [shareToStory, setShareToStory] = useState(null);
  const [listMode, setListMode] = useState(null);
  const [credsOpen, setCredsOpen] = useState(false);
  const licSectionRef = useRef(null);
  const [portfolioJump, setPortfolioJump] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
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
              <div className="rounded-2xl overflow-hidden flex items-center justify-center" style={{ width: 72, height: 72, background: C.pine, border: `3px solid ${C.bg}`,
                boxShadow: myStories.length ? `0 0 0 3px ${C.gold}` : gcp ? `0 0 0 3px ${gcp.color}` : "none" }}>
                {t.photoUrl
                  ? <img src={t.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span className="text-[23px] font-semibold" style={{ color: C.goldSoft }}>{t.initials}</span>}
              </div>
              {myStories.length > 0 && (
                <span className="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: C.gold, color: "#fff" }}>{myStories.length}</span>
              )}
            </button>
            {self && (
              <input ref={photoRef} type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  e.target.value = "";
                  if (!file) return;
                  setPhotoBusy(true); setPhotoErr(null);
                  try {
                    const dataUri = await new Promise((res, rej) => {
                      const r = new FileReader();
                      r.onload = () => res(r.result);
                      r.onerror = () => rej(new Error("read"));
                      r.readAsDataURL(file);
                    });
                    const small = await shrinkImage(dataUri, 640, 0.85);
                    const blob = dataUriToBlob(small);
                    const path = `avatar/${t.id}/${Date.now()}.jpg`;
                    const { error: upErr } = await supabase.storage.from("post-media")
                      .upload(path, blob, { contentType: "image/jpeg" });
                    if (upErr) throw upErr;
                    const url = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
                    const { error: dbErr } = await supabase.from("profiles").update({ photo_url: url }).eq("id", t.id);
                    if (dbErr) throw dbErr;
                    onProfileSaved && onProfileSaved();
                  } catch (err) {
                    setPhotoErr("That photo did not upload. Try a smaller one, or check your connection.");
                  }
                  setPhotoBusy(false);
                }} />
            )}
            {self && (
              <button onClick={() => photoRef.current?.click()} disabled={photoBusy}
                className="tap mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                style={{ background: C.pineSoft, color: C.pine }}>
                <Camera size={13} strokeWidth={2.4} /> {photoBusy ? "Uploading…" : t.photoUrl ? "Change photo" : "Add photo"}
              </button>
            )}
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
                {photoErr && <div className="text-[12px] mt-0.5" style={{ color: C.maroon }}>{photoErr}</div>}
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
          <button onClick={() => {
              setPortfolioJump((k) => k + 1);
              setTimeout(() => licSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 160);
            }}
            className="tap w-full text-left rounded-2xl p-4 mt-5" style={{ background: C.goldSoft, border: `1.5px solid ${C.gold}` }}>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} color={C.gold} />
              <span className="flex-1 text-[14px] font-semibold" style={{ color: "#7a5a1e" }}>Your experience shows 0 years</span>
              <ChevronLeft size={16} color="#7a5a1e" style={{ transform: "rotate(180deg)" }} />
            </div>
            <p className="text-[12.5px] mt-1.5 leading-snug" style={{ color: "#7a5a1e" }}>
              Experience is read straight from your Department of Tourism licence number — no separate document needed.
              <b> Tap here</b> to jump to My licence and add it now.
            </p>
          </button>
        )}
        {self && !["operator", "business"].includes(t.role) && <TalentAvailability talent={t} onSet={onSetAvailability} />}

        <ProfileTabs jumpToCv={portfolioJump}
          sections={["guide", "driver"].includes(t.role) ? [
            { label: "Reviews", Icon: Star, node: (
              <>
                <GuestReviews talentId={t.id} isAdmin={eng?.isAdmin} isSelf={self} />
                <ReviewLinks t={t} />
                <LegacyVerified talentId={t.id} isAdmin={eng?.isAdmin} />
              </>
            ) },
            { label: t.role === "guide" ? "Skills" : "Drives", Icon: Award, node: (
              <>
                {t.pitch && <div className="pl-4" style={{ borderLeft: `3px solid ${C.gold}` }}><p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{t.pitch}</p></div>}
                {t.tags && t.tags.length > 0 && (
                  <div className="mt-6"><SectionLabel>{t.role === "guide" ? "Specialities" : "Drives"}</SectionLabel>
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
                  <div className="mt-6"><SectionLabel trailing={`${located.length} pins`}>Where they have worked</SectionLabel>
                    <BhutanMap readOnly pins={located.map((p) => p.location)} />
                  </div>
                )}
              </>
            ) },
            { label: "Free days", Icon: CalendarDays, node: (
              <>
                <OpenDaysStrip profileId={t.id} self={self} />
                {!self && ["operator", "admin"].includes(viewer?.kind) && <TalentAvailability talent={t} viewerOnly onRequestDates={canRequest && onRequest ? (a, b) => onRequest(a, b) : undefined} />}
              </>
            ) },
            { label: "Record", Icon: ShieldCheck, holdsLicence: true, node: (
              <>
                <CharacterChart talentId={t.id} />
                {(self || ["operator", "admin"].includes(viewer?.kind)) && (
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
                {self && t.role === "guide" && <div ref={licSectionRef}><GuideLicenseCard talent={t} onSaved={onProfileSaved} /></div>}
              </>
            ) },
          ] : null}
          cv={
            <>
              {t.role === "business" && <StayPhotos profileId={t.id} canEdit={self} />}
              {t.role === "business" && <StayRates talent={t} canEdit={self} onSaved={onProfileSaved} />}
              {t.role === "business" && <BusinessAvailability business={t} viewer={viewer} trips={trips} />}

              {t.pitch && <div className="mt-5 pl-4" style={{ borderLeft: `3px solid ${C.gold}` }}><p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{t.pitch}</p></div>}

              {t.tags && t.tags.length > 0 && (
                <div className="mt-6"><SectionLabel>{t.role === "business" ? "What we offer" : "Drives"}</SectionLabel>
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
function RequestForm({ talent, operator, presetStart, presetEnd, onBack, onSend }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(presetStart || "");
  const [end, setEnd] = useState(presetEnd || "");
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
/* A crew chat opens 3 days before the trip starts and closes 3 days after it ends.
   Outside that window there is nothing to say, and an open channel just goes stale. */
const TRIP_WINDOW_DAYS = 3;
function tripStateNow(trip) {
  const DAY = 86400000;
  const startsAt = new Date(trip.start + "T00:00").getTime();
  const endsAt = new Date(trip.end + "T23:59").getTime();
  const now = Date.now();
  if (now < startsAt - TRIP_WINDOW_DAYS * DAY) return "scheduled";
  if (now > endsAt + TRIP_WINDOW_DAYS * DAY) return "completed";
  if (now > endsAt) return "wrapping";
  return "active";
}
function tripDaysLeft(trip) {
  const DAY = 86400000;
  const shuts = new Date(trip.end + "T23:59").getTime() + TRIP_WINDOW_DAYS * DAY;
  return Math.max(0, Math.ceil((shuts - Date.now()) / DAY));
}
function TripStateBadge({ state }) {
  const m = {
    scheduled: { bg: C.goldSoft, fg: "#7a5a1e", label: "Opens soon" },
    active: { bg: C.pineSoft, fg: C.pine, label: "Live" },
    wrapping: { bg: C.goldSoft, fg: "#7a5a1e", label: "Closing soon" },
    completed: { bg: C.bg, fg: C.muted, label: "Completed" },
  }[state] || { bg: C.bg, fg: C.muted, label: "Completed" };
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

/* ---- Operator dashboard. Desktop only: everything waiting on you, in one
        place, with the button to deal with it right there. The phone keeps the
        simpler stacked view, which is right for a small screen. ---- */
function DashCount({ n, label }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="text-[24px] font-semibold leading-none" style={{ color: C.ink }}>{n}</div>
      <div className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>{label}</div>
    </div>
  );
}

function DashItem({ tone = "gold", title, sub, action, onAction }) {
  const maroon = tone === "maroon";
  return (
    <div className="rounded-xl px-3.5 py-2.5 mb-2 flex items-center gap-3"
      style={{ background: maroon ? C.maroonSoft : C.goldSoft }}>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate" style={{ color: maroon ? C.maroon : "#7a5a1e" }}>{title}</div>
        {sub && <div className="text-[11.5px] truncate" style={{ color: maroon ? C.maroon : "#7a5a1e", opacity: .85 }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} className="tap text-[12px] font-semibold rounded-full px-3 py-1.5 shrink-0"
          style={{ background: maroon ? C.maroon : C.pine, color: "#fff" }}>{action}</button>
      )}
    </div>
  );
}

function DashSection({ icon: Ic, title, count, children }) {
  if (!count) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Ic size={15} color={C.gold} />
        <span className="text-[11.5px] font-semibold tracking-[.12em] uppercase" style={{ color: C.gold }}>{title}</span>
        <span className="text-[11px] font-bold rounded-full px-2 py-0.5" style={{ background: C.gold, color: "#fff" }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

function OperatorDashboard({ user, onOpenTrip, onGoTab }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    const { data, error } = await supabase.rpc("operator_dashboard");
    if (error) { setErr("Could not load your dashboard."); setD({}); return; }
    setD(data || {});
  };
  useEffect(() => { if (CLOUD) load(); else setD({}); }, []);

  if (d === null) return <p className="text-[13px] px-5 py-4" style={{ color: C.muted }}>Loading2026</p>;

  const quotes = d.quotes || [], unsigned = d.unsigned || [], reviews = d.reviews || [];
  const tograde = d.tograde || [], stale = d.stale || [], counts = d.counts || {};
  const waiting = quotes.length + unsigned.length + reviews.length + tograde.length + stale.length;
  const fmtd = (x) => { try { return new Date(x + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch (e) { return x; } };

  return (
    <div className="px-5 py-5">
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>
        {(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })()}, {String(user.name || "").split(" ")[0]}
      </h1>
      <p className="text-[13px] mt-1" style={{ color: C.muted }}>
        {waiting === 0
          ? "Nothing is waiting on you. Everything is up to date."
          : `${waiting} thing${waiting === 1 ? "" : "s"} waiting on you.`}
      </p>

      <div className="grid grid-cols-4 gap-2.5 mt-4 mb-6">
        <DashCount n={counts.live ?? 0} label="running now" />
        <DashCount n={counts.upcoming ?? 0} label="upcoming" />
        <DashCount n={counts.enquiries ?? 0} label="open enquiries" />
        <DashCount n={counts.crew ?? 0} label="crew worked with" />
      </div>

      {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}

      {waiting === 0 && !err && (
        <div className="rounded-2xl px-5 py-8 text-center" style={{ background: C.pineSoft }}>
          <Check size={26} color={C.pine} className="mx-auto" />
          <div className="text-[15px] font-semibold mt-2" style={{ color: C.pine }}>All clear</div>
          <p className="text-[12.5px] mt-1" style={{ color: C.pine, opacity: .85 }}>
            No prices to answer, no crew unsigned, no reviews or grades outstanding.
          </p>
        </div>
      )}

      <DashSection icon={Wallet} title="Prices to answer" count={quotes.length}>
        {quotes.map((q) => (
          <DashItem key={q.id} title={`${q.hotel} — Nu ${Number(q.amount || 0).toLocaleString("en-IN")}`}
            sub={`${fmtd(q.start)} to ${fmtd(q.end)}`}
            action="Open Hotels" onAction={() => onGoTab("hotels")} />
        ))}
      </DashSection>

      <DashSection icon={ShieldCheck} title="Crew who have not signed" count={unsigned.length}>
        {unsigned.map((u, i) => (
          <DashItem key={`${u.trip_id}${i}`} title={`${u.name} — ${u.trip}`}
            sub={`starts ${fmtd(u.start)}`}
            action="Open trip" onAction={() => onOpenTrip(u.trip_id)} />
        ))}
      </DashSection>

      <DashSection icon={Star} title="Reviews to confirm" count={reviews.length}>
        {reviews.map((r) => (
          <DashItem key={r.id} title={`${"2605".repeat(r.rating || 0)} for ${r.who || "your crew"}`}
            sub={`${r.guest || "Guest"} · ${r.trip}`}
            action="Confirm" onAction={() => onOpenTrip(r.trip_id)} />
        ))}
      </DashSection>

      <DashSection icon={Users} title="Crew to grade" count={tograde.length}>
        {tograde.map((t) => (
          <DashItem key={t.trip_id} title={t.trip}
            sub={`ended ${fmtd(t.ended)} · ${t.left} still to grade`}
            action="Grade" onAction={() => onOpenTrip(t.trip_id)} />
        ))}
      </DashSection>

      <DashSection icon={Clock} title="Enquiries gone quiet" count={stale.length}>
        {stale.map((e) => (
          <DashItem key={e.id} tone="maroon" title={e.guest}
            sub={`nothing since ${fmtd(e.since)}`}
            action="Open" onAction={() => onGoTab("action")} />
        ))}
      </DashSection>
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

  // ---- past-review verifications awaiting this operator ----
  const [toVerify, setToVerify] = useState([]);
  const loadToVerify = async () => {
    const { data } = await supabase.from("legacy_reviews").select("*")
      .eq("operator_id", me).eq("status", "pending").order("created_at");
    setToVerify(data || []);
  };
  useEffect(() => { loadToVerify(); }, [me]);
  const decideVerify = async (r, status) => {
    await supabase.from("legacy_reviews").update({ status, decided_at: new Date().toISOString() }).eq("id", r.id);
    await supabase.from("system_nudges").insert({
      profile_id: r.profile_id, kind: "verify-done", ref: r.id,
      title: status === "verified" ? "Your past review was verified ✓" : "A past review was declined",
      body: `“${r.trip_label}” — ${status === "verified" ? `${t.name} verified it. It now shows on your Portfolio.` : `${t.name} could not confirm this one.`}`,
    });
    loadToVerify();
  };
  const viewVerifyNote = async (r) => {
    if (!r.photo_path) return;
    const { data } = await supabase.storage.from("certs").createSignedUrl(r.photo_path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

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
          <div className="text-[11.5px]" style={{ color: C.muted }}>{x.start ? fD(x.start) : ""}{x.end && x.end !== x.start ? ` – ${fD(x.end)}` : ""}</div>
        </div>
        {revs.length > 0 ? (
          <span className="text-[12px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: C.pineSoft, color: C.pine }}>
            ★ {avg} · {revs.length}
          </span>
        ) : openTok ? (
          <button onClick={resend} className="tap text-[12px] font-semibold rounded-full px-3 py-1.5 shrink-0" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
            Awaiting · resend
          </button>
        ) : (
          <span className="text-[11.5px] shrink-0 text-right" style={{ color: C.muted, maxWidth: 150 }}>
            The crew asks the guest on the last day
          </span>
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
          <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>Tour operator{t.base ? ` · ${t.base}` : ""}</div>
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
                {openL.length} role{openL.length > 1 ? "s" : ""} still hiring{pendApps > 0 ? ` · ${pendApps} new applicant${pendApps > 1 ? "s" : ""}` : ""}
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
                “{q.body.length > 90 ? q.body.slice(0, 90) + "…" : q.body}” — {q.guest_name || "Guest"}
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

      {/* verifications */}
      {toVerify.length > 0 && (
        <>
          <div className="mt-6"><SectionLabel trailing={`${toVerify.length}`}>Reviews waiting for you to verify</SectionLabel></div>
          <p className="text-[11.5px] mb-2 leading-snug" style={{ color: C.muted }}>
            Say yes only to what you remember yourself — your name goes on it, visible to every operator and guest.
          </p>
          <div className="space-y-2.5">
            {toVerify.map((r) => {
              const g = talentById(r.profile_id);
              return (
                <div key={r.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
                  <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {g ? g.name : "Guide"} · {r.trip_label}{r.trip_year ? ` (${r.trip_year})` : ""}
                  </div>
                  <p className="text-[13px] mt-1.5 leading-snug" style={{ color: C.ink }}>“{r.body}”</p>
                  <div className="text-[11.5px] mt-1" style={{ color: C.muted }}>
                    {r.guest_name || "Guest"}{r.guest_country ? ` · ${r.guest_country}` : ""}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {r.photo_path && (
                      <button onClick={() => viewVerifyNote(r)} className="tap text-[12px] font-semibold rounded-full px-3 py-1.5"
                        style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>View original note</button>
                    )}
                    <button onClick={() => decideVerify(r, "declined")} className="tap text-[12px] font-semibold rounded-full px-3 py-1.5 ml-auto"
                      style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.maroon }}>Decline</button>
                    <button onClick={() => decideVerify(r, "verified")} className="tap text-[12px] font-semibold rounded-full px-3.5 py-1.5"
                      style={{ background: C.pine, color: "#fff" }}>Verify ✓</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
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
                    {roleLabel(p.role)}{typeof p.rating === "number" ? ` · ★ ${p.rating.toFixed(1)}` : ""} · last: {last.title}
                  </div>
                </div>
                <span className="text-[11px] font-semibold rounded-full px-2 py-1 shrink-0" style={{ background: av[2], color: av[1] }}>{av[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {editOpen && <EditProfileSheet talent={t} onClose={() => setEditOpen(false)} onSaved={actions.reloadDirectory} />}
    </div>
  );
}

function ReviewLinks({ t }) {
  if (!t.taUrl && !t.gUrl) return null;
  const openU = (u) => window.open(u.startsWith("http") ? u : "https://" + u, "_blank", "noopener");
  return (
    <div className="flex gap-2 mt-3">
      {t.taUrl && (
        <button onClick={() => openU(t.taUrl)} className="tap flex-1 h-10 rounded-xl text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
          TripAdvisor <ExternalLink size={12} />
        </button>
      )}
      {t.gUrl && (
        <button onClick={() => openU(t.gUrl)} className="tap flex-1 h-10 rounded-xl text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
          Google Reviews <ExternalLink size={12} />
        </button>
      )}
    </div>
  );
}

function LegacyVerified({ talentId, isAdmin }) {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const load = () =>
    supabase.from("legacy_reviews").select("*").eq("profile_id", talentId).eq("status", "verified")
      .order("trip_year", { ascending: false })
      .then(({ data }) => setRows(data || []));
  useEffect(() => { load(); }, [talentId]);
  // Admin may revoke or remove — never verify. An operator's name on a review
  // must always mean that operator actually said so.
  const revoke = async (id) => {
    setBusyId(id);
    await supabase.from("legacy_reviews").update({ status: "pending", decided_at: null }).eq("id", id);
    setBusyId(null); load();
  };
  const removeRow = async (id) => {
    setBusyId(id);
    await supabase.from("legacy_reviews").delete().eq("id", id);
    setBusyId(null); load();
  };
  if (!rows.length) return null;
  return (
    <div className="mt-6">
      <SectionLabel trailing={`${rows.length}`}>Past trip reviews · verified</SectionLabel>
      <div className="space-y-3">
        {rows.map((r) => {
          const op = talentById(r.operator_id);
          return (
            <div key={r.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <p className="text-[13.5px] leading-relaxed" style={{ color: C.ink }}>“{r.body}”</p>
              <div className="text-[12px] mt-2" style={{ color: C.muted }}>
                {r.guest_name || "Guest"}{r.guest_country ? ` · ${r.guest_country}` : ""}{r.trip_year ? ` · ${r.trip_year}` : ""}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mt-2.5" style={{ background: C.pineSoft }}>
                <BadgeCheck size={12} color={C.pine} />
                <span className="text-[11.5px] font-semibold" style={{ color: C.pine }}>
                  Trip with {op ? op.name : "operator"} · past trip, verified
                </span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 mt-2.5">
                  <button onClick={() => revoke(r.id)} disabled={busyId === r.id}
                    className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                    style={{ background: C.goldSoft, color: "#7a5a1e" }}>Send back to operator</button>
                  <button onClick={() => removeRow(r.id)} disabled={busyId === r.id}
                    className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                    style={{ background: C.maroonSoft, color: C.maroon }}>Remove</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11.5px] mt-2 leading-snug" style={{ color: C.muted }}>
        Past reviews are verified by the operator who ran the trip. They appear as words only and never change the star rating.
      </p>
    </div>
  );
}

function LegacyReviewsSheet({ talent, onClose }) {
  const me = talent.id;
  const [rows, setRows] = useState(null);
  const [taUrl, setTaUrl] = useState(talent.taUrl || "");
  const [gUrl, setGUrl] = useState(talent.gUrl || "");
  const [linkNote, setLinkNote] = useState(null);
  const [adding, setAdding] = useState(false);
  const [opQuery, setOpQuery] = useState("");
  const [opId, setOpId] = useState(null);
  const [offMode, setOffMode] = useState(false);
  const [opName, setOpName] = useState("");
  const [opPhone, setOpPhone] = useState("");
  const [opEmail, setOpEmail] = useState("");
  const [linkFor, setLinkFor] = useState(null);
  const [linkQuery, setLinkQuery] = useState("");
  const [tripLabel, setTripLabel] = useState("");
  const [tripYear, setTripYear] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestCountry, setGuestCountry] = useState("");
  const [body, setBody] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const photoRef = useRef();

  const load = async () => {
    const { data } = await supabase.from("legacy_reviews").select("*").eq("profile_id", me)
      .order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, [me]);

  const operators = allProfiles().filter((p) => p.role === "operator");
  const opMatches = opQuery.trim()
    ? operators.filter((p) => p.name.toLowerCase().includes(opQuery.trim().toLowerCase())).slice(0, 5)
    : [];
  const chosenOp = opId ? talentById(opId) : null;

  const norm = (u) => { const v = u.trim(); return v ? (v.startsWith("http") ? v : "https://" + v) : null; };
  const saveLinks = async () => {
    const { error } = await supabase.from("profiles")
      .update({ tripadvisor_url: norm(taUrl), google_reviews_url: norm(gUrl) }).eq("id", me);
    setLinkNote(error ? (error.message || "Couldn't save.") : "Saved — the links now show on your Portfolio.");
  };

  const verifyLink = (r) => `${window.location.origin}/?verify=${r.verify_token}`;
  const inviteMsg = (r) => (
    `Kuzuzangpo la! This is ${talent.name}. We worked together on “${r.trip_label}”${r.trip_year ? ` (${r.trip_year})` : ""}.\n\n` +
    `I am putting my old guest reviews on Bhutan Tourism Hub, and one of them is from that trip. ` +
    `A review only goes up if the operator who was there says it is true.\n\n` +
    `Please open this and tell us. It is one tap and you do NOT need an account:\n${verifyLink(r)}\n\n` +
    `Please say no if anything is wrong. That is what keeps every review on the hub worth reading. Thank you la!`
  );
  const waInvite = (r) => {
    const digits = (r.operator_phone || "").replace(/[^0-9]/g, "");
    const num = digits.length === 8 ? "975" + digits : digits;
    window.open(num ? `https://wa.me/${num}?text=${encodeURIComponent(inviteMsg(r))}` : `https://wa.me/?text=${encodeURIComponent(inviteMsg(r))}`, "_blank", "noopener");
  };
  const emailInvite = (r) => {
    const sub = "Please verify our past trip review — Bhutan Tourism Hub";
    window.open(`mailto:${r.operator_email || ""}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(inviteMsg(r))}`, "_blank");
  };
  const linkOperator = async (row, p) => {
    const { error } = await supabase.from("legacy_reviews")
      .update({ operator_id: p.id, status: "pending" }).eq("id", row.id);
    if (!error) {
      await supabase.from("system_nudges").insert({
        profile_id: p.id, kind: "verify", ref: row.id,
        title: `${talent.name} asks you to verify a past review`,
        body: `“${row.trip_label}” — open your Profile desk to read and verify.`,
      });
    }
    setLinkFor(null); setLinkQuery(""); load();
  };

  const waNudge = (op, r) => {
    const digits = (op?.phone || "").replace(/[^0-9]/g, "");
    const num = digits.length === 8 ? "975" + digits : digits;
    const msg = `Kuzuzangpo la! I've added our past trip “${r.trip_label}”${r.trip_year ? ` (${r.trip_year})` : ""} as a review on Bhutan Tourism Hub — please open your Profile desk and tap Verify so it shows on my page. — ${talent.name}`;
    window.open(num ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  const pickPhoto = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader(); r.onload = () => setPhotoUri(r.result); r.readAsDataURL(f);
  };

  const pendingCount = (rows || []).filter((r) => r.status === "pending").length;
const shareVerify = (r) => {
    const link = `${window.location.origin}/?verify=${r.verify_token}`;
    const msg =
      `Kuzuzangpo ${r.operator_name || ""}.\n\n` +
      `This is ${talent.name}. I am putting my old guest reviews on Bhutan Tourism Hub, ` +
      `and one of them is from a trip I did with you.\n\n` +
      `Could you open this and say if it is true? It takes one tap and you do NOT need an account:\n${link}\n\n` +
      `Please say no if anything is wrong. Thank you.`;
    const digits = (r.operator_phone || "").replace(/[^0-9]/g, "");
    const wa = digits ? (digits.length === 8 ? "975" + digits : digits) : null;
    if (wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    else if (r.operator_email) window.location.href = `mailto:${r.operator_email}?subject=${encodeURIComponent("Please confirm a past trip review")}&body=${encodeURIComponent(msg)}`;
    else navigator.clipboard?.writeText(link);
  };

  const submit = async () => {
    if (pendingCount >= 3) { setErr("You already have 3 reviews awaiting verification — nudge those operators or withdraw one first."); return; }
    if (offMode) {
      if (!opName.trim()) { setErr("Enter the tour operator's company name."); return; }
      if (!opPhone.trim() && !opEmail.trim()) { setErr("Add the operator's WhatsApp number or email so we can invite them."); return; }
    } else if (!opId) { setErr("Choose the tour operator that trip was run with — or tap “not on the app yet”."); return; }
    if (!tripLabel.trim() || !body.trim()) { setErr("Trip name and the review words are required."); return; }
    setBusy(true); setErr(null);
    try {
      let photo_path = null; let photo_url = null;
      if (photoUri) {
        const small = await shrinkImage(photoUri, 1400, 0.85);
        const blob = dataUriToBlob(small);
        photo_path = `${me}/legacy-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("certs").upload(photo_path, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("certs").createSignedUrl(photo_path, 60 * 60 * 24 * 180);
        photo_url = signed?.signedUrl || null;
      }
      const payload = offMode
        ? { profile_id: me, operator_id: null, status: "invited",
            operator_name: opName.trim(), operator_phone: opPhone.trim() || null, operator_email: opEmail.trim() || null }
        : { profile_id: me, operator_id: opId };
      const { data: ins, error } = await supabase.from("legacy_reviews").insert({
        ...payload, photo_url, trip_label: tripLabel.trim(),
        trip_year: tripYear ? Number(tripYear) : null,
        guest_name: guestName.trim() || null, guest_country: guestCountry.trim() || null,
        body: body.trim(), photo_path,
      }).select("id").single();
      if (error) throw error;
      if (!offMode) {
        await supabase.from("system_nudges").insert({
          profile_id: opId, kind: "verify", ref: ins.id,
          title: `${talent.name} asks you to verify a past review`,
          body: `“${tripLabel.trim()}” — open your Profile desk to read and verify.`,
        });
      }
      setAdding(false); setOpId(null); setOpQuery(""); setOffMode(false);
      setOpName(""); setOpPhone(""); setOpEmail(""); setTripLabel(""); setTripYear("");
      setGuestName(""); setGuestCountry(""); setBody(""); setPhotoUri(null);
      load();
    } catch (e2) { setErr(e2.message || "Couldn't submit — try again."); }
    setBusy(false);
  };

  const withdraw = async (id) => { await supabase.from("legacy_reviews").delete().eq("id", id); load(); };
  const yearNow = new Date().getFullYear();

  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: C.bg, zIndex: 246, height: "100dvh" }}>
      <div className="shrink-0 h-14 px-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.line}`, background: C.card, paddingTop: "var(--sa-top)" }}>
        <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.bg }}>
          <ChevronLeft size={18} color={C.ink} />
        </button>
        <span className="text-[15.5px] font-semibold" style={{ color: C.ink }}>Past trip reviews</span>
      </div>

      <div className="flex-1 overflow-y-auto hidescroll px-5 py-5" style={{ scrollbarWidth: "none" }}>
        <div className="rounded-2xl p-4 mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[13.5px] font-semibold mb-3" style={{ color: C.ink }}>How verified past reviews work</div>
          {[
            ["1", "You transcribe it", "Type the review word for word. Attach a photo of the original note or chat — only the operator sees it."],
            ["2", "The operator confirms", "The operator you worked with reads it and taps Verify. Their name goes on the review."],
            ["3", "It appears verified", "It shows on your Portfolio as “Trip with that operator · verified”. Words only — stars come only from guest links."],
          ].map(([k, h, b]) => (
            <div key={k} className="flex items-start gap-3 mb-2.5">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                style={{ background: C.pine, color: "#fff" }}>{k}</span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: C.ink }}>{h}</div>
                <div className="text-[12px] leading-snug" style={{ color: C.muted }}>{b}</div>
              </div>
            </div>
          ))}
          <p className="text-[11.5px] mt-1 leading-snug" style={{ color: C.muted }}>
            If the operator can't remember or confirm a review, they'll decline it — that keeps every verified
            review worth something. You can have up to 3 awaiting verification at a time.
          </p>
        </div>

        <SectionLabel>Your review pages elsewhere</SectionLabel>
        <input value={taUrl} onChange={(e) => setTaUrl(e.target.value)} placeholder="TripAdvisor profile link — optional"
          className="w-full h-11 px-3.5 rounded-xl text-[13.5px] mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        <input value={gUrl} onChange={(e) => setGUrl(e.target.value)} placeholder="Google reviews link — optional"
          className="w-full h-11 px-3.5 rounded-xl text-[13.5px] mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        <button onClick={saveLinks} className="tap h-10 px-4 rounded-xl text-[13px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.pine }}>Save links</button>
        {linkNote && <p className="text-[12px] mt-1.5" style={{ color: C.pine }}>{linkNote}</p>}

        <div className="mt-6"><SectionLabel trailing={rows ? `${rows.length}` : null}>Submitted for verification</SectionLabel></div>
        {rows && rows.length === 0 && !adding && (
          <p className="text-[12.5px] mb-2" style={{ color: C.muted }}>Nothing yet — add a past review below.</p>
        )}
        <div className="space-y-2.5">
          {(rows || []).map((r) => {
            const op = talentById(r.operator_id);
            return (
              <div key={r.id} className="rounded-xl p-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{r.trip_label}{r.trip_year ? ` · ${r.trip_year}` : ""}</div>
                <p className="text-[12.5px] mt-1 leading-snug" style={{ color: C.muted }}>{r.body.length > 110 ? r.body.slice(0, 110) + "…" : r.body}</p>
                <div className="flex items-center gap-2 mt-2.5">
                  {r.status === "invited" ? (
                    <>
                      <span className="text-[11.5px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
                        {r.operator_name || "Operator"} — not on app yet
                      </span>
                      {r.operator_phone && (
                        <button onClick={() => waInvite(r)} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1 inline-flex items-center gap-1"
                          style={{ background: "rgba(37,211,102,.13)", border: "1px solid rgba(37,211,102,.45)", color: "#1FA855" }}>
                          <MessageCircle size={11} /> Send for approval
                        </button>
                      )}
                      {r.operator_email && (
                        <button onClick={() => emailInvite(r)} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>Email</button>
                      )}
                      <button onClick={() => shareVerify(r)} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                        style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>Copy link</button>
                      <button onClick={() => { setLinkFor(linkFor === r.id ? null : r.id); setLinkQuery(""); }}
                        className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                        style={{ background: C.pineSoft, color: C.pine }}>They joined</button>
                      <button onClick={() => withdraw(r.id)} className="tap text-[11.5px] ml-auto" style={{ color: C.maroon }}>Withdraw</button>
                    </>
                  ) : r.status === "verified" ? (
                    <span className="text-[11.5px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.pineSoft, color: C.pine }}>Verified by {op ? op.name : "operator"} ✓</span>
                  ) : r.status === "declined" ? (
                    <span className="text-[11.5px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>Declined</span>
                  ) : (
                    <>
                      <span className="text-[11.5px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.goldSoft, color: "#7a5a1e" }}>Awaiting {op ? op.name : "operator"}</span>
                      <button onClick={() => waNudge(op, r)} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1 inline-flex items-center gap-1"
                        style={{ background: "rgba(37,211,102,.13)", border: "1px solid rgba(37,211,102,.45)", color: "#1FA855" }}>
                        <MessageCircle size={11} /> Nudge
                      </button>
                      <button onClick={() => shareVerify(r)} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                        style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>Send link</button>
                      <button onClick={() => withdraw(r.id)} className="tap text-[11.5px] ml-auto" style={{ color: C.maroon }}>Withdraw</button>
                    </>
                  )}
                </div>
                {linkFor === r.id && (
                  <div className="mt-2.5">
                    <input value={linkQuery} onChange={(e) => setLinkQuery(e.target.value)} autoFocus
                      placeholder="Search their new operator account"
                      className="w-full h-10 px-3.5 rounded-xl text-[13px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                    {linkQuery.trim() && allProfiles().filter((p) => p.role === "operator" && p.name.toLowerCase().includes(linkQuery.trim().toLowerCase())).slice(0, 4).map((p) => (
                      <button key={p.id} onClick={() => linkOperator(r, p)}
                        className="tap w-full text-left px-3.5 py-2.5 mt-1.5 rounded-xl text-[13px] font-medium"
                        style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>{p.name}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!adding ? (
          pendingCount >= 3 ? (
            <p className="text-[12.5px] mt-4 text-center" style={{ color: C.muted }}>
              3 reviews are awaiting verification — nudge those operators, or withdraw one to add another.
            </p>
          ) : (
          <button onClick={() => setAdding(true)} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-4" style={{ background: C.pine, color: "#fff" }}>
            + Add a past review
          </button>
          )
        ) : (
          <div className="rounded-2xl p-4 mt-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="rounded-xl px-3 py-2.5 text-[12px] leading-snug mb-3" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
              Handwritten notes and WhatsApp messages: type the words exactly as written into the box below
              (transcribe them), and attach a photo of the original. The photo is shown only to the operator
              you choose — never publicly — so they can verify before verifying.
            </div>

            {!chosenOp ? (
              <>
                <input value={opQuery} onChange={(e) => { setOpQuery(e.target.value); setErr(null); }}
                  placeholder="Which tour operator was this trip with?"
                  className="w-full h-11 px-3.5 rounded-xl text-[13.5px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                {opMatches.map((p) => (
                  <button key={p.id} onClick={() => { setOpId(p.id); setErr(null); }}
                    className="tap w-full text-left px-3.5 py-2.5 mt-1.5 rounded-xl text-[13.5px] font-medium"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>{p.name}</button>
                ))}
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: C.pineSoft }}>
                <BadgeCheck size={14} color={C.pine} />
                <span className="flex-1 text-[13.5px] font-semibold" style={{ color: C.pine }}>{chosenOp.name}</span>
                <button onClick={() => setOpId(null)} className="tap text-[12px]" style={{ color: C.pine }}>change</button>
              </div>
            )}
            {!chosenOp && !offMode && (
              <button onClick={() => { setOffMode(true); setErr(null); }} className="tap text-[12.5px] font-semibold mt-2" style={{ color: "#7a5a1e" }}>
                Operator not on the app yet? Invite them →
              </button>
            )}
            {offMode && (
              <div className="rounded-xl p-3 mt-2" style={{ background: C.bg, border: `1px dashed ${C.gold}` }}>
                <input value={opName} onChange={(e) => { setOpName(e.target.value); setErr(null); }} maxLength={60}
                  placeholder="Tour operator's company name"
                  className="w-full h-11 px-3.5 rounded-xl text-[13.5px] mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                <div className="flex gap-2">
                  <input value={opPhone} onChange={(e) => { setOpPhone(e.target.value); setErr(null); }} maxLength={16}
                    placeholder="WhatsApp number" inputMode="tel"
                    className="flex-1 h-11 px-3.5 rounded-xl text-[13.5px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                  <input value={opEmail} onChange={(e) => { setOpEmail(e.target.value); setErr(null); }} maxLength={60}
                    placeholder="or email" inputMode="email" autoCapitalize="none"
                    className="flex-1 h-11 px-3.5 rounded-xl text-[13.5px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
                <p className="text-[11.5px] mt-2 leading-snug" style={{ color: "#7a5a1e" }}>
                  We'll prepare an invitation explaining how to join and how to verify your review with complete honesty.
                </p>
                <button onClick={() => setOffMode(false)} className="tap text-[12px] mt-1" style={{ color: C.muted }}>Back to search</button>
              </div>
            )}

            <div className="flex gap-2 mt-2.5">
              <input value={tripLabel} onChange={(e) => setTripLabel(e.target.value)} maxLength={60} placeholder="Trip name"
                className="flex-1 h-11 px-3.5 rounded-xl text-[13.5px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              <select value={tripYear} onChange={(e) => setTripYear(e.target.value)}
                className="h-11 px-2 rounded-xl text-[13.5px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: tripYear ? C.ink : C.muted }}>
                <option value="">Year</option>
                {Array.from({ length: 15 }).map((_, i) => <option key={i} value={yearNow - i}>{yearNow - i}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={40} placeholder="Guest name"
                className="flex-1 h-11 px-3.5 rounded-xl text-[13.5px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              <input value={guestCountry} onChange={(e) => setGuestCountry(e.target.value)} maxLength={30} placeholder="Country"
                className="w-28 h-11 px-3 rounded-xl text-[13.5px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={600}
              placeholder="The review, word for word"
              className="w-full px-3.5 py-3 rounded-xl text-[13.5px] leading-relaxed resize-none mt-2"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

            <div className="flex items-center gap-2.5 mt-2">
              {photoUri ? (
                <>
                  <img src={photoUri} alt="" className="w-14 h-14 rounded-lg object-cover" style={{ border: `1px solid ${C.line}` }} />
                  <span className="flex-1 text-[12px]" style={{ color: C.pine }}>Original attached — operator-only.</span>
                  <button onClick={() => setPhotoUri(null)} className="tap text-[12px]" style={{ color: C.maroon }}>Remove</button>
                </>
              ) : (
                <button onClick={() => photoRef.current?.click()} className="tap h-10 px-3.5 rounded-xl text-[12.5px] font-semibold"
                  style={{ background: C.bg, border: `1px dashed ${C.gold}`, color: "#7a5a1e" }}>
                  + Attach photo of the original (optional)
                </button>
              )}
              <input ref={photoRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
            </div>

            {err && <p className="text-[12.5px] mt-2" style={{ color: C.maroon }}>{err}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setAdding(false); setErr(null); }} className="tap flex-1 h-11 rounded-xl text-[13.5px] font-semibold"
                style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
              <button onClick={submit} disabled={busy} className="tap flex-1 h-11 rounded-xl text-[13.5px] font-semibold"
                style={{ background: C.pine, color: "#fff" }}>{busy ? "Submitting…" : "Send for verification"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  ), document.body);
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
  const [blocked, setBlocked] = useState(new Set());
  const canBlock = ["guide", "driver"].includes(user.kind);
  const load = async () => {
    const { data } = await supabase.from("calendar_notes").select("*").eq("profile_id", me).order("date");
    setNotes(data || []);
    const { data: F } = await supabase.from("festivals").select("*").order("start_date");
    setFests(F || []);
    const { data: B } = await supabase.from("blocked_days").select("day").eq("profile_id", me);
    setBlocked(new Set((B || []).map((r) => r.day)));
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

  const [blockBusy, setBlockBusy] = useState(false);
  const daysBetween = (a, b) => {
    const out = []; const cur = new Date(a + "T00:00"); const end = new Date((b || a) + "T00:00");
    while (cur <= end && out.length < 120) {
      out.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`);
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };
  const blockRange = async (from, to) => {
    if (blockBusy) return;
    setBlockBusy(true);
    const rows = daysBetween(from, to).map((d) => ({ profile_id: me, day: d }));
    await supabase.from("blocked_days").upsert(rows, { onConflict: "profile_id,day" });
    setBlockBusy(false); setBlockUntil(""); load();
  };
  const unblockDay = async (d) => {
    if (blockBusy) return;
    setBlockBusy(true);
    await supabase.from("blocked_days").delete().eq("profile_id", me).eq("day", d);
    setBlockBusy(false); load();
  };
  const [blockUntil, setBlockUntil] = useState("");

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
            const isOff = blocked.has(day);
            return (
              <button key={d} onClick={() => { setSel(isSel ? null : day); setAdding(false); }}
                className="tap relative h-12 rounded-lg flex flex-col items-center pt-1"
                style={{ background: isOff ? C.maroonSoft : "transparent",
                         border: isSel ? `2px solid ${C.pine}` : isToday ? `1.5px dashed ${C.gold}` : "1.5px solid transparent" }}>
                <span className="text-[12.5px] font-medium leading-none"
                  style={{ color: isOff ? C.maroon : hasTrip ? C.pine : C.ink, textDecoration: isOff ? "line-through" : "none" }}>{d}</span>
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
                  <div className="text-[12px]" style={{ color: C.muted }}>{fD(t.start)}{t.end && t.end !== t.start ? ` – ${fD(t.end)}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        {!sel ? (
          <p className="text-[12.5px] text-center py-3" style={{ color: C.muted }}>Tap a day to see what is on it, add a note, or say you are busy.</p>
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
                  <div className="text-[11.5px]" style={{ color: C.pine }}>{fD(t.start)}{t.end && t.end !== t.start ? ` – ${fD(t.end)}` : ""}</div>
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
            {tripsOn(sel).length === 0 && notesOn(sel).length === 0 && !adding && !blocked.has(sel) && (
              <p className="text-[12.5px] mb-2" style={{ color: C.muted }}>Nothing on this day yet.</p>
            )}

            {canBlock && (
              blocked.has(sel) ? (
                <div className="rounded-xl px-3 py-2.5 mb-2 flex items-center gap-2.5" style={{ background: C.maroonSoft }}>
                  <Lock size={14} color={C.maroon} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color: C.maroon }}>You are busy this day</div>
                    <div className="text-[11.5px]" style={{ color: C.maroon, opacity: .85 }}>Operators will not book you on this day.</div>
                  </div>
                  <button onClick={() => unblockDay(sel)} disabled={blockBusy}
                    className="tap text-[12px] font-semibold rounded-lg px-2.5 py-1.5 shrink-0"
                    style={{ background: "rgba(122,46,46,.12)", color: C.maroon }}>I am free</button>
                </div>
              ) : (
                <div className="mb-2">
                  {tripsOn(sel).length > 0 && (
                    <p className="text-[11.5px] mb-1.5 leading-snug" style={{ color: C.muted }}>
                      You have a trip this day. Close it so no operator asks you for the same dates.
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] shrink-0" style={{ color: C.muted }}>Busy until</span>
                    <input type="date" value={blockUntil} min={sel} onChange={(e) => setBlockUntil(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-xl text-[13px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: blockUntil ? C.ink : C.muted }} />
                  </div>
                  <button onClick={() => blockRange(sel, blockUntil)} disabled={blockBusy}
                    className="tap w-full h-10 rounded-xl text-[13px] font-semibold"
                    style={{ background: C.maroonSoft, color: C.maroon }}>
                    {blockBusy ? "Saving…" : blockUntil && blockUntil !== sel ? "I am busy these days" : "I am busy this day"}
                  </button>
                </div>
              )
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
                    {busy ? "Saving…" : "Save note"}
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
                      {fD(f.start_date)}{f.end_date && f.end_date !== f.start_date ? ` – ${fD(f.end_date)}` : ""}
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

/* ---- Build a trip: dates, details, and crew who are provably free. ---- */
function NewTripSheet({ user, onClose, onDone, fromEnquiry }) {
  // Carried straight over from the enquiry, so nothing is retyped and the guest
  // is not lost the moment the trip is created.
  const e = fromEnquiry || null;
  const [f, setF] = useState({
    title: e ? `${e.guest_name || "Trip"}${e.party_size ? ` · ${e.party_size} guests` : ""}` : "",
    start: e?.start_date || "", end: e?.end_date || "",
    meeting: "", notes: e?.note || "", allergies: "",
  });
  const [crew, setCrew] = useState([]);            // [{id,name,role}]
  const [busy, setBusy] = useState({});            // user_id -> {title, starts, ends}
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [checking, setChecking] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inv, setInv] = useState({ name: "", email: "", cc: "+975", phone: "", role: "guide" });
  const [pendingInvites, setPendingInvites] = useState([]);   // queued until the trip exists
  const [inviteResult, setInviteResult] = useState(null);

  // allProfiles() already returns talents. Mapping again blanked every name to "Member".
  const people = useMemo(() => allProfiles()
    .filter((p) => ["guide", "driver"].includes(p.role)), []);

  // Who is already committed across these dates. Re-checked whenever dates move.
  useEffect(() => {
    if (!f.start) { setBusy({}); return; }
    let dead = false;
    setChecking(true);
    (async () => {
      const { data } = await supabase.rpc("crew_busy_between", { d1: f.start, d2: f.end || f.start });
      if (dead) return;
      const m = {};
      (data || []).forEach((r) => { if (!m[r.user_id]) m[r.user_id] = r; });
      setBusy(m); setChecking(false);
    })();
    return () => { dead = true; };
  }, [f.start, f.end]);

  // Anyone picked before the dates changed may now clash. Drop them, loudly.
  useEffect(() => {
    const bad = crew.filter((c) => busy[c.id]);
    if (bad.length) {
      setCrew((L) => L.filter((c) => !busy[c.id]));
      setErr(`${bad.map((b) => b.name.split(" ")[0]).join(" and ")} became unavailable for these dates and ${bad.length === 1 ? "was" : "were"} removed.`);
    }
  }, [busy]);

  const shown = people.filter((p) => {
    if (crew.some((c) => c.id === p.id)) return false;
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (p.name || "").toLowerCase().includes(t) || (p.base || "").toLowerCase().includes(t);
  });

  // Nobody by that name. Rather than an empty list, show anyone spelled close to
  // it - a mistyped name is far more common than a missing person - and offer to
  // invite exactly who was typed.
  const near = (!shown.length && q.trim().length > 2)
    ? people.filter((p) => {
        if (crew.some((c) => c.id === p.id)) return false;
        const a = q.trim().toLowerCase();
        return (p.name || "").toLowerCase().split(/\s+/).some((w) => editDistance(w, a) <= 2);
      }).slice(0, 4)
    : [];

  const fmt = (d) => { try { return new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch (e) { return d; } };

  const inviteReady = inv.name.trim() && /\S+@\S+\.\S+/.test(inv.email);
  const sendInvite = () => {
    if (!inviteReady) return;
    setPendingInvites((L) => [...L, {
      ...inv, name: inv.name.trim(), email: inv.email.trim().toLowerCase(),
      phone: inv.phone.trim() ? `${inv.cc}${inv.phone.replace(/[^0-9]/g, "")}` : null,
    }]);
    setInv({ name: "", email: "", cc: "+975", phone: "", role: "guide" });
    setInviting(false);
    setErr(null);
  };

  const waLink = (phone, text) => {
    const d = String(phone || "").replace(/[^0-9]/g, "");
    const wa = d.length === 8 ? "975" + d : d;
    return `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
  };

  const save = async () => {
    if (saving) return;
    if (!f.title.trim()) { setErr("Give the trip a name."); return; }
    if (!f.start) { setErr("Set the start date."); return; }
    if (f.end && f.end < f.start) { setErr("The end date is before the start date."); return; }
    setSaving(true); setErr(null);

    const { data: trip, error: tErr } = await supabase.from("trips").insert({
      operator_id: user.talentId, operator_name: user.name,
      title: f.title.trim(), start_date: f.start, end_date: f.end || f.start,
      meeting_point: f.meeting.trim() || null,
      special_notes: f.notes.trim() || null,
      allergies: f.allergies.trim() || null,
      chat_state: "scheduled",
      guest_name: e?.guest_name || null,
      guest_country: e?.guest_country || null,
      party_size: e?.party_size || null,
      enquiry_id: e?.id || null,
    }).select("id").single();

    if (tErr || !trip) { setSaving(false); setErr("Could not create the trip. Try once more."); return; }

    await supabase.from("trip_members").insert({
      trip_id: trip.id, user_id: user.talentId, display_name: user.name, role_in_trip: "operator",
    });

    const failed = [];
    for (const c of crew) {
      const { error } = await supabase.from("trip_members").insert({
        trip_id: trip.id, user_id: c.id, display_name: c.name, role_in_trip: c.role,
      });
      if (error) failed.push({ name: c.name, why: String(error.message || "").replace(/^.*DOUBLE_BOOKED:\s*/, "") });
    }

    // Invitations can only be written once the trip has an id.
    const sentBy = [];
    for (const q of pendingInvites) {
      const { data: row } = await supabase.from("trip_invites").insert({
        trip_id: trip.id, operator_id: user.talentId,
        name: q.name, email: q.email, phone: q.phone, role: q.role,
      }).select("token").single();
      if (!row?.token) continue;

      const link = `${window.location.origin}/?invite=${row.token}`;
      const dates = f.end && f.end !== f.start ? `${fmtDate(f.start)} to ${fmtDate(f.end)}` : fmtDate(f.start);

      // Email is the invitation. It is formal, it keeps a record, and it is the
      // same address they will sign in with.
      let emailed = false;
      try {
        const { data: res } = await supabase.functions.invoke("send-invite", {
          body: { email: q.email, name: q.name, role: q.role, operator: user.name,
                  tripTitle: f.title.trim(), dates, link },
        });
        emailed = !!(res && res.ok);
      } catch (er) { emailed = false; }

      sentBy.push({ name: q.name, emailed, phone: q.phone, link, dates });
    }
    // Anything email could not carry, offer on WhatsApp so nobody is left waiting.
    const unsent = sentBy.filter((x) => !x.emailed && x.phone);
    for (const u of unsent) {
      const text =
        `Kuzuzangpo la ${u.name}.\n\n` +
        `This is ${user.name}. I would like you on "${f.title.trim()}", ${u.dates}.\n\n` +
        `Open this to accept:\n${u.link}`;
      try { window.open(waLink(u.phone, text), "_blank", "noopener"); } catch (er) {}
    }
    if (sentBy.length) {
      const okCount = sentBy.filter((x) => x.emailed).length;
      setInviteResult(okCount === sentBy.length
        ? `Invitation${sentBy.length === 1 ? "" : "s"} emailed.`
        : `${okCount} of ${sentBy.length} emailed. The rest opened in WhatsApp.`);
    }

    // Close the loop: the enquiry now points at the trip it became.
    if (e?.id) await supabase.from("enquiries").update({ trip_id: trip.id, status: "won" }).eq("id", e.id);

    setSaving(false);
    if (failed.length) {
      setErr(failed.map((x) => `${x.name} could not be added — ${x.why}`).join(" "));
      return;   // the trip exists; the operator can fix the crew on the trip page
    }
    onDone && onDone();
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 234 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.bg, maxHeight: "92dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="pt-3 shrink-0"><div className="w-10 h-1 rounded-full mx-auto" style={{ background: C.line }} /></div>
        <div className="px-5 pt-3 pb-6 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
          <h2 className="text-[20px] font-semibold" style={{ color: C.ink }}>New trip</h2>
          <p className="text-[12.5px] mt-1 leading-snug" style={{ color: C.muted }}>
            Set the dates first. Nobody already booked can be added to them.
          </p>

          {e && (
            <div className="rounded-xl px-3.5 py-2.5 mt-3 flex items-start gap-2.5" style={{ background: C.pineSoft }}>
              <Check size={15} color={C.pine} className="shrink-0 mt-0.5" />
              <div className="text-[12.5px] leading-snug" style={{ color: C.pine }}>
                Filled in from your enquiry for <b>{e.guest_name}</b>
                {e.guest_country ? `, ${e.guest_country}` : ""}
                {e.party_size ? ` · ${e.party_size} guest${e.party_size === 1 ? "" : "s"}` : ""}.
                The guest stays on the trip.
              </div>
            </div>
          )}

          <div className="mt-4">
            <BLabel>Trip name</BLabel>
            <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={80}
              placeholder="7-day Western Cultural Tour"
              className="w-full h-12 px-3.5 rounded-xl text-[15px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>

          <div className="flex gap-2 mt-3">
            <div className="flex-1">
              <BLabel>Starts</BLabel>
              <input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })}
                className="w-full h-12 px-3 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: f.start ? C.ink : C.muted }} />
            </div>
            <div className="flex-1">
              <BLabel>Ends</BLabel>
              <input type="date" value={f.end} min={f.start || undefined} onChange={(e) => setF({ ...f, end: e.target.value })}
                className="w-full h-12 px-3 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: f.end ? C.ink : C.muted }} />
            </div>
          </div>

          <div className="mt-3">
            <BLabel>Meeting point</BLabel>
            <input value={f.meeting} onChange={(e) => setF({ ...f, meeting: e.target.value })} maxLength={90}
              placeholder="Le Meridien, Thimphu"
              className="w-full h-12 px-3.5 rounded-xl text-[15px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>

          <div className="mt-3">
            <BLabel>Special notes</BLabel>
            <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} maxLength={1200}
              placeholder="Family of four. Slow walker. Early starts."
              className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>

          <div className="mt-3">
            <BLabel>Allergies and medical</BLabel>
            <textarea value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} rows={2} maxLength={800}
              placeholder="Severe peanut allergy. Carries an EpiPen."
              className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none"
              style={{ background: C.card, border: `1.5px solid rgba(122,46,46,.35)`, color: C.ink }} />
          </div>

          <div className="mt-5">
            <SectionLabel trailing={crew.length ? `${crew.length} picked` : undefined}>Crew</SectionLabel>

            {pendingInvites.map((q, i) => (
              <div key={`inv${i}`} className="rounded-xl px-3.5 py-2.5 mb-2 flex items-center gap-2.5"
                style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
                <UserPlus size={16} color={C.gold} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate" style={{ color: "#7a5a1e" }}>{q.name}</div>
                  <div className="text-[11.5px]" style={{ color: "#7a5a1e", opacity: .85 }}>
                    {q.role === "driver" ? "Driver" : "Guide"} · {q.email}
                  </div>
                </div>
                <button onClick={() => setPendingInvites((L) => L.filter((_, k) => k !== i))}
                  className="tap text-[12px] font-semibold shrink-0" style={{ color: C.maroon }}>Remove</button>
              </div>
            ))}

            {crew.map((c) => (
              <div key={c.id} className="rounded-xl px-3.5 py-2.5 mb-2 flex items-center gap-2.5" style={{ background: C.pineSoft }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0"
                  style={{ background: C.pineDeep, color: C.goldSoft }}>{initialsOf(c.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate" style={{ color: C.pine }}>{c.name}</div>
                  <div className="text-[11.5px]" style={{ color: C.pine, opacity: .8 }}>{c.role === "driver" ? "Driver" : "Guide"}</div>
                </div>
                <button onClick={() => setCrew((L) => L.filter((x) => x.id !== c.id))}
                  className="tap text-[12px] font-semibold shrink-0" style={{ color: C.maroon }}>Remove</button>
              </div>
            ))}

            {inviting ? (
              <div className="rounded-2xl p-3.5 mb-2" style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
                <BLabel>Their name</BLabel>
                <input value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} maxLength={60}
                  placeholder="Dorji Wangdi"
                  className="w-full h-11 px-3 rounded-xl text-[15px] mb-2.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                <BLabel>Their email</BLabel>
                <input value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value.trim() })}
                  maxLength={80} inputMode="email" autoCapitalize="none" placeholder="dorji@example.com"
                  className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                {suggestEmail(inv.email) && (
                  <button onClick={() => setInv({ ...inv, email: suggestEmail(inv.email) })}
                    className="tap w-full rounded-lg px-2.5 py-1.5 mt-1.5 text-left"
                    style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
                    <span className="text-[12px]" style={{ color: "#7a5a1e" }}>
                      Did you mean <b>{suggestEmail(inv.email)}</b>? Tap to use it.
                    </span>
                  </button>
                )}
                <p className="text-[11.5px] mt-1 mb-2.5" style={{ color: C.muted }}>
                  The invitation is sent here. It is also how they sign in.
                </p>

                <BLabel>WhatsApp number</BLabel>
                <div className="flex gap-2 mb-2.5">
                  <select value={inv.cc} onChange={(e) => setInv({ ...inv, cc: e.target.value })}
                    className="h-11 px-1.5 rounded-xl text-[13px]"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, width: 100 }}>
                    {REVIEW_CCODES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                  </select>
                  <input value={inv.phone} onChange={(e) => setInv({ ...inv, phone: e.target.value.replace(/[^0-9 ]/g, "").slice(0, 16) })}
                    inputMode="tel" placeholder="17123456"
                    className="flex-1 h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
                <div className="flex gap-1.5 mb-3">
                  {[["guide", "Guide"], ["driver", "Driver"]].map(([id, lbl]) => (
                    <button key={id} onClick={() => setInv({ ...inv, role: id })}
                      className="tap flex-1 h-10 rounded-xl text-[13.5px] font-semibold"
                      style={{ background: inv.role === id ? C.pine : C.bg, color: inv.role === id ? "#fff" : C.ink, border: `1px solid ${inv.role === id ? C.pine : C.line}` }}>{lbl}</button>
                  ))}
                </div>
                <button onClick={sendInvite} disabled={!inviteReady}
                  className="tap w-full h-11 rounded-xl text-[14px] font-semibold"
                  style={{ background: inviteReady ? C.gold : C.line, color: inviteReady ? "#fff" : C.muted }}>
                  Add this person
                </button>
                <button onClick={() => setInviting(false)} className="tap w-full text-[13px] font-semibold mt-2" style={{ color: C.muted }}>Cancel</button>
                <p className="text-[11.5px] mt-2.5 leading-snug" style={{ color: C.muted }}>
                  The trip is created first, then you send them the link. When they join they land straight on this trip.
                </p>
              </div>
            ) : null}

            {!f.start ? (
              <p className="text-[12.5px] leading-snug" style={{ color: C.muted }}>Set the start date to see who is free.</p>
            ) : (
              <>
                <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={40}
                  placeholder={checking ? "Checking who is free…" : "Search a guide or driver"}
                  className="w-full h-11 px-3.5 rounded-xl text-[14.5px] mb-2"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                {!inviting && (
                  <button onClick={() => setInviting(true)}
                    className="tap w-full rounded-xl px-3.5 py-2.5 mb-2 flex items-center gap-2.5 text-left"
                    style={{ background: C.card, border: `1.5px dashed ${C.gold}` }}>
                    <UserPlus size={16} color={C.gold} className="shrink-0" />
                    <span className="flex-1 text-[13.5px] font-semibold" style={{ color: "#7a5a1e" }}>
                      Not on the app yet? Invite them
                    </span>
                  </button>
                )}
                <div style={{ maxHeight: 240, overflowY: "auto" }} className="hidescroll">
                  {shown.length === 0 && q.trim() && (
                    <div className="rounded-xl p-3.5 mb-2" style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
                      <div className="text-[13.5px] font-semibold" style={{ color: "#7a5a1e" }}>
                        Nobody here is called &ldquo;{q.trim()}&rdquo;
                      </div>
                      {near.length > 0 && (
                        <>
                          <p className="text-[12px] mt-1.5 mb-1.5" style={{ color: "#7a5a1e" }}>Did you mean one of these?</p>
                          {near.map((p) => (
                            <button key={p.id} onClick={() => { setQ(""); setCrew((L) => [...L, { id: p.id, name: p.name, role: p.role }]); }}
                              className="tap w-full text-left rounded-lg px-2.5 py-2 mb-1 flex items-center gap-2"
                              style={{ background: C.card, border: `1px solid ${C.line}` }}>
                              <Avatar initials={p.initials} url={p.photoUrl} size={28} />
                              <span className="flex-1 text-[13px] font-semibold truncate" style={{ color: C.ink }}>{p.name}</span>
                              <span className="text-[11.5px]" style={{ color: C.muted }}>{p.base || ""}</span>
                            </button>
                          ))}
                        </>
                      )}
                      <button onClick={() => { setInv({ name: q.trim(), email: "", cc: "+975", phone: "", role: "guide" }); setInviting(true); }}
                        className="tap w-full h-10 rounded-xl text-[13px] font-semibold mt-1.5 flex items-center justify-center gap-2"
                        style={{ background: C.pine, color: "#fff" }}>
                        <UserPlus size={15} /> Invite {q.trim()} to the app
                      </button>
                    </div>
                  )}
                  {shown.map((p) => {
                    const clash = busy[p.id];
                    return (
                      <button key={p.id} disabled={!!clash}
                        onClick={() => { setErr(null); setCrew((L) => [...L, { id: p.id, name: p.name, role: p.role }]); setQ(""); }}
                        className="tap w-full text-left rounded-xl px-3.5 py-2.5 mb-1.5 flex items-center gap-2.5"
                        style={{ background: C.card, border: `1px solid ${C.line}`, opacity: clash ? .55 : 1 }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0"
                          style={{ background: clash ? C.line : C.pineDeep, color: clash ? C.muted : C.goldSoft }}>{p.initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{p.name}</div>
                          <div className="text-[11.5px] truncate" style={{ color: clash ? C.maroon : C.muted }}>
                            {clash ? `On "${clash.trip_title}" ${fmt(clash.starts)} to ${fmt(clash.ends)}`
                                   : `${p.role === "driver" ? "Driver" : "Guide"}${p.base ? " · " + p.base : ""} · free`}
                          </div>
                        </div>
                        {clash ? <Lock size={14} color={C.maroon} className="shrink-0" />
                               : <Plus size={16} color={C.pine} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {err && <p className="text-[13px] mt-3 leading-snug" style={{ color: C.maroon }}>{err}</p>}
          {inviteResult && <p className="text-[13px] mt-3 leading-snug" style={{ color: C.pine }}>{inviteResult}</p>}

          <button onClick={save} disabled={saving} className="tap w-full rounded-2xl text-[15.5px] font-semibold mt-5"
            style={{ height: 54, background: C.pine, color: "#fff" }}>{saving ? "Creating…" : "Create trip"}</button>
          <button onClick={onClose} className="tap w-full text-center text-[13.5px] font-semibold mt-3" style={{ color: C.muted }}>Cancel</button>
        </div>
      </div>
    </div>
  ), document.body);
}

function TripsTab({ user, trips, actions, onMessage }) {
  const [openId, setOpenId] = useState(null);
  const [newTrip, setNewTrip] = useState(false);
  const desktop = useIsDesktop();
  // Pick up a trip the dashboard asked for, once, then clear the baton so a
  // later visit to this tab does not reopen it.
  useEffect(() => {
    if (PENDING_TRIP_ID) { setOpenId(PENDING_TRIP_ID); PENDING_TRIP_ID = null; }
  }, []);
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

  // One source of truth, shared with the trip page: a trip stays Live for 3 days
  // after it ends, which is when reviews are asked for and grades are given.
  // tripStateNow opens the CHAT 3 days before departure, which is right for a chat
  // but wrong for this list: a trip that has not started is not live. So Live needs
  // "has actually started", and only borrows the 3-day tail at the end.
  const stateOf = (tr) => tripStateNow({ start: tr.start, end: tr.end || tr.start });
  const started = (tr) => tr.start && tr.start <= todayIso;
  const live = confirmed.filter((tr) => started(tr) && stateOf(tr) !== "completed")
    .sort((a, b) => ((a.end || a.start) > (b.end || b.start) ? 1 : -1));
  const upcoming = confirmed.filter((tr) => tr.start && !started(tr))
    .sort((a, b) => (a.start > b.start ? 1 : -1));
  const past = confirmed.filter((tr) => tr.start && stateOf(tr) === "completed")
    .sort((a, b) => ((a.end || a.start) < (b.end || b.start) ? 1 : -1));

  // Land on the tab with something in it, rather than an empty one.
  const [view, setView] = useState(null);
  const tab = view || (live.length ? "live" : upcoming.length ? "upcoming" : past.length ? "past" : "live");
  const shown = tab === "live" ? live : tab === "upcoming" ? upcoming : past;

  // Past is the year's record, so group it by month rather than one long list.
  const byMonth = () => {
    const g = [];
    past.forEach((tr) => {
      const d = new Date((tr.end || tr.start) + "T00:00");
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      const last = g[g.length - 1];
      if (last && last.key === key) last.list.push(tr); else g.push({ key, label, list: [tr] });
    });
    return g;
  };

  const open = mine.find((tr) => tr.id === openId);

  // RISK 2: a selected trip can vanish (cancelled, or filtered out by the tab).
  // Clear the selection rather than handing undefined to TripHub.
  useEffect(() => { if (openId && !open) setOpenId(null); }, [openId, open]);

  // PHONE: exactly the path it takes today. The detail replaces the list.
  if (open && !desktop) {
    return <TripHub user={user} meId={meId} trip={open} actions={actions} onMessage={onMessage} onBack={() => setOpenId(null)} />;
  }

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

  // DESKTOP: list on the left, the trip on the right, neither losing the other.
  const listPane = (
    <div className="px-5 py-4">
      {user.kind === "operator" && (
        <button onClick={() => setNewTrip(true)}
          className="tap w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-semibold mb-4"
          style={{ background: C.pine, color: "#fff" }}>
          <Plus size={18} strokeWidth={2.4} /> New trip
        </button>
      )}
      {user.kind === "operator" && !newTrip && (
        <p className="text-[11.5px] leading-snug mb-4 -mt-2 px-1" style={{ color: C.muted }}>
          A booking you already have. Set the dates, then pick or invite the crew.
          Still only an enquiry? Keep it in <b>Action</b> until the guest says yes.
        </p>
      )}
      {newTrip && <NewTripSheet user={user} onClose={() => setNewTrip(false)} onDone={() => actions.fetchTrips && actions.fetchTrips()} />}

      {mine.length === 0 ? (
        user.kind === "operator" ? (
          <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-[16px] font-semibold" style={{ color: C.ink }}>Put your season in here</div>
            <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: C.muted }}>
              Most operators already have trips booked in a notebook or a spreadsheet. Add them here and
              everything else in the app starts working for you.
            </p>

            {[["1", "Add the trips you already have",
               "Tap New trip. Name it, set the dates, add the meeting point, any allergies and notes. Nothing else needs to exist first."],
              ["2", "Put your crew on each one",
               "Pick a guide or driver and you see straight away who is free on those dates. Anyone already booked cannot be chosen. If they are not on the app yet, invite them by email and they land on that trip."],
              ["3", "Book the nights",
               "Open Stays and each night of the trip is listed. Tap the plus on any night to ask a hotel, and it shows you how many nights are still uncovered."],
              ["4", "Let it run",
               "The crew chat opens 3 days before. Reminders go out for the trip, for licences, and for grading afterwards. You do not have to remember any of it."],
            ].map(([n, title, body]) => (
              <div key={n} className="flex gap-3 mt-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12.5px] font-bold"
                  style={{ background: C.pineSoft, color: C.pine }}>{n}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{title}</div>
                  <p className="text-[12.5px] mt-0.5 leading-snug" style={{ color: C.muted }}>{body}</p>
                </div>
              </div>
            ))}

            <div className="rounded-xl px-3.5 py-3 mt-5" style={{ background: C.goldSoft }}>
              <p className="text-[12.5px] leading-snug" style={{ color: "#7a5a1e" }}>
                <b>Not booked yet?</b> Keep it as an enquiry in <b>Action</b> instead. When the guest says yes,
                one tap turns it into a trip with their name, dates and notes already filled in.
              </p>
            </div>
          </div>
        ) : (
          <Empty Icon={MapIcon} title="No trips yet" body="Create one above, or accept a job request and the trip appears here." />
        )
      ) : (
        <>
          {/* Signing is an action, not a category. It stays above the tabs so it
              can never be hidden behind one. */}
          <Section label="Awaiting your signature" list={awaiting} tone="sign" />

          <div className="mb-4">
            <Segmented value={tab} onChange={setView}
              options={[["live", `Live (${live.length})`], ["upcoming", `Upcoming (${upcoming.length})`], ["past", `Past (${past.length})`]]} />
          </div>

          {tab === "past" ? (
            past.length === 0 ? (
              <div className="rounded-2xl px-4 py-8 text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
                <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>No finished trips yet</div>
                <p className="text-[12.5px] mt-1 leading-snug" style={{ color: C.muted }}>
                  A trip moves here 3 days after it ends, and stays for good.
                </p>
              </div>
            ) : byMonth().map((g) => (
              <div key={g.key} className="mb-5">
                <SectionLabel trailing={`${g.list.length}`}>{g.label}</SectionLabel>
                <div className="space-y-3">
                  {g.list.map((tr) => (
                    <TripCard key={tr.id} trip={tr} onOpen={() => setOpenId(tr.id)} tone="done"
                      tally={tr.operatorId === mineId ? sigTally(tr) : null} />
                  ))}
                </div>
              </div>
            ))
          ) : shown.length === 0 ? (
            <div className="rounded-2xl px-4 py-8 text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
              <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>
                {tab === "live" ? "Nothing running right now" : "Nothing booked ahead"}
              </div>
              <p className="text-[12.5px] mt-1 leading-snug" style={{ color: C.muted }}>
                {tab === "live" ? "A trip appears here on its start day and stays for 3 days after it ends." : "Confirmed trips with a future start date appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((tr) => (
                <TripCard key={tr.id} trip={tr} onOpen={() => setOpenId(tr.id)} tone={tab === "live" ? "live" : undefined}
                  tally={tr.operatorId === mineId ? sigTally(tr) : null} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  // Phone falls straight through with the list, exactly as before.
  if (!desktop) return listPane;

  return (
    <div className="flex min-h-0" style={{ height: "100%" }}>
      {/* RISK 4: each pane owns its own scroll. min-h-0 lets a flex child
          actually shrink; without it the page grows instead of scrolling. */}
      <div className="overflow-y-auto hidescroll min-h-0 shrink-0"
        style={{ width: 400, borderRight: `1px solid ${C.line}`, scrollbarWidth: "none" }}>
        {listPane}
      </div>

      <div className="flex-1 overflow-y-auto hidescroll min-h-0" style={{ scrollbarWidth: "none" }}>
        {open ? (
          /* RISK 1: key forces a full remount so none of TripHub's 17 states
             carry over from the trip you were just looking at. */
          <TripHub key={open.id} user={user} meId={meId} trip={open} actions={actions}
            onMessage={onMessage} onBack={() => setOpenId(null)} />
        ) : (
          <div className="h-full flex items-center justify-center px-8">
            <div className="text-center" style={{ maxWidth: 320 }}>
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: C.pineSoft }}>
                <MapIcon size={24} color={C.pine} />
              </div>
              <div className="text-[15px] font-semibold mt-3" style={{ color: C.ink }}>Pick a trip</div>
              <p className="text-[13px] mt-1.5 leading-snug" style={{ color: C.muted }}>
                Choose one on the left to see its crew, chat, itinerary and stays without losing your list.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TripCard({ trip, onOpen, tone, needsSign, tally }) {
  const msgs = (trip.chat?.messages || []).filter((m) => m.kind !== "system");
  // Work it out from the dates rather than trusting a prop, so a finished trip
  // reads as finished wherever it appears, not only inside the Past tab.
  const st = tripStateNow(trip);
  const past = st === "completed" || tone === "done";
  const border = tone === "sign" ? `1.5px solid ${C.gold}` : tone === "live" ? `1.5px solid ${C.pine}` : `1px solid ${C.line}`;
  return (
    <button onClick={onOpen} className="tap w-full text-left rounded-2xl p-4"
      style={{ background: past ? C.bg : C.card, border: past ? `1px solid ${C.lineSoft}` : border,
               opacity: past ? 0.66 : 1 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[15px] font-semibold leading-snug" style={{ color: past ? C.muted : C.ink }}>{trip.title}</div>
        <TripStateBadge state={st} />
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

/* ---- Window seats. The app cannot book the airline. It wakes you at the
        exact minute the window opens, holding everything you need. ---- */
const SEAT_STATUS = {
  waiting: { label: "Waiting", bg: C.goldSoft, fg: "#7a5a1e" },
  won:     { label: "Got them", bg: C.pineSoft, fg: C.pine },
  missed:  { label: "Missed", bg: C.maroonSoft, fg: C.maroon },
  na:      { label: "Not needed", bg: C.bg, fg: C.muted },
};
const BHUTAN_OFFSET_MIN = 360;   // UTC+6, no daylight saving

function bhutanLocalString(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const shifted = new Date(d.getTime() + (BHUTAN_OFFSET_MIN + d.getTimezoneOffset()) * 60000);
  return shifted.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) + " BTT";
}
/* Build a UTC instant from a Bhutan wall-clock date and time. */
function bhutanInstant(dateStr, hhmm) {
  if (!dateStr) return null;
  const [h, m] = (hhmm || "02:30").split(":").map(Number);
  const [Y, M, D] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(Y, M - 1, D, h, m) - BHUTAN_OFFSET_MIN * 60000).toISOString();
}

function WindowSeats({ trip, isOperator }) {
  const [rows, setRows] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [f, setF] = useState({ flight_no: "", route: "", flight_date: "", pax: "", seat_side: "left", open_date: "", open_time: "02:30", booking_ref: "", note: "" });
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t); }, []);

  const load = async () => {
    const { data, error } = await supabase.from("trip_flights").select("*").eq("trip_id", trip.id).order("flight_date");
    if (error) { setErr("Could not load flights."); setRows([]); return; }
    setRows(data || []);
  };
  useEffect(() => { if (CLOUD) load(); else setRows([]); }, [trip.id]);

  const add = async () => {
    if (busy) return;
    if (!f.flight_no.trim() && !f.route.trim()) { setErr("Add a flight number or a route."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("trip_flights").insert({
      trip_id: trip.id, operator_id: trip.operatorId,
      flight_no: f.flight_no.trim() || null, route: f.route.trim() || null,
      flight_date: f.flight_date || null, pax: f.pax ? Number(f.pax) : null,
      seat_side: f.seat_side,
      opens_at: f.open_date ? bhutanInstant(f.open_date, f.open_time) : null,
      booking_ref: f.booking_ref.trim() || null, note: f.note.trim() || null,
    });
    setBusy(false);
    if (error) { setErr("That did not save. Try once more."); return; }
    setF({ flight_no: "", route: "", flight_date: "", pax: "", seat_side: "left", open_date: "", open_time: "02:30", booking_ref: "", note: "" });
    setAdding(false); load();
  };

  const mark = async (r, status, seats) => {
    await supabase.from("trip_flights").update({ status, seats_got: seats ?? r.seats_got }).eq("id", r.id);
    load();
  };
  const remove = async (r) => { await supabase.from("trip_flights").delete().eq("id", r.id); load(); };

  const countdown = (iso) => {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return "open now";
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return h >= 24 ? `in ${Math.floor(h / 24)}d ${h % 24}h` : h >= 1 ? `in ${h}h ${m}m` : `in ${m}m`;
  };

  return (
    <div>
      {rows === null && <p className="text-[13px]" style={{ color: C.muted }}>Loading…</p>}

      {rows && rows.length === 0 && !adding && (
        <TripEmpty text={isOperator ? "No flights on this trip yet." : "No flights recorded for this trip."}
          canEdit={isOperator} onEdit={() => setAdding(true)} />
      )}

      {(rows || []).map((r) => {
        const st = SEAT_STATUS[r.status] || SEAT_STATUS.waiting;
        const cd = r.status === "waiting" ? countdown(r.opens_at) : null;
        const open = cd === "open now";
        return (
          <div key={r.id} className="rounded-2xl p-4 mb-2.5"
            style={{ background: C.card, border: `${open ? 1.5 : 1}px solid ${open ? C.gold : C.line}` }}>
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-[15.5px] font-semibold" style={{ color: C.ink }}>
                  {r.flight_no || "Flight"}{r.route ? ` · ${r.route}` : ""}
                </div>
                <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>
                  {[r.flight_date ? fmtDate(r.flight_date) : null,
                    r.pax ? `${r.pax} guest${r.pax === 1 ? "" : "s"}` : null,
                    r.seat_side === "either" ? "window seat" : `${r.seat_side} side`].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
            </div>

            {r.status === "waiting" && r.opens_at && (
              <div className="rounded-xl px-3.5 py-2.5 mt-3" style={{ background: open ? C.goldSoft : C.bg, border: `1px solid ${open ? C.gold : C.line}` }}>
                <div className="flex items-center gap-2">
                  <Bell size={15} color={open ? C.gold : C.muted} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color: open ? "#7a5a1e" : C.ink }}>
                      Seats open {cd}
                    </div>
                    <div className="text-[11.5px]" style={{ color: open ? "#7a5a1e" : C.muted }}>
                      {bhutanLocalString(r.opens_at)} · we will wake you
                    </div>
                  </div>
                </div>
              </div>
            )}

            {r.booking_ref && (
              <div className="text-[12.5px] mt-2" style={{ color: C.muted }}>
                Booking ref <b style={{ color: C.ink }}>{r.booking_ref}</b>
              </div>
            )}
            {r.seats_got && <div className="text-[13px] mt-1.5" style={{ color: C.pine }}>Seats: {r.seats_got}</div>}
            {r.note && <p className="text-[13px] leading-snug mt-2" style={{ color: C.ink }}>{r.note}</p>}

            {isOperator && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                <a href="https://www.drukair.com.bt" target="_blank" rel="noopener noreferrer"
                  className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1 inline-flex items-center gap-1"
                  style={{ background: C.pine, color: "#fff", textDecoration: "none" }}>
                  Open Drukair <ExternalLink size={11} />
                </a>
                {r.status === "waiting" && (
                  <>
                    <button onClick={() => { const g = prompt("Which seats did you get? e.g. 8A, 8B"); if (g !== null) mark(r, "won", g.trim() || null); }}
                      className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.pineSoft, color: C.pine }}>Got them</button>
                    <button onClick={() => mark(r, "missed")} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                      style={{ background: C.maroonSoft, color: C.maroon }}>Missed</button>
                  </>
                )}
                {r.status !== "waiting" && (
                  <button onClick={() => mark(r, "waiting")} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>Reopen</button>
                )}
                <button onClick={() => remove(r)} className="tap text-[11.5px] font-semibold px-2 py-1" style={{ color: C.maroon }}>Remove</button>
              </div>
            )}
          </div>
        );
      })}

      {isOperator && (adding ? (
        <div className="rounded-2xl p-4 mt-2" style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
          <div className="flex gap-2 mb-3">
            <div style={{ width: 120 }}>
              <BLabel>Flight no</BLabel>
              <input value={f.flight_no} onChange={(e) => setF({ ...f, flight_no: e.target.value.toUpperCase() })} maxLength={10}
                placeholder="KB121" className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
            <div className="flex-1">
              <BLabel>Route</BLabel>
              <input value={f.route} onChange={(e) => setF({ ...f, route: e.target.value })} maxLength={60}
                placeholder="Paro to Kathmandu" className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <BLabel>Flight date</BLabel>
              <input type="date" value={f.flight_date} onChange={(e) => setF({ ...f, flight_date: e.target.value })}
                className="w-full h-11 px-3 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: f.flight_date ? C.ink : C.muted }} />
            </div>
            <div style={{ width: 90 }}>
              <BLabel>Guests</BLabel>
              <input value={f.pax} onChange={(e) => setF({ ...f, pax: e.target.value.replace(/[^0-9]/g, "") })} maxLength={3} inputMode="numeric"
                className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
          </div>

          <BLabel>Which side</BLabel>
          <div className="flex gap-1.5 mb-3">
            {[["left", "Left"], ["right", "Right"], ["either", "Either"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setF({ ...f, seat_side: id })}
                className="tap flex-1 h-10 rounded-xl text-[13.5px] font-semibold"
                style={{ background: f.seat_side === id ? C.pine : C.bg, color: f.seat_side === id ? "#fff" : C.ink, border: `1px solid ${f.seat_side === id ? C.pine : C.line}` }}>{lbl}</button>
            ))}
          </div>

          <BLabel>Wake me when seats open</BLabel>
          <div className="flex gap-2 mb-3">
            <input type="date" value={f.open_date} onChange={(e) => setF({ ...f, open_date: e.target.value })}
              className="flex-1 h-11 px-3 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: f.open_date ? C.ink : C.muted }} />
            <input type="time" value={f.open_time} onChange={(e) => setF({ ...f, open_time: e.target.value })}
              style={{ width: 118, background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} className="h-11 px-3 rounded-xl text-[14px]" />
          </div>
          <p className="text-[11.5px] mb-3 leading-snug" style={{ color: C.muted }}>
            Bhutan time. Leave it at 02:30 if that is when your seats open.
          </p>

          <BLabel>Booking reference</BLabel>
          <input value={f.booking_ref} onChange={(e) => setF({ ...f, booking_ref: e.target.value.toUpperCase() })} maxLength={20}
            placeholder="So you are not hunting for it at 2am"
            className="w-full h-11 px-3 rounded-xl text-[15px] mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

          {err && <p className="text-[12.5px] mb-2" style={{ color: C.maroon }}>{err}</p>}
          <button onClick={add} disabled={busy} className="tap w-full h-11 rounded-xl text-[14.5px] font-semibold"
            style={{ background: C.pine, color: "#fff" }}>{busy ? "Saving…" : "Save flight"}</button>
          <button onClick={() => { setAdding(false); setErr(null); }} className="tap w-full text-[13px] font-semibold mt-2.5" style={{ color: C.muted }}>Cancel</button>
        </div>
      ) : (
        (rows || []).length > 0 && (
          <button onClick={() => setAdding(true)} className="tap w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold mt-1"
            style={{ background: C.card, border: `1.5px dashed ${C.line}`, color: C.pine }}>
            <Plus size={16} /> Add another flight
          </button>
        )
      ))}

      <p className="text-[11.5px] mt-3 leading-snug" style={{ color: C.muted }}>
        We cannot book the airline for you. We wake you at the exact minute with the flight,
        the reference and the side to pick, so you are not fumbling at 2am.
      </p>
    </div>
  );
}

/* ---------------- Trip detail: itinerary, notes, allergies ---------------- */
/* ---- Hotels booked for one trip. The trip is where you ask "where are they
        sleeping"; the Hotels tab is where you ask "what is outstanding". ---- */
/* Work out what kind of stay this is from what the hotel says about itself.
   Deterministic on purpose: it runs offline, costs nothing, gives the same
   answer every time, and an owner can override it. */
const KIND_WORDS = {
  luxury:   ["luxury","luxurious","five star","5 star","spa resort","suite","butler","fine dining","amankora","six senses","taj","le meridien","pemako"],
  boutique: ["boutique","design hotel","intimate","hand-picked","curated","artisan","bespoke"],
  heritage: ["heritage","traditional","ancestral","dzong","historic","century","restored farmhouse","cultural home"],
  resort:   ["resort","spa","pool","wellness","retreat","riverside resort","hot stone"],
  farmstay: ["farmstay","farm stay","homestay","home stay","village","family home","host family","organic farm"],
  lodge:    ["lodge","trekking lodge","camp","base camp","guest house","guesthouse","hostel","backpacker"],
  city:     ["city hotel","business hotel","downtown","town centre","town center","conference","airport hotel"],
};

/* A hotel may say several things. Whichever category has the most evidence wins,
   with luxury and farmstay ranked first because they are the least ambiguous. */
const PRIORITY = ["farmstay","luxury","heritage","boutique","resort","lodge","city"];

function classifyStay({ name = "", pitch = "", tags = [] } = {}) {
  const hay = [name, pitch, (tags || []).join(" ")].join(" ").toLowerCase();
  const score = {};
  for (const [kind, words] of Object.entries(KIND_WORDS)) {
    let n = 0;
    for (const w of words) if (hay.includes(w)) n++;
    if (n) score[kind] = n;
  }
  const found = Object.keys(score);
  if (!found.length) return null;
  const best = Math.max(...found.map((k) => score[k]));
  const tied = found.filter((k) => score[k] === best);
  for (const k of PRIORITY) if (tied.includes(k)) return k;
  return tied[0];
}

/* Stars, if the hotel has written them anywhere. */
function readStars({ name = "", pitch = "", tags = [] } = {}) {
  const hay = [name, pitch, (tags || []).join(" ")].toString().toLowerCase();
  const m = hay.match(/([345])\s*[- ]?\s*star/);
  return m ? Number(m[1]) : null;
}

const STAY_KINDS = [
  ["all", "All"], ["luxury", "Luxury"], ["boutique", "Boutique"], ["heritage", "Heritage"],
  ["resort", "Resort"], ["city", "City"], ["farmstay", "Farmstay"], ["lodge", "Lodge"],
];

/* Pick a hotel for one night. Photos, class, rate and description in one place,
   so an operator is not opening profiles one at a time to compare. */
function HotelPickerSheet({ trip, night, date, operator, onClose, onBooked }) {
  const [kind, setKind] = useState("all");
  const [stars, setStars] = useState(0);
  const [q, setQ] = useState("");
  const [photos, setPhotos] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  const hotels = useMemo(() => allProfiles().filter((p) => p.role === "business"), []);

  useEffect(() => {
    (async () => {
      const ids = hotels.map((h) => h.id);
      if (!ids.length) return;
      const { data } = await supabase.from("business_photos").select("profile_id, path").in("profile_id", ids);
      const m = {};
      (data || []).forEach((r) => { if (!m[r.profile_id]) m[r.profile_id] = r.path; });
      setPhotos(m);
    })();
  }, []);

  const kindOf = (h) => h.stayKind || classifyStay({ name: h.name, pitch: h.pitch, tags: h.tags });
  const starsOf = (h) => h.starRating || readStars({ name: h.name, pitch: h.pitch, tags: h.tags });

  const shown = hotels.filter((h) => {
    if (kind !== "all" && kindOf(h) !== kind) return false;
    if (stars && starsOf(h) !== stars) return false;
    if (q.trim()) {
      const t = q.toLowerCase();
      if (!(h.name || "").toLowerCase().includes(t) && !(h.base || "").toLowerCase().includes(t)) return false;
    }
    return true;
  });

  const book = async (h) => {
    if (busyId) return;
    setBusyId(h.id); setErr(null);
    const next = new Date(date + "T00:00"); next.setDate(next.getDate() + 1);
    const end = next.toISOString().slice(0, 10);
    const { error } = await supabase.from("business_bookings").insert({
      business_id: h.id, operator_id: operator.talentId,
      business_name: h.name, operator_name: operator.name,
      start_date: date, end_date: end,
      trip_id: trip.id, night_no: night,
      guests: trip.partySize || null, status: "requested",
    });
    setBusyId(null);
    if (error) { setErr("Could not send that request. Try again."); return; }
    onBooked && onBooked();
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end lg:items-center lg:justify-center" style={{ background: "rgba(8,10,8,.55)", zIndex: 238 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl lg:rounded-3xl flex flex-col safe-bottom"
        style={{ background: C.bg, maxHeight: "92dvh", maxWidth: 980 }} onClick={(e) => e.stopPropagation()}>
        <div className="pt-3 shrink-0"><div className="w-10 h-1 rounded-full mx-auto" style={{ background: C.line }} /></div>

        <div className="px-5 pt-3 pb-3 shrink-0">
          <h2 className="text-[19px] font-semibold" style={{ color: C.ink }}>
            Where are they sleeping on night {night}?
          </h2>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>
            {fmtDate(date)} · {trip.title}
          </p>

          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or town"
            className="w-full h-11 px-3.5 rounded-xl text-[14.5px] mt-3"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

          <div className="flex gap-1.5 mt-2.5 overflow-x-auto hidescroll" style={{ scrollbarWidth: "none" }}>
            {STAY_KINDS.map(([k, label]) => (
              <button key={k} onClick={() => setKind(k)}
                className="tap shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                style={{ background: kind === k ? C.pine : C.card, color: kind === k ? "#fff" : C.ink, border: `1px solid ${kind === k ? C.pine : C.line}` }}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 mt-2">
            {[0, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)}
                className="tap rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                style={{ background: stars === n ? C.gold : C.card, color: stars === n ? "#fff" : C.ink, border: `1px solid ${stars === n ? C.gold : C.line}` }}>
                {n === 0 ? "Any class" : `${n} star`}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-6 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
          {err && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{err}</p>}
          {shown.length === 0 && (
            <p className="text-[13px] py-6 text-center" style={{ color: C.muted }}>
              No stays match that. Try another class, or clear the filters.
            </p>
          )}

          <div className="w-grid2">
            {shown.map((h) => {
              const k = kindOf(h), st = starsOf(h), pic = photos[h.id];
              return (
                <div key={h.id} className="rounded-2xl overflow-hidden mb-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  {pic ? (
                    <div style={{ height: 132, background: C.lineSoft }}>
                      <img src={pic} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center" style={{ height: 132, background: C.pineSoft }}>
                      <Store size={26} color={C.pine} />
                    </div>
                  )}
                  <div className="p-3.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{h.name}</div>
                        <div className="text-[12px]" style={{ color: C.muted }}>
                          {h.base || "Bhutan"}
                          {st ? ` · ${st} star` : ""}
                          {k ? ` · ${(STAY_KINDS.find((x) => x[0] === k) || [, k])[1]}` : ""}
                        </div>
                      </div>
                      {h.rateLow != null && (
                        <div className="text-right shrink-0">
                          <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                            Nu {Number(h.rateLow).toLocaleString("en-IN")}
                            {h.rateHigh ? `–${Number(h.rateHigh).toLocaleString("en-IN")}` : ""}
                          </div>
                          <div className="text-[10.5px]" style={{ color: C.muted }}>a guide, not a quote</div>
                        </div>
                      )}
                    </div>
                    {h.pitch && (
                      <p className="text-[12.5px] mt-1.5 leading-snug" style={{ color: C.muted,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{h.pitch}</p>
                    )}
                    <button onClick={() => book(h)} disabled={!!busyId}
                      className="tap w-full h-10 rounded-xl text-[13.5px] font-semibold mt-2.5"
                      style={{ background: C.pine, color: "#fff" }}>
                      {busyId === h.id ? "Sending…" : "Ask for this night"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}

/* How recently someone was in the app. Read from profiles.last_seen_at, which
   is stamped on open, rather than a live socket: a permanent connection per
   person is a poor trade on 4G for information this soft. */
function lastSeenLabel(iso) {
  if (!iso) return { text: "Not seen yet", live: false };
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 3) return { text: "Online now", live: true };
  if (mins < 60) return { text: `${mins} min ago`, live: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `${hrs} hour${hrs === 1 ? "" : "s"} ago`, live: false };
  const days = Math.floor(hrs / 24);
  if (days === 1) return { text: "Yesterday", live: false };
  if (days < 7) return { text: `${days} days ago`, live: false };
  return { text: "Over a week ago", live: false };
}

const TRIP_ROLE_LABEL = {
  guide: "Guide", driver: "Driver", operator: "Operator",
  moderator: "Moderator", manager: "Manager",
};

/* Who is in this trip's channel, when they were last about, and a way to reach
   any one of them directly. */
function ChannelMembers({ trip, meId, isOperator, onMessage, onChanged }) {
  const [seen, setSeen] = useState({});
  const [inviting, setInviting] = useState(false);
  const [inv, setInv] = useState({ name: "", email: "", role: "moderator" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const members = (trip.members || []);

  useEffect(() => {
    const ids = members.map((m) => m.id).filter((x) => /^[0-9a-f-]{36}$/.test(x));
    if (!ids.length) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("id, last_seen_at").in("id", ids);
      const m = {};
      (data || []).forEach((r) => { m[r.id] = r.last_seen_at; });
      setSeen(m);
    })();
  }, [trip.id, members.length]);

  const send = async () => {
    if (!inv.name.trim() || !/\S+@\S+\.\S+/.test(inv.email)) return;
    setBusy(true); setMsg(null);
    const { data: row, error } = await supabase.from("trip_invites").insert({
      trip_id: trip.id, operator_id: trip.operatorId,
      name: inv.name.trim(), email: inv.email.trim().toLowerCase(), role: inv.role,
    }).select("token").single();
    if (error || !row) { setBusy(false); setMsg("Could not create that invitation."); return; }

    const link = `${window.location.origin}/?invite=${row.token}`;
    let emailed = false;
    try {
      const { data: res } = await supabase.functions.invoke("send-invite", {
        body: { email: inv.email.trim(), name: inv.name.trim(), role: inv.role,
                operator: trip.operatorName || "Your operator", tripTitle: trip.title,
                dates: fmtRange(trip.start, trip.end || trip.start), link },
      });
      emailed = !!(res && res.ok);
    } catch (e) { emailed = false; }

    setBusy(false);
    setMsg(emailed ? "Invitation emailed." : "Invitation created. Send them this link: " + link);
    setInv({ name: "", email: "", role: "moderator" });
    setInviting(false);
    onChanged && onChanged();
  };

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ border: `1px solid ${C.line}`, background: C.card }}>
      <div className="px-3.5 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <Users size={15} color={C.gold} />
        <span className="text-[11.5px] font-semibold tracking-[.1em] uppercase" style={{ color: C.gold }}>
          In this channel
        </span>
        <span className="text-[11.5px]" style={{ color: C.muted }}>{members.length}</span>
      </div>

      {members.map((m) => {
        const ls = lastSeenLabel(seen[m.id]);
        const isMe = m.id === meId;
        return (
          <div key={m.id} className="px-3.5 py-2.5 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <div className="relative shrink-0">
              <Avatar initials={initialsOf(m.name || "?")} url={(talentById(m.id) || {}).photoUrl} size={36} />
              {ls.live && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                  style={{ background: "#3FA96B", border: `2px solid ${C.card}` }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>
                {m.name}{isMe ? " (you)" : ""}
              </div>
              <div className="text-[11.5px]" style={{ color: ls.live ? "#2F7D4F" : C.muted }}>
                {TRIP_ROLE_LABEL[m.roleInTrip] || m.roleInTrip} · {ls.text}
              </div>
            </div>
            {!isMe && onMessage && (
              <button onClick={() => onMessage(m.id)} className="tap shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.pine }}>
                Message
              </button>
            )}
          </div>
        );
      })}

      {isOperator && (inviting ? (
        <div className="p-3.5">
          <BLabel>Their name</BLabel>
          <input value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} maxLength={60}
            placeholder="Karma Dorji"
            className="w-full h-11 px-3 rounded-xl text-[15px] mb-2.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <BLabel>Their email</BLabel>
          <input value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value.trim() })} maxLength={80}
            inputMode="email" autoCapitalize="none" placeholder="karma@example.com"
            className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          {suggestEmail(inv.email) && (
            <button onClick={() => setInv({ ...inv, email: suggestEmail(inv.email) })}
              className="tap w-full rounded-lg px-2.5 py-1.5 mt-1.5 text-left"
              style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
              <span className="text-[12px]" style={{ color: "#7a5a1e" }}>Did you mean <b>{suggestEmail(inv.email)}</b>?</span>
            </button>
          )}
          <BLabel>Their role</BLabel>
          <div className="grid grid-cols-2 gap-1.5 mt-1 mb-2.5">
            {[["guide", "Guide"], ["driver", "Driver"], ["moderator", "Moderator"], ["manager", "Manager or owner"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setInv({ ...inv, role: id })}
                className="tap h-10 rounded-xl text-[13px] font-semibold"
                style={{ background: inv.role === id ? C.pine : C.bg, color: inv.role === id ? "#fff" : C.ink, border: `1px solid ${inv.role === id ? C.pine : C.line}` }}>{lbl}</button>
            ))}
          </div>
          <p className="text-[11.5px] mb-2.5 leading-snug" style={{ color: C.muted }}>
            {["guide", "driver"].includes(inv.role)
              ? "Crew are graded after the trip, can ask guests for reviews, and can only ever be on one trip at a time."
              : "Office roles join the channel to watch and help. They are never graded, never counted for reviews, and can be on several trips at once."}
          </p>
          <button onClick={send} disabled={busy || !inv.name.trim() || !/\S+@\S+\.\S+/.test(inv.email)}
            className="tap w-full h-11 rounded-xl text-[14px] font-semibold"
            style={{ background: inv.name.trim() && /\S+@\S+\.\S+/.test(inv.email) ? C.gold : C.line,
                     color: inv.name.trim() && /\S+@\S+\.\S+/.test(inv.email) ? "#fff" : C.muted }}>
            {busy ? "Sending…" : "Send the invitation"}
          </button>
          <button onClick={() => { setInviting(false); setMsg(null); }} className="tap w-full text-[13px] font-semibold mt-2" style={{ color: C.muted }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setInviting(true)} className="tap w-full px-3.5 py-3 flex items-center gap-2.5 text-left">
          <UserPlus size={16} color={C.gold} className="shrink-0" />
          <span className="text-[13.5px] font-semibold" style={{ color: "#7a5a1e" }}>Add</span>
        </button>
      ))}

      {msg && <p className="text-[12px] px-3.5 pb-3 leading-snug" style={{ color: C.pine }}>{msg}</p>}
    </div>
  );
}

/* ============ Druk Pah itinerary builder ============
   Runs the operator's own engine: no model, no network, no cost. Two ways in -
   answer Druk Pah's questions, or just describe the trip in words. Whatever it
   drafts is fully editable, and the operator's own touches are theirs alone. */

/* Turn rows into a CSV that Excel opens cleanly.
   The awkward parts, all of which bite in real exports:
     - a comma or quote or newline inside a value must be quoted and escaped
     - a value starting with = + - @ is run as a FORMULA by Excel, which is both
       wrong and a security problem, so it gets prefixed
     - phone numbers like 17123456 lose nothing, but +975... must stay text
     - a UTF-8 BOM is required or Excel mangles accented names */
function csvCell(v) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;          // stop Excel running it
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function toCSV(headers, rows) {
  const head = headers.map((h) => csvCell(h.label)).join(",");
  const body = rows.map((r) => headers.map((h) => csvCell(
    typeof h.get === "function" ? h.get(r) : r[h.key]
  )).join(",")).join("\r\n");
  // Excel needs a byte order mark or it mangles accented names. Written as a
  // char code rather than an escape, so the no-escapes rule stays absolute.
  return String.fromCharCode(0xFEFF) + head + "\r\n" + body;
}
function downloadCSV(name, headers, rows) {
  const blob = new Blob([toCSV(headers, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const LOST_LABEL = {
  price: "Too expensive", dates: "Dates did not work", no_reply: "Stopped replying",
  chose_other: "Went with someone else", changed_plans: "Changed their plans",
  visa: "Visa or permit", other: "Other", not_recorded: "Not recorded",
};
const SOURCE_LABEL = {
  website: "Website", referral: "Referral", agent: "Agent", repeat: "Repeat guest",
  social: "Social media", walk_in: "Walk in", other: "Other", not_recorded: "Not recorded",
};

function Bar({ label, n, of, won, tone }) {
  const pct = of > 0 ? Math.round((n / of) * 100) : 0;
  const wonPct = n > 0 && won != null ? Math.round((won / n) * 100) : null;
  return (
    <div className="mb-2">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[13px] font-medium flex-1 min-w-0 truncate" style={{ color: C.ink }}>{label}</span>
        <span className="text-[13px] font-semibold" style={{ color: C.ink }}>{n}</span>
        {wonPct != null && <span className="text-[11.5px]" style={{ color: C.muted }}>{wonPct}% won</span>}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.lineSoft }}>
        <div style={{ width: `${pct}%`, height: "100%", background: tone || C.pine }} />
      </div>
    </div>
  );
}

/* Reports: what happened, why, and everything in a form a spreadsheet accepts. */
function ReportsTab({ user }) {
  const [d, setD] = useState(null);
  const [rows, setRows] = useState([]);
  const [trips, setTrips] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const year = new Date().getFullYear();
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(`${year}-12-31`);

  const load = async () => {
    setBusy(true); setErr(null);
    const [ins, enq, trp] = await Promise.all([
      supabase.rpc("operator_insights", { from_date: from, to_date: to }),
      supabase.from("enquiries").select("*").order("start_date"),
      supabase.from("trips").select("*").eq("operator_id", user.talentId).order("start_date"),
    ]);
    if (ins.error) setErr("Could not build the report.");
    setD(ins.data || {}); setRows(enq.data || []); setTrips(trp.data || []);
    setBusy(false);
  };
  useEffect(() => { if (CLOUD) load(); else setD({}); }, [from, to]);

  const stamp = () => new Date().toISOString().slice(0, 10);

  const exportEnquiries = () => downloadCSV(`enquiries-${stamp()}.csv`, [
    { label: "Guest", key: "guest_name" }, { label: "Country", key: "guest_country" },
    { label: "Email", key: "guest_email" }, { label: "Phone", key: "guest_phone" },
    { label: "Guests", key: "party_size" }, { label: "From", key: "start_date" },
    { label: "To", key: "end_date" }, { label: "Status", key: "status" },
    { label: "Why lost", get: (r) => LOST_LABEL[r.lost_reason] || "" },
    { label: "Found you via", get: (r) => SOURCE_LABEL[r.source] || "" },
    { label: "Became a trip", get: (r) => (r.trip_id ? "Yes" : "No") },
    { label: "Note", key: "note" },
    { label: "Received", get: (r) => String(r.created_at || "").slice(0, 10) },
  ], rows);

  const exportTrips = () => downloadCSV(`trips-${stamp()}.csv`, [
    { label: "Trip", key: "title" }, { label: "From", key: "start_date" }, { label: "To", key: "end_date" },
    { label: "Nights", get: (t) => t.start_date && t.end_date
        ? Math.max(1, Math.round((new Date(t.end_date) - new Date(t.start_date)) / 86400000)) : "" },
    { label: "Guest", key: "guest_name" }, { label: "Country", key: "guest_country" },
    { label: "Party size", key: "party_size" }, { label: "Meeting point", key: "meeting_point" },
    { label: "Allergies", key: "allergies" }, { label: "Special notes", key: "special_notes" },
    { label: "Status", key: "status" },
  ], trips);

  // Only addresses whose owner agreed to hear from you again.
  const mailable = rows.filter((r) => r.status === "lost" && r.guest_email && r.marketing_ok);
  const exportMailing = () => downloadCSV(`offers-list-${stamp()}.csv`, [
    { label: "Email", key: "guest_email" }, { label: "Name", key: "guest_name" },
    { label: "Country", key: "guest_country" },
    { label: "Wanted to travel", key: "start_date" },
    { label: "Guests", key: "party_size" },
    { label: "Why it did not happen", get: (r) => LOST_LABEL[r.lost_reason] || "" },
  ], mailable);

  const totals = (d && d.totals) || {};
  const months = (d && d.by_month) || [];
  const peak = months.reduce((a, b) => (!a || (b.enquiries > a.enquiries) ? b : a), null);
  const maxMonth = months.reduce((a, b) => Math.max(a, b.enquiries), 0);
  const countries = (d && d.by_country) || [];
  const why = (d && d.why_lost) || [];
  const sources = (d && d.by_source) || [];
  const lead = (d && d.lead_days) || {};
  const lostTotal = why.reduce((a, b) => a + b.n, 0);

  if (d === null) return <p className="text-[13px] px-5 py-4" style={{ color: C.muted }}>Building the report…</p>;

  return (
    <div className="px-5 py-5">
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>Reports</h1>
      <p className="text-[13px] mt-1 mb-4 leading-snug" style={{ color: C.muted }}>
        Your own year, counted. Everything here comes from what you have recorded, nothing is estimated.
      </p>

      <div className="flex gap-2 mb-5">
        <div className="flex-1">
          <BLabel>From</BLabel>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="w-full h-11 px-3 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        </div>
        <div className="flex-1">
          <BLabel>To</BLabel>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="w-full h-11 px-3 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        </div>
      </div>

      {from > to && (
        <div className="rounded-xl px-3.5 py-2.5 mb-3 flex items-start gap-2" style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
          <AlertTriangle size={15} color={C.gold} className="shrink-0 mt-0.5" />
          <span className="text-[12.5px] leading-snug" style={{ color: "#7a5a1e" }}>
            The From date is after the To date, so nothing can fall inside it. Swap them to see the report.
          </span>
        </div>
      )}
      {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        <DashCount n={totals.enquiries ?? 0} label="enquiries" />
        <DashCount n={totals.won ?? 0} label="became trips" />
        <DashCount n={totals.conversion != null ? totals.conversion + "%" : "–"} label="conversion" />
        <DashCount n={totals.guests ?? 0} label="guests won" />
      </div>

      {totals.enquiries === 0 && (
        <div className="rounded-2xl px-4 py-6 text-center mb-5" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
          <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>Nothing to report yet</div>
          <p className="text-[12.5px] mt-1 leading-snug" style={{ color: C.muted }}>
            Every enquiry you record builds this page. Come back after a season and it will tell you
            when your guests want to travel and why the others said no.
          </p>
        </div>
      )}

      {months.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <SectionLabel trailing={peak ? `busiest: ${peak.label}` : undefined}>When they want to travel</SectionLabel>
          {months.map((m) => (
            <Bar key={m.m} label={m.label} n={m.enquiries} of={maxMonth} won={m.won} />
          ))}
          <p className="text-[11.5px] mt-1.5 leading-snug" style={{ color: C.muted }}>
            By the month guests asked to travel in, not when they wrote to you.
          </p>
        </div>
      )}

      {why.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <SectionLabel trailing={`${lostTotal} lost`}>Why they did not book</SectionLabel>
          {why.map((w) => (
            <Bar key={w.reason} label={LOST_LABEL[w.reason] || w.reason} n={w.n} of={lostTotal}
              tone={w.reason === "not_recorded" ? C.line : C.maroon} />
          ))}
          {why.some((w) => w.reason === "not_recorded") && (
            <p className="text-[11.5px] mt-1.5 leading-snug" style={{ color: C.muted }}>
              Some have no reason recorded. Choosing one when an enquiry goes quiet makes this answerable.
            </p>
          )}
        </div>
      )}

      {countries.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <SectionLabel>Where they come from</SectionLabel>
          {countries.slice(0, 8).map((c) => (
            <Bar key={c.country} label={c.country} n={c.n} of={countries[0].n} won={c.won} tone={C.gold} />
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <SectionLabel>How they found you</SectionLabel>
          {sources.map((x) => (
            <Bar key={x.source} label={SOURCE_LABEL[x.source] || x.source} n={x.n} of={sources[0].n} won={x.won} />
          ))}
        </div>
      )}

      {lead && lead.median != null && (
        <div className="rounded-2xl p-4 mb-5" style={{ background: C.pineSoft }}>
          <div className="text-[13.5px] font-semibold" style={{ color: C.pine }}>
            Guests book about {lead.median} days ahead
          </div>
          <p className="text-[12px] mt-1 leading-snug" style={{ color: C.pine, opacity: .9 }}>
            Shortest {lead.shortest}, longest {lead.longest}. Advertising later than {lead.median} days
            before a departure is likely too late for most of them.
          </p>
        </div>
      )}

      <SectionLabel>Take it away</SectionLabel>
      <button onClick={exportEnquiries} disabled={!rows.length}
        className="tap w-full h-12 rounded-xl flex items-center justify-between px-4 text-[14px] font-semibold mb-2"
        style={{ background: C.card, border: `1px solid ${C.line}`, color: rows.length ? C.ink : C.muted }}>
        <span>All enquiries</span><span className="text-[12px]" style={{ color: C.muted }}>{rows.length} rows</span>
      </button>
      <button onClick={exportTrips} disabled={!trips.length}
        className="tap w-full h-12 rounded-xl flex items-center justify-between px-4 text-[14px] font-semibold mb-2"
        style={{ background: C.card, border: `1px solid ${C.line}`, color: trips.length ? C.ink : C.muted }}>
        <span>All trips</span><span className="text-[12px]" style={{ color: C.muted }}>{trips.length} rows</span>
      </button>
      <button onClick={exportMailing} disabled={!mailable.length}
        className="tap w-full h-12 rounded-xl flex items-center justify-between px-4 text-[14px] font-semibold"
        style={{ background: C.card, border: `1px solid ${C.line}`, color: mailable.length ? C.ink : C.muted }}>
        <span>Offers list</span><span className="text-[12px]" style={{ color: C.muted }}>{mailable.length} agreed</span>
      </button>
      <p className="text-[11.5px] mt-2 leading-snug" style={{ color: C.muted }}>
        The offers list holds only guests who did not book <b>and</b> agreed to hear from you again.
        An address given for a quote is not permission to market, so the rest are left out.
      </p>
      <p className="text-[11.5px] mt-2 leading-snug" style={{ color: C.muted }}>
        Files open straight in Excel or Google Sheets.
      </p>
    </div>
  );
}

/* ---- The trip on paper. Two versions on purpose:
        Guest copy  - the itinerary, the stays, where to meet. Nothing internal.
        Crew sheet  - everything, including phone numbers, allergies and notes.
        Printed through the browser, so it works offline and needs no library. ---- */
function TripDocument({ trip, user, onClose }) {
  const [copy, setCopy] = useState("guest");
  const [stays, setStays] = useState([]);
  const guest = copy === "guest";

  useEffect(() => {
    if (!CLOUD) return;
    (async () => {
      const { data } = await supabase.from("business_bookings").select("*")
        .eq("trip_id", trip.id).order("start_date");
      setStays((data || []).filter((b) => b.status !== "cancelled" && b.status !== "declined"));
    })();
  }, [trip.id]);

  const nights = (() => {
    if (!trip.start) return [];
    const a = new Date(trip.start + "T00:00"), b = new Date((trip.end || trip.start) + "T00:00");
    const out = []; const d = new Date(a); let n = 1;
    while (d < b || (n === 1 && +a === +b)) {
      out.push({ n, date: d.toISOString().slice(0, 10) });
      d.setDate(d.getDate() + 1); n++; if (n > 60) break;
    }
    return out;
  })();

  const stayFor = (date) => stays.find((b) => b.start_date <= date && b.end_date > date);
  const itin = trip.itinerary || [];
  const crew = (trip.members || []).filter((m) => m.roleInTrip !== "operator");

  return createPortal((
    <div className="fixed inset-0 overflow-y-auto" style={{ background: C.bg, zIndex: 250 }}>
      {/* controls, never printed */}
      <div className="no-print sticky top-0 flex items-center gap-2 px-5 py-3"
        style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onClose} className="tap flex items-center gap-1.5 text-[13.5px] font-semibold shrink-0" style={{ color: C.pine }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {[["guest", "Guest copy"], ["crew", "Crew sheet"]].map(([id, label]) => (
            <button key={id} onClick={() => setCopy(id)}
              className="tap rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
              style={{ background: copy === id ? C.pine : C.bg, color: copy === id ? "#fff" : C.ink, border: `1px solid ${copy === id ? C.pine : C.line}` }}>{label}</button>
          ))}
        </div>
        <button onClick={() => window.print()} className="tap rounded-full px-4 py-1.5 text-[12.5px] font-semibold shrink-0"
          style={{ background: C.gold, color: "#fff" }}>Print or save as PDF</button>
      </div>

      <div className="print-page" style={{ maxWidth: 760, margin: "0 auto", padding: "28px 26px 60px" }}>
        {/* letterhead */}
        <div className="flex items-start justify-between gap-4 pb-4" style={{ borderBottom: `2px solid ${C.pine}` }}>
          <div>
            <div className="text-[19px] font-semibold" style={{ color: C.pine }}>{trip.operatorName || user.name}</div>
            <div className="text-[11.5px] mt-0.5" style={{ color: C.muted }}>
              {guest ? "Your journey in Bhutan" : "Crew sheet — not for the guest"}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] font-bold tracking-[.14em] uppercase" style={{ color: C.gold }}>
              {guest ? "Itinerary" : "Trip sheet"}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{fmtRange(trip.start, trip.end || trip.start)}</div>
          </div>
        </div>

        <h1 className="text-[24px] font-semibold mt-5 leading-tight" style={{ color: C.ink }}>{trip.title}</h1>
        {trip.guestName && (
          <div className="text-[14px] mt-1" style={{ color: C.muted }}>
            Prepared for {trip.guestName}{trip.guestCountry ? `, ${trip.guestCountry}` : ""}
            {trip.partySize ? ` · ${trip.partySize} guest${trip.partySize === 1 ? "" : "s"}` : ""}
          </div>
        )}

        {trip.meeting && (
          <div className="rounded-xl px-4 py-3 mt-4" style={{ background: C.pineSoft }}>
            <div className="text-[10.5px] font-bold tracking-[.12em] uppercase" style={{ color: C.pine }}>Meeting point</div>
            <div className="text-[14.5px] font-medium mt-0.5" style={{ color: C.pine }}>{trip.meeting}</div>
          </div>
        )}

        {/* the days */}
        <div className="mt-6">
          <div className="text-[11px] font-bold tracking-[.14em] uppercase mb-3" style={{ color: C.gold }}>Day by day</div>
          {itin.length === 0 && nights.length === 0 && (
            <p className="text-[13.5px]" style={{ color: C.muted }}>No itinerary has been added yet.</p>
          )}
          {(itin.length ? itin : nights.map((x) => ({ day: x.n, title: "", detail: "" }))).map((d, i) => {
            const night = nights[i];
            const stay = night ? stayFor(night.date) : null;
            return (
              <div key={i} className="pb-3 mb-3 print-row" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <div className="flex items-baseline gap-3">
                  <div className="text-[11px] font-bold tracking-[.08em] uppercase shrink-0" style={{ color: C.gold, width: 62 }}>
                    Day {d.day || i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{d.title || (night ? fmtDate(night.date) : "")}</div>
                    {d.detail && <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: C.muted }}>{d.detail}</p>}
                    {stay && (
                      <div className="text-[12.5px] mt-1.5" style={{ color: C.pine }}>
                        Night: {stay.business_name}
                        {!guest && stay.rooms ? ` · ${stay.rooms} room${stay.rooms === 1 ? "" : "s"}` : ""}
                        {!guest && stay.quote_amount != null ? ` · Nu ${Number(stay.quote_amount).toLocaleString("en-IN")}` : ""}
                      </div>
                    )}
                  </div>
                  {night && <div className="text-[12px] shrink-0" style={{ color: C.muted }}>{fmtDate(night.date)}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* crew: names for the guest, contact details only on the crew sheet */}
        {crew.length > 0 && (
          <div className="mt-5">
            <div className="text-[11px] font-bold tracking-[.14em] uppercase mb-2" style={{ color: C.gold }}>
              {guest ? "Looking after you" : "Crew"}
            </div>
            {crew.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1">
                <span className="text-[14px] font-medium" style={{ color: C.ink }}>{m.name}</span>
                <span className="text-[12.5px]" style={{ color: C.muted }}>
                  {m.roleInTrip === "driver" ? "Driver" : m.roleInTrip === "guide" ? "Guide" : TRIP_ROLE_LABEL[m.roleInTrip] || m.roleInTrip}
                </span>
                {!guest && (talentById(m.id) || {}).phone && (
                  <span className="text-[12.5px] ml-auto" style={{ color: C.ink }}>{(talentById(m.id) || {}).phone}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* internal only */}
        {!guest && trip.allergies && (
          <div className="rounded-xl px-4 py-3 mt-5" style={{ background: C.maroonSoft }}>
            <div className="text-[10.5px] font-bold tracking-[.12em] uppercase" style={{ color: C.maroon }}>Allergies and medical</div>
            <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: C.maroon }}>{trip.allergies}</p>
          </div>
        )}
        {!guest && trip.specialNotes && (
          <div className="rounded-xl px-4 py-3 mt-2.5" style={{ background: C.goldSoft }}>
            <div className="text-[10.5px] font-bold tracking-[.12em] uppercase" style={{ color: "#7a5a1e" }}>Special notes</div>
            <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: "#7a5a1e" }}>{trip.specialNotes}</p>
          </div>
        )}

        <div className="mt-8 pt-4 text-[11.5px]" style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}>
          {trip.operatorName || user.name}
          {guest ? " · We look forward to welcoming you." : ` · Printed ${fmtDate(new Date().toISOString().slice(0, 10))}`}
        </div>
      </div>
    </div>
  ), document.body);
}

function ItineraryDayCard({ day, index, onChange, onRemove }) {
  return (
    <div className="rounded-2xl p-3.5 mb-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-[.08em] uppercase shrink-0"
          style={{ background: C.goldSoft, color: "#7a5a1e" }}>Day {index + 1}</div>
        <input value={day.title} onChange={(e) => onChange({ ...day, title: e.target.value })}
          placeholder="Where they are and what they do"
          className="flex-1 bg-transparent outline-none text-[14.5px] font-semibold min-w-0" style={{ color: C.ink }} />
        <button onClick={onRemove} className="tap shrink-0 text-[12px] font-semibold" style={{ color: C.maroon }}>Remove</button>
      </div>
      <textarea value={day.detail} onChange={(e) => onChange({ ...day, detail: e.target.value })}
        rows={3} placeholder="The detail your guest reads"
        className="w-full px-3 py-2.5 rounded-xl text-[13.5px] leading-relaxed resize-none"
        style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
    </div>
  );
}

function ItineraryBuilder({ user, trip, onClose, onSaved }) {
  const [mode, setMode] = useState("ask");        // ask | text | edit
  const [sess, setSess] = useState(null);
  const [q, setQ] = useState(null);
  const [countVal, setCountVal] = useState("2");
  const [picked, setPicked] = useState([]);
  const [free, setFree] = useState("");
  const [nights, setNights] = useState(trip && trip.start && trip.end
    ? Math.max(1, Math.round((new Date(trip.end) - new Date(trip.start)) / 86400000)) : 6);
  const [days, setDays] = useState([]);
  const [notes, setNotes] = useState([]);
  const [engineErr, setEngineErr] = useState(null);
  const [touches, setTouches] = useState([]);
  const [chosenTouches, setChosenTouches] = useState([]);
  const [newTouch, setNewTouch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // the operator's own touches
  const loadTouches = async () => {
    if (!CLOUD) return;
    const { data } = await supabase.from("library_items").select("*")
      .eq("operator_id", user.talentId).order("times_used", { ascending: false });
    setTouches(data || []);
  };
  useEffect(() => { loadTouches(); }, []);

  const startAsk = () => {
    const DP = drukPahOf();
    // The brain alone is enough to draft. If only the question flow is missing,
    // fall through to the text route rather than blocking the whole feature.
    if (!DP && brainOf()) { setMode("text"); setEngineErr(null); return; }
    if (!DP) { setEngineErr("The question flow could not start. " + engineDiag()); return; }
    const sn = DP.session();
    setSess(sn); setQ(sn.current()); setMode("ask"); setEngineErr(null);
  };
  useEffect(() => { startAsk(); }, []);

  const planToDays = (plan) => {
    const IB = brainOf();
    return (plan.days || []).map((d, i) => {
      const valley = (IB && IB.data.VAL[d.v] && IB.data.VAL[d.v].n) || d.v || "";
      const acts = (d.acts || []).map((a) => a.n).filter(Boolean);
      const drive = d.driveH ? `About ${d.driveH} hour${d.driveH === 1 ? "" : "s"} on the road. ` : "";
      const fest = d.fest ? `${d.fest.n} is on. ` : "";
      return {
        title: i === 0 ? `Arrive ${valley}` : valley,
        detail: (drive + fest + (acts.length ? acts.join(". ") + "." : "A day in " + valley + ".")).trim(),
      };
    });
  };

  const runEngine = (phrase, opts) => {
    const IB = brainOf();
    if (!IB) { setEngineErr("The trip engine could not be read. " + engineDiag()); return; }
    try {
      const plan = IB.draft(phrase || "", { nights: opts.nights, diff: opts.diff || 3 });
      setDays(planToDays(plan));
      setNotes([...(plan.verdicts?.warns || []), ...(plan.verdicts?.notes || [])]);
      setMode("edit"); setEngineErr(null);
    } catch (e) {
      setEngineErr("The engine could not draft that. Try fewer days, or describe it differently.");
    }
  };

  const answer = (v) => {
    if (!sess) return;
    sess.answer(v);
    if (sess.done()) {
      try {
        const r = sess.result();
        setDays(planToDays(r.plan));
        setNotes([...(r.plan.verdicts?.warns || []), ...(r.plan.verdicts?.notes || [])]);
        setMode("edit");
      } catch (e) { setEngineErr("The engine could not finish that. Try the text option instead."); }
    } else {
      setQ(sess.current()); setPicked([]); setCountVal("2");
    }
  };

  const addTouch = async () => {
    const name = newTouch.trim();
    if (!name || !CLOUD) return;
    await supabase.from("library_items").insert({
      operator_id: user.talentId, kind: "experience", name,
    });
    setNewTouch(""); loadTouches();
  };

  const applyTouches = () => {
    if (!chosenTouches.length || !days.length) return;
    setDays((D) => D.map((d, i) => {
      const t = chosenTouches[i % chosenTouches.length];
      if (!t || d.detail.includes(t)) return d;
      return { ...d, detail: `${d.detail} ${t}`.trim() };
    }));
  };

  const save = async () => {
    if (!trip || saving) return;
    setSaving(true); setSaveMsg(null);
    // Replace rather than append, so saving twice cannot double the itinerary.
    await supabase.from("trip_itinerary").delete().eq("trip_id", trip.id);
    const rows = days.map((d, i) => ({ trip_id: trip.id, day_no: i + 1, title: d.title || `Day ${i + 1}`, detail: d.detail || null }));
    const { error } = rows.length ? await supabase.from("trip_itinerary").insert(rows) : { error: null };
    setSaving(false);
    if (error) { setSaveMsg("Could not save. Try once more."); return; }
    for (const t of chosenTouches) {
      const it = touches.find((x) => x.name === t);
      if (it) await supabase.from("library_items").update({ times_used: (it.times_used || 0) + 1 }).eq("id", it.id);
    }
    onSaved && onSaved();
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end lg:items-center lg:justify-center" style={{ background: "rgba(8,10,8,.6)", zIndex: 244 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl lg:rounded-3xl flex flex-col safe-bottom"
        style={{ background: C.bg, maxHeight: "94dvh", maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
        <div className="pt-3 shrink-0"><div className="w-10 h-1 rounded-full mx-auto" style={{ background: C.line }} /></div>

        <div className="px-5 pt-3 pb-3 shrink-0 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
            <Compass size={18} color={C.goldSoft} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Druk Pah</div>
            <div className="text-[11.5px]" style={{ color: C.muted }}>
              Your own trip engine. No internet needed, nothing sent anywhere.
            </div>
          </div>
          <button onClick={onClose} className="tap shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: C.card, border: `1px solid ${C.line}` }}><X size={16} color={C.muted} /></button>
        </div>

        <div className="px-5 pb-6 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
          {engineErr && (
            <div className="rounded-xl px-3.5 py-3 mb-3" style={{ background: C.maroonSoft }}>
              <p className="text-[13px] leading-snug" style={{ color: C.maroon }}>{engineErr}</p>
            </div>
          )}

          {mode !== "edit" && (
            <div className="flex gap-1.5 mb-4">
              <button onClick={startAsk} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
                style={{ background: mode === "ask" ? C.pine : C.card, color: mode === "ask" ? "#fff" : C.ink, border: `1px solid ${mode === "ask" ? C.pine : C.line}` }}>
                Answer questions
              </button>
              <button onClick={() => setMode("text")} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
                style={{ background: mode === "text" ? C.pine : C.card, color: mode === "text" ? "#fff" : C.ink, border: `1px solid ${mode === "text" ? C.pine : C.line}` }}>
                Describe it in words
              </button>
            </div>
          )}

          {/* ---- the question flow ---- */}
          {mode === "ask" && q && (
            <div>
              <div className="text-[11.5px] font-semibold mb-1" style={{ color: C.gold }}>
                Question {q.progress.i} of {q.progress.n}
              </div>
              <div className="text-[18px] font-semibold leading-snug" style={{ color: C.ink }}>{q.t}</div>
              {q.sub && <p className="text-[12.5px] mt-1 mb-3 leading-snug" style={{ color: C.muted }}>{q.sub}</p>}

              {q.type === "count" ? (
                <div className="flex gap-2 items-center">
                  <input value={countVal} onChange={(e) => setCountVal(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                    inputMode="numeric" className="flex-1 h-12 px-3.5 rounded-xl text-[15px]"
                    style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                  <button onClick={() => answer(Number(countVal) || 2)} className="tap h-12 px-5 rounded-xl text-[14px] font-semibold"
                    style={{ background: C.pine, color: "#fff" }}>Next</button>
                </div>
              ) : q.type === "final" ? (
                <div>
                  {(q.groups || []).map(([label, items]) => (
                    <div key={label} className="mb-3">
                      <BLabel>{label}</BLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((it) => {
                          const on = picked.includes(it);
                          return (
                            <button key={it} onClick={() => setPicked((L) => on ? L.filter((x) => x !== it) : [...L, it])}
                              className="tap rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                              style={{ background: on ? C.pine : C.card, color: on ? "#fff" : C.ink, border: `1px solid ${on ? C.pine : C.line}` }}>{it}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => answer(picked)} className="tap w-full h-12 rounded-xl text-[15px] font-semibold mt-1"
                    style={{ background: C.pine, color: "#fff" }}>Draft the trip</button>
                </div>
              ) : (
                <div className="w-grid2">
                  {(q.o || []).map(([id, icon, label, sub]) => (
                    <button key={id} onClick={() => answer(id)}
                      className="tap w-full text-left rounded-2xl p-3.5 mb-2 flex items-start gap-3"
                      style={{ background: C.card, border: `1px solid ${C.line}` }}>
                      <span className="text-[20px] leading-none shrink-0">{icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14.5px] font-semibold" style={{ color: C.ink }}>{label}</span>
                        <span className="block text-[12px] mt-0.5" style={{ color: C.muted }}>{sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {sess && q.progress.i > 1 && (
                <button onClick={() => { sess.back(); setQ(sess.current()); }}
                  className="tap text-[13px] font-semibold mt-2" style={{ color: C.muted }}>Back</button>
              )}
            </div>
          )}

          {/* ---- free text ---- */}
          {mode === "text" && (
            <div>
              <BLabel>Describe the trip</BLabel>
              <textarea value={free} onChange={(e) => setFree(e.target.value)} rows={4}
                placeholder="A couple in October, festivals and the Tiger's Nest, she is 68, gentle pace"
                className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
              <p className="text-[11.5px] mt-1.5 leading-snug" style={{ color: C.muted }}>
                Write it as you would say it. The engine reads dates, ages, interests and places.
              </p>
              <div className="flex gap-2 items-center mt-3">
                <div className="flex-1">
                  <BLabel>Nights</BLabel>
                  <input value={nights} onChange={(e) => setNights(Number(e.target.value.replace(/[^0-9]/g, "")) || 1)}
                    inputMode="numeric" className="w-full h-12 px-3.5 rounded-xl text-[15px]"
                    style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
                <button onClick={() => runEngine(free, { nights })} className="tap h-12 px-6 rounded-xl text-[15px] font-semibold self-end"
                  style={{ background: C.pine, color: "#fff" }}>Draft it</button>
              </div>
            </div>
          )}

          {/* ---- the draft, fully editable ---- */}
          {mode === "edit" && (
            <div>
              {notes.length > 0 && (
                <div className="rounded-xl px-3.5 py-3 mb-3" style={{ background: C.goldSoft }}>
                  <div className="text-[11.5px] font-semibold tracking-[.08em] uppercase mb-1" style={{ color: "#7a5a1e" }}>
                    What the engine noticed
                  </div>
                  {notes.slice(0, 5).map((n, i) => (
                    <p key={i} className="text-[12.5px] leading-snug" style={{ color: "#7a5a1e" }}>{n}</p>
                  ))}
                </div>
              )}

              <div className="rounded-2xl p-3.5 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="text-[13px] font-semibold mb-1" style={{ color: C.ink }}>Your own touches</div>
                <p className="text-[11.5px] leading-snug mb-2" style={{ color: C.muted }}>
                  The things only you do. Pick any and they are woven through the days.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {touches.map((t) => {
                    const on = chosenTouches.includes(t.name);
                    return (
                      <button key={t.id} onClick={() => setChosenTouches((L) => on ? L.filter((x) => x !== t.name) : [...L, t.name])}
                        className="tap rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                        style={{ background: on ? C.gold : C.bg, color: on ? "#fff" : C.ink, border: `1px solid ${on ? C.gold : C.line}` }}>{t.name}</button>
                    );
                  })}
                  {touches.length === 0 && (
                    <span className="text-[12px]" style={{ color: C.muted }}>Nothing saved yet. Add your first below.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input value={newTouch} onChange={(e) => setNewTouch(e.target.value)} maxLength={120}
                    placeholder="We plant a tree in the guest's name"
                    className="flex-1 h-10 px-3 rounded-xl text-[13.5px]"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                  <button onClick={addTouch} disabled={!newTouch.trim()}
                    className="tap h-10 px-4 rounded-xl text-[13px] font-semibold"
                    style={{ background: newTouch.trim() ? C.pine : C.line, color: newTouch.trim() ? "#fff" : C.muted }}>Save</button>
                </div>
                {chosenTouches.length > 0 && (
                  <button onClick={applyTouches} className="tap w-full h-10 rounded-xl text-[13px] font-semibold mt-2"
                    style={{ background: C.goldSoft, color: "#7a5a1e" }}>
                    Weave {chosenTouches.length} touch{chosenTouches.length === 1 ? "" : "es"} into the days
                  </button>
                )}
              </div>

              {days.map((d, i) => (
                <ItineraryDayCard key={i} day={d} index={i}
                  onChange={(nd) => setDays((D) => D.map((x, k) => k === i ? nd : x))}
                  onRemove={() => setDays((D) => D.filter((_, k) => k !== i))} />
              ))}

              <button onClick={() => setDays((D) => [...D, { title: "", detail: "" }])}
                className="tap w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[13.5px] font-semibold mb-3"
                style={{ background: C.card, border: `1.5px dashed ${C.line}`, color: C.pine }}>
                <Plus size={16} /> Add a day of your own
              </button>

              {saveMsg && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{saveMsg}</p>}

              <div className="flex gap-2">
                <button onClick={() => { setMode("ask"); startAsk(); }}
                  className="tap flex-1 h-12 rounded-2xl text-[14px] font-semibold"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Start again</button>
                {trip && (
                  <button onClick={save} disabled={saving || days.length === 0}
                    className="tap flex-1 h-12 rounded-2xl text-[15px] font-semibold"
                    style={{ background: days.length ? C.pine : C.line, color: days.length ? "#fff" : C.muted }}>
                    {saving ? "Saving…" : `Save ${days.length} day${days.length === 1 ? "" : "s"} to the trip`}
                  </button>
                )}
              </div>
              {!trip && (
                <p className="text-[12px] mt-2 leading-snug text-center" style={{ color: C.muted }}>
                  Open this from a trip to save the days onto it.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}

function TripStays({ trip, isOperator }) {
  const [rows, setRows] = useState(null);
  const [pick, setPick] = useState(null);      // { night, date }

  const load = async () => {
    const { data } = await supabase.from("business_bookings").select("*")
      .eq("trip_id", trip.id).order("start_date");
    setRows(data || []);
  };
  useEffect(() => { if (CLOUD) load(); else setRows([]); }, [trip.id]);

  // One row per night the trip actually runs, so a gap is impossible to miss.
  const nights = useMemo(() => {
    if (!trip.start) return [];
    const a = new Date(trip.start + "T00:00");
    const b = new Date((trip.end || trip.start) + "T00:00");
    const out = [];
    const d = new Date(a);
    let n = 1;
    while (d < b || (n === 1 && +a === +b)) {
      out.push({ night: n, date: d.toISOString().slice(0, 10) });
      d.setDate(d.getDate() + 1); n++;
      if (n > 60) break;
    }
    return out;
  }, [trip.start, trip.end]);

  if (rows === null) return <p className="text-[13px]" style={{ color: C.muted }}>Loading…</p>;

  const bookedFor = (date) => rows.find((b) => b.status !== "cancelled" && b.status !== "declined"
    && b.start_date <= date && b.end_date > date);
  const covered = nights.filter((n) => bookedFor(n.date)).length;
  const gap = nights.length - covered;
  const cost = rows.filter((b) => b.status !== "cancelled" && b.status !== "declined")
    .reduce((n, b) => n + (Number(b.quote_amount) || 0), 0);

  if (nights.length === 0) {
    return <TripEmpty text="Set the trip dates and the nights appear here." canEdit={false} />;
  }

  return (
    <div>
      <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: gap > 0 ? C.goldSoft : C.pineSoft }}>
        <div className="text-[13.5px] font-semibold" style={{ color: gap > 0 ? "#7a5a1e" : C.pine }}>
          {covered} of {nights.length} night{nights.length === 1 ? "" : "s"} booked
          {gap > 0 ? ` · ${gap} still to arrange` : " · fully covered"}
        </div>
        {cost > 0 && (
          <div className="text-[12px] mt-0.5" style={{ color: gap > 0 ? "#7a5a1e" : C.pine, opacity: .9 }}>
            Nu {cost.toLocaleString("en-IN")} agreed so far
          </div>
        )}
      </div>

      {nights.map(({ night, date }) => {
        const b = bookedFor(date);
        const t = b ? (BK_TONE[b.status] || BK_TONE.requested) : null;
        return (
          <div key={night} className="flex items-stretch gap-2.5 mb-2">
            <div className="shrink-0 rounded-xl flex flex-col items-center justify-center"
              style={{ width: 62, background: C.card, border: `1px solid ${C.line}` }}>
              <div className="text-[10px] font-bold tracking-[.1em] uppercase" style={{ color: C.gold }}>Day {night}</div>
              <div className="text-[12.5px] font-semibold" style={{ color: C.ink }}>{fmtDate(date)}</div>
            </div>

            {b ? (
              <div className="flex-1 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 min-w-0"
                style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pineSoft }}>
                  <Store size={16} color={C.pine} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{b.business_name}</div>
                  <div className="text-[11.5px]" style={{ color: C.muted }}>
                    {b.rooms ? `${b.rooms} room${b.rooms === 1 ? "" : "s"}` : ""}
                    {b.quote_amount != null ? `${b.rooms ? " · " : ""}Nu ${Number(b.quote_amount).toLocaleString("en-IN")}` : ""}
                  </div>
                </div>
                <span className="text-[10.5px] font-semibold rounded-full px-2 py-1 shrink-0"
                  style={{ background: t.bg, color: t.fg }}>{t.label}</span>
              </div>
            ) : isOperator ? (
              <button onClick={() => setPick({ night, date })}
                className="tap flex-1 rounded-xl flex items-center justify-center gap-2 text-[13.5px] font-semibold"
                style={{ background: C.card, border: `1.5px dashed ${C.gold}`, color: "#7a5a1e", minHeight: 54 }}>
                <Plus size={17} /> Book a stay for this night
              </button>
            ) : (
              <div className="flex-1 rounded-xl flex items-center px-3.5 text-[12.5px]"
                style={{ background: C.card, border: `1px dashed ${C.line}`, color: C.muted, minHeight: 54 }}>
                Not booked yet
              </div>
            )}
          </div>
        );
      })}

      {pick && (
        <HotelPickerSheet trip={trip} night={pick.night} date={pick.date}
          operator={{ talentId: trip.operatorId, name: trip.operatorName }}
          onClose={() => setPick(null)} onBooked={load} />
      )}
    </div>
  );
}


function TripEmpty({ text, canEdit, onEdit }) {
  return (
    <div className="rounded-2xl px-4 py-5 text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
      <p className="text-[13.5px]" style={{ color: C.muted }}>{text}</p>
      {canEdit && (
        <button onClick={onEdit} className="tap text-[13px] font-semibold mt-2" style={{ color: C.pine }}>Add it now</button>
      )}
    </div>
  );
}

function TripNote({ body, tone = "pine", icon: Ic }) {
  const maroon = tone === "maroon";
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: maroon ? C.maroonSoft : C.card, border: `1px solid ${maroon ? "rgba(122,46,46,.3)" : C.line}` }}>
      {Ic && <Ic size={17} color={maroon ? C.maroon : C.gold} className="shrink-0 mt-0.5" />}
      <p className="flex-1 text-[14.5px] leading-relaxed whitespace-pre-line" style={{ color: maroon ? C.maroon : C.ink }}>{body}</p>
    </div>
  );
}

function TripDetailSheet({ trip, onClose, onSaved }) {
  const [notes, setNotes] = useState(trip.specialNotes || "");
  const [allerg, setAllerg] = useState(trip.allergies || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    if (busy) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from("trips").update({
      special_notes: notes.trim() || null,
      allergies: allerg.trim() || null,
    }).eq("id", trip.id);
    setBusy(false);
    if (error) { setErr("That did not save. Check your connection and try again."); return; }
    onSaved && onSaved();
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 232 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.bg, maxHeight: "86dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="pt-3 shrink-0"><div className="w-10 h-1 rounded-full mx-auto" style={{ background: C.line }} /></div>
        <div className="px-5 pt-3 pb-6 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
          <h2 className="text-[19px] font-semibold" style={{ color: C.ink }}>Trip details</h2>
          <p className="text-[13px] mt-1 leading-snug" style={{ color: C.muted }}>
            Everyone on this trip can read these. Write what the crew needs to know before they arrive.
          </p>

          <div className="mt-4">
            <BLabel>Special notes</BLabel>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={1200}
              placeholder="Guest is celebrating an anniversary. Slow walker. Prefers an early start."
              className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>

          <div className="mt-4">
            <BLabel>Allergies and medical</BLabel>
            <textarea value={allerg} onChange={(e) => setAllerg(e.target.value)} rows={3} maxLength={800}
              placeholder="Severe peanut allergy. Carries an EpiPen. One guest is asthmatic."
              className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none"
              style={{ background: C.card, border: `1.5px solid rgba(122,46,46,.35)`, color: C.ink }} />
            <p className="text-[11.5px] mt-1.5 leading-snug" style={{ color: C.maroon }}>
              This is shown in red to the crew. Write it exactly as the guest told you.
            </p>
          </div>

          {err && <p className="text-[13px] mt-3" style={{ color: C.maroon }}>{err}</p>}

          <button onClick={save} disabled={busy} className="tap w-full rounded-2xl text-[15.5px] font-semibold mt-5"
            style={{ height: 52, background: C.pine, color: "#fff" }}>{busy ? "Saving…" : "Save"}</button>
          <button onClick={onClose} className="tap w-full text-center text-[13.5px] font-semibold mt-3" style={{ color: C.muted }}>Cancel</button>
        </div>
      </div>
    </div>
  ), document.body);
}

function TripHub({ user, meId, trip, actions, onMessage, onBack }) {
  const state = tripStateNow(trip);
  const [inviting, setInviting] = useState(false);
  const isTripOperator = trip.operatorId === meId;
  const [detailTab, setDetailTab] = useState("itinerary");
  const [crewOpen, setCrewOpen] = useState(false);
  const [building, setBuilding] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [editDetail, setEditDetail] = useState(false);
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
  const tripDone = ["active", "wrapping", "completed"].includes(state);

  // Grading was buried inside the Contacts panel inside the chat, so it never
  // happened. Once a trip is over the operator must see it, at the top.
  const tripOver = ["wrapping", "completed"].includes(state);
  const crewToGrade = (trip.members || []).filter((m) => m.roleInTrip !== "operator");
  const gradeOf = (pid) => (tripMarks.find((k) => k.profile_id === pid && k.kind === "grade") || {}).grade || 0;
  const ungraded = crewToGrade.filter((m) => !gradeOf(m.id));
  // The guest is standing in front of you. That is the moment, and only that day.
  const todayIso = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const isLastDay = todayIso === trip.end;
  // Operators no longer ask the guest. The crew does that, and the operator confirms.
  const canApprove = user.kind === "operator" || user.kind === "admin";
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

        {canApprove && tripDone && <TripReviewApprovals trip={trip} />}

        {isTalent && state !== "scheduled" && (
          isLastDay ? (
            <button onClick={() => setInviting(true)}
              className="tap w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left"
              style={{ background: C.goldSoft, border: `1.5px solid ${C.gold}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.gold }}>
                <Star size={18} color="#fff" fill="#fff" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold" style={{ color: "#7a5a1e" }}>Ask your guest for feedback</div>
                <div className="text-[12.5px] mt-0.5 leading-snug" style={{ color: "#7a5a1e", opacity: .85 }}>
                  Today is the last day. Make the link and give it to them face to face.
                </div>
              </div>
              <ChevronLeft size={17} color="#7a5a1e" style={{ transform: "rotate(180deg)" }} />
            </button>
          ) : (
            <div className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3"
              style={{ background: C.card, border: `1px solid ${C.line}`, opacity: .75 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.bg }}>
                <Star size={18} color={C.muted} />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold" style={{ color: C.muted }}>Ask your guest for feedback</div>
                <div className="text-[12.5px] mt-0.5 leading-snug" style={{ color: C.muted }}>
                  {todayIso < trip.end
                    ? `Opens on the last day of the trip, ${fmtDate(trip.end)}.`
                    : `The last day was ${fmtDate(trip.end)}. That window has closed.`}
                </div>
              </div>
            </div>
          )
        )}

        {inviting && <ReviewInvite user={user} trip={trip} onClose={() => setInviting(false)} />}
        {editDetail && <TripDetailSheet trip={trip} onClose={() => setEditDetail(false)} onSaved={() => actions.fetchTrips && actions.fetchTrips()} />}

        {isTripOperator && (trip.members || []).some((mm) => mm.roleInTrip !== "operator") && (
          <p className="text-[11.5px] mb-2" style={{ color: C.muted }}>
            {sigs.filter((sg) => (trip.members || []).some((mm) => mm.id === sg.profile_id && mm.roleInTrip !== "operator")).length}
            /{(trip.members || []).filter((mm) => mm.roleInTrip !== "operator").length} crew have signed the tour commitment
          </p>
        )}

        {/* Itinerary | Special notes | Allergies — what the operator set for this trip */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto hidescroll" style={{ scrollbarWidth: "none" }}>
          {[["itinerary", "Itinerary"], ["stays", "Stays"], ["seats", "Window seats"], ["notes", "Special notes"], ["allergies", "Allergies"]].map(([id, label]) => {
            const on = detailTab === id;
            const filled = id === "itinerary" ? (trip.itinerary || []).length > 0 : id === "stays" || id === "seats" ? false : id === "notes" ? !!trip.specialNotes : !!trip.allergies;
            return (
              <button key={id} onClick={() => setDetailTab(id)}
                className="tap rounded-full px-3.5 h-9 text-[13px] font-semibold shrink-0 inline-flex items-center gap-1.5"
                style={{ background: on ? C.pine : C.card, color: on ? "#fff" : C.ink, border: `1px solid ${on ? C.pine : C.line}` }}>
                {label}
                {filled && <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? C.goldSoft : C.gold }} />}
              </button>
            );
          })}
        </div>

        <div className="mb-5">
          {detailTab === "itinerary" && (
            <div>
              {(trip.itinerary || []).length > 0 ? (
                <div className="space-y-2">
                  {(trip.itinerary || []).map((it) => (
                    <div key={it.day} className="rounded-xl px-4 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}><span className="text-[11.5px] font-bold" style={{ color: C.goldSoft }}>{it.day}</span></div>
                        <span className="text-[14px] font-medium" style={{ color: C.ink }}>{it.title}</span>
                      </div>
                      {it.detail && (
                        <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: C.muted, paddingLeft: 40 }}>{it.detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <TripEmpty text="No itinerary yet." canEdit={false} />
              )}

              {isTripOperator && (
                <button onClick={() => setBuilding(true)}
                  className="tap w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold mt-3"
                  style={{ background: C.card, border: `1.5px dashed ${C.gold}`, color: "#7a5a1e" }}>
                  <Plus size={17} /> {(trip.itinerary || []).length ? "Rebuild with Druk Pah" : "Build the itinerary with Druk Pah"}
                </button>
              )}

              {building && (
                <ItineraryBuilder user={user} trip={trip}
                  onClose={() => setBuilding(false)}
                  onSaved={() => actions.fetchTrips && actions.fetchTrips()} />
              )}
            </div>
          )}

          {detailTab === "stays" && <TripStays trip={trip} isOperator={isTripOperator} />}

          {detailTab === "seats" && <WindowSeats trip={trip} isOperator={isTripOperator} />}

          {detailTab === "notes" && (trip.specialNotes
            ? <TripNote tone="pine" body={trip.specialNotes} />
            : <TripEmpty text="No special notes for this trip." canEdit={isTripOperator} onEdit={() => setEditDetail(true)} />)}

          {detailTab === "allergies" && (trip.allergies
            ? <TripNote tone="maroon" body={trip.allergies} icon={AlertTriangle} />
            : <TripEmpty text="No allergies recorded." canEdit={isTripOperator} onEdit={() => setEditDetail(true)} />)}

          {isTripOperator && (detailTab === "notes" ? trip.specialNotes : detailTab === "allergies" ? trip.allergies : (trip.itinerary || []).length) ? (
            <button onClick={() => setEditDetail(true)} className="tap text-[12.5px] font-semibold mt-2.5" style={{ color: C.pine }}>Edit</button>
          ) : null}
        </div>
        {isTripOperator && tripOver && crewToGrade.length > 0 && ungraded.length > 0 && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: C.goldSoft, border: `1.5px solid ${C.gold}` }}>
            <div className="flex items-start gap-2.5">
              <Star size={17} color={C.gold} fill={C.gold} className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold" style={{ color: "#7a5a1e" }}>
                  Grade your crew
                </div>
                <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: "#7a5a1e", opacity: .9 }}>
                  This trip is finished. Your grade is the only record of how they actually worked, and it follows
                  them through their career. {ungraded.length} of {crewToGrade.length} still to do.
                </p>
              </div>
            </div>

            {ungraded.map((m) => (
              <div key={m.id} className="rounded-xl px-3.5 py-3 mt-2.5" style={{ background: C.card }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0"
                    style={{ background: C.pineDeep, color: C.goldSoft }}>{initialsOf(m.name || "?")}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{m.name}</div>
                    <div className="text-[11.5px]" style={{ color: C.muted }}>{m.roleInTrip === "driver" ? "Driver" : "Guide"}</div>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((g) => (
                    <button key={g} onClick={() => setGrade(m.id, g)} className="tap p-1" aria-label={`Grade ${g} of 5`}>
                      <Star size={26} color={C.line} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-center mt-1.5" style={{ color: C.muted }}>
                  1 = would not hire again · 5 = would hire tomorrow
                </p>
              </div>
            ))}
          </div>
        )}

        {isTripOperator && tripOver && crewToGrade.length > 0 && ungraded.length === 0 && (
          <div className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2.5" style={{ background: C.pineSoft }}>
            <Check size={15} color={C.pine} className="shrink-0" />
            <span className="text-[12.5px]" style={{ color: C.pine }}>
              All {crewToGrade.length} crew graded. Thank you — it is what makes the next operator able to trust them.
            </span>
          </div>
        )}

        {trip.guestName && (
          <div className="rounded-2xl p-3.5 mb-4 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}>
              <Users size={17} color={C.gold} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold tracking-[.1em] uppercase" style={{ color: C.gold }}>Guest</div>
              <div className="text-[14.5px] font-semibold truncate" style={{ color: C.ink }}>
                {trip.guestName}{trip.guestCountry ? `, ${trip.guestCountry}` : ""}
              </div>
              {trip.partySize ? (
                <div className="text-[12px]" style={{ color: C.muted }}>{trip.partySize} guest{trip.partySize === 1 ? "" : "s"}</div>
              ) : null}
            </div>
          </div>
        )}

        <SectionLabel trailing={["active", "wrapping"].includes(tripStateNow(trip)) ? `closes in ${tripDaysLeft(trip)}d` : undefined}>Crew chat</SectionLabel>
        {isTripOperator && (
          <button onClick={() => setDocOpen(true)}
            className="tap w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[13.5px] font-semibold mb-3"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.pine }}>
            <FileDown size={16} /> Trip document — guest copy or crew sheet
          </button>
        )}
        {docOpen && <TripDocument trip={trip} user={user} onClose={() => setDocOpen(false)} />}

        <ChannelMembers trip={trip} meId={meId} isOperator={isTripOperator}
          onMessage={onMessage} onChanged={() => actions.fetchTrips && actions.fetchTrips()} />

        {tripStateNow(trip) === "scheduled" ? (
          <div className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}><Clock size={17} color={C.gold} /></div>
            <div className="flex-1 text-[13.5px]" style={{ color: C.muted }}>
              This chat opens <b style={{ color: C.ink }}>3 days before</b> the trip starts.
            </div>
          </div>
        ) : (
          <>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            <button onClick={() => setCrewOpen((v) => !v)} className="tap w-full px-3.5 py-2.5 flex items-center gap-2"
              style={{ background: C.card, borderBottom: crewOpen ? `1px solid ${C.line}` : "none" }}>
              <div className="flex -space-x-2 shrink-0">
                {(trip.members || []).slice(0, 4).map((m) => (
                  <div key={m.id} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10.5px] font-semibold"
                    style={{ background: C.pineDeep, color: C.goldSoft, border: `1.5px solid ${C.card}` }}>{initialsOf(m.name || "?")}</div>
                ))}
              </div>
              <span className="flex-1 text-left text-[13px] font-semibold" style={{ color: C.ink }}>
                {(trip.members || []).length} in crew
              </span>
              <span className="text-[12px]" style={{ color: C.muted }}>{crewOpen ? "Hide" : "Contacts"}</span>
              <ChevronLeft size={15} color={C.muted} style={{ transform: crewOpen ? "rotate(90deg)" : "rotate(-90deg)" }} />
            </button>
            {crewOpen && <div className="px-3.5 py-3" style={{ background: C.bg }}>
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
            </div>}
          </div>
          <div className="mt-2.5">
            <Chat meId={meId} trip={trip} state={tripStateNow(trip)} actions={actions} />
          </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chat({ meId, trip, state, actions }) {
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
      <p className="text-[11.5px] leading-snug mt-2 mb-3 px-1" style={{ color: C.muted }}>
        Use this when you need someone and do not mind who. Any qualified guide or driver can apply.
        If you already know who you want, add them to the trip directly from <b>Trips</b>.
      </p>
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
            options={[["guide", `Guides (${guideApps.length})${gHired ? " ✓" : ""}`], ["driver", `Drivers (${driverApps.length})${dHired ? " ✓" : ""}`]]} />
          {(gHired || dHired) && !(gHired && dHired) && (
            <p className="text-[12px] mt-2" style={{ color: C.muted }}>{gHired ? "Guide hired — now pick the driver to complete the pair." : "Driver hired — now pick the guide to complete the pair."}</p>
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
        <p className="text-[12px] mb-4" style={{ color: C.muted }}>{role === "both" ? "One post, one trip: hire a guide–driver pair together." : "Applicants will be " + (role === "guide" ? "guides" : "drivers") + " only."}</p>

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
  if (loc.outside || !insideBhutan(loc.lat, loc.lng)) return `Outside Bhutan (${Number(loc.lat).toFixed(3)}°, ${Number(loc.lng).toFixed(3)}°)`;
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
function ProfileTabs({ cv, sections, gallery, galleryCount, jumpToCv }) {
  // sections = guide/driver split view. cv = the single Portfolio pane operators still use.
  const panes = sections && sections.length
    ? [{ label: "Posts", Icon: ImagePlus, count: galleryCount, node: gallery }, ...sections]
    : [{ label: "Posts", Icon: ImagePlus, count: galleryCount, node: gallery }, { label: "Portfolio", Icon: Award, node: cv }];
  const [tab, setTab] = useState(0);
  const licTab = Math.max(1, panes.findIndex((p) => p.holdsLicence));
  useEffect(() => { if (jumpToCv) setTab(licTab); }, [jumpToCv]);
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
    if (locked.current && Math.abs(dx) > 60) setTab((t) => Math.min(panes.length - 1, Math.max(0, t + (dx < 0 ? 1 : -1))));
    startX.current = null; locked.current = false;
  };

  const many = panes.length > 2;

  return (
    <div className="mt-5">
      {/* tab bar — scrolls sideways once there are more than two */}
      <div className={`relative flex ${many ? "overflow-x-auto hidescroll" : ""}`}
        style={{ borderBottom: `1px solid ${C.line}`, background: C.bg, scrollbarWidth: "none" }}>
        {panes.map((x, i) => {
          const on = tab === i;
          return (
            <button key={x.label} onClick={() => setTab(i)}
              className={`tap pb-2.5 flex items-center justify-center gap-1.5 ${many ? "px-3.5 shrink-0" : "flex-1"}`}
              style={many ? { borderBottom: `2.5px solid ${on ? C.pine : "transparent"}` } : undefined}>
              <x.Icon size={16} color={on ? C.pine : C.muted} strokeWidth={on ? 2.4 : 2} />
              <span className="text-[14px] font-semibold whitespace-nowrap" style={{ color: on ? C.pine : C.muted }}>{x.label}</span>
              {x.count > 0 && <span className="text-[11px] font-bold rounded-full px-1.5 py-0.5" style={{ background: on ? C.pine : C.lineSoft, color: on ? "#fff" : C.muted }}>{x.count}</span>}
            </button>
          );
        })}
        {!many && (
          <div className="absolute bottom-0 h-[2.5px] rounded-full"
            style={{ background: C.pine, width: "50%", left: tab === 0 ? "0%" : "50%", transition: "left .28s cubic-bezier(.22,.61,.36,1)" }} />
        )}
      </div>

      {/* panes — only the active one is rendered, so taps always hit the right thing */}
      <div className="overflow-hidden" onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
        <div key={tab} className="pt-4 fade">{panes[tab] ? panes[tab].node : null}</div>
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
          const bg = mark === "booked" ? C.pine : mark === "blocked" ? "#AEB9AE" : mark === "pending" ? C.gold : mark === "picked" ? C.gold : C.bg;
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
  const [quoting, setQuoting] = useState(null);
  const [qAmt, setQAmt] = useState("");
  const [qNote, setQNote] = useState("");
  const sendQuote = async (id) => {
    if (!qAmt) return;
    setBusyId(id);
    const { error } = await supabase.from("business_bookings").update({
      status: "quoted", quote_amount: Number(qAmt), quote_note: qNote.trim() || null,
      quoted_by: user.talentId, quoted_at: new Date().toISOString(),
    }).eq("id", id);
    setBusyId(null);
    if (!error) { setQuoting(null); setQAmt(""); setQNote(""); load(); }
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
            {b.quote_amount != null && (
              <div className="rounded-xl px-3.5 py-2.5 mt-3" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                <span className="text-[18px] font-semibold" style={{ color: C.ink }}>Nu {Number(b.quote_amount).toLocaleString("en-IN")}</span>
                <span className="text-[11.5px] ml-2" style={{ color: C.muted }}>you offered · waiting for them</span>
              </div>
            )}
            {quoting === b.id ? (
              <div className="rounded-xl p-3 mt-3" style={{ background: C.bg, border: `1px solid ${C.gold}` }}>
                <BLabel>Your price for the whole stay (Nu)</BLabel>
                <input value={qAmt} onChange={(e) => setQAmt(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal"
                  placeholder="12000" className="w-full h-11 px-3 rounded-xl text-[15px] mb-2"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                <input value={qNote} onChange={(e) => setQNote(e.target.value)} maxLength={140}
                  placeholder="What it includes (optional)" className="w-full h-11 px-3 rounded-xl text-[14px]"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
                <div className="flex gap-2 mt-2.5">
                  <button disabled={busyId === b.id || !qAmt} onClick={() => sendQuote(b.id)}
                    className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold" style={{ background: C.gold, color: "#fff" }}>Send this price</button>
                  <button onClick={() => setQuoting(null)} className="tap h-11 px-4 rounded-xl text-[14px] font-semibold"
                    style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-3.5">
                <button disabled={busyId === b.id} onClick={() => setStatus(b.id, "confirmed")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold" style={{ background: C.pine, color: "#fff" }}>Confirm</button>
                <button disabled={busyId === b.id} onClick={() => { setQuoting(b.id); setQAmt(b.quote_amount ? String(b.quote_amount) : ""); setQNote(b.quote_note || ""); }}
                  className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold" style={{ background: C.goldSoft, color: "#7a5a1e" }}>Send a price</button>
                <button disabled={busyId === b.id} onClick={() => setStatus(b.id, "declined")} className="tap h-11 px-4 rounded-xl text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>Decline</button>
              </div>
            )}
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
/* ---- What a stay actually looks like, and roughly what it costs. ---- */
function StayPhotos({ profileId, canEdit }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [big, setBig] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    const { data } = await supabase.from("business_photos").select("*")
      .eq("profile_id", profileId).order("sort").order("created_at");
    setRows(data || []);
  };
  useEffect(() => { if (CLOUD) load(); else setRows([]); }, [profileId]);

  const add = async (file) => {
    if (!file || busy) return;
    setBusy(true); setErr(null);
    try {
      const reader = new FileReader();
      const dataUri = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result);
        reader.onerror = () => rej(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const small = await shrinkImage(dataUri, 1400, 0.82);
      const blob = dataUriToBlob(small);
      const path = `stay/${profileId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: upErr } = await supabase.storage.from("post-media").upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const url = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from("business_photos").insert({
        profile_id: profileId, path: url, sort: (rows || []).length,
      });
      if (error) throw error;
      load();
    } catch (e) {
      setErr("That photo did not upload. Try a smaller one, or check your connection.");
    }
    setBusy(false);
  };

  const remove = async (id) => {
    await supabase.from("business_photos").delete().eq("id", id);
    load();
  };

  if (rows === null) return null;
  if (rows.length === 0 && !canEdit) return null;

  return (
    <div className="mt-6">
      <SectionLabel trailing={rows.length ? `${rows.length}` : undefined}>Rooms and the place</SectionLabel>

      {rows.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hidescroll pb-1" style={{ scrollbarWidth: "none" }}>
          {rows.map((p) => (
            <div key={p.id} className="relative shrink-0">
              <button onClick={() => setBig(p.path)} className="tap block rounded-xl overflow-hidden"
                style={{ width: 168, height: 118, background: C.lineSoft }}>
                <img src={p.path} alt="" loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
              {canEdit && (
                <button onClick={() => remove(p.id)}
                  className="tap absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(8,10,8,.6)" }} aria-label="Remove photo">
                  <X size={14} color="#fff" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; add(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="tap w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[13.5px] font-semibold mt-2"
            style={{ background: C.card, border: `1.5px dashed ${C.line}`, color: C.pine }}>
            <Camera size={16} /> {busy ? "Uploading…" : rows.length ? "Add another photo" : "Add your first room photo"}
          </button>
          {err && <p className="text-[12.5px] mt-2" style={{ color: C.maroon }}>{err}</p>}
          {rows.length === 0 && (
            <p className="text-[11.5px] mt-1.5 leading-snug" style={{ color: C.muted }}>
              Operators choose stops from these. A room, the view, the dining room — three or four is plenty.
            </p>
          )}
        </>
      )}

      {big && createPortal((
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(8,10,8,.92)", zIndex: 260 }}
          onClick={() => setBig(null)}>
          <img src={big} alt="" style={{ maxWidth: "96%", maxHeight: "86%", objectFit: "contain" }} />
        </div>
      ), document.body)}
    </div>
  );
}

function StayRates({ talent, canEdit, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [lo, setLo] = useState(talent.rateLow != null ? String(talent.rateLow) : "");
  const [hi, setHi] = useState(talent.rateHigh != null ? String(talent.rateHigh) : "");
  const [note, setNote] = useState(talent.rateNote || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await supabase.from("profiles").update({
      rate_low: lo ? Number(lo) : null,
      rate_high: hi ? Number(hi) : null,
      rate_note: note.trim() || null,
    }).eq("id", talent.id);
    setBusy(false); setEditing(false);
    onSaved && onSaved();
  };

  const has = talent.rateLow != null || talent.rateHigh != null;
  if (!has && !canEdit) return null;

  return (
    <div className="mt-5">
      <SectionLabel>Indicative rate</SectionLabel>
      {editing ? (
        <div className="rounded-2xl p-3.5" style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
          <div className="flex gap-2">
            <div className="flex-1">
              <BLabel>From (Nu)</BLabel>
              <input value={lo} onChange={(e) => setLo(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric"
                className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
            <div className="flex-1">
              <BLabel>To (Nu)</BLabel>
              <input value={hi} onChange={(e) => setHi(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric"
                className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
          </div>
          <BLabel>What it depends on</BLabel>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={70}
            placeholder="per room per night, low to high season"
            className="w-full h-11 px-3 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <button onClick={save} disabled={busy} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-3"
            style={{ background: C.pine, color: "#fff" }}>{busy ? "Saving…" : "Save"}</button>
          <button onClick={() => setEditing(false)} className="tap w-full text-[13px] font-semibold mt-2" style={{ color: C.muted }}>Cancel</button>
        </div>
      ) : (
        <div className="rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {has ? (
            <>
              <div className="text-[18px] font-semibold" style={{ color: C.ink }}>
                Nu {Number(talent.rateLow || 0).toLocaleString("en-IN")}
                {talent.rateHigh ? ` – ${Number(talent.rateHigh).toLocaleString("en-IN")}` : ""}
              </div>
              <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>
                {talent.rateNote || "per room per night"}
              </div>
            </>
          ) : (
            <p className="text-[13px]" style={{ color: C.muted }}>No rate shown yet.</p>
          )}
          <p className="text-[11.5px] mt-2 leading-snug" style={{ color: C.muted }}>
            A guide, not a quote. Send the dates and the hotel replies with a real price.
          </p>
          {canEdit && (
            <button onClick={() => setEditing(true)} className="tap text-[12.5px] font-semibold mt-2" style={{ color: C.pine }}>
              {has ? "Change it" : "Add an indicative rate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BusinessAvailability({ business, viewer, trips }) {
  // Which trip is this stay for? Optional: rooms can be held before a trip exists.
  const [forTrip, setForTrip] = useState("");
  const [rooms, setRooms] = useState("");
  const myTrips = (trips || []).filter((t) => t.operatorId === viewer?.talentId
    && tripStateNow(t) !== "completed");
  const tripById = (id) => myTrips.find((t) => t.id === id) || null;

  // Picking the trip fills in its dates and party size. One action, not four,
  // and the stay then matches the trip exactly instead of being retyped.
  const pickTrip = (id) => {
    setForTrip(id);
    const t = tripById(id);
    if (!t) return;
    setStart(t.start || "");
    setEnd(t.end || t.start || "");
    if (t.partySize) setGuests(String(t.partySize));
  };

  // If the dates are then changed by hand, say so rather than silently mismatching.
  const chosen = tripById(forTrip);
  const outsideTrip = chosen && start && end &&
    (start < chosen.start || end > (chosen.end || chosen.start));
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
    const clash = rows.find((b) => ["confirmed", "blocked"].includes(b.status) && b.start_date <= end && b.end_date >= start);
    if (clash) { setMsg("Those days are already taken. Pick days that are free on the calendar above."); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("business_bookings").insert({
      business_id: business.id, operator_id: viewer.talentId,
      business_name: business.name, operator_name: viewer.name,
      start_date: start, end_date: end,
      guests: guests ? Number(guests) : null, rooms: rooms ? Number(rooms) : null,
      note: note.trim() || null, status: "requested",
      trip_id: forTrip || null,
    });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setStart(""); setEnd(""); setGuests(""); setRooms(""); setNote("");
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
          <div className="flex gap-2">
            <div className="flex-1">
              <BLabel>Rooms</BLabel>
              <input value={rooms} onChange={(e) => setRooms(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))} inputMode="numeric" placeholder="2"
                className="w-full h-12 px-3.5 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
            <div className="flex-1">
              <BLabel>Guests</BLabel>
              <input value={guests} onChange={(e) => setGuests(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} inputMode="numeric" placeholder="How many people?"
                className="w-full h-12 px-3.5 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
          </div>
          <p className="text-[11.5px] mt-1 mb-3 leading-snug" style={{ color: C.muted }}>
            Four guests can be two twins or four singles. Saying the room count stops that guess.
          </p>
          <BLabel>Note</BLabel>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={200} placeholder="Group details, arrival time, rooms needed…"
            className="w-full px-3.5 py-3 rounded-xl text-[15px] resize-none mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          {myTrips.length > 0 && (
            <>
              <BLabel>Which trip is this for?</BLabel>
              <select value={forTrip} onChange={(e) => pickTrip(e.target.value)}
                className="w-full h-12 px-3 rounded-xl text-[14.5px] mb-1"
                style={{ background: C.bg, border: `1px solid ${C.line}`, color: forTrip ? C.ink : C.muted }}>
                <option value="">Not for a trip yet</option>
                {myTrips.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} · {fmtDate(t.start)}</option>
                ))}
              </select>
              <p className="text-[11.5px] mb-2 leading-snug" style={{ color: C.muted }}>
                {chosen
                  ? `Dates filled in from ${chosen.title}. Change them if the guests arrive a night early or stay on.`
                  : "Pick a trip and its dates fill in automatically. Leave it blank if the trip is not confirmed yet."}
              </p>
              {outsideTrip && (
                <div className="rounded-xl px-3 py-2 mb-3 flex items-start gap-2" style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
                  <AlertTriangle size={14} color={C.gold} className="shrink-0 mt-0.5" />
                  <span className="text-[11.5px] leading-snug" style={{ color: "#7a5a1e" }}>
                    These nights fall outside {chosen.title} ({fmtRange(chosen.start, chosen.end || chosen.start)}).
                    That is fine if it is deliberate.
                  </span>
                </div>
              )}
            </>
          )}
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
const ONB_BUSINESS = ["Hotel", "Farmstay / Homestay", "Boutique & Handicrafts", "Restaurant / Café", "Wellness & Spa", "Textiles & Art"];

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

/* Catch a mistyped email domain before the code is sent to nowhere.
   Sonam typed "gamil.com" and lost his account: the address was valid, the
   domain simply does not exist. Format checks cannot catch that. */
const COMMON_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "live.com", "protonmail.com", "proton.me", "aol.com", "msn.com",
  "yahoo.co.in", "rediffmail.com", "ymail.com",
  "druknet.bt", "gov.bt", "edu.bt",           // Bhutan
];

/* Damerau-Levenshtein: counts a swap of two adjacent letters as ONE edit.
   Plain Levenshtein scores "gamil" vs "gmail" as 2 and misses the single most
   common typing mistake there is. */
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);   // transposition
      }
    }
  }
  return d[m][n];
}

/* Returns a corrected address to suggest, or null if it looks fine. */
function suggestEmail(raw) {
  const v = String(raw || "").trim().toLowerCase();
  const at = v.lastIndexOf("@");
  if (at < 1 || at === v.length - 1) return null;
  const local = v.slice(0, at);
  let domain = v.slice(at + 1);

  if (!domain.includes(".")) return null;      // too broken to guess
  if (COMMON_DOMAINS.includes(domain)) return null;   // already fine

  // a near miss on a common domain: gamil.com, gmial.com, hotmial.com
  let best = null, bestD = 99;
  for (const d of COMMON_DOMAINS) {
    const dist = editDistance(domain, d);
    if (dist < bestD) { bestD = dist; best = d; }
  }
  // allow 1 edit on short domains, 2 on longer ones
  const limit = best && best.length > 9 ? 2 : 1;
  if (best && bestD > 0 && bestD <= limit) return `${local}@${best}`;

  // common TLD slips that are not near any known domain
  const tldFix = { ".con": ".com", ".cmo": ".com", ".ocm": ".com", ".comm": ".com", ".co": ".com" };
  for (const [bad, good] of Object.entries(tldFix)) {
    if (domain.endsWith(bad) && !COMMON_DOMAINS.includes(domain)) {
      const fixed = domain.slice(0, -bad.length) + good;
      if (COMMON_DOMAINS.includes(fixed)) return `${local}@${fixed}`;
    }
  }
  return null;
}

function Onboard({ mode: initialMode, session, presetRole, onBack, onDone }) {
  const [mode, setMode] = useState(initialMode);
  const signin = mode === "signin";
  const [step, setStep] = useState(signin ? "auth" : presetRole ? "about" : "role");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [uid, setUid] = useState(session?.user?.id || null);
  const [role, setRole] = useState(presetRole || null);
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
  const emailFix = useMemo(() => suggestEmail(email), [email]);
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
    if (presetRole && step === "about") { onBack(); return; }
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
              points: ["A verified page tour operators can find", "Share rooms, products and offers on the feed", "Direct messages from every tour passing through"] },
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
            <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={3} maxLength={220} placeholder={role === "business" ? "Rooms, products, opening hours — what should visiting tours know?" : "Routes you run, group sizes, what you value."}
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
          {emailFix && (
            <button onClick={() => setEmail(emailFix)}
              className="tap w-full rounded-xl px-3.5 py-2.5 mt-2 flex items-start gap-2 text-left"
              style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
              <AlertTriangle size={15} color={C.gold} className="shrink-0 mt-0.5" />
              <span className="text-[13px] leading-snug" style={{ color: "#7a5a1e" }}>
                Did you mean <b>{emailFix}</b>? Tap to use it.
              </span>
            </button>
          )}
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
function ChatsTab({ user, me, dm, trips, posts, dirTick, onOpenPost, openWith, onOpened, onOpenProfile }) {
  const [withId, setWithId] = useState(openWith || null);
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

  if (withId) return <DmThread me={me} otherId={withId} dm={dm} posts={posts} onOpenPost={onOpenPost} onBack={() => setWithId(null)} onOpenProfile={onOpenProfile} />;
  if (find) return <PickContact me={me} dirTick={dirTick} onPick={(id) => { setFind(false); setWithId(id); }} onBack={() => setFind(false)} />;

  return (
    <div className="px-5 py-4 w-read">
      {/* Trip chats now live inside each trip. This tab is people, not trips. */}
      {myTrips.some((tr) => ["active", "wrapping"].includes(tripStateNow(tr))) && (
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3" style={{ background: C.pineSoft }}>
          <MessageSquare size={16} color={C.pine} className="shrink-0" />
          <span className="flex-1 text-[12.5px] leading-snug" style={{ color: C.pine }}>
            Crew chat for a trip is inside the trip itself, under <b>Trips</b>.
          </span>
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
    if (!handleValid) { setErr("Handles are 3–20 characters: letters, numbers, dots or underscores."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("profiles").update({
      pitch: bio.trim() || null,
      full_name: name.trim(),
      handle: handleClean || null,
    }).eq("id", talent.id);
    setBusy(false);
    if (error) {
      setErr(error.code === "23505" || /handle/i.test(error.message || "")
        ? "That handle is already taken — try another."
        : (error.message || "Couldn't save — try again."));
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
          A unique short name people can search you by — letters, numbers, dots, underscores.
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
            Your years of experience are read straight from your Department of Tourism licence number — no separate
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

function TalentAvailability({ talent, onSet, viewerOnly = false, onRequestDates }) {
  const now = new Date();
  const [pick, setPick] = useState({ start: null, end: null });
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
    if (pick.start) eachBookedDay(pick.start, pick.end || pick.start).forEach((d) => { if (!m[d]) m[d] = "picked"; });
    return m;
  }, [blocks, pick]);

  // The operator taps the same grid the guide uses, but here it builds a request.
  const pickDay = (iso, mark) => {
    if (mark === "booked" || mark === "blocked") return;          // never offer a day they said is taken
    setPick((p) => {
      if (!p.start || (p.start && p.end)) return { start: iso, end: null };
      if (iso < p.start) return { start: iso, end: p.start };
      return { start: p.start, end: iso };
    });
  };
  const pickedDays = pick.start ? eachBookedDay(pick.start, pick.end || pick.start).length : 0;
  const prettyRange = () => {
    if (!pick.start) return "";
    const f = (d) => new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return pick.end && pick.end !== pick.start ? `${f(pick.start)} to ${f(pick.end)}` : f(pick.start);
  };

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
                onDay={viewerOnly && onRequestDates ? pickDay : null} />
              <div className="text-[12px] font-semibold mt-2" style={{ color: C.pine }}>
                {monthName}: {openDays} open day{openDays === 1 ? "" : "s"} — {viewerOnly ? "tap the days you need" : "your opportunities"}
              </div>

              {viewerOnly && onRequestDates && (
                pick.start ? (
                  <div className="rounded-2xl p-3.5 mt-3" style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} color={C.gold} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{prettyRange()}</div>
                        <div className="text-[11.5px]" style={{ color: C.muted }}>
                          {pickedDays} day{pickedDays === 1 ? "" : "s"}{pick.end ? "" : " · tap another day for a range"}
                        </div>
                      </div>
                      <button onClick={() => setPick({ start: null, end: null })}
                        className="tap text-[12px] font-semibold shrink-0" style={{ color: C.muted }}>Clear</button>
                    </div>
                    <button onClick={() => onRequestDates(pick.start, pick.end || pick.start)}
                      className="tap w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold mt-3"
                      style={{ background: C.pine, color: "#fff" }}>
                      <Send size={15} /> Send job request for these days
                    </button>
                  </div>
                ) : (
                  <p className="text-[12px] mt-2.5 leading-snug" style={{ color: C.muted }}>
                    Tap a day to start, then tap another for a range. Days they marked busy cannot be chosen.
                  </p>
                )
              )}

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
            <p className="text-[13px] mt-0.5 leading-snug" style={{ color: C.muted }}>
              Job alerts · works on weak signal · opens full-screen{ios ? " — on iPhone, alerts only work once installed" : ""}.
            </p>
          </div>
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


/* ============================ First-run tutorial ========================== */
function Tutorial({ user, nav, setTab, onDone }) {
  const [i, setI] = useState(0);
  const talent = user.kind === "guide" || user.kind === "driver";
  const first = (user.name || "").split(" ")[0];

  // steps point at real tabs; tabIndex tells the highlight which nav item to ring
  const steps = talent
    ? [
        { kind: "intro", title: `Welcome, ${first}`, body: "You are one of the first here. One minute and you will know your way around." },
        { kind: "tab", tab: "post", title: "Feed", body: "Photos from your trips, pinned to the place you took them. This is how operators see the work you have actually done." },
        { kind: "tab", tab: "trips", title: "Trips", body: "Jobs you can apply for, and every trip you are hired on. Live trips, upcoming ones, and a record of the past." },
        { kind: "tab", tab: "chats", title: "Messages", body: "Direct messages with operators. The crew chat for a trip lives inside the trip itself." },
        { kind: "tab", tab: "profile", title: "Your profile", body: "Reviews, skills, free days and your record, each on its own tab. Mark the days you are busy so operators stop calling you on the wrong dates." },
        { kind: "top", title: "Alerts", body: "Tap the bell for job offers, trip reminders and licence warnings. We also send these to your phone." },
        { kind: "outro", title: "One last thing", body: user.licenseStatus === "submitted"
            ? "Your licence is with our review team. Everything works meanwhile — your Verified badge appears once it clears."
            : "Add your licence from your profile to get the Verified badge. Operators prioritise verified guides and drivers." },
      ]
    : user.kind === "business"
    ? [
        { kind: "intro", title: `Welcome, ${first}`, body: "You're one of the first businesses on the hub. A quick tour of your new page." },
        { kind: "tab", tab: "post", title: "Your Feed", body: "Post your rooms, products and offers — every guide and operator on the hub sees this feed." },
        { kind: "tab", tab: "bookings", title: "Bookings", body: "Your live calendar. Tap a day to close it, confirm requests, or send back a price. Operators see the same calendar before they ask." },
        { kind: "tab", tab: "discover", title: "Discover", body: "Browse verified guides, drivers and fellow businesses across Bhutan." },
        { kind: "tab", tab: "chats", title: "Messages", body: "Tour operators message you here to plan stays, and send booking requests. The guide bringing a group can reach you too." },
        { kind: "tab", tab: "profile", title: "Your Page", body: "Photos, what you offer, and your location — this is what passing tours see." },
        { kind: "top", title: "Search & alerts", body: "Search anyone by name, and tap the bell for messages and follows." },
        { kind: "outro", title: "One last thing", body: user.licenseStatus === "submitted"
            ? "Your trade licence is with our review team. Everything works meanwhile — your Verified badge appears once it clears."
            : "Add your trade licence from your profile to get the Verified badge. Tours trust verified businesses." },
      ]
    : [
        { kind: "intro", title: `Welcome, ${first}`, body: "One minute and you can build your first trip." },
        { kind: "tab", tab: "post", title: "Feed", body: "What guides, drivers and hotels are posting. A good way to spot people worth booking." },
        { kind: "tab", tab: "trips", title: "Trips", body: "Tap New trip to set the dates, notes and allergies, then pick your crew. Live, Upcoming and Past keep the year in order." },
        { kind: "tab", tab: "discover", title: "Find", body: "Every verified guide and driver. Filter by language, speciality, home town and who is free right now." },
        { kind: "tab", tab: "hotels", title: "Hotels", body: "Pick your dates on a hotel calendar and send a request. Prices come back as a card you accept or decline." },
        { kind: "tab", tab: "action", title: "Action", body: "Your messages, and enquiries you are still pricing. Keep a trip here before it is real, and turn it into one when the guest says yes." },
        { kind: "rule", title: "One trip at a time", body: "A guide or driver can never be on two trips that overlap. If someone is already booked, you will see why and you cannot pick them. That is enforced for everyone, so your crew turns up." },
        { kind: "top", title: "Alerts", body: "Tap the bell when someone applies, a hotel replies, or a guest leaves a review for you to confirm." },
        { kind: "outro", title: "You are set", body: "Build your first trip, or post a job and see who applies. Tell us what is missing — we are still building." },
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
      {/* Dimmed, but NOT tappable-to-advance: a stray tap used to skip a step
          without the person realising what they had missed. */}
      <div className="absolute inset-0" style={{ background: "rgba(8,10,8,.72)" }} />

      {/* Everything that points at the app must sit in the same centred column
          the app itself uses, or the rings land beside the nav on a wide screen. */}
      <div className="absolute inset-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-md relative">
          {navIndex >= 0 && (
            <div className="absolute" style={{ left: highlightLeft, width: highlightWidth, bottom: 0, height: 62 }}>
              <div className="absolute inset-1 rounded-2xl" style={{ border: `2.5px solid ${C.gold}`, boxShadow: `0 0 0 4px ${C.gold}33`, background: "rgba(255,255,255,.10)" }} />
            </div>
          )}
          {step.kind === "top" && (
            <div className="absolute left-2 right-2 rounded-2xl" style={{ top: 4, height: 52, border: `2.5px solid ${C.gold}`, boxShadow: `0 0 0 4px ${C.gold}33` }} />
          )}
        </div>
      </div>

      {/* card, in the same column */}
      <div className="absolute left-0 right-0 mx-auto px-5" style={{ maxWidth: 448, bottom: navIndex >= 0 ? 86 : "auto", top: step.kind === "top" ? 70 : "auto",
        ...(["intro", "outro", "rule"].includes(step.kind) ? { top: "50%", transform: "translateY(-50%)" } : {}) }}>
        <div className="rounded-2xl p-5" style={{ background: C.card, boxShadow: "0 20px 40px rgba(0,0,0,.35)" }}>
          {["intro", "outro", "rule"].includes(step.kind) && (
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
/* ---- Smart match engine. Pure, offline, deterministic. Tested in matcher.js ---- */
const LANG_WORDS = {
  dzongkha: "Dzongkha", english: "English", hindi: "Hindi", nepali: "Nepali",
  japanese: "Japanese", japan: "Japanese", nihongo: "Japanese",
  mandarin: "Mandarin", chinese: "Mandarin", china: "Mandarin",
  german: "German", deutsch: "German", germany: "German",
  french: "French", france: "French",
  spanish: "Spanish", spain: "Spanish",
  korean: "Korean", korea: "Korean",
};
const SPEC_WORDS = {
  "Culture & Dzong": ["culture", "cultural", "dzong", "temple", "monastery", "heritage", "festival", "tshechu", "history"],
  "Alpine Trekking & Camping": ["trek", "trekking", "hike", "hiking", "camp", "camping", "snowman", "druk path", "alpine", "mountain walk"],
  "Birdwatching & Wildlife": ["bird", "birds", "birding", "birdwatching", "wildlife", "nature", "crane", "takin"],
  "Spiritual & Meditation": ["spiritual", "meditation", "retreat", "buddhis", "monk", "pilgrimage", "dharma"],
  "Adventure & Outdoors": ["adventure", "raft", "rafting", "cycling", "bike", "kayak", "outdoor", "climbing"],
};
const DRIVE_WORDS = {
  "Airport transfers": ["airport", "pickup", "pick up", "transfer", "drop"],
  "Long-distance touring": ["long distance", "long-distance", "cross country", "east", "eastern", "long haul"],
  "Mountain & high passes": ["pass", "passes", "dochula", "thrumshingla", "chelela", "high altitude", "mountain road"],
  "Excursion & day trips": ["day trip", "excursion", "half day", "short trip"],
  "Off-road & trailheads": ["off road", "off-road", "trailhead", "rough road", "4x4"],
};
const VEHICLE_WORDS = {
  "Sedan": ["sedan", "car"], "SUV": ["suv", "jeep", "4wd"], "Hiace Van": ["hiace", "van"],
  "Coaster Bus": ["coaster"], "Large Coach": ["coach", "big bus", "large bus"],
};
const BIZ_WORDS = {
  "Hotel": ["hotel"], "Farmstay / Homestay": ["farmstay", "homestay", "farm stay", "home stay"],
  "Boutique & Handicrafts": ["boutique", "handicraft", "craft", "souvenir"],
  "Restaurant / Café": ["restaurant", "cafe", "café", "food", "eat"],
  "Wellness & Spa": ["spa", "wellness", "massage", "hot stone"],
  "Textiles & Art": ["textile", "weaving", "art", "painting"],
};
const TOWNS = ["Thimphu", "Paro", "Punakha", "Bumthang", "Trongsa", "Wangdue", "Haa", "Trashigang",
  "Phuentsholing", "Gelephu", "Mongar", "Jakar", "Lhuentse", "Zhemgang", "Tsirang", "Dagana",
  "Sarpang", "Chhukha", "Samdrup Jongkhar", "Pemagatshel", "Punakha"];
const TOWN_ALIAS = { phuntsholing: "Phuentsholing", phuensholing: "Phuentsholing", wangdi: "Wangdue", bumthan: "Bumthang", tashigang: "Trashigang" };

function readQuery(raw) {
  const q = " " + String(raw || "").toLowerCase().replace(/[^a-z0-9\s/-]/g, " ").replace(/\s+/g, " ") + " ";
  const has = (w) => q.includes(" " + w + " ") || q.includes(" " + w);
  const spec = { role: null, langs: [], specs: [], drives: [], vehicles: [], biz: [], towns: [], free: false, verified: false, minYears: 0 };

  if (/\b(driver|drive|chauffeur|vehicle)\b/.test(q)) spec.role = "driver";
  if (/\b(hotel|stay|room|lodge|resort|farmstay|homestay|guesthouse|accommodation)\b/.test(q)) spec.role = "business";
  if (/\b(guide|guiding)\b/.test(q)) spec.role = "guide";

  for (const [w, name] of Object.entries(LANG_WORDS)) if (has(w) && !spec.langs.includes(name)) spec.langs.push(name);
  for (const [tag, words] of Object.entries(SPEC_WORDS)) if (words.some(has)) spec.specs.push(tag);
  for (const [tag, words] of Object.entries(DRIVE_WORDS)) if (words.some(has)) spec.drives.push(tag);
  for (const [v, words] of Object.entries(VEHICLE_WORDS)) if (words.some(has)) spec.vehicles.push(v);
  for (const [b, words] of Object.entries(BIZ_WORDS)) if (words.some(has)) spec.biz.push(b);

  for (const t of TOWNS) if (has(t.toLowerCase()) && !spec.towns.includes(t)) spec.towns.push(t);
  for (const [alias, real] of Object.entries(TOWN_ALIAS)) if (has(alias) && !spec.towns.includes(real)) spec.towns.push(real);

  if (/\b(free|available|now|today|open)\b/.test(q)) spec.free = true;
  if (/\b(verified|licensed|licence|license)\b/.test(q)) spec.verified = true;

  const yrs = q.match(/(\d+)\s*(\+)?\s*(years|year|yrs|yr)/);
  if (yrs) spec.minYears = parseInt(yrs[1], 10);
  else if (/\b(experienced|senior|veteran|expert|seasoned)\b/.test(q)) spec.minYears = 5;

  // vehicle or drive words imply a driver unless a guide was named outright
  if (!spec.role && (spec.vehicles.length || spec.drives.length)) spec.role = "driver";
  if (!spec.role && spec.biz.length) spec.role = "business";
  return spec;
}

function langNames(p) {
  return (p.languages || []).map((l) => (typeof l === "string" ? l : l && l.n) || "").filter(Boolean);
}

function scoreOne(p, spec, rawWords) {
  const why = [];
  let score = 0;
  const tags = p.tags || [];

  for (const L of spec.langs) if (langNames(p).some((n) => n.toLowerCase() === L.toLowerCase())) { score += 3; why.push(L); }
  for (const t of [...spec.specs, ...spec.drives, ...spec.biz]) if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) { score += 3; why.push(t); }
  // A named vehicle is a hard requirement (you need the seats), so it outweighs
  // a category merely inferred from words like "east".
  if (spec.vehicles.length && p.vehicle && spec.vehicles.some((v) => v.toLowerCase() === String(p.vehicle).toLowerCase())) { score += 5; why.push(p.vehicle); }
  for (const t of spec.towns) if (String(p.base || "").toLowerCase().includes(t.toLowerCase())) { score += 2; why.push(t); }
  if (spec.free && p.availability === "open") { score += 2; why.push("Free now"); }
  if (spec.verified && p.verified) { score += 2; why.push("Verified"); }
  if (spec.minYears > 0 && (p.years || 0) >= spec.minYears) { score += 2; why.push(`${p.years} yrs`); }

  // leftover words still get a plain text chance against name, base, pitch, tags
  const hay = [p.name, p.base, p.pitch, tags.join(" "), langNames(p).join(" ")].join(" ").toLowerCase();
  for (const w of rawWords) if (w.length > 2 && hay.includes(w)) score += 1;

  return { score, why: [...new Set(why)] };
}

const STOP = new Set(["the","a","an","and","or","for","with","who","that","need","want","looking","find","me","my","is","are","can","speak","speaks","speaking","someone","person","please","in","on","at","to","of","i","we","us","good","best","guide","guides","driver","drivers","hotel","hotels"]);


/* How much can an operator actually rely on this person, from evidence only.
   Confidence-weighted on purpose: one 5-star review must not outrank a guide
   with years of verified work. Returns 0..10. */
function qualityScore(p) {
  let q = 0;
  if (p.verified) q += 2;
  if (String(p.licenseStatus || "") === "verified") q += 1;

  const n = p.ratingCount || 0;
  const r = p.rating || 0;
  if (n > 0) q += (r / 5) * 3 * Math.min(1, n / 4);   // needs ~4 reviews for full weight

  q += Math.min(2, (p.trips || 0) * 0.4);
  q += Math.min(2, (p.years || 0) * 0.12);
  return Math.round(q * 10) / 10;
}

/* What that score is actually built on, so nobody has to take it on faith. */
function qualityReasons(p) {
  const out = [];
  if (p.verified) out.push("licence verified");
  if ((p.ratingCount || 0) > 0) out.push(`${p.rating} from ${p.ratingCount} review${p.ratingCount === 1 ? "" : "s"}`);
  if ((p.trips || 0) > 0) out.push(`${p.trips} trip${p.trips === 1 ? "" : "s"} here`);
  if ((p.years || 0) > 0) out.push(`${p.years} yrs licensed`);
  return out;
}

function smartMatch(raw, people) {
  const spec = readQuery(raw);
  const rawWords = String(raw || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
  const anySignal = spec.langs.length || spec.specs.length || spec.drives.length || spec.vehicles.length ||
                    spec.biz.length || spec.towns.length || spec.free || spec.verified || spec.minYears > 0;

  // Asking for something is a filter, not a bonus. "free now" must not show busy people.
  let pool = people;
  if (spec.role) pool = pool.filter((p) => p.role === spec.role);
  if (spec.free) pool = pool.filter((p) => p.availability === "open");
  if (spec.verified) pool = pool.filter((p) => p.verified);
  if (spec.minYears > 0) pool = pool.filter((p) => (p.years || 0) >= spec.minYears);

  const scored = pool.map((p) => ({ p, ...scoreOne(p, spec, rawWords), quality: qualityScore(p), why2: qualityReasons(p) }))
    .filter((r) => (anySignal || rawWords.length) ? r.score > 0 : true)
    // match first, then who an operator can most rely on
    .sort((a, b) => b.score - a.score || b.quality - a.quality || (b.p.years || 0) - (a.p.years || 0));

  // Only call something the best candidate when it is genuinely ahead.
  if (scored.length > 1) {
    const a = scored[0], b = scored[1];
    a.best = (a.score > b.score) || (a.score === b.score && a.quality >= b.quality + 1);
  }

  const hints = [];
  if (scored.length === 0) {
    if (spec.role) hints.push(`No ${spec.role === "business" ? "place" : spec.role} matches everything. Try fewer words.`);
    else hints.push("Nothing matched. Try a language, a town, or a speciality.");
  } else {
    if (scored.length > 5 && !spec.langs.length) hints.push("Add a language to narrow it down.");
    if (scored.length > 5 && !spec.towns.length) hints.push("Add a town, like Paro or Thimphu.");
    if (!spec.free) hints.push("Say “free now” to see only people open for work.");
  }
  return { spec, results: scored, hints: hints.slice(0, 2) };
}

function SmartSearchSheet({ onClose, onOpenProfile }) {
  const [q, setQ] = useState("");
  const [ran, setRan] = useState(false);
  // allProfiles() already returns talents. Mapping again blanked every name to "Member".
  const people = useMemo(() => allProfiles()
    .filter((p) => ["guide", "driver", "business"].includes(p.role)), []);
  const out = useMemo(() => (ran && q.trim() ? smartMatch(q, people) : null), [ran, q, people]);

  const examples = ["German speaking bird guide", "Trekking guide in Paro, free now",
                    "Driver with a Hiace for the east", "Hotel in Punakha with a spa"];

  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: C.bg, zIndex: 260 }}>
      <div className="px-5 pt-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2.5">
          <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Close">
            <ChevronLeft size={19} color={C.ink} />
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: C.pineSoft }}>
            <Sparkles size={12} color={C.pine} />
            <span className="text-[10.5px] font-bold tracking-[.09em] uppercase" style={{ color: C.pine }}>Smart search</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <input value={q} onChange={(e) => { setQ(e.target.value); setRan(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") setRan(true); }} autoFocus maxLength={140}
            placeholder="Say what you need, in simple words"
            className="flex-1 h-12 px-4 rounded-2xl text-[15px]"
            style={{ background: C.card, border: `1.5px solid ${ran ? C.line : C.pine}`, color: C.ink }} />
          <button onClick={() => setRan(true)} disabled={!q.trim()}
            className="tap h-12 px-4 rounded-2xl text-[14.5px] font-semibold shrink-0"
            style={{ background: q.trim() ? C.pine : C.line, color: q.trim() ? "#fff" : C.muted }}>Find</button>
        </div>
        <p className="text-[11.5px] mt-2" style={{ color: C.muted }}>
          Finds guides, drivers and hotels. {people.length} people and places searched.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto hidescroll px-5 py-4" style={{ scrollbarWidth: "none" }}>
        {!out && (
          <>
            <div className="text-[11.5px] font-semibold tracking-[.14em] uppercase mb-2.5" style={{ color: C.gold }}>Try one of these</div>
            {examples.map((x) => (
              <button key={x} onClick={() => { setQ(x); setRan(true); }}
                className="tap w-full text-left rounded-xl px-4 py-3 mb-2 text-[14px]"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{x}</button>
            ))}
            <p className="text-[12.5px] leading-snug mt-4" style={{ color: C.muted }}>
              You can name a language, a town, a speciality, a vehicle, or say
              <b style={{ color: C.ink }}> free now</b> and <b style={{ color: C.ink }}> verified</b>.
            </p>
          </>
        )}

        {out && (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
                {out.results.length} match{out.results.length === 1 ? "" : "es"}
              </div>
              {out.results.length > 0 && <div className="text-[11.5px]" style={{ color: C.muted }}>best first</div>}
            </div>

            {out.results.length > 0 && (
              <p className="text-[11.5px] leading-snug mb-3" style={{ color: C.muted }}>
                Ordered by how well they match, then by what we can actually show you —
                licence, reviews and trips completed here. Early days, so that evidence is still thin.
              </p>
            )}

            {out.hints.length > 0 && (
              <div className="rounded-xl px-3.5 py-2.5 mb-3" style={{ background: C.goldSoft }}>
                {out.hints.map((h) => (
                  <div key={h} className="text-[12.5px] leading-snug" style={{ color: "#7a5a1e" }}>{h}</div>
                ))}
              </div>
            )}

            {out.results.map(({ p, why, why2, best }) => (
              <button key={p.id} onClick={() => { onClose(); onOpenProfile(p.id); }}
                className="tap w-full text-left rounded-2xl p-3.5 mb-2.5 flex items-start gap-3"
                style={{ background: C.card, border: `${best ? 1.5 : 1}px solid ${best ? C.gold : C.line}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[14px] font-semibold shrink-0"
                  style={{ background: C.pineDeep, color: C.goldSoft }}>{p.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{p.name}</span>
                    {p.verified
                      ? <BadgeCheck size={14} color={C.pine} className="shrink-0" />
                      : <span className="text-[10.5px] font-semibold shrink-0" style={{ color: C.maroon }}>not verified</span>}
                    {best && (
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ml-auto"
                        style={{ background: C.gold, color: "#fff" }}>BEST MATCH</span>
                    )}
                  </div>
                  <div className="text-[12.5px]" style={{ color: C.muted }}>
                    {roleLabel(p.role)}{p.base ? ` · ${p.base}` : ""}
                  </div>
                  {why2 && why2.length > 0 && (
                    <div className="text-[11.5px] mt-0.5" style={{ color: C.pine }}>{why2.join(" · ")}</div>
                  )}
                  {why.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {why.map((w) => (
                        <span key={w} className="text-[11px] font-medium rounded-full px-2 py-0.5"
                          style={{ background: C.pineSoft, color: C.pine }}>{w}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-[11.5px] font-semibold mt-1.5" style={{ color: C.pine }}>View full profile ›</div>
                </div>
              </button>
            ))}

            {out.results.length === 0 && (
              <div className="rounded-2xl px-4 py-6 text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
                <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>Nothing matched</div>
                <p className="text-[12.5px] mt-1" style={{ color: C.muted }}>Try fewer words, or a different language or town.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  ), document.body);
}

/* --- The guide asked. The guest answered. Only the operator can confirm it. --- */
function TripReviewApprovals({ trip }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    const { data, error } = await supabase.from("guest_reviews").select("*")
      .eq("trip_id", trip.id).order("created_at", { ascending: false });
    if (error) { setErr("Could not load reviews for this trip."); setRows([]); return; }
    setRows(data || []);
  };
  useEffect(() => { if (CLOUD) load(); else setRows([]); }, [trip.id]);

  const decide = async (r, status) => {
    setBusy(r.id); setErr(null);
    const { error } = await supabase.from("guest_reviews").update({ status }).eq("id", r.id);
    setBusy(null);
    if (error) { setErr("That did not save. Try once more."); return; }
    load();
  };

  const nameOf = (id) => (trip.members || []).find((m) => String(m.id) === String(id))?.name || "your crew";
  const waiting = (rows || []).filter((r) => r.status === "pending");
  const done = (rows || []).filter((r) => r.status !== "pending");
  if (rows && rows.length === 0) return null;

  return (
    <div className="mb-4">
      <SectionLabel trailing={waiting.length ? `${waiting.length} to confirm` : undefined}>Guest feedback</SectionLabel>

      {waiting.map((r) => (
        <div key={r.id} className="rounded-2xl p-4 mb-2.5" style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-semibold" style={{ color: C.gold }}>{"★".repeat(r.rating || 0)}</span>
            <span className="text-[12.5px]" style={{ color: C.muted }}>for {nameOf(r.talent_id)}</span>
          </div>
          {r.body && <p className="text-[14px] leading-relaxed" style={{ color: C.ink }}>{r.body}</p>}
          <div className="text-[12px] mt-2" style={{ color: C.muted }}>{r.guest_name || "Guest"}</div>

          <p className="text-[11.5px] leading-snug mt-3" style={{ color: C.muted }}>
            You ran this trip, so only you can say it really happened. Confirm it and it goes on their profile.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => decide(r, "published")} disabled={busy === r.id}
              className="tap flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[14px] font-semibold"
              style={{ background: C.pine, color: "#fff" }}>
              <Check size={16} strokeWidth={2.6} /> Confirm
            </button>
            <button onClick={() => decide(r, "hidden")} disabled={busy === r.id}
              className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>Not right</button>
          </div>
        </div>
      ))}

      {err && <p className="text-[12.5px] mb-2" style={{ color: C.maroon }}>{err}</p>}

      {done.map((r) => (
        <div key={r.id} className="rounded-xl p-3 mb-2 flex items-center gap-2.5"
          style={{ background: C.bg, border: `1px solid ${C.line}` }}>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate" style={{ color: C.ink }}>
              {nameOf(r.talent_id)} · {"★".repeat(r.rating || 0)}
            </div>
          </div>
          <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 shrink-0"
            style={{ background: r.status === "published" ? C.pineSoft : C.maroonSoft, color: r.status === "published" ? C.pine : C.maroon }}>
            {r.status === "published" ? "On their profile" : "Held back"}
          </span>
          {r.status === "hidden" && (
            <button onClick={() => decide(r, "published")} className="tap text-[11.5px] font-semibold shrink-0" style={{ color: C.pine }}>Confirm</button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------- Hotels: the operator side. Only operators see this. ------------- */
const BK_TONE = {
  requested: { label: "Waiting for the hotel", bg: C.goldSoft, fg: "#7a5a1e", dot: C.gold },
  quoted:    { label: "Price offered",         bg: C.goldSoft, fg: "#7a5a1e", dot: C.gold },
  confirmed: { label: "Booked",                bg: C.pineSoft, fg: C.pine,    dot: C.pine },
  declined:  { label: "Declined",              bg: C.maroonSoft, fg: C.maroon, dot: C.maroon },
  cancelled: { label: "Cancelled",             bg: C.maroonSoft, fg: C.maroon, dot: C.maroon },
};
const nu = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function BookingCard({ bk, hotel, meId, onAct, busy }) {
  const t = BK_TONE[bk.status] || BK_TONE.requested;
  const iQuoted = bk.quoted_by === meId;
  const mineToAnswer = bk.status === "quoted" && !iQuoted;
  const nights = Math.max(1, Math.round((new Date(bk.end_date) - new Date(bk.start_date)) / 86400000));

  return (
    <div className="rounded-2xl mb-3 overflow-hidden" style={{ background: C.card, border: `1px solid ${mineToAnswer ? C.gold : C.line}`, borderWidth: mineToAnswer ? 1.5 : 1 }}>
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="text-[15.5px] font-semibold truncate" style={{ color: C.ink }}>{hotel?.name || "Hotel"}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>
              {fmtRange(bk.start_date, bk.end_date)} · {nights} night{nights === 1 ? "" : "s"}
              {bk.rooms ? ` · ${bk.rooms} room${bk.rooms === 1 ? "" : "s"}` : ""}{bk.guests ? ` · ${bk.guests} guest${bk.guests === 1 ? "" : "s"}` : ""}
            </div>
          </div>
          <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: t.bg, color: t.fg }}>{t.label}</span>
        </div>

        {bk.note && <p className="text-[13px] leading-snug mt-2.5" style={{ color: C.ink }}>{bk.note}</p>}

        {bk.quote_amount != null && (
          <div className="rounded-xl px-3.5 py-3 mt-3" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <div className="flex items-baseline gap-2">
              <span className="text-[21px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>Nu {nu(bk.quote_amount)}</span>
              <span className="text-[11.5px]" style={{ color: C.muted }}>{iQuoted ? "you offered" : "offered by the hotel"}</span>
            </div>
            {bk.quote_note && <p className="text-[12.5px] mt-1.5 leading-snug" style={{ color: C.muted }}>{bk.quote_note}</p>}
          </div>
        )}

        {bk.status === "cancelled" && (
          <div className="rounded-xl px-3.5 py-2.5 mt-3" style={{ background: C.maroonSoft }}>
            <div className="text-[12.5px] font-semibold" style={{ color: C.maroon }}>
              Cancelled{bk.cancelled_by === meId ? " by you" : " by the hotel"}
            </div>
            {bk.cancel_reason && <p className="text-[12.5px] mt-0.5 leading-snug" style={{ color: C.maroon, opacity: .9 }}>{bk.cancel_reason}</p>}
          </div>
        )}
      </div>

      {["requested", "quoted", "confirmed"].includes(bk.status) && (
        <div className="px-4 pb-3.5 flex gap-2">
          {mineToAnswer && (
            <button onClick={() => onAct(bk, "confirmed")} disabled={busy}
              className="tap flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[14px] font-semibold"
              style={{ background: C.pine, color: "#fff" }}>
              <Check size={16} strokeWidth={2.6} /> Accept
            </button>
          )}
          {mineToAnswer && (
            <button onClick={() => onAct(bk, "declined")} disabled={busy}
              className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>Decline</button>
          )}
          {!mineToAnswer && (
            <button onClick={() => onAct(bk, "cancelled")} disabled={busy}
              className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>
              {bk.status === "confirmed" ? "Cancel this booking" : "Withdraw request"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HotelsTab({ user, onOpenProfile }) {
  const meId = user.talentId;
  const [hotels, setHotels] = useState([]);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [view, setView] = useState("live");

  const load = async () => {
    const { data } = await supabase.from("business_bookings").select("*")
      .eq("operator_id", meId).order("start_date", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => {
    if (!CLOUD || !meId) { setRows([]); return; }
    load();
    (async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, base, tags")
        .eq("role", "business").order("full_name");
      setHotels(data || []);
    })();
    const ch = supabase.channel("op-bookings-" + meId)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_bookings", filter: `operator_id=eq.${meId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [meId]);

  const act = async (bk, status) => {
    if (busy) return;
    setBusy(true); setErr(null);
    const patch = { status };
    if (status === "cancelled") { patch.cancelled_at = new Date().toISOString(); patch.cancelled_by = meId; }
    const { error } = await supabase.from("business_bookings").update(patch).eq("id", bk.id);
    setBusy(false);
    if (error) { setErr("That did not save. Check your connection and try again."); return; }
    load();
  };

  const byId = Object.fromEntries(hotels.map((h) => [h.id, { name: h.full_name, base: h.base }]));
  const all = rows || [];
  const needsMe = all.filter((b) => b.status === "quoted" && b.quoted_by !== meId);
  const live = all.filter((b) => ["requested", "quoted", "confirmed"].includes(b.status));
  const past = all.filter((b) => ["declined", "cancelled"].includes(b.status));
  const shown = view === "live" ? live : past;

  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={rows ? `${live.length} live` : undefined}>Hotels</SectionLabel>

      {needsMe.length > 0 && (
        <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
          <Bell size={17} color={C.gold} className="shrink-0" />
          <div className="flex-1 text-[13px] font-semibold" style={{ color: "#7a5a1e" }}>
            {needsMe.length} price{needsMe.length === 1 ? "" : "s"} waiting for your answer
          </div>
        </div>
      )}

      <Segmented value={view} onChange={setView}
        options={[["live", `In progress (${live.length})`], ["past", `Closed (${past.length})`]]} />

      <div className="mt-4">
        {rows === null && <p className="text-[13px]" style={{ color: C.muted }}>Loading…</p>}
        {err && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{err}</p>}

        {rows && shown.length === 0 && (
          <div className="rounded-2xl px-4 py-6 text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
            <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>
              {view === "live" ? "No hotel bookings yet" : "Nothing closed yet"}
            </div>
            <p className="text-[12.5px] mt-1 leading-snug" style={{ color: C.muted }}>
              {view === "live" ? "Open a hotel below, pick your dates, and send a request." : "Declined and cancelled bookings are kept here."}
            </p>
          </div>
        )}

        {shown.map((b) => (
          <BookingCard key={b.id} bk={b} hotel={byId[b.business_id]} meId={meId} onAct={act} busy={busy} />
        ))}
      </div>

      <div className="mt-7">
        <SectionLabel trailing={`${hotels.length}`}>Places you can book</SectionLabel>
        {hotels.length === 0 && <p className="text-[13px]" style={{ color: C.muted }}>No hotels have joined yet.</p>}
        <div className="w-grid2">
        {hotels.map((h) => (
          <button key={h.id} onClick={() => onOpenProfile(h.id)}
            className="tap w-full rounded-2xl p-3.5 mb-2 flex items-center gap-3 text-left"
            style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pineSoft }}>
              <Store size={18} color={C.pine} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-semibold truncate" style={{ color: C.ink }}>{h.full_name}</div>
              <div className="text-[12px] truncate" style={{ color: C.muted }}>{h.base || "Bhutan"}</div>
            </div>
            <ChevronLeft size={16} color={C.muted} style={{ transform: "rotate(180deg)" }} className="shrink-0" />
          </button>
        ))}
        </div>
        <p className="text-[11.5px] mt-2 leading-snug" style={{ color: C.muted }}>
          Open a place to see its calendar, pick your dates and send a request.
        </p>
      </div>
    </div>
  );
}

/* ------- Enquiries: a trip before it is real. Private to the operator. ------- */
const ENQ_STATUS = {
  open:   { label: "Open",   bg: C.goldSoft, fg: "#7a5a1e" },
  quoted: { label: "Quoted", bg: C.pineSoft, fg: C.pine },
  won:    { label: "Won",    bg: C.pineSoft, fg: C.pine },
  lost:   { label: "Lost",   bg: C.bg,       fg: C.muted },
};

function EnquiriesBoard({ user }) {
  const me = user.talentId;
  const [rows, setRows] = useState(null);
  const [building, setBuilding] = useState(null);   // the enquiry being turned into a trip
  const [pane, setPane] = useState("live");
  const [losing, setLosing] = useState(null);      // the enquiry being marked quiet
  const [editing, setEditing] = useState(null);    // the enquiry having its details filled in
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [f, setF] = useState({ guest_name: "", guest_country: "", party_size: "", start_date: "", end_date: "", note: "",
    guest_email: "", guest_phone: "", source: "", marketing_ok: false });

  const load = async () => {
    const { data, error } = await supabase.from("enquiries").select("*")
      .eq("operator_id", me).order("created_at", { ascending: false });
    if (error) { setErr("Could not load your enquiries."); setRows([]); return; }
    setRows(data || []);
  };
  useEffect(() => { if (CLOUD && me) load(); else setRows([]); }, [me]);

  const add = async () => {
    if (busy) return;
    if (!f.guest_name.trim()) { setErr("Give it a name so you can find it again."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("enquiries").insert({
      operator_id: me,
      guest_name: f.guest_name.trim(),
      guest_country: f.guest_country.trim() || null,
      party_size: f.party_size ? Number(f.party_size) : null,
      start_date: f.start_date || null,
      end_date: f.end_date || null,
      note: f.note.trim() || null,
      guest_email: f.guest_email.trim().toLowerCase() || null,
      guest_phone: f.guest_phone.trim() || null,
      source: f.source || null,
      marketing_ok: !!f.marketing_ok,
    });
    setBusy(false);
    if (error) { setErr("That did not save. Try once more."); return; }
    setF({ guest_name: "", guest_country: "", party_size: "", start_date: "", end_date: "", note: "" });
    setAdding(false); load();
  };

  const setStatus = async (id, status) => {
    await supabase.from("enquiries").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };
  const remove = async (id) => { await supabase.from("enquiries").delete().eq("id", id); load(); };

  // Still being worked: the guest has not said yes yet.
  const live = (rows || []).filter((r) => r.status === "open" || r.status === "quoted");
  // Said yes, but no trip exists yet. This is the queue that needs acting on.
  const ready = (rows || []).filter((r) => r.status === "won" && !r.trip_id);
  // Said yes and already became a trip. Kept for the record, folded away.
  const converted = (rows || []).filter((r) => r.status === "won" && r.trip_id);
  const lost = (rows || []).filter((r) => r.status === "lost");
  const shown = pane === "ready" ? ready : live;
  const fmt = (d) => { try { return new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch (e) { return d; } };

  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {[["live", "Enquiries", live.length], ["ready", "Turn into trip", ready.length], ["quiet", "Went quiet", lost.length]].map(([id, label, n]) => {
          const on = pane === id;
          const urgent = id === "ready" && n > 0;
          const faded = id === "quiet";
          return (
            <button key={id} onClick={() => setPane(id)}
              className="tap flex-1 rounded-xl flex items-center justify-center gap-1.5 text-[12.5px] font-semibold px-2"
              style={{ height: 44,
                       background: on ? (faded ? C.muted : C.pine) : C.card,
                       color: on ? "#fff" : (faded ? C.muted : C.ink),
                       opacity: !on && faded ? 0.72 : 1,
                       border: `1px solid ${on ? (faded ? C.muted : C.pine) : (urgent ? C.gold : C.line)}` }}>
              {label}
              {n > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: on ? "rgba(255,255,255,.22)" : (urgent ? C.gold : C.line),
                           color: on ? "#fff" : (urgent ? "#fff" : C.muted) }}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[12.5px] leading-snug mb-3" style={{ color: C.muted }}>
        {pane === "live"
          ? "A guest wrote to you but nothing is booked yet. No crew, no dates fixed, nobody else can see it."
          : pane === "ready"
            ? "These guests said yes. Turn each one into a trip and the guest, dates and notes carry straight over."
            : "Enquiries that never became trips. Kept so you can look back, and reopened with one tap if a guest returns."}
      </p>

      {rows === null && <p className="text-[13px]" style={{ color: C.muted }}>Loading…</p>}

      {rows && shown.length === 0 && !adding && (
        <div className="rounded-2xl px-4 py-5 text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
          <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>
            {pane === "live" ? "Nothing in progress" : "Nothing waiting to become a trip"}
          </div>
          <p className="text-[12.5px] mt-1 leading-snug" style={{ color: C.muted }}>
            {pane === "live"
              ? "Next time a guest writes to you, put it here first."
              : ready.length === 0 && live.length > 0
                ? "When a guest says yes, mark the enquiry won and it appears here."
                : "Mark an enquiry won and it moves here, ready to become a trip."}
          </p>
          {pane === "ready" && live.length > 0 && (
            <button onClick={() => setPane("live")} className="tap text-[12.5px] font-semibold mt-2" style={{ color: C.pine }}>
              Back to the {live.length} in progress
            </button>
          )}
        </div>
      )}

      <div className="w-grid2">
      {shown.map((r) => {
        const st = ENQ_STATUS[r.status] || ENQ_STATUS.open;
        return (
          <div key={r.id} className="rounded-2xl p-3.5 mb-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{r.guest_name}</div>
                <div className="text-[12.5px]" style={{ color: C.muted }}>
                  {[r.guest_country, r.party_size ? `${r.party_size} guest${r.party_size === 1 ? "" : "s"}` : null,
                    r.start_date ? (r.end_date && r.end_date !== r.start_date ? `${fmt(r.start_date)} to ${fmt(r.end_date)}` : fmt(r.start_date)) : null]
                    .filter(Boolean).join(" · ") || "No dates yet"}
                </div>
              </div>
              <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 shrink-0" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
            </div>

            {r.note && <p className="text-[13px] leading-snug mt-2" style={{ color: C.ink }}>{r.note}</p>}

            <div className="flex flex-wrap gap-1.5 mt-3">
              {r.status === "open" && (
                <button onClick={() => setStatus(r.id, "quoted")} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                  style={{ background: C.pineSoft, color: C.pine }}>I sent a price</button>
              )}
              {r.status === "quoted" && (
                <button onClick={() => setStatus(r.id, "open")} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                  style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>Back to open</button>
              )}
              {r.status !== "won" && (
                <button onClick={() => { setStatus(r.id, "won"); setPane("ready"); }} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                  style={{ background: C.pine, color: "#fff" }}>Guest said yes</button>
              )}
              <button onClick={() => setEditing(r)} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                style={{ background: (!r.guest_email || !r.source) ? C.goldSoft : C.bg,
                         border: `1px solid ${(!r.guest_email || !r.source) ? C.gold : C.line}`,
                         color: (!r.guest_email || !r.source) ? "#7a5a1e" : C.ink }}>
                {(!r.guest_email || !r.source) ? "Add details" : "Details"}
              </button>
              <button onClick={() => setLosing(r)} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1"
                style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>Went quiet</button>
            </div>

            {r.status === "won" && (r.trip_id ? (
              <p className="text-[11.5px] mt-2.5 leading-snug flex items-center gap-1.5" style={{ color: C.pine }}>
                <Check size={13} /> Trip created. It is under Trips.
              </p>
            ) : (
              <button onClick={() => setBuilding(r)}
                className="tap w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold mt-3"
                style={{ background: C.pine, color: "#fff" }}>
                <ArrowRight size={16} /> Turn this into a trip
              </button>
            ))}
          </div>
        );
      })}

      </div>

      {adding ? (
        <div className="rounded-2xl p-4 mt-2" style={{ background: C.card, border: `1.5px solid ${C.gold}` }}>
          <BLabel>Who is asking?</BLabel>
          <input value={f.guest_name} onChange={(e) => setF({ ...f, guest_name: e.target.value })} maxLength={80}
            placeholder="Name, or the agent who wrote"
            className="w-full h-11 px-3 rounded-xl text-[15px] mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

          <BLabel>Their email</BLabel>
          <input value={f.guest_email} onChange={(e) => setF({ ...f, guest_email: e.target.value.trim() })} maxLength={90}
            inputMode="email" autoCapitalize="none" placeholder="guest@example.com"
            className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          {suggestEmail(f.guest_email) && (
            <button onClick={() => setF({ ...f, guest_email: suggestEmail(f.guest_email) })}
              className="tap w-full rounded-lg px-2.5 py-1.5 mt-1.5 text-left"
              style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}>
              <span className="text-[12px]" style={{ color: "#7a5a1e" }}>Did you mean <b>{suggestEmail(f.guest_email)}</b>?</span>
            </button>
          )}

          <label className="flex items-start gap-2.5 mt-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={f.marketing_ok} onChange={(e) => setF({ ...f, marketing_ok: e.target.checked })}
              style={{ width: 18, height: 18, marginTop: 1, accentColor: C.pine }} />
            <span className="text-[12px] leading-snug" style={{ color: C.muted }}>
              They are happy to hear about future offers. Only these go on your offers list — an address
              given for a quote is not permission to market.
            </span>
          </label>

          <BLabel>How did they find you?</BLabel>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[["website", "Website"], ["referral", "Referral"], ["agent", "Agent"], ["repeat", "Repeat guest"], ["social", "Social"], ["walk_in", "Walk in"]].map(([id, label]) => (
              <button key={id} onClick={() => setF({ ...f, source: f.source === id ? "" : id })}
                className="tap rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                style={{ background: f.source === id ? C.pine : C.bg, color: f.source === id ? "#fff" : C.ink, border: `1px solid ${f.source === id ? C.pine : C.line}` }}>{label}</button>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <BLabel>Country</BLabel>
              <input value={f.guest_country} onChange={(e) => setF({ ...f, guest_country: e.target.value })} maxLength={40}
                className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
            <div style={{ width: 96 }}>
              <BLabel>Guests</BLabel>
              <input value={f.party_size} onChange={(e) => setF({ ...f, party_size: e.target.value.replace(/[^0-9]/g, "") })} maxLength={3}
                inputMode="numeric" className="w-full h-11 px-3 rounded-xl text-[15px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <BLabel>From</BLabel>
              <input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })}
                className="w-full h-11 px-3 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: f.start_date ? C.ink : C.muted }} />
            </div>
            <div className="flex-1">
              <BLabel>To</BLabel>
              <input type="date" value={f.end_date} min={f.start_date || undefined} onChange={(e) => setF({ ...f, end_date: e.target.value })}
                className="w-full h-11 px-3 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: f.end_date ? C.ink : C.muted }} />
            </div>
          </div>

          <BLabel>Anything to remember</BLabel>
          <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} rows={2} maxLength={400}
            placeholder="Wants a trekking guide. Arriving Paro."
            className="w-full px-3 py-2.5 rounded-xl text-[14.5px] resize-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

          {err && <p className="text-[12.5px] mt-2" style={{ color: C.maroon }}>{err}</p>}

          <button onClick={add} disabled={busy} className="tap w-full h-11 rounded-xl text-[14.5px] font-semibold mt-3"
            style={{ background: C.pine, color: "#fff" }}>{busy ? "Saving…" : "Keep this enquiry"}</button>
          <button onClick={() => { setAdding(false); setErr(null); }} className="tap w-full text-[13px] font-semibold mt-2.5" style={{ color: C.muted }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => { setAdding(true); setErr(null); }} className="tap w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[14.5px] font-semibold mt-2"
          style={{ background: C.card, border: `1.5px dashed ${C.line}`, color: C.pine }}>
          <Plus size={17} /> New enquiry
        </button>
      )}

      {building && (
        <NewTripSheet user={user} fromEnquiry={building}
          onClose={() => setBuilding(null)}
          onDone={() => { setBuilding(null); load(); }} />
      )}

      {pane === "ready" && converted.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setShowDone((v) => !v)} className="tap text-[12.5px] font-semibold" style={{ color: C.muted }}>
            {showDone ? "Hide" : "Show"} {converted.length} already turned into trips
          </button>
          {showDone && (
            <div className="mt-2 w-grid2">
              {converted.map((r) => (
                <div key={r.id} className="rounded-xl px-3.5 py-2.5 mb-2 flex items-center gap-2.5" style={{ background: C.pineSoft }}>
                  <Check size={15} color={C.pine} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate" style={{ color: C.pine }}>{r.guest_name}</div>
                    <div className="text-[11.5px]" style={{ color: C.pine, opacity: .8 }}>Already a trip</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && createPortal((
        <div className="fixed inset-0 flex items-end lg:items-center lg:justify-center" style={{ background: "rgba(8,10,8,.55)", zIndex: 236 }} onClick={() => setEditing(null)}>
          <div className="w-full rounded-t-3xl lg:rounded-3xl safe-bottom" style={{ background: C.bg, maxWidth: 480, maxHeight: "92dvh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="pt-3"><div className="w-10 h-1 rounded-full mx-auto" style={{ background: C.line }} /></div>
            <div className="px-5 pt-3 pb-6">
              <h3 className="text-[17px] font-semibold" style={{ color: C.ink }}>{editing.guest_name}</h3>
              <p className="text-[12.5px] mt-1 mb-3 leading-snug" style={{ color: C.muted }}>
                Fill in what you know. These are what the reports are built from.
              </p>

              <BLabel>Their email</BLabel>
              <input value={editing.guest_email || ""} onChange={(e) => setEditing({ ...editing, guest_email: e.target.value.trim() })}
                inputMode="email" autoCapitalize="none" maxLength={90} placeholder="guest@example.com"
                className="w-full h-11 px-3 rounded-xl text-[15px] mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

              <BLabel>Country</BLabel>
              <input value={editing.guest_country || ""} onChange={(e) => setEditing({ ...editing, guest_country: e.target.value })}
                maxLength={40} placeholder="Australia"
                className="w-full h-11 px-3 rounded-xl text-[15px] mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

              <BLabel>How did they find you?</BLabel>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[["website", "Website"], ["referral", "Referral"], ["agent", "Agent"], ["repeat", "Repeat guest"], ["social", "Social"], ["walk_in", "Walk in"]].map(([id, label]) => (
                  <button key={id} onClick={() => setEditing({ ...editing, source: editing.source === id ? null : id })}
                    className="tap rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                    style={{ background: editing.source === id ? C.pine : C.card, color: editing.source === id ? "#fff" : C.ink, border: `1px solid ${editing.source === id ? C.pine : C.line}` }}>{label}</button>
                ))}
              </div>

              <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
                <input type="checkbox" checked={!!editing.marketing_ok} onChange={(e) => setEditing({ ...editing, marketing_ok: e.target.checked })}
                  style={{ width: 18, height: 18, marginTop: 1, accentColor: C.pine }} />
                <span className="text-[12px] leading-snug" style={{ color: C.muted }}>
                  Happy to hear about future offers.
                </span>
              </label>

              <button onClick={async () => {
                  await supabase.from("enquiries").update({
                    guest_email: (editing.guest_email || "").trim().toLowerCase() || null,
                    guest_country: (editing.guest_country || "").trim() || null,
                    source: editing.source || null,
                    marketing_ok: !!editing.marketing_ok,
                    updated_at: new Date().toISOString(),
                  }).eq("id", editing.id);
                  setEditing(null); load();
                }}
                className="tap w-full h-12 rounded-xl text-[15px] font-semibold" style={{ background: C.pine, color: "#fff" }}>Save</button>
              <button onClick={() => setEditing(null)} className="tap w-full text-[13px] font-semibold mt-2" style={{ color: C.muted }}>Cancel</button>
            </div>
          </div>
        </div>
      ), document.body)}

      {losing && createPortal((
        <div className="fixed inset-0 flex items-end lg:items-center lg:justify-center" style={{ background: "rgba(8,10,8,.55)", zIndex: 236 }} onClick={() => setLosing(null)}>
          <div className="w-full rounded-t-3xl lg:rounded-3xl safe-bottom" style={{ background: C.bg, maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="pt-3"><div className="w-10 h-1 rounded-full mx-auto" style={{ background: C.line }} /></div>
            <div className="px-5 pt-3 pb-6">
              <h3 className="text-[17px] font-semibold" style={{ color: C.ink }}>Why did it not happen?</h3>
              <p className="text-[12.5px] mt-1 mb-3 leading-snug" style={{ color: C.muted }}>
                One tap. After a season this is what tells you where you are losing work.
              </p>
              {[["price", "Too expensive"], ["dates", "Dates did not work"], ["no_reply", "Stopped replying"],
                ["chose_other", "Went with someone else"], ["changed_plans", "Changed their plans"],
                ["visa", "Visa or permit"], ["other", "Something else"]].map(([id, label]) => (
                <button key={id} onClick={async () => {
                    await supabase.from("enquiries").update({ status: "lost", lost_reason: id }).eq("id", losing.id);
                    setLosing(null); load();
                  }}
                  className="tap w-full text-left rounded-xl px-4 py-3 mb-1.5 text-[14px] font-medium"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{label}</button>
              ))}
              <button onClick={async () => {
                  await supabase.from("enquiries").update({ status: "lost" }).eq("id", losing.id);
                  setLosing(null); load();
                }}
                className="tap w-full text-[13px] font-semibold mt-2" style={{ color: C.muted }}>
                Skip, I would rather not say
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {pane === "quiet" && lost.length === 0 && (
        <div className="rounded-2xl px-4 py-5 text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
          <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>Nothing has gone quiet</div>
          <p className="text-[12.5px] mt-1 leading-snug" style={{ color: C.muted }}>
            Enquiries you mark as quiet are kept here rather than deleted.
          </p>
        </div>
      )}

      {pane === "quiet" && lost.length > 0 && (
        <div className="w-grid2" style={{ opacity: 0.72 }}>
          {lost.map((r) => (
            <div key={r.id} className="rounded-xl p-3 mt-2 flex items-center gap-2" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium truncate" style={{ color: C.muted }}>{r.guest_name}</div>
                <div className="text-[11px] truncate" style={{ color: C.muted, opacity: .8 }}>
                  {r.guest_country ? r.guest_country + " · " : ""}
                  {r.start_date ? fmt(r.start_date) : "no dates"}
                  {r.party_size ? " · " + r.party_size + " guests" : ""}
                </div>
              </div>
              <button onClick={() => setStatus(r.id, "open")} className="tap text-[11.5px] font-semibold rounded-full px-2.5 py-1 shrink-0"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Reopen</button>
              <button onClick={() => remove(r.id)} className="tap text-[11.5px] font-semibold shrink-0" style={{ color: C.maroon }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionTab({ user, unread, onOpenMessages, onOpenTrip, onGoTab }) {
  const desktop = useIsDesktop();
  const [showReports, setShowReports] = useState(false);

  // Desktop gets the command centre. The phone keeps the simpler stacked view,
  // which is the right shape for a small screen and is untouched.
  if (desktop && user.kind === "operator") {
    return (
      <>
        <OperatorDashboard user={user} onOpenTrip={onOpenTrip} onGoTab={onGoTab} />
        <div className="px-5 pb-5">
          <EnquiriesBoard user={user} />
        </div>
      </>
    );
  }

  // On a phone there is no Reports tab in the bar, so it is reached from here.
  // An operator working from a phone must still be able to see their own year.
  if (user.kind === "operator" && showReports) {
    return (
      <div>
        <button onClick={() => setShowReports(false)}
          className="tap flex items-center gap-1.5 text-[13.5px] font-semibold px-5 pt-4"
          style={{ color: C.pine }}>
          <ChevronLeft size={16} /> Back
        </button>
        <ReportsTab user={user} />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <button onClick={onOpenMessages} className="tap w-full rounded-2xl p-3.5 mb-5 flex items-center gap-3 text-left"
        style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: unread > 0 ? C.pine : C.bg }}>
          <MessageSquare size={18} color={unread > 0 ? C.goldSoft : C.muted} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>Messages</div>
          <div className="text-[12px]" style={{ color: C.muted }}>
            {unread > 0 ? `${unread} unread` : "Guides, drivers and hotels"}
          </div>
        </div>
        {unread > 0 && <span className="text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0" style={{ background: C.maroon, color: "#fff" }}>{unread}</span>}
        <ChevronLeft size={17} color={C.muted} style={{ transform: "rotate(180deg)" }} className="shrink-0" />
      </button>

      {user.kind === "operator" && (
        <button onClick={() => setShowReports(true)}
          className="tap w-full rounded-2xl p-3.5 mb-5 flex items-center gap-3 text-left"
          style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}>
            <BarChart3 size={18} color={C.gold} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>Reports</div>
            <div className="text-[12px]" style={{ color: C.muted }}>
              Your season, why enquiries were lost, and exports for Excel
            </div>
          </div>
          <ChevronRight size={17} color={C.muted} className="shrink-0" />
        </button>
      )}
      <EnquiriesBoard user={user} />
    </div>
  );
}

/* ---------- What do you need? Asked inside the app, while it is fresh. --------- */
function FeedbackSheet({ user, onClose }) {
  const [rating, setRating] = useState(0);
  const [trouble, setTrouble] = useState("");
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  const [past, setPast] = useState(null);

  const isAdmin = user?.kind === "admin";
  useEffect(() => {
    if (!isAdmin || !CLOUD) return;
    (async () => {
      const { data } = await supabase.from("app_feedback").select("*").order("created_at", { ascending: false }).limit(60);
      setPast(data || []);
    })();
  }, [isAdmin]);

  const send = async () => {
    if (busy) return;
    if (!rating && !trouble.trim() && !wish.trim()) { setErr("Tell us one thing first, or tap Not now."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("app_feedback").insert({
      profile_id: user.talentId, role: user.kind, rating: rating || null,
      trouble: trouble.trim() || null, wish: wish.trim() || null, build: BUILD,
    });
    setBusy(false);
    if (error) { setErr("That did not send. Check your connection and try once more."); return; }
    try { localStorage.setItem("bth_feedback_sent", String(Date.now())); } catch (e) {}
    setSent(true);
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 232 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.bg, maxHeight: "86dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="pt-3 shrink-0"><div className="w-10 h-1 rounded-full mx-auto" style={{ background: C.line }} /></div>
        <div className="px-5 pt-3 pb-6 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        {sent ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: C.pineSoft }}>
              <Check size={26} color={C.pine} strokeWidth={2.6} />
            </div>
            <div className="text-[18px] font-semibold mt-3" style={{ color: C.ink }}>Thank you. This is read.</div>
            <p className="text-[14px] mt-2 leading-relaxed" style={{ color: C.muted }}>
              Every message goes straight to the people building this app. If you told us something is broken,
              it goes on the list to fix.
            </p>
            <button onClick={onClose} className="tap w-full rounded-2xl text-[15px] font-semibold mt-5"
              style={{ height: 50, background: C.pine, color: "#fff" }}>Close</button>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: C.goldSoft }}>
              <Sparkles size={13} color={C.gold} />
              <span className="text-[11px] font-bold tracking-[.08em] uppercase" style={{ color: C.gold }}>Prototype</span>
            </div>

            <h2 className="text-[21px] leading-tight font-semibold mt-3" style={{ color: C.ink }}>
              This app is still being built, around you.
            </h2>
            <p className="text-[14px] mt-2 leading-relaxed" style={{ color: C.muted }}>
              Nothing here is fixed yet. Tell us what is hard and what is missing, and we will build it.
              You are one of the first people using this.
            </p>

            <div className="mt-5">
              <BLabel>How is it so far?</BLabel>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`}
                    className="tap flex-1 rounded-xl flex items-center justify-center"
                    style={{ height: 52, background: n <= rating ? C.goldSoft : C.card, border: `1px solid ${n <= rating ? C.gold : C.line}` }}>
                    <Star size={22} color={n <= rating ? C.gold : "#C7CEC7"} fill={n <= rating ? C.gold : "none"} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <BLabel>What is hard right now?</BLabel>
              <textarea value={trouble} onChange={(e) => setTrouble(e.target.value)} rows={3} maxLength={600}
                placeholder="Something confusing, slow, or not working."
                className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>

            <div className="mt-4">
              <BLabel>What should we add?</BLabel>
              <textarea value={wish} onChange={(e) => setWish(e.target.value)} rows={3} maxLength={600}
                placeholder="Anything that would make your work easier."
                className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>

            {err && <p className="text-[13px] mt-3" style={{ color: C.maroon }}>{err}</p>}

            <button onClick={send} disabled={busy}
              className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[15.5px] font-semibold mt-5"
              style={{ height: 54, background: C.pine, color: "#fff" }}>
              <Send size={17} /> {busy ? "Sending…" : "Send to the builders"}
            </button>
            <button onClick={onClose} className="tap w-full text-center text-[13.5px] font-semibold mt-3" style={{ color: C.muted }}>
              Not now
            </button>

            {isAdmin && past && (
              <div className="mt-7">
                <SectionLabel trailing={`${past.length}`}>What people have said</SectionLabel>
                {past.length === 0 && <p className="text-[13px]" style={{ color: C.muted }}>Nothing yet.</p>}
                {past.map((f) => (
                  <div key={f.id} className="rounded-xl p-3 mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      {f.rating ? <span className="text-[12px] font-bold" style={{ color: C.gold }}>{"★".repeat(f.rating)}</span> : null}
                      <span className="text-[11.5px]" style={{ color: C.muted }}>{f.role || "user"} · {new Date(f.created_at).toLocaleDateString("en-GB")}</span>
                    </div>
                    {f.trouble && <p className="text-[13.5px] leading-snug" style={{ color: C.ink }}>Hard: {f.trouble}</p>}
                    {f.wish && <p className="text-[13.5px] leading-snug mt-1" style={{ color: C.pine }}>Wants: {f.wish}</p>}
                    {f.build && <p className="text-[10.5px] mt-1.5" style={{ color: C.line }}>{f.build}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  ), document.body);
}

function PrivacyPanel({ talent }) {
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [fb, setFb] = useState(false);
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

      <div className="px-4 py-3.5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
        <div className="text-[13.5px] font-semibold mb-2" style={{ color: C.ink }}>How this looks</div>
        <ViewSwitch compact />
      </div>

      {legacyOpen && <LegacyReviewsSheet talent={talent} onClose={() => setLegacyOpen(false)} />}
      {fb && <FeedbackSheet user={{ talentId: talent.id, kind: talent.role }} onClose={() => setFb(false)} />}
      {[
        ...(["guide", "driver"].includes(talent.role) ? [["Past trip reviews", () => setLegacyOpen(true)]] : []),
        ["Show me around the app", () => { try { window.dispatchEvent(new Event("bth-replay-tour")); } catch (e) {} }],
        ["Send feedback about the app", () => setFb(true)],
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

/* Module scope: inside EnhanceEditor this was a new component type on every
   render, so the range input was rebuilt mid-drag and the slider jumped. */
function EnhanceSlider({ label, min, max, step, value, onChange, mid }) {
  return (
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
}

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

  return createPortal((
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0b0d0b", zIndex: 248, height: "100dvh" }}>
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
        <EnhanceSlider label="Brightness" min={0.7} max={1.3} step={0.01} value={cur.bright} mid={1} onChange={(v) => setCur({ bright: v })} />
        <EnhanceSlider label="Contrast" min={0.7} max={1.4} step={0.01} value={cur.contrast} mid={1} onChange={(v) => setCur({ contrast: v })} />
        <EnhanceSlider label="Colour" min={0} max={1.8} step={0.01} value={cur.sat} mid={1} onChange={(v) => setCur({ sat: v })} />
        <EnhanceSlider label="Warmth" min={-1} max={1} step={0.01} value={cur.warmth} mid={0} onChange={(v) => setCur({ warmth: v })} />
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
  // R≈B; every surround (gold, skin, fabric) runs red-heavy. Glare bands on the
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
  // has R≈B; gold/skin/pink never do; card bodies are saturated), isolates the
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
  const [autoFound, setAutoFound] = useState(true); // did edge detection actually find a card
  const [touched, setTouched] = useState(false);    // has the user dragged at all
  const fallbackPts = useRef(null);                 // the 80%-of-frame default, to compare against

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
    setTouched(false);
    if (found) {
      setPts(found);
      setAutoFound(true);
      setNote("Card detected — drag any corner to fine-tune.");
    } else {
      // Fallback is 80% of the whole frame. Saving that stores the entire photo,
      // not the licence, so the corners must be placed by hand before scanning.
      const w = img.naturalWidth, h = img.naturalHeight, ix = w * 0.1, iy = h * 0.1;
      const fb = [[ix, iy], [w - ix, iy], [w - ix, h - iy], [ix, h - iy]];
      fallbackPts.current = fb;
      setPts(fb);
      setAutoFound(false);
      setNote("Card edges not found. Drag each corner onto the card.");
    }
  };

  const onImgLoad = () => { measure(); runAuto(); };
  const Warn = () => (!autoFound && !touched) || ratioOff ? (
    <div className="mx-3 mb-2 rounded-xl px-3 py-2.5 flex items-start gap-2"
      style={{ background: "rgba(192,135,43,.16)", border: `1px solid ${C.gold}` }}>
      <AlertTriangle size={15} color={C.gold} className="shrink-0 mt-0.5" />
      <span className="text-[12.5px] leading-snug" style={{ color: "#F3E8CF" }}>
        {blocked
          ? "We could not find the card edges. Drag each corner onto the licence, or the whole photo gets saved instead of the card."
          : "That shape does not look like a licence card. Check the corners sit on the card itself."}
      </span>
    </div>
  ) : null;
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
    setTouched(true);
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

  // Shape check: a Bhutan DOT card is about 1.586 wide to tall. Anything far from
  // that means the quad is around the photo, not the card.
  const quadRatio = () => {
    if (!pts) return 0;
    const d = (a, b) => Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
    const w = (d(0, 1) + d(3, 2)) / 2, h = (d(0, 3) + d(1, 2)) / 2;
    return h > 0 ? w / h : 0;
  };
  const ratioOff = pts ? (quadRatio() < 1.15 || quadRatio() > 2.3) : false;
  // A nudge is not a placement. A 4:3 photo has ratio 1.33, which sits inside the
  // band above, so shape alone cannot tell "whole photo" from "card". Distance can.
  const placed = (() => {
    const fb = fallbackPts.current;
    if (!pts || !fb || !imgRef.current) return touched;
    const minMove = imgRef.current.naturalWidth * 0.04;
    return pts.some((p, i) => Math.hypot(p[0] - fb[i][0], p[1] - fb[i][1]) > minMove);
  })();
  const blocked = !autoFound && !placed;

  const scan = () => {
    if (!pts || !imgRef.current || busy) return;
    if (blocked) { setNote("Place the four corners on the card first."); return; }
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
        <button onClick={scan} disabled={busy || !pts || blocked}
          className="tap h-9 px-4 rounded-full text-[14px] font-semibold inline-flex items-center gap-1.5"
          style={{ background: blocked ? C.line : C.gold, color: blocked ? C.muted : "#fff" }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <>Scan <Check size={15} strokeWidth={2.6} /></>}
        </button>
      </div>

      <Warn />

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
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0b0d0b", zIndex: 248, height: "100dvh" }}>
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
/* Defined at module scope on purpose. Declared inside GuestReview it became a
   NEW component type on every keystroke, so React tore down and rebuilt this
   subtree each time and the guest lost the field they were typing in. */
function GuestStars({ value, onChange, size = 36 }) {
  return (
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
}

/* Module scope on purpose. Declared inside a component this became a new
   component type on every render, so React destroyed the children it wraps
   and anyone typing lost the field. */
function GuestShell({ children }) {
  return (
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
}

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


  const Message = ({ Icon, title, body: b, tone }) => (
    <GuestShell>
      <div className="rounded-2xl p-6 text-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: tone === "good" ? C.pineSoft : C.goldSoft }}>
          <Icon size={26} color={tone === "good" ? C.pine : C.gold} />
        </div>
        <div className="text-[17px] font-semibold" style={{ color: C.ink }}>{title}</div>
        <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: C.muted }}>{b}</p>
      </div>
    </GuestShell>
  );

  if (state === "loading") return (
    <GuestShell><div className="flex items-center justify-center gap-2 py-16 text-[14px]" style={{ color: C.muted }}>
      <Loader2 size={18} className="animate-spin" /> Opening your review…
    </div></GuestShell>
  );

  if (state === "invalid") return <Message Icon={ShieldAlert} title="This link isn't valid"
    body="Please check the link in your message, or ask your tour operator to send a new one." />;

  if (state === "used") return <Message Icon={CheckCheck} title="This review is already submitted"
    body="Thank you — each link can only be used once. If you meant to write another review, ask your operator for a new link." tone="good" />;

  if (state === "expired") return <Message Icon={Clock} title="This link has expired"
    body="Review links stay open for 14 days. Ask your tour operator to send a new one and we'll be glad to hear from you." />;

  if (state === "done") return (
    <GuestShell>
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
    </GuestShell>
  );

  return (
    <GuestShell>
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
          <GuestStars value={ratings[m.id] || 0} onChange={(n) => { setRatings((r) => ({ ...r, [m.id]: n })); setErr(null); }} />
          <div className="text-center text-[13px] font-semibold mt-2" style={{ color: (ratings[m.id] || 0) ? C.gold : "transparent" }}>
            {[null, "Poor", "Fair", "Good", "Great", "Excellent"][ratings[m.id] || 0] || " "}
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
    </GuestShell>
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
  const isTalentIssuer = user.kind === "guide" || user.kind === "driver";
  // A guide asks about their own work. They cannot issue a review for the whole crew.
  const [subject, setSubject] = useState(
    isTalentIssuer ? meId : (crew.length > 1 ? "ALL" : (crew[0]?.id || ""))
  );

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
    if (isTalentIssuer && subject !== meId) { setErr("You can only ask for feedback about your own work."); return; }
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
      issuer_role: isAdmin ? "admin" : isTalentIssuer ? user.kind : "operator",
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
                {!isTalentIssuer && crew.length > 1 && <Chip on={subject === "ALL"} onClick={() => setSubject("ALL")}>Whole crew · one link</Chip>}
                {(isTalentIssuer ? crew.filter((m) => m.id === meId) : crew).map((m) => (
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
              {isTalentIssuer
                ? "You are asking for a review of your own work, and only your own. The guest writes it, and the operator who ran this trip confirms it before it appears on your profile."
                : "Every request is recorded against the trip, so a rating can always be traced back to real work."}
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
function GuestReviews({ talentId, isAdmin, isSelf, onCount }) {
  const [rows, setRows] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [issuers, setIssuers] = useState({});

  const restore = async (id) => {
    setBusyId(id);
    const { error } = await supabase.from("guest_reviews").update({ status: "published" }).eq("id", id);
    setBusyId(null);
    if (error) { console.error("restore review failed:", error.message); return; }
    load();
  };
  const load = async () => {
    if (!CLOUD) { setRows([]); return; }
    const { data, error } = await supabase
      .from("guest_reviews").select("*")
      .eq("talent_id", talentId).in("status", isAdmin ? ["published", "hidden"] : ["published"])
      .order("created_at", { ascending: false });
    if (error) { console.error("guest_reviews load failed:", error.message); setRows([]); return; }
    setRows(data || []);
    onCount && onCount((data || []).filter((r) => r.status === "published").length);
    const toks = [...new Set((data || []).map((r) => r.token).filter(Boolean))];
    if (toks.length) {
      const { data: T } = await supabase.from("review_tokens").select("token, issued_by").in("token", toks);
      const map = {};
      (T || []).forEach((k) => { map[k.token] = k.issued_by; });
      setIssuers(map);
    }
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
        <p className="text-[13px] leading-snug mt-1.5" style={{ color: C.muted }}>
          {isSelf
            ? "On the last day of a trip, open it and ask your guest yourself. The operator who ran that trip confirms it, then it appears here."
            : "Guest reviews appear here after a trip: the guide asks the guest, and the operator who ran it confirms."}
        </p>
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
                  {isAdmin && r.status === "hidden" && (
                    <span className="text-[10.5px] font-semibold rounded-full px-2 py-0.5" style={{ background: C.maroonSoft, color: C.maroon }}>
                      Hidden from profile
                    </span>
                  )}
                </div>
                <div className="mt-1"><Stars score={Number(r.rating) || 0} /></div>
              </div>
              {isAdmin && (r.status === "hidden" ? (
                <button onClick={() => restore(r.id)} disabled={busyId === r.id}
                  className="tap h-8 px-2.5 rounded-lg flex items-center justify-center gap-1 shrink-0"
                  style={{ background: C.pineSoft }} aria-label="Restore review">
                  {busyId === r.id ? <Loader2 size={13} className="animate-spin" color={C.pine} /> : <BadgeCheck size={13} color={C.pine} />}
                  <span className="text-[11.5px] font-semibold" style={{ color: C.pine }}>Restore</span>
                </button>
              ) : (
                <button onClick={() => hide(r.id)} disabled={busyId === r.id}
                  className="tap w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: C.maroonSoft }} aria-label="Hide review">
                  {busyId === r.id ? <Loader2 size={13} className="animate-spin" color={C.maroon} /> : <Trash2 size={13} color={C.maroon} />}
                </button>
              ))}
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
                {r.issuer_role === "admin"
                  ? "Verified by Bhutan Tourism Hub"
                  : (talentById(issuers[r.token])
                      ? `Invited by ${talentById(issuers[r.token]).name}`
                      : "Invited by the tour operator")}
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