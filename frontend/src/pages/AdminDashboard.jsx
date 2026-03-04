import { useState } from "react";
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
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import AdminMerchandisePage from "./AdminMerchandisePage";
import AdminUsersPage from "./AdminUsersPage";
import AdminEventsPage from "./AdminEventsPage";
import AdminSponsorsPage from "./AdminSponsorsPage";

const roleLabels = {
  admin: "Administrator",
  oc: "Organising Committee",
  participant: "Participant",
};

const navItems = [
  { icon: FiHome, label: "Overview", id: "overview" },
  { icon: FiShoppingBag, label: "Merchandise", id: "merchandise" },
  { icon: FiCalendar, label: "Events", id: "events" },
  { icon: FiUsers, label: "Users", id: "users" },
  { icon: FiDollarSign, label: "Sponsors", id: "sponsors" },
];

export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("merchandise"); // admin lands on merchandise by default

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
          ) : active === "users" ? (
            <AdminUsersPage />
          ) : active === "events" ? (
            <AdminEventsPage />
          ) : active === "sponsors" ? (
            <AdminSponsorsPage />
          ) : (
            <div className="p-6">
              {/* Admin overview banner */}
              <div className="bg-gradient-to-r from-green-900 to-green-700 rounded-2xl p-6 mb-6 flex items-center justify-between overflow-hidden relative">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 right-24 w-28 h-28 bg-white/10 rounded-full" />
                <div className="relative">
                  <p className="text-green-200 text-sm font-medium mb-1">
                    Admin Portal
                  </p>
                  <h2 className="text-white text-2xl font-extrabold leading-tight">
                    Welcome, {user?.name}
                  </h2>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300">
                    <FiShield className="text-xs" /> Administrator
                  </div>
                </div>
                <div className="relative hidden sm:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center text-4xl flex-shrink-0">
                  🛡️
                </div>
              </div>

              {/* Quick nav cards */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Admin Modules
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  {
                    icon: FiShoppingBag,
                    title: "Merchandise",
                    desc: "Add, edit, approve & publish items",
                    id: "merchandise",
                    color: "bg-purple-50 text-purple-600",
                    border: "hover:border-purple-200",
                  },
                  {
                    icon: FiCalendar,
                    title: "Events",
                    desc: "Manage & approve campus events",
                    id: "events",
                    color: "bg-blue-50 text-blue-600",
                    border: "hover:border-blue-200",
                  },
                  {
                    icon: FiUsers,
                    title: "Users",
                    desc: "Manage roles & user accounts",
                    id: "users",
                    color: "bg-amber-50 text-amber-600",
                    border: "hover:border-amber-200",
                  },
                  {
                    icon: FiDollarSign,
                    title: "Sponsors",
                    desc: "Sponsor matching & outreach",
                    id: "sponsors",
                    color: "bg-green-50 text-green-700",
                    border: "hover:border-green-200",
                  },
                ].map(({ icon: Icon, title, desc, id, color, border }) => (
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
                  </button>
                ))}
              </div>
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
