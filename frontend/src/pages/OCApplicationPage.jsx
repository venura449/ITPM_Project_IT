import { useEffect, useState, useCallback } from "react";
import {
  FiStar,
  FiAward,
  FiCalendar,
  FiClock,
  FiShoppingBag,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiSend,
  FiRefreshCw,
  FiInfo,
} from "react-icons/fi";
import api from "../api/axios";

// ── Score bar ────────────────────────────────────────────────
function ScoreBar({ label, value, max, color, icon: Icon }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <Icon className={`text-sm ${color.text}`} />
          {label}
        </span>
        <span className={`text-xs font-extrabold ${color.text}`}>
          {value} pts
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.bg}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const STATUS_CFG = {
  pending: {
    label: "Under Review",
    icon: FiClock,
    cls: "text-amber-600 bg-amber-50 border-amber-200",
  },
  accepted: {
    label: "Accepted ✓",
    icon: FiCheckCircle,
    cls: "text-green-700 bg-green-50 border-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: FiXCircle,
    cls: "text-red-600   bg-red-50   border-red-200",
  },
};

export default function OCApplicationPage() {
  const [score, setScore] = useState(null);
  const [events, setEvents] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loadingScore, setLScore] = useState(true);
  const [loadingApps, setLApps] = useState(true);

  // form
  const [eventName, setEventName] = useState("");
  const [customEvent, setCustomEvent] = useState("");
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchScore = useCallback(async () => {
    setLScore(true);
    try {
      const res = await api.get("/oc-applications/my-score");
      setScore(res.data);
    } catch (_) {
    } finally {
      setLScore(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data || []);
    } catch (_) {}
  }, []);

  const fetchMyApps = useCallback(async () => {
    setLApps(true);
    try {
      const res = await api.get("/oc-applications/my");
      setMyApps(res.data);
    } catch (_) {
    } finally {
      setLApps(false);
    }
  }, []);

  useEffect(() => {
    fetchScore();
    fetchEvents();
    fetchMyApps();
  }, [fetchScore, fetchEvents, fetchMyApps]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    const resolvedEvent =
      eventName === "__custom__" ? customEvent.trim() : eventName;
    if (!resolvedEvent) {
      setFormError("Please select or type an event name.");
      return;
    }
    if (!motivation.trim()) {
      setFormError("Please write your motivation.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/oc-applications", {
        eventName: resolvedEvent,
        motivation: motivation.trim(),
      });
      setFormSuccess("Application submitted successfully!");
      setEventName("");
      setCustomEvent("");
      setMotivation("");
      fetchMyApps();
      setTimeout(() => setFormSuccess(""), 6000);
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Suggestion threshold: synced with backend
  const THRESHOLD = 60;
  const suggested = (score?.total ?? 0) >= THRESHOLD;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">
            OC Application
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Apply to join the Organising Committee for an event
          </p>
        </div>
        <button
          onClick={() => {
            fetchScore();
            fetchMyApps();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          <FiRefreshCw className="text-sm" /> Refresh
        </button>
      </div>

      {/* ── Engagement score card ───────────────────────────── */}
      {loadingScore ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center gap-3 text-gray-400 text-sm">
          <span className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin" />
          Calculating your score…
        </div>
      ) : (
        score && (
          <div
            className={`bg-white rounded-2xl border shadow-sm p-5 ${suggested ? "border-amber-200" : "border-gray-100"}`}
          >
            {/* System suggestion banner */}
            {suggested && (
              <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <FiStar className="text-amber-500 text-lg flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800">
                    System Recommended — You're a strong candidate!
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Your engagement score ({score.total} pts) exceeds our
                    recommendation threshold of {THRESHOLD} pts. We encourage
                    you to apply.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-5">
              {/* Big score circle */}
              <div
                className={`w-20 h-20 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center shadow-inner
              ${suggested ? "bg-gradient-to-br from-amber-400 to-amber-500" : "bg-gradient-to-br from-green-800 to-green-600"}`}
              >
                <FiAward className="text-white text-xl mb-1" />
                <span className="text-white font-extrabold text-xl leading-none">
                  {score.total}
                </span>
                <span className="text-white/70 text-[10px] font-semibold">
                  pts
                </span>
              </div>

              {/* Breakdown */}
              <div className="flex-1 space-y-3 min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Engagement Score Breakdown
                </p>
                <ScoreBar
                  label={`Account Age (${score.daysSinceJoin}d since join)`}
                  value={score.accountAgeScore}
                  max={50}
                  color={{ text: "text-blue-600", bg: "bg-blue-500" }}
                  icon={FiCalendar}
                />
                <ScoreBar
                  label={`Merchandise (${score.orderCount} paid order${score.orderCount !== 1 ? "s" : ""})`}
                  value={score.merchandiseScore}
                  max={Math.max(score.merchandiseScore, 60)}
                  color={{ text: "text-purple-600", bg: "bg-purple-500" }}
                  icon={FiShoppingBag}
                />
                <ScoreBar
                  label={`Login Streak (${score.loginStreak} consecutive day${score.loginStreak !== 1 ? "s" : ""})`}
                  value={score.loginStreakScore}
                  max={90}
                  color={{ text: "text-green-700", bg: "bg-green-600" }}
                  icon={FiClock}
                />
              </div>
            </div>

            {/* How score is calculated */}
            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex items-start gap-2">
              <FiInfo className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-500 leading-relaxed">
                <strong>Score formula:</strong>&nbsp; Account age up to 50 pts
                (caps at 2 yrs) + 10 pts × paid orders + 2 pts × items bought +
                3 pts × daily login streak (caps at 30 days = 90 pts).
                Applicants scoring ≥ {THRESHOLD} pts are system-recommended.
              </p>
            </div>
          </div>
        )
      )}

      {/* ── Application form ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-bold text-gray-900 mb-1">
          Submit Application
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Select the event you want to organise and tell us why you're the right
          person.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Event <span className="text-red-400">*</span>
            </label>
            <select
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none transition"
            >
              <option value="">— Select an event —</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev.title}>
                  {ev.title}
                </option>
              ))}
              <option value="__custom__">Other (type below)</option>
            </select>
          </div>

          {eventName === "__custom__" && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Event Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={customEvent}
                onChange={(e) => setCustomEvent(e.target.value)}
                placeholder="Type the event name…"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 transition"
              />
            </div>
          )}

          {/* Motivation */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Why do you want to join the OC?{" "}
              <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Tell us about your experience, skills, and why you're interested in this role…"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition resize-none"
            />
          </div>

          {formError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-100 flex items-center gap-2">
              <FiAlertCircle className="flex-shrink-0" /> {formError}
            </p>
          )}
          {formSuccess && (
            <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 border border-green-100 flex items-center gap-2">
              <FiCheckCircle className="flex-shrink-0" /> {formSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-60 shadow-sm"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <FiSend className="text-sm" />
            )}
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>

      {/* ── My applications ─────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          My Applications
        </p>
        {loadingApps ? (
          <div className="flex items-center gap-3 text-gray-400 text-sm py-6">
            <span className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin" />
            Loading…
          </div>
        ) : myApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-12 text-gray-400">
            <FiAward className="text-4xl mb-2 opacity-40" />
            <p className="text-sm font-medium">No applications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myApps.map((app) => {
              const cfg = STATUS_CFG[app.status] ?? STATUS_CFG.pending;
              const Icon = cfg.icon;
              return (
                <div
                  key={app._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <FiCalendar className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">
                      {app.eventName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {app.motivation}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[11px] font-bold bg-green-50 text-green-800 border border-green-100 rounded-full px-2.5 py-0.5">
                        Score: {app.score} pts
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Applied{" "}
                        {new Date(app.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {app.reviewNote && (
                      <p className="mt-1.5 text-xs text-gray-500 italic">
                        Note: {app.reviewNote}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border flex-shrink-0 ${cfg.cls}`}
                  >
                    <Icon className="text-xs" /> {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
