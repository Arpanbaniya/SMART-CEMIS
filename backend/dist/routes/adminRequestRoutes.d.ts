declare global {
    var broadcastEventUpdate: (eventId: string, data: any) => void;
    var broadcastUserUpdate: (userId: string, data: any) => void;
}
declare const router: import("express-serve-static-core").Router;
export default router;
