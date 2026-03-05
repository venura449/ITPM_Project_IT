import { useEffect, useState, useCallback } from "react";
import {
  FiClock,
  FiRefreshCw,
  FiCheck,
  FiAlertCircle,
  FiCheckCircle,
  FiPackage,
} from "react-icons/fi";
import api from "../api/axios";

export default function AdminOrderSlotsPage() {
  const [allMerchandise, setAllMerchandise] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // view filter (independent of generate config)
  const [filterMerchandiseId, setFilterMerchandiseId] = useState("");

  // generation config
  const [config, setConfig] = useState({
    merchandiseId: "",
    startDate: "",
    slotDurationMinutes: 30,
    itemsPerSlot: 5,
  });

  // ── fetch all merchandise for dropdowns ─────────────────
  const fetchMerchandise = useCallback(async () => {
    try {
      const [pub, pend, appr] = await Promise.all([
        api.get("/merchandise"),
        api.get("/merchandise/pending"),
        api.get("/merchandise/approved"),
      ]);
      setAllMerchandise([...pub.data, ...pend.data, ...appr.data]);
    } catch (_) {}
  }, []);

  // ── fetch slot orders (re-runs on view filter change) ───
  const fetchSlotOrders = useCallback(async (merchandiseId) => {
    setLoading(true);
    try {
      const params = {};
      if (merchandiseId) params.merchandiseId = merchandiseId;
      const res = await api.get("/orders/slots", { params });
      setOrders(res.data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchandise();
  }, [fetchMerchandise]);
  useEffect(() => {
    fetchSlotOrders(filterMerchandiseId);
  }, [filterMerchandiseId, fetchSlotOrders]);

  // ── FIFO slot generation ────────────────────────────────
  const handleGenerate = async () => {
    setError("");
    setSuccess("");
    if (!config.startDate) {
      setError("Please select a start date and time.");
      return;
    }
    if (
      Number(config.itemsPerSlot) < 1 ||
      Number(config.slotDurationMinutes) < 1
    ) {
      setError("Items per slot and slot duration must be at least 1.");
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post("/orders/assign-slots", {
        merchandiseId: config.merchandiseId || undefined,
        startDate: config.startDate,
        slotDurationMinutes: Number(config.slotDurationMinutes),
        itemsPerSlot: Number(config.itemsPerSlot),
      });
      setOrders(res.data);
      setFilterMerchandiseId(config.merchandiseId); // sync view filter
      setSuccess(
        `FIFO scheduling complete — ${res.data.length} order(s) assigned time slots.`,
      );
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to assign slots.");
    } finally {
      setGenerating(false);
    }
  };

  // ── mark handed over ────────────────────────────────────
  const handleMarkHandedOver = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/collect`);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, collected: true } : o)),
      );
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to update.");
    }
  };

  // ── group orders by time slot ───────────────────────────
  const grouped = orders.reduce((acc, order) => {
    const key = order.timeSlot
      ? new Date(order.timeSlot).toISOString()
      : "__unassigned__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "__unassigned__") return 1;
    if (b === "__unassigned__") return -1;
    return new Date(a) - new Date(b);
  });

  const formatStart = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatEnd = (iso) => {
    const end = new Date(
      new Date(iso).getTime() + Number(config.slotDurationMinutes) * 60_000,
    );
    return end.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── stats ───────────────────────────────────────────────
  const total = orders.length;
  const withSlot = orders.filter((o) => o.timeSlot).length;
  const handedOver = orders.filter((o) => o.collected).length;
  const pending = total - handedOver;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">
            Collection Time Slots
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            FIFO scheduling — earliest orders receive the earliest collection
            slots
          </p>
        </div>
        <button
          onClick={() => fetchSlotOrders(filterMerchandiseId)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Config panel ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Slot Generation — FIFO Algorithm
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Orders are sorted oldest-first (FIFO). The first <strong>N</strong>{" "}
          participants share slot 1, the next <strong>N</strong> share slot 2,
          and so on.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Merchandise */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Merchandise
            </label>
            <select
              value={config.merchandiseId}
              onChange={(e) =>
                setConfig((c) => ({ ...c, merchandiseId: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none transition"
            >
              <option value="">All Merchandise</option>
              {allMerchandise.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Start date/time */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Start Date & Time <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={config.startDate}
              onChange={(e) =>
                setConfig((c) => ({ ...c, startDate: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 transition"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Slot Duration
            </label>
            <select
              value={config.slotDurationMinutes}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  slotDurationMinutes: Number(e.target.value),
                }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none transition"
            >
              {[10, 15, 20, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>

          {/* Items per slot */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Items per Slot
            </label>
            <input
              type="number"
              min="1"
              value={config.itemsPerSlot}
              onChange={(e) =>
                setConfig((c) => ({ ...c, itemsPerSlot: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 transition"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 mb-3 border border-red-100 flex items-center gap-2">
            <FiAlertCircle className="flex-shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 mb-3 border border-green-100 flex items-center gap-2">
            <FiCheckCircle className="flex-shrink-0" />
            {success}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-60 shadow-sm"
        >
          {generating ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <FiClock />
          )}
          {generating ? "Generating…" : "Generate / Re-assign Time Slots"}
        </button>
        <p className="text-[11px] text-gray-400 mt-2">
          Re-generating overwrites existing slot assignments.
        </p>
      </div>

      {/* ── Stats strip ──────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total Orders",
            value: total,
            color: "text-gray-700 bg-gray-50 border-gray-200",
          },
          {
            label: "Slots Assigned",
            value: withSlot,
            color: "text-blue-600 bg-blue-50 border-blue-200",
          },
          {
            label: "Pending Handover",
            value: pending,
            color: "text-amber-600 bg-amber-50 border-amber-200",
          },
          {
            label: "Handed Over",
            value: handedOver,
            color: "text-green-700 bg-green-50 border-green-200",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border px-4 py-3 ${color}`}>
            <p className="text-2xl font-extrabold leading-none">{value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* ── View filter ──────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
          Filter view:
        </label>
        <select
          value={filterMerchandiseId}
          onChange={(e) => setFilterMerchandiseId(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none transition"
        >
          <option value="">All Merchandise</option>
          {allMerchandise.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {/* ── Slot groups ───────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" />
          Loading…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiPackage className="text-5xl mb-3 opacity-40" />
          <p className="text-sm font-medium">No paid orders found.</p>
          <p className="text-xs mt-1 opacity-60">
            Generate time slots above once orders have been placed.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedKeys.map((slotKey) => {
            const slotList = grouped[slotKey];
            const isUnassigned = slotKey === "__unassigned__";
            const allDone = slotList.every((o) => o.collected);

            return (
              <div
                key={slotKey}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Slot header */}
                <div
                  className={`px-5 py-3 flex flex-wrap items-center gap-3 border-b ${
                    isUnassigned
                      ? "bg-gray-50 border-gray-200"
                      : allDone
                        ? "bg-green-50 border-green-100"
                        : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <FiClock
                    className={`text-sm flex-shrink-0 ${
                      isUnassigned
                        ? "text-gray-400"
                        : allDone
                          ? "text-green-600"
                          : "text-blue-500"
                    }`}
                  />
                  <span
                    className={`font-bold text-sm flex-1 ${
                      isUnassigned
                        ? "text-gray-500"
                        : allDone
                          ? "text-green-700"
                          : "text-blue-700"
                    }`}
                  >
                    {isUnassigned ? "No Slot Assigned" : formatStart(slotKey)}
                    {!isUnassigned && (
                      <span className="font-normal text-xs ml-1 opacity-70">
                        — {formatEnd(slotKey)}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      isUnassigned
                        ? "bg-gray-100 text-gray-600 border-gray-200"
                        : allDone
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                    }`}
                  >
                    {slotList.length} participant
                    {slotList.length !== 1 ? "s" : ""}
                  </span>
                  {!isUnassigned && allDone && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                      <FiCheck className="text-xs" /> All Handed Over
                    </span>
                  )}
                </div>

                {/* Orders table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50/60 border-b border-gray-100">
                        {[
                          "#",
                          "Student",
                          "Item",
                          "Size",
                          "Qty",
                          "Ordered On",
                          "Handed Over",
                        ].map((h) => (
                          <th
                            key={h}
                            className="py-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slotList.map((order, idx) => (
                        <tr
                          key={order._id}
                          className={`border-b border-gray-100 last:border-0 transition ${
                            order.collected
                              ? "bg-green-50/30 opacity-70"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="py-3 px-4 text-xs text-gray-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-bold text-gray-900 leading-none">
                              {order.student?.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {order.student?.email}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-semibold text-gray-800 leading-none line-clamp-1">
                              {order.merchandise?.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {order.merchandise?.faculty}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-bold bg-gray-100 text-gray-700 rounded-lg px-2.5 py-1">
                              {order.size}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-gray-700">
                            {order.quantity}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={order.collected}
                                onChange={() =>
                                  !order.collected &&
                                  handleMarkHandedOver(order._id)
                                }
                                disabled={order.collected}
                                className="w-4 h-4 rounded accent-green-700 cursor-pointer disabled:cursor-default"
                              />
                              <span
                                className={`text-xs font-semibold ${
                                  order.collected
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {order.collected ? "Handed Over" : "Mark Done"}
                              </span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
