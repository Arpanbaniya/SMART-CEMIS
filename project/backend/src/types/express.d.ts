// backend/src/types/express.d.ts

declare global {
  namespace Express {
    interface Request {
      browserContext?: string;
      requestToUse?: any; // For storing admin request ID to be marked as used
    }
  }
}

export {};
