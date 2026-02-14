import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

const originalLog = console.log;
const originalWarn = console.warn;
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

let suppressDotenv = true;

const tempLog = (msg: any) => {
  const msgStr = String(msg);
  if (suppressDotenv && (msgStr.includes('[dotenv') || msgStr.includes('tip:') || msgStr.includes('prevent') || msgStr.includes('audit secrets'))) {
    return;
  }
  originalLog(msg);
};

const tempWarn = (msg: any) => {
  const msgStr = String(msg);
  if (suppressDotenv && (msgStr.includes('[dotenv') || msgStr.includes('tip:') || msgStr.includes('prevent') || msgStr.includes('audit secrets'))) {
    return;
  }
  originalWarn(msg);
};

process.stdout.write = function(str: any) {
  const msgStr = String(str);
  if (suppressDotenv && (msgStr.includes('[dotenv') || msgStr.includes('tip:') || msgStr.includes('audit secrets'))) {
    return true;
  }
  return originalStdoutWrite(str);
};

console.log = tempLog;
console.warn = tempWarn;
dotenv.config();
console.log = originalLog;
console.warn = originalWarn;
process.stdout.write = originalStdoutWrite;
suppressDotenv = false;

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongodb-session';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import registrationRoutes from './routes/registrationRoutes';
import adminRequestRoutes from './routes/adminRequestRoutes';
import commentRoutes from './routes/commentRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import aiRoutes from './routes/aiRoutes';
import profileRoutes from './routes/profileRoutes';
import emailChangeRoutes from './routes/emailChangeRoutes';
import paymentRoutes from './routes/paymentRoutes';
import logsRoutes from './routes/logsRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import teamRoutes from './routes/teamRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import descriptionRoutes from './routes/descriptionRoutes';
import noticeRoutes from './routes/noticeRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import { createChatroomRoutes } from './routes/chatroomRoutes';
import { startEventReminderScheduler } from './services/eventReminderScheduler';

if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY not configured - limited sentiment analysis');
} else {
  console.log('OpenAI configured');
}

if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not configured');
  process.exit(1);
}

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const MongoDBStore = MongoStore(session);
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent',
  collection: 'sessions'
});

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

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myevent')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      const Event = (await import('./models/Event')).Event;
      const Registration = (await import('./models/Registration')).Registration;
      
      const events = await Event.find();
      let mismatches = 0;
      
      for (const event of events) {
        const actualCount = await Registration.countDocuments({ eventId: event._id.toString() });
        if (event.participantCount !== actualCount) {
          await Event.findByIdAndUpdate(event._id, { participantCount: actualCount });
          mismatches++;
        }
      }
      
      if (mismatches > 0) {
        console.log(`Fixed ${mismatches} participant count mismatch(es)`);
      }
    } catch (error) {
      console.error('Error during participant count verification:', error);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

const connectedUsers = new Map<string, string>();
const userSockets = new Map<string, string>();
const adminConnections = new Set<string>();

io.on('connection', (socket) => {
  socket.on('authenticate', (userId: string) => {
    try {
      connectedUsers.set(socket.id, userId);
      userSockets.set(userId, socket.id);
      socket.join(`user:${userId}`);
      socket.join('global_updates');
      
      socket.emit('authenticated', { 
        success: true, 
        userId, 
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown authentication error';
      console.error('Authentication error:', error);
      socket.emit('authentication', { 
        success: false, 
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('joinEvent', (eventId: string) => {
    socket.join(`event:${eventId}`);
  });

  socket.on('leaveEvent', (eventId: string) => {
    socket.leave(`event:${eventId}`);
  });

  socket.on('joinUser', (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on('joinAdmin', () => {
    adminConnections.add(socket.id);
    socket.join('admin_updates');
  });

  socket.on('joinChatroom', () => {
    socket.join('chatroom');
    io.to('chatroom').emit('adminJoined', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('leaveChatroom', () => {
    socket.leave('chatroom');
    io.to('chatroom').emit('adminLeft', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('chatMessage', (data: any) => {
    io.to('chatroom').emit('newMessage', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('messageDeleted', (data: any) => {
    io.to('chatroom').emit('messageRemoved', {
      messageId: data.messageId,
      deletedBy: data.deletedBy,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    const userId = connectedUsers.get(socket.id);
    const wasAdmin = adminConnections.has(socket.id);
    
    if (userId) {
      connectedUsers.delete(socket.id);
      userSockets.delete(userId);
      adminConnections.delete(socket.id);
    }
    
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
    
    io.to('admin_updates').emit('eventUpdate', {
      eventId,
      ...data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Broadcast error:', error);
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
    }
  } catch (error) {
    console.error('User broadcast error:', error);
  }
}

function broadcastAdminUpdate(data: any) {
  try {
    io.to('admin_updates').emit('adminUpdate', {
      ...data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin broadcast error:', error);
  }
}

declare global {
  var broadcastEventUpdate: (eventId: string, data: any) => void;
  var broadcastUserUpdate: (userId: string, data: any) => void;
  var broadcastAdminUpdate: (data: any) => void;
}

global.broadcastEventUpdate = broadcastEventUpdate;
global.broadcastUserUpdate = broadcastUserUpdate;
global.broadcastAdminUpdate = broadcastAdminUpdate;

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', registrationRoutes);
app.use('/api/events', commentRoutes);
app.use('/api/events', feedbackRoutes);
app.use('/api/events', teamRoutes);
app.use('/api/events', tournamentRoutes);
app.use('/api/users', registrationRoutes);
app.use('/api/admin', adminRequestRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/email-change', emailChangeRoutes);
// Public payment endpoints (initiate / verify) and admin payment management
app.use('/api/payment', paymentRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/descriptions', descriptionRoutes);

app.use('/api/notices', noticeRoutes);

app.use('/api/chatbot', chatbotRoutes);

app.use('/api/chatroom', createChatroomRoutes(io));

app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    connectedUsers: connectedUsers.size,
    adminConnections: adminConnections.size
  };
  
  res.json(healthStatus);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  const errorDetails = {
    message: err?.message || 'Unknown error',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  };
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : (err?.message || 'Unknown error'),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3101;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  startEventReminderScheduler();
});

export { io, broadcastEventUpdate, broadcastUserUpdate, broadcastAdminUpdate };