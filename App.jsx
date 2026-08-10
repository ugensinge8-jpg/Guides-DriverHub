import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Compass, Car, Building2, ShieldCheck, ImagePlus, X, Check, Clock, Send,
  BadgeCheck, MapPin, Inbox, ChevronLeft, Star, Phone, Mail, Briefcase,
  Search, LogOut, Newspaper, User, CalendarCheck, MessageCircle,
  Map, MessageSquare, Users, Download, Mic, Video, Heart, Share2, Trash2,
} from "lucide-react";
import mapImg from "./map.jpg";
import { supabase } from "./supabase.js";

/* DrukConnect design system — paper, pine forest, temple gold, kemar red. */
const C = {
  bg: "#F4F5F1", card: "#FFFFFF", ink: "#1A241E", muted: "#6E7A72",
  line: "#E4E7E0", lineSoft: "#EEF0EB", pine: "#21402F", pineDeep: "#16281E",
  gold: "#C0872B", goldSoft: "#F3E8CF", maroon: "#7A2E2E", maroonSoft: "#F7E9E7", pineSoft: "#E4EFE7",
};

/* ------------------------------ Seed data -------------------------------- */
const TALENT = [
  { id: "t_karma", role: "guide", name: "Karma Wangchuk", base: "Paro", initials: "KW", years: 9, trips: 37, rating: 4.9, verified: true,
    grades: { Reliability: 5.0, Punctuality: 4.8, Awareness: 4.9 },
    tags: ["Culture & Dzong", "Alpine Trekking", "Birdwatching"],
    languages: [{ n: "Dzongkha", l: "Native" }, { n: "English", l: "Fluent" }, { n: "Hindi", l: "Conversational" }, { n: "Japanese", l: "Basic" }],
    phone: "+975 17 11 22 33", email: "karma.w@example.bt",
    pitch: "Fourth-generation Paro guide. I read weather and altitude by instinct." },
  { id: "t_pema", role: "guide", name: "Pema Choden", base: "Bumthang", initials: "PC", years: 12, trips: 54, rating: 4.8, verified: true,
    grades: { Reliability: 4.9, Punctuality: 4.7, Awareness: 4.9 },
    tags: ["Alpine Trekking", "Adventure", "Birdwatching"],
    languages: [{ n: "Dzongkha", l: "Native" }, { n: "English", l: "Fluent" }, { n: "German", l: "Conversational" }, { n: "French", l: "Basic" }],
    phone: "+975 17 44 55 66", email: "pema.c@example.bt",
    pitch: "Twelve seasons on the Snowman route. Calm at altitude, meticulous on logistics." },
  { id: "t_tashi", role: "guide", name: "Tashi Yangzom", base: "Thimphu", initials: "TY", years: 6, trips: 28, rating: 4.7, verified: true,
    grades: { Reliability: 4.8, Punctuality: 4.6, Awareness: 4.7 },
    tags: ["Culture & Dzong", "Spiritual & Meditation"],
    languages: [{ n: "Dzongkha", l: "Native" }, { n: "English", l: "Fluent" }, { n: "Mandarin", l: "Conversational" }],
    phone: "+975 17 77 88 99", email: "tashi.y@example.bt",
    pitch: "Specialist in monastery history and meditation retreats for quieter, slower tours." },
  { id: "t_sonam", role: "driver", name: "Sonam Dorji", base: "Thimphu", initials: "SD", years: 8, trips: 61, rating: 4.8, verified: true,
    grades: { Reliability: 4.9, Punctuality: 4.8, Awareness: 4.7 },
    tags: ["Long-distance", "Mountain passes", "Airport transfers"], vehicle: "SUV · Toyota Prado",
    languages: [{ n: "Dzongkha", l: "Native" }, { n: "Hindi", l: "Fluent" }, { n: "English", l: "Conversational" }],
    phone: "+975 17 22 33 44", email: "sonam.d@example.bt",
    pitch: "Eight years on Bhutan's mountain roads. Smooth, unhurried, never late." },
  { id: "t_dorji", role: "driver", name: "Dorji Tshering", base: "Paro", initials: "DT", years: 5, trips: 33, rating: 4.6, verified: true,
    grades: { Reliability: 4.7, Punctuality: 4.6, Awareness: 4.5 },
    tags: ["Excursion trips", "Airport transfers"], vehicle: "Hiace Van · 11 seats",
    languages: [{ n: "Dzongkha", l: "Native" }, { n: "English", l: "Basic" }],
    phone: "+975 17 55 66 77", email: "dorji.t@example.bt",
    pitch: "Group excursions and airport runs across the western valleys." },
];

const ACCOUNTS = [
  { id: "a_guide", kind: "guide", talentId: "t_karma", name: "Karma Wangchuk", initials: "KW", Icon: Compass, sub: "Guide · Paro" },
  { id: "a_driver", kind: "driver", talentId: "t_sonam", name: "Sonam Dorji", initials: "SD", Icon: Car, sub: "Driver · Thimphu" },
  { id: "a_operator", kind: "operator", name: "Druk Journeys", initials: "DJ", Icon: Building2, sub: "Tour operator" },
  { id: "a_admin", kind: "admin", name: "Admin", initials: "A", Icon: ShieldCheck, sub: "Moderator" },
];

const HOUR = 3600e3;
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const talentById = (id) => TALENT.find((t) => t.id === id);
const initialsOf = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const isoDay = (offset = 0) => new Date(Date.now() + offset * 86400e3).toISOString().slice(0, 10);
const sysMsg = (text) => ({ id: uid(), senderId: null, kind: "system", body: text, photo: null, ts: Date.now() });

/* ── Cloud (Supabase) ── posts are global when configured; everything falls back to local demo mode when not. */
const CLOUD = Boolean(supabase);

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

const ACTOR_FALLBACK = { a_operator: { name: "Druk Journeys", initials: "DJ" }, a_admin: { name: "Admin", initials: "A" } };
const actorName = (id) => talentById(id)?.name || ACTOR_FALLBACK[id]?.name || "Member";
const actorInitials = (id) => talentById(id)?.initials || ACTOR_FALLBACK[id]?.initials || "?";


const SEED_POSTS = [
  { id: uid(), talentId: "t_karma", text: "Clear skies over Jomolhari this morning — the whole group made base camp before the clouds rolled in.", media: null, location: { lat: 27.83, lng: 89.27, place: "Jomolhari" }, status: "approved", reason: null, createdAt: Date.now() - 5 * HOUR },
  { id: uid(), talentId: "t_sonam", text: "Dochula Pass was glorious today. All 108 chortens out of the mist by 9am.", media: null, location: { lat: 27.49, lng: 89.75, place: "Dochula" }, status: "pending", reason: null, createdAt: Date.now() - 1 * HOUR },
];

const SEED_JOBS = [
  { id: uid(), operator: "Druk Journeys", toTalentId: "t_karma", title: "7-day Western Cultural Tour — lead guide", role: "guide",
    start: "2026-04-12", end: "2026-04-18", languages: ["English"], notes: "Group of 6 from Germany. Paro–Thimphu–Punakha loop.", status: "pending", createdAt: Date.now() - 2 * HOUR },
];

const SEED_TRIPS = [
  {
    id: uid(), operator: "Druk Journeys", title: "Paro Valley Cultural Tour",
    start: isoDay(-1), end: isoDay(3), meetingPoint: "Paro International Airport — arrivals hall",
    members: [
      { id: "a_operator", name: "Druk Journeys", initials: "DJ", roleInTrip: "operator" },
      { id: "t_karma", name: "Karma Wangchuk", initials: "KW", roleInTrip: "guide" },
      { id: "t_sonam", name: "Sonam Dorji", initials: "SD", roleInTrip: "driver" },
    ],
    itinerary: [
      { day: 1, title: "Arrival & Rinpung Dzong" },
      { day: 2, title: "Tiger's Nest (Taktsang) hike" },
      { day: 3, title: "Kyichu Lhakhang & valley drive" },
    ],
    chat: {
      state: "active",
      messages: [
        sysMsg("Trip chat is live."),
        { id: uid(), senderId: "a_operator", kind: "text", body: "Guests land at 2:15pm tomorrow. Sonam, can you be at arrivals by 1:45?", photo: null, ts: Date.now() - 3 * HOUR },
        { id: uid(), senderId: "t_sonam", kind: "text", body: "Will be there with the Prado, boards ready.", photo: null, ts: Date.now() - 2.5 * HOUR },
        { id: uid(), senderId: "t_karma", kind: "text", body: "I'll meet everyone at the hotel for the 4pm dzong walk.", photo: null, ts: Date.now() - 2 * HOUR },
      ],
    },
    createdAt: Date.now() - 4 * HOUR,
  },
];

const SEED_LISTINGS = [
  { id: uid(), operator: "Snow Lion Expeditions", title: "Guide — Paro pickup + 2 days, Japanese preferred", role: "guide", start: isoDay(1), end: isoDay(3), languages: ["English", "Japanese"], notes: "Guests arrive Tuesday. Short notice — airport pickup then two days in the valley.", urgent: true, status: "open", applicants: [], createdAt: Date.now() - 2 * HOUR },
  { id: uid(), operator: "Himalaya Trails", title: "Driver for 5-day eastern circuit", role: "driver", start: isoDay(6), end: isoDay(11), languages: ["English"], notes: "Group of 4, Trashigang & Mongar. Comfortable SUV preferred.", urgent: false, status: "open", applicants: [], createdAt: Date.now() - 6 * HOUR },
  { id: uid(), operator: "Druk Journeys", title: "Trekking guide — 4-day Druk Path", role: "guide", start: isoDay(5), end: isoDay(9), languages: ["English"], notes: "Fit group of 3, camping. Alpine experience needed.", urgent: false, status: "open",
    applicants: [{ talentId: "t_pema", name: "Pema Choden", initials: "PC", rating: 4.8, message: "Twelve seasons on this route — happy to lead.", status: "applied", appliedAt: Date.now() - 1 * HOUR }], createdAt: Date.now() - 3 * HOUR },
];

const LANG_OPTIONS = ["English", "Hindi", "Japanese", "Mandarin", "German", "French"];

/* ================================== App =================================== */
export default function App() {
  const [accountId, setAccountId] = useState(null);
  const [posts, setPosts] = useState(CLOUD ? [] : SEED_POSTS);
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [trips, setTrips] = useState(SEED_TRIPS);
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);

  const user = ACCOUNTS.find((a) => a.id === accountId) || null;

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

  const sendJob = (job) => setJobs((j) => [{ id: uid(), status: "pending", createdAt: Date.now(), ...job }, ...j]);

  const createTripFromJob = (job) => {
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
        members: [{ id: "a_operator", name: job.operator, initials: initialsOf(job.operator), roleInTrip: "operator" }, talentMember],
        itinerary: [],
        chat: {
          state: scheduled ? "scheduled" : "active",
          messages: [sysMsg("Trip created from an accepted job request."), sysMsg(scheduled ? "The group chat opens 3 days before departure." : "The group chat is live — say hello!")],
        },
        createdAt: Date.now(),
      }, ...prev];
    });
  };

  const setJobStatus = (id, status) => {
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, status } : x)));
    if (status === "accepted") { const job = jobs.find((x) => x.id === id); if (job) createTripFromJob(job); }
  };

  const postChat = (tripId, msg) => setTrips((prev) => prev.map((tr) => (tr.id === tripId ? { ...tr, chat: { ...tr.chat, messages: [...tr.chat.messages, msg] } } : tr)));
  const openChat = (tripId) => setTrips((prev) => prev.map((tr) => (tr.id === tripId ? { ...tr, chat: { ...tr.chat, state: "active" } } : tr)));

  const postListing = (l) => setListings((L) => [{ id: uid(), status: "open", createdAt: Date.now(), applicants: [], ...l }, ...L]);
  const applyToListing = (listingId, applicant) => setListings((L) => L.map((l) => (l.id === listingId ? (l.applicants.some((a) => a.talentId === applicant.talentId) ? l : { ...l, applicants: [...l.applicants, { status: "applied", appliedAt: Date.now(), ...applicant }] }) : l)));
  const setApplicant = (listingId, talentId, status) => setListings((L) => L.map((l) => (l.id === listingId ? { ...l, applicants: l.applicants.map((a) => (a.talentId === talentId ? { ...a, status } : a)) } : l)));
  const hireApplicant = (listing, applicant) => {
    setApplicant(listing.id, applicant.talentId, "hired");
    setListings((L) => L.map((l) => (l.id === listing.id ? { ...l, status: "filled" } : l)));
    createTripFromJob({ id: `${listing.id}_${applicant.talentId}`, toTalentId: applicant.talentId, operator: listing.operator, title: listing.title, start: listing.start, end: listing.end });
  };

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: C.bg }}>
      <style>{`
        *{ font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
        .tap{ transition: transform .12s ease, background .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .tap:active{ transform: scale(.985); }
        .hidescroll::-webkit-scrollbar{ display:none; }
        @media (prefers-reduced-motion: no-preference){ .fade{ animation: fade .28s ease both; } }
        @keyframes fade{ from{ opacity:0; transform: translateY(6px);} }
        textarea:focus, input:focus{ outline:none; border-color:${C.pine}!important; box-shadow:0 0 0 3px ${C.pine}1f; }
        textarea::placeholder, input::placeholder{ color:${C.muted}; opacity:.7; }
      `}</style>

      <div className="w-full max-w-md flex flex-col" style={{ height: "100vh", color: C.ink }}>
        {!user ? (
          <Login onPick={setAccountId} />
        ) : (
          <Shell key={user.id} user={user} posts={posts} jobs={jobs} trips={trips} listings={listings}
            actions={{ addPost, approve, reject, deletePost, sendJob, setJobStatus, postChat, openChat, postListing, applyToListing, setApplicant, hireApplicant }} engagement={{ likes, comments, toggleLike, addComment, deleteComment }} onLogout={() => setAccountId(null)} />
        )}
      </div>
    </div>
  );
}

/* ================================ Welcome ================================= */
function Login({ onPick }) {
  return (
    <div className="flex-1 overflow-y-auto hidescroll fade" style={{ scrollbarWidth: "none" }}>
      {/* brand row */}
      <div className="px-6 pt-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.pine, boxShadow: `0 6px 14px ${C.pine}33` }}>
          <Compass size={18} color={C.goldSoft} strokeWidth={1.9} />
        </div>
        <span className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>DrukConnect</span>
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

      {/* demo accounts */}
      <div className="px-6 mt-8 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color: C.gold }}>Explore the demo</div>
          <span className="text-[10.5px] font-bold rounded-full px-2 py-0.5" style={{ background: C.goldSoft, color: "#7a5a1e" }}>SAMPLE DATA</span>
        </div>
        <p className="text-[13px] mb-3.5" style={{ color: C.muted }}>Pick a seat — each account shows the app from a different side.</p>
        <div className="space-y-2.5">
          {ACCOUNTS.map((a) => (
            <button key={a.id} onClick={() => onPick(a.id)} className="tap w-full text-left rounded-2xl p-4 flex items-center gap-3.5"
              style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.pine }}>
                <a.Icon size={20} color={C.goldSoft} strokeWidth={1.9} />
              </div>
              <div className="flex-1">
                <div className="text-[15.5px] font-semibold" style={{ color: C.ink }}>{a.name}</div>
                <div className="text-[13px]" style={{ color: C.muted }}>{a.sub}</div>
              </div>
              <ChevronLeft size={18} color={C.muted} style={{ transform: "rotate(180deg)" }} />
            </button>
          ))}
        </div>
        <p className="text-[12px] mt-4 text-center" style={{ color: C.muted }}>{CLOUD ? "Demo accounts — posts are live and shared with everyone. Other data still resets on reload." : "Demo preview — accounts and data reset when the page reloads."}</p>
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
  guide: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "jobs", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: Map }, { id: "profile", label: "Profile", Icon: User }],
  driver: [{ id: "post", label: "Feed", Icon: Newspaper }, { id: "jobs", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: Map }, { id: "profile", label: "Profile", Icon: User }],
  operator: [{ id: "discover", label: "Discover", Icon: Search }, { id: "requests", label: "Jobs", Icon: Briefcase }, { id: "trips", label: "Trips", Icon: Map }, { id: "feed", label: "Feed", Icon: Newspaper }],
  admin: [{ id: "review", label: "Review", Icon: ShieldCheck }, { id: "feed", label: "Feed", Icon: Newspaper }],
};
const DEFAULT_TAB = { guide: "post", driver: "post", operator: "discover", admin: "review" };

function Shell({ user, posts, jobs, trips, listings, actions, engagement, onLogout }) {
  const [tab, setTab] = useState(DEFAULT_TAB[user.kind]);
  const [overlay, setOverlay] = useState(null); // {type:'profile'|'request', talentId}
  const nav = NAV[user.kind];
  const actorId = user.talentId || (user.kind === "operator" ? "a_operator" : "a_admin");
  const eng = { ...engagement, me: actorId, isAdmin: user.kind === "admin" };

  const pendingModCount = posts.filter((p) => p.status === "pending").length;
  const myTalent = user.talentId ? talentById(user.talentId) : null;
  const myJobsPending = myTalent ? jobs.filter((j) => j.toTalentId === myTalent.id && j.status === "pending").length : 0;
  const availableListings = myTalent ? listings.filter((l) => l.status === "open" && l.role === user.kind && !l.applicants.some((a) => a.talentId === myTalent.id)).length : 0;
  const jobsBadge = myJobsPending + availableListings;

  const openProfile = (talentId) => setOverlay({ type: "profile", talentId });
  const openRequest = (talentId) => setOverlay({ type: "request", talentId });

  return (
    <>
      <TopBar user={user} onLogout={onLogout} />

      <div className="flex-1 overflow-y-auto hidescroll" style={{ scrollbarWidth: "none" }}>
        {overlay ? (
          overlay.type === "profile" ? (
            <TalentProfile talent={talentById(overlay.talentId)} posts={posts}
              canRequest={user.kind === "operator"} self={user.talentId === overlay.talentId}
              onRequest={() => setOverlay({ type: "request", talentId: overlay.talentId })}
              onBack={() => setOverlay(null)} />
          ) : (
            <RequestForm talent={talentById(overlay.talentId)} operator={user.name}
              onBack={() => setOverlay({ type: "profile", talentId: overlay.talentId })}
              onSend={(job) => { actions.sendJob(job); setOverlay(null); setTab("requests"); }} />
          )
        ) : (
          <div key={tab} className="fade">
            {tab === "post" && <PostTab user={user} posts={posts} onAdd={actions.addPost} eng={eng} />}
            {tab === "jobs" && <JobsHub user={user} jobs={jobs} listings={listings} actions={actions} />}
            {tab === "trips" && <TripsTab user={user} trips={trips} actions={actions} />}
            {tab === "profile" && <TalentProfile talent={talentById(user.talentId)} posts={posts} self onBack={null} />}
            {tab === "discover" && <Discover onOpen={openProfile} />}
            {tab === "requests" && <OperatorJobs user={user} jobs={jobs} listings={listings} posts={posts} actions={actions} onOpen={openProfile} />}
            {tab === "feed" && <Feed posts={posts} eng={eng} admin={user.kind === "admin"} onDelete={actions.deletePost} />}
            {tab === "review" && <Review posts={posts} onApprove={actions.approve} onReject={actions.reject} eng={eng} />}
          </div>
        )}
      </div>

      {!overlay && (
        <BottomNav nav={nav} tab={tab} setTab={setTab}
          badges={{ jobs: jobsBadge, review: pendingModCount }} />
      )}
    </>
  );
}

function TopBar({ user, onLogout }) {
  return (
    <div className="shrink-0 h-14 px-4 flex items-center justify-between" style={{ background: C.bg, borderBottom: `1px solid ${C.lineSoft}` }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.pine }}>
          <Compass size={15} color={C.goldSoft} />
        </div>
        <span className="text-[15px] font-semibold" style={{ color: C.ink }}>DrukConnect</span>
      </div>
      <button onClick={onLogout} className="tap flex items-center gap-2 rounded-full pl-1 pr-3 py-1" style={{ border: `1px solid ${C.line}`, background: C.card }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.pine }}>
          <span className="text-[10px] font-bold" style={{ color: C.goldSoft }}>{user.initials}</span>
        </div>
        <LogOut size={14} color={C.muted} />
      </button>
    </div>
  );
}

function BottomNav({ nav, tab, setTab, badges }) {
  return (
    <div className="shrink-0 flex" style={{ background: C.card, borderTop: `1px solid ${C.line}` }}>
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
  if (!media) return null;
  return (
    <div className="rounded-xl overflow-hidden mt-3" style={{ border: `1px solid ${C.line}` }}>
      {media.kind === "video"
        ? <video src={media.dataUri} controls className="w-full block" style={{ maxHeight: 300 }} />
        : <img src={media.dataUri} alt="" className="w-full block" style={{ maxHeight: 300, objectFit: "cover" }} />}
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
const roleLabel = (r) => (r === "guide" ? "Guide" : "Driver");

/* ======================== Feed tab (guides & drivers) ===================== */
function PostTab({ user, posts, onAdd, eng }) {
  const me = user.talentId;
  const t = talentById(me);
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
                  <Avatar initials={author?.initials || "?"} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-semibold truncate" style={{ color: C.ink }}>{mine ? "You" : (author?.name || "Member")}</span>
                      {author?.verified && <BadgeCheck size={15} color={C.pine} />}
                    </div>
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}>
                      <MapPin size={11} /> {author?.base || ""} · {relTime(p.createdAt)}
                    </div>
                  </div>
                  {mine && p.status !== "approved" && <StatusBadge status={p.status} reason={p.reason} />}
                </div>
                {p.text && <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.ink }}>{p.text}</p>}
                <PostMedia media={p.media} />
                <PostLocation location={p.location} />
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
          flash("Location read from the photo\u2019s GPS.");
        }
      });
    }
  };

  const post = () => {
    if (!text.trim() && !media) return;
    onAdd({ talentId: talent.id, text: text.trim(), media, location });
    setText(""); setMedia(null); setLocation(null); setPicking(false);
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
          <select value="" onChange={(e) => { const v = VIEWPOINTS[e.target.value]; if (v) setLocation({ lat: v.lat, lng: v.lng, place: v.n, description: v.d, source: "viewpoint" }); }}
            className="w-full h-11 px-3 rounded-xl text-[14px] mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
            <option value="">Choose an iconic viewpoint…</option>
            {VIEWPOINTS.map((v, i) => <option key={i} value={i}>{v.n}</option>)}
          </select>
          <div className="text-[12.5px] mb-2" style={{ color: C.muted }}>…or tap the map for a custom spot.</div>
          <BhutanMap value={location} onPick={(loc) => setLocation({ ...loc, source: "map" })} />
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
function Discover({ onOpen }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [lang, setLang] = useState(null);

  const list = useMemo(() => {
    return TALENT.filter((t) => (role === "all" || t.role === role))
      .filter((t) => (!lang || t.languages.some((l) => l.n === lang)))
      .filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || t.base.toLowerCase().includes(q.toLowerCase()) || t.tags.join(" ").toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.rating - a.rating);
  }, [q, role, lang]);

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
            <Star size={12} color={C.gold} fill={C.gold} /><span className="text-[12.5px] font-semibold" style={{ color: "#7a5a1e" }}>{t.rating.toFixed(1)}</span>
          </div>
          <div className="text-[11.5px] mt-1" style={{ color: C.muted }}>{t.years} yrs · {t.trips} trips</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {t.languages.slice(0, 4).map((l) => (
          <span key={l.n} className="text-[11.5px] rounded-md px-1.5 py-0.5" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.muted }}>{l.n}</span>
        ))}
      </div>
    </button>
  );
}

/* ======================= Sent requests (operator) ======================== */
function SentRequests({ operator, jobs, onOpen }) {
  const mine = jobs.filter((j) => j.operator === operator);
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
function Feed({ posts, eng, admin, onDelete }) {
  const live = admin ? posts : posts.filter((p) => p.status === "approved");
  return (
    <div className="px-5 py-4">
      <SectionLabel trailing={admin ? `${live.length} total` : undefined}>Highlights</SectionLabel>
      {live.length === 0 ? (
        <Empty Icon={Inbox} title="No highlights yet" body="Approved posts from guides and drivers appear here." />
      ) : (
        <div className="space-y-3.5">
          {live.map((p) => {
            const t = talentById(p.talentId);
            return (
              <div key={p.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <Avatar initials={t?.initials || "?"} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5"><span className="text-[14.5px] font-semibold truncate" style={{ color: C.ink }}>{t?.name || "Member"}</span>{t?.verified && <BadgeCheck size={15} color={C.pine} />}</div>
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}><MapPin size={11} /> {t?.base || ""} · {relTime(p.createdAt)}</div>
                  </div>
                  {admin && p.status !== "approved" && <StatusBadge status={p.status} reason={p.reason} />}
                  {admin && <DeletePost onConfirm={() => onDelete(p.id)} />}
                </div>
                {p.text && <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.ink }}>{p.text}</p>}
                <PostMedia media={p.media} />
                <PostLocation location={p.location} showMap />
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
function TalentProfile({ talent, posts, canRequest, self, contactOnly, onRequest, onBack }) {
  const t = talent;
  const live = posts.filter((p) => p.talentId === t.id && p.status === "approved").length;
  const located = posts.filter((p) => p.talentId === t.id && p.status === "approved" && p.location);
  return (
    <div className="pb-6">
      <div className="relative">
        {onBack && (
          <button onClick={onBack} className="tap absolute left-4 top-4 z-10 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.9)", border: `1px solid ${C.line}` }}><ChevronLeft size={19} color={C.ink} /></button>
        )}
        <div className="h-20" style={{ background: `radial-gradient(120% 140% at 80% 0%, ${C.pine} 0%, ${C.pineDeep} 70%)` }} />
        <div className="px-5 -mt-8">
          <div className="flex items-end gap-3.5">
            <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: 68, height: 68, background: C.pine, border: `3px solid ${C.bg}` }}>
              <span className="text-[22px] font-semibold" style={{ color: C.goldSoft }}>{t.initials}</span>
            </div>
            <div className="pb-1 flex-1">
              <div className="flex items-center gap-1.5"><h1 className="text-[20px] font-semibold" style={{ color: C.ink }}>{t.name}</h1>{t.verified && <BadgeCheck size={16} color={C.pine} />}</div>
              <div className="flex items-center gap-1 text-[13px]" style={{ color: C.muted }}><MapPin size={13} /> {roleLabel(t.role)} · {t.base}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3.5 text-[13px]" style={{ color: C.muted }}>
            <span><b style={{ color: C.ink }}>{t.years}</b> yrs</span><span style={{ color: C.line }}>|</span>
            <span><b style={{ color: C.ink }}>{t.trips}</b> trips</span><span style={{ color: C.line }}>|</span>
            <span><b style={{ color: C.ink }}>{live}</b> posts</span>
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* trip record */}
        <div className="rounded-2xl overflow-hidden mt-5" style={{ border: `1px solid ${C.line}` }}>
          <div className="px-4 py-3.5 flex items-center justify-between" style={{ background: C.pine }}>
            <div><div className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: C.goldSoft }}>Trip record</div>
              <div className="text-[12.5px] mt-0.5" style={{ color: "#ffffffcc" }}>Graded by operators</div></div>
            <div className="text-right"><div className="text-[26px] font-semibold leading-none text-white">{t.rating.toFixed(1)}</div><div className="mt-1 flex justify-end"><Stars score={t.rating} light /></div></div>
          </div>
          <div className="px-4 py-4 space-y-3.5" style={{ background: C.card }}>
            {Object.entries(t.grades).map(([k, v]) => (
              <div key={k}><div className="flex items-baseline justify-between mb-1.5"><span className="text-[13.5px] font-medium" style={{ color: C.ink }}>{k}</span><span className="text-[13px] font-semibold" style={{ color: C.pine }}>{v.toFixed(1)}</span></div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: C.lineSoft }}><div className="h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, background: `linear-gradient(90deg, ${C.gold}, #D9A94E)` }} /></div></div>
            ))}
          </div>
        </div>

        <div className="mt-5 pl-4" style={{ borderLeft: `3px solid ${C.gold}` }}><p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{t.pitch}</p></div>

        <div className="mt-6"><SectionLabel>{t.role === "guide" ? "Specialities" : "Drives"}</SectionLabel>
          <div className="flex flex-wrap gap-2">{t.tags.map((s) => <span key={s} className="rounded-full px-3 py-1.5 text-[13.5px] font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{s}</span>)}</div>
          {t.vehicle && <div className="mt-2.5 text-[13.5px]" style={{ color: C.muted }}><Car size={14} color={C.gold} className="inline mr-1" /> {t.vehicle}</div>}
        </div>

        <div className="mt-6"><SectionLabel>Languages</SectionLabel>
          <div className="flex flex-wrap gap-2">{t.languages.map((l) => (
            <span key={l.n} className="inline-flex items-center gap-2 rounded-full pl-3.5 pr-2 py-1.5 text-[13.5px] font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{l.n}<span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: C.goldSoft, color: "#7a5a1e" }}>{l.l}</span></span>
          ))}</div>
        </div>

        {located.length > 0 && (
          <div className="mt-6"><SectionLabel trailing={`${located.length} pins`}>Where they've worked</SectionLabel>
            <BhutanMap readOnly pins={located.map((p) => p.location)} />
          </div>
        )}

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
          <button className="tap h-12 px-5 rounded-xl flex items-center justify-center gap-2 text-[14.5px] font-semibold" style={{ background: C.card, border: `1.5px solid ${C.pine}`, color: C.pine }}><MessageCircle size={18} /> Message</button>
          <button onClick={onRequest} className="tap flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ background: C.pine, color: "#fff", boxShadow: `0 6px 16px ${C.pine}33` }}><Briefcase size={18} /> Send job request</button>
        </div>
      )}
      {self && (
        <div className="px-5 mt-6"><div className="rounded-xl px-4 py-3 text-[13px] text-center" style={{ background: C.goldSoft, color: "#7a5a1e" }}>This is how operators see your profile.</div></div>
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
  const meId = user.kind === "operator" ? "a_operator" : user.talentId;
  const mine = trips.filter((tr) => (user.kind === "operator" ? tr.operator === user.name : tr.members.some((m) => m.id === user.talentId)));
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
        <Chat user={user} meId={meId} trip={trip} state={state} actions={actions} />
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
function OperatorJobs({ user, jobs, listings, posts, actions, onOpen }) {
  const [sub, setSub] = useState("open");
  const [posting, setPosting] = useState(false);
  const [manageId, setManageId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const mine = listings.filter((l) => l.operator === user.name);
  const manage = mine.find((l) => l.id === manageId);
  const openCount = mine.filter((l) => l.status === "open").length;

  if (profileId) return <TalentProfile talent={talentById(profileId)} posts={posts} contactOnly onBack={() => setProfileId(null)} />;
  if (posting) return <ListingForm operator={user.name} onBack={() => setPosting(false)} onPost={(l) => { actions.postListing(l); setPosting(false); setSub("open"); }} />;
  if (manage) return <ManageApplicants listing={manage} actions={actions} onViewProfile={setProfileId} onBack={() => setManageId(null)} />;

  return (
    <div>
      <div className="px-5 pt-4 pb-1">
        <Segmented value={sub} onChange={setSub} options={[["open", `Open jobs${openCount ? ` · ${openCount}` : ""}`], ["direct", "Direct requests"]]} />
      </div>
      {sub === "open" && <OperatorListings listings={mine} onPost={() => setPosting(true)} onManage={setManageId} />}
      {sub === "direct" && <SentRequests operator={user.name} jobs={jobs} onOpen={onOpen} />}
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
                <button onClick={() => onViewProfile(a.talentId)} className="tap text-[13px] font-semibold mt-3 inline-flex items-center gap-1" style={{ color: C.pine }}>View full profile →</button>
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
const BT = { W: 88.75, E: 92.12, N: 28.36, S: 26.70 };
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

const BT_MAP_AR = 2.0367;

// Iconic photography viewpoints — selecting one fills exact coordinates + a description.
const VIEWPOINTS = [
  { n: "Tiger's Nest (Paro Taktsang)", lat: 27.4917, lng: 89.3639, d: "Cliffside monastery on a 900 m granite face \u2014 the classic Bhutan shot, best in morning light." },
  { n: "Dochula Pass (108 Chortens)", lat: 27.4903, lng: 89.7511, d: "108 chortens on a ridge with a Himalayan panorama on clear winter mornings." },
  { n: "Punakha Dzong", lat: 27.5852, lng: 89.8615, d: "Fortress at the meeting of the Pho and Mo rivers; lilac jacaranda in spring." },
  { n: "Punakha Suspension Bridge", lat: 27.5980, lng: 89.8880, d: "One of Bhutan\u2019s longest footbridges, strung with prayer flags over the Po Chhu." },
  { n: "Chele La Pass", lat: 27.3670, lng: 89.3450, d: "Bhutan\u2019s highest motorable pass (~3,988 m); prayer flags and views toward Jomolhari." },
  { n: "Rinpung Dzong (Paro)", lat: 27.4256, lng: 89.4200, d: "Classic whitewashed fortress above Paro town and its valley." },
  { n: "Buddha Dordenma (Thimphu)", lat: 27.4417, lng: 89.6447, d: "51 m gilded Buddha above Thimphu \u2014 glows at golden hour." },
  { n: "Tashichho Dzong (Thimphu)", lat: 27.4750, lng: 89.6339, d: "Riverside seat of government, beautifully floodlit at dusk." },
  { n: "Gangtey / Phobjikha Valley", lat: 27.4600, lng: 90.1800, d: "Glacial valley and winter home of black-necked cranes; sweeping meadows." },
  { n: "Trongsa Dzong", lat: 27.5030, lng: 90.5070, d: "Bhutan\u2019s largest dzong, dramatic on its ridge above the gorge." },
  { n: "Jakar Dzong (Bumthang)", lat: 27.5460, lng: 90.7520, d: "The \u2018castle of the white bird\u2019 over the Chamkhar valley." },
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

  const share = async () => {
    const line = `${actorName(post.talentId)} on DrukConnect${post.text ? `: \u201c${post.text}\u201d` : ""}`;
    const url = window.location.origin;
    try {
      if (navigator.share) { await navigator.share({ title: "DrukConnect", text: line, url }); }
      else { await navigator.clipboard.writeText(`${line}\n${url}`); setNote("Link copied"); setTimeout(() => setNote(null), 2000); }
    } catch (e) {}
  };
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
              placeholder={"Reply\u2026"} className="flex-1 h-10 px-3.5 rounded-full text-[13.5px]" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }} />
            <button onClick={send} disabled={!text.trim()} className="tap w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: text.trim() ? C.pine : "#C7CEC7" }} aria-label="Send reply">
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
