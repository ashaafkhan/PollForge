import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import admin from "../config/firebaseAdmin.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../services/tokenService.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res.status(201).json({
      accessToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        avatar: user.avatar,
        creatorScore: user.creatorScore,
        pollsCreated: user.pollsCreated,
        totalResponsesCollected: user.totalResponsesCollected,
        badges: user.badges 
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res.json({
      accessToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        avatar: user.avatar,
        creatorScore: user.creatorScore,
        pollsCreated: user.pollsCreated,
        totalResponsesCollected: user.totalResponsesCollected,
        badges: user.badges 
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res.json({ accessToken });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res) {
  res.clearCookie("refreshToken", cookieOptions);
  return res.json({ message: "Logged out" });
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      creatorScore: user.creatorScore,
      pollsCreated: user.pollsCreated,
      totalResponsesCollected: user.totalResponsesCollected,
      badges: user.badges
    });
  } catch (error) {
    return next(error);
  }
}

export async function firebaseLogin(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId: uid,
        avatar: picture || '',
      });
      // Award "First Poll" badge (or similar logic)
    } else if (!user.googleId) {
      user.googleId = uid;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res.json({
      accessToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        avatar: user.avatar,
        creatorScore: user.creatorScore,
        pollsCreated: user.pollsCreated,
        totalResponsesCollected: user.totalResponsesCollected,
        badges: user.badges 
      }
    });
  } catch (error) {
    console.error("Firebase login error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
}
