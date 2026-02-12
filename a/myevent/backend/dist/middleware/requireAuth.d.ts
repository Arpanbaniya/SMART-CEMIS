import { Request, Response, NextFunction } from 'express';
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
