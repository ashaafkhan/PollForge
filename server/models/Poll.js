import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    color: { type: String, default: "" }
  },
  { _id: true }
);

const conditionalLogicSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    showIf: {
      questionId: { type: mongoose.Schema.Types.ObjectId },
      selectedOptionId: { type: mongoose.Schema.Types.ObjectId }
    }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    options: { type: [optionSchema], default: [] },
    conditionalLogic: { type: conditionalLogicSchema, default: undefined }
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    slug: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "expired", "published"],
      default: "draft"
    },
    allowAnonymous: { type: Boolean, default: true },
    requireAuth: { type: Boolean, default: false },
    expiresAt: { type: Date },
    questions: { type: [questionSchema], default: [] },
    settings: {
      showProgressBar: { type: Boolean, default: true },
      shuffleQuestions: { type: Boolean, default: false },
      shuffleOptions: { type: Boolean, default: false },
      confirmationMessage: { type: String, default: "Thanks for your response." },
      redirectUrl: { type: String, default: "" },
      maxResponses: { type: Number, default: 0 },
      allowMultipleSubmissions: { type: Boolean, default: false }
    },
    meta: {
      totalResponses: { type: Number, default: 0 },
      lastResponseAt: { type: Date },
      avgCompletionTime: { type: Number, default: 0 },
      viewCount: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 }
    },
    publishedAt: { type: Date },
    aiInsights: { type: String, default: "" },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

pollSchema.index({ slug: 1 });
pollSchema.index({ creator: 1, createdAt: -1 });
pollSchema.index({ creator: 1, status: 1 });

export default mongoose.model("Poll", pollSchema);
