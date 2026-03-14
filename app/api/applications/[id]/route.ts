import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { CounselorApplication, User, Counselor } from "@/lib/db/schema";
import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY || "" });

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

    // If approved, update user role to COUNSELOR, create counselor entry and send notification email
    if (status === "APPROVED") {
      // Update user role and fetch updated user (for email)
      const updatedUser = await User.findByIdAndUpdate(
        application.userId,
        {
          role: "COUNSELOR",
          image: application.documents.photographUrl,
        },
        { new: true }
      );

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
      const createdCounselor = await Counselor.create(
        JSON.parse(JSON.stringify(counselorData))
      );

      // Debug: Log the created counselor
      console.log(
        "Created counselor:",
        JSON.stringify(createdCounselor.toObject(), null, 2)
      );

      // Send approval email to the counselor (non-blocking for main flow)
      if (updatedUser?.email) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.SITE_URL ||
          "https://counsel-connect.example.com";

        const counselorName =
          updatedUser.name ||
          parsedApplication.personalInfo.fullName ||
          "Counselor";

        const sendSmtpEmail = {
          subject: "Your Counselor Application Has Been Approved 🎉",
          htmlContent: `
            <html>
              <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.10);">
                        <tr>
                          <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:24px 32px;color:#ffffff;">
                            <h1 style="margin:0;font-size:24px;font-weight:700;">Welcome to Counsel Connect</h1>
                            <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Your counselor application has been approved</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:24px 32px;">
                            <p style="font-size:14px;color:#111827;margin:0 0 16px;">Hi ${counselorName},</p>
                            <p style="font-size:14px;color:#4b5563;margin:0 0 16px;line-height:1.6;">
                              We’re excited to let you know that your counselor application on
                              <strong>Counsel Connect</strong> has been <strong style="color:#16a34a;">approved</strong>.
                            </p>
                            <p style="font-size:14px;color:#4b5563;margin:0 0 16px;line-height:1.6;">
                              You can now log out and sign in again, complete your profile, set your availability,
                              and start connecting with clients who need your support.
                            </p>
                            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
                              <tr>
                                <td>
                                  <a href="${appUrl}" 
                                     style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;
                                            padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
                                    Go to Counsel Connect
                                  </a>
                                </td>
                              </tr>
                            </table>
                            <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">
                              If the button doesn’t work, copy and paste this link into your browser:
                            </p>
                            <p style="font-size:12px;color:#4b5563;margin:0 0 16px;word-break:break-all;">
                              ${appUrl}
                            </p>
                            <p style="font-size:13px;color:#6b7280;margin:0;">
                              Thank you for joining our community of mental health professionals.
                            </p>
                            <p style="font-size:13px;color:#6b7280;margin:8px 0 0;">
                              – The Counsel Connect Team
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
          sender: {
            name: "Counsel Connect",
            email: process.env.BREVO_SENDER_EMAIL || "no-reply@counsel-connect.local",
          },
          to: [{ email: updatedUser.email, name: counselorName }],
        };

        try {
          const emailResponse =
            await brevo.transactionalEmails.sendTransacEmail(sendSmtpEmail);
          console.log(
            "Counselor approval email sent successfully:",
            emailResponse
          );
        } catch (emailError) {
          console.error(
            "Error sending counselor approval email:",
            emailError
          );
        }
      }
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