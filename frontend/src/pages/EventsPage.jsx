import { useEffect, useState, useCallback } from "react";
import {
  FiCalendar,
  FiPlus,
  FiMapPin,
  FiClock,
  FiX,
  FiSave,
  FiCheck,
  FiAlertTriangle,
  FiFilter,
  FiImage,
  FiChevronRight,
  FiChevronLeft,
  FiUsers,
  FiBookmark,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const FACULTIES = [
  "Computing",
  "Engineering",
  "Business",
  "Architecture",
  "Humanities",
  "Other",
];
const CATEGORIES = [
  "Sport",
  "Workshop",
  "Night / Cultural",
  "Competition",
  "Other",
];

const FACULTY_COLORS = {
  Computing: "bg-blue-50 text-blue-600 border-blue-200",
  Engineering: "bg-orange-50 text-orange-600 border-orange-200",
  Business: "bg-purple-50 text-purple-600 border-purple-200",
  Architecture: "bg-amber-50 text-amber-600 border-amber-200",
  Humanities: "bg-rose-50 text-rose-600 border-rose-200",
  Other: "bg-gray-50 text-gray-600 border-gray-200",
};

const CATEGORY_COLORS = {
  Sport: "bg-green-50 text-green-700",
  Workshop: "bg-cyan-50 text-cyan-700",
  "Night / Cultural": "bg-indigo-50 text-indigo-700",
  Competition: "bg-red-50 text-red-600",
  Other: "bg-gray-50 text-gray-600",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  faculty: "",
  category: "",
  date: "",
  time: "",
  location: "",
  imageUrl: "",
  budgetGoal: "",
};

function Tag({ text, colorCls }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorCls}`}
    >
      {text}
    </span>
  );
}

function EventCard({
  event,
  onRegister,
  onUnregister,
  isRegistered,
  registering,
}) {
  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="w-full h-36 bg-gray-100 overflow-hidden flex-shrink-0 relative">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiCalendar className="text-4xl text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${FACULTY_COLORS[event.faculty] ?? FACULTY_COLORS.Other}`}
          >
            {event.faculty}
          </span>
        </div>
      </div>
      <div className="flex-1 flex flex-col p-4">
        <p className="text-sm font-extrabold text-gray-900 leading-snug mb-1 line-clamp-2">
          {event.title}
        </p>
        <span
          className={`self-start px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 ${CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.Other}`}
        >
          {event.category}
        </span>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {event.description}
        </p>
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <FiClock className="flex-shrink-0" /> {dateStr} at {timeStr}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <FiMapPin className="flex-shrink-0" /> {event.location}
          </div>
        </div>
        <div className="mt-auto">
          {isRegistered ? (
            <button
              onClick={() => onUnregister(event)}
              disabled={registering}
              className="w-full py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {registering ? (
                <span className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <FiX className="text-sm" />
              )}
              Cancel Registration
            </button>
          ) : (
            <button
              onClick={() => onRegister(event)}
              disabled={registering}
              className="w-full py-2 rounded-xl bg-green-800 hover:bg-green-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {registering ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiBookmark className="text-sm" />
              )}
              Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const isOC = user?.role === "oc" || user?.role === "admin";

  const [events, setEvents] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | my-registrations
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [registering, setRegistering] = useState({}); // eventId → boolean

  // OC Pending/Add list
  const [pendingEvents, setPendingEvents] = useState([]);
  const [ocTab, setOcTab] = useState("published"); // published | pending

  // Add Event Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalPage, setModalPage] = useState(1);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");

  // ── Fetch ────────────────────────────────────────────────
  const fetchPublished = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, regRes] = await Promise.all([
        api.get("/events"),
        api.get("/events/my-registrations"),
      ]);
      setEvents(evRes.data);
      setMyRegs(regRes.data.map((r) => r.event._id));
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    if (!isOC) return;
    try {
      const { data } = await api.get("/events/pending");
      setPendingEvents(data);
    } catch (_) {}
  }, [isOC]);

  useEffect(() => {
    fetchPublished();
    fetchPending();
  }, [fetchPublished, fetchPending]);

  // ── Filtered events ──────────────────────────────────────
  const filtered = events.filter((ev) => {
    if (facultyFilter !== "all" && ev.faculty !== facultyFilter) return false;
    if (categoryFilter !== "all" && ev.category !== categoryFilter)
      return false;
    return true;
  });

  const myRegEvents = events.filter((ev) => myRegs.includes(ev._id));

  // ── Registration handlers ────────────────────────────────
  const handleRegister = async (ev) => {
    setRegistering((s) => ({ ...s, [ev._id]: true }));
    try {
      await api.post(`/events/${ev._id}/register`);
      setMyRegs((prev) => [...prev, ev._id]);
    } catch (err) {
      alert(err.response?.data?.message ?? "Registration failed.");
    } finally {
      setRegistering((s) => ({ ...s, [ev._id]: false }));
    }
  };

  const handleUnregister = async (ev) => {
    setRegistering((s) => ({ ...s, [ev._id]: true }));
    try {
      await api.delete(`/events/${ev._id}/register`);
      setMyRegs((prev) => prev.filter((id) => id !== ev._id));
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to cancel.");
    } finally {
      setRegistering((s) => ({ ...s, [ev._id]: false }));
    }
  };

  // ── Add event modal ──────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModalPage(1);
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const handleNextPage = () => {
    if (!form.title.trim()) return setFormError("Title is required.");
    if (!form.description.trim())
      return setFormError("Description is required.");
    if (!form.faculty) return setFormError("Please select a faculty.");
    if (!form.category) return setFormError("Please select a category.");
    setFormError("");
    setModalPage(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date) return setFormError("Please pick a date.");
    if (!form.location.trim()) return setFormError("Location is required.");
    if (
      form.budgetGoal === "" ||
      isNaN(Number(form.budgetGoal)) ||
      Number(form.budgetGoal) < 0
    )
      return setFormError("Sponsor amount is required and must be 0 or more.");
    setFormError("");
    setFormLoading(true);
    try {
      const dateTime = form.time ? `${form.date}T${form.time}` : form.date;
      await api.post("/events", {
        title: form.title,
        description: form.description,
        faculty: form.faculty,
        category: form.category,
        date: new Date(dateTime).toISOString(),
        location: form.location,
        imageUrl: form.imageUrl,
        budgetGoal: Number(form.budgetGoal),
      });
      setFormSuccess(
        "Event submitted! It will be visible after admin approval.",
      );
      fetchPending();
      setTimeout(() => setShowModal(false), 1800);
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to submit event.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Preview panel ────────────────────────────────────────
  const PreviewPanel = () => (
    <div className="w-48 flex-shrink-0 bg-gradient-to-b from-green-900 to-green-800 flex flex-col py-6 px-4">
      <div className="w-full aspect-video rounded-xl overflow-hidden bg-white/10 mb-4 flex-shrink-0">
        {form.imageUrl ? (
          <img
            src={form.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiCalendar className="text-3xl text-white/40" />
          </div>
        )}
      </div>
      <p className="text-white font-bold text-xs leading-snug mb-1 break-words">
        {form.title || "Event Title"}
      </p>
      {form.faculty && (
        <p className="text-green-300 text-[10px] mb-1">{form.faculty}</p>
      )}
      {form.category && (
        <p className="text-green-200 text-[10px] mb-2">{form.category}</p>
      )}
      <div className="mt-auto space-y-1.5">
        {[
          { step: 1, label: "Details" },
          { step: 2, label: "Date & Location" },
        ].map(({ step, label }) => (
          <div
            key={step}
            className={`flex items-center gap-2 text-[10px] font-semibold ${modalPage === step ? "text-white" : modalPage > step ? "text-green-300" : "text-green-500"}`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${modalPage === step ? "bg-white text-green-900" : modalPage > step ? "bg-green-400 text-white" : "bg-white/20 text-white/50"}`}
            >
              {modalPage > step ? <FiCheck /> : step}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Events</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Browse and register for upcoming campus events
          </p>
        </div>
        {isOC && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition"
          >
            <FiPlus /> Add New Event
          </button>
        )}
      </div>

      {/* OC Tabs */}
      {isOC && (
        <div className="flex gap-1 mb-5">
          {[
            { id: "published", label: "Published Events" },
            {
              id: "pending",
              label: `Pending Approval${pendingEvents.length ? ` (${pendingEvents.length})` : ""}`,
            },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setOcTab(id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${ocTab === id ? "bg-green-800 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* OC Pending list */}
      {isOC && ocTab === "pending" && (
        <div className="mb-4">
          {pendingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FiCalendar className="text-4xl mb-3 opacity-40" />
              <p className="text-sm">No events pending approval</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <FiClock className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ev.faculty} · {ev.category} ·{" "}
                      {new Date(ev.date).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Published events */}
      {(!isOC || ocTab === "published") && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {[
              { id: "all", label: "All Events" },
              {
                id: "registered",
                label: `My Registrations${myRegs.length ? ` (${myRegs.length})` : ""}`,
              },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${tab === id ? "bg-green-800 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filters */}
          {tab === "all" && (
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="pl-7 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none cursor-pointer"
                >
                  <option value="all">All Faculties</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-7 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {(facultyFilter !== "all" || categoryFilter !== "all") && (
                <button
                  onClick={() => {
                    setFacultyFilter("all");
                    setCategoryFilter("all");
                  }}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition flex items-center gap-1"
                >
                  <FiX className="text-xs" /> Clear
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" />{" "}
              Loading…
            </div>
          ) : tab === "registered" ? (
            myRegEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FiUsers className="text-5xl mb-3 opacity-40" />
                <p className="text-sm font-medium">No registrations yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {myRegEvents.map((ev) => (
                  <EventCard
                    key={ev._id}
                    event={ev}
                    isRegistered
                    onUnregister={handleUnregister}
                    onRegister={handleRegister}
                    registering={!!registering[ev._id]}
                  />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FiCalendar className="text-5xl mb-3 opacity-40" />
              <p className="text-sm font-medium">No events found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((ev) => (
                <EventCard
                  key={ev._id}
                  event={ev}
                  isRegistered={myRegs.includes(ev._id)}
                  onRegister={handleRegister}
                  onUnregister={handleUnregister}
                  registering={!!registering[ev._id]}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add Event Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !formLoading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex"
            style={{ minHeight: "460px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <PreviewPanel />
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Add New Event
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Step {modalPage} of 2 —{" "}
                    {modalPage === 1 ? "Event Details" : "Date & Location"}
                  </p>
                </div>
                <button
                  onClick={() => !formLoading && setShowModal(false)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <FiX className="text-base" />
                </button>
              </div>

              {modalPage === 1 && (
                <div className="flex-1 flex flex-col px-6 py-5 gap-4 overflow-y-auto">
                  <Field label="Event Title">
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="e.g. SLIIT Code Rush 2026"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      rows={3}
                      placeholder="Brief description…"
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Faculty">
                      <select
                        value={form.faculty}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, faculty: e.target.value }))
                        }
                        className={inputCls}
                      >
                        <option value="">Select…</option>
                        {FACULTIES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Category">
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value }))
                        }
                        className={inputCls}
                      >
                        <option value="">Select…</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  {formError && <ErrorMsg msg={formError} />}
                  <div className="mt-auto pt-1 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => !formLoading && setShowModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      Next <FiChevronRight />
                    </button>
                  </div>
                </div>
              )}

              {modalPage === 2 && (
                <form
                  onSubmit={handleSubmit}
                  className="flex-1 flex flex-col px-6 py-5 gap-4 overflow-y-auto"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date">
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, date: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Time (optional)">
                      <input
                        type="time"
                        value={form.time}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, time: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <Field label="Location">
                    <div className="relative">
                      <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, location: e.target.value }))
                        }
                        placeholder="e.g. SLIIT Main Auditorium"
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                  </Field>
                  <Field label="Event Image URL (optional)">
                    <div className="relative">
                      <FiImage className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        value={form.imageUrl}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, imageUrl: e.target.value }))
                        }
                        placeholder="https://…"
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                  </Field>
                  <Field label="Sponsor Amount (Rs.)">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={form.budgetGoal}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, budgetGoal: e.target.value }))
                        }
                        placeholder="e.g. 50000  (0 = no sponsorship)"
                        className={`${inputCls} pl-10`}
                        required
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Events with an amount &gt; 0 will be visible to sponsors.
                    </p>
                  </Field>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2 text-xs text-amber-700">
                    <FiAlertTriangle className="flex-shrink-0 mt-0.5" />
                    Your event will go to admin for approval before being
                    published.
                  </div>
                  {formError && <ErrorMsg msg={formError} />}
                  {formSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs text-green-700">
                      <FiCheck /> {formSuccess}
                    </div>
                  )}
                  <div className="mt-auto pt-1 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setModalPage(1);
                        setFormError("");
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
                    >
                      <FiChevronLeft /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                    >
                      {formLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                          Submitting…
                        </>
                      ) : (
                        <>
                          <FiSave className="text-sm" /> Submit Event
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-100">
      {msg}
    </p>
  );
}
