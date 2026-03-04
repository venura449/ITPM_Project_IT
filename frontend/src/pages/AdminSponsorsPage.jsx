import { useEffect, useState, useCallback } from "react";
import {
  FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiX, FiSave,
  FiAlertTriangle, FiMail, FiBriefcase, FiGlobe, FiRefreshCw,
  FiChevronRight, FiChevronLeft, FiCheck, FiSend,
} from "react-icons/fi";
import api from "../api/axios";

const CATEGORIES = ["Sport", "Workshop", "Night / Cultural", "Competition", "Other"];

const INV_STYLES = {
  pending:  { badge: "bg-amber-50 text-amber-600 border-amber-200",  dot: "bg-amber-400",  label: "Pending" },
  accepted: { badge: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500",  label: "Accepted" },
  rejected: { badge: "bg-red-50 text-red-600 border-red-200",        dot: "bg-red-400",    label: "Rejected" },
};

function InvBadge({ status }) {
  const s = INV_STYLES[status] ?? INV_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

function Avatar({ name }) {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
      {name?.[0]?.toUpperCase() ?? "S"}
    </div>
  );
}

const EMPTY_FORM = {
  name: "", email: "", password: "",
  company: "", website: "", description: "",
  categories: [], donationBudget: "",
};

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("sponsors");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalPage, setModalPage] = useState(1);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Auto-match
  const [autoMatchLoading, setAutoMatchLoading] = useState(false);
  const [autoMatchMsg, setAutoMatchMsg] = useState("");

  // ── Fetch ────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, iRes, dRes] = await Promise.all([
        api.get("/sponsors"),
        api.get("/sponsors/invitations"),
        api.get("/sponsors/all-donations"),
      ]);
      setSponsors(sRes.data);
      setInvitations(iRes.data);
      setDonations(dRes.data);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Stats ────────────────────────────────────────────────
  const totalDonated = donations.reduce((s, d) => s + d.amount, 0);
  const pendingInvCount = invitations.filter((i) => i.status === "pending").length;
  const activeCount = invitations.filter((i) => i.status === "accepted").length;

  // ── Modal helpers ────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalPage(1);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (sp) => {
    setEditTarget(sp);
    setForm({
      name: sp.user?.name || "",
      email: sp.user?.email || "",
      password: "",
      company: sp.company || "",
      website: sp.website || "",
      description: sp.description || "",
      categories: sp.categories || [],
      donationBudget: sp.donationBudget?.toString() || "",
    });
    setModalPage(1);
    setFormError("");
    setShowModal(true);
  };

  const toggleCategory = (cat) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));

  const handleNextPage = () => {
    if (!editTarget && !form.name.trim()) return setFormError("Contact name is required.");
    if (!editTarget && !form.email.trim()) return setFormError("Email is required.");
    if (!editTarget && !form.password.trim()) return setFormError("Password is required.");
    if (!form.company.trim()) return setFormError("Company name is required.");
    setFormError("");
    setModalPage(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.categories.length === 0) return setFormError("Select at least one interest category.");
    setFormError("");
    setFormLoading(true);
    try {
      if (editTarget) {
        const { data } = await api.put(`/sponsors/${editTarget._id}`, {
          company: form.company,
          website: form.website,
          description: form.description,
          categories: form.categories,
          donationBudget: form.donationBudget ? Number(form.donationBudget) : 0,
        });
        setSponsors((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      } else {
        const { data } = await api.post("/sponsors", { ...form, donationBudget: form.donationBudget ? Number(form.donationBudget) : 0 });
        await fetchAll();
        void data;
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to save sponsor.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/sponsors/${deleteTarget._id}`);
      setSponsors((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to delete.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAutoMatch = async () => {
    setAutoMatchLoading(true);
    setAutoMatchMsg("");
    try {
      const { data } = await api.post("/sponsors/auto-match");
      setAutoMatchMsg(`${data.total} new invitation${data.total !== 1 ? "s" : ""} sent.`);
      const { data: iData } = await api.get("/sponsors/invitations");
      setInvitations(iData);
    } catch (err) {
      setAutoMatchMsg(err.response?.data?.message ?? "Auto-match failed.");
    } finally {
      setAutoMatchLoading(false);
    }
  };

  // ── Preview panel ────────────────────────────────────────
  const PreviewPanel = () => (
    <div className="w-52 flex-shrink-0 bg-gradient-to-b from-green-900 to-green-800 flex flex-col py-7 px-5">
      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-extrabold text-2xl mb-3 flex-shrink-0">
        {form.company?.[0]?.toUpperCase() || <FiBriefcase />}
      </div>
      <p className="text-white font-bold text-sm mb-0.5 break-words">{form.company || "Company Name"}</p>
      {form.name && <p className="text-green-300 text-xs mb-0.5">{form.name}</p>}
      {form.email && <p className="text-green-200 text-[10px] mb-3 break-all">{form.email}</p>}
      {form.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {form.categories.map((c) => (
            <span key={c} className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white">{c}</span>
          ))}
        </div>
      )}
      {form.donationBudget && (
        <p className="text-green-200 text-[10px]">Budget: Rs. {Number(form.donationBudget).toLocaleString()}</p>
      )}
      <div className="mt-auto space-y-2 pt-4">
        {[{ step: 1, label: "Company Info" }, { step: 2, label: "Categories & Budget" }].map(({ step, label }) => (
          <div key={step} className={`flex items-center gap-2 text-[11px] font-semibold ${modalPage === step ? "text-white" : modalPage > step ? "text-green-300" : "text-green-500"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${modalPage === step ? "bg-white text-green-900" : modalPage > step ? "bg-green-400 text-white" : "bg-white/20 text-white/40"}`}>
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
          <h2 className="text-lg font-extrabold text-gray-900">Sponsor Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Add sponsors, auto-match events and track donations</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition">
          <FiPlus /> Add Sponsor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Sponsors", value: sponsors.length, color: "text-gray-700 bg-gray-50 border-gray-200" },
          { label: "Pending Invites", value: pendingInvCount, color: "text-amber-600 bg-amber-50 border-amber-200" },
          { label: "Active Sponsorships", value: activeCount, color: "text-blue-600 bg-blue-50 border-blue-200" },
          { label: "Total Donated (Rs.)", value: totalDonated.toLocaleString(), color: "text-green-700 bg-green-50 border-green-200" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border px-4 py-3 ${color}`}>
            <p className="text-2xl font-extrabold leading-none">{value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {[
          { id: "sponsors", label: "Sponsors" },
          { id: "invitations", label: `Invitations${invitations.length ? ` (${invitations.length})` : ""}` },
          { id: "donations", label: "Donations" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${tab === id ? "bg-green-800 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" /> Loading…
        </div>
      ) : (
        <>
          {/* ── Sponsors Tab ── */}
          {tab === "sponsors" && (
            sponsors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FiBriefcase className="text-5xl mb-3 opacity-40" />
                <p className="text-sm">No sponsors yet. Add one!</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Sponsor", "Categories", "Budget (Rs.)", "Actions"].map((h) => (
                        <th key={h} className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sponsors.map((sp) => (
                      <tr key={sp._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {sp.company?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{sp.company}</p>
                              <p className="text-xs text-gray-400">{sp.user?.name} · {sp.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(sp.categories || []).map((c) => (
                              <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">{c}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-700">
                          {sp.donationBudget > 0 ? sp.donationBudget.toLocaleString() : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(sp)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition"><FiEdit2 className="text-sm" /></button>
                            <button onClick={() => setDeleteTarget(sp)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><FiTrash2 className="text-sm" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-400">{sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )
          )}

          {/* ── Invitations Tab ── */}
          {tab === "invitations" && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleAutoMatch}
                  disabled={autoMatchLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
                >
                  {autoMatchLoading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FiRefreshCw className="text-sm" />}
                  Auto-Match All Events
                </button>
                {autoMatchMsg && (
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
                    {autoMatchMsg}
                  </span>
                )}
              </div>
              {invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <FiSend className="text-5xl mb-3 opacity-40" />
                  <p className="text-sm">No invitations yet. Run Auto-Match to send them.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Event", "Sponsor", "Category", "Status", "Sent"].map((h) => (
                          <th key={h} className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map((inv) => (
                        <tr key={inv._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4">
                            <p className="text-sm font-bold text-gray-900 max-w-[180px] truncate">{inv.event?.title ?? "—"}</p>
                            <p className="text-xs text-gray-400">{inv.event?.faculty}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar name={inv.sponsorUser?.name} />
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{inv.sponsorUser?.name}</p>
                                <p className="text-xs text-gray-400">{inv.sponsorUser?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600">{inv.event?.category}</td>
                          <td className="py-3 px-4"><InvBadge status={inv.status} /></td>
                          <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                            {new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-400">{invitations.length} invitation{invitations.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Donations Tab ── */}
          {tab === "donations" && (
            donations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FiDollarSign className="text-5xl mb-3 opacity-40" />
                <p className="text-sm">No donations recorded yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Sponsor", "Event", "Amount (Rs.)", "Note", "Date"].map((h) => (
                        <th key={h} className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d) => (
                      <tr key={d._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={d.sponsorUser?.name} />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{d.sponsorUser?.name}</p>
                              <p className="text-xs text-gray-400">{d.sponsorUser?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-semibold text-gray-800 max-w-[160px] truncate">{d.event?.title}</p>
                          <p className="text-xs text-gray-400">{d.event?.faculty}</p>
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-green-700">{d.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-xs text-gray-500 max-w-[140px] truncate">{d.note || "—"}</td>
                        <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(d.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">{donations.length} donation{donations.length !== 1 ? "s" : ""}</p>
                  <p className="text-xs font-bold text-green-700">Total: Rs. {totalDonated.toLocaleString()}</p>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => !formLoading && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex" style={{ minHeight: "480px" }} onClick={(e) => e.stopPropagation()}>
            <PreviewPanel />
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{editTarget ? "Edit Sponsor" : "Add Sponsor"}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Step {modalPage} of 2 — {modalPage === 1 ? "Company Info" : "Categories & Budget"}</p>
                </div>
                <button onClick={() => !formLoading && setShowModal(false)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"><FiX className="text-base" /></button>
              </div>

              {/* Page 1 */}
              {modalPage === 1 && (
                <div className="flex-1 flex flex-col px-6 py-5 gap-4 overflow-y-auto">
                  <Field label="Company Name">
                    <div className="relative">
                      <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input type="text" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="e.g. Tech Corp Ltd." className={`${inputCls} pl-9`} />
                    </div>
                  </Field>
                  {!editTarget && (
                    <>
                      <Field label="Representative Name">
                        <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contact person's full name" className={inputCls} />
                      </Field>
                      <Field label="Email Address">
                        <div className="relative">
                          <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="sponsor@company.com" className={`${inputCls} pl-9`} />
                        </div>
                      </Field>
                      <Field label="Password">
                        <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" className={inputCls} />
                      </Field>
                    </>
                  )}
                  {editTarget && (
                    <Field label="Website">
                      <div className="relative">
                        <FiGlobe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input type="text" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://company.com" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                  )}
                  {formError && <ErrorMsg msg={formError} />}
                  <div className="mt-auto pt-1 flex gap-2.5">
                    <button type="button" onClick={() => !formLoading && setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button type="button" onClick={handleNextPage} className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5 shadow-sm">
                      Next <FiChevronRight />
                    </button>
                  </div>
                </div>
              )}

              {/* Page 2 */}
              {modalPage === 2 && (
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-6 py-5 gap-4 overflow-y-auto">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Interest Categories</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => {
                        const active = form.categories.includes(cat);
                        return (
                          <button type="button" key={cat} onClick={() => toggleCategory(cat)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-left ${active ? "border-green-700 bg-green-50 text-green-800 ring-1 ring-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                            <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${active ? "bg-green-700 text-white" : "border border-gray-300"}`}>
                              {active && <FiCheck className="text-[10px]" />}
                            </span>
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Field label="Donation Budget per Event (Rs.) — optional">
                    <input type="number" value={form.donationBudget} onChange={(e) => setForm((f) => ({ ...f, donationBudget: e.target.value }))} placeholder="e.g. 50000" min="0" className={inputCls} />
                  </Field>
                  <Field label="Website">
                    <div className="relative">
                      <FiGlobe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input type="text" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://company.com" className={`${inputCls} pl-9`} />
                    </div>
                  </Field>
                  <Field label="Description">
                    <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description of the sponsor…" className={`${inputCls} resize-none`} />
                  </Field>
                  {formError && <ErrorMsg msg={formError} />}
                  <div className="mt-auto pt-1 flex gap-2.5">
                    <button type="button" onClick={() => { setModalPage(1); setFormError(""); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1.5">
                      <FiChevronLeft /> Back
                    </button>
                    <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
                      {formLoading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><FiSave className="text-sm" /> {editTarget ? "Save Changes" : "Create Sponsor"}</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><FiAlertTriangle className="text-red-500 text-lg" /></div>
              <div>
                <p className="text-sm font-bold text-gray-900">Delete Sponsor</p>
                <p className="text-xs text-gray-400 mt-0.5">This also deletes their account and donations</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5">
              <p className="text-sm font-bold text-gray-900">{deleteTarget.company}</p>
              <p className="text-xs text-gray-400">{deleteTarget.user?.name} · {deleteTarget.user?.email}</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60">
                {deleteLoading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FiTrash2 className="text-sm" />}
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition";
function Field({ label, children }) {
  return <div><label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>{children}</div>;
}
function ErrorMsg({ msg }) {
  return <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-100">{msg}</p>;
}
