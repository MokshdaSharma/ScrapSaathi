import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { users, findUserByIdentifier, findUserById, type User } from "../store.js";

const JWT_SECRET = process.env.JWT_SECRET || "scrapsaathi-super-secret-jwt-key-2026";
const router = Router();

// In-memory OTP storage for phone verification (phone -> code)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function generateToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      role: user.role,
      zoneId: user.zoneId,
      phone: user.phone,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// ---- POST /api/auth/register ----
router.post("/register", async (req: Request, res: Response) => {
  const { name, identifier, password, role, zoneId } = req.body as {
    name?: string;
    identifier?: string;
    password?: string;
    role?: "household" | "picker" | "aggregator";
    zoneId?: string;
  };

  if (!name || !identifier || !role) {
    return res.status(400).json({
      error: { code: "INVALID_BODY", message: "Name, identifier (phone/email), and role are required." },
    });
  }

  const existing = findUserByIdentifier(identifier);
  if (existing) {
    return res.status(409).json({
      error: { code: "USER_EXISTS", message: "An account with this phone or email already exists." },
    });
  }

  const isEmail = identifier.includes("@");
  const now = new Date().toISOString();
  const id = `user_${uuid().slice(0, 8)}`;
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  const newUser: User = {
    id,
    name,
    identifier,
    email: isEmail ? identifier : undefined,
    phone: !isEmail ? identifier : undefined,
    passwordHash,
    role,
    zoneId: zoneId || "zone_delhi_south",
    createdAt: now,
    reliabilityScore: role === "picker" ? 5.0 : undefined,
    totalCollections: role === "picker" ? 0 : undefined,
  };

  users.push(newUser);

  const token = generateToken(newUser);
  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      zoneId: newUser.zoneId,
      phone: newUser.phone,
      email: newUser.email,
      createdAt: newUser.createdAt,
      reliabilityScore: newUser.reliabilityScore,
      totalCollections: newUser.totalCollections,
    },
  });
});

// ---- POST /api/auth/login ----
router.post("/login", async (req: Request, res: Response) => {
  const { identifier, password } = req.body as { identifier?: string; password?: string };

  if (!identifier) {
    return res.status(400).json({
      error: { code: "INVALID_BODY", message: "Phone or email identifier is required." },
    });
  }

  const user = findUserByIdentifier(identifier);
  if (!user) {
    return res.status(401).json({
      error: { code: "INVALID_CREDENTIALS", message: "User not found with this identifier." },
    });
  }

  if (password && user.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Incorrect password." },
      });
    }
  }

  const token = generateToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      zoneId: user.zoneId,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      reliabilityScore: user.reliabilityScore,
      totalCollections: user.totalCollections,
    },
  });
});

// ---- POST /api/auth/otp-request ----
router.post("/otp-request", (req: Request, res: Response) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) {
    return res.status(400).json({ error: { code: "INVALID_BODY", message: "Phone number required." } });
  }

  const simulatedOtp = "123456";
  otpStore.set(phone.replace(/\D/g, ""), {
    code: simulatedOtp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return res.json({
    message: `OTP sent to ${phone}. For testing, use OTP: 123456`,
    simulatedOtp,
  });
});

// ---- POST /api/auth/otp-verify ----
router.post("/otp-verify", (req: Request, res: Response) => {
  const { phone, otp } = req.body as { phone?: string; otp?: string };
  if (!phone || !otp) {
    return res.status(400).json({ error: { code: "INVALID_BODY", message: "Phone and OTP required." } });
  }

  const cleanPhone = phone.replace(/\D/g, "");
  const record = otpStore.get(cleanPhone);

  if (!record || record.code !== otp || Date.now() > record.expiresAt) {
    if (otp !== "123456") {
      return res.status(401).json({ error: { code: "INVALID_OTP", message: "Invalid or expired OTP." } });
    }
  }

  let user = findUserByIdentifier(phone);
  if (!user) {
    // Auto-create picker / household user if not exists
    const id = `user_${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    user = {
      id,
      name: `User ${cleanPhone.slice(-4)}`,
      identifier: phone,
      phone,
      role: "picker",
      zoneId: "zone_delhi_south",
      createdAt: now,
      reliabilityScore: 4.8,
      totalCollections: 12,
    };
    users.push(user);
  }

  const token = generateToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      zoneId: user.zoneId,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      reliabilityScore: user.reliabilityScore,
      totalCollections: user.totalCollections,
    },
  });
});

// ---- POST /api/auth/demo-login ----
router.post("/demo-login", (req: Request, res: Response) => {
  const { role } = req.body as { role?: "household" | "picker" | "aggregator" };
  const targetRole = role || "household";

  const user = users.find((u) => u.role === targetRole);
  if (!user) {
    return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: `Demo user for role ${targetRole} not found.` } });
  }

  const token = generateToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      zoneId: user.zoneId,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      reliabilityScore: user.reliabilityScore,
      totalCollections: user.totalCollections,
    },
  });
});

// ---- GET /api/auth/me ----
router.get("/me", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Bearer token required." } });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = findUserById(decoded.sub);
    if (!user) {
      return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "User not found." } });
    }
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        zoneId: user.zoneId,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt,
        reliabilityScore: user.reliabilityScore,
        totalCollections: user.totalCollections,
      },
    });
  } catch {
    return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid or expired token." } });
  }
});

export default router;
