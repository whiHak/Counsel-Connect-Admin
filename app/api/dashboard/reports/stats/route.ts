import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorApplication, User } from "@/lib/db/schema";

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
    const periodType: "weekly" | "monthly" = ["weekly", "monthly"].includes(period)
      ? period
      : "monthly";

    // Application stats: filter by submittedAt
    const appMatch: Record<string, unknown> = {};
    if (start) appMatch.submittedAt = { $gte: new Date(start) };
    if (end) {
      appMatch.submittedAt = appMatch.submittedAt
        ? { ...(appMatch.submittedAt as object), $lte: new Date(end) }
        : { $lte: new Date(end) };
    }
    const apps = await CounselorApplication.find(appMatch).lean();
    const appGrouped: Record<string, { period: string; total: number; APPROVED: number; REJECTED: number; PENDING: number }> = {};
    apps.forEach((app: { submittedAt?: Date; status?: string } & Record<string, unknown>) => {
      const grp = groupByPeriod(new Date(app.submittedAt!), periodType);
      if (!appGrouped[grp]) {
        appGrouped[grp] = { period: grp, total: 0, APPROVED: 0, REJECTED: 0, PENDING: 0 };
      }
      appGrouped[grp].total++;
      const status = app.status as "APPROVED" | "REJECTED" | "PENDING";
      if (status in appGrouped[grp]) appGrouped[grp][status]++;
    });
    const applicationStats = Object.values(appGrouped);

    // User stats: filter by createdAt, group by role (CLIENT, COUNSELOR, ADMIN)
    const userMatch: Record<string, unknown> = {};
    if (start) userMatch.createdAt = { $gte: new Date(start) };
    if (end) {
      userMatch.createdAt = userMatch.createdAt
        ? { ...(userMatch.createdAt as object), $lte: new Date(end) }
        : { $lte: new Date(end) };
    }
    const users = await User.find(userMatch).lean();
    const userGrouped: Record<string, { period: string; total: number; CLIENT: number; COUNSELOR: number; }> = {};
    users.forEach((user: { createdAt?: Date; role?: string } & Record<string, unknown>) => {
      const grp = groupByPeriod(new Date(user.createdAt!), periodType);
      if (!userGrouped[grp]) {
        userGrouped[grp] = { period: grp, total: 0, CLIENT: 0, COUNSELOR: 0};
      }
      userGrouped[grp].total++;
      const role = (user.role ?? "CLIENT") as "CLIENT" | "COUNSELOR";
      if (role in userGrouped[grp]) userGrouped[grp][role]++;
    });
    const userStats = Object.values(userGrouped);

    return NextResponse.json({ applicationStats, userStats });
  } catch (error) {
    console.error("Error fetching report stats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
