declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
      cookies?: Record<string, string>;
    }
  }
}

export {};
