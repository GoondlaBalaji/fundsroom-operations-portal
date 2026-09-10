// src/types/express.d.ts
import type { UserRole } from './enums';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
      };
    }
  }
}

export {};
