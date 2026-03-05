import { useEffect, useState, useCallback } from "react";
import {
  FiPlus,
  FiShoppingBag,
  FiFilter,
  FiX,
  FiCheck,
  FiPackage,
  FiCreditCard,
  FiAlertCircle,
  FiCheckCircle,
  FiTag,
  FiUsers,
  FiCalendar,
  FiEye,
  FiTrash2,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const STATUS_BADGE = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-blue-50 text-blue-600 border-blue-200",
  published: "bg-green-50 text-green-700 border-green-200",
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// ─── helpers ─────────────────────────────────────────────────
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
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white focus:border-transparent transition"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function MerchandisePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isOC = user?.role === "oc";
  const canManage = isAdmin || isOC;

  // Data
  const [items, setItems] = useState([]);
  const [pendingItems, setPending] = useState([]);
  const [approvedItems, setApproved] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState("published"); // published | pending | approved | my-orders
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterEvent, setFilterEvent] = useState("");

  // Add Pack modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    faculty: "",
    event: "",
    batchYear: "",
    description: "",
    imageUrl: "",
    price: "",
    sizeChart: SIZES.map((s) => ({ size: s, quantity: 0 })),
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // Purchase modal
  const [buyItem, setBuyItem] = useState(null);
  const [buySize, setBuySize] = useState("");
  const [buyQty, setBuyQty] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState("");

  // ── Fetch data ──────────────────────────────────────────────
  const fetchPublished = useCallback(async () => {
    const params = {};
    if (filterFaculty) params.faculty = filterFaculty;
    if (filterEvent) params.event = filterEvent;
    const res = await api.get("/merchandise", { params });
    setItems(res.data);
  }, [filterFaculty, filterEvent]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPublished();
      if (canManage) {
        const [p, a] = await Promise.all([
          api.get("/merchandise/pending"),
          api.get("/merchandise/approved"),
        ]);
        setPending(p.data);
        setApproved(a.data);
      }
      const ord = await api.get("/orders/my");
      setMyOrders(ord.data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [fetchPublished, canManage]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  useEffect(() => {
    fetchPublished();
  }, [fetchPublished]);

  // ── Add Pack ─────────────────────────────────────────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    const sizeChart = addForm.sizeChart.filter((s) => s.quantity > 0);
    if (sizeChart.length === 0) {
      setAddError("Add stock for at least one size.");
      return;
    }
    setAddLoading(true);
    try {
      await api.post("/merchandise", {
        ...addForm,
        batchYear: Number(addForm.batchYear),
        price: Number(addForm.price),
        sizeChart,
      });
      setAddSuccess("Merchandise pack submitted for admin approval!");
      setAddForm({
        title: "",
        faculty: "",
        event: "",
        batchYear: "",
        description: "",
        imageUrl: "",
        price: "",
        sizeChart: SIZES.map((s) => ({ size: s, quantity: 0 })),
      });
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess("");
        fetchAll();
      }, 1500);
    } catch (err) {
      setAddError(err.response?.data?.message ?? "Failed to submit.");
    } finally {
      setAddLoading(false);
    }
  };

  const updateSizeQty = (size, qty) => {
    setAddForm((f) => ({
      ...f,
      sizeChart: f.sizeChart.map((s) =>
        s.size === size ? { ...s, quantity: Math.max(0, Number(qty)) } : s,
      ),
    }));
  };

  // ── Approve / Publish ────────────────────────────────────────
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

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/merchandise/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed");
    }
  };

  // ── Purchase ─────────────────────────────────────────────────
  const openBuy = (item) => {
    setBuyItem(item);
    setBuySize("");
    setBuyQty(1);
    setBuyError("");
    setBuySuccess("");
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    if (!buySize) {
      setBuyError("Please select a size.");
      return;
    }
    setBuyLoading(true);
    setBuyError("");
    setBuySuccess("");
    try {
      await api.post("/orders", {
        merchandiseId: buyItem._id,
        size: buySize,
        quantity: buyQty,
      });
      setBuySuccess(
        `Purchase successful! Reference: PAY-XXXXXXXX. You'll be notified until you collect your item.`,
      );
      setTimeout(() => {
        setBuyItem(null);
        setBuySuccess("");
        fetchAll();
        setTab("my-orders");
      }, 2000);
    } catch (err) {
      setBuyError(err.response?.data?.message ?? "Payment failed.");
    } finally {
      setBuyLoading(false);
    }
  };

  const handleCollect = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/collect`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed");
    }
  };

  // ── Derived ──────────────────────────────────────────────────
  const uncollected = myOrders.filter(
    (o) => o.paymentStatus === "paid" && !o.collected,
  );

  const faculties = [...new Set(items.map((i) => i.faculty))];
  const events = [...new Set(items.map((i) => i.event))];

  const tabs = [
    { id: "published", label: "Available Items" },
    ...(canManage
      ? [
          {
            id: "pending",
            label: `Pending Approval${pendingItems.length ? ` (${pendingItems.length})` : ""}`,
          },
          { id: "approved", label: "Approved" },
        ]
      : []),
    {
      id: "my-orders",
      label: `My Orders${uncollected.length ? ` 🔴 ${uncollected.length}` : ""}`,
    },
  ];

  // ── Item card ─────────────────────────────────────────────────
  const ItemCard = ({ item, actions }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <div className="h-40 bg-gray-100 relative overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <FiPackage className="text-5xl" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge status={item.status} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {item.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 font-medium">
            <FiUsers className="text-xs" />
            {item.faculty}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 bg-purple-50 rounded-full px-2 py-0.5 font-medium">
            <FiCalendar className="text-xs" />
            {item.event}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
            Batch {item.batchYear}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-green-800">
            LKR {item.price?.toLocaleString()}
          </span>
          <div className="flex gap-1.5">{actions}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {item.sizeChart
            ?.filter((s) => s.quantity > 0)
            .map((s) => (
              <span
                key={s.size}
                className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 font-semibold"
              >
                {s.size}: {s.quantity}
              </span>
            ))}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Persistent uncollected notification banner */}
      {uncollected.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <FiAlertCircle className="text-amber-500 text-xl flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              You have {uncollected.length} item
              {uncollected.length > 1 ? "s" : ""} ready for collection
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Visit the booth to collect your merchandise. This notification
              persists until collected.
            </p>
          </div>
          <button
            onClick={() => setTab("my-orders")}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
          >
            View orders
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Merchandise</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Browse and manage event merchandise
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setAddError("");
              setAddSuccess("");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition"
          >
            <FiPlus /> Add New Pack
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t.id
                ? "bg-green-800 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (published tab only) */}
      {tab === "published" && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none"
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none"
            >
              <option value="">All Events</option>
              {events.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          {(filterFaculty || filterEvent) && (
            <button
              onClick={() => {
                setFilterFaculty("");
                setFilterEvent("");
              }}
              className="px-3 py-2 rounded-xl border border-red-200 text-xs text-red-500 hover:bg-red-50 font-semibold transition flex items-center gap-1"
            >
              <FiX /> Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" />{" "}
          Loading…
        </div>
      ) : (
        <>
          {/* ── Published tab ── */}
          {tab === "published" &&
            (items.length === 0 ? (
              <EmptyState message="No merchandise available yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    actions={[
                      <button
                        key="buy"
                        onClick={() => openBuy(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-xs font-semibold transition"
                      >
                        <FiCreditCard className="text-xs" /> Buy
                      </button>,
                    ]}
                  />
                ))}
              </div>
            ))}

          {/* ── Pending tab ── */}
          {tab === "pending" &&
            canManage &&
            (pendingItems.length === 0 ? (
              <EmptyState message="No items pending approval." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingItems.map((item) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    actions={[
                      isAdmin && (
                        <button
                          key="approve"
                          onClick={() => handleApprove(item._id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                        >
                          <FiCheck /> Approve
                        </button>
                      ),
                      <button
                        key="del"
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
                      >
                        <FiTrash2 className="text-xs" />
                      </button>,
                    ].filter(Boolean)}
                  />
                ))}
              </div>
            ))}

          {/* ── Approved tab ── */}
          {tab === "approved" &&
            canManage &&
            (approvedItems.length === 0 ? (
              <EmptyState message="No approved items waiting to be published." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedItems.map((item) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    actions={[
                      <button
                        key="pub"
                        onClick={() => handlePublish(item._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition"
                      >
                        <FiEye /> Publish
                      </button>,
                      <button
                        key="del"
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
                      >
                        <FiTrash2 className="text-xs" />
                      </button>,
                    ]}
                  />
                ))}
              </div>
            ))}

          {/* ── My Orders tab ── */}
          {tab === "my-orders" &&
            (myOrders.length === 0 ? (
              <EmptyState message="You haven't purchased anything yet." />
            ) : (
              <div className="space-y-3">
                {myOrders.map((order) => (
                  <div
                    key={order._id}
                    className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm ${!order.collected && order.paymentStatus === "paid" ? "border-amber-200 bg-amber-50/30" : "border-gray-100"}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {order.merchandise?.imageUrl ? (
                        <img
                          src={order.merchandise.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiPackage className="text-gray-400 text-xl" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-none">
                        {order.merchandise?.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.merchandise?.faculty} ·{" "}
                        {order.merchandise?.event}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
                          Size: {order.size}
                        </span>
                        <span className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
                          Qty: {order.quantity}
                        </span>
                        <span className="text-xs font-bold text-green-800">
                          LKR {order.totalAmount?.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {order.paymentReference}
                        </span>
                      </div>
                      {/* Time slot assigned by admin */}
                      {order.timeSlot && !order.collected && (
                        <div className="mt-2 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5">
                          <FiClock className="text-indigo-500 text-xs flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide leading-none">
                              Your Collection Slot
                            </p>
                            <p className="text-xs font-semibold text-indigo-800 mt-0.5">
                              {new Date(order.timeSlot).toLocaleString(
                                undefined,
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {!order.collected && order.paymentStatus === "paid" ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full px-2.5 py-1 border border-amber-200">
                            <FiAlertCircle className="text-xs" /> Pending
                            Collection
                          </span>
                          {canManage && (
                            <button
                              onClick={() => handleCollect(order._id)}
                              className="text-[11px] font-semibold text-green-700 hover:text-green-900 underline"
                            >
                              Mark Collected
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 rounded-full px-2.5 py-1 border border-green-200">
                          <FiCheckCircle className="text-xs" /> Collected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </>
      )}

      {/* ─── Add Pack Modal ─── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !addLoading && setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-green-900 to-green-800 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="text-white font-bold text-base">
                  Add New Merchandise Pack
                </p>
                <p className="text-green-200 text-xs mt-0.5">
                  Submitted packs go to admin for approval
                </p>
              </div>
              <button
                onClick={() => !addLoading && setShowAddModal(false)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="px-6 py-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldInput
                  label="Pack Title"
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. SLIIT Convocation Hoodie"
                  required
                />
                <FieldInput
                  label="Faculty"
                  value={addForm.faculty}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, faculty: e.target.value }))
                  }
                  placeholder="e.g. Faculty of Computing"
                  required
                />
                <FieldInput
                  label="Event"
                  value={addForm.event}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, event: e.target.value }))
                  }
                  placeholder="e.g. Convocation 2025"
                  required
                />
                <FieldInput
                  label="Batch Year"
                  type="number"
                  value={addForm.batchYear}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, batchYear: e.target.value }))
                  }
                  placeholder="2025"
                  required
                />
                <FieldInput
                  label="Price (LKR)"
                  type="number"
                  value={addForm.price}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="1500"
                  required
                />
                <FieldInput
                  label="Image URL (optional)"
                  value={addForm.imageUrl}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={addForm.description}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, description: e.target.value }))
                  }
                  required
                  rows={3}
                  placeholder="Short description of the merchandise pack..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white focus:border-transparent transition resize-none"
                />
              </div>

              {/* Size Chart */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Size Chart <span className="text-red-400">*</span>{" "}
                  <span className="normal-case font-normal">
                    (enter quantity per size)
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {addForm.sizeChart.map(({ size, quantity }) => (
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
                        onChange={(e) => updateSizeQty(size, e.target.value)}
                        className="w-full text-center px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {addError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
                  {addError}
                </p>
              )}
              {addSuccess && (
                <p className="text-xs text-green-700 bg-green-50 rounded-xl px-4 py-2.5 border border-green-100">
                  {addSuccess}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => !addLoading && setShowAddModal(false)}
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {addLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiTag />
                  )}
                  {addLoading ? "Submitting…" : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Purchase Modal ─── */}
      {buyItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !buyLoading && setBuyItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base">Purchase Item</p>
                <p className="text-green-200 text-xs mt-0.5">
                  Secure online payment
                </p>
              </div>
              <button
                onClick={() => !buyLoading && setBuyItem(null)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleBuy} className="px-6 py-6 space-y-5">
              {/* Item summary */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                  {buyItem.imageUrl ? (
                    <img
                      src={buyItem.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPackage className="text-gray-400 text-2xl" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {buyItem.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {buyItem.faculty} · {buyItem.event}
                  </p>
                  <p className="text-base font-extrabold text-green-800 mt-1">
                    LKR {buyItem.price?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Size selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Select Size <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {buyItem.sizeChart
                    ?.filter((s) => s.quantity > 0)
                    .map((s) => (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => setBuySize(s.size)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
                          buySize === s.size
                            ? "border-green-700 bg-green-50 text-green-800"
                            : "border-gray-200 text-gray-600 hover:border-green-400"
                        }`}
                      >
                        {s.size}
                        <span className="ml-1 text-[10px] font-normal text-gray-400">
                          ({s.quantity})
                        </span>
                      </button>
                    ))}
                  {buyItem.sizeChart?.every((s) => s.quantity === 0) && (
                    <p className="text-sm text-red-500">Out of stock</p>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-lg transition"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">
                    {buyQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBuyQty((q) => q + 1)}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-lg transition"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    Total:{" "}
                    <span className="font-extrabold text-green-800">
                      LKR {(buyItem.price * buyQty).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>

              {/* Simulated payment note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <FiCreditCard className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Payment is processed securely. A persistent notification will
                  appear in your profile until you collect the item.
                </p>
              </div>

              {buyError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
                  {buyError}
                </p>
              )}
              {buySuccess && (
                <p className="text-xs text-green-700 bg-green-50 rounded-xl px-4 py-2.5 border border-green-100 flex items-center gap-2">
                  <FiCheckCircle />
                  {buySuccess}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => !buyLoading && setBuyItem(null)}
                  disabled={buyLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={buyLoading || !buySize}
                  className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {buyLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiCreditCard />
                  )}
                  {buyLoading
                    ? "Processing…"
                    : `Pay LKR ${(buyItem.price * buyQty).toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <FiShoppingBag className="text-5xl mb-3 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
