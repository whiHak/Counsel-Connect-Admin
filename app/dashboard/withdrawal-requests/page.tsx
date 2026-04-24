"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";

type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

interface WithdrawalRequestItem {
  _id: string;
  counselorId?: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
    status?: "ACTIVE" | "SUSPENDED";
  };
  amount: number;
  payoutMethod: "bank_transfer" | "mobile_money";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  phoneNumber?: string;
  note?: string;
  status: WithdrawalStatus;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
}

export default function WithdrawalRequestsPage() {
  const [items, setItems] = useState<WithdrawalRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | "all">(
    "all",
  );
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
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
      const res = await fetch(`/api/withdrawal-requests?${query}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error("Failed to fetch withdrawal requests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const badgeClass = (s: WithdrawalStatus) => {
    switch (s) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 ring-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 ring-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 ring-red-200";
      case "paid":
        return "bg-blue-100 text-blue-800 ring-blue-200";
      default:
        return "bg-gray-100 text-gray-800 ring-gray-200";
    }
  };

  const money = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 2,
    }).format(amount);

  const actOn = async (id: string, action: "approve" | "reject") => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/withdrawal-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote: noteById[id] || "" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update request");
      }
      await fetchItems();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to update request");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Withdrawal Requests
          </h1>
          <p className="text-sm text-gray-600">
            Review and approve/deny counselor payout requests.
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
          {(["All", "Pending", "Approved", "Rejected", "Paid"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => {
                  setPage(1);
                  setStatusFilter(s.toLowerCase() as WithdrawalStatus);
                }}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  statusFilter === s.toLowerCase()
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {s === "All" ? "All" : s}
              </button>
            ),
          )}
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
                  Counselor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payout Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
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
                      <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded w-40 animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200 flex items-center justify-center">
                          {item.counselorId?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.counselorId.image}
                              alt={item.counselorId?.name || "Counselor"}
                              className="h-9 w-9 object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-gray-600">
                              {(item.counselorId?.name || "C")[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.counselorId?.name || "Unknown counselor"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.counselorId?.email || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">
                          Account:
                        </span>{" "}
                        {item.accountName} • {item.accountNumber}
                        {item.bankName ? ` • ${item.bankName}` : ""}
                        {item.phoneNumber ? ` • ${item.phoneNumber}` : ""}
                      </div>
                      {item.note ? (
                        <div className="mt-1 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">
                            Note:
                          </span>{" "}
                          {item.note}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {money(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.payoutMethod === "bank_transfer"
                        ? "Bank transfer"
                        : "Mobile money"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleString()}
                      {item.reviewedAt ? (
                        <div className="text-xs text-gray-500">
                          Reviewed: {new Date(item.reviewedAt).toLocaleString()}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-end gap-2">
                        {item.status === "pending" ? (
                          <>
                            <input
                              value={noteById[item._id] || ""}
                              onChange={(e) =>
                                setNoteById((p) => ({
                                  ...p,
                                  [item._id]: e.target.value,
                                }))
                              }
                              placeholder="Review note (optional)"
                              className="w-56 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => actOn(item._id, "reject")}
                                disabled={actionLoadingId === item._id}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <X className="h-4 w-4 text-red-600" />
                                Deny
                              </button>
                              <button
                                onClick={() => actOn(item._id, "approve")}
                                disabled={actionLoadingId === item._id}
                                className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-500 text-right max-w-[260px]">
                            {item.reviewNote ? (
                              <>
                                <span className="font-medium text-gray-700">
                                  Review note:
                                </span>{" "}
                                {item.reviewNote}
                              </>
                            ) : (
                              "No review note."
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No withdrawal requests found.
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