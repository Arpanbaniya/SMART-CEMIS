// backend/src/types/session.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}