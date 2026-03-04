import { useEffect, useState, useCallback } from "react";
import {
  FiCalendar,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
  FiMapPin,
  FiClock,
  FiUsers,
  FiImage,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
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

const STATUS_STYLES = {
  pending: {
    badge: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-400",
    label: "Pending",
  },
  approved: {
    badge: "bg-blue-50 text-blue-600 border-blue-200",
    dot: "bg-blue-500",
    label: "Approved",
  },
  published: {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    label: "Published",
  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

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

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState("all");

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalPage, setModalPage] = useState(1);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View modal
  const [viewTarget, setViewTarget] = useState(null);

  // Registrations modal
  const [regsTarget, setRegsTarget] = useState(null);
  const [regs, setRegs] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/events/all");
      setEvents(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Stats ────────────────────────────────────────────────
  const counts = events.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  // ── Filtered list ────────────────────────────────────────
  const filtered =
    tabFilter === "all" ? events : events.filter((e) => e.status === tabFilter);

  // ── Modal helpers ────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalPage(1);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setEditTarget(ev);
    const d = ev.date ? new Date(ev.date) : null;
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      faculty: ev.faculty || "",
      category: ev.category || "",
      date: d ? d.toISOString().slice(0, 10) : "",
      time: d ? d.toISOString().slice(11, 16) : "",
      location: ev.location || "",
      imageUrl: ev.imageUrl || "",
      budgetGoal: ev.budgetGoal != null ? String(ev.budgetGoal) : "0",
    });
    setModalPage(1);
    setFormError("");
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
      const payload = {
        title: form.title,
        description: form.description,
        faculty: form.faculty,
        category: form.category,
        date: new Date(dateTime).toISOString(),
        location: form.location,
        imageUrl: form.imageUrl,
        budgetGoal: Number(form.budgetGoal),
      };
      if (editTarget) {
        const { data } = await api.put(`/events/${editTarget._id}`, payload);
        setEvents((prev) => prev.map((e) => (e._id === data._id ? data : e)));
      } else {
        const { data } = await api.post("/events", payload);
        setEvents((prev) => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to save event.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────
  const handleApprove = async (ev) => {
    try {
      const { data } = await api.put(`/events/${ev._id}/approve`);
      setEvents((prev) => prev.map((e) => (e._id === data._id ? data : e)));
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed.");
    }
  };

  const handlePublish = async (ev) => {
    try {
      const { data } = await api.put(`/events/${ev._id}/publish`);
      setEvents((prev) => prev.map((e) => (e._id === data._id ? data : e)));
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed.");
    }
  };

  const handleUnpublish = async (ev) => {
    try {
      const { data } = await api.put(`/events/${ev._id}/unpublish`);
      setEvents((prev) => prev.map((e) => (e._id === data._id ? data : e)));
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed.");
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/events/${deleteTarget._id}`);
      setEvents((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to delete.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openRegistrations = async (ev) => {
    setRegsTarget(ev);
    setRegsLoading(true);
    try {
      const { data } = await api.get(`/events/${ev._id}/registrations`);
      setRegs(data);
    } catch (_) {
      setRegs([]);
    } finally {
      setRegsLoading(false);
    }
  };

  // ── Left preview panel content ───────────────────────────
  const PreviewPanel = () => (
    <div className="w-52 flex-shrink-0 bg-gradient-to-b from-green-900 to-green-800 flex flex-col py-6 px-4 overflow-hidden">
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
      <p className="text-white font-bold text-sm leading-snug mb-1 break-words">
        {form.title || "Event Title"}
      </p>
      {form.faculty && form.category && (
        <p className="text-green-300 text-[11px] mb-1">
          {form.faculty} · {form.category}
        </p>
      )}
      {form.date && (
        <p className="text-green-200 text-[11px] mb-3 flex items-center gap-1">
          <FiClock className="flex-shrink-0" />
          {new Date(form.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          {form.time && ` at ${form.time}`}
        </p>
      )}
      {form.location && (
        <p className="text-green-200 text-[11px] mb-3 flex items-center gap-1">
          <FiMapPin className="flex-shrink-0" /> {form.location}
        </p>
      )}
      <div className="mt-auto space-y-2">
        {[
          { step: 1, label: "Event Details" },
          { step: 2, label: "Date & Location" },
        ].map(({ step, label }) => (
          <div
            key={step}
            className={`flex items-center gap-2 text-[11px] font-semibold ${modalPage === step ? "text-white" : modalPage > step ? "text-green-300" : "text-green-500"}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${modalPage === step ? "bg-white text-green-900" : modalPage > step ? "bg-green-400 text-white" : "bg-white/20 text-white/50"}`}
            >
              {modalPage > step ? <FiCheck /> : step}
            </span>
            {label}
          </div>
        ))}
        <div className="flex gap-1 mt-3">
          {[1, 2].map((p) => (
            <span
              key={p}
              className={`w-2 h-2 rounded-full transition-all ${modalPage === p ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">
            Event Management
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Approve, publish and manage campus events
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <FiPlus /> Add Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total",
            value: events.length,
            color: "text-gray-700 bg-gray-50 border-gray-200",
          },
          {
            label: "Pending",
            value: counts.pending || 0,
            color: "text-amber-600 bg-amber-50 border-amber-200",
          },
          {
            label: "Approved",
            value: counts.approved || 0,
            color: "text-blue-600 bg-blue-50 border-blue-200",
          },
          {
            label: "Published",
            value: counts.published || 0,
            color: "text-green-700 bg-green-50 border-green-200",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border px-4 py-3 ${color}`}>
            <p className="text-2xl font-extrabold leading-none">{value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {(counts.pending || 0) > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-700 text-sm font-medium">
          <FiAlertTriangle className="flex-shrink-0" />
          {counts.pending} event{counts.pending !== 1 ? "s" : ""} awaiting
          approval
        </div>
      )}

      {/* Tab filters */}
      <div className="flex gap-1 mb-4">
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "approved", label: "Approved" },
          { id: "published", label: "Published" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTabFilter(id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${tabFilter === id ? "bg-green-800 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" />{" "}
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiCalendar className="text-5xl mb-3 opacity-40" />
          <p className="text-sm font-medium">No events found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Event",
                  "Faculty",
                  "Category",
                  "Date",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => (
                <tr
                  key={ev._id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {ev.imageUrl ? (
                          <img
                            src={ev.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <FiCalendar className="text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none max-w-[160px] truncate">
                          {ev.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">
                          {ev.createdBy?.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600 font-medium">
                    {ev.faculty}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600">
                    {ev.category}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(ev.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ev.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewTarget(ev)}
                        title="View"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <FiEye className="text-sm" />
                      </button>
                      <button
                        onClick={() => openEdit(ev)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      {ev.status === "pending" && (
                        <button
                          onClick={() => handleApprove(ev)}
                          title="Approve"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          <FiCheck className="text-sm" />
                        </button>
                      )}
                      {ev.status === "approved" && (
                        <button
                          onClick={() => handlePublish(ev)}
                          title="Publish"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition"
                        >
                          <FiEye className="text-sm" />
                        </button>
                      )}
                      {ev.status === "published" && (
                        <>
                          <button
                            onClick={() => openRegistrations(ev)}
                            title="Registrations"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                          >
                            <FiUsers className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleUnpublish(ev)}
                            title="Unpublish"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          >
                            <FiEyeOff className="text-sm" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteTarget(ev)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""} shown
            </p>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !formLoading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex"
            style={{ minHeight: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <PreviewPanel />
            <div className="flex-1 flex flex-col min-w-0">
              {/* Modal header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {editTarget ? "Edit Event" : "Add New Event"}
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

              {/* Page 1 */}
              {modalPage === 1 && (
                <div className="flex-1 flex flex-col px-6 py-5 gap-4 overflow-y-auto">
                  <Field label="Event Title">
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="e.g. SLIIT Annual Sports Meet"
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
                      placeholder="Brief description of the event…"
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
                        <option value="">Select faculty…</option>
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
                        <option value="">Select category…</option>
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

              {/* Page 2 */}
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
                  <Field label="Image URL (optional)">
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
                  {editTarget && (
                    <Field label="Status">
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                        <StatusBadge status={editTarget.status} />
                        <span className="text-xs text-gray-400 ml-1">
                          (changed via Approve / Publish actions)
                        </span>
                      </div>
                    </Field>
                  )}
                  {formError && <ErrorMsg msg={formError} />}
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
                          Saving…
                        </>
                      ) : (
                        <>
                          <FiSave className="text-sm" />{" "}
                          {editTarget ? "Save Changes" : "Create Event"}
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

      {/* ── View Modal ── */}
      {viewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setViewTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {viewTarget.imageUrl && (
              <div className="w-full h-40 overflow-hidden">
                <img
                  src={viewTarget.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div
              className={`bg-gradient-to-r from-green-900 to-green-800 px-6 py-4 flex items-center justify-between ${!viewTarget.imageUrl ? "" : ""}`}
            >
              <p className="text-white font-bold text-sm truncate">
                {viewTarget.title}
              </p>
              <button
                onClick={() => setViewTarget(null)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
              >
                <FiX />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <StatusBadge status={viewTarget.status} />
              <p className="text-sm text-gray-600 leading-relaxed">
                {viewTarget.description}
              </p>
              {[
                {
                  icon: FiCalendar,
                  value: new Date(viewTarget.date).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
                { icon: FiMapPin, value: viewTarget.location },
                {
                  icon: FiUsers,
                  value: `${viewTarget.faculty} · ${viewTarget.category}`,
                },
              ].map(({ icon: Icon, value }) => (
                <div
                  key={value}
                  className="flex items-center gap-2.5 text-sm text-gray-700"
                >
                  <Icon className="text-gray-400 flex-shrink-0" /> {value}
                </div>
              ))}
              <p className="text-xs text-gray-400">
                Created by {viewTarget.createdBy?.name}
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-2.5">
              <button
                onClick={() => {
                  setViewTarget(null);
                  openEdit(viewTarget);
                }}
                className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <FiEdit2 /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Registrations Modal ── */}
      {regsTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setRegsTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Registrations</p>
                <p className="text-green-300 text-xs mt-0.5 truncate">
                  {regsTarget.title}
                </p>
              </div>
              <button
                onClick={() => setRegsTarget(null)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
              >
                <FiX />
              </button>
            </div>
            <div className="px-6 py-4 max-h-80 overflow-y-auto">
              {regsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin" />
                </div>
              ) : regs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No registrations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {regs.map((r) => (
                    <div
                      key={r._id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {r.student?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {r.student?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {r.student?.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 pb-4">
              <p className="text-xs text-gray-400">{regs.length} registered</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !deleteLoading && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle className="text-red-500 text-lg" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Delete Event</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {deleteTarget.title}
              </p>
              <p className="text-xs text-gray-400">
                {deleteTarget.faculty} · {deleteTarget.category}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                {deleteLoading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiTrash2 className="text-sm" />
                )}
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tiny helpers ─────────────────────────────────────────────────────────────
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
