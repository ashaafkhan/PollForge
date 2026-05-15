import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: '' },
    creatorScore: { type: Number, default: 0 },
    pollsCreated: { type: Number, default: 0 },
    totalResponsesCollected: { type: Number, default: 0 },
    badges: { type: [String], default: [] }
  },
  { timestamps: true }
);

// Add method to increment score
userSchema.methods.addScore = function (points) {
  this.creatorScore += points;
  return this.save();
};

// Add method to award badge if not already owned
userSchema.methods.awardBadge = function (badge) {
  if (!this.badges.includes(badge)) {
    this.badges.push(badge);
  }
  return this.save();
};

// Helper to increment poll counters
userSchema.methods.incrementPollsCreated = function () {
  this.pollsCreated += 1;
  return this.save();
};

// Helper to increment total responses collected
userSchema.methods.incrementResponsesCollected = function (count = 1) {
  this.totalResponsesCollected += count;
  return this.save();
};

export default mongoose.model('User', userSchema);
