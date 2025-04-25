import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorApplication } from "@/lib/db/schema";

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

    const applications = await CounselorApplication.find()
      .sort({ submittedAt: -1 })
      .populate('userId', 'name email');

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 