import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionId: { type: mongoose.Schema.Types.ObjectId, required: true }
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    poll: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", required: true },
    respondent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isAnonymous: { type: Boolean, default: true },
    answers: { type: [answerSchema], default: [] },
    metadata: {
      ipHash: { type: String, default: "" },
      userAgent: { type: String, default: "" },
      completionTime: { type: Number, default: 0 },
      startedAt: { type: Date },
      submittedAt: { type: Date }
    }
  },
  { timestamps: true }
);

responseSchema.index({ poll: 1, respondent: 1 });
responseSchema.index({ poll: 1, "metadata.ipHash": 1 });
responseSchema.index({ poll: 1, createdAt: -1 });

export default mongoose.model("Response", responseSchema);
