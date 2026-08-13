import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Compass, Car, Building2, ShieldCheck, ImagePlus, X, Check, Clock, Send,
  BadgeCheck, MapPin, Inbox, ChevronLeft, Star, Phone, Mail, Briefcase,
  Search, LogOut, Newspaper, User, CalendarCheck, MessageCircle,
  Map, MessageSquare, Users, Download, Mic, Video, Heart, Share2, Trash2, Maximize2, Upload, Loader2, ArrowRight,
  Award, UserX, RefreshCw, FileCheck2, ExternalLink, UserPlus, Send as SendIcon, Lock, Eye, EyeOff, CalendarDays, UserCheck, Plus, CheckCheck, Camera, Navigation, Bell,
  ShieldAlert,
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
  id: p.id, role: p.role, name: p.full_name || "Member", base: p.base || "",
  initials: initialsOf(p.full_name || "?"), years: p.years || 0, trips: 0, rating: null,
  verified: p.license_status === "verified", licenseStatus: p.license_status || "none",
  grades: {}, tags: Array.isArray(p.tags) ? p.tags : [],
  languages: Array.isArray(p.languages) ? p.languages : [],
  phone: p.phone || "", email: p.email || "", pitch: p.pitch || "", vehicle: p.vehicle || null,
  availability: p.availability || "open", availableFrom: p.available_from || null, availableNote: p.availability_note || "",
});
const talentById = (id) => TALENT.find((t) => t.id === id) || PROFILE_DIR[id] || null;
const initialsOf = (name) => (String(name || "?").trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("") || "?").toUpperCase();
const isoDay = (offset = 0) => new Date(Date.now() + offset * 86400e3).toISOString().slice(0, 10);
const sysMsg = (text) => ({ id: uid(), senderId: null, kind: "system", body: text, photo: null, ts: Date.now() });

/* ── Cloud (Supabase) ── posts are global when configured; everything falls back to local demo mode when not. */
const CLOUD = Boolean(supabase);
const DEMO_MODE = false;   // set true only for local demos without a database

// wrap a Supabase write so failures are visible in the console instead of silent
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
  media: r.media_url ? { kind: r.media_kind || "photo", dataUri: r.media_url } : null,
  location: r.lat != null ? { lat: r.lat, lng: r.lng, place: r.place, description: r.loc_desc, source: r.loc_source } : null,
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
export default function App() {
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
    const { data } = await supabase.from("profiles").select("*");
    if (data) { PROFILE_DIR = {}; data.forEach((p) => { PROFILE_DIR[p.id] = profileToTalent(p); }); setDirTick((t) => t + 1); }
  };
  const reloadMe = () => { setProfileTick((t) => t + 1); loadProfiles(); };

  /* ---- Stories (24h, then the file itself is deleted) ---- */
  const fetchStories = async () => {
    if (!CLOUD) return;
    const cutoff = new Date(Date.now() - 24 * 3600e3).toISOString();
    const { data } = await supabase.from("stories").select("*").gt("created_at", cutoff).order("created_at", { ascending: true });
    if (data) setStories(data.map((r) => ({
      id: r.id, authorId: r.author_id, kind: r.kind, url: r.media_url, path: r.media_path,
      caption: r.caption || "", ts: new Date(r.created_at).getTime(),
    })));
    // housekeeping: remove anything already expired, files included
    const { data: old } = await supabase.from("stories").select("id, media_path").lte("created_at", cutoff);
    if (old && old.length) {
      const paths = old.map((o) => o.media_path).filter(Boolean);
      if (paths.length) await supabase.storage.from("stories").remove(paths);
      await supabase.from("stories").delete().in("id", old.map((o) => o.id));
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
    const { data } = await supabase.from("follows").select("*");
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
    if (already) await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", targetId);
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
    const { data } = await supabase.from("direct_messages").select("*").order("created_at", { ascending: true });
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
      if (retry.error) console.error("sendDm retry failed:", retry.error.message);
      else console.warn("sendDm: sent without extras — run the column migration");
    }
    fetchDms();
  };
  const sharePostTo = async (recipients, post, note) => {
    for (const to of recipients) {
      await sendDm(to, note?.trim() || "Shared a post", post.id);
    }
  };
  const markRead = async (withId) => {
    const me = realUserRef.current;
    if (!CLOUD || !me) return;
    await supabase.from("direct_messages").update({ read: true }).eq("sender_id", withId).eq("recipient_id", me).eq("read", false);
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
    const up = media ? await uploadPostMedia(talentId, media) : { media_url: null, media_kind: null };
    await supabase.from("posts").insert({
      talent_id: talentId, body: text || null,
      media_url: up.media_url, media_kind: up.media_kind,
      lat: location?.lat ?? null, lng: location?.lng ?? null,
      place: location?.place ?? null, loc_desc: location?.description ?? null, loc_source: location?.source ?? null,
    });
    fetchPosts();
  };
  const approve = async (id) => {
    if (!CLOUD) { setPosts((p) => p.map((x) => (x.id === id ? { ...x, status: "approved", reason: null } : x))); return; }
    await supabase.from("posts").update({ status: "approved", reject_reason: null }).eq("id", id);
    fetchPosts();
  };
  const reject = async (id, reason) => {
    if (!CLOUD) { setPosts((p) => p.map((x) => (x.id === id ? { ...x, status: "rejected", reason } : x))); return; }
    await supabase.from("posts").update({ status: "rejected", reject_reason: reason }).eq("id", id);
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
    if (mine) await supabase.from("post_likes").delete().eq("post_id", postId).eq("liker_id", me);
    else await supabase.from("post_likes").insert({ post_id: postId, liker_id: me });
    fetchEngagement();
  };
  const addComment = async (postId, me, body) => {
    setComments((Cm) => [...Cm, { id: uid(), post_id: postId, author_id: me, body, ts: Date.now() }]);
    if (!CLOUD) return;
    await supabase.from("post_comments").insert({ post_id: postId, author_id: me, body });
    fetchEngagement();
  };
  const deleteComment = async (id) => {
    setComments((Cm) => Cm.filter((c) => c.id !== id));
    if (!CLOUD) return;
    await supabase.from("post_comments").delete().eq("id", id);
  };
  const deletePost = async (id) => {
    setPosts((P) => P.filter((p) => p.id !== id));
    setLikes((L) => L.filter((l) => l.post_id !== id));
    setComments((Cm) => Cm.filter((c) => c.post_id !== id));
    if (!CLOUD) return;
    await supabase.from("posts").delete().eq("id", id);
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
    await supabase.from("job_requests").insert({
      operator_id: realUserRef.current, operator_name: job.operator, talent_id: job.toTalentId,
      title: job.title, role_needed: job.role, start_date: job.start, end_date: job.end,
      languages: job.languages || [], notes: job.notes || null,
    });
    fetchJobs();
  };

  /* ---- Trips in the database ---- */
  const fetchTrips = async () => {
    if (!CLOUD) return;
    const [{ data: T }, { data: M }, { data: MS }, { data: IT }] = await Promise.all([
      supabase.from("trips").select("*").order("start_date", { ascending: true }),
      supabase.from("trip_members").select("*"),
      supabase.from("trip_messages").select("*").order("created_at", { ascending: true }),
      supabase.from("trip_itinerary").select("*").order("day_no", { ascending: true }),
    ]);
    if (!T) return;
    setTrips(T.map((tr) => ({
      id: tr.id, operatorId: tr.operator_id, operator: tr.operator_name, title: tr.title,
      start: tr.start_date, end: tr.end_date, meetingPoint: tr.meeting_point || "To be set by operator",
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
    const { data: found } = await supabase.from("trips").select("id")
      .eq("operator_id", opId).eq("start_date", job.start).eq("end_date", job.end).maybeSingle();
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
      await supabase.from("trip_messages").insert({ trip_id: tripId, sender_id: null, kind: "system", body: "Trip created from a confirmed booking." });
    }
    await supabase.from("trip_members").upsert({
      trip_id: tripId, user_id: job.toTalentId, display_name: t?.name || "Member", role_in_trip: t?.role || "guide",
    });
    await supabase.from("trip_messages").insert({ trip_id: tripId, sender_id: null, kind: "system", body: `${t?.name || "A crew member"} joined the trip.` });
    fetchTrips();
  };

  const createTripFromJob = (job) => {
    if (CLOUD) { createTripCloud(job); return; }
    const t = talentById(job.toTalentId);
    const talentMember = { id: job.toTalentId, name: t.name, initials: t.initials, roleInTrip: t.role };
    setTrips((prev) => {
      const existing = prev.find((tr) => tr.operator === job.operator && tr.start === job.start && tr.end === job.end);
      if (existing) {
        if (existing.members.some((m) => m.id === job.toTalentId)) return prev;
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
    if (CLOUD) { await supabase.from("job_requests").update({ status }).eq("id", id); fetchJobs(); }
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

  const postListing = async (l) => {
    if (!CLOUD) { setListings((L) => [{ id: uid(), status: "open", createdAt: Date.now(), applicants: [], ...l }, ...L]); return; }
    await supabase.from("job_listings").insert({
      operator_id: realUserRef.current, operator_name: l.operator, title: l.title, role: l.role,
      start_date: l.start, end_date: l.end, languages: l.languages || [], notes: l.notes || null, urgent: !!l.urgent,
    });
    fetchJobs();
  };
  const applyToListing = async (listingId, applicant) => {
    if (!CLOUD) {
      setListings((L) => L.map((l) => (l.id === listingId ? (l.applicants.some((a) => a.talentId === applicant.talentId) ? l : { ...l, applicants: [...l.applicants, { status: "applied", appliedAt: Date.now(), ...applicant }] }) : l)));
      return;
    }
    await supabase.from("job_applicants").upsert({ listing_id: listingId, talent_id: applicant.talentId, message: applicant.message || null, status: "applied" });
    fetchJobs();
  };
  const setApplicant = async (listingId, talentId, status) => {
    setListings((L) => L.map((l) => (l.id === listingId ? { ...l, applicants: l.applicants.map((a) => (a.talentId === talentId ? { ...a, status } : a)) } : l)));
    if (!CLOUD) return;
    await supabase.from("job_applicants").update({ status }).eq("listing_id", listingId).eq("talent_id", talentId);
    fetchJobs();
  };
  const hireApplicant = async (listing, applicant) => {
    await setApplicant(listing.id, applicant.talentId, "hired");
    setListings((L) => L.map((l) => (l.id === listing.id ? { ...l, status: "filled" } : l)));
    if (CLOUD) { await supabase.from("job_listings").update({ status: "filled" }).eq("id", listing.id); fetchJobs(); }
    createTripFromJob({ id: `${listing.id}_${applicant.talentId}`, toTalentId: applicant.talentId, operator: listing.operator, title: listing.title, start: listing.start, end: listing.end });
  };

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: C.bg }}>
      <style>{`
        *{ font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        html, body { overscroll-behavior-y: none; }
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
      `}</style>

      <div className="w-full max-w-md flex flex-col" style={{ height: "100vh", color: C.ink }}>
        {!user ? (
          <Login onPick={setAccountId} session={session} myProfile={myProfile} onAuthed={reloadMe} onBusy={setAuthBusy} />
        ) : (
          <Shell key={user.id} user={user} posts={posts} jobs={jobs} trips={trips} listings={listings} dirTick={dirTick}
            actions={{ addPost, approve, reject, deletePost, reloadDirectory: loadProfiles, setAvailability, toggleFollow, sendJob, setJobStatus, postChat, openChat, postListing, applyToListing, setApplicant, hireApplicant }} engagement={{ likes, comments, toggleLike, addComment, deleteComment, follows, toggleFollow, stories, addStory, deleteStory }} dm={{ dms, sendDm, markRead, sharePostTo }} onLogout={() => { if (session) supabase.auth.signOut(); setAccountId(null); }} />
        )}
      </div>
    </div>
  );
}

/* ================================ Welcome ================================= */
function Login({ onPick, session, myProfile, onAuthed, onBusy }) {
  const [authView, setAuthView] = useState(null); // 'signup' | 'signin' | 'complete'
  useEffect(() => { onBusy && onBusy(!!authView); return () => onBusy && onBusy(false); }, [authView]);
  useEffect(() => {
    if (session && myProfile === false && !authView) setAuthView("complete");
  }, [session, myProfile]);
  if (authView) {
    return (
      <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
        <Onboard mode={authView} session={session} onBack={() => { setAuthView(null); onBusy && onBusy(false); }} onDone={() => { onBusy && onBusy(false); setAuthView(null); onAuthed(); }} />
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
      {/* brand row */}
      <div className="px-6 pt-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.pine, boxShadow: `0 6px 14px ${C.pine}33` }}>
          <Compass size={18} color={C.goldSoft} strokeWidth={1.9} />
        </div>
        <span className="leading-none">
          <span className="block text-[17px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>Bhutan Tourism Hub</span>
          <span className="block text-[10px] font-semibold tracking-[.14em] uppercase mt-0.5" style={{ color: C.gold }}>Guides · Drivers · Operators</span>
        </span>
      </div>

      {/* hero — the relief map of Bhutan */}
      <div className="relative w-full mt-4" style={{ aspectRatio: "5 / 2" }}>
        <img src={mapImg} alt="Relief map of Bhutan" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", objectPosition: "center bottom" }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${C.bg} 0%, rgba(244,245,241,0) 24%, rgba(244,245,241,0) 72%, ${C.bg} 100%)` }} />
      </div>

      {/* story */}
      <div className="px-6 -mt-1">
        <div className="text-[11.5px] font-semibold tracking-[.16em] uppercase mb-2.5" style={{ color: C.gold }}>
          Bhutan · Guides · Drivers · Operators
        </div>
        <h1 className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em]" style={{ color: C.ink }}>
          Your work, vouched for.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>
          A living portfolio for Bhutan's licensed guides and drivers — and the
          marketplace where tour operators find, vet and book them.
        </p>

        <div className="mt-6 space-y-3.5">
          <WelcomeBullet Icon={BadgeCheck} title="Verified, not just listed" body="Licenses checked with the Department of Tourism and RSTA." />
          <WelcomeBullet Icon={Star} title="A trip record that travels with you" body="Reliability, punctuality and awareness — graded by operators after every trip." />
          <WelcomeBullet Icon={MapPin} title="Proof of where you've worked" body="Photos pinned to the exact spot on the map of Bhutan." />
          <WelcomeBullet Icon={MessageSquare} title="One hub per trip" body="Crew chat that opens before departure and clears itself after." />
        </div>
      </div>

      {CLOUD && (
        <div className="px-6 mt-8">
          <button onClick={() => setAuthView("signin")} className="tap w-full rounded-2xl flex items-center justify-center gap-2 text-[16px] font-semibold"
            style={{ height: 54, background: C.pine, color: "#fff", boxShadow: `0 8px 20px ${C.pine}38` }}>
            Sign in or create account <ArrowRight size={18} strokeWidth={2.4} />
          </button>
          <p className="text-center text-[12.5px] mt-2.5" style={{ color: C.muted }}>Free for guides, drivers and operators in Bhutan.</p>
        </div>
      )}

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
  guide: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "jobs", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: Map }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  driver: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "jobs", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: Map }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "profile", label: "Profile", Icon: User }],
  operator: [{ id: "discover", label: "Discover", Icon: Search }, { id: "requests", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: Map }, { id: "chats", label: "Messages", Icon: MessageSquare }, { id: "feed", label: "Feed", Icon: Newspaper }],
  admin: [{ id: "review", label: "Review", Icon: ShieldCheck }, { id: "feed", label: "Feed", Icon: Newspaper }, { id: "users", label: "Users", Icon: Users }],
};
const DEFAULT_TAB = { guide: "post", driver: "post", operator: "discover", admin: "review" };

function Shell({ user, posts, jobs, trips, listings, actions, engagement, dm, dirTick, onLogout }) {
  const [tab, setTab] = useState(DEFAULT_TAB[user.kind]);
  const [overlay, setOverlay] = useState(null); // {type:'profile'|'request', talentId}
  const [dmWith, setDmWith] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);

  const nav = NAV[user.kind];
  const actorId = user.talentId || user.id;
  const eng = { ...engagement, me: actorId, isAdmin: user.kind === "admin", sharePostTo: dm?.sharePostTo };

  const alertItems = useMemo(() => {
    const out = [];
    (dm?.dms || []).filter((m) => m.to === actorId && !m.read).forEach((m) =>
      out.push({ id: `dm-${m.id}`, kind: "message", who: m.from, text: m.body, ts: m.ts }));
    (engagement?.likes || []).forEach((l) => {
      const p = posts.find((x) => x.id === l.post_id && x.talentId === actorId);
      if (p && l.liker_id !== actorId) out.push({ id: `like-${l.post_id}-${l.liker_id}`, kind: "like", who: l.liker_id, text: p.text || "your post", ts: p.createdAt });
    });
    (engagement?.comments || []).forEach((c) => {
      const p = posts.find((x) => x.id === c.post_id && x.talentId === actorId);
      if (p && c.author_id !== actorId) out.push({ id: `cm-${c.id}`, kind: "comment", who: c.author_id, text: c.body, ts: c.ts });
    });
    (engagement?.follows || []).filter((f) => f.following === actorId).forEach((f) =>
      out.push({ id: `fl-${f.follower}`, kind: "follow", who: f.follower, text: "started following you", ts: Date.now() }));
    jobs.filter((j) => j.toTalentId === actorId && j.status === "pending").forEach((j) =>
      out.push({ id: `job-${j.id}`, kind: "job", who: j.operatorId, text: j.title, ts: j.createdAt }));
    return out.sort((a, b) => b.ts - a.ts).slice(0, 40);
  }, [dm?.dms, engagement?.likes, engagement?.comments, engagement?.follows, jobs, posts, actorId]);
  const myFollowing = (engagement?.follows || []).filter((f) => f.follower === actorId).map((f) => f.following);
  const unreadDm = (dm?.dms || []).filter((m) => m.to === actorId && !m.read).length;

  const pendingModCount = posts.filter((p) => p.status === "pending").length;
  const myTalent = user.talentId ? talentById(user.talentId) : null;
  const myJobsPending = myTalent ? jobs.filter((j) => j.toTalentId === myTalent.id && j.status === "pending").length : 0;
  const availableListings = myTalent ? listings.filter((l) => l.status === "open" && l.role === user.kind && !l.applicants.some((a) => a.talentId === myTalent.id)).length : 0;
  const jobsBadge = myJobsPending + availableListings;

  const openProfile = (talentId) => setOverlay({ type: "profile", talentId });
  const openRequest = (talentId) => setOverlay({ type: "request", talentId });

  return (
    <>
      <TopBar user={user} onLogout={onLogout} alerts={alertItems.length} onOpenAlerts={() => setAlertsOpen(true)}
        onSearch={(term) => { setOverlay(null); setTab(user.kind === "operator" ? "discover" : "post"); setSearchTerm(term); }} />

      <div className="flex-1 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
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
            {tab === "profile" && <TalentProfile talent={talentById(user.talentId)} posts={posts} eng={eng} self onSetAvailability={actions.setAvailability} onOpenProfile={openProfile} onBack={null} />}
            {tab === "discover" && <Discover onOpen={openProfile} initialQuery={searchTerm} dirTick={dirTick} />}
            {tab === "requests" && <OperatorJobs user={user} jobs={jobs} listings={listings} posts={posts} actions={actions} eng={eng} onOpen={openProfile} />}
            {tab === "feed" && <Feed posts={posts} eng={eng} admin={user.kind === "admin"} onDelete={actions.deletePost} onOpenProfile={openProfile} following={myFollowing} />}
            {tab === "review" && <Review posts={posts} onApprove={actions.approve} onReject={actions.reject} eng={eng} />}
            {tab === "users" && <AdminUsers onChanged={actions.reloadDirectory} />}
          </div>
        )}
      </div>

      {sharedPost && (
        <PostDetail items={[sharedPost]} index={0} author={talentById(sharedPost.talentId)} eng={eng} onClose={() => setSharedPost(null)} />
      )}

      {alertsOpen && (
        <AlertsSheet items={alertItems} onClose={() => setAlertsOpen(false)}
          onOpenProfile={(id) => { setAlertsOpen(false); openProfile(id); }}
          onOpenMessages={() => { setAlertsOpen(false); setTab("chats"); }}
          onOpenJobs={() => { setAlertsOpen(false); setTab(user.kind === "operator" ? "requests" : "jobs"); }} />
      )}

      <BottomNav nav={nav} tab={tab}
        setTab={(t) => { setOverlay(null); setSharedPost(null); setTab(t); }}
        badges={{ jobs: jobsBadge, review: pendingModCount, chats: unreadDm }} />
    </>
  );
}

function TopBar({ user, onLogout, onSearch, alerts, onOpenAlerts }) {
  const [q, setQ] = useState("");
  const submit = () => { const t = q.trim(); if (t && onSearch) onSearch(t); };

  return (
    <div className="shrink-0 h-14 px-2.5 flex items-center gap-2" style={{ background: C.bg, borderBottom: `1px solid ${C.lineSoft}` }}>
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
    <div className="shrink-0 flex" style={{ background: C.card, borderTop: `1px solid ${C.line}`, position: "relative", zIndex: 240 }}>
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
function Avatar({ initials, size = 40 }) {
  return (
    <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: C.pine }}>
      <span className="font-semibold" style={{ color: C.goldSoft, fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}
function relTime(ts) {
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
  const [full, setFull] = useState(false);
  if (!media) return null;
  return (
    <>
      <div className="relative rounded-xl overflow-hidden mt-3" style={{ border: `1px solid ${C.line}`, aspectRatio: "1 / 1", background: media.kind === "video" ? "#0c0e0c" : C.bg }}>
        {media.kind === "video" ? (
          <video src={media.dataUri} controls className="absolute inset-0 w-full h-full" style={{ objectFit: "contain" }} />
        ) : (
          <button onClick={() => setFull(true)} className="absolute inset-0 w-full h-full" aria-label="View photo full size">
            <img src={media.dataUri} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
            <span className="absolute right-2.5 bottom-2.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.45)" }}>
              <Maximize2 size={13} color="#fff" />
            </span>
          </button>
        )}
      </div>
      {full && media.kind !== "video" && <Lightbox src={media.dataUri} onClose={() => setFull(false)} />}
    </>
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
  const [media, setMedia] = useState(null);       // { kind:'photo'|'video', dataUri }
  const [location, setLocation] = useState(null); // { lat, lng, place, description?, source? }
  const [picking, setPicking] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);
  const inputRef = useRef();

  const flash = (m) => { setNote(m); setTimeout(() => setNote(null), 3200); };

  const pick = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) return setError("Upload a photo or a video.");
    if (isImage && f.size > 6 * 1024 * 1024) return setError("That image is over 6 MB — pick a smaller one.");
    if (isVideo && f.size > 25 * 1024 * 1024) return setError("That video is over 25 MB — trim it or pick a shorter clip.");
    setError(null);
    const r = new FileReader();
    r.onload = () => setMedia({ kind: isVideo ? "video" : "photo", dataUri: r.result });
    r.readAsDataURL(f);
    if (isImage) {
      readExifGps(f).then((gps) => {
        if (gps && gps.lat != null) {
          setLocation({ lat: gps.lat, lng: gps.lng, place: nearestPlace(gps.lat, gps.lng), source: "photo" });
          flash("Location read from the photo’s GPS.");
        }
      });
    }
  };

  const post = () => {
    if (!text.trim() && !media) return;
    onAdd({ talentId: talent.id, text: text.trim(), media, location });
    setText(""); setMedia(null); setLocation(null); setPicking(false); setManual(false);
  };
  const canPost = text.trim() || media;
  const chipLabel = location ? (location.source === "viewpoint" ? location.place : (location.place ? `Near ${location.place}` : "Pinned")) : "";

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar initials={talent.initials} size={36} />
        <div><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{talent.name}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>Share a trip highlight</div></div>
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={400} placeholder="What made today's trip special?"
        className="w-full px-3.5 py-3 rounded-xl text-[15px] leading-relaxed resize-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />

      {media && (
        <div className="relative mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {media.kind === "video"
            ? <video src={media.dataUri} controls className="w-full block" style={{ maxHeight: 240 }} />
            : <img src={media.dataUri} alt="" className="w-full block" style={{ maxHeight: 240, objectFit: "cover" }} />}
          <button onClick={() => setMedia(null)} className="tap absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}><X size={16} color="#fff" /></button>
        </div>
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
          {location && location.description && <p className="text-[12.5px] leading-snug mt-2" style={{ color: C.ink }}>{location.description}</p>}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[12.5px]" style={{ color: C.muted }}>{location ? `${location.lat}, ${location.lng}${location.source === "map" ? " · approx." : ""}` : "No pin yet"}</span>
            <button onClick={() => setPicking(false)} className="tap text-[13px] font-semibold rounded-full px-3 py-1.5" style={{ background: C.pine, color: "#fff" }}>Done</button>
          </div>
        </div>
      )}

      {error && <p className="text-[12.5px] mt-2" style={{ color: C.maroon }}>{error}</p>}

      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => inputRef.current?.click()} className="tap inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
          <ImagePlus size={16} /> {media ? "Change" : "Photo / video"}
        </button>
        <input ref={inputRef} type="file" accept="image/*,video/*" onChange={pick} className="hidden" />
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
function Discover({ onOpen, initialQuery, dirTick }) {
  const [q, setQ] = useState(initialQuery || "");
  useEffect(() => { if (initialQuery) setQ(initialQuery); }, [initialQuery]);
  const [role, setRole] = useState("all");
  const [lang, setLang] = useState(null);
  const [onlyFree, setOnlyFree] = useState(false);

  const POOL = useMemo(() => [...TALENT, ...Object.values(PROFILE_DIR).filter((p) => p.role === "guide" || p.role === "driver")], [dirTick]);
  const list = POOL.filter((t) => (role === "all" || t.role === role))
    .filter((t) => (!onlyFree || (t.availability || "open") === "open"))
    .filter((t) => (!lang || t.languages.some((l) => l.n === lang)))
    .filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || t.base.toLowerCase().includes(q.toLowerCase()) || t.tags.join(" ").toLowerCase().includes(q.toLowerCase()))
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
            <span className="text-[15.5px] font-semibold truncate" style={{ color: C.ink }}>{t.name}</span>
            {t.verified && <BadgeCheck size={15} color={C.pine} />}
          </div>
          <div className="flex items-center gap-1 text-[12.5px]" style={{ color: C.muted }}><MapPin size={12} /> {roleLabel(t.role)} · {t.base}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ background: C.goldSoft }}>
            <Star size={12} color={C.gold} fill={C.gold} /><span className="text-[12.5px] font-semibold" style={{ color: "#7a5a1e" }}>{t.rating ? t.rating.toFixed(1) : "New"}</span>
          </div>
          <div className="text-[11.5px] mt-1" style={{ color: C.muted }}>{t.years} yrs</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <AvailabilityChip talent={t} />
        {t.languages.slice(0, 3).map((l) => (
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
        <Empty Icon={Check} title="All clear" body="New posts land here for review." />
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
function TalentProfile({ talent, posts, canRequest, self, contactOnly, eng, onRequest, onMessage, onSetAvailability, onOpenProfile, onBack }) {
  const t = talent;
  const live = posts.filter((p) => p.talentId === t.id && p.status === "approved").length;
  const located = posts.filter((p) => p.talentId === t.id && p.status === "approved" && p.location);
  const gallery = posts.filter((p) => p.talentId === t.id && p.status === "approved" && p.media && p.media.kind === "photo");
  const allFollows = eng?.follows || [];
  const followerCount = allFollows.filter((f) => f.following === t.id).length;
  const followingCount = allFollows.filter((f) => f.follower === t.id).length;
  const iFollow = allFollows.some((f) => f.follower === eng?.me && f.following === t.id);
  const myStories = (eng?.stories || []).filter((st) => st.authorId === t.id);
  const [viewStories, setViewStories] = useState(false);
  const [addStory, setAddStory] = useState(false);
  const [shareToStory, setShareToStory] = useState(null);
  const [listMode, setListMode] = useState(null);
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
                {t.verified && <BadgeCheck size={17} color={C.pine} className="shrink-0 mt-1" />}
              </div>
              <div className="flex items-center gap-1 text-[13.5px] mt-1" style={{ color: C.muted }}><MapPin size={13} /> {roleLabel(t.role)}{t.base ? ` · ${t.base}` : ""}</div>
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
            </div>
          )}
        </div>
      </div>

      <div className="px-5">
        {self && t.role !== "operator" && <AvailabilityEditor talent={t} onSet={onSetAvailability} />}

        <ProfileTabs
          cv={
            <>
              {/* trip record */}
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                <div className="px-4 py-3.5 flex items-center justify-between" style={{ background: C.pine }}>
                  <div><div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldSoft }}>Trip record</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: "#ffffffcc" }}>Graded by operators</div></div>
                  <div className="text-right"><div className="text-[26px] font-semibold leading-none text-white">{t.rating ? t.rating.toFixed(1) : "New"}</div><div className="mt-1 flex justify-end"><Stars score={t.rating || 0} light /></div></div>
                </div>
                <div className="px-4 py-4 space-y-3.5" style={{ background: C.card }}>
                  {Object.keys(t.grades || {}).length === 0 ? (
                    <p className="text-[13.5px]" style={{ color: C.muted }}>No trips graded yet — the record fills in after the first completed trip.</p>
                  ) : Object.entries(t.grades).map(([kk, v]) => (
                    <div key={kk}><div className="flex items-baseline justify-between mb-1.5"><span className="text-[13.5px] font-medium" style={{ color: C.ink }}>{kk}</span><span className="text-[13px] font-semibold" style={{ color: C.pine }}>{v.toFixed(1)}</span></div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.lineSoft }}><div className="h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, background: `linear-gradient(90deg, ${C.gold}, #D9A94E)` }} /></div></div>
                  ))}
                </div>
              </div>

              {t.pitch && <div className="mt-5 pl-4" style={{ borderLeft: `3px solid ${C.gold}` }}><p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{t.pitch}</p></div>}

              {t.tags && t.tags.length > 0 && (
                <div className="mt-6"><SectionLabel>{t.role === "guide" ? "Specialities" : "Drives"}</SectionLabel>
                  <div className="flex flex-wrap gap-2">{t.tags.map((x) => <span key={x} className="rounded-full px-3 py-1.5 text-[13.5px] font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{x}</span>)}</div>
                  {t.vehicle && <div className="mt-2.5 text-[13.5px]" style={{ color: C.muted }}><Car size={14} color={C.gold} className="inline mr-1" /> {t.vehicle}</div>}
                </div>
              )}

              {t.languages && t.languages.length > 0 && (
                <div className="mt-6"><SectionLabel>Languages</SectionLabel>
                  <div className="flex flex-wrap gap-2">{t.languages.map((l) => (
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

        {(canRequest || self || contactOnly) && (
          <div className="mt-6"><SectionLabel>Contact</SectionLabel>
            <div className="rounded-2xl divide-y" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
              <a href={`tel:${t.phone}`} className="flex items-center gap-3 px-4 py-3.5"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.goldSoft }}><Phone size={17} color={C.gold} /></div><span className="text-[14.5px] font-medium" style={{ color: C.ink }}>{t.phone}</span></a>
              <a href={`mailto:${t.email}`} className="flex items-center gap-3 px-4 py-3.5"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.goldSoft }}><Mail size={17} color={C.gold} /></div><span className="text-[14.5px] font-medium truncate" style={{ color: C.ink }}>{t.email}</span></a>
            </div>
          </div>
        )}
      </div>

      {canRequest && !contactOnly && (
        <div className="px-5 mt-6 flex gap-3">
          <button onClick={() => onMessage && onMessage(t.id)} className="tap h-12 px-5 rounded-xl flex items-center justify-center gap-2 text-[14.5px] font-semibold" style={{ background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}><MessageCircle size={18} /> Message</button>
          <button onClick={onRequest} className="tap flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ background: C.pine, color: "#fff", boxShadow: `0 6px 16px ${C.pine}33` }}><Briefcase size={18} /> Send job request</button>
        </div>
      )}
      {self && (
        <div className="px-5 mt-6"><div className="rounded-xl px-4 py-3 text-[13px] text-center" style={{ background: C.goldSoft, color: "#7a5a1e" }}>This is how operators see your profile.</div></div>
      )}

      {viewStories && myStories.length > 0 && (
        <StoryViewer stories={myStories} author={t} canDelete={self} onDelete={eng?.deleteStory} onClose={() => setViewStories(false)} />
      )}
      {addStory && <AddStory onClose={() => setAddStory(false)} onAdd={eng?.addStory} />}
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
          <Send size={18} /> Send request to {talent.name.split(" ")[0]}
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

function TripsTab({ user, trips, actions }) {
  const [openId, setOpenId] = useState(null);
  const meId = user.talentId || user.id;
  const mineId = user.talentId || user.id;
  const mine = trips.filter((tr) => tr.members.some((m) => m.id === mineId) || (tr.operatorId && tr.operatorId === mineId));
  const open = mine.find((tr) => tr.id === openId);
  if (open) return <TripHub user={user} meId={meId} trip={open} actions={actions} onBack={() => setOpenId(null)} />;
  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={`${mine.length}`}>Trips</SectionLabel>
      {mine.length === 0 ? (
        <Empty Icon={Map} title="No trips yet" body="When a job request is accepted, the trip and its group chat appear here." />
      ) : (
        <div className="space-y-3">{mine.map((tr) => <TripCard key={tr.id} trip={tr} onOpen={() => setOpenId(tr.id)} />)}</div>
      )}
    </div>
  );
}

function TripCard({ trip, onOpen }) {
  const msgs = trip.chat.messages.filter((m) => m.kind !== "system");
  return (
    <button onClick={onOpen} className="tap w-full text-left rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>{trip.title}</div>
        <TripStateBadge state={tripStateNow(trip)} />
      </div>
      <div className="flex items-center gap-1 text-[12.5px] mt-1" style={{ color: C.muted }}><CalendarCheck size={12} /> {fmtDate(trip.start)} – {fmtDate(trip.end)}</div>
      <div className="flex items-center justify-between mt-3">
        <CrewAvatars members={trip.members} />
        <div className="flex items-center gap-1 text-[12.5px]" style={{ color: C.muted }}><MessageSquare size={13} /> {msgs.length}</div>
      </div>
    </button>
  );
}

function TripHub({ user, meId, trip, actions, onBack }) {
  const state = tripStateNow(trip);
  return (
    <div className="pb-6 fade">
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={onBack} className="tap w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.card }}><ChevronLeft size={19} color={C.ink} /></button>
        <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{trip.title}</div>
          <div className="text-[12px]" style={{ color: C.muted }}>{fmtDate(trip.start)} – {fmtDate(trip.end)}</div></div>
        <TripStateBadge state={state} />
      </div>

      <div className="px-5 py-4">
        <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: C.ink }}><MapPin size={15} color={C.gold} /> Meeting point</div>
          <div className="text-[13.5px] mt-1" style={{ color: C.muted }}>{trip.meetingPoint}</div>
        </div>

        <SectionLabel>Crew</SectionLabel>
        <div className="rounded-2xl divide-y mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, borderColor: C.line }}>
          {trip.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar initials={m.initials} size={36} />
              <div className="flex-1"><div className="text-[14px] font-semibold" style={{ color: C.ink }}>{m.name}</div>
                <div className="text-[12px] capitalize" style={{ color: C.muted }}>{m.roleInTrip.replace("_", " ")}</div></div>
              {m.id === meId && <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: C.goldSoft, color: "#7a5a1e" }}>You</span>}
            </div>
          ))}
        </div>

        {trip.itinerary.length > 0 && (
          <>
            <SectionLabel>Itinerary</SectionLabel>
            <div className="space-y-2 mb-5">
              {trip.itinerary.map((it) => (
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

  const member = (id) => trip.members.find((m) => m.id === id);
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
    const keep = trip.chat.messages.filter((m) => m.kind === "text" || m.kind === "photo");
    const bundle = {
      trip: { title: trip.title, start: trip.start, end: trip.end, meetingPoint: trip.meetingPoint },
      crew: trip.members.map((m) => ({ name: m.name, role: m.roleInTrip })),
      exportedAt: new Date().toISOString(),
      note: "Text and photos only. Voice and video are shared live and never saved.",
      messages: keep.map((m) => ({ from: member(m.senderId)?.name || "Unknown", kind: m.kind, text: m.body || null, photo: m.photo || null, at: new Date(m.ts).toISOString() })),
    };
    try {
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `trip-${trip.title.replace(/\s+/g, "-").toLowerCase()}.json`;
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
        {trip.chat.messages.map((m) => {
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
        <button onClick={() => flash("Video is shared live only — not saved to the trip.")} disabled={disabled} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.bg, border: `1px solid ${C.line}`, opacity: disabled ? 0.5 : 1 }}><Video size={16} color={C.muted} /></button>
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
  const open = listings.filter((l) => l.status === "open" && l.role === user.kind);
  const notApplied = open.filter((l) => !l.applicants.some((a) => a.talentId === t.id));
  const applied = listings.filter((l) => l.applicants.some((a) => a.talentId === t.id));
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
  const applied = listing.applicants.some((a) => a.talentId === talent.id);
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
        {listing.languages.map((l) => <Pill key={l}>{l}</Pill>)}
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
        const a = l.applicants.find((x) => x.talentId === talent.id);
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
            const pending = l.applicants.filter((a) => a.status === "applied").length;
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
            {listing.applicants.map((a) => (
              <div key={a.talentId} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <Avatar initials={a.initials} size={44} />
                  <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold" style={{ color: C.ink }}>{a.name}</div>
                    <div className="inline-flex items-center gap-1 mt-0.5"><Star size={12} color={C.gold} fill={C.gold} /><span className="text-[12.5px] font-semibold" style={{ color: "#7a5a1e" }}>{a.rating.toFixed(1)}</span></div></div>
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
                          {p.languages.slice(0, 4).map((l) => <span key={l.n} className="text-[11px] rounded-md px-1.5 py-0.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{l.n}</span>)}
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
  let latRef, lngRef, lat, lng;
  const n = u16(gps);
  for (let i = 0; i < n; i++) {
    const e = gps + 2 + i * 12, tag = u16(e);
    if (tag === 1) latRef = String.fromCharCode(view.getUint8(e + 8));
    else if (tag === 3) lngRef = String.fromCharCode(view.getUint8(e + 8));
    else if (tag === 2) lat = rat(e, 3);
    else if (tag === 4) lng = rat(e, 3);
  }
  if (!lat || !lng) return null;
  const dec = (d) => d[0] + d[1] / 60 + d[2] / 3600;
  let la = dec(lat), lo = dec(lng);
  if (latRef === "S") la = -la;
  if (lngRef === "W") lo = -lo;
  return { lat: +la.toFixed(6), lng: +lo.toFixed(6) };
}

function nearestPlace(lat, lng) {
  let best = null, bd = Infinity;
  for (const p of BT_PLACES) { const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2; if (d < bd) { bd = d; best = p; } }
  return best ? best.n : null;
}

function BhutanMap({ value, onPick, readOnly, pins }) {
  const ref = useRef();
  const points = pins || (value ? [value] : []);
  const handle = (e) => {
    if (readOnly || !onPick) return;
    const r = ref.current.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const fy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const lng = BT.W + fx * (BT.E - BT.W);
    const lat = BT.N - fy * (BT.N - BT.S);
    onPick({ lat: +lat.toFixed(4), lng: +lng.toFixed(4), place: nearestPlace(lat, lng) });
  };
  return (
    <div ref={ref} onClick={handle} className="relative rounded-xl overflow-hidden select-none"
      style={{ aspectRatio: BT_MAP_AR, background: "#eef1ee", cursor: readOnly ? "default" : "crosshair" }}>
      <img src={mapImg} alt="Relief map of Bhutan" draggable="false" className="absolute inset-0 w-full h-full pointer-events-none" style={{ objectFit: "cover" }} />

      {points.map((pt, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ left: `${btPctX(pt.lng)}%`, top: `${btPctY(pt.lat)}%`, transform: "translate(-50%, -100%)" }}>
          <MapPin size={pins && pins.length > 1 ? 20 : 26} color={C.maroon} fill={C.maroon} strokeWidth={1.4} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" }} />
        </div>
      ))}
    </div>
  );
}

function PostLocation({ location, showMap }) {
  if (!location) return null;
  return (
    <div className="mt-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
        <MapPin size={13} color={C.gold} /> {location.place ? (location.source === "viewpoint" ? location.place : `Near ${location.place}`) : "Pinned in Bhutan"}
      </span>
      {location.description && <p className="text-[12.5px] leading-snug mt-1.5" style={{ color: C.muted }}>{location.description}</p>}
      {showMap && <div className="mt-2.5"><BhutanMap readOnly value={location} /></div>}
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
          style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", opacity: zoomed ? 1 : 0, transition: "opacity .6s .5s" }}>
          <MapPin size={12} color="#fff" />
          <span className="text-[11.5px] font-semibold text-white">{location.place ? (location.source === "viewpoint" ? location.place : `Near ${location.place}`) : "Bhutan"}</span>
        </div>

        {photo && showPhoto && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setPhase(1); }} className="tap absolute right-2.5 top-2.5 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.5)" }} aria-label="Show location on map">
              <Map size={15} color="#fff" />
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
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(8,10,8,.96)", zIndex: 210 }} onClick={onClose}>
      <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.15)" }} aria-label="Close">
        <X size={20} color="#fff" />
      </button>
      <div className="absolute bottom-5 left-0 right-0 text-center text-[12px]" style={{ color: "rgba(255,255,255,.55)" }}>Tap anywhere to close</div>
    </div>
  );
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

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: C.bg, zIndex: 200, height: "100dvh", paddingBottom: 62 }}>
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
  );
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

      {/* image — fits the frame, never overflows */}
      <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ background: "#0d100d", maxHeight: "62dvh" }}>
        <img src={p.media.dataUri} alt="" loading="lazy" decoding="async" className="block" style={{ maxWidth: "100%", maxHeight: "62dvh", width: "auto", height: "auto", objectFit: "contain" }} />
      </div>

      <div className="px-4 pt-3 pb-4">
        {p.text && <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{p.text}</p>}

        {p.location && (
          <div className="mt-2.5">
            <button onClick={() => setShowMap((v) => !v)} className="tap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold" style={{ background: C.goldSoft, color: "#7a5a1e" }}>
              <MapPin size={13} color={C.gold} />
              {p.location.place ? (p.location.source === "viewpoint" ? p.location.place : `Near ${p.location.place}`) : "Pinned in Bhutan"}
            </button>
            {p.location.description && <p className="text-[12.5px] leading-snug mt-2" style={{ color: C.muted }}>{p.location.description}</p>}
            {showMap && <div className="mt-2.5"><BhutanMap readOnly value={p.location} /></div>}
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

function AdminUsers({ onChanged }) {
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
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    setBusyId(id);
    const { error } = await supabase.from("profiles").update({ license_status: status }).eq("id", id);
    setBusyId(null);
    if (error) { flash("Update failed — check the admin policy is applied."); return; }
    setRows((R) => R.map((r) => (r.id === id ? { ...r, license_status: status } : r)));
    flash(status === "verified" ? "Verified." : status === "rejected" ? "Rejected." : "Updated.");
    onChanged && onChanged();
  };

  const removeUser = async (u) => {
    setBusyId(u.id);
    // remove their content first so nothing is orphaned, then the profile
    await supabase.from("post_comments").delete().eq("author_id", u.id);
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
    const { data: prof } = await supabase.from("profiles").select("id").eq("id", data.session.user.id).maybeSingle();
    if (prof) onDone(); else { setUid(data.session.user.id); setStep("role"); }
  };

  const savePassword = async () => {
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
    const { error } = await supabase.from("profiles").upsert({
      id: effUid, email: (email || session?.user?.email || "").trim() || null, role,
      full_name: name.trim(), phone: phone.trim() || null, base: base.trim() || null,
      company_name: role === "operator" ? (company.trim() || name.trim()) : null,
      years, pitch: pitch.trim() || null, languages: langs, tags,
      vehicle: role === "driver" ? vehicle : null,
      license_path: licensePath || null, license_status: licensePath ? "submitted" : "none",
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

  const ORDER = signin ? ["auth", "code", "password"] : ["role", "about", "details", "email", "code", "password", "license"];
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
            <button onClick={() => { setMode("signin"); setStep("auth"); setErr(null); }} className="relative flex-1 py-2.5 text-[14.5px] font-semibold" style={{ color: C.muted }}>Sign in</button>
            <button className="relative flex-1 py-2.5 text-[14.5px] font-semibold" style={{ color: C.ink }}>Create account</button>
          </div>
          <h2 className="text-[26px] font-semibold tracking-[-0.02em] mb-1" style={{ color: C.ink }}>How do you work with tours?</h2>
          <p className="text-[14.5px] mb-5" style={{ color: C.muted }}>Pick one — it shapes the rest of your setup.</p>
          {[["guide", "Guide", "Lead trips and share Bhutan", Compass], ["driver", "Driver", "Move guests safely on the road", Car], ["operator", "Tour Operator", "Find and book the crew", Building2]].map(([id, label, subT, Icon]) => (
            <button key={id} onClick={() => { setRole(id); setStep("about"); }} className="tap w-full text-left rounded-2xl p-4 flex items-center gap-3.5 mb-2.5"
              style={{ background: C.card, border: `1px solid ${role === id ? C.pine : C.line}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}><Icon size={20} color={C.goldSoft} /></div>
              <div className="flex-1"><div className="text-[15.5px] font-semibold" style={{ color: C.ink }}>{label}</div>
                <div className="text-[13px]" style={{ color: C.muted }}>{subT}</div></div>
              <ArrowRight size={17} color={C.muted} />
            </button>
          ))}
        </div>
      )}

      {step === "about" && (
        <div className="fade">
          <h2 className="text-[24px] font-semibold tracking-[-0.01em] mb-5" style={{ color: C.ink }}>Tell us who you are</h2>
          <OLabel>{role === "operator" ? "Your name" : "Full name"}</OLabel>
          <OInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          {role === "operator" && (<><OLabel>Agency name</OLabel><OInput value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your agency name" /></>)}
          <OLabel>Phone</OLabel>
          <OInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+975 17 00 00 00" inputMode="tel" />
          {role !== "operator" && (<><OLabel>Home base</OLabel><OInput value={base} onChange={(e) => setBase(e.target.value)} placeholder="Paro" /></>)}
          <OCta disabled={name.trim().length < 2} onClick={() => setStep("details")}>Continue</OCta>
        </div>
      )}

      {step === "details" && (
        <div className="fade">
          <h2 className="text-[24px] font-semibold tracking-[-0.01em] mb-5" style={{ color: C.ink }}>{role === "guide" ? "Your specialities" : role === "driver" ? "What you drive" : "About your agency"}</h2>
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
              <p className="text-[12.5px] mb-4" style={{ color: pw.length >= 6 && pw === pw2 ? C.pine : C.muted }}>
                {pw.length < 6 ? "6 characters or more." : pw2 && pw !== pw2 ? "Passwords don't match yet." : pw === pw2 && pw2 ? "Good to go." : "Type it again to confirm."}
              </p>

              {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
              <OCta disabled={pw.length < 6 || pw !== pw2} busy={busy} onClick={savePassword}>{reset ? "Save new password" : "Continue"}</OCta>
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
            <button onClick={() => licRef.current?.click()} className="tap w-full rounded-2xl p-8 flex flex-col items-center justify-center text-center mb-4"
              style={{ background: C.card, border: `1.5px dashed ${C.line}` }}>
              <div className="rounded-2xl flex items-center justify-center mb-3" style={{ width: 52, height: 52, background: C.goldSoft }}><Upload size={23} color={C.gold} /></div>
              <div className="text-[15px] font-semibold" style={{ color: C.ink }}>Upload a photo of your license</div>
              <div className="text-[13px] mt-1" style={{ color: C.muted }}>Front side · clear and readable</div>
            </button>
          )}
          <input ref={licRef} type="file" accept="image/*" onChange={pickLicense} className="hidden" />
          {err && <p className="text-[13px] mb-3" style={{ color: C.maroon }}>{err}</p>}
          <OCta disabled={!licPreview} busy={busy} onClick={submitLicense}>Submit & enter the hub</OCta>
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
  const myTrips = (trips || []).filter((tr) => tr.members.some((m) => m.id === meId) || (tr.operatorId && tr.operatorId === meId));

  const threads = useMemo(() => {
    const map = new Map();
    msgs.forEach((m) => {
      if (m.from !== me && m.to !== me) return;
      const other = m.from === me ? m.to : m.from;
      const prev = map.get(other);
      if (!prev || m.ts > prev.ts) map.set(other, { other, ts: m.ts, body: m.body, fromMe: m.from === me, unread: 0 });
    });
    map.forEach((v, k) => { v.unread = msgs.filter((x) => x.from === k && x.to === me && !x.read).length; });
    return [...map.values()].sort((a, b) => b.ts - a.ts);
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
            {trip.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <Avatar initials={m.initials} size={32} />
                <div className="flex-1"><div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{m.name}</div>
                  <div className="text-[11.5px] capitalize" style={{ color: C.muted }}>{m.roleInTrip.replace("_", " ")}</div></div>
                {m.id === meId && <span className="text-[10.5px] font-semibold rounded-full px-2 py-0.5" style={{ background: C.goldSoft, color: "#7a5a1e" }}>You</span>}
              </div>
            ))}
          </div>
          {trip.itinerary.length > 0 && (
            <div className="space-y-2">
              {trip.itinerary.map((it) => (
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
  const pool = useMemo(
    () => [...TALENT, ...Object.values(PROFILE_DIR)].filter((p) => p.id !== me),
    [me, dirTick]
  );
  const seen = new Set();
  const list = pool.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return `${p.name} ${p.base || ""} ${roleLabel(p.role)}`.toLowerCase().includes(q.toLowerCase());
  });
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
        {list.length === 0 ? (
          <Empty Icon={Users} title="Nobody found" body="Guides, drivers and operators appear here once they've signed up." />
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
  const scrollRef = useRef();
  const fileRef = useRef();
  const p = talentById(otherId);
  const thread = (dm?.dms || [])
    .filter((m) => (m.from === me && m.to === otherId) || (m.from === otherId && m.to === me))
    .sort((a, b) => a.ts - b.ts);

  useEffect(() => { dm?.markRead && dm.markRead(otherId); }, [otherId, thread.length]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [thread.length]);

  const flash = (m) => { setNote(m); setTimeout(() => setNote(null), 2400); };

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setText("");
    setSending(true);
    await dm.sendDm(otherId, t);
    setSending(false);
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
    const d = new Date(ts), now = new Date();
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
          const label = dayLabel(m.ts);
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
                          <Navigation size={15} color={mine ? "#fff" : C.gold} />
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
                      {relTime(m.ts)}
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

      <div className="shrink-0 px-2.5 py-2 flex items-end gap-1.5" style={{ background: C.card, borderTop: `1px solid ${C.line}` }}>
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

  const pool = [...TALENT, ...Object.values(PROFILE_DIR)].filter((p) => p.id !== me);
  const seen = new Set();
  const unique = pool.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
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

  return (
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 220 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col" style={{ background: C.card, maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
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
  );
}

/* ==================== Followers / Following list sheet =================== */
function FollowListSheet({ mode, talent, eng, onClose, onOpenProfile }) {
  const follows = eng?.follows || [];
  const me = eng?.me;
  const ids = mode === "followers"
    ? follows.filter((f) => f.following === talent.id).map((f) => f.follower)
    : follows.filter((f) => f.follower === talent.id).map((f) => f.following);
  const people = ids.map((id) => talentById(id)).filter(Boolean);

  return (
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 220 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col" style={{ background: C.card, maxHeight: "80dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="text-[17px] font-semibold" style={{ color: C.ink }}>
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
      <p className="text-[12.5px] mb-3" style={{ color: C.muted }}>Operators see this before they book you.</p>

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
          <div className="text-[12.5px] font-medium mb-1.5" style={{ color: C.ink }}>Free again from</div>
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

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#08090880", backdropFilter: "blur(2px)", zIndex: 220 }}>
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
  );
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

  return (
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 220 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
        <div className="text-[17px] font-semibold mb-1" style={{ color: C.ink }}>Add to your story</div>
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>Photo or short video. Disappears after 24 hours.</p>

        {media ? (
          <div className="relative rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${C.line}` }}>
            {media.kind === "video"
              ? <video src={media.dataUri} controls className="w-full block" style={{ maxHeight: 260 }} />
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

        {err && <p className="text-[13px] mb-2" style={{ color: C.maroon }}>{err}</p>}

        <button onClick={post} disabled={!media || busy} className="tap w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-2"
          style={{ background: media ? C.pine : "#C7CEC7", color: "#fff" }}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Share to story"}
        </button>
      </div>
    </div>
  );
}

function ConfirmShareStory({ post, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 220 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
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
  );
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
function AlertsSheet({ items, onClose, onOpenProfile, onOpenMessages, onOpenJobs }) {
  const meta = {
    message: { Icon: MessageCircle, bg: C.pineSoft, fg: C.pine, verb: "sent you a message" },
    like:    { Icon: Heart,         bg: C.maroonSoft, fg: C.maroon, verb: "liked your post" },
    comment: { Icon: MessageSquare, bg: C.goldSoft, fg: "#7a5a1e", verb: "commented" },
    follow:  { Icon: UserPlus,      bg: C.pineSoft, fg: C.pine, verb: "started following you" },
    job:     { Icon: Briefcase,     bg: C.goldSoft, fg: "#7a5a1e", verb: "sent you a job request" },
  };

  return (
    <div className="fixed inset-0 flex items-end" style={{ background: "rgba(8,10,8,.55)", zIndex: 230 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col" style={{ background: C.card, maxHeight: "80dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
          <div className="flex items-center justify-between">
            <div className="text-[17px] font-semibold" style={{ color: C.ink }}>Notifications</div>
            <span className="text-[12.5px]" style={{ color: C.muted }}>{items.length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hidescroll px-4 pb-5" style={{ scrollbarWidth: "none" }}>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: C.goldSoft }}><Bell size={22} color={C.gold} /></div>
              <p className="text-[14px] font-semibold" style={{ color: C.ink }}>You're all caught up</p>
              <p className="text-[13px] mt-1" style={{ color: C.muted }}>Messages, likes, follows and job requests appear here.</p>
            </div>
          ) : items.map((a) => {
            const m = meta[a.kind] || meta.message;
            const p = talentById(a.who);
            const go = () => {
              if (a.kind === "message") return onOpenMessages();
              if (a.kind === "job") return onOpenJobs();
              if (p) return onOpenProfile(a.who);
            };
            return (
              <button key={a.id} onClick={go} className="tap w-full text-left flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <div className="relative shrink-0">
                  <Avatar initials={p?.initials || "?"} size={40} />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: m.bg, border: `2px solid ${C.card}` }}>
                    <m.Icon size={10} color={m.fg} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] leading-snug" style={{ color: C.ink }}>
                    <b>{p?.name || "Someone"}</b> <span style={{ color: C.muted }}>{m.verb}</span>
                  </div>
                  {a.text && a.kind !== "follow" && <div className="text-[12.5px] truncate mt-0.5" style={{ color: C.muted }}>{a.text}</div>}
                  <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{relTime(a.ts)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
