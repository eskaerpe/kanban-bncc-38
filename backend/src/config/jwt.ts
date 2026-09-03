if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not defined in process.env. Using default fallback key.');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'kanban-bncc-jwt-secret-key-2026-production-fallback';
