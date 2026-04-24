import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorReport } from "@/lib/db/schema";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status"); // submitted|under_review|resolved|rejected
    const skip = (page - 1) * limit;

    const match: any = {};
    if (
      status &&
      ["submitted", "under_review", "resolved", "rejected"].includes(status)
    ) {
      match.status = status;
    }

    const [items, total] = await Promise.all([
      CounselorReport.find(match)
        .populate("reporterId", "name email image role status")
        .populate("counselorId", "name email image role status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CounselorReport.countDocuments(match),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching counselor reports:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

