// backend/src/server.ts
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongodb-session';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './utils/db';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes'; // ← ADD THIS IMPORT
import paymentRoutes from './routes/paymentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB session store
const MongoDBStore = MongoStore(session);
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI!,
  collection: 'sessions',
});

store.on('error', (err) => console.error('Session store error:', err));

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000', // your frontend
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Routes
app.use('/', authRoutes);
app.use('/', eventRoutes); 
app.use('/', paymentRoutes); // ← ADD THIS LINE

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', session: req.session });
});

// Connect DB & start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
  });
});