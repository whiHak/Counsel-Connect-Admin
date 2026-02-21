"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

const PERIODS = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

export default function DashboardReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/reports/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, start: fromDate, end: toDate })
      });
      console.log("response of the chart request", res);
      if (res.ok) {
        const data = await res.json();
        setChartData(data);
        console.log("chart data", data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/dashboard/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, start: fromDate, end: toDate })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_${period}_report.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Dashboard Reports</h1>
      <div className="bg-white shadow rounded-lg p-6 mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="font-medium mr-2">Period:</label>
          <select
            className="border p-2 rounded"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-medium mr-2">From:</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="font-medium mr-2">To:</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:bg-blue-300"
          disabled={loading}
          onClick={fetchChartData}
        >
          {loading ? "Loading..." : "View Chart"}
        </button>
        <button
          className="ml-2 bg-green-600 text-white px-4 py-2 rounded font-semibold disabled:bg-green-300"
          disabled={downloading}
          onClick={fetchReport}
        >
          {downloading ? "Generating..." : "Download XLSX"}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-gray-600">Counselor Applicatitons status for the selected period of time:</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
              <XAxis dataKey="period" />
              <YAxis allowDecimals={false} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend/>
              <Bar dataKey="total" fill="#3490dc" name="Total" />
              <Bar dataKey="APPROVED" fill="#38a169" name="Approved" />
              <Bar dataKey="REJECTED" fill="#e53e3e" name="Rejected" />
              <Bar dataKey="PENDING" fill="#ecc94b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-72 w-full flex items-center justify-center text-gray-400 italic">
            Chart data will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
