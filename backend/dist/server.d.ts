import { Server } from 'socket.io';
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
declare function broadcastEventUpdate(eventId: string, data: any): void;
declare function broadcastUserUpdate(userId: string, data: any): void;
declare function broadcastAdminUpdate(data: any): void;
declare global {
    var broadcastEventUpdate: (eventId: string, data: any) => void;
    var broadcastUserUpdate: (userId: string, data: any) => void;
    var broadcastAdminUpdate: (data: any) => void;
}
export { io, broadcastEventUpdate, broadcastUserUpdate, broadcastAdminUpdate };
