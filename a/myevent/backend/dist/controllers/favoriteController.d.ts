import { Request, Response } from 'express';
declare global {
    var broadcastEventUpdate: (eventId: string, data: any) => void;
}
export declare const addToFavorites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeFromFavorites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFavoriteEvents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkFavorite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
