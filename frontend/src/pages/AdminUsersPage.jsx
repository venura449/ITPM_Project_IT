import { useEffect, useState, useCallback } from "react";
import {
  FiUsers,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiEye,
  FiMail,
  FiUser,
  FiShield,
  FiFilter,
  FiAlertTriangle,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import api from "../api/axios";

const ROLE_STYLES = {
  admin: {
    badge: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
    label: "Administrator",
  },
  oc: {
    badge: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-500",
    label: "Organising Committee",
  },
  participant: {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    label: "Participant",
  },
};

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "participant", label: "Participants" },
  { value: "oc", label: "OC Members" },
  { value: "admin", label: "Administrators" },
];

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.participant;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Avatar({ name }) {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

const PAGE_SIZE = 6;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // View modal
  const [viewUser, setViewUser] = useState(null);

  // Edit modal
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== "all") params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/users", { params });
      setUsers(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  // ── Stats ────────────────────────────────────────────────
  const counts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // ── Pagination ───────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedUsers = users.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );
  const pageStart =
    users.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safeCurrentPage * PAGE_SIZE, users.length);

  // ── Edit handlers ────────────────────────────────────────
  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role });
    setEditError("");
    setEditSuccess("");
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setEditLoading(true);
    try {
      const { data } = await api.put(`/users/${editUser._id}`, editForm);
      setEditSuccess("User updated successfully!");
      setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
      setTimeout(() => {
        setEditUser(null);
        setEditSuccess("");
      }, 1100);
    } catch (err) {
      setEditError(err.response?.data?.message ?? "Failed to update.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete handlers ──────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to delete.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Row ──────────────────────────────────────────────────
  const UserRow = ({ user: u }) => (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar name={u.name} />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">
              {u.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <RoleBadge role={u.role} />
      </td>
      <td className="py-3 px-4 text-xs text-gray-400">
        {new Date(u.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewUser(u)}
            title="View"
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
          >
            <FiEye className="text-sm" />
          </button>
          <button
            onClick={() => openEdit(u)}
            title="Edit"
            className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition"
          >
            <FiEdit2 className="text-sm" />
          </button>
          {u.role !== "admin" && (
            <button
              onClick={() => setDeleteTarget(u)}
              title="Delete"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <FiTrash2 className="text-sm" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-gray-900">
          User Management
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          View, edit roles and manage platform users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total Users",
            value: users.length,
            color: "text-gray-700 bg-gray-50 border-gray-200",
          },
          {
            label: "Participants",
            value: counts.participant || 0,
            color: "text-green-700 bg-green-50 border-green-200",
          },
          {
            label: "OC Members",
            value: counts.oc || 0,
            color: "text-amber-600 bg-amber-50 border-amber-200",
          },
          {
            label: "Administrators",
            value: counts.admin || 0,
            color: "text-red-600 bg-red-50 border-red-200",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border px-4 py-3 ${color}`}>
            <p className="text-2xl font-extrabold leading-none">{value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 transition"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 appearance-none transition cursor-pointer"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {(search || roleFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
            }}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <FiX className="text-sm" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin mr-3" />{" "}
          Loading…
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiUsers className="text-5xl mb-3 opacity-40" />
          <p className="text-sm font-medium">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  User
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Role
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Joined
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <UserRow key={u._id} user={u} />
              ))}
            </tbody>
          </table>
          {/* Pagination bar */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              {users.length === 0
                ? "No users"
                : `Showing ${pageStart}–${pageEnd} of ${users.length} user${users.length !== 1 ? "s" : ""}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FiChevronLeft className="text-sm" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition border ${
                        page === safeCurrentPage
                          ? "bg-green-800 text-white border-green-800 shadow-sm"
                          : "border-gray-200 text-gray-500 hover:bg-white hover:text-green-800"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FiChevronRight className="text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setViewUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-5 flex items-center justify-between">
              <p className="text-white font-bold text-sm">User Profile</p>
              <button
                onClick={() => setViewUser(null)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
              >
                <FiX />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0">
                  {viewUser.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-extrabold text-gray-900">
                    {viewUser.name}
                  </p>
                  <RoleBadge role={viewUser.role} />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: FiMail, label: "Email", value: viewUser.email },
                  {
                    icon: FiShield,
                    label: "Role",
                    value: ROLE_STYLES[viewUser.role]?.label ?? viewUser.role,
                  },
                  { icon: FiUser, label: "User ID", value: viewUser._id },
                  {
                    icon: FiUser,
                    label: "Joined",
                    value: new Date(viewUser.createdAt).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "long", year: "numeric" },
                    ),
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <Icon className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {label}
                      </p>
                      <p className="text-sm text-gray-800 font-medium break-all mt-0.5">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => {
                  setViewUser(null);
                  openEdit(viewUser);
                }}
                className="w-full py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <FiEdit2 /> Edit This User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !editLoading && setEditUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Edit User</p>
                <p className="text-green-300 text-xs mt-0.5">
                  {editUser.email}
                </p>
              </div>
              <button
                onClick={() => !editLoading && setEditUser(null)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    disabled={editLoading}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
                  />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                    disabled={editLoading}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:bg-white transition disabled:opacity-60"
                  />
                </div>
              </div>
              {/* Role */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["participant", "oc", "admin"].map((r) => {
                    const s = ROLE_STYLES[r];
                    const active = editForm.role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, role: r }))}
                        disabled={editLoading}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                          active
                            ? `${s.badge} shadow-sm ring-2 ring-offset-1 ring-current`
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {r === "oc"
                          ? "OC"
                          : r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-100">
                  {editError}
                </p>
              )}
              {editSuccess && (
                <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5 border border-green-100 flex items-center gap-2">
                  <FiCheck />
                  {editSuccess}
                </p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => !editLoading && setEditUser(null)}
                  disabled={editLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {editLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiSave className="text-sm" />
                  )}
                  {editLoading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
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
                <p className="text-sm font-bold text-gray-900">Delete User</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-3">
              <Avatar name={deleteTarget.name} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {deleteTarget.name}
                </p>
                <p className="text-xs text-gray-400">{deleteTarget.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-900">
                {deleteTarget.name}
              </span>
              ? All their data will be removed.
            </p>
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
                {deleteLoading ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
