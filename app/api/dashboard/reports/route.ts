import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorApplication } from "@/lib/db/schema";
import ExcelJS from "exceljs";

// Date period utility
type Period = "weekly" | "monthly";
function groupByPeriod(date: Date, period: Period) {
  if (period === "weekly") {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10); 
  } else {
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}`;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    await connectDB();
    const { period, start, end } = await req.json();
    const match: any = {};
    if (start) match.submittedAt = { $gte: new Date(start) };
    if (end) {
      match.submittedAt = match.submittedAt || {};
      match.submittedAt.$lte = new Date(end);
    }

    // Aggregate based on period
    const periodType: Period = ["weekly", "monthly"].includes(period) ? period : "monthly";
    const apps = await CounselorApplication.find(match).lean();
    // Group by period
    const grouped: any = {};
    apps.forEach((app: any) => {
      const grp = groupByPeriod(new Date(app.submittedAt), periodType);
      if (!grouped[grp]) {
        grouped[grp] = { total: 0, APPROVED: 0, REJECTED: 0, PENDING: 0, period: grp };
      }
      grouped[grp].total++;
      grouped[grp][app.status]++;
    });

    // For the Excel, create workbook
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Applications");
    ws.columns = [
      { header: "Period", key: "period", width: 18 },
      { header: "Total Applications", key: "total", width: 20 },
      { header: "Approved", key: "APPROVED", width: 15 },
      { header: "Rejected", key: "REJECTED", width: 15 },
      { header: "Pending", key: "PENDING", width: 15 }
    ];
    Object.values(grouped).forEach((row: any) => ws.addRow(row));

    // Response as Blob (xlsx file)
    const buf = await workbook.xlsx.writeBuffer();

    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=dashboard_report.xlsx"
      },
    });
  } catch (error) {
    console.error("Error generating dashboard report:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
