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
  TrendingUp } from "lucide-react";
import mapImg from "./map.jpg";
import { supabase } from "./supabase.js";

/* Bhutan Tourism Hub design system — paper, pine forest, temple gold, kemar red. */
const C = {
  bg: "#F4F5F1", card: "#FFFFFF", ink: "#1A241E", muted: "#5E6963",
  line: "#E4E7E0", lineSoft: "#EEF0EB", pine: "#21402F", pineDeep: "#16281E",
  gold: "#C0872B", goldSoft: "#F3E8CF", maroon: "#7A2E2E", maroonSoft: "#F7E9E7", pineSoft: "#E4EFE7",
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
  languages: Array.isArray(p.languages) ? p.languages : [],
  phone: p.phone || "", email: p.email || "", pitch: p.pitch || "", vehicle: p.vehicle || null,
  availability: p.availability || "open", availableFrom: p.available_from || null, availableNote: p.availability_note || "",
  joinedAt: p.created_at ? new Date(p.created_at).getTime() : null,
});
const talentById = (id) => TALENT.find((t) => t.id === id) || PROFILE_DIR[id] || null;
const initialsOf = (name) => (String(name || "?").trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("") || "?").toUpperCase();
const isoDay = (offset = 0) => new Date(Date.now() + offset * 86400e3).toISOString().slice(0, 10);
const sysMsg = (text) => ({ id: uid(), senderId: null, kind: "system", body: text, photo: null, ts: Date.now() });

/* ── Cloud (Supabase) ── posts are global when configured; everything falls back to local demo mode when not. */
const CLOUD = Boolean(supabase);
const DEMO_MODE = false;   // set true only for local demos without a database
const BUILD = "BUILD 29 — 6 Oct";   // bump every deploy; shown at the top of the welcome screen
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
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/* ---- Device notifications ----
   Shows a system notification when new activity arrives while the app is open or
   backgrounded. For notifications when the app is fully closed, see PUSH-SETUP.md. */
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
  componentDidCatch(err, info) { this.setState({ info }); console.error("App crashed:", err, info); }
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
  }, []);

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
    if (error) console.error("setEnquiryStatus failed:", error.message);
    fetchEnquiries();
  };

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
    await dbWrite("trip_messages.insert", supabase.from("trip_messages").insert({
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

  const realUser = CLOUD && !authBusy && session && myProfile && typeof myProfile === "object"
    ? { id: session.user.id, kind: myProfile.role, talentId: session.user.id, name: myProfile.full_name,
        initials: initialsOf(myProfile.full_name || "?"), licenseStatus: myProfile.license_status || "none",
        isAdmin: myProfile.role === "admin" }
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
  // before they sign up: who invited them, and to what
  useEffect(() => {
    if (!CLOUD || !inviteToken || inviteMe) return;
    supabase.rpc("preview_crew_invite", { p_token: inviteToken }).then(({ data, error }) => {
      if (!error && data) setInvitePreview(data);
    });
  }, [inviteToken, inviteMe]);
  // once signed in as a guide or driver: the invitation becomes theirs
  useEffect(() => {
    if (!CLOUD || !inviteToken || !inviteMe) return;
    const forget = () => { try { localStorage.removeItem("bth_invite"); } catch (e) {} setInviteToken(null); setInvitePreview(null); };
    if (inviteKind !== "guide" && inviteKind !== "driver") { forget(); return; }
    supabase.rpc("claim_crew_invite", { p_token: inviteToken }).then(({ error }) => {
      if (error) console.warn("claim_crew_invite:", error.message);
      forget(); fetchInvites();
    });
  }, [inviteToken, inviteMe, inviteKind]);

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
    if (error) console.error("cancelInvite failed:", error.message);
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
      id: tr.id, operatorId: tr.operator_id, operator: tr.operator_name, title: tr.title,
      start: tr.start_date, end: tr.end_date, meetingPoint: tr.meeting_point || null,
      arrivalFlight: tr.arrival_flight || null, arrivalAt: tr.arrival_at || null,
      departureFlight: tr.departure_flight || null, departureAt: tr.departure_at || null,
      arrivalPoint: tr.arrival_point || null,
      visaStatus: tr.visa_status || "not_started", sdfStatus: tr.sdf_status || "not_started",
      permitsStatus: tr.permits_status || "not_needed", hotelsStatus: tr.hotels_status || "not_started",
      insuranceOk: !!tr.insurance_ok,
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
    await setApplicant(listing.id, applicant.talentId, "hired");
    setListings((L) => L.map((l) => (l.id === listing.id ? { ...l, status: "filled" } : l)));
    if (CLOUD) { const { error: jfErr } = await supabase.from("job_listings").update({ status: "filled" }).eq("id", listing.id); if (jfErr) console.error("job_listings.filled failed:", jfErr.message); fetchJobs(); }
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
        @media (prefers-reduced-motion: no-preference){ .fade{ animation: fade .28s ease both; } }
        @keyframes fade{ from{ opacity:0; transform: translateY(4px);} }
        .fade{ animation-duration:.2s; }
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
      `}</style>

      <div className={`app-shell flex flex-col${user ? " signed-in" : ""}`} style={{ color: C.ink }}>
        {!user ? (
          <Login onPick={setAccountId} session={session} myProfile={myProfile} onAuthed={reloadMe} onBusy={setAuthBusy} invitePreview={invitePreview} />
        ) : (
          <InvitesCtx.Provider value={{ invites, creditRequests }}>
          <Shell key={user.id} user={user} posts={posts} jobs={jobs} trips={trips} listings={listings} enquiries={enquiries} dirTick={dirTick}
            actions={{ addPost, approve, reject, deletePost, reloadDirectory: loadProfiles, setAvailability, toggleFollow, sendJob, setJobStatus, postChat, openChat, postListing, applyToListing, setApplicant, hireApplicant, saveEnquiry, setEnquiryStatus, convertEnquiry, reloadTrips: fetchTrips, binListing, destroyListing, binRequest, destroyRequest, saveTripDetails, createInvite, cancelInvite, respondInvite }} engagement={{ likes, comments, toggleLike, addComment, deleteComment, follows, toggleFollow, stories, addStory, deleteStory }} dm={{ dms, sendDm, markRead, sharePostTo }} onLogout={() => { if (session) supabase.auth.signOut(); setAccountId(null); }} />
          </InvitesCtx.Provider>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}

/* ================================ Welcome ================================= */
function Login({ onPick, session, myProfile, onAuthed, onBusy, invitePreview }) {
  const [authView, setAuthView] = useState(null);
  useEffect(() => { onBusy && onBusy(!!authView); return () => onBusy && onBusy(false); }, [authView]);
  if (authView) {
    return (
      <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
        <Onboard mode={authView} session={session} invite={invitePreview}
          onBack={() => { setAuthView(null); onBusy && onBusy(false); }}
          onDone={() => { onBusy && onBusy(false); setAuthView(null); onAuthed(); }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
      <div className="min-h-full flex flex-col px-6 pt-6 pb-6">
        {/* brand */}
        <div className="flex items-center gap-3">
          <BrandMark size={44} />
          <div>
            <div className="text-[17px] font-semibold tracking-[-0.01em] leading-none" style={{ color: C.ink }}>Bhutan Tourism Hub</div>
            <div className="text-[10px] font-semibold tracking-[.14em] uppercase mt-1.5" style={{ color: C.goldText }}>Guides · Drivers · Operators</div>
          </div>
        </div>

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
function BrandMark({ size = 40, label = "", className = "" }) {
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} role={label ? "img" : undefined}
      aria-label={label || undefined} aria-hidden={label ? undefined : "true"}
      className={`shrink-0 select-none ${className}`} style={{ width: size, height: size, display: "block" }}>
      <defs> <linearGradient id="bthMarkBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A4A38"/><stop offset="1" stopColor="#14241A"/></linearGradient> </defs> <rect width="1024" height="1024" rx="228" fill="url(#bthMarkBg)"/> <polygon points="255.8,821.88 768.2,821.88 734.04,504.68 289.96,504.68" fill="#F2EADB"/> <polygon points="512,821.88 768.2,821.88 734.04,504.68 512,504.68" fill="#DCD0BA"/> <polygon points="289.96,504.68 734.04,504.68 742.58,577.88 281.42,577.88" fill="#8E3B2C"/> <polygon points="233.84,504.68 790.16,504.68 695,433.92 329,433.92" fill="#D6A23E"/> <polygon points="512,504.68 790.16,504.68 695,433.92 512,433.92" fill="#B6852D"/> <rect x="399.76" y="370.48" width="224.48" height="63.44" rx="0" fill="#8E3B2C"/> <polygon points="355.84,370.48 668.16,370.48 592.52,314.36 431.48,314.36" fill="#D6A23E"/> <polygon points="512,370.48 668.16,370.48 592.52,314.36 512,314.36" fill="#B6852D"/> <rect x="485.16" y="272.88" width="53.68" height="41.48" rx="0" fill="#D6A23E"/> <polygon points="477.84,277.76 546.16,277.76 512,189.92" fill="#D6A23E"/>
    </svg>
  );
}

/* ================================= Shell ================================== */
const NAV = {
  guide: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "jobs", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: MapIcon }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  driver: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "jobs", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: MapIcon }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  operator: [{ id: "bookings", label: "Bookings", Icon: CalendarCheck }, { id: "insights", label: "Insights", Icon: TrendingUp }, { id: "itinerary", label: "Itinerary", Icon: CalendarDays }, { id: "discover", label: "Crew", Icon: Search }, { id: "requests", label: "Jobs", Icon: Briefcase }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "feed", label: "Feed", Icon: Newspaper }],
  admin: [{ id: "review", label: "Review", Icon: ShieldCheck }, { id: "users", label: "Users", Icon: Users }, { id: "insights", label: "Insights", Icon: TrendingUp }, { id: "feed", label: "Feed", Icon: Newspaper }, { id: "discover", label: "Discover", Icon: Search }, { id: "chats", label: "Messages", Icon: MessageSquare }],
};
const DEFAULT_TAB = { guide: "post", driver: "post", operator: "bookings", admin: "review" };

function Shell({ user, posts, jobs, trips, listings, enquiries, actions, engagement, dm, dirTick, onLogout }) {
  const { invites: crewInvites, creditRequests: openCreditRequests } = React.useContext(InvitesCtx);
  const [tab, setTab] = useState(DEFAULT_TAB[user.kind]);
  const [overlay, setOverlay] = useState(null); // {type:'profile'|'request', talentId}
  const [dmWith, setDmWith] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
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
      if (!isStandalone() && !localStorage.getItem("bth_install_dismissed")) setInstallSheet(true);
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
      add({ id: `dm-${m.id}`, kind: m.official ? "official" : m.sharedPostId ? "share" : "message",
        who: m.from, text: m.body, ts: m.ts, urgent: m.official }));

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
    (jobs || []).filter((j) => j && !j.deletedAt && j.toTalentId === actorId && j.status === "pending").forEach((j) =>
      add({ id: `job-${j.id}`, kind: "job", who: j.operatorId, text: j.title, ts: j.createdAt }));

    // open listings matching my role (guides see guide jobs, drivers see driver jobs)
    if (user.kind === "guide" || user.kind === "driver") {
      (listings || []).filter((l) => l && !l.deletedAt && l.status === "open" && l.role === user.kind &&
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
            text: tr.title, ts: new Date(tr.end + "T23:59").getTime(), tripId: tr.id });
        }
      });
    }

    return out.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 50);
    } catch (e) { console.error('alertItems failed:', e); return []; }
  }, [dm?.dms, engagement?.likes, engagement?.comments, engagement?.follows, jobs, listings, posts, trips, actorId, dirTick, user.licenseStatus, crewInvites, openCreditRequests]);

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
  const myJobsPending = myTalent ? jobs.filter((j) => !j.deletedAt && j.toTalentId === myTalent.id && j.status === "pending").length : 0;
  const availableListings = myTalent ? listings.filter((l) => !l.deletedAt && l.status === "open" && l.role === user.kind && !(l.applicants || []).some((a) => a.talentId === myTalent.id)).length : 0;
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
        badges={{ jobs: jobsBadge, review: pendingModCount, chats: unreadDm, bookings: enquiryBadge }}
        alerts={alertItems.length} onOpenAlerts={() => setAlertsOpen(true)} onLogout={onLogout} />

      <div className="main-col">
      <TopBar user={user} onLogout={onLogout} alerts={alertItems.length} onOpenAlerts={() => setAlertsOpen(true)}
        onSearch={(term) => { setOverlay(null); setTab(user.kind === "operator" ? "discover" : "post"); setSearchTerm(term); }} />

      <div className="flex-1 min-h-0 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        <div className="content-pad">
        <VerifyBanner user={user} />
        {overlay ? (
          overlay.type === "profile" ? (
            <TalentProfile talent={talentById(overlay.talentId)} posts={posts} eng={eng}
              onOpenProfile={openProfile}
              onMessage={(id) => { setOverlay(null); setTab("chats"); setDmWith(id); }}
              canRequest={user.kind === "operator"} self={user.talentId === overlay.talentId} contactOnly={user.kind === "admin"}
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
            {tab === "jobs" && <JobsHub user={user} jobs={jobs} listings={listings} actions={actions} />}
            {tab === "trips" && <TripsTab user={user} trips={trips} actions={actions} />}
            {tab === "chats" && <ChatsTab user={user} me={actorId} dm={dm} trips={trips} actions={actions} posts={posts} dirTick={dirTick} onOpenPost={setSharedPost} openWith={dmWith} onOpened={() => setDmWith(null)} onOpenProfile={openProfile} />}
            {tab === "profile" && <TalentProfile talent={talentById(user.talentId)} posts={posts} eng={eng} self onSetAvailability={actions.setAvailability} onProfileSaved={actions.reloadDirectory} onOpenProfile={openProfile} onBack={null} />}
            {tab === "bookings" && <BookingsTab user={user} enquiries={enquiries} trips={trips} actions={actions} onOpenProfile={openProfile} />}
            {tab === "itinerary" && <QuickItinerary user={user} trips={trips} actions={actions} />}
            {tab === "insights" && <InsightsTab user={user} trips={trips} enquiries={enquiries} />}
            {tab === "discover" && <Discover onOpen={openProfile} initialQuery={searchTerm} dirTick={dirTick} />}
            {tab === "requests" && <OperatorJobs user={user} jobs={jobs} listings={listings} posts={posts} actions={actions} eng={eng} onOpen={openProfile} />}
            {tab === "feed" && <Feed posts={posts} eng={eng} admin={user.kind === "admin"} onDelete={actions.deletePost} onOpenProfile={openProfile} following={myFollowing} />}
            {tab === "review" && <Review posts={posts} onApprove={actions.approve} onReject={actions.reject} eng={eng} />}
            {tab === "users" && <AdminUsers onChanged={actions.reloadDirectory} currentAdminId={actorId} />}
          </div>
        )}
        </div>
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
          onClose={() => { setInstallSheet(false); try { localStorage.setItem("bth_install_dismissed", "1"); } catch (e) {} }} />
      )}

      {alertsOpen && (
        <AlertsSheet items={alertItems} onClose={() => setAlertsOpen(false)}
          notifyOn={notifyOn}
          onEnableNotify={async () => { const r = await askNotificationPermission(); setNotifyOn(r === "granted"); }}
          installed={installed}
          onInstall={() => { setAlertsOpen(false); setInstallSheet(true); }}
          onOpenProfile={(id) => { setAlertsOpen(false); openProfile(id); }}
          onOpenMessages={() => { setAlertsOpen(false); setTab("chats"); }}
          onOpenJobs={() => { setAlertsOpen(false); setTab(user.kind === "operator" ? "requests" : "jobs"); }}
          onOpenTrips={() => { setAlertsOpen(false); setTab(user.kind === "operator" ? "bookings" : "trips"); }}
          onOpenSelf={() => { setAlertsOpen(false); setTab(user.kind === "operator" || user.kind === "admin" ? "discover" : "profile"); }}
          onOpenUsers={() => { setAlertsOpen(false); setTab("users"); }} />
      )}

      <BottomNav nav={nav} tab={tab}
        setTab={(t) => { setOverlay(null); setSharedPost(null); setTab(t); }}
        badges={{ jobs: jobsBadge, review: pendingModCount, chats: unreadDm, bookings: enquiryBadge }} />
      </div>
    </>
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
function Avatar({ initials, size = 40 }) {
  return (
    <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: C.pine }}>
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
      <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>{children}</div>
      {trailing && <div className="text-[13px]" style={{ color: C.muted }}>{trailing}</div>}
    </div>
  );
}
function StatusBadge({ status, reason }) {
  const m = {
    pending: { bg: C.goldSoft, fg: C.goldText, Icon: Clock, label: "Pending review" },
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

const roleLabel = (r) => (r === "guide" ? "Guide" : r === "operator" ? "Tour Operator" : "Driver");

/* ======================== Feed tab (guides & drivers) ===================== */
function PostTab({ user, posts, onAdd, eng, onOpenProfile }) {
  const me = user.talentId;
  const t = talentById(me) || { id: me, name: user.name || "You", initials: user.initials || "?" };
  const visible = posts.filter((p) => p.status === "approved" || p.talentId === me);
  return (
    <div className="px-5 py-4">
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
                      <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{mine ? "You" : (author?.name || "Member")}</span>
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
function JobsInbox({ user, jobs, onSet }) {
  const mine = jobs.filter((j) => !j.deletedAt && j.toTalentId === user.talentId);
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
  return <button onClick={onClick} className="tap shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium" style={{ background: on ? C.pine : C.card, border: `1px solid ${on ? C.pine : C.line}`, color: on ? "#fff" : C.ink }}>{children}</button>;
}

function TalentCard({ t, onOpen }) {
  return (
    <button onClick={onOpen} className="tap w-full text-left rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-3.5">
        <Avatar initials={t.initials} size={48} />
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
                    <Avatar initials={t.initials} size={38} />
                    <div>
                      <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{t.name}</div>
                      <div className="text-[12px]" style={{ color: C.muted }}>{roleLabel(t.role)} · {t.base}</div>
                    </div>
                  </button>
                  <StatusBadge status={j.status} />
                </div>
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
                    <div className="flex items-center gap-1.5"><span className="text-[15px] font-semibold" style={{ color: C.ink }}>{t?.name || "Member"}</span>{t?.verified && <BadgeCheck size={15} color={C.pine} />}</div>
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}><MapPin size={11} /> {t?.base || ""} · {relTime(p.createdAt)}</div>
                  </div>
                  </button>
                  {admin && p.status !== "approved" && <StatusBadge status={p.status} reason={p.reason} />}
                  {admin && <DeletePost onConfirm={() => onDelete(p.id)} />}
                </div>
                {p.text && <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.ink }}>{p.text}</p>}
                {p.location && p.media && p.media.kind === "photo" ? (
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
function TalentProfile({ talent, posts, canRequest, self, contactOnly, eng, onRequest, onMessage, onSetAvailability, onOpenProfile, onBack, onProfileSaved }) {
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
              <div className="rounded-2xl flex items-center justify-center" style={{ width: 72, height: 72, background: C.pine, border: `3px solid ${C.bg}`,
                boxShadow: myStories.length ? `0 0 0 3px ${C.gold}` : "none" }}>
                <span className="text-[22px] font-semibold" style={{ color: C.goldSoft }}>{t.initials}</span>
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
        {self && t.role !== "operator" && <AvailabilityEditor talent={t} onSet={onSetAvailability} />}
        {self && t.role !== "operator" && <ProfileSetupCard talent={t} onSaved={onProfileSaved} />}

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
                <div className="px-4 py-4 text-[13px]" style={{ color: C.muted }}>No contact details added yet.</div>
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
          <div><div className="text-[15px] font-semibold" style={{ color: C.ink }}>{talent.name}</div><div className="text-[13px]" style={{ color: C.muted }}>{roleLabel(talent.role)} · {talent.base}</div></div>
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

function TripsTab({ user, trips, actions }) {
  const [openId, setOpenId] = useState(null);
  const [view, setView] = useState("upcoming");
  const meId = user.talentId || user.id;
  const mine = (trips || []).filter((tr) => tr && ((tr.members || []).some((m) => m && m.id === meId) || tr.operatorId === meId));
  const open = mine.find((tr) => tr.id === openId);
  if (open) return <TripHub user={user} meId={meId} trip={open} actions={actions} onBack={() => setOpenId(null)} />;

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

function TripHub({ user, meId, trip, actions, onBack }) {
  const state = tripStateNow(trip);
  const [inviting, setInviting] = useState(false);
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
        {isTalent
          ? <CrewBrief trip={trip} user={user} />
          : <TripEssentials trip={trip} canEdit actions={actions} />}
        {!isTalent && <GuestRoster trip={trip} canEdit actions={actions} />}

        {canInvite && (
          <button onClick={() => setInviting(true)}
            className="tap w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left"
            style={{ background: C.pineSoft, border: `1px solid ${C.pine}33` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
              <Star size={18} color={C.goldSoft} fill={C.goldSoft} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ color: C.pine }}>Ask a guest for a review</div>
              <div className="text-[13px] mt-0.5" style={{ color: C.pine, opacity: .8 }}>
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
              <div className="text-[14px] font-semibold" style={{ color: C.goldText }}>Get a review for this trip</div>
              <div className="text-[13px] mt-0.5 leading-snug" style={{ color: C.goldText, opacity: .85 }}>
                Ask {trip.operator || "your operator"} to send your guests a review link.
              </div>
            </div>
            <ChevronLeft size={17} color={C.goldText} style={{ transform: "rotate(180deg)" }} />
          </button>
        )}

        {inviting && <ReviewInvite user={user} trip={trip} onClose={() => setInviting(false)} />}
        {askingOperator && <OperatorInvite user={user} trip={trip} onClose={() => setAskingOperator(false)} />}

        <SectionLabel>Crew</SectionLabel>
        <div className="rounded-2xl divide-y mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
          {(trip.members || []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar initials={m.initials} size={36} />
              <div className="flex-1"><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{m.name}</div>
                <div className="text-[12px] capitalize" style={{ color: C.muted }}>{String(m.roleInTrip || "crew").replace("_", " ")}</div></div>
              {m.id === meId && <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: C.goldSoft, color: C.goldText }}>You</span>}
            </div>
          ))}
        </div>

        {!isTalent && <CrewInvites trip={trip} actions={actions} />}

        {!isTalent && (
          <div className="mb-5">
            <ItineraryBuilder trip={trip} canEdit onChanged={actions.reloadTrips} />
          </div>
        )}

        <SectionLabel>Group chat</SectionLabel>
        <div className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}><MessageSquare size={17} color={C.goldSoft} /></div>
          <div className="flex-1 text-[14px]" style={{ color: C.muted }}>Crew chat for this trip lives in <b style={{ color: C.ink }}>Messages</b>.</div>
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
    applied: { bg: C.goldSoft, fg: C.goldText, label: "Applied" },
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
  const open = listings.filter((l) => !l.deletedAt && l.status === "open" && l.role === user.kind);
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
  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{listing.title}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{fmtDate(listing.start)} – {fmtDate(listing.end)} · {listing.applicants.length} applicant{listing.applicants.length === 1 ? "" : "s"}</div></div>
      </div>

      <div className="px-5 py-4">
        {listing.applicants.length === 0 ? (
          <Empty Icon={Briefcase} title="No applicants yet" body="Guides and drivers who match will see this job and can apply." />
        ) : (
          <div className="space-y-3">
            {(listing.applicants || []).map((a) => (
              <div key={a.talentId} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <Avatar initials={a.initials} size={44} />
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
        <div className="mb-4"><Segmented value={role} onChange={setRole} options={[["guide", "Guide"], ["driver", "Driver"]]} /></div>

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
              <Avatar initials={actorInitials(c.author_id)} size={28} />
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
            <div className="text-[12px]" style={{ color: C.muted }}>{author?.name || "Member"} · {items.length}</div>
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
        <Avatar initials={author?.initials || "?"} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold" style={{ color: C.ink }}>{author?.name || "Member"}</span>
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
    window.open(data.signedUrl, "_blank");
  };

  const list = (rows || []).filter((r) => {
    if (filter === "submitted" && r.license_status !== "submitted") return false;
    if (filter === "verified" && r.license_status !== "verified") return false;
    if (["guide", "driver", "operator"].includes(filter) && r.role !== filter) return false;
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
                  <Avatar initials={initialsOf(u.full_name)} size={42} />
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
const LICENSE_LABEL = { guide: "Guide license (Department of Tourism)", driver: "Driving licence (RSTA)", operator: "Tour Operator licence (Department of Tourism)" };

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
  const [step, setStep] = useState(signin ? "auth" : (invite && (invite.role === "guide" || invite.role === "driver") ? "about" : "role"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [uid, setUid] = useState(session?.user?.id || null);
  const [role, setRole] = useState(invite && (invite.role === "guide" || invite.role === "driver") ? invite.role : null);
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
      full_name: name.trim(), phone: phone.trim() || null, base: base.trim() || null,
      company_name: role === "operator" ? (company.trim() || name.trim()) : null,
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
          <OLabel>{role === "operator" ? "Your name" : "Full name"}</OLabel>
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
          {role !== "operator" && (<><OLabel>Home base</OLabel><OInput value={base} onChange={(e) => setBase(e.target.value)} placeholder="Paro" /></>)}
          <OCta disabled={name.trim().length < 2} onClick={() => (effUid ? finish(null) : setStep("email"))}>Continue</OCta>
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

  const openTrip = myTrips.find((t) => t.id === tripId);
  if (openTrip) return <TripChatView user={user} meId={me} trip={openTrip} actions={actions} onBack={() => setTripId(null)} />;
  if (withId) return <DmThread me={me} otherId={withId} dm={dm} posts={posts} onOpenPost={onOpenPost} onBack={() => setWithId(null)} onOpenProfile={onOpenProfile} />;
  if (find) return <PickContact me={me} dirTick={dirTick} onPick={(id) => { setFind(false); setWithId(id); }} onBack={() => setFind(false)} />;

  return (
    <div className="px-5 py-4">
      {/* TRIP CHANNELS */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Trip channels</div>
        <span className="text-[12px]" style={{ color: C.muted }}>{myTrips.length}</span>
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
                  <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{tr.title}</div>
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
        <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Direct messages</div>
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
                <Avatar initials={p?.initials || "?"} size={40} />
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
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}` }}><ChevronLeft size={19} color={C.ink} /></button>
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
                <Avatar initials={m.initials} size={32} />
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
                <Avatar initials={p.initials} size={42} />
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
          <Avatar initials={p?.initials || "?"} size={36} />
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
      <Avatar initials={p.initials} size={40} />
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
                  <Avatar initials={p.initials} size={42} />
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
  const map = {
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
          <Avatar initials={author?.initials || "?"} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white">{author?.name || "Member"}</div>
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
function AlertsSheet({ items, onClose, onOpenProfile, onOpenMessages, onOpenJobs, onOpenTrips, onOpenSelf, notifyOn, onEnableNotify, installed, onInstall, onOpenUsers}) {
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
  };

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
          {!notifyOn && (isIOS() && !installed ? (
            <button onClick={onInstall} className="tap w-full rounded-xl px-3.5 py-2.5 mt-3 flex items-center gap-2.5 text-left" style={{ background: C.goldSoft }}>
              <Smartphone size={16} color={C.gold} className="shrink-0" />
              <span className="text-[13px] leading-snug" style={{ color: C.goldText }}>
                <b>Add to Home Screen first</b> — on iPhone, alerts only work once the app is installed. Tap to see how.
              </span>
            </button>
          ) : (
            <button onClick={onEnableNotify} className="tap w-full rounded-xl px-3.5 py-2.5 mt-3 flex items-center gap-2.5 text-left" style={{ background: C.goldSoft }}>
              <Bell size={16} color={C.gold} className="shrink-0" />
              <span className="text-[13px] leading-snug" style={{ color: C.goldText }}>
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
                  <div className="text-[12px] font-semibold tracking-[.12em] uppercase mt-3 mb-1" style={{ color: C.goldText }}>{label}</div>
                  {group.map((a) => {
                    const m = meta[a.kind] || meta.message;
                    const p = m.self ? null : talentById(a.who);
                    const go = () => {
                      if (a.kind === "message" || a.kind === "share" || a.kind === "official") return onOpenMessages();
                      if (a.kind === "job" || a.kind === "listing" || a.kind === "applicant") return onOpenJobs();
                      if (a.kind === "tripSoon" || a.kind === "askReview" || a.kind === "crewRequest") return onOpenTrips && onOpenTrips();
                      if (a.kind === "creditRequest") return onOpenUsers && onOpenUsers();
                      if (m.self) return onOpenSelf && onOpenSelf();
                      if (p) return onOpenProfile(a.who);
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
                              <Avatar initials={p?.initials || "?"} size={42} />
                              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: m.bg, border: `2px solid ${C.card}` }}>
                                <m.Icon size={10} color={m.fg} />
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] leading-snug" style={{ color: C.ink }}>
                            {m.self ? (
                              <b style={{ color: m.fg }}>{m.verb}</b>
                            ) : (
                              <><b>{p?.name || "Someone"}</b> <span style={{ color: C.muted }}>{m.verb}</span></>
                            )}
                            {a.urgent && <span className="ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: C.maroonSoft, color: C.maroon }}>ACTION NEEDED</span>}
                          </div>
                          {a.text && a.kind !== "follow" && <div className="text-[13px] truncate mt-0.5" style={{ color: C.muted }}>{a.text}</div>}
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

  const steps = user.kind === "admin" ? ADMIN_STEPS : talent ? TALENT_STEPS : OPERATOR_STEPS;

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
/* ========================================================================== */
function GuestReview({ token }) {
  const [state, setState] = useState("loading");   // loading | form | done | invalid | used | expired
  const [info, setInfo] = useState(null);          // the token row
  const [talent, setTalent] = useState(null);
  const [rating, setRating] = useState(0);
  const [knowledge, setKnowledge] = useState(0);
  const [care, setCare] = useState(0);
  const [comms, setComms] = useState(0);
  const [body, setBody] = useState("");
  const [country, setCountry] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!CLOUD) { setState("invalid"); return; }
      const { data, error } = await supabase
        .from("review_tokens").select("*").eq("token", token).maybeSingle();
      if (!on) return;
      if (error || !data) { setState("invalid"); return; }
      if (data.used_at) { setState("used"); return; }
      if (new Date(data.expires_at) < new Date()) { setState("expired"); return; }
      setInfo(data);
      const { data: prof } = await supabase
        .from("profiles").select("*").eq("id", data.talent_id).maybeSingle();
      if (!on) return;
      if (prof) setTalent(profileToTalent(prof));
      setState("form");
    })();
    return () => { on = false; };
  }, [token]);

  const submit = async () => {
    if (!rating) { setErr("Please choose an overall rating."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("guest_reviews").insert({
      token,
      talent_id: info.talent_id,
      trip_id: info.trip_id || null,
      guest_name: info.guest_name || null,
      guest_country: country.trim() || null,
      rating,
      knowledge: knowledge || null,
      care: care || null,
      communication: comms || null,
      body: body.trim() || null,
      trip_label: info.trip_label || null,
    });
    if (error) {
      setBusy(false);
      setErr("We couldn't save your review. The link may already have been used.");
      return;
    }
    // consume the token so the link cannot be reused
    await supabase.from("review_tokens").update({ used_at: new Date().toISOString() }).eq("token", token);
    setBusy(false);
    setState("done");
  };

  const ReviewPage = ({ children }) => (
    <div className="flex-1 overflow-y-auto hidescroll px-6 py-8" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center gap-2.5 mb-7">
        <BrandMark size={40} />
        <div>
          <div className="text-[16px] font-semibold leading-none" style={{ color: C.ink }}>Bhutan Tourism Hub</div>
          <div className="text-[10px] font-semibold tracking-[.14em] uppercase mt-1" style={{ color: C.goldText }}>Verified guest review</div>
        </div>
      </div>
      {children}
    </div>
  );

  const Message = ({ Icon, title, body: b, tone }) => (
    <ReviewPage>
      <div className="rounded-2xl p-6 text-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: tone === "good" ? C.pineSoft : C.goldSoft }}>
          <Icon size={26} color={tone === "good" ? C.pine : C.gold} />
        </div>
        <div className="text-[17px] font-semibold" style={{ color: C.ink }}>{title}</div>
        <p className="text-[14px] leading-relaxed mt-2" style={{ color: C.muted }}>{b}</p>
      </div>
    </ReviewPage>
  );

  if (state === "loading") return (
    <ReviewPage><div className="flex items-center justify-center gap-2 py-16 text-[14px]" style={{ color: C.muted }}>
      <Loader2 size={18} className="animate-spin" /> Opening your review…
    </div></ReviewPage>
  );

  if (state === "invalid") return <Message Icon={ShieldAlert} title="This link isn't valid"
    body="Please check the link in your email, or ask your tour operator to send a new one." />;

  if (state === "used") return <Message Icon={CheckCheck} title="This review is already submitted"
    body="Thank you — each link can only be used once. If you meant to write another review, ask your operator for a new link." tone="good" />;

  if (state === "expired") return <Message Icon={Clock} title="This link has expired"
    body="Review links stay open for 14 days. Ask your tour operator to send a new one and we'll be glad to hear from you." />;

  if (state === "done") return <Message Icon={Check} title="Thank you"
    body={`Your review of ${talent?.name || "your guide"} is published. It becomes part of their professional record and helps other travellers choose well.`} tone="good" />;

  const BigStars = ({ value, onChange }) => (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} className="tap" aria-label={`${n} out of 5`}>
          <Star size={44} strokeWidth={1.4}
            color={n <= value ? C.gold : C.line}
            fill={n <= value ? C.gold : "transparent"}
            style={{ transition: "transform .12s", transform: n === value ? "scale(1.08)" : "none" }} />
        </button>
      ))}
    </div>
  );

  const SmallStars = ({ label, hint, value, onChange }) => (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium" style={{ color: C.ink }}>{label}</div>
        <div className="text-[12px]" style={{ color: C.muted }}>{hint}</div>
      </div>
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} className="tap" aria-label={`${label} ${n} of 5`}>
            <Star size={20} strokeWidth={1.6}
              color={n <= value ? C.gold : C.line} fill={n <= value ? C.gold : "transparent"} />
          </button>
        ))}
      </div>
    </div>
  );

  const wordFor = [null, "Poor", "Fair", "Good", "Great", "Excellent"][rating] || "";

  return (
    <ReviewPage>
      {/* who you are reviewing */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3"><Avatar initials={talent?.initials || "?"} size={64} /></div>
        <div className="text-[22px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>{talent?.name || "Your guide"}</div>
        <div className="text-[14px] mt-0.5" style={{ color: C.muted }}>
          {talent ? roleLabel(talent.role) : ""}{talent?.base ? ` · ${talent.base}` : ""}
        </div>
        {info?.trip_label && (
          <div className="inline-block mt-2.5 text-[13px] rounded-full px-3 py-1"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>
            {info.trip_label}
          </div>
        )}
      </div>

      {/* step 1 — the only thing required */}
      <div className="rounded-2xl p-5 text-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-[17px] font-semibold mb-1" style={{ color: C.ink }}>
          {info?.guest_name ? `${String(info.guest_name).split(" ")[0]}, how` : "How"} was your trip?
        </div>
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>Tap a star to begin</p>
        <BigStars value={rating} onChange={setRating} />
        <div className="text-[14px] font-semibold mt-3" style={{ color: rating ? C.gold : "transparent" }}>
          {wordFor || "\u00a0"}
        </div>
      </div>

      {/* everything else appears only after they've rated */}
      {rating > 0 && (
        <div className="fade mt-5">
          <div className="text-[15px] font-semibold mb-1" style={{ color: C.ink }}>Tell them why</div>
          <p className="text-[13px] mb-2" style={{ color: C.muted }}>
            A sentence or two is plenty. What did they do well? What will you remember?
          </p>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={600}
            placeholder="e.g. Karma knew every trail on the way to Tiger's Nest and made sure my mother could take it at her own pace."
            className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          <div className="flex justify-end mt-1 mb-4">
            <span className="text-[11px]" style={{ color: C.muted }}>{body.length}/600</span>
          </div>

          {/* optional detail — collapsed by default so the form stays short */}
          <button onClick={() => setShowDetail((v) => !v)}
            className="tap w-full flex items-center justify-between rounded-xl px-4 py-3 mb-1"
            style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span className="text-[14px] font-medium" style={{ color: C.ink }}>Rate a few details (optional)</span>
            <ChevronLeft size={17} color={C.muted} style={{ transform: showDetail ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform .2s" }} />
          </button>
          {showDetail && (
            <div className="rounded-xl px-4 py-1 mb-4 fade" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <SmallStars label="Knowledge" hint="Culture, history, nature" value={knowledge} onChange={setKnowledge} />
              <div style={{ height: 1, background: C.lineSoft }} />
              <SmallStars label="Care" hint="Looking after your group" value={care} onChange={setCare} />
              <div style={{ height: 1, background: C.lineSoft }} />
              <SmallStars label="Communication" hint="Clear and easy to follow" value={comms} onChange={setComms} />
            </div>
          )}

          <div className="text-[14px] font-medium mb-1.5 mt-4" style={{ color: C.ink }}>
            Where are you visiting from? <span style={{ color: C.muted }}>optional</span>
          </div>
          <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={40}
            placeholder="e.g. Australia"
            className="w-full h-12 px-3.5 rounded-xl text-[15px] mb-5"
            style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />

          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}

          <button onClick={submit} disabled={busy}
            className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16px] font-semibold"
            style={{ height: 54, background: C.pine, color: "#fff", boxShadow: `0 8px 20px ${C.pine}33` }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : "Send my review"}
          </button>

          <p className="text-[12px] text-center leading-snug mt-3.5" style={{ color: C.muted }}>
            Your review is published on {talent?.name ? String(talent.name).split(" ")[0] + "'s" : "their"} profile
            and stays part of their professional record. Please be honest — that is what makes it worth something.
          </p>
        </div>
      )}
    </ReviewPage>
  );
}

/* ========================================================================== */
/*  INVITE A GUEST TO REVIEW                                                  */
/*  Only operators and admins can issue an invite — a guide inviting their     */
/*  own reviews would make the whole rating system worthless. Enforced in the  */
/*  database too (issuer_is_not_subject + a role check on the insert policy).  */
/* ========================================================================== */
function ReviewInvite({ user, trip, onClose }) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
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
  const [subject, setSubject] = useState(crew[0]?.id || "");

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
    if (!/\S+@\S+\.\S+/.test(guestEmail)) { setErr("Enter the guest's email — it records who the review came from."); return; }
    if (issued.length >= MAX_PER_TRIP) { setErr(`Up to ${MAX_PER_TRIP} guests per trip.`); return; }

    setBusy(true); setErr(null);
    const token = makeReviewToken();
    const { error } = await supabase.from("review_tokens").insert({
      token,
      talent_id: subject,
      trip_id: trip.id,
      trip_label: trip.title,
      guest_name: guestName.trim() || null,
      guest_email: guestEmail.trim(),
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

Would you leave a short review for ${subjectName}? It becomes part of their verified record on Bhutan Tourism Hub, and it genuinely helps them.

It takes about a minute:

${made}`;

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

  const subjectName = (trip.members || []).find((m) => m.id === subject)?.name || "the guide";

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
              <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Review is for</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {crew.map((m) => (
                  <Chip key={m.id} on={subject === m.id} onClick={() => setSubject(m.id)}>{m.name}</Chip>
                ))}
              </div>

              <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Guest name</div>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={60}
                placeholder="e.g. Sarah Whitfield"
                className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-3" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

              <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Guest email</div>
              <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} inputMode="email" autoCapitalize="none"
                placeholder="guest@email.com"
                className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-1.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              <p className="text-[12px] mb-4" style={{ color: C.muted }}>
                Kept private, never shown on the review. It exists so a disputed review can be traced.
              </p>

              <div className="text-[13px] font-medium mb-1.5" style={{ color: C.ink }}>Guest WhatsApp number <span style={{ color: C.muted }}>· optional</span></div>
              <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} inputMode="tel"
                placeholder="+61 4XX XXX XXX — with country code"
                className="w-full h-11 px-3.5 rounded-xl text-[14px] mb-1.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
              <p className="text-[12px] mb-4" style={{ color: C.muted }}>
                Add it and WhatsApp opens straight to their chat. Leave it blank and you'll choose the contact in WhatsApp.
              </p>

              {err && <p className="text-[13px] mb-2.5" style={{ color: C.maroon }}>{err}</p>}

              {made ? (
                <div className="rounded-2xl p-4 mb-4" style={{ background: C.pineSoft }}>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: C.pine }}>Link ready</div>
                  <p className="text-[12px] mb-2.5" style={{ color: C.pine, opacity: .85 }}>
                    Works once, expires in 14 days. Best shared with the guest in person on the last day.
                  </p>
                  <div className="rounded-lg px-3 py-2 mb-2.5 break-all text-[12px] font-mono" style={{ background: C.card, color: C.ink }}>{made}</div>
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
                  <button onClick={() => setMade(null)} className="tap w-full h-9 rounded-lg text-[13px] font-medium mt-2" style={{ color: C.pine }}>
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
              <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>
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
                      <span className="text-[12px] shrink-0" style={{ color: C.muted }}>
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
                style={{ background: r.issuer_role === "admin" ? C.goldSoft : C.pineSoft,
                         color: r.issuer_role === "admin" ? C.goldText : C.pine }}>
                <ShieldCheck size={10} />
                {r.issuer_role === "admin" ? "Verified by Bhutan Tourism Hub" : "Invited by the tour operator"}
              </span>
              <span className="text-[11px]" style={{ color: C.muted }}>{relTime(new Date(r.created_at).getTime())}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[12px] text-center mt-4 leading-snug" style={{ color: C.muted }}>
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
            <Avatar initials={initialsOf(user.full_name)} size={42} />
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
function ItineraryBuilder({ trip, canEdit, onChanged }) {
  const [days, setDays] = useState(trip.itinerary || []);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => { setDays(trip.itinerary || []); }, [trip.itinerary]);

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
    if (error) { console.error("itinerary insert failed:", error.message); return; }
    setTitle(""); setAdding(false);
    onChanged && onChanged();
  };

  const saveEdit = async (dayNo) => {
    const t = editText.trim();
    if (!t) return;
    setBusy(true);
    const { error } = await supabase.from("trip_itinerary")
      .update({ title: t }).eq("trip_id", trip.id).eq("day_no", dayNo);
    setBusy(false);
    if (error) { console.error("itinerary update failed:", error.message); return; }
    setEditId(null);
    onChanged && onChanged();
  };

  const remove = async (dayNo) => {
    setBusy(true);
    const { error } = await supabase.from("trip_itinerary")
      .delete().eq("trip_id", trip.id).eq("day_no", dayNo);
    setBusy(false);
    if (error) { console.error("itinerary delete failed:", error.message); return; }
    onChanged && onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Itinerary</div>
        {nights && <span className="text-[12px]" style={{ color: C.muted }}>{days.length}/{nights} days planned</span>}
      </div>

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

      {days.length > 0 && (
        <div className="space-y-2 mb-3">
          {days.map((it) => (
            <div key={it.day} className="rounded-xl px-3.5 py-3 flex items-start gap-3"
              style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}>
                <span className="text-[12px] font-bold" style={{ color: C.goldSoft }}>{it.day}</span>
              </div>
              {editId === it.day ? (
                <div className="flex-1">
                  <input value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={120}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(it.day)}
                    className="w-full h-10 px-3 rounded-lg text-[14px] mb-2"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} autoFocus />
                  <div className="flex gap-2">
                    <button onClick={() => setEditId(null)} className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold"
                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>Cancel</button>
                    <button onClick={() => saveEdit(it.day)} disabled={busy}
                      className="tap flex-1 h-9 rounded-lg text-[13px] font-semibold" style={{ background: C.pine, color: "#fff" }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-[14px] leading-snug" style={{ color: C.ink }}>{it.title}</span>
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
          ))}
        </div>
      )}

      {canEdit && (adding ? (
        <div className="rounded-xl p-3.5 fade" style={{ background: C.card, border: `1px solid ${C.pine}` }}>
          <div className="text-[13px] font-medium mb-2" style={{ color: C.ink }}>
            Day {(days.length ? Math.max(...days.map((d) => d.day || 0)) : 0) + 1}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="e.g. Paro → Thimphu, Buddha Dordenma, evening at Tashichho Dzong"
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
function BookingsTab({ user, enquiries, trips, actions, onOpenProfile }) {
  const [stage, setStage] = useState("enquiries");
  const [editing, setEditing] = useState(null);
  const [openTripId, setOpenTripId] = useState(null);
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
    return <TripHub user={user} meId={meId} trip={openTrip} actions={actions} onBack={() => setOpenTripId(null)} />;
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
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldText }}>Bookings</div>
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
    hint: "Applied through the Department of Tourism. Needs every guest's passport." },
  { key: "sdfStatus",     col: "sdf_status",     label: "SDF paid",
    hint: "Sustainable Development Fee — per guest, per night." },
  { key: "permitsStatus", col: "permits_status", label: "Route permits",
    hint: "Needed for restricted areas. Allow several days." },
  { key: "hotelsStatus",  col: "hotels_status",  label: "Hotels booked",
    hint: "Every night of the trip confirmed." },
];

function TripEssentials({ trip, canEdit, actions }) {
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
      {urgent && (
        <div className="rounded-xl px-3.5 py-3 mb-3 flex gap-2.5" style={{ background: C.maroonSoft }}>
          <ShieldAlert size={16} color={C.maroon} className="shrink-0 mt-0.5" />
          <p className="text-[13px] leading-snug" style={{ color: C.maroon }}>
            Departs in {daysOut} {daysOut === 1 ? "day" : "days"} and {notReady.length}{" "}
            {notReady.length === 1 ? "item isn't" : "items aren't"} ready: {notReady.map((c) => c.label).join(", ")}.
          </p>
        </div>
      )}

      {/* arrival / departure */}
      <div className="rounded-2xl overflow-hidden mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
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
      </div>

      {/* the checklist */}
      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Before departure</span>
          {canEdit && <span className="text-[12px] ml-2" style={{ color: C.muted }}>tap to change</span>}
        </div>
        {CHECKLIST.map((item, i) => {
          const st = READY_STATES[trip[item.key] || "not_started"] || READY_STATES.not_started;
          return (
            <button key={item.key} onClick={() => cycle(item)} disabled={!canEdit}
              className="tap w-full text-left px-4 py-3 flex items-start gap-3"
              style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
              <span className="rounded-full shrink-0 mt-1.5" style={{ width: 9, height: 9, background: st.dot }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium" style={{ color: C.ink }}>{item.label}</div>
                <div className="text-[12px] leading-snug mt-0.5" style={{ color: C.muted }}>{item.hint}</div>
              </div>
              <span className="text-[11px] font-semibold rounded-full px-2 py-1 shrink-0"
                style={{ background: st.bg, color: st.fg }}>{st.label}</span>
            </button>
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
      </div>
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
          {/* 1. things that must not be got wrong */}
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

          {/* 2. where to be, when */}
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

          {/* 3. check the flight */}
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

          {/* 4. the plan */}
          {(trip.itinerary || []).length > 0 && (
            <>
              <div className="text-[12px] font-semibold tracking-[.12em] uppercase mb-2" style={{ color: C.goldText }}>
                The plan · {(trip.itinerary || []).length} days
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

          {/* 5. who to call if something goes wrong */}
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

function DkRouteMap({ plan }) {
  const pts = [];
  for (const d of plan.days) for (const p of d.pts || []) {
    const last = pts[pts.length - 1];
    if (!last || last.lat !== p.lat || last.lng !== p.lng) pts.push(p);
  }
  const stops = [];
  const seen = new Set();
  for (const d of plan.days) {
    if (d.night && !seen.has(d.night)) { seen.add(d.night); stops.push({ key: d.night, n: stops.length + 1 }); }
  }
  const line = pts.map((p) => `${btPctX(p.lng).toFixed(2)},${btPctY(p.lat).toFixed(2)}`).join(" ");
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.card }}>
        <img src={mapImg} alt="Map of Bhutan with the planned route drawn on it" className="w-full block" draggable="false" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <polyline points={line} fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.85" />
          <polyline points={line} fill="none" stroke={C.maroon} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {stops.map((s) => {
          const t = DK_TOWNS[s.key];
          return (
            <div key={s.key} className="absolute" style={{ left: `${btPctX(t.lng)}%`, top: `${btPctY(t.lat)}%`, transform: "translate(-50%, -50%)" }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: C.pine, color: "#FFFFFF", border: "2px solid #FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }}>{s.n}</div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {stops.map((s) => (
          <span key={s.key} className="text-[12px]" style={{ color: C.muted }}>
            <b style={{ color: C.pine }}>{s.n}</b> {DK_TOWNS[s.key].n}
          </span>
        ))}
      </div>
    </div>
  );
}

function DrukpahEngine({ user, trips, actions, onApplied, presetTemplateId }) {
  const topRef = useRef(null);
  const [f, setF] = useState({ nights: 7, exit: "paro", adults: 2, seniors: 0, kids: 0, under6: 0,
                               pace: "standard", culture: true, nature: true, hotel: "3", month: 0 });
  const [plan, setPlan] = useState(null);
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

          <DkRouteMap plan={plan} />

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
              <div key={d.day} className="rounded-xl px-3.5 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine }}>
                    <span className="text-[12px] font-bold" style={{ color: C.goldSoft }}>{d.day}</span>
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
    tags: t.tags || [], langs: t.languages || [], vehicle: t.vehicle || "",
  });
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
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

  const save = async () => {
    if (!CLOUD || !t.id) return;
    setBusy(true); setErr(null);
    try {
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
      // a new photo, or a changed number on a verified licence, goes back to our team to check
      if (licensePath) { patch.license_path = licensePath; patch.license_status = "submitted"; }
      else if (number !== (t.licenseNumber || null) && t.licenseStatus === "verified") patch.license_status = "submitted";
      let res = await supabase.from("profiles").update(patch).eq("id", t.id);
      if (res.error && patch.license_status) {
        // if the database reserves the status for admins, save everything else
        const { license_status, ...rest } = patch;
        res = await supabase.from("profiles").update(rest).eq("id", t.id);
      }
      if (res.error) throw new Error(res.error.message);
      setBusy(false);
      onSaved && onSaved();
      onClose();
    } catch (e) { setBusy(false); setErr(e.message || "Couldn't save. Please try again."); }
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

          <div className="text-[11px] font-semibold tracking-[.14em] uppercase mb-2" style={{ color: C.goldText }}>Languages</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {ONB_LANGS.map((l) => <Chip key={l} on={f.langs.includes(l)} onClick={() => toggle("langs", l)}>{l}</Chip>)}
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
                        <Avatar initials={p.initials} size={36} />
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
                <Avatar initials={initialsOf(i.name)} size={34} />
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
  const out = { note: "", account: "", free: 10, aiOn: false };
  if (!CLOUD) return out;
  const { data } = await supabase.from("drukpah_settings").select("*");
  for (const r of data || []) {
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
                  ["ai_drafts_enabled", next.aiOn ? "on" : "off"]]
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
              <Avatar initials={p ? p.initials : "?"} size={34} />
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
  const [s, setS] = useState({ note: settings.note, account: settings.account, free: settings.free, aiOn: !!settings.aiOn });
  const field = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink };
  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: C.bg }}>
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
