import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorReport } from "@/lib/db/schema";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id } = params;
    const { action } = await request.json();

    const nextStatus =
      action === "under_review"
        ? "under_review"
        : action === "resolve"
          ? "resolved"
          : action === "reject"
            ? "rejected"
            : null;

    if (!nextStatus) {
      return new NextResponse(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
      });
    }

    await connectDB();

    const updated = await CounselorReport.findByIdAndUpdate(
      id,
      { status: nextStatus },
      { new: true },
    )
      .populate("reporterId", "name email image role status")
      .populate("counselorId", "name email image role status")
      .lean();

    if (!updated) {
      return new NextResponse(JSON.stringify({ error: "Report not found" }), {
        status: 404,
      });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Error updating counselor report:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

