import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiShoppingBag,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiMenu,
  FiX,
  FiEdit2,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSave,
  FiMail,
  FiAward,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
  FiStar,
  FiTrendingUp,
  FiArrowRight,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import MerchandisePage from "./MerchandisePage";
import EventsPage from "./EventsPage";
import OCApplicationPage from "./OCApplicationPage";

const roleColors = {
  admin: "bg-red-100 text-red-700",
  oc: "bg-amber-100 text-amber-700",
  participant: "bg-green-100 text-green-700",
};
const roleLabels = {
  admin: "Admin",
  oc: "Organising Committee",
  participant: "Participant",
};

const navItems = [
  { icon: FiHome, label: "Dashboard", id: "dashboard" },
  { icon: FiShoppingBag, label: "Merchandise", id: "merchandise" },
  { icon: FiCalendar, label: "Events", id: "events" },
  { icon: FiAward, label: "Apply for OC", id: "oc-apply" },
];

const moduleCards = [
  {
    icon: FiShoppingBag,
    title: "Merchandise",
    desc: "Browse & order event items",
    color: "bg-purple-50 text-purple-600",
    border: "hover:border-purple-200",
    id: "merchandise",
  },
  {
    icon: FiCalendar,
    title: "Events",
    desc: "Explore upcoming events",
    color: "bg-blue-50 text-blue-600",
    border: "hover:border-blue-200",
    id: "events",
  },
  {
    icon: FiAward,
    title: "Apply for OC",
    desc: "Join the organising committee",
    color: "bg-amber-50 text-amber-600",
    border: "hover:border-amber-200",
    id: "oc-apply",
  },
];

// ── Mini score bar ────────────────────────────────────────────
function ScoreMiniBar({ value, max, color }) {
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

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("dashboard");

  // ── Dashboard data ─────────────────────────────────────────
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  const fetchDashData = useCallback(async () => {
    setDashLoading(true);
    try {
      const [ordersRes, scoreRes, appsRes, eventsRes] =
        await Promise.allSettled([
          api.get("/orders/my"),
          api.get("/oc-applications/my-score"),
          api.get("/oc-applications/my"),
          api.get("/events"),
        ]);
      setDashData({
        orders: ordersRes.status === "fulfilled" ? ordersRes.value.data : [],
        score: scoreRes.status === "fulfilled" ? scoreRes.value.data : null,
        apps: appsRes.status === "fulfilled" ? appsRes.value.data : [],
        events: eventsRes.status === "fulfilled" ? eventsRes.value.data : [],
      });
    } catch (_) {
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active === "dashboard") fetchDashData();
  }, [active, fetchDashData]);
  // ── Profile modal state ────────────────────────────────────
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalPage, setModalPage] = useState(1); // 1 = profile info, 2 = change password
  const [nameForm, setNameForm] = useState({ name: "" });
  const [passForm, setPassForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const openProfileModal = () => {
    setNameForm({ name: user?.name ?? "" });
    setPassForm({ current: "", newPass: "", confirm: "" });
    setShowPass({ current: false, newPass: false, confirm: false });
    setModalPage(1);
    setModalError("");
    setModalSuccess("");
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    if (modalLoading) return;
    setShowProfileModal(false);
  };

  const goToPage = (page) => {
    setModalError("");
    setModalSuccess("");
    setModalPage(page);
  };

  const handleNameSave = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    if (!nameForm.name.trim()) {
      setModalError("Name cannot be empty.");
      return;
    }
    setModalLoading(true);
    try {
      const res = await api.put("/auth/profile", { name: nameForm.name });
      updateUser(res.data.user);
      setModalSuccess("Name updated successfully!");
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (err) {
      setModalError(err.response?.data?.message ?? "Failed to update name.");
    } finally {
      setModalLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    if (!passForm.current) {
      setModalError("Current password is required.");
      return;
    }
    if (passForm.newPass.length < 6) {
      setModalError("New password must be at least 6 characters.");
      return;
    }
    if (passForm.newPass !== passForm.confirm) {
      setModalError("Passwords do not match.");
      return;
    }
    setModalLoading(true);
    try {
      await api.put("/auth/profile", {
        currentPassword: passForm.current,
        newPassword: passForm.newPass,
      });
      setModalSuccess("Password changed successfully!");
      setPassForm({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (err) {
      setModalError(
        err.response?.data?.message ?? "Failed to change password.",
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        className={`relative flex flex-col bg-gradient-to-b from-green-900 to-green-800 transition-all duration-300 ease-in-out flex-shrink-0 rounded-r-3xl ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {/* Logo row */}
        <div className="flex items-center h-16 px-3 flex-shrink-0">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-green-800"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {!collapsed && (
            <span className="ml-2.5 text-white font-bold text-base tracking-tight whitespace-nowrap">
              SLIIT Events
            </span>
          )}
        </div>

        {/* Collapse / expand tab — pinned to the right edge */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-5 -right-3 z-10 w-6 h-6 bg-green-700 hover:bg-green-600 border border-green-600 text-white rounded-full flex items-center justify-center shadow-md transition"
        >
          {collapsed ? (
            <FiChevronRight className="text-xs" />
          ) : (
            <FiChevronLeft className="text-xs" />
          )}
        </button>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-green-200 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon
                  className={`flex-shrink-0 text-lg ${isActive ? "text-white" : "text-green-300 group-hover:text-white"}`}
                />
                {!collapsed && (
                  <span className="whitespace-nowrap">{label}</span>
                )}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Settings + Logout */}
        <div className="px-2 pb-4 space-y-1">
          <button
            title={collapsed ? "Settings" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-200 hover:bg-white/10 hover:text-white transition ${collapsed ? "justify-center" : ""}`}
          >
            <FiSettings className="flex-shrink-0 text-lg text-green-300" />
            {!collapsed && <span>Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition ${collapsed ? "justify-center" : ""}`}
          >
            <FiLogOut className="flex-shrink-0 text-lg" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <FiMenu className="text-lg" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">
                {navItems.find((n) => n.id === active)?.label ?? "Dashboard"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                SLIIT Events Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
              <FiBell className="text-lg" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-700 rounded-full" />
            </button>

            {/* Profile card */}
            <div
              onClick={openProfileModal}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-none">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      user?.role === "admin"
                        ? "text-red-500"
                        : user?.role === "oc"
                          ? "text-amber-500"
                          : "text-green-600"
                    }`}
                  >
                    {roleLabels[user?.role] ?? user?.role}
                  </span>
                </p>
              </div>
              <FiChevronRight className="text-gray-400 text-xs hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {active === "merchandise" ? (
            <MerchandisePage />
          ) : active === "events" ? (
            <EventsPage />
          ) : active === "oc-apply" ? (
            <OCApplicationPage />
          ) : (
            /* ══════════════ DASHBOARD HOME ══════════════ */
            <div className="p-6 space-y-6">
              {/* ── Hero banner ─────────────────────────────── */}
              <div className="bg-gradient-to-r from-green-900 via-green-800 to-green-700 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
                <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/10 rounded-full pointer-events-none" />
                <div className="absolute -bottom-10 right-28 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
                <div className="relative">
                  <p className="text-green-300 text-sm font-medium mb-1">
                    Welcome back 👋
                  </p>
                  <h2 className="text-white text-2xl font-extrabold leading-tight">
                    {user?.name}
                  </h2>
                  <p className="text-green-300 text-xs mt-1">{user?.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                      Participant
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-green-100">
                      <FiClock className="text-xs" />
                      Member since{" "}
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(
                            undefined,
                            { month: "short", year: "numeric" },
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="relative hidden sm:flex w-20 h-20 bg-white/20 rounded-2xl items-center justify-center text-white font-extrabold text-3xl flex-shrink-0 ring-2 ring-white/20">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              </div>

              {dashLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
                  <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin" />
                  Loading your dashboard…
                </div>
              ) : (
                <>
                  {/* ── Uncollected order alert ──────────────── */}
                  {(() => {
                    const uncollected = (dashData?.orders ?? []).filter(
                      (o) => o.paymentStatus === "paid" && !o.collected,
                    );
                    return uncollected.length > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                        <FiAlertCircle className="text-amber-500 text-xl flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-800">
                            {uncollected.length} item
                            {uncollected.length > 1 ? "s" : ""} awaiting
                            collection
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Visit the merchandise booth to collect your item(s).
                          </p>
                        </div>
                        <button
                          onClick={() => setActive("merchandise")}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline flex-shrink-0"
                        >
                          View orders
                        </button>
                      </div>
                    ) : null;
                  })()}

                  {/* ── Stats row ───────────────────────────── */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        label: "My Orders",
                        value: dashData?.orders?.length ?? 0,
                        sub: `${(dashData?.orders ?? []).filter((o) => o.collected).length} collected`,
                        icon: FiShoppingBag,
                        color: "text-purple-600 bg-purple-50",
                      },
                      {
                        label: "Events",
                        value: dashData?.events?.length ?? 0,
                        sub: "published events",
                        icon: FiCalendar,
                        color: "text-blue-600 bg-blue-50",
                      },
                      {
                        label: "Engagement",
                        value: dashData?.score?.total ?? 0,
                        sub: "activity pts",
                        icon: FiTrendingUp,
                        color: "text-amber-600 bg-amber-50",
                      },
                      {
                        label: "OC Applications",
                        value: dashData?.apps?.length ?? 0,
                        sub: `${(dashData?.apps ?? []).filter((a) => a.status === "accepted").length} accepted`,
                        icon: FiAward,
                        color: "text-green-700 bg-green-50",
                      },
                    ].map(({ label, value, sub, icon: Icon, color }) => (
                      <div
                        key={label}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                      >
                        <div
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 text-lg ${color}`}
                        >
                          <Icon />
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900">
                          {value}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                        <p className="text-xs font-semibold text-gray-500 mt-1">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ── Two-column: Profile stats + Recent orders ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Profile engagement card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-900">
                          Engagement Score
                        </p>
                        {dashData?.score?.suggested && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
                            <FiStar className="text-xs" /> OC Recommended
                          </span>
                        )}
                      </div>

                      {/* Big score */}
                      <div className="flex items-center gap-4 mb-5">
                        <div
                          className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${dashData?.score?.suggested ? "bg-gradient-to-br from-amber-400 to-amber-500" : "bg-gradient-to-br from-green-800 to-green-600"}`}
                        >
                          <FiAward className="text-white text-lg mb-0.5" />
                          <span className="text-white font-extrabold text-lg leading-none">
                            {dashData?.score?.total ?? 0}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2.5">
                          {/* Account age */}
                          <div className="flex items-center gap-2">
                            <FiUser className="text-blue-500 text-xs flex-shrink-0 w-3" />
                            <span className="text-[11px] text-gray-500 w-20 flex-shrink-0">
                              Account Age
                            </span>
                            <ScoreMiniBar
                              value={dashData?.score?.accountAgeScore ?? 0}
                              max={50}
                              color="bg-blue-400"
                            />
                            <span className="text-[11px] font-bold text-gray-500 w-8 text-right">
                              {dashData?.score?.accountAgeScore ?? 0}
                            </span>
                          </div>
                          {/* Merchandise */}
                          <div className="flex items-center gap-2">
                            <FiShoppingBag className="text-purple-500 text-xs flex-shrink-0 w-3" />
                            <span className="text-[11px] text-gray-500 w-20 flex-shrink-0">
                              Purchases
                            </span>
                            <ScoreMiniBar
                              value={dashData?.score?.merchandiseScore ?? 0}
                              max={Math.max(
                                dashData?.score?.merchandiseScore ?? 0,
                                60,
                              )}
                              color="bg-purple-400"
                            />
                            <span className="text-[11px] font-bold text-gray-500 w-8 text-right">
                              {dashData?.score?.merchandiseScore ?? 0}
                            </span>
                          </div>
                          {/* Login streak */}
                          <div className="flex items-center gap-2">
                            <FiClock className="text-green-600 text-xs flex-shrink-0 w-3" />
                            <span className="text-[11px] text-gray-500 w-20 flex-shrink-0">
                              Login Streak
                            </span>
                            <ScoreMiniBar
                              value={dashData?.score?.loginStreakScore ?? 0}
                              max={90}
                              color="bg-green-500"
                            />
                            <span className="text-[11px] font-bold text-gray-500 w-8 text-right">
                              {dashData?.score?.loginStreakScore ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Profile detail grid */}
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                        {[
                          {
                            label: "Days Active",
                            value: dashData?.score?.daysSinceJoin ?? 0,
                            icon: FiCalendar,
                            color: "text-blue-600",
                          },
                          {
                            label: "Login Streak",
                            value: `${dashData?.score?.loginStreak ?? 0}d`,
                            icon: FiClock,
                            color: "text-green-600",
                          },
                          {
                            label: "Orders Made",
                            value: dashData?.score?.orderCount ?? 0,
                            icon: FiPackage,
                            color: "text-purple-600",
                          },
                        ].map(({ label, value, icon: Icon, color }) => (
                          <div key={label} className="text-center py-2">
                            <Icon className={`text-lg mx-auto mb-1 ${color}`} />
                            <p className="text-base font-extrabold text-gray-900">
                              {value}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setActive("oc-apply")}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-200 text-green-800 text-sm font-semibold hover:bg-green-50 transition"
                      >
                        <FiAward className="text-sm" /> View OC Application
                        <FiArrowRight className="text-xs ml-auto" />
                      </button>
                    </div>

                    {/* Recent orders */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-900">
                          Recent Orders
                        </p>
                        <button
                          onClick={() => setActive("merchandise")}
                          className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center gap-1"
                        >
                          View all <FiArrowRight className="text-xs" />
                        </button>
                      </div>

                      {(dashData?.orders ?? []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                          <FiShoppingBag className="text-4xl mb-2 opacity-30" />
                          <p className="text-xs font-medium">No orders yet</p>
                          <button
                            onClick={() => setActive("merchandise")}
                            className="mt-3 text-xs text-green-700 font-semibold underline"
                          >
                            Browse merchandise
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(dashData?.orders ?? []).slice(0, 4).map((order) => (
                            <div
                              key={order._id}
                              className={`flex items-center gap-3 p-3 rounded-xl border ${!order.collected && order.paymentStatus === "paid" ? "border-amber-200 bg-amber-50/30" : "border-gray-100 bg-gray-50/50"}`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {order.merchandise?.imageUrl ? (
                                  <img
                                    src={order.merchandise.imageUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FiPackage className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 leading-none line-clamp-1">
                                  {order.merchandise?.title ?? "Item"}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  Size {order.size} · Qty {order.quantity}
                                </p>
                                {order.timeSlot && !order.collected && (
                                  <p className="text-[10px] text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                                    <FiClock className="text-[10px]" />
                                    Slot:{" "}
                                    {new Date(order.timeSlot).toLocaleString(
                                      undefined,
                                      {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </p>
                                )}
                              </div>
                              {order.collected ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 flex-shrink-0">
                                  <FiCheckCircle className="text-xs" /> Done
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex-shrink-0">
                                  <FiAlertCircle className="text-xs" /> Pending
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── OC Applications summary ──────────────── */}
                  {(dashData?.apps ?? []).length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-900">
                          My OC Applications
                        </p>
                        <button
                          onClick={() => setActive("oc-apply")}
                          className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center gap-1"
                        >
                          Manage <FiArrowRight className="text-xs" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(dashData?.apps ?? []).slice(0, 3).map((app) => {
                          const statusCfg = {
                            pending: {
                              cls: "text-amber-600 bg-amber-50 border-amber-200",
                              label: "Under Review",
                            },
                            accepted: {
                              cls: "text-green-700 bg-green-50 border-green-200",
                              label: "Accepted",
                            },
                            rejected: {
                              cls: "text-red-600   bg-red-50   border-red-200",
                              label: "Rejected",
                            },
                          }[app.status] ?? {
                            cls: "text-gray-500 bg-gray-50 border-gray-200",
                            label: app.status,
                          };
                          return (
                            <div
                              key={app._id}
                              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                            >
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                <FiCalendar className="text-green-700 text-sm" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 line-clamp-1">
                                  {app.eventName}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {app.score} pts
                                </p>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusCfg.cls}`}
                              >
                                {statusCfg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Quick access cards ───────────────────── */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Quick Access
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {moduleCards.map(
                        ({ icon: Icon, title, desc, color, border, id }) => (
                          <button
                            key={id}
                            onClick={() => setActive(id)}
                            className={`text-left bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md ${border} hover:border transition-all duration-200 group`}
                          >
                            <div
                              className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 text-xl ${color}`}
                            >
                              <Icon />
                            </div>
                            <p className="font-bold text-gray-900 text-sm mb-1">
                              {title}
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {desc}
                            </p>
                            <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-gray-400 group-hover:text-green-700 transition">
                              Go <FiArrowRight className="text-xs" />
                            </div>
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
      {/* ── Edit Profile Modal ─────────────────────────────── */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={closeProfileModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex"
            style={{ minHeight: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Left panel: identity + nav ── */}
            <div className="w-56 flex-shrink-0 bg-gradient-to-b from-green-900 to-green-800 flex flex-col items-center py-8 px-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-white font-extrabold text-2xl mb-3 flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <p className="text-white font-bold text-sm text-center leading-snug">
                {user?.name}
              </p>
              <p className="text-green-300 text-xs mt-1 text-center break-all leading-tight">
                {user?.email}
              </p>
              <div
                className={`mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  user?.role === "admin"
                    ? "bg-red-500/20 text-red-300"
                    : user?.role === "oc"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-green-500/20 text-green-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {roleLabels[user?.role] ?? user?.role}
              </div>

              <div className="w-full border-t border-white/10 my-5" />

              <nav className="w-full space-y-1">
                <button
                  onClick={() => goToPage(1)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    modalPage === 1
                      ? "bg-white/20 text-white"
                      : "text-green-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FiEdit2 className="flex-shrink-0" /> Profile Info
                </button>
                <button
                  onClick={() => goToPage(2)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    modalPage === 2
                      ? "bg-white/20 text-white"
                      : "text-green-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FiLock className="flex-shrink-0" /> Change Password
                </button>
              </nav>
            </div>

            {/* ── Right panel: form content ── */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Right header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {modalPage === 1
                      ? "Profile Information"
                      : "Change Password"}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {modalPage === 1
                      ? "Update your display name"
                      : "Keep your account secure"}
                  </p>
                </div>
                <button
                  onClick={closeProfileModal}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition mt-0.5"
                >
                  <FiX className="text-base" />
                </button>
              </div>

              {/* ── Page 1: Profile Info ── */}
              {modalPage === 1 && (
                <form
                  onSubmit={handleNameSave}
                  className="flex-1 flex flex-col px-6 py-5 gap-4"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        value={nameForm.name}
                        onChange={(e) => setNameForm({ name: e.target.value })}
                        placeholder="Your full name"
                        disabled={modalLoading}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white focus:border-transparent transition disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                      <FiMail className="text-gray-400 text-sm flex-shrink-0" />
                      <span className="text-sm text-gray-500 truncate flex-1">
                        {user?.email}
                      </span>
                      <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 uppercase tracking-wide">
                        Locked
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    {modalError && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 mb-3 border border-red-100">
                        {modalError}
                      </p>
                    )}
                    {modalSuccess && (
                      <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 mb-3 border border-green-100">
                        {modalSuccess}
                      </p>
                    )}
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={closeProfileModal}
                        disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                      >
                        {modalLoading ? (
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <FiSave className="text-sm" />
                        )}
                        {modalLoading ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ── Page 2: Change Password ── */}
              {modalPage === 2 && (
                <form
                  onSubmit={handlePasswordSave}
                  className="flex-1 flex flex-col px-6 py-5 gap-4"
                >
                  {[
                    {
                      key: "current",
                      label: "Current Password",
                      placeholder: "Enter current password",
                    },
                    {
                      key: "newPass",
                      label: "New Password",
                      placeholder: "Minimum 6 characters",
                    },
                    {
                      key: "confirm",
                      label: "Confirm Password",
                      placeholder: "Re-enter new password",
                    },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        {label}
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type={showPass[key] ? "text" : "password"}
                          value={passForm[key]}
                          onChange={(e) =>
                            setPassForm((f) => ({
                              ...f,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={placeholder}
                          disabled={modalLoading}
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white focus:border-transparent transition disabled:opacity-60"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() =>
                            setShowPass((s) => ({ ...s, [key]: !s[key] }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showPass[key] ? (
                            <FiEyeOff className="text-sm" />
                          ) : (
                            <FiEye className="text-sm" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-auto pt-2">
                    {modalError && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 mb-3 border border-red-100">
                        {modalError}
                      </p>
                    )}
                    {modalSuccess && (
                      <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 mb-3 border border-green-100">
                        {modalSuccess}
                      </p>
                    )}
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => goToPage(1)}
                        disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                      >
                        {modalLoading ? (
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <FiSave className="text-sm" />
                        )}
                        {modalLoading ? "Saving…" : "Update Password"}
                      </button>
                    </div>
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
