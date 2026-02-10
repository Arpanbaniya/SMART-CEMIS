"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.broadcastEventUpdate = broadcastEventUpdate;
exports.broadcastUserUpdate = broadcastUserUpdate;
exports.broadcastAdminUpdate = broadcastAdminUpdate;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
// ⚠️ CRITICAL: Load environment variables FIRST before importing anything else
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const mongoose_1 = __importDefault(require("mongoose"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const registrationRoutes_1 = __importDefault(require("./routes/registrationRoutes"));
const adminRequestRoutes_1 = __importDefault(require("./routes/adminRequestRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const feedbackRoutes_1 = __importDefault(require("./routes/feedbackRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/favoriteRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const logsRoutes_1 = __importDefault(require("./routes/logsRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const tournamentRoutes_1 = __importDefault(require("./routes/tournamentRoutes"));
const recommendationRoutes_1 = __importDefault(require("./routes/recommendationRoutes"));
const descriptionRoutes_1 = __importDefault(require("./routes/descriptionRoutes"));
// Verify critical environment variables
if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not configured. Sentiment analysis features will be limited to rating-based analysis only.');
    console.warn('   To enable full AI-powered sentiment analysis, please set OPENAI_API_KEY in your .env file');
}
else {
    console.log('✅ OpenAI API key configured - AI sentiment analysis enabled');
}
if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not configured. Please set MONGODB_URI in your .env file');
    process.exit(1);
}
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Socket.IO configuration with enhanced settings
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});
exports.io = io;
// MongoDB session store with enhanced configuration
const MongoDBStore = (0, connect_mongodb_session_1.default)(express_session_1.default);
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent',
    collection: 'sessions'
});
// Professional middleware configuration
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'self'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({
    limit: '10mb',
    type: 'application/json'
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '10mb'
}));
// Enhanced session configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax'
    }
}));
// Database connection with retry logic
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent')
    .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent'}`);
    // Auto-recalculate participant counts on startup to fix any inconsistencies
    try {
        const Event = (await Promise.resolve().then(() => __importStar(require('./models/Event')))).Event;
        const Registration = (await Promise.resolve().then(() => __importStar(require('./models/Registration')))).Registration;
        const events = await Event.find();
        let mismatches = 0;
        for (const event of events) {
            const actualCount = await Registration.countDocuments({ eventId: event._id.toString() });
            if (event.participantCount !== actualCount) {
                await Event.findByIdAndUpdate(event._id, { participantCount: actualCount });
                console.log(`📊 Fixed participant count for "${event.title}": ${event.participantCount} → ${actualCount}`);
                mismatches++;
            }
        }
        if (mismatches > 0) {
            console.log(`⚠️  Fixed ${mismatches} participant count mismatch(es)`);
        }
        else {
            console.log('✅ All participant counts are consistent');
        }
    }
    catch (error) {
        console.error('⚠️  Error during participant count verification:', error);
        // Don't fail startup if this fails
    }
})
    .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('🔧 Troubleshooting tips:');
    console.error('   1. Check if MongoDB is running');
    console.error('   2. Verify connection string in .env');
    console.error('   3. Ensure network connectivity');
});
// Professional real-time connection management
const connectedUsers = new Map();
const userSockets = new Map();
const adminConnections = new Set();
// Enhanced Socket.IO connection handling with debugging
io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);
    socket.on('authenticate', (userId) => {
        try {
            connectedUsers.set(socket.id, userId);
            userSockets.set(userId, socket.id);
            socket.join(`user:${userId}`);
            socket.join('global_updates');
            const userRole = connectedUsers.get(socket.id) ? 'existing' : 'new';
            console.log(`👤 User authenticated: ${userId} (${userRole})`);
            // Send connection confirmation
            socket.emit('authenticated', {
                success: true,
                userId,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown authentication error';
            console.error('❌ Authentication error:', error);
            socket.emit('authentication', {
                success: false,
                error: message,
                timestamp: new Date().toISOString()
            });
        }
    });
    socket.on('joinEvent', (eventId) => {
        console.log(`📱 Socket ${socket.id} joining event room: ${eventId}`);
        socket.join(`event:${eventId}`);
    });
    socket.on('leaveEvent', (eventId) => {
        console.log(`📤 Socket ${socket.id} leaving event room: ${eventId}`);
        socket.leave(`event:${eventId}`);
    });
    socket.on('joinUser', (userId) => {
        console.log(`👤 Socket ${socket.id} joining user room: ${userId}`);
        socket.join(`user:${userId}`);
    });
    socket.on('joinAdmin', () => {
        adminConnections.add(socket.id);
        console.log(`👑 Socket ${socket.id} joined admin room (Admins: ${adminConnections.size})`);
        socket.join('admin_updates');
    });
    socket.on('disconnect', () => {
        const userId = connectedUsers.get(socket.id);
        const wasAdmin = adminConnections.has(socket.id);
        if (userId) {
            connectedUsers.delete(socket.id);
            userSockets.delete(userId);
            adminConnections.delete(socket.id);
            console.log(`🔌 User disconnected: ${userId} ${wasAdmin ? '(Admin)' : '(User)'}`);
        }
        // Broadcast disconnection to admin room
        if (wasAdmin) {
            io.to('admin_updates').emit('adminDisconnected', {
                userId,
                socketId: socket.id,
                adminCount: adminConnections.size - 1,
                timestamp: new Date().toISOString()
            });
        }
    });
});
// Professional broadcast functions with error handling
function broadcastEventUpdate(eventId, data) {
    try {
        io.to(`event:${eventId}`).emit('eventUpdate', {
            eventId,
            ...data,
            timestamp: new Date().toISOString()
        });
        io.to('global_updates').emit('globalEventUpdate', {
            eventId,
            ...data,
            timestamp: new Date().toISOString()
        });
        // Also broadcast to admin room
        io.to('admin_updates').emit('eventUpdate', {
            eventId,
            ...data,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 Event update broadcast: ${eventId}`);
    }
    catch (error) {
        console.error('❌ Broadcast error:', error);
    }
}
function broadcastUserUpdate(userId, data) {
    try {
        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(`user:${userId}`).emit('userUpdate', {
                ...data,
                timestamp: new Date().toISOString()
            });
            console.log(`👤 User update sent to: ${userId}`);
        }
        else {
            console.warn(`⚠️ User ${userId} not connected for update`);
        }
    }
    catch (error) {
        console.error('❌ User broadcast error:', error);
    }
}
function broadcastAdminUpdate(data) {
    try {
        io.to('admin_updates').emit('adminUpdate', {
            ...data,
            timestamp: new Date().toISOString()
        });
        console.log(`👑 Admin update broadcast to ${adminConnections.size} admins`);
    }
    catch (error) {
        console.error('❌ Admin broadcast error:', error);
    }
}
global.broadcastEventUpdate = broadcastEventUpdate;
global.broadcastUserUpdate = broadcastUserUpdate;
global.broadcastAdminUpdate = broadcastAdminUpdate;
// Professional route configuration
app.use('/api/auth', authRoutes_1.default);
app.use('/api/events', eventRoutes_1.default);
app.use('/api/events', registrationRoutes_1.default); // Mount registration routes for /:eventId/register (FIRST)
app.use('/api/events', commentRoutes_1.default); // Mount comment routes directly under /api/events
app.use('/api/events', feedbackRoutes_1.default); // Mount feedback routes directly under /api/events
app.use('/api/events', teamRoutes_1.default); // Mount team routes under events
app.use('/api/events', tournamentRoutes_1.default); // Mount tournament routes under events (AFTER registration routes)
app.use('/api/users', registrationRoutes_1.default); // Mount registration routes for /:userId/registrations
app.use('/api/admin', adminRequestRoutes_1.default);
app.use('/api/favorites', favoriteRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
// Public payment endpoints (initiate / verify) and admin payment management
app.use('/api/payment', paymentRoutes_1.default); // /initiate, /verify
app.use('/api/admin/payments', paymentRoutes_1.default); // admin listing, preview, resend
app.use('/api/admin/logs', logsRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
// ML Recommendation endpoints
app.use('/api/recommendations', recommendationRoutes_1.default);
// AI Description Generator endpoints
app.use('/api/descriptions', descriptionRoutes_1.default);
// Enhanced health check endpoint
app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        connectedUsers: connectedUsers.size,
        adminConnections: adminConnections.size,
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    };
    console.log('🏥 Health check requested:', healthStatus);
    res.json(healthStatus);
});
// Professional error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    // Enhanced error logging
    const errorDetails = {
        message: err?.message || 'Unknown error',
        stack: err?.stack,
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };
    console.error('🔥 Error details:', errorDetails);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : (err?.message || 'Unknown error'),
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' && { details: errorDetails })
    });
});
const PORT = process.env.PORT || 3101;
// Enhanced server startup with comprehensive logging
server.listen(PORT, () => {
    console.log('');
    console.log('🚀 EventHub Server Starting...');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    console.log(`🗄️ MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent'}`);
    console.log(`📊 Socket.IO Ready for real-time updates`);
    console.log(`👥 Connected Users: 0`);
    console.log(`👑 Admin Connections: 0`);
    console.log('');
    console.log('✅ Server is ready and accepting connections');
});
//# sourceMappingURL=server.js.map