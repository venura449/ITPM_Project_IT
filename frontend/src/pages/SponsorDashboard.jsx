import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiMenu,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiMapPin,
  FiClock,
  FiBriefcase,
  FiGlobe,
  FiSave,
  FiEdit2,
  FiLock,
  FiEye,
  FiEyeOff,
  FiMail,
  FiUser,
  FiSearch,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const navItems = [
  { icon: FiHome, label: "Overview", id: "overview" },
  { icon: FiSearch, label: "Browse Events", id: "browse" },
  { icon: FiBell, label: "Invitations", id: "invitations" },
  { icon: FiCalendar, label: "My Events", id: "events" },
  { icon: FiDollarSign, label: "My Donations", id: "donations" },
];

function ProgressBar({ raised, goal }) {
  if (!goal) return null;
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  const remaining = Math.max(0, goal - raised);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-700">
          Funding Progress
        </span>
        <span
          className={`text-sm font-extrabold ${pct >= 100 ? "text-green-600" : "text-green-700"}`}
        >
          {pct}%
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${
            pct >= 100
              ? "bg-gradient-to-r from-green-500 to-green-400"
              : "bg-gradient-to-r from-green-700 to-green-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium mt-1.5">
        <span className="text-gray-500">
          Rs. {raised.toLocaleString()} raised
        </span>
        {remaining > 0 ? (
          <span className="text-amber-600 font-semibold">
            Rs. {remaining.toLocaleString()} left
          </span>
        ) : (
          <span className="text-green-600 font-semibold">Goal reached! 🎉</span>
        )}
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5 text-right">
        Goal: Rs. {goal.toLocaleString()}
      </p>
    </div>
  );
}

export default function SponsorDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("overview");

  const [sponsorProfile, setSponsorProfile] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [browseEvents, setBrowseEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Respond to invitation
  const [respondLoading, setRespondLoading] = useState({});

  // Donate modal
  const [donateTarget, setDonateTarget] = useState(null); // invitation object
  const [donateForm, setDonateForm] = useState({ amount: "", note: "" });
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateError, setDonateError] = useState("");
  const [donateSuccess, setDonateSuccess] = useState("");

  // Event totals for Browse Events progress bars
  const [eventTotals, setEventTotals] = useState({});
  const [selfInviteLoading, setSelfInviteLoading] = useState({});

  // Invitation notification popup
  const [inviteNotif, setInviteNotif] = useState(null); // { count }
  const notifShownRef = useRef(false);

  // Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState(1);
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
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // ── Fetch ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, invRes, donRes, evRes, totalsRes] = await Promise.all([
        api.get("/sponsors/me/profile"),
        api.get("/sponsors/me/invitations"),
        api.get("/sponsors/me/donations"),
        api.get("/events"),
        api.get("/sponsors/me/event-totals"),
      ]);
      setSponsorProfile(profRes.data);
      setInvitations(invRes.data);
      setMyDonations(donRes.data);
      setBrowseEvents((evRes.data || []).filter((e) => e.budgetGoal > 0));
      setEventTotals(totalsRes.data || {});
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show invitation popup once per session when pending invitations are found
  useEffect(() => {
    if (!loading && !notifShownRef.current) {
      const pending = invitations.filter((i) => i.status === "pending");
      if (pending.length > 0) {
        notifShownRef.current = true;
        setInviteNotif({ count: pending.length });
      }
    }
  }, [loading, invitations]);

  // ── Stats ────────────────────────────────────────────────
  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const acceptedCount = invitations.filter(
    (i) => i.status === "accepted",
  ).length;
  const totalDonated = myDonations.reduce((s, d) => s + d.amount, 0);

  // ── Respond ──────────────────────────────────────────────
  const handleRespond = async (invId, status) => {
    setRespondLoading((s) => ({ ...s, [invId]: true }));
    try {
      await api.put(`/sponsors/me/invitations/${invId}/respond`, { status });
      setInvitations((prev) =>
        prev.map((i) =>
          i._id === invId
            ? { ...i, status, respondedAt: new Date().toISOString() }
            : i,
        ),
      );
      if (status === "accepted") fetchData(); // reload to get totalRaised + myDonations
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed.");
    } finally {
      setRespondLoading((s) => ({ ...s, [invId]: false }));
    }
  };

  // ── Self-invite (sponsor initiates directly from Browse Events) ───────────
  const handleSelfSponsor = async (ev) => {
    setSelfInviteLoading((s) => ({ ...s, [ev._id]: true }));
    try {
      await api.post(`/sponsors/me/self-invite/${ev._id}`);
      const [invRes, totalsRes] = await Promise.all([
        api.get("/sponsors/me/invitations"),
        api.get("/sponsors/me/event-totals"),
      ]);
      const freshInvitations = invRes.data;
      setInvitations(freshInvitations);
      setEventTotals(totalsRes.data || {});
      const freshInv = freshInvitations.find(
        (i) =>
          i.event?._id === ev._id || String(i.event?._id) === String(ev._id),
      );
      if (freshInv) openDonate(freshInv);
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to initiate sponsorship.");
    } finally {
      setSelfInviteLoading((s) => ({ ...s, [ev._id]: false }));
    }
  };

  // ── Donate ───────────────────────────────────────────────
  const openDonate = (inv) => {
    const goal = inv.event?.budgetGoal || 0;
    const remaining =
      goal > 0 ? Math.max(0, goal - (inv.totalRaised || 0)) : null;
    const defaultAmt =
      sponsorProfile?.donationBudget > 0
        ? remaining !== null
          ? Math.min(sponsorProfile.donationBudget, remaining)
          : sponsorProfile.donationBudget
        : "";
    setDonateTarget(inv);
    setDonateForm({ amount: defaultAmt ? String(defaultAmt) : "", note: "" });
    setDonateError("");
    setDonateSuccess("");
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    setDonateError("");
    setDonateSuccess("");
    setDonateLoading(true);
    try {
      await api.post("/sponsors/me/donate", {
        eventId: donateTarget.event._id,
        amount: Number(donateForm.amount),
        note: donateForm.note,
      });
      setDonateSuccess("Donation submitted successfully!");
      setTimeout(() => {
        setDonateTarget(null);
        fetchData();
      }, 1200);
    } catch (err) {
      setDonateError(err.response?.data?.message ?? "Failed to donate.");
    } finally {
      setDonateLoading(false);
    }
  };

  // ── Profile modal ────────────────────────────────────────
  const openProfile = () => {
    setNameForm({ name: user?.name ?? "" });
    setPassForm({ current: "", newPass: "", confirm: "" });
    setShowPass({ current: false, newPass: false, confirm: false });
    setProfileTab(1);
    setProfileError("");
    setProfileSuccess("");
    setShowProfileModal(true);
  };

  const handleNameSave = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (!nameForm.name.trim()) return setProfileError("Name cannot be empty.");
    setProfileLoading(true);
    try {
      const res = await api.put("/auth/profile", { name: nameForm.name });
      updateUser(res.data.user);
      setProfileSuccess("Name updated!");
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (err) {
      setProfileError(err.response?.data?.message ?? "Failed.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (!passForm.current) return setProfileError("Current password required.");
    if (passForm.newPass.length < 6)
      return setProfileError("Min 6 characters.");
    if (passForm.newPass !== passForm.confirm)
      return setProfileError("Passwords do not match.");
    setProfileLoading(true);
    try {
      await api.put("/auth/profile", {
        currentPassword: passForm.current,
        newPassword: passForm.newPass,
      });
      setProfileSuccess("Password changed!");
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (err) {
      setProfileError(err.response?.data?.message ?? "Failed.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const acceptedInvitations = invitations.filter(
    (i) => i.status === "accepted",
  );

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-col bg-gradient-to-b from-green-900 to-green-800 transition-all duration-300 ease-in-out flex-shrink-0 rounded-r-3xl ${collapsed ? "w-[72px]" : "w-64"}`}
      >
        <div className="flex items-center h-16 px-3 flex-shrink-0">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <FiBriefcase className="w-4 h-4 text-green-800" />
          </div>
          {!collapsed && (
            <div className="ml-2.5 min-w-0">
              <span className="text-white font-bold text-sm tracking-tight whitespace-nowrap block leading-none">
                Sponsor Portal
              </span>
              <span className="text-green-300 text-[10px] whitespace-nowrap block mt-0.5 truncate">
                {sponsorProfile?.company || "SLIIT Events"}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3 z-10 w-6 h-6 bg-green-700 hover:bg-green-600 border border-green-600 text-white rounded-full flex items-center justify-center shadow-md transition"
        >
          {collapsed ? (
            <FiChevronRight className="text-xs" />
          ) : (
            <FiChevronLeft className="text-xs" />
          )}
        </button>

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

        <div className="px-2 pb-4">
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

      {/* ── Main ── */}
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
                {navItems.find((n) => n.id === active)?.label ??
                  "Sponsor Portal"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                SLIIT Events — Sponsor Portal
              </p>
            </div>
          </div>
          <div
            onClick={openProfile}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-green-700 font-medium mt-0.5">
                {sponsorProfile?.company || "Sponsor"}
              </p>
            </div>
            <FiChevronRight className="text-gray-400 text-xs hidden sm:block" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" />{" "}
              Loading…
            </div>
          ) : (
            <div className="p-6">
              {/* ── Browse Events ── */}
              {active === "browse" &&
                (() => {
                  // Build a map of eventId → invitation for quick lookup
                  const invMap = {};
                  invitations.forEach((i) => {
                    if (i.event?._id) invMap[i.event._id] = i;
                  });
                  return (
                    <>
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-gray-700">
                          Events Seeking Sponsors
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          All published events with a sponsorship budget
                        </p>
                      </div>
                      {browseEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                          <FiSearch className="text-5xl mb-3 opacity-40" />
                          <p className="text-sm">
                            No events with a sponsor budget yet
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {browseEvents.map((ev) => {
                            const inv = invMap[ev._id];
                            const statusLabel = inv
                              ? {
                                  pending: "Invited",
                                  accepted: "Accepted",
                                  rejected: "Declined",
                                }[inv.status]
                              : null;
                            const statusCls = inv
                              ? {
                                  pending: "bg-amber-100 text-amber-700",
                                  accepted: "bg-green-100 text-green-800",
                                  rejected: "bg-gray-100 text-gray-500",
                                }[inv.status]
                              : null;
                            return (
                              <div
                                key={ev._id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                              >
                                <div className="w-full h-28 bg-gray-100 overflow-hidden flex-shrink-0 relative">
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
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FiCalendar className="text-3xl text-gray-300" />
                                    </div>
                                  )}
                                  {statusLabel && (
                                    <span
                                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls}`}
                                    >
                                      {statusLabel}
                                    </span>
                                  )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                  <p className="text-sm font-extrabold text-gray-900 leading-snug mb-1">
                                    {ev.title}
                                  </p>
                                  <p className="text-xs text-gray-400 mb-2">
                                    {ev.faculty} · {ev.category}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                    <FiClock className="flex-shrink-0" />
                                    {new Date(ev.date).toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                                    <FiMapPin className="flex-shrink-0" />{" "}
                                    {ev.location || "—"}
                                  </div>
                                  <div className="mt-auto">
                                    <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 mb-3">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                                        Sponsor Budget
                                      </p>
                                      <p className="text-base font-extrabold text-green-800">
                                        Rs. {ev.budgetGoal.toLocaleString()}
                                      </p>
                                    </div>
                                    <ProgressBar
                                      raised={eventTotals[ev._id] || 0}
                                      goal={ev.budgetGoal}
                                    />
                                    <div className="mt-3">
                                      {inv?.status === "accepted" ? (
                                        <button
                                          onClick={() => openDonate(inv)}
                                          className="w-full py-2 rounded-xl bg-green-800 hover:bg-green-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                          <FiDollarSign /> Donate Now
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleSelfSponsor(ev)}
                                          disabled={!!selfInviteLoading[ev._id]}
                                          className="w-full py-2 rounded-xl bg-green-800 hover:bg-green-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                                        >
                                          {selfInviteLoading[ev._id] ? (
                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                          ) : (
                                            <FiDollarSign />
                                          )}
                                          {inv?.status === "pending"
                                            ? "Accept & Sponsor"
                                            : "Sponsor This Event"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}

              {/* ── Overview ── */}
              {active === "overview" && (
                <>
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
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                        <FiBriefcase className="text-xs" />{" "}
                        {sponsorProfile?.company}
                      </div>
                    </div>
                    <div className="relative hidden sm:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center text-4xl flex-shrink-0">
                      🤝
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      {
                        label: "Pending Invitations",
                        value: pendingCount,
                        color: "text-amber-600 bg-amber-50 border-amber-200",
                        onClick: () => setActive("invitations"),
                      },
                      {
                        label: "Active Sponsorships",
                        value: acceptedCount,
                        color: "text-blue-600 bg-blue-50 border-blue-200",
                        onClick: () => setActive("events"),
                      },
                      {
                        label: "Total Donated (Rs.)",
                        value: totalDonated.toLocaleString(),
                        color: "text-green-700 bg-green-50 border-green-200",
                        onClick: () => setActive("donations"),
                      },
                    ].map(({ label, value, color, onClick }) => (
                      <button
                        key={label}
                        onClick={onClick}
                        className={`rounded-2xl border px-4 py-4 text-left hover:shadow-md transition ${color}`}
                      >
                        <p className="text-2xl font-extrabold leading-none">
                          {value}
                        </p>
                        <p className="text-xs font-semibold mt-1 opacity-80">
                          {label}
                        </p>
                      </button>
                    ))}
                  </div>

                  {sponsorProfile?.categories?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-bold text-gray-800 mb-3">
                        Your Interest Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {sponsorProfile.categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1.5 rounded-xl bg-green-50 text-green-800 text-xs font-bold border border-green-200"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      {sponsorProfile.donationBudget > 0 && (
                        <p className="mt-3 text-xs text-gray-500">
                          Donation budget per event:{" "}
                          <span className="font-bold text-gray-700">
                            Rs. {sponsorProfile.donationBudget.toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── Invitations ── */}
              {active === "invitations" && (
                <>
                  <h3 className="text-sm font-bold text-gray-700 mb-4">
                    Event Invitations
                  </h3>
                  {invitations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <FiBell className="text-5xl mb-3 opacity-40" />
                      <p className="text-sm">No invitations yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {invitations.map((inv) => {
                        const ev = inv.event;
                        const isPending = inv.status === "pending";
                        const isAccepted = inv.status === "accepted";
                        return (
                          <div
                            key={inv._id}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col ${isAccepted ? "border-green-200" : inv.status === "rejected" ? "border-gray-200 opacity-70" : "border-gray-100"}`}
                          >
                            <div className="w-full h-28 bg-gray-100 overflow-hidden flex-shrink-0 relative">
                              {ev?.imageUrl ? (
                                <img
                                  src={ev.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FiCalendar className="text-3xl text-gray-300" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <StatusPill status={inv.status} />
                              </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <p className="text-sm font-extrabold text-gray-900 leading-snug mb-1">
                                {ev?.title || "Unknown Event"}
                              </p>
                              <p className="text-xs text-gray-400 mb-1">
                                {ev?.faculty} · {ev?.category}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                <FiClock className="flex-shrink-0" />
                                {ev?.date
                                  ? new Date(ev.date).toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )
                                  : "—"}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                                <FiMapPin className="flex-shrink-0" />{" "}
                                {ev?.location || "—"}
                              </div>
                              {isPending && (
                                <div className="mt-auto flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleRespond(inv._id, "rejected")
                                    }
                                    disabled={!!respondLoading[inv._id]}
                                    className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition flex items-center justify-center gap-1 disabled:opacity-50"
                                  >
                                    {respondLoading[inv._id] ? (
                                      <span className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                                    ) : (
                                      <FiX />
                                    )}{" "}
                                    Decline
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRespond(inv._id, "accepted")
                                    }
                                    disabled={!!respondLoading[inv._id]}
                                    className="flex-1 py-2 rounded-xl bg-green-800 hover:bg-green-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                                  >
                                    {respondLoading[inv._id] ? (
                                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <FiCheck />
                                    )}{" "}
                                    Accept
                                  </button>
                                </div>
                              )}
                              {isAccepted && (
                                <div className="mt-auto">
                                  <button
                                    onClick={() => setActive("events")}
                                    className="w-full py-2 rounded-xl bg-green-50 text-green-800 text-xs font-bold hover:bg-green-100 border border-green-200 transition flex items-center justify-center gap-1.5"
                                  >
                                    <FiDollarSign /> View &amp; Donate
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── My Events (accepted, with donation) ── */}
              {active === "events" && (
                <>
                  <h3 className="text-sm font-bold text-gray-700 mb-4">
                    Accepted Sponsorships
                  </h3>
                  {acceptedInvitations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <FiCalendar className="text-5xl mb-3 opacity-40" />
                      <p className="text-sm">
                        No active sponsorships. Accept an invitation first.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {acceptedInvitations.map((inv) => {
                        const ev = inv.event;
                        const raised = inv.totalRaised || 0;
                        const goal = ev?.budgetGoal || 0;
                        const remaining =
                          goal > 0 ? Math.max(0, goal - raised) : null;
                        const myTotal = (inv.myDonations || []).reduce(
                          (s, d) => s + d.amount,
                          0,
                        );
                        return (
                          <div
                            key={inv._id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                          >
                            <div className="bg-gradient-to-r from-green-900 to-green-700 px-5 py-4 flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <FiCalendar className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm leading-snug truncate">
                                  {ev?.title}
                                </p>
                                <p className="text-green-200 text-xs mt-0.5">
                                  {ev?.faculty} · {ev?.category}
                                </p>
                              </div>
                            </div>
                            <div className="p-5">
                              <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                  <FiClock className="flex-shrink-0" />{" "}
                                  {ev?.date
                                    ? new Date(ev.date).toLocaleDateString(
                                        "en-GB",
                                        {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )
                                    : "—"}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <FiMapPin className="flex-shrink-0" />{" "}
                                  {ev?.location || "—"}
                                </div>
                              </div>

                              {goal > 0 && (
                                <div className="mb-4">
                                  <ProgressBar raised={raised} goal={goal} />
                                </div>
                              )}

                              {myTotal > 0 && (
                                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 mb-4">
                                  <span className="text-xs text-blue-700 font-semibold">
                                    Your contribution
                                  </span>
                                  <div className="text-right">
                                    <span className="text-xs font-extrabold text-blue-700">
                                      Rs. {myTotal.toLocaleString()}
                                    </span>
                                    {goal > 0 && (
                                      <span className="text-[10px] text-blue-500 ml-1">
                                        ({Math.round((myTotal / goal) * 100)}%
                                        of goal)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {remaining === null || remaining > 0 ? (
                                <button
                                  onClick={() => openDonate(inv)}
                                  className="w-full py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                                >
                                  <FiDollarSign /> Make a Donation
                                </button>
                              ) : (
                                <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold flex items-center justify-center gap-2">
                                  <FiCheckCircle /> Goal Reached!
                                </div>
                              )}

                              {/* Mini donation history */}
                              {(inv.myDonations || []).length > 0 && (
                                <div className="mt-4 border-t border-gray-100 pt-3 space-y-1.5">
                                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    My Donations
                                  </p>
                                  {inv.myDonations.map((d) => (
                                    <div
                                      key={d._id}
                                      className="flex items-center justify-between text-xs"
                                    >
                                      <span className="text-gray-500">
                                        {new Date(
                                          d.createdAt,
                                        ).toLocaleDateString("en-GB")}
                                      </span>
                                      <span className="font-bold text-green-700">
                                        Rs. {d.amount.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── My Donations ── */}
              {active === "donations" && (
                <>
                  <h3 className="text-sm font-bold text-gray-700 mb-4">
                    Donation History
                  </h3>
                  {myDonations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <FiDollarSign className="text-5xl mb-3 opacity-40" />
                      <p className="text-sm">No donations yet</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {["Event", "Amount (Rs.)", "Note", "Date"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                                >
                                  {h}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {myDonations.map((d) => (
                            <tr
                              key={d._id}
                              className="border-b border-gray-100 hover:bg-gray-50 transition"
                            >
                              <td className="py-3 px-4">
                                <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                                  {d.event?.title}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {d.event?.faculty}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-sm font-bold text-green-700">
                                {d.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-xs text-gray-500">
                                {d.note || "—"}
                              </td>
                              <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                                {new Date(d.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {myDonations.length} donation
                          {myDonations.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs font-bold text-green-700">
                          Total: Rs. {totalDonated.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Invitation Notification Popup ── */}
      {inviteNotif && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-green-200 overflow-hidden animate-slide-in-right">
          <div className="bg-gradient-to-r from-green-900 to-green-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBell className="text-white text-base animate-bounce" />
              <p className="text-white font-bold text-sm">New Invitation{inviteNotif.count > 1 ? "s" : ""}!</p>
            </div>
            <button
              onClick={() => setInviteNotif(null)}
              className="p-1 rounded-lg text-green-300 hover:text-white hover:bg-white/20 transition"
            >
              <FiX className="text-sm" />
            </button>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700 leading-snug">
              🎉 You have{" "}
              <span className="font-extrabold text-green-800">
                {inviteNotif.count} pending invitation{inviteNotif.count > 1 ? "s" : ""}
              </span>{" "}
              from events matching your sponsorship categories.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setInviteNotif(null);
                  setActive("invitations");
                }}
                className="flex-1 py-2 rounded-xl bg-green-800 hover:bg-green-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FiBell className="text-xs" /> View Invitations
              </button>
              <button
                onClick={() => setInviteNotif(null)}
                className="py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Donate Modal ── */}
      {donateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !donateLoading && setDonateTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Make a Donation</p>
                <p className="text-green-300 text-xs mt-0.5 truncate max-w-[200px]">
                  {donateTarget.event?.title}
                </p>
              </div>
              <button
                onClick={() => !donateLoading && setDonateTarget(null)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleDonate} className="px-6 py-5 space-y-4">
              {donateTarget.event?.budgetGoal > 0 && (
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <ProgressBar
                    raised={donateTarget.totalRaised || 0}
                    goal={donateTarget.event.budgetGoal}
                  />
                  {donateTarget.event.budgetGoal >
                    (donateTarget.totalRaised || 0) && (
                    <p className="text-xs text-gray-500 mt-2">
                      Remaining:{" "}
                      <span className="font-bold text-gray-700">
                        Rs.{" "}
                        {(
                          donateTarget.event.budgetGoal -
                          (donateTarget.totalRaised || 0)
                        ).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Donation Amount (Rs.)
                </label>
                <input
                  type="number"
                  value={donateForm.amount}
                  onChange={(e) =>
                    setDonateForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="e.g. 10000"
                  min="1"
                  max={
                    donateTarget.event?.budgetGoal > 0
                      ? Math.max(
                          0,
                          donateTarget.event.budgetGoal -
                            (donateTarget.totalRaised || 0),
                        )
                      : undefined
                  }
                  required
                  disabled={donateLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={donateForm.note}
                  onChange={(e) =>
                    setDonateForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="e.g. Happy to support this event!"
                  disabled={donateLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
                />
              </div>
              {donateError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-100">
                  {donateError}
                </p>
              )}
              {donateSuccess && (
                <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 border border-green-100 flex items-center gap-2">
                  <FiCheck /> {donateSuccess}
                </p>
              )}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => !donateLoading && setDonateTarget(null)}
                  disabled={donateLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={donateLoading}
                  className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {donateLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiDollarSign />
                  )}
                  {donateLoading ? "Donating…" : "Donate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Profile Modal ── */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !profileLoading && setShowProfileModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ minHeight: "380px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Edit Profile</p>
                <p className="text-green-300 text-xs mt-0.5">
                  {sponsorProfile?.company}
                </p>
              </div>
              <button
                onClick={() => !profileLoading && setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
              >
                <FiX />
              </button>
            </div>
            <div className="flex gap-1 px-6 pt-4">
              {[
                { id: 1, label: "Profile" },
                { id: 2, label: "Password" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setProfileTab(id);
                    setProfileError("");
                    setProfileSuccess("");
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${profileTab === id ? "bg-green-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {profileTab === 1 && (
              <form onSubmit={handleNameSave} className="px-6 py-4 space-y-4">
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
                      disabled={profileLoading}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                  <FiMail className="text-gray-400 text-sm flex-shrink-0" />
                  <span className="text-sm text-gray-500 truncate flex-1">
                    {user?.email}
                  </span>
                  <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                    Locked
                  </span>
                </div>
                {profileError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-100">
                    {profileError}
                  </p>
                )}
                {profileSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 border border-green-100">
                    {profileSuccess}
                  </p>
                )}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    disabled={profileLoading}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                  >
                    {profileLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FiSave className="text-sm" />
                    )}
                    {profileLoading ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}
            {profileTab === 2 && (
              <form
                onSubmit={handlePasswordSave}
                className="px-6 py-4 space-y-4"
              >
                {[
                  { key: "current", label: "Current Password" },
                  { key: "newPass", label: "New Password" },
                  { key: "confirm", label: "Confirm Password" },
                ].map(({ key, label }) => (
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
                          setPassForm((f) => ({ ...f, [key]: e.target.value }))
                        }
                        disabled={profileLoading}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
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
                {profileError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-100">
                    {profileError}
                  </p>
                )}
                {profileSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 border border-green-100">
                    {profileSuccess}
                  </p>
                )}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    disabled={profileLoading}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                  >
                    {profileLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FiSave className="text-sm" />
                    )}
                    {profileLoading ? "Saving…" : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-gray-100 text-gray-500",
  };
  const labels = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Declined",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] ?? map.pending}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
