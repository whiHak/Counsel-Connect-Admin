import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  image: String,
  role: {
    type: String,
    enum: ["CLIENT", "COUNSELOR", "ADMIN"],
    default: "CLIENT",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const counselorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  personalInfo: {
    fullName: String,
    phoneNumber: String,
    address: String,
    dateOfBirth: Date,
  },
  professionalInfo: {
    specializations: [String],
    languages: [String],
    yearsOfExperience: Number,
    licenseNumber: String,
    licenseUrl: String,
    resumeUrl: String,
  },
  workPreferences: {
    hourlyRate: Number,
    availability: [
      {
        day: String,
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
    ],
  },
  imageUrl: String,
});

const counselorApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  personalInfo: {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
  },
  professionalInfo: {
    education: [
      {
        degree: String,
        institution: String,
        graduationYear: Number,
        certificateUrl: String,
      },
    ],
    specializations: [String],
    languages: [String],
    yearsOfExperience: Number,
    licenseNumber: String,
    licenseUrl: String,
    resumeUrl: String,
  },
  workPreferences: {
    hourlyRate: { type: Number, required: true },
    availability: [
      {
        day: String,
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
    ],
  },
  documents: {
    identificationUrl: { type: String, required: true },
    photographUrl: { type: String, required: true },
    workExperienceUrl: { type: String, required: true },
    professionalLicenseUrl: { type: String, required: true },
    educationalCredentialsUrl: { type: String, required: true },
    cvUrl: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  reviewNotes: String,
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Counselor =
  mongoose.models.Counselor || mongoose.model("Counselor", counselorSchema);
export const CounselorApplication =
  mongoose.models.CounselorApplication ||
  mongoose.model("CounselorApplication", counselorApplicationSchema);
