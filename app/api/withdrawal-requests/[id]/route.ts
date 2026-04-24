import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { WithdrawalRequest } from "@/lib/db/schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const { action, reviewNote } = await request.json();

    const nextStatus =
      action === "approve" ? "approved" : action === "reject" ? "rejected" : null;

    if (!nextStatus) {
      return new NextResponse(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
      });
    }

    await connectDB();

    const updated = await WithdrawalRequest.findByIdAndUpdate(
      id,
      {
        status: nextStatus,
        reviewedAt: new Date(),
        reviewNote: (reviewNote || "").toString(),
      },
      { new: true },
    )
      .populate("counselorId", "name email image role status")
      .lean();

    if (!updated) {
      return new NextResponse(JSON.stringify({ error: "Request not found" }), {
        status: 404,
      });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

