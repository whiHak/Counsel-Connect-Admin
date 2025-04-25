import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { User, CounselorApplication } from "@/lib/db/schema";

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    await connectDB();

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get application statistics
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
    ] = await Promise.all([
      CounselorApplication.countDocuments(),
      CounselorApplication.countDocuments({ status: "PENDING" }),
      CounselorApplication.countDocuments({ status: "APPROVED" }),
      CounselorApplication.countDocuments({ status: "REJECTED" }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 