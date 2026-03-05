import { useEffect, useState, useCallback } from "react";
import {
  FiAward,
  FiStar,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiCalendar,
  FiShoppingBag,
  FiClock,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiUser,
} from "react-icons/fi";
import api from "../api/axios";

const THRESHOLD = 60; // must match backend

const STATUS_CFG = {
  pending: {
    label: "Pending",
    cls: "text-amber-600 bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  accepted: {
    label: "Accepted",
    cls: "text-green-700 bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    cls: "text-red-600   bg-red-50   border-red-200",
    dot: "bg-red-400",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex-1">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function AdminOCApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilter] = useState("all");
  const [reviewModal, setReview] = useState(null); // { app, action: 'accepted'|'rejected' }
  const [reviewNote, setNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/oc-applications");
      setApps(res.data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setReviewing(true);
    try {
      await api.put(`/oc-applications/${reviewModal.app._id}/status`, {
        status: reviewModal.action,
        reviewNote: reviewNote.trim(),
      });
      setApps((prev) =>
        prev.map((a) =>
          a._id === reviewModal.app._id
            ? {
                ...a,
                status: reviewModal.action,
                reviewNote: reviewNote.trim(),
              }
            : a,
        ),
      );
      setReview(null);
      setNote("");
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed");
    } finally {
      setReviewing(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────
  const filtered =
    filterStatus === "all"
      ? apps
      : apps.filter((a) => a.status === filterStatus);

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const suggested = apps.filter((a) => a.score >= THRESHOLD).length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">
            OC Applications
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Ranked by engagement score · System flags top candidates
          </p>
        </div>
        <button
          onClick={fetchApps}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total",
            value: apps.length,
            color: "text-gray-700 bg-gray-50 border-gray-200",
          },
          {
            label: "Pending",
            value: counts.pending || 0,
            color: "text-amber-600 bg-amber-50 border-amber-200",
          },
          {
            label: "Accepted",
            value: counts.accepted || 0,
            color: "text-green-700 bg-green-50 border-green-200",
          },
          {
            label: "System ⭐",
            value: suggested,
            color: "text-amber-700 bg-amber-50 border-amber-300",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border px-4 py-3 ${color}`}>
            <p className="text-2xl font-extrabold leading-none">{value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Algorithm explanation */}
      <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <FiAward className="text-blue-500 text-base flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Scoring algorithm:</strong> Account age (max 50 pts) +
          Merchandise purchases (10 pts / order + 2 pts / item) + Daily login
          streak (3 pts / day, max 90 pts). Applicants with ≥ {THRESHOLD} pts
          are marked{" "}
          <span className="inline-flex items-center gap-1 font-bold text-amber-600">
            <FiStar className="text-xs" /> System Recommended
          </span>
          . List is sorted highest-score first.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "all", label: `All (${apps.length})` },
          { id: "pending", label: `Pending (${counts.pending || 0})` },
          { id: "accepted", label: `Accepted (${counts.accepted || 0})` },
          { id: "rejected", label: `Rejected (${counts.rejected || 0})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filterStatus === t.id
                ? "bg-green-800 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" />
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiAward className="text-5xl mb-3 opacity-40" />
          <p className="text-sm font-medium">
            No applications in this category.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[860px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Rank",
                    "Applicant",
                    "Event",
                    "Score",
                    "Breakdown",
                    "Applied On",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, idx) => {
                  const isSuggested = app.score >= THRESHOLD;
                  const bd = app.scoreBreakdown || {};

                  return (
                    <tr
                      key={app._id}
                      className={`border-b border-gray-100 last:border-0 transition ${isSuggested ? "bg-amber-50/20" : "hover:bg-gray-50"}`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-extrabold ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-gray-500" : idx === 2 ? "text-amber-700" : "text-gray-400"}`}
                          >
                            #{idx + 1}
                          </span>
                          {isSuggested && (
                            <FiStar
                              className="text-amber-400 text-xs"
                              title="System Recommended"
                            />
                          )}
                        </div>
                      </td>

                      {/* Applicant */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {app.student?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none flex items-center gap-2">
                              {app.student?.name}
                              {isSuggested && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">
                                  Recommended
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {app.student?.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Event */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                          {app.eventName}
                        </span>
                      </td>

                      {/* Total score */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-base font-extrabold ${isSuggested ? "text-amber-600" : "text-green-800"}`}
                        >
                          {app.score}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">pts</span>
                      </td>

                      {/* Score breakdown mini-bars */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <div className="flex items-center gap-1.5">
                            <FiCalendar className="text-blue-500 text-[10px] flex-shrink-0" />
                            <MiniBar
                              value={bd.accountAgeScore || 0}
                              max={50}
                              color="bg-blue-400"
                            />
                            <span className="text-[10px] text-gray-400 w-7 text-right">
                              {bd.accountAgeScore || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FiShoppingBag className="text-purple-500 text-[10px] flex-shrink-0" />
                            <MiniBar
                              value={bd.merchandiseScore || 0}
                              max={Math.max(bd.merchandiseScore || 0, 60)}
                              color="bg-purple-400"
                            />
                            <span className="text-[10px] text-gray-400 w-7 text-right">
                              {bd.merchandiseScore || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FiClock className="text-green-600 text-[10px] flex-shrink-0" />
                            <MiniBar
                              value={bd.loginStreakScore || 0}
                              max={90}
                              color="bg-green-500"
                            />
                            <span className="text-[10px] text-gray-400 w-7 text-right">
                              {bd.loginStreakScore || 0}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Applied on */}
                      <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(app.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} />
                        {app.reviewNote && (
                          <p className="text-[10px] text-gray-400 mt-1 max-w-[100px] line-clamp-1 italic">
                            {app.reviewNote}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        {app.status === "pending" ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setReview({ app, action: "accepted" });
                                setNote("");
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold transition"
                            >
                              <FiCheck /> Accept
                            </button>
                            <button
                              onClick={() => {
                                setReview({ app, action: "rejected" });
                                setNote("");
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-[11px] font-semibold transition"
                            >
                              <FiX /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Review confirmation modal ──────────────────────── */}
      {reviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !reviewing && setReview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {reviewModal.action === "accepted" ? (
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle className="text-green-600 text-xl" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FiXCircle className="text-red-500 text-xl" />
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {reviewModal.action === "accepted"
                    ? "Accept Application"
                    : "Reject Application"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {reviewModal.app.student?.name} — {reviewModal.app.eventName}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Review Note (optional)
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the applicant…"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition resize-none"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => !reviewing && setReview(null)}
                disabled={reviewing}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewing}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 ${
                  reviewModal.action === "accepted"
                    ? "bg-green-700 hover:bg-green-600"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {reviewing ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : reviewModal.action === "accepted" ? (
                  <FiCheckCircle />
                ) : (
                  <FiXCircle />
                )}
                {reviewing
                  ? "Saving…"
                  : reviewModal.action === "accepted"
                    ? "Confirm Accept"
                    : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
