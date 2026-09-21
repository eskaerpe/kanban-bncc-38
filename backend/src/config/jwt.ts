const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be configured and contain at least 32 characters');
}

export const JWT_SECRET = jwtSecret;
