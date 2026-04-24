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
  status: {
    type: String,
    enum: ["ACTIVE", "SUSPENDED"],
    default: "ACTIVE",
    index: true,
  },
  suspendedAt: Date,
  suspensionReason: {
    type: String,
    trim: true,
    maxlength: 500,
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

const withdrawalRequestSchema = new mongoose.Schema(
  {
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    payoutMethod: {
      type: String,
      enum: ["bank_transfer", "mobile_money"],
      required: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
      index: true,
    },
    reviewedAt: Date,
    reviewNote: String,
  },
  { timestamps: true },
);

const counselorReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["harassment", "inappropriate_behavior", "no_show", "fraud", "other"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["submitted", "under_review", "resolved", "rejected"],
      default: "submitted",
      index: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Counselor =
  mongoose.models.Counselor || mongoose.model("Counselor", counselorSchema);
export const CounselorApplication =
  mongoose.models.CounselorApplication ||
  mongoose.model("CounselorApplication", counselorApplicationSchema);
export const WithdrawalRequest =
  mongoose.models.WithdrawalRequest ||
  mongoose.model("WithdrawalRequest", withdrawalRequestSchema);

export const CounselorReport =
  mongoose.models.CounselorReport ||
  mongoose.model("CounselorReport", counselorReportSchema);