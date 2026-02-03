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
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent'}`);
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

// Professional route configuration
app.use('/api/auth', authRoutes);
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
app.use('/api/admin/payments', paymentRoutes);
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