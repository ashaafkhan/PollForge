import crypto from "crypto";
import Poll from "../models/Poll.js";
import Response from "../models/Response.js";

function hashIdentity(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getIdentityHash(req) {
  const ip = req.ip || "";
  const userAgent = req.get("user-agent") || "";
  return hashIdentity(`${ip}:${userAgent}`);
}

function pollIsExpired(poll) {
  if (!poll.expiresAt) return false;
  return new Date(poll.expiresAt).getTime() <= Date.now();
}

function hasReachedCap(poll) {
  const maxResponses = poll.settings?.maxResponses || 0;
  if (!maxResponses) return false;
  return (poll.meta?.totalResponses || 0) >= maxResponses;
}

function validateAnswers(poll, answers) {
  if (!Array.isArray(answers)) {
    return "Answers are required";
  }

  const answerMap = new Map();
  answers.forEach((answer) => {
    if (answer?.questionId) {
      answerMap.set(String(answer.questionId), String(answer.selectedOptionId));
    }
  });

  const isQuestionVisible = (question) => {
    if (!question.conditionalLogic?.enabled) return true;
    const showIf = question.conditionalLogic.showIf || {};
    if (!showIf.questionId || !showIf.selectedOptionId) return false;
    const selected = answerMap.get(String(showIf.questionId));
    return selected && String(selected) === String(showIf.selectedOptionId);
  };

  for (const question of poll.questions || []) {
    if (question.required && isQuestionVisible(question)) {
      const selected = answerMap.get(String(question._id));
      if (!selected) {
        return "All required questions must be answered";
      }
    }
  }

  for (const answer of answers) {
    const question = poll.questions.find((q) => String(q._id) === String(answer.questionId));
    if (!question) {
      return "Invalid question in answers";
    }

    const option = question.options.find(
      (opt) => String(opt._id) === String(answer.selectedOptionId)
    );
    if (!option) {
      return "Invalid option in answers";
    }
  }

  return null;
}

function detectDevice(userAgent) {
  const value = (userAgent || "").toLowerCase();
  if (value.includes("mobi") || value.includes("android") || value.includes("iphone")) {
    return "mobile";
  }
  return "desktop";
}

export async function submitResponse(req, res, next) {
  try {
    const { pollId, answers, metadata } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status !== "active") {
      return res.status(409).json({ message: "Poll is not accepting responses" });
    }

    if (pollIsExpired(poll)) {
      poll.status = "expired";
      await poll.save();
      return res.status(410).json({ message: "Poll expired" });
    }

    if (hasReachedCap(poll)) {
      return res.status(423).json({ message: "Response limit reached" });
    }

    if (poll.requireAuth && !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!poll.allowAnonymous && !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const validationError = validateAnswers(poll, answers);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const ipHash = getIdentityHash(req);

    if (!poll.settings?.allowMultipleSubmissions) {
      if (req.user) {
        const existing = await Response.findOne({ poll: poll._id, respondent: req.user.id });
        if (existing) {
          return res.status(409).json({ message: "Already responded" });
        }
      } else {
        const existing = await Response.findOne({ poll: poll._id, "metadata.ipHash": ipHash });
        if (existing) {
          return res.status(409).json({ message: "Already responded" });
        }
      }
    }

    const submittedAt = new Date();
    const startedAt = metadata?.startedAt ? new Date(metadata.startedAt) : null;
    const completionTime = Number(metadata?.completionTime || 0);

    const userAgent = req.get("user-agent") || "";
    const responseDoc = await Response.create({
      poll: poll._id,
      respondent: req.user?.id,
      isAnonymous: !req.user,
      answers,
      metadata: {
        ipHash,
        userAgent,
        completionTime,
        startedAt,
        submittedAt
      }
    });

    const prevTotal = poll.meta?.totalResponses || 0;
    const nextTotal = prevTotal + 1;
    poll.meta.totalResponses = nextTotal;
    poll.meta.lastResponseAt = submittedAt;

    if (completionTime > 0) {
      const prevAvg = poll.meta?.avgCompletionTime || 0;
      poll.meta.avgCompletionTime = (prevAvg * prevTotal + completionTime) / nextTotal;
    }

    const viewCount = poll.meta?.viewCount || 0;
    poll.meta.completionRate = viewCount
      ? Math.round((nextTotal / viewCount) * 1000) / 10
      : 0;

    await poll.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`poll:${poll._id}`).emit("response:new", {
        totalResponses: poll.meta.totalResponses,
        answers,
        isAnonymous: responseDoc.isAnonymous,
        device: detectDevice(userAgent),
        submittedAt: responseDoc.metadata?.submittedAt || submittedAt
      });
    }

    return res.status(201).json({ id: responseDoc.id });
  } catch (error) {
    return next(error);
  }
}

export async function checkResponse(req, res, next) {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.settings?.allowMultipleSubmissions) {
      return res.json({ hasResponded: false });
    }

    const ipHash = getIdentityHash(req);

    if (req.user) {
      const existing = await Response.findOne({ poll: poll._id, respondent: req.user.id });
      return res.json({ hasResponded: Boolean(existing) });
    }

    const existing = await Response.findOne({ poll: poll._id, "metadata.ipHash": ipHash });
    return res.json({ hasResponded: Boolean(existing) });
  } catch (error) {
    return next(error);
  }
}
