"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  X,
} from "lucide-react";

interface UserType {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: "CLIENT" | "COUNSELOR" | "ADMIN";
  status?: "ACTIVE" | "SUSPENDED";
  suspendedAt?: string | null;
  suspensionReason?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "COUNSELOR":
        return "bg-green-100 text-green-800";
      case "CLIENT":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status?: "ACTIVE" | "SUSPENDED") => {
    switch (status) {
      case "SUSPENDED":
        return "bg-red-100 text-red-800 ring-red-200";
      case "ACTIVE":
      default:
        return "bg-green-100 text-green-800 ring-green-200";
    }
  };

  const updateUserStatus = async (user: UserType, status: "ACTIVE" | "SUSPENDED") => {
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          suspensionReason: status === "SUSPENDED" ? suspensionReason : "",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update user status");
      }
      const data = await res.json();
      const updated: UserType = data.user;
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      setSelectedUser(updated);
      if (status === "ACTIVE") setSuspensionReason("");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to update user status");
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-600">
            Browse users, view details, and suspend/unsuspend accounts.
          </p>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      setSuspensionReason(user.suspensionReason || "");
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                      {user.image && (
                        <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ring-1 ${getStatusBadgeColor(
                          user.status || "ACTIVE",
                        )}`}
                      >
                        {user.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4 p-4">
          <span className="text-sm text-gray-600">
            Showing {users.length ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} users
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedUser ? (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedUser(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl ring-1 ring-black/5 overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 ring-1 ring-gray-200 overflow-hidden flex items-center justify-center">
                  {selectedUser.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedUser.image}
                      alt={selectedUser.name}
                      className="h-12 w-12 object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-600">
                      {selectedUser.name?.[0] || "U"}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {selectedUser.name}
                  </div>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                        selectedUser.role,
                      )}`}
                    >
                      {selectedUser.role}
                    </span>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ring-1 ${getStatusBadgeColor(
                        selectedUser.status || "ACTIVE",
                      )}`}
                    >
                      {selectedUser.status || "ACTIVE"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account details
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">User ID</dt>
                    <dd className="text-gray-900 font-mono text-xs break-all">
                      {selectedUser._id}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Joined</dt>
                    <dd className="text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  {selectedUser.status === "SUSPENDED" ? (
                    <>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">Suspended at</dt>
                        <dd className="text-gray-900">
                          {selectedUser.suspendedAt
                            ? new Date(selectedUser.suspendedAt).toLocaleString()
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">Reason</dt>
                        <dd className="text-gray-900 text-right">
                          {selectedUser.suspensionReason || "—"}
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              </div>

              <div className="rounded-lg bg-white p-4 ring-1 ring-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Moderation
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Suspend users who violate policy. Suspended users can be reinstated at any time.
                </p>

                {selectedUser.status !== "SUSPENDED" ? (
                  <div className="mt-3 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Suspension reason
                    </label>
                    <textarea
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why this user is being suspended..."
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => updateUserStatus(selectedUser, "SUSPENDED")}
                      disabled={statusSaving || suspensionReason.trim().length === 0}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Suspend user
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => updateUserStatus(selectedUser, "ACTIVE")}
                    disabled={statusSaving}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Reinstate user
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 