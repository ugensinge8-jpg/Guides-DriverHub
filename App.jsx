// ===== BHUTAN TOURISM HUB — FILE VERSION 17 — 14 AUG — VERIFIED CLEAN =====
import React, { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Compass, Car, Building2, ShieldCheck, ImagePlus, X, Check, Clock, Send,
  BadgeCheck, MapPin, Inbox, ChevronLeft, Star, Phone, Mail, Briefcase,
  Search, LogOut, Newspaper, User, CalendarCheck, MessageCircle,
  Map as MapIcon, MessageSquare, Users, Download, Mic, Video as VideoIcon, Heart, Share2, Trash2, Maximize2, Upload, Loader2, ArrowRight,
  Award, UserX, RefreshCw, FileCheck2, ExternalLink, UserPlus, Send as SendIcon, Lock, Eye, EyeOff, CalendarDays, UserCheck, Plus, CheckCheck, Camera, Navigation as NavIcon, Bell, Smartphone, Share, PhoneCall,
  ShieldAlert,
  TrendingUp, BedDouble } from "lucide-react";
import mapImg from "./map.jpg";
import { supabase } from "./supabase.js";

/* Bhutan Tourism Hub design system — paper, pine forest, temple gold, kemar red. */
const C = {
  bg: "#FFFFFF", card: "#FFFFFF", ink: "#1D1D1F", muted: "#626269",
  line: "#E2E2E7", lineSoft: "#EEEEF2", pine: "#0066CC", pineDeep: "#0A4FA3",
  brand: "#21402F", brandDeep: "#16281E", success: "#1F8A4C", successSoft: "#E8F5EC", grey: "#F5F5F7",
  gold: "#C0872B", goldSoft: "#F3E8CF", maroon: "#7A2E2E", maroonSoft: "#F7E9E7", pineSoft: "#EAF2FD",
  // gold is for icons and accents; goldText is gold you READ — deep enough to pass WCAG AA
  goldText: "#8A5F1C",
};

/* ------------------------------ Seed data -------------------------------- */
const TALENT = [];

const ACCOUNTS = [];


const HOUR = 3600e3;
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
let PROFILE_DIR = {};
const profileToTalent = (p) => ({
  id: p.id, role: p.role, name: p.full_name || "Member", base: p.base || "",
  initials: initialsOf(p.full_name || "?"), years: p.years || 0, trips: 0, rating: null,
  verified: p.license_status === "verified", licenseStatus: p.license_status || "none",
  licenseNumber: p.license_number || null, licenseExpiry: p.license_expiry || null, licensePhoto: !!p.license_path,
  grades: {}, tags: Array.isArray(p.tags) ? p.tags : [],
  // each language is { n: name, l: "Fluent" | "Basic" }; a plain word (older data) reads as Fluent (BUILD 55)
  languages: Array.isArray(p.languages) ? p.languages.map((x) => (typeof x === "string" ? { n: x, l: "Fluent" } : x)).filter((x) => x && x.n) : [],
  phone: p.phone || "", email: p.email || "", pitch: p.pitch || "", vehicle: p.vehicle || null,
  availability: p.availability || "open", availableFrom: p.available_from || null, availableNote: p.availability_note || "",
  joinedAt: p.created_at ? new Date(p.created_at).getTime() : null,
  company: p.company_name || "", hotelTown: p.hotel_town || null, hotelTier: p.hotel_tier || null, starRating: p.star_rating || null,
  stayKind: p.stay_kind || null, hotelCheckin: p.hotel_checkin || null, hotelPolicy: p.hotel_policy || null,
  photo: p.photo_url || null,   // BUILD 55
});
const talentById = (id) => TALENT.find((t) => t.id === id) || PROFILE_DIR[id] || null;
const initialsOf = (name) => (String(name || "?").trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("") || "?").toUpperCase();
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isoDay = (offset = 0) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset); return localISO(d); };
const sysMsg = (text) => ({ id: uid(), senderId: null, kind: "system", body: text, photo: null, ts: Date.now() });

/* ── Cloud (Supabase) ── posts are global when configured; everything falls back to local demo mode when not. */
const CLOUD = Boolean(supabase);
/* Apple devices draw San Francisco through -apple-system. Everything else gets Inter, the closest open typeface. */
(function loadInter() {
  try {
    if (typeof document === "undefined" || document.getElementById("bth-inter")) return;
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || "") || /Mac OS X|iPhone|iPad/.test(navigator.userAgent || "");
    if (isApple) return;
    const pre = document.createElement("link"); pre.rel = "preconnect"; pre.href = "https://fonts.gstatic.com"; pre.crossOrigin = "anonymous"; document.head.appendChild(pre);
    const l = document.createElement("link"); l.id = "bth-inter"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"; document.head.appendChild(l);
  } catch (e) {}
})();
const DEMO_MODE = false;   // set true only for local demos without a database
const BUILD = "BUILD 55 — 9 Oct";   // bump every deploy; shown at the top of the welcome screen
// which device someone is on — shown beside the build so a screenshot tells us both
const DEVICE = (() => {
  try {
    const ua = navigator.userAgent || "";
    if (/iPad|Tablet/i.test(ua)) return "iPad";
    if (/iPhone|iPod/i.test(ua)) return "iPhone";
    if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android" : "Android tablet";
    if (/Mac OS X/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows";
    return "Desktop";
  } catch (e) { return "Unknown"; }
})();

/* ---- Install state ---- */
// 43 characters of randomness — not guessable
function makeReviewToken() {
  const bytes = new Uint8Array(32);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 43);
}

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/* ---- Device notifications ----
   Shows a system notification when new activity arrives while the app is open or backgrounded.
   When the app is fully closed, push notifications take over (BUILD 55, see "Push notifications" below). */
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

/* ---- Messages on screen (BUILD 55) ----
   One small notice at the foot of the screen when something a person did could not be saved (or, now and
   then, to confirm it was). Call toast(text) from anywhere; <Toaster /> sits once at the root of the app. */
let _toast = null;
function toast(text, tone) {
  try { if (_toast) _toast({ id: Date.now() + Math.random(), text: String(text || ""), tone: tone || "error" }); } catch (e) {}
}
// The words for a failed save. Being offline is the usual cause, so say so when it is.
function failText(what) {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return offline ? `You're offline, so we couldn't ${what}. Try again once you're connected.` : `We couldn't ${what}. Please try again.`;
}
function Toaster() {
  const [t, setT] = useState(null);
  useEffect(() => { _toast = setT; return () => { if (_toast === setT) _toast = null; }; }, []);
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => setT(null), t.tone === "error" ? 5200 : 3000);
    return () => clearTimeout(id);
  }, [t]);
  if (!t) return null;
  const bad = t.tone === "error";
  return createPortal((
    <div key={t.id} role={bad ? "alert" : "status"} aria-live={bad ? "assertive" : "polite"} onClick={() => setT(null)} className="bth-toast"
      style={{ position: "fixed", left: "50%", bottom: "calc(78px + env(safe-area-inset-bottom, 0px))", zIndex: 400, transform: "translateX(-50%)",
               width: "max-content", maxWidth: "min(92vw, 420px)", padding: "11px 15px", borderRadius: 14, fontSize: 14, lineHeight: 1.35,
               background: bad ? "#3B1717" : "#17291F", color: "#FFFFFF", boxShadow: "0 12px 32px -14px rgba(0,0,0,.5)", cursor: "pointer" }}>
      {t.text}
    </div>
  ), document.body);
}

/* ---- Online or not (BUILD 55) ---- */
function useOnline() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine !== false);
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener("online", up); window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return online;
}
const CloudOff = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 2l20 20" /><path d="M5.8 5.8A7 7 0 0 0 4 10.5 4.5 4.5 0 0 0 6.5 19H17" /><path d="M21 15.5A4.5 4.5 0 0 0 17.5 9h-1.1A7 7 0 0 0 9.4 4.2" />
  </svg>
);
// connecting: the phone says it is online, but nothing has come back from the server for a while (a weak signal)
function OfflineBar({ children, connecting }) {
  const online = useOnline();
  if (online && !connecting) return null;
  return (
    <div role="status" className="rounded-xl px-3.5 py-2.5 mb-3 flex items-center gap-2.5" style={{ background: C.goldSoft }}>
      <span className="shrink-0" style={{ color: C.goldText }}><CloudOff size={16} /></span>
      <span className="text-[13px] leading-snug" style={{ color: C.goldText }}>
        <b>{online ? "Still connecting." : "You're offline."}</b> {children || "You're seeing what's saved on this phone; saving needs a connection."}
      </span>
    </div>
  );
}

/* ---- Opening without a connection (BUILD 55) ----
   The signed-in member's own profile is remembered on this phone, so the app opens on it when the network
   cannot be reached (notifications included). With no connection at all and a sign-in that has expired, it
   opens read-only on the account this phone last used (also when renewing it takes more than a few seconds); the
   sign-in renews by itself once the connection is back. Signing out forgets all of it. */
const ME_KEY = "bth_me";
function rememberMe(row) { try { if (row && row.id) localStorage.setItem(ME_KEY, JSON.stringify(row)); } catch (e) {} }
function recallMe(id) {
  if (!id) return null;
  try { const r = JSON.parse(localStorage.getItem(ME_KEY) || "null"); return r && r.id === id ? r : null; } catch (e) { return null; }
}
// the account this browser still holds a sign-in for (possibly expired), read without the network
const SIGN_IN_KEY = /^sb-.+-auth-token$/;
function storedSignInId() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!SIGN_IN_KEY.test(k || "")) continue;
      const v = JSON.parse(localStorage.getItem(k) || "null");
      const id = v && ((v.user && v.user.id) || (v.currentSession && v.currentSession.user && v.currentSession.user.id));
      if (id) return id;
    }
  } catch (e) {}
  return null;
}
function forgetStoredSignIn() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (SIGN_IN_KEY.test(k || "")) keys.push(k); }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
}
// what this phone kept for the person signing out: their profile, their notifications, the pushes it received
function forgetLocalTraces(id) {
  try { localStorage.removeItem(ME_KEY); if (id) localStorage.removeItem("bth_alerts_cache_" + id); } catch (e) {}
  try { if (typeof caches !== "undefined") caches.open("bth-meta").then((c) => c.delete("/__bth/inbox")).catch(() => {}); } catch (e) {}
}
// a failure to reach the server, as opposed to an answer from it
const isNetworkError = (e) => Boolean(e) && (e.name === "AuthRetryableFetchError" || e.status === 0 ||
  /fetch|network|load failed|timed? ?out|offline/i.test(String(e.message || "")));

/* ---- Updates (BUILD 55) ----
   A new version downloads in the background and waits. The app shows one line, "A new version is ready",
   and moves over only when Update is tapped. A version that was already waiting when the app starts is
   applied straight away, before anyone begins working, so nobody stays on an old build for long — except in a
   window opened by a notification, or while the app is open in another window: those get the line instead. */
// windows of the app answer each other here, so a launch never reloads a window someone is working in
const WINDOW_ID = Math.random().toString(36).slice(2);
function otherWindowsOpen(ms = 400) {
  return new Promise((resolve) => {
    let ch = null;
    try { ch = new BroadcastChannel("bth-windows"); } catch (e) { resolve(false); return; }
    let seen = false;
    ch.onmessage = (e) => { if (e.data && e.data.here === WINDOW_ID) seen = true; };
    ch.postMessage({ ask: WINDOW_ID });
    setTimeout(() => { try { ch.close(); } catch (e) {} resolve(seen); }, ms);
  });
}
function useAppUpdate(quiet, hold) {
  const [ready, setReady] = useState(false);
  const regRef = useRef(null);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    let alive = true, reloading = false;
    // The first worker to take over a page (a first visit) changes nothing on it. Any later change of worker is a
    // new version, and the page moves to it — except a review page, whose link is no longer in the address bar.
    let hadOne = Boolean(navigator.serviceWorker.controller);
    const onChange = () => {
      if (alive) setReady(false);
      if (!hadOne) { hadOne = true; return; }
      if (quiet || reloading) return;
      reloading = true; window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    let peers = null;   // a review page doesn't answer: an update never reloads it anyway
    if (!quiet) {
      try {
        peers = new BroadcastChannel("bth-windows");
        peers.onmessage = (e) => { const d = e.data || {}; if (d.ask && d.ask !== WINDOW_ID) peers.postMessage({ here: d.ask }); };
      } catch (e) { peers = null; }
    }
    const offer = (reg) => { if (alive && !quiet && reg.waiting && navigator.serviceWorker.controller) setReady(true); };
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      if (!alive) return;
      regRef.current = reg;
      reg.addEventListener("updatefound", () => {
        const next = reg.installing; if (!next) return;
        next.addEventListener("statechange", () => { if (next.state === "installed") offer(reg); });
      });
      if (quiet || !reg.waiting || !navigator.serviceWorker.controller) return;
      // at launch: apply it now — once per launch, and not under a notification just tapped or another open window
      let applied = false;
      try { applied = sessionStorage.getItem("bth_update_applied") === "1"; } catch (e) {}
      if (!applied && !hold && !(await otherWindowsOpen())) {
        if (!alive || !reg.waiting) return;
        try { sessionStorage.setItem("bth_update_applied", "1"); } catch (e) {}
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        return;
      }
      offer(reg);
    }).catch(() => {});
    const check = () => { const r = regRef.current; if (r) r.update().catch(() => {}); };
    const iv = setInterval(check, 15 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);
    return () => {
      alive = false; clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", check);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      try { if (peers) peers.close(); } catch (e) {}
    };
  }, []);
  const apply = () => {
    const r = regRef.current;
    if (r && r.waiting) r.waiting.postMessage({ type: "SKIP_WAITING" });
    else window.location.reload();
  };
  return { ready, apply, dismiss: () => setReady(false) };
}
function UpdateNotice({ update }) {
  if (!update || !update.ready) return null;
  return createPortal((
    <div role="status" aria-live="polite" className="bth-update"
      style={{ position: "fixed", left: "50%", top: "calc(env(safe-area-inset-top, 0px) + 10px)", transform: "translateX(-50%)", zIndex: 410, width: "min(94vw, 440px)" }}>
      <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#17291F", color: "#FFFFFF", boxShadow: "0 14px 36px -14px rgba(0,0,0,.55)" }}>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold leading-tight">A new version is ready</div>
          <div className="text-[12px] mt-0.5 leading-snug" style={{ opacity: .75 }}>Takes a second. Finish anything you're typing first.</div>
        </div>
        <button type="button" onClick={update.dismiss} className="tap h-9 px-2.5 rounded-lg text-[13px] font-semibold" style={{ background: "transparent", color: "#FFFFFF", opacity: .8, border: 0 }}>Later</button>
        <button type="button" onClick={update.apply} className="tap h-9 px-3.5 rounded-lg text-[14px] font-semibold" style={{ background: "#FFFFFF", color: "#17291F", border: 0 }}>Update</button>
      </div>
    </div>
  ), document.body);
}

/* ---- Push notifications (BUILD 55) ----
   With permission given, this device signs up with its browser's push service and the database keeps the
   address (claim_push_subscription). The server (push-lead) then reaches the phone even when the app is
   closed. Signing out takes this device off the list. On iPhone this works once the app is on the Home Screen. */
const VAPID_PUBLIC_KEY = "BPMQ0hmX3HvMWkKjkcWJAa_O9uDuWMxQVXyl0mUNGuIz1toU6dl4jJ-sr8X0eiCeG8u27dI6CVwYEbiPCH4cbZ0";
let PUSH_ON = false;   // when true, the server sends what the in-app alerts would otherwise announce
const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
function keyBytes(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("timeout")), ms))]);
// what alerts can do on this device right now
function pushStateNow() {
  if (!pushSupported()) return isIOS() && !isStandalone() ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted") return "on";
  return "off";
}
async function ensurePush() {
  if (!CLOUD || !pushSupported() || Notification.permission !== "granted") { PUSH_ON = false; return pushStateNow(); }
  try {
    const reg = await withTimeout(navigator.serviceWorker.ready, 8000);
    let sub = await reg.pushManager.getSubscription();
    const want = keyBytes(VAPID_PUBLIC_KEY);
    const have = sub && sub.options && sub.options.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null;
    if (sub && have && (have.length !== want.length || have.some((v, i) => v !== want[i]))) { await sub.unsubscribe(); sub = null; }   // made for another key
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: want });
    const j = sub.toJSON();
    const { error } = await supabase.rpc("claim_push_subscription", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
    if (error) { console.warn("claim_push_subscription:", error.message); PUSH_ON = false; return "error"; }
    PUSH_ON = true;
    return "on";
  } catch (e) { console.warn("push sign-up:", e && e.message); PUSH_ON = false; return "error"; }
}
// Signing out takes this device off the list. The server's copy needs the sign-in; the browser's own subscription
// is dropped either way, which stops deliveries to this phone even when there is no connection to tell anyone.
async function releasePush(signedIn) {
  PUSH_ON = false;
  if (!CLOUD || !pushSupported()) return;
  try {
    const reg = await withTimeout(navigator.serviceWorker.getRegistration(), 3000);
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) return;
    if (signedIn) { try { await withTimeout(supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint), 5000); } catch (e) {} }
    await withTimeout(sub.unsubscribe(), 5000);
  } catch (e) {}
}

/* ---- Where a notification leads (BUILD 55) ----
   Pushes carry "/?open=messages" and the like; each role keeps those things under a different tab. */
function tabForOpen(target, kind) {
  const tab = ({
    messages: "chats",
    jobs: kind === "operator" ? "requests" : kind === "hotel" ? "bookings" : "jobs",
    trips: kind === "operator" || kind === "hotel" ? "bookings" : "trips",
    bookings: kind === "operator" || kind === "hotel" ? "bookings" : "trips",
    profile: kind === "guide" || kind === "driver" ? "profile" : kind === "hotel" ? "hotel_profile" : null,
  })[target] || null;
  return tab && (NAV[kind] || []).some((n) => n.id === tab) ? tab : null;
}
const openTargetOf = (url) => { try { return new URL(url, window.location.origin).searchParams.get("open"); } catch (e) { return null; } };
// The pushes kept on this phone belong to whoever was signed in when they came: when someone else signs in here,
// they start with an empty list. (A phone with no owner recorded yet keeps what it has.)
let inboxReady = Promise.resolve();
function claimPushInbox(owner) {
  inboxReady = (async () => {
    try {
      if (!owner || typeof caches === "undefined") return;
      const prev = localStorage.getItem("bth_inbox_owner");
      if (prev === owner) return;
      if (prev) await (await caches.open("bth-meta")).delete("/__bth/inbox");
      localStorage.setItem("bth_inbox_owner", owner);
    } catch (e) {}
  })();
  return inboxReady;
}
// pushes that reached this phone while the app was closed, kept by the service worker for offline viewing
async function readPushInbox() {
  try { await inboxReady; } catch (e) {}
  try {
    if (typeof caches === "undefined") return [];
    const c = await caches.open("bth-meta");
    const r = await c.match("/__bth/inbox");
    const list = r ? await r.json() : [];
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}

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

// A write the person asked for: a failure is logged and shown on screen in plain words (BUILD 55).
const WRITE_WORDS = {
  "trip_members.insert": "finish setting up the trip", "trip_messages.system": "finish setting up the trip",
  "trip_messages.insert": "send that message", "stories.insert": "post your story",
  "follows.insert": "follow them", "follows.delete": "unfollow them", "profiles.availability": "update your availability",
  "job_applicants.delete": "clear the applicants",
};
async function dbWrite(label, promise) {
  const { error } = await promise;
  if (error) { console.error(`${label} failed:`, error.message); toast(failText(WRITE_WORDS[label] || "save that")); }
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

// A profile photo: square, centre-cropped, at most 480 px, as a JPEG — light enough for mountain data (BUILD 55)
function squarePhoto(dataUri, size = 480, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h);
        if (!side) { reject(new Error("That photo couldn't be read. Try another one.")); return; }
        const out = Math.min(size, side);
        const c = document.createElement("canvas"); c.width = out; c.height = out;
        const g = c.getContext("2d"); g.imageSmoothingQuality = "high";
        g.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, out, out);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("That photo couldn't be prepared. Try another one."))), "image/jpeg", quality);
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error("That photo couldn't be read. Try a JPEG or PNG."));
    img.src = dataUri;
  });
}

async function uploadPostMedia(talentId, media) {
  try {
    const dataUri = media.kind === "photo" ? await shrinkImage(media.dataUri) : media.dataUri;
    const blob = await (await fetch(dataUri)).blob();
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
  componentDidCatch(err, info) { this.setState({ info }); console.error("App crashed:", err, info); try { window.__bthSplashDone && window.__bthSplashDone(); } catch (e) {} }
  render() {
    if (!this.state.err) return this.props.children;
    const msg = String(this.state.err?.message || this.state.err);
    const stack = String(this.state.info?.componentStack || "").split("\n").slice(0, 6).join("\n");
    return (
      <div style={{ padding: 20, fontFamily: "system-ui", background: "#F4F5F1", minHeight: "100dvh" }}>
        <div style={{ background: "#fff", border: "1px solid #E4E7E0", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#7A2E2E", marginBottom: 8 }}>Something went wrong</div>
          <p style={{ fontSize: 14, color: "#6E7A72", marginBottom: 12 }}>
            Please screenshot this and send it to support — it tells us exactly what to fix.
          </p>
          <div style={{ background: "#F7E9E7", borderRadius: 10, padding: 12, fontSize: 13, color: "#7A2E2E", wordBreak: "break-word", fontFamily: "monospace" }}>
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

export default function App() {
  // A guest arriving on a review link never signs in — they see only the review form.
  const reviewToken = useMemo(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("review");
      // BUILD 50: once read, the one-time link leaves the address bar so it is not kept in history or screenshots
      if (t && window.history && window.history.replaceState) window.history.replaceState(null, "", window.location.pathname);
      return t;
    } catch (e) { return null; }
  }, []);
  // BUILD 55: a tapped notification arrives as "/?open=messages"; read it once and tidy the address bar
  const openParam = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const o = u.searchParams.get("open");
      if (o) { u.searchParams.delete("open"); window.history.replaceState(null, "", u.pathname + u.search); }
      return o;
    } catch (e) { return null; }
  }, []);
  // BUILD 55: new versions wait for "Update" — and never reload a review page, whose link is no longer in the address
  // bar, nor apply themselves under a notification someone has just tapped
  const update = useAppUpdate(Boolean(reviewToken), Boolean(openParam));
  // ...and while the app is open, the service worker says so: switch tab, refresh the alerts
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
    const onMessage = (e) => {
      const d = e.data || {};
      if (d.type === "bth-open") { const t = openTargetOf(d.url); if (t) window.dispatchEvent(new CustomEvent("bth-open", { detail: t })); }
      if (d.type === "bth-push") window.dispatchEvent(new CustomEvent("bth-push", { detail: d.item }));
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
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
  const [sessionKnown, setSessionKnown] = useState(!CLOUD);   // getSession has answered (signed in or not)
  const [splashTimedOut, setSplashTimedOut] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSplashTimedOut(true), 12000); return () => clearTimeout(t); }, []);
  const [profileTick, setProfileTick] = useState(0);
  const [dirTick, setDirTick] = useState(0);
  const [liveFor, setLiveFor] = useState(null);   // BUILD 55: whose data the server has answered with in this session
  const [listsFor, setListsFor] = useState(null); // BUILD 55: …and whose member directory has loaded (the bell's lists are in)
  // BUILD 55: someone who signed out while the server couldn't hear it. A renewal auth-js was already retrying can
  // still come back with their session: that finishes the sign-out instead of signing them back in. Only their own
  // sign-in (SIGNED_IN) clears it.
  const leftRef = useRef(null);
  const loggingOutRef = useRef(false);
  // signing out of the remembered (offline) profile may change no other state: this makes sure the screen follows
  const [, setSignedOut] = useState(0);
  const [dms, setDms] = useState([]);
  const [authBusy, setAuthBusy] = useState(false);   // true while the signup/reset wizard is running
  const [follows, setFollows] = useState([]);
  const [stories, setStories] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  const rowToEnquiry = (r) => ({
    id: r.id, operatorId: r.operator_id,
    clientName: r.guest_name, clientEmail: r.guest_email, clientPhone: r.guest_phone,
    country: r.guest_country, source: r.source,
    title: r.title, partySize: r.party_size, start: r.start_date, end: r.end_date,
    interests: r.interests, budgetNote: r.budget_note, notes: r.note,
    status: r.status, lostReason: r.lost_reason, lostNote: r.lost_note, quotedAmount: r.quoted_amount,
    marketingOk: r.marketing_ok ?? false,
    lastContacted: r.last_contacted ? new Date(r.last_contacted).getTime() : null,
    followUpOn: r.follow_up_on, tripId: r.trip_id,
    createdAt: new Date(r.created_at).getTime(),
  });

  const fetchEnquiries = async () => {
    if (!CLOUD) return;
    const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
    if (error) { console.error("fetchEnquiries failed:", error.message); return; }
    setEnquiries((data || []).map(rowToEnquiry));
  };
  useEffect(() => {
    if (!CLOUD) return;
    fetchEnquiries();
    const ch = supabase.channel("enquiries-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "enquiries" }, fetchEnquiries)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dirTick]);   // BUILD 50: re-fetch after sign-in, not only at page load

  const saveEnquiry = async (e) => {
    const me = realUserRef.current;
    if (!CLOUD || !me) return { ok: false };
    const row = {
      operator_id: me,
      guest_name: e.clientName?.trim() || "Unnamed",
      guest_email: e.clientEmail?.trim() || null,
      guest_phone: e.clientPhone?.trim() || null,
      guest_country: e.country?.trim() || null,
      source: e.source || null,
      title: e.title?.trim() || null,
      party_size: e.partySize ? Number(e.partySize) : null,
      start_date: e.start || null, end_date: e.end || null,
      interests: e.interests?.trim() || null,
      budget_note: e.budgetNote?.trim() || null,
      note: e.notes?.trim() || null,
      status: e.status || "new",
      lost_reason: e.lostReason?.trim() || null,
      quoted_amount: e.quotedAmount?.trim() || null,
      follow_up_on: e.followUpOn || null,
    };
    const res = e.id
      ? await supabase.from("enquiries").update(row).eq("id", e.id)
      : await supabase.from("enquiries").insert(row);
    if (res.error) { console.error("saveEnquiry failed:", res.error.message); return { ok: false, reason: res.error.message }; }
    fetchEnquiries();
    return { ok: true };
  };

  const setEnquiryStatus = async (id, status, extra = {}) => {
    if (!CLOUD) return;
    const patch = { status, ...extra };
    if (status !== "new") patch.last_contacted = new Date().toISOString();
    const { error } = await supabase.from("enquiries").update(patch).eq("id", id);
    if (error) { console.error("setEnquiryStatus failed:", error.message); toast(failText("update that enquiry")); }
    fetchEnquiries();
  };

  // BUILD 55: back online, or back to the app after a while — fetch what changed meanwhile. Live updates do not
  // replay what was missed while the connection dropped or the phone slept.
  const refreshAllRef = useRef(null);
  refreshAllRef.current = () => {
    loadProfiles(); fetchTrips(); fetchJobs(); fetchPosts(); fetchInvites();
    fetchDms(); fetchFollows(); fetchEngagement(); fetchEnquiries(); fetchStories(); fetchCreditRequests();
  };
  useEffect(() => {
    let last = Date.now();
    const catchUp = async () => {
      last = Date.now();
      try { if (CLOUD) await supabase.auth.getSession(); } catch (e) {}   // an expired sign-in renews here
      if (realUserRef.current && refreshAllRef.current) refreshAllRef.current();
    };
    const onVisible = () => { if (document.visibilityState === "visible" && Date.now() - last > 5 * 60e3) catchUp(); };
    window.addEventListener("online", catchUp);
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.removeEventListener("online", catchUp); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  // a won enquiry becomes a real trip, carrying its details across
  const convertEnquiry = async (enq) => {
    const me = realUserRef.current;
    if (!CLOUD || !me) return { ok: false };
    const { data: created, error } = await supabase.from("trips").insert({
      operator_id: me,
      operator_name: PROFILE_DIR[me]?.name || "Operator",
      title: enq.title || `${enq.clientName} — Bhutan`,
      start_date: enq.start, end_date: enq.end,
      chat_state: new Date(enq.start + "T00:00").getTime() - 3 * 86400e3 > Date.now() ? "scheduled" : "active",
    }).select("id").single();
    if (error || !created) {
      console.error("convertEnquiry failed:", error?.message);
      return { ok: false, reason: error?.message || "Couldn't create the trip" };
    }
    await dbWrite("trip_members.insert", supabase.from("trip_members").insert({
      trip_id: created.id, user_id: me, display_name: PROFILE_DIR[me]?.name || "Operator", role_in_trip: "operator",
    }));
    await dbWrite("trip_messages.system", supabase.from("trip_messages").insert({
      trip_id: created.id, sender_id: null, kind: "system",
      body: `Trip created from an enquiry by ${enq.clientName}${enq.partySize ? ` · ${enq.partySize} guests` : ""}.`,
    }));
    await supabase.from("enquiries").update({
      status: "won", trip_id: created.id, converted_at: new Date().toISOString(),
    }).eq("id", enq.id);
    fetchEnquiries(); fetchTrips();
    return { ok: true, tripId: created.id };
  };

  const loadProfiles = async () => {
    if (!CLOUD) return;
    // BUILD 49: the full directory (phone, email, licence details) is for signed-in members only.
    // A visitor who is not signed in gets the public columns through the profiles_public view.
    let signedIn = false, who = null;
    try { const { data: s } = await supabase.auth.getSession(); signedIn = Boolean(s && s.session); who = signedIn ? s.session.user.id : null; } catch { signedIn = false; }
    const { data, error } = await supabase.from(signedIn ? "profiles" : "profiles_public").select("*");
    if (error) { console.error("loadProfiles failed:", error.message); return false; }
    if (data) {
      PROFILE_DIR = {}; data.forEach((p) => { PROFILE_DIR[p.id] = profileToTalent(p); }); setDirTick((t) => t + 1);
      if (who) { setLiveFor(who); setListsFor(who); }   // BUILD 55: the server has answered for this person
    }
    return Boolean(data);
  };
  // Bumping profileTick re-runs the session effect below, which reloads the directory once signed in.
  const reloadMe = () => { setProfileTick((t) => t + 1); };
  // BUILD 50: signing out also clears the in-memory directory and any stored one-time link tokens
  const logout = async () => {
    if (loggingOutRef.current) return;   // a second tap while the first is still going
    loggingOutRef.current = true;
    const leaving = realUserRef.current;
    if (CLOUD && leaving) leftRef.current = leaving;   // from this moment no session of theirs comes back on its own
    const slow = setTimeout(() => toast("Signing out… the connection is slow, this takes a moment.", "info"), 2000);
    try {
      try { await releasePush(Boolean(session)); } catch (e) {}   // BUILD 55: this phone stops getting their alerts, offline too
      let out = false;
      try { if (session) { const { error } = await supabase.auth.signOut(); out = !error; } } catch (e) {}
      // BUILD 55: offline, the sign-out above cannot reach the server — this phone forgets the sign-in anyway (and a
      // renewal already under way can't sign them back in: see leftRef and the session listener)
      if (CLOUD && !out) { forgetStoredSignIn(); setSession(null); setAuthUnreachable(false); }
      forgetLocalTraces(leaving);
      PROFILE_DIR = {};
      setLiveFor(null); setListsFor(null);
      try { localStorage.removeItem("bth_invite"); localStorage.removeItem("bth_attest"); } catch (e) {}
      setAccountId(null);
      setSignedOut((n) => n + 1);
    } finally { clearTimeout(slow); loggingOutRef.current = false; }
  };


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
        const blob = await (await fetch(small)).blob();
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
    if (data) setFollows(data.map((f) => ({ follower: f.follower_id, following: f.following_id, ts: f.created_at ? new Date(f.created_at).getTime() : 0 })));
  };
  useEffect(() => {
    if (!CLOUD) return;
    fetchFollows();
    const ch = supabase.channel("follows-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, fetchFollows)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dirTick]);   // BUILD 50: re-fetch after sign-in, not only at page load
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
      sharedPostId: r.shared_post_id ?? null, photo: r.photo_url ?? null, official: r.is_official ?? false,
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
  }, [dirTick]);   // BUILD 50: re-fetch after sign-in, not only at page load
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
        const blob = await (await fetch(small)).blob();
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

  const [authUnreachable, setAuthUnreachable] = useState(false);   // BUILD 55: the sign-in couldn't be checked (no connection)
  // BUILD 55: renewing an expired sign-in keeps retrying for up to a minute when the network is down or carries
  // nothing. The app doesn't wait for it: with no connection it opens at once on the profile this phone remembers,
  // otherwise after a few seconds; the renewal carries on underneath and takes over when it succeeds.
  const [authSlow, setAuthSlow] = useState(() => CLOUD && typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    if (!CLOUD) return;
    // a session for someone who signed out unheard, turning up without their own sign-in (a renewal that was already
    // under way): the phone forgets it at once — only if it is still theirs — and the server is told to end that
    // exact session, by its own token, without touching whatever this phone holds by then
    const isLeft = (sn) => Boolean(sn && sn.user && leftRef.current && sn.user.id === leftRef.current);
    const finishSignOut = (sn) => {
      if (storedSignInId() === sn.user.id) forgetStoredSignIn();
      const token = sn.access_token;
      if (token) setTimeout(() => { try { supabase.auth.admin.signOut(token, "local").catch(() => {}); } catch (e) {} }, 0);
    };
    loadProfiles();
    const slow = setTimeout(() => setAuthSlow(true), 5000);
    supabase.auth.getSession().then(({ data, error }) => {
      if (isLeft(data.session)) { finishSignOut(data.session); setSessionKnown(true); return; }
      setSession(data.session || null);
      setAuthUnreachable(Boolean(!data.session && isNetworkError(error)));
      setSessionKnown(true);
    }).catch(() => setSessionKnown(true)).finally(() => clearTimeout(slow));
    const { data: sub } = supabase.auth.onAuthStateChange((ev, sn) => {
      const renewal = ev === "TOKEN_REFRESHED" || ev === "INITIAL_SESSION";
      if (isLeft(sn) && renewal) { finishSignOut(sn); return; }
      if (isLeft(sn)) leftRef.current = null;   // they signed in again themselves (or are resetting their password)
      setSession(sn);
      if (sn) setAuthUnreachable(false); else { setLiveFor(null); setListsFor(null); }
    });
    return () => { clearTimeout(slow); sub.subscription.unsubscribe(); };
  }, []);

  // BUILD 55: the member's own row, put in the directory when the directory itself could not load
  const seedMe = (row) => { if (row && row.id && !PROFILE_DIR[row.id]) { PROFILE_DIR[row.id] = profileToTalent(row); setDirTick((t) => t + 1); } };
  useEffect(() => {
    if (!CLOUD || !session) { setMyProfile(null); return; }
    let on = true;
    loadProfiles();   // BUILD 49: the full directory only opens once signed in, so refresh it here
    supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!on) return;
        if (error && !data) {   // BUILD 55: no connection — open on the profile this phone remembers
          const kept = recallMe(session.user.id);
          if (kept) { seedMe(kept); setMyProfile(kept); return; }
        }
        // BUILD 55: their own profile opens even if the directory hasn't loaded (no directory-wide refresh for one
        // row: setMyProfile below renders anyway); and the server has answered for them
        if (data) { rememberMe(data); if (!PROFILE_DIR[data.id]) PROFILE_DIR[data.id] = profileToTalent(data); setLiveFor(data.id); }
        setMyProfile(data || false);
      });
    return () => { on = false; };
  }, [session, profileTick]);

  const online = useOnline();
  // offline with an expired sign-in (or while a slow renewal is still trying): the account this phone last used,
  // read-only until the connection is back
  const offlineMe = CLOUD && !session && (sessionKnown ? (authUnreachable || !online) : authSlow) ? recallMe(storedSignInId()) : null;
  // BUILD 55: the bell's list counts as live only once the server has answered for this person in this session
  const dataLive = !CLOUD || (Boolean(session) && liveFor === session.user.id);
  const listsLive = !CLOUD || (Boolean(session) && listsFor === session.user.id);
  // BUILD 55: a signal that comes back without the phone noticing (no "online" event), or a directory that failed to
  // load: keep trying, lightly — one try at a time, 20 s, 40 s, 80 s, then every 2 minutes. When the directory loads,
  // the lists tied to it refetch by themselves (dirTick); the others are fetched here.
  const fetchRestRef = useRef(null);   // read at call time, so it acts for whoever is signed in by then
  fetchRestRef.current = () => { fetchPosts(); fetchInvites(); fetchStories(); fetchCreditRequests(); };
  useEffect(() => {
    if (!CLOUD || !session || !online || listsLive) return;
    let alive = true, wait = 20000, t = null;
    const tick = async () => {
      const ok = await loadProfiles();
      if (!alive) return;
      if (ok) { if (fetchRestRef.current) fetchRestRef.current(); return; }
      wait = Math.min(wait * 2, 120000);
      t = setTimeout(tick, wait);
    };
    t = setTimeout(tick, wait);
    return () => { alive = false; clearTimeout(t); };
  }, [Boolean(session), online, listsLive]);
  useEffect(() => { if (offlineMe) seedMe(offlineMe); }, [offlineMe && offlineMe.id]);
  const meRow = (() => {
    if (!CLOUD) return null;
    if (!session) return offlineMe;
    if (myProfile && typeof myProfile === "object") return myProfile.id === session.user.id ? myProfile : null;
    return myProfile === null ? recallMe(session.user.id) : null;   // still loading: start from the remembered one
  })();
  const realUser = CLOUD && !authBusy && meRow
    ? { id: meRow.id, kind: meRow.role, talentId: meRow.id, name: meRow.full_name,
        initials: initialsOf(meRow.full_name || "?"), licenseStatus: meRow.license_status || "none",
        isAdmin: meRow.role === "admin" }
    : null;
  const user = realUser || (DEMO_MODE ? ACCOUNTS.find((a) => a.id === accountId) : null) || null;
  realUserRef.current = user ? (user.talentId || user.id) : null;

  // ── crew invitations ──────────────────────────────────────────────────────
  const [invites, setInvites] = useState([]);
  const [inviteToken, setInviteToken] = useState(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("invite");
      if (fromUrl) {
        localStorage.setItem("bth_invite", fromUrl);
        window.history.replaceState(null, "", window.location.pathname);   // keep the address bar clean
        return fromUrl;
      }
      return localStorage.getItem("bth_invite");
    } catch (e) { return null; }
  });
  const [invitePreview, setInvitePreview] = useState(null);
  // a past-trip confirmation link (?attest=token) works the same way
  const [attestToken, setAttestToken] = useState(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("attest");
      if (fromUrl) { localStorage.setItem("bth_attest", fromUrl); window.history.replaceState(null, "", window.location.pathname); return fromUrl; }
      return localStorage.getItem("bth_attest");
    } catch (e) { return null; }
  });
  const [attestPreview, setAttestPreview] = useState(null);
  const forgetAttest = () => { try { localStorage.removeItem("bth_attest"); } catch (e) {} setAttestToken(null); setAttestPreview(null); };
  useEffect(() => {
    if (!CLOUD || !attestToken || !online) return;
    supabase.rpc("preview_attestation", { p_token: attestToken }).then(({ data, error }) => {
      if (error && isNetworkError(error)) return;   // BUILD 55: no answer — the link waits and is tried again once connected
      if (!error && data) setAttestPreview(data); else forgetAttest();
    });
  }, [attestToken, online]);
  const rowToInvite = (r) => ({
    id: r.id, token: r.token, tripId: r.trip_id, operatorId: r.operator_id, role: r.role,
    name: r.invitee_name, phone: r.invitee_phone, talentId: r.talent_id, status: r.status,
    tripTitle: r.trip_title || "a trip", tripStart: r.trip_start, tripEnd: r.trip_end, operatorName: r.operator_name,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    respondedAt: r.responded_at ? new Date(r.responded_at).getTime() : null,
  });
  const fetchInvites = async () => {
    if (!CLOUD || !realUserRef.current) return;
    const { data, error } = await supabase.from("crew_invites").select("*").order("created_at", { ascending: false });
    if (error) { console.warn("crew_invites:", error.message); return; }
    setInvites((data || []).map(rowToInvite));
  };
  const inviteMe = user ? (user.talentId || user.id) : null;
  const inviteKind = user ? user.kind : null;
  const [creditRequests, setCreditRequests] = useState([]);
  const fetchCreditRequests = async () => {
    if (!CLOUD || inviteKind !== "admin") { setCreditRequests([]); return; }
    const { data, error } = await supabase.from("drukpah_credit_requests").select("*").eq("status", "open");
    if (!error) setCreditRequests(data || []);
  };
  useEffect(() => {
    if (!CLOUD || inviteKind !== "admin") { setCreditRequests([]); return; }
    fetchCreditRequests();
    const ch = supabase.channel("credit-requests-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "drukpah_credit_requests" }, fetchCreditRequests)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [inviteKind]);
  useEffect(() => {
    if (!CLOUD || !inviteMe) { setInvites([]); return; }
    fetchInvites();
    const ch = supabase.channel("crew-invites-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "crew_invites" }, fetchInvites)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [inviteMe]);
  // before they sign up: who invited them, and to what (asked again when the connection returns)
  useEffect(() => {
    if (!CLOUD || !inviteToken || inviteMe || !online) return;
    supabase.rpc("preview_crew_invite", { p_token: inviteToken }).then(({ data, error }) => {
      if (!error && data) setInvitePreview(data);
    });
  }, [inviteToken, inviteMe, online]);
  // once signed in as a guide or driver: the invitation becomes theirs.
  // BUILD 55: that needs the sign-in and a connection. Until both are there the link waits on this phone, and a
  // request that gets no answer is tried again later — only the server's own answer uses the link up.
  const claimingRef = useRef(null);
  useEffect(() => {
    if (!CLOUD || !inviteToken || !inviteMe) return;
    const forget = () => { try { localStorage.removeItem("bth_invite"); } catch (e) {} setInviteToken(null); setInvitePreview(null); };
    if (inviteKind !== "guide" && inviteKind !== "driver") { forget(); return; }
    if (!session || !online || claimingRef.current === inviteToken) return;
    claimingRef.current = inviteToken;
    supabase.rpc("claim_crew_invite", { p_token: inviteToken }).then(({ error }) => {
      claimingRef.current = null;
      if (error && isNetworkError(error)) return;
      if (error) {
        console.warn("claim_crew_invite:", error.message);
        // the database explains itself ("This invitation is no longer active"); say that, not a code
        toast(/invitation|sign in|profile/i.test(error.message || "") ? error.message : "We couldn't open that crew invitation.");
      }
      forget(); fetchInvites();
    }).catch(() => { claimingRef.current = null; });
  }, [inviteToken, inviteMe, inviteKind, Boolean(session), online]);

  const createInvite = async ({ trip, role, name, phone, talentId }) => {
    const me = realUserRef.current;
    if (!CLOUD || !me || !trip) return { ok: false, reason: "not signed in" };
    const row = {
      token: makeReviewToken(), trip_id: trip.id, operator_id: me, role,
      invitee_name: String(name || "").trim(), invitee_phone: String(phone || "").trim() || null,
      talent_id: talentId || null, status: talentId ? "pending" : "invited",
      trip_title: trip.title || null, trip_start: trip.start || null, trip_end: trip.end || null,
      operator_name: (PROFILE_DIR[me] && PROFILE_DIR[me].name) || trip.operator || null,
    };
    const { error } = await supabase.from("crew_invites").insert(row);
    if (error) { console.error("createInvite failed:", error.message); return { ok: false, reason: error.message }; }
    fetchInvites();
    const invite = rowToInvite({ ...row, id: "new", created_at: new Date().toISOString() });
    return { ok: true, token: row.token, link: `${window.location.origin}/?invite=${row.token}`, invite };
  };
  const cancelInvite = async (id) => {
    if (!CLOUD) return;
    const { error } = await supabase.from("crew_invites").update({ status: "cancelled" }).eq("id", id);
    if (error) { console.error("cancelInvite failed:", error.message); toast(failText("cancel that invitation")); }
    fetchInvites();
  };
  const respondInvite = async (id, accept) => {
    if (!CLOUD) return { ok: false };
    const { data, error } = await supabase.rpc("respond_crew_invite", { p_id: id, p_accept: accept });
    if (error) return { ok: false, reason: error.message };
    fetchInvites(); fetchTrips();
    return { ok: true, status: data && data.status };
  };

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
    let up = { media_url: null, media_kind: null };
    let slideUrls = [];
    if (media) {
      if (media.kind === "photo" && media.slides && media.slides.length > 1) {
        for (const slide of media.slides) {
          const r = await uploadPostMedia(talentId, { kind: "photo", dataUri: slide });
          if (r.media_url) slideUrls.push(r.media_url);
        }
        up = { media_url: slideUrls[0] || null, media_kind: "photo" };
      } else {
        up = await uploadPostMedia(talentId, media);
      }
    }
    const { error: postErr } = await supabase.from("posts").insert({
      talent_id: talentId, body: text || null,
      media_url: up.media_url, media_kind: up.media_kind,
      media_slides: slideUrls.length > 1 ? slideUrls : null, media_ratio: media?.ratio || null,
      lat: location?.lat ?? null, lng: location?.lng ?? null,
      place: location?.place ?? null, loc_desc: location?.description ?? null, loc_source: location?.source ?? null,
      loc_altitude: location?.altitude ?? null, loc_bearing: location?.bearing ?? null, loc_taken_on: location?.takenOn ?? null,
      loc_outside: location?.outside ?? false,
    });
    if (postErr) console.error("posts.insert failed:", postErr.message);
    fetchPosts();
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
    if (L) setLikes(L.map((r) => ({ post_id: r.post_id, liker_id: r.liker_id, ts: r.created_at ? new Date(r.created_at).getTime() : 0 })));
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
  }, [dirTick]);   // BUILD 50: re-fetch after sign-in, not only at page load

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
    deletedAt: l.deleted_at ? new Date(l.deleted_at).getTime() : null,
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
    deletedAt: j.deleted_at ? new Date(j.deleted_at).getTime() : null,
    declineReason: j.decline_reason || null, respondedAt: j.responded_at ? new Date(j.responded_at).getTime() : null,
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
    if (!CLOUD) { setJobs((j) => [{ id: uid(), status: "pending", createdAt: Date.now(), ...job }, ...j]); return { ok: true }; }
    const { error: jrErr } = await supabase.from("job_requests").insert({
      operator_id: realUserRef.current, operator_name: job.operator, talent_id: job.toTalentId,
      title: job.title, role_needed: job.role, start_date: job.start, end_date: job.end,
      languages: job.languages || [], notes: job.notes || null,
    });
    if (jrErr) { console.error("job_requests.insert failed:", jrErr.message); return { ok: false, reason: friendlyBookingError(jrErr.message) }; }
    fetchJobs();
    return { ok: true };
  };

  /* ---- Trips in the database ---- */
  const fetchTrips = async () => {
    if (!CLOUD) return;
    const [{ data: T, error: tErr }, { data: M }, { data: MS }, { data: IT }, { data: G }] = await Promise.all([
      supabase.from("trips").select("*").order("start_date", { ascending: true }),
      supabase.from("trip_members").select("*"),
      supabase.from("trip_messages").select("*").order("created_at", { ascending: true }),
      supabase.from("trip_itinerary").select("*").order("day_no", { ascending: true }),
      supabase.from("trip_guests").select("*").order("created_at", { ascending: true }),
    ]);
    if (tErr) console.error("fetchTrips failed:", tErr.message);
    if (!T) return;
    setTrips(T.map((tr) => ({
      id: tr.id, operatorId: tr.operator_id, operator: tr.operator_name, title: tr.title, status: tr.status || "confirmed",
      start: tr.start_date, end: tr.end_date, meetingPoint: tr.meeting_point || null,
      arrivalFlight: tr.arrival_flight || null, arrivalAt: tr.arrival_at || null,
      departureFlight: tr.departure_flight || null, departureAt: tr.departure_at || null,
      arrivalPoint: tr.arrival_point || null,
      visaStatus: tr.visa_status || "not_started", sdfStatus: tr.sdf_status || "not_started",
      permitsStatus: tr.permits_status || "not_needed", hotelsStatus: tr.hotels_status || "not_started",
      insuranceOk: !!tr.insurance_ok, nightTowns: (tr.night_towns && typeof tr.night_towns === "object") ? tr.night_towns : {},
      guestCount: tr.guest_count || null, guestNotes: tr.guest_notes || null,
      emergencyName: tr.emergency_name || null, emergencyPhone: tr.emergency_phone || null,
      members: (M || []).filter((m) => m.trip_id === tr.id).map((m) => {
        const p = talentById(m.user_id);
        return { id: m.user_id, name: p?.name || m.display_name || "Member", initials: p?.initials || initialsOf(m.display_name || "?"), roleInTrip: m.role_in_trip };
      }),
      itinerary: (IT || []).filter((i) => i.trip_id === tr.id).map((i) => ({ day: i.day_no, title: i.title })),
      guests: (G || []).filter((g) => g.trip_id === tr.id).map((g) => ({
        id: g.id, name: g.full_name, nationality: g.nationality || null, dob: g.date_of_birth || null,
        passportNo: g.passport_no || null, passportExpiry: g.passport_expiry || null, dietary: g.dietary || null, notes: g.notes || null,
      })),
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

  const saveTripDetails = async (tripId, patch) => {
    if (!CLOUD) return { ok: false };
    const { error } = await supabase.from("trips").update(patch).eq("id", tripId);
    if (error) { console.error("saveTripDetails failed:", error.message); return { ok: false, reason: error.message }; }
    fetchTrips();
    return { ok: true };
  };

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
    if (tmErr) { console.error("trip_members.upsert failed:", tmErr.message); fetchTrips(); return { ok: false, reason: friendlyBookingError(tmErr.message) }; }
    { const { error: _e } = await supabase.from("trip_messages").insert({ trip_id: tripId, sender_id: null, kind: "system", body: `${t?.name || "A crew member"} joined the trip.` }); if (_e) console.error("trip_messages.join failed:", _e.message); }
    fetchTrips();
    return { ok: true };
  };

  const createTripFromJob = (job) => {
    if (CLOUD) { return createTripCloud(job); }
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
    const job = jobs.find((x) => x.id === id);
    if (CLOUD && status === "accepted") {
      // trip, membership and status change together, or not at all (DOUBLE_BOOKED rolls everything back)
      const { error } = await supabase.rpc("accept_job_request", { p_id: id });
      if (error) { console.error("accept_job_request failed:", error.message); fetchJobs(); return { ok: false, reason: friendlyBookingError(error.message) }; }
      fetchJobs(); fetchTrips();
      return { ok: true };
    }
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, status } : x)));
    if (CLOUD) { const { error: jsErr } = await supabase.from("job_requests").update({ status, responded_at: new Date().toISOString() }).eq("id", id); if (jsErr) console.error("job_requests.status failed:", jsErr.message); fetchJobs(); }
    if (status === "accepted" && job) createTripFromJob(job);
    return { ok: true };
  };

  const postChat = async (tripId, msg) => {
    setTrips((prev) => prev.map((tr) => (tr.id === tripId ? { ...tr, chat: { ...tr.chat, messages: [...tr.chat.messages, msg] } } : tr)));
    if (!CLOUD) return;
    let photoUrl = null;
    if (msg.kind === "photo" && msg.photo) {
      try {
        const small = await shrinkImage(msg.photo, 1280, 0.82);
        const blob = await (await fetch(small)).blob();
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

  // Remove a job — it goes to the bin, invisible to talent but restorable.
  const binListing = async (id, restore = false) => {
    if (!CLOUD) return;
    const { error } = await supabase.from("job_listings")
      .update({ deleted_at: restore ? null : new Date().toISOString() }).eq("id", id);
    if (error) { console.error("binListing failed:", error.message); return { ok: false, reason: error.message }; }
    auditLog(realUserRef.current, restore ? "job.restore" : "job.bin", id);
    fetchJobs();
    return { ok: true };
  };

  // Erase for good. Applications go with it — nothing is left pointing nowhere.
  const destroyListing = async (id) => {
    if (!CLOUD) return;
    await dbWrite("job_applicants.delete", supabase.from("job_applicants").delete().eq("listing_id", id));
    const { error } = await supabase.from("job_listings").delete().eq("id", id);
    if (error) { console.error("destroyListing failed:", error.message); return { ok: false, reason: error.message }; }
    auditLog(realUserRef.current, "job.delete", id);
    fetchJobs();
    return { ok: true };
  };

  const binRequest = async (id, restore = false) => {
    if (!CLOUD) return;
    const { error } = await supabase.from("job_requests")
      .update({ deleted_at: restore ? null : new Date().toISOString() }).eq("id", id);
    if (error) { console.error("binRequest failed:", error.message); return { ok: false }; }
    auditLog(realUserRef.current, restore ? "request.restore" : "request.bin", id);
    fetchJobs();
    return { ok: true };
  };

  const destroyRequest = async (id) => {
    if (!CLOUD) return;
    const { error } = await supabase.from("job_requests").delete().eq("id", id);
    if (error) { console.error("destroyRequest failed:", error.message); return { ok: false }; }
    auditLog(realUserRef.current, "request.delete", id);
    fetchJobs();
    return { ok: true };
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
    if (CLOUD) {
      // the trip first: if the person is already booked for these dates the database refuses and nothing else changes
      const r = await createTripCloud({ id: `${listing.id}_${applicant.talentId}`, toTalentId: applicant.talentId, operator: listing.operator, title: listing.title, start: listing.start, end: listing.end });
      if (!r || !r.ok) return r || { ok: false, reason: "Couldn't create the trip" };
    }
    await setApplicant(listing.id, applicant.talentId, "hired");
    const hiredRoles = new Set((listing.applicants || []).filter((a) => a.status === "hired" || a.talentId === applicant.talentId).map((a) => talentById(a.talentId)?.role).filter(Boolean));
    const filled = listing.role === "both" ? (hiredRoles.has("guide") && hiredRoles.has("driver")) : true;
    if (filled) {
      setListings((L) => L.map((l) => (l.id === listing.id ? { ...l, status: "filled" } : l)));
      if (CLOUD) { const { error: jfErr } = await supabase.from("job_listings").update({ status: "filled" }).eq("id", listing.id); if (jfErr) console.error("job_listings.filled failed:", jfErr.message); }
    }
    if (CLOUD) fetchJobs();
    else createTripFromJob({ id: `${listing.id}_${applicant.talentId}`, toTalentId: applicant.talentId, operator: listing.operator, title: listing.title, start: listing.start, end: listing.end });
    return { ok: true };
  };

  // The HTML splash (index.html) stays up until the first real screen is known: the review form, the sign-in
  // screen (no session), or the app itself (session + profile loaded, or the profile this phone remembers while the
  // sign-in can't be checked). A 12 s cap makes sure it never sticks.
  const splashReady = Boolean(reviewToken) || splashTimedOut || Boolean(offlineMe) || (sessionKnown && (!session || myProfile !== null));
  useEffect(() => { if (splashReady && typeof window !== "undefined" && window.__bthSplashDone) window.__bthSplashDone(); }, [splashReady]);

  if (reviewToken) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen w-full flex justify-center" style={{ background: C.bg }}>
          <div className="w-full max-w-[860px] flex flex-col" style={{ minHeight: "100dvh", background: C.bg }}>
            <GuestReview token={reviewToken} />
          </div>
        </div>
        <Toaster />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-root min-h-screen w-full flex justify-center" style={{ background: C.bg }}>
      <style>{`
        *{ font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", "Helvetica Neue", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif; font-feature-settings: "cv11", "ss01", "ss03"; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
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
        @media (prefers-reduced-motion: no-preference){ .fade{ animation: fade .28s ease both; } }
        @keyframes fade{ from{ opacity:0; transform: translateY(4px);} }
        .fade{ animation-duration:.2s; animation-fill-mode: backwards !important; }
        textarea:focus, input:focus{ outline:none; border-color:${C.pine}!important; box-shadow:0 0 0 3px ${C.pine}1f; }
        textarea::placeholder, input::placeholder{ color:${C.muted}; opacity:.7; }

        /* ── layout: one source of truth for every screen size ─────────────── */
        /* always exactly screen-height: dvh where the browser supports it, vh where it doesn't */
        .app-shell{ height: 100vh; height: 100dvh; width: 100%; max-width: 28rem; }
        .side-rail{ display: none; }
        /* header + content + bottom bar, as a column at EVERY width; min-height:0 lets content scroll */
        .main-col{ flex: 1 1 0%; min-height: 0; min-width: 0; display: flex; flex-direction: column; }
        button, select, label[for]{ cursor: pointer; }
        /* pop-up sheets and the story viewer always sit ABOVE the bottom bar (layer 240),
           so their last button can never be trapped underneath it */
        .fixed.inset-0.items-end{ z-index: 260 !important; }
        .story-viewer{ z-index: 255 !important; }
        button:disabled{ cursor: default; }

        /* tablets: the whole width, content at a readable measure */
        @media (min-width: 640px){
          .app-shell.signed-in{ max-width: none; }
          .signed-in .content-pad{ max-width: 640px; margin: 0 auto; width: 100%; }
        }

        /* landscape tablets, laptops, desktops: full screen, navigation at the side */
        @media (min-width: 900px){
          .app-shell.signed-in{ flex-direction: row !important; }
          .signed-in .side-rail{
            display: flex; flex-direction: column;
            width: 232px; flex: 0 0 232px; height: 100%;
            background: ${C.card}; border-right: 1px solid ${C.line};
            padding: 18px 12px; overflow-y: auto;
          }
          .bottom-bar, .hide-wide{ display: none !important; }
          .signed-in .content-pad{ max-width: 760px; }
          .signed-in .topbar{ justify-content: center; padding-left: 24px; padding-right: 24px; }
          .signed-in .topbar > .flex-1{ max-width: 760px; }
          /* sheets become centred dialogs, not full-width drawers */
          .fixed.inset-0.items-end{ align-items: center !important; justify-content: center; padding: 24px; }
          .fixed.inset-0.items-end > .rounded-t-3xl{ max-width: 560px; border-radius: 24px !important; }
          /* full-screen views keep the rail visible and centre their content */
          .post-detail{ left: 232px !important; padding-bottom: 0 !important; }
          .post-detail > .overflow-y-auto > *{ max-width: 760px; margin-left: auto; margin-right: auto; }
          .story-viewer > div{ max-width: 460px; width: 100%; margin: 0 auto; }
        }
        @media (min-width: 1440px){
          .signed-in .content-pad{ max-width: 840px; }
        }

        /* ── Apple layer: white, hairlines, one blue, restrained motion ───────── */
        /* Type scale and rhythm: one large title per screen, grouped headers below with air above them */
        .section-head{ margin-top: 28px; }
        .section-head:first-child{ margin-top: 0; }
        .fade > div > .section-head:first-child .section-head-text{ font-size: 28px; line-height: 1.15; font-weight: 700; letter-spacing: -.022em; text-transform: none; color: #1D1D1F !important; }
        .fade > div > .section-head:first-child{ margin-bottom: 14px; }
        @media (min-width: 900px){ .fade > div > .section-head:first-child .section-head-text{ font-size: 32px; } }
        .content-pad p, .content-pad li{ line-height: 1.45; }
        .dk-map-sticky{ position: sticky; top: 8px; z-index: 20; background: #FFFFFF; padding-bottom: 6px; }
        .dk-note{ animation: noteIn .32s cubic-bezier(.2,.8,.2,1) both; }
        .dk-note-under{ animation: fade .25s ease both; }
        .dk-note-over{ animation: noteUp .28s cubic-bezier(.2,.8,.2,1) both; }
        .dk-note-side{ animation: noteSide .28s cubic-bezier(.2,.8,.2,1) both; }
        .dk-ter-labels > *{ position: absolute; left: 0; top: 0; white-space: nowrap; will-change: transform; }
        .dk-ter-stop{ pointer-events: auto; display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px 2px 2px; border-radius: 999px; background: rgba(255,255,255,.95); border: 1px solid rgba(0,0,0,.15); box-shadow: 0 1px 3px rgba(0,0,0,.3); font: 600 11px/1 -apple-system, Inter, system-ui, sans-serif; color: #1D1D1F; cursor: pointer; }
        .dk-ter-stop .dk-ter-n{ width: 18px; height: 18px; border-radius: 50%; background: #0066CC; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
        .dk-ter-stop.on{ background: #7A2E2E; color: #fff; border-color: #fff; } .dk-ter-stop.on .dk-ter-n{ background: #fff; color: #7A2E2E; }
        .dk-ter-pass{ font: 600 10.5px/1.2 -apple-system, Inter, system-ui, sans-serif; color: #fff; text-shadow: 0 0 3px rgba(0,0,0,.95), 0 0 6px rgba(0,0,0,.6); }
        .dk-ter-pick{ font: 700 11px/1.2 -apple-system, Inter, system-ui, sans-serif; padding: 3px 7px; border-radius: 6px; background: rgba(255,255,255,.96); color: #1D1D1F; border: 1px solid rgba(0,0,0,.2); box-shadow: 0 1px 3px rgba(0,0,0,.25); }
        @keyframes noteSide{ from{ opacity: 0; transform: translateX(10px); } to{ opacity: 1; transform: none; } }
        @keyframes noteUp{ from{ opacity: 0; transform: translateY(10px); } to{ opacity: 1; transform: none; } }
        @keyframes segIn{ from{ opacity: 0; } to{ opacity: 1; } }
        .dk-seg{ animation: segIn .5s ease both; }
        .dk-gm-label{ text-shadow: 0 0 3px rgba(0,0,0,.95), 0 0 1px rgba(0,0,0,.95); white-space: nowrap; }
        .dk-libre .maplibregl-ctrl-attrib{ font-size: 9px; opacity: .85; }
        .dk-libre .maplibregl-ctrl-group{ border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
        @keyframes noteIn{ from{ opacity: 0; transform: translateY(-50%) scale(.96); } to{ opacity: 1; transform: translateY(-50%) scale(1); } }
        .app-root{ background: #FFFFFF !important; }
        h1, h2, h3{ letter-spacing: -.022em; }
        .main-col{ position: relative; }
        .topbar{ position: absolute; top: 0; left: 0; right: 0; z-index: 230;
          background: rgba(255,255,255,.94) !important; border-bottom: 1px solid rgba(0,0,0,.08) !important;
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
        .bottom-bar{ position: absolute !important; left: 0; right: 0; bottom: 0; z-index: 240;
          background: rgba(255,255,255,.94) !important; border-top: 1px solid rgba(0,0,0,.08) !important;
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
        .bottom-bar .absolute.pointer-events-none{ display: none; }
        .scroll-area{ padding-top: calc(56px + var(--sa-top)); padding-bottom: calc(60px + var(--sa-bottom)); }
        .signed-in .side-rail{ background: #FFFFFF !important; border-right: 1px solid rgba(0,0,0,.08) !important; }
        /* cards: hairline only; the brief asks for restraint */
        div[style*="background:#FFFFFF"][class*="rounded-2xl"],
        div[style*="background:#FFFFFF"][class*="rounded-xl"]{ box-shadow: none; }
        /* primary action: Apple blue, flat, rounded */
        button[style*="background:#0066CC"]{ box-shadow: none; }
        button[style*="background:#0066CC"]:hover{ filter: brightness(1.06); }
        button[style*="background:#0066CC"]:active{ filter: brightness(.92); }
        button[style*="background:#7A2E2E"]:active{ filter: brightness(.92); }
        /* secondary: iOS tinted grey, no border */
        button[style*="background:#FFFFFF"][style*="border:1px solid #E2E2E7"]{ background: #F5F5F7 !important; border-color: transparent !important; }
        button[style*="background:#FFFFFF"][style*="border:1px solid #E2E2E7"]:hover{ background: #ECECF1 !important; }
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, a:focus-visible{ outline: none; box-shadow: 0 0 0 3px rgba(0,102,204,.35) !important; }
        input, textarea, select{ font-size: max(16px, 1em); }
        .tap{ transition: transform .16s cubic-bezier(.2,.7,.2,1), background .18s ease, color .18s ease, filter .18s ease, box-shadow .18s ease, border-color .18s ease; }
        .tap:active{ transform: scale(.97); }
        .seg-ind{ transition: transform .22s cubic-bezier(.2,.8,.2,1), width .22s cubic-bezier(.2,.8,.2,1), opacity .15s ease; }
        @keyframes sheetUp{ from{ transform: translateY(24px); opacity: .6; } to{ transform: none; opacity: 1; } }
        @keyframes dimIn{ from{ opacity: 0; } to{ opacity: 1; } }
        .sheet-dim{ animation: dimIn .2s ease both; }
        .sheet-panel{ animation: sheetUp .26s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce){
          *, *::before, *::after{ animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
        }
        @media (min-width: 900px){
          .scroll-area{ padding-bottom: 0; }
          .topbar{ background: #FFFFFF !important; }
          .sheet-dim{ align-items: center; justify-content: center; }
          .sheet-panel{ max-width: 560px; border-radius: 20px !important; }
        }
      `}</style>

      <div className={`app-shell flex flex-col${user ? " signed-in" : ""}`} style={{ color: C.ink }}>
        {!user ? (
          <Login onPick={setAccountId} session={session} myProfile={myProfile} onAuthed={reloadMe} onBusy={setAuthBusy} invitePreview={invitePreview} attestPreview={attestPreview} />
        ) : !NAV[user.kind] ? (
          <RoleComingSoon user={user} onLogout={logout} />
        ) : (
          <InvitesCtx.Provider value={{ invites, creditRequests }}>
          <Shell key={user.id + ":" + user.kind} user={user} posts={posts} jobs={jobs} trips={trips} listings={listings} enquiries={enquiries} dirTick={dirTick} live={dataLive} settled={listsLive} signedIn={!CLOUD || Boolean(session)} attest={{ attestToken, attestPreview, forgetAttest }}
            actions={{ addPost, approve, reject, deletePost, reloadDirectory: loadProfiles, setAvailability, toggleFollow, sendJob, setJobStatus, postChat, openChat, postListing, applyToListing, setApplicant, hireApplicant, saveEnquiry, setEnquiryStatus, convertEnquiry, reloadTrips: fetchTrips, binListing, destroyListing, binRequest, destroyRequest, saveTripDetails, createInvite, cancelInvite, respondInvite }} engagement={{ likes, comments, toggleLike, addComment, deleteComment, follows, toggleFollow, stories, addStory, deleteStory }} dm={{ dms, sendDm, markRead, sharePostTo }} onLogout={logout} initialOpen={openParam} />
          </InvitesCtx.Provider>
        )}
      </div>
    </div>
    <UpdateNotice update={update} />
    <Toaster />
    </ErrorBoundary>
  );
}

/* ================================ Welcome ================================= */
function Login({ onPick, session, myProfile, onAuthed, onBusy, invitePreview, attestPreview }) {
  const [authView, setAuthView] = useState(null);
  useEffect(() => { onBusy && onBusy(!!authView); return () => onBusy && onBusy(false); }, [authView]);
  if (authView) {
    return (
      <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
        <Onboard mode={authView} session={session} invite={invitePreview || (attestPreview ? { role: "operator", name: "" } : null)}
          onBack={() => { setAuthView(null); onBusy && onBusy(false); }}
          onDone={() => { onBusy && onBusy(false); setAuthView(null); onAuthed(); }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
      <div className="min-h-full flex flex-col px-6 pt-6 pb-6">
        <OfflineBar>Signing in or joining needs a connection.</OfflineBar>
        {/* brand */}
        <div className="flex items-center gap-3">
          <BrandMark size={44} />
          <div>
            <div className="text-[17px] font-semibold tracking-[-0.01em] leading-none" style={{ color: C.ink }}>Bhutan Tourism Hub</div>
            <div className="text-[10px] font-semibold tracking-[.14em] uppercase mt-1.5" style={{ color: C.goldText }}>Guides · Drivers · Operators</div>
          </div>
        </div>

        {attestPreview && !invitePreview && (
          <div className="mt-5 rounded-2xl p-4" style={{ background: C.goldSoft, border: `1px solid ${C.gold}33` }}>
            <div className="text-[11px] font-semibold tracking-[.12em] uppercase" style={{ color: C.goldText }}>A past trip to confirm</div>
            <div className="text-[15px] font-semibold mt-1 leading-snug" style={{ color: C.ink }}>
              {attestPreview.talent} asks {attestPreview.operator} to confirm “{attestPreview.trip}”{attestPreview.year ? ` (${attestPreview.year})` : ""}
            </div>
            <div className="text-[13px] mt-2 leading-snug" style={{ color: C.goldText }}>Sign in, or join as a tour operator, and you can answer in one tap.</div>
          </div>
        )}
        {invitePreview && (
          <div className="mt-5 rounded-2xl p-4" style={{ background: C.pineSoft, border: `1px solid ${C.pine}22` }}>
            <div className="text-[11px] font-semibold tracking-[.12em] uppercase" style={{ color: C.pine }}>You've been invited</div>
            <div className="text-[15px] font-semibold mt-1 leading-snug" style={{ color: C.ink }}>
              {invitePreview.operator} wants you as <span className="capitalize">{invitePreview.role}</span> for “{invitePreview.trip}”
            </div>
            {invitePreview.start && (
              <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>
                {fmtDate(invitePreview.start)}{invitePreview.end ? ` – ${fmtDate(invitePreview.end)}` : ""}
              </div>
            )}
            <div className="text-[13px] mt-2 leading-snug" style={{ color: C.pine }}>
              Join the hub, add your licence and profile, then accept the trip.
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="inline-flex items-center gap-2 rounded-full pl-2.5 pr-3 py-1.5" style={{ background: C.goldSoft }}>
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: C.goldText }} />
            <span className="text-[11px] font-bold tracking-[.08em] uppercase" style={{ color: C.goldText }}>Early access</span>
          </div>
        </div>

        {/* the story — what every role shares */}
        <figure className="mt-5">
          <img src="/four-friends.png" draggable="false"
            alt="The Four Harmonious Friends: an elephant carries a monkey, a rabbit and a bird, and the bird reaches the fruit of a tree"
            className="w-full rounded-2xl block"
            style={{ aspectRatio: "3 / 2", objectFit: "cover", background: C.pine }} />
          <figcaption className="text-[12px] font-semibold mt-2" style={{ color: C.goldText }}>
            Thuenpa Puen Zhi — the Four Harmonious Friends
          </figcaption>
        </figure>

        <h1 className="mt-4 text-[30px] leading-[1.12] font-semibold tracking-[-0.02em]" style={{ color: C.ink }}>
          No one reaches it alone.
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: C.muted }}>
          Like the four friends beneath the tree, guides, drivers and operators each bring what
          the others can't — so every visitor reaches the best of Bhutan.
        </p>

        {/* actions — anchored low on tall screens, within thumb reach */}
        <div className="mt-auto pt-7">
          <button onClick={() => setAuthView("signup")}
            className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16px] font-semibold"
            style={{ height: 56, background: C.pine, color: "#fff", boxShadow: `0 10px 24px ${C.pine}40` }}>
            Join the hub <ArrowRight size={19} strokeWidth={2.4} />
          </button>
          <button onClick={() => setAuthView("signin")}
            className="tap w-full rounded-2xl text-[15px] font-semibold mt-3"
            style={{ height: 52, background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}>
            I already have an account
          </button>
          <p className="text-center text-[13px] mt-4" style={{ color: C.muted }}>
            Free for licensed guides, drivers and tour operators.
          </p>
          <p className="text-center text-[10px] mt-3" style={{ color: C.muted }}>{BUILD} · {DEVICE}</p>
        </div>
      </div>
    </div>
  );
}

/* The dzong mark — drawn in code, so the logo never depends on a file loading */
function BrandMark({ size = 40, label = "", className = "", tile = false }) {
  // The hub's mark: a sun disc holding two ridges. `tile` draws it on the pine squircle (OS icon style);
  // the default is the bare disc, which sits on white the way the splash does.
  const uid = tile ? "bthT" : "bthM";
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} role={label ? "img" : undefined}
      aria-label={label || undefined} aria-hidden={label ? undefined : "true"}
      className={`shrink-0 select-none ${className}`} style={{ width: size, height: size, display: "block" }}>
      <defs>
        <linearGradient id={uid + "Au"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3E8CF" /><stop offset="1" stopColor="#DDB45A" /></linearGradient>
        {tile && <linearGradient id={uid + "Bg"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2C4F3B" /><stop offset="1" stopColor="#142619" /></linearGradient>}
        <clipPath id={uid + "Disc"}><circle cx="512" cy="512" r={tile ? 310 : 420} /></clipPath>
      </defs>
      {tile && <rect width="1024" height="1024" rx="228" fill={`url(#${uid}Bg)`} />}
      <circle cx="512" cy="512" r={tile ? 310 : 420} fill={`url(#${uid}Au)`} />
      {tile ? (
        <g clipPath={`url(#${uid}Disc)`}>
          <path d="M140 840 L372 470 L470 600 L586 418 L900 840 Z" fill="#1F3A2B" />
          <path d="M120 900 L420 660 L548 780 L690 620 L920 900 Z" fill="#0F1F16" />
        </g>
      ) : (
        <g clipPath={`url(#${uid}Disc)`}>
          <path d="M10 960 L323 458 L455 634 L612 388 L1040 960 Z" fill="#2C4F3B" />
          <path d="M-20 1040 L387 715 L560 878 L753 661 L1064 1040 Z" fill="#16281E" />
        </g>
      )}
    </svg>
  );
}

/* ================================= Shell ================================== */
const NAV = {
  guide: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "jobs", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: MapIcon }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  driver: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "jobs", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: MapIcon }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  operator: [{ id: "bookings", label: "Bookings", Icon: CalendarCheck }, { id: "insights", label: "Insights", Icon: TrendingUp }, { id: "itinerary", label: "Itinerary", Icon: CalendarDays }, { id: "discover", label: "Crew", Icon: Search }, { id: "requests", label: "Jobs", Icon: Briefcase }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "feed", label: "Feed", Icon: Newspaper }],
  admin: [{ id: "review", label: "Review", Icon: ShieldCheck }, { id: "users", label: "Users", Icon: Users }, { id: "insights", label: "Insights", Icon: TrendingUp }, { id: "feed", label: "Feed", Icon: Newspaper }, { id: "discover", label: "Discover", Icon: Search }, { id: "chats", label: "Messages", Icon: MessageSquare }],
  hotel: [{ id: "hotel_home", label: "Today", Icon: Building2 }, { id: "bookings", label: "Bookings", Icon: CalendarCheck }, { id: "rooms", label: "Rooms", Icon: BedDouble }, { id: "post", label: "Feed", Icon: Newspaper }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "hotel_profile", label: "Property", Icon: User }],
};
/* Accounts whose role has no app yet (e.g. "business"/hotel) get a calm holding
   screen instead of crashing on NAV[role].length. */
function RoleComingSoon({ user, onLogout }) {
  const isHotel = /business|hotel/i.test(user.kind || "");
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: C.card, border: `1px solid ${C.lineSoft}` }}>
        <div className="text-[20px] font-semibold mb-2" style={{ color: C.ink }}>
          {isHotel ? "Hotel accounts are coming soon" : "Your account type is coming soon"}
        </div>
        <p className="text-[15px] mb-6 leading-relaxed" style={{ color: C.muted }}>
          {user.name ? `Thanks, ${user.name.split(" ")[0]}. ` : ""}You're signed in and your account is saved.
          {isHotel ? " The hotel tools aren't open yet. We'll let you know as soon as they are." : " This part of the app isn't open yet. We'll let you know as soon as it is."}
        </p>
        <OCta onClick={onLogout}>Sign out</OCta>
      </div>
    </div>
  );
}
const DEFAULT_TAB = { guide: "post", driver: "post", operator: "bookings", admin: "review", hotel: "hotel_home" };

// live: the server has answered for this person in this session · settled: their member directory has loaded too
// signedIn: a sign-in the server will accept (BUILD 55)
function Shell({ user, posts, jobs, trips, listings, enquiries, actions, engagement, dm, dirTick, onLogout, attest, initialOpen, live = true, settled = true, signedIn = true }) {
  const { attestToken, attestPreview, forgetAttest } = attest || {};
  const { invites: crewInvites, creditRequests: openCreditRequests } = React.useContext(InvitesCtx);
  const [tab, setTab] = useState(() => tabForOpen(initialOpen, user.kind) || DEFAULT_TAB[user.kind]);
  const [overlay, setOverlay] = useState(null); // {type:'profile'|'request', talentId}
  const [dmWith, setDmWith] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const lastAlertCount = useRef(0);
  // BUILD 55: alerts reach this phone when the app is closed (push); the bell lists the server's reminders too,
  // counts only what hasn't been seen, and still shows the last list when offline.
  const [pushState, setPushState] = useState(() => pushStateNow());
  const [nudges, setNudges] = useState([]);
  const [freshIds, setFreshIds] = useState(() => new Set());
  const seenKey = "bth_alerts_seen_" + (user.talentId || user.id);
  const [seenIds, setSeenIds] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(seenKey) || "[]")); } catch (e) { return new Set(); } });
  const online = useOnline();
  const [tripFocus, setTripFocus] = useState(null);   // { id, sheet, n }: a trip a notification asked to open
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
      if (!isStandalone() && !localStorage.getItem("bth_install_dismissed")) setInstallSheet(true);
    }, 45000);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); clearTimeout(t); };
  }, []);

  const nav = NAV[user.kind];
  const actorId = user.talentId || user.id;
  const hotelData = useHotelData(user);
  const hotelPending = user.kind === "hotel" ? hotelData.bookings.filter((b) => b.status === "requested" && b.checkOut >= new Date().toISOString().slice(0, 10)).length : 0;
  const eng = { ...engagement, me: actorId, isAdmin: user.kind === "admin", sharePostTo: dm?.sharePostTo };

  // BUILD 55: the one way to move between tabs from outside the navigation — whatever is on top closes first,
  // so a tap from the bell or a notification never lands behind an open profile
  const goTab = (t) => { if (!t) return; setOverlay(null); setSharedPost(null); setAlertsOpen(false); setTab(t); };
  const openTrip = (tripId, sheet) => {
    const t = tabForOpen("trips", user.kind);
    if (t && tripId) setTripFocus({ id: tripId, sheet: sheet || null, n: Date.now() });
    goTab(t);
  };

  // push: claim this device on every launch, whenever the connection returns, and once the sign-in is confirmed
  // (browsers rotate push keys; a shared phone may have changed hands)
  useEffect(() => {
    let on = true;
    if (online && signedIn && pushStateNow() === "on") ensurePush().then((st) => { if (on) setPushState(st); });
    return () => { on = false; };
  }, [actorId, online, signedIn]);
  // a notification tapped while the app is open
  useEffect(() => {
    const onOpen = (e) => goTab(tabForOpen(e.detail, user.kind));
    window.addEventListener("bth-open", onOpen);
    return () => window.removeEventListener("bth-open", onOpen);
  }, [user.kind]);
  // reminders the server writes (system_nudges, review_nudges) — the ones the app cannot work out by itself.
  // Left out: what the bell already shows from live data, and "grade-crew" (there is no grading in the app yet).
  const NUDGE_SKIP = { trip3: 1, trip1: 1, "lic-redo": 1, lic30: 1, licexp: 1, "job-new": 1, ended: 1, "grade-crew": 1 };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const loadNudges = async () => {
    if (!CLOUD || !signedIn) return;   // without the sign-in the server would answer with nothing: keep what is shown
    const since = new Date(Date.now() - 30 * 86400e3).toISOString();
    const [S, R] = await Promise.all([
      supabase.from("system_nudges").select("id,kind,ref,title,body,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(40),
      user.kind === "operator"
        ? supabase.from("review_nudges").select("id,kind,trip_id,title,body,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (S.error || R.error) return;   // offline, or a hiccup: keep what is shown
    const sys = (S.data || []).filter((r) => !NUDGE_SKIP[r.kind]);
    // "a guest reviewed X" names the review, not the trip: look the trips up (the operator may read those reviews)
    const reviewIds = sys.filter((r) => r.kind === "review-approve" && UUID.test(r.ref || "")).map((r) => r.ref);
    const tripOfReview = {};
    if (reviewIds.length) {
      const { data: G } = await supabase.from("guest_reviews").select("id,trip_id").in("id", reviewIds);
      (G || []).forEach((g) => { tripOfReview[g.id] = g.trip_id; });
    }
    const rows = [
      ...sys.map((r) => ({ id: `sn-${r.id}`, kind: r.kind, title: r.title, body: r.body, created_at: r.created_at,
        tripId: r.kind === "review-approve" ? tripOfReview[r.ref] || null : null, sheet: r.kind === "review-approve" ? "reviews" : null })),
      ...(R.data || []).filter((r) => !NUDGE_SKIP[r.kind]).map((r) => ({ id: `rn-${r.id}`, kind: r.kind, title: r.title, body: r.body,
        created_at: r.created_at, tripId: r.trip_id || null, sheet: "reviews" })),
    ];
    setNudges(rows.map((r) => ({
      id: r.id, kind: "nudge", who: null, title: r.title, text: r.body, ts: new Date(r.created_at).getTime(),
      open: /^(lic|doj)/.test(r.kind) ? "profile" : "trips", tripId: r.tripId || null, sheet: r.sheet })));
  };
  useEffect(() => {
    loadNudges();
    const onVisible = () => { if (document.visibilityState === "visible") loadNudges(); };
    const onPush = () => loadNudges();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("bth-push", onPush);
    return () => { document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("bth-push", onPush); };
  }, [actorId, online, signedIn]);

  const alertItems = useMemo(() => {
    try {
    const out = [];
    const seen = new Set();
    const add = (o) => { if (!seen.has(o.id)) { seen.add(o.id); out.push(o); } };

    // messages sent to me
    (dm?.dms || []).filter((m) => m.to === actorId && !m.read).forEach((m) =>
      add({ id: `dm-${m.id}`, kind: m.official ? "official" : m.sharedPostId ? "share" : "message",
        who: m.from, text: m.body, ts: m.ts, urgent: m.official }));

    // likes and comments on my posts
    (engagement?.likes || []).forEach((l) => {
      const p = (posts || []).find((x) => x && x.id === l.post_id && x.talentId === actorId);
      if (p && l.liker_id !== actorId) add({ id: `like-${l.post_id}-${l.liker_id}`, kind: "like", who: l.liker_id, text: p.text || "your post", ts: l.ts || p.createdAt });
    });
    (engagement?.comments || []).forEach((c) => {
      const p = (posts || []).find((x) => x && x.id === c.post_id && x.talentId === actorId);
      if (p && c.author_id !== actorId) add({ id: `cm-${c.id}`, kind: "comment", who: c.author_id, text: c.body, ts: c.ts });
    });

    // new followers
    (engagement?.follows || []).filter((f) => f.following === actorId).forEach((f) =>
      add({ id: `fl-${f.follower}`, kind: "follow", who: f.follower, text: "", ts: f.ts || 0 }));

    // direct job requests to me
    (jobs || []).filter((j) => j && !j.deletedAt && j.toTalentId === actorId && j.status === "pending").forEach((j) =>
      add({ id: `job-${j.id}`, kind: "job", who: j.operatorId, text: j.title, ts: j.createdAt }));
    // answers to the requests I sent
    (jobs || []).filter((j) => j && !j.deletedAt && j.operatorId === actorId && j.respondedAt && Date.now() - j.respondedAt < 7 * 86400e3 && (j.status === "accepted" || j.status === "declined")).forEach((j) =>
      add({ id: `jobans-${j.id}-${j.status}`, kind: j.status === "accepted" ? "jobAccepted" : "jobDeclined", who: j.toTalentId, text: `${j.title} · ${fmtDate(j.start)}–${fmtDate(j.end)}${j.declineReason === "booked" ? " · booked by another operator for these dates" : ""}`, ts: j.respondedAt }));

    // open listings matching my role (guides see guide jobs, drivers see driver jobs)
    if (user.kind === "guide" || user.kind === "driver") {
      (listings || []).filter((l) => l && !l.deletedAt && l.status === "open" && listingFits(l, user.kind) &&
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

    /* ---- Room bookings: hotels hear about requests, operators about answers ---- */
    (hotelData.bookings || []).forEach((b) => {
      if (user.kind === "hotel" && b.status === "requested" && b.checkOut >= new Date().toISOString().slice(0, 10))
        add({ id: `room-${b.id}`, kind: "roomRequest", who: b.operatorId, text: `${b.rooms} ${b.rooms === 1 ? "room" : "rooms"} · ${fmtDate(b.checkIn)}–${fmtDate(b.checkOut)}`, ts: b.createdAt, urgent: Date.now() - b.createdAt > 86400e3 });
      if (user.kind === "operator" && b.respondedAt && Date.now() - b.respondedAt < 7 * 86400e3 && (b.status === "confirmed" || b.status === "declined"))
        add({ id: `room-${b.id}-${b.status}`, kind: b.status === "confirmed" ? "roomConfirmed" : "roomDeclined", who: b.hotelId, text: `${fmtDate(b.checkIn)}–${fmtDate(b.checkOut)}${b.hotelNote ? ` · ${b.hotelNote}` : ""}`, ts: b.respondedAt });
    });

    /* ---- Crew invitations ---- */
    (crewInvites || []).forEach((inv) => {
      if (inv.talentId === actorId && inv.status === "pending")
        add({ id: `crew-${inv.id}`, kind: "crewRequest", who: null, text: `${inv.operatorName || "An operator"} · ${inv.tripTitle}`, ts: inv.createdAt, urgent: true });
      if (inv.operatorId === actorId && inv.status === "accepted" && inv.respondedAt && Date.now() - inv.respondedAt < 7 * 86400e3)
        add({ id: `crewjoin-${inv.id}`, kind: "crewJoined", who: inv.talentId, text: inv.tripTitle, ts: inv.respondedAt });
    });

    /* ---- Operators asking for more AI drafts (admins) ---- */
    (openCreditRequests || []).forEach((r) => {
      add({ id: `credit-${r.id}`, kind: "creditRequest", who: r.operator_id, text: `${r.pack || ""} drafts${r.note ? ` · ${r.note}` : ""}`,
            ts: r.created_at ? new Date(r.created_at).getTime() : Date.now(), urgent: true });
    });

    /* ---- Reminders about your own account ---- */
    const me = PROFILE_DIR[actorId];
    const DAY = 86400e3;

    // your licence is expiring, or has expired
    if (me?.licenseExpiry) {
      const days = Math.ceil((new Date(me.licenseExpiry + "T23:59") - Date.now()) / DAY);
      if (days < 0) {
        add({ id: `lic-expired-${actorId}`, kind: "licenceExpired", who: actorId,
          text: `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago`, ts: Date.now(), urgent: true });
      } else if (days <= 60) {
        add({ id: `lic-soon-${actorId}-${Math.floor(days / 7)}`, kind: "licenceSoon", who: actorId,
          text: days === 0 ? "Expires today" : `${days} ${days === 1 ? "day" : "days"} left`,
          ts: Date.now(), urgent: days <= 14 });
      }
    }

    // the profile is thin — operators filter on exactly these fields
    if ((user.kind === "guide" || user.kind === "driver") && me) {
      if (!(me.tags || []).length) {
        add({ id: `prof-tags-${actorId}`, kind: "profileThin", who: actorId,
          text: "Add your specialities — operators filter by them", ts: Date.now() });
      } else if (!(me.languages || []).length) {
        add({ id: `prof-langs-${actorId}`, kind: "profileThin", who: actorId,
          text: "Add your languages — operators search by them", ts: Date.now() });
      }
    }

    // your licence needs attention
    if (user.licenseStatus === "rejected") {
      add({ id: `lic-rejected-${actorId}`, kind: "licenceRejected", who: actorId,
        text: "Upload a clearer photo from your profile", ts: Date.now(), urgent: true });
    } else if (user.licenseStatus === "none") {
      add({ id: `lic-missing-${actorId}`, kind: "licenceMissing", who: actorId,
        text: "Operators prioritise verified crew", ts: Date.now() });
    }

    // a trip you're crewing has no flight details yet — you can't plan your day
    if (user.kind === "guide" || user.kind === "driver") {
      (trips || []).forEach((tr) => {
        if (!tr || !tr.start) return;
        if (!(tr.members || []).some((m) => m && m.id === actorId)) return;
        const d = Math.ceil((new Date(tr.start + "T00:00") - Date.now()) / DAY);
        if (d >= 0 && d <= 7 && !tr.arrivalFlight) {
          add({ id: `noflight-${tr.id}`, kind: "briefMissing", who: null,
            text: `${tr.title} — ask the operator for the arrival flight`,
            ts: Date.now(), urgent: d <= 2, tripId: tr.id });
        }
      });
    }

    // a trip of yours starts soon
    (trips || []).forEach((tr) => {
      if (!tr || !tr.start) return;
      const onIt = (tr.members || []).some((m) => m && m.id === actorId) || tr.operatorId === actorId;
      if (!onIt) return;
      const days = Math.ceil((new Date(tr.start + "T00:00") - Date.now()) / DAY);
      if (days >= 0 && days <= 3) {
        add({ id: `trip-soon-${tr.id}`, kind: "tripSoon", who: null,
          text: `${tr.title} · ${days === 0 ? "starts today" : days === 1 ? "starts tomorrow" : `in ${days} days`}`,
          ts: Date.now(), urgent: days <= 1, tripId: tr.id });
      }
    });

    // a trip has ended and nobody has been asked for a review yet
    if (user.kind === "operator") {
      (trips || []).forEach((tr) => {
        if (!tr || !tr.end || tr.operatorId !== actorId) return;
        const ended = new Date(tr.end + "T23:59") < new Date();
        const endedRecently = Date.now() - new Date(tr.end + "T23:59") < 21 * DAY;
        if (ended && endedRecently) {
          add({ id: `ask-review-${tr.id}`, kind: "askReview", who: null,
            text: tr.title, ts: new Date(tr.end + "T23:59").getTime(), tripId: tr.id, sheet: "reviews" });
        }
      });
    }

    /* ---- Reminders from the server (BUILD 55) ---- */
    (nudges || []).forEach(add);

    return out.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 50);
    } catch (e) { console.error('alertItems failed:', e); return []; }
  }, [dm?.dms, engagement?.likes, engagement?.comments, engagement?.follows, jobs, listings, posts, trips, actorId, dirTick, user.licenseStatus, crewInvites, openCreditRequests, hotelData.bookings, nudges]);

  // BUILD 55: what the bell shows. Once this session has loaded the person's data from the server: the live list,
  // kept on this phone for later. Before that — offline, on a signal that carries nothing, or in the first moments
  // after opening — the list last kept, plus the pushes that reached this phone since (the service worker keeps
  // those). Names travel with the kept list, because the member directory may not be there.
  const liveList = online && live;
  const cacheKey = "bth_alerts_cache_" + actorId;
  useEffect(() => {
    // a list made without the server's data would replace a good one with an empty one; and the directory, the
    // biggest list, loads last — by then the lists that feed the bell are in
    if (!liveList || !settled) return;
    const t = setTimeout(() => {
      if (CLOUD && !recallMe(actorId)) return;   // signed out meanwhile: keep nothing of theirs
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), items: alertItems.slice(0, 40).map((a) => {
          const p = a.who ? talentById(a.who) : null;
          return { id: a.id, kind: a.kind, who: a.who, text: a.text, ts: a.ts, urgent: a.urgent, tripId: a.tripId, title: a.title,
                   open: a.open, sheet: a.sheet, name: p ? p.name : undefined, initials: p ? p.initials : undefined };
        }) }));
      } catch (e) {}
    }, 2000);   // once the lists that load together have settled
    return () => clearTimeout(t);
  }, [alertItems, liveList, settled, cacheKey]);
  // the phone says it's online, yet this session has had nothing back from the server for a while: say so
  // (at once when the app is showing the remembered profile because the sign-in couldn't be checked)
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    if (liveList || !online) { setStalled(false); return; }
    const t = setTimeout(() => setStalled(true), signedIn ? 6000 : 0);
    return () => clearTimeout(t);
  }, [liveList, online, signedIn]);
  const [inbox, setInbox] = useState([]);
  useEffect(() => { claimPushInbox(actorId); }, [actorId]);
  useEffect(() => {
    if (liveList) return;
    let on = true;
    const merge = (cur, more) => [...more, ...cur.filter((y) => y && !more.some((z) => z && z.id === y.id))].slice(0, 30);
    readPushInbox().then((l) => { if (on) setInbox((cur) => merge(cur, l)); });
    // a push arriving now comes with the worker's message (its own copy may not be saved yet)
    const onPush = (e) => { const x = e && e.detail; if (x && x.id) setInbox((cur) => merge(cur, [x])); };
    window.addEventListener("bth-push", onPush);
    return () => { on = false; window.removeEventListener("bth-push", onPush); };
  }, [liveList]);
  const cachedAlerts = useMemo(() => {
    if (liveList) return null;
    try { return JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch (e) { return null; }
  }, [liveList, cacheKey]);
  const shownAlerts = useMemo(() => {
    if (liveList) return alertItems;
    const ids = new Set(), out = [];
    const add = (a) => { if (a && a.id && !ids.has(a.id)) { ids.add(a.id); out.push(a); } };
    alertItems.forEach(add);
    // only pushes newer than the kept list: older ones are in it already (under their own names), or were dealt with
    const since = (cachedAlerts && cachedAlerts.at) || 0;
    inbox.filter((x) => x && (x.ts || 0) > since).forEach((x) =>
      add({ id: x.id, kind: "push", who: null, title: x.title, text: x.body, ts: x.ts, open: openTargetOf(x.url) }));
    ((cachedAlerts && cachedAlerts.items) || []).forEach(add);
    return out.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 50);
  }, [liveList, alertItems, inbox, cachedAlerts]);
  // the badge: what hasn't been seen yet, plus anything that still needs doing (an urgent job listing, or a trip
  // starting tomorrow, is news rather than a task: it counts until it has been seen)
  const stillToDo = (a) => a.urgent && a.kind !== "listing" && a.kind !== "tripSoon";
  const unreadAlerts = shownAlerts.filter((a) => stillToDo(a) || !seenIds.has(a.id)).length;
  const openAlerts = () => {
    const ids = shownAlerts.map((a) => a.id);
    setFreshIds(new Set(ids.filter((id) => !seenIds.has(id))));
    const keep = new Set(ids);
    const next = [...ids, ...[...seenIds].filter((id) => !keep.has(id))].slice(0, 500);
    setSeenIds(new Set(next));
    try { localStorage.setItem(seenKey, JSON.stringify(next)); } catch (e) {}
    setAlertsOpen(true);
  };

  // notify the device when something new arrives
  useEffect(() => {
    const n = alertItems.length;
    if (n > lastAlertCount.current && lastAlertCount.current > 0) {
      const latest = alertItems[0];
      // with push on, the server already announces these; announcing them here too would double up
      const pushed = PUSH_ON && ["message", "share", "official", "job", "listing", "crewRequest", "crewJoined", "nudge",
        "roomRequest", "roomConfirmed", "roomDeclined"].includes(latest.kind);
      if (!pushed) {
        const who = talentById(latest.who)?.name || "Someone";
        const verbs = { message: "sent you a message", share: "shared a post", like: "liked your post",
          comment: "commented on your post", follow: "started following you", job: "sent a job request",
          listing: "posted a job you can apply for", applicant: "applied to your job", joined: "joined the hub" };
        if (latest.kind === "nudge") showDeviceNotification(latest.title || "Bhutan Tourism Hub", latest.text || "", latest.id);
        else showDeviceNotification("Bhutan Tourism Hub", `${who} ${verbs[latest.kind] || "sent you an update"}`, latest.id);
      }
    }
    lastAlertCount.current = n;
  }, [alertItems.length]);
  const myFollowing = (engagement?.follows || []).filter((f) => f.follower === actorId).map((f) => f.following);
  const unreadDm = (dm?.dms || []).filter((m) => m.to === actorId && !m.read).length;

  const pendingModCount = posts.filter((p) => p.status === "pending").length;
  const myTalent = user.talentId ? talentById(user.talentId) : null;
  const myJobsPending = myTalent ? jobs.filter((j) => !j.deletedAt && j.toTalentId === myTalent.id && j.status === "pending").length : 0;
  const availableListings = myTalent ? listings.filter((l) => !l.deletedAt && l.status === "open" && listingFits(l, user.kind) && !(l.applicants || []).some((a) => a.talentId === myTalent.id)).length : 0;
  const jobsBadge = myJobsPending + availableListings;
  const todayStr = new Date().toISOString().slice(0, 10);
  const enquiryBadge = (enquiries || []).filter((e) =>
    e && e.operatorId === actorId && ["new", "quoted", "cold", "lost"].includes(e.status) &&
    (!e.followUpOn || e.followUpOn <= todayStr)).length;

  const openProfile = (talentId) => setOverlay({ type: "profile", talentId });
  const openRequest = (talentId) => setOverlay({ type: "request", talentId });

  return (
    <>
      <SideRail user={user} nav={nav} tab={tab}
        setTab={(t) => { setOverlay(null); setSharedPost(null); setTab(t); }}
        badges={{ jobs: jobsBadge, review: pendingModCount, chats: unreadDm, bookings: user.kind === "hotel" ? hotelPending : enquiryBadge }}
        alerts={unreadAlerts} onOpenAlerts={openAlerts} onLogout={onLogout} />

      <div className="main-col">
      <TopBar user={user} onLogout={onLogout} alerts={unreadAlerts} onOpenAlerts={openAlerts}
        onSearch={(term) => { setOverlay(null); setTab(user.kind === "operator" ? "discover" : user.kind === "hotel" ? "bookings" : "post"); setSearchTerm(term); }} />

      <div className="scroll-area flex-1 min-h-0 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        <div className="content-pad">
        <OfflineBar connecting={stalled} />
        <VerifyBanner user={user} />
        {overlay ? (
          !talentById(overlay.talentId) ? (
            <ProfileMissing onBack={() => setOverlay(null)} />
          ) : overlay.type === "profile" ? (
            <TalentProfile key={overlay.talentId} talent={talentById(overlay.talentId)} posts={posts} eng={eng} trips={trips} jobs={jobs}
              onOpenProfile={openProfile}
              onMessage={(id) => { setOverlay(null); setTab("chats"); setDmWith(id); }}
              canRequest={user.kind === "operator"} self={user.talentId === overlay.talentId} contactOnly={user.kind === "admin"}
              onRequest={() => setOverlay({ type: "request", talentId: overlay.talentId })}
              onBack={() => setOverlay(null)} />
          ) : (
            <RequestForm key={overlay.talentId} talent={talentById(overlay.talentId)} operator={user.name}
              onBack={() => setOverlay({ type: "profile", talentId: overlay.talentId })}
              onSend={async (job) => { const r = await actions.sendJob(job); if (r && r.ok === false) return r; setOverlay(null); setTab("requests"); return r; }} />
          )
        ) : (
          <div key={tab} className="fade">
            {tab === "post" && <PostTab user={user} posts={posts} onAdd={actions.addPost} eng={eng} onOpenProfile={openProfile} />}
            {tab === "jobs" && <JobsHub user={user} jobs={jobs} listings={listings} actions={actions} trips={trips} />}
            {tab === "trips" && <TripsTab user={user} trips={trips} actions={actions} focus={tripFocus} onFocused={() => setTripFocus(null)} />}
            {tab === "chats" && <ChatsTab user={user} me={actorId} dm={dm} trips={trips} actions={actions} posts={posts} dirTick={dirTick} onOpenPost={setSharedPost} openWith={dmWith} onOpened={() => setDmWith(null)} onOpenProfile={openProfile} />}
            {tab === "profile" && !talentById(user.talentId) && <ProfileMissing self />}
            {tab === "profile" && talentById(user.talentId) && <TalentProfile talent={talentById(user.talentId)} posts={posts} eng={eng} trips={trips} jobs={jobs} self onSetAvailability={actions.setAvailability} onProfileSaved={actions.reloadDirectory} onOpenProfile={openProfile} onBack={null} />}
            {tab === "bookings" && user.kind !== "hotel" && <BookingsTab user={user} enquiries={enquiries} trips={trips} actions={actions} onOpenProfile={openProfile} focus={tripFocus} onFocused={() => setTripFocus(null)} />}
            {tab === "hotel_home" && <HotelHome user={user} data={hotelData} setTab={setTab} posts={posts} />}
            {tab === "bookings" && user.kind === "hotel" && <HotelBookings user={user} data={hotelData} />}
            {tab === "rooms" && <HotelRooms user={user} data={hotelData} />}
            {tab === "hotel_profile" && <HotelProfile user={user} onSaved={actions.reloadDirectory} />}
            {tab === "itinerary" && <QuickItinerary user={user} trips={trips} actions={actions} />}
            {tab === "insights" && <InsightsTab user={user} trips={trips} enquiries={enquiries} />}
            {tab === "discover" && <Discover onOpen={openProfile} initialQuery={searchTerm} dirTick={dirTick} />}
            {tab === "requests" && <OperatorJobs user={user} jobs={jobs} listings={listings} posts={posts} actions={actions} eng={eng} onOpen={openProfile} />}
            {tab === "feed" && <Feed posts={posts} eng={eng} admin={user.kind === "admin"} onDelete={actions.deletePost} onOpenProfile={openProfile} following={myFollowing} user={user} trips={trips} stays={hotelData} />}
            {tab === "review" && <Review posts={posts} onApprove={actions.approve} onReject={actions.reject} eng={eng} />}
            {tab === "users" && <AdminUsers onChanged={actions.reloadDirectory} currentAdminId={actorId} />}
          </div>
        )}
        </div>
      </div>

      {attestToken && attestPreview && user && (
        <AttestSheet user={user} token={attestToken} preview={attestPreview} onDone={forgetAttest} />
      )}
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
          onClose={() => { setInstallSheet(false); try { localStorage.setItem("bth_install_dismissed", "1"); } catch (e) {} }} />
      )}

      {alertsOpen && (
        <AlertsSheet items={shownAlerts} onClose={() => setAlertsOpen(false)}
          pushState={pushState} offline={!online} kept={!liveList} cachedAt={cachedAlerts && cachedAlerts.at} fresh={freshIds}
          onEnableNotify={async () => {
            const r = await askNotificationPermission();
            if (r === "granted") { setPushState("working"); setPushState(await ensurePush()); }
            else setPushState(pushStateNow());
          }}
          installed={installed}
          onInstall={() => { setAlertsOpen(false); setInstallSheet(true); }}
          onOpenProfile={(id) => { setAlertsOpen(false); setSharedPost(null); openProfile(id); }}
          onOpenMessages={() => goTab("chats")}
          onOpenJobs={() => goTab(user.kind === "operator" ? "requests" : user.kind === "hotel" ? "bookings" : "jobs")}
          onOpenTrips={() => goTab(user.kind === "operator" || user.kind === "hotel" ? "bookings" : "trips")}
          onOpenTrip={openTrip}
          onOpenTarget={(target) => goTab(tabForOpen(target, user.kind))}
          onOpenSelf={() => goTab(user.kind === "operator" || user.kind === "admin" ? "discover" : user.kind === "hotel" ? "hotel_profile" : "profile")}
          onOpenUsers={() => goTab("users")} />
      )}

      <BottomNav nav={nav} tab={tab}
        setTab={(t) => { setOverlay(null); setSharedPost(null); setTab(t); }}
        badges={{ jobs: jobsBadge, review: pendingModCount, chats: unreadDm, bookings: user.kind === "hotel" ? hotelPending : enquiryBadge }} />
      </div>
    </>
  );
}

// BUILD 55: shown where a profile should be but the directory doesn't have it (still loading, offline, removed)
function ProfileMissing({ onBack, self }) {
  const online = useOnline();
  if (self && online) {
    return <div className="flex items-center justify-center gap-2 py-16 text-[14px]" style={{ color: C.muted }}><Loader2 size={18} className="animate-spin" /> Loading your profile…</div>;
  }
  return (
    <div className="px-5 py-6 fade">
      <Empty Icon={User} title={online ? "Profile not available" : "You're offline"}
        body={online ? "It may still be loading, or it was removed. Try again in a moment." : "This profile opens once you're connected."} />
      {onBack && (
        <button type="button" onClick={onBack} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-3"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Back</button>
      )}
    </div>
  );
}

function TopBar({ user, onLogout, onSearch, alerts, onOpenAlerts }) {
  const [q, setQ] = useState("");
  const submit = () => { const t = q.trim(); if (t && onSearch) onSearch(t); };

  return (
    <div className="topbar shrink-0 flex items-center gap-2 px-2.5" style={{ height: "calc(56px + var(--sa-top))", paddingTop: "var(--sa-top)", background: C.bg, borderBottom: `1px solid ${C.lineSoft}` }}>
      <BrandMark size={34} label="Bhutan Tourism Hub" className="hide-wide" />

      <div className="relative flex-1 min-w-0">
        <Search size={15} color={C.muted} className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Search people or add friends"
          className="w-full h-9 pl-9 pr-3 rounded-full text-[14px]"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
      </div>

      <button onClick={onOpenAlerts} className="hide-wide tap relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Notifications">
        <Bell size={16} color={C.ink} />
        {alerts > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: C.maroon }}>{alerts > 9 ? "9+" : alerts}</span>
        )}
      </button>

      <button onClick={onLogout} className="hide-wide tap w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Sign out">
        <LogOut size={15} color={C.muted} />
      </button>
    </div>
  );
}

function BottomNav({ nav, tab, setTab, badges }) {
  const ref = useRef(null);

  // keep the active tab in view when the bar scrolls
  useEffect(() => {
    const el = ref.current?.querySelector('[data-on="1"]');
    if (el && el.scrollIntoView) {
      try { el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch (e) {}
    }
  }, [tab]);

  // scrolls sideways once there are more tabs than fit comfortably
  const scrolls = nav.length > 5;

  return (
    <div className="bottom-bar shrink-0 safe-bottom" style={{ background: C.card, borderTop: `1px solid ${C.line}`, position: "relative", zIndex: 240 }}>
      <div ref={ref}
        className={scrolls ? "flex overflow-x-auto hidescroll" : "flex"}
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {nav.map((n) => {
          const on = tab === n.id;
          const badge = badges[n.id] || 0;
          return (
            <button key={n.id} data-tab={n.id} data-on={on ? "1" : "0"} onClick={() => setTab(n.id)}
              className="tap py-2.5 flex flex-col items-center gap-1 relative shrink-0"
              style={{ flex: scrolls ? "0 0 76px" : "1 1 0", minWidth: scrolls ? 76 : 0 }}>
              <div className="relative">
                <n.Icon size={21} color={on ? C.pine : C.muted} strokeWidth={on ? 2.4 : 2} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: C.maroon }}>{badge}</span>
                )}
              </div>
              <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: on ? C.pine : C.muted }}>{n.label}</span>
            </button>
          );
        })}
      </div>
      {scrolls && (
        <div className="absolute pointer-events-none" style={{
          right: 0, top: 0, bottom: 0, width: 24,
          background: `linear-gradient(to right, transparent, ${C.card})`,
        }} />
      )}
    </div>
  );
}

/* ============================== Shared bits =============================== */
// A person's photo filling its frame. With no photo, or one that can't load (offline), what it wraps shows instead.
function PhotoOr({ src, alt, children }) {
  const [failed, setFailed] = useState(null);   // the address that didn't load; a new address gets a fresh try
  if (!src || failed === src) return children;
  return <img src={src} alt={alt || ""} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(src)}
    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
}
function Avatar({ initials, size = 40, src }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ width: size, height: size, background: `linear-gradient(180deg, #2C4F3B, ${C.brandDeep})`, boxShadow: "inset 0 .5px 0 rgba(255,255,255,.18), 0 1px 2px rgba(0,0,0,.14)" }}>
      <PhotoOr src={src}>
        <span className="font-semibold" style={{ color: C.goldSoft, fontSize: size * 0.38, letterSpacing: "-.01em" }}>{initials}</span>
      </PhotoOr>
    </div>
  );
}
const photoOf = (id) => (id && talentById(id)?.photo) || null;
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
    <div className="section-head flex items-end justify-between gap-3 mb-3">
      <div className="section-head-text min-w-0 text-[13px] font-semibold tracking-[.04em] uppercase" style={{ color: C.muted }}>{children}</div>
      {trailing && <div className="text-[13px] shrink-0 pb-[2px]" style={{ color: C.muted }}>{trailing}</div>}
    </div>
  );
}
function StatusBadge({ status, reason }) {
  const m = {
    pending: { bg: C.goldSoft, fg: C.goldText, Icon: Clock, label: "Pending review" },
    approved: { bg: C.pineSoft, fg: C.pine, Icon: Check, label: "Live" },
    rejected: { bg: C.maroonSoft, fg: C.maroon, Icon: X, label: "Not approved" },
    accepted: { bg: C.pineSoft, fg: C.pine, Icon: Check, label: "Accepted" },
    declined: { bg: C.maroonSoft, fg: C.maroon, Icon: X, label: reason === "booked" ? "Booked elsewhere" : "Declined" },
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
      <p className="text-[14px] mt-1 max-w-[240px]" style={{ color: C.muted }}>{body}</p>
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

const displayName = (t) => (t?.role === "hotel" && t.company ? t.company : t?.name);
const friendlyBookingError = (m) => {
  const t = String(m || "");
  if (/DOUBLE_BOOKED/.test(t)) return t.replace(/^.*DOUBLE_BOOKED:\s*/, "Already booked: ").replace(/\s*\(.*$/, "");
  if (/NOT_AVAILABLE/.test(t)) return "Not available on those dates. Check the calendar and pick other days.";
  if (/no longer open/.test(t)) return "This request has already been answered.";
  return t.replace(/^.*?:\s*/, "") || "Something went wrong";
};
const roleLabel = (r) => (r === "guide" ? "Guide" : r === "operator" ? "Tour Operator" : r === "hotel" ? "Hotel" : r === "admin" ? "Admin" : r === "both" ? "Guide + Driver" : "Driver");
const listingFits = (l, kind) => l.role === kind || (l.role === "both" && (kind === "guide" || kind === "driver"));

/* ======================== Feed tab (guides & drivers) ===================== */
function PostTab({ user, posts, onAdd, eng, onOpenProfile }) {
  const me = user.talentId;
  const t = talentById(me) || { id: me, name: user.name || "You", initials: user.initials || "?" };
  const visible = posts.filter((p) => (p.status === "approved" || p.talentId === me) && (user.kind === "hotel" ? (isHotelPost(p) || p.talentId === me) : !isHotelPost(p)));
  return (
    <div className="px-5 py-4">
      <Composer talent={t} onAdd={onAdd} />
      <div className="mt-7"><SectionLabel trailing={`${visible.length}`}>Feed</SectionLabel></div>
      {visible.length === 0 ? (
        <Empty Icon={Inbox} title="Nothing here yet" body={user.kind === "hotel" ? "Posts from hotels, guides and drivers appear here once approved. Share your first one — operators are looking." : "Approved highlights from every guide and driver appear here — share the first one."} />
      ) : (
        <div className="space-y-3.5">
          {visible.map((p) => {
            const author = talentById(p.talentId);
            const mine = p.talentId === me;
            return (
              <div key={p.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => onOpenProfile(p.talentId)} className="tap flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Avatar initials={author?.initials || "?"} src={author?.photo} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{mine ? "You" : (displayName(author) || "Member")}</span>
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
                {p.location && p.media && p.media.kind === "photo" ? (
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
      if (vid.size > 25 * 1024 * 1024) return setError("That video is over 25 MB — trim it or pick a shorter clip.");
      setError(null);
      const r = new FileReader();
      r.onload = () => setMedia({ kind: "video", dataUri: r.result });
      r.readAsDataURL(vid);
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
        if (gps && gps.lat != null) {
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
    onAdd({ talentId: talent.id, text: text.trim(), media, location });
    setText(""); setMedia(null); setLocation(null); setPicking(false); setManual(false);
  };
  const canPost = text.trim() || media;
  const chipLabel = placeLabel(location);

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar initials={talent.initials} src={talent.photo} size={36} />
        <div><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{displayName(talent) || talent.name}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{talent.role === "hotel" ? "Show operators what's on" : "Share a trip highlight"}</div></div>
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={300} placeholder={talent?.role === "hotel" ? "Show operators what you offer — a room, the view, a seasonal rate, a new menu…" : "Write a caption — what made this trip special?"}
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
                      <span className="absolute left-1 bottom-1 text-[10px] font-bold rounded px-1.5 py-0.5" style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>COVER</span>
                    )}
                  </div>
                ))}
                <button onClick={() => inputRef.current?.click()} className="tap shrink-0 rounded-xl flex flex-col items-center justify-center"
                  style={{ width: 104, height: 104, background: C.bg, border: `1.5px dashed ${C.line}` }}>
                  <Plus size={20} color={C.gold} strokeWidth={2.6} />
                  <span className="text-[11px] mt-1 font-semibold" style={{ color: C.ink }}>Add more</span>
                  <span className="text-[10px]" style={{ color: C.muted }}>up to 10</span>
                </button>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold tracking-[.1em] uppercase" style={{ color: C.goldText }}>Shape</span>
                  {(media.slides || []).length > 1 && (
                    <span className="text-[12px]" style={{ color: C.muted }}>{media.slides.length} photos · swipeable</span>
                  )}
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
                        <span className="text-[11px] font-semibold" style={{ color: on ? "#fff" : C.ink }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setCropping(media.slides || [media.dataUri])}
                  className="tap w-full h-10 rounded-xl mt-2 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold"
                  style={{ background: C.goldSoft, color: C.goldText }}>
                  <Maximize2 size={14} /> Crop & reposition
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {cropping && (
        <CropEditor slides={cropping} initialRatio={media?.ratio || "4 / 5"}
          onClose={() => setCropping(null)}
          onDone={(cropped, ratio) => {
            setMedia({ kind: "photo", dataUri: cropped[0], slides: cropped, ratio });
            setCropping(null);
          }} />
      )}

      {note && <div className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full px-2.5 py-1" style={{ background: C.pineSoft, color: C.pine }}><MapPin size={12} color={C.pine} /> {note}</div>}

      {location && !picking && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-semibold" style={{ background: C.goldSoft, color: C.goldText }}>
              <MapPin size={14} color={C.gold} /> {chipLabel}
            </span>
            <button onClick={() => setPicking(true)} className="text-[13px] font-semibold" style={{ color: C.pine }}>Change</button>
            <button onClick={() => setLocation(null)} className="text-[13px] font-semibold" style={{ color: C.muted }}>Remove</button>
          </div>
          {location.description && <p className="text-[13px] leading-snug mt-1.5" style={{ color: C.muted }}>{location.description}</p>}
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
              <button onClick={() => setManual(true)} className="tap text-[13px] font-semibold mt-2" style={{ color: C.pine }}>Adjust on the map</button>
            </>
          ) : (
            <>
              <div className="text-[13px] mb-2" style={{ color: C.muted }}>…or tap the map for a custom spot.</div>
              <BhutanMap value={location} onPick={(loc) => setLocation({ ...loc, source: "map" })} />
            </>
          )}
          {location && location.description && <p className="text-[13px] leading-snug mt-2" style={{ color: C.ink }}>{location.description}</p>}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[13px]" style={{ color: C.muted }}>{location ? `${location.lat}, ${location.lng}${location.source === "map" ? " · approx." : ""}` : "No pin yet"}</span>
            <button onClick={() => setPicking(false)} className="tap text-[13px] font-semibold rounded-full px-3 py-1.5" style={{ background: C.pine, color: "#fff" }}>Done</button>
          </div>
        </div>
      )}

      {error && <p className="text-[13px] mt-2" style={{ color: C.maroon }}>{error}</p>}

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
        <button onClick={() => inputRef.current?.click()} className="tap inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold" style={{ background: C.goldSoft, color: C.goldText }}>
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
function JobsInbox({ user, jobs, onSet, trips }) {
  const mine = jobs.filter((j) => !j.deletedAt && j.toTalentId === user.talentId);
  const { blocks } = useTalentBusy({ talentId: user.talentId, self: true, trips, jobs, from: isoDay(-45), to: isoDay(400) });
  const [busyId, setBusyId] = useState(null);
  const [errs, setErrs] = useState({});
  const [confirming, setConfirming] = useState(null);   // request id awaiting "accept anyway"
  const competing = (j) => mine.filter((x) => x.id !== j.id && x.status === "pending" && rangesOverlap(j.start, j.end || j.start, x.start, x.end || x.start)).length;
  const ownBlock = (j) => blocks.find((b) => rangesOverlap(j.start, j.end || j.start, b.from, b.to));
  const answer = async (j, status) => {
    if (status === "accepted" && confirming !== j.id && ownBlock(j)) { setConfirming(j.id); return; }
    setBusyId(j.id); setErrs((e) => ({ ...e, [j.id]: null }));
    const r = await onSet(j.id, status);
    setBusyId(null); setConfirming(null);
    if (r && r.ok === false) setErrs((e) => ({ ...e, [j.id]: r.reason || "Couldn't update this request." }));
  };
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
              {j.notes && <p className="text-[14px] leading-snug mt-3" style={{ color: C.ink }}>{j.notes}</p>}
              {j.status === "pending" && competing(j) > 0 && <div className="text-[12px] mt-3 rounded-lg px-2.5 py-2" style={{ background: C.goldSoft, color: C.goldText }}>{competing(j)} other operator{competing(j) === 1 ? "" : "s"} asked for these dates too. Accepting this one declines the other{competing(j) === 1 ? "" : "s"}.</div>}
              {j.status === "pending" && confirming === j.id && <div className="text-[12px] mt-3 rounded-lg px-2.5 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>You blocked some of these days{ownBlock(j)?.label ? ` (${ownBlock(j).label})` : ""}. Accept anyway? The trip will take those days.</div>}
              {errs[j.id] && <div className="text-[12px] mt-3 rounded-lg px-2.5 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{errs[j.id]}</div>}
              {j.status === "declined" && j.declineReason === "booked" && <div className="text-[12px] mt-3" style={{ color: C.muted }}>Closed automatically: you confirmed another trip for these dates.</div>}
              {j.status === "pending" && (
                <div className="flex gap-2.5 mt-3.5">
                  <button disabled={busyId === j.id} onClick={() => answer(j, "declined")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.card, border: `1.5px solid ${C.maroon}`, color: C.maroon }}><X size={17} /> Decline</button>
                  <button disabled={busyId === j.id} onClick={() => answer(j, "accepted")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#fff" }}><Check size={17} /> Accept</button>
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
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>{Icon && <Icon size={13} color={C.gold} />}{children}</span>;
}

/* ============================ Discover (operator) ========================= */
function Discover({ onOpen, initialQuery, dirTick }) {
  const [q, setQ] = useState(initialQuery || "");
  useEffect(() => { if (initialQuery) setQ(initialQuery); }, [initialQuery]);
  const [role, setRole] = useState("all");
  const [lang, setLang] = useState(null);
  const [onlyFree, setOnlyFree] = useState(false);

  const POOL = useMemo(() => [...TALENT, ...Object.values(PROFILE_DIR).filter((p) => p.role === "guide" || p.role === "driver")], [dirTick]);
  const list = POOL.filter((t) => (role === "all" || t.role === role))
    .filter((t) => (!onlyFree || (t.availability || "open") === "open"))
    .filter((t) => (!lang || (t.languages || []).some((l) => l && l.n === lang)))
    .filter((t) => {
      const hay = `${t.name || ""} ${t.base || ""} ${(t.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={`${list.length} available`}>Find talent</SectionLabel>

      <div className="relative mb-3">
        <Search size={16} color={C.muted} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, base or speciality"
          className="w-full h-11 pl-10 pr-4 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
      </div>

      <div className="flex gap-2 mb-3">
        {[["all", "Everyone"], ["guide", "Guides"], ["driver", "Drivers"]].map(([k, l]) => {
          const on = role === k;
          return <button key={k} onClick={() => setRole(k)} className="tap flex-1 h-9 rounded-full text-[13px] font-semibold" style={{ background: on ? C.pine : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? "#fff" : C.ink }}>{l}</button>;
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto hidescroll pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
        <Chip on={onlyFree} onClick={() => setOnlyFree((v) => !v)}>Available now</Chip>
        <Chip on={!lang} onClick={() => setLang(null)}>All languages</Chip>
        {LANG_OPTIONS.map((l) => <Chip key={l} on={lang === l} onClick={() => setLang(lang === l ? null : l)}>{l}</Chip>)}
      </div>

      {list.length === 0 ? (
        <Empty Icon={Search} title="No matches" body="Try a different role or language filter." />
      ) : (
        <div className="space-y-3">{list.map((t) => <TalentCard key={t.id} t={t} onOpen={() => onOpen(t.id)} />)}</div>
      )}
    </div>
  );
}
function Chip({ on, onClick, children }) {
  return <button onClick={onClick} className="tap shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium"
    style={{ background: on ? C.pine : C.grey, border: `1px solid ${on ? C.pine : "transparent"}`, color: on ? "#fff" : C.ink }}>{children}</button>;
}

function TalentCard({ t, onOpen }) {
  return (
    <button onClick={onOpen} className="tap w-full text-left rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-3.5">
        <Avatar initials={t.initials} src={t.photo} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{t.name}</span>
            {t.verified && <BadgeCheck size={15} color={C.pine} />}
          </div>
          <div className="flex items-center gap-1 text-[13px]" style={{ color: C.muted }}><MapPin size={12} /> {roleLabel(t.role)} · {t.base}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ background: C.goldSoft }}>
            <Star size={12} color={C.gold} fill={C.gold} /><span className="text-[13px] font-semibold" style={{ color: C.goldText }}>{typeof t.rating === "number" ? t.rating.toFixed(1) : "New"}</span>
          </div>
          <div className="text-[12px] mt-1" style={{ color: C.muted }}>{t.years} yrs</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <AvailabilityChip talent={t} />
        {(t.languages || []).slice(0, 3).map((l) => (
          <span key={l.n} className="text-[12px] rounded-md px-1.5 py-0.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{l.n}</span>
        ))}
      </div>
    </button>
  );
}

/* ======================= Sent requests (operator) ======================== */
function SentRequests({ operator, operatorId, jobs, actions, onOpen }) {
  const mine = jobs.filter((j) => !j.deletedAt && (j.operatorId ? j.operatorId === operatorId : j.operator === operator));
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
                    <Avatar initials={t.initials} src={t?.photo} size={38} />
                    <div>
                      <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{t.name}</div>
                      <div className="text-[12px]" style={{ color: C.muted }}>{roleLabel(t.role)} · {t.base}</div>
                    </div>
                  </button>
                  <StatusBadge status={j.status} reason={j.declineReason} />
                </div>
                {j.status === "declined" && j.declineReason === "booked" && <div className="text-[12px] mt-2 rounded-lg px-2.5 py-1.5" style={{ background: C.maroonSoft, color: C.maroon }}>Another operator's booking was confirmed for these dates first. Pick someone else from Find talent.</div>}
                <div className="text-[14px] font-medium mt-3" style={{ color: C.ink }}>{j.title}</div>
                <div className="flex flex-wrap gap-2 mt-2"><Pill Icon={CalendarCheck}>{fmtDate(j.start)} – {fmtDate(j.end)}</Pill>{(j.languages || []).map((l) => <Pill key={l}>{l}</Pill>)}</div>
                {actions?.binRequest && j.status !== "accepted" && (
                  <button onClick={() => actions.binRequest(j.id)}
                    className="tap w-full mt-3 pt-2.5 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                    style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.muted }}>
                    <Trash2 size={13} /> Withdraw this request
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================= Feed (operator & admin) ======================== */
const isHotelPost = (p) => (talentById(p.talentId) || {}).role === "hotel";
function Feed({ posts, eng, admin, onDelete, onOpenProfile, following, user, trips, stays }) {
  const [scope, setScope] = useState("all");
  const [asking, setAsking] = useState(null);     // hotel talent → request sheet
  const [sent, setSent] = useState(null);
  const base = admin ? posts : posts.filter((p) => p.status === "approved");
  const crew = base.filter((p) => !isHotelPost(p));
  const hotelPosts = base.filter(isHotelPost);
  const live = scope === "stays" ? hotelPosts : scope === "following" && following?.length ? crew.filter((p) => following.includes(p.talentId)) : crew;
  const canRequest = user && user.kind === "operator";
  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={admin ? `${live.length} total` : undefined}>Highlights</SectionLabel>
      <div className="flex gap-2 mb-3.5 flex-wrap">
        <Chip on={scope === "all"} onClick={() => setScope("all")}>Everyone</Chip>
        {!admin && following?.length > 0 && <Chip on={scope === "following"} onClick={() => setScope("following")}>Following · {following.length}</Chip>}
        <Chip on={scope === "stays"} onClick={() => setScope("stays")}>Hotels & stays{hotelPosts.length ? ` · ${hotelPosts.length}` : ""}</Chip>
      </div>
      {scope === "stays" && canRequest && stays && <StayRequests user={user} data={stays} />}
      {sent && <div className="rounded-xl px-3.5 py-3 mb-3 text-[13px]" style={{ background: C.successSoft, color: C.success }}>Request sent to {sent}. They answer here, under Your room requests, and in your trip's Hotels section.</div>}
      {live.length === 0 ? (
        scope === "stays"
          ? <Empty Icon={BedDouble} title="No hotel posts yet" body="Hotels and boutique stays on the hub post rooms, views and offers here. You can request rooms straight from a post." />
          : <Empty Icon={Inbox} title="No highlights yet" body="Approved posts from guides and drivers appear here." />
      ) : (
        <div className="space-y-3.5">
          {live.map((p) => {
            const t = talentById(p.talentId);
            return (
              <div key={p.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => onOpenProfile(p.talentId)} className="tap flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Avatar initials={t?.initials || "?"} src={t?.photo} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5"><span className="text-[15px] font-semibold" style={{ color: C.ink }}>{displayName(t) || "Member"}</span>{t?.verified && <BadgeCheck size={15} color={C.pine} />}</div>
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}><MapPin size={11} /> {t?.base || ""} · {relTime(p.createdAt)}</div>
                  </div>
                  </button>
                  {admin && p.status !== "approved" && <StatusBadge status={p.status} reason={p.reason} />}
                  {admin && <DeletePost onConfirm={() => onDelete(p.id)} />}
                </div>
                {t?.role === "hotel" && (
                  <div className="text-[12px] mt-1" style={{ color: C.muted }}>{[hotelTownName(t.hotelTown), t.starRating ? `${t.starRating}★` : null, t.stayKind ? STAY_KINDS[t.stayKind] : null, t.hotelTier ? DK_HOTEL[t.hotelTier] : null].filter(Boolean).join(" · ")}</div>
                )}
                {p.text && <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.ink }}>{p.text}</p>}
                {p.location && p.media && p.media.kind === "photo" ? (
                  <div className="mt-3"><MapCinema location={p.location} photo={p.media.dataUri} /></div>
                ) : (<>
                  <PostMedia media={p.media} />
                  <PostLocation location={p.location} showMap />
                </>)}
                <PostEngagement post={p} eng={eng} />
                {t?.role === "hotel" && canRequest && (
                  <button onClick={() => { setSent(null); setAsking(t); }} className="tap w-full h-11 mt-3 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#fff" }}>
                    <BedDouble size={16} /> Request rooms
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {asking && (
        <FindHotelSheet trip={null} trips={trips || []} presetHotel={asking} user={user}
          stay={{ from: isoDay(7), to: isoDay(9), nights: 2, townKey: asking.hotelTown || null, townName: hotelTownName(asking.hotelTown), tier: asking.hotelTier || null, days: [] }}
          onClose={() => setAsking(null)} onSent={() => { setSent(asking.company || asking.name); setAsking(null); }} />
      )}
    </div>
  );
}

/* An operator's own room requests, newest first, with where each stands in the hotel's queue. */
function StayRequests({ user, data }) {
  const today = isoDay(0);
  const list = (data.bookings || []).filter((b) => b.checkOut >= today || Date.now() - (b.respondedAt || b.createdAt) < 7 * 86400e3).sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  const [q, setQ] = useState({});
  const [open, setOpen] = useState(true);
  useEffect(() => {
    let on = true;
    const pend = list.filter((b) => b.status === "requested");
    if (!CLOUD || !pend.length) return;
    Promise.all(pend.map((b) => supabase.rpc("room_queue_position", { p_booking: b.id }).then(({ data }) => [b.id, data && data[0]]))).then((rows) => { if (on) { const m = {}; rows.forEach(([id, r]) => { if (r) m[id] = r; }); setQ(m); } });
    return () => { on = false; };
  }, [list.map((b) => b.id + b.status).join("|")]);
  const cancel = async (b) => {
    const { error } = await supabase.from("room_bookings").update({ status: "cancelled" }).eq("id", b.id);
    if (error) { console.error("room_bookings.cancel failed:", error.message); toast(failText("withdraw that request")); return; }
    data.reload && data.reload();
  };
  if (!list.length) return null;
  const waiting = list.filter((b) => b.status === "requested").length;
  return (
    <div className="rounded-2xl mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <button onClick={() => setOpen((v) => !v)} className="tap w-full flex items-center justify-between px-4 py-3 text-left">
        <div><div className="text-[14px] font-semibold" style={{ color: C.ink }}>Your room requests</div><div className="text-[12px]" style={{ color: C.muted }}>{waiting ? `${waiting} waiting for a hotel's answer` : "All answered"}</div></div>
        <ChevronLeft size={16} color={C.muted} style={{ transform: open ? "rotate(-90deg)" : "rotate(180deg)", transition: "transform .2s" }} />
      </button>
      {open && list.map((b) => { const h = talentById(b.hotelId); const pos = q[b.id];
        return (
          <div key={b.id} className="px-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{h?.company || h?.name || "Hotel"}</div>
                <div className="text-[12px]" style={{ color: C.muted }}>{fmtNights(b.checkIn, b.checkOut)} · {b.rooms} {b.rooms === 1 ? "room" : "rooms"}</div>
              </div>
              <BkBadge status={b.status} />
            </div>
            {b.status === "requested" && pos && (
              <div className="text-[12px] mt-1.5" style={{ color: pos.fits ? C.pine : C.goldText }}>
                {pos.ahead === 0 ? "First in line for these dates" : `${pos.place}${pos.place === 2 ? "nd" : pos.place === 3 ? "rd" : "th"} in line · ${pos.ahead} ${pos.ahead === 1 ? "request" : "requests"} ahead`}{pos.fits ? " · rooms still free" : " · may not fit anymore"}
              </div>
            )}
            {b.hotelNote && <div className="text-[12px] mt-1.5 rounded px-2.5 py-2" style={{ background: b.status === "declined" ? C.maroonSoft : C.pineSoft, color: b.status === "declined" ? C.maroon : C.pine }}>{h?.company || "Hotel"}: {b.hotelNote}</div>}
            {(b.status === "requested" || b.status === "confirmed") && <button onClick={() => cancel(b)} className="tap text-[12px] font-semibold mt-1.5" style={{ color: C.muted }}>{b.status === "confirmed" ? "Cancel booking" : "Withdraw"}</button>}
          </div>
        ); })}
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
        <Avatar initials={t.initials} src={t.photo} size={40} />
        <div className="flex-1"><div className="text-[15px] font-semibold" style={{ color: C.ink }}>{t.name}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{roleLabel(t.role)} · {relTime(post.createdAt)}</div></div>
        {!pending && <StatusBadge status={post.status} reason={post.reason} />}
      </div>
      {post.text && <p className="text-[15px] leading-snug mt-3" style={{ color: C.ink }}>{post.text}</p>}
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
          <div className="text-[13px] font-medium mb-2" style={{ color: C.ink }}>Reason for rejecting</div>
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
function TalentProfile({ talent, posts, canRequest, self, contactOnly, eng, onRequest, onMessage, onSetAvailability, onOpenProfile, onBack, onProfileSaved, trips, jobs }) {
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
  const myStories = (eng?.stories || []).filter((st) => st.authorId === t.id);
  const [viewStories, setViewStories] = useState(false);
  const [addStory, setAddStory] = useState(false);
  const [shareToStory, setShareToStory] = useState(null);
  const [listMode, setListMode] = useState(null);
  const [askOperator, setAskOperator] = useState(false);
  return (
    <div className="pb-6">
      <div className="relative">
        {onBack && (
          <button onClick={onBack} className="tap absolute left-4 top-4 z-10 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.9)", border: `1px solid ${C.line}` }}><ChevronLeft size={19} color={C.ink} /></button>
        )}
        <div className="h-24" style={{ background: `radial-gradient(120% 140% at 80% 0%, ${C.pine} 0%, ${C.pineDeep} 70%)` }} />
        <div className="px-5">
          <div className="-mt-9 mb-3 flex items-end gap-3">
            <button onClick={() => myStories.length && setViewStories(true)} className="relative" style={{ cursor: myStories.length ? "pointer" : "default" }}>
              <div className="rounded-2xl flex items-center justify-center overflow-hidden" style={{ width: 72, height: 72, background: C.pine, border: `3px solid ${C.bg}`,
                boxShadow: myStories.length ? `0 0 0 3px ${C.gold}` : "none" }}>
                <PhotoOr src={t.photo} alt={t.name}>
                  <span className="text-[22px] font-semibold" style={{ color: C.goldSoft }}>{t.initials}</span>
                </PhotoOr>
              </div>
              {myStories.length > 0 && (
                <span className="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: C.gold, color: "#fff" }}>{myStories.length}</span>
              )}
            </button>
            {self && (
              <button onClick={() => setAddStory(true)} className="tap mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold"
                style={{ background: C.goldSoft, color: C.goldText }}>
                <Plus size={14} strokeWidth={3} /> Add story
              </button>
            )}
          </div>
          <div>
            <div>
              <div className="flex items-start gap-1.5">
                <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]" style={{ color: C.ink, wordBreak: "break-word" }}>{t.name}</h1>
                {t.verified && <BadgeCheck size={17} color={C.pine} className="shrink-0 mt-1" />}
              </div>
              <div className="flex items-center gap-1 text-[14px] mt-1" style={{ color: C.muted }}><MapPin size={13} /> {roleLabel(t.role)}{t.base ? ` · ${t.base}` : ""}</div>
              {t.role !== "operator" && <div className="mt-2"><AvailabilityChip talent={t} /></div>}
            </div>
          </div>
          <div className="flex items-center mt-4 mb-1">
            <Stat n={gallery.length} label="posts" />
            <Stat n={followerCount} label={followerCount === 1 ? "follower" : "followers"} onClick={() => setListMode("followers")} />
            <Stat n={followingCount} label="following" onClick={() => setListMode("following")} />
            <Stat n={t.years} label="yrs" />
          </div>

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
                <a href={`tel:${dialNumber(t.phone)}`}
                  className="tap w-11 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: C.pineSoft, border: `1px solid ${C.line}` }} aria-label="Call">
                  <PhoneCall size={16} color={C.pine} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-5">
        {self && t.role !== "operator" && t.role !== "hotel" && <AvailabilityEditor talent={t} onSet={onSetAvailability} />}
        {self && (t.role === "guide" || t.role === "driver") && <TalentCalendar talent={t} self trips={trips} jobs={jobs} />}
        {!self && canRequest && (t.role === "guide" || t.role === "driver") && <TalentCalendar talent={t} self={false} />}
        {self && t.role !== "operator" && <ProfileSetupCard talent={t} onSaved={onProfileSaved} />}

        <PastTrips talent={t} self={!!self} />
        <ProfileTabs
          cv={
            <>
              <GuestReviews talentId={t.id} isAdmin={eng?.isAdmin} isSelf={self} onAskOperator={() => setAskOperator(true)} />

              <div className="mt-6" />

              {/* trip record */}
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                <div className="px-4 py-3.5 flex items-center justify-between" style={{ background: C.pine }}>
                  <div><div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldSoft }}>Trip record</div>
                    <div className="text-[13px] mt-0.5" style={{ color: "#ffffffcc" }}>Graded by operators</div></div>
                  <div className="text-right"><div className="text-[26px] font-semibold leading-none text-white">{typeof t.rating === "number" ? t.rating.toFixed(1) : "New"}</div><div className="mt-1 flex justify-end"><Stars score={t.rating || 0} light /></div></div>
                </div>
                <div className="px-4 py-4 space-y-3.5" style={{ background: C.card }}>
                  {Object.keys(t.grades || {}).length === 0 ? (
                    <p className="text-[14px]" style={{ color: C.muted }}>No trips graded yet — the record fills in after the first completed trip.</p>
                  ) : Object.entries(t.grades).map(([kk, v]) => (
                    <div key={kk}><div className="flex items-baseline justify-between mb-1.5"><span className="text-[14px] font-medium" style={{ color: C.ink }}>{kk}</span><span className="text-[13px] font-semibold" style={{ color: C.pine }}>{typeof v === "number" ? v.toFixed(1) : "—"}</span></div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.lineSoft }}><div className="h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, background: `linear-gradient(90deg, ${C.gold}, #D9A94E)` }} /></div></div>
                  ))}
                </div>
              </div>

              {t.pitch && <div className="mt-5 pl-4" style={{ borderLeft: `3px solid ${C.gold}` }}><p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{t.pitch}</p></div>}

              {t.tags && t.tags.length > 0 && (
                <div className="mt-6"><SectionLabel>{t.role === "guide" ? "Specialities" : "Drives"}</SectionLabel>
                  <div className="flex flex-wrap gap-2">{(t.tags || []).map((x) => <span key={x} className="rounded-full px-3 py-1.5 text-[14px] font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{x}</span>)}</div>
                  {t.vehicle && <div className="mt-2.5 text-[14px]" style={{ color: C.muted }}><Car size={14} color={C.gold} className="inline mr-1" /> {t.vehicle}</div>}
                </div>
              )}

              {t.languages && t.languages.length > 0 && (
                <div className="mt-6"><SectionLabel>Languages</SectionLabel>
                  <div className="flex flex-wrap gap-2">{(t.languages || []).map((l) => (
                    <span key={l.n} className="inline-flex items-center gap-2 rounded-full pl-3.5 pr-2 py-1.5 text-[14px] font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{l.n}<span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: C.goldSoft, color: C.goldText }}>{l.l}</span></span>
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

        {canSeeContact && (
          <div className="mt-6"><SectionLabel trailing={self ? "" : "Operators only"}>Contact</SectionLabel>
            <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              {t.phone && (
                <>
                  <div className="px-4 pt-3.5 pb-2 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}><Phone size={17} color={C.gold} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold tracking-[0.01em]" style={{ color: C.ink }}>{prettyNumber(t.phone)}</div>
                      <div className="text-[12px]" style={{ color: C.muted }}>Bhutan · +975</div>
                    </div>
                  </div>
                  <div className="flex gap-2 px-4 pb-3.5">
                    <a href={`tel:${dialNumber(t.phone)}`} className="tap flex-1 h-11 rounded-xl inline-flex items-center justify-center gap-2 text-[14px] font-semibold"
                      style={{ background: C.pine, color: "#fff" }}>
                      <PhoneCall size={16} /> Call
                    </a>
                    <a href={`https://wa.me/${dialNumber(t.phone).replace("+", "")}`} target="_blank" rel="noreferrer"
                      className="tap flex-1 h-11 rounded-xl inline-flex items-center justify-center gap-2 text-[14px] font-semibold"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  </div>
                </>
              )}
              {t.email && (
                <a href={`mailto:${t.email}`} className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: t.phone ? `1px solid ${C.lineSoft}` : "none" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}><Mail size={17} color={C.gold} /></div>
                  <span className="text-[14px] font-medium truncate" style={{ color: C.ink }}>{t.email}</span>
                </a>
              )}
              {!t.phone && !t.email && (
                <div className="px-4 py-4 text-[13px]" style={{ color: C.muted }}>
                  {self ? "No contact details yet — add your phone with Edit profile, above." : "No contact details added yet."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {canRequest && !contactOnly && (
        <div className="px-5 mt-6 flex gap-3">
          <button onClick={() => onMessage && onMessage(t.id)} className="tap h-12 px-5 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}><MessageCircle size={18} /> Message</button>
          <button onClick={onRequest} className="tap flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ background: C.pine, color: "#fff", boxShadow: `0 6px 16px ${C.pine}33` }}><Briefcase size={18} /> Send job request</button>
        </div>
      )}
      {!canSeeContact && (
        <div className="px-5 mt-6">
          <SectionLabel>Contact</SectionLabel>
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}>
              <Lock size={16} color={C.gold} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ color: C.ink }}>Contact details are for operators</div>
              <p className="text-[13px] leading-snug mt-1" style={{ color: C.muted }}>
                Phone numbers are shown to tour operators booking crew. You can message {String(t.name || "them").split(" ")[0]} here instead.
              </p>
              <button onClick={() => onMessage && onMessage(t.id)}
                className="tap mt-2.5 h-9 px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5"
                style={{ background: C.pine, color: "#fff" }}>
                <MessageCircle size={14} /> Send a message
              </button>
            </div>
          </div>
        </div>
      )}

      {self && (
        <>
          <div className="px-5 mt-6"><div className="rounded-xl px-4 py-3 text-[13px] text-center" style={{ background: C.goldSoft, color: C.goldText }}>This is how operators see your profile.</div></div>
          <div className="px-5 mt-4"><PrivacyPanel talent={t} /></div>
        </>
      )}

      {viewStories && myStories.length > 0 && (
        <StoryViewer stories={myStories} author={t} canDelete={self} onDelete={eng?.deleteStory} onClose={() => setViewStories(false)} />
      )}
      {addStory && <AddStory onClose={() => setAddStory(false)} onAdd={eng?.addStory} />}
      {askOperator && <OperatorInvite user={{ name: t.name, talentId: t.id, id: t.id, kind: t.role }} trip={null} onClose={() => setAskOperator(false)} />}

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
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const avail = useRequestAvailability(talent, start, end);
  const canSend = title.trim() && start && end && end >= start && avail.ok && !sending;
  const send = async () => {
    if (!canSend) return;
    setSending(true); setErr(null);
    const r = await onSend({ operator, toTalentId: talent.id, title: title.trim(), role: talent.role, start, end, languages: langs, notes: notes.trim() });
    setSending(false);
    if (r && r.ok === false) setErr(r.reason || "Couldn't send the request.");
  };

  const toggle = (l) => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]));

  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <span className="text-[15px] font-semibold" style={{ color: C.ink }}>New job request</span>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-2xl p-3.5 flex items-center gap-3 mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <Avatar initials={talent.initials} src={talent.photo} size={42} />
          <div><div className="text-[15px] font-semibold" style={{ color: C.ink }}>{talent.name}</div><div className="text-[13px]" style={{ color: C.muted }}>{roleLabel(talent.role)} · {talent.base}</div></div>
        </div>

        <Label>Trip title</Label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 7-day Western Cultural Tour" className="w-full h-12 px-4 rounded-xl text-[15px] mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <div className="mb-4"><TalentCalendar talent={talent} self={false} compact title={`${String(talent.name || "").split(" ")[0]}'s availability`} /></div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><Label>Start</Label><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full h-12 px-3.5 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} /></div>
          <div><Label>End</Label><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full h-12 px-3.5 rounded-xl text-[14px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} /></div>
        </div>

        <Label>Languages needed</Label>
        <div className="flex flex-wrap gap-2 mb-4">{LANG_OPTIONS.map((l) => <Chip key={l} on={langs.includes(l)} onClick={() => toggle(l)}>{l}</Chip>)}</div>

        <Label>Notes</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Group size, route, anything they should know." className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        {avail.note && <div className="text-[13px] mb-3 rounded-xl px-3.5 py-2.5" style={{ background: avail.ok ? C.goldSoft : C.maroonSoft, color: avail.ok ? C.goldText : C.maroon }}>{avail.note}</div>}
        {err && <div className="text-[13px] mb-3 rounded-xl px-3.5 py-2.5" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
        <button onClick={send}
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
  if (!trip) return "scheduled";
  const end = new Date(trip.end + "T23:59").getTime();
  if (Date.now() > end) return "completed";
  return (trip.chat && trip.chat.state) || "scheduled"; // scheduled | active — never crash on a partial trip
}
function TripStateBadge({ state }) {
  const m = {
    scheduled: { bg: C.goldSoft, fg: C.goldText, label: "Opens soon" },
    active: { bg: C.pineSoft, fg: C.pine, label: "Live" },
    completed: { bg: C.bg, fg: C.muted, label: "Completed" },
  }[state];
  return <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: m.bg, color: m.fg }}>{m.label}</span>;
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

function TripsTab({ user, trips, actions, focus, onFocused }) {
  const [openId, setOpenId] = useState(() => (focus && focus.id) || null);
  const [sheetReq, setSheetReq] = useState(() => (focus && focus.sheet ? { sheet: focus.sheet, n: focus.n } : null));
  useEffect(() => {   // BUILD 55: a notification about a trip opens it; the request is used once
    if (!focus || !focus.id) return;
    setOpenId(focus.id); setSheetReq(focus.sheet ? { sheet: focus.sheet, n: focus.n } : null);
    onFocused && onFocused();
  }, [focus && focus.n]);
  const [view, setView] = useState("upcoming");
  const meId = user.talentId || user.id;
  const mine = (trips || []).filter((tr) => tr && ((tr.members || []).some((m) => m && m.id === meId) || tr.operatorId === meId));
  const open = mine.find((tr) => tr.id === openId);
  // one TripHub per trip: a notification that switches trips starts the next one fresh (nothing typed carries over)
  if (open) return <TripHub key={open.id} user={user} meId={meId} trip={open} actions={actions} openSheet={sheetReq} onBack={() => { setOpenId(null); setSheetReq(null); }} />;

  const isPast = (tr) => tripStateNow(tr) === "completed";
  const upcoming = mine.filter((tr) => !isPast(tr)).sort((a, b) => new Date(a.start) - new Date(b.start));
  const past = mine.filter(isPast).sort((a, b) => new Date(b.end) - new Date(a.end));
  const shown = view === "past" ? past : upcoming;

  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={`${mine.length}`}>Trips</SectionLabel>
      <CrewRequests user={user} actions={actions} />

      <div className="flex gap-2 mb-4">
        <Chip on={view === "upcoming"} onClick={() => setView("upcoming")}>Upcoming · {upcoming.length}</Chip>
        <Chip on={view === "past"} onClick={() => setView("past")}>Past · {past.length}</Chip>
      </div>

      {shown.length === 0 ? (
        <Empty Icon={MapIcon}
          title={view === "past" ? "No past trips yet" : "No upcoming trips"}
          body={view === "past"
            ? "Completed trips move here, so your list stays focused on what's ahead."
            : "When a booking is confirmed, the trip and its crew chat appear here."} />
      ) : (
        <div className="space-y-3" style={{ opacity: view === "past" ? 0.72 : 1 }}>
          {shown.map((tr) => <TripCard key={tr.id} trip={tr} past={view === "past"} onOpen={() => setOpenId(tr.id)} />)}
        </div>
      )}

      {view === "past" && past.length > 0 && (
        <p className="text-[12px] text-center mt-4 leading-snug" style={{ color: C.muted }}>
          Past trips stay here as your record. Crew chats are archived and read-only.
        </p>
      )}
    </div>
  );
}

function TripCard({ trip, onOpen, past }) {
  const msgs = (trip.chat?.messages || []).filter((m) => m.kind !== "system");
  return (
    <button onClick={onOpen} className="tap w-full text-left rounded-2xl p-4"
      style={{ background: past ? C.bg : C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{trip.title}</div>
        <TripStateBadge state={tripStateNow(trip)} />
      </div>
      <div className="flex items-center gap-1 text-[13px] mt-1" style={{ color: C.muted }}><CalendarCheck size={12} /> {fmtDate(trip.start)} – {fmtDate(trip.end)}</div>
      <div className="flex items-center justify-between mt-3">
        <CrewAvatars members={trip.members} />
        <div className="flex items-center gap-1 text-[13px]" style={{ color: C.muted }}><MessageSquare size={13} /> {msgs.length}</div>
      </div>
    </button>
  );
}

function TripHub({ user, meId, trip, actions, onBack, openSheet }) {
  const state = tripStateNow(trip);
  const tripDone = state === "active" || state === "completed";
  const canInvite = tripDone && (user.kind === "operator" || user.kind === "admin");
  const isTalent = user.kind === "guide" || user.kind === "driver";
  const [chatOpen, setChatOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [askingOperator, setAskingOperator] = useState(false);
  const [section, setSection] = useState(null);   // tasks | hotels | guests | crew | itinerary | details
  const reviews = useTripReviews(trip, canInvite);   // BUILD 55: what guests sent, for the operator to publish
  // BUILD 55: a notification about this trip's reviews opens them straight away
  useEffect(() => { if (openSheet && openSheet.sheet === "reviews" && canInvite) setInviting(true); }, [openSheet && openSheet.n]);
  if (chatOpen) return <TripChatView user={user} meId={meId} trip={trip} actions={actions} onBack={() => setChatOpen(false)} />;
  if (section && !isTalent) {
    const titles = { tasks: "Operator tasks", hotels: "Hotels", guests: "Guests", crew: "Crew", itinerary: "Itinerary", details: "Trip details" };
    return (
      <div className="pb-6 fade">
        <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <button onClick={() => setSection(null)} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Back to trip"><ChevronLeft size={19} color={C.ink} /></button>
          <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{titles[section]}</div>
            <div className="text-[12px] truncate" style={{ color: C.muted }}>{trip.title} · {fmtDate(trip.start)} – {fmtDate(trip.end)}</div></div>
        </div>
        <div className="px-5 py-4">
          {section === "tasks" && <TripEssentials trip={trip} canEdit actions={actions} show="tasks" onOpenHotels={() => setSection("hotels")} />}
          {section === "details" && <TripEssentials trip={trip} canEdit actions={actions} show="details" />}
          {section === "hotels" && <TripHotels trip={trip} user={user} actions={actions} headless />}
          {section === "guests" && <GuestRoster trip={trip} canEdit actions={actions} />}
          {section === "itinerary" && <ItineraryBuilder trip={trip} canEdit onChanged={actions.reloadTrips} embedded />}
          {section === "crew" && (<>
            <div className="rounded-2xl divide-y mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
              {(trip.members || []).length === 0 && <div className="px-4 py-3 text-[13px]" style={{ color: C.muted }}>No crew on this trip yet.</div>}
              {(trip.members || []).map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar initials={m.initials} src={photoOf(m.id)} size={36} />
                  <div className="flex-1"><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{m.name}</div>
                    <div className="text-[12px] capitalize" style={{ color: C.muted }}>{String(m.roleInTrip || "crew").replace("_", " ")}</div></div>
                </div>
              ))}
            </div>
            <CrewInvites trip={trip} actions={actions} />
          </>)}
        </div>
      </div>
    );
  }
  // one-line summaries for the section rows
  const notReady = CHECKLIST.filter((c) => !["done", "not_needed"].includes(trip[c.key] || "not_started"));
  const daysOut = trip.start ? Math.ceil((new Date(trip.start + "T00:00") - Date.now()) / 86400e3) : null;
  const urgent = daysOut !== null && daysOut <= 21 && daysOut >= 0 && notReady.length > 0;
  const stays = isTalent ? [] : tripStays(trip);
  const staysUnset = stays.filter((st) => !st.townKey).reduce((n, st) => n + st.nights, 0);
  const nightsTotal = trip.start && trip.end ? nightsBetween(trip.start, trip.end) : 0;
  const plannedDays = (trip.itinerary || []).length;
  const hotelSummary = { not_started: "Not started", in_progress: "In progress", done: "All nights confirmed", not_needed: "Not needed" }[trip.hotelsStatus || "not_started"];
  const rows = [
    { id: "tasks", Icon: CheckCheck, title: "Operator tasks", sub: notReady.length ? `${CHECKLIST.length - notReady.length} of ${CHECKLIST.length} done · ${notReady.map((c) => c.label.toLowerCase()).join(", ")}` : "All done", tone: notReady.length ? (urgent ? "warn" : "todo") : "ok" },
    { id: "hotels", Icon: BedDouble, title: "Hotels", sub: !nightsTotal ? "Set the trip dates first" : staysUnset ? `${nightsTotal} nights · ${staysUnset} without a town yet` : `${nightsTotal} nights · ${hotelSummary}`, tone: trip.hotelsStatus === "done" ? "ok" : staysUnset ? "todo" : "neutral" },
    { id: "guests", Icon: Users, title: "Guests", sub: (trip.guests || []).length ? `${trip.guests.length} listed${trip.guestCount && trip.guestCount !== trip.guests.length ? ` of ${trip.guestCount}` : ""}` : "No one listed yet", tone: (trip.guests || []).length ? "neutral" : "todo" },
    { id: "crew", Icon: UserCheck, title: "Crew", sub: (trip.members || []).length ? (trip.members || []).map((m) => `${m.name || talentById(m.id)?.name || "Crew"} · ${String(m.roleInTrip || m.role || "crew").replace("_", " ")}`).join(", ") : "No crew yet — invite a guide and a driver", tone: (trip.members || []).length ? "neutral" : "todo" },
    { id: "itinerary", Icon: CalendarDays, title: "Itinerary", sub: !plannedDays ? "No days planned yet" : nightsTotal ? `${plannedDays} of ${nightsTotal + 1} days planned` : `${plannedDays} days planned`, tone: plannedDays && nightsTotal && plannedDays >= nightsTotal + 1 ? "ok" : plannedDays ? "neutral" : "todo" },
    { id: "details", Icon: Compass, title: "Trip details", sub: trip.arrivalFlight ? `Arrives ${trip.arrivalFlight}${trip.departureFlight ? ` · departs ${trip.departureFlight}` : ""}` : "Flights, arrival point, emergency contact", tone: trip.arrivalFlight ? "neutral" : "todo" },
  ];
  const toneBg = { ok: C.successSoft, todo: C.goldSoft, warn: C.maroonSoft, neutral: C.pineSoft };
  const toneFg = { ok: C.success, todo: C.goldText, warn: C.maroon, neutral: C.pine };
  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{trip.title}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{fmtDate(trip.start)} – {fmtDate(trip.end)}</div></div>
        <TripStateBadge state={state} />
      </div>

      <div className="px-5 py-4">
        {isTalent && <CrewBrief trip={trip} user={user} />}
        {!isTalent && urgent && (
          <div className="rounded-xl px-3.5 py-3 mb-3 flex gap-2.5" style={{ background: C.maroonSoft }}>
            <ShieldAlert size={16} color={C.maroon} className="shrink-0 mt-0.5" />
            <p className="text-[13px] leading-snug" style={{ color: C.maroon }}>Departs in {daysOut} {daysOut === 1 ? "day" : "days"} and {notReady.length} {notReady.length === 1 ? "item isn't" : "items aren't"} ready: {notReady.map((c) => c.label).join(", ")}.</p>
          </div>
        )}
        {!isTalent && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            {rows.map((r, i) => (
              <button key={r.id} onClick={() => setSection(r.id)} className="tap w-full text-left px-4 py-3 flex items-center gap-3" style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: toneBg[r.tone] }}><r.Icon size={16} color={toneFg[r.tone]} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{r.title}</div>
                  <div className="text-[12px] truncate" style={{ color: r.tone === "warn" ? C.maroon : C.muted }}>{r.sub}</div>
                </div>
                <ChevronLeft size={16} color={C.muted} style={{ transform: "rotate(180deg)" }} />
              </button>
            ))}
          </div>
        )}

        {canInvite && (() => {
          const all = reviews.rows || [];
          const waiting = all.filter((r) => r.status === "pending").length;
          const live = all.filter((r) => r.status === "published").length;
          const tone = waiting ? C.maroon : C.pine;
          return (
            <button type="button" onClick={() => setInviting(true)}
              className="tap w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left"
              style={{ background: waiting ? C.maroonSoft : C.pineSoft, border: `1px solid ${tone}33` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tone }}>
                <Star size={18} color={C.goldSoft} fill={C.goldSoft} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold" style={{ color: tone }}>Guest reviews</div>
                <div className="text-[13px] mt-0.5 leading-snug" style={{ color: tone, opacity: .85 }}>
                  {waiting ? `${waiting} waiting for you to publish` : live ? `${live} published · ask more guests` : "Ask your guests. One link covers the whole crew."}
                </div>
              </div>
              {waiting > 0 && (
                <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] font-bold flex items-center justify-center" style={{ background: C.maroon, color: "#FFFFFF" }}>{waiting}</span>
              )}
              <ChevronLeft size={17} color={tone} style={{ transform: "rotate(180deg)" }} />
            </button>
          );
        })()}

        {isTalent && tripDone && (
          <button onClick={() => setAskingOperator(true)}
            className="tap w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left"
            style={{ background: C.goldSoft, border: `1px solid ${C.gold}33` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.gold }}>
              <Star size={18} color="#fff" fill="#fff" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ color: C.goldText }}>Get a review for this trip</div>
              <div className="text-[13px] mt-0.5 leading-snug" style={{ color: C.goldText, opacity: .85 }}>
                Ask {trip.operator || "your operator"} to send your guests a review link.
              </div>
            </div>
            <ChevronLeft size={17} color={C.goldText} style={{ transform: "rotate(180deg)" }} />
          </button>
        )}

        {inviting && <ReviewInvite user={user} trip={trip} reviews={reviews} onClose={() => setInviting(false)}
          onOpenCrew={isTalent ? null : () => { setInviting(false); setSection("crew"); }} />}
        {askingOperator && <OperatorInvite user={user} trip={trip} onClose={() => setAskingOperator(false)} />}

        {isTalent && <SectionLabel>Crew</SectionLabel>}
        {isTalent && <div className="rounded-2xl divide-y mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
          {(trip.members || []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar initials={m.initials} src={photoOf(m.id)} size={36} />
              <div className="flex-1"><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{m.name}</div>
                <div className="text-[12px] capitalize" style={{ color: C.muted }}>{String(m.roleInTrip || "crew").replace("_", " ")}</div></div>
              {m.id === meId && <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: C.goldSoft, color: C.goldText }}>You</span>}
            </div>
          ))}
        </div>}


        <SectionLabel trailing={(trip.chat?.messages || []).length ? `${trip.chat.messages.length} messages` : ""}>Trip chat</SectionLabel>
        <button type="button" onClick={() => setChatOpen(true)} className="tap w-full text-left rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}><MessageSquare size={17} color={C.goldSoft} /></div>
          <div className="flex-1 min-w-0">
            {(() => { const ms = trip.chat?.messages || []; const last = ms[ms.length - 1];
              return last ? (
                <>
                  <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{last.senderName || "Crew"}</div>
                  <div className="text-[13px] truncate" style={{ color: C.muted }}>{last.kind === "photo" ? "Photo" : last.body}</div>
                </>
              ) : (
                <>
                  <div className="text-[14px] font-semibold" style={{ color: C.ink }}>Open the trip chat</div>
                  <div className="text-[13px]" style={{ color: C.muted }}>Everyone on this trip, in one place — the operator and the crew.</div>
                </>
              ); })()}
          </div>
          <ArrowRight size={16} color={C.muted} />
        </button>
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
      trip: { title: trip.title, start: trip.start, end: trip.end, arrival: trip.arrivalFlight || null, departure: trip.departureFlight || null },
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
          <div className="flex items-center gap-2 text-[13px]" style={{ color: C.goldText }}><Clock size={14} /> Chat opens 3 days before departure.</div>
          <button onClick={() => actions.openChat(trip.id)} className="tap text-[12px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.pine, color: "#fff" }}>Open now</button>
        </div>
      )}
      {state === "completed" && (
        <div className="px-4 py-3 flex items-center gap-2 text-[13px]" style={{ background: C.bg, color: C.muted }}><Clock size={14} /> Trip complete — chat is read-only. Export it to keep it.</div>
      )}

      {/* messages */}
      <div ref={scrollRef} className="hidescroll px-3.5 py-3 space-y-2.5 overflow-y-auto" style={{ background: C.bg, maxHeight: "44vh", scrollbarWidth: "none" }}>
        {(trip.chat?.messages || []).map((m) => {
          if (m.kind === "system") return <div key={m.id} className="text-center"><span className="text-[12px] rounded-full px-2.5 py-1" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>{m.body}</span></div>;
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
                <div className={`text-[11px] mt-0.5 ${mine ? "text-right mr-1" : "ml-1"}`} style={{ color: C.muted }}>{relTime(m.ts)}</div>
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
        <span className="text-[12px]" style={{ color: C.muted }}>Photos kept · voice & video live-only</span>
        <button onClick={exportChat} className="tap inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: C.pine }}><Download size={14} /> Export</button>
      </div>
    </div>
  );
}

/* ============================== Jobs board =============================== */
function Segmented({ options, value, onChange, small }) {
  // iOS segmented control: one grey track, a white indicator that glides to the chosen segment
  const wrap = useRef(null);
  const [ind, setInd] = useState({ x: 0, w: 0, ready: false });
  const measure = () => {
    const el = wrap.current?.querySelector(`[data-seg="${CSS && CSS.escape ? CSS.escape(String(value)) : value}"]`);
    if (!el) return;
    setInd({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
  };
  useEffect(() => { measure(); }, [value, options.length]);
  useEffect(() => { const r = () => measure(); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  return (
    <div ref={wrap} className="seg relative inline-flex max-w-full overflow-x-auto hidescroll rounded-[10px] p-[2px]" style={{ background: C.grey, scrollbarWidth: "none" }}>
      <div aria-hidden="true" className="seg-ind absolute top-[2px] bottom-[2px] rounded-[8px]"
        style={{ left: 0, width: ind.w, transform: `translateX(${ind.x}px)`, opacity: ind.ready ? 1 : 0, background: C.card, boxShadow: "0 1px 3px rgba(0,0,0,.12), 0 0 0 .5px rgba(0,0,0,.04)" }} />
      {options.map(([k, l]) => {
        const on = value === k;
        return (
          <button key={k} data-seg={k} onClick={() => onChange(k)} className="tap relative rounded-[8px] font-semibold whitespace-nowrap shrink-0"
            style={{ padding: small ? "5px 11px" : "7px 13px", fontSize: small ? 12 : 13, color: on ? C.ink : C.muted, background: "transparent", zIndex: 1 }}>{l}</button>
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
    applied: { bg: C.goldSoft, fg: C.goldText, label: "Applied" },
    shortlisted: { bg: "#E7EEF6", fg: "#2b5a8a", label: "Shortlisted" },
    hired: { bg: C.pineSoft, fg: C.pine, label: "Hired" },
    declined: { bg: C.maroonSoft, fg: C.maroon, label: "Not selected" },
  }[status];
  return <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: m.bg, color: m.fg }}>{m.label}</span>;
}

/* ---- Talent: jobs hub ---- */
function JobsHub({ user, jobs, listings, actions, trips }) {
  const [sub, setSub] = useState("board");
  const t = talentById(user.talentId);
  const open = listings.filter((l) => !l.deletedAt && l.status === "open" && listingFits(l, user.kind));
  const notApplied = open.filter((l) => !(l.applicants || []).some((a) => a.talentId === t.id));
  const applied = listings.filter((l) => !l.deletedAt && (l.applicants || []).some((a) => a.talentId === t.id));
  const invitesPending = jobs.filter((j) => !j.deletedAt && j.toTalentId === t.id && j.status === "pending").length;
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
      {sub === "invites" && <JobsInbox user={user} jobs={jobs} onSet={actions.setJobStatus} trips={trips} />}
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
      {listing.notes && <p className="text-[14px] leading-snug mt-3" style={{ color: C.ink }}>{listing.notes}</p>}

      {applied ? (
        <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ background: C.pineSoft, color: C.pine }}><Check size={15} strokeWidth={2.6} /> Applied</div>
      ) : applying ? (
        <div className="mt-3.5 fade">
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} maxLength={200} placeholder="Add a short note (optional)"
            className="w-full px-3.5 py-2.5 rounded-xl text-[14px] resize-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setApplying(false)} className="tap flex-1 h-10 rounded-xl text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
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
              <div><div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{l.title}</div>
                <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>{l.operator}</div></div>
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
  const all = listings.filter((l) => (l.operatorId ? l.operatorId === myId : l.operator === user.name));
  const mine = all.filter((l) => !l.deletedAt);
  const binned = all.filter((l) => l.deletedAt);
  const manage = mine.find((l) => l.id === manageId);
  const openCount = mine.filter((l) => l.status === "open").length;

  if (profileId) return <TalentProfile talent={talentById(profileId)} posts={posts} eng={eng} canRequest onBack={() => setProfileId(null)} />;
  if (posting) return <ListingForm operator={user.name} onBack={() => setPosting(false)} onPost={(l) => { actions.postListing(l); setPosting(false); setSub("open"); }} />;
  if (manage) return <ManageApplicants listing={manage} actions={actions} onViewProfile={setProfileId} onBack={() => setManageId(null)} />;

  return (
    <div>
      <div className="px-5 pt-4 pb-1">
        <Segmented value={sub} onChange={setSub} options={[
          ["open", `Open jobs${openCount ? ` · ${openCount}` : ""}`],
          ["direct", "Direct requests"],
          ["bin", `Bin${binned.length ? ` · ${binned.length}` : ""}`],
        ]} />
      </div>
      {sub === "open" && <OperatorListings listings={mine} actions={actions} onPost={() => setPosting(true)} onManage={setManageId} />}
      {sub === "direct" && <SentRequests operator={user.name} operatorId={myId} jobs={jobs} actions={actions} onOpen={onOpen} />}
      {sub === "bin" && <JobBin listings={binned} jobs={jobs.filter((j) => j.deletedAt && (j.operatorId === myId || j.operator === user.name))} actions={actions} />}
    </div>
  );
}

function OperatorListings({ listings, actions, onPost, onManage }) {
  return (
    <div className="px-5 pt-3 pb-4">
      <button onClick={onPost} className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-4" style={{ background: C.pine, color: "#fff", boxShadow: `0 6px 16px ${C.pine}33` }}>
        <span className="text-[17px] leading-none">+</span> Post a job
      </button>
      {listings.length === 0 ? (
        <Empty Icon={Briefcase} title="No open jobs" body="Post a job and any qualified guide or driver can apply." />
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const pending = (l.applicants || []).filter((a) => a.status === "applied").length;
            return (
              <div key={l.id} className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <button onClick={() => onManage(l.id)} className="tap w-full text-left p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{l.title}</div>
                  {l.urgent && <ShortNotice />}
                </div>
                <div className="flex flex-wrap gap-2 mt-2.5"><Pill Icon={CalendarCheck}>{fmtDate(l.start)} – {fmtDate(l.end)}</Pill><Pill>{roleLabel(l.role)}</Pill></div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <span className="text-[13px] font-medium" style={{ color: (l.applicants || []).length ? C.pine : C.muted }}>
                    {(l.applicants || []).length} applicant{(l.applicants || []).length === 1 ? "" : "s"}{pending ? ` · ${pending} new` : ""}
                  </span>
                  <span className="text-[12px] font-semibold rounded-full px-2 py-0.5" style={{ background: l.status === "open" ? C.pineSoft : C.bg, color: l.status === "open" ? C.pine : C.muted }}>{l.status === "open" ? "Open" : l.status === "filled" ? "Filled" : "Closed"}</span>
                </div>
                </button>
                <RemoveJob listing={l} actions={actions} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ManageApplicants({ listing, actions, onViewProfile, onBack }) {
  const [hireErr, setHireErr] = useState(null);
  const hire = async (a) => { setHireErr(null); const r = await actions.hireApplicant(listing, a); if (r && r.ok === false) setHireErr(`${talentById(a.talentId)?.name || "This person"}: ${r.reason}`); };
  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{listing.title}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{fmtDate(listing.start)} – {fmtDate(listing.end)} · {listing.applicants.length} applicant{listing.applicants.length === 1 ? "" : "s"}</div></div>
      </div>

      <div className="px-5 py-4">
        {hireErr && <div className="rounded-xl px-3.5 py-2.5 mb-3 text-[13px]" style={{ background: C.maroonSoft, color: C.maroon }}>{hireErr}</div>}
        {listing.role === "both" && listing.status === "open" && (() => {
          const hired = new Set((listing.applicants || []).filter((a) => a.status === "hired").map((a) => talentById(a.talentId)?.role));
          const need = ["guide", "driver"].filter((r) => !hired.has(r));
          return (
            <div className="rounded-xl px-3.5 py-2.5 mb-3 text-[13px]" style={{ background: C.pineSoft, color: C.pine }}>
              <b>Guide + Driver job.</b> {need.length === 2 ? "Hire one guide and one driver; the job closes once both are in." : `${roleLabel(need[0])} still needed — hire one to close the job.`}
            </div>
          );
        })()}
        {listing.applicants.length === 0 ? (
          <Empty Icon={Briefcase} title="No applicants yet" body="Guides and drivers who match will see this job and can apply." />
        ) : (
          <div className="space-y-3">
            {(listing.applicants || []).map((a) => (
              <div key={a.talentId} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <Avatar initials={a.initials} src={photoOf(a.talentId)} size={44} />
                  <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold" style={{ color: C.ink }}>{a.name}</div>
                    <div className="inline-flex items-center gap-1 mt-0.5"><Star size={12} color={C.gold} fill={C.gold} /><span className="text-[13px] font-semibold" style={{ color: C.goldText }}>{typeof a.rating === "number" ? a.rating.toFixed(1) : "New"}</span></div></div>
                  {a.status !== "applied" && <AppStatusBadge status={a.status} />}
                </div>
                {a.message && <p className="text-[14px] leading-snug mt-3" style={{ color: C.ink }}>“{a.message}”</p>}
                {(() => {
                  const p = talentById(a.talentId);
                  if (!p) return null;
                  return (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <AvailabilityChip talent={p} />
                        {p.verified && <span className="inline-flex items-center gap-1 text-[12px] font-semibold rounded-full px-2 py-1" style={{ background: C.pineSoft, color: C.pine }}><BadgeCheck size={12} /> Verified</span>}
                        {p.years > 0 && <span className="text-[12px] rounded-full px-2 py-1" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{p.years} yrs</span>}
                        {p.base && <span className="text-[12px] rounded-full px-2 py-1" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{p.base}</span>}
                      </div>
                      {p.languages?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {(p.languages || []).slice(0, 4).map((l) => <span key={l.n} className="text-[11px] rounded-md px-1.5 py-0.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{l.n}</span>)}
                        </div>
                      )}
                      <button onClick={() => onViewProfile(a.talentId)} className="tap w-full h-10 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
                        style={{ background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}>
                        <User size={15} /> View full profile & reviews
                      </button>
                    </div>
                  );
                })()}
                {a.status === "applied" && (
                  <div className="flex gap-2.5 mt-3">
                    <button onClick={() => actions.setApplicant(listing.id, a.talentId, "declined")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.card, border: `1.5px solid ${C.maroon}`, color: C.maroon }}><X size={17} /> Decline</button>
                    <button onClick={() => hire(a)} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#fff" }}><Check size={17} /> Hire</button>
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
  const [role, setRole] = useState("guide");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [langs, setLangs] = useState([]);
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const toggle = (l) => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]));
  const canPost = title.trim() && start && end;
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

        <Label>Who do you need?</Label>
        <div className="mb-1"><Segmented value={role} onChange={setRole} options={[["guide", "Guide"], ["driver", "Driver"], ["both", "Guide + Driver"]]} /></div>
        <p className="text-[12px] mb-4" style={{ color: C.muted }}>{role === "both" ? "Both guides and drivers will see this job. It stays open until you've hired one of each." : role === "guide" ? "Only guides will see this job." : "Only drivers will see this job."}</p>

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
          <div className="flex-1 text-left"><div className="text-[14px] font-semibold" style={{ color: C.ink }}>Short notice</div><div className="text-[13px]" style={{ color: C.muted }}>Highlight to available talent. Auto-on within 3 days.</div></div>
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

function placeLabel(loc) {
  if (!loc) return "";
  if (loc.outside || !insideBhutan(loc.lat, loc.lng)) return "Outside Bhutan";
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
          <p className="text-[13px] leading-snug mt-1 mb-3" style={{ color: C.muted }}>
            This location isn't on the Bhutan map. View it on Google Maps instead.
          </p>
          <div className="text-[12px] font-mono mb-3" style={{ color: C.muted }}>
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
        style={{ aspectRatio: BT_MAP_AR, background: "#eef1ee", cursor: readOnly ? "default" : "crosshair",
                 // a display map lets swipes scroll the page until someone zooms in; a picker keeps every touch
                 touchAction: readOnly && zoom === 1 ? "pan-y" : "none" }}>

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
          <span className="absolute bottom-2 left-2 rounded-full px-2 py-1 text-[11px]"
            style={{ background: "rgba(0,0,0,.45)", color: "#fff" }}>Tap to pin · long press to zoom</span>
        )}
        {!zoomed && readOnly && points.length > 0 && (
          <span className="absolute bottom-2 left-2 rounded-full px-2 py-1 text-[11px]"
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
        className="tap flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold"
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
  return (
    <div className="mt-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium" style={{ background: C.goldSoft, color: C.goldText }}>
        <MapPin size={13} color={C.gold} /> {placeLabel(location)}
      </span>
      {location.description && <p className="text-[13px] leading-snug mt-1.5" style={{ color: C.muted }}>{location.description}</p>}
      {showMap && <div className="mt-2.5"><BhutanMap readOnly value={location} showMeta /></div>}
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
              <Avatar initials={actorInitials(c.author_id)} src={photoOf(c.author_id)} size={28} />
              <div className="flex-1 rounded-xl px-3 py-2" style={{ background: C.bg }}>
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: C.ink }}>{actorName(c.author_id)}</span>
                  <span className="text-[11px]" style={{ color: C.muted }}>{relTime(c.ts)}</span>
                  {isAdmin && (
                    <button onClick={() => deleteComment(c.id)} className="ml-auto tap" aria-label="Delete comment">
                      <Trash2 size={13} color={C.maroon} />
                    </button>
                  )}
                </div>
                <p className="text-[14px] leading-snug mt-0.5" style={{ color: C.ink }}>{c.body}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} maxLength={240}
              placeholder={"Reply…"} className="flex-1 h-10 px-3.5 rounded-full text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
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
          <span className="text-[12px] font-semibold text-white">{location.place ? (location.source === "viewpoint" ? location.place : `Near ${location.place}`) : "Bhutan"}</span>
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
                  <span className="absolute right-1 top-1 text-[10px] font-bold rounded px-1.5 py-0.5" style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}>
                    {p.media.slides.length}
                  </span>
                )}
                {(likes > 0 || comments > 0) && (
                  <span className="absolute left-1 right-1 bottom-1 flex items-center justify-center gap-2.5 rounded-md py-0.5" style={{ background: "rgba(0,0,0,.42)" }}>
                    {likes > 0 && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white"><Heart size={10} color="#fff" fill="#fff" /> {likes}</span>}
                    {comments > 0 && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white"><MessageCircle size={10} color="#fff" /> {comments}</span>}
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
    <div className="post-detail fixed inset-0 flex flex-col" style={{ background: C.bg, zIndex: 200, height: "100dvh", paddingBottom: "calc(62px + var(--sa-bottom))" }}>
      <div ref={scroller} className="flex-1 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        <div className="h-14 px-3 flex items-center gap-3" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}` }} aria-label="Back">
            <ChevronLeft size={19} color={C.ink} />
          </button>
          <div className="flex-1">
            <div className="text-[15px] font-semibold" style={{ color: C.ink }}>Posts</div>
            <div className="text-[12px]" style={{ color: C.muted }}>{displayName(author) || "Member"} · {items.length}</div>
          </div>
        </div>
        {items.map((p) => (
          <div key={p.id} ref={(el) => { refs.current[p.id] = el; }} style={{ borderBottom: `8px solid ${C.bg}` }}>
            <WallPost post={p} author={author} eng={eng} onShareStory={onShareStory} onClose={onClose} />
          </div>
        ))}
        <div className="py-10 text-center text-[13px]" style={{ color: C.muted }}>You're all caught up</div>
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
        <Avatar initials={author?.initials || "?"} src={author?.photo} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold" style={{ color: C.ink }}>{displayName(author) || "Member"}</span>
            {author?.verified && <BadgeCheck size={14} color={C.pine} />}
          </div>
          <div className="text-[12px]" style={{ color: C.muted }}>{relTime(p.createdAt)}</div>
        </div>
      </div>

      <MediaCarousel media={p.media} />

      <div className="px-4 pt-3 pb-4">
        {p.text && <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{p.text}</p>}

        {p.location && (
          <div className="mt-2.5">
            <button onClick={() => setShowMap((v) => !v)} className="tap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ background: C.goldSoft, color: C.goldText }}>
              <MapPin size={13} color={C.gold} />
              {placeLabel(p.location)}
            </button>
            {p.location.description && <p className="text-[13px] leading-snug mt-2" style={{ color: C.muted }}>{p.location.description}</p>}
            {showMap && <div className="mt-2.5"><BhutanMap readOnly value={p.location} showMeta /></div>}
          </div>
        )}

        {onShareStory && (
          <button onClick={() => { onShareStory(p); onClose && onClose(); }} className="tap w-full h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-2 mt-3"
            style={{ background: C.goldSoft, color: C.goldText }}>
            <Plus size={14} strokeWidth={3} /> Share to your story
          </button>
        )}

        {eng ? <PostEngagement post={p} eng={eng} /> : (
          <div className="mt-3 pt-3 text-[13px]" style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.muted }}>Sign in to like, comment or share.</div>
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

  const TABS = [{ label: "Posts", Icon: ImagePlus, count: galleryCount }, { label: "Reviews", Icon: Award }];

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
  const [msgUser, setMsgUser] = useState(null);
  const [creditUser, setCreditUser] = useState(null);

  const flash = (m) => { setNote(m); setTimeout(() => setNote(null), 2600); };

  const load = async () => {
    if (!CLOUD) { setRows([]); return; }
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) { flash("Couldn't load users."); setRows([]); return; }
    setRows(data || []);
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
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const list = (rows || []).filter((r) => {
    if (filter === "submitted" && r.license_status !== "submitted") return false;
    if (filter === "verified" && r.license_status !== "verified") return false;
    if (["guide", "driver", "operator", "hotel"].includes(filter) && r.role !== filter) return false;
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
        <Chip on={filter === "hotel"} onClick={() => setFilter("hotel")}>Hotels</Chip>
      </div>

      {note && <div className="rounded-xl px-3 py-2 text-[13px] mb-3" style={{ background: C.pineSoft, color: C.pine }}>{note}</div>}

      <AdminDraftsPanel adminId={currentAdminId} onChanged={onChanged} />

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
              submitted: { bg: C.goldSoft, fg: C.goldText, label: "Pending review" },
              rejected: { bg: C.maroonSoft, fg: C.maroon, label: "Rejected" },
              none: { bg: C.bg, fg: C.muted, label: "No license" },
            }[st];
            return (
              <div key={u.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <Avatar initials={initialsOf(u.full_name)} src={u.photo_url} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{u.full_name || "Unnamed"}</div>
                    <div className="text-[13px]" style={{ color: C.muted }}>{roleLabel(u.role)}{u.base ? ` · ${u.base}` : ""}</div>
                  </div>
                  <span className="text-[12px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: stMap.bg, color: stMap.fg }}>{stMap.label}</span>
                </div>

                <div className="text-[13px] mt-2 break-all" style={{ color: C.muted }}>{u.email}</div>
                {u.phone && <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>{prettyNumber(u.phone)}</div>}

                {(u.license_number || u.license_expiry) && (
                  <div className="rounded-xl px-3 py-2.5 mt-2.5" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                    {u.license_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-[12px]" style={{ color: C.muted }}>Licence no.</span>
                        <span className="text-[13px] font-semibold" style={{ color: C.ink, fontFamily: "monospace", letterSpacing: ".04em" }}>{u.license_number}</span>
                      </div>
                    )}
                    {u.license_expiry && (() => {
                      const exp = new Date(u.license_expiry + "T23:59");
                      const days = Math.round((exp - new Date()) / 86400e3);
                      const bad = days < 0, soon = days >= 0 && days < 60;
                      return (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[12px]" style={{ color: C.muted }}>Valid until</span>
                          <span className="text-[13px] font-semibold" style={{ color: bad ? C.maroon : soon ? C.goldText : C.ink }}>
                            {fmtDate(u.license_expiry)}{bad ? " · EXPIRED" : soon ? ` · ${days}d left` : ""}
                          </span>
                        </div>
                      );
                    })()}
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
                  {u.role === "operator" && (
                    <button onClick={() => setCreditUser({ id: u.id, name: u.full_name })} className="tap h-10 px-3 rounded-xl text-[12px] font-semibold shrink-0"
                      style={{ background: C.goldSoft, color: C.goldText }}>Add drafts</button>
                  )}
                  <button onClick={() => setMsgUser(u)} className="tap w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: C.pineSoft, border: `1px solid ${C.line}` }} aria-label="Message this user">
                    <MessageCircle size={16} color={C.pine} />
                  </button>
                  <button onClick={() => setOpenId(open ? null : u.id)} className="tap w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: C.card, border: `1px solid ${C.line}` }} aria-label="More">
                    <span className="text-[16px] leading-none" style={{ color: C.muted }}>⋯</span>
                  </button>
                </div>

                {open && (
                  <div className="mt-3 pt-3 fade" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                    {st !== "rejected" && (
                      <button onClick={() => setStatus(u.id, "rejected")} className="tap w-full h-10 rounded-xl text-[14px] font-semibold mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>
                        Reject license
                      </button>
                    )}
                    <ConfirmDelete onConfirm={() => removeUser(u)} busy={busyId === u.id} />
                    <a href={`${SUPA_PROJECT_URL}/auth/users`} target="_blank" rel="noreferrer"
                      className="tap w-full h-10 rounded-xl text-[13px] font-medium inline-flex items-center justify-center gap-1.5 mt-2" style={{ background: C.bg, color: C.muted }}>
                      <ExternalLink size={13} /> Remove login in Supabase
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {msgUser && (
        <AdminMessage adminId={currentAdminId} user={msgUser}
          onClose={() => setMsgUser(null)}
          onSent={(name) => flash(`Message sent to ${name}.`)} />
      )}
      {creditUser && (
        <AdminAddDrafts adminId={currentAdminId} operator={creditUser} onClose={() => setCreditUser(null)}
          onDone={(n) => flash(`${n} AI drafts added for ${creditUser.name}.`)} />
      )}

      <div className="mt-6 rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>Database</div>
        <div className="space-y-2">
          {[["Table editor", "/editor"], ["SQL editor", "/sql/new"], ["Auth users", "/auth/users"], ["Storage", "/storage/buckets"]].map(([label, path]) => (
            <a key={label} href={`${SUPA_PROJECT_URL}${path}`} target="_blank" rel="noreferrer"
              className="tap flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ background: C.bg }}>
              <span className="text-[14px] font-medium" style={{ color: C.ink }}>{label}</span>
              <ExternalLink size={14} color={C.muted} />
            </a>
          ))}
        </div>
        <p className="text-[12px] mt-3" style={{ color: C.muted }}>Deleting here removes the profile, posts, likes, comments and license file. The login itself is removed in Supabase → Auth users.</p>
      </div>
    </div>
  );
}

function ConfirmDelete({ onConfirm, busy }) {
  const [arm, setArm] = useState(false);
  if (!arm) return (
    <button onClick={() => setArm(true)} className="tap w-full h-10 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
      style={{ background: C.maroonSoft, color: C.maroon }}>
      <UserX size={15} /> Delete user & content
    </button>
  );
  return (
    <div className="rounded-xl p-3" style={{ background: C.maroonSoft }}>
      <p className="text-[13px] mb-2.5" style={{ color: "#6b4a46" }}>This removes their profile, posts, likes, comments and license file. It can't be undone.</p>
      <div className="flex gap-2">
        <button onClick={() => setArm(false)} className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold" style={{ background: C.card, color: C.muted }}>Cancel</button>
        <button onClick={onConfirm} disabled={busy} className="tap flex-1 h-9 rounded-lg text-[13px] font-bold inline-flex items-center justify-center gap-1.5" style={{ background: C.maroon, color: "#fff" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
        </button>
      </div>
    </div>
  );
}

/* ============ Onboarding (real signup · role → details → OTP → license) ============ */
const ONB_SPECS = ["Culture & Dzong", "Alpine Trekking & Camping", "Birdwatching & Wildlife", "Spiritual & Meditation", "Adventure & Outdoors"];
const ONB_DRIVES = ["Long-distance touring", "Mountain & high passes", "Excursion & day trips", "Airport transfers", "Off-road & trailheads"];
const ONB_VEHICLES = ["Sedan", "SUV", "Hiace Van", "Coaster Bus", "Large Coach"];
const ONB_LANGS = ["Dzongkha", "English", "Hindi", "Nepali", "Japanese", "Mandarin", "German", "French", "Spanish", "Korean"];
const ONB_YEARS = [["0–2 yrs", 1], ["3–5 yrs", 4], ["6–10 yrs", 8], ["10+ yrs", 12]];
const LICENSE_LABEL = { guide: "Guide license (Department of Tourism)", driver: "Driving licence (RSTA)", operator: "Tour Operator licence (Department of Tourism)", hotel: "Hotel certificate (Department of Tourism)" };

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

function Onboard({ mode: initialMode, session, onBack, onDone, invite }) {
  const [mode, setMode] = useState(initialMode);
  const signin = mode === "signin";
  // invited as a guide or driver? their role is already decided — start at their details
  const [step, setStep] = useState(signin ? "auth" : (invite && ["guide", "driver", "operator"].includes(invite.role) ? "about" : "role"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [uid, setUid] = useState(session?.user?.id || null);
  const [role, setRole] = useState(invite && ["guide", "driver", "operator"].includes(invite.role) ? invite.role : null);
  const [name, setName] = useState((invite && invite.name) || "");
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
  const [licNumber, setLicNumber] = useState("");
  const [licExpiry, setLicExpiry] = useState("");
  const licRef = useRef();
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
    setTimeout(() => { if (reset) onDone(); else finish(null); }, 1200);
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
    const { error } = await supabase.from("profiles").upsert({
      id: effUid, email: (email || session?.user?.email || "").trim() || null, role,
      full_name: name.trim(), phone: phone.trim() || null, base: role === "hotel" ? (DK_TOWNS[base] ? DK_TOWNS[base].n : base) : (base.trim() || null),
      company_name: role === "operator" || role === "hotel" ? (company.trim() || name.trim()) : null,
      hotel_town: role === "hotel" ? base : null, hotel_tier: role === "hotel" ? "3" : null,
      years, pitch: pitch.trim() || null, languages: langs, tags,
      vehicle: role === "driver" ? vehicle : null,
      license_path: licensePath || null, license_status: licensePath ? "submitted" : "none",
      license_number: licNumber.trim() || null, license_expiry: licExpiry || null,
    });
    setBusy(false);
    if (error) {
      console.error("PROFILE SAVE FAILED", error, "uid:", effUid, "session uid:", sess.session.user.id);
      setErr("Profile step: " + (error.message || "database rejected the profile"));
      return;
    }
    onDone();
  };
  const pickLicense = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !f.type.startsWith("image/")) { setErr("Please choose a photo of your license."); return; }
    setErr(null);
    const r = new FileReader(); r.onload = () => setLicPreview(r.result); r.readAsDataURL(f);
  };
  const submitLicense = async () => {
    setBusy(true); setErr(null);
    try {
      const small = await shrinkImage(licPreview, 1600, 0.85);
      const blob = await (await fetch(small)).blob();
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

  const ORDER = signin ? ["auth", "code", "password"] : ["role", "about", "email", "code", "password"];
  const backStep = () => {
    const i = ORDER.indexOf(step);
    if (i <= 0 || step === "code") { if (step === "code") setStep("email"); else onBack(); return; }
    setStep(ORDER[i - 1]);
  };
  const detailsNext = () => { if (effUid) setStep("license"); else setStep("email"); };
  const detailsOk = role === "operator" ? true : (tags.length > 0 && langs.length > 0 && (role !== "driver" || vehicle));

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
            <button onClick={() => { setMode("signin"); setStep("auth"); setErr(null); }} className="relative flex-1 py-2.5 text-[15px] font-semibold" style={{ color: C.muted }}>Sign in</button>
            <button className="relative flex-1 py-2.5 text-[15px] font-semibold" style={{ color: C.ink }}>Create account</button>
          </div>

          <h2 className="text-[26px] font-semibold tracking-[-0.02em] mb-1" style={{ color: C.ink }}>How do you work with tours?</h2>
          <p className="text-[15px] mb-5" style={{ color: C.muted }}>This shapes your whole profile — pick the one that fits.</p>

          {[
            { id: "guide", label: "Guide", sub: "I lead trips and share Bhutan", Icon: Compass,
              points: ["Apply for jobs, including short-notice work", "Get a brief for every trip: flights, guest notes, the plan", "Build a record of guest reviews and trip photos"] },
            { id: "driver", label: "Driver", sub: "I drive guests on tour", Icon: Car,
              points: ["Pick up trips that need a driver", "See arrival flights and the day plan in your brief", "Freelance owner-drivers welcome"] },
            { id: "operator", label: "Tour Operator", sub: "I book guides and drivers", Icon: Building2,
              points: ["Turn enquiries into confirmed trips", "Find verified guides and drivers by skill and language", "Plan itineraries and request guest reviews"] },
            { id: "hotel", label: "Hotel", sub: "I host guests on tour", Icon: BedDouble,
              points: ["Receive room requests from tour operators, night by night", "Confirm with one tap — the hub never lets you overbook", "No commission; you deal with the operator directly"] },
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
                    <span className="text-[13px] leading-snug" style={{ color: C.muted }}>{p}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}

          <div className="rounded-xl p-3.5 flex gap-2.5 mt-1" style={{ background: C.goldSoft }}>
            <ShieldCheck size={16} color={C.maroon} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: C.goldText }}>
              You'll add your licence from your profile after you join. No badge appears until our team has checked it.
            </p>
          </div>
        </div>
      )}

      {step === "about" && (
        <div className="fade">
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] mb-5" style={{ color: C.ink }}>Tell us who you are</h2>
          {role === "hotel" && (<><OLabel>Property name</OLabel><OInput value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Zhiwa Boutique Stay" /></>)}
          <OLabel>{role === "operator" || role === "hotel" ? "Your name" : "Full name"}</OLabel>
          <OInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          {role === "operator" && (<><OLabel>Agency name</OLabel><OInput value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your agency name" /></>)}
          <OLabel>Phone</OLabel>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold" style={{ color: C.muted }}>+975</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
              placeholder="17 12 34 56" inputMode="tel"
              className="w-full h-12 pl-[68px] pr-4 rounded-xl text-[15px]"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          <p className="text-[12px] -mt-2 mb-4" style={{ color: C.muted }}>Operators call this number directly — make sure it's right.</p>
          {role !== "operator" && role !== "hotel" && (<><OLabel>Home base</OLabel><OInput value={base} onChange={(e) => setBase(e.target.value)} placeholder="Paro" /></>)}
          {role === "hotel" && (<>
            <OLabel>Town</OLabel>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(DK_TOWNS).filter(([, v]) => v.stay).sort((a, b) => a[1].n.localeCompare(b[1].n)).map(([k, v]) => <Chip key={k} on={base === k} onClick={() => setBase(k)}>{v.n}</Chip>)}
            </div>
            <p className="text-[12px] -mt-2 mb-4" style={{ color: C.muted }}>Operators find hotels by the town each night is spent in. Rooms, rates and your DoT certificate come next, from your Property tab.</p>
          </>)}
          <OCta disabled={name.trim().length < 2 || (role === "hotel" && (!company.trim() || !base))} onClick={() => (effUid ? finish(null) : setStep("email"))}>Continue</OCta>
        </div>
      )}

      {step === "details" && (
        <div className="fade">
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] mb-5" style={{ color: C.ink }}>{role === "guide" ? "Your specialities" : role === "driver" ? "What you drive" : "About your agency"}</h2>
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
          {role === "operator" && (<>
            <OLabel>What should the crew know about you?</OLabel>
            <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={3} maxLength={220} placeholder="Routes you run, group sizes, what you value."
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
            <button onClick={() => { setMode("signin"); setStep("auth"); setErr(null); }} className="relative flex-1 py-2.5 text-[15px] font-semibold" style={{ color: signin ? C.ink : C.muted }}>Sign in</button>
            <button onClick={() => { setMode("signup"); setStep("role"); setErr(null); }} className="relative flex-1 py-2.5 text-[15px] font-semibold" style={{ color: signin ? C.muted : C.ink }}>Create account</button>
          </div>

          <h2 className="text-[26px] font-semibold tracking-[-0.02em] mb-1" style={{ color: C.ink }}>Welcome back</h2>
          <p className="text-[15px] mb-6" style={{ color: C.muted }}>Sign in to your account.</p>

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
              <span className="text-[14px]" style={{ color: C.ink }}>Remember me</span>
            </button>
            <button onClick={() => { if (!/\S+@\S+\.\S+/.test(email)) { setErr("Enter your email first."); return; } setReset(true); setErr(null); setPw(""); setPw2(""); sendCode(); }}
              className="tap text-[14px] font-semibold" style={{ color: C.pine }}>Forgot password?</button>
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
          <p className="text-[15px] mb-6" style={{ color: C.muted }}>We'll send a code to confirm it's you.</p>
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
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] mb-1" style={{ color: C.ink }}>Enter your code</h2>
          <p className="text-[14px] mb-5" style={{ color: C.muted }}>Sent to <b style={{ color: C.ink }}>{email}</b> — check spam too.</p>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" placeholder="000000"
            className="w-full h-14 rounded-xl text-center text-[26px] font-semibold mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, letterSpacing: "0.4em" }} />
          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
          <OCta disabled={code.length < 6} busy={busy} onClick={verify}>Verify</OCta>
          <button onClick={sendCode} className="tap w-full text-[14px] font-medium mt-3" style={{ color: C.muted }}>Resend code</button>
          <p className="text-[12px] leading-snug text-center mt-4" style={{ color: C.muted }}>
            Codes go out in small batches while we grow. If yours hasn't arrived in a few minutes,
            try again in an hour — your place isn't lost.
          </p>
        </div>
      )}

      {step === "password" && (
        <div className="fade">
          {saved ? (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.pine }}>
                <Check size={30} color="#fff" strokeWidth={3} />
              </div>
              <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Password saved</div>
              <p className="text-[14px] mt-1.5" style={{ color: C.muted }}>Use it next time you sign in.</p>
            </div>
          ) : (
            <>
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] mb-1" style={{ color: C.ink }}>{reset ? "Set a new password" : "Create a password"}</h2>
              <p className="text-[15px] mb-6" style={{ color: C.muted }}>
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
              <p className="text-[13px] mb-4" style={{ color: pwStrength(pw).ok && pw === pw2 ? C.pine : C.muted }}>
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
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] mb-1" style={{ color: C.ink }}>Verify your license</h2>
          <p className="text-[14px] mb-5" style={{ color: C.muted }}>{LICENSE_LABEL[role] || "Your license"} — our team checks it, and your Verified badge appears once it clears.</p>
          {licPreview ? (
            <div className="relative rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
              <img src={licPreview} alt="Your licence" className="w-full block" style={{ maxHeight: 320, objectFit: "contain", background: C.bg }} />
              <button onClick={() => setLicPreview(null)} className="tap absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}><X size={16} color="#fff" /></button>
            </div>
          ) : (
            <button onClick={() => licRef.current?.click()} className="tap w-full rounded-2xl p-8 flex flex-col items-center justify-center text-center mb-4"
              style={{ background: C.card, border: `1.5px dashed ${C.line}` }}>
              <div className="rounded-2xl flex items-center justify-center mb-3" style={{ width: 52, height: 52, background: C.goldSoft }}><Upload size={23} color={C.gold} /></div>
              <div className="text-[15px] font-semibold" style={{ color: C.ink }}>Upload a photo of your license</div>
              <div className="text-[13px] mt-1" style={{ color: C.muted }}>Front side · clear and readable</div>
            </button>
          )}
          <input ref={licRef} type="file" accept="image/*" onChange={pickLicense} className="hidden" />

          <div className="rounded-xl px-3.5 py-2.5 mb-4 flex items-start gap-2.5" style={{ background: C.bg, border: `1px dashed ${C.line}` }}>
            <Camera size={15} color={C.gold} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
              Hold the phone flat above the licence, not at an angle, and make sure all four corners are in frame.
              A straight, well-lit photo is verified far faster.
            </p>
          </div>

          <OLabel>Licence number</OLabel>
          <input value={licNumber} onChange={(e) => setLicNumber(e.target.value.toUpperCase())} maxLength={30}
            placeholder="Exactly as printed on the licence"
            className="w-full h-12 px-4 rounded-xl text-[15px] mb-1.5"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, letterSpacing: "0.04em" }} />
          <p className="text-[12px] mb-4" style={{ color: C.muted }}>
            We check this against the {role === "driver" ? "RSTA" : "Department of Tourism"} record. Private — never shown to other users.
          </p>

          <OLabel>Valid until</OLabel>
          <input type="date" value={licExpiry} onChange={(e) => setLicExpiry(e.target.value)}
            className="w-full h-12 px-3.5 rounded-xl text-[14px] mb-1.5"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          <p className="text-[12px] mb-5" style={{ color: C.muted }}>
            We'll remind you before it expires, so your Verified badge never lapses mid-season.
          </p>

          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
          <OCta disabled={!licPreview || !licNumber.trim()} busy={busy} onClick={submitLicense}>Submit & enter the hub</OCta>
          <button onClick={() => finish(null)} disabled={busy} className="tap w-full text-[14px] font-medium mt-3" style={{ color: C.muted }}>Skip for now — I’ll add it later</button>
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

  if (withId) return <DmThread key={withId} me={me} otherId={withId} dm={dm} posts={posts} onOpenPost={onOpenPost} onBack={() => setWithId(null)} onOpenProfile={onOpenProfile} />;
  if (find) return <PickContact me={me} dirTick={dirTick} onPick={(id) => { setFind(false); setWithId(id); }} onBack={() => setFind(false)} />;

  return (
    <div className="px-5 py-4">
      {/* DIRECT MESSAGES — trip talk lives inside each trip */}
      <div className="section-head flex items-end justify-between mb-2.5">
        <div className="section-head-text text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Messages</div>
        <button onClick={() => setFind(true)} className="tap inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: C.pine }}>
          <UserPlus size={14} /> New
        </button>
      </div>

      {threads.length === 0 ? (
        <button onClick={() => setFind(true)} className="tap w-full rounded-2xl px-6 py-8 flex flex-col items-center text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.goldSoft }}><MessageCircle size={22} color={C.gold} /></div>
          <div className="text-[15px] font-semibold" style={{ color: C.ink }}>No messages yet</div>
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>Tap to message a guide, driver or operator.</p>
        </button>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {threads.map((t, idx) => {
            const p = talentById(t.other);
            return (
              <button key={t.other} onClick={() => setWithId(t.other)} className="tap w-full text-left px-4 py-3 flex items-center gap-3"
                style={{ background: C.card, borderTop: idx ? `1px solid ${C.lineSoft}` : "none" }}>
                <Avatar initials={p?.initials || "?"} src={p?.photo} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{p?.name || "Member"}</span>
                    {p?.verified && <BadgeCheck size={14} color={C.pine} />}
                  </div>
                  <div className="text-[13px] truncate" style={{ color: t.unread ? C.ink : C.muted, fontWeight: t.unread ? 600 : 400 }}>{t.fromMe ? "You: " : ""}{t.body}</div>
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
        <button onClick={onBack} aria-label="Back" className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}` }}><ChevronLeft size={19} color={C.ink} /></button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}># {trip.title}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{trip.members.length} in crew · {fmtDate(trip.start)} – {fmtDate(trip.end)}</div>
        </div>
        <TripStateBadge state={state} />
        <button onClick={() => setShowDetails((v) => !v)} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}` }} aria-label="Trip details">
          <span className="text-[16px] leading-none" style={{ color: C.muted }}>⋯</span>
        </button>
      </div>

      {showDetails && (
        <div className="px-5 py-4 fade" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          {(trip.arrivalFlight || trip.departureFlight) && (
            <div className="rounded-xl p-3.5 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2 text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>
                <CalendarDays size={14} color={C.gold} /> Flights
              </div>
              {trip.arrivalFlight && <div className="text-[13px]" style={{ color: C.muted }}>In · {trip.arrivalFlight}{trip.arrivalPoint ? ` to ${trip.arrivalPoint}` : ""}</div>}
              {trip.departureFlight && <div className="text-[13px]" style={{ color: C.muted }}>Out · {trip.departureFlight}</div>}
            </div>
          )}
          <div className="rounded-xl divide-y mb-3" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
            {(trip.members || []).map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <Avatar initials={m.initials} src={photoOf(m.id)} size={32} />
                <div className="flex-1"><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{m.name}</div>
                  <div className="text-[12px] capitalize" style={{ color: C.muted }}>{String(m.roleInTrip || "crew").replace("_", " ")}</div></div>
                {m.id === meId && <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: C.goldSoft, color: C.goldText }}>You</span>}
              </div>
            ))}
          </div>
          {trip.itinerary.length > 0 && (
            <div className="space-y-2">
              {(trip.itinerary || []).map((it) => (
                <div key={it.day} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: C.pine }}><span className="text-[11px] font-bold" style={{ color: C.goldSoft }}>{it.day}</span></div>
                  <span className="text-[14px] font-medium" style={{ color: C.ink }}>{it.title}</span>
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
    `${p.name} ${p.base || ""} ${roleLabel(p.role)}`.toLowerCase().includes(q.toLowerCase()));

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
                <Avatar initials={p.initials} src={p.photo} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{p.name}</span>
                    {p.verified && <BadgeCheck size={14} color={C.pine} />}
                  </div>
                  <div className="text-[13px]" style={{ color: C.muted }}>{roleLabel(p.role)}{p.base ? ` · ${p.base}` : ""}</div>
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
          <Avatar initials={p?.initials || "?"} src={p?.photo} size={36} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{p?.name || "Member"}</span>
              {p?.verified && <BadgeCheck size={14} color={C.pine} />}
            </div>
            <div className="text-[12px]" style={{ color: C.muted }}>{p ? roleLabel(p.role) : ""}{p?.base ? ` · ${p.base}` : ""}</div>
          </div>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto hidescroll px-4 py-4 space-y-1.5" style={{ background: C.bg, scrollbarWidth: "none" }}>
        {thread.length === 0 && (
          <div className="text-center py-10">
            <Avatar initials={p?.initials || "?"} src={p?.photo} size={56} />
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
                  {m.official && !mine && (
                    <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mb-1 ml-0.5"
                      style={{ background: C.pineSoft }}>
                      <ShieldCheck size={10} color={C.pine} />
                      <span className="text-[10px] font-bold tracking-[.04em]" style={{ color: C.pine }}>OFFICIAL</span>
                    </div>
                  )}
                  <div className="overflow-hidden" style={{
                    background: mine ? C.pine : m.official ? C.pineSoft : C.card,
                    border: mine ? "none" : `1px solid ${m.official ? C.pine + "33" : C.line}`,
                    borderRadius: 18,
                    borderBottomRightRadius: mine && lastOfGroup ? 5 : 18,
                    borderBottomLeftRadius: !mine && lastOfGroup ? 5 : 18,
                  }}>
                    {m.sharedPostId && (() => {
                      const sp = (posts || []).find((x) => x.id === m.sharedPostId);
                      if (!sp) return <div className="px-3.5 pt-2.5 text-[13px]" style={{ color: mine ? "#ffffffcc" : C.muted }}>Shared post unavailable</div>;
                      const a = talentById(sp.talentId);
                      return (
                        <button onClick={() => onOpenPost && onOpenPost(sp)} className="tap block w-full text-left">
                          {sp.media?.dataUri && <img src={sp.media.dataUri} alt="" className="w-full block" style={{ maxHeight: 190, objectFit: "cover" }} />}
                          <div className="px-3 py-2" style={{ background: mine ? "rgba(255,255,255,.12)" : C.bg }}>
                            <div className="text-[12px] font-semibold" style={{ color: mine ? "#fff" : C.ink }}>{a?.name || "Member"}</div>
                            {sp.text && <div className="text-[12px] truncate" style={{ color: mine ? "#ffffffcc" : C.muted }}>{sp.text}</div>}
                          </div>
                        </button>
                      );
                    })()}

                    {m.photo && <img src={m.photo} alt="" className="w-full block" style={{ maxHeight: 260, objectFit: "cover" }} />}

                    {m.lat != null && m.lng != null && (
                      <div className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <NavIcon size={15} color={mine ? "#fff" : C.gold} />
                          <span className="text-[14px] font-semibold" style={{ color: mine ? "#fff" : C.ink }}>Location shared</span>
                        </div>
                        <div className="text-[12px] mt-0.5 font-mono" style={{ color: mine ? "#ffffffcc" : C.muted }}>{m.lat}, {m.lng}</div>
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
                          className="tap w-full h-8 rounded-lg text-[12px] font-medium mt-1.5"
                          style={{ background: "transparent", color: mine ? "#ffffffaa" : C.muted }}>Copy coordinates</button>
                      </div>
                    )}

                    {m.body && !(m.photo && m.body === "Photo") && !(m.lat != null && m.body === "Shared a location") && (
                      <div className="px-3.5 py-2.5">
                        <span className="text-[15px] leading-snug" style={{ color: mine ? "#fff" : C.ink }}>{m.body}</span>
                      </div>
                    )}
                  </div>

                  {lastOfGroup && (
                    <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${mine ? "justify-end mr-1" : "ml-1"}`} style={{ color: C.muted }}>
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
  const match = (p) => `${p.name} ${p.base || ""}`.toLowerCase().includes(q.toLowerCase());

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
      <Avatar initials={p.initials} src={p.photo} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{p.name}</span>
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
              <div className="text-[12px] font-semibold tracking-[.12em] uppercase mt-1 mb-1" style={{ color: C.goldText }}>Followers & following</div>
              {inCircle.filter(match).map((p) => <Row key={p.id} p={p} />)}
            </>
          )}
          {others.filter(match).length > 0 && (
            <>
              <div className="text-[12px] font-semibold tracking-[.12em] uppercase mt-3 mb-1" style={{ color: C.goldText }}>Everyone else</div>
              {others.filter(match).map((p) => <Row key={p.id} p={p} />)}
            </>
          )}
          {unique.filter(match).length === 0 && (
            <p className="text-[14px] text-center py-8" style={{ color: C.muted }}>Nobody found.</p>
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
          <button onClick={() => { onExternal(); onClose(); }} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-2 inline-flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 220 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "80dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>
            {mode === "followers" ? "Followers" : "Following"} · {people.length}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto hidescroll px-4 pb-5" style={{ scrollbarWidth: "none" }}>
          {people.length === 0 ? (
            <p className="text-[14px] text-center py-10" style={{ color: C.muted }}>
              {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          ) : people.map((p) => {
            const iFollowThem = follows.some((f) => f.follower === me && f.following === p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <button onClick={() => onOpenProfile(p.id)} className="tap flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Avatar initials={p.initials} src={p.photo} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{p.name}</span>
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

/* ===================== Verification status banner ===================== */
function VerifyBanner({ user }) {
  const st = user.licenseStatus;
  if (!st || st === "verified") return null;
  const map = user.kind === "hotel" ? {
    submitted: { bg: C.goldSoft, fg: C.goldText, Icon: Clock, title: "Verification pending", body: "Our team is checking your DoT certificate. Operators can already request your rooms." },
    rejected: { bg: C.maroonSoft, fg: C.maroon, Icon: ShieldAlert, title: "Certificate not accepted", body: "Upload a clearer photo of your current DoT hotel certificate from the Property tab." },
    none: { bg: C.goldSoft, fg: C.goldText, Icon: Upload, title: "DoT certificate needed", body: "Add it from the Property tab — verified hotels carry a tick in the operator's hotel picker." },
  }[st] : {
    submitted: { bg: C.goldSoft, fg: C.goldText, Icon: Clock,
      title: "Verification pending",
      body: "Our team is checking your licence. You can use the app meanwhile — your Verified badge appears once it clears." },
    rejected: { bg: C.maroonSoft, fg: C.maroon, Icon: ShieldAlert,
      title: "Licence not approved",
      body: "We couldn't verify the document. Upload a clearer photo of a current licence from your profile." },
    none: { bg: C.goldSoft, fg: C.goldText, Icon: Upload,
      title: "Licence needed",
      body: "Add your licence to get verified — operators prioritise verified guides and drivers." },
  }[st];
  if (!map) return null;
  return (
    <div className="shrink-0 px-4 py-2.5 flex items-start gap-2.5" style={{ background: map.bg }}>
      <map.Icon size={16} color={map.fg} className="shrink-0 mt-0.5" />
      <div>
        <div className="text-[13px] font-semibold" style={{ color: map.fg }}>{map.title}</div>
        <div className="text-[12px] leading-snug" style={{ color: map.fg, opacity: .85 }}>{map.body}</div>
      </div>
    </div>
  );
}

/* ========================= Availability (talent-set) ========================= */
const AVAIL = {
  open:   { label: "Available for work", bg: "#E4EFE7", fg: "#21402F", dot: "#2E7D4F" },
  busy:   { label: "On a trip",          bg: "#F3E8CF", fg: C.goldText, dot: "#C0872B" },
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

function AvailabilityEditor({ talent, onSet }) {
  const [status, setStatus] = useState(talent?.availability || "open");
  const [from, setFrom] = useState(talent?.availableFrom || "");
  const [note, setNote] = useState(talent?.availableNote || "");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

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
    <div className="rounded-2xl p-4 mt-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays size={16} color={C.gold} />
        <span className="text-[14px] font-semibold" style={{ color: C.ink }}>Your availability</span>
      </div>
      <p className="text-[13px] mb-3" style={{ color: C.muted }}>Operators see this before they book you.</p>

      <div className="space-y-2 mb-3">
        {Object.entries(AVAIL).map(([k, v]) => (
          <button key={k} onClick={() => setStatus(k)} className="tap w-full rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{ background: status === k ? C.bg : C.card, border: `1px solid ${status === k ? C.pine : C.line}` }}>
            <span className="rounded-full shrink-0" style={{ width: 9, height: 9, background: v.dot }} />
            <span className="text-[14px] font-medium flex-1 text-left" style={{ color: C.ink }}>{v.label}</span>
            {status === k && <Check size={16} color={C.pine} strokeWidth={2.6} />}
          </button>
        ))}
      </div>

      {status === "busy" && (
        <div className="mb-3 fade">
          <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Free again from</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
        </div>
      )}

      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="Optional note — e.g. weekends only"
        className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

      <button onClick={save} disabled={!dirty || busy} className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2"
        style={{ background: saved ? C.pineSoft : dirty ? C.pine : "#C7CEC7", color: saved ? C.pine : "#fff" }}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : saved ? <><Check size={16} /> Saved</> : "Save availability"}
      </button>
    </div>
  );
}

/* ================================ Stories ================================ */
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
    <div className="story-viewer fixed inset-0 flex flex-col" style={{ background: "#08090880", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", zIndex: 220 }}>
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
          <Avatar initials={author?.initials || "?"} src={author?.photo} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white">{displayName(author) || "Member"}</div>
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
  const inputRef = useRef();

  const pick = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    if (!isVideo && !f.type.startsWith("image/")) return setErr("Choose a photo or a video.");
    if (isVideo && f.size > 30 * 1024 * 1024) return setErr("Video is over 30 MB — keep stories short.");
    if (!isVideo && f.size > 8 * 1024 * 1024) return setErr("Photo is over 8 MB.");
    setErr(null);
    const r = new FileReader();
    r.onload = () => setMedia({ kind: isVideo ? "video" : "photo", dataUri: r.result });
    r.readAsDataURL(f);
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
            <div className="text-[15px] font-semibold" style={{ color: C.ink }}>Choose photo or video</div>
            <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>Video up to 30 MB</div>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*,video/*" onChange={pick} className="hidden" />

        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="Add a caption (optional)"
          className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

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
      <div className="text-[12px] mt-1" style={{ color: onClick ? C.pine : C.muted }}>{label}</div>
    </Tag>
  );
}

/* ============================== Notifications ============================= */
function AlertsSheet({ items, onClose, onOpenProfile, onOpenMessages, onOpenJobs, onOpenTrips, onOpenTrip, onOpenTarget, onOpenSelf, pushState, offline, kept, cachedAt, fresh, onEnableNotify, installed, onInstall, onOpenUsers }) {
  const meta = {
    message:   { Icon: MessageCircle, bg: C.pineSoft,   fg: C.pine,     verb: "sent you a message" },
    share:     { Icon: Share2,        bg: C.pineSoft,   fg: C.pine,     verb: "shared a post with you" },
    like:      { Icon: Heart,         bg: C.maroonSoft, fg: C.maroon,   verb: "liked your post" },
    comment:   { Icon: MessageSquare, bg: C.goldSoft,   fg: C.goldText,  verb: "commented on your post" },
    follow:    { Icon: UserPlus,      bg: C.pineSoft,   fg: C.pine,     verb: "started following you" },
    job:       { Icon: Briefcase,     bg: C.goldSoft,   fg: C.goldText,  verb: "sent you a job request" },
    listing:   { Icon: Briefcase,     bg: C.goldSoft,   fg: C.goldText,  verb: "posted a job you can apply for" },
    applicant: { Icon: UserCheck,     bg: C.pineSoft,   fg: C.pine,     verb: "applied to your job" },
    joined:    { Icon: UserPlus,      bg: C.goldSoft,   fg: C.goldText,  verb: "joined Bhutan Tourism Hub" },
    jobAccepted:     { Icon: Check,       bg: C.successSoft, fg: C.success,  verb: "accepted your request" },
    jobDeclined:     { Icon: X,           bg: C.maroonSoft, fg: C.maroon,   verb: "can't take your request" },
    roomRequest:     { Icon: BedDouble,   bg: C.goldSoft,   fg: C.goldText, verb: "asked for rooms" },
    roomConfirmed:   { Icon: BedDouble,   bg: C.successSoft, fg: C.success,  verb: "confirmed your rooms" },
    roomDeclined:    { Icon: BedDouble,   bg: C.maroonSoft, fg: C.maroon,   verb: "couldn't take your rooms" },
    licenceSoon:     { Icon: Clock,       bg: C.goldSoft,   fg: C.goldText, verb: "Your licence is expiring", self: true },
    licenceExpired:  { Icon: ShieldAlert, bg: C.maroonSoft, fg: C.maroon,  verb: "Your licence has expired", self: true },
    licenceRejected: { Icon: ShieldAlert, bg: C.maroonSoft, fg: C.maroon,  verb: "Your licence wasn't approved", self: true },
    licenceMissing:  { Icon: Upload,      bg: C.goldSoft,   fg: C.goldText, verb: "Add your licence to get verified", self: true },
    tripSoon:        { Icon: CalendarDays, bg: C.pineSoft,  fg: C.pine,    verb: "Trip starting soon", self: true },
    askReview:       { Icon: Star,        bg: C.goldSoft,   fg: C.goldText, verb: "Ask your guests for a review", self: true },
    briefMissing:    { Icon: ShieldAlert, bg: C.goldSoft,   fg: C.goldText, verb: "Flight details not set yet", self: true },
    profileThin:     { Icon: User,        bg: C.goldSoft,   fg: C.goldText, verb: "Finish your profile", self: true },
    crewRequest:     { Icon: UserPlus,    bg: C.pineSoft,   fg: C.pine,     verb: "You've been asked to join a crew", self: true },
    crewJoined:      { Icon: Check,       bg: C.pineSoft,   fg: C.pine,     verb: "joined your crew" },
    creditRequest:   { Icon: Users,       bg: C.goldSoft,   fg: C.goldText, verb: "asked for more AI drafts" },
    official:        { Icon: ShieldCheck, bg: C.pineSoft,   fg: C.pine,    verb: "Message from Bhutan Tourism Hub" },
    nudge:           { Icon: Bell,        bg: C.goldSoft,   fg: C.goldText, verb: "Reminder", self: true },
    push:            { Icon: Bell,        bg: C.pineSoft,   fg: C.pine,     verb: "Notification", self: true },
  };
  // what alerts can do on this device, in plain words (BUILD 55)
  const note = {
    "ios-install": { Icon: Smartphone, act: onInstall, text: <><b>Add to Home Screen first</b> — on iPhone and iPad, alerts work once the app is installed. Tap to see how.</> },
    off:           { Icon: Bell, act: onEnableNotify, text: <><b>Turn on alerts</b> — hear about messages, job requests and trip reminders even when the app is closed.</> },
    error:         { Icon: Bell, act: onEnableNotify, text: <><b>Alerts didn't switch on.</b> Tap to try again.</> },
    working:       { Icon: Loader2, act: null, text: <>Switching on alerts…</> },
    denied:        { Icon: Bell, act: null, quiet: true, text: <>Alerts are blocked for this site. Allow notifications for it in your browser's settings, then reopen the app.</> },
    unsupported:   { Icon: Bell, act: null, quiet: true, text: <>This browser can't show alerts while the app is closed. Chrome on Android, or the Home Screen app on iPhone, can.</> },
  }[pushState] || null;

  const today = items.filter((a) => Date.now() - a.ts < 86400e3);
  const earlier = items.filter((a) => Date.now() - a.ts >= 86400e3);

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "80dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="flex items-center justify-between">
            <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Notifications</div>
            <span className="text-[13px]" style={{ color: C.muted }}>{items.length}</span>
          </div>
          {note && (note.act ? (
            <button type="button" onClick={note.act} className="tap w-full rounded-xl px-3.5 py-2.5 mt-3 flex items-center gap-2.5 text-left" style={{ background: C.goldSoft, border: 0 }}>
              <note.Icon size={16} color={C.gold} className="shrink-0" />
              <span className="text-[13px] leading-snug" style={{ color: C.goldText }}>{note.text}</span>
            </button>
          ) : (
            <div role="status" className="w-full rounded-xl px-3.5 py-2.5 mt-3 flex items-center gap-2.5" style={{ background: note.quiet ? C.bg : C.goldSoft }}>
              <note.Icon size={16} color={note.quiet ? C.muted : C.gold} className={`shrink-0${pushState === "working" ? " animate-spin" : ""}`} />
              <span className="text-[13px] leading-snug" style={{ color: note.quiet ? C.muted : C.goldText }}>{note.text}</span>
            </div>
          ))}
          {pushState === "on" && (
            <div className="mt-2 text-[12px] flex items-center gap-1.5" style={{ color: C.muted }}><Check size={13} color={C.pine} /> Alerts are on for this device</div>
          )}
          {(offline || kept) && (
            <div className="mt-2 text-[12px] flex items-center gap-1.5" style={{ color: C.goldText }}>
              {offline ? <CloudOff size={13} /> : <Loader2 size={13} className="animate-spin" />}
              {offline ? "Offline" : "Catching up"} — showing your notifications{cachedAt ? ` from ${relTime(cachedAt)}` : ""}.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto hidescroll px-4 pb-5" style={{ scrollbarWidth: "none" }}>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: C.goldSoft }}><Bell size={22} color={C.gold} /></div>
              <p className="text-[14px] font-semibold" style={{ color: C.ink }}>You're all caught up</p>
              <p className="text-[13px] mt-1" style={{ color: C.muted }}>Messages, job requests, trip reminders and reviews appear here.</p>
            </div>
          ) : (
            <>
              {[["New", today], ["Earlier", earlier]].map(([label, group]) => group.length === 0 ? null : (
                <div key={label}>
                  <div className="text-[12px] font-semibold tracking-[.12em] uppercase mt-3 mb-1" style={{ color: C.goldText }}>{label}</div>
                  {group.map((a) => {
                    const m = meta[a.kind] || meta.message;
                    const p = m.self ? null : talentById(a.who);
                    const go = () => {
                      if (a.tripId && onOpenTrip) return onOpenTrip(a.tripId, a.sheet);
                      if (a.open && onOpenTarget) return onOpenTarget(a.open);
                      if (a.kind === "message" || a.kind === "share" || a.kind === "official") return onOpenMessages();
                      if (a.kind === "job" || a.kind === "listing" || a.kind === "applicant" || a.kind === "jobAccepted" || a.kind === "jobDeclined") return onOpenJobs();
                      if (a.kind === "roomRequest" || a.kind === "roomConfirmed" || a.kind === "roomDeclined") return onOpenTrips && onOpenTrips();
                      if (a.kind === "tripSoon" || a.kind === "askReview" || a.kind === "crewRequest") return onOpenTrips && onOpenTrips();
                      if (a.kind === "creditRequest") return onOpenUsers && onOpenUsers();
                      if (m.self) return onOpenSelf && onOpenSelf();
                      if (p) return onOpenProfile(a.who);
                      toast(offline ? "You're offline. This opens once you're connected." : kept ? "Still connecting. Try again in a moment." : "This person's profile isn't available any more.", "info");
                    };
                    return (
                      <button key={a.id} onClick={go} className="tap w-full text-left flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                        <div className="relative shrink-0">
                          {m.self ? (
                            <div className="rounded-xl flex items-center justify-center" style={{ width: 42, height: 42, background: m.bg }}>
                              <m.Icon size={19} color={m.fg} />
                            </div>
                          ) : (
                            <>
                              <Avatar initials={p?.initials || a.initials || "?"} src={p?.photo} size={42} />
                              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: m.bg, border: `2px solid ${C.card}` }}>
                                <m.Icon size={10} color={m.fg} />
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] leading-snug" style={{ color: C.ink }}>
                            {m.self ? (
                              <b style={{ color: m.fg }}>{a.title || m.verb}</b>
                            ) : (
                              <><b>{p?.name || a.name || "Someone"}</b> <span style={{ color: C.muted }}>{m.verb}</span></>
                            )}
                            {a.urgent && <span className="ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: C.maroonSoft, color: C.maroon }}>ACTION NEEDED</span>}
                          </div>
                          {a.text && a.kind !== "follow" && <div className={`text-[13px] mt-0.5 ${a.kind === "nudge" || a.kind === "push" ? "line-clamp-2" : "truncate"}`} style={{ color: C.muted }}>{a.text}</div>}
                          <div className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: C.muted }}>
                            {fresh && fresh.has(a.id) && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.maroon }} aria-label="New" />}
                            {relTime(a.ts)}
                          </div>
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

  const install = async () => {
    if (!installEvent) return;
    setBusy(true);
    installEvent.prompt();
    try { await installEvent.userChoice; } catch (e) {}
    setBusy(false);
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 safe-bottom" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />

        <div className="flex items-start gap-3 mb-4">
          <BrandMark size={48} />
          <div>
            <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Install Bhutan Tourism Hub</div>
            <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>Takes a second, and makes a real difference.</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-4">
          <InstallReason Icon={Bell} title="Job alerts reach you"
            body={ios ? "On iPhone and iPad, notifications only work once the app is installed — a browser tab gets none."
                      : "Get notified about new jobs and messages without opening the app."} />
          <InstallReason Icon={NavIcon} title="Works with poor signal"
            body="Opens instantly and keeps working on the road, where data is weak." />
          <InstallReason Icon={Smartphone} title="Opens like a normal app"
            body="Its own icon on your home screen — no browser bar, full screen." />
        </div>

        {ios ? (
          <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>On iPhone or iPad (Safari)</div>
            <ol className="space-y-2">
              {[["1", <>Tap the <b>Share</b> button <Share size={13} className="inline" /> in Safari's toolbar</>],
                ["2", <>Scroll down and tap <b>Add to Home Screen</b></>],
                ["3", <>Tap <b>Add</b> — then open it from your home screen</>]].map(([n, t]) => (
                <li key={n} className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: C.pine, color: "#fff" }}>{n}</span>
                  <span className="text-[13px] leading-snug" style={{ color: C.ink }}>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : installEvent ? (
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
        <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{title}</div>
        <div className="text-[13px] leading-snug" style={{ color: C.muted }}>{body}</div>
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
  const ADMIN_STEPS = [
    { kind: "intro", title: `Welcome, ${first}`, body: "You're the admin. You verify licences, moderate what gets posted, and support everyone using the hub." },
    { kind: "tab", tab: "review", title: "Review", body: "Every post waits here before it goes live. Approve or reject with a reason — the person sees why." },
    { kind: "tab", tab: "users", title: "Users", body: "Everyone who signs up. Open a licence, check the number against the register, then verify or reject. You can also message anyone directly from here." },
    { kind: "tab", tab: "feed", title: "Feed", body: "Everything that's been approved, plus anything still pending — a quick way to see what the community is sharing." },
    { kind: "tab", tab: "discover", title: "Discover", body: "The full directory. Useful for checking a profile looks right before you verify it." },
    { kind: "tab", tab: "chats", title: "Messages", body: "Support conversations. Messages you send carry an OFFICIAL badge so people know they're genuinely from us." },
    { kind: "outro", title: "One habit worth keeping", body: "Verify licences the same day they arrive. A guide waiting on a badge can't be booked, and that's the whole point of being here." },
  ];

  const TALENT_STEPS = [
    { kind: "intro", title: `Welcome, ${first}`, body: "You're one of the first on the hub. Two minutes and you'll know your way around." },
    { kind: "tab", tab: "post", title: "Your Feed", body: "Share photos from your trips, pinned to where you took them. Every approved post builds a portfolio operators can see." },
    { kind: "tab", tab: "jobs", title: "Jobs", body: "Operators post work here. Apply to anything matching your skills — including short-notice jobs when someone drops out." },
    { kind: "tab", tab: "trips", title: "Trips", body: "Once you're hired, the trip appears here with your brief: arrival flight, guest notes, the day plan and an emergency contact." },
    { kind: "tab", tab: "chats", title: "Messages", body: "Crew chat for each trip, plus direct messages with operators and other guides." },
    { kind: "tab", tab: "profile", title: "Your Profile", body: "This is what operators see before booking you. Add your licence, specialities and languages here — and keep your availability current." },
    { kind: "outro", title: "Two things to do now", body: "Add your licence from your Profile so you get the Verified badge — operators prioritise verified crew. Then add your specialities and languages, because that's how operators filter when they search." },
  ];

  const OPERATOR_STEPS = [
    { kind: "intro", title: `Welcome, ${first}`, body: "Here's how a booking moves through the hub, from first enquiry to finished trip." },
    { kind: "tab", tab: "insights", title: "Insights", body: "Your business at a glance: trips, guests and nights against last year, where guests come from, why enquiries are lost, and what to do about it." },
    { kind: "tab", tab: "bookings", title: "Bookings", body: "Everything lives here in four stages: Enquiries, Confirmed, Past, and Follow up. Record an enquiry, and when the client says yes, tap Make a Trip." },
    { kind: "tab", tab: "itinerary", title: "Itinerary", body: "Drukpah builds a day-by-day plan from Bhutan's roads — or drafts one with AI from your own template and a trip description — then applies it to a trip or shares it with your client." },
    { kind: "tab", tab: "discover", title: "Crew", body: "Every verified guide and driver, filtered by speciality, language and who's available right now. Phone numbers are visible to you — that's an operator feature." },
    { kind: "tab", tab: "requests", title: "Jobs", body: "Post a job and let qualified people apply, or send a request directly to someone you want." },
    { kind: "tab", tab: "chats", title: "Messages", body: "A chat channel per trip, plus direct messages with any guide or driver." },
    { kind: "outro", title: "The one that pays for itself", body: "After a trip ends, open it and ask your guests for a review. Only you can request them — that's what makes the ratings on this platform worth trusting." },
  ];

  const HOTEL_STEPS = [
    { kind: "intro", title: `Welcome, ${first}`, body: "Tour operators plan trips here night by night. When a night lands in your town, they can ask you for rooms — and you answer in one tap." },
    { kind: "tab", tab: "hotel_home", title: "Today", body: "Tonight's rooms in use, who arrives and leaves today, requests waiting for you, and a 14-night view ahead." },
    { kind: "tab", tab: "bookings", title: "Bookings", body: "Requests to answer, confirmed stays, a calendar of every night, and the record of past stays. The hub never lets a confirmation overbook you." },
    { kind: "tab", tab: "rooms", title: "Rooms", body: "List your room types once — name, beds, how many. Close rooms for dates when they're not for sale." },
    { kind: "tab", tab: "post", title: "Feed", body: "Your shop window. Post a room, a view, a seasonal rate or a new menu. Every tour operator on the hub sees it in their Highlights feed, after a quick check by the admin." },
    { kind: "tab", tab: "chats", title: "Messages", body: "Direct messages with operators. Every booking card also has a WhatsApp shortcut." },
    { kind: "tab", tab: "hotel_profile", title: "Property", body: "Town, star rating, amenities, policy, and your DoT certificate. Verified hotels carry a tick wherever operators see you." },
    { kind: "outro", title: "Two things to do now", body: "Add your room types, then upload your DoT certificate. With both done you appear in every operator's hotel picker for your town." },
  ];
  const steps = user.kind === "admin" ? ADMIN_STEPS : talent ? TALENT_STEPS : user.kind === "hotel" ? HOTEL_STEPS : OPERATOR_STEPS;

  const step = steps[i];
  const navIndex = step.kind === "tab" ? nav.findIndex((n) => n.id === step.tab) : -1;

  // move the app to the tab being explained
  useEffect(() => { if (step.kind === "tab") setTab(step.tab); }, [i]);

  const next = () => { if (i < steps.length - 1) setI(i + 1); else onDone(); };
  const back = () => { if (i > 0) setI(i - 1); };

  // Measure where the tab really is — the side rail on wide screens, the bottom bar
  // (which may be scrolled) on phones. Never assume a position: look it up.
  const [ring, setRing] = useState(null);
  useEffect(() => {
    if (step.kind !== "tab") { setRing(null); return; }
    let alive = true;
    const visibleTab = () => Array.from(document.querySelectorAll(`[data-tab="${step.tab}"]`))
      .find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    const first = visibleTab();
    if (first && first.scrollIntoView) { try { first.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {} }
    const measure = () => {
      if (!alive) return;
      const el = visibleTab();
      if (!el) { setRing(null); return; }
      const r = el.getBoundingClientRect();
      setRing({ left: r.left, top: r.top, width: r.width, height: r.height });
    };
    measure();
    const t1 = setTimeout(measure, 150), t2 = setTimeout(measure, 500);   // after any scroll settles
    window.addEventListener("resize", measure);
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize", measure); };
  }, [i]);
  const vw = typeof window !== "undefined" ? window.innerWidth : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;
  const cardPos =
    step.kind === "tab" && ring && vw >= 900 ? { left: ring.left + ring.width + 20, top: Math.max(16, Math.min(ring.top - 24, vh - 360)), width: 380 }
    : step.kind === "tab" && ring ? { left: 0, right: 0, padding: "0 20px", bottom: Math.max(16, vh - ring.top + 14) }
    : step.kind === "top" ? { left: 0, right: 0, padding: "0 20px", top: 70 }
    : { left: 0, right: 0, padding: "0 20px", top: "50%", transform: "translateY(-50%)" };

  return createPortal((
    <div className="fixed inset-0" style={{ zIndex: 250 }}>
      {/* dim everything */}
      <div className="absolute inset-0" style={{ background: "rgba(8,10,8,.72)" }} onClick={next} />

      {/* ring around the tab being explained */}
      {ring && (
        <div className="absolute" style={{ left: ring.left - 4, top: ring.top - 4, width: ring.width + 8, height: ring.height + 8, pointerEvents: "none" }}>
          <div className="absolute inset-0 rounded-2xl" style={{ border: `2.5px solid ${C.gold}`, boxShadow: `0 0 0 4px ${C.gold}33`, background: "rgba(255,255,255,.10)" }} />
        </div>
      )}

      {/* ring around the top bar */}
      {step.kind === "top" && (
        <div className="absolute left-2 right-2 rounded-2xl" style={{ top: 4, height: 52, border: `2.5px solid ${C.gold}`, boxShadow: `0 0 0 4px ${C.gold}33`, pointerEvents: "none" }} />
      )}

      {/* card */}
      <div className="absolute" style={cardPos}>
        <div className="rounded-2xl p-5" style={{ background: C.card, boxShadow: "0 20px 40px rgba(0,0,0,.35)", maxWidth: 420, margin: "0 auto" }}>
          {(step.kind === "intro" || step.kind === "outro") && (
            <BrandMark size={48} className="mb-3" />
          )}

          <div className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>{step.title}</div>
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
            <button onClick={onDone} className="tap w-full text-[13px] font-medium mt-2.5" style={{ color: C.muted }}>Skip the tour</button>
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

  const P = ({ children }) => <p className="text-[14px] leading-relaxed mb-3" style={{ color: C.muted }}>{children}</p>;
  const H = ({ children }) => <div className="text-[14px] font-semibold mt-4 mb-1.5" style={{ color: C.ink }}>{children}</div>;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="px-4 pt-3.5 pb-1 flex items-center gap-2">
        <ShieldCheck size={16} color={C.gold} />
        <span className="text-[14px] font-semibold" style={{ color: C.ink }}>Privacy & your data</span>
      </div>

      {note && <div className="mx-4 mb-2 rounded-lg px-3 py-2 text-[13px]" style={{ background: C.pineSoft, color: C.pine }}>{note}</div>}

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
          <span className="text-[14px]" style={{ color: i === 4 ? C.maroon : C.ink }}>{label}</span>
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
          <P>When a tour operator drafts an itinerary with AI, the trip description and route are sent to Anthropic's API to write it. Operators should keep guests' passport numbers and contact details out of descriptions.</P>
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
            <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>Visible to other users</div>
            {["Name and role", "Home base", "Specialities and languages", "Years of experience", "Approved posts and photos", "Trip record and reviews", "Availability status", "Phone number and email (so operators can contact you)"].map((x) => (
              <div key={x} className="flex items-start gap-2 mb-1">
                <Eye size={12} color={C.muted} className="shrink-0 mt-1" />
                <span className="text-[13px]" style={{ color: C.muted }}>{x}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3.5" style={{ background: C.pineSoft }}>
            <div className="text-[13px] font-semibold mb-2" style={{ color: C.pine }}>Private — never shown to other users</div>
            {["Your licence document", "Your direct messages", "Your password", "Your login history"].map((x) => (
              <div key={x} className="flex items-start gap-2 mb-1">
                <Lock size={12} color={C.pine} className="shrink-0 mt-1" />
                <span className="text-[13px]" style={{ color: C.pine }}>{x}</span>
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
        <video src={media.dataUri} controls playsInline className="w-full block" style={{ maxHeight: "62dvh" }} />
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

        <p className="text-center text-[12px] mt-2.5" style={{ color: "rgba(255,255,255,.55)" }}>
          Drag to reposition · pinch or slide to zoom{slides.length > 1 ? " · tap a photo to reframe it" : ""}
        </p>
      </div>
    </div>
  ), document.body);
}

/* ========================================================================== */
/*  GUEST REVIEW — opened from a one-time link. No account, no sign-in.       */
/*  BUILD 55: one link covers the trip's crew. Each guide and driver has their */
/*  own section, side by side, with their photo, and each review is separate: */
/*  the guest rates whom they choose and leaves out anyone they would rather   */
/*  not review. Guests never sign up; the link is what proves they travelled. */
/* ========================================================================== */
/* Pieces of the page live at module scope on purpose: a component declared inside GuestReview would be a
   new component on every render, unmounting the form (and closing the keyboard) on every keystroke. */
const ReviewPage = ({ children }) => (
  <div className="flex-1 overflow-y-auto hidescroll px-4 sm:px-6 py-7" style={{ scrollbarWidth: "none" }}>
    <style>{`
      .bth-crew-grid{ display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
      @media (min-width: 640px){ .bth-crew-grid{ gap: 14px; } }
      .bth-crew-grid.n1{ grid-template-columns: minmax(0, 1fr); max-width: 420px; margin: 0 auto; }
      @media (min-width: 720px){ .bth-crew-grid.n3{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (max-width: 330px){ .bth-crew-grid{ grid-template-columns: minmax(0, 1fr); } }
      .bth-review input, .bth-review textarea{ font-size: 16px; }   /* 16px: iPhones do not zoom in on focus */
      /* five stars share the card's width, so two cards side by side fit any phone; each is a full-height tap */
      .bth-stars{ display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); max-width: 200px; margin: 0 auto; }
      .bth-star{ display: flex; align-items: center; justify-content: center; padding: 7px 1px; background: transparent; border: 0; line-height: 0; }
      .bth-star svg{ width: 100%; max-width: 32px; height: auto; transition: transform .12s; }
      .bth-star[aria-checked="true"] svg{ transform: scale(1.08); }
      .bth-review textarea:focus, .bth-review input:focus{ outline: none; border-color: ${C.pine} !important; box-shadow: 0 0 0 3px ${C.pine}1f; }
    `}</style>
    <div className="bth-review">
      <div className="flex items-center gap-2.5 mb-6">
        <BrandMark size={40} />
        <div>
          <div className="text-[16px] font-semibold leading-none" style={{ color: C.ink }}>Bhutan Tourism Hub</div>
          <div className="text-[10px] font-semibold tracking-[.14em] uppercase mt-1" style={{ color: C.goldText }}>Verified guest review</div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

const Message = ({ Icon, title, body: b, tone, action }) => (
  <ReviewPage>
    <div className="rounded-2xl p-6 text-center max-w-[460px] mx-auto" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ background: tone === "good" ? C.pineSoft : C.goldSoft }}>
        <Icon size={26} color={tone === "good" ? C.pine : C.gold} />
      </div>
      <div className="text-[17px] font-semibold" style={{ color: C.ink }}>{title}</div>
      <p className="text-[14px] leading-relaxed mt-2" style={{ color: C.muted }}>{b}</p>
      {action && (
        <button type="button" onClick={action.onClick} className="tap mt-4 h-11 px-5 rounded-xl text-[14px] font-semibold"
          style={{ background: C.pine, color: "#FFFFFF" }}>{action.label}</button>
      )}
    </div>
  </ReviewPage>
);

const REVIEW_WORDS = [null, "Poor", "Fair", "Good", "Great", "Excellent"];
const roleWord = (r) => {
  const s = String(r || "").toLowerCase();
  if (s.includes("guide")) return "Guide";
  if (s.includes("driver")) return "Driver";
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "Crew";
};

const RateStars = ({ value, onChange, label }) => (
  <div className="bth-stars" role="radiogroup" aria-label={`Rate ${label}`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n === value ? 0 : n)} className="tap bth-star" role="radio" aria-checked={n === value}
        aria-label={`${label}: ${n} out of 5`}>
        <Star size={32} strokeWidth={1.5} color={n <= value ? C.gold : C.line} fill={n <= value ? C.gold : "transparent"} />
      </button>
    ))}
  </div>
);

const DetailStars = ({ label, hint, value, onChange }) => (
  <div className="py-1.5">
    <div className="text-[12.5px] font-medium leading-tight" style={{ color: C.ink }}>{label}</div>
    <div className="text-[11px] leading-tight mb-1" style={{ color: C.muted }}>{hint}</div>
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n === value ? 0 : n)} className="tap" aria-label={`${label} ${n} of 5`}
          style={{ padding: 1, background: "transparent", border: 0, lineHeight: 0 }}>
          <Star size={18} strokeWidth={1.6} color={n <= value ? C.gold : C.line} fill={n <= value ? C.gold : "transparent"} />
        </button>
      ))}
    </div>
  </div>
);

const CrewPhoto = ({ person, size }) => <Avatar initials={initialsOf(person.name)} src={person.photo} size={size} />;

const ReviewCard = ({ person, draft, onChange }) => {
  const first = String(person.name || "").split(" ")[0] || "them";
  const driver = /driver/i.test(person.role || "");
  const set = (k, v) => onChange({ ...draft, [k]: v });
  const head = (
    <div className="flex flex-col items-center text-center">
      <CrewPhoto person={person} size={76} />
      <div className="text-[15px] font-semibold leading-tight mt-2.5" style={{ color: C.ink }}>{person.name}</div>
      <div className="text-[10.5px] font-semibold tracking-[.12em] uppercase mt-1" style={{ color: C.goldText }}>
        {roleWord(person.role)}{person.base ? ` · ${person.base}` : ""}
      </div>
    </div>
  );
  if (person.done) {
    return (
      <section aria-label={person.name} className="rounded-2xl p-3 sm:p-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        {head}
        <div className="mt-3 text-[12.5px] font-semibold text-center inline-flex w-full items-center justify-center gap-1.5" style={{ color: C.pine }}>
          <CheckCheck size={14} /> Reviewed — thank you
        </div>
      </section>
    );
  }
  const rating = draft.rating || 0;
  return (
    <section aria-label={`Your review of ${person.name}`} className="rounded-2xl p-3 sm:p-3.5"
      style={{ background: C.card, border: `1.5px solid ${rating ? C.pine : C.line}`, transition: "border-color .2s" }}>
      {head}
      <div className="mt-2"><RateStars value={rating} onChange={(n) => set("rating", n)} label={first} /></div>
      <div className="text-[12.5px] font-semibold mt-1 text-center" style={{ color: rating ? C.gold : C.muted, minHeight: 18 }}>
        {rating ? REVIEW_WORDS[rating] : "Tap a star"}
      </div>
      {rating > 0 && (
        <div className="fade mt-2.5">
          <textarea value={draft.body || ""} onChange={(e) => set("body", e.target.value)} rows={4} maxLength={600}
            ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight + 2, 280) + "px"; } }}   // grows with the words
            aria-label={`What stood out about ${first}?`} placeholder={`What stood out about ${first}?`}
            className="w-full px-2.5 py-2 rounded-xl leading-snug resize-none"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <button type="button" onClick={() => set("open", !draft.open)} aria-expanded={Boolean(draft.open)}
            className="tap w-full flex items-center justify-between mt-1.5 py-1.5 text-[12.5px] font-medium"
            style={{ color: C.muted, background: "transparent", border: 0 }}>
            <span>Details · optional</span>
            <ChevronLeft size={15} color={C.muted} style={{ transform: draft.open ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform .2s" }} />
          </button>
          {draft.open && (
            <div className="fade rounded-xl px-2.5 py-1" style={{ background: C.bg }}>
              <DetailStars label="Knowledge" hint={driver ? "Roads, places, timing" : "Culture, history, nature"} value={draft.knowledge || 0} onChange={(n) => set("knowledge", n)} />
              <DetailStars label="Care" hint={driver ? "Safe, smooth driving" : "Looking after your group"} value={draft.care || 0} onChange={(n) => set("care", n)} />
              <DetailStars label="Communication" hint="Clear and easy to follow" value={draft.comms || 0} onChange={(n) => set("comms", n)} />
            </div>
          )}
        </div>
      )}
    </section>
  );
};

// "your guide and driver", "your guides and driver", "your guide"
function crewPhrase(crew) {
  const g = crew.filter((p) => /guide/i.test(p.role || "")).length, d = crew.filter((p) => /driver/i.test(p.role || "")).length;
  const parts = [];
  if (g) parts.push(g > 1 ? "guides" : "guide");
  if (d) parts.push(d > 1 ? "drivers" : "driver");
  if (!parts.length || g + d < crew.length) return crew.length > 1 ? "crew" : "guide";
  return parts.join(" and ");
}
const joinNames = (names) => names.length <= 1 ? (names[0] || "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

function GuestReview({ token }) {
  const [state, setState] = useState("loading");   // loading | form | done | invalid | used | expired | offline
  const [info, setInfo] = useState(null);          // what the link is for (trip, guest's name)
  const [crew, setCrew] = useState([]);            // the people this guest may review
  const [drafts, setDrafts] = useState({});        // person id → { rating, body, knowledge, care, comms, open }
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [sentTo, setSentTo] = useState([]);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = async () => {
    if (!CLOUD) { setState("invalid"); return; }
    setState("loading");
    // One database function says what this link is for. It never returns the guest's email or phone.
    const { data, error } = await supabase.rpc("review_token_peek", { p_token: token });
    if (!alive.current) return;
    if (error) { setState(navigator.onLine === false || /fetch|network|load failed/i.test(error.message || "") ? "offline" : "invalid"); return; }
    if (!data || !data.state) { setState("invalid"); return; }
    if (data.state !== "ok") { setState(data.state); return; }   // "used" | "expired" | "invalid"
    const people = (Array.isArray(data.crew) && data.crew.length ? data.crew : data.talent ? [data.talent] : [])
      .map((p) => ({ id: String(p.id), name: p.full_name || "Your crew", role: p.role || "", base: p.base || "", photo: p.photo_url || null, done: Boolean(p.done) }));
    if (people.length === 0) { setState("invalid"); return; }
    setInfo(data.token || {});
    setCrew(people);
    setState(people.every((p) => p.done) ? "used" : "form");
  };
  useEffect(() => { load(); }, [token]);

  const open = crew.filter((p) => !p.done);
  const rated = open.filter((p) => (drafts[p.id] || {}).rating > 0);

  const submit = async () => {
    if (rated.length === 0) { setErr("Tap the stars under someone's photo to rate them."); return; }
    setBusy(true); setErr(null);
    const reviews = rated.map((p) => {
      const d = drafts[p.id] || {};
      return { talent_id: p.id, rating: d.rating, knowledge: d.knowledge || null, care: d.care || null, communication: d.comms || null, body: String(d.body || "").trim() || null };
    });
    // All of this guest's reviews are saved together, then the link is spent (one database step).
    const { data, error } = await supabase.rpc("submit_guest_reviews", { p_token: token, p_reviews: reviews, p_country: country.trim() || null });
    if (!alive.current) return;
    setBusy(false);
    if (error) {
      setErr(navigator.onLine === false
        ? "You're offline. Your reviews are still here; send them once you're connected."
        : "We couldn't send your reviews. Please try again in a moment.");
      return;
    }
    if (!data || !data.ok) {
      if (data && (data.state === "used" || data.state === "expired")) { setState(data.state); return; }
      setErr(data && data.state === "empty" ? "Tap the stars under someone's photo to rate them." : "We couldn't send your reviews. Please try again in a moment.");
      return;
    }
    setSentTo(rated.map((p) => String(p.name).split(" ")[0]));
    setState("done");
  };

  if (state === "loading") return (
    <ReviewPage><div className="flex items-center justify-center gap-2 py-16 text-[14px]" style={{ color: C.muted }}>
      <Loader2 size={18} className="animate-spin" /> Opening your review…
    </div></ReviewPage>
  );
  if (state === "offline") return <Message Icon={ShieldAlert} title="You're offline"
    body="This page needs a connection to open your review. Connect to Wi-Fi or mobile data, then try again."
    action={{ label: "Try again", onClick: load }} />;
  if (state === "invalid") return <Message Icon={ShieldAlert} title="This link isn't valid"
    body="Please check the link you were sent, or ask your tour operator for a new one." />;
  if (state === "used") return <Message Icon={CheckCheck} title="Already sent — thank you"
    body="Each review link works once. If you'd like to add something, ask your tour operator for a new link." tone="good" />;
  if (state === "expired") return <Message Icon={Clock} title="This link has expired"
    body="Review links stay open for 14 days. Ask your tour operator to send a new one — we'd be glad to hear from you." />;
  if (state === "done") {
    const guestFirst = info && info.guest_name ? String(info.guest_name).split(" ")[0] : "";
    return <Message Icon={Check} title={guestFirst ? `Thank you, ${guestFirst}` : "Thank you"} tone="good"
      body={`Your ${sentTo.length > 1 ? "reviews" : "review"} of ${joinNames(sentTo)} ${sentTo.length > 1 ? "go" : "goes"} to your tour operator to confirm, then ${sentTo.length > 1 ? "appear on their profiles" : "appears on their profile"} as part of their professional record.`} />;
  }

  const guestFirst = info && info.guest_name ? String(info.guest_name).split(" ")[0] : "";
  const who = crewPhrase(crew);
  const plural = /s\b|and/.test(who);
  const sendLabel = rated.length > 1 ? `Send ${rated.length} reviews` : rated.length === 1 ? `Send my review of ${String(rated[0].name).split(" ")[0]}` : "Send my review";
  return (
    <ReviewPage>
      <div className="text-center mb-5">
        <div className="text-[22px] font-semibold tracking-[-0.01em] leading-tight" style={{ color: C.ink }}>
          {guestFirst ? `${guestFirst}, how` : "How"} {plural ? "were" : "was"} your {who}?
        </div>
        <p className="text-[14px] mt-1.5 leading-snug max-w-[440px] mx-auto" style={{ color: C.muted }}>
          {open.length > 1 ? "Rate each of them on their own. Leave out anyone you'd rather not review." : "Tap a star to begin."}
        </p>
        {info && info.trip_label && (
          <div className="inline-block mt-2.5 text-[13px] rounded-full px-3 py-1" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>
            {info.trip_label}
          </div>
        )}
      </div>

      <div className={`bth-crew-grid n${Math.min(crew.length, 3)}`}>
        {crew.map((p) => (
          <ReviewCard key={p.id} person={p} draft={drafts[p.id] || {}}
            onChange={(d) => { setErr(null); setDrafts((x) => ({ ...x, [p.id]: d })); }} />
        ))}
      </div>

      <div className="mt-5 max-w-[520px] mx-auto">
        {rated.length > 0 && (
          <div className="fade">
            <div className="text-[14px] font-medium mb-1.5" style={{ color: C.ink }}>
              Where are you visiting from? <span style={{ color: C.muted }}>optional</span>
            </div>
            <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={40} placeholder="e.g. Australia"
              className="w-full h-12 px-3.5 rounded-xl mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
        )}
        {err && <p role="alert" className="text-[13px] mb-3 text-center" style={{ color: C.maroon }}>{err}</p>}
        <button type="button" onClick={submit} disabled={busy || rated.length === 0}
          className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16px] font-semibold"
          style={{ height: 54, background: rated.length ? C.pine : "#C7CEC7", color: "#FFFFFF", boxShadow: rated.length ? `0 8px 20px ${C.pine}33` : "none" }}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : sendLabel}
        </button>
        <p className="text-[12px] text-center leading-snug mt-3.5" style={{ color: C.muted }}>
          Each review goes to your tour operator to confirm, then appears on that person's profile as part of their
          professional record. Please be honest — that is what makes it worth something.
        </p>
      </div>
    </ReviewPage>
  );
}

/* ========================================================================== */
/*  GUEST REVIEWS FOR A TRIP — the operator's side (BUILD 55)                 */
/*  · Waiting for you: what guests sent, to publish on the person's profile   */
/*    or to hide.                                                             */
/*  · Ask a guest: one link per guest covers the whole crew; each person is   */
/*    reviewed separately on it.                                              */
/*  · Links for this trip: who has answered, with a one-tap reminder.         */
/*  Only the operator running the trip, or an admin, can do these — and the   */
/*  database enforces it too. Guests never sign up: the link proves they were */
/*  on the trip.                                                              */
/* ========================================================================== */
function useTripReviews(trip, enabled) {
  const [rows, setRows] = useState(null);
  const tripId = trip && trip.id;
  const load = async () => {
    if (!CLOUD || !enabled || !tripId) { setRows([]); return; }
    const { data, error } = await supabase.from("guest_reviews")
      .select("id,talent_id,guest_name,guest_country,rating,knowledge,care,communication,body,status,created_at")
      .eq("trip_id", tripId).order("created_at", { ascending: false });
    if (error) { console.warn("trip reviews:", error.message); setRows((r) => r || []); return; }
    setRows(data || []);
  };
  useEffect(() => {
    load();
    if (!CLOUD || !enabled || !tripId) return;
    const ch = supabase.channel("trip-reviews-" + tripId)
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_reviews", filter: `trip_id=eq.${tripId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tripId, enabled]);
  return { rows, reload: load };
}

function ReviewInvite({ user, trip, reviews, onClose, onOpenCrew }) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [issued, setIssued] = useState([]);
  const [made, setMade] = useState(null);           // { link, phone, email } of the link just created
  const [busy, setBusy] = useState(false);
  const [deciding, setDeciding] = useState(null);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);

  const meId = user.talentId || user.id;
  const MAX_PER_TRIP = 12;   // the database holds the same limit (cap_review_tokens)
  // who a guest reviews: the trip's crew, never the person issuing the link
  const crew = (trip.members || []).filter((m) => m.roleInTrip !== "operator" && m.id !== meId);
  const personOf = (id) => {
    const m = (trip.members || []).find((x) => x.id === id), t = talentById(id);
    return { id, name: (t && t.name) || (m && m.name) || "Crew", role: (m && m.roleInTrip) || (t && t.role) || "", photo: (t && t.photo) || null,
             initials: (t && t.initials) || initialsOf((m && m.name) || "?") };
  };
  const people = crew.map((m) => personOf(m.id));
  const names = joinNames(people.map((p) => String(p.name).split(" ")[0]));
  const who = crewPhrase(people);
  const linkFor = (token) => `${window.location.origin}/?review=${token}`;

  const load = async () => {
    if (!CLOUD) return;
    const { data, error } = await supabase.from("review_tokens")
      .select("token,guest_name,guest_email,guest_phone,used_at,expires_at,created_at")
      .eq("trip_id", trip.id).order("created_at", { ascending: false });
    if (error) { console.warn("review_tokens load:", error.message); return; }
    setIssued(data || []);
  };
  useEffect(() => { load(); }, [trip.id]);

  const create = async () => {
    if (people.length === 0) { setErr("Add the guide and driver to the trip first."); return; }
    if (!/\S+@\S+\.\S+/.test(guestEmail)) { setErr("Enter the guest's email — it records who the review came from."); return; }
    if (issued.length >= MAX_PER_TRIP) { setErr(`Up to ${MAX_PER_TRIP} guests per trip.`); return; }
    setBusy(true); setErr(null);
    const token = makeReviewToken();
    // one link for the whole crew: no talent_id. The database stamps who issued it and checks they may.
    const { error } = await supabase.from("review_tokens").insert({
      token, trip_id: trip.id, trip_label: trip.title,
      guest_name: guestName.trim() || null, guest_email: guestEmail.trim(), guest_phone: guestPhone.trim() || null,
      issued_by: meId, issuer_role: user.kind === "admin" ? "admin" : "operator",
    });
    setBusy(false);
    if (error) {
      console.error("review_tokens.insert failed:", error.message);
      setErr(/row-level security/i.test(error.message) ? "Only the trip's tour operator, or an admin, can ask for reviews."
        : /too many/i.test(error.message) ? `Up to ${MAX_PER_TRIP} guests per trip.` : failText("create the link"));
      return;
    }
    setMade({ link: linkFor(token), phone: guestPhone.trim(), email: guestEmail.trim() });
    setGuestName(""); setGuestEmail(""); setGuestPhone("");
    load();
  };

  const decide = async (id, status) => {
    setDeciding(id);
    const { error } = await supabase.from("guest_reviews").update({ status }).eq("id", id);
    setDeciding(null);
    if (error) { console.error("guest_reviews.update failed:", error.message); toast(failText(status === "published" ? "publish that review" : "hide that review")); return; }
    toast(status === "published" ? "Published — it's on their profile now." : "Hidden. It won't appear anywhere.", "ok");
    reviews && reviews.reload();
  };

  // Kept short on purpose: WhatsApp truncates long pre-filled messages on some phones,
  // and the link must sit on its own line so it is detected and previewed correctly.
  const askText = (link) =>
`Thank you for travelling with us in Bhutan.

Would you leave a short review of your ${who}, ${names}? It becomes part of their verified record on Bhutan Tourism Hub, and it genuinely helps them.

It takes about a minute:

${link}`;
  const remindText = (link) =>
`A gentle reminder from your trip in Bhutan: if you have a minute, we'd love your review of your ${who}, ${names}.

${link}`;
  const copy = async (link) => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2200); return true; }
    catch (e) { setErr("Couldn't copy — press and hold the link instead."); return false; }
  };
  const whatsApp = (phone, text) => {
    const digits = String(phone || "").replace(/[^\d]/g, "");
    window.open(digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };
  const share = async (text, link) => {
    try { if (navigator.share) await navigator.share({ title: "Review your trip", text }); else if (await copy(link)) toast("Link copied.", "ok"); } catch (e) {}
  };
  const email = (to, subject, text) => {
    window.location.href = `mailto:${to || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  };
  // a guest who hasn't answered yet: the same link again, with a kind word
  const remind = (t) => {
    const link = linkFor(t.token);
    if (t.guest_phone) return whatsApp(t.guest_phone, remindText(link));
    if (t.guest_email) return email(t.guest_email, `A quick review of your ${who}?`, remindText(link));
    return share(remindText(link), link);
  };

  const rows = (reviews && reviews.rows) || [];
  const pending = rows.filter((r) => r.status === "pending");
  const published = rows.filter((r) => r.status === "published");
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  const label = "text-[12px] font-semibold tracking-[.12em] uppercase mb-2";
  const full = issued.length >= MAX_PER_TRIP;

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "92dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Guest reviews</div>
              <p className="text-[13px] mt-1 truncate" style={{ color: C.muted }}>{trip.title} · {fmtDate(trip.start)} – {fmtDate(trip.end)}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="tap shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.grey, border: 0 }}>
              <X size={15} color={C.ink} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hidescroll px-5 pb-6" style={{ scrollbarWidth: "none" }}>
          {/* ---- waiting for you ---- */}
          {pending.length > 0 && (
            <div className="mb-6">
              <div className={label} style={{ color: C.maroon }}>Waiting for you · {pending.length}</div>
              <div className="space-y-2.5">
                {pending.map((r) => {
                  const p = personOf(r.talent_id);
                  return (
                    <div key={r.id} className="rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                      <div className="flex items-center gap-3">
                        <Avatar initials={p.initials} src={p.photo} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{p.name} <span className="font-normal" style={{ color: C.muted }}>· {roleWord(p.role)}</span></div>
                          <div className="text-[12px] truncate" style={{ color: C.muted }}>
                            From {r.guest_name || "a guest"}{r.guest_country ? `, ${r.guest_country}` : ""} · {relTime(new Date(r.created_at).getTime())}
                          </div>
                        </div>
                        <Stars score={r.rating} />
                      </div>
                      {r.body && <p className="text-[14px] leading-snug mt-2.5" style={{ color: C.ink }}>“{r.body}”</p>}
                      <div className="flex gap-2 mt-3">
                        <button type="button" disabled={deciding === r.id} onClick={() => decide(r.id, "hidden")}
                          className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Hide</button>
                        <button type="button" disabled={deciding === r.id} onClick={() => decide(r.id, "published")}
                          className="tap flex-[1.6] h-10 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5" style={{ background: C.pine, color: "#FFFFFF", border: 0 }}>
                          {deciding === r.id ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> Publish</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[12px] leading-snug mt-2.5" style={{ color: C.muted }}>
                Publishing puts the review on their profile and into their rating. Hide anything that didn't come from a real guest of this trip.
              </p>
            </div>
          )}

          {/* ---- ask a guest ---- */}
          <div className={label} style={{ color: C.goldText }}>Ask a guest</div>
          {people.length === 0 ? (
            <>
              <Empty Icon={Users} title="No crew to review yet"
                body="Reviews are for the guides and drivers on this trip. Add them to the crew, then ask your guests." />
              {onOpenCrew && (
                <button type="button" onClick={onOpenCrew} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-3 mb-5 inline-flex items-center justify-center gap-2"
                  style={{ background: C.pine, color: "#FFFFFF", border: 0 }}><UserPlus size={16} /> Add crew</button>
              )}
            </>
          ) : (
            <>
              <div className="rounded-2xl p-3 mb-4 flex items-center gap-3" style={{ background: C.bg }}>
                <div className="flex -space-x-2 shrink-0">
                  {people.slice(0, 4).map((p) => <div key={p.id} className="rounded-full" style={{ boxShadow: `0 0 0 2px ${C.bg}` }}><Avatar initials={p.initials} src={p.photo} size={34} /></div>)}
                </div>
                <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
                  One link lets the guest review {people.length > 1 ? "each of " : ""}<b>{people.map((p) => `${String(p.name).split(" ")[0]} (${roleWord(p.role).toLowerCase()})`).join(", ")}</b>{people.length > 1 ? ", separately" : ""}.
                </p>
              </div>

              {made ? (
                <div className="rounded-2xl p-4 mb-5" style={{ background: C.pineSoft }}>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: C.pine }}>Link ready</div>
                  <p className="text-[12px] mb-2.5" style={{ color: C.pine, opacity: .85 }}>Works once, for 14 days. Best shared with the guest in person on the last day.</p>
                  <div className="rounded-lg px-3 py-2 mb-2.5 break-all text-[12px] font-mono" style={{ background: C.card, color: C.ink }}>{made.link}</div>
                  <button type="button" onClick={() => whatsApp(made.phone, askText(made.link))}
                    className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-2" style={{ background: "#25D366", color: "#FFFFFF", border: 0 }}>
                    <MessageCircle size={17} /> Send on WhatsApp
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => email(made.email, `A quick review of your ${who}?`, askText(made.link))} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}><Mail size={14} /> Email</button>
                    <button type="button" onClick={() => share(askText(made.link), made.link)} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}><Share2 size={14} /> Share</button>
                    <button type="button" onClick={() => copy(made.link)} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{copied ? "Copied" : "Copy"}</button>
                  </div>
                  {!full && (
                    <button type="button" onClick={() => { setMade(null); setCopied(false); }} className="tap w-full h-9 rounded-lg text-[13px] font-medium mt-2" style={{ color: C.pine, background: "transparent", border: 0 }}>
                      Create one for the next guest
                    </button>
                  )}
                </div>
              ) : full ? (
                <p className="text-[13px] rounded-xl px-3.5 py-3 mb-5" style={{ background: C.bg, color: C.muted }}>
                  This trip has its {MAX_PER_TRIP} review links. Remind the guests below who haven't answered yet.
                </p>
              ) : (
                <>
                  <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Guest name</div>
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={60} placeholder="e.g. Sarah Whitfield"
                    className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={field} />
                  <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Guest email</div>
                  <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} type="email" inputMode="email" autoCapitalize="none" placeholder="guest@email.com"
                    className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-1.5" style={field} />
                  <p className="text-[12px] mb-3" style={{ color: C.muted }}>Kept private, never shown on a review. It lets a disputed review be traced.</p>
                  <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Guest WhatsApp <span style={{ color: C.muted }}>· optional</span></div>
                  <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} type="tel" inputMode="tel" placeholder="+61 4XX XXX XXX — with country code"
                    className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-1.5" style={field} />
                  <p className="text-[12px] mb-4" style={{ color: C.muted }}>With a number, WhatsApp opens straight to their chat.</p>
                  {err && <p role="alert" className="text-[13px] mb-2.5" style={{ color: C.maroon }}>{err}</p>}
                  <button type="button" disabled={busy} onClick={create}
                    className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-5"
                    style={{ background: C.pine, color: "#FFFFFF", border: 0 }}>
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={17} strokeWidth={3} /> Create review link</>}
                  </button>
                </>
              )}
            </>
          )}

          {/* ---- links for this trip ---- */}
          {issued.length > 0 && (
            <div className="mb-5">
              <div className={label} style={{ color: C.goldText }}>Links for this trip · {issued.length}/{MAX_PER_TRIP}</div>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                {issued.map((t, i) => {
                  const used = Boolean(t.used_at), expired = !used && new Date(t.expires_at) < new Date();
                  return (
                    <div key={t.token} className="px-3.5 py-2.5 flex items-center gap-2.5" style={{ background: C.card, borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: used ? C.pineSoft : expired ? C.maroonSoft : C.goldSoft }}>
                        {used ? <Check size={13} color={C.pine} /> : expired ? <X size={13} color={C.maroon} /> : <Clock size={13} color={C.gold} />}
                      </span>
                      <span className="flex-1 min-w-0 text-[13px] truncate" style={{ color: C.ink }}>{t.guest_name || t.guest_email || "Guest"}</span>
                      {used || expired ? (
                        <span className="text-[12px] shrink-0" style={{ color: C.muted }}>{used ? "Reviewed" : "Expired"}</span>
                      ) : (
                        <button type="button" onClick={() => remind(t)} className="tap shrink-0 h-8 px-3 rounded-lg text-[12px] font-semibold inline-flex items-center gap-1"
                          style={{ background: C.goldSoft, color: C.goldText, border: 0 }} aria-label={`Remind ${t.guest_name || "this guest"}`}>
                          <RefreshCw size={12} /> Remind
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- published ---- */}
          {published.length > 0 && (
            <div className="mb-5">
              <div className={label} style={{ color: C.goldText }}>Published · {published.length}</div>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                {published.map((r, i) => {
                  const p = personOf(r.talent_id);
                  return (
                    <div key={r.id} className="px-3.5 py-2.5 flex items-center gap-2.5" style={{ background: C.card, borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                      <Avatar initials={p.initials} src={p.photo} size={28} />
                      <span className="flex-1 min-w-0 text-[13px] truncate" style={{ color: C.ink }}>{p.name} <span style={{ color: C.muted }}>· from {r.guest_name || "a guest"}</span></span>
                      <Stars score={r.rating} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl p-3.5 flex gap-2.5" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <ShieldCheck size={16} color={C.gold} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
              Guests don't sign up: the link is what shows they were on this trip, and it works once. Guides and drivers can't
              review themselves, and every review waits here for you before it appears on a profile.
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
      .from("guest_reviews").select("id,guest_name,guest_country,rating,knowledge,care,communication,body,trip_label,created_at")
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
    if (error) { console.error("hide review failed:", error.message); toast(failText("hide that review")); return; }
    toast("Hidden. It won't appear anywhere.", "ok");
    load();
  };

  if (rows === null) {
    return <div className="flex items-center gap-2 justify-center py-8 text-[14px]" style={{ color: C.muted }}>
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
          <button onClick={onAskOperator} className="tap h-10 px-4 rounded-xl text-[14px] font-semibold inline-flex items-center gap-1.5"
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
            <div className="text-[13px] mt-0.5" style={{ color: "#ffffffcc" }}>{rows.length} {rows.length === 1 ? "review" : "reviews"}</div>
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
                  <span className="text-[13px] font-semibold" style={{ color: C.pine }}>{Number(v || 0).toFixed(1)}</span>
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
                <span className="text-[13px] font-semibold" style={{ color: C.goldText }}>
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
                style={{ background: C.pineSoft, color: C.pine }}>
                <ShieldCheck size={10} /> Guest of this trip
              </span>
              <span className="text-[11px]" style={{ color: C.muted }}>{relTime(new Date(r.created_at).getTime())}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[12px] text-center mt-4 leading-snug" style={{ color: C.muted }}>
        Each review comes from a one-time link sent to a guest of that trip. Guests can only review the
        guides and drivers they travelled with.
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
          <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Operator or agency name</div>
          <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={60}
            placeholder="e.g. Druk Journeys"
            className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

          <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Their WhatsApp number <span style={{ color: C.muted }}>· optional</span></div>
          <input value={opPhone} onChange={(e) => setOpPhone(e.target.value)} inputMode="tel"
            placeholder="17 12 34 56 — or with country code"
            className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-1.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <p className="text-[12px] mb-4" style={{ color: C.muted }}>
            Add it and WhatsApp opens straight to their chat. A Bhutanese 8-digit number works on its own.
          </p>

          <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>Message</div>
          <div className="rounded-xl p-3.5 mb-3 text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, maxHeight: 240, overflowY: "auto" }}>
            {message}
          </div>

          {note && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{note}</p>}

          <div className="space-y-2">
            <button onClick={shareWhatsApp}
              className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
              style={{ background: "#25D366", color: "#fff" }}>
              <MessageCircle size={17} /> Send on WhatsApp
            </button>
            <div className="flex gap-2">
              <button onClick={shareEmail} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                <Mail size={15} /> Email
              </button>
              <button onClick={shareNative} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                <Share2 size={15} /> Share
              </button>
              <button onClick={copy} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="rounded-xl p-3.5 flex gap-2.5 mt-4" style={{ background: C.goldSoft }}>
            <Star size={16} color={C.gold} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: C.goldText }}>
              <b>Tip:</b> ask on the last day of the trip, while the guests are still with you.
              A review written the same week is far more specific — and far more useful to the next operator reading it.
            </p>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}

/* ========================================================================== */
/*  ADMIN → MESSAGE A USER                                                    */
/*  Official support messages. Sent through the normal message system so the  */
/*  person replies in the usual place, but flagged so they can tell it is     */
/*  genuinely from us and not someone impersonating support.                  */
/* ========================================================================== */
const ADMIN_TEMPLATES = [
  {
    id: "licence_unclear",
    label: "Licence unclear",
    body: "Kuzu Zangpo la,\n\nThank you for submitting your licence. Unfortunately the photo isn't clear enough for us to verify it — some of the details can't be read.\n\nCould you upload it again? Hold your phone flat above the licence rather than at an angle, make sure all four corners are in the frame, and check there's no glare.\n\nYou can do this from your Profile. Once it's clear we'll verify it quickly.\n\nKadrinchhey la,\nBhutan Tourism Hub",
  },
  {
    id: "licence_expired",
    label: "Licence expired",
    body: "Kuzu Zangpo la,\n\nOur records show your licence has expired. Your Verified badge is paused until we see a current one.\n\nOnce you've renewed, upload a photo of the new licence from your Profile and we'll restore your badge straight away.\n\nIf the expiry date on your profile is wrong, just reply here and we'll correct it.\n\nKadrinchhey la,\nBhutan Tourism Hub",
  },
  {
    id: "licence_mismatch",
    label: "Number doesn't match",
    body: "Kuzu Zangpo la,\n\nThe licence number on your profile doesn't match the document you uploaded. This is usually just a typing slip.\n\nCould you check the number and correct it from your Profile? It should be entered exactly as printed on the licence.\n\nKadrinchhey la,\nBhutan Tourism Hub",
  },
  {
    id: "welcome",
    label: "Welcome & verified",
    body: "Kuzu Zangpo la,\n\nYour licence has been verified — your profile now carries the Verified badge, and operators can find and book you.\n\nTwo things worth doing now: add a few photos from your trips so operators can see your work, and keep your availability up to date so you appear in searches when you're free.\n\nIf anything isn't working, reply here. We read every message.\n\nKadrinchhey la,\nBhutan Tourism Hub",
  },
  {
    id: "profile_incomplete",
    label: "Profile incomplete",
    body: "Kuzu Zangpo la,\n\nYour profile is missing a few details that operators look for — specialities, languages, or years of experience.\n\nOperators filter by these, so an incomplete profile is often skipped even when the person is well qualified. It takes two minutes to fill in from your Profile.\n\nKadrinchhey la,\nBhutan Tourism Hub",
  },
  { id: "custom", label: "Write my own", body: "" },
];

function AdminMessage({ adminId, user, onClose, onSent }) {
  const [tpl, setTpl] = useState(ADMIN_TEMPLATES[0].id);
  const [body, setBody] = useState(ADMIN_TEMPLATES[0].body);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const pick = (id) => {
    setTpl(id);
    const t = ADMIN_TEMPLATES.find((x) => x.id === id);
    setBody(t ? t.body : "");
    setErr(null);
  };

  const send = async () => {
    const text = body.trim();
    if (!text) { setErr("Write a message first."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: adminId, recipient_id: user.id, body: text, is_official: true,
    });
    setBusy(false);
    if (error) {
      console.error("admin message failed:", error.message);
      // retry without the flag, in case the column migration hasn't been run
      const retry = await supabase.from("direct_messages").insert({
        sender_id: adminId, recipient_id: user.id, body: text,
      });
      if (retry.error) { setErr("Couldn't send — " + retry.error.message); return; }
    }
    auditLog(adminId, "admin.message", user.id, ADMIN_TEMPLATES.find((x) => x.id === tpl)?.label || "custom");
    onSent && onSent(user.full_name || "the user");
    onClose();
  };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "90dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="flex items-center gap-3">
            <Avatar initials={initialsOf(user.full_name)} src={user.photo_url} size={42} />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold" style={{ color: C.ink }}>{user.full_name || "Unnamed"}</div>
              <div className="text-[13px]" style={{ color: C.muted }}>{roleLabel(user.role)}{user.base ? ` · ${user.base}` : ""}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hidescroll px-5 pb-5" style={{ scrollbarWidth: "none" }}>
          <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>Choose a message</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {ADMIN_TEMPLATES.map((t) => (
              <Chip key={t.id} on={tpl === t.id} onClick={() => pick(t.id)}>{t.label}</Chip>
            ))}
          </div>

          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} maxLength={1500}
            placeholder="Write your message…"
            className="w-full px-3.5 py-3 rounded-xl text-[14px] leading-relaxed resize-none"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          <div className="flex justify-between items-center mt-1 mb-4">
            <span className="text-[12px]" style={{ color: C.muted }}>Edit freely before sending</span>
            <span className="text-[11px]" style={{ color: C.muted }}>{body.length}/1500</span>
          </div>

          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}

          <button onClick={send} disabled={busy || !body.trim()}
            className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            style={{ background: body.trim() ? C.pine : "#C7CEC7", color: "#fff" }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><SendIcon size={17} /> Send message</>}
          </button>

          <div className="rounded-xl p-3.5 flex gap-2.5 mt-4" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <ShieldCheck size={16} color={C.gold} className="shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
              This arrives in their Messages marked as official, so they know it genuinely came from
              Bhutan Tourism Hub. They can reply to you in the same thread. Every message you send is
              recorded in the audit log.
            </p>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}

/* ========================================================================== */
/*  ENQUIRIES — the pipeline before a trip exists                             */
/* ========================================================================== */
const ENQ_STATUS = {
  new:    { label: "New",      bg: C.goldSoft,   fg: C.goldText },
  quoted: { label: "Quoted",   bg: "#E7EEF6",    fg: "#2b5a8a" },
  won:    { label: "Won",      bg: C.pineSoft,   fg: C.pine },
  lost:   { label: "Failed",   bg: C.maroonSoft, fg: C.maroon },
  cold:   { label: "Cold",     bg: C.bg,         fg: C.muted },
};
const ENQ_SOURCES = ["Website", "Email", "WhatsApp", "Phone", "Referral", "Agent", "Repeat client", "Social media", "Walk-in", "Other"];
const LOST_REASONS = ["Price too high", "Dates unavailable", "Chose another operator", "Trip postponed", "No reply", "Other"];

function EnquiryCard({ enq, actions, onEdit, onFlash, onOpenTrips }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [losing, setLosing] = useState(false);
  const st = ENQ_STATUS[enq.status] || ENQ_STATUS.new;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = ["new", "quoted", "cold"].includes(enq.status) && enq.followUpOn && enq.followUpOn < today;

  const convert = async () => {
    setBusy(true);
    const res = await actions.convertEnquiry(enq);
    setBusy(false);
    setConfirming(false);
    if (res.ok) { onFlash(`${enq.clientName} is now a trip. Add your crew from Trips.`); onOpenTrips && onOpenTrips(); }
    else onFlash("Couldn't create the trip — " + (res.reason || "try again"));
  };

  const contactWhatsApp = () => {
    const digits = String(enq.clientPhone || "").replace(/[^\d]/g, "");
    if (!digits) return onFlash("No phone number saved for this enquiry.");
    const text = encodeURIComponent(
      `Kuzu Zangpo la ${enq.clientName},\n\nFollowing up on your enquiry about travelling in Bhutan${enq.start ? ` around ${fmtDate(enq.start)}` : ""}. Is this still something you're planning?\n\nHappy to answer any questions.`);
    window.open(`https://wa.me/${digits}?text=${text}`, "_blank", "noopener");
    actions.setEnquiryStatus(enq.id, enq.status === "new" ? "quoted" : enq.status);
  };

  const contactEmail = () => {
    if (!enq.clientEmail) return onFlash("No email saved for this enquiry.");
    const subject = encodeURIComponent(`Your Bhutan trip${enq.start ? ` — ${fmtDate(enq.start)}` : ""}`);
    const body = encodeURIComponent(
      `Dear ${enq.clientName},\n\nI'm following up on your enquiry about travelling in Bhutan${enq.start ? ` around ${fmtDate(enq.start)}` : ""}.\n\nIs this still something you're planning? I'd be glad to answer any questions.\n\nKind regards`);
    window.location.href = `mailto:${enq.clientEmail}?subject=${subject}&body=${body}`;
    actions.setEnquiryStatus(enq.id, enq.status === "new" ? "quoted" : enq.status);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${overdue ? "#e6c9c4" : C.line}` }}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={onEdit} className="tap flex-1 min-w-0 text-left">
          <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{enq.clientName}</div>
          {enq.title && <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>{enq.title}</div>}
        </button>
        <span className="text-[12px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
      </div>

      {/* where this sits in the journey */}
      {["new", "quoted"].includes(enq.status) && (
        <div className="flex items-center gap-1.5 mt-2.5">
          {[["Enquiry", true], ["Quoted", enq.status === "quoted"], ["Trip", false]].map(([label, done], i) => (
            <React.Fragment key={label}>
              {i > 0 && <div style={{ flex: 1, height: 1.5, background: done ? C.pine : C.line }} />}
              <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0"
                style={{ background: done ? C.pineSoft : C.bg, color: done ? C.pine : C.muted, border: `1px solid ${done ? "transparent" : C.line}` }}>
                {label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-2.5">
        {enq.start && <Pill Icon={CalendarCheck}>{fmtDate(enq.start)}{enq.end ? ` – ${fmtDate(enq.end)}` : ""}</Pill>}
        {enq.partySize > 0 && <Pill Icon={Users}>{enq.partySize} {enq.partySize === 1 ? "guest" : "guests"}</Pill>}
        {enq.country && <Pill>{enq.country}</Pill>}
        {enq.source && <Pill>{enq.source}</Pill>}
      </div>

      {enq.notes && <p className="text-[13px] leading-snug mt-2.5" style={{ color: C.muted }}>{enq.notes}</p>}

      {enq.status === "lost" && enq.lostReason && (
        <div className="text-[13px] mt-2.5 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>
          Didn't go ahead — {enq.lostReason}
        </div>
      )}

      {overdue && (
        <div className="text-[13px] mt-2.5 rounded-lg px-3 py-2 inline-flex items-center gap-1.5" style={{ background: C.goldSoft, color: C.goldText }}>
          <Clock size={12} /> Follow-up was due {fmtDate(enq.followUpOn)}
        </div>
      )}

      {enq.status === "won" && (
        <button onClick={onOpenTrips} className="tap w-full h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 mt-3"
          style={{ background: C.pineSoft, color: C.pine }}>
          <MapIcon size={14} /> Open the trip
        </button>
      )}

      {enq.status === "lost" && (
        <div className="flex gap-2 mt-3">
          <button onClick={contactEmail} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
            <Mail size={14} /> Follow up
          </button>
          <button onClick={() => actions.setEnquiryStatus(enq.id, "quoted")}
            className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
            style={{ background: C.goldSoft, color: C.goldText }}>
            Reopen
          </button>
        </div>
      )}

      {["new", "quoted", "cold"].includes(enq.status) && !confirming && !losing && (
        <>
          <div className="flex gap-2 mt-3">
            <button onClick={contactWhatsApp} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
              style={{ background: "#25D366", color: "#fff" }}>
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button onClick={contactEmail} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
              <Mail size={14} /> Email
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setLosing(true)} className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
              style={{ background: C.card, border: `1px solid ${C.maroon}44`, color: C.maroon }}>
              Failed
            </button>
            <button onClick={() => setConfirming(true)} className="tap flex-[1.4] h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
              style={{ background: C.pine, color: "#fff" }}>
              <MapIcon size={15} /> Make a Trip
            </button>
          </div>
        </>
      )}

      {confirming && (
        <div className="rounded-xl p-3.5 mt-3 fade" style={{ background: C.pineSoft }}>
          <div className="text-[14px] font-semibold mb-1" style={{ color: C.pine }}>Make this a trip?</div>
          <p className="text-[13px] mb-3" style={{ color: C.pine, opacity: .85 }}>
            {enq.start && enq.end
              ? `A trip will be created for ${fmtDate(enq.start)} – ${fmtDate(enq.end)}. You can then hire your crew onto it and build the itinerary.`
              : "This enquiry has no dates yet. Tap the name above to add them, then come back."}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold"
              style={{ background: C.card, color: C.muted }}>Cancel</button>
            <button onClick={convert} disabled={busy || !enq.start || !enq.end}
              className="tap flex-1 h-10 rounded-lg text-[13px] font-bold inline-flex items-center justify-center gap-1.5"
              style={{ background: enq.start && enq.end ? C.pine : "#C7CEC7", color: "#fff" }}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <><MapIcon size={14} /> Make a Trip</>}
            </button>
          </div>
        </div>
      )}

      {losing && (
        <div className="rounded-xl p-3.5 mt-3 fade" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
          <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>What happened?</div>
          <div className="flex flex-wrap gap-2 mb-2.5">
            {LOST_REASONS.map((r) => (
              <button key={r} onClick={() => {
                  const sixMonths = new Date(Date.now() + 182 * 86400e3).toISOString().slice(0, 10);
                  actions.setEnquiryStatus(enq.id, "lost", { lost_reason: r, follow_up_on: enq.followUpOn || sixMonths });
                  setLosing(false);
                  onFlash("Recorded — it'll come back in your follow-ups in six months.");
                }}
                className="tap rounded-full px-3 py-1.5 text-[13px] font-medium"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{r}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLosing(false)} className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
            <button onClick={() => {
                const month = new Date(Date.now() + 30 * 86400e3).toISOString().slice(0, 10);
                actions.setEnquiryStatus(enq.id, "cold", { follow_up_on: enq.followUpOn || month });
                setLosing(false);
                onFlash("Marked cold — back in your follow-ups in a month.");
              }}
              className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold"
              style={{ background: C.goldSoft, color: C.goldText }}>Just gone quiet</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EnquiryForm({ user, enquiry, actions, onBack, onSaved }) {
  const e = enquiry || {};
  const isNew = !e.id;
  const [f, setF] = useState({
    id: e.id, clientName: e.clientName || "", clientEmail: e.clientEmail || "", clientPhone: e.clientPhone || "",
    country: e.country || "", source: e.source || "", title: e.title || "",
    partySize: e.partySize || "", start: e.start || "", end: e.end || "",
    interests: e.interests || "", budgetNote: e.budgetNote || "", notes: e.notes || "",
    status: e.status || "new", quotedAmount: e.quotedAmount || "", followUpOn: e.followUpOn || "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    if (!f.clientName.trim()) { setErr("Who is the enquiry from?"); return; }
    setBusy(true); setErr(null);
    const res = await actions.saveEnquiry(f);
    setBusy(false);
    if (!res.ok) { setErr(res.reason || "Couldn't save. Try again."); return; }
    onSaved(isNew ? "Enquiry saved." : "Enquiry updated.");
  };

  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}>
          <ChevronLeft size={19} color={C.ink} />
        </button>
        <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{isNew ? "New enquiry" : "Edit enquiry"}</span>
      </div>

      <div className="px-5 py-4">
        <Label>Client name</Label>
        <input value={f.clientName} onChange={(ev) => set("clientName", ev.target.value)} maxLength={80}
          placeholder="Who asked?" className="w-full h-12 px-4 rounded-xl text-[15px] mb-4"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label>Email</Label>
            <input value={f.clientEmail} onChange={(ev) => set("clientEmail", ev.target.value)} inputMode="email" autoCapitalize="none"
              placeholder="optional" className="w-full h-12 px-3.5 rounded-xl text-[14px]"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <input value={f.clientPhone} onChange={(ev) => set("clientPhone", ev.target.value)} inputMode="tel"
              placeholder="+61 4XX…" className="w-full h-12 px-3.5 rounded-xl text-[14px]"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
        </div>

        <Label>Where did they come from?</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {ENQ_SOURCES.map((x) => <Chip key={x} on={f.source === x} onClick={() => set("source", f.source === x ? "" : x)}>{x}</Chip>)}
        </div>

        <Label>Trip title</Label>
        <input value={f.title} onChange={(ev) => set("title", ev.target.value)} maxLength={80}
          placeholder="e.g. 8-day Western Bhutan + Punakha" className="w-full h-12 px-4 rounded-xl text-[15px] mb-4"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <Label>Guests</Label>
            <input value={f.partySize} onChange={(ev) => set("partySize", ev.target.value.replace(/[^\d]/g, ""))} inputMode="numeric"
              placeholder="2" className="w-full h-12 px-3.5 rounded-xl text-[14px]"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          <div>
            <Label>From</Label>
            <input type="date" value={f.start} onChange={(ev) => set("start", ev.target.value)}
              className="w-full h-12 px-2.5 rounded-xl text-[13px]"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          <div>
            <Label>To</Label>
            <input type="date" value={f.end} onChange={(ev) => set("end", ev.target.value)}
              className="w-full h-12 px-2.5 rounded-xl text-[13px]"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
        </div>

        <Label>Country</Label>
        <input value={f.country} onChange={(ev) => set("country", ev.target.value)} maxLength={40}
          placeholder="e.g. Australia" className="w-full h-12 px-4 rounded-xl text-[15px] mb-4"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <Label>What are they interested in?</Label>
        <textarea value={f.interests} onChange={(ev) => set("interests", ev.target.value)} rows={2} maxLength={300}
          placeholder="Trekking, festivals, birding, photography…"
          className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none mb-4"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <Label>Notes</Label>
        <textarea value={f.notes} onChange={(ev) => set("notes", ev.target.value)} rows={3} maxLength={600}
          placeholder="Anything worth remembering — budget signals, hesitations, who they're travelling with."
          className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none mb-4"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

        <Label>Follow up on</Label>
        <input type="date" value={f.followUpOn} onChange={(ev) => set("followUpOn", ev.target.value)}
          className="w-full h-12 px-3.5 rounded-xl text-[14px] mb-1.5"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        <p className="text-[12px] mb-5" style={{ color: C.muted }}>
          It'll appear in "To chase" on this date. Most lost work is simply never followed up.
        </p>

        {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}

        <button onClick={save} disabled={busy}
          className="tap w-full rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold"
          style={{ height: 52, background: C.pine, color: "#fff" }}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <>{isNew ? "Save enquiry" : "Save changes"}</>}
        </button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  ITINERARY BUILDER — operator adds the day-by-day plan                      */
/* ========================================================================== */

/* A saved itinerary is plain text per day. When those lines were written by Drukpah (or follow its
   "From → To · … · Night in Town (hotel)" shape), the route can be rebuilt for the map. BUILD 52. */
function dkPlanFromItinerary(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const hotelKey = (t) => { const m = String(t || "").toLowerCase(); if (m.includes("home") || m.includes("farm")) return "home"; if (m.includes("lux")) return "lux"; if (m.includes("4")) return "4"; if (m.includes("3")) return "3"; return "3"; };
  const days = []; let prevNight = null;
  for (const r of rows.slice().sort((a, b) => (a.day || 0) - (b.day || 0))) {
    const text = String(r.title || "");
    const parts = text.split(" · ").map((x) => x.trim()).filter(Boolean);
    let from = null, to = null, night = null, hotel = "3", h = 0;
    const acts = [];
    parts.forEach((part, i) => {
      const mv = part.match(/^(.+?)\s*(?:→|->)\s*(.+?)(?:\s*\(.*\))?$/);
      const nt = part.match(/^Night in (.+?)(?:\s*\((.*)\))?$/i);
      const hm = part.match(/^(\d+)?\s*([¼½¾])?\s*h$/);
      // BUILD 54: towns are also found at the end of a phrase ("Arrival paro → Thimphu") and by their other names
      const a = mv ? dkTownKey(mv[1]) : null, b = mv ? dkTownKey(mv[2].split(",")[0]) : null;
      if (mv && !to && a && b) { from = a.key; to = b.key; const c = mv[2].indexOf(","); if (c >= 0 && mv[2].slice(c + 1).trim()) acts.push(mv[2].slice(c + 1).trim()); return; }
      const n = nt ? dkTownKey(nt[1]) : null;
      if (nt && n) { night = n.key; hotel = hotelKey(nt[2]); return; }
      if (hm && (hm[1] || hm[2])) { h = Number(hm[1] || 0) + ({ "¼": 0.25, "½": 0.5, "¾": 0.75 }[hm[2]] || 0); return; }
      const t = dkTownKey(part);
      if (t && t.exact && !from) { from = t.key; return; }
      if (i === 0) return;   // the day's name ("Over Dochula to Punakha"), not something to do
      acts.push(part);
    });
    if (!from) from = prevNight || night;
    if (!from && !night) continue;
    const moving = Boolean(to && from && to !== from);
    let pts = [], passes = [], km = 0;
    if (moving) { try { const leg = dkRoute(from, to); pts = leg.pts || []; passes = leg.passes || []; km = leg.km || 0; if (!h) h = leg.h || 0; } catch (e) { pts = [DK_TOWNS[from], DK_TOWNS[to]].filter(Boolean); } }
    else { const t = DK_TOWNS[night || from]; pts = t ? [t] : []; }
    days.push({ day: r.day, from, to: moving ? to : null, night: night || (moving ? to : from), hotel, moving, h, km, pts, passes, acts });
    prevNight = night || (moving ? to : from);
  }
  if (days.length === 0 || !days.some((d) => d.night)) return null;
  return { days, notes: [] };
}

/* ── Trip itinerary cards (BUILD 54): a saved day's text — "Name · From → To · 2½ h · things, planned · Night in Town (hotel)" —
   read back into its parts for display, and Drukpah's ideas for that day, which an editor can add with one tap. ── */
const DK_TOWN_ALIAS = { "wangdue phodrang": "wangdue", "wangdi": "wangdue", "phobjikha": "gangtey", "jakar": "bumthang", "tashigang": "trashigang", "trashi yangtse": "yangtse", "phuntsholing": "phuentsholing" };
function dkTownKey(s) {   // a town name, an alias, or a town at the end of a phrase ("Arrival paro") → { key, prefix, exact }
  const raw = String(s || "").trim(); const m = raw.toLowerCase().replace(/\s+/g, " ");
  if (!m) return null;
  const names = {}; for (const k of Object.keys(DK_TOWNS)) names[DK_TOWNS[k].n.toLowerCase()] = k;
  for (const al of Object.keys(DK_TOWN_ALIAS)) names[al] = DK_TOWN_ALIAS[al];
  if (names[m]) return { key: names[m], prefix: "", exact: true };
  for (const n of Object.keys(names).sort((x, y) => y.length - x.length)) if (m.endsWith(" " + n)) return { key: names[n], prefix: raw.slice(0, raw.length - n.length).trim(), exact: false };
  return null;
}
const dkNorm = (s) => String(s || "").toLowerCase().replace(/[‐-―-]/g, " ").replace(/\s+/g, " ").trim();
function DkSpark({ color }) {   // a small sparkle, drawn here so it needs nothing from the icon set
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6-5.6-1.9 5.6-1.9z" /><path d="M19 3v4M17 5h4" /></svg>;
}
function dkSplitActs(s) {
  const out = [];
  for (const piece of String(s || "").split(", ")) { const p = piece.trim(); if (!p) continue; if (out.length && /^[a-zà-ÿ]/.test(p)) out[out.length - 1] += ", " + p; else out.push(p); }   // "…and, on a clear day, the Himalaya" stays one item
  return out;
}
function dkParseDay(title) {
  const text = String(title || "").trim();
  const parts = text.split(" · ").map((x) => x.trim()).filter(Boolean);
  const d = { raw: text, parts, name: null, from: null, to: null, fromKey: null, toKey: null, hours: null, acts: [], night: null, nightKey: null, hotel: null, actsIndex: -1, nightIndex: -1 };
  let anchor = -1;   // the part that places the day: a leg, or a town on its own
  parts.forEach((part, i) => {
    const nt = part.match(/^Night in (.+?)(?:\s*\((.*)\))?$/i);
    const mv = part.match(/^(.+?)\s*(?:→|->)\s*([^,]+?)(?:,\s*(.+))?$/);
    const hm = /^(?:\d+(?:[.,]\d+)?\s*[¼½¾]?|[¼½¾])\s*h$/.test(part);
    if (nt && d.nightIndex < 0) { const k = dkTownKey(nt[1]); d.nightKey = k ? k.key : null; d.night = k && k.exact ? DK_TOWNS[k.key].n : nt[1]; d.hotel = nt[2] || null; d.nightIndex = i; return; }
    if (mv && anchor < 0) {
      const a = dkTownKey(mv[1]), b = dkTownKey(mv[2]);
      d.fromKey = a ? a.key : null; d.toKey = b ? b.key : null;
      d.to = b && b.exact ? DK_TOWNS[b.key].n : mv[2];
      if (a && (a.exact || !d.name)) { d.from = DK_TOWNS[a.key].n; if (a.prefix) d.name = a.prefix.charAt(0).toUpperCase() + a.prefix.slice(1); }
      else d.from = mv[1];
      anchor = i; if (mv[3]) { d.actsIndex = i; d.acts.push(...dkSplitActs(mv[3])); } return;
    }
    if (hm && d.hours === null && anchor >= 0) { d.hours = part; return; }
    const tk = anchor < 0 ? dkTownKey(part) : null;
    if (tk && tk.exact) { d.from = DK_TOWNS[tk.key].n; d.fromKey = tk.key; anchor = i; return; }
    if (i === 0) { d.name = part; return; }
    if (d.actsIndex < 0) d.actsIndex = i;
    d.acts.push(...dkSplitActs(part));
  });
  return d;
}
function dkAddIdeaToTitle(title, idea) {
  const d = dkParseDay(title); const parts = d.parts.slice();
  if (d.actsIndex >= 0) parts[d.actsIndex] = parts[d.actsIndex] + ", " + idea;
  else if (d.nightIndex >= 0) parts.splice(d.nightIndex, 0, idea);
  else parts.push(idea);
  return parts.join(" · ");
}
/* Local, lesser-known touches — the things that make a day memorable. "arrive": only on the day the road comes in. */
const DK_NICHE = {
  paro: [
    { t: "Walk across Nyamai Zam, the covered bridge below Rinpung Dzong", re: /nyamai/ },
    { t: "Dungtse Lhakhang, the chorten-shaped temple of Thangtong Gyalpo", re: /dungtse/ },
    { t: "Short hike up to Zuri Dzong for the view over the valley", re: /zuri/, e: "moderate" },
    { t: "Dinner and a taste of ara at a farmhouse", re: /\bara\b|farmhouse dinner/ },
  ],
  thimphu: [
    { t: "Evening flag-lowering at Tashichho Dzong", re: /flag lowering/ },
    { t: "Simply Bhutan, a living museum of village life", re: /simply bhutan/ },
    { t: "Watch an archery match at Changlimithang", re: /archery|changlimithang/ },
    { t: "Sunset over the valley from Sangaygang viewpoint", re: /sangaygang/ },
    { t: "Centenary Farmers' Market by the Wang Chhu", re: /farmers.? market|weekend market/ },
  ],
  haa: [{ t: "Home-cooked hoentay, Haa's buckwheat dumplings, at a farmhouse", re: /hoentay/ }],
  punakha: [
    { t: "Rafting on the Mo Chhu", re: /raft/, note: "local tip · on the river" },
    { t: "Picnic where the Pho Chhu and Mo Chhu meet", re: /picnic|confluence/ },
    { t: "Sangchhen Dorji Lhuendrup Nunnery, on the ridge above the valley", re: /nunnery|sangchhen/ },
  ],
  wangdue: [{ t: "Walk through Rinchengang, a village of stone masons", re: /rinchengang/ }],
  gangtey: [{ t: "Watch black-necked cranes in the valley (in winter)", re: /cranes? in the valley|crane watching|watch .*cranes?/ }],
  trongsa: [{ t: "Stop at Chendebji Chorten on the road in", re: /chendebji/, arrive: true }],
  bumthang: [
    { t: "Red Panda beer and Swiss cheese at the Bumthang brewery", re: /red panda|brewery|cheese/ },
    { t: "Buckwheat pancakes (khuli) in a Bumthang farmhouse", re: /khuli|buckwheat pancake/ },
  ],
  yangtse: [{ t: "Watch wooden bowls (dapa) being turned by local craftsmen", re: /dapa|wooden bowl/ }],
};
const DK_EXTRA_IDEAS = [
  { t: "Hot-stone bath at a farmhouse", re: /hot stone/ },
  { t: "Try archery with locals", re: /archery/ },
  { t: "Dress in gho and kira for the day", re: /\bgho\b|\bkira\b/ },
  { t: "Light butter lamps at a temple in the evening", re: /butter lamp/ },
  { t: "Picnic lunch by the river", re: /picnic/ },
  { t: "Join a family for a home-cooked meal", re: /local family|home cooked|meal with|farmhouse dinner|cook a bhutanese/ },
];
function dkDayIdeas(d, dayNo, ctx) {
  const c = ctx || {};
  const planned = [...(c.planned || []), ...d.acts].map(dkNorm);   // the whole trip: nothing planned on another day comes back
  const has = (t) => { const k = dkNorm(String(t).split(/[,:(]/)[0]); return planned.some((a) => a.includes(k) || (a.length >= 8 && k.includes(a))); };
  const hasRe = (re) => planned.some((a) => re.test(a));
  const from = d.fromKey, to = d.toKey, moving = Boolean(from && to && from !== to);
  const dest = d.nightKey || (moving ? to : null) || from || c.prevNight || null;
  const leaving = !d.nightKey && !moving && /\b(fly|flight|depart|departure|farewell|leave|exit)\b/i.test(d.raw);
  const out = [];
  if (moving) {
    try {
      const leg = dkRoute(from, to); let flags = false;
      for (const p of leg.passes || []) {
        const P = DK_PASSES[p]; if (!P) continue;
        if (!planned.some((a) => a.includes(dkNorm(P.n)))) out.push({ t: p === "dochula" ? "Stop at Dochula: 108 chortens and, on a clear day, the Himalaya" : `Cross ${P.n} (${P.alt.toLocaleString("en")} m)`, why: "on the way" });
        if (!flags && !hasRe(/prayer flag/)) { out.push({ t: `Hoist prayer flags at ${P.n}`, why: "memorable" }); flags = true; }
      }
    } catch (e) {}
  }
  // the town's sights not yet in the trip, and its local touches, taken in turn so neither crowds out the other
  const sights = [], niche = [];
  for (const x of (dest && DK_SEE[dest]) || []) {
    if (leaving && x.e === "moderate") continue;
    if (!has(x.t)) sights.push({ t: x.t, why: x.e === "moderate" ? "moderate walk" : "sight" });
  }
  for (const x of (dest && DK_NICHE[dest]) || []) {
    if (x.arrive && !(moving && to === dest)) continue;
    if (leaving && x.e === "moderate") continue;
    if (!hasRe(x.re)) niche.push({ t: x.t, why: x.note || (x.e === "moderate" ? "local tip · moderate walk" : "local tip") });   // its own words decide: a planned dzong visit still leaves room for the evening there
  }
  for (let i = 0; i < Math.max(sights.length, niche.length); i++) { if (sights[i]) out.push(sights[i]); if (niche[i]) out.push(niche[i]); }
  const more = [];
  if (!leaving) {   // two of the "memorable" extras, a different pair each day
    const extras = DK_EXTRA_IDEAS.filter((x) => !hasRe(x.re) && !out.some((o) => x.re.test(dkNorm(o.t))));
    const o = ((Number(dayNo) || 1) - 1) * 2;
    for (let i = 0; i < Math.min(2, extras.length); i++) more.push({ t: extras[(o + i) % extras.length].t, why: "memorable" });
  }
  const seen = new Set(); const uniq = (arr) => arr.filter((x) => { const k = dkNorm(x.t); if (seen.has(k)) return false; seen.add(k); return true; });
  const main = uniq(out), extra = uniq(more), cap = leaving ? 3 : 7;
  return [...main.slice(0, cap - Math.min(1, extra.length)), ...extra].slice(0, cap);   // a full day still keeps one memorable extra
}

function ItineraryBuilder({ trip, canEdit, onChanged, embedded }) {
  const [days, setDays] = useState(trip.itinerary || []);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [mapSel, setMapSel] = useState(null);   // BUILD 52: the day lit up on the relief map
  const [ideasFor, setIdeasFor] = useState(null); // BUILD 54: the day whose Drukpah ideas are open

  useEffect(() => { setDays(trip.itinerary || []); }, [trip.itinerary]);
  const mapPlan = useMemo(() => dkPlanFromItinerary(days), [days]);
  // BUILD 54: each day read into its parts, with where the group woke up and everything planned across the trip
  const parsed = useMemo(() => {
    let prev = null; const all = [];
    const list = days.map((it) => { const d = dkParseDay(it.title); const prevNight = prev; prev = d.nightKey || d.toKey || d.fromKey || prev; all.push(...d.acts); return { it, d, prevNight }; });
    return { list, all };
  }, [days]);

  const nights = trip.start && trip.end
    ? Math.max(1, Math.round((new Date(trip.end) - new Date(trip.start)) / 86400e3) + 1)
    : null;

  const add = async () => {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    const nextDay = (days.length ? Math.max(...days.map((d) => d.day || 0)) : 0) + 1;
    const { error } = await supabase.from("trip_itinerary").insert({
      trip_id: trip.id, day_no: nextDay, title: t,
    });
    setBusy(false);
    if (error) { console.error("itinerary insert failed:", error.message); toast(failText("add that day")); return; }
    setTitle(""); setAdding(false);
    onChanged && onChanged();
  };

  const saveEdit = async (dayNo) => {
    const t = editText.replace(/\s*\n+\s*/g, " ").trim();   // one line: the map reads the day by its " · " parts
    if (!t) return;
    setBusy(true);
    const { error } = await supabase.from("trip_itinerary")
      .update({ title: t }).eq("trip_id", trip.id).eq("day_no", dayNo);
    setBusy(false);
    if (error) { console.error("itinerary update failed:", error.message); toast(failText("save that day")); return; }
    setEditId(null);
    onChanged && onChanged();
  };

  const addIdea = async (it, idea) => {
    const t = dkAddIdeaToTitle(it.title, idea);
    setBusy(true);
    const { error } = await supabase.from("trip_itinerary")
      .update({ title: t }).eq("trip_id", trip.id).eq("day_no", it.day);
    setBusy(false);
    if (error) { console.error("itinerary update failed:", error.message); toast(failText("add that idea")); return; }
    setDays((ds) => ds.map((d) => (d.day === it.day ? { ...d, title: t } : d)));   // shown at once; the trip refresh follows
    onChanged && onChanged();
  };

  const remove = async (dayNo) => {
    setBusy(true);
    const { error } = await supabase.from("trip_itinerary")
      .delete().eq("trip_id", trip.id).eq("day_no", dayNo);
    setBusy(false);
    if (error) { console.error("itinerary delete failed:", error.message); toast(failText("remove that day")); return; }
    onChanged && onChanged();
  };

  return (
    <div>
      {!embedded && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Itinerary</div>
          {nights && <span className="text-[12px]" style={{ color: C.muted }}>{days.length}/{nights} days planned</span>}
        </div>
      )}

      {days.length === 0 && !adding && (
        <div className="rounded-2xl px-5 py-6 text-center mb-3" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-2.5" style={{ background: C.goldSoft }}>
            <CalendarDays size={20} color={C.gold} />
          </div>
          <div className="text-[15px] font-semibold" style={{ color: C.ink }}>No days planned yet</div>
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>
            {canEdit ? "Add the day-by-day plan so your crew knows the route." : "The operator hasn't added the plan yet."}
          </p>
        </div>
      )}

      {mapPlan && (
        <div className="mb-3">
          <DkReliefMap plan={mapPlan} selected={mapSel} onSelect={setMapSel} />
        </div>
      )}

      {days.length > 0 && (
        <div className="space-y-2 mb-3">
          {parsed.list.map(({ it, d, prevNight }) => { const open = ideasFor === it.day; const ideas = open ? dkDayIdeas(d, it.day, { planned: parsed.all, prevNight }) : null;
            const where = d.to ? `${d.from} → ${d.to}` : (d.from || d.night || "");
            return (
            <div key={it.day} className="rounded-xl px-3.5 py-3"
              style={{ background: C.card, border: `1px solid ${mapSel === it.day ? C.pine : C.line}` }}>
              <div className="flex items-start gap-3">
              <button type="button" onClick={() => mapPlan && setMapSel(mapSel === it.day ? null : it.day)} aria-label={`Show day ${it.day} on the map`}
                className="tap w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: mapSel === it.day ? C.maroon : C.pine, border: 0 }}>
                <span className="text-[12px] font-bold" style={{ color: C.goldSoft }}>{it.day}</span>
              </button>
              {editId === it.day ? (
                <div className="flex-1">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={600} rows={4}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(it.day); } }}
                    className="w-full px-3 py-2 rounded-lg text-[14px] leading-snug mb-2"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, resize: "vertical" }} autoFocus />
                  <div className="text-[11.5px] mb-2" style={{ color: C.muted }}>Keep the " · " between the parts: name · From → To · hours · things planned · Night in Town (hotel).</div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditId(null)} className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
                    <button onClick={() => saveEdit(it.day)} disabled={busy}
                      className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold" style={{ background: C.pine, color: "#fff" }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    {(
                      <>
                        <div className="text-[15px] font-semibold leading-tight" style={{ color: C.ink }}>Day {it.day}{d.name ? <span className="font-normal" style={{ color: C.muted }}> · {d.name}</span> : null}</div>
                        {where && <div className="text-[13px] font-medium mt-0.5" style={{ color: C.pine }}>{where}{d.hours ? ` · ${d.hours}` : ""}</div>}
                        {d.acts.length > 0 && (
                          <div className="mt-2">
                            <div className="text-[10.5px] font-semibold tracking-[.08em] uppercase" style={{ color: C.goldText }}>Things planned</div>
                            <ul className="mt-1 space-y-0.5">
                              {d.acts.map((a, i) => <li key={i} className="text-[13.5px] leading-snug flex gap-1.5" style={{ color: C.ink }}><span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: C.gold }} /><span>{a}</span></li>)}
                            </ul>
                          </div>
                        )}
                        {d.night && <div className="text-[12.5px] mt-2" style={{ color: C.muted }}>Night in {d.night}{d.hotel ? ` · ${d.hotel}` : ""}</div>}
                      </>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditId(it.day); setEditText(it.title); }}
                        className="tap w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.bg }} aria-label="Edit day">
                        <Maximize2 size={13} color={C.muted} />
                      </button>
                      <button onClick={() => remove(it.day)} disabled={busy}
                        className="tap w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.maroonSoft }} aria-label="Remove day">
                        <Trash2 size={13} color={C.maroon} />
                      </button>
                    </div>
                  )}
                </>
              )}
              </div>
              {/* BUILD 54: Drukpah's ideas for this stretch — one tap to add any of them to the day */}
              {editId !== it.day && (
                <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
                  <button type="button" onClick={() => setIdeasFor(open ? null : it.day)} aria-expanded={open}
                    className="tap inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: C.goldText, background: "transparent", border: 0, padding: 0 }}>
                    <DkSpark color={C.gold} /> {open ? "Hide Drukpah's ideas" : "Drukpah's ideas for this day"}
                  </button>
                  {open && (ideas.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {ideas.map((x) => (
                        <li key={x.t} className="flex items-start gap-2 text-[13px] leading-snug" style={{ color: C.ink }}>
                          <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: C.gold }} />
                          <span className="flex-1 min-w-0">{x.t}{x.why ? <span style={{ color: C.muted }}> · {x.why}</span> : null}</span>
                          {canEdit && <button type="button" disabled={busy} onClick={() => addIdea(it, x.t)} className="tap shrink-0 h-7 px-2.5 rounded-full text-[12px] font-semibold" style={{ background: C.pineSoft, color: C.pine, border: `1px solid ${C.pine}` }}>+ Add</button>}
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-[12.5px] mt-1.5" style={{ color: C.muted }}>All of Drukpah's picks for this stretch are already in the day.</div>)}
                </div>
              )}
            </div>
          ); })}
        </div>
      )}

      {canEdit && (adding ? (
        <div className="rounded-xl p-3.5 fade" style={{ background: C.card, border: `1px solid ${C.pine}` }}>
          <div className="text-[13px] font-medium mb-2" style={{ color: C.ink }}>
            Day {(days.length ? Math.max(...days.map((d) => d.day || 0)) : 0) + 1}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={600}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="e.g. Paro → Thimphu · 1¼ h · Buddha Dordenma, Tashichho Dzong · Night in Thimphu (3-star)"
            className="w-full h-11 px-3.5 rounded-lg text-[14px] mb-2.5"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} autoFocus />
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setTitle(""); }}
              className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
            <button onClick={add} disabled={busy || !title.trim()}
              className="tap flex-[1.4] h-10 rounded-lg text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
              style={{ background: title.trim() ? C.pine : "#C7CEC7", color: "#fff" }}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} strokeWidth={3} /> Add day</>}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
          style={{ background: C.goldSoft, color: C.goldText }}>
          <Plus size={15} strokeWidth={3} /> Add {days.length ? "another day" : "the first day"}
        </button>
      ))}
    </div>
  );
}

/* ========================================================================== */
/*  BOOKINGS — one page, the whole lifecycle                                  */
/*                                                                            */
/*    Enquiry  →  Confirmed  →  Past                                          */
/*       ↓                                                                    */
/*    Follow up  (and back to Enquiry if it revives)                          */
/*                                                                            */
/*  An operator shouldn't have to remember which tab a booking lives in.      */
/*  It moves through stages; the page follows it.                             */
/* ========================================================================== */
function BookingsTab({ user, enquiries, trips, actions, onOpenProfile, focus, onFocused }) {
  const [stage, setStage] = useState("enquiries");
  const [editing, setEditing] = useState(null);
  const [openTripId, setOpenTripId] = useState(() => (focus && focus.id) || null);
  const [sheetReq, setSheetReq] = useState(() => (focus && focus.sheet ? { sheet: focus.sheet, n: focus.n } : null));
  useEffect(() => {   // BUILD 55: a notification about a trip opens it; the request is used once
    if (!focus || !focus.id) return;
    setEditing(null); setOpenTripId(focus.id); setSheetReq(focus.sheet ? { sheet: focus.sheet, n: focus.n } : null);
    onFocused && onFocused();
  }, [focus && focus.n]);
  const [note, setNote] = useState(null);

  const meId = user.talentId || user.id;
  const flash = (m) => { setNote(m); setTimeout(() => setNote(null), 3200); };
  const today = new Date().toISOString().slice(0, 10);

  const myEnq = (enquiries || []).filter((e) => e && e.operatorId === meId);
  const myTrips = (trips || []).filter((tr) => tr && ((tr.members || []).some((m) => m && m.id === meId) || tr.operatorId === meId));

  const live     = myEnq.filter((e) => ["new", "quoted"].includes(e.status));
  const upcoming = myTrips.filter((tr) => tripStateNow(tr) !== "completed").sort((a, b) => new Date(a.start) - new Date(b.start));
  const past     = myTrips.filter((tr) => tripStateNow(tr) === "completed").sort((a, b) => new Date(b.end) - new Date(a.end));
  const followUp = myEnq.filter((e) => ["lost", "cold"].includes(e.status));

  const dueNow = myEnq.filter((e) =>
    ["new", "quoted", "cold", "lost"].includes(e.status) && (!e.followUpOn || e.followUpOn <= today));

  // open views take over the whole page
  if (editing) {
    return <EnquiryForm user={user} enquiry={editing} actions={actions}
      onBack={() => setEditing(null)}
      onSaved={(m) => { setEditing(null); flash(m); }} />;
  }
  const openTrip = myTrips.find((tr) => tr.id === openTripId);
  if (openTrip) {
    // one TripHub per trip: a notification that switches trips starts the next one fresh (nothing typed carries over)
    return <TripHub key={openTrip.id} user={user} meId={meId} trip={openTrip} actions={actions} openSheet={sheetReq} onBack={() => { setOpenTripId(null); setSheetReq(null); }} />;
  }

  const STAGES = [
    { id: "enquiries", label: "Enquiries", count: live.length,     Icon: Inbox },
    { id: "confirmed", label: "Confirmed", count: upcoming.length, Icon: CalendarCheck },
    { id: "past",      label: "Past",      count: past.length,     Icon: Check },
    { id: "followup",  label: "Follow up", count: followUp.length, Icon: RefreshCw },
  ];

  return (
    <div className="px-5 py-4">
      {/* the pipeline, always visible — you can see where everything stands */}
      <div className="section-head flex items-end justify-between mb-3">
        <div className="section-head-text text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Bookings</div>
        {dueNow.length > 0 && (
          <button onClick={() => setStage(followUp.some((e) => dueNow.includes(e)) && !live.some((e) => dueNow.includes(e)) ? "followup" : "enquiries")}
            className="tap inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-2.5 py-1"
            style={{ background: C.goldSoft, color: C.goldText }}>
            <Clock size={12} /> {dueNow.length} to chase
          </button>
        )}
      </div>

      <div className="flex gap-1.5 mb-4">
        {STAGES.map((st, i) => {
          const on = stage === st.id;
          return (
            <button key={st.id} onClick={() => setStage(st.id)}
              className="tap flex-1 rounded-xl py-2.5 flex flex-col items-center gap-1"
              style={{
                background: on ? C.pine : C.card,
                border: `1px solid ${on ? C.pine : C.line}`,
                opacity: st.id === "past" && !on ? 0.72 : 1,
              }}>
              <st.Icon size={15} color={on ? C.goldSoft : C.muted} strokeWidth={on ? 2.4 : 2} />
              <span className="text-[11px] font-semibold leading-none" style={{ color: on ? "#fff" : C.ink }}>{st.label}</span>
              <span className="text-[13px] font-bold leading-none" style={{ color: on ? C.goldSoft : C.muted }}>{st.count}</span>
            </button>
          );
        })}
      </div>

      {note && <div className="rounded-xl px-3.5 py-2.5 mb-3 text-[13px]" style={{ background: C.pineSoft, color: C.pine }}>{note}</div>}

      {/* ENQUIRIES — work that hasn't been won yet */}
      {stage === "enquiries" && (
        <>
          <button onClick={() => setEditing({})}
            className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-3"
            style={{ background: C.pine, color: "#fff", boxShadow: `0 6px 16px ${C.pine}33` }}>
            <Plus size={17} strokeWidth={3} /> New enquiry
          </button>

          {live.length === 0 ? (
            <Empty Icon={Inbox} title="No open enquiries"
              body="Record every enquiry as it arrives — even the unlikely ones. What you lose is as worth knowing as what you win." />
          ) : (
            <div className="space-y-3">
              {live.map((e) => (
                <EnquiryCard key={e.id} enq={e} actions={actions}
                  onEdit={() => setEditing(e)} onFlash={flash}
                  onOpenTrips={() => setStage("confirmed")} />
              ))}
            </div>
          )}
        </>
      )}

      {/* CONFIRMED — real trips, soonest first */}
      {stage === "confirmed" && (
        upcoming.length === 0 ? (
          <Empty Icon={CalendarCheck} title="No confirmed trips"
            body="When an enquiry is won, tap Make a Trip and it appears here with its crew chat." />
        ) : (
          <div className="space-y-3">
            {upcoming.map((tr) => <TripCard key={tr.id} trip={tr} onOpen={() => setOpenTripId(tr.id)} />)}
          </div>
        )
      )}

      {/* PAST — the record, dimmed */}
      {stage === "past" && (
        past.length === 0 ? (
          <Empty Icon={Check} title="No completed trips yet"
            body="Finished trips move here automatically, so your list stays focused on what's ahead." />
        ) : (
          <>
            <div className="space-y-3" style={{ opacity: 0.74 }}>
              {past.map((tr) => <TripCard key={tr.id} trip={tr} past onOpen={() => setOpenTripId(tr.id)} />)}
            </div>
            <p className="text-[12px] text-center mt-4 leading-snug" style={{ color: C.muted }}>
              Open a past trip to ask its guests for a review — it's never too late, but sooner is better.
            </p>
          </>
        )
      )}

      {/* FOLLOW UP — not dead, just not now */}
      {stage === "followup" && (
        followUp.length === 0 ? (
          <Empty Icon={RefreshCw} title="Nothing to revisit"
            body="Enquiries that don't go ahead are kept here and resurface when it's worth asking again." />
        ) : (
          <>
            <div className="rounded-xl px-3.5 py-3 mb-3 flex gap-2.5" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
              <RefreshCw size={15} color={C.gold} className="shrink-0 mt-0.5" />
              <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
                This year's "too expensive" is often next year's booking. These come back into your
                follow-ups automatically — six months for a failed enquiry, one month for one that went quiet.
              </p>
            </div>
            <div className="space-y-3">
              {followUp.map((e) => (
                <EnquiryCard key={e.id} enq={e} actions={actions}
                  onEdit={() => setEditing(e)} onFlash={flash}
                  onOpenTrips={() => setStage("confirmed")} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}

/* ========================================================================== */
/*  REMOVING A JOB — two steps, never one                                     */
/*  A listing people have applied to is somebody's hope of work. It goes to   */
/*  the bin first, where it is invisible to them but recoverable.             */
/* ========================================================================== */
function RemoveJob({ listing, actions }) {
  const [arm, setArm] = useState(false);
  const [busy, setBusy] = useState(false);
  const count = (listing.applicants || []).length;

  if (!arm) {
    return (
      <button onClick={() => setArm(true)}
        className="tap w-full py-2.5 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
        style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.muted }}>
        <Trash2 size={13} /> Remove this job
      </button>
    );
  }

  return (
    <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.maroonSoft }}>
      <p className="text-[13px] leading-snug mb-2.5" style={{ color: "#6b4a46" }}>
        {count > 0
          ? `${count} ${count === 1 ? "person has" : "people have"} applied. They won't be told, but the job disappears from their board straight away. You can restore it from the Bin.`
          : "It moves to the Bin, where you can restore it or delete it for good."}
      </p>
      <div className="flex gap-2">
        <button onClick={() => setArm(false)} className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold"
          style={{ background: C.card, color: C.muted }}>Keep it</button>
        <button onClick={async () => { setBusy(true); await actions.binListing(listing.id); setBusy(false); }}
          disabled={busy}
          className="tap flex-1 h-9 rounded-lg text-[13px] font-bold inline-flex items-center justify-center gap-1.5"
          style={{ background: C.maroon, color: "#fff" }}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : "Move to Bin"}
        </button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  THE BIN — restore, or erase for good                                      */
/* ========================================================================== */
function JobBin({ listings, jobs, actions }) {
  const [busyId, setBusyId] = useState(null);
  const [erasing, setErasing] = useState(null);

  const daysLeft = (ts) => 30 - Math.floor((Date.now() - ts) / 86400e3);
  const total = (listings || []).length + (jobs || []).length;

  if (total === 0) {
    return (
      <div className="px-5 pt-3 pb-4">
        <Empty Icon={Trash2} title="The bin is empty"
          body="Jobs you remove are kept here for 30 days, so a mistake is never final." />
      </div>
    );
  }

  return (
    <div className="px-5 pt-3 pb-4">
      <div className="rounded-xl px-3.5 py-3 mb-4 flex gap-2.5" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
        <Clock size={15} color={C.gold} className="shrink-0 mt-0.5" />
        <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
          Nothing here is visible to guides or drivers. Items clear themselves after 30 days,
          or you can erase one now.
        </p>
      </div>

      {(listings || []).map((l) => {
        const left = daysLeft(l.deletedAt);
        return (
          <div key={l.id} className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px dashed ${C.line}`, opacity: .9 }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{l.title}</div>
                <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>
                  {roleLabel(l.role)} · {fmtDate(l.start)} – {fmtDate(l.end)}
                </div>
              </div>
              <span className="text-[11px] font-semibold rounded-full px-2 py-1 shrink-0"
                style={{ background: left <= 7 ? C.maroonSoft : C.bg, color: left <= 7 ? C.maroon : C.muted }}>
                {left > 0 ? `${left}d left` : "clearing"}
              </span>
            </div>

            {(l.applicants || []).length > 0 && (
              <div className="text-[12px] mt-2" style={{ color: C.muted }}>
                {(l.applicants || []).length} application{(l.applicants || []).length === 1 ? "" : "s"} kept with it
              </div>
            )}

            {erasing === l.id ? (
              <div className="rounded-xl p-3 mt-3" style={{ background: C.maroonSoft }}>
                <p className="text-[13px] mb-2.5" style={{ color: "#6b4a46" }}>
                  This erases the job and every application to it. It cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setErasing(null)} className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold"
                    style={{ background: C.card, color: C.muted }}>Cancel</button>
                  <button onClick={async () => { setBusyId(l.id); await actions.destroyListing(l.id); setBusyId(null); setErasing(null); }}
                    disabled={busyId === l.id}
                    className="tap flex-1 h-9 rounded-lg text-[13px] font-bold"
                    style={{ background: C.maroon, color: "#fff" }}>
                    {busyId === l.id ? <Loader2 size={13} className="animate-spin" /> : "Erase for good"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button onClick={() => setErasing(l.id)}
                  className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>
                  Delete permanently
                </button>
                <button onClick={async () => { setBusyId(l.id); await actions.binListing(l.id, true); setBusyId(null); }}
                  disabled={busyId === l.id}
                  className="tap flex-[1.3] h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                  style={{ background: C.pine, color: "#fff" }}>
                  {busyId === l.id ? <Loader2 size={14} className="animate-spin" /> : <><RefreshCw size={14} /> Restore</>}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {(jobs || []).map((j) => {
        const left = daysLeft(j.deletedAt);
        const t = talentById(j.toTalentId);
        return (
          <div key={j.id} className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px dashed ${C.line}`, opacity: .9 }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{j.title}</div>
                <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>
                  Direct request to {t?.name || "a member"}
                </div>
              </div>
              <span className="text-[11px] font-semibold rounded-full px-2 py-1 shrink-0"
                style={{ background: C.bg, color: C.muted }}>{left > 0 ? `${left}d left` : "clearing"}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={async () => { setBusyId(j.id); await actions.destroyRequest(j.id); setBusyId(null); }}
                className="tap flex-1 h-10 rounded-xl text-[13px] font-semibold"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>
                Delete permanently
              </button>
              <button onClick={async () => { setBusyId(j.id); await actions.binRequest(j.id, true); setBusyId(null); }}
                className="tap flex-[1.3] h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: C.pine, color: "#fff" }}>
                <RefreshCw size={14} /> Restore
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================================================================== */
/*  TRIP ESSENTIALS — the things that actually go wrong                       */
/*  Not "meeting point". Visa clearance, SDF, permits, flights, hotels.       */
/* ========================================================================== */
const READY_STATES = {
  not_started: { label: "Not started", bg: C.bg,         fg: C.muted,  dot: "#C7CEC7" },
  in_progress: { label: "In progress", bg: C.goldSoft,   fg: C.goldText, dot: C.gold },
  done:        { label: "Done",        bg: C.pineSoft,   fg: C.pine,   dot: "#2E7D4F" },
  not_needed:  { label: "Not needed",  bg: C.bg,         fg: C.muted,  dot: "#C7CEC7" },
};

const CHECKLIST = [
  { key: "visaStatus",    col: "visa_status",    label: "Visa clearance",
    hint: "Apply in the Department of Immigration portal with every guest's passport. Allow 5 working days.",
    link: "https://immi.gov.bt/", linkLabel: "Apply" },
  { key: "sdfStatus",     col: "sdf_status",     label: "SDF paid",
    hint: "Sustainable Development Fee, per guest per night, paid in the same portal with the visa.",
    link: "https://immi.gov.bt/", linkLabel: "Pay" },
  { key: "permitsStatus", col: "permits_status", label: "Route permits",
    hint: "For restricted areas, from Immigration in Thimphu. Allow several days.",
    link: "https://immi.gov.bt/", linkLabel: "Request" },
  { key: "hotelsStatus",  col: "hotels_status",  label: "Hotels booked",
    hint: "Every night of the trip confirmed. Request rooms from hub hotels below.",
    action: "hotels", linkLabel: "Manage" },
];

function TripEssentials({ trip, canEdit, actions, onOpenHotels, show = "all" }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    arrival_flight: trip.arrivalFlight || "",
    arrival_at: trip.arrivalAt ? String(trip.arrivalAt).slice(0, 16) : "",
    departure_flight: trip.departureFlight || "",
    departure_at: trip.departureAt ? String(trip.departureAt).slice(0, 16) : "",
    arrival_point: trip.arrivalPoint || "Paro",
    guest_count: trip.guestCount || "",
    guest_notes: trip.guestNotes || "",
    emergency_name: trip.emergencyName || "",
    emergency_phone: trip.emergencyPhone || "",
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const cycle = async (item) => {
    if (!canEdit) return;
    const order = item.key === "permitsStatus"
      ? ["not_needed", "in_progress", "done"]
      : ["not_started", "in_progress", "done"];
    const cur = trip[item.key] || order[0];
    const next = order[(order.indexOf(cur) + 1) % order.length];
    await actions.saveTripDetails(trip.id, { [item.col]: next });
  };

  const save = async () => {
    setBusy(true);
    await actions.saveTripDetails(trip.id, {
      arrival_flight: f.arrival_flight.trim() || null,
      arrival_at: f.arrival_at ? new Date(f.arrival_at).toISOString() : null,
      departure_flight: f.departure_flight.trim() || null,
      departure_at: f.departure_at ? new Date(f.departure_at).toISOString() : null,
      arrival_point: f.arrival_point || null,
      guest_count: f.guest_count ? Number(f.guest_count) : null,
      guest_notes: f.guest_notes.trim() || null,
      emergency_name: f.emergency_name.trim() || null,
      emergency_phone: f.emergency_phone.trim() || null,
    });
    setBusy(false);
    setEditing(false);
  };

  const daysOut = trip.start ? Math.ceil((new Date(trip.start + "T00:00") - Date.now()) / 86400e3) : null;
  const notReady = CHECKLIST.filter((c) => !["done", "not_needed"].includes(trip[c.key] || "not_started"));
  const urgent = daysOut !== null && daysOut <= 21 && daysOut >= 0 && notReady.length > 0;

  const fmtWhen = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return null; }
  };

  if (editing) {
    return (
      <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.pine}` }}>
        <div className="text-[14px] font-semibold mb-3" style={{ color: C.ink }}>Trip details</div>

        <Label>Arriving at</Label>
        <div className="flex gap-2 mb-3">
          {["Paro", "Phuentsholing", "Gelephu", "S. Jongkhar"].map((p) => (
            <Chip key={p} on={f.arrival_point === p} onClick={() => set("arrival_point", p)}>{p}</Chip>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label>Arrival flight</Label>
            <input value={f.arrival_flight} onChange={(e) => set("arrival_flight", e.target.value.toUpperCase())}
              placeholder="KB 201" className="w-full h-11 px-3 rounded-xl text-[14px]"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          <div>
            <Label>Lands</Label>
            <input type="datetime-local" value={f.arrival_at} onChange={(e) => set("arrival_at", e.target.value)}
              className="w-full h-11 px-2.5 rounded-xl text-[13px]"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label>Departure flight</Label>
            <input value={f.departure_flight} onChange={(e) => set("departure_flight", e.target.value.toUpperCase())}
              placeholder="KB 200" className="w-full h-11 px-3 rounded-xl text-[14px]"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          <div>
            <Label>Departs</Label>
            <input type="datetime-local" value={f.departure_at} onChange={(e) => set("departure_at", e.target.value)}
              className="w-full h-11 px-2.5 rounded-xl text-[13px]"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
        </div>

        <Label>Number of guests</Label>
        <input value={f.guest_count} onChange={(e) => set("guest_count", e.target.value.replace(/[^\d]/g, ""))}
          inputMode="numeric" placeholder="2" className="w-full h-11 px-3 rounded-xl text-[14px] mb-3"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

        <Label>Dietary, medical or altitude notes</Label>
        <textarea value={f.guest_notes} onChange={(e) => set("guest_notes", e.target.value)} rows={2} maxLength={400}
          placeholder="One vegetarian. Mrs Chen has a heart condition — avoid Chele La."
          className="w-full px-3 py-2.5 rounded-xl text-[14px] resize-none mb-3"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label>Emergency contact</Label>
            <input value={f.emergency_name} onChange={(e) => set("emergency_name", e.target.value)}
              placeholder="Name" className="w-full h-11 px-3 rounded-xl text-[14px]"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          <div>
            <Label>Their number</Label>
            <input value={f.emergency_phone} onChange={(e) => set("emergency_phone", e.target.value)} inputMode="tel"
              placeholder="+61…" className="w-full h-11 px-3 rounded-xl text-[14px]"
              style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
          <button onClick={save} disabled={busy} className="tap flex-[1.4] h-11 rounded-xl text-[14px] font-semibold"
            style={{ background: C.pine, color: "#fff" }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : "Save details"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {urgent && show !== "details" && (
        <div className="rounded-xl px-3.5 py-3 mb-3 flex gap-2.5" style={{ background: C.maroonSoft }}>
          <ShieldAlert size={16} color={C.maroon} className="shrink-0 mt-0.5" />
          <p className="text-[13px] leading-snug" style={{ color: C.maroon }}>
            Departs in {daysOut} {daysOut === 1 ? "day" : "days"} and {notReady.length}{" "}
            {notReady.length === 1 ? "item isn't" : "items aren't"} ready: {notReady.map((c) => c.label).join(", ")}.
          </p>
        </div>
      )}

      {/* arrival / departure */}
      {show !== "tasks" && <div className="rounded-2xl overflow-hidden mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Arrival & departure</span>
          {canEdit && (
            <button onClick={() => setEditing(true)} className="tap text-[13px] font-semibold" style={{ color: C.pine }}>
              {trip.arrivalFlight ? "Edit" : "Add"}
            </button>
          )}
        </div>
        <div className="px-4 py-3">
          {trip.arrivalFlight || trip.departureFlight ? (
            <>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pineSoft }}>
                  <ArrowRight size={13} color={C.pine} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium" style={{ color: C.ink }}>
                    {trip.arrivalFlight || "Arrival"} {trip.arrivalPoint ? `· ${trip.arrivalPoint}` : ""}
                  </div>
                  <div className="text-[12px]" style={{ color: C.muted }}>{fmtWhen(trip.arrivalAt) || "Time not set"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}>
                  <ArrowRight size={13} color={C.gold} style={{ transform: "rotate(180deg)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium" style={{ color: C.ink }}>{trip.departureFlight || "Departure"}</div>
                  <div className="text-[12px]" style={{ color: C.muted }}>{fmtWhen(trip.departureAt) || "Time not set"}</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[13px]" style={{ color: C.muted }}>
              {canEdit ? "Add the flights so your crew knows when to be at the airport." : "The operator hasn't added flight details yet."}
            </p>
          )}

          {(trip.guestCount || trip.guestNotes) && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              {trip.guestCount > 0 && (
                <div className="text-[13px] font-medium mb-1" style={{ color: C.ink }}>
                  {trip.guestCount} {trip.guestCount === 1 ? "guest" : "guests"}
                </div>
              )}
              {trip.guestNotes && <p className="text-[13px] leading-snug" style={{ color: C.muted }}>{trip.guestNotes}</p>}
            </div>
          )}

          {trip.emergencyPhone && (
            <a href={`tel:${dialNumber(trip.emergencyPhone)}`}
              className="tap flex items-center gap-2 mt-3 pt-3 text-[13px] font-semibold"
              style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.pine }}>
              <PhoneCall size={13} /> Emergency: {trip.emergencyName || "contact"} · {prettyNumber(trip.emergencyPhone)}
            </a>
          )}
        </div>
      </div>}

      {/* the checklist */}
      {show !== "details" && <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <div>
            <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Operator tasks</span>
            <span className="text-[12px] ml-2" style={{ color: C.muted }}>only you see this</span>
          </div>
          <span className="text-[12px] font-semibold" style={{ color: notReady.length ? C.goldText : C.success }}>{notReady.length ? `${CHECKLIST.length - notReady.length}/${CHECKLIST.length} done` : "All done"}</span>
        </div>
        {CHECKLIST.map((item, i) => {
          const st = READY_STATES[trip[item.key] || "not_started"] || READY_STATES.not_started;
          const done = ["done", "not_needed"].includes(trip[item.key] || "not_started");
          return (
            <div key={item.key} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
              <button onClick={() => cycle(item)} disabled={!canEdit} aria-label={`${item.label}: ${st.label}. Tap to change`}
                className="tap w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: done ? C.pine : C.card, border: `1.5px solid ${done ? C.pine : st.dot}` }}>
                {done && <Check size={13} color="#fff" strokeWidth={3.2} />}
              </button>
              <button onClick={() => cycle(item)} disabled={!canEdit} className="tap flex-1 min-w-0 text-left">
                <div className="text-[14px] font-medium" style={{ color: C.ink, textDecoration: done ? "line-through" : "none", opacity: done ? .7 : 1 }}>{item.label}</div>
                {!done && <div className="text-[12px] leading-snug mt-0.5" style={{ color: C.muted }}>{item.hint}</div>}
              </button>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[11px] font-semibold rounded-full px-2 py-1" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                {!done && item.link && <a href={item.link} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: C.pine }}>{item.linkLabel} <ExternalLink size={11} /></a>}
                {!done && item.action === "hotels" && <button onClick={() => onOpenHotels && onOpenHotels()} className="tap inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: C.pine }}>{item.linkLabel} <ChevronLeft size={12} style={{ transform: "rotate(-90deg)" }} /></button>}
              </div>
            </div>
          );
        })}
        <button onClick={() => canEdit && actions.saveTripDetails(trip.id, { insurance_ok: !trip.insuranceOk })}
          disabled={!canEdit}
          className="tap w-full text-left px-4 py-3 flex items-center gap-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: trip.insuranceOk ? C.pine : C.card, border: `1.5px solid ${trip.insuranceOk ? C.pine : C.line}` }}>
            {trip.insuranceOk && <Check size={12} color="#fff" strokeWidth={3.2} />}
          </span>
          <div className="flex-1">
            <div className="text-[14px] font-medium" style={{ color: C.ink }}>Travel insurance confirmed</div>
            <div className="text-[12px]" style={{ color: C.muted }}>Required for trekking routes.</div>
          </div>
        </button>
      </div>}
    </div>
  );
}

/* ========================================================================== */
/*  QUICK ITINERARY — pick a trip, build its day plan                         */
/*  The same builder that lives inside a trip, reachable in one tap so an      */
/*  operator can plan several trips in a sitting.                              */
/* ========================================================================== */
function TripPlans({ user, trips, actions, focusId }) {
  const meId = user.talentId || user.id;
  const mine = (trips || [])
    .filter((tr) => tr && (tr.operatorId === meId || (tr.members || []).some((m) => m && m.id === meId)))
    .filter((tr) => tripStateNow(tr) !== "completed")
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const [pickedId, setPickedId] = useState(focusId || mine[0]?.id || null);
  useEffect(() => { if (focusId) setPickedId(focusId); }, [focusId]);
  useEffect(() => { if (!pickedId && mine.length) setPickedId(mine[0].id); }, [mine.length]);

  const trip = mine.find((t) => t.id === pickedId);
  const canEdit = user.kind === "operator" || user.kind === "admin";

  if (mine.length === 0) {
    return (
      <Empty Icon={CalendarDays} title="No trips to plan yet"
        body="Confirm an enquiry from Bookings, or build a plan with Drukpah and apply it to a trip." />
    );
  }

  return (
    <div>

      {/* pick the trip */}
      <div className="flex gap-2 overflow-x-auto hidescroll pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
        {mine.map((tr) => {
          const on = tr.id === pickedId;
          const planned = (tr.itinerary || []).length;
          const nights = tr.start && tr.end
            ? Math.max(1, Math.round((new Date(tr.end) - new Date(tr.start)) / 86400e3) + 1) : null;
          return (
            <button key={tr.id} onClick={() => setPickedId(tr.id)}
              className="tap shrink-0 rounded-xl px-3.5 py-2.5 text-left"
              style={{ background: on ? C.pine : C.card, border: `1px solid ${on ? C.pine : C.line}`, minWidth: 160 }}>
              <div className="text-[13px] font-semibold truncate" style={{ color: on ? "#fff" : C.ink, maxWidth: 170 }}>{tr.title}</div>
              <div className="text-[12px] mt-0.5" style={{ color: on ? C.goldSoft : C.muted }}>
                {fmtDate(tr.start)}{nights ? ` · ${planned}/${nights} days` : ""}
              </div>
            </button>
          );
        })}
      </div>

      {trip && (
        <>
          <div className="rounded-xl px-3.5 py-3 mb-4 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}>
              <MapIcon size={17} color={C.goldSoft} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{trip.title}</div>
              <div className="text-[12px]" style={{ color: C.muted }}>
                {fmtDate(trip.start)} – {fmtDate(trip.end)}
                {trip.guestCount ? ` · ${trip.guestCount} guests` : ""}
              </div>
            </div>
          </div>

          <ItineraryBuilder trip={trip} canEdit={canEdit} onChanged={actions.reloadTrips} />

          {(trip.itinerary || []).length > 0 && (
            <button
              onClick={() => {
                const text = `${trip.title}\n${fmtDate(trip.start)} – ${fmtDate(trip.end)}\n\n` +
                  (trip.itinerary || []).map((d) => `Day ${d.day}: ${d.title}`).join("\n");
                if (navigator.share) navigator.share({ title: trip.title, text }).catch(() => {});
                else navigator.clipboard?.writeText(text);
              }}
              className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 mt-3"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
              <Share2 size={14} /> Share this itinerary
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  CREW BRIEF — what a guide or driver needs, in the order they need it      */
/*                                                                            */
/*  An operator thinks in checklists. A guide thinks: where do I need to be,  */
/*  who am I collecting, what must I not get wrong. Same data, different       */
/*  order, and the safety-critical notes come first.                          */
/* ========================================================================== */
const AIRLINES = [
  { name: "Drukair", url: "https://www.drukair.com.bt/", note: "Royal Bhutan Airlines" },
  { name: "Bhutan Airlines", url: "https://www.bhutanairlines.bt/", note: "Tashi Air" },
];

function CrewBrief({ trip, user }) {
  const [open, setOpen] = useState(true);

  const fmtWhen = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return null; }
  };

  const arrival = fmtWhen(trip.arrivalAt);
  const departure = fmtWhen(trip.departureAt);
  const days = trip.start ? Math.ceil((new Date(trip.start + "T00:00") - Date.now()) / 86400e3) : null;
  const myRole = (trip.members || []).find((m) => m && m.id === (user.talentId || user.id))?.roleInTrip;

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: C.card, border: `1px solid ${C.pine}33` }}>
      {/* heading */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: C.pine }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.15)" }}>
          <Compass size={16} color={C.goldSoft} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-white">Your brief</div>
          <div className="text-[12px]" style={{ color: "#ffffffbb" }}>
            {myRole ? `You're the ${String(myRole).replace("_", " ")}` : "Trip details"}
            {days !== null && days >= 0 ? ` · starts in ${days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`}` : ""}
          </div>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="tap w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,.14)" }} aria-label="Toggle brief">
          <ChevronLeft size={15} color="#fff" style={{ transform: open ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform .2s" }} />
        </button>
      </div>

      {open && (
        <div className="px-4 py-3.5">
          {/* 1. where to be, when — the flight comes first */}
          <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>Collection</div>
          {trip.arrivalFlight || arrival ? (
            <div className="rounded-xl px-3.5 py-3 mb-3" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pineSoft }}>
                  <ArrowRight size={14} color={C.pine} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: C.ink }}>
                    {trip.arrivalFlight || "Arrival"}
                    {trip.arrivalPoint ? ` · ${trip.arrivalPoint}` : ""}
                  </div>
                  <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>{arrival || "Time not confirmed yet"}</div>
                  {trip.guestCount > 0 && (
                    <div className="text-[13px] mt-1.5 font-medium" style={{ color: C.pine }}>
                      Collecting {trip.guestCount} {trip.guestCount === 1 ? "guest" : "guests"}
                    </div>
                  )}
                </div>
              </div>
              {departure && (
                <div className="flex items-center gap-2.5 mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.goldSoft }}>
                    <ArrowRight size={14} color={C.gold} style={{ transform: "rotate(180deg)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium" style={{ color: C.ink }}>
                      Drop-off · {trip.departureFlight || "departure"}
                    </div>
                    <div className="text-[13px]" style={{ color: C.muted }}>{departure}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl px-3.5 py-3 mb-3 text-[13px]" style={{ background: C.bg, border: `1px dashed ${C.line}`, color: C.muted }}>
              Flight details not added yet. Ask the operator in the trip chat so you know when to be at the airport.
            </div>
          )}

          {/* 2. check the flight (seats, delays) */}
          <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>Check the flight</div>
          <div className="flex gap-2 mb-3">
            {AIRLINES.map((a) => (
              <a key={a.name} href={a.url} target="_blank" rel="noreferrer"
                className="tap flex-1 rounded-xl px-3 py-2.5 text-left"
                style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                <div className="text-[13px] font-semibold" style={{ color: C.ink }}>{a.name}</div>
                <div className="text-[11px] inline-flex items-center gap-1 mt-0.5" style={{ color: C.pine }}>
                  Open <ExternalLink size={9} />
                </div>
              </a>
            ))}
          </div>
          <p className="text-[12px] leading-snug mb-3" style={{ color: C.muted }}>
            Paro arrivals shift with weather and the valley closes early. Check the morning of the flight —
            a delayed landing changes everyone's day.
          </p>

          {/* 3. the route */}
          {(trip.itinerary || []).length > 0 && (
            <>
              <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>
                The route · {(trip.itinerary || []).length} days
              </div>
              <div className="rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${C.line}` }}>
                {(trip.itinerary || []).map((it, i) => (
                  <div key={it.day} className="px-3.5 py-2.5 flex items-start gap-2.5"
                    style={{ background: C.bg, borderTop: i ? `1px solid ${C.line}` : "none" }}>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: C.pine }}>
                      <span className="text-[11px] font-bold" style={{ color: C.goldSoft }}>{it.day}</span>
                    </div>
                    <span className="text-[13px] leading-snug" style={{ color: C.ink }}>{it.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 4. the guests: what must not be got wrong, and who they are */}
          {trip.guestNotes && (
            <div className="rounded-xl px-3.5 py-3 mb-3 flex gap-2.5" style={{ background: C.maroonSoft }}>
              <ShieldAlert size={16} color={C.maroon} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[13px] font-bold mb-0.5" style={{ color: C.maroon }}>Important — read before the trip</div>
                <p className="text-[13px] leading-snug" style={{ color: C.maroon }}>{trip.guestNotes}</p>
              </div>
            </div>
          )}

          {/* who is in the group: names, nationality, dietary — never documents */}
          {(trip.guests || []).length > 0 && (
            <>
              <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>Who's travelling</div>
              <div className="rounded-xl px-3.5 py-3 mb-3" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                {trip.guests.map((g, k) => (
                  <div key={g.id} className="text-[13px] leading-snug" style={{ color: C.muted, marginTop: k ? 4 : 0 }}>
                    <span className="font-medium" style={{ color: C.ink }}>{g.name}</span>{g.nationality ? ` · ${g.nationality}` : ""}{g.dietary ? ` · ${g.dietary}` : ""}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 5. who to call */}
          {trip.emergencyPhone && (
            <a href={`tel:${dialNumber(trip.emergencyPhone)}`}
              className="tap w-full rounded-xl px-3.5 py-3 flex items-center gap-3"
              style={{ background: C.pineSoft }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}>
                <PhoneCall size={15} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: C.pine }}>
                  Emergency contact{trip.emergencyName ? ` · ${trip.emergencyName}` : ""}
                </div>
                <div className="text-[12px]" style={{ color: C.pine, opacity: .8 }}>{prettyNumber(trip.emergencyPhone)}</div>
              </div>
            </a>
          )}

          <button
            onClick={() => {
              const lines = [
                trip.title,
                `${fmtDate(trip.start)} – ${fmtDate(trip.end)}`,
                trip.arrivalFlight ? `Arrival: ${trip.arrivalFlight}${arrival ? ` · ${arrival}` : ""}` : null,
                trip.guestCount ? `Guests: ${trip.guestCount}` : null,
                trip.guestNotes ? `Important: ${trip.guestNotes}` : null,
                (trip.itinerary || []).length ? "\nPlan:" : null,
                ...(trip.itinerary || []).map((d) => `Day ${d.day}: ${d.title}`),
              ].filter(Boolean).join("\n");
              if (navigator.share) navigator.share({ title: trip.title, text: lines }).catch(() => {});
              else navigator.clipboard?.writeText(lines);
            }}
            className="tap w-full h-10 rounded-xl text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 mt-3"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
            <Download size={13} /> Save this brief to my phone
          </button>
        </div>
      )}
      <CrewHotelsBrief trip={trip} />
    </div>
  );
}

/* ========================================================================== */
/*  SIDE RAIL — the desktop navigation                                        */
/*  Same tabs, same badges, but visible all at once with room for the role    */
/*  and a quick view of what needs attention. Hidden below 900px.             */
/* ========================================================================== */
function SideRail({ user, nav, tab, setTab, badges, alerts, onOpenAlerts, onLogout }) {
  const roleName = roleLabel(user.kind === "admin" ? "operator" : user.kind);
  return (
    <aside className="side-rail">
      {/* who you are */}
      <div className="flex items-center gap-2.5 px-2 mb-5">
        <BrandMark size={40} />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold leading-tight" style={{ color: C.ink }}>Bhutan Tourism Hub</div>
          <div className="text-[11px] font-semibold tracking-[.1em] uppercase mt-0.5" style={{ color: C.goldText }}>
            {user.kind === "admin" ? "Admin" : roleName}
          </div>
        </div>
      </div>

      {/* the tabs */}
      <nav className="flex flex-col gap-1">
        {nav.map((n) => {
          const on = tab === n.id;
          const badge = badges[n.id] || 0;
          return (
            <button key={n.id} data-tab={n.id} onClick={() => setTab(n.id)}
              className="tap w-full flex items-center gap-3 px-3 h-11 rounded-xl text-left"
              style={{ background: on ? C.pine : "transparent" }}>
              <n.Icon size={18} color={on ? C.goldSoft : C.muted} strokeWidth={on ? 2.3 : 2} />
              <span className="flex-1 text-[14px] font-semibold" style={{ color: on ? "#fff" : C.ink }}>{n.label}</span>
              {badge > 0 && (
                <span className="min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: on ? C.gold : C.maroon }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <button onClick={onOpenAlerts}
          className="tap w-full flex items-center gap-3 px-3 h-11 rounded-xl text-left mb-1"
          style={{ background: alerts > 0 ? C.goldSoft : "transparent" }}>
          <Bell size={18} color={alerts > 0 ? C.gold : C.muted} />
          <span className="flex-1 text-[14px] font-semibold" style={{ color: alerts > 0 ? C.goldText : C.ink }}>
            Notifications
          </span>
          {alerts > 0 && (
            <span className="min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: C.maroon }}>{alerts > 9 ? "9+" : alerts}</span>
          )}
        </button>

        <button onClick={onLogout}
          className="tap w-full flex items-center gap-3 px-3 h-11 rounded-xl text-left"
          style={{ background: "transparent" }}>
          <LogOut size={17} color={C.muted} />
          <span className="text-[14px] font-medium" style={{ color: C.muted }}>Sign out</span>
        </button>

        <div className="px-3 pt-3 mt-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <div className="text-[10px]" style={{ color: C.line }}>{BUILD}</div>
        </div>
      </div>
    </aside>
  );
}


/* The Itinerary tab: the Drukpah engine, beside the per-trip editor */
function QuickItinerary({ user, trips, actions }) {
  const [mode, setMode] = useState("engine");
  const [focusId, setFocusId] = useState(null);
  const [presetTemplateId, setPresetTemplateId] = useState(null);
  return (
    <div className="px-5 py-4">
      <SectionLabel>Itinerary</SectionLabel>
      <div className="mb-4">
        <Segmented value={mode} onChange={setMode} options={[["engine", "Drukpah"], ["templates", "Templates"], ["trips", "Trip plans"]]} />
      </div>
      {mode === "engine"
        ? <DrukpahEngine user={user} trips={trips} actions={actions} presetTemplateId={presetTemplateId}
            onApplied={(id) => { setFocusId(id); setMode("trips"); }} />
        : mode === "templates"
          ? <TemplatesTab user={user} onDraft={(id) => { setPresetTemplateId(id); setMode("engine"); }} />
          : <TripPlans user={user} trips={trips} actions={actions} focusId={focusId} />}
    </div>
  );
}

/* ============================================================================
   DRUKPAH — itinerary engine for Bhutan
   A road graph (towns, passes, roads with hours) plus a planner that builds a
   day-by-day route shaped by nights, ages, pace, interests and hotel type.
   Drive times are conservative operator figures; they vary with weather and
   roadworks, and the plan says so.
   ========================================================================== */
const DK_TOWNS = {
  paro:      { n: "Paro",             lat: 27.43, lng: 89.42, alt: 2200, stay: true,  hotels: ["home", "3", "4", "lux"] },
  thimphu:   { n: "Thimphu",          lat: 27.47, lng: 89.64, alt: 2320, stay: true,  hotels: ["3", "4", "lux"] },
  haa:       { n: "Haa",              lat: 27.39, lng: 89.28, alt: 2700, stay: true,  hotels: ["home", "3"] },
  chuzom:    { n: "Chuzom",           lat: 27.30, lng: 89.53, alt: 1990, stay: false },
  punakha:   { n: "Punakha",          lat: 27.59, lng: 89.87, alt: 1250, stay: true,  hotels: ["home", "3", "4", "lux"] },
  wangdue:   { n: "Wangdue",          lat: 27.49, lng: 89.90, alt: 1350, stay: true,  hotels: ["3", "4"] },
  gangtey:   { n: "Gangtey",          lat: 27.46, lng: 90.18, alt: 2900, stay: true,  hotels: ["home", "3", "4", "lux"] },
  trongsa:   { n: "Trongsa",          lat: 27.50, lng: 90.51, alt: 2200, stay: true,  hotels: ["home", "3"] },
  bumthang:  { n: "Bumthang",         lat: 27.55, lng: 90.75, alt: 2600, stay: true,  hotels: ["home", "3", "4", "lux"] },
  mongar:    { n: "Mongar",           lat: 27.27, lng: 91.24, alt: 1600, stay: true,  hotels: ["home", "3"] },
  trashigang:{ n: "Trashigang",       lat: 27.33, lng: 91.55, alt: 1150, stay: true,  hotels: ["home", "3"] },
  yangtse:   { n: "Trashiyangtse",    lat: 27.61, lng: 91.50, alt: 1750, stay: true,  hotels: ["home", "3"] },
  lhuentse:  { n: "Lhuentse",         lat: 27.67, lng: 91.18, alt: 1400, stay: true,  hotels: ["home", "3"] },
  sjongkhar: { n: "Samdrup Jongkhar", lat: 26.80, lng: 91.50, alt: 250,  stay: true,  hotels: ["3"] },
  zhemgang:  { n: "Zhemgang",         lat: 27.22, lng: 90.66, alt: 1900, stay: true,  hotels: ["home", "3"] },
  gelephu:   { n: "Gelephu",          lat: 26.87, lng: 90.49, alt: 250,  stay: true,  hotels: ["3", "4"] },
  phuentsholing: { n: "Phuentsholing", lat: 26.86, lng: 89.39, alt: 300, stay: true,  hotels: ["3", "4"] },
};

/* The high peaks that frame the relief — shown on the map with their heights. */
const DK_PEAKS = [
  { n: "Jomolhari", alt: 7326, lat: 27.82, lng: 89.27 },
  { n: "Gangkhar Puensum", alt: 7570, lat: 28.03, lng: 90.46 },
];
const DK_PASSES = {
  chele:     { n: "Chele La",      alt: 3988, lat: 27.37, lng: 89.35 },
  dochula:   { n: "Dochula",       alt: 3100, lat: 27.49, lng: 89.75 },
  lawala:    { n: "Lawa La",       alt: 3360, lat: 27.42, lng: 90.12 },
  pelela:    { n: "Pele La",       alt: 3420, lat: 27.52, lng: 90.22 },
  yotongla:  { n: "Yotong La",     alt: 3425, lat: 27.56, lng: 90.62 },
  thrumshing:{ n: "Thrumshing La", alt: 3780, lat: 27.26, lng: 91.08 },
  korila:    { n: "Kori La",       alt: 2400, lat: 27.29, lng: 91.36 },
};

// km and typical hours, conservative; pass = the high point crossed
const DK_ROADS = [
  ["paro", "chuzom", 24, 0.6], ["chuzom", "thimphu", 31, 0.65],
  ["paro", "haa", 65, 2.0, "chele"], ["haa", "chuzom", 79, 2.75],
  ["chuzom", "phuentsholing", 141, 4.5],
  ["thimphu", "punakha", 75, 2.5, "dochula"], ["thimphu", "wangdue", 70, 2.5, "dochula"],
  ["punakha", "wangdue", 13, 0.5],
  ["wangdue", "gangtey", 65, 2.5, "lawala"],
  ["gangtey", "trongsa", 120, 4.5, "pelela"], ["wangdue", "trongsa", 129, 4.5, "pelela"],
  ["trongsa", "bumthang", 68, 2.5, "yotongla"],
  ["bumthang", "mongar", 198, 7.5, "thrumshing"],
  ["mongar", "trashigang", 91, 3.5, "korila"], ["mongar", "lhuentse", 76, 3.0],
  ["trashigang", "yangtse", 55, 2.0], ["trashigang", "sjongkhar", 180, 7.0],
  ["trongsa", "zhemgang", 110, 4.5], ["zhemgang", "gelephu", 148, 4.0],
];

// what to see — effort: easy | moderate | hard ; kind: culture | nature
const DK_SEE = {
  paro: [
    { t: "Rinpung Dzong", k: "culture", e: "easy" },
    { t: "Kyichu Lhakhang, one of Bhutan's oldest temples", k: "culture", e: "easy" },
    { t: "National Museum at Ta Dzong", k: "culture", e: "easy" },
    { t: "Farmhouse visit and hot-stone bath", k: "culture", e: "easy" },
    { t: "Drukgyel Dzong", k: "culture", e: "easy" },
  ],
  thimphu: [
    { t: "Tashichho Dzong", k: "culture", e: "easy" },
    { t: "Buddha Dordenma", k: "culture", e: "easy" },
    { t: "National Memorial Chorten", k: "culture", e: "easy" },
    { t: "Folk Heritage Museum", k: "culture", e: "easy" },
    { t: "Motithang Takin Preserve", k: "nature", e: "easy" },
    { t: "Walk to Cheri Monastery", k: "nature", e: "moderate" },
  ],
  haa: [
    { t: "Lhakhang Karpo and Lhakhang Nagpo", k: "culture", e: "easy" },
    { t: "Haa valley village walk", k: "nature", e: "easy" },
  ],
  punakha: [
    { t: "Punakha Dzong", k: "culture", e: "easy" },
    { t: "Walk through rice fields to Chimi Lhakhang", k: "culture", e: "easy" },
    { t: "Punakha suspension bridge", k: "nature", e: "easy" },
    { t: "Hike to Khamsum Yulley Namgyal Chorten", k: "nature", e: "moderate" },
  ],
  wangdue: [{ t: "Wangdue Phodrang Dzong", k: "culture", e: "easy" }],
  gangtey: [
    { t: "Gangtey Monastery", k: "culture", e: "easy" },
    { t: "Gangtey Nature Trail across the valley", k: "nature", e: "moderate" },
    { t: "Black-necked Crane Information Centre", k: "nature", e: "easy" },
  ],
  trongsa: [
    { t: "Trongsa Dzong", k: "culture", e: "easy" },
    { t: "Tower of Trongsa museum", k: "culture", e: "easy" },
  ],
  bumthang: [
    { t: "Jambay Lhakhang", k: "culture", e: "easy" },
    { t: "Kurjey Lhakhang", k: "culture", e: "easy" },
    { t: "Jakar Dzong", k: "culture", e: "easy" },
    { t: "Tamshing Lhakhang", k: "culture", e: "easy" },
    { t: "Mebar Tsho, the Burning Lake", k: "nature", e: "easy" },
    { t: "Ura village", k: "culture", e: "easy" },
  ],
  mongar: [
    { t: "Mongar Dzong", k: "culture", e: "easy" },
    { t: "Drametse Lhakhang", k: "culture", e: "easy" },
  ],
  trashigang: [
    { t: "Trashigang Dzong", k: "culture", e: "easy" },
    { t: "Gom Kora temple", k: "culture", e: "easy" },
    { t: "Rangjung Woesel Choeling Monastery", k: "culture", e: "easy" },
  ],
  yangtse: [
    { t: "Chorten Kora", k: "culture", e: "easy" },
    { t: "Bumdeling Wildlife Sanctuary", k: "nature", e: "moderate" },
  ],
  lhuentse: [
    { t: "Lhuentse Dzong", k: "culture", e: "easy" },
    { t: "Khoma village weavers", k: "culture", e: "easy" },
  ],
  sjongkhar: [{ t: "Zangdopelri temple", k: "culture", e: "easy" }],
  phuentsholing: [
    { t: "Zangdopelri temple", k: "culture", e: "easy" },
    { t: "Crocodile Breeding Centre", k: "nature", e: "easy" },
  ],
  zhemgang: [{ t: "Zhemgang Dzong", k: "culture", e: "easy" }],
  gelephu: [{ t: "Gelephu hot springs", k: "nature", e: "easy" }],
};

const DK_HOTEL = { home: "Homestay / farmstay", "3": "3-star", "4": "4-star", lux: "Luxury lodge" };
const DK_TIERS = ["home", "3", "4", "lux"];

// classic routes, as overnight towns in order — the planner adapts them
const DK_ROUTES_PARO = {
  // every plan of 4+ nights ends with two Paro nights: a full last day for the Tiger's Nest
  3:  ["thimphu", "punakha", "paro"],
  4:  ["thimphu", "punakha", "paro", "paro"],
  5:  ["thimphu", "thimphu", "punakha", "paro", "paro"],
  6:  ["thimphu", "thimphu", "punakha", "gangtey", "paro", "paro"],
  7:  ["thimphu", "thimphu", "punakha", "gangtey", "paro", "paro", "paro"],
  8:  ["thimphu", "thimphu", "punakha", "gangtey", "paro", "haa", "paro", "paro"],
  9:  ["thimphu", "thimphu", "punakha", "punakha", "gangtey", "paro", "haa", "paro", "paro"],
  10: ["thimphu", "thimphu", "punakha", "gangtey", "trongsa", "bumthang", "bumthang", "punakha", "paro", "paro"],
  11: ["thimphu", "thimphu", "punakha", "gangtey", "trongsa", "bumthang", "bumthang", "punakha", "paro", "paro", "paro"],
  12: ["thimphu", "thimphu", "punakha", "gangtey", "trongsa", "bumthang", "bumthang", "punakha", "paro", "haa", "paro", "paro"],
  13: ["thimphu", "thimphu", "punakha", "gangtey", "gangtey", "trongsa", "bumthang", "bumthang", "punakha", "paro", "haa", "paro", "paro"],
  14: ["thimphu", "thimphu", "punakha", "gangtey", "gangtey", "trongsa", "bumthang", "bumthang", "bumthang", "punakha", "paro", "haa", "paro", "paro"],
};
const DK_ROUTES_EAST = {
  10: ["thimphu", "punakha", "gangtey", "trongsa", "bumthang", "bumthang", "mongar", "trashigang", "trashigang", "sjongkhar"],
  11: ["thimphu", "thimphu", "punakha", "gangtey", "trongsa", "bumthang", "bumthang", "mongar", "trashigang", "trashigang", "sjongkhar"],
  12: ["thimphu", "thimphu", "punakha", "gangtey", "trongsa", "bumthang", "bumthang", "mongar", "trashigang", "yangtse", "trashigang", "sjongkhar"],
  13: ["thimphu", "thimphu", "punakha", "gangtey", "trongsa", "bumthang", "bumthang", "bumthang", "mongar", "trashigang", "yangtse", "trashigang", "sjongkhar"],
  14: ["thimphu", "thimphu", "punakha", "punakha", "gangtey", "trongsa", "bumthang", "bumthang", "bumthang", "mongar", "trashigang", "yangtse", "trashigang", "sjongkhar"],
};

// ── the road graph ──────────────────────────────────────────────────────────
const DK_ADJ = {};
for (const [a, b, km, h, pass] of DK_ROADS) {
  (DK_ADJ[a] = DK_ADJ[a] || []).push({ to: b, km, h, pass });
  (DK_ADJ[b] = DK_ADJ[b] || []).push({ to: a, km, h, pass });
}

/** fastest road between two towns: { h, km, nodes: [...], passes: [...] } */
function dkRoute(from, to) {
  if (from === to) return { h: 0, km: 0, nodes: [from], passes: [], pts: [DK_TOWNS[from]] };
  const dist = { [from]: 0 }, prev = {}, edgeIn = {}, done = new Set();
  while (true) {
    let u = null, best = Infinity;
    for (const k in dist) if (!done.has(k) && dist[k] < best) { best = dist[k]; u = k; }
    if (u === null) return null;
    if (u === to) break;
    done.add(u);
    for (const e of DK_ADJ[u] || []) {
      const nd = dist[u] + e.h;
      if (dist[e.to] === undefined || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; edgeIn[e.to] = e; }
    }
  }
  const nodes = [to]; let km = 0; const passes = [];
  for (let n = to; n !== from; n = prev[n]) {
    nodes.unshift(prev[n]); km += edgeIn[n].km;
    if (edgeIn[n].pass) passes.unshift(edgeIn[n].pass);
  }
  const pts = [];
  for (let k = 0; k < nodes.length; k++) {
    if (k > 0) {
      const e = (DK_ADJ[nodes[k - 1]] || []).find((x) => x.to === nodes[k]);
      if (e && e.pass) pts.push(DK_PASSES[e.pass]);
    }
    pts.push(DK_TOWNS[nodes[k]]);
  }
  return { h: Math.round(dist[to] * 100) / 100, km, nodes, passes, pts };
}

function dkFmtHours(h) {
  if (h <= 0) return "";
  const whole = Math.floor(h), q = Math.round((h - whole) * 4);
  const frac = ["", "¼", "½", "¾"][q % 4] || "";
  const w = q === 4 ? whole + 1 : whole;
  return w === 0 ? `${frac} h` : `${w}${q === 4 ? "" : frac} h`;
}

/**
 * Build a plan.
 * opts: { nights, exit: "paro"|"phuentsholing"|"sjongkhar", adults, seniors, kids, under6,
 *         pace: "relaxed"|"standard"|"active", culture, nature, hotel: "home"|"3"|"4"|"lux", month: 0..12 }
 */
function dkPlan(opts) {
  const o = Object.assign({ nights: 7, exit: "paro", adults: 2, seniors: 0, kids: 0, under6: 0,
                            pace: "standard", culture: true, nature: true, hotel: "3", month: 0 }, opts || {});
  const notes = [];
  const N = Math.max(3, Math.min(14, Math.round(o.nights)));
  const gentle = o.seniors > 0 || o.under6 > 0;
  let cap = { relaxed: 4.5, standard: 6.5, active: 8 }[o.pace] || 6.5;
  if (gentle) cap = Math.min(cap, 5);

  // 1. choose the route
  let exit = o.exit;
  let seq;
  if (exit === "sjongkhar") {
    if (N < 10) {
      notes.push({ level: "info", text: "Crossing the whole country to Samdrup Jongkhar needs at least 10 nights, so this is a western loop ending in Paro." });
      exit = "paro"; seq = DK_ROUTES_PARO[N].slice();
    } else seq = DK_ROUTES_EAST[N].slice();
  } else seq = DK_ROUTES_PARO[N].slice();
  if (N >= 10 && exit !== "sjongkhar" && gentle) {
    notes.push({ level: "info", text: "Central Bhutan involves several long drives. With seniors or young children, consider a domestic flight between Bumthang and Paro when one is scheduled." });
  }

  // 2. split any day longer than this group should drive, keeping the total nights
  const START = "paro";
  const reduceOrder = ["thimphu", "punakha", "gangtey", "bumthang", "trashigang", "haa", "paro"];
  const trailingParo = () => { let c = 0; for (let k = seq.length - 1; k >= 0 && seq[k] === "paro"; k--) c++; return c; };
  for (let guard = 0; guard < 20; guard++) {
    let changed = false;
    for (let i = 0; i < seq.length; i++) {
      const from = i === 0 ? START : seq[i - 1], to = seq[i];
      const r = dkRoute(from, to);
      if (!r || r.h <= cap) continue;
      // best overnight along the way: a town with hotels that balances the two halves
      let bestNode = null, bestScore = Infinity;
      for (const n of r.nodes.slice(1, -1)) {
        if (!DK_TOWNS[n] || !DK_TOWNS[n].stay) continue;
        const a = dkRoute(from, n).h, b = dkRoute(n, to).h;
        const score = Math.max(a, b);
        if (score < bestScore && score <= cap + 0.01) { bestScore = score; bestNode = n; }
      }
      if (!bestNode) continue;                           // no town between — leave it, warn later
      // free a night somewhere so the trip stays the same length
      let freed = false;
      for (const town of reduceOrder) {
        const idxs = seq.map((t, k) => (t === town ? k : -1)).filter((k) => k >= 0);
        if (idxs.length < 2) continue;
        if (town === "paro" && exit === "paro" && trailingParo() <= 2) continue;   // keep the Tiger's Nest day
        const k = idxs[idxs.length - 1] === seq.length - 1 && town === "paro" ? idxs[0] : idxs[idxs.length - 1];
        // never strand the final Paro night
        if (k === seq.length - 1) continue;
        seq.splice(k, 1); freed = true; break;
      }
      if (!freed) continue;
      const at = seq.indexOf(to, Math.max(0, i - 1));
      seq.splice(at < 0 ? i : at, 0, bestNode);
      changed = true; break;
    }
    if (!changed) break;
  }

  // 3. day by day
  const used = new Set();
  const wantKind = (s) => (s.k === "culture" ? o.culture : o.nature) || (!o.culture && !o.nature);
  const okEffort = (s) => !(gentle && s.e === "hard") && !(o.under6 > 0 && s.e === "moderate" && s.k === "nature");
  const pick = (town, n) => {
    const out = [];
    for (const s of DK_SEE[town] || []) {
      if (out.length >= n) break;
      if (used.has(s.t) || !wantKind(s) || !okEffort(s)) continue;
      used.add(s.t); out.push(s.t);
    }
    return out;
  };

  const lastParoFullDay = (() => {
    // the last day that starts and ends in Paro — best for the Tiger's Nest, once acclimatised
    for (let i = seq.length - 1; i >= 1; i--) if (seq[i] === "paro" && seq[i - 1] === "paro") return i;
    for (let i = seq.length - 1; i >= 1; i--) if (seq[i] === "paro" && seq[i - 1] === "haa") return -1;
    return -1;
  })();

  const days = [];
  let totalH = 0, longest = { h: 0, day: 0 };
  for (let i = 0; i < seq.length; i++) {
    const from = i === 0 ? START : seq[i - 1], to = seq[i];
    const r = dkRoute(from, to) || { h: 0, km: 0, nodes: [from, to], passes: [], pts: [DK_TOWNS[from], DK_TOWNS[to]] };
    const moving = from !== to;
    const acts = [];
    if (i === 0) acts.push("Land at Paro — your guide meets you at the airport");
    if (moving) {
      for (const p of r.passes) {
        const P = DK_PASSES[p];
        if (p === "dochula") acts.push("Stop at Dochula: 108 chortens and, on a clear day, the Himalaya");
        else acts.push(`Cross ${P.n} (${P.alt.toLocaleString("en")} m)`);
      }
      let room = r.h <= 3 ? 2 : r.h <= 5 ? 1 : 0;
      if (i === 0) {                                      // arrival day: a flight already behind them
        room = o.pace === "active" && !gentle ? 2 : 1;
        if (o.pace !== "relaxed" && !gentle) acts.push(...pick("paro", 1));
      }
      acts.push(...pick(to, room));
    } else if (i === lastParoFullDay) {
      if (o.under6 > 0) acts.push("Tiger's Nest: view it from the cafeteria viewpoint — the full hike is too long for small children");
      else if (o.seniors > 0) acts.push("Tiger's Nest: ride a horse to the cafeteria viewpoint, then walk on if comfortable");
      else acts.push("Hike to Taktsang, the Tiger's Nest — about 4–5 hours there and back");
      used.add("taktsang");
      acts.push(...pick("paro", 1));
    } else {
      acts.push(...pick(to, o.pace === "relaxed" || gentle ? 2 : 3));
    }
    const onlyPasses = moving && acts.every((a) => a.startsWith("Cross ") || a.startsWith("Stop at Dochula"));
    if (acts.length === (i === 0 ? 1 : 0) || onlyPasses) {
      if (moving && r.h >= 5) acts.push("Arrive and rest after the long drive");
      else if (!moving) acts.push(o.pace === "relaxed" ? "A slower day to rest and wander" : "Free time to explore");
    }

    const town = DK_TOWNS[to];
    let tier = o.hotel;
    if (!town.hotels.includes(tier)) {
      const below = DK_TIERS.slice(0, DK_TIERS.indexOf(tier)).reverse();
      tier = below.find((t) => town.hotels.includes(t)) || town.hotels[town.hotels.length - 1];
    }
    if (moving) { totalH += r.h; if (r.h > longest.h) longest = { h: r.h, day: i + 1 }; }
    days.push({
      day: i + 1, from, to, moving, h: moving ? r.h : 0, km: moving ? r.km : 0,
      passes: moving ? r.passes : [], nodes: r.nodes, pts: moving ? r.pts : [DK_TOWNS[to]], acts,
      night: to, hotel: tier, hotelWanted: o.hotel, hotelFallback: tier !== o.hotel,
    });
  }

  // departure day
  const last = seq[seq.length - 1];
  const dep = { day: seq.length + 1, from: last, moving: false, h: 0, km: 0, passes: [], nodes: [last], pts: [DK_TOWNS[last]], acts: [], night: null };
  if (exit === "paro") {
    const r = dkRoute(last, "paro");
    if (last !== "paro") { dep.moving = true; dep.to = "paro"; dep.h = r.h; dep.km = r.km; dep.nodes = r.nodes; dep.passes = r.passes; dep.pts = r.pts; totalH += r.h; }
    dep.acts.push("Fly out of Paro");
  } else if (exit === "phuentsholing") {
    const r = dkRoute(last, "phuentsholing");
    dep.moving = true; dep.to = "phuentsholing"; dep.h = r.h; dep.km = r.km; dep.nodes = r.nodes; dep.passes = r.passes; dep.pts = r.pts;
    totalH += r.h; if (r.h > longest.h) longest = { h: r.h, day: dep.day };
    dep.acts.push("Drive to Phuentsholing and cross into India");
  } else {
    dep.acts.push("Cross into India — about 3 hours to Guwahati");
  }
  days.push(dep);

  // 4. what the operator should know
  for (const d of days) {
    if (d.moving && d.h > cap + 0.01) {
      const P = d.passes.length ? ` over ${DK_PASSES[d.passes[d.passes.length - 1]].n}` : "";
      notes.push({ level: gentle ? "warn" : "info",
        text: `Day ${d.day} is a long one: about ${dkFmtHours(d.h)}${P}. There's no town between to stop overnight${gentle ? " — tiring for seniors and small children; plan rest stops" : ""}.` });
    }
  }
  const highest = days.flatMap((d) => d.passes).map((p) => DK_PASSES[p]).sort((a, b) => b.alt - a.alt)[0];
  if (highest && highest.alt >= 3400 && (o.seniors > 0 || o.under6 > 0)) {
    notes.push({ level: "warn", text: `The route crosses ${highest.n} at ${highest.alt.toLocaleString("en")} m. Keep stops there short for seniors and small children, and check with travellers who have heart or breathing conditions.` });
  }
  const fall = days.filter((d) => d.hotelFallback);
  if (fall.length) {
    const towns = [...new Set(fall.map((d) => DK_TOWNS[d.night].n))];
    notes.push({ level: "info", text: `${DK_HOTEL[o.hotel]} options aren't available in ${towns.join(", ")} — the plan uses the best available there.` });
  }
  if (lastParoFullDay < 0 && exit === "paro") {
    notes.push({ level: "info", text: "There's no full day in Paro at the end for the Tiger's Nest. Add a night in Paro to fit it in — it's best done last, once everyone has acclimatised." });
  }
  const M = o.month;
  if (M >= 6 && M <= 8) notes.push({ level: "info", text: "Monsoon season: landslides can close roads for hours. Build slack into long driving days." });
  const snowy = ["thrumshing", "chele"].filter((p) => days.some((d) => d.passes.includes(p))).map((p) => DK_PASSES[p].n);
  if ((M === 12 || (M >= 1 && M <= 2)) && snowy.length)
    notes.push({ level: "warn", text: `Winter: snow can close ${snowy.join(" and ")}. Have a back-up plan for ${snowy.length > 1 ? "those days" : "that day"}.` });
  if ((M >= 11 || (M >= 1 && M <= 2)) && seq.includes("gangtey"))
    notes.push({ level: "good", text: "Black-necked cranes winter in the Phobjikha valley from about November to February." });

  // 5. the Sustainable Development Fee, by age (USD; Indian nationals pay differently)
  const sdf = N * ((o.adults + o.seniors) * 100 + o.kids * 50);
  const travellers = o.adults + o.seniors + o.kids + o.under6;

  return { nights: N, days, exit, cap, gentle, totalH: Math.round(totalH * 4) / 4, longest, notes, sdf, travellers, seq };
}


/* ========================================================================== */
/*  DRUKPAH — the itinerary engine, as it appears in the Itinerary tab        */
/* ========================================================================== */
const DK_MONTHS = ["Any month", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DK_PACE = { relaxed: "Relaxed", standard: "Standard", active: "Active" };
const DK_EXIT = { paro: "Paro · fly out", phuentsholing: "Phuentsholing", sjongkhar: "Samdrup Jongkhar" };

function dkDayTitle(d) {
  const T = (k) => (DK_TOWNS[k] ? DK_TOWNS[k].n : k);
  const parts = [];
  if (d.aiTitle || d.title) parts.push(d.aiTitle || d.title);
  if (d.moving && d.to) parts.push(`${T(d.from)} → ${T(d.to)} · ${dkFmtHours(d.h)}`);
  else parts.push(T(d.from));
  const acts = (d.acts || []).filter((a) => !a.startsWith("Land at Paro"));
  if (acts.length) parts.push(acts.join(", "));
  if (d.night) parts.push(`Night in ${T(d.night)} (${DK_HOTEL[d.hotel]})`);
  return parts.join(" · ");
}

function DkStepper({ label, sub, value, min = 0, max = 20, onChange }) {
  const dim = (on) => (on ? C.ink : C.line);
  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0 pr-3">
        <div className="text-[14px] font-medium" style={{ color: C.ink }}>{label}</div>
        {sub && <div className="text-[12px]" style={{ color: C.muted }}>{sub}</div>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          aria-label={`Fewer: ${label}`}
          className="tap w-11 h-11 rounded-xl flex items-center justify-center text-[22px] leading-none"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: dim(value > min) }}>−</button>
        <span className="w-9 text-center text-[16px] font-semibold" style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          aria-label={`More: ${label}`}
          className="tap w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: dim(value < max) }}>
          <Plus size={17} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

/* The route map, alive: tap a day (or a numbered stop) and the map glides in on it,
   with Drukpah's notes for that place beside the pin. Sticky, so it stays in view
   while the day-by-day list scrolls underneath. */
function dkDayFocus(d) {
  const pts = (d.pts && d.pts.length ? d.pts : [DK_TOWNS[d.night || d.to || d.from]]).filter(Boolean).map((p) => ({ x: btPctX(p.lng), y: btPctY(p.lat) }));
  const anchorT = DK_TOWNS[d.night || d.to || d.from] || DK_TOWNS[d.from];
  const anchor = { x: btPctX(anchorT.lng), y: btPctY(anchorT.lat) };
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs, anchor.x), maxX = Math.max(...xs, anchor.x), minY = Math.min(...ys, anchor.y), maxY = Math.max(...ys, anchor.y);
  const w = maxX - minX, h = maxY - minY;
  const pad = 22;                                     // breathing room in map-percent
  const k = Math.max(1.35, Math.min(3.0, Math.min(100 / (w + pad), 100 / (h + pad))));
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  return { k, cx, cy, anchor, anchorT };
}
/* ── Google Maps: the itinerary over real satellite imagery or terrain ─────────── */
let _gmapsPromise = null;
function loadGoogleMaps(key) {
  if (typeof window === "undefined" || !key) return Promise.reject(new Error("no key"));
  if (window.google && window.google.maps && window.google.maps.Map) return Promise.resolve(window.google.maps);
  if (_gmapsPromise) return _gmapsPromise;
  _gmapsPromise = new Promise((resolve, reject) => {
    const cb = "__bthGmapsReady";
    window[cb] = () => { delete window[cb]; resolve(window.google.maps); };
    const sc = document.createElement("script");
    sc.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${cb}`;
    sc.async = true; sc.onerror = () => { _gmapsPromise = null; reject(new Error("Google Maps failed to load")); };
    document.head.appendChild(sc);
  });
  return _gmapsPromise;
}
let _mapSettingsPromise = null;
function useMapSettings() {
  const [st, setSt] = useState(null);
  useEffect(() => {
    let on = true;
    if (!_mapSettingsPromise) _mapSettingsPromise = dkLoadSettings().then((x) => ({ gmaps: x.gmaps || "", provider: x.mapProvider || "relief" })).catch(() => ({ gmaps: "", provider: "relief" }));
    _mapSettingsPromise.then((x) => { if (on) setSt(x); });
    return () => { on = false; };
  }, []);
  return st;   // null while loading
}
/* ── MapLibre: free satellite (Esri World Imagery) and contours (OpenTopoMap) ── */
let _libreP = null;
function loadMapLibre() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (_libreP) return _libreP;
  _libreP = new Promise((resolve, reject) => {
    // BUILD 51: the essential MapLibre rules ship inline, so the canvas, pins and controls are laid out
    // correctly even if the CDN stylesheet is slow or blocked; the CDN file still loads for the finer details.
    if (!document.getElementById("dk-ml-base")) { const st = document.createElement("style"); st.id = "dk-ml-base"; st.textContent = DK_ML_BASE_CSS; document.head.appendChild(st); }
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.css"; document.head.appendChild(css);
    const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js"; sc.async = true;
    sc.onload = () => resolve(window.maplibregl); sc.onerror = () => { _libreP = null; reject(new Error("MapLibre failed to load")); };
    document.head.appendChild(sc);
  });
  return _libreP;
}
const DK_ML_BASE_CSS = `.maplibregl-map{overflow:hidden;position:relative;-webkit-tap-highlight-color:transparent}.maplibregl-canvas{left:0;position:absolute;top:0}.maplibregl-canvas-container.maplibregl-interactive{cursor:grab;user-select:none}.maplibregl-canvas-container.maplibregl-touch-zoom-rotate.maplibregl-touch-drag-pan,.maplibregl-canvas-container.maplibregl-touch-zoom-rotate.maplibregl-touch-drag-pan .maplibregl-canvas{touch-action:none}.maplibregl-ctrl-top-left,.maplibregl-ctrl-top-right,.maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right{pointer-events:none;position:absolute;z-index:2}.maplibregl-ctrl-top-left{left:0;top:0}.maplibregl-ctrl-top-right{right:0;top:0}.maplibregl-ctrl-bottom-left{bottom:0;left:0}.maplibregl-ctrl-bottom-right{bottom:0;right:0}.maplibregl-ctrl{clear:both;pointer-events:auto;transform:translate(0)}.maplibregl-ctrl-bottom-right .maplibregl-ctrl{float:right;margin:0 10px 10px 0}.maplibregl-ctrl-bottom-left .maplibregl-ctrl{float:left;margin:0 0 10px 10px}.maplibregl-ctrl-group{background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.25)}.maplibregl-ctrl-group button{background:transparent;border:0;box-sizing:border-box;cursor:pointer;display:block;height:29px;outline:none;padding:0;width:29px}.maplibregl-ctrl-group button+button{border-top:1px solid #ddd}.maplibregl-ctrl button .maplibregl-ctrl-icon{display:block;height:100%;width:100%;background-position:center;background-repeat:no-repeat}.maplibregl-ctrl button.maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon{background-image:url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 29 29'><path d='M14.5 8.5a1.5 1.5 0 0 0-1.5 1.5v3h-3a1.5 1.5 0 0 0 0 3h3v3a1.5 1.5 0 0 0 3 0v-3h3a1.5 1.5 0 0 0 0-3h-3v-3a1.5 1.5 0 0 0-1.5-1.5z' fill='%23333'/></svg>")}.maplibregl-ctrl button.maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon{background-image:url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 29 29'><path d='M10 13a1.5 1.5 0 0 0 0 3h9a1.5 1.5 0 0 0 0-3h-9z' fill='%23333'/></svg>")}.maplibregl-ctrl-attrib{background:rgba(255,255,255,.8);font:9px/1.2 system-ui,sans-serif;margin:0;padding:2px 5px}.maplibregl-ctrl-attrib.maplibregl-compact{border-radius:12px;margin:10px;min-height:20px;padding:2px 24px 2px 4px;position:relative}.maplibregl-ctrl-attrib.maplibregl-compact:not(.maplibregl-compact-show){padding:0;width:20px;height:20px}.maplibregl-ctrl-attrib.maplibregl-compact:not(.maplibregl-compact-show) .maplibregl-ctrl-attrib-inner{display:none}.maplibregl-ctrl-attrib-button{background:transparent;border:0;cursor:pointer;height:20px;position:absolute;right:0;top:0;width:20px}.maplibregl-ctrl-attrib a{color:inherit;text-decoration:none}.maplibregl-marker{left:0;position:absolute;top:0;will-change:transform}.maplibregl-cooperative-gesture-screen{align-items:center;background:rgba(0,0,0,.4);color:#fff;display:flex;font-size:1.1em;inset:0;justify-content:center;line-height:1.2;opacity:0;padding:1rem;pointer-events:none;position:absolute;text-align:center;transition:opacity 1s ease 1s;z-index:99999}.maplibregl-cooperative-gesture-screen.maplibregl-show{opacity:1;transition:opacity .05s}.maplibregl-cooperative-gesture-screen .maplibregl-mobile-message{display:none}@media (hover:none){.maplibregl-cooperative-gesture-screen .maplibregl-desktop-message{display:none}.maplibregl-cooperative-gesture-screen .maplibregl-mobile-message{display:block}}`;
const LIBRE_STYLES = {
  satellite: { version: 8, sources: { esri: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 18, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" } }, layers: [{ id: "esri", type: "raster", source: "esri" }] },
  topo: { version: 8, sources: { otm: { type: "raster", tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png", "https://b.tile.opentopomap.org/{z}/{x}/{y}.png", "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 17, attribution: "© OpenStreetMap contributors, SRTM · © OpenTopoMap (CC-BY-SA)" } }, layers: [{ id: "otm", type: "raster", source: "otm" }] },
};
function dkMarkerEl(html, cls) { const el = document.createElement("div"); el.className = cls || ""; el.innerHTML = html; el.style.cursor = "pointer"; return el; }
function DkLibreMap({ plan, selected, onSelect, onBack }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState("satellite");
  const [wide, setWide] = useState(false);
  const [notice, setNotice] = useState(null);     // BUILD 51: one plain line when the imagery had to be swapped
  const tilesRef = useRef({ ok: 0, bad: 0 });      // BUILD 51: tile health, so a blank map heals itself
  const day = selected ? plan.days.find((d) => d.day === selected) : null;
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;

  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const check = () => setWide(el.getBoundingClientRect().width >= 560);
    check(); if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check); ro.observe(el); return () => ro.disconnect();
  }, []);
  const stops = useMemo(() => { const out = []; const seen = new Set(); for (const d of plan.days) if (d.night && !seen.has(d.night)) { seen.add(d.night); out.push({ key: d.night, n: out.length + 1, day: d.day }); } return out; }, [plan]);
  const routePts = useMemo(() => { const pts = []; for (const d of plan.days) for (const p of d.pts || []) { const last = pts[pts.length - 1]; if (!last || last.lat !== p.lat || last.lng !== p.lng) pts.push(p); } return pts; }, [plan]);
  const passesOnRoute = useMemo(() => { const set = new Set(); for (const d of plan.days) for (const pk of d.passes || []) set.add(pk); return [...set]; }, [plan]);

  // boot
  useEffect(() => {
    let on = true;
    loadMapLibre().then((ml) => {
      if (!on || !boxRef.current) return;
      const map = new ml.Map({ container: boxRef.current, style: LIBRE_STYLES.satellite, center: [90.4, 27.5], zoom: 6.3, attributionControl: { compact: true }, cooperativeGestures: true, pitchWithRotate: false, dragRotate: false, touchPitch: false });
      map.addControl(new ml.NavigationControl({ showCompass: false }), "bottom-right");
      map.on("click", () => onSelectRef.current && onSelectRef.current(null));
      // BUILD 51: count tiles that arrive and tiles that fail, and size the canvas once the box is laid out
      map.on("data", (e) => { if (e && e.tile && e.dataType === "source") tilesRef.current.ok += 1; });
      map.on("error", (e) => {
        if (e && (e.tile || e.sourceId)) { tilesRef.current.bad += 1; return; }
        if (e && e.error && /style|load/i.test(String(e.error.message || "")) && !mapRef.current) { setFailed(true); }
      });
      map.on("load", () => {
        if (!on) return;
        mapRef.current = map; setReady(true);
        try { map.resize(); } catch (e) {}
        requestAnimationFrame(() => { try { map.resize(); } catch (e) {} });
        setTimeout(() => { try { map.resize(); } catch (e) {} }, 400);
      });
    }).catch(() => { if (on) setFailed(true); });
    const onVis = () => { if (!document.hidden && mapRef.current) { try { mapRef.current.resize(); } catch (e) {} } };
    document.addEventListener("visibilitychange", onVis);
    return () => { on = false; document.removeEventListener("visibilitychange", onVis); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // BUILD 51: watchdog — if no satellite tile has arrived 7 s after the map is ready, switch to contours;
  // if contours bring nothing either, hand over to the drawn route so the screen is never an empty box.
  useEffect(() => {
    if (!ready) return;
    tilesRef.current = { ok: 0, bad: 0 };
    const t = setTimeout(() => {
      const { ok, bad } = tilesRef.current;
      if (ok > 0) return;
      try { window.__bthMapDiag = { kind, ok, bad, at: new Date().toISOString() }; } catch (e) {}
      if (kind === "satellite") { setKind("topo"); setNotice("Satellite imagery didn't come through on this connection — showing contours instead."); }
      else { setFailed(true); setNotice("Map tiles can't be reached from this network right now — showing the route sketch."); }
    }, 7000);
    return () => clearTimeout(t);
  }, [ready, kind]);

  // style switch keeps the route: re-add layers after the new style loads
  const drawRoute = () => {
    const map = mapRef.current; if (!map) return;
    const coords = routePts.map((p) => [p.lng, p.lat]);
    const seg = day && day.moving && day.pts && day.pts.length > 1 ? day.pts.map((p) => [p.lng, p.lat]) : null;
    const fc = { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} }] };
    const sfc = { type: "FeatureCollection", features: seg ? [{ type: "Feature", geometry: { type: "LineString", coordinates: seg }, properties: {} }] : [] };
    if (map.getSource("route")) { map.getSource("route").setData(fc); map.getSource("seg").setData(sfc); map.setPaintProperty("route-line", "line-opacity", seg ? 0.45 : 1); return; }
    map.addSource("route", { type: "geojson", data: fc }); map.addSource("seg", { type: "geojson", data: sfc });
    map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#FFFFFF", "line-width": 6, "line-opacity": 0.9 } });
    map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#7A2E2E", "line-width": 3, "line-opacity": seg ? 0.45 : 1, "line-opacity-transition": { duration: 400 } } });
    map.addLayer({ id: "seg-line", type: "line", source: "seg", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#7A2E2E", "line-width": 5 } });
  };
  useEffect(() => { if (ready) drawRoute(); }, [ready, routePts, selected]);
  useEffect(() => {
    const map = mapRef.current; if (!ready || !map) return;
    map.setStyle(LIBRE_STYLES[kind]); map.once("style.load", drawRoute);
  }, [kind]);

  // markers (DOM, so they never scale with the map)
  useEffect(() => {
    const map = mapRef.current; if (!ready || !map) return;
    const ml = window.maplibregl;
    markersRef.current.forEach((m) => m.remove()); const ms = [];
    const lab = (t) => `<span class="dk-gm-label" style="color:#fff;font-size:11px;font-weight:600">${t}</span>`;
    for (const pk of DK_PEAKS) ms.push(new ml.Marker({ element: dkMarkerEl(`<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none">${lab(`${pk.n} · ${pk.alt.toLocaleString()} m`)}<svg width="14" height="12" viewBox="0 0 14 12"><path d="M7 1 L13 11 L1 11 Z" fill="#fff" stroke="rgba(0,0,0,.6)"/></svg></div>`), anchor: "bottom" }).setLngLat([pk.lng, pk.lat]).addTo(map));
    const todays = new Set(day ? (day.passes || []) : []);
    for (const pk of passesOnRoute) { const ps = DK_PASSES[pk]; if (!ps) continue; const hot = todays.has(pk);
      ms.push(new ml.Marker({ element: dkMarkerEl(`<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;opacity:${day && !hot ? .6 : 1}">${(hot || !day) ? lab(`${ps.n} · ${ps.alt.toLocaleString()} m`) : ""}<svg width="16" height="9" viewBox="0 0 16 9"><path d="M1 8 Q4.5 0 8 5 Q11.5 0 15 8 Z" fill="${hot ? "#7A2E2E" : "#fff"}" stroke="${hot ? "#fff" : "rgba(0,0,0,.6)"}"/></svg></div>`), anchor: "bottom" }).setLngLat([ps.lng, ps.lat]).addTo(map)); }
    for (const st of stops) { const t = DK_TOWNS[st.key]; const on = day && (day.night === st.key || day.to === st.key);
      const el = dkMarkerEl(`<img src="${dkPinSvg(st.n, on)}" width="${on ? 30 : 24}" height="${on ? 30 : 24}" alt="Stop ${st.n}: ${t.n}" draggable="false" style="display:block">`);
      el.setAttribute("role", "button"); el.setAttribute("aria-label", `Stop ${st.n}: ${t.n}`);
      el.addEventListener("click", (e) => { e.stopPropagation(); onSelectRef.current && onSelectRef.current(st.day); });
      ms.push(new ml.Marker({ element: el, anchor: "center" }).setLngLat([t.lng, t.lat]).addTo(map)); }
    markersRef.current = ms;
  }, [ready, plan, selected, stops, passesOnRoute]);

  // camera
  useEffect(() => {
    const map = mapRef.current; if (!ready || !map) return;
    const ml = window.maplibregl;
    const b = new ml.LngLatBounds();
    if (day) { (day.pts && day.pts.length ? day.pts : [DK_TOWNS[day.night || day.to || day.from]]).forEach((p) => p && b.extend([p.lng, p.lat])); if (!day.moving) { const t = DK_TOWNS[day.night || day.to || day.from]; b.extend([t.lng + 0.16, t.lat + 0.12]); b.extend([t.lng - 0.16, t.lat - 0.12]); } }
    else routePts.forEach((p) => b.extend([p.lng, p.lat]));
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.fitBounds(b, { padding: day ? { top: wide ? 40 : 36, bottom: wide ? 36 : 150, left: 36, right: wide && day ? 290 : 36 } : 30, maxZoom: 13, duration: reduce ? 0 : 800, essential: true, easing: easeInOut });
  }, [ready, selected, plan]);

  let note = null;
  if (day) {
    const townKey = day.night || day.to || day.from; const town = DK_TOWNS[townKey];
    const planned = (day.acts || []).map((a) => String(a).toLowerCase());
    const ideas = (DK_SEE[townKey] || []).filter((x) => !planned.some((a) => a.includes(x.t.toLowerCase().split(",")[0]))).slice(0, 3);
    note = { town, ideas, passes: [], planned: (day.acts || []).length, profile: [] };
  }
  if (failed) return <DkReliefMap plan={plan} selected={selected} onSelect={onSelect} fallbackNote={notice || "Satellite imagery is not available on this connection — showing the relief model."} />;
  return (
    <div className="dk-map-sticky">
      <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: "#0b1a12", aspectRatio: wide ? "2 / 1" : "4 / 3" }}>
        <div ref={boxRef} className="absolute inset-0 dk-libre" />
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-[12px]" style={{ color: "#fff", opacity: .8 }}><Loader2 size={16} className="animate-spin mr-2" /> Loading satellite map…</div>}
        {ready && (
          <div className="absolute left-2 top-2 inline-flex rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,.92)", boxShadow: "0 1px 3px rgba(0,0,0,.25)", zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
            {onBack && <button type="button" onClick={onBack} className="tap px-2.5 h-7 text-[11px] font-semibold" style={{ background: "transparent", color: C.ink }}>Relief</button>}
            {[["satellite", "Satellite"], ["topo", "Contours"]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setKind(k)} className="tap px-2.5 h-7 text-[11px] font-semibold" style={{ background: kind === k ? C.pine : "transparent", color: kind === k ? "#fff" : C.ink }}>{l}</button>
            ))}
          </div>
        )}
        {ready && note && wide && (
          <div className="absolute right-2 top-2 dk-note-side" style={{ width: 250, maxHeight: "calc(100% - 16px)", overflowY: "auto", zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
            <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
          </div>
        )}
        {ready && note && !wide && (
          <div className="absolute left-2 right-2 bottom-2 dk-note-over" style={{ maxHeight: "48%", overflowY: "auto", zIndex: 6 }} onClick={(e) => e.stopPropagation()}>
            <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
          </div>
        )}
        {ready && !selected && <div className="absolute left-2 bottom-2 text-[10.5px] rounded-md px-2 py-1 pointer-events-none" style={{ background: "rgba(255,255,255,.9)", color: C.muted, zIndex: 5 }}>Tap a day or a stop to fly in</div>}
      </div>
      {notice && <div className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>{notice}</div>}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {stops.map((st) => { const on = day && (day.night === st.key || day.to === st.key);
          return (
            <button key={st.key} type="button" onClick={() => onSelect && onSelect(on ? null : st.day)} className="tap inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 text-[12px]"
              style={{ background: on ? C.pineSoft : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? C.pine : C.muted }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: on ? C.pine : C.grey, color: on ? "#fff" : C.ink }}>{st.n}</span>{DK_TOWNS[st.key].n}
            </button>
          ); })}
      </div>
    </div>
  );
}
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function dkPinSvg(n, on) {
  const bg = on ? "#7A2E2E" : "#0066CC"; const sz = on ? 30 : 24;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">${on ? `<circle cx="${sz / 2}" cy="${sz / 2}" r="${sz / 2 - 1}" fill="rgba(122,46,46,.25)"/>` : ""}<circle cx="${sz / 2}" cy="${sz / 2}" r="${sz / 2 - (on ? 5 : 3)}" fill="${bg}" stroke="#fff" stroke-width="2"/><text x="${sz / 2}" y="${sz / 2 + 4}" font-family="-apple-system,Inter,Arial" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${n}</text></svg>`);
}
const dkPeakSvg = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12"><path d="M7 1 L13 11 L1 11 Z" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width="1"/></svg>`);
const dkPassSvg = (hot) => "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9" viewBox="0 0 16 9"><path d="M1 8 Q4.5 0 8 5 Q11.5 0 15 8 Z" fill="${hot ? "#7A2E2E" : "#fff"}" stroke="${hot ? "#fff" : "rgba(0,0,0,.6)"}" stroke-width="1"/></svg>`);

function DkGoogleMap({ plan, selected, onSelect, apiKey }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef({ markers: [], lines: [] });
  const animRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState("hybrid");   // hybrid = satellite with place names · terrain = shaded relief with contours
  const [wide, setWide] = useState(false);
  const day = selected ? plan.days.find((d) => d.day === selected) : null;

  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const check = () => setWide(el.getBoundingClientRect().width >= 560);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check); ro.observe(el); return () => ro.disconnect();
  }, []);

  // boot
  useEffect(() => {
    let on = true;
    loadGoogleMaps(apiKey).then((gm) => {
      if (!on || !boxRef.current) return;
      const map = new gm.Map(boxRef.current, {
        center: { lat: 27.5, lng: 90.4 }, zoom: 7, mapTypeId: kind, tilt: 0,
        disableDefaultUI: true, zoomControl: true, zoomControlOptions: { position: gm.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: "cooperative", clickableIcons: false, keyboardShortcuts: false,
        backgroundColor: "#0b1a12",
      });
      map.addListener("click", () => onSelect && onSelect(null));
      mapRef.current = map; setReady(true);
    }).catch(() => { if (on) setFailed(true); });
    return () => { on = false; };
  }, [apiKey]);

  useEffect(() => { if (mapRef.current) mapRef.current.setMapTypeId(kind); }, [kind]);

  // route + markers
  const stops = useMemo(() => { const out = []; const seen = new Set(); for (const d of plan.days) if (d.night && !seen.has(d.night)) { seen.add(d.night); out.push({ key: d.night, n: out.length + 1, day: d.day }); } return out; }, [plan]);
  const routePts = useMemo(() => { const pts = []; for (const d of plan.days) for (const p of d.pts || []) { const last = pts[pts.length - 1]; if (!last || last.lat !== p.lat || last.lng !== p.lng) pts.push(p); } return pts; }, [plan]);
  const passesOnRoute = useMemo(() => { const set = new Set(); for (const d of plan.days) for (const pk of d.passes || []) set.add(pk); return [...set]; }, [plan]);

  useEffect(() => {
    const map = mapRef.current; if (!ready || !map) return;
    const gm = window.google.maps;
    layerRef.current.markers.forEach((m) => m.setMap(null)); layerRef.current.lines.forEach((l) => l.setMap(null));
    const markers = [], lines = [];
    const path = routePts.map((p) => ({ lat: p.lat, lng: p.lng }));
    const segPath = day && day.moving && day.pts && day.pts.length > 1 ? day.pts.map((p) => ({ lat: p.lat, lng: p.lng })) : null;
    lines.push(new gm.Polyline({ map, path, strokeColor: "#FFFFFF", strokeOpacity: 0.9, strokeWeight: 6, zIndex: 1 }));
    lines.push(new gm.Polyline({ map, path, strokeColor: "#7A2E2E", strokeOpacity: segPath ? 0.45 : 1, strokeWeight: 3, zIndex: 2 }));
    if (segPath) lines.push(new gm.Polyline({ map, path: segPath, strokeColor: "#7A2E2E", strokeOpacity: 1, strokeWeight: 5, zIndex: 3 }));
    const label = (text) => ({ text, color: "#FFFFFF", fontSize: "11px", fontWeight: "600", className: "dk-gm-label" });
    for (const pk of DK_PEAKS) markers.push(new gm.Marker({ map, position: { lat: pk.lat, lng: pk.lng }, icon: { url: dkPeakSvg, scaledSize: new gm.Size(14, 12), anchor: new gm.Point(7, 12), labelOrigin: new gm.Point(7, -8) }, label: label(`${pk.n} · ${pk.alt.toLocaleString()} m`), clickable: false, zIndex: 1 }));
    const todays = new Set(day ? (day.passes || []) : []);
    for (const pk of passesOnRoute) { const ps = DK_PASSES[pk]; if (!ps) continue; const hot = todays.has(pk);
      markers.push(new gm.Marker({ map, position: { lat: ps.lat, lng: ps.lng }, icon: { url: dkPassSvg(hot), scaledSize: new gm.Size(16, 9), anchor: new gm.Point(8, 5), labelOrigin: new gm.Point(8, -8) },
        label: (hot || !day) ? label(`${ps.n} · ${ps.alt.toLocaleString()} m`) : null, opacity: day && !hot ? 0.6 : 1, clickable: false, zIndex: hot ? 5 : 2 })); }
    for (const st of stops) { const t = DK_TOWNS[st.key]; const on = day && (day.night === st.key || day.to === st.key);
      const m = new gm.Marker({ map, position: { lat: t.lat, lng: t.lng }, icon: { url: dkPinSvg(st.n, on), scaledSize: new gm.Size(on ? 30 : 24, on ? 30 : 24), anchor: new gm.Point(on ? 15 : 12, on ? 15 : 12) }, title: `Stop ${st.n}: ${t.n}`, zIndex: on ? 10 : 6 });
      m.addListener("click", () => onSelect && onSelect(st.day)); markers.push(m); }
    layerRef.current = { markers, lines };
  }, [ready, plan, selected, stops, routePts, passesOnRoute]);

  // camera: a 750 ms eased flight (fractional zoom via moveCamera)
  useEffect(() => {
    const map = mapRef.current; if (!ready || !map) return;
    const gm = window.google.maps;
    const target = (() => {
      const b = new gm.LatLngBounds();
      if (day) { (day.pts && day.pts.length ? day.pts : [DK_TOWNS[day.night || day.to || day.from]]).forEach((p) => p && b.extend({ lat: p.lat, lng: p.lng })); if (!day.moving) { const t = DK_TOWNS[day.night || day.to || day.from]; b.extend({ lat: t.lat + 0.12, lng: t.lng + 0.16 }); b.extend({ lat: t.lat - 0.12, lng: t.lng - 0.16 }); } }
      else routePts.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }));
      return b;
    })();
    // compute the zoom that fits the bounds in this box
    const el = boxRef.current; const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
    const ne = target.getNorthEast(), sw = target.getSouthWest();
    const latRad = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    const pad = day ? 0.72 : 0.84;
    const zx = Math.log2((W * pad) / 256 / ((ne.lng() - sw.lng()) / 360 || 1e-6));
    const zy = Math.log2((H * pad) / 256 / ((latRad(ne.lat()) - latRad(sw.lat())) / Math.PI || 1e-6));
    const zoom = Math.max(6.5, Math.min(13, Math.min(zx, zy)));
    const center = target.getCenter();
    const from = { lat: map.getCenter().lat(), lng: map.getCenter().lng(), zoom: map.getZoom() };
    const to = { lat: center.lat(), lng: center.lng(), zoom };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { map.moveCamera({ center: { lat: to.lat, lng: to.lng }, zoom: to.zoom }); return; }
    const t0 = performance.now(), dur = 750;
    const step = (now) => {
      const u = easeInOut(Math.min(1, (now - t0) / dur));
      map.moveCamera({ center: { lat: from.lat + (to.lat - from.lat) * u, lng: from.lng + (to.lng - from.lng) * u }, zoom: from.zoom + (to.zoom - from.zoom) * u });
      if (u < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [ready, selected, plan]);

  let note = null;
  if (day) {
    const townKey = day.night || day.to || day.from; const town = DK_TOWNS[townKey];
    const planned = (day.acts || []).map((a) => String(a).toLowerCase());
    const ideas = (DK_SEE[townKey] || []).filter((x) => !planned.some((a) => a.includes(x.t.toLowerCase().split(",")[0]))).slice(0, 2);
    note = { town, ideas, passes: [], planned: (day.acts || []).length, profile: [] };
  }
  if (failed) return <DkRouteMap plan={plan} selected={selected} onSelect={onSelect} />;
  return (
    <div className="dk-map-sticky">
      <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: "#0b1a12", aspectRatio: wide ? "2 / 1" : "4 / 3" }}>
        <div ref={boxRef} className="absolute inset-0" />
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-[12px]" style={{ color: "#fff", opacity: .8 }}><Loader2 size={16} className="animate-spin mr-2" /> Loading satellite map…</div>}
        {ready && (
          <div className="absolute left-2 top-2 inline-flex rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,.92)", boxShadow: "0 1px 3px rgba(0,0,0,.25)", zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
            {[["hybrid", "Satellite"], ["terrain", "Terrain"]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setKind(k)} className="tap px-2.5 h-7 text-[11px] font-semibold" style={{ background: kind === k ? C.pine : "transparent", color: kind === k ? "#fff" : C.ink }}>{l}</button>
            ))}
          </div>
        )}
        {ready && note && wide && (
          <div className="absolute right-2 top-2 dk-note-side" style={{ width: 250, maxHeight: "calc(100% - 16px)", overflowY: "auto", zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
            <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
          </div>
        )}
        {ready && !selected && <div className="absolute left-2 bottom-2 text-[10.5px] rounded-md px-2 py-1 pointer-events-none" style={{ background: "rgba(255,255,255,.9)", color: C.muted, zIndex: 5 }}>Tap a day or a stop to fly in</div>}
      </div>
      {ready && note && !wide && (
        <div className="dk-note-under mt-2"><DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} /></div>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {stops.map((st) => { const on = day && (day.night === st.key || day.to === st.key);
          return (
            <button key={st.key} type="button" onClick={() => onSelect && onSelect(on ? null : st.day)} className="tap inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 text-[12px]"
              style={{ background: on ? C.pineSoft : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? C.pine : C.muted }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: on ? C.pine : C.grey, color: on ? "#fff" : C.ink }}>{st.n}</span>{DK_TOWNS[st.key].n}
            </button>
          ); })}
      </div>
    </div>
  );
}
/* Picks the map the admin chose: free satellite (default), Google with a key, or the painted relief. */
/* ── Relief map: a self-contained 2.5-D model of Bhutan, drawn on the device (BUILD 52). ──────────
   No tiles, no network, no WebGL: it is on screen with the first paint, even on a slow connection.
   The terrain is a stylised relief shaped from surveyed spot heights (towns, passes, peaks), so the
   figures on the map are the real ones while the shape between them is an artist's model. ─────── */
const DKR = {
  KX: 98.6, KY: 111,     // km per degree of longitude / latitude at Bhutan's latitude
  TILT: 0.6,             // the ground plane leans away from the viewer (1 = flat top view)
  ZK: 0.0075,            // metres of height → map units (one unit is about a kilometre on the ground)
  COLS: 128, ROWS: 72,   // terrain grid
  PX: 6,                 // canvas pixels per map unit
};
const dkrPlane = (lng, lat) => ({ x: (lng - BT.W) * DKR.KX, y: (BT.N - lat) * DKR.KY });
const dkrProject = (lng, lat, z) => { const p = dkrPlane(lng, lat); return { x: p.x, y: p.y * DKR.TILT - (z || 0) * DKR.ZK }; };

let _dkrTerrain = null;
function dkrTerrain() {
  if (_dkrTerrain) return _dkrTerrain;
  const W = (BT.E - BT.W) * DKR.KX, H = (BT.N - BT.S) * DKR.KY;
  const C = DKR.COLS, R = DKR.ROWS;
  // Control points: valley floors (towns), ridges (passes), summits (peaks), the Himalayan crest along
  // the north and the Duars plain along the south, plus a few ridge lines between the valleys.
  const pts = [];
  for (const t of Object.values(DK_TOWNS)) pts.push({ ...dkrPlane(t.lng, t.lat), z: t.alt, r: 9 });
  for (const p of Object.values(DK_PASSES)) pts.push({ ...dkrPlane(p.lng, p.lat), z: p.alt, r: 7 });
  for (const p of DK_PEAKS) pts.push({ ...dkrPlane(p.lng, p.lat), z: p.alt, r: 6 });
  const crest = [[89.0, 28.1, 6200], [89.3, 28.25, 6600], [89.7, 28.3, 6900], [90.1, 28.2, 6400], [90.5, 28.1, 7000], [90.9, 28.15, 6500], [91.3, 28.1, 6200], [91.7, 27.95, 5600], [92.0, 27.6, 4800]];
  const duars = [[89.2, 26.8, 350], [89.7, 26.75, 260], [90.2, 26.8, 260], [90.7, 26.8, 280], [91.2, 26.8, 300], [91.7, 26.85, 350], [92.0, 27.0, 500]];
  const ridges = [[89.5, 27.2, 2800], [89.85, 27.3, 3200], [90.0, 27.75, 4200], [90.35, 27.35, 3300], [90.6, 27.8, 4300], [90.9, 27.4, 3000], [91.0, 27.75, 3800], [91.4, 27.5, 2900], [91.6, 27.1, 1800], [89.1, 27.5, 3600], [89.9, 27.0, 1500], [90.6, 27.05, 1500]];
  for (const [lng, lat, z] of crest) pts.push({ ...dkrPlane(lng, lat), z, r: 14 });
  for (const [lng, lat, z] of duars) pts.push({ ...dkrPlane(lng, lat), z, r: 22 });
  for (const [lng, lat, z] of ridges) pts.push({ ...dkrPlane(lng, lat), z, r: 14 });
  const base = (y) => { const t = Math.max(0, Math.min(1, 1 - y / H)); return 300 + 2600 * Math.pow(t, 1.4); };   // y = 0 is the north; the crest points add the high Himalaya
  const hash = (i, j) => { const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); };
  const z = new Float32Array((C + 1) * (R + 1));
  for (let j = 0; j <= R; j++) for (let i = 0; i <= C; i++) {
    const x = (i / C) * W, y = (j / R) * H, b = base(y);
    let sw = 0, sr = 0;
    for (const p of pts) { const dx = x - p.x, dy = y - p.y, w = Math.exp(-(dx * dx + dy * dy) / (2 * p.r * p.r)); sw += w; sr += w * (p.z - base(p.y)); }
    let v = b + sr / (sw + 0.08);
    v += (hash(i, j) - 0.5) * 2 * (25 + v * 0.006);   // a little texture so slopes are not glassy
    z[j * (C + 1) + i] = Math.max(150, v);
  }
  // height at any plane point (bilinear)
  const at = (x, y) => {
    const fx = Math.max(0, Math.min(C - 1e-6, (x / W) * C)), fy = Math.max(0, Math.min(R - 1e-6, (y / H) * R));
    const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j, s = C + 1;
    return z[j * s + i] * (1 - tx) * (1 - ty) + z[j * s + i + 1] * tx * (1 - ty) + z[(j + 1) * s + i] * (1 - tx) * ty + z[(j + 1) * s + i + 1] * tx * ty;
  };
  return (_dkrTerrain = { z, W, H, C, R, at });
}
const DKR_RAMP = [[0, [60, 110, 50]], [1200, [96, 146, 70]], [2200, [132, 160, 84]], [3000, [158, 150, 96]], [3800, [142, 122, 96]], [4600, [150, 146, 140]], [5200, [236, 239, 243]], [8000, [250, 251, 253]]];
function dkrColor(zv, shade) {
  let a = DKR_RAMP[0], b = DKR_RAMP[DKR_RAMP.length - 1];
  for (let k = 0; k < DKR_RAMP.length - 1; k++) if (zv >= DKR_RAMP[k][0] && zv < DKR_RAMP[k + 1][0]) { a = DKR_RAMP[k]; b = DKR_RAMP[k + 1]; break; }
  const t = Math.max(0, Math.min(1, (zv - a[0]) / (b[0] - a[0] || 1)));
  const c = [0, 1, 2].map((i) => Math.round((a[1][i] + (b[1][i] - a[1][i]) * t) * shade));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
let _dkrImage = null;
function dkrImage() {
  if (_dkrImage) return _dkrImage;
  const T = dkrTerrain(); const { z, W, H, C, R } = T; const S = DKR.PX;
  const y0 = -7800 * DKR.ZK, y1 = H * DKR.TILT + 6;
  const cv = document.createElement("canvas"); cv.width = Math.round(W * S); cv.height = Math.round((y1 - y0) * S);
  const g = cv.getContext("2d"); if (!g) return null;
  const P = (x, y, zz) => [x * S, (y * DKR.TILT - zz * DKR.ZK - y0) * S];
  // the slab: the country's outline, pushed down a little in a dark tone, reads as the model's thickness
  const border = BT_BORDER.map(([lng, lat]) => { const p = dkrPlane(lng, lat); return { x: p.x, y: p.y, z: T.at(p.x, p.y) }; });
  g.fillStyle = "#3a4a40";
  g.beginPath(); border.forEach((b, i) => { const q = P(b.x, b.y, b.z - 900); if (i === 0) g.moveTo(q[0], q[1] + 2.5 * S); else g.lineTo(q[0], q[1] + 2.5 * S); }); g.closePath(); g.fill();
  // terrain, clipped to the outline, painted from the far (north) rows to the near (south) rows
  g.save();
  g.beginPath(); border.forEach((b, i) => { const q = P(b.x, b.y, b.z + 200); if (i === 0) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); }); g.closePath(); g.clip();
  g.fillStyle = "#56704a"; g.fillRect(0, 0, cv.width, cv.height);
  const L = [-0.52, -0.5, 0.69]; const E = 2.4;
  const idx = (i, j) => j * (C + 1) + i;
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
    const zA = z[idx(i, j)], zB = z[idx(i + 1, j)], zC = z[idx(i + 1, j + 1)], zD = z[idx(i, j + 1)];
    const x0 = (i / C) * W, x1 = ((i + 1) / C) * W, ya = (j / R) * H, yb = ((j + 1) / R) * H;
    const dzdx = ((zB - zA) + (zC - zD)) / 2 / 1000 / (W / C), dzdy = ((zD - zA) + (zC - zB)) / 2 / 1000 / (H / R);
    let nx = -dzdx * E, ny = -dzdy * E, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const shade = 0.58 + 0.5 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    g.fillStyle = dkrColor((zA + zB + zC + zD) / 4, shade); g.strokeStyle = g.fillStyle; g.lineWidth = 0.6;
    const a = P(x0, ya, zA), b = P(x1, ya, zB), c = P(x1, yb, zC), d = P(x0, yb, zD);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); g.stroke();
  }
  g.restore();
  // a soft rim along the outline
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.2 * S;
  g.beginPath(); border.forEach((b, i) => { const q = P(b.x, b.y, b.z + 200); if (i === 0) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); }); g.closePath(); g.stroke();
  let url = null; try { url = cv.toDataURL("image/png"); } catch (e) { url = null; }
  return (_dkrImage = url ? { url, x: 0, y: y0, w: W, h: y1 - y0 } : null);
}
// the road between two points, sampled so it follows the relief
function dkrRoad(pts) {
  const T = dkrTerrain(); const out = [];
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k]; const a = dkrPlane(p.lng, p.lat);
    if (k === 0) { out.push({ x: a.x, y: a.y, z: T.at(a.x, a.y) + 40 }); continue; }
    const q = pts[k - 1]; const b = dkrPlane(q.lng, q.lat); const n = 14;
    for (let s = 1; s <= n; s++) { const t = s / n; const x = b.x + (a.x - b.x) * t, y = b.y + (a.y - b.y) * t; out.push({ x, y, z: T.at(x, y) + 40 }); }
  }
  return out.map((p) => { const s = { x: p.x, y: p.y * DKR.TILT - p.z * DKR.ZK }; return `${s.x.toFixed(2)},${s.y.toFixed(2)}`; }).join(" ");
}
const dkrEase = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function DkReliefMap({ plan, selected, onSelect, fallbackNote }) {
  const boxRef = useRef(null);
  const [box, setBox] = useState({ w: 360, h: 270 });
  const [img, setImg] = useState(null);
  const terrainOK = useMemo(() => dkTerrainCovers(plan), [plan]);   // BUILD 53: the real 3-D model covers the west of the country
  const [mode, setMode] = useState(() => { if (fallbackNote) return "relief"; try { return localStorage.getItem(DK_TERRAIN_PREF) === "terrain" ? "terrain" : "relief"; } catch (_e) { return "relief"; } });   // relief | terrain | satellite
  const pickMode = (m) => { setMode(m); try { if (m === "terrain") localStorage.setItem(DK_TERRAIN_PREF, "terrain"); else if (m === "relief") localStorage.removeItem(DK_TERRAIN_PREF); } catch (_e) {} };
  const day = selected ? plan.days.find((d) => d.day === selected) : null;
  const wide = box.w >= 560;

  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const check = () => { const r = el.getBoundingClientRect(); if (r.width > 0) setBox({ w: r.width, h: r.height }); };
    check(); if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }
    const ro = new ResizeObserver(check); ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => { let on = true; const id = setTimeout(() => { if (on) setImg(dkrImage()); }, 0); return () => { on = false; clearTimeout(id); }; }, []);

  const stops = useMemo(() => { const out = []; const seen = new Set(); for (const d of plan.days) if (d.night && !seen.has(d.night)) { seen.add(d.night); out.push({ key: d.night, n: out.length + 1, day: d.day }); } return out; }, [plan]);
  const routePts = useMemo(() => { const pts = []; for (const d of plan.days) for (const p of d.pts || []) { const last = pts[pts.length - 1]; if (!last || last.lat !== p.lat || last.lng !== p.lng) pts.push(p); } return pts; }, [plan]);
  const passesOnRoute = useMemo(() => { const set = new Set(); for (const d of plan.days) for (const pk of d.passes || []) set.add(pk); return [...set]; }, [plan]);
  const roadAll = useMemo(() => dkrRoad(routePts), [routePts]);
  const roadDay = useMemo(() => (day && day.moving && day.pts && day.pts.length > 1 ? dkrRoad(day.pts) : null), [day]);

  // the view: a rectangle in map units, animated between the whole country and a day
  const T = dkrTerrain();
  const A = box.w / Math.max(1, box.h);
  const fit = (x0, y0, x1, y1, pad, maxZoom) => {
    let w = (x1 - x0) + pad * 2, h = (y1 - y0) + pad * 2;
    if (w / h < A) w = h * A; else h = w / A;
    const full = fit0(); const minW = full.w / maxZoom;
    if (w < minW) { w = minW; h = w / A; }
    if (w > full.w) { w = full.w; h = full.h; }
    return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
  };
  const fit0 = () => { const y0 = -7800 * DKR.ZK, y1 = T.H * DKR.TILT + 6; let w = T.W + 12, h = (y1 - y0) + 8; if (w / h < A) w = h * A; else h = w / A; return { x: T.W / 2 - w / 2, y: (y0 + y1) / 2 - h / 2 + (wide ? 0 : 0), w, h }; };
  const target = useMemo(() => {
    if (!day) {
      if (!routePts.length) return fit0();
      const ps = routePts.map((p) => dkrProject(p.lng, p.lat, p.alt || 0)); const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
      const v = fit(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), 34, 1.7); v.y -= v.h * 0.14; return v;
    }
    const ps = (day.pts && day.pts.length ? day.pts : [DK_TOWNS[day.night || day.to || day.from]]).filter(Boolean).map((p) => dkrProject(p.lng, p.lat, p.alt || T.at(dkrPlane(p.lng, p.lat).x, dkrPlane(p.lng, p.lat).y)));
    const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
    const v = fit(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), day.moving ? 16 : 22, 2.8);
    if (!wide) v.y += v.h * 0.16;            // the ideas card sits over the lower part on phones: keep the pins above it
    else v.x += v.w * 0.14;                  // the panel sits on the right on wide screens
    return v;
  }, [day, routePts, box.w, box.h]);
  const [vb, setVb] = useState(target);
  const animRef = useRef(null);
  useEffect(() => {
    const from = { ...vb }, to = target; const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVb(to); return; }
    const t0 = performance.now(), dur = 720;
    cancelAnimationFrame(animRef.current);
    const step = (now) => { const t = Math.min(1, (now - t0) / dur), e = dkrEase(t);
      setVb({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
      if (t < 1) animRef.current = requestAnimationFrame(step); };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [target]);
  const upp = vb.w / Math.max(1, box.w);   // map units per screen pixel: markers scale by this to keep their size

  // Drukpah's notes for the selected day
  let note = null;
  if (day) {
    const townKey = day.night || day.to || day.from; const town = DK_TOWNS[townKey];
    const planned = (day.acts || []).map((a) => String(a).toLowerCase());
    const ideas = (DK_SEE[townKey] || []).filter((x) => !planned.some((a) => a.includes(x.t.toLowerCase().split(",")[0]))).slice(0, 3);
    note = { town, ideas, passes: [], planned: (day.acts || []).length, profile: [] };
  }
  if (mode === "satellite") return <DkLibreMap plan={plan} selected={selected} onSelect={onSelect} onBack={() => pickMode("relief")} />;
  if (mode === "terrain" && terrainOK && !fallbackNote) return <DkTerrainMap plan={plan} selected={selected} onSelect={onSelect} onBack={() => pickMode("relief")} />;

  const label = (t, x, y, size, weight, anchor) => (
    <text x={x} y={y} fontSize={size} fontWeight={weight || 600} textAnchor={anchor || "middle"} fill="#fff" stroke="rgba(0,0,0,.75)" strokeWidth={3} paintOrder="stroke" style={{ fontFamily: "-apple-system, Inter, system-ui, sans-serif" }}>{t}</text>
  );
  const todays = new Set(day ? (day.passes || []) : []);
  return (
    <div className="dk-map-sticky">
      <div ref={boxRef} className="relative rounded-2xl overflow-hidden" style={{ position: "relative", border: `1px solid ${C.line}`, background: "linear-gradient(180deg, #e6ecf2 0%, #dfe7e0 60%, #d6dfd5 100%)", aspectRatio: wide ? "2 / 1" : "4 / 3" }} onClick={() => onSelect && onSelect(null)}>
        <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} aria-label="Relief map of Bhutan with the planned route">
          {img && <image href={img.url} x={img.x} y={img.y} width={img.w} height={img.h} preserveAspectRatio="none" />}
          <polyline points={roadAll} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.85} />
          <polyline points={roadAll} fill="none" stroke="#7A2E2E" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={roadDay ? 0.4 : 1} style={{ transition: "opacity .5s" }} />
          {roadDay && <polyline points={roadDay} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.9} />}
          {roadDay && <polyline points={roadDay} fill="none" stroke="#7A2E2E" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          {/* passes on this route */}
          {passesOnRoute.map((pk) => { const ps = DK_PASSES[pk]; if (!ps) return null; const hot = todays.has(pk); const p = dkrProject(ps.lng, ps.lat, ps.alt);
            return (
              <g key={pk} transform={`translate(${p.x} ${p.y}) scale(${upp})`} opacity={day && !hot ? 0.6 : 1} style={{ pointerEvents: "none" }}>
                <path d="M-8 0 Q-4 -8 0 -3 Q4 -8 8 0 Z" fill={hot ? "#7A2E2E" : "#fff"} stroke={hot ? "#fff" : "rgba(0,0,0,.6)"} strokeWidth={1} />
                {(hot || (!day && upp < 0.5)) && label(`${ps.n} · ${ps.alt.toLocaleString()} m`, 0, -11, 10.5)}
              </g>
            ); })}
          {/* peaks with their heights */}
          {DK_PEAKS.map((pk) => { const p = dkrProject(pk.lng, pk.lat, pk.alt);
            return (
              <g key={pk.n} transform={`translate(${p.x} ${p.y}) scale(${upp})`} style={{ pointerEvents: "none" }}>
                <path d="M0 -10 L7 2 L-7 2 Z" fill="#fff" stroke="rgba(0,0,0,.6)" strokeWidth={1} />
                {label(`${pk.n} · ${pk.alt.toLocaleString()} m`, 0, -14, 10.5)}
              </g>
            ); })}
          {/* the stops */}
          {stops.map((st) => { const t = DK_TOWNS[st.key]; const on = day && (day.night === st.key || day.to === st.key); const p = dkrProject(t.lng, t.lat, t.alt + 60); const r = on ? 13 : 10;
            return (
              <g key={st.key} transform={`translate(${p.x} ${p.y}) scale(${upp})`} role="button" aria-label={`Stop ${st.n}: ${t.n}`} style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onSelect && onSelect(on ? null : st.day); }}>
                {on && <circle r={r + 7} fill="rgba(122,46,46,.22)" />}
                <circle r={r} fill={on ? "#7A2E2E" : "#0066CC"} stroke="#fff" strokeWidth={2} />
                <text y={4} fontSize={11} fontWeight={700} textAnchor="middle" fill="#fff" style={{ fontFamily: "-apple-system, Inter, system-ui, sans-serif" }}>{st.n}</text>
                {(on || wide || upp < 0.55) && label(t.n, 0, r + 13, 10.5, 600)}
              </g>
            ); })}
        </svg>
        {!img && <div className="absolute inset-0 flex items-center justify-center" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.muted }}>Drawing the relief…</div>}
        <div className="absolute left-2 top-2" style={{ position: "absolute", left: 8, top: 8, zIndex: 5, display: "inline-flex", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.92)", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} onClick={(e) => e.stopPropagation()}>
          <span className="px-2.5 h-7 text-[11px] font-semibold" style={{ padding: "0 10px", height: 28, display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, background: C.pine, color: "#fff" }}>Relief</span>
          {!fallbackNote && terrainOK && <button type="button" onClick={() => pickMode("terrain")} className="tap px-2.5 h-7 text-[11px] font-semibold" style={{ padding: "0 10px", height: 28, fontSize: 11, fontWeight: 600, background: "transparent", color: C.ink, border: 0 }}>Terrain</button>}
          {!fallbackNote && <button type="button" onClick={() => pickMode("satellite")} className="tap px-2.5 h-7 text-[11px] font-semibold" style={{ padding: "0 10px", height: 28, fontSize: 11, fontWeight: 600, background: "transparent", color: C.ink, border: 0 }}>Satellite</button>}
        </div>
        {note && wide && (
          <div className="absolute right-2 top-2 dk-note-side" style={{ position: "absolute", right: 8, top: 8, width: 250, maxHeight: "calc(100% - 16px)", overflowY: "auto", zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
            <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
          </div>
        )}
        {note && !wide && (
          <div className="absolute left-2 right-2 bottom-2 dk-note-over" style={{ position: "absolute", left: 8, right: 8, bottom: 8, maxHeight: "48%", overflowY: "auto", zIndex: 6 }} onClick={(e) => e.stopPropagation()}>
            <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
          </div>
        )}
        {!selected && <div className="absolute left-2 bottom-2" style={{ position: "absolute", left: 8, bottom: 8, fontSize: 10.5, borderRadius: 6, padding: "4px 8px", pointerEvents: "none", background: "rgba(255,255,255,.9)", color: C.muted, zIndex: 5 }}>Tap a day or a stop to fly in</div>}
        <div style={{ position: "absolute", right: 8, bottom: 6, fontSize: 9, color: "rgba(255,255,255,.85)", textShadow: "0 0 3px rgba(0,0,0,.8)", pointerEvents: "none" }}>Stylised relief · heights surveyed</div>
      </div>
      {fallbackNote && <div className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>{fallbackNote}</div>}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {stops.map((st) => { const on = day && (day.night === st.key || day.to === st.key);
          return (
            <button key={st.key} type="button" onClick={() => onSelect && onSelect(on ? null : st.day)} className="tap inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 text-[12px]"
              style={{ background: on ? C.pineSoft : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? C.pine : C.muted }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: on ? C.pine : C.grey, color: on ? "#fff" : C.ink }}>{st.n}</span>{DK_TOWNS[st.key].n}
            </button>
          ); })}
      </div>
    </div>
  );
}

/* ── Terrain: a real 3-D model of western Bhutan (Paro · Haa · Thimphu · Punakha · Wangdue · Gangtey).
   Heights come from the Copernicus 30 m elevation model, roads and rivers from OpenStreetMap — prepared from the
   Astra terrain explorer and reduced to three small files in /public (terrain-west-v1.*) that are fetched only when this view is
   opened (about 1 MB once, then cached for a year). The renderer (three.js) loads from the CDN on demand, so the
   app bundle does not grow. If anything fails — no WebGL, no network — the relief model takes over. ── */
const DK_TERRAIN = { base: "/terrain-west-v1", W: 89.25, E: 90.38, S: 27.2, N: 27.88 };   // files: terrain-west-v1.json, -h.webp (heights), .webp (colour)
const DK_THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js";
const DK_TERRAIN_PREF = "bth_map_mode";
function dkTerrainCovers(plan) {
  const m = 0.005;
  const inside = (p) => p && p.lng >= DK_TERRAIN.W + m && p.lng <= DK_TERRAIN.E - m && p.lat >= DK_TERRAIN.S + m && p.lat <= DK_TERRAIN.N - m;
  let any = false;
  for (const d of (plan && plan.days) || []) {
    for (const k of [d.from, d.to, d.night]) if (k && DK_TOWNS[k]) { any = true; if (!inside(DK_TOWNS[k])) return false; }
    for (const p of d.pts || []) { any = true; if (!inside(p)) return false; }
  }
  return any;
}
let _threeP = null;
function loadThree() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.THREE) return Promise.resolve(window.THREE);
  if (_threeP) return _threeP;
  _threeP = new Promise((resolve, reject) => {
    const sc = document.createElement("script"); sc.src = DK_THREE_URL; sc.async = true;
    sc.onload = () => (window.THREE ? resolve(window.THREE) : reject(new Error("three.js did not initialise")));
    sc.onerror = () => { _threeP = null; reject(new Error("three.js failed to load")); };
    document.head.appendChild(sc);
  });
  return _threeP;
}
let _terrainP = null;
function loadTerrainData() {
  if (_terrainP) return _terrainP;
  const img = (src) => new Promise((res, rej) => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im); im.onerror = () => rej(new Error("could not load " + src)); im.src = src; });
  _terrainP = Promise.all([
    fetch(DK_TERRAIN.base + ".json").then((r) => { if (!r.ok) throw new Error("terrain data " + r.status); return r.json(); }),
    img(DK_TERRAIN.base + "-h.webp"),
    img(DK_TERRAIN.base + ".webp"),
  ]).then(([meta, hImg, tex]) => {
    const C = meta.cols, R = meta.rows;
    if (hImg.naturalWidth !== C || hImg.naturalHeight !== R) throw new Error("terrain heights do not match the grid");
    const cv = document.createElement("canvas"); cv.width = C; cv.height = R;
    const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(hImg, 0, 0);
    const px = g.getImageData(0, 0, C, R).data;
    const heights = new Float32Array(C * R);
    for (let i = 0; i < C * R; i++) heights[i] = px[i * 4] * 256 + px[i * 4 + 1];   // metres = R*256 + G (lossless)
    const u = meta.unit || 1e-5, W0 = meta.bounds[0], S0 = meta.bounds[1];
    const dec = (arr) => { const out = []; let x = 0, y = 0; for (let i = 0; i + 1 < arr.length; i += 2) { x += arr[i]; y += arr[i + 1]; out.push([W0 + x * u, S0 + y * u]); } return out; };
    return {
      bounds: meta.bounds, cols: C, rows: R, widthM: meta.widthM, heightM: meta.heightM, credit: meta.credit || {}, heights, tex,
      roads: (meta.roads || []).map((r) => ({ c: r.c, pts: dec(r.p) })),
      rivers: (meta.rivers || []).map((r) => ({ n: r.n, pts: dec(r.p) })),
      contours: (meta.contours || []).map((c) => ({ e: c.e, pts: dec(c.p) })),
    };
  }).catch((e) => { _terrainP = null; throw e; });
  return _terrainP;
}

/* The scene itself: plain three.js driven through a small imperative handle, so React only owns the overlays. */
function dkTerrainScene(THREE, D, el, labelsEl, cb) {
  const B = D.bounds, W = D.widthM, H = D.heightM, C = D.cols, R = D.rows, heights = D.heights;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t, DEG = Math.PI / 180, DIAG = Math.hypot(W, H);
  let minH = Infinity, maxH = -Infinity; for (let i = 0; i < heights.length; i++) { if (heights[i] < minH) minH = heights[i]; if (heights[i] > maxH) maxH = heights[i]; }
  const floorH = Math.floor(minH / 500) * 500 - 250, spacing = Math.max(W / (C - 1), H / (R - 1));
  const toWorld = (lon, lat) => ({ x: ((lon - B[0]) / (B[2] - B[0]) - 0.5) * W, z: (0.5 - (lat - B[1]) / (B[3] - B[1])) * H });
  const toGeo = (x, z) => ({ lon: B[0] + (x / W + 0.5) * (B[2] - B[0]), lat: B[3] - (z / H + 0.5) * (B[3] - B[1]) });
  const meshHeight = (x, z) => { const u = clamp(x / W + 0.5, 0, 1) * (C - 1), v = clamp(z / H + 0.5, 0, 1) * (R - 1), c = Math.min(C - 2, Math.floor(u)), r = Math.min(R - 2, Math.floor(v)), fx = u - c, fy = v - r, i = r * C + c; const h00 = heights[i], h10 = heights[i + 1], h01 = heights[i + C], h11 = heights[i + C + 1]; const h = fx + fy <= 1 ? h00 + fx * (h10 - h00) + fy * (h01 - h00) : h11 + (1 - fx) * (h01 - h11) + (1 - fy) * (h10 - h11); return h - floorH; };

  const scene = new THREE.Scene(); scene.background = new THREE.Color("#e7eee6");
  const camera = new THREE.PerspectiveCamera(38, 1, 10, DIAG * 20);
  const phone = typeof matchMedia !== "undefined" && matchMedia("(max-width: 700px)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });   // throws without WebGL
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor("#e7eee6");
  const canvas = renderer.domElement; canvas.style.display = "block"; canvas.style.width = "100%"; canvas.style.height = "100%"; canvas.style.touchAction = "pan-y";   // vertical swipes scroll the page; sideways swipes and two fingers reach the terrain canvas.setAttribute("aria-label", "3-D terrain of western Bhutan with the planned route");
  el.appendChild(canvas);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b9177, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 0.65); sun.position.set(-W, Math.max(W, H), H / 2); scene.add(sun);

  // the ground
  const vtx = new Float32Array(C * R * 3), uv = new Float32Array(C * R * 2), index = new Uint32Array((C - 1) * (R - 1) * 6);
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const i = r * C + c; vtx[i * 3] = (c / (C - 1) - 0.5) * W; vtx[i * 3 + 1] = heights[i] - floorH; vtx[i * 3 + 2] = (r / (R - 1) - 0.5) * H; uv[i * 2] = c / (C - 1); uv[i * 2 + 1] = 1 - r / (R - 1); }
  let k = 0; for (let r = 0; r < R - 1; r++) for (let c = 0; c < C - 1; c++) { const i = r * C + c; index[k++] = i; index[k++] = i + C; index[k++] = i + 1; index[k++] = i + 1; index[k++] = i + C; index[k++] = i + C + 1; }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(vtx, 3)); geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geometry.setIndex(new THREE.BufferAttribute(index, 1)); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  const texture = new THREE.Texture(D.tex); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); texture.needsUpdate = true;
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: texture, side: THREE.FrontSide });
  const terrain = new THREE.Mesh(geometry, groundMat); scene.add(terrain);
  // the skirt: a wall down from the edges, so the block reads as a slab
  const edge = []; for (let c = 0; c < C; c++) edge.push(c); for (let r = 1; r < R; r++) edge.push(r * C + C - 1); for (let c = C - 2; c >= 0; c--) edge.push((R - 1) * C + c); for (let r = R - 2; r > 0; r--) edge.push(r * C);
  const sk = []; for (let n = 0; n < edge.length; n++) { const a = edge[n], b = edge[(n + 1) % edge.length]; const ax = vtx[a * 3], ay = vtx[a * 3 + 1], az = vtx[a * 3 + 2], bx = vtx[b * 3], by = vtx[b * 3 + 1], bz = vtx[b * 3 + 2]; sk.push(ax, ay, az, bx, by, bz, ax, 0, az, bx, by, bz, bx, 0, bz, ax, 0, az); }
  const skirtGeo = new THREE.BufferGeometry(); skirtGeo.setAttribute("position", new THREE.Float32BufferAttribute(sk, 3)); skirtGeo.computeVertexNormals();
  const skirt = new THREE.Mesh(skirtGeo, new THREE.MeshLambertMaterial({ color: 0x8b9d78, side: THREE.DoubleSide })); scene.add(skirt);

  // lines draped on the ground
  const clipSeg = (a, b) => { let x0 = a.x, z0 = a.z, x1 = b.x, z1 = b.z; const dx = x1 - x0, dz = z1 - z0; let t0 = 0, t1 = 1; const p = [-dx, dx, -dz, dz], q = [x0 + W / 2, W / 2 - x0, z0 + H / 2, H / 2 - z0]; for (let i = 0; i < 4; i++) { if (Math.abs(p[i]) < 1e-10) { if (q[i] < 0) return null; } else { const t = q[i] / p[i]; if (p[i] < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t); if (t0 > t1) return null; } } return [{ x: x0 + t0 * dx, z: z0 + t0 * dz }, { x: x0 + t1 * dx, z: z0 + t1 * dz }]; };
  const ribbon = (paths, width, color, lift, opacity, over) => {   // over: drawn on top of the ground, like ink on a map
    const verts = [];
    for (const path of paths) for (let i = 1; i < path.length; i++) {
      const seg = clipSeg(toWorld(path[i - 1][0], path[i - 1][1]), toWorld(path[i][0], path[i][1])); if (!seg) continue;
      const [a, b] = seg, dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz); if (len < 0.1) continue;
      const nx = -dz / len * width / 2, nz = dx / len * width / 2, n = Math.max(1, Math.ceil(len / (spacing * 0.85)));
      for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n, x0 = lerp(a.x, b.x, t0), z0 = lerp(a.z, b.z, t0), x1 = lerp(a.x, b.x, t1), z1 = lerp(a.z, b.z, t1);
        const A = [x0 + nx, meshHeight(x0 + nx, z0 + nz) + lift, z0 + nz], Q = [x0 - nx, meshHeight(x0 - nx, z0 - nz) + lift, z0 - nz], E = [x1 + nx, meshHeight(x1 + nx, z1 + nz) + lift, z1 + nz], F = [x1 - nx, meshHeight(x1 - nx, z1 - nz) + lift, z1 - nz];
        verts.push(...A, ...E, ...Q, ...Q, ...E, ...F); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: opacity < 1, opacity, depthWrite: false, depthTest: !over }));
  };
  const carto = 85;   // metres: about one screen pixel when a day fills the view
  const base = new THREE.Group(); scene.add(base);
  const roadPaths = D.roads.map((r) => r.pts), riverPaths = D.rivers.map((r) => r.pts);
  const roadBack = ribbon(roadPaths, carto * 1.8, 0xfff9df, 15, 1); roadBack.renderOrder = 3; base.add(roadBack);
  const road = ribbon(roadPaths, carto, 0xbb903e, 18, 1); road.renderOrder = 4; base.add(road);
  const river = ribbon(riverPaths, carto * 1.3, 0x3789a4, 13, 0.97); river.renderOrder = 2; base.add(river);
  { const cl = []; for (const c of D.contours) for (let i = 1; i < c.pts.length; i++) { const seg = clipSeg(toWorld(c.pts[i - 1][0], c.pts[i - 1][1]), toWorld(c.pts[i][0], c.pts[i][1])); if (!seg) continue; const n = Math.max(1, Math.ceil(Math.hypot(seg[1].x - seg[0].x, seg[1].z - seg[0].z) / (spacing * 0.8))); for (let j = 0; j < n; j++) for (const t of [j / n, (j + 1) / n]) { const x = lerp(seg[0].x, seg[1].x, t), z = lerp(seg[0].z, seg[1].z, t); cl.push(x, meshHeight(x, z) + 7, z); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(cl, 3)); const o = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x705935, transparent: true, opacity: 0.42, depthWrite: false })); o.renderOrder = 1; base.add(o); }
  // the trip: the whole route, and the selected day on top of it
  const trip = new THREE.Group(); scene.add(trip);
  const dayGroup = new THREE.Group(); scene.add(dayGroup);
  const clearGroup = (g) => { for (const o of [...g.children]) { o.geometry.dispose(); o.material.dispose(); g.remove(o); } };

  // labels are HTML, placed each frame
  const labels = [];   // { el, lon, lat, lift, w, h, kind, prio }
  const clearLabels = () => { for (const l of labels) if (l.kind !== "pick") l.el.remove(); labels.length = 0; };   // the elevation chip is kept
  const addLabel = (node, lon, lat, lift, kind, prio) => { labelsEl.appendChild(node); labels.push({ el: node, lon, lat, lift, kind, prio, w: 0, h: 0 }); };
  let measure = true, layoutMode = "phone", hasDay = false;
  // screen areas the overlays occupy: the view toggle, and the zoom buttons (left on wide screens; bottom-right on phones while no day is open)
  const reserved = () => [{ x: 0, y: 0, w: 150, h: 40 }, layoutMode === "wide" ? { x: 0, y: 40, w: 48, h: 100 } : hasDay ? { x: 0, y: size.h * 0.5, w: size.w, h: size.h * 0.5 } : { x: size.w - 48, y: size.h - 130, w: 48, h: 130 }];

  // the camera
  const st = { az: -18 * DEG, tilt: 55 * DEG, dist: DIAG, tx: 0, tz: 0 };
  const size = { w: 1, h: 1 };
  const tanV = Math.tan(19 * DEG);
  const fitDist = () => { const aspect = size.w / size.h; return Math.max(W / (2 * tanV * aspect), H / (2 * tanV)) * 1.1 + DIAG * 0.14; };
  let pending = false, tween = null, frames = 0, disposed = false;
  const proj = new THREE.Vector3();
  const project = (x, y, z) => { proj.set(x, y, z).project(camera); return { x: (proj.x * 0.5 + 0.5) * size.w, y: (-0.5 * proj.y + 0.5) * size.h, z: proj.z }; };
  const occluded = (x, y, z) => { for (let i = 1; i < 20; i++) { const t = i / 20, px = lerp(x, camera.position.x, t), pz = lerp(z, camera.position.z, t); if (Math.abs(px) > W / 2 || Math.abs(pz) > H / 2) continue; if (meshHeight(px, pz) > lerp(y, camera.position.y, t) + 30) return true; } return false; };
  const updateCamera = () => {
    st.tx = clamp(st.tx, -W * 0.65, W * 0.65); st.tz = clamp(st.tz, -H * 0.65, H * 0.65);
    const y = meshHeight(st.tx, st.tz);
    camera.position.set(st.tx + st.dist * Math.sin(st.tilt) * Math.sin(st.az), y + st.dist * Math.cos(st.tilt), st.tz + st.dist * Math.sin(st.tilt) * Math.cos(st.az));
    if (Math.abs(camera.position.x) < W / 2 && Math.abs(camera.position.z) < H / 2) camera.position.y = Math.max(camera.position.y, meshHeight(camera.position.x, camera.position.z) + Math.max(150, st.dist * 0.02));
    camera.lookAt(st.tx, y, st.tz); camera.updateMatrixWorld();
  };
  const updateLabels = () => {
    if (measure) { for (const l of labels) { l.w = l.el.offsetWidth || 80; l.h = l.el.offsetHeight || 24; } measure = false; }
    const placed = reserved();
    const sorted = [...labels].sort((a, b) => b.prio - a.prio);
    for (const l of sorted) {
      const p = toWorld(l.lon, l.lat), y = meshHeight(p.x, p.z) + l.lift, q = project(p.x, y, p.z);
      const rect = { x: q.x - l.w / 2 - 1, y: q.y - l.h - 1, w: l.w + 2, h: l.h + 2 };
      let hidden = q.z < -1 || q.z > 1 || rect.x < 2 || rect.x + rect.w > size.w - 2 || rect.y < 2 || q.y > size.h - 6 || (l.kind !== "pick" && occluded(p.x, y, p.z));
      if (!hidden && l.kind !== "pick") for (const a of placed) if (rect.x < a.x + a.w && rect.x + rect.w > a.x && rect.y < a.y + a.h && rect.y + rect.h > a.y) { hidden = true; break; }
      if (!hidden) placed.push(rect);
      l.el.style.visibility = hidden ? "hidden" : "visible"; l.el.style.transform = `translate(${q.x}px, ${q.y}px) translate(-50%, -100%)`;
    }
  };
  const render = (now) => {
    pending = false; if (disposed) return;
    if (tween) { const t = clamp((now - tween.start) / tween.dur, 0, 1), e = 1 - Math.pow(1 - t, 3); for (const key of Object.keys(tween.to)) st[key] = lerp(tween.from[key], tween.to[key], e); if (t >= 1) tween = null; }
    updateCamera(); renderer.render(scene, camera); updateLabels(); frames++;
    if (frames === 1 && cb.onFirstFrame) cb.onFirstFrame(renderer);
    if (tween) requestRender();
  };
  const requestRender = () => { if (!pending && !disposed) { pending = true; requestAnimationFrame(render); } };
  const animateTo = (to, dur) => { const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduce || !dur) { Object.assign(st, to); tween = null; requestRender(); return; } const from = {}; for (const key of Object.keys(to)) from[key] = st[key]; tween = { from, to, start: performance.now(), dur }; requestRender(); };
  const resize = () => { size.w = Math.max(1, el.clientWidth); size.h = Math.max(1, el.clientHeight); renderer.setSize(size.w, size.h, false); camera.aspect = size.w / size.h; camera.updateProjectionMatrix(); measure = true; requestRender(); };
  resize(); st.dist = fitDist() * 0.83;

  // the elevation chip
  const pickEl = document.createElement("div"); pickEl.className = "dk-ter-pick"; pickEl.style.visibility = "hidden"; labelsEl.appendChild(pickEl);
  const pick = { el: pickEl, lon: 0, lat: 0, lift: 25, kind: "pick", prio: 99, w: 0, h: 0 };
  const showPick = (lon, lat) => { const p = toWorld(lon, lat); const m = meshHeight(p.x, p.z) + floorH; pickEl.textContent = `≈ ${Math.round(m / 10) * 10} m`; pick.lon = lon; pick.lat = lat; if (!labels.includes(pick)) labels.push(pick); measure = true; requestRender(); };
  const hidePick = () => { const i = labels.indexOf(pick); if (i >= 0) labels.splice(i, 1); pickEl.style.visibility = "hidden"; requestRender(); };
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const inspect = (cx, cy) => { const r = canvas.getBoundingClientRect(); mouse.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); updateCamera(); ray.setFromCamera(mouse, camera); const hits = ray.intersectObject(terrain, false); if (hits.length) { const g = toGeo(hits[0].point.x, hits[0].point.z); showPick(g.lon, g.lat); } else hidePick(); };

  // gestures — whatever you touch moves with your finger.
  //   touch: one finger sideways turns the terrain (up and down stay with the page scroll); two fingers move, pinch and
  //          turn it, holding the ground under them; a tap shows the height.
  //   mouse: drag turns and tips it; right-drag or shift-drag moves it; the wheel zooms.
  // Turning pivots on the centre of the view, so the part above the centre and the part below it move in opposite
  // directions; the direction is chosen from where the drag starts, so the part under the finger goes the finger's way.
  const pointers = new Map(); let tap = null, gesture = null, pair = null;
  const zoom = (f) => { tween = null; st.dist = clamp(st.dist * f, DIAG * 0.06, DIAG * 3); requestRender(); };
  // fallback move (used only when no ground is under the pointer): a screen pixel up the view covers more ground than one across
  const pan = (dx, dy) => { const m = st.dist * 2 * tanV / size.h, my = m / Math.max(0.25, Math.cos(st.tilt)), ca = Math.cos(st.az), sa = Math.sin(st.az); st.tx -= dx * m * ca + dy * my * sa; st.tz += dx * m * sa - dy * my * ca; requestRender(); };
  const aim = (px, py) => { updateCamera(); const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return false; mouse.set((px - r.left) / r.width * 2 - 1, -(py - r.top) / r.height * 2 + 1); ray.setFromCamera(mouse, camera); return true; };
  // the height of the real ground under a screen position (once, when a hand goes down), or null over the sky
  const surfaceAt = (px, py) => { if (!aim(px, py)) return null; const hits = ray.intersectObject(terrain, false); return hits.length ? hits[0].point.y : null; };
  // the point at height h (default: the view's centre) under a screen position, or null when that is sky
  const groundAt = (px, py, h) => {
    if (!aim(px, py)) return null;
    const o = ray.ray.origin, d = ray.ray.direction, y = h == null ? meshHeight(st.tx, st.tz) : h;
    if (d.y > -0.02) return null;
    const t = (y - o.y) / d.y; if (!(t > 0) || t > DIAG * 3) return null;
    return { x: o.x + d.x * t, z: o.z + d.z * t };
  };
  // move the view so that ground point g (at height h) sits under screen position (px, py); the view rides on the terrain,
  // so its height changes as it moves — a second and third pass take that up
  const hold = (g, px, py, h) => {
    if (!g) return false;
    for (let k = 0; k < 3; k++) { const g1 = groundAt(px, py, h); if (!g1) return k > 0; const ex = g.x - g1.x, ez = g.z - g1.z; st.tx += ex; st.tz += ez; if (Math.hypot(ex, ez) < 1) break; }
    requestRender(); return true;
  };
  const pairState = () => { const [a, b] = [...pointers.values()]; return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x) }; };
  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 2) return;
    tween = null; try { canvas.setPointerCapture(e.pointerId); } catch (_e) {}
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      tap = { x: e.clientX, y: e.clientY, moved: false, t: performance.now() }; pair = null;
      const isMouse = e.pointerType === "mouse";
      if (isMouse && (e.button === 2 || e.shiftKey)) { const h = surfaceAt(e.clientX, e.clientY); gesture = { kind: "move", h, g: groundAt(e.clientX, e.clientY, h) }; }
      else { const r = canvas.getBoundingClientRect(); gesture = { kind: "turn", side: e.clientY - r.top <= r.height / 2 ? 1 : -1, tilt: isMouse }; }
    } else { if (tap) tap.moved = true; gesture = null; pair = pointers.size === 2 ? pairState() : null; if (pair) pair.h = surfaceAt(pair.cx, pair.cy); }
  };
  const onMove = (e) => {
    const prev = pointers.get(e.pointerId); if (!prev) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 6) tap.moved = true;
    if (pointers.size === 2 && pair) {
      const now = pairState(), g = groundAt(pair.cx, pair.cy, pair.h);
      if (pair.d > 0 && now.d > 0) st.dist = clamp(st.dist * pair.d / now.d, DIAG * 0.06, DIAG * 3);
      let da = now.ang - pair.ang; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; st.az += da;
      if (!hold(g, now.cx, now.cy, pair.h)) pan(now.cx - pair.cx, now.cy - pair.cy);
      now.h = pair.h; pair = now; tween = null; requestRender();
    } else if (pointers.size === 1 && gesture) {
      if (gesture.kind === "move") { if (!hold(gesture.g, e.clientX, e.clientY, gesture.h)) pan(dx, dy); }
      else { st.az += dx * 0.006 * gesture.side; if (gesture.tilt) st.tilt = clamp(st.tilt + dy * 0.004 * gesture.side, 15 * DEG, 70 * DEG); requestRender(); }
    }
  };
  const onUp = (e, cancel) => { if (!pointers.has(e.pointerId)) return; const isTap = !cancel && pointers.size === 1 && tap && !tap.moved && performance.now() - tap.t < 600; pointers.delete(e.pointerId); try { canvas.releasePointerCapture(e.pointerId); } catch (_e) {} pair = null; gesture = null; if (pointers.size) { if (tap) tap.moved = true; } else settle(); if (isTap) inspect(e.clientX, e.clientY); };
  const onUpEv = (e) => onUp(e, false);
  const onCancel = (e) => onUp(e, true);
  const onTouch = (e) => { if (e.touches && e.touches.length >= 2 && e.cancelable) e.preventDefault(); };   // two fingers belong to the terrain, not the page
  const onWheel = (e) => { e.preventDefault(); zoom(Math.exp(clamp(e.deltaY, -200, 200) * 0.0015)); clearTimeout(wheelTimer); wheelTimer = setTimeout(settle, 250); };
  const onCtx = (e) => e.preventDefault();
  canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerup", onUpEv); canvas.addEventListener("pointercancel", onCancel); canvas.addEventListener("wheel", onWheel, { passive: false }); canvas.addEventListener("contextmenu", onCtx);
  canvas.addEventListener("touchstart", onTouch, { passive: false }); canvas.addEventListener("touchmove", onTouch, { passive: false });
  const onLost = (e) => { e.preventDefault(); if (cb.onLost) cb.onLost(); };
  canvas.addEventListener("webglcontextlost", onLost);
  let ro = null; if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(resize); ro.observe(el); } else window.addEventListener("resize", resize);

  // the public handle
  let planPath = [], dayPath = null, builtDist = st.dist, wheelTimer = null;
  const mpp = (dist) => 2 * dist * tanV / size.h;   // metres per screen pixel at the camera target
  const buildDay = (dist) => { clearGroup(dayGroup); if (!dayPath) return; const m = mpp(dist); const back = ribbon([dayPath], m * 8, 0xffffff, 28, 0.95, true); back.renderOrder = 7; dayGroup.add(back); const line = ribbon([dayPath], m * 4.5, 0x7a2e2e, 31, 0.98, true); line.renderOrder = 8; dayGroup.add(line); };
  // after the user zooms a long way, the route lines are rebuilt so they keep their width on screen
  const settle = () => { if (disposed || Math.abs(Math.log(st.dist / builtDist)) < Math.log(1.6)) return; builtDist = st.dist; buildTrip(st.dist, !!dayPath || hasDay); buildDay(st.dist); requestRender(); };
  const buildTrip = (dist, dim) => { clearGroup(trip); builtDist = dist; if (planPath.length < 2) return; const m = mpp(dist); const back = ribbon([planPath], m * 6, 0xffffff, 22, dim ? 0.5 : 0.9, true); back.renderOrder = 5; trip.add(back); const line = ribbon([planPath], m * 3.4, 0x7a2e2e, 25, dim ? 0.45 : 0.98, true); line.renderOrder = 6; trip.add(line); };
  const api = {
    setPlan(routePts, stops, passes) {
      clearLabels();
      planPath = routePts.map((p) => [p.lng, p.lat]);
      buildTrip(st.dist, false);
      for (const s of stops) { const t = DK_TOWNS[s.key]; if (!t) continue; const node = document.createElement("button"); node.type = "button"; node.className = "dk-ter-stop"; node.setAttribute("aria-label", `Stop ${s.n}: ${t.n}`); node.dataset.key = s.key; node.innerHTML = `<span class="dk-ter-n">${s.n}</span><span>${t.n}</span>`; node.addEventListener("click", (e) => { e.stopPropagation(); cb.onStop(s); }); addLabel(node, t.lng, t.lat, 30, "stop", 10 - s.n * 0.01); }
      for (const pk of passes) { const ps = DK_PASSES[pk]; if (!ps) continue; const node = document.createElement("div"); node.className = "dk-ter-pass"; node.textContent = `${ps.n} · ${ps.alt.toLocaleString()} m`; addLabel(node, ps.lng, ps.lat, 30, "pass", 5); }
      for (const pk of DK_PEAKS) { if (pk.lng < B[0] || pk.lng > B[2] || pk.lat < B[1] || pk.lat > B[3]) continue; const node = document.createElement("div"); node.className = "dk-ter-pass"; node.textContent = `▲ ${pk.n} · ${pk.alt.toLocaleString()} m`; addLabel(node, pk.lng, pk.lat, 60, "peak", 4); }
      measure = true; requestRender();
    },
    setDay(day, layout) {
      clearGroup(dayGroup); hidePick(); layoutMode = layout; hasDay = !!day;
      for (const l of labels) if (l.kind === "stop") l.el.classList.toggle("on", !!(day && (day.night === l.el.dataset.key || day.to === l.el.dataset.key)));
      let pts = [];
      if (day) {
        if (day.moving && day.pts && day.pts.length > 1) pts = day.pts;
        else { const t = DK_TOWNS[day.night || day.to || day.from]; if (t) pts = [t]; }
      }
      dayPath = null;
      if (!pts.length) { const dist = fitDist() * 0.83; buildTrip(dist, false); animateTo({ tx: 0, tz: 0, az: -18 * DEG, tilt: 55 * DEG, dist }, 750); return; }
      const ws = pts.map((p) => toWorld(p.lng, p.lat)); const xs = ws.map((p) => p.x), zs = ws.map((p) => p.z);
      let cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      const ex = Math.max(...xs) - Math.min(...xs) + 5000, ez = Math.max(...zs) - Math.min(...zs) + 5000, aspect = size.w / size.h;
      // the ideas card covers the lower half on phones and the right side on wide screens: fit the day into what is left
      const dist = clamp(Math.max(ex / (2 * tanV * aspect) * (layout === "wide" ? 1.9 : 1.3), ez / (2 * tanV) * (layout === "phone" ? 2.6 : 1.3)), DIAG * 0.14, DIAG * 0.9);
      const az = -18 * DEG, tilt = 52 * DEG;
      if (layout === "phone") { const sft = 0.5 * dist * tanV / Math.sin(tilt); cx += Math.sin(az) * sft; cz += Math.cos(az) * sft; }
      else if (layout === "wide") { const sft = 0.28 * dist * tanV * aspect; cx += Math.cos(az) * sft; cz -= Math.sin(az) * sft; }
      buildTrip(dist, true);
      dayPath = day.moving && day.pts && day.pts.length > 1 ? day.pts.map((p) => [p.lng, p.lat]) : null; buildDay(dist);
      animateTo({ tx: cx, tz: cz, az, tilt, dist }, 750);
    },
    zoom(f) { zoom(f); clearTimeout(wheelTimer); wheelTimer = setTimeout(settle, 250); },
    reset() { animateTo({ az: -18 * DEG, tilt: 55 * DEG }, 500); },
    dispose() {
      disposed = true; tween = null; clearTimeout(wheelTimer);
      canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUpEv); canvas.removeEventListener("pointercancel", onCancel); canvas.removeEventListener("wheel", onWheel); canvas.removeEventListener("contextmenu", onCtx); canvas.removeEventListener("touchstart", onTouch); canvas.removeEventListener("touchmove", onTouch); canvas.removeEventListener("webglcontextlost", onLost);
      if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      clearGroup(trip); clearGroup(dayGroup); clearGroup(base); clearLabels(); pickEl.remove();
      geometry.dispose(); groundMat.dispose(); texture.dispose(); skirtGeo.dispose(); skirt.material.dispose();
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (_e) {} canvas.remove();
    },
  };
  return api;
}

function DkTerrainMap({ plan, selected, onSelect, onBack }) {
  const boxRef = useRef(null), sceneRef = useRef(null), labelsRef = useRef(null), apiRef = useRef(null);
  const [box, setBox] = useState({ w: 360, h: 270 });
  const [status, setStatus] = useState("loading");   // loading | ready | failed
  const [notice, setNotice] = useState(null);
  const [credit, setCredit] = useState(false);
  const day = selected ? plan.days.find((d) => d.day === selected) : null;
  const wide = box.w >= 560;
  const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const selRef = useRef(selected); selRef.current = selected;
  const stops = useMemo(() => { const out = []; const seen = new Set(); for (const d of plan.days) if (d.night && !seen.has(d.night)) { seen.add(d.night); out.push({ key: d.night, n: out.length + 1, day: d.day }); } return out; }, [plan]);
  const routePts = useMemo(() => { const pts = []; for (const d of plan.days) for (const p of d.pts || []) { const last = pts[pts.length - 1]; if (!last || last.lat !== p.lat || last.lng !== p.lng) pts.push(p); } return pts; }, [plan]);
  const passesOnRoute = useMemo(() => { const set = new Set(); for (const d of plan.days) for (const pk of d.passes || []) set.add(pk); return [...set]; }, [plan]);

  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const check = () => { const r = el.getBoundingClientRect(); if (r.width > 0) setBox({ w: r.width, h: r.height }); };
    check(); if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }
    const ro = new ResizeObserver(check); ro.observe(el); return () => ro.disconnect();
  }, []);

  const fail = (msg) => { try { localStorage.removeItem(DK_TERRAIN_PREF); } catch (_e) {} setNotice(msg); setStatus("failed"); };
  // boot: renderer and data in parallel, then the scene; anything wrong hands over to the relief model
  useEffect(() => {
    let on = true, api = null;
    const timer = setTimeout(() => { if (on && !api) fail("The 3-D terrain is taking too long to load — showing the relief model."); }, 25000);
    Promise.all([loadThree(), loadTerrainData()]).then(([THREE, D]) => {
      if (!on || !sceneRef.current) return;
      try {
        api = dkTerrainScene(THREE, D, sceneRef.current, labelsRef.current, {
          onStop: (s) => { const cur = selRef.current; onSelectRef.current && onSelectRef.current(cur === s.day ? null : s.day); },
          onLost: () => { if (on) fail("The graphics on this device paused — showing the relief model."); },
          onFirstFrame: (renderer) => {
            // a drawn frame should not be the bare background at the centre; if it is, the device did not really draw
            try { const gl = renderer.getContext(); const px = new Uint8Array(4); gl.readPixels(Math.floor(gl.drawingBufferWidth / 2), Math.floor(gl.drawingBufferHeight / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
              if (Math.abs(px[0] - 231) < 3 && Math.abs(px[1] - 238) < 3 && Math.abs(px[2] - 230) < 3) fail("The 3-D terrain could not be drawn on this device — showing the relief model."); } catch (_e) {}
          },
        });
      } catch (e) { fail("This device cannot draw 3-D terrain — showing the relief model."); return; }
      apiRef.current = api; setStatus("ready");
    }).catch(() => { if (on) fail("The 3-D terrain could not be loaded on this connection — showing the relief model."); });
    return () => { on = false; clearTimeout(timer); if (api) api.dispose(); apiRef.current = null; };
  }, []);
  useEffect(() => { if (status === "ready" && apiRef.current) apiRef.current.setPlan(routePts, stops, passesOnRoute); }, [status, routePts, stops, passesOnRoute]);
  useEffect(() => { if (status === "ready" && apiRef.current) apiRef.current.setDay(day, wide ? "wide" : "phone"); }, [status, day, wide]);

  // Drukpah's notes for the selected day
  let note = null;
  if (day) {
    const townKey = day.night || day.to || day.from; const town = DK_TOWNS[townKey];
    const planned = (day.acts || []).map((a) => String(a).toLowerCase());
    const ideas = (DK_SEE[townKey] || []).filter((x) => !planned.some((a) => a.includes(x.t.toLowerCase().split(",")[0]))).slice(0, 3);
    note = { town, ideas, passes: [], planned: (day.acts || []).length, profile: [] };
  }
  if (status === "failed") return <DkReliefMap plan={plan} selected={selected} onSelect={onSelect} fallbackNote={notice} />;

  const btn = { width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, background: "transparent", border: 0, color: C.ink, cursor: "pointer" };
  return (
    <div className="dk-map-sticky">
      <div ref={boxRef} className="relative rounded-2xl overflow-hidden" style={{ position: "relative", border: `1px solid ${C.line}`, background: "#e7eee6", aspectRatio: wide ? "2 / 1" : "4 / 3" }} onClick={() => onSelect && onSelect(null)}>
        <div ref={sceneRef} style={{ position: "absolute", inset: 0 }} onClick={(e) => e.stopPropagation()} />
        <div ref={labelsRef} className="dk-ter-labels" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} />
        {status === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: C.muted, background: "linear-gradient(180deg, #e6ecf2 0%, #dfe7e0 60%, #d6dfd5 100%)" }}>
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.line}`, borderTopColor: C.pine }} />
            <div>Loading the 3-D terrain…</div>
            <div style={{ fontSize: 10.5 }}>about 1 MB, kept for next time</div>
          </div>
        )}
        <div className="absolute left-2 top-2" style={{ position: "absolute", left: 8, top: 8, zIndex: 5, display: "inline-flex", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.92)", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onBack} className="tap px-2.5 h-7 text-[11px] font-semibold" style={{ padding: "0 10px", height: 28, fontSize: 11, fontWeight: 600, background: "transparent", color: C.ink, border: 0 }}>Relief</button>
          <span className="px-2.5 h-7 text-[11px] font-semibold" style={{ padding: "0 10px", height: 28, display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, background: C.pine, color: "#fff" }}>Terrain</span>
        </div>
        {status === "ready" && (wide || !selected) && (
          <div style={wide ? { position: "absolute", left: 8, top: 44, zIndex: 5, display: "flex", flexDirection: "column", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.92)", boxShadow: "0 1px 3px rgba(0,0,0,.25)" } : { position: "absolute", right: 8, bottom: 28, zIndex: 5, display: "flex", flexDirection: "column", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.92)", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Zoom in" style={btn} onClick={() => apiRef.current && apiRef.current.zoom(0.8)}>+</button>
            <button type="button" aria-label="Zoom out" style={{ ...btn, borderTop: `1px solid ${C.line}` }} onClick={() => apiRef.current && apiRef.current.zoom(1.25)}>−</button>
            <button type="button" aria-label="Face north" style={{ ...btn, borderTop: `1px solid ${C.line}`, fontSize: 12 }} onClick={() => apiRef.current && apiRef.current.reset()}>N</button>
          </div>
        )}
        {note && wide && (
          <div className="absolute right-2 top-2 dk-note-side" style={{ position: "absolute", right: 8, top: 8, width: 250, maxHeight: "calc(100% - 16px)", overflowY: "auto", zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
            <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
          </div>
        )}
        {note && !wide && (
          <div className="absolute left-2 right-2 bottom-2 dk-note-over" style={{ position: "absolute", left: 8, right: 8, bottom: 8, maxHeight: "48%", overflowY: "auto", zIndex: 6 }} onClick={(e) => e.stopPropagation()}>
            <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
          </div>
        )}
        {!selected && status === "ready" && <div style={{ position: "absolute", left: 8, bottom: 8, maxWidth: "calc(100% - 200px)", minWidth: 120, fontSize: 10.5, lineHeight: 1.3, borderRadius: 6, padding: "4px 8px", pointerEvents: "none", background: "rgba(255,255,255,.9)", color: C.muted, zIndex: 5 }}>{coarse ? "Swipe sideways to turn · two fingers to move" : "Drag to turn · right-drag to move"}</div>}
        <button type="button" onClick={(e) => { e.stopPropagation(); setCredit((v) => !v); }} style={{ position: "absolute", right: 8, bottom: 6, fontSize: 9, color: "rgba(255,255,255,.9)", textShadow: "0 0 3px rgba(0,0,0,.8)", background: "transparent", border: 0, padding: 0, cursor: "pointer", zIndex: 5 }}>Copernicus DEM · © OpenStreetMap ⓘ</button>
        {credit && (
          <div className="rounded-lg" style={{ position: "absolute", right: 8, bottom: 24, maxWidth: 280, padding: "8px 10px", fontSize: 10.5, lineHeight: 1.4, background: "rgba(255,255,255,.96)", color: C.muted, border: `1px solid ${C.line}`, zIndex: 7 }} onClick={(e) => e.stopPropagation()}>
            Elevation: produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA; all rights reserved. Roads and rivers © OpenStreetMap contributors (ODbL). Heights are model estimates, not surveys; mapped roads do not show current conditions.
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {stops.map((st) => { const on = day && (day.night === st.key || day.to === st.key);
          return (
            <button key={st.key} type="button" onClick={() => onSelect && onSelect(on ? null : st.day)} className="tap inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 text-[12px]"
              style={{ background: on ? C.pineSoft : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? C.pine : C.muted }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: on ? C.pine : C.grey, color: on ? "#fff" : C.ink }}>{st.n}</span>{DK_TOWNS[st.key].n}
            </button>
          ); })}
      </div>
    </div>
  );
}

function DkPlanMap({ plan, selected, onSelect }) {
  const st = useMapSettings();
  if (st === null) return <div className="rounded-2xl" style={{ aspectRatio: BT_MAP_AR, background: C.grey }} />;
  if (st.provider === "google" && st.gmaps) return <DkGoogleMap plan={plan} selected={selected} onSelect={onSelect} apiKey={st.gmaps} />;
  if (st.provider === "satellite" || st.provider === "libre") return <DkLibreMap plan={plan} selected={selected} onSelect={onSelect} />;
  // BUILD 52: the relief model is the default — it needs nothing from the network and draws at once
  return <DkReliefMap plan={plan} selected={selected} onSelect={onSelect} />;
}

function DkNoteBody({ note, day, onClose }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,.97)", border: `1px solid ${C.line}`, boxShadow: "0 6px 20px -10px rgba(0,0,0,.25)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold leading-tight" style={{ color: C.ink }}>Day {day.day} · {note.town.n}</div>
          <div className="text-[11.5px] mt-0.5" style={{ color: C.muted }}>{note.town.alt.toLocaleString()} m{day.moving && day.h > 0 ? ` · ${dkFmtHours(day.h)} · ${day.km} km` : ""}{day.night ? ` · ${DK_HOTEL[day.hotel]}` : " · departure"}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="tap shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.grey }}><X size={12} color={C.ink} /></button>
      </div>
      {note.ideas.length > 0 ? (
        <div className="mt-2">
          <div className="text-[10.5px] font-semibold tracking-[.06em] uppercase" style={{ color: C.goldText }}>Also worth it here</div>
          <ul className="mt-1 space-y-0.5">
            {note.ideas.map((x) => <li key={x.t} className="text-[12.5px] leading-snug flex gap-1.5" style={{ color: C.ink }}><span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: C.gold }} /><span>{x.t}{x.e === "moderate" ? <span style={{ color: C.muted }}> · moderate walk</span> : null}</span></li>)}
          </ul>
        </div>
      ) : note.planned > 0 ? <div className="text-[12px] mt-1.5" style={{ color: C.muted }}>All of Drukpah's picks here are already in this day.</div> : null}
    </div>
  );
}
function DkRouteMap({ plan, selected, onSelect }) {
  const boxRef = useRef(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const check = () => setWide(el.getBoundingClientRect().width >= 560);
    check();
    if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }
    const ro = new ResizeObserver(check); ro.observe(el); return () => ro.disconnect();
  }, []);
  const pts = [];
  for (const d of plan.days) for (const p of d.pts || []) {
    const last = pts[pts.length - 1];
    if (!last || last.lat !== p.lat || last.lng !== p.lng) pts.push(p);
  }
  const stops = [];
  const seen = new Set();
  for (const d of plan.days) {
    if (d.night && !seen.has(d.night)) { seen.add(d.night); stops.push({ key: d.night, n: stops.length + 1, day: d.day }); }
  }
  const line = pts.map((p) => `${btPctX(p.lng).toFixed(2)},${btPctY(p.lat).toFixed(2)}`).join(" ");
  const day = selected ? plan.days.find((d) => d.day === selected) : null;
  const seg = day && day.moving && day.pts && day.pts.length > 1 ? day.pts.map((p) => `${btPctX(p.lng).toFixed(2)},${btPctY(p.lat).toFixed(2)}`).join(" ") : null;
  const focus = day ? dkDayFocus(day) : null;
  // layer transform: scale about the top-left, then shift so the focus centre sits mid-map
  const k = focus ? focus.k : 1;
  const tx = focus ? 50 - focus.cx * k : 0, ty = focus ? 50 - focus.cy * k : 0;
  const ax = focus ? focus.anchor.x * k + tx : 50, ay = focus ? focus.anchor.y * k + ty : 50;   // anchor pin, in map percent
  // Where to put the note on wide maps: beside the pin, on whichever side covers no other stop.
  const boxW = boxRef.current ? boxRef.current.getBoundingClientRect().width : 800;
  const cardWpct = Math.min(40, (240 / boxW) * 100), cardHpct = 46;
  const pinsPct = stops.map((st) => { const t = DK_TOWNS[st.key]; return { key: st.key, x: btPctX(t.lng) * k + tx, y: btPctY(t.lat) * k + ty }; });
  const anchorKey = day ? (day.night || day.to || day.from) : null;
  const cy = Math.min(80, Math.max(20, ay));
  const candidates = [
    { side: "right", x1: ax + 3, x2: ax + 3 + cardWpct, y1: cy - cardHpct / 2, y2: cy + cardHpct / 2 },
    { side: "left", x1: ax - 3 - cardWpct, x2: ax - 3, y1: cy - cardHpct / 2, y2: cy + cardHpct / 2 },
  ];
  const score = (c) => (c.x1 < 0 || c.x2 > 100 ? 100 : 0) + pinsPct.filter((p) => p.key !== anchorKey && p.x > c.x1 - 2 && p.x < c.x2 + 2 && p.y > c.y1 - 4 && p.y < c.y2 + 4).length;
  const best = candidates.slice().sort((a, b) => score(a) - score(b))[0];
  const cardRight = best.side === "right";

  // Drukpah's notes for the selected day
  let note = null;
  if (day) {
    const townKey = day.night || day.to || day.from;
    const town = DK_TOWNS[townKey];
    const planned = (day.acts || []).map((a) => String(a).toLowerCase());
    const ideas = (DK_SEE[townKey] || []).filter((x) => !planned.some((a) => a.includes(x.t.toLowerCase().split(",")[0]))).slice(0, 2);
    const passes = (day.passes || []).map((pk) => DK_PASSES[pk]).filter(Boolean);
    const profile = day.moving && day.pts && day.pts.length > 1 ? day.pts.filter((p) => p && typeof p.alt === "number").map((p) => ({ n: p.n, alt: p.alt })) : [];
    note = { town, ideas, passes, planned: (day.acts || []).length, profile };
  }

  const Pin = ({ st }) => {
    const t = DK_TOWNS[st.key];
    const on = day && (day.night === st.key || day.to === st.key);
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); onSelect && onSelect(st.day); }} aria-label={`Stop ${st.n}: ${t.n}`}
        className="tap absolute" style={{ left: `${btPctX(t.lng)}%`, top: `${btPctY(t.lat)}%`, transform: `translate(-50%, -50%) scale(${1 / k})`, transformOrigin: "center", transition: "transform .75s cubic-bezier(.22,.61,.36,1)", zIndex: on ? 3 : 2, padding: 8, margin: -8 }}>
        <div className="rounded-full flex items-center justify-center text-[10px] font-bold" style={{ width: on ? 26 : 20, height: on ? 26 : 20, background: on ? C.maroon : C.pine, color: "#FFFFFF", border: "2px solid #FFFFFF", boxShadow: on ? "0 0 0 4px rgba(122,46,46,.22), 0 2px 6px rgba(0,0,0,.3)" : "0 1px 3px rgba(0,0,0,.25)", transition: "all .3s ease" }}>{st.n}</div>
      </button>
    );
  };

  return (
    <div className="dk-map-sticky">
      <div ref={boxRef} className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: "#eef1ee", aspectRatio: BT_MAP_AR }} onClick={() => onSelect && onSelect(null)}>
        <div className="absolute inset-0" style={{ transform: `translate(${tx}%, ${ty}%) scale(${k})`, transformOrigin: "0 0", transition: "transform .75s cubic-bezier(.22,.61,.36,1)", willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={mapImg} alt="Relief map of Bhutan with the planned route drawn on it" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", imageRendering: "auto" }} draggable="false" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <polyline points={line} fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.85" />
            <polyline points={line} fill="none" stroke={C.maroon} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={seg ? 0.4 : 1} style={{ transition: "opacity .5s ease" }} />
            {seg && <polyline points={seg} fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.9" className="dk-seg" />}
            {seg && <polyline points={seg} fill="none" stroke={C.maroon} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="dk-seg" />}
          </svg>
          {/* peaks: height labels on the relief, counter-scaled so they never balloon; text only when there is room */}
          {DK_PEAKS.map((pk) => (
            <div key={pk.n} className="absolute pointer-events-none" style={{ left: `${btPctX(pk.lng)}%`, top: `${btPctY(pk.lat)}%`, transform: `translate(-50%, -100%) scale(${1 / k})`, transformOrigin: "50% 100%", transition: "transform .75s cubic-bezier(.22,.61,.36,1)", zIndex: 1 }}>
              <div className="flex flex-col items-center">
                {(wide || k > 1.5) && <span className="whitespace-nowrap text-[9px] font-semibold leading-none" style={{ color: "#fff", textShadow: "0 0 3px rgba(0,0,0,.9), 0 0 1px rgba(0,0,0,.9)" }}>{pk.n} · {pk.alt.toLocaleString()} m</span>}
                <svg width="9" height="7" viewBox="0 0 10 8" className="mt-0.5"><path d="M5 0 L10 8 L0 8 Z" fill="#fff" opacity=".95" /></svg>
              </div>
            </div>
          ))}
          {/* passes on this route: a small saddle mark, with the height once you zoom in on that day */}
          {(() => {
            const onRoute = new Set(); for (const d of plan.days) for (const pk of d.passes || []) onRoute.add(pk);
            const todays = new Set(day ? (day.passes || []) : []);
            return [...onRoute].map((pk) => { const ps = DK_PASSES[pk]; if (!ps) return null; const hot = todays.has(pk);
              return (
                <div key={pk} className="absolute pointer-events-none" style={{ left: `${btPctX(ps.lng)}%`, top: `${btPctY(ps.lat)}%`, transform: `translate(-50%, -100%) scale(${1 / k})`, transformOrigin: "50% 100%", transition: "transform .75s cubic-bezier(.22,.61,.36,1), opacity .4s ease", opacity: day && !hot ? 0.55 : 1, zIndex: hot ? 3 : 1 }}>
                  <div className="flex flex-col items-center">
                    {(hot || (!day && wide)) && <span className="whitespace-nowrap text-[9px] font-semibold leading-none mb-0.5" style={{ color: "#fff", textShadow: "0 0 3px rgba(0,0,0,.9), 0 0 1px rgba(0,0,0,.9)" }}>{ps.n} · {ps.alt.toLocaleString()} m</span>}
                    <svg width="12" height="7" viewBox="0 0 12 7"><path d="M0 7 Q3 0 6 4 Q9 0 12 7 Z" fill={hot ? C.maroon : "#fff"} stroke="#fff" strokeWidth="1" /></svg>
                  </div>
                </div>
              ); });
          })()}
          {stops.map((st) => <Pin key={st.key} st={st} />)}
        </div>

        {/* Drukpah's note, beside the selected pin (wide maps) */}
        {note && wide && (
          <div className="absolute dk-note" onClick={(e) => e.stopPropagation()}
            style={{ top: "50%", transform: "translateY(-50%)", maxHeight: "calc(100% - 16px)", overflowY: "auto", [cardRight ? "left" : "right"]: `calc(${cardRight ? ax : 100 - ax}% + 24px)`, width: 260, maxWidth: "42%", zIndex: 5 }}>
            <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
            {Math.abs(ay - 50) < 28 && <div className="absolute w-2.5 h-2.5 rotate-45" style={{ top: `calc(50% + ${(ay - 50).toFixed(1)}%)`, marginTop: -5, [cardRight ? "left" : "right"]: -5, background: "rgba(255,255,255,.97)", borderLeft: cardRight ? `1px solid ${C.line}` : "none", borderBottom: cardRight ? `1px solid ${C.line}` : "none", borderRight: cardRight ? "none" : `1px solid ${C.line}`, borderTop: cardRight ? "none" : `1px solid ${C.line}` }} />}
          </div>
        )}
        {!selected && <div className="absolute left-2 bottom-2 text-[10.5px] rounded-md px-2 py-1 pointer-events-none" style={{ background: "rgba(255,255,255,.9)", color: C.muted }}>Tap a day or a stop to zoom in</div>}
      </div>
      {note && !wide && (
        <div className="dk-note-under mt-2" onClick={(e) => e.stopPropagation()}>
          <DkNoteBody note={note} day={day} onClose={() => onSelect && onSelect(null)} />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {stops.map((st) => {
          const on = day && (day.night === st.key || day.to === st.key);
          return (
            <button key={st.key} type="button" onClick={() => onSelect && onSelect(on ? null : st.day)} className="tap inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 text-[12px]"
              style={{ background: on ? C.pineSoft : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? C.pine : C.muted }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: on ? C.pine : C.grey, color: on ? "#fff" : C.ink }}>{st.n}</span>{DK_TOWNS[st.key].n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DrukpahEngine({ user, trips, actions, onApplied, presetTemplateId }) {
  const topRef = useRef(null);
  const [f, setF] = useState({ nights: 7, exit: "paro", adults: 2, seniors: 0, kids: 0, under6: 0,
                               pace: "standard", culture: true, nature: true, hotel: "3", month: 0 });
  const [plan, setPlan] = useState(null);
  const [mapSel, setMapSel] = useState(null);
  const selectDay = (n, fromMap) => {
    setMapSel(n);
    if (n && fromMap) { const el = document.querySelector(`[data-dkday="${n}"]`); if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  };
  const [editing, setEditing] = useState(true);
  const [confirmTrip, setConfirmTrip] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const people = f.adults + f.seniors + f.kids + f.under6;
  const canApply = user.kind === "operator" || user.kind === "admin";
  const tpl = useDrukpahTemplates(user);
  const [templateId, setTemplateId] = useState(presetTemplateId || "");
  useEffect(() => { if (presetTemplateId) { setTemplateId(presetTemplateId); setEditing(true); } }, [presetTemplateId]);
  const [description, setDescription] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [ai, setAi] = useState(null);
  const template = (tpl.templates || []).find((t) => t.id === templateId) || null;
  const descOk = description.trim().length >= 30;
  const [way, setWay] = useState("describe");         // describe it (Drukpah reads) | set it up (the form)
  const [read, setRead] = useState(null);             // what Drukpah understood from the description
  const cr = useDrukpahCredits(user);
  const [getMore, setGetMore] = useState(false);
  const noCredits = !!(cr.credits && cr.credits.total_left <= 0);
  const aiOn = !!(cr.settings && cr.settings.aiOn);
  // Drukpah's own writing: a title per day and a summary, no AI needed (AI titles take precedence when present)
  const withWriting = (plan, fields, placed) => ({
    ...plan,
    days: plan.days.map((d, i) => ({ ...d, title: dkDayTitle2(d, i, plan.days.length) })),
    summary: dkSummary(fields, plan, template ? template.name : null, placed ? placed.days.flatMap((d) => d.signature) : []),
  });

  const meId = user.talentId || user.id;
  const upcoming = (trips || [])
    .filter((tr) => tr && (tr.operatorId === meId || (tr.members || []).some((m) => m && m.id === meId)))
    .filter((tr) => tripStateNow(tr) !== "completed")
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  // land at the top of the new plan, not wherever the button happened to be
  const scrollToPlan = () => setTimeout(() => { try { topRef.current && topRef.current.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {} }, 40);
  const build = () => {
    if (people === 0) { setNote("Add at least one traveller."); return; }
    setPlan(withWriting(dkPlan(f), f, null)); setAi(null); setEditing(false); setNote(null); setConfirmTrip(null);
    scrollToPlan();
  };

  // the free way: Drukpah's engine with the template placed, no AI
  const buildPlaced = (fields, briefItems) => {
    const base = dkPlan(fields);
    const items = [...(template ? template.items : []), ...(briefItems || [])];
    const placed = items.length ? dkPlaceTemplate(base, items) : null;
    setPlan(withWriting(placed ? { ...base, days: placed.days } : base, fields, placed));
    setAi(placed ? { status: "placed", reason: null, summary: "", tips: [], unplaced: placed.unplaced,
                     templateName: template ? template.name : "from your description" } : null);
    setEditing(false); setNote(null); setConfirmTrip(null); scrollToPlan();
  };
  // Drukpah reads the description, fills in the settings, and builds — free, instant
  const buildFromDescription = () => {
    if (!descOk) { setNote("Describe the trip in a sentence or two — at least 30 characters."); return; }
    const r = dkReadDescription(description);
    const nf = { ...f, ...r.fields };
    setF(nf); setRead(r);
    buildPlaced(nf, r.items);
  };

  // Drukpah fixes the route and places the template; the AI writes the days around it (1 draft)
  const draft = async () => {
    if (!descOk) { setNote("Describe the trip in a sentence or two — at least 30 characters."); return; }
    let fields = f, briefItems = [];
    if (way === "describe") { const r = dkReadDescription(description); fields = { ...f, ...r.fields }; briefItems = r.items || []; setF(fields); setRead(r); }
    else setRead(null);
    if (fields.adults + fields.seniors + fields.kids + fields.under6 === 0) { setNote("Add at least one traveller."); return; }
    setDrafting(true); setNote(null); setConfirmTrip(null);
    const base = dkPlan(fields);
    const placed = dkPlaceTemplate(base, [...(template ? template.items : []), ...briefItems]);
    const T = (k) => (DK_TOWNS[k] ? DK_TOWNS[k].n : k);
    const payload = {
      description: description.trim(), templateId: template ? template.id : null,
      template: template ? { name: template.name, items: template.items } : null,
      travellers: { adults: fields.adults, seniors: fields.seniors, kids: fields.kids, under6: fields.under6 },
      pace: fields.pace, hotel: DK_HOTEL[fields.hotel], month: fields.month ? DK_MONTHS[fields.month] : null,
      days: placed.days.map((d) => ({
        day: d.day, route: d.moving && d.to ? `${T(d.from)} → ${T(d.to)}` : T(d.from),
        h: d.h || 0, drive: d.h ? dkFmtHours(d.h) : "", passes: (d.passes || []).map((p) => DK_PASSES[p].n),
        night: d.night ? T(d.night) : null, hotel: d.night ? DK_HOTEL[d.hotel] : null, acts: d.acts, signature: d.signature,
      })),
      unplaced: placed.unplaced.map((u) => u.title),
    };
    let out = null, reason = null;
    try {
      const { data, error } = await supabase.functions.invoke("drukpah-draft", { body: payload });
      if (error) {
        try { const b = await error.context.json(); reason = b && b.error; } catch (e) {}
        reason = reason || "The AI drafter couldn't be reached.";
      } else if (data && data.draft) {
        out = data.draft;
        if (data.credits) cr.setCredits((c) => ({ ...(c || {}), free_left: Number(data.credits.free_left) || 0, purchased: Number(data.credits.purchased) || 0,
          total_left: (Number(data.credits.free_left) || 0) + (Number(data.credits.purchased) || 0), allowance: c ? c.allowance : 0 }));
      } else reason = "The AI returned nothing usable.";
    } catch (e) { reason = "The AI drafter couldn't be reached."; }
    if (reason && /drafts left/i.test(reason)) cr.reload();
    if (out) cr.reload();                                   // the database is the source of truth for what's left
    // check it here too: the same days, in the same order, each with something to do
    const fits = out && Array.isArray(out.days) && out.days.length === placed.days.length
      && out.days.every((x, i) => x && x.day === placed.days[i].day && Array.isArray(x.activities) && x.activities.length);
    if (out && !fits) { out = null; reason = "The AI's answer didn't fit the route, so it was set aside."; }
    const days = placed.days.map((d, i) => {
      const a = out ? out.days[i] : null;
      return a ? { ...d, aiTitle: String(a.title || ""), acts: a.activities.map(String), note: String(a.note || "") } : d;
    });
    setPlan(withWriting({ ...base, days }, fields, placed));
    setAi({ status: out ? "ai" : "fallback", reason, summary: out ? String(out.summary || "") : "",
            tips: out && Array.isArray(out.tips) ? out.tips.map(String).slice(0, 3) : [],
            unplaced: placed.unplaced, templateName: template ? template.name : "" });
    setDrafting(false); setEditing(false);
    scrollToPlan();
  };

  const apply = async (trip) => {
    if (!plan || !CLOUD) return;
    setBusy(true); setNote(null);
    const previous = (trip.itinerary || []).map((d) => ({ trip_id: trip.id, day_no: d.day, title: d.title }));
    const rows = plan.days.map((d) => ({ trip_id: trip.id, day_no: d.day, title: dkDayTitle(d) }));
    const del = await supabase.from("trip_itinerary").delete().eq("trip_id", trip.id);
    if (del.error) { setBusy(false); setNote("Couldn't update that trip — " + del.error.message); return; }
    const ins = await supabase.from("trip_itinerary").insert(rows);
    if (ins.error) {
      if (previous.length) await supabase.from("trip_itinerary").insert(previous);   // put the old plan back
      setBusy(false); setNote("Couldn't save the plan — " + ins.error.message + ". The trip's earlier plan was kept.");
      return;
    }
    setBusy(false); setConfirmTrip(null);
    actions.reloadTrips && actions.reloadTrips();
    onApplied && onApplied(trip.id);
  };

  const share = async () => {
    if (!plan) return;
    const head = `Bhutan · ${plan.nights} nights, ${plan.days.length} days`;
    const body = plan.days.map((d) => `Day ${d.day} — ${dkDayTitle(d)}`).join("\n");
    const tail = `\nSustainable Development Fee: about USD ${plan.sdf.toLocaleString("en")}\nPlanned with Drukpah · Bhutan Tourism Hub`;
    const text = `${head}\n\n${body}\n${tail}`;
    try {
      if (navigator.share) await navigator.share({ title: head, text });
      else { await navigator.clipboard.writeText(text); setNote("Copied — paste it into an email or WhatsApp."); }
    } catch (e) {}
  };

  const levelStyle = {
    warn: { bg: C.maroonSoft, fg: C.maroon, Icon: ShieldAlert },
    info: { bg: C.bg, fg: C.ink, Icon: Clock },
    good: { bg: C.pineSoft, fg: C.pine, Icon: Check },
  };

  return (
    <div ref={topRef} style={{ scrollMarginTop: 12 }}>
      {/* the engine's name, plainly */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
          <MapIcon size={19} color={C.goldSoft} />
        </div>
        <div className="min-w-0">
          <div className="text-[17px] font-semibold leading-tight" style={{ color: C.ink }}>Drukpah</div>
          <div className="text-[12px]" style={{ color: C.muted }}>Itinerary engine, built on Bhutan's roads</div>
        </div>
      </div>

      {editing && getMore && <GetMoreSheet user={user} settings={cr.settings} openRequest={cr.openRequest} onClose={() => setGetMore(false)} onSent={() => cr.reload()} />}
      {editing ? (
        <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="pt-1 pb-3"><Segmented value={way} onChange={setWay} options={[["describe", "Describe it"], ["form", "Set it up"]]} /></div>
          <div className="pb-3 mb-1" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <label className="block">
              <span className="block text-[13px] font-medium mb-2 mt-1" style={{ color: C.ink }}>Your template <span style={{ color: C.muted }}>· optional</span></span>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} aria-label="Your template"
                className="w-full h-11 px-3 rounded-xl text-[14px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>
                <option value="">None — Drukpah's own suggestions</option>
                {(tpl.templates || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            {(way === "describe" || template) && (
              <label className="block mt-3">
                <span className="block text-[13px] font-medium mb-1" style={{ color: C.ink }}>Describe the trip {(way === "describe" || aiOn) ? <span style={{ color: C.maroon }}>· required</span> : <span style={{ color: C.muted }}>· optional</span>}</span>
                <span className="block text-[12px] mb-2 leading-snug" style={{ color: C.muted }}>How long, who's travelling, what they love, anything to avoid. Drukpah reads it — and the AI drafts around it when you use a template.</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000}
                  placeholder="e.g. A couple in their sixties from Melbourne, keen gardeners and photographers. Gentle pace, no long hikes, one special dinner."
                  className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
                <span className="block text-[11px] mt-1 text-right" style={{ color: descOk ? C.pine : C.muted }}>
                  {descOk ? "Enough to draft from" : `${Math.max(0, 30 - description.trim().length)} more characters needed`}
                </span>
              </label>
            )}
            {template && aiOn && <CreditsLine credits={cr.credits} onGetMore={() => setGetMore(true)} />}
          </div>

          {way === "form" && (<>
          <DkStepper label="Nights" sub={`${f.nights + 1} days in Bhutan`} value={f.nights} min={3} max={14} onChange={(v) => set("nights", v)} />

          <div className="pt-2 pb-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="text-[13px] font-medium mb-2 mt-1" style={{ color: C.ink }}>Leaving from</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DK_EXIT).map(([k, l]) => <Chip key={k} on={f.exit === k} onClick={() => set("exit", k)}>{l}</Chip>)}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <DkStepper label="Adults" value={f.adults} max={20} onChange={(v) => set("adults", v)} />
            <DkStepper label="Seniors" sub="65 and over — gentler days" value={f.seniors} max={20} onChange={(v) => set("seniors", v)} />
            <DkStepper label="Children 6–12" sub="Half the SDF" value={f.kids} max={10} onChange={(v) => set("kids", v)} />
            <DkStepper label="Under 6" sub="No SDF — shorter drives" value={f.under6} max={10} onChange={(v) => set("under6", v)} />
          </div>

          <div className="pt-2 pb-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="text-[13px] font-medium mb-2 mt-1" style={{ color: C.ink }}>Pace</div>
            <Segmented value={f.pace} onChange={(v) => set("pace", v)} options={Object.entries(DK_PACE)} />
          </div>

          <div className="pt-2 pb-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="text-[13px] font-medium mb-2 mt-1" style={{ color: C.ink }}>Interests</div>
            <div className="flex flex-wrap gap-2">
              <Chip on={f.culture} onClick={() => set("culture", !f.culture)}>Dzongs and temples</Chip>
              <Chip on={f.nature} onClick={() => set("nature", !f.nature)}>Nature and walks</Chip>
            </div>
          </div>

          <div className="pt-2 pb-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="text-[13px] font-medium mb-2 mt-1" style={{ color: C.ink }}>Hotels</div>
            <div className="flex flex-wrap gap-2">
              {DK_TIERS.map((k) => <Chip key={k} on={f.hotel === k} onClick={() => set("hotel", k)}>{DK_HOTEL[k]}</Chip>)}
            </div>
          </div>

          <div className="pt-2 pb-1" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <label className="block">
              <span className="block text-[13px] font-medium mb-2 mt-1" style={{ color: C.ink }}>Travelling in</span>
              <select value={f.month} onChange={(e) => set("month", Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl text-[14px]"
                style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>
                {DK_MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </label>
          </div>
          </>)}

          {note && <p className="text-[13px] mt-3" style={{ color: C.maroon }}>{note}</p>}

          {way === "describe" ? (
            <>
              <button type="button" onClick={buildFromDescription} disabled={!descOk || drafting}
                className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mt-4 mb-1"
                style={{ background: descOk ? C.pine : "#C7CEC7", color: "#FFFFFF", boxShadow: descOk ? `0 6px 16px ${C.pine}33` : "none" }}>
                Build from description <ArrowRight size={17} strokeWidth={2.4} />
              </button>
              {template && aiOn && (
                <button type="button" onClick={draft} disabled={drafting || !descOk || noCredits}
                  className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2 mt-2 mb-1"
                  style={{ background: C.card, border: `1.5px solid ${descOk && !noCredits ? C.pine : C.line}`, color: descOk && !noCredits ? C.pine : C.muted }}>
                  {drafting ? <><Loader2 size={16} className="animate-spin" /> Drafting…</> : noCredits ? "No AI drafts left — tap Get more" : "Draft with AI · 1 draft"}
                </button>
              )}
            </>
          ) : template && !aiOn ? (
            <button type="button" onClick={() => { setRead(null); buildPlaced(f); }}
              className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mt-4 mb-1"
              style={{ background: C.pine, color: "#FFFFFF", boxShadow: `0 6px 16px ${C.pine}33` }}>
              Build with my template <ArrowRight size={17} strokeWidth={2.4} />
            </button>
          ) : template ? (
            <>
              <button type="button" onClick={draft} disabled={drafting || !descOk || noCredits}
                className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mt-4 mb-1"
                style={{ background: descOk && !noCredits ? C.pine : "#C7CEC7", color: "#FFFFFF", boxShadow: descOk && !noCredits ? `0 6px 16px ${C.pine}33` : "none" }}>
                {drafting ? <><Loader2 size={17} className="animate-spin" /> Drafting your itinerary…</> : noCredits ? "No AI drafts left — tap Get more" : <>Draft with AI · 1 draft <ArrowRight size={17} strokeWidth={2.4} /></>}
              </button>
              <button type="button" onClick={() => { setRead(null); buildPlaced(f); }}
                className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-2 mb-1"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                Place my template without AI · free
              </button>
            </>
          ) : (
            <button type="button" onClick={build}
              className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mt-4 mb-1"
              style={{ background: C.pine, color: "#FFFFFF", boxShadow: `0 6px 16px ${C.pine}33` }}>
              Build the itinerary <ArrowRight size={17} strokeWidth={2.4} />
            </button>
          )}
        </div>
      ) : (
        <>
        <button type="button" onClick={() => { setEditing(true); if (read) setWay("form"); }}
          className="tap w-full rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 text-left"
          style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex-1 min-w-0 text-[13px] leading-relaxed" style={{ color: C.ink }}>
            {[<b key="n">{f.nights} nights</b>, `${people} ${people === 1 ? "traveller" : "travellers"}`, DK_PACE[f.pace], DK_HOTEL[f.hotel],
              f.month ? DK_MONTHS[f.month] : null].filter(Boolean).map((part, k, all) => (
              <React.Fragment key={k}><span className="whitespace-nowrap">{part}</span>{k < all.length - 1 ? " · " : ""}</React.Fragment>
            ))}
          </div>
          <span className="text-[13px] font-semibold shrink-0" style={{ color: C.pine }}>Change</span>
        </button>
        {read && (
          <div className="rounded-2xl px-4 py-3 mb-4 -mt-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-[11px] font-semibold tracking-[.12em] uppercase mb-1.5" style={{ color: C.goldText }}>What Drukpah read</div>
            <div className="flex flex-wrap gap-1.5">
              {read.understood.map((u) => <span key={u} className="text-[12px] rounded-full px-2.5 py-1" style={{ background: C.pineSoft, color: C.pine }}>{u}</span>)}
              {read.assumed.map((u) => <span key={u} className="text-[12px] rounded-full px-2.5 py-1" style={{ background: C.goldSoft, color: C.goldText }}>{u}</span>)}
            </div>
            <div className="text-[12px] mt-2" style={{ color: C.muted }}>Not quite right? Tap Change to set it precisely.</div>
          </div>
        )}
        </>
      )}

      {plan && !editing && (
        <div className="fade">
          {/* the plan at a glance */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              ["Driving", dkFmtHours(plan.totalH) || "—"],
              ["Longest", plan.longest.h ? `${dkFmtHours(plan.longest.h)}` : "—"],
              ["SDF", `$${plan.sdf.toLocaleString("en")}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl px-3 py-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="text-[11px] font-semibold tracking-[.06em] uppercase" style={{ color: C.goldText }}>{k}</div>
                <div className="text-[17px] font-semibold mt-0.5" style={{ color: C.ink }}>{v}</div>
              </div>
            ))}
          </div>

          {plan.summary && (!ai || ai.status !== "ai") && (
            <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="text-[11px] font-semibold tracking-[.12em] uppercase mb-1" style={{ color: C.goldText }}>Summary</div>
              <p className="text-[14px] leading-relaxed" style={{ color: C.ink }}>{plan.summary}</p>
            </div>
          )}
          {ai && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: ai.status === "fallback" ? C.goldSoft : C.pineSoft }}>
              <div className="text-[11px] font-semibold tracking-[.12em] uppercase" style={{ color: ai.status === "fallback" ? C.goldText : C.pine }}>
                {ai.status === "ai" ? `AI draft · ${ai.templateName}` : ai.status === "placed" ? `Drukpah's draft · ${ai.templateName}` : "Drukpah's draft"}
              </div>
              {ai.status === "ai" && ai.summary && <p className="text-[14px] mt-1.5 leading-relaxed" style={{ color: C.ink }}>{ai.summary}</p>}
              {ai.status === "placed" && (
                <p className="text-[13px] mt-1.5 leading-snug" style={{ color: C.pine }}>
                  {(template ? "Your template activities are placed below." : "The experiences Drukpah picked from your description are placed below.")
                    + (aiOn ? (template ? " For writing around them, use Draft with AI." : " For writing around them, choose a template and use Draft with AI.") : "")}
                </p>
              )}
              {ai.status === "fallback" && (
                <p className="text-[13px] mt-1.5 leading-snug" style={{ color: C.goldText }}>
                  {ai.reason} Your template activities are placed below; the rest uses Drukpah's own suggestions.
                </p>
              )}
              {ai.unplaced.length > 0 && (
                <p className="text-[12px] mt-2 leading-snug" style={{ color: C.muted }}>Not on this route: {ai.unplaced.map((u) => u.title).join(", ")}.</p>
              )}
            </div>
          )}

          <DkPlanMap plan={plan} selected={mapSel} onSelect={(n) => selectDay(n, true)} />

          {plan.notes.length > 0 && (
            <div className="mt-4 space-y-2">
              {plan.notes.map((n, i) => {
                const st = levelStyle[n.level] || levelStyle.info;
                return (
                  <div key={i} className="rounded-xl px-3.5 py-3 flex gap-2.5" style={{ background: st.bg, border: n.level === "info" ? `1px solid ${C.line}` : "none" }}>
                    <st.Icon size={15} color={st.fg} className="shrink-0 mt-0.5" />
                    <p className="text-[13px] leading-snug" style={{ color: st.fg }}>{n.text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* day by day */}
          <div className="text-[11px] font-semibold tracking-[.14em] uppercase mt-6 mb-2" style={{ color: C.goldText }}>Day by day</div>
          <div className="space-y-2">
            {plan.days.map((d) => (
              <div key={d.day} data-dkday={d.day} role="button" tabIndex={0} onClick={() => selectDay(mapSel === d.day ? null : d.day, false)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectDay(mapSel === d.day ? null : d.day, false); } }}
                className="tap rounded-xl px-3.5 py-3 cursor-pointer" style={{ background: mapSel === d.day ? C.pineSoft : C.card, border: `1px solid ${mapSel === d.day ? C.pine : C.line}`, transition: "background .2s ease, border-color .2s ease" }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: mapSel === d.day ? C.maroon : C.pine, transition: "background .2s ease" }}>
                    <span className="text-[12px] font-bold" style={{ color: "#fff" }}>{d.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold leading-snug" style={{ color: C.ink }}>
                      {d.aiTitle || d.title || (d.moving && d.to ? `${DK_TOWNS[d.from].n} → ${DK_TOWNS[d.to].n}` : DK_TOWNS[d.from].n)}
                    </div>
                    {(d.aiTitle || d.title) && (
                      <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>
                        {d.moving && d.to ? `${DK_TOWNS[d.from].n} → ${DK_TOWNS[d.to].n}` : DK_TOWNS[d.from].n}
                      </div>
                    )}
                    {d.moving && d.h > 0 && (
                      <div className="text-[12px] mt-0.5 inline-flex items-center gap-1" style={{ color: C.muted }}>
                        <Car size={12} /> {dkFmtHours(d.h)} · {d.km} km
                      </div>
                    )}
                    <ul className="mt-1.5 space-y-1">
                      {d.acts.map((a, k) => (
                        <li key={k} className="text-[13px] leading-snug flex gap-2" style={{ color: C.ink }}>
                          <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: C.gold }} />
                          <span>{a}{(d.signature || []).some((sg) => String(a).toLowerCase().includes(String(sg).toLowerCase())) && (
                            <span className="ml-1.5 text-[10px] font-bold tracking-[.06em] uppercase rounded-full px-1.5 py-0.5 align-middle whitespace-nowrap"
                              style={{ background: C.goldSoft, color: C.goldText }}>Yours</span>
                          )}{(d.brief || []).some((bf) => String(a).toLowerCase().includes(String(bf).toLowerCase())) && (
                            <span className="ml-1.5 text-[10px] font-bold tracking-[.06em] uppercase rounded-full px-1.5 py-0.5 align-middle whitespace-nowrap"
                              style={{ background: C.pineSoft, color: C.pine }}>From your brief</span>
                          )}</span>
                        </li>
                      ))}
                    </ul>
                    {d.note && <p className="text-[12px] mt-1.5 leading-snug" style={{ color: C.muted }}>{d.note}</p>}
                    {d.night && (
                      <div className="text-[12px] mt-2" style={{ color: d.hotelFallback ? C.goldText : C.muted }}>
                        Night in {DK_TOWNS[d.night].n} · {DK_HOTEL[d.hotel]}{d.hotelFallback ? " (best available)" : ""}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {ai && ai.tips.length > 0 && (
            <div className="rounded-2xl p-4 mt-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="text-[11px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>Tips for you</div>
              <ul className="space-y-1.5">
                {ai.tips.map((t, k) => <li key={k} className="text-[13px] leading-snug" style={{ color: C.ink }}>{t}</li>)}
              </ul>
            </div>
          )}

          {note && <p className="text-[13px] mt-3" style={{ color: note.startsWith("Copied") ? C.pine : C.maroon }}>{note}</p>}

          {/* use it */}
          <div className="mt-5 space-y-2">
            {canApply && upcoming.length > 0 && !confirmTrip && (
              <div className="rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="text-[13px] font-semibold mb-1" style={{ color: C.ink }}>Apply to a trip</div>
                <p className="text-[12px] mb-2.5" style={{ color: C.muted }}>The plan becomes the trip's itinerary, and appears in the crew's brief.</p>
                <div className="flex flex-col gap-2">
                  {upcoming.map((tr) => (
                    <button key={tr.id} type="button" onClick={() => setConfirmTrip(tr)}
                      className="tap w-full rounded-xl px-3 py-2.5 text-left flex items-center justify-between gap-2"
                      style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                      <span className="text-[13px] font-medium truncate" style={{ color: C.ink }}>{tr.title}</span>
                      <span className="text-[12px] shrink-0" style={{ color: C.muted }}>{fmtDate(tr.start)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {confirmTrip && (
              <div className="rounded-2xl p-3.5 fade" style={{ background: C.pineSoft }}>
                <div className="text-[13px] font-semibold mb-1" style={{ color: C.pine }}>Use this plan for “{confirmTrip.title}”?</div>
                <p className="text-[12px] mb-3 leading-snug" style={{ color: C.pine }}>
                  {(confirmTrip.itinerary || []).length
                    ? `It replaces the ${(confirmTrip.itinerary || []).length} days already planned for this trip.`
                    : "The trip has no days planned yet."}
                  {(() => {
                    if (!confirmTrip.start || !confirmTrip.end) return "";
                    const tripDays = Math.round((new Date(confirmTrip.end) - new Date(confirmTrip.start)) / 86400e3) + 1;
                    return tripDays !== plan.days.length ? ` Note: the trip is ${tripDays} days and this plan is ${plan.days.length}.` : "";
                  })()}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirmTrip(null)} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold"
                    style={{ background: C.card, color: C.muted }}>Cancel</button>
                  <button type="button" onClick={() => apply(confirmTrip)} disabled={busy}
                    className="tap flex-[1.4] h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                    style={{ background: C.pine, color: "#FFFFFF" }}>
                    {busy ? <Loader2 size={14} className="animate-spin" /> : "Apply the plan"}
                  </button>
                </div>
              </div>
            )}

            <button type="button" onClick={share}
              className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
              <Share2 size={15} /> Share with the client
            </button>
          </div>

          {getMore && <GetMoreSheet user={user} settings={cr.settings} openRequest={cr.openRequest} onClose={() => setGetMore(false)} onSent={() => cr.reload()} />}
          <p className="text-[12px] leading-snug mt-4" style={{ color: C.muted }}>
            Drive times are typical figures and change with weather and roadworks. Hotel availability is indicative —
            confirm current options. SDF: USD 100 per adult per night, USD 50 for ages 6–12, nothing under 6, valid to
            31 August 2027; Indian nationals pay Nu 1,200 per night.
          </p>
        </div>
      )}
    </div>
  );
}


/* ========================================================================== */
/*  CREW ONBOARDING — profile editor, readiness, and trip invitations         */
/* ========================================================================== */
const InvitesCtx = React.createContext({ invites: [] });

/* What a guide or driver needs before accepting a trip. This MUST match the
   check in respond_crew_invite() — the database enforces it either way. */
function crewReadiness(t, role) {
  const r = role || (t && t.role);
  const items = [
    { key: "licence number", ok: !!(t && t.licenseNumber) },
    { key: "licence photo", ok: !!(t && t.licensePhoto) },
    { key: "specialities", ok: !!(t && (t.tags || []).length) },
    { key: "languages", ok: !!(t && (t.languages || []).length) },
  ];
  if (r === "driver") items.push({ key: "vehicle", ok: !!(t && t.vehicle) });
  return { items, ready: items.every((i) => i.ok), missing: items.filter((i) => !i.ok).map((i) => i.key) };
}

function ReadinessList({ readiness }) {
  return (
    <div className="space-y-1.5">
      {readiness.items.map((i) => (
        <div key={i.key} className="flex items-center gap-2 text-[13px]" style={{ color: i.ok ? C.ink : C.muted }}>
          <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
            style={{ background: i.ok ? C.pine : C.card, border: `1.5px solid ${i.ok ? C.pine : C.line}` }}>
            {i.ok && <Check size={10} color="#FFFFFF" strokeWidth={3.4} />}
          </span>
          <span>{i.key.charAt(0).toUpperCase() + i.key.slice(1)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── the profile editor: licence, specialities, languages, vehicle, about ── */
function ProfileEditor({ talent, onClose, onSaved }) {
  const t = talent || {};
  const isDriver = t.role === "driver";
  const [f, setF] = useState({
    licNumber: t.licenseNumber || "", licExpiry: t.licenseExpiry || "", base: t.base || "",
    years: t.years || 0, pitch: t.pitch || "", phone: t.phone || "",
    tags: t.tags || [], langs: (t.languages || []).map((x) => (typeof x === "string" ? { n: x, l: "Fluent" } : x)).filter((x) => x && x.n), vehicle: t.vehicle || "",
  });
  const [photo, setPhoto] = useState(null);
  const [face, setFace] = useState(null);   // BUILD 55: a new profile photo, chosen but not saved yet
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);
  const faceRef = useRef(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  // as in onboarding: tap once for Fluent, again for Basic, a third time to remove
  const cycleLang = (n) => setF((x) => {
    const cur = x.langs.find((y) => y.n === n);
    const langs = !cur ? [...x.langs, { n, l: "Fluent" }] : cur.l === "Fluent" ? x.langs.map((y) => (y.n === n ? { ...y, l: "Basic" } : y)) : x.langs.filter((y) => y.n !== n);
    return { ...x, langs };
  });
  const specs = isDriver ? ONB_DRIVES : ONB_SPECS;
  const readiness = crewReadiness({ ...t, licenseNumber: f.licNumber.trim(), licensePhoto: !!(t.licensePhoto || photo),
                                    tags: f.tags, languages: f.langs, vehicle: f.vehicle }, t.role);
  const status = { none: ["Not added yet", C.muted], submitted: ["Waiting for our team to check", C.goldText],
                   verified: ["Verified", C.pine], rejected: ["Not approved — upload a clearer photo", C.maroon] }[t.licenseStatus || "none"]
                 || ["Not added yet", C.muted];

  const pick = (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = "";
    if (!file || !file.type.startsWith("image/")) { setErr("Please choose a photo of your licence."); return; }
    setErr(null);
    const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(file);
  };

  const pickFace = (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = "";
    if (!file || !file.type.startsWith("image/")) { setErr("Please choose a photo of yourself."); return; }
    setErr(null);
    const r = new FileReader(); r.onload = () => setFace(r.result); r.readAsDataURL(file);
  };

  const save = async () => {
    if (!CLOUD || !t.id) return;
    setBusy(true); setErr(null);
    let photoPath = null;
    try {
      let photoUrl = null;
      if (face) {
        const blob = await squarePhoto(face);
        const path = `avatar/${t.id}/${Date.now()}.jpg`;
        const up = await supabase.storage.from("post-media").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw new Error(navigator.onLine === false ? failText("upload your photo") : "Your photo didn't upload — " + up.error.message);
        photoPath = path;
        photoUrl = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      }
      let licensePath = null;
      if (photo) {
        const small = await shrinkImage(photo, 1600, 0.85);
        const blob = await (await fetch(small)).blob();
        const path = `${t.id}/license.jpg`;
        const up = await supabase.storage.from("licenses").upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (up.error) throw new Error("The licence photo didn't upload — " + up.error.message);
        licensePath = path;
      }
      const number = f.licNumber.trim().toUpperCase() || null;
      const patch = {
        license_number: number, license_expiry: f.licExpiry || null,
        base: f.base.trim() || null, years: f.years || 0, pitch: f.pitch.trim() || null, phone: f.phone.trim() || null,
        tags: f.tags, languages: f.langs, vehicle: isDriver ? (f.vehicle || null) : null,
      };
      if (photoUrl) patch.photo_url = photoUrl;
      // a new photo, or a changed number on a verified licence, goes back to our team to check
      if (licensePath) { patch.license_path = licensePath; patch.license_status = "submitted"; }
      else if (number !== (t.licenseNumber || null) && t.licenseStatus === "verified") patch.license_status = "submitted";
      let res = await supabase.from("profiles").update(patch).eq("id", t.id);
      if (res.error && patch.license_status) {
        // if the database reserves the status for admins, save everything else
        const { license_status, ...rest } = patch;
        res = await supabase.from("profiles").update(rest).eq("id", t.id);
      }
      if (res.error) throw new Error(navigator.onLine === false ? failText("save your profile") : res.error.message);
      photoPath = null;   // saved: the new photo is theirs now, whatever happens next
      // the photo it replaces is removed (only ever one of their own, under avatar/<their id>/)
      const old = String(t.photo || "").split("/object/public/post-media/")[1];
      if (photoUrl && old && old.startsWith(`avatar/${t.id}/`)) supabase.storage.from("post-media").remove([old]).catch(() => {});
      setBusy(false);
      onSaved && onSaved();
      onClose();
    } catch (e) {
      if (photoPath) supabase.storage.from("post-media").remove([photoPath]).catch(() => {});   // not kept: nothing points to it
      setBusy(false); setErr(e.message || "Couldn't save. Please try again.");
    }
  };

  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 235 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "92dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Your profile</div>
          <p className="text-[13px] mt-1 leading-snug" style={{ color: C.muted }}>
            Operators book from this. Your licence and specialities are what they check first.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto hidescroll px-5 pb-5" style={{ scrollbarWidth: "none" }}>
          <div className="rounded-2xl p-4 mb-4" style={{ background: readiness.ready ? C.pineSoft : C.goldSoft }}>
            <div className="text-[13px] font-semibold mb-2" style={{ color: readiness.ready ? C.pine : C.goldText }}>
              {readiness.ready ? "Ready to accept trips" : "Needed before you can accept a trip"}
            </div>
            <ReadinessList readiness={readiness} />
          </div>

          <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-2" style={{ color: C.goldText }}>Profile photo</div>
          <input ref={faceRef} type="file" accept="image/*" onChange={pickFace} className="hidden" />
          <div className="flex items-center gap-3.5 mb-5">
            <button type="button" onClick={() => faceRef.current && faceRef.current.click()} aria-label="Choose a profile photo"
              className="tap rounded-full shrink-0" style={{ padding: 0, border: 0, background: "transparent" }}>
              <Avatar initials={t.initials || initialsOf(t.name)} src={face || t.photo} size={72} />
            </button>
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => faceRef.current && faceRef.current.click()}
                className="tap h-10 px-4 rounded-xl text-[14px] font-semibold inline-flex items-center gap-2"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                <Camera size={16} /> {face || t.photo ? "Change photo" : "Add a photo of yourself"}
              </button>
              <p className="text-[12px] mt-1.5 leading-snug" style={{ color: C.muted }}>
                A clear photo of your face. Operators see it when they book, and guests when they review you.
              </p>
            </div>
          </div>

          <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-2" style={{ color: C.goldText }}>Licence</div>
          <div className="text-[12px] mb-3" style={{ color: status[1] }}>{status[0]}</div>
          <label className="block mb-3">
            <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Licence number</span>
            <span className="block text-[12px] -mt-1 mb-1.5" style={{ color: C.muted }}>
              {{ guide: "Your Department of Tourism guide licence", driver: "Your RSTA driving licence" }[t.role] || "As printed on your licence"}
            </span>
            <input value={f.licNumber} onChange={(e) => set("licNumber", e.target.value.toUpperCase())} maxLength={30}
              placeholder="Exactly as printed on the licence" className="w-full h-12 px-4 rounded-xl text-[15px]"
              style={{ ...field, letterSpacing: "0.04em" }} />
          </label>
          <label className="block mb-3">
            <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Valid until</span>
            <input type="date" value={f.licExpiry} onChange={(e) => set("licExpiry", e.target.value)}
              className="w-full h-12 px-3.5 rounded-xl text-[14px]" style={field} />
          </label>
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
          {photo ? (
            <div className="rounded-xl overflow-hidden mb-2" style={{ border: `1px solid ${C.line}` }}>
              <img src={photo} alt="Your licence" className="w-full block" style={{ maxHeight: 240, objectFit: "contain", background: C.bg }} />
            </div>
          ) : null}
          <button type="button" onClick={() => fileRef.current && fileRef.current.click()}
            className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2 mb-1"
            style={{ background: C.card, border: `1px dashed ${C.line}`, color: C.ink }}>
            <Camera size={16} /> {photo ? "Choose a different photo" : t.licensePhoto ? "Replace the licence photo" : "Add a photo of your licence"}
          </button>
          <p className="text-[12px] mb-5" style={{ color: C.muted }}>
            {t.licensePhoto && !photo ? "A photo is on file. " : ""}Hold the phone flat above the licence with all four corners in frame.
          </p>

          <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-2" style={{ color: C.goldText }}>{isDriver ? "Driving" : "Specialities"}</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {specs.map((s) => <Chip key={s} on={f.tags.includes(s)} onClick={() => toggle("tags", s)}>{s}</Chip>)}
          </div>

          <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-1" style={{ color: C.goldText }}>Languages</div>
          <div className="text-[12px] mb-2" style={{ color: C.muted }}>Tap once for Fluent, twice for Basic</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {ONB_LANGS.map((n) => {
              const cur = f.langs.find((x) => x.n === n);
              return (
                <button key={n} type="button" onClick={() => cycleLang(n)} aria-pressed={Boolean(cur)}
                  className="tap rounded-full pl-3 pr-2.5 py-1.5 text-[13px] font-medium inline-flex items-center gap-1.5"
                  style={{ background: cur ? C.pine : C.card, border: `1px solid ${cur ? C.pine : C.line}`, color: cur ? "#fff" : C.ink }}>
                  {n}{cur && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: C.gold, color: "#fff" }}>{cur.l}</span>}
                </button>
              );
            })}
          </div>

          {isDriver && (
            <>
              <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-2" style={{ color: C.goldText }}>Vehicle</div>
              <div className="flex flex-wrap gap-2 mb-5">
                {ONB_VEHICLES.map((v) => <Chip key={v} on={f.vehicle === v} onClick={() => set("vehicle", f.vehicle === v ? "" : v)}>{v}</Chip>)}
              </div>
            </>
          )}

          <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-2" style={{ color: C.goldText }}>About you</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {ONB_YEARS.map(([l, v]) => <Chip key={l} on={f.years === v} onClick={() => set("years", v)}>{l}</Chip>)}
          </div>
          <label className="block mb-3">
            <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Based in</span>
            <input value={f.base} onChange={(e) => set("base", e.target.value)} maxLength={40} placeholder="e.g. Paro"
              className="w-full h-12 px-4 rounded-xl text-[15px]" style={field} />
          </label>
          <label className="block mb-3">
            <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Phone</span>
            <input value={f.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" maxLength={20} placeholder="17 12 34 56"
              className="w-full h-12 px-4 rounded-xl text-[15px]" style={field} />
          </label>
          <label className="block mb-5">
            <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>A line about you</span>
            <textarea value={f.pitch} onChange={(e) => set("pitch", e.target.value)} rows={3} maxLength={280}
              placeholder="What guests remember about trips with you"
              className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none" style={field} />
          </label>

          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
          <button type="button" onClick={save} disabled={busy}
            className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            style={{ background: C.pine, color: "#FFFFFF" }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : "Save my profile"}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}

/* ── on your own profile: how complete it is, and the way in to edit ── */
function ProfileSetupCard({ talent, onSaved }) {
  const [open, setOpen] = useState(false);
  const r = crewReadiness(talent, talent && talent.role);
  return (
    <div className="px-5 mt-4">
      <div className="rounded-2xl p-4" style={{ background: r.ready ? C.card : C.goldSoft, border: `1px solid ${r.ready ? C.line : C.gold + "55"}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold" style={{ color: r.ready ? C.ink : C.goldText }}>
              {r.ready ? "Your profile is complete" : "Finish your profile"}
            </div>
            <div className="text-[12px] mt-0.5 leading-snug" style={{ color: r.ready ? C.muted : C.goldText }}>
              {r.ready ? "You can accept trips from operators." : `Still needed: ${r.missing.join(", ")}.`}
            </div>
          </div>
          <button type="button" onClick={() => setOpen(true)}
            className="tap shrink-0 h-10 px-4 rounded-xl text-[13px] font-semibold"
            style={{ background: C.pine, color: "#FFFFFF" }}>Edit profile</button>
        </div>
      </div>
      {open && <ProfileEditor talent={talent} onClose={() => setOpen(false)} onSaved={onSaved} />}
    </div>
  );
}

/* ── operator: invite crew to a confirmed trip ── */
function crewInviteLink(token) { return `${window.location.origin}/?invite=${token}`; }
function crewInviteMessage(inv, link) {
  const dates = inv.tripStart ? ` (${fmtDate(inv.tripStart)}${inv.tripEnd ? ` – ${fmtDate(inv.tripEnd)}` : ""})` : "";
  return `Kuzu Zangpo la ${inv.name},\n\n${inv.operatorName || "We"} would like you as ${inv.role} for “${inv.tripTitle}”${dates}.\n\nJoin Bhutan Tourism Hub with this link to see the trip and accept:\n${link}`;
}
function openWhatsApp(phone, text) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const withCode = digits.length === 8 ? `975${digits}` : digits;
  const url = withCode.length >= 8 ? `https://wa.me/${withCode}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}

function AddCrewSheet({ trip, actions, onClose }) {
  const { invites } = React.useContext(InvitesCtx);
  const [mode, setMode] = useState("hub");
  const [role, setRole] = useState("guide");
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [made, setMade] = useState(null);
  const [copied, setCopied] = useState(false);

  const onTrip = new Set((trip.members || []).map((m) => m && m.id));
  const asked = new Set((invites || []).filter((i) => i.tripId === trip.id && i.talentId && ["pending", "accepted"].includes(i.status)).map((i) => i.talentId));
  const term = q.trim().toLowerCase();
  const people = Object.values(PROFILE_DIR)
    .filter((p) => p && p.role === role && !onTrip.has(p.id))
    .filter((p) => !term || (p.name || "").toLowerCase().includes(term) || (p.base || "").toLowerCase().includes(term))
    .sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0) || (a.name || "").localeCompare(b.name || ""))
    .slice(0, 40);

  const request = async (p) => {
    setBusy(p.id); setErr(null);
    const res = await actions.createInvite({ trip, role, name: p.name, phone: p.phone, talentId: p.id });
    setBusy(null);
    if (!res.ok) setErr("Couldn't send the request — " + (res.reason || "try again"));
  };
  const createLink = async () => {
    if (name.trim().length < 2) { setErr("Enter their name."); return; }
    setBusy("new"); setErr(null);
    const res = await actions.createInvite({ trip, role, name: name.trim(), phone: phone.trim() });
    setBusy(null);
    if (!res.ok) { setErr("Couldn't create the link — " + (res.reason || "try again")); return; }
    setMade({ link: res.link, inv: res.invite });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(made.link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {}
  };
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };

  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "90dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Add crew</div>
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>{trip.title} · {fmtDate(trip.start)} – {fmtDate(trip.end)}</p>
          <div className="mt-3"><Segmented value={mode} onChange={(v) => { setMode(v); setErr(null); setMade(null); }}
            options={[["hub", "From the hub"], ["new", "Invite someone new"]]} /></div>
          <div className="flex gap-2 mt-3">
            <Chip on={role === "guide"} onClick={() => setRole("guide")}>Guide</Chip>
            <Chip on={role === "driver"} onClick={() => setRole("driver")}>Driver</Chip>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto hidescroll px-5 pb-5" style={{ scrollbarWidth: "none" }}>
          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}

          {mode === "hub" ? (
            <>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${role}s by name or town`}
                aria-label={`Search ${role}s`} className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={field} />
              {people.length === 0 ? (
                <p className="text-[13px] py-4 text-center" style={{ color: C.muted }}>
                  No {role}s found. Try “Invite someone new” to bring them onto the hub.
                </p>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                  {people.map((p, k) => {
                    const done = asked.has(p.id);
                    const r = crewReadiness(p, role);
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-3.5 py-3" style={{ borderTop: k ? `1px solid ${C.lineSoft}` : "none", background: C.card }}>
                        <Avatar initials={p.initials} src={p.photo} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold truncate inline-flex items-center gap-1" style={{ color: C.ink }}>
                            {p.name}{p.verified && <BadgeCheck size={14} color={C.pine} />}
                          </div>
                          <div className="text-[12px] truncate" style={{ color: r.ready ? C.muted : C.goldText }}>
                            {p.base ? `${p.base} · ` : ""}{r.ready ? "Profile complete" : "Profile not finished yet"}
                          </div>
                        </div>
                        <button type="button" onClick={() => request(p)} disabled={done || busy === p.id}
                          className="tap shrink-0 h-9 px-3.5 rounded-lg text-[13px] font-semibold"
                          style={{ background: done ? C.pineSoft : C.pine, color: done ? C.pine : "#FFFFFF" }}>
                          {busy === p.id ? <Loader2 size={14} className="animate-spin" /> : done ? "Asked" : "Ask"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[12px] mt-3 leading-snug" style={{ color: C.muted }}>
                They'll see the request in their Trips tab, and can accept once their licence and profile are complete.
              </p>
            </>
          ) : made ? (
            <div className="rounded-2xl p-4" style={{ background: C.pineSoft }}>
              <div className="text-[14px] font-semibold mb-1" style={{ color: C.pine }}>Invite ready for {made.inv.name}</div>
              <p className="text-[12px] mb-3 leading-snug" style={{ color: C.pine }}>
                They sign up with this link, add their licence and profile, then accept the trip.
              </p>
              <div className="rounded-lg px-3 py-2 mb-3 break-all text-[12px]" style={{ background: C.card, color: C.ink, fontFamily: "ui-monospace, Menlo, monospace" }}>{made.link}</div>
              <button type="button" onClick={() => openWhatsApp(made.inv.phone, crewInviteMessage(made.inv, made.link))}
                className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-2"
                style={{ background: "#25D366", color: "#FFFFFF" }}>
                <MessageCircle size={17} /> Send on WhatsApp
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={copy} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{copied ? "Copied" : "Copy link"}</button>
                <button type="button" onClick={() => { setMade(null); setName(""); setPhone(""); }}
                  className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
                  Invite another
                </button>
              </div>
            </div>
          ) : (
            <>
              <label className="block mb-3">
                <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Their name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Sonam Penjor"
                  className="w-full h-12 px-4 rounded-xl text-[15px]" style={field} />
              </label>
              <label className="block mb-1.5">
                <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>WhatsApp number <span style={{ color: C.muted }}>· optional</span></span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} placeholder="17 12 34 56"
                  className="w-full h-12 px-4 rounded-xl text-[15px]" style={field} />
              </label>
              <p className="text-[12px] mb-4" style={{ color: C.muted }}>With a number, WhatsApp opens straight to their chat.</p>
              <button type="button" onClick={createLink} disabled={busy === "new"}
                className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
                style={{ background: C.pine, color: "#FFFFFF" }}>
                {busy === "new" ? <Loader2 size={18} className="animate-spin" /> : "Create the invite link"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}

const CREW_STATUS = {
  invited:  ["Link sent — not signed up yet", C.goldText],
  pending:  ["Asked — waiting for them", C.goldText],
  accepted: ["Joined the crew", C.pine],
  declined: ["Declined", C.maroon],
};

function CrewInvites({ trip, actions }) {
  const { invites } = React.useContext(InvitesCtx);
  const [adding, setAdding] = useState(false);
  const mine = (invites || []).filter((i) => i.tripId === trip.id && i.status !== "cancelled" && i.status !== "accepted");
  return (
    <div className="mb-5">
      {mine.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-2" style={{ border: `1px solid ${C.line}` }}>
          {mine.map((i, k) => {
            const p = i.talentId ? PROFILE_DIR[i.talentId] : null;
            const ready = p ? crewReadiness(p, i.role).ready : false;
            const label = i.status === "pending" && p ? (ready ? ["Ready — waiting for them to accept", C.pine] : ["Signed up — finishing their profile", C.goldText])
                         : CREW_STATUS[i.status] || [i.status, C.muted];
            return (
              <div key={i.id} className="px-3.5 py-3 flex items-center gap-3" style={{ borderTop: k ? `1px solid ${C.lineSoft}` : "none", background: C.card }}>
                <Avatar initials={initialsOf(i.name)} src={p ? p.photo : null} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{i.name} <span className="font-normal capitalize" style={{ color: C.muted }}>· {i.role}</span></div>
                  <div className="text-[12px]" style={{ color: label[1] }}>{label[0]}</div>
                </div>
                {i.status === "invited" && (
                  <button type="button" onClick={() => openWhatsApp(i.phone, crewInviteMessage(i, crewInviteLink(i.token)))}
                    className="tap h-9 px-3 rounded-lg text-[12px] font-semibold shrink-0" style={{ background: C.pineSoft, color: C.pine }}>Resend</button>
                )}
                {(i.status === "invited" || i.status === "pending" || i.status === "declined") && (
                  <button type="button" onClick={() => actions.cancelInvite(i.id)} aria-label={`Cancel the invitation to ${i.name}`}
                    className="tap w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.bg }}>
                    <X size={14} color={C.muted} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button type="button" onClick={() => setAdding(true)}
        className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2"
        style={{ background: C.goldSoft, color: C.goldText }}>
        <UserPlus size={16} /> Add crew
      </button>
      {adding && <AddCrewSheet trip={trip} actions={actions} onClose={() => setAdding(false)} />}
    </div>
  );
}

/* ── guide or driver: trips you've been asked to join ── */
function CrewRequests({ user, actions }) {
  const { invites } = React.useContext(InvitesCtx);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState(null);
  const meId = user.talentId || user.id;
  const me = PROFILE_DIR[meId] || talentById(meId);
  const asks = (invites || []).filter((i) => i.talentId === meId && i.status === "pending");
  if (!asks.length && !note) return null;

  const respond = async (inv, accept) => {
    setBusy(inv.id + (accept ? "y" : "n")); setNote(null);
    const res = await actions.respondInvite(inv.id, accept);
    setBusy(null);
    if (!res.ok) { setNote({ bad: true, text: res.reason || "Something went wrong. Please try again." }); return; }
    setNote({ bad: false, text: accept ? `You've joined the crew for “${inv.tripTitle}”. It's now in your trips.` : "Declined. The operator has been told." });
  };

  return (
    <div className="mb-4">
      {note && (
        <div className="rounded-xl px-3.5 py-3 mb-3 text-[13px] leading-snug" style={{ background: note.bad ? C.maroonSoft : C.pineSoft, color: note.bad ? C.maroon : C.pine }}>
          {note.text}
        </div>
      )}
      {asks.map((inv) => {
        const r = crewReadiness(me, inv.role);
        return (
          <div key={inv.id} className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1.5px solid ${C.gold}66` }}>
            <div className="text-[11px] font-semibold tracking-[.12em] uppercase" style={{ color: C.goldText }}>Trip request</div>
            <div className="text-[16px] font-semibold mt-1 leading-snug" style={{ color: C.ink }}>{inv.tripTitle}</div>
            <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>
              {inv.operatorName || "An operator"} wants you as <b className="capitalize" style={{ color: C.ink }}>{inv.role}</b>
              {inv.tripStart ? ` · ${fmtDate(inv.tripStart)}${inv.tripEnd ? ` – ${fmtDate(inv.tripEnd)}` : ""}` : ""}
            </div>
            {!r.ready && (
              <div className="rounded-xl p-3 mt-3" style={{ background: C.goldSoft }}>
                <div className="text-[12px] font-semibold mb-2" style={{ color: C.goldText }}>Before you can accept</div>
                <ReadinessList readiness={r} />
                <button type="button" onClick={() => setEditing(true)}
                  className="tap w-full h-10 rounded-lg text-[13px] font-semibold mt-3" style={{ background: C.pine, color: "#FFFFFF" }}>
                  Complete my profile
                </button>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => respond(inv, false)} disabled={!!busy}
                className="tap flex-1 h-11 rounded-xl text-[13px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>
                {busy === inv.id + "n" ? <Loader2 size={14} className="animate-spin" /> : "Decline"}
              </button>
              <button type="button" onClick={() => respond(inv, true)} disabled={!r.ready || !!busy}
                className="tap flex-[1.4] h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: r.ready ? C.pine : "#C7CEC7", color: "#FFFFFF" }}>
                {busy === inv.id + "y" ? <Loader2 size={14} className="animate-spin" /> : <><Check size={15} strokeWidth={3} /> Accept the trip</>}
              </button>
            </div>
          </div>
        );
      })}
      {editing && me && <ProfileEditor talent={me} onClose={() => setEditing(false)} onSaved={() => actions.reloadDirectory && actions.reloadDirectory()} />}
    </div>
  );
}

/* ── templates: an operator's signature activities, placed into a plan ───── */
// Where common Bhutanese experiences happen, for "Let Drukpah decide".
// First matching rule wins; towns are tried in order and must be on the route.
const DK_PLACE_RULES = [
  [/tiger|taktsang/i, ["paro"]],
  [/hot.?stone|dotsho|farm.?house|farmstay/i, ["paro", "haa", "punakha", "bumthang", "gangtey"]],
  [/archery|khuru|darts/i, ["thimphu", "paro", "punakha", "bumthang"]],
  [/raft|kayak|river/i, ["punakha", "wangdue"]],
  [/crane|phobjikha|black.?necked/i, ["gangtey", "yangtse"]],
  [/weav|textile|kishuthara|kira|gho\b/i, ["thimphu", "lhuentse", "trashigang", "bumthang"]],
  [/cheese|brew|beer|apple|swiss/i, ["bumthang"]],
  [/chele|haa|white temple|black temple/i, ["haa", "paro"]],
  [/dochula|108 chorten/i, ["punakha", "thimphu"]],
  [/fertility|chimi|phallus/i, ["punakha"]],
  [/burning lake|mebar/i, ["bumthang"]],
  [/meditat|monk|blessing|astrolog|butter lamp|prayer|monastery|lhakhang|dzong/i, ["punakha", "paro", "thimphu", "bumthang", "gangtey"]],
  [/hike|trek|walk|trail/i, ["paro", "thimphu", "gangtey", "bumthang", "haa"]],
  [/market|craft|paper|incense|zorig|art school/i, ["thimphu", "paro"]],
  [/cook|cooking|ema datshi|momo|food|dinner|lunch|picnic|tea/i, []],   // fits anywhere: the longest stay
];

/** place template items into a plan; returns { days, placed, unplaced } (does not mutate the plan) */
function dkPlaceTemplate(plan, items) {
  const days = plan.days.map((d) => ({ ...d, acts: d.acts.slice(), signature: [], brief: [] }));
  const nights = {};                                         // town → indexes of days ending there
  days.forEach((d, i) => { if (d.night) (nights[d.night] = nights[d.night] || []).push(i); });
  const stay = Object.keys(nights).sort((a, b) => nights[b].length - nights[a].length);
  // a day has room if it isn't a long drive, and it isn't full yet
  // the Tiger's Nest day is already demanding: one extra at most (a hot-stone bath is ideal afterwards)
  const hard = (d) => d.acts.some((a) => /Tiger's Nest/.test(a));
  const room = (i) => { const d = days[i]; return (d.moving ? (d.h <= 3.5 ? 1 : 0) : hard(d) ? 1 : 2) - d.signature.length - d.brief.length; };
  const bestDayIn = (town) => {
    const idx = (nights[town] || []).filter((i) => room(i) > 0);
    // prefer full days in town, then the lightest day
    idx.sort((a, b) => (days[a].moving - days[b].moving) || (days[a].acts.length - days[b].acts.length));
    return idx.length ? idx[0] : -1;
  };
  const placed = [], unplaced = [];
  for (const it of items || []) {
    const title = String((it && it.title) || "").trim();
    if (!title) continue;
    let candidates;
    if (it.town && it.town !== "auto") candidates = [it.town];
    else {
      const rule = DK_PLACE_RULES.find(([re]) => re.test(title));
      candidates = rule && rule[1].length ? rule[1] : stay;      // no rule, or "anywhere": longest stay first
    }
    let at = -1, where = null;
    for (const town of candidates) { at = bestDayIn(town); if (at >= 0) { where = town; break; } }
    if (at < 0) { unplaced.push({ title, town: it.town && it.town !== "auto" ? it.town : null }); continue; }
    if (days[at].acts.some((a) => a.toLowerCase() === title.toLowerCase())) { placed.push({ title, day: days[at].day, town: where }); continue; }
    (it.source === "brief" ? days[at].brief : days[at].signature).push(title);
    days[at].acts.push(title);
    placed.push({ title, day: days[at].day, town: where });
  }
  return { days, placed, unplaced };
}



/* ── Drukpah writes titles and a summary itself: no AI needed ────────────── */
function dkDayTitle2(d, i, n) {
  const T = (k) => (DK_TOWNS[k] ? DK_TOWNS[k].n : k);
  if (!d.night) return "Farewell to Bhutan";
  if (d.acts.some((a) => /Tiger's Nest/.test(a))) return "The Tiger's Nest";
  if (i === 0) return `Arrival and on to ${T(d.to)}`;
  if (d.moving && d.to) {
    const pass = d.passes && d.passes.length ? DK_PASSES[d.passes[d.passes.length - 1]] : null;
    return pass ? `Over ${pass.n} to ${T(d.to)}` : `${T(d.from)} to ${T(d.to)}`;
  }
  return `A day in ${T(d.from)}`;
}

function dkSummary(f, plan, templateName, signature) {
  const seq = plan.seq || [];
  const region = seq.some((t) => ["mongar", "trashigang", "yangtse", "lhuentse", "sjongkhar"].includes(t)) ? "across Bhutan from west to east"
    : seq.some((t) => ["trongsa", "bumthang"].includes(t)) ? "through western and central Bhutan" : "through western Bhutan";
  const who = [f.adults ? `${f.adults} adult${f.adults > 1 ? "s" : ""}` : "", f.seniors ? `${f.seniors} senior${f.seniors > 1 ? "s" : ""}` : "",
               f.kids ? `${f.kids} child${f.kids > 1 ? "ren" : ""}` : "", f.under6 ? `${f.under6} under six` : ""].filter(Boolean).join(", ");
  const pace = { relaxed: "relaxed", standard: "well-paced", active: "active" }[f.pace] || "well-paced";
  const month = f.month ? ` in ${["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][f.month]}` : "";
  const ending = plan.exit === "sjongkhar" ? ", leaving by road at Samdrup Jongkhar" : plan.exit === "phuentsholing" ? ", leaving by road at Phuentsholing" : "";
  let s = `A ${pace} ${plan.nights}-night journey ${region}${who ? ` for ${who}` : ""}${month}${ending}.`;
  const sig = (signature || []).filter(Boolean);
  if (templateName && sig.length) s += ` Built around ${templateName}: ${sig.slice(0, 3).join(", ")}${sig.length > 3 ? ` and ${sig.length - 3} more` : ""}.`;
  return s;
}

/* ========================================================================== */
/*  DRUKPAH TEMPLATES — an operator's signature activities                    */
/* ========================================================================== */
const DK_TOWN_CHOICES = Object.entries(DK_TOWNS).filter(([, t]) => t.stay).map(([k, t]) => [k, t.n]);

function useDrukpahTemplates(user) {
  const [state, setState] = useState({ templates: [], loading: true, error: null });
  const meId = user ? (user.talentId || user.id) : null;
  const reload = async () => {
    if (!CLOUD || !meId) { setState({ templates: [], loading: false, error: null }); return; }
    const { data, error } = await supabase.from("drukpah_templates").select("*").eq("operator_id", meId).order("updated_at", { ascending: false });
    if (error) { console.warn("drukpah_templates:", error.message); setState({ templates: [], loading: false, error: error.message }); return; }
    setState({ templates: (data || []).map((r) => ({ id: r.id, name: r.name || "Untitled", items: Array.isArray(r.items) ? r.items : [] })), loading: false, error: null });
  };
  useEffect(() => { reload(); }, [meId]);
  return { ...state, reload };
}

function TemplateEditor({ user, template, onSaved, onCancel }) {
  const t = template || {};
  const [name, setName] = useState(t.name || "");
  const [items, setItems] = useState((t.items && t.items.length ? t.items : [{ title: "", town: "auto" }]).map((x) => ({ title: x.title || "", town: x.town || "auto" })));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const setItem = (i, k, v) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };

  const save = async () => {
    const clean = items.map((x) => ({ title: x.title.trim(), town: x.town || "auto" })).filter((x) => x.title);
    if (!name.trim()) { setErr("Give the template a name."); return; }
    if (!clean.length) { setErr("Add at least one activity."); return; }
    setBusy(true); setErr(null);
    const meId = user.talentId || user.id;
    const row = { operator_id: meId, name: name.trim(), items: clean, updated_at: new Date().toISOString() };
    const res = t.id
      ? await supabase.from("drukpah_templates").update(row).eq("id", t.id)
      : await supabase.from("drukpah_templates").insert(row);
    setBusy(false);
    if (res.error) { setErr("Couldn't save — " + res.error.message); return; }
    onSaved && onSaved();
  };

  return (
    <div className="fade">
      <button type="button" onClick={onCancel} className="tap inline-flex items-center gap-1 text-[13px] font-semibold mb-3" style={{ color: C.pine }}>
        <ChevronLeft size={16} /> My templates
      </button>
      <div className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <label className="block">
          <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Template name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Our signature western loop"
            className="w-full h-12 px-4 rounded-xl text-[15px]" style={field} />
        </label>
      </div>

      <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-1" style={{ color: C.goldText }}>Things you do differently</div>
      <p className="text-[12px] mb-3 leading-snug" style={{ color: C.muted }}>
        One per line, with the town where it happens — or let Drukpah decide. These go into every itinerary you draft with this template.
      </p>
      <div className="space-y-2 mb-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex gap-2">
              <input value={it.title} onChange={(e) => setItem(i, "title", e.target.value)} maxLength={120}
                placeholder="e.g. Hot-stone bath at a farmhouse" aria-label={`Activity ${i + 1}`}
                className="flex-1 min-w-0 h-11 px-3 rounded-lg text-[14px]" style={field} />
              <button type="button" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} aria-label={`Remove activity ${i + 1}`}
                className="tap w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.bg }}>
                <X size={15} color={C.muted} />
              </button>
            </div>
            <select value={it.town} onChange={(e) => setItem(i, "town", e.target.value)} aria-label={`Where activity ${i + 1} happens`}
              className="w-full h-10 px-3 rounded-lg text-[13px] mt-2" style={field}>
              <option value="auto">Let Drukpah decide</option>
              {DK_TOWN_CHOICES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
            </select>
          </div>
        ))}
      </div>
      {items.length < 30 && (
        <button type="button" onClick={() => setItems((xs) => [...xs, { title: "", town: "auto" }])}
          className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2 mb-4"
          style={{ background: C.goldSoft, color: C.goldText }}>
          <Plus size={16} strokeWidth={2.6} /> Add an activity
        </button>
      )}
      {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
      <button type="button" onClick={save} disabled={busy}
        className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
        style={{ background: C.pine, color: "#FFFFFF" }}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : "Save template"}
      </button>
    </div>
  );
}

function TemplatesTab({ user, onDraft }) {
  const { templates, loading, error, reload } = useDrukpahTemplates(user);
  const [editing, setEditing] = useState(null);      // null | {} for new | a template
  const [confirmDel, setConfirmDel] = useState(null);

  if (editing) return <TemplateEditor user={user} template={editing.id ? editing : null}
    onSaved={() => { setEditing(null); reload(); }} onCancel={() => setEditing(null)} />;

  const del = async (id) => {
    await supabase.from("drukpah_templates").delete().eq("id", id);
    setConfirmDel(null); reload();
  };
  const townName = (k) => (k && k !== "auto" && DK_TOWNS[k] ? DK_TOWNS[k].n : "Drukpah decides");

  return (
    <div>
      <div className="rounded-2xl p-4 mb-4" style={{ background: C.pineSoft }}>
        <div className="text-[14px] font-semibold" style={{ color: C.pine }}>Your way of showing Bhutan</div>
        <p className="text-[13px] mt-1 leading-snug" style={{ color: C.pine }}>
          List the experiences you offer that others don't. When you draft a trip with a template, Drukpah fits them into the
          route and the AI writes the days around them and the trip description.
        </p>
      </div>
      <button type="button" onClick={() => setEditing({})}
        className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-4"
        style={{ background: C.pine, color: "#FFFFFF" }}>
        <Plus size={17} strokeWidth={2.6} /> New template
      </button>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" color={C.muted} /></div>
      ) : error ? (
        <Empty Icon={CalendarDays} title="Templates aren't available yet" body="They switch on once the templates table is set up in the database." />
      ) : templates.length === 0 ? (
        <Empty Icon={CalendarDays} title="No templates yet" body="Start with three or four signature experiences — you can always add more." />
      ) : (
        <div className="space-y-3">
          {templates.map((tp) => (
            <div key={tp.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{tp.name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{tp.items.length} {tp.items.length === 1 ? "activity" : "activities"}</div>
                </div>
                <button type="button" onClick={() => setEditing(tp)} className="tap h-9 px-3 rounded-lg text-[13px] font-semibold shrink-0"
                  style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>Edit</button>
              </div>
              <ul className="mt-2.5 space-y-1">
                {tp.items.slice(0, 4).map((it, k) => (
                  <li key={k} className="text-[13px] flex items-baseline gap-2" style={{ color: C.ink }}>
                    <span className="w-1 h-1 rounded-full shrink-0 translate-y-[-2px]" style={{ background: C.gold }} />
                    <span className="flex-1 min-w-0">{it.title} <span style={{ color: C.muted }}>· {townName(it.town)}</span></span>
                  </li>
                ))}
                {tp.items.length > 4 && <li className="text-[12px]" style={{ color: C.muted }}>and {tp.items.length - 4} more</li>}
              </ul>
              {confirmDel === tp.id ? (
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setConfirmDel(null)} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold"
                    style={{ background: C.bg, color: C.muted }}>Keep it</button>
                  <button type="button" onClick={() => del(tp.id)} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold"
                    style={{ background: C.maroon, color: "#FFFFFF" }}>Delete template</button>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setConfirmDel(tp.id)} aria-label={`Delete ${tp.name}`}
                    className="tap w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.bg }}>
                    <Trash2 size={15} color={C.muted} />
                  </button>
                  <button type="button" onClick={() => onDraft && onDraft(tp.id)}
                    className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                    style={{ background: C.pine, color: "#FFFFFF" }}>
                    Draft a trip with this <ArrowRight size={14} strokeWidth={2.4} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// interests → experiences Drukpah adds, placed by the same rules as a template
const DK_INTERESTS = [
  [/photograph|camera|photo/i, "photography", [{ title: "Sunrise over the Himalaya from Dochula", town: "auto" }, { title: "Golden-hour walk through Paro valley's rice terraces", town: "paro" }]],
  [/bird|birding|crane/i, "birds", [{ title: "Birdwatching on the Phobjikha valley trail", town: "gangtey" }, { title: "Early birdwatching along the Mo Chhu", town: "punakha" }]],
  [/hik|trek|walk/i, "walking", [{ title: "Walk to Cheri Monastery through blue pine forest", town: "thimphu" }, { title: "Hike to Khamsum Yulley Namgyal Chorten", town: "punakha" }]],
  [/food|cook|cuisine|eat|dinner|meal/i, "food", [{ title: "Cook a Bhutanese meal with a local family", town: "auto" }]],
  [/textile|weav|craft|art/i, "crafts", [{ title: "Weavers and the Textile Museum", town: "thimphu" }, { title: "Painting school and paper-making", town: "thimphu" }]],
  [/wellness|spa|bath|hot.?stone|relax/i, "wellness", [{ title: "Hot-stone bath at a farmhouse", town: "auto" }]],
  [/archery/i, "archery", [{ title: "An archery match with local players", town: "auto" }]],
  [/raft|kayak/i, "rafting", [{ title: "Rafting on the Mo Chhu", town: "punakha" }]],
  [/meditat|spiritual|buddh|monk|retreat/i, "spiritual", [{ title: "A morning meditation with a monk", town: "auto" }, { title: "Butter-lamp offering at an old lhakhang", town: "auto" }]],
  [/garden|flower|plant|botan/i, "gardens", [{ title: "Royal Botanical Park at Lamperi", town: "punakha" }]],
  [/histor|dzong|museum|cultur|temple|monaster/i, "culture", []],
  [/nature|scenery|mountain|valley/i, "nature", []],
];

/* ── reading a plain description, without any AI ──────────────────────────── */
const DK_WORDNUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15 };
const dkNum = (w) => (w === undefined ? null : /^\d+$/.test(w) ? Number(w) : DK_WORDNUM[w.toLowerCase()] ?? null);
const DK_MONTH_RE = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;
const DK_MONTH_IDX = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** Read nights, travellers, pace, hotels, month and exit from free text.
    Returns { fields, understood: [...], assumed: [...] } — never throws. */
function dkReadDescription(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  const low = t.toLowerCase();
  const NUM = "(\\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)";
  const f = { nights: null, exit: "paro", adults: 0, seniors: 0, kids: 0, under6: 0, pace: "standard", culture: true, nature: true, hotel: "3", month: 0 };
  const understood = [], assumed = [];

  // length
  let m;
  if ((m = low.match(new RegExp(`\\b${NUM}[ -]*nights?\\b`)))) f.nights = dkNum(m[1]);
  else if ((m = low.match(new RegExp(`\\b${NUM}[ -]*days?\\b`)))) f.nights = Math.max(1, (dkNum(m[1]) || 1) - 1);
  else if (/\bfortnight|two weeks|2 weeks\b/.test(low)) f.nights = 14;
  else if (/\b(a|one) week\b/.test(low)) f.nights = 7;
  else if (/\b(10|ten)[ -]day\b/.test(low)) f.nights = 9;
  if (f.nights != null) { f.nights = Math.max(3, Math.min(14, f.nights)); understood.push(`${f.nights} nights`); }
  else { f.nights = 7; assumed.push("7 nights — say how long if different"); }

  // travellers
  const ages = [...low.matchAll(/\b(\d{1,2})[ -]?(?:year|yr)s?[ -]?old/g)].map((x) => Number(x[1]));
  const agedPhrase = low.match(/\bage[sd]?\s+((?:\d{1,2}(?:\s*(?:,|and|&)\s*)?)+)/);          // "aged 4 and 9", "ages 7, 10"
  if (agedPhrase) for (const n of agedPhrase[1].match(/\d{1,2}/g) || []) ages.push(Number(n));
  for (const a of ages) { if (a < 6) f.under6++; else if (a <= 12) f.kids++; else if (a >= 65) f.seniors++; else f.adults++; }
  if ((m = low.match(new RegExp(`\\b${NUM} adults?\\b`)))) f.adults += dkNum(m[1]) || 0;
  if ((m = low.match(new RegExp(`\\b${NUM} (?:senior|elderly|retired|older) (?:people|guests|travellers|travelers|adults|couple)`)))) f.seniors += dkNum(m[1]) || 0;
  if ((m = low.match(new RegExp(`\\b${NUM} (?:teen|teenager)s?\\b`)))) f.adults += dkNum(m[1]) || 0;   // 13+ pay full SDF
  if ((m = low.match(new RegExp(`\\b${NUM} (?:young )?(?:kids?|children|child)\\b`))) && !ages.length) f.kids += dkNum(m[1]) || 0;
  if (/\b(toddler|baby|infant)s?\b/.test(low) && !ages.length) f.under6++;
  const seniorWords = /\b(in their (sixties|seventies|eighties|60s|70s|80s)|grandparents?|my (mother|father|mum|dad|parents)|seniors?|elderly|retired|pensioners?|aged (6[5-9]|[7-9]\d))\b/;
  if (seniorWords.test(low) && f.seniors === 0) {
    const two = /\b(couple|parents|grandparents|both)\b/.test(low);
    f.seniors += two ? 2 : 1;
    if (two && f.adults >= 2 && /\b(couple)\b/.test(low) && !/\badults?\b/.test(low)) f.adults -= 2;   // "a couple in their seventies"
  }
  if (/\b(and (me|i)|myself)\b/.test(low) && (f.seniors > 0 || f.kids > 0 || f.under6 > 0) && f.adults === 0) f.adults += 1;   // "my parents and me"
  if ((m = low.match(new RegExp(`\\bfamily of ${NUM}\\b`)))) {
    const total = dkNum(m[1]) || 0; const have = f.adults + f.seniors + f.kids + f.under6;
    if (total > have) f.adults += Math.max(0, total - have - (have ? 0 : 0)); // the rest are adults
  }
  if ((m = low.match(new RegExp(`\\b(?:group|party) of ${NUM}\\b`))) && f.adults + f.seniors + f.kids + f.under6 === 0) f.adults += dkNum(m[1]) || 0;
  if (/\b(a couple|two of us|my (wife|husband|partner) and i|honeymoon)\b/.test(low) && f.adults + f.seniors === 0) f.adults = 2;
  if (/\b(solo|on my own|alone|just me|myself)\b/.test(low) && f.adults + f.seniors + f.kids + f.under6 === 0) f.adults = 1;
  if (f.adults + f.seniors + f.kids + f.under6 === 0) { f.adults = 2; assumed.push("2 adults — say who's travelling if different"); }
  else {
    const who = [f.adults && `${f.adults} adult${f.adults > 1 ? "s" : ""}`, f.seniors && `${f.seniors} senior${f.seniors > 1 ? "s" : ""}`,
                 f.kids && `${f.kids} child${f.kids > 1 ? "ren" : ""} 6–12`, f.under6 && `${f.under6} under 6`].filter(Boolean).join(", ");
    understood.push(who);
  }

  // pace
  if (/\b(relaxed|relaxing|slow|slowly|gentle|gently|easy|easy-going|leisurely|unhurried|no long hikes?|not too much (driving|walking)|take it easy|rest days?)\b/.test(low)) { f.pace = "relaxed"; understood.push("relaxed pace"); }
  else if (/\b(active|adventurous|adventure|energetic|packed|trek\w*|lots of hiking|hike a lot|keen hikers?|fit and keen)\b/.test(low)) { f.pace = "active"; understood.push("active pace"); }
  else assumed.push("standard pace");
  if (f.seniors > 0 || f.under6 > 0) f.pace = f.pace === "active" ? "standard" : f.pace;   // the engine keeps days gentle anyway

  // interests
  const cult = /\b(temple|dzong|monaster|cultur|histor|festival|tshechu|buddhis|heritage|museum)\w*/.test(low);
  // "no long hikes" is not a wish to hike; photography sits between culture and nature
  const negatedWalk = /\b(no|not|avoid|without|skip|hate|can't|cannot)\s+(long\s+|much\s+|big\s+)?(hik|trek|walk)/.test(low);
  const nat = /\b(nature|bird|wildlife|mountain|valley|crane|scenery|outdoors|forest)\w*/.test(low)
    || (!negatedWalk && /\b(hik|trek|walk)\w*/.test(low));
  if (cult && !nat) { f.nature = false; understood.push("culture first"); }
  else if (nat && !cult) { f.culture = false; understood.push("nature and walks first"); }
  if (/\b(no|skip|not interested in|tired of) (temples|dzongs|monasteries)\b/.test(low)) { f.culture = false; f.nature = true; }

  // hotels
  if (/\b(luxury|luxurious|5[- ]star|five[- ]star|high[- ]end|top[- ]end|aman|amankora|six senses|como|pemako|best hotels?)\b/.test(low)) { f.hotel = "lux"; understood.push("luxury lodges"); }
  else if (/\b(homestays?|farmstays?|farm stays?|village stays?|with a (local )?family|local family|authentic stays?)\b/.test(low)) { f.hotel = "home"; understood.push("homestays"); }
  else if (/\b(4[- ]star|four[- ]star|boutique|comfortable|upscale|good hotels?|nice hotels?)\b/.test(low)) { f.hotel = "4"; understood.push("4-star hotels"); }
  else if (/\b(budget|3[- ]star|three[- ]star|simple hotels?|standard hotels?)\b/.test(low)) { f.hotel = "3"; understood.push("3-star hotels"); }
  else assumed.push("3-star hotels");

  // month
  if ((m = t.match(DK_MONTH_RE))) { f.month = DK_MONTH_IDX[m[1].slice(0, 3).toLowerCase()] || 0; if (f.month) understood.push(`travelling in ${["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][f.month]}`); }

  // how they leave
  if (/\b(phuentsholing|overland (to|into) india|out by road|drive out|exit by road|siliguri|bagdogra)\b/.test(low)) { f.exit = "phuentsholing"; understood.push("leaving via Phuentsholing"); }
  else if (/\b(samdrup ?jongkhar|guwahati|assam|cross (the|the whole) country|east to west|all the way east|exit (in the )?east)\b/.test(low)) { f.exit = "sjongkhar"; understood.push("leaving via Samdrup Jongkhar"); }

  // places that need length
  const wantsEast = /\b(mongar|trashigang|trashiyangtse|lhuentse|eastern bhutan|the east)\b/.test(low);
  const wantsCentral = /\b(bumthang|central bhutan|trongsa|jakar)\b/.test(low);
  if (wantsEast && f.exit === "paro") assumed.push("the east is mentioned: it needs 10+ nights and usually leaving via Samdrup Jongkhar");
  else if (wantsCentral && f.nights < 10) assumed.push(`Bumthang is mentioned but ${f.nights} nights is short for it — Drukpah fits central Bhutan from 10 nights`);

  // interests become experiences, placed by the same rules as a template
  const items = []; const named = [];
  for (const [re, name, extras] of DK_INTERESTS) {
    if (!re.test(t)) continue;
    if (name === "walking" && negatedWalk) continue;                 // they said no to hikes
    if (extras.length) named.push(name);
    for (const it of extras) items.push({ ...it, source: "brief" });
  }
  if (named.length) understood.push(`picks for ${named.join(", ")}`);
  return { fields: f, understood, assumed, items: items.slice(0, 6) };
}


/* ========================================================================== */
/*  DRUKPAH CREDITS — free monthly drafts, packs, requests, admin release      */
/* ========================================================================== */
const DK_PACKS = [25, 50, 100];

async function dkLoadSettings() {
  const out = { note: "", account: "", free: 10, aiOn: false, gmaps: "", mapProvider: "esri" };
  if (!CLOUD) return out;
  const { data } = await supabase.from("drukpah_settings").select("*");
  for (const r of data || []) {
    if (r.key === "google_maps_key") out.gmaps = (r.value || "").trim();
    if (r.key === "map_provider" && ["relief", "esri", "google"].includes(r.value)) out.mapProvider = r.value;
    if (r.key === "credits_payment_note") out.note = r.value || "";
    if (r.key === "credits_payment_account") out.account = r.value || "";
    if (r.key === "free_drafts_per_month") out.free = Number(r.value) || 10;
    if (r.key === "ai_drafts_enabled") out.aiOn = String(r.value).toLowerCase() === "on";
  }
  return out;
}

/** how many AI drafts the signed-in operator has, plus any open request */
function useDrukpahCredits(user) {
  const meId = user ? (user.talentId || user.id) : null;
  const [credits, setCredits] = useState(null);         // { free_left, purchased, total_left, allowance } | null = unknown
  const [openRequest, setOpenRequest] = useState(null);
  const [settings, setSettings] = useState(null);
  const reload = async () => {
    if (!CLOUD || !meId) return;
    const [{ data: st, error }, { data: reqs }] = await Promise.all([
      supabase.rpc("drukpah_credit_status"),
      supabase.from("drukpah_credit_requests").select("*").eq("operator_id", meId).eq("status", "open"),
    ]);
    if (error) { console.warn("drukpah_credit_status:", error.message); setCredits(null); }
    else if (st) setCredits({ free_left: Number(st.free_left) || 0, purchased: Math.max(0, Number(st.purchased) || 0),
                              total_left: Number(st.total_left) || 0, allowance: Number(st.allowance) || 0 });
    setOpenRequest((reqs || [])[0] || null);
    setSettings(await dkLoadSettings());
  };
  useEffect(() => { reload(); }, [meId]);
  return { credits, openRequest, settings, reload, setCredits };
}

function CreditsLine({ credits, onGetMore }) {
  if (!credits) return null;
  const none = credits.total_left <= 0;
  return (
    <div className="flex items-center justify-between gap-3 mt-3 rounded-xl px-3 py-2.5" style={{ background: none ? C.goldSoft : C.bg, border: `1px solid ${none ? C.gold + "66" : C.line}` }}>
      <div className="text-[12px] leading-snug" style={{ color: none ? C.goldText : C.muted }}>
        <b style={{ color: none ? C.goldText : C.ink }}>AI drafts:</b>{" "}
        {none ? "none left this month" : `${credits.free_left} free this month${credits.purchased ? ` · ${credits.purchased} purchased` : ""}`}
      </div>
      <button type="button" onClick={onGetMore} className="tap shrink-0 h-8 px-3 rounded-lg text-[12px] font-semibold"
        style={{ background: none ? C.pine : C.card, color: none ? "#FFFFFF" : C.pine, border: none ? "none" : `1px solid ${C.line}` }}>
        Get more
      </button>
    </div>
  );
}

/* the operator asks for a pack; the admin releases it from the Users screen */
function GetMoreSheet({ user, settings, openRequest, onClose, onSent }) {
  const [pack, setPack] = useState(50);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const send = async () => {
    setBusy(true); setErr(null);
    const { error } = await supabase.from("drukpah_credit_requests").insert({ operator_id: user.talentId || user.id, pack, note: note.trim() || null });
    setBusy(false);
    if (error) { setErr("Couldn't send the request — " + error.message); return; }
    onSent && onSent();
  };
  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 235 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "90dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>More AI drafts</div>
          <p className="text-[13px] mt-1 leading-snug" style={{ color: C.muted }}>
            Every operator gets {settings ? settings.free : 10} free drafts a month. Packs are added by the admin once you've paid.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto hidescroll px-5 pb-5" style={{ scrollbarWidth: "none" }}>
          {openRequest ? (
            <div className="rounded-2xl p-4" style={{ background: C.pineSoft }}>
              <div className="text-[14px] font-semibold" style={{ color: C.pine }}>Request sent {fmtDate(String(openRequest.created_at || "").slice(0, 10))}</div>
              <p className="text-[13px] mt-1 leading-snug" style={{ color: C.pine }}>
                {openRequest.pack} drafts requested. The admin adds them once your payment is seen — usually the same day. You'll get a message when they're in.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl p-4 mb-4" style={{ background: C.goldSoft }}>
                <div className="text-[11px] font-semibold tracking-[.12em] uppercase mb-1" style={{ color: C.goldText }}>How to pay</div>
                <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: C.ink }}>{(settings && settings.note) || "Ask the admin for payment details."}</p>
                {settings && settings.account && !/^set this/i.test(settings.account) ? (
                  <p className="text-[13px] mt-2 font-semibold whitespace-pre-line" style={{ color: C.ink }}>{settings.account}</p>
                ) : (
                  <p className="text-[13px] mt-2" style={{ color: C.goldText }}>The admin hasn't added payment details yet — message them for the account to pay into.</p>
                )}
              </div>
              <div className="text-[13px] font-medium mb-2" style={{ color: C.ink }}>Pack</div>
              <div className="flex gap-2 mb-4">
                {DK_PACKS.map((p) => <Chip key={p} on={pack === p} onClick={() => setPack(p)}>{p} drafts</Chip>)}
              </div>
              <label className="block mb-4">
                <span className="block text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Payment reference <span style={{ color: C.muted }}>· so the admin can match it</span></span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300}
                  placeholder="e.g. Paid Nu 500 by mBoB on 4 Oct, ref 48213"
                  className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              </label>
              {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
              <button type="button" onClick={send} disabled={busy}
                className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
                style={{ background: C.pine, color: "#FFFFFF" }}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : `Request ${pack} drafts`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}

/* ── admin ── */
async function dkReleaseCredits({ adminId, operatorId, amount, reason, requestId }) {
  const { error } = await supabase.from("drukpah_credits").insert({ operator_id: operatorId, delta: amount, reason: reason || "pack", by_admin: adminId });
  if (error) return { ok: false, reason: error.message };
  if (requestId) await supabase.from("drukpah_credit_requests").update({ status: "done", granted: amount, handled_by: adminId, handled_at: new Date().toISOString() }).eq("id", requestId);
  // tell them, as an official message (the app already shows these as notifications)
  const body = `${amount} AI drafts have been added to your Drukpah account. Thank you.`;
  const dm = await supabase.from("direct_messages").insert({ sender_id: adminId, recipient_id: operatorId, body, is_official: true });
  if (dm.error) await supabase.from("direct_messages").insert({ sender_id: adminId, recipient_id: operatorId, body });
  return { ok: true };
}

function AdminDraftsPanel({ adminId, onChanged }) {
  const [reqs, setReqs] = useState(null);
  const [settings, setSettings] = useState(null);
  const [editSettings, setEditSettings] = useState(false);
  const [busy, setBusy] = useState(null);
  const [custom, setCustom] = useState(null);     // request id choosing another amount
  const [flash, setFlash] = useState(null);
  const say = (m) => { setFlash(m); setTimeout(() => setFlash(null), 2600); };
  const load = async () => {
    if (!CLOUD) { setReqs([]); return; }
    const { data } = await supabase.from("drukpah_credit_requests").select("*").eq("status", "open").order("created_at", { ascending: true });
    setReqs(data || []); setSettings(await dkLoadSettings());
  };
  useEffect(() => { load(); }, []);

  const release = async (r, amount) => {
    setBusy(r.id);
    const res = await dkReleaseCredits({ adminId, operatorId: r.operator_id, amount, reason: "pack", requestId: r.id });
    setBusy(null); setCustom(null);
    if (!res.ok) { say("Couldn't add drafts — " + res.reason); return; }
    say(`${amount} drafts added for ${(PROFILE_DIR[r.operator_id] || {}).name || "the operator"}`);
    load(); onChanged && onChanged();
  };
  const decline = async (r) => {
    setBusy(r.id);
    await supabase.from("drukpah_credit_requests").update({ status: "declined", handled_by: adminId, handled_at: new Date().toISOString() }).eq("id", r.id);
    setBusy(null); load();
  };
  const saveSettings = async (next) => {
    setBusy("settings");
    const rows = [["credits_payment_note", next.note], ["credits_payment_account", next.account], ["free_drafts_per_month", String(next.free)],
                  ["ai_drafts_enabled", next.aiOn ? "on" : "off"], ["google_maps_key", (next.gmaps || "").trim()], ["map_provider", next.mapProvider || "esri"]]
      .map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("drukpah_settings").upsert(rows);
    setBusy(null);
    if (error) { say("Couldn't save — " + error.message); return; }
    setSettings(next); setEditSettings(false); say("Saved");
  };

  if (reqs === null) return null;
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold" style={{ color: C.ink }}>AI drafts</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{reqs.length ? `${reqs.length} ${reqs.length === 1 ? "request" : "requests"} waiting` : "No requests waiting"}</div>
        </div>
        <button type="button" onClick={() => setEditSettings((v) => !v)} className="tap h-9 px-3 rounded-lg text-[12px] font-semibold"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}>{editSettings ? "Close" : "Payment details"}</button>
      </div>
      {flash && <div className="text-[12px] mt-2 font-semibold" style={{ color: C.pine }}>{flash}</div>}

      {editSettings && settings && <AdminDraftSettings settings={settings} busy={busy === "settings"} onSave={saveSettings} />}

      {reqs.map((r) => {
        const p = PROFILE_DIR[r.operator_id];
        return (
          <div key={r.id} className="rounded-xl p-3 mt-3" style={{ background: C.bg }}>
            <div className="flex items-center gap-3">
              <Avatar initials={p ? p.initials : "?"} src={p ? p.photo : null} size={34} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{p ? p.name : r.operator_id}</div>
                <div className="text-[12px]" style={{ color: C.muted }}>Asked for {r.pack} drafts · {fmtDate(String(r.created_at || "").slice(0, 10))}</div>
              </div>
            </div>
            {r.note && <p className="text-[13px] mt-2 leading-snug" style={{ color: C.ink }}>“{r.note}”</p>}
            {custom === r.id ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {DK_PACKS.map((n) => (
                  <button key={n} type="button" onClick={() => release(r, n)} disabled={busy === r.id}
                    className="tap h-9 px-3 rounded-lg text-[12px] font-semibold" style={{ background: C.pine, color: "#FFFFFF" }}>Release {n}</button>
                ))}
                <button type="button" onClick={() => setCustom(null)} className="tap h-9 px-3 rounded-lg text-[12px] font-semibold" style={{ background: C.card, color: C.muted }}>Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => decline(r)} disabled={busy === r.id} className="tap h-10 px-3 rounded-lg text-[12px] font-semibold"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Decline</button>
                <button type="button" onClick={() => setCustom(r.id)} disabled={busy === r.id} className="tap h-10 px-3 rounded-lg text-[12px] font-semibold"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Other</button>
                <button type="button" onClick={() => release(r, r.pack || 50)} disabled={busy === r.id}
                  className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                  style={{ background: C.pine, color: "#FFFFFF" }}>
                  {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} strokeWidth={3} /> Release {r.pack || 50}</>}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdminDraftSettings({ settings, busy, onSave }) {
  const [s, setS] = useState({ note: settings.note, account: settings.account, free: settings.free, aiOn: !!settings.aiOn, gmaps: settings.gmaps || "", mapProvider: settings.mapProvider || "esri" });
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: C.bg }}>
      <div className="mb-3">
        <span className="block text-[12px] font-medium mb-1" style={{ color: C.ink }}>Itinerary map</span>
        <Segmented small value={s.mapProvider} onChange={(v) => setS({ ...s, mapProvider: v })} options={[["esri", "Satellite · free"], ["google", "Google"], ["relief", "Painted relief"]]} />
        <span className="block text-[11px] mt-1" style={{ color: C.muted }}>{s.mapProvider === "esri" ? "Esri satellite imagery and OpenTopoMap contours. No account, no card." : s.mapProvider === "google" ? "Google satellite and terrain with full place names. Needs the key below." : "The built-in hand-painted relief map."}</span>
      </div>
      <label className="block mb-3">
        <span className="block text-[12px] font-medium mb-1" style={{ color: C.ink }}>Google Maps key <span style={{ color: C.muted }}>· only for the Google option</span></span>
        <input value={s.gmaps} onChange={(e) => setS({ ...s, gmaps: e.target.value })} placeholder="AIza… (browser key, restricted to bhutantourismhub.com)" spellCheck={false}
          className="w-full h-10 px-3 rounded-lg text-[13px]" style={{ ...field, background: C.card }} />
        <span className="block text-[11px] mt-1" style={{ color: C.muted }}>Leave empty to keep the painted relief map.</span>
      </label>
      <div className="flex items-center justify-between gap-3 mb-3 rounded-lg px-3 py-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold" style={{ color: C.ink }}>AI drafting {s.aiOn ? "on" : "off"}</div>
          <div className="text-[11px] leading-snug" style={{ color: C.muted }}>
            {s.aiOn ? "Operators see Draft with AI and their draft count." : "Operators see only Drukpah's free builder. Turn on once the drukpah-draft function and API key are set up."}
          </div>
        </div>
        <button type="button" onClick={() => setS({ ...s, aiOn: !s.aiOn })} role="switch" aria-checked={s.aiOn} aria-label="AI drafting"
          className="tap shrink-0 w-12 h-7 rounded-full relative" style={{ background: s.aiOn ? C.pine : C.line }}>
          <span className="absolute top-0.5 w-6 h-6 rounded-full" style={{ background: "#FFFFFF", left: s.aiOn ? 22 : 2, transition: "left .15s" }} />
        </button>
      </div>
      <label className="block mb-3">
        <span className="block text-[12px] font-medium mb-1" style={{ color: C.ink }}>Free drafts per operator per month</span>
        <input type="number" min={0} max={500} value={s.free} onChange={(e) => setS({ ...s, free: Math.max(0, Number(e.target.value) || 0) })}
          className="w-full h-10 px-3 rounded-lg text-[14px]" style={{ ...field, background: C.card }} />
      </label>
      <label className="block mb-3">
        <span className="block text-[12px] font-medium mb-1" style={{ color: C.ink }}>Prices and how to pay <span style={{ color: C.muted }}>· operators see this</span></span>
        <textarea value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })} rows={4} maxLength={600}
          className="w-full px-3 py-2.5 rounded-lg text-[13px] resize-none" style={{ ...field, background: C.card }} />
      </label>
      <label className="block mb-3">
        <span className="block text-[12px] font-medium mb-1" style={{ color: C.ink }}>Account to pay into</span>
        <textarea value={s.account} onChange={(e) => setS({ ...s, account: e.target.value })} rows={2} maxLength={300}
          placeholder="e.g. Bank of Bhutan 2001 0000 0000 · Ugyen Singye · mBoB 17 12 34 56"
          className="w-full px-3 py-2.5 rounded-lg text-[13px] resize-none" style={{ ...field, background: C.card }} />
      </label>
      <button type="button" onClick={() => onSave(s)} disabled={busy} className="tap w-full h-10 rounded-lg text-[13px] font-semibold"
        style={{ background: C.pine, color: "#FFFFFF" }}>{busy ? <Loader2 size={14} className="animate-spin" /> : "Save"}</button>
    </div>
  );
}

/* on an operator's card in Users: add drafts directly (a payment made outside a request) */
function AdminAddDrafts({ adminId, operator, onClose, onDone }) {
  const [amount, setAmount] = useState(50);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!CLOUD) return;
    supabase.rpc("drukpah_credit_status", { p_user: operator.id }).then(({ data }) => { if (data) setStatus(data); });
  }, [operator.id]);
  const go = async () => {
    setBusy(true); setErr(null);
    const res = await dkReleaseCredits({ adminId, operatorId: operator.id, amount, reason: "pack" });
    setBusy(false);
    if (!res.ok) { setErr("Couldn't add drafts — " + res.reason); return; }
    onDone && onDone(amount); onClose();
  };
  return createPortal((
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 235 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl safe-bottom p-5" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
        <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Add AI drafts for {operator.name}</div>
        <p className="text-[13px] mt-1" style={{ color: C.muted }}>
          {status ? `Now: ${status.free_left} free left this month · ${Math.max(0, Number(status.purchased) || 0)} purchased` : "Loading their balance…"}
        </p>
        <div className="flex gap-2 mt-4 mb-4">
          {DK_PACKS.map((n) => <Chip key={n} on={amount === n} onClick={() => setAmount(n)}>{n}</Chip>)}
        </div>
        {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
        <button type="button" onClick={go} disabled={busy} className="tap w-full h-12 rounded-xl text-[15px] font-semibold"
          style={{ background: C.pine, color: "#FFFFFF" }}>{busy ? <Loader2 size={18} className="animate-spin" /> : `Add ${amount} drafts`}</button>
      </div>
    </div>
  ), document.body);
}

/* ============================================================================
   INSIGHTS — what an operator's trips and enquiries say, worked out by rules.
   Pure functions: given trips and enquiries, return numbers, chart data and
   plain-language suggestions. No AI, no network.
   ========================================================================== */
const DK_COUNTRIES = [
  "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Czechia", "Denmark", "Finland", "France", "Germany",
  "Hong Kong", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Malaysia", "Maldives", "Mexico", "Nepal", "Netherlands",
  "New Zealand", "Norway", "Philippines", "Poland", "Portugal", "Russia", "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka",
  "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "United Arab Emirates", "United Kingdom", "United States", "Vietnam", "Other",
];
const ALIAS = {
  usa: "United States", us: "United States", america: "United States", "united states of america": "United States",
  uk: "United Kingdom", britain: "United Kingdom", "great britain": "United Kingdom", england: "United Kingdom", scotland: "United Kingdom",
  uae: "United Arab Emirates", korea: "South Korea", "republic of korea": "South Korea", holland: "Netherlands", "czech republic": "Czechia",
  "hong kong sar": "Hong Kong", deutschland: "Germany", aus: "Australia", nz: "New Zealand", prc: "China", "people's republic of china": "China",
};
function normCountry(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  const low = t.toLowerCase().replace(/\./g, "").trim();          // "U.S.A." → "usa"
  if (ALIAS[low]) return ALIAS[low];
  const hit = DK_COUNTRIES.find((c) => c.toLowerCase() === low);
  if (hit) return hit;
  return t[0].toUpperCase() + t.slice(1);
}

const DK_REGION_TOWNS = {
  "Western Bhutan": ["Paro", "Thimphu", "Punakha", "Haa", "Gangtey", "Phobjikha", "Wangdue", "Dochula", "Chele La"],
  "Central Bhutan": ["Trongsa", "Bumthang", "Jakar", "Ura", "Zhemgang", "Gelephu"],
  "Eastern Bhutan": ["Mongar", "Trashigang", "Trashiyangtse", "Lhuentse", "Samdrup Jongkhar"],
};

const DAY = 86400e3;
const yearOf = (iso) => (iso ? Number(String(iso).slice(0, 4)) : NaN);
const monthOf = (iso) => (iso ? Number(String(iso).slice(5, 7)) - 1 : NaN);
const DK_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ageBand(dob, onDate) {
  if (!dob) return null;
  const d = new Date(dob + "T00:00"), at = new Date((onDate || new Date().toISOString().slice(0, 10)) + "T00:00");
  if (isNaN(d) || isNaN(at)) return null;
  let a = at.getFullYear() - d.getFullYear();
  if (at.getMonth() < d.getMonth() || (at.getMonth() === d.getMonth() && at.getDate() < d.getDate())) a--;
  if (a < 6) return "under6";
  if (a < 13) return "child";
  if (a >= 65) return "senior";
  return "adult";
}

/** @param {{trips, enquiries, operatorId, year, now?}} o  year: a number, or "all" */
function dkInsights(o) {
  const now = o.now || Date.now();
  const thisYear = new Date(now).getFullYear();
  const year = o.year === "all" ? "all" : Number(o.year || thisYear);
  const prevYear = year === "all" ? null : year - 1;
  const mine = (o.trips || []).filter((t) => t && (!o.operatorId || t.operatorId === o.operatorId));
  const enq = (o.enquiries || []).filter((e) => e && (!o.operatorId || e.operatorId === o.operatorId));
  const inYear = (iso, y) => (y === "all" ? true : yearOf(iso) === y);
  const tripsY = mine.filter((t) => inYear(t.start, year));
  const tripsPrev = prevYear ? mine.filter((t) => inYear(t.start, prevYear)) : [];
  const createdIso = (e) => { const d = new Date(e.createdAt || NaN); return isNaN(d) ? "" : d.toISOString().slice(0, 10); };  // a bad row never crashes the page
  const enqY = enq.filter((e) => inYear(createdIso(e), year));
  const enqPrev = prevYear ? enq.filter((e) => inYear(createdIso(e), prevYear)) : [];

  const nights = (t) => { const n = (new Date(t.end + "T00:00") - new Date(t.start + "T00:00")) / DAY; return isFinite(n) ? Math.max(0, Math.round(n)) : 0; };
  const guestsOf = (t) => ((t.guests && t.guests.length) ? t.guests.length : (t.guestCount || 0));
  const sum = (xs, f) => xs.reduce((a, x) => a + (f(x) || 0), 0);

  const kpi = {
    trips: tripsY.length, tripsPrev: tripsPrev.length,
    nights: sum(tripsY, nights), nightsPrev: sum(tripsPrev, nights),
    guests: sum(tripsY, guestsOf), guestsPrev: sum(tripsPrev, guestsOf),
    guestNights: sum(tripsY, (t) => guestsOf(t) * nights(t)),
    enquiries: enqY.length, enquiriesPrev: enqPrev.length,
    won: enqY.filter((e) => e.status === "won").length, lost: enqY.filter((e) => e.status === "lost").length,
    open: enqY.filter((e) => ["new", "quoted", "cold"].includes(e.status)).length,
  };
  kpi.conversion = kpi.won + kpi.lost ? kpi.won / (kpi.won + kpi.lost) : null;
  const prevWon = enqPrev.filter((e) => e.status === "won").length, prevLost = enqPrev.filter((e) => e.status === "lost").length;
  kpi.conversionPrev = prevWon + prevLost ? prevWon / (prevWon + prevLost) : null;
  kpi.sdfEstimate = kpi.guestNights * 100;          // USD, adult rate; children pay less, so this is an upper bound

  // trips by month, this year and last
  const byMonth = DK_MONTHS_SHORT.map((m, i) => ({
    month: m,
    trips: tripsY.filter((t) => monthOf(t.start) === i).length,
    prev: tripsPrev.filter((t) => monthOf(t.start) === i).length,
    guests: sum(tripsY.filter((t) => monthOf(t.start) === i), guestsOf),
  }));

  // guests by country: the roster where it exists, otherwise won enquiries
  const fromRoster = {}; let rosterGuests = 0;
  for (const t of tripsY) for (const g of t.guests || []) { const c = normCountry(g.nationality) || "Not recorded"; fromRoster[c] = (fromRoster[c] || 0) + 1; rosterGuests++; }
  const fromEnq = {};
  for (const e of enqY.filter((x) => x.status === "won")) { const c = normCountry(e.country) || "Not recorded"; fromEnq[c] = (fromEnq[c] || 0) + (Number(e.partySize) || 1); }
  const countrySource = rosterGuests > 0 ? "roster" : Object.keys(fromEnq).length ? "enquiries" : "none";
  const countryMap = countrySource === "roster" ? fromRoster : fromEnq;
  const countries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }));
  const countryTotal = sum(countries, (c) => c.n);
  const topCountries = countries.slice(0, 8);
  const rest = countries.slice(8).reduce((a, c) => a + c.n, 0);
  if (rest) topCountries.push({ name: "Other", n: rest });
  for (const c of topCountries) c.share = countryTotal ? c.n / countryTotal : 0;

  // where trips go, from itinerary text
  const regionCounts = Object.keys(DK_REGION_TOWNS).map((r) => ({ name: r, n: 0 }));
  const townCounts = {};
  for (const t of tripsY) {
    const text = ((t.itinerary || []).map((d) => d.title).join(" ") + " " + (t.title || "")).toLowerCase();
    for (const r of regionCounts) {
      const towns = DK_REGION_TOWNS[r.name].filter((tw) => text.includes(tw.toLowerCase()));
      if (towns.length) { r.n++; for (const tw of towns) townCounts[tw] = (townCounts[tw] || 0) + 1; }
    }
  }
  const towns = Object.entries(townCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, n]) => ({ name, n }));

  // enquiries: sources, lost reasons, by country conversion
  const count = (xs, key) => { const m = {}; for (const x of xs) { const k = key(x) || "Not recorded"; m[k] = (m[k] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n })); };
  const sources = count(enqY, (e) => e.source);
  const lostReasons = count(enqY.filter((e) => e.status === "lost"), (e) => e.lostReason);
  const byCountryConv = {};
  for (const e of enqY) {
    if (!["won", "lost"].includes(e.status)) continue;
    const c = normCountry(e.country) || "Not recorded"; const b = (byCountryConv[c] = byCountryConv[c] || { name: c, won: 0, lost: 0 });
    b[e.status]++;
  }
  const countryConv = Object.values(byCountryConv).map((b) => ({ ...b, decided: b.won + b.lost, rate: b.won / (b.won + b.lost) })).filter((b) => b.decided >= 3).sort((a, b) => b.decided - a.decided);

  // crew readiness for upcoming trips
  const soon = mine.filter((t) => { const d = (new Date(t.start + "T00:00") - now) / DAY; return d >= 0 && d <= 14; });
  const crewGaps = soon.filter((t) => (t.members || []).filter((m) => m.roleInTrip !== "operator").length === 0);
  const unanswered = enq.filter((e) => ["new"].includes(e.status) && !e.lastContacted && (now - e.createdAt) / DAY >= 2);

  // suggestions, only where the data supports them
  const tips = [];
  const pct = (x) => `${Math.round(x * 100)}%`;
  const noRoster = tripsY.filter((t) => !(t.guests && t.guests.length)).length;
  if (tripsY.length && noRoster) tips.push({ level: "info", text: `${noRoster} of ${tripsY.length} trips ${year === "all" ? "" : `in ${year} `}have no guest list yet. Add guests' nationalities to those trips and the country chart will show who really travels with you.` });
  if (kpi.conversion !== null) for (const b of countryConv) {
    if (b.rate < kpi.conversion - 0.15) tips.push({ level: "warn", text: `Enquiries from ${b.name} convert at ${pct(b.rate)}, against ${pct(kpi.conversion)} overall (${b.decided} decided). Worth looking at what those guests ask for and how fast they hear back.` });
  }
  if (lostReasons.length && lostReasons[0].n >= 3) {
    const r = lostReasons[0].name, n = lostReasons[0].n;
    const tipFor = { "Price too high": "Offer a shorter or simpler version of the same trip in the first reply, so there is a price to say yes to.",
      "No reply": "These went quiet. A follow-up within two days of quoting recovers some of them — the Bookings tab reminds you.",
      "Dates unavailable": "Keep a list of alternative dates handy; many guests are flexible by a week.",
      "Chose another operator": "Ask the ones who tell you why. Speed of the first quote is the commonest reason.",
      "Trip postponed": "Set a follow-up date on each; postponed trips often come back next season." }[r] || "Look for a pattern in these.";
    tips.push({ level: "warn", text: `"${r}" is your commonest reason for losing an enquiry (${n} this period). ${tipFor}` });
  }
  if (tripsY.length >= 6) {
    const sorted = [...byMonth].sort((a, b) => b.trips - a.trips); const top2 = sorted[0].trips + sorted[1].trips;
    if (top2 / tripsY.length >= 0.5) tips.push({ level: "info", text: `${sorted[0].month} and ${sorted[1].month} carry ${pct(top2 / tripsY.length)} of your trips. Spring (March–May) and the quieter months are where new marketing pays off most.` });
  }
  if (unanswered.length) tips.push({ level: "warn", text: `${unanswered.length} new ${unanswered.length === 1 ? "enquiry has" : "enquiries have"} waited two days or more without contact. Most are lost after that.` });
  if (crewGaps.length) tips.push({ level: "warn", text: `${crewGaps.length} ${crewGaps.length === 1 ? "trip starts" : "trips start"} within two weeks with no guide or driver yet. Add crew from the trip's page.` });
  if (prevYear && kpi.tripsPrev) {
    const ch = (kpi.trips - kpi.tripsPrev) / kpi.tripsPrev;
    tips.push({ level: ch >= 0 ? "good" : "info", text: `${kpi.trips} trips in ${year} against ${kpi.tripsPrev} in ${prevYear}: ${ch >= 0 ? "up" : "down"} ${pct(Math.abs(ch))}.` });
  }
  if (sources.length >= 2 && sources[0].n / Math.max(1, enqY.length) >= 0.6) tips.push({ level: "info", text: `${pct(sources[0].n / enqY.length)} of enquiries come from ${sources[0].name}. A second steady source — referrals from past guests, or one agent abroad — would make the business less fragile.` });
  if (!tripsY.length && !enqY.length) tips.push({ level: "info", text: "Nothing to analyse yet. Once trips and enquiries are recorded here, this page fills itself in." });

  return { year, prevYear, kpi, byMonth, countries: topCountries, countrySource, countryTotal, regions: regionCounts, towns, sources, lostReasons, countryConv, crewGaps, unanswered, tips };
}


/* ========================================================================== */
/*  GUEST ROSTER — who is travelling, for visa clearance, the brief, and insights */
/* ========================================================================== */
const AGE_LABEL = { under6: "under 6 · no SDF", child: "6–12 · half SDF", adult: "adult", senior: "65+" };

function guestBands(guests, onDate) {
  const b = { under6: 0, child: 0, adult: 0, senior: 0, unknown: 0 };
  for (const g of guests || []) { const k = ageBand(g.dob, onDate); if (k) b[k]++; else b.unknown++; }
  return b;
}

function GuestRoster({ trip, canEdit, actions }) {
  const guests = trip.guests || [];
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", nationality: "", dob: "", passport: "", expiry: "", dietary: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  const bands = guestBands(guests, trip.start);
  const expiryWarn = (g) => g.passportExpiry && trip.end && (new Date(g.passportExpiry) - new Date(trip.end)) / 86400e3 < 183;

  const syncCount = async (n) => {
    if (n && trip.guestCount !== n) { try { await supabase.from("trips").update({ guest_count: n }).eq("id", trip.id); } catch (e) {} }
  };
  const add = async () => {
    if (f.name.trim().length < 2) { setErr("Enter the guest's name as it appears in the passport."); return; }
    setBusy(true); setErr(null);
    const row = { trip_id: trip.id, full_name: f.name.trim(), nationality: normCountry(f.nationality) || null, date_of_birth: f.dob || null,
                  passport_no: f.passport.trim().toUpperCase() || null, passport_expiry: f.expiry || null, dietary: f.dietary.trim() || null };
    const { error } = await supabase.from("trip_guests").insert(row);
    setBusy(false);
    if (error) { setErr("Couldn't save — " + error.message); return; }
    await syncCount(guests.length + 1);
    setF({ name: "", nationality: "", dob: "", passport: "", expiry: "", dietary: "" }); setAdding(false);
    actions.reloadTrips && actions.reloadTrips();
  };
  const remove = async (id) => {
    const { error } = await supabase.from("trip_guests").delete().eq("id", id);
    setConfirmDel(null);
    if (error) { setErr("Couldn't remove — " + error.message); return; }
    await syncCount(Math.max(0, guests.length - 1));
    actions.reloadTrips && actions.reloadTrips();
  };

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Guests</div>
          <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>
            {guests.length === 0 ? "No one listed yet" :
              [`${guests.length} ${guests.length === 1 ? "guest" : "guests"}`, bands.senior ? `${bands.senior} aged 65+` : "", bands.child ? `${bands.child} aged 6–12` : "",
               bands.under6 ? `${bands.under6} under 6` : ""].filter(Boolean).join(" · ")}
          </div>
        </div>
        {canEdit && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="tap h-9 px-3 rounded-lg text-[13px] font-semibold shrink-0 inline-flex items-center gap-1"
            style={{ background: C.goldSoft, color: C.goldText }}><UserPlus size={14} /> Add guest</button>
        )}
      </div>

      {guests.length > 0 && (
        <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.lineSoft}` }}>
          {guests.map((g, k) => {
            const band = ageBand(g.dob, trip.start);
            return (
              <div key={g.id} className="px-3 py-2.5 flex items-start gap-3" style={{ borderTop: k ? `1px solid ${C.lineSoft}` : "none" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{g.name}</div>
                  <div className="text-[12px]" style={{ color: C.muted }}>
                    {[g.nationality, band ? AGE_LABEL[band] : null, g.dietary].filter(Boolean).join(" · ") || "No details yet"}
                  </div>
                  {canEdit && (g.passportNo || g.passportExpiry) && (
                    <div className="text-[12px] mt-0.5" style={{ color: expiryWarn(g) ? C.maroon : C.muted }}>
                      Passport {g.passportNo ? `…${String(g.passportNo).slice(-4)}` : ""}{g.passportExpiry ? ` · valid to ${new Date(g.passportExpiry + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      {expiryWarn(g) ? " · less than 6 months after the trip" : ""}
                    </div>
                  )}
                </div>
                {canEdit && (confirmDel === g.id ? (
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => setConfirmDel(null)} className="tap h-8 px-2 rounded-lg text-[12px]" style={{ background: C.bg, color: C.muted }}>Keep</button>
                    <button type="button" onClick={() => remove(g.id)} className="tap h-8 px-2 rounded-lg text-[12px] font-semibold" style={{ background: C.maroon, color: "#FFFFFF" }}>Remove</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDel(g.id)} aria-label={`Remove ${g.name}`} className="tap w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.bg }}>
                    <X size={13} color={C.muted} />
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <div className="mt-3 rounded-xl p-3" style={{ background: C.bg }}>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={80} placeholder="Full name, as in the passport" aria-label="Guest name"
            className="w-full h-11 px-3 rounded-lg text-[14px] mb-2" style={{ ...field, background: C.card }} />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={f.nationality} onChange={(e) => set("nationality", e.target.value)} aria-label="Nationality"
              className="h-11 px-2 rounded-lg text-[13px]" style={{ ...field, background: C.card }}>
              <option value="">Nationality</option>
              {DK_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} aria-label="Date of birth"
              className="h-11 px-2 rounded-lg text-[13px]" style={{ ...field, background: C.card }} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={f.passport} onChange={(e) => set("passport", e.target.value.toUpperCase())} maxLength={20} placeholder="Passport no." aria-label="Passport number"
              className="h-11 px-3 rounded-lg text-[13px]" style={{ ...field, background: C.card, letterSpacing: ".04em" }} />
            <input type="date" value={f.expiry} onChange={(e) => set("expiry", e.target.value)} aria-label="Passport expiry"
              className="h-11 px-2 rounded-lg text-[13px]" style={{ ...field, background: C.card }} />
          </div>
          <input value={f.dietary} onChange={(e) => set("dietary", e.target.value)} maxLength={120} placeholder="Dietary or medical notes the crew should know" aria-label="Dietary or medical notes"
            className="w-full h-11 px-3 rounded-lg text-[13px] mb-1" style={{ ...field, background: C.card }} />
          <p className="text-[11px] mb-3 leading-snug" style={{ color: C.muted }}>Date of birth sets the SDF band. Passport details stay with you; the crew see only names, nationality and dietary notes.</p>
          {err && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setErr(null); }} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold" style={{ background: C.card, color: C.muted }}>Cancel</button>
            <button type="button" onClick={add} disabled={busy} className="tap flex-[1.4] h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center" style={{ background: C.pine, color: "#FFFFFF" }}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : "Add to the trip"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  INSIGHTS — the operator's dashboard                                       */
/* ========================================================================== */
function InsBars({ rows, total, unit = "" }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2" title={`${r.name}: ${r.n}`}>
          <div className="text-[12px] w-[38%] truncate" style={{ color: C.ink }}>{r.name}</div>
          <div className="flex-1 h-4 rounded-md overflow-hidden" style={{ background: C.bg }}>
            <div className="h-full rounded-md" style={{ width: `${(r.n / max) * 100}%`, background: C.pine, minWidth: r.n ? 4 : 0 }} />
          </div>
          <div className="text-[12px] w-14 text-right" style={{ color: C.muted }}>{r.n}{unit}{total ? ` · ${Math.round((r.n / total) * 100)}%` : ""}</div>
        </div>
      ))}
    </div>
  );
}

function InsMonths({ byMonth, prevYear }) {
  const max = Math.max(1, ...byMonth.map((m) => Math.max(m.trips, m.prev)));
  const W = 360, H = 120, pad = 6, bw = (W - pad * 2) / 12, top = 14;   // headroom so every label sits above its bar
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full block" role="img" aria-label="Trips by month">
        {byMonth.map((m, i) => {
          const x = pad + i * bw, hT = (m.trips / max) * (H - top), hP = (m.prev / max) * (H - top);
          return (
            <g key={m.month}>
              {prevYear && <rect x={x + 2} y={H - hP} width={bw * 0.42} height={hP} rx="2" fill={C.line} />}
              <rect x={x + 2 + (prevYear ? bw * 0.44 : 0)} y={H - hT} width={prevYear ? bw * 0.42 : bw - 4} height={hT} rx="2" fill={C.pine} />
              {m.trips > 0 && <text x={x + bw / 2} y={H - hT - 3} textAnchor="middle" fontSize="9" fill={C.ink}>{m.trips}</text>}
              <text x={x + bw / 2} y={H + 13} textAnchor="middle" fontSize="9" fill={C.muted}>{m.month}</text>
            </g>
          );
        })}
      </svg>
      {prevYear && (
        <div className="flex gap-3 text-[11px] mt-1" style={{ color: C.muted }}>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: C.pine }} /> this period</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: C.line }} /> {prevYear}</span>
        </div>
      )}
    </div>
  );
}

function InsTile({ label, value, prev, fmt = (x) => x, suffix = "", points = false }) {
  const delta = prev === null || prev === undefined || value === null ? null : points ? value - prev : prev === 0 ? null : (value - prev) / prev;
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="text-[11px] font-semibold tracking-[.06em] uppercase" style={{ color: C.goldText }}>{label}</div>
      <div className="text-[18px] font-semibold mt-0.5" style={{ color: C.ink }}>{value === null ? "—" : fmt(value)}{value === null ? "" : suffix}</div>
      {delta !== null && isFinite(delta) && (
        <div className="text-[11px]" style={{ color: delta >= 0 ? C.pine : C.maroon }}>{delta >= 0 ? "▲" : "▼"} {Math.round(Math.abs(delta) * 100)}{points ? " pts" : "%"} vs last year</div>
      )}
    </div>
  );
}

function InsightsTab({ user, trips, enquiries }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const meId = user.talentId || user.id;
  const r = useMemo(() => dkInsights({ trips, enquiries, operatorId: user.kind === "admin" ? null : meId, year }), [trips, enquiries, meId, year, user.kind]);
  const levelStyle = { warn: [C.maroonSoft, C.maroon], info: [C.bg, C.ink], good: [C.pineSoft, C.pine] };
  const pct = (x) => `${Math.round(x * 100)}%`;
  const card = { background: C.card, border: `1px solid ${C.line}` };
  const H = ({ children, sub }) => (
    <div className="mb-2"><div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>{children}</div>
      {sub && <div className="text-[12px]" style={{ color: C.muted }}>{sub}</div>}</div>
  );
  const sdfStr = (x) => `$${x.toLocaleString("en")}`;

  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={user.kind === "admin" ? "whole hub" : "your business"}>Insights</SectionLabel>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[thisYear, thisYear - 1, thisYear - 2].map((y) => <Chip key={y} on={year === y} onClick={() => setYear(y)}>{y}</Chip>)}
        <Chip on={year === "all"} onClick={() => setYear("all")}>All time</Chip>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <InsTile label="Trips" value={r.kpi.trips} prev={r.prevYear ? r.kpi.tripsPrev : null} />
        <InsTile label="Guests" value={r.kpi.guests} prev={r.prevYear ? r.kpi.guestsPrev : null} />
        <InsTile label="Nights" value={r.kpi.nights} prev={r.prevYear ? r.kpi.nightsPrev : null} />
        <InsTile label="Enquiries won" value={r.kpi.conversion} prev={r.prevYear ? r.kpi.conversionPrev : null} fmt={pct} points />
      </div>
      <div className="rounded-xl px-3 py-2 mb-4 text-[12px]" style={{ background: C.goldSoft, color: C.goldText }}>
        {r.kpi.enquiries} {r.kpi.enquiries === 1 ? "enquiry" : "enquiries"} · {r.kpi.won} won · {r.kpi.lost} lost · {r.kpi.open} open
        {r.kpi.guestNights ? ` · about ${sdfStr(r.kpi.sdfEstimate)} in SDF collected (adult rate, ${r.kpi.guestNights} guest-nights)` : ""}
      </div>

      {r.tips.length > 0 && (
        <div className="space-y-2 mb-5">
          {r.tips.map((t, i) => (
            <div key={i} className="rounded-xl px-3.5 py-3 text-[13px] leading-snug" style={{ background: levelStyle[t.level][0], color: levelStyle[t.level][1], border: t.level === "info" ? `1px solid ${C.line}` : "none" }}>{t.text}</div>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-4 mb-3" style={card}>
        <H sub={r.prevYear ? `${r.year} against ${r.prevYear}` : "all years together"}>Trips by month</H>
        <InsMonths byMonth={r.byMonth} prevYear={r.prevYear} />
      </div>

      <div className="rounded-2xl p-4 mb-3" style={card}>
        <H sub={r.countrySource === "roster" ? `${r.countryTotal} guests, from the guest lists on your trips` : r.countrySource === "enquiries" ? "from won enquiries — add guest lists to trips for the real figure" : "add guests to your trips to see this"}>
          Where your guests come from
        </H>
        {r.countries.length ? <InsBars rows={r.countries} total={r.countryTotal} /> : <p className="text-[13px]" style={{ color: C.muted }}>No nationalities recorded yet.</p>}
      </div>

      <div className="rounded-2xl p-4 mb-3" style={card}>
        <H sub="from the day plans of your trips">Where your trips go</H>
        <InsBars rows={r.regions} total={r.kpi.trips || 0} />
        {r.towns.length > 0 && <div className="text-[12px] mt-3" style={{ color: C.muted }}>Most visited: {r.towns.map((t) => `${t.name} (${t.n})`).join(", ")}</div>}
      </div>

      <div className="rounded-2xl p-4 mb-3" style={card}>
        <H>Where enquiries come from</H>
        {r.sources.length ? <InsBars rows={r.sources} total={r.kpi.enquiries} /> : <p className="text-[13px]" style={{ color: C.muted }}>No enquiries in this period.</p>}
      </div>

      {r.lostReasons.length > 0 && (
        <div className="rounded-2xl p-4 mb-3" style={card}>
          <H sub={`${r.kpi.lost} lost`}>Why enquiries were lost</H>
          <InsBars rows={r.lostReasons} total={r.kpi.lost} />
        </div>
      )}

      {r.countryConv.length > 0 && (
        <div className="rounded-2xl p-4 mb-3" style={card}>
          <H sub="countries with at least three decided enquiries">Conversion by country</H>
          <div className="space-y-1.5">
            {r.countryConv.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-[13px]">
                <span style={{ color: C.ink }}>{c.name}</span>
                <span style={{ color: c.rate < (r.kpi.conversion || 0) - 0.15 ? C.maroon : C.muted }}>{c.won} of {c.decided} · {pct(c.rate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[12px] leading-snug mt-2" style={{ color: C.muted }}>
        Worked out from what's recorded in the hub: trips by start date, enquiries by the date they came in. The SDF figure uses the adult rate and is an upper bound. Suggestions are rules, not guesses — each one names the numbers behind it.
      </p>
    </div>
  );
}

/* the same sheet every other sheet draws, as one wrapper */
function Sheet({ onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-end sheet-dim" style={{ background: "rgba(0,0,0,.4)", zIndex: 260 }} onClick={onClose}>
      <div className="sheet-panel w-full rounded-t-[20px] flex flex-col safe-bottom" style={{ background: C.card, maxHeight: "92dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 overflow-y-auto">
          <div className="w-9 h-[5px] rounded-full mx-auto mb-4" style={{ background: "#C7C7CC" }} />
          {children}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  PAST TRIPS, ATTESTED — a guide's history, confirmed by the operators who ran it */
/* ========================================================================== */
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const attestWhen = (a) => `${a.month ? MONTHS_LONG[a.month - 1] + " " : ""}${a.year}`;
const attestLink = (token) => `${window.location.origin}/?attest=${token}`;
function attestMessage(a, fromName) {
  const verb = a.role === "driver" ? "drove for" : "guided";
  return `Kuzu Zangpo la, could you confirm I ${verb} "${a.tripTitle}" for ${a.operatorName} in ${attestWhen(a)}? One tap here: ${attestLink(a.token)} — ${fromName}`;
}
const rowToAttest = (r) => ({
  id: r.id, talentId: r.talent_id, talentName: r.talent_name, role: r.role, operatorName: r.operator_name, operatorId: r.operator_id,
  tripTitle: r.trip_title, month: r.month, year: r.year, nights: r.nights, token: r.token, status: r.status,
  attestedBy: r.attested_by_name, operatorVerified: !!r.operator_verified, createdAt: r.created_at, decidedAt: r.decided_at,
});

function useAttestations(talentId, self) {
  const [rows, setRows] = useState(null);
  const load = async () => {
    if (!CLOUD || !talentId) { setRows([]); return; }
    let q = supabase.from("trip_attestations").select("*").eq("talent_id", talentId).order("year", { ascending: false }).order("month", { ascending: false });
    if (!self) q = q.eq("status", "attested");
    const { data, error } = await q;
    setRows(error ? [] : (data || []).map(rowToAttest));
  };
  useEffect(() => { load(); }, [talentId, self]);
  return { rows, reload: load };
}

function AttestedLine({ a }) {
  return (
    <div className="text-[11px] mt-0.5 inline-flex items-center gap-1" style={{ color: C.muted }}>
      Attested by <span style={{ color: C.ink }}>{a.attestedBy || a.operatorName}</span>
      {a.operatorVerified && <ShieldCheck size={11} color={C.pine} aria-label="verified operator" />}
    </div>
  );
}

function PastTrips({ talent, self }) {
  const { rows, reload } = useAttestations(talent.id, self);
  const [adding, setAdding] = useState(false);
  const [share, setShare] = useState(null);                 // the claim just created, to send
  const now = new Date();
  const [f, setF] = useState({ operator: "", title: "", month: String(now.getMonth() + 1), year: String(now.getFullYear()), nights: "", role: talent.role === "driver" ? "driver" : "guide" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const field = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
  if (rows === null) return null;
  const attested = rows.filter((a) => a.status === "attested");
  const pending = self ? rows.filter((a) => a.status === "pending") : [];
  if (!self && attested.length === 0) return null;

  const add = async () => {
    if (f.operator.trim().length < 2 || f.title.trim().length < 3) { setErr("Name the operator and the trip."); return; }
    const year = Number(f.year); if (!(year >= 2000 && year <= now.getFullYear())) { setErr("Check the year."); return; }
    setBusy(true); setErr(null);
    const row = { talent_id: talent.id, talent_name: talent.name, role: f.role, operator_name: f.operator.trim(), trip_title: f.title.trim(),
                  month: Number(f.month) || null, year, nights: Number(f.nights) || null, token: makeReviewToken(), status: "pending" };
    const { data, error } = await supabase.from("trip_attestations").insert(row).select("*").single();
    setBusy(false);
    if (error) { setErr("Couldn't save — " + error.message); return; }
    setAdding(false); setF({ ...f, operator: "", title: "", nights: "" });
    setShare(rowToAttest(data)); reload();
  };
  const remove = async (id) => { await supabase.from("trip_attestations").delete().eq("id", id); setConfirmDel(null); reload(); };

  const Item = ({ a, muted }) => (
    <div className="px-3.5 py-3 flex items-start gap-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold" style={{ color: muted ? C.muted : C.ink }}>{a.tripTitle}</div>
        <div className="text-[12px]" style={{ color: C.muted }}>
          {attestWhen(a)}{a.nights ? ` · ${a.nights} nights` : ""} · {a.role === "driver" ? "Driver" : "Guide"} · for {a.operatorName}
        </div>
        {a.status === "attested" ? <AttestedLine a={a} /> : (
          <div className="text-[11px] mt-0.5" style={{ color: C.goldText }}>Waiting for {a.operatorName} to confirm</div>
        )}
      </div>
      {self && (confirmDel === a.id ? (
        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={() => setConfirmDel(null)} className="tap h-8 px-2 rounded-lg text-[12px]" style={{ background: C.bg, color: C.muted }}>Keep</button>
          <button type="button" onClick={() => remove(a.id)} className="tap h-8 px-2 rounded-lg text-[12px] font-semibold" style={{ background: C.maroon, color: "#FFFFFF" }}>Remove</button>
        </div>
      ) : (
        <div className="flex gap-1 shrink-0">
          {a.status === "pending" && (
            <button type="button" onClick={() => setShare(a)} className="tap h-8 px-2.5 rounded-lg text-[12px] font-semibold" style={{ background: C.pineSoft, color: C.pine }}>Send again</button>
          )}
          <button type="button" onClick={() => setConfirmDel(a.id)} aria-label={`Remove ${a.tripTitle}`} className="tap w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.bg }}><X size={13} color={C.muted} /></button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Past trips</div>
          <div className="text-[12px]" style={{ color: C.muted }}>
            {attested.length ? `${attested.length} confirmed by the operators who ran them` : self ? "Trips from before the hub, confirmed by the operator you did them for" : ""}
          </div>
        </div>
        {self && !adding && (
          <button type="button" onClick={() => setAdding(true)} aria-label="Add a past trip" className="tap h-9 px-3 rounded-lg text-[13px] font-semibold shrink-0 inline-flex items-center gap-1" style={{ background: C.goldSoft, color: C.goldText }}>
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {(attested.length > 0 || pending.length > 0) && (
        <div className="rounded-xl overflow-hidden mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {attested.map((a) => <Item key={a.id} a={a} />)}
          {pending.map((a) => <Item key={a.id} a={a} muted />)}
        </div>
      )}

      {adding && (
        <div className="rounded-xl p-3" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
          <input value={f.operator} onChange={(e) => set("operator", e.target.value)} maxLength={80} placeholder="Tour operator you did the trip for" aria-label="Tour operator"
            className="w-full h-11 px-3 rounded-lg text-[14px] mb-2" style={field} />
          <input value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={100} placeholder="The trip, e.g. Whitfield family — 7 nights west" aria-label="Trip"
            className="w-full h-11 px-3 rounded-lg text-[14px] mb-2" style={field} />
          <div className="grid grid-cols-3 gap-2 mb-2">
            <select value={f.month} onChange={(e) => set("month", e.target.value)} aria-label="Month" className="h-11 px-2 rounded-lg text-[13px]" style={field}>
              {MONTHS_LONG.map((m, i) => <option key={m} value={i + 1}>{m.slice(0, 3)}</option>)}
            </select>
            <input type="number" value={f.year} onChange={(e) => set("year", e.target.value)} min={2000} max={now.getFullYear()} aria-label="Year" className="h-11 px-2 rounded-lg text-[13px]" style={field} />
            <input type="number" value={f.nights} onChange={(e) => set("nights", e.target.value)} min={1} max={60} placeholder="Nights" aria-label="Nights" className="h-11 px-2 rounded-lg text-[13px]" style={field} />
          </div>
          <Segmented value={f.role} onChange={(v) => set("role", v)} options={[["guide", "I was the guide"], ["driver", "I was the driver"]]} />
          <p className="text-[11px] mt-2 mb-3 leading-snug" style={{ color: C.muted }}>Only the operator you name can confirm it, from their own account. It appears on your profile once they do.</p>
          {err && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setErr(null); }} className="tap flex-1 h-10 rounded-lg text-[13px] font-semibold" style={{ background: C.card, color: C.muted }}>Cancel</button>
            <button type="button" onClick={add} disabled={busy} className="tap flex-[1.4] h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center" style={{ background: C.pine, color: "#FFFFFF" }}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : "Save and ask them"}
            </button>
          </div>
        </div>
      )}

      {share && <AttestShareSheet a={share} fromName={talent.name} onClose={() => setShare(null)} />}
    </div>
  );
}

function AttestShareSheet({ a, fromName, onClose }) {
  const msg = attestMessage(a, fromName);
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(attestLink(a.token)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {} };
  return (
    <Sheet onClose={onClose}>
      <div className="text-[18px] font-bold mb-1" style={{ color: C.ink }}>Ask {a.operatorName} to confirm</div>
      <p className="text-[14px] mb-3" style={{ color: C.muted }}>Send this to the person who ran the trip. If they aren't on the hub yet, the link brings them in as an operator first.</p>
      <div className="rounded-xl p-3 text-[13px] leading-relaxed mb-3" style={{ background: C.bg, color: C.ink, border: `1px solid ${C.line}` }} data-testid="attest-message">{msg}</div>
      <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
        className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 mb-2" style={{ background: "#25D366", color: "#FFFFFF" }}>
        <MessageCircle size={17} /> Send on WhatsApp
      </a>
      <button type="button" onClick={copy} className="tap w-full h-11 rounded-xl text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
        {copied ? "Link copied" : "Copy the link instead"}
      </button>
    </Sheet>
  );
}

/* the operator, arriving from the link */
function AttestSheet({ user, token, preview, onDone }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const isOperator = user.kind === "operator";
  const answer = async (accept) => {
    setBusy(true); setErr(null);
    const { data, error } = await supabase.rpc("respond_attestation", { p_token: token, p_accept: accept });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setResult(data);
    if (accept && data && data.talent_id) {
      const me = user.talentId || user.id;
      try {
        await supabase.from("direct_messages").insert({ sender_id: me, recipient_id: data.talent_id,
          body: `${data.attested_by} confirmed your trip “${data.trip}”. It now shows on your profile as attested.` });
      } catch (e) {}
    }
  };
  return (
    <Sheet onClose={onDone}>
      <div className="text-[11px] font-semibold tracking-[.12em] uppercase mb-1" style={{ color: C.goldText }}>A past trip to confirm</div>
      <div className="text-[18px] font-bold leading-snug mb-1" style={{ color: C.ink }}>
        {preview.talent} says {preview.role === "driver" ? "they drove for" : "they guided"} “{preview.trip}” for {preview.operator}
      </div>
      <div className="text-[14px] mb-4" style={{ color: C.muted }}>{preview.month ? MONTHS_LONG[preview.month - 1] + " " : ""}{preview.year}{preview.nights ? ` · ${preview.nights} nights` : ""}</div>

      {result ? (
        <div className="rounded-xl p-4 mb-3" style={{ background: result.status === "attested" ? C.pineSoft : C.bg, border: `1px solid ${C.line}` }}>
          <div className="text-[15px] font-semibold" style={{ color: result.status === "attested" ? C.pine : C.ink }}>
            {result.status === "attested" ? "Confirmed — thank you" : "Noted — nothing will show"}
          </div>
          <div className="text-[13px] mt-1" style={{ color: C.muted }}>
            {result.status === "attested" ? `${preview.talent}'s profile now says “Attested by ${result.attested_by}”.` : `${preview.talent} can correct the details and ask again.`}
          </div>
        </div>
      ) : !isOperator ? (
        <div className="rounded-xl p-4 mb-3 text-[14px]" style={{ background: C.goldSoft, color: C.goldText }}>
          This request is for {preview.operator}. Only the tour operator who ran the trip can confirm it, from their own account.
        </div>
      ) : preview.status !== "pending" ? (
        <div className="rounded-xl p-4 mb-3 text-[14px]" style={{ background: C.bg, color: C.muted, border: `1px solid ${C.line}` }}>This request has already been answered.</div>
      ) : (
        <>
          <p className="text-[13px] mb-3 leading-snug" style={{ color: C.muted }}>Confirm only if the details are right as written. If a date or the trip is wrong, choose “Not accurate” — {preview.talent} can fix it and ask again.</p>
          {err && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{err}</p>}
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => answer(false)} disabled={busy} className="tap flex-1 h-12 rounded-xl text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Not accurate</button>
            <button type="button" onClick={() => answer(true)} disabled={busy} className="tap flex-[1.4] h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: C.pine, color: "#FFFFFF" }}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <><Check size={17} strokeWidth={2.6} /> Yes, that's right</>}
            </button>
          </div>
        </>
      )}
      <button type="button" onClick={onDone} className="tap w-full h-10 rounded-lg text-[13px] font-semibold" style={{ color: C.muted }}>{result ? "Done" : "Later"}</button>
    </Sheet>
  );
}

/* ========================================================================== */
/*  HOTELS — rooms, requests and confirmations, with no double booking.       */
/*  The database decides availability (room_capacity_guard); the app only     */
/*  shows what the hotel has free and lets people ask and answer.             */
/* ========================================================================== */
const HOTEL_AMENITIES = ["Wi-Fi", "Heating", "Hot-stone bath", "Restaurant", "Bar", "Spa", "Garden", "Parking", "Airport transfer", "Laundry", "Vegetarian menu", "Wheelchair access", "Generator back-up", "Mountain view", "Dzong view", "River view"];
const STAY_KINDS = { luxury: "Luxury", boutique: "Boutique", heritage: "Heritage", resort: "Resort", city: "City hotel", farmstay: "Farmstay / homestay", lodge: "Lodge" };
const BED_LABEL = { single: "Single", twin: "Twin", double: "Double", triple: "Triple", family: "Family", suite: "Suite" };
const MEAL_LABEL = { room_only: "Room only", breakfast: "Breakfast", half_board: "Half board", full_board: "Full board" };
const BK_STATUS = {
  requested: { label: "Awaiting hotel", bg: C.goldSoft, fg: C.goldText, dot: C.gold },
  confirmed: { label: "Confirmed", bg: C.successSoft, fg: C.success, dot: C.success },
  declined:  { label: "Declined", bg: C.maroonSoft, fg: C.maroon, dot: C.maroon },
  cancelled: { label: "Cancelled", bg: C.bg, fg: C.muted, dot: "#C7CEC7" },
};
const addDays = (iso, n) => { const d = new Date(iso + "T12:00"); d.setDate(d.getDate() + n); return localISO(d); };
const nightsBetween = (a, b) => Math.max(0, Math.round((new Date(b + "T00:00") - new Date(a + "T00:00")) / 86400e3));
const fmtNights = (a, b) => { const n = nightsBetween(a, b); return `${fmtDate(a)} – ${fmtDate(b)} · ${n} ${n === 1 ? "night" : "nights"}`; };
const hotelTownName = (key) => (DK_TOWNS[key] ? DK_TOWNS[key].n : (key || ""));
const hotelTownKey = (text) => {
  const t = String(text || "").toLowerCase();
  const hit = Object.entries(DK_TOWNS).find(([k, v]) => t.includes(v.n.toLowerCase()) || t.includes(k));
  return hit ? hit[0] : null;
};
const fmtNu = (n) => (n === null || n === undefined || n === "" ? "" : `Nu. ${Number(n).toLocaleString("en-IN")}`);
const BK_WINDOW_DAYS = 400;

/** The town a hand-written day title ends in: "Paro → Thimphu" gives Thimphu; "Night in Paro (3-star)" gives Paro. */
function dkNightFromTitle(title) {
  const t = String(title || "");
  const m = /Night in ([^(·]+?)\s*\(([^)]*)\)/.exec(t);
  if (m) { const tierKey = Object.entries(DK_HOTEL).find(([k, v]) => v.toLowerCase() === m[2].trim().toLowerCase()); return { townKey: hotelTownKey(m[1]), tier: tierKey ? tierKey[0] : null }; }
  const tail = t.includes("→") ? t.split("→").pop() : t;
  let best = null, bestAt = -1;
  for (const [k, v] of Object.entries(DK_TOWNS)) { const at = tail.toLowerCase().lastIndexOf(v.n.toLowerCase()); if (at > bestAt) { bestAt = at; best = k; } }
  return { townKey: best, tier: null };
}
/** One entry per night of the trip, then consecutive nights in the same town grouped into stays.
 *  Town comes from the operator's allocation (trip.nightTowns) first, then from the itinerary. */
function tripStays(trip) {
  const total = trip.start && trip.end ? nightsBetween(trip.start, trip.end) : 0;
  if (total <= 0) return [];
  const byDay = {}; (trip.itinerary || []).forEach((d) => { byDay[d.day] = d; });
  const nights = [];
  for (let i = 0; i < total; i++) {
    const date = addDays(trip.start, i);
    const d = byDay[i + 1];
    const parsed = d ? dkNightFromTitle(d.title) : { townKey: null, tier: null };
    const townKey = (trip.nightTowns && trip.nightTowns[date]) || parsed.townKey || null;
    nights.push({ date, townKey, tier: parsed.tier, day: i + 1 });
  }
  const stays = [];
  nights.forEach((n) => {
    const last = stays[stays.length - 1];
    if (last && last.townKey === n.townKey && last.to === n.date) { last.to = addDays(n.date, 1); last.nights += 1; last.days.push(n.day); if (!last.tier && n.tier) last.tier = n.tier; }
    else stays.push({ from: n.date, to: addDays(n.date, 1), nights: 1, townKey: n.townKey, townName: n.townKey ? hotelTownName(n.townKey) : "", tier: n.tier, days: [n.day] });
  });
  return stays;
}

const bookingFromRow = (b) => ({
  id: b.id, hotelId: b.hotel_id, roomId: b.room_id, operatorId: b.operator_id, tripId: b.trip_id || null,
  checkIn: b.check_in, checkOut: b.check_out, rooms: b.rooms, guests: b.guests, mealPlan: b.meal_plan || "breakfast",
  guestName: b.guest_name || "", notes: b.notes || "", hotelNote: b.hotel_note || "", status: b.status,
  respondedAt: b.responded_at ? new Date(b.responded_at).getTime() : null, createdAt: new Date(b.created_at).getTime(),
});
const roomFromRow = (r) => ({ id: r.id, hotelId: r.hotel_id, name: r.name, beds: r.beds, capacity: r.capacity, count: r.count, rate: r.rate_nu, notes: r.notes || "", active: r.active !== false });

/** Everything a hotel (or an operator) needs: room types, closures, bookings. Live. */
function useHotelData(user) {
  const isHotel = user?.kind === "hotel";
  const isOperator = user?.kind === "operator";
  const [rooms, setRooms] = useState([]);
  const [closures, setClosures] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const me = user?.talentId || user?.id;
  const reload = async () => {
    if (!CLOUD || !me || (!isHotel && !isOperator)) { setLoaded(true); return; }
    const q = [supabase.from("room_bookings").select("*").order("check_in", { ascending: true })];
    if (isHotel) q.push(supabase.from("hotel_rooms").select("*").eq("hotel_id", me).order("created_at", { ascending: true }),
                        supabase.from("room_closures").select("*").eq("hotel_id", me).order("from_date", { ascending: true }));
    const [B, R, X] = await Promise.all(q);
    if (B.error) console.error("room_bookings load failed:", B.error.message);
    setBookings((B.data || []).map(bookingFromRow));
    if (R) setRooms((R.data || []).map(roomFromRow));
    if (X) setClosures((X.data || []).map((c) => ({ id: c.id, roomId: c.room_id, from: c.from_date, to: c.to_date, rooms: c.rooms, reason: c.reason || "" })));
    setLoaded(true);
  };
  useEffect(() => { reload(); }, [me, isHotel, isOperator]);
  useEffect(() => {
    if (!CLOUD || (!isHotel && !isOperator)) return;
    const ch = supabase.channel("hotel-data-" + me)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "hotel_rooms" }, reload)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me, isHotel, isOperator]);
  return { rooms, closures, bookings, loaded, reload };
}

/** Rooms in use (confirmed + closed) for one room type on one night. */
function roomsUsedOn(roomId, date, bookings, closures) {
  const b = bookings.filter((x) => x.roomId === roomId && x.status === "confirmed" && x.checkIn <= date && x.checkOut > date).reduce((s, x) => s + x.rooms, 0);
  const c = closures.filter((x) => x.roomId === roomId && x.from <= date && x.to > date).reduce((s, x) => s + x.rooms, 0);
  return b + c;
}
function occupancyOn(date, rooms, bookings, closures) {
  const total = rooms.filter((r) => r.active).reduce((s, r) => s + r.count, 0);
  const used = rooms.filter((r) => r.active).reduce((s, r) => s + Math.min(r.count, roomsUsedOn(r.id, date, bookings, closures)), 0);
  const pending = bookings.filter((x) => x.status === "requested" && x.checkIn <= date && x.checkOut > date).reduce((s, x) => s + x.rooms, 0);
  return { total, used, pending, free: Math.max(0, total - used) };
}

/** Up to three windows of the same length, near the requested dates, where the room type still has enough free rooms. */
function freeWindowsNear(room, checkIn, nights, roomsNeeded, bookings, closures) {
  const out = [];
  const start = isoDay(0) > addDays(checkIn, -21) ? isoDay(0) : addDays(checkIn, -21);
  let d = start, guard = 0;
  while (out.length < 3 && d <= addDays(checkIn, 28) && guard++ < 80) {
    let ok = true;
    for (let i = 0; i < nights; i++) { if (room.count - roomsUsedOn(room.id, addDays(d, i), bookings, closures) < roomsNeeded) { ok = false; break; } }
    const overlapsAsked = d < addDays(checkIn, nights) && addDays(d, nights) > checkIn;
    if (ok && !overlapsAsked) { out.push([d, addDays(d, nights)]); d = addDays(d, nights); } else d = addDays(d, 1);
  }
  return out;
}
const fmtWindow = ([a, b]) => `${fmtDate(a)}–${fmtDate(addDays(b, -1))}`;
const ordinal = (n) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

function BkBadge({ status }) {
  const m = BK_STATUS[status] || BK_STATUS.requested;
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: m.bg, color: m.fg }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />{m.label}</span>;
}

function HotelTile({ label, value, sub, tone, onClick }) {
  const bg = tone === "gold" ? C.goldSoft : tone === "pine" ? C.pineSoft : C.card;
  const fg = tone === "gold" ? C.goldText : tone === "pine" ? C.pine : C.ink;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`${onClick ? "tap text-left " : ""}rounded-xl px-3 py-2.5 w-full`} style={{ background: bg, border: `1px solid ${tone ? "transparent" : C.line}` }}>
      <div className="text-[11px] font-semibold tracking-[.06em] uppercase" style={{ color: tone ? fg : C.muted }}>{label}</div>
      <div className="text-[20px] font-semibold mt-0.5 leading-tight" style={{ color: fg }}>{value}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: tone ? fg : C.muted, opacity: tone ? .85 : 1 }}>{sub}</div>}
    </Tag>
  );
}

/* ----------------------------- Hotel · Today ------------------------------ */
function HotelHome({ user, data, setTab, posts = [] }) {
  const { rooms, closures, bookings, loaded } = data;
  const today = isoDay(0);
  const first = (user.name || "").split(" ")[0];
  const me = talentById(user.talentId) || {};
  const tonight = occupancyOn(today, rooms, bookings, closures);
  const arrivals = bookings.filter((b) => b.status === "confirmed" && b.checkIn === today);
  const departures = bookings.filter((b) => b.status === "confirmed" && b.checkOut === today);
  const pending = bookings.filter((b) => b.status === "requested" && b.checkOut >= today).sort((a, b) => a.createdAt - b.createdAt);
  const inHouse = bookings.filter((b) => b.status === "confirmed" && b.checkIn <= today && b.checkOut > today);
  const next14 = Array.from({ length: 14 }, (_, i) => { const d = addDays(today, i); return { d, ...occupancyOn(d, rooms, bookings, closures) }; });
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.checkIn > today && b.checkIn <= addDays(today, 7)).sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  // Suggestions — rule-based, honest, never nagging twice for the same thing
  const tips = [];
  if (!rooms.length) tips.push({ level: "do", title: "Add your room types", body: "Operators can only request rooms you've listed. Two minutes: name, beds, how many.", tab: "rooms" });
  if (me.licenseStatus === "none") tips.push({ level: "do", title: "Upload your DoT hotel certificate", body: "Verified hotels show a tick in the operator's hotel picker and tend to be chosen first.", tab: "hotel_profile" });
  if (!me.hotelTown) tips.push({ level: "do", title: "Set your town", body: "Operators look for hotels by the town each night is spent in. Without a town you won't appear.", tab: "hotel_profile" });
  const stale = pending.filter((b) => Date.now() - b.createdAt > 24 * 3600e3).length;
  if (stale) tips.push({ level: "warn", title: `${stale} ${stale === 1 ? "request has" : "requests have"} waited over a day`, body: "Operators usually hold a second option. A quick answer, even a decline, keeps them coming back.", tab: "bookings" });
  const fullNights = next14.filter((n) => n.total && n.free === 0).length;
  if (fullNights) tips.push({ level: "info", title: `Full on ${fullNights} of the next 14 nights`, body: "The app already stops any confirmation that would overbook. Consider a waiting-list note in your profile policy." });
  const openNights = next14.filter((n) => n.total && n.used === 0 && n.d >= addDays(today, 3)).length;
  if (rooms.length && openNights >= 10 && !pending.length) tips.push({ level: "info", title: "Quiet fortnight ahead", body: "Operators plan 2–6 weeks out. A short note on rates or a seasonal offer in your profile helps them choose you.", tab: "hotel_profile" });
  if (rooms.length && me.hotelTown && !posts.some((p) => p.talentId === (user.talentId || user.id))) tips.push({ level: "info", title: "Post to the feed", body: "A photo of your best room or the view from breakfast reaches every operator on the hub. Hotels that post get asked first.", tab: "post" });
  if (rooms.length && rooms.every((r) => r.rate === null || r.rate === undefined)) tips.push({ level: "info", title: "Add indicative rates", body: "Rates are optional, but operators compare faster when they see Nu. per night. You confirm every booking either way.", tab: "rooms" });

  return (
    <div className="px-5 py-4">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h2 className="text-[24px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: C.ink }}>Kuzuzangpo{first ? `, ${first}` : ""}</h2>
          <div className="text-[13px]" style={{ color: C.muted }}>{me.company || me.name}{me.hotelTown ? ` · ${hotelTownName(me.hotelTown)}` : ""}</div>
        </div>
        {me.verified && <span className="inline-flex items-center gap-1 text-[12px] font-semibold rounded-full px-2.5 py-1 whitespace-nowrap shrink-0" style={{ background: C.pineSoft, color: C.pine }}><BadgeCheck size={13} /> Verified</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <HotelTile label="Tonight" value={tonight.total ? `${tonight.used}/${tonight.total}` : "—"} sub={tonight.total ? `${Math.round((tonight.used / tonight.total) * 100)}% of rooms in use` : "Add room types first"} />
        <HotelTile label="Requests" value={pending.length} sub={pending.length ? "waiting for your answer" : "nothing waiting"} tone={pending.length ? "gold" : undefined} onClick={() => setTab("bookings")} />
        <HotelTile label="Arriving today" value={arrivals.length} sub={arrivals.length ? `${arrivals.reduce((s, b) => s + b.guests, 0)} guests` : "no arrivals"} />
        <HotelTile label="Departing today" value={departures.length} sub={departures.length ? `${departures.reduce((s, b) => s + b.rooms, 0)} rooms to turn around` : "no departures"} />
      </div>

      {!!rooms.length && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Next 14 nights</div>
            <div className="text-[12px]" style={{ color: C.muted }}>confirmed · <span style={{ color: C.goldText }}>requested</span></div>
          </div>
          <div className="flex items-end gap-1" style={{ height: 64 }}>
            {next14.map((n) => {
              const h = n.total ? Math.round((n.used / n.total) * 56) : 0;
              const p = n.total ? Math.min(56 - h, Math.round((n.pending / n.total) * 56)) : 0;
              return (
                <div key={n.d} className="flex-1 flex flex-col justify-end items-stretch" title={`${fmtDate(n.d)}: ${n.used}/${n.total} in use${n.pending ? `, ${n.pending} requested` : ""}`}>
                  <div style={{ height: p, background: C.goldSoft, borderRadius: "3px 3px 0 0" }} />
                  <div style={{ height: Math.max(h, 2), background: n.free === 0 && n.total ? C.maroon : C.pine, borderRadius: p ? 0 : "3px 3px 0 0" }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: C.muted }}>
            <span>{fmtDate(next14[0].d)}</span><span>{fmtDate(next14[6].d)}</span><span>{fmtDate(next14[13].d)}</span>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <SectionLabel trailing={`${pending.length} waiting`}>Answer these</SectionLabel>
          {pending.slice(0, 3).map((b) => <HotelBookingCard key={b.id} b={b} data={data} user={user} />)}
          {pending.length > 3 && <button onClick={() => setTab("bookings")} className="tap w-full h-10 rounded-xl text-[13px] font-semibold mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.pine }}>See all {pending.length} requests</button>}
        </>
      )}

      {(inHouse.length > 0 || upcoming.length > 0) && (
        <>
          <SectionLabel>{inHouse.length ? "In house tonight" : "Arriving this week"}</SectionLabel>
          <div className="rounded-2xl divide-y mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
            {(inHouse.length ? inHouse : upcoming).slice(0, 6).map((b) => {
              const op = talentById(b.operatorId); const room = rooms.find((r) => r.id === b.roomId);
              return (
                <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pineSoft }}><BedDouble size={16} color={C.pine} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{b.guestName || op?.company || op?.name || "Group"}</div>
                    <div className="text-[12px] truncate" style={{ color: C.muted }}>{b.rooms} × {room?.name || "room"} · {b.guests} guests · {inHouse.length ? `leaves ${fmtDate(b.checkOut)}` : `arrives ${fmtDate(b.checkIn)}`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tips.length > 0 && (
        <>
          <SectionLabel>Suggestions</SectionLabel>
          {tips.slice(0, 3).map((t) => {
            const bg = t.level === "warn" ? C.maroonSoft : t.level === "do" ? C.goldSoft : C.pineSoft;
            const fg = t.level === "warn" ? C.maroon : t.level === "do" ? C.goldText : C.pine;
            const Tag = t.tab ? "button" : "div";
            return (
              <Tag key={t.title} onClick={t.tab ? () => setTab(t.tab) : undefined} className={`${t.tab ? "tap text-left " : ""}w-full rounded-xl p-3.5 mb-2`} style={{ background: bg }}>
                <div className="text-[14px] font-semibold" style={{ color: fg }}>{t.title}</div>
                <div className="text-[13px] leading-snug mt-0.5" style={{ color: fg, opacity: .9 }}>{t.body}</div>
              </Tag>
            );
          })}
        </>
      )}

      {loaded && !rooms.length && !tips.length && <Empty Icon={Building2} title="All set" body="Requests from operators will appear here." />}
    </div>
  );
}

/* --------------------------- Hotel · booking card -------------------------- */
function HotelBookingCard({ b, data, user, compact }) {
  const { rooms, closures, bookings, reload } = data;
  const room = rooms.find((r) => r.id === b.roomId);
  const op = talentById(b.operatorId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  // what the hotel would have left if it says yes — the database re-checks this at confirm time
  const tight = room ? Math.min(...Array.from({ length: nightsBetween(b.checkIn, b.checkOut) }, (_, i) => room.count - roomsUsedOn(room.id, addDays(b.checkIn, i), bookings, closures))) : 0;
  const fits = room ? tight >= b.rooms : false;
  const past = b.checkOut < isoDay(0);
  // first come, first served: where this request sits among pending requests for the same room type on overlapping nights
  const queue = bookings.filter((x) => x.roomId === b.roomId && x.status === "requested" && x.checkIn < b.checkOut && x.checkOut > b.checkIn).sort((x, y) => x.createdAt - y.createdAt);
  const place = queue.findIndex((x) => x.id === b.id) + 1;
  const nights = nightsBetween(b.checkIn, b.checkOut);
  const windows = room && !fits ? freeWindowsNear(room, b.checkIn, nights, b.rooms, bookings, closures) : [];
  const autoDecline = room ? (windows.length
    ? `Sorry, we can't offer ${b.rooms} × ${room.name} for ${fmtDate(b.checkIn)}–${fmtDate(addDays(b.checkOut, -1))}. We do have ${b.rooms} free ${windows.map(fmtWindow).join(", ")}. Happy to hold any of those.`
    : `Sorry, we can't offer ${b.rooms} × ${room.name} for ${fmtDate(b.checkIn)}–${fmtDate(addDays(b.checkOut, -1))}, and nothing nearby is free either.`) : "";

  const respond = async (status) => {
    setBusy(true); setErr(null);
    const patch = { status };
    if (note.trim()) patch.hotel_note = note.trim();
    const { error } = await supabase.from("room_bookings").update(patch).eq("id", b.id);
    setBusy(false);
    if (error) { setErr(error.message.replace(/^.*?:\s*/, "")); return; }
    setDeclining(false); setNote("");
    reload && reload();
  };

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${b.status === "requested" ? C.gold + "66" : C.line}` }}>
      <div className="flex items-start gap-3">
        <Avatar initials={op?.initials || "?"} src={op?.photo} size={38} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{op?.company || op?.name || "Tour operator"}</div>
            <BkBadge status={b.status} />
          </div>
          <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>{fmtNights(b.checkIn, b.checkOut)}</div>
          <div className="text-[14px] mt-1.5" style={{ color: C.ink }}>
            <b>{b.rooms} × {room?.name || "room"}</b> · {b.guests} {b.guests === 1 ? "guest" : "guests"} · {MEAL_LABEL[b.mealPlan]}
          </div>
          {b.guestName && <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>Lead guest: {b.guestName}</div>}
          {b.notes && <div className="text-[13px] mt-1.5 rounded-lg px-2.5 py-2" style={{ background: C.bg, color: C.ink }}>“{b.notes}”</div>}
          {b.hotelNote && <div className="text-[13px] mt-1.5" style={{ color: C.muted }}>Your note: {b.hotelNote}</div>}
          {op?.verified && <div className="inline-flex items-center gap-1 text-[12px] mt-1.5" style={{ color: C.pine }}><BadgeCheck size={12} /> Verified operator</div>}
        </div>
      </div>

      {b.status === "requested" && !past && (
        <div className="mt-3">
          <div className="text-[12px] mb-2" style={{ color: fits ? C.pine : C.maroon }}>
            {room ? (fits ? `You have ${tight} ${room.name} free on the tightest night — this fits.` : `Only ${Math.max(0, tight)} ${room.name} free on the tightest night — confirming would overbook, so the app won't allow it.`) : "This room type no longer exists."}
            {queue.length > 1 && <span style={{ color: C.muted }}> · {ordinal(place)} of {queue.length} asking for these nights{place === 1 ? " — answer this one first" : ""}</span>}
          </div>
          {!declining ? (
            <div className="flex gap-2">
              <button disabled={busy || !fits} onClick={() => respond("confirmed")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: fits ? C.pine : "#C7CEC7", color: "#fff" }}>{busy ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} strokeWidth={2.6} /> Confirm</>}</button>
              <button disabled={busy} onClick={() => { setNote(!fits ? autoDecline : ""); setDeclining(true); }} className="tap h-11 px-4 rounded-xl text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}>{fits ? "Decline" : "Decline · send free dates"}</button>
              {op?.phone && <button onClick={() => openWhatsApp(op.phone, `Hello ${op.name}, about your room request at ${user.name} for ${fmtDate(b.checkIn)}–${fmtDate(b.checkOut)}:`)} className="tap h-11 w-11 rounded-xl inline-flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.line}` }} aria-label="WhatsApp the operator"><MessageCircle size={17} color={C.pine} /></button>}
            </div>
          ) : (
            <div>
              {!fits && windows.length > 0 && <div className="text-[12px] mb-1.5" style={{ color: C.muted }}>The operator will see these free dates with your reply. Edit the message if you like.</div>}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={!fits ? 4 : 2} maxLength={400} placeholder="Optional: why, or what you can offer instead (other dates, another room type)…"
                className="w-full px-3 py-2.5 rounded-xl text-[14px] resize-none mb-2" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => respond("declined")} className="tap flex-1 h-11 rounded-xl text-[14px] font-semibold" style={{ background: C.maroon, color: "#fff" }}>{busy ? "…" : "Send decline"}</button>
                <button disabled={busy} onClick={() => { setDeclining(false); setNote(""); }} className="tap h-11 px-4 rounded-xl text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Back</button>
              </div>
            </div>
          )}
        </div>
      )}

      {b.status === "confirmed" && !past && !compact && (
        <div className="mt-3 flex items-center justify-between">
          {op?.phone ? <button onClick={() => openWhatsApp(op.phone, `Hello ${op.name}, about the confirmed booking at ${user.name} for ${fmtDate(b.checkIn)}–${fmtDate(b.checkOut)}:`)} className="tap inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: C.pine }}><MessageCircle size={14} /> WhatsApp operator</button> : <span />}
          {!open ? <button onClick={() => setOpen(true)} className="tap text-[13px] font-semibold" style={{ color: C.muted }}>Cancel booking…</button>
            : <div className="flex items-center gap-2"><span className="text-[12px]" style={{ color: C.maroon }}>Frees the rooms. Tell the operator first.</span>
                <button disabled={busy} onClick={() => respond("cancelled")} className="tap h-8 px-3 rounded-lg text-[12px] font-semibold" style={{ background: C.maroon, color: "#fff" }}>Cancel</button>
                <button onClick={() => setOpen(false)} className="tap h-8 px-3 rounded-lg text-[12px] font-semibold" style={{ background: C.bg, color: C.ink }}>Keep</button></div>}
        </div>
      )}
      {err && <div className="text-[13px] mt-2 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
    </div>
  );
}

/* ---------------------------- Hotel · Bookings ---------------------------- */
function HotelBookings({ user, data }) {
  const [view, setView] = useState("requests");
  const today = isoDay(0);
  const { bookings, loaded } = data;
  const requests = bookings.filter((b) => b.status === "requested" && b.checkOut >= today).sort((a, b) => a.createdAt - b.createdAt);
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.checkOut >= today).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const past = bookings.filter((b) => b.checkOut < today || b.status === "declined" || b.status === "cancelled").sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const list = view === "requests" ? requests : view === "upcoming" ? upcoming : past;
  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={`${upcoming.length} confirmed ahead`}>Bookings</SectionLabel>
      <div className="mb-4">
        <Segmented value={view} onChange={setView} options={[["requests", `Requests${requests.length ? ` · ${requests.length}` : ""}`], ["upcoming", "Confirmed"], ["calendar", "Calendar"], ["past", "Past & closed"]]} />
      </div>
      {view === "calendar" ? <HotelCalendar data={data} user={user} /> : (
        <>
          {!loaded && <div className="text-[13px]" style={{ color: C.muted }}>Loading…</div>}
          {loaded && !list.length && (
            <Empty Icon={CalendarCheck}
              title={view === "requests" ? "No requests waiting" : view === "upcoming" ? "Nothing confirmed yet" : "Nothing here yet"}
              body={view === "requests" ? "When a tour operator asks for rooms, it appears here with Confirm and Decline." : view === "upcoming" ? "Confirmed bookings show here and on your calendar." : "Past stays and closed requests are kept for your records."} />
          )}
          {list.map((b) => <HotelBookingCard key={b.id} b={b} data={data} user={user} compact={view === "past"} />)}
        </>
      )}
    </div>
  );
}

/* ----------------------------- Hotel · Calendar ---------------------------- */
function HotelCalendar({ data, user }) {
  const { rooms, bookings, closures } = data;
  const today = isoDay(0);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [picked, setPicked] = useState(null);
  const first = new Date(month + "-01T00:00");
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;   // Monday first
  const shift = (n) => { const d = new Date(first); d.setMonth(d.getMonth() + n); setMonth(d.toISOString().slice(0, 7)); setPicked(null); };
  const cells = Array.from({ length: daysIn }, (_, i) => { const d = `${month}-${String(i + 1).padStart(2, "0")}`; return { d, n: i + 1, ...occupancyOn(d, rooms, bookings, closures) }; });
  const dayList = picked ? bookings.filter((b) => b.status !== "declined" && b.status !== "cancelled" && b.checkIn <= picked && b.checkOut > picked) : [];
  const dayClosures = picked ? closures.filter((c) => c.from <= picked && c.to > picked) : [];
  if (!rooms.length) return <Empty Icon={CalendarDays} title="Add room types first" body="The calendar shows rooms in use per night once you've listed what you have." />;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shift(-1)} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={18} color={C.ink} /></button>
        <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
        <button onClick={() => shift(1)} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={18} color={C.ink} style={{ transform: "rotate(180deg)" }} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">{["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <div key={i} className="text-center text-[11px] font-semibold" style={{ color: C.muted }}>{w}</div>)}</div>
      <div className="grid grid-cols-7 gap-1 mb-3">
        {Array.from({ length: lead }).map((_, i) => <div key={"l" + i} />)}
        {cells.map((c) => {
          const ratio = c.total ? c.used / c.total : 0;
          const full = c.total && c.free === 0;
          const bg = full ? C.maroon : ratio >= 0.6 ? C.pine : ratio > 0 ? C.pineSoft : C.card;
          const fg = full || ratio >= 0.6 ? "#fff" : C.ink;
          const isPast = c.d < today;
          return (
            <button key={c.d} onClick={() => setPicked(c.d)} className="tap rounded-lg flex flex-col items-center justify-center" style={{ height: 46, background: bg, border: `1.5px solid ${picked === c.d ? C.gold : c.d === today ? C.pine : C.line}`, opacity: isPast ? .55 : 1 }}>
              <div className="text-[13px] font-semibold leading-none" style={{ color: fg }}>{c.n}</div>
              <div className="text-[10px] leading-none mt-1" style={{ color: fg, opacity: .85 }}>{c.used}/{c.total}{c.pending ? <span style={{ color: full || ratio >= 0.6 ? C.goldSoft : C.goldText }}> +{c.pending}</span> : null}</div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] mb-4" style={{ color: C.muted }}>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.pineSoft }} /> some rooms</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.pine }} /> busy</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.maroon }} /> full</span>
        <span>+n = requested, not yet confirmed</span>
      </div>
      {picked && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-2" style={{ color: C.goldText }}>Night of {fmtDate(picked)}</div>
          {rooms.filter((r) => r.active).map((r) => {
            const used = roomsUsedOn(r.id, picked, bookings, closures);
            return <div key={r.id} className="flex items-center justify-between text-[13px] py-1" style={{ color: C.ink }}><span>{r.name}</span><span style={{ color: used >= r.count ? C.maroon : C.muted }}>{used}/{r.count} in use</span></div>;
          })}
          {(dayList.length > 0 || dayClosures.length > 0) && <div className="my-2" style={{ borderTop: `1px solid ${C.lineSoft}` }} />}
          {dayList.map((b) => { const op = talentById(b.operatorId); const room = rooms.find((r) => r.id === b.roomId);
            return <div key={b.id} className="flex items-center justify-between text-[13px] py-1"><span style={{ color: C.ink }}>{b.rooms} × {room?.name} · {op?.company || op?.name || "Operator"}</span><BkBadge status={b.status} /></div>; })}
          {dayClosures.map((c) => { const room = rooms.find((r) => r.id === c.roomId);
            return <div key={c.id} className="flex items-center justify-between text-[13px] py-1" style={{ color: C.muted }}><span>{c.rooms} × {room?.name} closed{c.reason ? ` · ${c.reason}` : ""}</span></div>; })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Hotel · Rooms ------------------------------ */
function HotelRooms({ user, data }) {
  const { rooms, closures, bookings, reload, loaded } = data;
  const me = user.talentId || user.id;
  const [editing, setEditing] = useState(null);     // null | "new" | room
  const [closing, setClosing] = useState(false);
  const [err, setErr] = useState(null);
  const total = rooms.filter((r) => r.active).reduce((s, r) => s + r.count, 0);
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };

  const removeRoom = async (r) => {
    const future = bookings.some((b) => b.roomId === r.id && b.status === "confirmed" && b.checkOut >= isoDay(0));
    if (future) { setErr("That room type has confirmed bookings ahead. Set its count to 0 instead, or cancel the bookings first."); return; }
    const { error } = await supabase.from("hotel_rooms").update({ active: false }).eq("id", r.id);
    if (error) setErr(error.message); else reload();
  };
  const removeClosure = async (id) => { const { error } = await supabase.from("room_closures").delete().eq("id", id); if (error) setErr(error.message); else reload(); };

  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={total ? `${total} rooms in total` : ""}>Room types</SectionLabel>
      {loaded && !rooms.length && (
        <div className="rounded-2xl p-4 mb-3" style={{ background: C.goldSoft }}>
          <div className="text-[14px] font-semibold" style={{ color: C.goldText }}>Start with what you sell</div>
          <div className="text-[13px] leading-snug mt-0.5" style={{ color: C.goldText, opacity: .9 }}>“Deluxe twin · 12 rooms”, “Family suite · 2 rooms”. Operators request by type; the app keeps count per night so you can never be asked to overbook.</div>
        </div>
      )}
      {rooms.filter((r) => r.active).map((r) => (
        <div key={r.id} className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}><BedDouble size={18} color={C.goldSoft} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{r.name}</div>
              <div className="text-[13px]" style={{ color: C.muted }}>{BED_LABEL[r.beds]} · sleeps {r.capacity} · <b style={{ color: C.ink }}>{r.count} {r.count === 1 ? "room" : "rooms"}</b>{r.rate ? ` · ${fmtNu(r.rate)}/night` : ""}</div>
              {r.notes && <div className="text-[12px] mt-1" style={{ color: C.muted }}>{r.notes}</div>}
            </div>
            <button onClick={() => setEditing(r)} className="tap h-8 px-3 rounded-lg text-[12px] font-semibold" style={{ background: C.bg, color: C.ink }}>Edit</button>
          </div>
        </div>
      ))}
      <button onClick={() => setEditing("new")} className="tap w-full h-12 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 mb-6" style={{ background: C.pine, color: "#fff" }}><Plus size={16} /> Add a room type</button>

      {rooms.length > 0 && (
        <>
          <SectionLabel trailing={closures.filter((c) => c.to >= isoDay(0)).length ? `${closures.filter((c) => c.to >= isoDay(0)).length} active` : ""}>Rooms taken out of sale</SectionLabel>
          <p className="text-[13px] mb-3" style={{ color: C.muted }}>Maintenance, walk-ins, or bookings you took outside the hub. Closed rooms count as full, so operators see the true picture.</p>
          {closures.filter((c) => c.to >= isoDay(0)).map((c) => { const room = rooms.find((r) => r.id === c.roomId);
            return (
              <div key={c.id} className="rounded-xl px-4 py-3 mb-2 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <Lock size={15} color={C.muted} />
                <div className="flex-1 min-w-0"><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{c.rooms} × {room?.name || "room"}</div>
                  <div className="text-[12px]" style={{ color: C.muted }}>{fmtNights(c.from, c.to)}{c.reason ? ` · ${c.reason}` : ""}</div></div>
                <button onClick={() => removeClosure(c.id)} className="tap h-8 px-3 rounded-lg text-[12px] font-semibold" style={{ background: C.bg, color: C.maroon }}>Reopen</button>
              </div>
            ); })}
          <button onClick={() => setClosing(true)} className="tap w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}><Lock size={15} /> Close rooms for some dates</button>
        </>
      )}
      {err && <div className="text-[13px] mt-3 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}

      {editing && <RoomEditor hotelId={me} room={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} onRemove={editing !== "new" ? () => { removeRoom(editing); setEditing(null); } : null} />}
      {closing && <ClosureEditor hotelId={me} rooms={rooms.filter((r) => r.active)} bookings={bookings} closures={closures} onClose={() => setClosing(false)} onSaved={() => { setClosing(false); reload(); }} />}
    </div>
  );
}

function RoomEditor({ hotelId, room, onClose, onSaved, onRemove }) {
  const [f, setF] = useState({ name: room?.name || "", beds: room?.beds || "twin", capacity: room?.capacity || 2, count: room?.count ?? 1, rate: room?.rate ?? "", notes: room?.notes || "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  const save = async () => {
    if (f.name.trim().length < 2) { setErr("Give the room type a name operators will recognise."); return; }
    setBusy(true); setErr(null);
    const row = { hotel_id: hotelId, name: f.name.trim(), beds: f.beds, capacity: Number(f.capacity) || 2, count: Math.max(0, Number(f.count) || 0), rate_nu: f.rate === "" ? null : Number(f.rate), notes: f.notes.trim() || null, active: true };
    const q = room ? supabase.from("hotel_rooms").update(row).eq("id", room.id) : supabase.from("hotel_rooms").insert(row);
    const { error } = await q;
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  };
  return (
    <Sheet onClose={onClose}>
      <div className="text-[18px] font-semibold mb-3" style={{ color: C.ink }}>{room ? "Edit room type" : "New room type"}</div>
      <Label>Name</Label>
      <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Deluxe twin" maxLength={60} className="w-full h-11 px-3.5 rounded-xl text-[15px] mb-3" style={field} />
      <Label>Beds</Label>
      <div className="flex flex-wrap gap-2 mb-3">{Object.entries(BED_LABEL).map(([k, l]) => <Chip key={k} on={f.beds === k} onClick={() => set("beds", k)}>{l}</Chip>)}</div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><Label>Sleeps</Label><input type="number" min={1} max={12} value={f.capacity} onChange={(e) => set("capacity", e.target.value)} className="w-full h-11 px-3.5 rounded-xl text-[15px]" style={field} /></div>
        <div><Label>How many rooms</Label><input type="number" min={0} max={500} value={f.count} onChange={(e) => set("count", e.target.value)} className="w-full h-11 px-3.5 rounded-xl text-[15px]" style={field} /></div>
      </div>
      <Label>Rate per night in Nu. (optional, shown to operators as a guide)</Label>
      <input type="number" min={0} value={f.rate} onChange={(e) => set("rate", e.target.value)} placeholder="e.g. 4500" className="w-full h-11 px-3.5 rounded-xl text-[15px] mb-3" style={field} />
      <Label>Notes (optional)</Label>
      <input value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Valley view, extra bed possible, ground floor…" maxLength={140} className="w-full h-11 px-3.5 rounded-xl text-[15px] mb-4" style={field} />
      {err && <div className="text-[13px] mb-3 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
      <OCta busy={busy} onClick={save}>{room ? "Save changes" : "Add room type"}</OCta>
      {onRemove && <button onClick={onRemove} className="tap w-full h-10 mt-2 text-[13px] font-semibold" style={{ color: C.maroon }}>Remove this room type</button>}
    </Sheet>
  );
}

function ClosureEditor({ hotelId, rooms, bookings, closures, onClose, onSaved }) {
  const [f, setF] = useState({ roomId: rooms[0]?.id || "", from: isoDay(0), to: isoDay(1), rooms: 1, reason: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  const room = rooms.find((r) => r.id === f.roomId);
  const free = room && f.to > f.from ? Math.min(...Array.from({ length: nightsBetween(f.from, f.to) }, (_, i) => room.count - roomsUsedOn(room.id, addDays(f.from, i), bookings, closures))) : 0;
  const save = async () => {
    if (!room) { setErr("Pick a room type."); return; }
    if (f.to <= f.from) { setErr("The reopening date must be after the first closed night."); return; }
    if (Number(f.rooms) > free) { setErr(`Only ${Math.max(0, free)} of those rooms are free across these dates. Cancel the confirmed bookings first if they really aren't available.`); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("room_closures").insert({ hotel_id: hotelId, room_id: f.roomId, from_date: f.from, to_date: f.to, rooms: Number(f.rooms) || 1, reason: f.reason.trim() || null });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  };
  return (
    <Sheet onClose={onClose}>
      <div className="text-[18px] font-semibold mb-1" style={{ color: C.ink }}>Close rooms for some dates</div>
      <p className="text-[13px] mb-3" style={{ color: C.muted }}>Operators will see these rooms as taken. Nothing is cancelled.</p>
      <Label>Room type</Label>
      <div className="flex flex-wrap gap-2 mb-3">{rooms.map((r) => <Chip key={r.id} on={f.roomId === r.id} onClick={() => set("roomId", r.id)}>{r.name}</Chip>)}</div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><Label>First night closed</Label><input type="date" value={f.from} onChange={(e) => set("from", e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
        <div><Label>Back on sale from</Label><input type="date" value={f.to} onChange={(e) => set("to", e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
      </div>
      <Label>How many rooms{room ? ` (${Math.max(0, free)} free on the tightest night)` : ""}</Label>
      <input type="number" min={1} max={room?.count || 500} value={f.rooms} onChange={(e) => set("rooms", e.target.value)} className="w-full h-11 px-3.5 rounded-xl text-[15px] mb-3" style={field} />
      <Label>Reason (optional, only you see it)</Label>
      <input value={f.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Repainting · walk-in group · direct booking" maxLength={80} className="w-full h-11 px-3.5 rounded-xl text-[15px] mb-4" style={field} />
      {err && <div className="text-[13px] mb-3 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
      <OCta busy={busy} onClick={save}>Close these rooms</OCta>
    </Sheet>
  );
}

/* ----------------------------- Hotel · Profile ----------------------------- */
function HotelProfile({ user, onSaved }) {
  const me = user.talentId || user.id;
  const [p, setP] = useState(null);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [err, setErr] = useState(null);
  const [certPreview, setCertPreview] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const certRef = useRef();
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  const stayTowns = Object.entries(DK_TOWNS).filter(([, v]) => v.stay).sort((a, b) => a[1].n.localeCompare(b[1].n));

  const load = async () => {
    setLoadFailed(false);
    const { data: fresh, error } = await supabase.from("profiles").select("*").eq("id", me).maybeSingle();
    // BUILD 55: without a connection the property opens from what this phone remembers; never "Loading…" for ever
    const data = fresh || (error ? recallMe(me) : null);
    if (!data) { setLoadFailed(true); return; }
    setP(data);
    setF({ company: data.company_name || "", name: data.full_name || "", phone: (data.phone || "").replace(/^\+?975/, ""), email: data.email || "",
           town: data.hotel_town || hotelTownKey(data.base) || "", tier: data.hotel_tier || "3", stars: data.star_rating || "", kind: data.stay_kind || "",
           amenities: Array.isArray(data.hotel_amenities) ? data.hotel_amenities : [], checkin: data.hotel_checkin || "14:00", checkout: data.hotel_checkout || "11:00",
           policy: data.hotel_policy || "", pitch: data.pitch || "", licNo: data.license_number || "" });
  };
  useEffect(() => { load(); }, [me]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const flash = (m) => { setNote(m); setTimeout(() => setNote(null), 2600); };

  const save = async () => {
    if (!f.company.trim()) { setErr("Add the property name."); return; }
    if (!f.town) { setErr("Pick the town your hotel is in — operators search by town."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("profiles").update({
      company_name: f.company.trim(), full_name: f.name.trim() || f.company.trim(), phone: f.phone.trim() || null, email: f.email.trim() || null,
      base: hotelTownName(f.town), hotel_town: f.town, hotel_tier: f.tier, star_rating: f.stars ? Number(f.stars) : null, stay_kind: f.kind || null,
      hotel_amenities: f.amenities, hotel_checkin: f.checkin || null, hotel_checkout: f.checkout || null, hotel_policy: f.policy.trim() || null,
      pitch: f.pitch.trim() || null, license_number: f.licNo.trim() || null,
    }).eq("id", me);
    setBusy(false);
    if (error) { setErr(navigator.onLine === false ? failText("save your property") : error.message); return; }
    flash("Saved."); onSaved && onSaved(); load();
  };
  const pickCert = (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !file.type.startsWith("image/")) { setErr("Choose a photo or screenshot of the certificate."); return; }
    const r = new FileReader(); r.onload = () => setCertPreview(r.result); r.readAsDataURL(file);
  };
  const uploadCert = async () => {
    setBusy(true); setErr(null);
    try {
      const small = await shrinkImage(certPreview, 1600, 0.85);
      const blob = await (await fetch(small)).blob();
      const path = `${me}/license.jpg`;
      const up = await supabase.storage.from("licenses").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw up.error;
      const { error } = await supabase.from("profiles").update({ license_path: path, license_status: "submitted", license_number: f.licNo.trim() || null }).eq("id", me);
      if (error) throw error;
      setCertPreview(null); flash("Certificate sent for verification."); onSaved && onSaved(); load();
    } catch (e) { setErr(e.message || "Upload failed"); }
    setBusy(false);
  };

  if (!f && loadFailed) {
    return (
      <div className="px-5 py-6">
        <Empty Icon={Building2} title="Couldn't open your property"
          body={navigator.onLine === false ? "You're offline. Your property details open once you're connected." : "Please try again in a moment."} />
        <button type="button" onClick={load} className="tap w-full h-11 rounded-xl text-[14px] font-semibold mt-3"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Try again</button>
      </div>
    );
  }
  if (!f) return <div className="px-5 py-6 text-[13px]" style={{ color: C.muted }}>Loading…</div>;
  const st = p?.license_status || "none";
  return (
    <div className="px-5 py-4">
      <SectionLabel>Your property</SectionLabel>
      <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <Label>Property name</Label>
        <input value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="Zhiwa Boutique Stay" maxLength={80} className="w-full h-11 px-3.5 rounded-xl text-[15px] mb-3" style={field} />
        <Label>Town</Label>
        <div className="flex flex-wrap gap-2 mb-3">{stayTowns.map(([k, v]) => <Chip key={k} on={f.town === k} onClick={() => set("town", k)}>{v.n}</Chip>)}</div>
        <Label>Where you fit in an itinerary</Label>
        <div className="flex flex-wrap gap-2 mb-1">{DK_TIERS.map((k) => <Chip key={k} on={f.tier === k} onClick={() => set("tier", k)}>{DK_HOTEL[k]}</Chip>)}</div>
        <p className="text-[12px] mb-3" style={{ color: C.muted }}>Drukpah plans each night with one of these. Operators see your property under the matching nights.</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><Label>DoT star rating</Label>
            <div className="flex gap-1.5">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => set("stars", f.stars === n ? "" : n)} className="tap w-9 h-9 rounded-lg inline-flex items-center justify-center" style={{ background: f.stars >= n ? C.gold : C.bg, border: `1px solid ${C.line}` }}><Star size={15} color={f.stars >= n ? "#fff" : C.muted} fill={f.stars >= n ? "#fff" : "none"} /></button>)}</div></div>
          <div><Label>Type</Label>
            <select value={f.kind} onChange={(e) => set("kind", e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field}><option value="">Choose…</option>{Object.entries(STAY_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        </div>
        <Label>Amenities</Label>
        <div className="flex flex-wrap gap-2 mb-3">{HOTEL_AMENITIES.map((a) => <Chip key={a} on={f.amenities.includes(a)} onClick={() => set("amenities", f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a])}>{a}</Chip>)}</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><Label>Check-in from</Label><input type="time" value={f.checkin} onChange={(e) => set("checkin", e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
          <div><Label>Check-out by</Label><input type="time" value={f.checkout} onChange={(e) => set("checkout", e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
        </div>
        <Label>A line for operators</Label>
        <textarea value={f.pitch} onChange={(e) => set("pitch", e.target.value)} rows={2} maxLength={220} placeholder="Family-run, 10 minutes from Paro Dzong. Bhutanese and continental menu, hot-stone bath on request." className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none mb-3" style={field} />
        <Label>Booking policy</Label>
        <textarea value={f.policy} onChange={(e) => set("policy", e.target.value)} rows={2} maxLength={300} placeholder="Free cancellation up to 7 days before arrival. Group rates for 6+ rooms. Payment on departure or by operator invoice." className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none mb-3" style={field} />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><Label>Contact person</Label><input value={f.name} onChange={(e) => set("name", e.target.value)} className="w-full h-11 px-3.5 rounded-xl text-[14px]" style={field} /></div>
          <div><Label>Phone (+975)</Label><input value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 8))} inputMode="tel" placeholder="17 12 34 56" className="w-full h-11 px-3.5 rounded-xl text-[14px]" style={field} /></div>
        </div>
        {err && <div className="text-[13px] mb-3 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
        {note && <div className="text-[13px] mb-3 rounded-lg px-3 py-2" style={{ background: C.pineSoft, color: C.pine }}>{note}</div>}
        <OCta busy={busy} onClick={save}>Save property</OCta>
      </div>

      <SectionLabel>Department of Tourism certificate</SectionLabel>
      <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} color={st === "verified" ? C.pine : C.goldText} />
          <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{st === "verified" ? "Verified by the hub" : st === "submitted" ? "Sent — being checked" : st === "rejected" ? "Not accepted — upload a clearer copy" : "Not uploaded yet"}</div>
        </div>
        <p className="text-[13px] mb-3" style={{ color: C.muted }}>Your DoT hotel certification (or licence). Verified hotels carry a tick wherever operators see you.</p>
        <Label>Certificate / licence number</Label>
        <input value={f.licNo} onChange={(e) => set("licNo", e.target.value)} placeholder="As printed on the certificate" className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={field} />
        <input ref={certRef} type="file" accept="image/*" onChange={pickCert} className="hidden" />
        {certPreview ? (
          <>
            <img src={certPreview} alt="Certificate preview" className="w-full rounded-xl mb-3" style={{ maxHeight: 220, objectFit: "cover" }} />
            <div className="flex gap-2"><OCta busy={busy} onClick={uploadCert}>Send for verification</OCta><button onClick={() => setCertPreview(null)} className="tap h-[52px] px-4 rounded-xl text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>Cancel</button></div>
          </>
        ) : (
          <button onClick={() => certRef.current?.click()} className="tap w-full h-12 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2" style={{ background: st === "verified" ? C.card : C.goldSoft, border: st === "verified" ? `1px solid ${C.line}` : "none", color: st === "verified" ? C.ink : C.goldText }}><Upload size={16} /> {st === "none" ? "Upload certificate photo" : "Replace the photo"}</button>
        )}
      </div>
      <PrivacyPanel talent={talentById(me) || { id: me }} />
    </div>
  );
}

/* ================================ OPERATOR ================================= */
/* Hotels per stay inside a trip. Nights come from the Drukpah plan; each stay
   can hold one or more room requests. hotels_status on the trip follows along. */
function TripHotels({ trip, user, actions, open, onToggle, headless }) {
  const [bookings, setBookings] = useState(null);
  const [finding, setFinding] = useState(null);   // stay
  const [allocating, setAllocating] = useState(false);
  const [err, setErr] = useState(null);
  const boxRef = useRef(null);
  useEffect(() => { if (open && boxRef.current) boxRef.current.scrollIntoView({ block: "start", behavior: "smooth" }); }, [open]);
  const stays = useMemo(() => tripStays(trip), [trip.itinerary, trip.start, trip.end, trip.nightTowns]);
  const unallocated = stays.filter((st) => !st.townKey).reduce((n, st) => n + st.nights, 0);
  const load = async () => {
    if (!CLOUD) { setBookings([]); return; }
    const { data, error } = await supabase.from("room_bookings").select("*").eq("trip_id", trip.id).order("check_in", { ascending: true });
    if (error) { console.error("trip bookings failed:", error.message); setBookings([]); return; }
    setBookings((data || []).map(bookingFromRow));
  };
  useEffect(() => { load(); }, [trip.id]);
  useEffect(() => {
    if (!CLOUD) return;
    const ch = supabase.channel("trip-hotels-" + trip.id).on("postgres_changes", { event: "*", schema: "public", table: "room_bookings", filter: `trip_id=eq.${trip.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [trip.id]);

  // keep the Trip essentials checklist honest
  useEffect(() => {
    if (!bookings || !stays.length) return;
    const covered = stays.filter((s) => bookings.some((b) => b.status === "confirmed" && b.checkIn <= s.from && b.checkOut >= s.to)).length;
    const any = bookings.some((b) => b.status === "confirmed" || b.status === "requested");
    const next = covered === stays.length ? "done" : any ? "in_progress" : trip.hotelsStatus === "not_needed" ? "not_needed" : "not_started";
    if (next !== trip.hotelsStatus && !(next === "not_started" && trip.hotelsStatus === "done" && !bookings.length)) {
      supabase.from("trips").update({ hotels_status: next }).eq("id", trip.id).then(({ error }) => { if (!error && actions.reloadTrips) actions.reloadTrips(); });
    }
  }, [bookings, stays.length]);

  const cancel = async (b) => {
    const { error } = await supabase.from("room_bookings").update({ status: "cancelled" }).eq("id", b.id);
    if (error) setErr(error.message); else load();
  };
  const live = (bookings || []).filter((b) => b.status !== "cancelled");
  const confirmedNights = stays.filter((s) => live.some((b) => b.status === "confirmed" && b.checkIn <= s.from && b.checkOut >= s.to)).reduce((n, s) => n + s.nights, 0);
  const totalNights = stays.reduce((n, s) => n + s.nights, 0);

  const pendingCount = live.filter((b) => b.status === "requested").length;
  const declinedCount = live.filter((b) => b.status === "declined").length;
  const isOpen = headless || open;
  return (
    <div ref={boxRef} className={headless ? "" : "rounded-2xl mb-4 overflow-hidden"} style={headless ? undefined : { background: C.card, border: `1px solid ${C.line}`, scrollMarginTop: 72 }}>
      {!headless && <button onClick={onToggle} className="tap w-full text-left px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: totalNights && confirmedNights === totalNights ? C.successSoft : C.pineSoft }}>
          <BedDouble size={16} color={totalNights && confirmedNights === totalNights ? C.success : C.pine} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold" style={{ color: C.ink }}>Hotels</div>
          <div className="text-[12px] truncate" style={{ color: C.muted }}>
            {!stays.length ? "Set the trip dates or apply an itinerary to see the nights." : `${confirmedNights} of ${totalNights} nights confirmed${pendingCount ? ` · ${pendingCount} waiting` : ""}${declinedCount ? ` · ${declinedCount} declined` : ""}`}
          </div>
        </div>
        {bookings === null ? <Loader2 size={16} className="animate-spin" color={C.muted} /> : <ChevronLeft size={16} color={C.muted} style={{ transform: open ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform .2s" }} />}
      </button>}
      {isOpen && <div className={headless ? "" : "px-4 pb-4"}>
      {headless && <div className="text-[13px] mb-3" style={{ color: C.muted }}>{!stays.length ? "Set the trip dates to see the nights." : `${confirmedNights} of ${totalNights} nights confirmed${pendingCount ? ` · ${pendingCount} waiting` : ""}${declinedCount ? ` · ${declinedCount} declined` : ""}`}</div>}
      {stays.length > 0 && (
        <button onClick={() => setAllocating(true)} className="tap w-full rounded-xl px-3.5 py-3 mb-3 flex items-center gap-3 text-left" style={{ background: unallocated ? C.goldSoft : C.card, border: `1px solid ${unallocated ? "transparent" : C.line}` }}>
          <CalendarDays size={16} color={unallocated ? C.goldText : C.pine} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold" style={{ color: unallocated ? C.goldText : C.ink }}>{unallocated ? `${unallocated} ${unallocated === 1 ? "night has" : "nights have"} no town yet` : "Nights by town"}</div>
            <div className="text-[12px]" style={{ color: unallocated ? C.goldText : C.muted }}>{unallocated ? "Set where the group sleeps each night, then find a hotel per stay." : "Change where the group sleeps on any night."}</div>
          </div>
          <ChevronLeft size={15} color={unallocated ? C.goldText : C.muted} style={{ transform: "rotate(180deg)" }} />
        </button>
      )}

      {stays.map((s, i) => {
        const mine = live.filter((b) => b.checkIn < s.to && b.checkOut > s.from);
        const confirmed = mine.some((b) => b.status === "confirmed" && b.checkIn <= s.from && b.checkOut >= s.to);
        const requested = !confirmed && mine.some((b) => b.status === "requested");
        return (
          <div key={i} className="rounded-xl p-3 mb-2" style={{ background: C.bg, border: `1px solid ${C.lineSoft}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: confirmed ? C.pine : requested ? C.gold : C.card, border: confirmed || requested ? "none" : `1px solid ${C.line}` }}>
                <BedDouble size={16} color={confirmed || requested ? "#fff" : C.muted} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold truncate" style={{ color: s.townKey ? C.ink : C.goldText }}>{s.townName || "Town not set"}{s.tier ? <span className="font-normal" style={{ color: C.muted }}> · {DK_HOTEL[s.tier]}</span> : null}</div>
                <div className="text-[12px]" style={{ color: C.muted }}>{fmtNights(s.from, s.to)}{s.days.length ? ` · day${s.days.length > 1 ? "s" : ""} ${s.days[0]}${s.days.length > 1 ? `–${s.days[s.days.length - 1]}` : ""}` : ""}</div>
              </div>
              {!confirmed && (
                <button onClick={() => setFinding(s)} className="tap h-9 px-3 rounded-lg text-[13px] font-semibold shrink-0" style={{ background: requested ? C.card : C.pine, color: requested ? C.pine : "#fff", border: requested ? `1px solid ${C.pine}` : "none" }}>
                  {requested ? "Add another" : mine.length ? "Try another" : "Find a hotel"}
                </button>
              )}
            </div>
            {mine.map((b) => {
              const h = talentById(b.hotelId);
              return (
                <div key={b.id} className="mt-2 ml-12 rounded-lg px-3 py-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate inline-flex items-center gap-1" style={{ color: C.ink }}>{h?.company || h?.name || "Hotel"}{h?.verified && <BadgeCheck size={12} color={C.pine} />}</div>
                      <div className="text-[12px]" style={{ color: C.muted }}>{b.rooms} {b.rooms === 1 ? "room" : "rooms"} · {b.guests} guests · {MEAL_LABEL[b.mealPlan]}{b.checkIn !== s.from || b.checkOut !== s.to ? ` · ${fmtDate(b.checkIn)}–${fmtDate(b.checkOut)}` : ""}</div>
                    </div>
                    <BkBadge status={b.status} />
                  </div>
                  {b.hotelNote && <div className="text-[12px] mt-1.5 rounded px-2 py-1.5" style={{ background: b.status === "declined" ? C.maroonSoft : C.pineSoft, color: b.status === "declined" ? C.maroon : C.pine }}>Hotel: {b.hotelNote}</div>}
                  <div className="flex items-center gap-3 mt-1.5">
                    {h?.phone && <button onClick={() => openWhatsApp(h.phone, `Hello, ${user.name} here from the Bhutan Tourism Hub about our room request for ${fmtDate(b.checkIn)}–${fmtDate(b.checkOut)}:`)} className="tap text-[12px] font-semibold inline-flex items-center gap-1" style={{ color: C.pine }}><MessageCircle size={12} /> WhatsApp</button>}
                    {(b.status === "requested" || b.status === "confirmed") && <button onClick={() => cancel(b)} className="tap text-[12px] font-semibold" style={{ color: C.muted }}>{b.status === "confirmed" ? "Cancel booking" : "Withdraw"}</button>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {err && <div className="text-[13px] mt-2 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
      </div>}
      {finding && <FindHotelSheet trip={trip} stay={finding} user={user} onClose={() => setFinding(null)} onSent={() => { setFinding(null); load(); }} />}
      {allocating && <NightAllocator trip={trip} actions={actions} onClose={() => setAllocating(false)} />}
    </div>
  );
}

/* Which town on which night. Saved on the trip; the Hotels section groups nights into stays from it. */
function NightAllocator({ trip, actions, onClose }) {
  const total = nightsBetween(trip.start, trip.end);
  const stays = tripStays(trip);
  const initial = {}; stays.forEach((st) => st.days.forEach((d, i) => { initial[addDays(st.from, i)] = st.townKey || ""; }));
  const [map, setMap] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const towns = Object.entries(DK_TOWNS).filter(([, v]) => v.stay).sort((a, b) => a[1].n.localeCompare(b[1].n));
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  const save = async () => {
    setBusy(true); setErr(null);
    const clean = {}; Object.entries(map).forEach(([d, k]) => { if (k) clean[d] = k; });
    const r = await actions.saveTripDetails(trip.id, { night_towns: clean });
    setBusy(false);
    if (!r || !r.ok) { setErr((r && r.reason) || "Couldn't save"); return; }
    onClose();
  };
  const fillDown = (date, key) => { setMap((m) => { const n = { ...m, [date]: key }; let d = addDays(date, 1); while (nightsBetween(trip.start, d) < total && !n[d]) { n[d] = key; d = addDays(d, 1); } return n; }); };
  return (
    <Sheet onClose={onClose}>
      <div className="text-[18px] font-semibold mb-1" style={{ color: C.ink }}>Where does the group sleep?</div>
      <p className="text-[13px] mb-3" style={{ color: C.muted }}>Pick a town for each night. Choosing a town fills the empty nights after it, so a 3-night stay is one tap.</p>
      {Array.from({ length: total }, (_, i) => { const date = addDays(trip.start, i);
        return (
          <div key={date} className="flex items-center gap-3 py-2" style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
            <div className="w-20 shrink-0"><div className="text-[13px] font-semibold" style={{ color: C.ink }}>Night {i + 1}</div><div className="text-[11px]" style={{ color: C.muted }}>{fmtDate(date)}</div></div>
            <select value={map[date] || ""} onChange={(e) => fillDown(date, e.target.value)} className="flex-1 h-10 px-3 rounded-xl text-[14px]" style={field}>
              <option value="">Not set</option>
              {towns.map(([k, v]) => <option key={k} value={k}>{v.n}</option>)}
            </select>
          </div>
        ); })}
      {err && <div className="text-[13px] mt-3 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
      <div className="mt-4"><OCta busy={busy} onClick={save}>Save nights</OCta></div>
    </Sheet>
  );
}

function FindHotelSheet({ trip, stay, user, onClose, onSent, presetHotel = null, trips = [] }) {
  const [from, setFrom] = useState(stay.from);
  const [to, setTo] = useState(stay.to);
  const [summary, setSummary] = useState(null);   // hotel_id → {total, free}
  const [town, setTown] = useState(stay.townKey || "all");
  const [hotel, setHotel] = useState(presetHotel);
  const [rooms, setRooms] = useState(null);
  const [tripId, setTripId] = useState(trip ? trip.id : null);
  const linkable = trip ? [] : (trips || []).filter((t) => t.end >= isoDay(0) && t.status !== "cancelled").slice(0, 8);
  const [f, setF] = useState({ roomId: null, rooms: 1, guests: Math.max(1, (trip && (trip.guestCount || (trip.guests || []).length)) || 2), meal: "breakfast", notes: "", guestName: ((trip && trip.guests) || [])[0]?.name || "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  const nights = nightsBetween(from, to);

  const hotels = useMemo(() => Object.values(PROFILE_DIR).filter((p) => p.role === "hotel"), [summary]);
  const towns = useMemo(() => { const s = new Set(hotels.map((h) => h.hotelTown).filter(Boolean)); return [...s].sort((a, b) => hotelTownName(a).localeCompare(hotelTownName(b))); }, [hotels]);
  useEffect(() => {
    if (!CLOUD || nights <= 0) return;
    let on = true;
    supabase.rpc("hotels_free_summary", { p_from: from, p_to: to }).then(({ data, error }) => {
      if (!on) return;
      if (error) { console.error("hotels_free_summary:", error.message); setSummary({}); return; }
      const m = {}; (data || []).forEach((r) => { m[r.hotel_id] = { total: r.total_rooms, free: r.free_rooms }; }); setSummary(m);
    });
    return () => { on = false; };
  }, [from, to]);
  useEffect(() => {
    if (!hotel || nights <= 0) { setRooms(null); return; }
    let on = true;
    supabase.rpc("hotel_free_rooms", { p_hotel: hotel.id, p_from: from, p_to: to }).then(({ data, error }) => {
      if (!on) return;
      if (error) { setErr(error.message); setRooms([]); return; }
      setRooms(data || []);
      const firstFree = (data || []).find((r) => r.free > 0);
      setF((x) => ({ ...x, roomId: firstFree ? firstFree.room_id : null }));
    });
    return () => { on = false; };
  }, [hotel?.id, from, to]);

  const list = hotels
    .filter((h) => town === "all" || h.hotelTown === town)
    .map((h) => ({ ...h, avail: summary ? summary[h.id] : null }))
    .sort((a, b) => {
      const tierA = a.hotelTier === stay.tier ? 0 : 1, tierB = b.hotelTier === stay.tier ? 0 : 1;
      if (tierA !== tierB) return tierA - tierB;
      if ((b.verified ? 1 : 0) !== (a.verified ? 1 : 0)) return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
      return ((b.avail?.free || 0) - (a.avail?.free || 0));
    });

  const room = (rooms || []).find((r) => r.room_id === f.roomId);
  const send = async () => {
    if (!room) { setErr("Pick a room type with rooms free."); return; }
    if (Number(f.rooms) > room.free) { setErr(`Only ${room.free} ${room.name} free for these dates.`); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("room_bookings").insert({
      hotel_id: hotel.id, room_id: room.room_id, operator_id: user.talentId || user.id, trip_id: tripId || null,
      check_in: from, check_out: to, rooms: Number(f.rooms) || 1, guests: Number(f.guests) || 1, meal_plan: f.meal,
      guest_name: f.guestName.trim() || null, notes: f.notes.trim() || null,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onSent();
  };

  return (
    <Sheet onClose={onClose}>
      {!hotel ? (
        <>
          <div className="text-[18px] font-semibold mb-1" style={{ color: C.ink }}>Find a hotel{stay.townName ? ` in ${stay.townName}` : ""}</div>
          <p className="text-[13px] mb-3" style={{ color: C.muted }}>{stay.tier ? `Drukpah planned ${DK_HOTEL[stay.tier].toLowerCase()} for these nights. ` : ""}Rooms shown free are free on every night you asked for.</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><Label>Check in</Label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
            <div><Label>Check out</Label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
          </div>
          {towns.length > 1 && <div className="flex flex-wrap gap-2 mb-3"><Chip on={town === "all"} onClick={() => setTown("all")}>All towns</Chip>{towns.map((t) => <Chip key={t} on={town === t} onClick={() => setTown(t)}>{hotelTownName(t)}</Chip>)}</div>}
          {!hotels.length && <Empty Icon={Building2} title="No hotels on the hub yet" body="Hotels are joining now. Until then, keep booking as you do today and mark Hotels booked in Trip essentials." />}
          {hotels.length > 0 && !list.length && <div className="text-[13px] mb-3" style={{ color: C.muted }}>No hub hotels in {hotelTownName(town)} yet — try “All towns”.</div>}
          {list.map((h) => (
            <button key={h.id} onClick={() => { setErr(null); setHotel(h); }} className="tap w-full text-left rounded-2xl p-3.5 mb-2" style={{ background: C.card, border: `1px solid ${h.hotelTier === stay.tier && stay.tier ? C.pine + "66" : C.line}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}><Building2 size={18} color={C.goldSoft} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold truncate inline-flex items-center gap-1.5" style={{ color: C.ink }}>{h.company || h.name}{h.verified && <BadgeCheck size={14} color={C.pine} />}</div>
                  <div className="text-[12px] truncate" style={{ color: C.muted }}>
                    {[hotelTownName(h.hotelTown), h.starRating ? `${h.starRating}★` : null, h.stayKind ? STAY_KINDS[h.stayKind] : null, h.hotelTier ? DK_HOTEL[h.hotelTier] : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {h.avail ? (h.avail.total ? <><div className="text-[15px] font-semibold" style={{ color: h.avail.free ? C.pine : C.maroon }}>{h.avail.free}</div><div className="text-[10px]" style={{ color: C.muted }}>rooms free</div></> : <div className="text-[11px]" style={{ color: C.muted }}>no rooms listed</div>) : <Loader2 size={14} className="animate-spin" color={C.muted} />}
                </div>
              </div>
              {h.pitch && <div className="text-[12px] mt-2 leading-snug" style={{ color: C.muted }}>{h.pitch}</div>}
            </button>
          ))}
        </>
      ) : (
        <>
          {!presetHotel && <button onClick={() => setHotel(null)} className="tap inline-flex items-center gap-1 text-[13px] font-semibold mb-2" style={{ color: C.muted }}><ChevronLeft size={15} /> All hotels</button>}
          <div className="text-[18px] font-semibold inline-flex items-center gap-1.5" style={{ color: C.ink }}>{hotel.company || hotel.name}{hotel.verified && <BadgeCheck size={16} color={C.pine} />}</div>
          <div className="text-[13px] mb-3" style={{ color: C.muted }}>{[hotelTownName(hotel.hotelTown), hotel.hotelCheckin ? `check-in from ${hotel.hotelCheckin}` : null].filter(Boolean).join(" · ")}</div>
          {presetHotel && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><Label>Check in</Label><input type="date" value={from} min={isoDay(0)} onChange={(e) => { setFrom(e.target.value); if (to <= e.target.value) setTo(addDays(e.target.value, 1)); }} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
              <div><Label>Check out</Label><input type="date" value={to} min={addDays(from, 1)} onChange={(e) => setTo(e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
            </div>
          )}
          {linkable.length > 0 && (
            <div className="mb-3">
              <Label>For which trip? (optional)</Label>
              <div className="flex flex-wrap gap-2"><Chip on={!tripId} onClick={() => setTripId(null)}>No trip yet</Chip>{linkable.map((t) => <Chip key={t.id} on={tripId === t.id} onClick={() => setTripId(t.id)}>{t.title}</Chip>)}</div>
            </div>
          )}
          {hotel.hotelPolicy && <div className="text-[12px] rounded-lg px-3 py-2 mb-3" style={{ background: C.bg, color: C.ink }}>{hotel.hotelPolicy}</div>}
          <Label>Room type</Label>
          {rooms === null && <div className="text-[13px] mb-3" style={{ color: C.muted }}>Checking what's free…</div>}
          {rooms && !rooms.length && <div className="text-[13px] mb-3" style={{ color: C.muted }}>This hotel hasn't listed room types yet. Send them a message and ask.</div>}
          {(rooms || []).map((r) => (
            <button key={r.room_id} disabled={!r.free} onClick={() => set("roomId", r.room_id)} className="tap w-full text-left rounded-xl px-3.5 py-3 mb-2 flex items-center gap-3"
              style={{ background: f.roomId === r.room_id ? C.pineSoft : C.card, border: `1.5px solid ${f.roomId === r.room_id ? C.pine : C.line}`, opacity: r.free ? 1 : .5 }}>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{r.name}</div>
                <div className="text-[12px]" style={{ color: C.muted }}>{BED_LABEL[r.beds]} · sleeps {r.capacity}{r.rate_nu ? ` · ${fmtNu(r.rate_nu)}/night` : ""}{r.notes ? ` · ${r.notes}` : ""}</div>
              </div>
              <div className="text-right"><div className="text-[14px] font-semibold" style={{ color: r.free ? C.pine : C.maroon }}>{r.free}</div><div className="text-[10px]" style={{ color: C.muted }}>free</div></div>
            </button>
          ))}
          {room && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3 mt-1">
                <div><Label>Rooms (max {room.free})</Label><input type="number" min={1} max={room.free} value={f.rooms} onChange={(e) => set("rooms", e.target.value)} className="w-full h-11 px-3.5 rounded-xl text-[15px]" style={field} /></div>
                <div><Label>Guests</Label><input type="number" min={1} value={f.guests} onChange={(e) => set("guests", e.target.value)} className="w-full h-11 px-3.5 rounded-xl text-[15px]" style={field} /></div>
              </div>
              {Number(f.guests) > Number(f.rooms) * room.capacity && <div className="text-[12px] mb-3" style={{ color: C.goldText }}>{f.rooms} × {room.name} sleeps {Number(f.rooms) * room.capacity}. You may need more rooms.</div>}
              <Label>Meals</Label>
              <div className="flex flex-wrap gap-2 mb-3">{Object.entries(MEAL_LABEL).map(([k, l]) => <Chip key={k} on={f.meal === k} onClick={() => set("meal", k)}>{l}</Chip>)}</div>
              <Label>Lead guest or group name</Label>
              <input value={f.guestName} onChange={(e) => set("guestName", e.target.value)} maxLength={80} className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={field} />
              <Label>Note to the hotel (optional)</Label>
              <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={240} placeholder="Late arrival from Paro, one vegetarian, interconnecting rooms if possible…" className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none mb-3" style={field} />
              {room.rate_nu && <div className="text-[13px] mb-3" style={{ color: C.muted }}>Guide price: {fmtNu(room.rate_nu * Number(f.rooms || 1) * nights)} for {f.rooms} × {nights} {nights === 1 ? "night" : "nights"}. The hotel confirms the final rate.</div>}
              {err && <div className="text-[13px] mb-3 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
              <OCta busy={busy} onClick={send}>Send request</OCta>
              <p className="text-[12px] text-center mt-2" style={{ color: C.muted }}>The hotel answers in the app. Nothing is booked until they confirm.</p>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

/* Guides and drivers see where the group sleeps, once it's confirmed. */
function CrewHotelsBrief({ trip }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    if (!CLOUD) return;
    supabase.from("room_bookings").select("*").eq("trip_id", trip.id).eq("status", "confirmed").order("check_in", { ascending: true })
      .then(({ data }) => setList((data || []).map(bookingFromRow)));
  }, [trip.id]);
  if (!list.length) return null;
  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>Where the group sleeps</div>
      {list.map((b) => { const h = talentById(b.hotelId);
        return (
          <div key={b.id} className="flex items-start gap-3 py-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <BedDouble size={16} color={C.pine} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{h?.company || h?.name || "Hotel"}{h?.hotelTown ? <span className="font-normal" style={{ color: C.muted }}> · {hotelTownName(h.hotelTown)}</span> : null}</div>
              <div className="text-[12px]" style={{ color: C.muted }}>{fmtNights(b.checkIn, b.checkOut)} · {b.rooms} {b.rooms === 1 ? "room" : "rooms"}{h?.hotelCheckin ? ` · check-in from ${h.hotelCheckin}` : ""}</div>
            </div>
            {h?.phone && <a href={`tel:${dialNumber(h.phone)}`} className="tap w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0" style={{ background: C.pineSoft }} aria-label="Call hotel"><Phone size={14} color={C.pine} /></a>}
          </div>
        ); })}
    </div>
  );
}

/* ========================================================================== */
/*  TALENT CALENDAR — where a guide or driver is booked, blocked, or asked.    */
/*  Confirmed trips are exclusive (the database refuses a second booking for   */
/*  the same days). Own blocks count as busy. Pending requests may overlap     */
/*  each other; accepting one declines the rest for those days.               */
/* ========================================================================== */
const CAL_KIND = {
  trip:    { label: "Confirmed trip", bg: C.pine, fg: "#fff" },
  block:   { label: "Blocked by you", bg: "#D7D7DC", fg: C.ink },
  pending: { label: "Request waiting", bg: C.goldSoft, fg: C.goldText, ring: C.gold },
};
const rangesOverlap = (a1, a2, b1, b2) => a1 <= b2 && a2 >= b1;
const dayKindsFor = (date, ranges) => ranges.filter((r) => r.from <= date && r.to >= date).map((r) => r.kind);

/** Loads busy ranges for a talent. For the person themself: trips from props, own blocks from the table,
 *  pending requests from props. For anyone else: the privacy-safe RPC (busy/blocked/pending ranges only). */
function useTalentBusy({ talentId, self, trips, jobs, from, to }) {
  const [blocks, setBlocks] = useState([]);
  const [remote, setRemote] = useState(null);   // ranges from the RPC, non-self only
  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);
  useEffect(() => {
    if (!CLOUD || !talentId) { setRemote([]); return; }
    let on = true;
    if (self) {
      supabase.from("talent_blocks").select("*").eq("talent_id", talentId).order("start_date", { ascending: true })
        .then(({ data }) => { if (on) setBlocks((data || []).map((b) => ({ id: b.id, from: b.start_date, to: b.end_date, label: b.label || "", kind: "block" }))); });
    } else {
      supabase.rpc("talent_busy", { p_talent: String(talentId), p_from: from, p_to: to })
        .then(({ data, error }) => { if (!on) return; if (error) { console.error("talent_busy:", error.message); setRemote([]); return; } setRemote((data || []).map((r) => ({ kind: r.kind, from: r.from_date, to: r.to_date }))); });
    }
    return () => { on = false; };
  }, [talentId, self, from, to, tick, (trips || []).length, (jobs || []).length]);
  const ranges = useMemo(() => {
    if (!self) return remote || [];
    const me = String(talentId);
    const tripRanges = (trips || []).filter((t) => t && t.status !== "cancelled" && (t.members || []).some((m) => String(m.id) === me && !["operator", "moderator", "manager"].includes(m.roleInTrip)))
      .map((t) => ({ kind: "trip", from: t.start, to: t.end || t.start, title: t.title, operator: t.operator, id: t.id }));
    const pend = (jobs || []).filter((j) => j && !j.deletedAt && String(j.toTalentId) === me && j.status === "pending")
      .map((j) => ({ kind: "pending", from: j.start, to: j.end || j.start, title: j.title, operator: j.operator, id: j.id }));
    return [...tripRanges, ...blocks, ...pend];
  }, [self, remote, trips, jobs, blocks, talentId]);
  return { ranges, blocks, loaded: self ? true : remote !== null, reload };
}

function CalMonth({ month, ranges, selFrom, selTo, onPick, compact }) {
  const first = new Date(month + "-01T00:00");
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const today = isoDay(0);
  return (
    <div>
      <div className="text-[13px] font-semibold mb-1.5" style={{ color: C.ink }}>{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
      <div className="grid grid-cols-7 gap-[3px] mb-1">{["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <div key={i} className="text-center text-[10px] font-semibold" style={{ color: C.muted }}>{w}</div>)}</div>
      <div className="grid grid-cols-7 gap-[3px]">
        {Array.from({ length: lead }).map((_, i) => <div key={"l" + i} />)}
        {Array.from({ length: daysIn }, (_, i) => {
          const d = `${month}-${String(i + 1).padStart(2, "0")}`;
          const kinds = dayKindsFor(d, ranges);
          const main = kinds.includes("trip") ? "trip" : kinds.includes("block") ? "block" : null;
          const pend = kinds.includes("pending");
          const sel = selFrom && selTo && d >= selFrom && d <= selTo;
          const past = d < today;
          const m = main ? CAL_KIND[main] : null;
          return (
            <button key={d} type="button" disabled={!onPick} onClick={() => onPick && onPick(d)} aria-label={`${fmtDate(d)}${main ? ": " + CAL_KIND[main].label : ""}${pend ? ", request waiting" : ""}`}
              className="tap rounded-md flex items-center justify-center relative" style={{ height: compact ? 30 : 36, background: m ? m.bg : sel ? C.pineSoft : C.card, color: m ? m.fg : sel ? C.pine : C.ink,
                border: `1.5px solid ${sel ? C.pine : d === today ? C.pine : pend ? C.gold : C.lineSoft}`, opacity: past ? .45 : 1, fontSize: compact ? 11 : 12, fontWeight: main || sel ? 600 : 500 }}>
              {i + 1}
              {pend && !main && <span className="absolute rounded-full" style={{ width: 5, height: 5, background: C.gold, bottom: 3, left: "50%", marginLeft: -2.5 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
const monthKey = (d) => String(d).slice(0, 7);
const shiftMonth = (m, n) => { const d = new Date(m + "-01T12:00"); d.setMonth(d.getMonth() + n); return localISO(d).slice(0, 7); };

/** The calendar card. `self`: full editor (block dates, see trips and requests). Otherwise read-only. */
function TalentCalendar({ talent, self, trips, jobs, compact, title }) {
  const talentId = talent?.id;
  const [month, setMonth] = useState(monthKey(isoDay(0)));
  const from = isoDay(-45), to = isoDay(400);
  const { ranges, blocks, loaded, reload } = useTalentBusy({ talentId, self, trips, jobs, from, to });
  const [blocking, setBlocking] = useState(null);   // { from, to } while adding a block
  const [err, setErr] = useState(null);
  const today = isoDay(0);
  const upcomingTrips = ranges.filter((r) => r.kind === "trip" && r.to >= today).sort((a, b) => a.from.localeCompare(b.from)).slice(0, 6);
  const upcomingBlocks = blocks.filter((b) => b.to >= today).sort((a, b) => a.from.localeCompare(b.from));
  const pendingCount = ranges.filter((r) => r.kind === "pending" && r.to >= today).length;
  const removeBlock = async (id) => {
    setErr(null);
    const { error } = await supabase.from("talent_blocks").delete().eq("id", id);
    if (error) setErr(error.message); else reload();
  };
  const pick = (d) => {
    if (!self) return;
    const kinds = dayKindsFor(d, ranges);
    if (kinds.includes("trip")) return;                      // confirmed days are not editable here
    const b = blocks.find((x) => x.from <= d && x.to >= d);
    if (b) { setBlocking({ edit: b }); return; }
    setBlocking({ from: d, to: d });
  };
  return (
    <div className={compact ? "" : "rounded-2xl p-4 mt-5"} style={compact ? undefined : { background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2"><CalendarDays size={16} color={C.gold} /><span className="text-[14px] font-semibold" style={{ color: C.ink }}>{title || (self ? "Your calendar" : "Availability")}</span></div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="tap w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.grey }} aria-label="Previous month"><ChevronLeft size={15} color={C.ink} /></button>
          <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="tap w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.grey }} aria-label="Next month"><ChevronLeft size={15} color={C.ink} style={{ transform: "rotate(180deg)" }} /></button>
        </div>
      </div>
      <p className="text-[12px] mb-3" style={{ color: C.muted }}>
        {self ? "Confirmed trips block these days automatically. Tap a free day to block it yourself." : "Dark days are taken. Gold dots mean another operator has already asked; you can still ask."}
      </p>
      {!loaded && <div className="text-[12px] mb-2" style={{ color: C.muted }}>Loading…</div>}
      <div className={compact ? "" : "grid gap-4"} style={compact ? undefined : { gridTemplateColumns: "1fr" }}>
        <CalMonth month={month} ranges={ranges} onPick={self ? pick : null} compact={compact} />
        {!compact && <CalMonth month={shiftMonth(month, 1)} ranges={ranges} onPick={self ? pick : null} compact={compact} />}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] mt-3" style={{ color: C.muted }}>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.pine }} /> confirmed trip</span>
        {self && <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#D7D7DC" }} /> blocked by you</span>}
        {!self && <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#D7D7DC" }} /> not available</span>}
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ border: `1.5px solid ${C.gold}` }} /> request waiting</span>
      </div>

      {self && (
        <>
          <button type="button" onClick={() => setBlocking({ from: isoDay(1), to: isoDay(1) })} className="tap w-full h-11 mt-3 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5" style={{ background: C.grey, color: C.ink }}><Lock size={14} /> Block dates</button>
          {(upcomingTrips.length > 0 || upcomingBlocks.length > 0 || pendingCount > 0) && (
            <div className="mt-3 rounded-xl divide-y" style={{ border: `1px solid ${C.lineSoft}`, borderColor: C.lineSoft }}>
              {pendingCount > 0 && <div className="px-3 py-2.5 text-[12px]" style={{ color: C.goldText }}>{pendingCount} request{pendingCount === 1 ? "" : "s"} waiting for your answer, under Jobs → Invites.</div>}
              {upcomingTrips.map((t) => (
                <div key={t.id} className="px-3 py-2.5 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: C.pine }} />
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-medium truncate" style={{ color: C.ink }}>{t.title}</div><div className="text-[11px]" style={{ color: C.muted }}>{fmtDate(t.from)} – {fmtDate(t.to)}{t.operator ? ` · ${t.operator}` : ""}</div></div>
                </div>
              ))}
              {upcomingBlocks.map((b) => (
                <div key={b.id} className="px-3 py-2.5 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#B4B4BA" }} />
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-medium truncate" style={{ color: C.ink }}>{b.label || "Blocked"}</div><div className="text-[11px]" style={{ color: C.muted }}>{fmtDate(b.from)} – {fmtDate(b.to)} · only you see the note</div></div>
                  <button type="button" onClick={() => removeBlock(b.id)} className="tap h-8 px-3 rounded-lg text-[12px] font-semibold" style={{ background: C.grey, color: C.maroon }}>Unblock</button>
                </div>
              ))}
            </div>
          )}
          {err && <div className="text-[12px] mt-2 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
          {blocking && <BlockDatesSheet talentId={talentId} init={blocking} ranges={ranges} onClose={() => setBlocking(null)} onSaved={() => { setBlocking(null); reload(); }} onRemove={blocking.edit ? () => { removeBlock(blocking.edit.id); setBlocking(null); } : null} />}
        </>
      )}
    </div>
  );
}

function BlockDatesSheet({ talentId, init, ranges, onClose, onSaved, onRemove }) {
  const edit = init.edit || null;
  const [from, setFrom] = useState(edit ? edit.from : init.from);
  const [to, setTo] = useState(edit ? edit.to : init.to);
  const [label, setLabel] = useState(edit ? edit.label : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  const tripClash = ranges.find((r) => r.kind === "trip" && rangesOverlap(from, to, r.from, r.to));
  const pendClash = ranges.filter((r) => r.kind === "pending" && rangesOverlap(from, to, r.from, r.to));
  const save = async () => {
    if (!from || !to || to < from) { setErr("The end date must be on or after the start."); return; }
    if (tripClash) { setErr(`You're already confirmed on "${tripClash.title}" for some of these days; those stay booked either way.`); return; }
    setBusy(true); setErr(null);
    if (edit) { const { error } = await supabase.from("talent_blocks").delete().eq("id", edit.id); if (error) { setBusy(false); setErr(error.message); return; } }
    const { error } = await supabase.from("talent_blocks").insert({ talent_id: talentId, start_date: from, end_date: to, label: label.trim() || null, source: "manual" });
    setBusy(false);
    if (error) { setErr(/duplicate|unique/i.test(error.message) ? "Those exact dates are already blocked." : error.message); return; }
    onSaved();
  };
  return (
    <Sheet onClose={onClose}>
      <div className="text-[18px] font-semibold mb-1" style={{ color: C.ink }}>{edit ? "Blocked dates" : "Block dates"}</div>
      <p className="text-[13px] mb-3" style={{ color: C.muted }}>Operators can't send you requests for these days. Remove the block any time.</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><Label>From</Label><input type="date" value={from} min={isoDay(0)} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
        <div><Label>To</Label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="w-full h-11 px-3 rounded-xl text-[14px]" style={field} /></div>
      </div>
      <Label>Note for yourself (optional, private)</Label>
      <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="Family · own tour · rest" className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={field} />
      {pendClash.length > 0 && <div className="text-[12px] mb-3 rounded-lg px-3 py-2" style={{ background: C.goldSoft, color: C.goldText }}>{pendClash.length} request{pendClash.length === 1 ? "" : "s"} waiting for these days will stay open; decline {pendClash.length === 1 ? "it" : "them"} under Jobs → Invites if you're not taking work then.</div>}
      {err && <div className="text-[13px] mb-3 rounded-lg px-3 py-2" style={{ background: C.maroonSoft, color: C.maroon }}>{err}</div>}
      <OCta busy={busy} onClick={save}>{edit ? "Save changes" : "Block these dates"}</OCta>
      {onRemove && <button type="button" onClick={onRemove} className="tap w-full h-10 mt-2 text-[13px] font-semibold" style={{ color: C.maroon }}>Unblock these dates</button>}
    </Sheet>
  );
}

/** Conflict check for a request the operator is about to send: confirmed/blocked days refuse; pending days warn. */
function useRequestAvailability({ talent, start, end }) {
  const from = isoDay(-45), to = isoDay(400);
  const { ranges, loaded } = useTalentBusy({ talentId: talent?.id, self: false, from, to });
  if (!start || !end || end < start) return { ok: true, note: null, ranges, loaded };
  const taken = ranges.filter((r) => (r.kind === "trip" || r.kind === "block") && rangesOverlap(start, end, r.from, r.to));
  const pend = ranges.filter((r) => r.kind === "pending" && rangesOverlap(start, end, r.from, r.to));
  if (taken.length) return { ok: false, note: `${String(talent?.name || "They").split(" ")[0]} is not available ${taken.map((r) => `${fmtDate(r.from)}–${fmtDate(r.to)}`).join(", ")}. Choose other dates.`, ranges, loaded };
  if (pend.length) return { ok: true, note: `${pend.length} other request${pend.length === 1 ? "" : "s"} already waiting for these dates. You can still ask; whoever ${String(talent?.name || "they").split(" ")[0]} accepts first gets the booking.`, ranges, loaded, soft: true };
  return { ok: true, note: null, ranges, loaded };
}
