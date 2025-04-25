import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorApplication, User, Counselor } from "@/lib/db/schema";

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

    // If approved, update user role to COUNSELOR and create counselor entry
    if (status === "APPROVED") {
      // Update user role
      await User.findByIdAndUpdate(application.userId, {
        role: "COUNSELOR"
      });

      const parsedApplication = JSON.parse(JSON.stringify(application));
      // Create counselor entry with explicit data mapping
      const counselorData = {
        userId: parsedApplication.userId,
        personalInfo: {
          fullName: parsedApplication.personalInfo.fullName,
          phoneNumber: parsedApplication.personalInfo.phoneNumber,
          address: parsedApplication.personalInfo.address,
          dateOfBirth: parsedApplication.personalInfo.dateOfBirth
        },
        professionalInfo: {
          specializations: parsedApplication.professionalInfo.specializations,
          languages: parsedApplication.professionalInfo.languages,
          yearsOfExperience: parsedApplication.professionalInfo.yearsOfExperience,
          licenseNumber: parsedApplication.professionalInfo.licenseNumber,
          licenseUrl: parsedApplication.documents.professionalLicenseUrl, // Changed from licenseUrl to professionalLicenseUrl
          resumeUrl: parsedApplication.documents.cvUrl // Changed from resumeUrl to cvUrl
        },
        workPreferences: {
          hourlyRate: parsedApplication.workPreferences.hourlyRate,
          availability: parsedApplication.workPreferences.availability
        },
        imageUrl: parsedApplication.documents.photographUrl
      };

      // Debug: Log the counselor data being created
      console.log("Counselor data to be created:", JSON.stringify(counselorData, null, 2));

      // Create the counselor
      const createdCounselor = await Counselor.create(JSON.parse(JSON.stringify(counselorData)));
      
      // Debug: Log the created counselor
      console.log("Created counselor:", JSON.stringify(createdCounselor.toObject(), null, 2));
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