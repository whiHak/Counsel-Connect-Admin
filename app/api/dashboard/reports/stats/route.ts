import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorApplication } from "@/lib/db/schema";

function groupByPeriod(date: Date, period: "weekly" | "monthly") {
  if (period === "weekly") {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD of Monday
  } else {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
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
    const periodType: "weekly" | "monthly" = ["weekly", "monthly"].includes(period)
      ? period
      : "monthly";
    const apps = await CounselorApplication.find(match).lean();
    const grouped: any = {};
    apps.forEach((app: any) => {
      const grp = groupByPeriod(new Date(app.submittedAt), periodType);
      if (!grouped[grp]) {
        grouped[grp] = { period: grp, total: 0, APPROVED: 0, REJECTED: 0, PENDING: 0 };
      }
      grouped[grp].total++;
      grouped[grp][app.status]++;
    });
    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("Error fetching report stats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
