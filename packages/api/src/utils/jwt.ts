import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const EXPIRATION = "24h";

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRATION });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
