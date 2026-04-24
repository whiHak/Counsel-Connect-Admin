import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { User } from "@/lib/db/schema";

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
    const body = await request.json();
    const status = body?.status as "ACTIVE" | "SUSPENDED";
    const suspensionReason = (body?.suspensionReason as string | undefined) || "";

    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      return new NextResponse(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
      });
    }

    await connectDB();

    const update: any = { status };
    if (status === "SUSPENDED") {
      update.suspendedAt = new Date();
      update.suspensionReason = suspensionReason;
    } else {
      update.suspendedAt = null;
      update.suspensionReason = "";
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user status:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

