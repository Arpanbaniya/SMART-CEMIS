import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// ⚠️ CRITICAL: Load environment variables FIRST before importing anything else
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongodb-session';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import registrationRoutes from './routes/registrationRoutes';
import adminRequestRoutes from './routes/adminRequestRoutes';
import commentRoutes from './routes/commentRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import aiRoutes from './routes/aiRoutes';
import profileRoutes from './routes/profileRoutes';
import paymentRoutes from './routes/paymentRoutes';
import logsRoutes from './routes/logsRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import teamRoutes from './routes/teamRoutes';
import tournamentRoutes from './routes/tournamentRoutes';

// Verify critical environment variables
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY is not configured. Sentiment analysis features will be limited to rating-based analysis only.');
  console.warn('   To enable full AI-powered sentiment analysis, please set OPENAI_API_KEY in your .env file');
} else {
  console.log('✅ OpenAI API key configured - AI sentiment analysis enabled');
}

if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not configured. Please set MONGODB_URI in your .env file');
  process.exit(1);
}

const app = express();
const server = createServer(app);

// Socket.IO configuration with enhanced settings
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// MongoDB session store with enhanced configuration
const MongoDBStore = MongoStore(session);
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent',
  collection: 'sessions'
});

// Professional middleware configuration
app.use(helmet({
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

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Enhanced session configuration
app.use(session({
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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent')
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent'}`);
    
    // Auto-recalculate participant counts on startup to fix any inconsistencies
    try {
      const Event = (await import('./models/Event')).Event;
      const Registration = (await import('./models/Registration')).Registration;
      
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
      } else {
        console.log('✅ All participant counts are consistent');
      }
    } catch (error) {
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
const connectedUsers = new Map<string, string>();
const userSockets = new Map<string, string>();
const adminConnections = new Set<string>();

// Enhanced Socket.IO connection handling with debugging
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);
  
  socket.on('authenticate', (userId: string) => {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown authentication error';
      console.error('❌ Authentication error:', error);
      socket.emit('authentication', { 
        success: false, 
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('joinEvent', (eventId: string) => {
    console.log(`📱 Socket ${socket.id} joining event room: ${eventId}`);
    socket.join(`event:${eventId}`);
  });

  socket.on('leaveEvent', (eventId: string) => {
    console.log(`📤 Socket ${socket.id} leaving event room: ${eventId}`);
    socket.leave(`event:${eventId}`);
  });

  socket.on('joinUser', (userId: string) => {
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
function broadcastEventUpdate(eventId: string, data: any) {
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
  } catch (error) {
    console.error('❌ Broadcast error:', error);
  }
}

function broadcastUserUpdate(userId: string, data: any) {
  try {
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(`user:${userId}`).emit('userUpdate', {
        ...data,
        timestamp: new Date().toISOString()
      });
      console.log(`👤 User update sent to: ${userId}`);
    } else {
      console.warn(`⚠️ User ${userId} not connected for update`);
    }
  } catch (error) {
    console.error('❌ User broadcast error:', error);
  }
}

function broadcastAdminUpdate(data: any) {
  try {
    io.to('admin_updates').emit('adminUpdate', {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    console.log(`👑 Admin update broadcast to ${adminConnections.size} admins`);
  } catch (error) {
    console.error('❌ Admin broadcast error:', error);
  }
}

// Make broadcast functions available globally
declare global {
  var broadcastEventUpdate: (eventId: string, data: any) => void;
  var broadcastUserUpdate: (userId: string, data: any) => void;
  var broadcastAdminUpdate: (data: any) => void;
}

global.broadcastEventUpdate = broadcastEventUpdate;
global.broadcastUserUpdate = broadcastUserUpdate;
global.broadcastAdminUpdate = broadcastAdminUpdate;

<<<<<<< HEAD
// Professional route configuration
app.use('/api/auth', authRoutes);
=======
/**\n * ╔═══════════════════════════════════════════════════════════════════════════════════╗\n * ║                                                                                       ║\n * ║              🔗 SMART-CEMIS API ROUTES - SHARED BETWEEN FRONTEND & BACKEND 🔗       ║\n * ║                                                                                       ║\n * ║  This section defines all API routes that are consumed by the frontend client.      ║\n * ║  Each route file (in src/routes/) contains detailed documentation about:             ║\n * ║    - Request/Response formats                                                        ║\n * ║    - Frontend usage locations                                                        ║\n * ║    - Authentication requirements                                                     ║\n * ║    - Related components and hooks                                                    ║\n * ╚═══════════════════════════════════════════════════════════════════════════════════╝\n *\n * 📋 API ENDPOINT SUMMARY:\n * ═════════════════════════════════════════════════════════════════════════════════════\n *\n * AUTH ROUTES (/api/auth)\n * │\n * ├─ POST   /login                    - User login\n * ├─ POST   /register                 - User registration  \n * ├─ GET    /user                     - Get current user profile\n * ├─ POST   /verify-email             - Verify user email\n * ├─ POST   /resend-verification      - Resend verification email\n * ├─ GET    /event-creation-permission - Check event creation permission\n * └─ POST   /logout                   - User logout\n *\n * EVENT ROUTES (/api/events)\n * │\n * ├─ GET    /                        - List all events (with pagination & filters)\n * ├─ POST   /                        - Create new event (admin only)\n * ├─ GET    /:id                     - Get single event details\n * ├─ PATCH  /:id                     - Update event (admin only)\n * ├─ DELETE /:id                     - Delete event (admin only)\n * ├─ GET    /:eventId/participants   - Get event participants\n * ├─ GET    /:eventId/registrations  - Get registration details\n * │\n * ├─ REGISTRATION SUBROUTES\n * │  ├─ POST   /:eventId/register       - Register user for event\n * │  ├─ GET    /:eventId/check-registration - Check if user registered\n * │  └─ DELETE /:eventId/unregister     - Unregister from event\n * │\n * ├─ COMMENT SUBROUTES\n * │  ├─ GET    /:eventId/comments       - Get all event comments\n * │  ├─ GET    /:eventId/user-comments  - Get user's comments\n * │  └─ POST   /:eventId/comments       - Post new comment\n * │\n * ├─ FEEDBACK SUBROUTES\n * │  ├─ GET    /feedback/:eventId       - Get all feedback\n * │  ├─ POST   /feedback/:eventId       - Post new feedback\n * │  └─ GET    /:eventId/sentiment      - Get sentiment analysis\n * │\n * ├─ TEAM SUBROUTES\n * │  ├─ GET    /:eventId/teams         - Get all event teams\n * │  ├─ GET    /:eventId/teams/:teamName - Get specific team details\n * │  ├─ POST   /:eventId/teams         - Create new team\n * │  ├─ PUT    /:eventId/teams/:teamName/join - Join a team\n * │  └─ DELETE /:eventId/teams/:teamName/leave - Leave a team\n * │\n * └─ TOURNAMENT SUBROUTES\n *    ├─ GET    /:eventId/tournament    - Get tournament details\n *    ├─ POST   /:eventId/tournament/rounds - Create tournament rounds\n *    ├─ POST   /:eventId/tournament/matches - Create matches\n *    └─ POST   /:eventId/tournament/next-round - Progress tournament\n *\n * USER ROUTES (/api/users)\n * │\n * └─ GET    /:userId/registrations   - Get user's event registrations\n *\n * PROFILE ROUTES (/api/profile)\n * │\n * ├─ GET    /                        - Get current user's profile\n * └─ PATCH  /                        - Update user's profile\n *\n * FAVORITES ROUTES (/api/favorites)\n * │\n * ├─ GET    /                        - Get user's favorite events\n * ├─ POST   /                        - Add event to favorites\n * ├─ DELETE /:eventId                - Remove event from favorites\n * └─ GET    /check/:eventId          - Check if event is favorited\n *\n * PAYMENT ROUTES (/api/payment & /api/admin/payments)\n * │\n * ├─ POST   /initiate                - Initiate eSewa payment\n * └─ GET    /verify                  - Verify payment completion\n *\n * ADMIN ROUTES (/api/admin)\n * │\n * ├─ GET    /requests                - Get admin requests\n * ├─ POST   /requests                - Create admin request\n * ├─ PATCH  /requests/:id            - Review admin request\n * │\n * ├─ PAYMENTS MANAGEMENT\n * │  ├─ GET    /payments              - List all payments\n * │  ├─ POST   /payments/preview      - Preview payment details\n * │  └─ POST   /payments/resend       - Resend payment confirmation\n * │\n * └─ LOGS\n *    └─ GET    /logs                 - Get admin activity logs\n *\n * AI ROUTES (/api/ai)\n * │\n * └─ POST   /generate-summary        - Generate event summary\n *\n * ANALYTICS ROUTES (/api/analytics)\n * │\n * ├─ GET    /events                  - Get event analytics\n * ├─ GET    /users                   - Get user analytics\n * └─ GET    /registrations           - Get registration analytics\n *\n * ═════════════════════════════════════════════════════════════════════════════════════\n * 🔐 AUTHENTICATION:\n * ─  Most routes require 'requireAuth' middleware\n * ─  Admin routes require 'requireAdmin' middleware (super_admin or student_admin)\n * ─  Some public routes (GET /events) allow unauthenticated access\n *\n * 🔄 REAL-TIME UPDATES:\n * ─  WebSocket connections enabled for live updates\n * ─  Event updates broadcast to connected clients\n * ─  See use-websocket.ts in frontend for consumption\n *\n * ═════════════════════════════════════════════════════════════════════════════════════\n */\n\n// Professional route configuration\napp.use('/api/auth', authRoutes);
>>>>>>> 6fc2a7b (google maps, google calender added)
app.use('/api/events', eventRoutes);
app.use('/api/events', registrationRoutes); // Mount registration routes for /:eventId/register (FIRST)
app.use('/api/events', commentRoutes); // Mount comment routes directly under /api/events
app.use('/api/events', feedbackRoutes); // Mount feedback routes directly under /api/events
app.use('/api/events', teamRoutes); // Mount team routes under events
app.use('/api/events', tournamentRoutes); // Mount tournament routes under events (AFTER registration routes)
app.use('/api/users', registrationRoutes); // Mount registration routes for /:userId/registrations
app.use('/api/admin', adminRequestRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
// Public payment endpoints (initiate / verify) and admin payment management
app.use('/api/payment', paymentRoutes);       // /initiate, /verify
app.use('/api/admin/payments', paymentRoutes); // admin listing, preview, resend
app.use('/api/admin/logs', logsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    connectedUsers: connectedUsers.size,
    adminConnections: adminConnections.size,
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };
  
  console.log('🏥 Health check requested:', healthStatus);
  res.json(healthStatus);
});

// Professional error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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

export { io, broadcastEventUpdate, broadcastUserUpdate, broadcastAdminUpdate };