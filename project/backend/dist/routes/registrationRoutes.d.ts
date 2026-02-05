declare global {
    var broadcastEventUpdate: (eventId: string, data: any) => void;
}
declare const router: import("express-serve-static-core").Router;
export declare function setBroadcastFunction(fn: (eventId: string, data: any) => void): void;
export default router;
