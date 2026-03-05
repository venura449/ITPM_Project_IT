import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiShoppingBag,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiMenu,
  FiEdit2,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSave,
  FiMail,
  FiX,
  FiUser,
  FiShield,
  FiClock,
  FiAward,
  FiPackage,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiTrendingUp,
  FiStar,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import AdminMerchandisePage from "./AdminMerchandisePage";
import AdminUsersPage from "./AdminUsersPage";
import AdminEventsPage from "./AdminEventsPage";
import AdminSponsorsPage from "./AdminSponsorsPage";
import AdminOrderSlotsPage from "./AdminOrderSlotsPage";
import AdminOCApplicationsPage from "./AdminOCApplicationsPage";

const roleLabels = {
  admin: "Administrator",
  oc: "Organising Committee",
  participant: "Participant",
};

const navItems = [
  { icon: FiHome, label: "Overview", id: "overview" },
  { icon: FiShoppingBag, label: "Merchandise", id: "merchandise" },
  { icon: FiClock, label: "Collection Slots", id: "slots" },
  { icon: FiCalendar, label: "Events", id: "events" },
  { icon: FiUsers, label: "Users", id: "users" },
  { icon: FiDollarSign, label: "Sponsors", id: "sponsors" },
  { icon: FiAward, label: "OC Applications", id: "oc-apps" },
];

export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("overview"); // admin lands on overview by default

  // ── Overview data ────────────────────────────────────────
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const [usersRes, merchRes, eventsRes, ocRes] = await Promise.allSettled([
        api.get("/users"),
        api.get("/merchandise"),
        api.get("/events"),
        api.get("/oc-applications"),
      ]);
      const users = usersRes.status === "fulfilled" ? usersRes.value.data : [];
      const merch = merchRes.status === "fulfilled" ? merchRes.value.data : [];
      const events =
        eventsRes.status === "fulfilled" ? eventsRes.value.data : [];
      const ocApps = ocRes.status === "fulfilled" ? ocRes.value.data : [];
      setOverviewData({ users, merch, events, ocApps });
    } catch (_) {
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active === "overview") fetchOverview();
  }, [active, fetchOverview]);

  // ── Profile modal ────────────────────────────────────────
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
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
    if (!modalLoading) setShowProfileModal(false);
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
        className={`relative flex flex-col bg-gradient-to-b from-green-900 to-green-800 transition-all duration-300 ease-in-out flex-shrink-0 rounded-r-3xl ${collapsed ? "w-[72px]" : "w-64"}`}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-3 flex-shrink-0">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <FiShield className="w-4 h-4 text-green-800" />
          </div>
          {!collapsed && (
            <div className="ml-2.5 min-w-0">
              <span className="text-white font-bold text-sm tracking-tight whitespace-nowrap block leading-none">
                Admin Portal
              </span>
              <span className="text-green-300 text-[10px] whitespace-nowrap block mt-0.5">
                SLIIT Events
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
          className="absolute top-5 -right-3 z-10 w-6 h-6 bg-green-700 hover:bg-green-600 border border-green-600 text-white rounded-full flex items-center justify-center shadow-md transition"
        >
          {collapsed ? (
            <FiChevronRight className="text-xs" />
          ) : (
            <FiChevronLeft className="text-xs" />
          )}
        </button>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${isActive ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"} ${collapsed ? "justify-center" : ""}`}
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

        {/* Bottom */}
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

      {/* ── Main ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
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
                {navItems.find((n) => n.id === active)?.label ?? "Admin Portal"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                SLIIT Events — Admin Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
              <FiBell className="text-lg" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div
              onClick={openProfileModal}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-none">
                  {user?.name}
                </p>
                <p className="text-xs text-red-500 font-medium mt-0.5">
                  Administrator
                </p>
              </div>
              <FiChevronRight className="text-gray-400 text-xs hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {active === "merchandise" ? (
            <AdminMerchandisePage />
          ) : active === "slots" ? (
            <AdminOrderSlotsPage />
          ) : active === "oc-apps" ? (
            <AdminOCApplicationsPage />
          ) : active === "users" ? (
            <AdminUsersPage />
          ) : active === "events" ? (
            <AdminEventsPage />
          ) : active === "sponsors" ? (
            <AdminSponsorsPage />
          ) : (
            /* ══════════════ ADMIN OVERVIEW ══════════════ */
            <div className="p-6 space-y-6">
              {/* ── Hero banner ─────────────────────────────── */}
              <div className="bg-gradient-to-r from-green-900 via-green-800 to-green-700 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
                <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/10 rounded-full pointer-events-none" />
                <div className="absolute -bottom-10 right-28 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
                <div className="relative">
                  <p className="text-green-300 text-sm font-medium mb-1">
                    Admin Portal 🛡️
                  </p>
                  <h2 className="text-white text-2xl font-extrabold leading-tight">
                    Welcome, {user?.name}
                  </h2>
                  <p className="text-green-300 text-xs mt-1">{user?.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300">
                      <FiShield className="text-xs" /> Administrator
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-green-100">
                      <FiClock className="text-xs" />
                      Since{" "}
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
                  {user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
              </div>

              {overviewLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
                  <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin" />
                  Loading overview…
                </div>
              ) : (
                <>
                  {/* ── Pending OC alert ────────────────────── */}
                  {(() => {
                    const pending = (overviewData?.ocApps ?? []).filter(
                      (a) => a.status === "pending",
                    );
                    return pending.length > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                        <FiAlertCircle className="text-amber-500 text-xl flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-800">
                            {pending.length} OC application
                            {pending.length > 1 ? "s" : ""} awaiting review
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Review and accept or reject pending applicants.
                          </p>
                        </div>
                        <button
                          onClick={() => setActive("oc-apps")}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline flex-shrink-0"
                        >
                          Review now
                        </button>
                      </div>
                    ) : null;
                  })()}

                  {/* ── Stats row ───────────────────────────── */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Total Users",
                        value: overviewData?.users?.length ?? 0,
                        sub: `${(overviewData?.users ?? []).filter((u) => u.role === "participant").length} participants`,
                        icon: FiUsers,
                        color: "text-blue-600 bg-blue-50",
                        id: "users",
                      },
                      {
                        label: "Merchandise",
                        value: overviewData?.merch?.length ?? 0,
                        sub: `${(overviewData?.merch ?? []).filter((m) => m.isPublished).length} published`,
                        icon: FiShoppingBag,
                        color: "text-purple-600 bg-purple-50",
                        id: "merchandise",
                      },
                      {
                        label: "Events",
                        value: overviewData?.events?.length ?? 0,
                        sub: `${(overviewData?.events ?? []).filter((e) => e.isPublished ?? true).length} active`,
                        icon: FiCalendar,
                        color: "text-amber-600 bg-amber-50",
                        id: "events",
                      },
                      {
                        label: "OC Applications",
                        value: overviewData?.ocApps?.length ?? 0,
                        sub: `${(overviewData?.ocApps ?? []).filter((a) => a.status === "pending").length} pending`,
                        icon: FiAward,
                        color: "text-green-700 bg-green-50",
                        id: "oc-apps",
                      },
                    ].map(({ label, value, sub, icon: Icon, color, id }) => (
                      <button
                        key={id}
                        onClick={() => setActive(id)}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition text-left group"
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
                        <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1">
                          {label}{" "}
                          <FiArrowRight className="text-[10px] opacity-0 group-hover:opacity-100 transition" />
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* ── Two-column: User breakdown + OC Applications ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* User role breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-900">
                          User Breakdown
                        </p>
                        <button
                          onClick={() => setActive("users")}
                          className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center gap-1"
                        >
                          Manage <FiArrowRight className="text-xs" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {[
                          {
                            role: "participant",
                            label: "Participants",
                            color: "bg-blue-400",
                            textColor: "text-blue-700",
                            bg: "bg-blue-50",
                          },
                          {
                            role: "oc",
                            label: "OC Members",
                            color: "bg-amber-400",
                            textColor: "text-amber-700",
                            bg: "bg-amber-50",
                          },
                          {
                            role: "admin",
                            label: "Admins",
                            color: "bg-red-400",
                            textColor: "text-red-700",
                            bg: "bg-red-50",
                          },
                        ].map(({ role, label, color, textColor, bg }) => {
                          const count = (overviewData?.users ?? []).filter(
                            (u) => u.role === role,
                          ).length;
                          const total = (overviewData?.users ?? []).length || 1;
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={role}>
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bg} ${textColor}`}
                                >
                                  {label}
                                </span>
                                <span className="text-xs font-bold text-gray-500">
                                  {count}{" "}
                                  <span className="font-normal text-gray-400">
                                    ({pct}%)
                                  </span>
                                </span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${color} transition-all duration-500`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
                        {[
                          {
                            label: "Total Users",
                            value: overviewData?.users?.length ?? 0,
                            icon: FiUsers,
                            color: "text-blue-600",
                          },
                          {
                            label: "OC Members",
                            value: (overviewData?.users ?? []).filter(
                              (u) => u.role === "oc",
                            ).length,
                            icon: FiAward,
                            color: "text-amber-600",
                          },
                          {
                            label: "Admins",
                            value: (overviewData?.users ?? []).filter(
                              (u) => u.role === "admin",
                            ).length,
                            icon: FiShield,
                            color: "text-red-600",
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
                    </div>

                    {/* OC Applications summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-900">
                          OC Applications
                        </p>
                        <button
                          onClick={() => setActive("oc-apps")}
                          className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center gap-1"
                        >
                          Review all <FiArrowRight className="text-xs" />
                        </button>
                      </div>

                      {/* Status pills */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                          {
                            status: "pending",
                            label: "Pending",
                            cls: "bg-amber-50 text-amber-700 border-amber-200",
                            dot: "bg-amber-400",
                          },
                          {
                            status: "accepted",
                            label: "Accepted",
                            cls: "bg-green-50 text-green-700 border-green-200",
                            dot: "bg-green-500",
                          },
                          {
                            status: "rejected",
                            label: "Rejected",
                            cls: "bg-red-50   text-red-600   border-red-200",
                            dot: "bg-red-400",
                          },
                        ].map(({ status, label, cls, dot }) => {
                          const count = (overviewData?.ocApps ?? []).filter(
                            (a) => a.status === status,
                          ).length;
                          return (
                            <div
                              key={status}
                              className={`rounded-xl border p-3 text-center ${cls}`}
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full mx-auto mb-1.5 ${dot}`}
                              />
                              <p className="text-xl font-extrabold">{count}</p>
                              <p className="text-[10px] font-semibold mt-0.5">
                                {label}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Top scored recent apps */}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Top Applicants
                      </p>
                      {(overviewData?.ocApps ?? []).length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <FiAward className="text-3xl mx-auto mb-1 opacity-30" />
                          <p className="text-xs">No applications yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {[...(overviewData?.ocApps ?? [])]
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 3)
                            .map((app, idx) => {
                              const statusCfg = {
                                pending: {
                                  cls: "text-amber-600 bg-amber-50 border-amber-200",
                                  label: "Pending",
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
                                  className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50"
                                >
                                  <div
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                                      idx === 0
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 line-clamp-1">
                                      {app.student?.name ?? "Unknown"}
                                    </p>
                                    <p className="text-[11px] text-gray-400 line-clamp-1">
                                      {app.eventName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {app.score >= 60 && (
                                      <FiStar className="text-amber-400 text-xs" />
                                    )}
                                    <span className="text-[11px] font-bold text-gray-500">
                                      {app.score}pts
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}
                                    >
                                      {statusCfg.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Quick access module cards ────────────── */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Admin Modules
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                      {[
                        {
                          icon: FiShoppingBag,
                          label: "Merchandise",
                          id: "merchandise",
                          color: "text-purple-600 bg-purple-50",
                          border: "hover:border-purple-200",
                        },
                        {
                          icon: FiPackage,
                          label: "Collection Slots",
                          id: "slots",
                          color: "text-indigo-600 bg-indigo-50",
                          border: "hover:border-indigo-200",
                        },
                        {
                          icon: FiCalendar,
                          label: "Events",
                          id: "events",
                          color: "text-blue-600 bg-blue-50",
                          border: "hover:border-blue-200",
                        },
                        {
                          icon: FiUsers,
                          label: "Users",
                          id: "users",
                          color: "text-amber-600 bg-amber-50",
                          border: "hover:border-amber-200",
                        },
                        {
                          icon: FiDollarSign,
                          label: "Sponsors",
                          id: "sponsors",
                          color: "text-green-700 bg-green-50",
                          border: "hover:border-green-200",
                        },
                        {
                          icon: FiAward,
                          label: "OC Applications",
                          id: "oc-apps",
                          color: "text-rose-600 bg-rose-50",
                          border: "hover:border-rose-200",
                        },
                      ].map(({ icon: Icon, label, id, color, border }) => (
                        <button
                          key={id}
                          onClick={() => setActive(id)}
                          className={`text-left bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md ${border} hover:border transition-all duration-200 group`}
                        >
                          <div
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 text-lg ${color}`}
                          >
                            <Icon />
                          </div>
                          <p className="text-xs font-bold text-gray-900 leading-snug">
                            {label}
                          </p>
                          <FiArrowRight className="text-[10px] text-gray-300 mt-1.5 group-hover:text-green-700 transition" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Edit Profile Modal ──────────────────────────────── */}
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
            {/* Left panel */}
            <div className="w-56 flex-shrink-0 bg-gradient-to-b from-green-900 to-green-800 flex flex-col items-center py-8 px-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-white font-extrabold text-2xl mb-3 flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <p className="text-white font-bold text-sm text-center leading-snug">
                {user?.name}
              </p>
              <p className="text-green-300 text-xs mt-1 text-center break-all leading-tight">
                {user?.email}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300">
                <FiShield className="text-[10px]" /> Administrator
              </div>
              <div className="w-full border-t border-white/10 my-5" />
              <nav className="w-full space-y-1">
                {[
                  { id: 1, icon: FiEdit2, label: "Profile Info" },
                  { id: 2, icon: FiLock, label: "Change Password" },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => goToPage(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${modalPage === id ? "bg-white/20 text-white" : "text-green-300 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon className="flex-shrink-0" /> {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col min-w-0">
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

              {/* Page 1: Profile Info */}
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
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
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

              {/* Page 2: Change Password */}
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
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
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
