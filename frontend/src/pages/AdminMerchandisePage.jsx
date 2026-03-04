import { useEffect, useState, useCallback } from "react";
import {
  FiPlus,
  FiShoppingBag,
  FiX,
  FiCheck,
  FiPackage,
  FiAlertCircle,
  FiTag,
  FiUsers,
  FiCalendar,
  FiEye,
  FiTrash2,
  FiEdit2,
  FiSave,
  FiEyeOff,
} from "react-icons/fi";
import api from "../api/axios";

const STATUS_BADGE = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-blue-50  text-blue-600  border-blue-200",
  published: "bg-green-50 text-green-700 border-green-200",
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const EMPTY_FORM = {
  title: "",
  faculty: "",
  event: "",
  batchYear: "",
  description: "",
  imageUrl: "",
  price: "",
  sizeChart: SIZES.map((s) => ({ size: s, quantity: 0 })),
};

function Badge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_BADGE[status]}`}
    >
      {status}
    </span>
  );
}

function FieldInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
      />
    </div>
  );
}

export default function AdminMerchandisePage() {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all | pending | approved | published

  // Add / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = new
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalPage, setModalPage] = useState(1);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // ── Fetch all ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pub, pend, appr] = await Promise.all([
        api.get("/merchandise"),
        api.get("/merchandise/pending"),
        api.get("/merchandise/approved"),
      ]);
      setAllItems([...pend.data, ...appr.data, ...pub.data]);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Derived lists ──────────────────────────────────────────
  const tabItems =
    activeTab === "all"
      ? allItems
      : allItems.filter((i) => i.status === activeTab);

  const counts = allItems.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const handleNextPage = () => {
    setFormError("");
    if (!form.title.trim()) {
      setFormError("Pack title is required.");
      return;
    }
    if (!form.faculty.trim()) {
      setFormError("Faculty is required.");
      return;
    }
    if (!form.event.trim()) {
      setFormError("Event is required.");
      return;
    }
    if (!form.batchYear) {
      setFormError("Batch year is required.");
      return;
    }
    if (!form.price) {
      setFormError("Price is required.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    setModalPage(2);
  };

  // ── Open modal ────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalPage(1);
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      faculty: item.faculty,
      event: item.event,
      batchYear: String(item.batchYear),
      description: item.description,
      imageUrl: item.imageUrl || "",
      price: String(item.price),
      sizeChart: SIZES.map((s) => {
        const found = item.sizeChart?.find((sc) => sc.size === s);
        return { size: s, quantity: found ? found.quantity : 0 };
      }),
    });
    setModalPage(1);
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    const sizeChart = form.sizeChart.filter((s) => s.quantity > 0);
    if (!editingId && sizeChart.length === 0) {
      setFormError("Add stock for at least one size.");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        ...form,
        batchYear: Number(form.batchYear),
        price: Number(form.price),
        sizeChart,
      };
      if (editingId) {
        await api.put(`/merchandise/${editingId}`, payload);
        setFormSuccess("Updated successfully!");
      } else {
        await api.post("/merchandise", payload);
        setFormSuccess("Merchandise pack submitted!");
      }
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess("");
        fetchAll();
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to save.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await api.put(`/merchandise/${id}/approve`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed");
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.put(`/merchandise/${id}/publish`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed");
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await api.put(`/merchandise/${id}/unpublish`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/merchandise/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed");
    }
  };

  const updateSizeQty = (size, qty) =>
    setForm((f) => ({
      ...f,
      sizeChart: f.sizeChart.map((s) =>
        s.size === size ? { ...s, quantity: Math.max(0, Number(qty)) } : s,
      ),
    }));

  const tabs = [
    { id: "all", label: `All (${allItems.length})` },
    { id: "pending", label: `Pending (${counts.pending || 0})` },
    { id: "approved", label: `Approved (${counts.approved || 0})` },
    { id: "published", label: `Published (${counts.published || 0})` },
  ];

  // ── Item row ──────────────────────────────────────────────
  const ItemRow = ({ item }) => (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FiPackage className="text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">
              {item.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {item.description}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 font-medium">
          {item.faculty}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-purple-600 bg-purple-50 rounded-full px-2 py-0.5 font-medium">
          {item.event}
        </span>
      </td>
      <td className="py-3 px-4 text-sm font-bold text-green-800">
        LKR {item.price?.toLocaleString()}
      </td>
      <td className="py-3 px-4">
        <Badge status={item.status} />
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          {/* Edit */}
          <button
            onClick={() => openEdit(item)}
            title="Edit"
            className="p-1.5 rounded-lg text-gray-500 hover:text-green-700 hover:bg-green-50 transition"
          >
            <FiEdit2 className="text-sm" />
          </button>
          {/* Approve (pending) */}
          {item.status === "pending" && (
            <button
              onClick={() => handleApprove(item._id)}
              title="Approve"
              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition"
            >
              <FiCheck className="text-sm" />
            </button>
          )}
          {/* Publish (approved) */}
          {item.status === "approved" && (
            <button
              onClick={() => handlePublish(item._id)}
              title="Publish"
              className="p-1.5 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition"
            >
              <FiEye className="text-sm" />
            </button>
          )}
          {/* Unpublish (published) */}
          {item.status === "published" && (
            <button
              onClick={() => handleUnpublish(item._id)}
              title="Unpublish"
              className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition"
            >
              <FiEyeOff className="text-sm" />
            </button>
          )}
          {/* Delete */}
          <button
            onClick={() => handleDelete(item._id)}
            title="Delete"
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <FiTrash2 className="text-sm" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">
            Merchandise Management
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Add, edit, approve and publish merchandise items
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <FiPlus /> Add New Item
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total",
            value: allItems.length,
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
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <FiAlertCircle className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {counts.pending} item{counts.pending > 1 ? "s" : ""} waiting for
            your approval
          </p>
          <button
            onClick={() => setActiveTab("pending")}
            className="ml-auto text-xs font-semibold text-amber-700 underline hover:text-amber-900"
          >
            Review now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === t.id
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
          <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" />{" "}
          Loading…
        </div>
      ) : tabItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiShoppingBag className="text-5xl mb-3 opacity-40" />
          <p className="text-sm font-medium">No items in this category</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Item
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Faculty
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Event
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Price
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tabItems.map((item) => (
                <ItemRow key={item._id} item={item} />
              ))}
            </tbody>
          </table>
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
            style={{ height: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Left preview panel ── */}
            <div className="w-52 flex-shrink-0 bg-gradient-to-b from-green-900 to-green-800 flex flex-col items-center py-8 px-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center mb-3 flex-shrink-0 overflow-hidden">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiPackage className="text-white/70 text-2xl" />
                )}
              </div>
              <p className="text-white font-bold text-sm text-center leading-snug line-clamp-2 px-1">
                {form.title || "New Item"}
              </p>
              <p className="text-green-300 text-xs mt-1.5 text-center leading-tight">
                {form.faculty || "—"} · {form.event || "—"}
              </p>
              {form.price && (
                <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-green-100">
                  LKR {Number(form.price).toLocaleString()}
                </div>
              )}

              <div className="w-full border-t border-white/10 my-5" />

              <nav className="w-full space-y-1">
                {[
                  { id: 1, icon: FiTag, label: "Item Details" },
                  { id: 2, icon: FiPackage, label: "Stock & Sizing" },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setFormError("");
                      setFormSuccess("");
                      setModalPage(id);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      modalPage === id
                        ? "bg-white/20 text-white"
                        : "text-green-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="flex-shrink-0 text-sm" />
                    <span>{label}</span>
                    {modalPage > id && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-green-500/30 flex items-center justify-center">
                        <FiCheck className="text-[9px] text-green-200" />
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-auto flex gap-2 pt-4">
                {[1, 2].map((p) => (
                  <span
                    key={p}
                    className={`h-2 rounded-full transition-all duration-300 bg-white ${
                      modalPage === p ? "w-6 opacity-100" : "w-2 opacity-30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {editingId ? "Edit Merchandise" : "Add New Merchandise"}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {modalPage === 1
                      ? "Step 1 of 2 — Fill in item details"
                      : "Step 2 of 2 — Set stock quantities"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !formLoading && setShowModal(false)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition mt-0.5"
                >
                  <FiX className="text-base" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  {/* Page 1: Item Details */}
                  {modalPage === 1 && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldInput
                          label="Pack Title"
                          value={form.title}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, title: e.target.value }))
                          }
                          placeholder="e.g. SLIIT Convocation Hoodie"
                        />
                        <FieldInput
                          label="Faculty"
                          value={form.faculty}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, faculty: e.target.value }))
                          }
                          placeholder="e.g. Faculty of Computing"
                        />
                        <FieldInput
                          label="Event"
                          value={form.event}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, event: e.target.value }))
                          }
                          placeholder="e.g. Convocation 2025"
                        />
                        <FieldInput
                          label="Batch Year"
                          type="number"
                          value={form.batchYear}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              batchYear: e.target.value,
                            }))
                          }
                          placeholder="2025"
                        />
                        <FieldInput
                          label="Price (LKR)"
                          type="number"
                          value={form.price}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, price: e.target.value }))
                          }
                          placeholder="1500"
                        />
                        <FieldInput
                          label="Image URL (optional)"
                          value={form.imageUrl}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, imageUrl: e.target.value }))
                          }
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                          Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Short description of the merchandise pack..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Page 2: Stock & Sizing */}
                  {modalPage === 2 && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                          Size Chart <span className="text-red-400">*</span>
                          <span className="normal-case font-normal ml-1">
                            (quantity per size)
                          </span>
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {form.sizeChart.map(({ size, quantity }) => (
                            <div
                              key={size}
                              className="flex flex-col items-center gap-1.5"
                            >
                              <span className="text-xs font-bold text-gray-600 bg-gray-100 rounded-lg px-3 py-1 w-full text-center">
                                {size}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(e) =>
                                  updateSizeQty(size, e.target.value)
                                }
                                className="w-full text-center px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {editingId && (
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                            Status
                          </label>
                          <select
                            value={form.status ?? ""}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, status: e.target.value }))
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none transition"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="published">Published</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex-shrink-0 space-y-3">
                  {formError && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-100">
                      {formError}
                    </p>
                  )}
                  {formSuccess && (
                    <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 border border-green-100">
                      {formSuccess}
                    </p>
                  )}
                  <div className="flex gap-2.5">
                    {modalPage === 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => !formLoading && setShowModal(false)}
                          disabled={formLoading}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleNextPage}
                          className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          Next — Stock &amp; Sizing →
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setFormError("");
                            setFormSuccess("");
                            setModalPage(1);
                          }}
                          disabled={formLoading}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                        >
                          {formLoading ? (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : editingId ? (
                            <FiSave />
                          ) : (
                            <FiTag />
                          )}
                          {formLoading
                            ? "Saving…"
                            : editingId
                              ? "Save Changes"
                              : "Submit for Approval"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
