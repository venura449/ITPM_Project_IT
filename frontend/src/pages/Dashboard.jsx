import { useState } from "react";
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
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import MerchandisePage from "./MerchandisePage";
import EventsPage from "./EventsPage";

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
  { icon: FiUsers, label: "Students", id: "students" },
  { icon: FiDollarSign, label: "Sponsors", id: "sponsors" },
  { icon: FiUser, label: "My Profile", id: "profile" },
];

const moduleCards = [
  {
    icon: FiShoppingBag,
    title: "Merchandise",
    desc: "Browse & manage event items",
    color: "bg-purple-50 text-purple-600",
    border: "hover:border-purple-200",
  },
  {
    icon: FiCalendar,
    title: "Events",
    desc: "Explore & approve events",
    color: "bg-blue-50 text-blue-600",
    border: "hover:border-blue-200",
  },
  {
    icon: FiUsers,
    title: "Students",
    desc: "OC recommendations & roles",
    color: "bg-amber-50 text-amber-600",
    border: "hover:border-amber-200",
  },
  {
    icon: FiDollarSign,
    title: "Sponsors",
    desc: "Matching & outreach system",
    color: "bg-green-50 text-green-700",
    border: "hover:border-green-200",
  },
];

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("dashboard");
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
          ) : (
            <div className="p-6">
              {/* Welcome banner */}
              <div className="bg-gradient-to-r from-green-900 to-green-700 rounded-2xl p-6 mb-6 flex items-center justify-between overflow-hidden relative">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 right-24 w-28 h-28 bg-white/10 rounded-full" />
                <div className="relative">
                  <p className="text-green-200 text-sm font-medium mb-1">
                    Welcome back 👋
                  </p>
                  <h2 className="text-white text-2xl font-extrabold leading-tight">
                    {user?.name}
                  </h2>
                  <div
                    className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user?.role] ?? "bg-green-100 text-green-700"}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {roleLabels[user?.role] ?? user?.role}
                  </div>
                </div>
                <div className="relative hidden sm:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center text-4xl flex-shrink-0">
                  🎓
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Events",
                    value: "12",
                    sub: "3 upcoming",
                    Icon: FiCalendar,
                    color: "text-blue-600 bg-blue-50",
                  },
                  {
                    label: "Merchandise",
                    value: "48",
                    sub: "Items available",
                    Icon: FiShoppingBag,
                    color: "text-purple-600 bg-purple-50",
                  },
                  {
                    label: "Students",
                    value: "320",
                    sub: "Registered",
                    Icon: FiUsers,
                    color: "text-amber-600 bg-amber-50",
                  },
                  {
                    label: "Sponsors",
                    value: "9",
                    sub: "Active partners",
                    Icon: FiDollarSign,
                    color: "text-green-700 bg-green-50",
                  },
                ].map(({ label, value, sub, Icon, color }) => (
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

              {/* Module cards */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Modules
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {moduleCards.map(
                  ({ icon: Icon, title, desc, color, border }) => (
                    <button
                      key={title}
                      onClick={() => setActive(title.toLowerCase())}
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
                    </button>
                  ),
                )}
              </div>
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
