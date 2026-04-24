"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";

type ReportStatus = "submitted" | "under_review" | "resolved" | "rejected";
type UserStatus = "ACTIVE" | "SUSPENDED";

interface ReportItem {
  _id: string;
  reporterId?: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    status?: UserStatus;
  };
  counselorId?: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    status?: UserStatus;
  };
  category:
    | "harassment"
    | "inappropriate_behavior"
    | "no_show"
    | "fraud"
    | "other";
  description: string;
  status: ReportStatus;
  createdAt: string;
}

export default function CounselorReportsPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">(
    "all",
  );
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [suspendReasonByCounselorId, setSuspendReasonByCounselorId] = useState<
    Record<string, string>
  >({});

  const limit = 10;

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (statusFilter !== "all") params.set("status", statusFilter);
    return params.toString();
  }, [page, statusFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/counselor-reports?${query}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error("Failed to fetch counselor reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const badgeClass = (s: ReportStatus) => {
    switch (s) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800 ring-yellow-200";
      case "under_review":
        return "bg-blue-100 text-blue-800 ring-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 ring-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 ring-red-200";
      default:
        return "bg-gray-100 text-gray-800 ring-gray-200";
    }
  };

  const updateReport = async (
    id: string,
    action: "under_review" | "resolve" | "reject",
  ) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/counselor-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update report");
      }
      await fetchItems();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to update report");
    } finally {
      setActionLoadingId(null);
    }
  };

  const setUserStatus = async (
    userId: string,
    status: UserStatus,
    suspensionReason?: string,
  ) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, suspensionReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update user status");
      }
      await fetchItems();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to update user status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const categoryLabel = (c: ReportItem["category"]) =>
    c
      .split("_")
      .map((x) => x[0].toUpperCase() + x.slice(1))
      .join(" ");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Counselor Reports
          </h1>
          <p className="text-sm text-gray-600">
            Review client reports and take action on counselors when necessary.
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md bg-white shadow-sm ring-1 ring-gray-200 p-1">
          {(
            ["All", "Submitted", "Under Review", "Resolved", "Rejected"] as const
          ).map((s) => (
            <button
              key={s}
              onClick={() => {
                setPage(1);
                setStatusFilter(s.toLowerCase() as ReportStatus);
              }}
              className={`px-3 py-1.5 text-sm rounded-md ${
                statusFilter === s.toLowerCase()
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s === "All" ? "All" : s}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">{total}</span>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counselor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-72 animate-pulse mt-2" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : items.length ? (
                items.map((item) => {
                  const counselorId = item.counselorId?._id || "";
                  const counselorIsSuspended =
                    item.counselorId?.status === "SUSPENDED";
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/60">
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <div className="text-sm font-semibold text-gray-900">
                            {categoryLabel(item.category)}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                        <div className="mt-2 text-sm text-gray-700 max-w-[560px]">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {item.reporterId?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.reporterId?.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {item.counselorId?.name || "Unknown"}
                          {counselorIsSuspended ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-red-200">
                              SUSPENDED
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.counselorId?.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex flex-wrap justify-end gap-2">
                            {item.status === "submitted" ? (
                              <button
                                onClick={() =>
                                  updateReport(item._id, "under_review")
                                }
                                disabled={actionLoadingId === item._id}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <ShieldAlert className="h-4 w-4 text-blue-700" />
                                Start review
                              </button>
                            ) : null}
                            {item.status !== "resolved" ? (
                              <button
                                onClick={() => updateReport(item._id, "resolve")}
                                disabled={actionLoadingId === item._id}
                                className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Resolve
                              </button>
                            ) : null}
                            {item.status !== "rejected" ? (
                              <button
                                onClick={() => updateReport(item._id, "reject")}
                                disabled={actionLoadingId === item._id}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                              >
                                <XCircle className="h-4 w-4 text-red-700" />
                                Reject
                              </button>
                            ) : null}
                          </div>

                          {counselorId ? (
                            <div className="w-full flex flex-col items-end gap-2">
                              {!counselorIsSuspended ? (
                                <>
                                  <input
                                    value={
                                      suspendReasonByCounselorId[counselorId] ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setSuspendReasonByCounselorId((p) => ({
                                        ...p,
                                        [counselorId]: e.target.value,
                                      }))
                                    }
                                    placeholder="Suspension reason (required)"
                                    className="w-64 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                  />
                                  <button
                                    onClick={() =>
                                      setUserStatus(
                                        counselorId,
                                        "SUSPENDED",
                                        suspendReasonByCounselorId[counselorId] ||
                                          "Policy violation",
                                      )
                                    }
                                    disabled={actionLoadingId === counselorId}
                                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                  >
                                    <ShieldAlert className="h-4 w-4" />
                                    Suspend counselor
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() =>
                                    setUserStatus(counselorId, "ACTIVE")
                                  }
                                  disabled={actionLoadingId === counselorId}
                                  className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-700" />
                                  Reinstate counselor
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}