import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorApplication, User } from "@/lib/db/schema";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { id } = params;
    const { status, reviewNotes } = await request.json();

    await connectDB();

    const application = await CounselorApplication.findById(id);

    if (!application) {
      return new NextResponse(
        JSON.stringify({ error: "Application not found" }),
        { status: 404 }
      );
    }

    // Update application status
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewNotes = reviewNotes;
    await application.save();

    // If approved, update user role to COUNSELOR
    if (status === "APPROVED") {
      await User.findByIdAndUpdate(application.userId, {
        role: "COUNSELOR"
      });
    }

    return NextResponse.json({ message: "Application updated successfully" });
  } catch (error) {
    console.error("Error updating application:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 