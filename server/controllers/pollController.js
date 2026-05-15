import { nanoid } from "nanoid";
import { validationResult } from "express-validator";
import Poll from "../models/Poll.js";
import Response from "../models/Response.js";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

async function generateSlug(title) {
  const base = slugify(title) || "poll";
  let slug = `${base}-${nanoid(6).toLowerCase()}`;
  let exists = await Poll.exists({ slug });
  while (exists) {
    slug = `${base}-${nanoid(6).toLowerCase()}`;
    exists = await Poll.exists({ slug });
  }
  return slug;
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length < 1) {
    return "At least one question is required";
  }

  for (const question of questions) {
    if (!question.text || question.text.trim().length === 0) {
      return "Each question needs text";
    }
    if (!Array.isArray(question.options) || question.options.length < 2) {
      return "Each question needs at least two options";
    }
  }

  return null;
}

export async function createPoll(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions, settings, allowAnonymous, requireAuth, expiresAt } =
      req.body;

    const questionError = validateQuestions(questions);
    if (questionError) {
      return res.status(400).json({ message: questionError });
    }

    const slug = await generateSlug(title);

    const poll = await Poll.create({
      creator: req.user.id,
      title,
      description,
      slug,
      questions,
      settings,
      allowAnonymous,
      requireAuth,
      expiresAt
    });

    return res.status(201).json(poll);
  } catch (error) {
    return next(error);
  }
}

export async function getMyPolls(req, res, next) {
  try {
    const polls = await Poll.find({ creator: req.user.id })
      .sort({ createdAt: -1 })
      .select("title status slug meta.totalResponses createdAt updatedAt");

    return res.json(polls);
  } catch (error) {
    return next(error);
  }
}

export async function getPollById(req, res, next) {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(poll);
  } catch (error) {
    return next(error);
  }
}

export async function getPollBySlug(req, res, next) {
  try {
    const poll = await Poll.findOne({ slug: req.params.slug }).select(
      "title description slug status allowAnonymous requireAuth expiresAt questions settings"
    );

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.expiresAt && new Date(poll.expiresAt).getTime() <= Date.now()) {
      poll.status = "expired";
      await poll.save();
      return res.status(410).json({ message: "Poll expired" });
    }

    if (poll.status === "expired") {
      return res.status(410).json({ message: "Poll expired" });
    }

    if (poll.status !== "active" && poll.status !== "published") {
      return res.status(409).json({ message: "Poll is not active" });
    }

    const maxResponses = poll.settings?.maxResponses || 0;
    if (maxResponses && poll.meta?.totalResponses >= maxResponses) {
      return res.status(423).json({ message: "Response limit reached" });
    }

    return res.json(poll);
  } catch (error) {
    return next(error);
  }
}

export async function updatePoll(req, res, next) {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (poll.status !== "draft" && poll.meta.totalResponses > 0) {
      return res.status(409).json({ message: "Poll can no longer be edited" });
    }

    const updates = req.body;
    const questionError = updates.questions ? validateQuestions(updates.questions) : null;
    if (questionError) {
      return res.status(400).json({ message: questionError });
    }

    Object.assign(poll, updates);
    await poll.save();

    return res.json(poll);
  } catch (error) {
    return next(error);
  }
}

export async function deletePoll(req, res, next) {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await poll.deleteOne();
    return res.json({ message: "Poll deleted" });
  } catch (error) {
    return next(error);
  }
}

export async function activatePoll(req, res, next) {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    poll.status = "active";
    await poll.save();

    return res.json(poll);
  } catch (error) {
    return next(error);
  }
}

function detectDevice(userAgent) {
  const value = (userAgent || "").toLowerCase();
  if (value.includes("mobi") || value.includes("android") || value.includes("iphone")) {
    return "mobile";
  }
  return "desktop";
}

export async function getAnalytics(req, res, next) {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const responses = await Response.find({ poll: poll._id }).sort({ createdAt: 1 });
    const totalResponses = responses.length;
    const viewCount = poll.meta?.viewCount || 0;
    const completionRate = viewCount
      ? Math.round((totalResponses / viewCount) * 1000) / 10
      : 0;

    const responsesByDayMap = new Map();
    let firstResponseAt = null;
    let lastResponseAt = null;
    let anonymousCount = 0;
    let authenticatedCount = 0;
    const deviceBreakdown = { mobile: 0, desktop: 0 };

    responses.forEach((response) => {
      const createdAt = response.createdAt || response.metadata?.submittedAt;
      if (createdAt) {
        const key = new Date(createdAt).toISOString().slice(0, 10);
        responsesByDayMap.set(key, (responsesByDayMap.get(key) || 0) + 1);
        if (!firstResponseAt) {
          firstResponseAt = createdAt;
        }
        lastResponseAt = createdAt;
      }

      if (response.isAnonymous) {
        anonymousCount += 1;
      } else {
        authenticatedCount += 1;
      }

      const device = detectDevice(response.metadata?.userAgent);
      deviceBreakdown[device] += 1;
    });

    const responsesByDay = Array.from(responsesByDayMap.entries()).map(([date, count]) => ({
      date,
      count
    }));

    const questionStats = poll.questions.map((question) => {
      const optionCounts = new Map();
      question.options.forEach((opt) => optionCounts.set(String(opt._id), 0));

      let totalAnswered = 0;

      responses.forEach((response) => {
        const answer = response.answers.find(
          (item) => String(item.questionId) === String(question._id)
        );
        if (answer) {
          totalAnswered += 1;
          const key = String(answer.selectedOptionId);
          optionCounts.set(key, (optionCounts.get(key) || 0) + 1);
        }
      });

      const options = question.options.map((option) => {
        const count = optionCounts.get(String(option._id)) || 0;
        const percentage = totalAnswered
          ? Math.round((count / totalAnswered) * 1000) / 10
          : 0;
        return {
          optionId: option._id,
          text: option.text,
          count,
          percentage
        };
      });

      const leadingOption = options.reduce(
        (leader, current) => (current.count > leader.count ? current : leader),
        options[0] || { text: "", count: 0 }
      );

      return {
        questionId: question._id,
        text: question.text,
        required: question.required,
        totalAnswered,
        skippedCount: totalResponses - totalAnswered,
        options,
        leadingOption: { text: leadingOption.text, count: leadingOption.count }
      };
    });

    const recentResponses = responses.slice(-5).reverse().map((response) => ({
      id: response._id,
      submittedAt: response.metadata?.submittedAt || response.createdAt,
      isAnonymous: response.isAnonymous,
      answersCount: response.answers.length
    }));

    return res.json({
      totalResponses,
      viewCount,
      completionRate,
      avgCompletionTime: poll.meta?.avgCompletionTime || 0,
      firstResponseAt,
      lastResponseAt,
      responsesByDay,
      questions: questionStats,
      anonymousCount,
      authenticatedCount,
      deviceBreakdown,
      recentResponses
    });
  } catch (error) {
    return next(error);
  }
}
