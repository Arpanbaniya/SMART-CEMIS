// backend/src/utils/db.ts
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    // Add connection options for better reliability
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit process, just log the error
    // This allows the app to continue and show meaningful errors
  }
};

export default connectDB;