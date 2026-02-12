/**
 * Direct Training Trigger Script
 * Bypasses authentication by directly calling the training function
 * Usage: node trigger-training.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the trainer
const { trainRecommendationModels } = require('./dist/services/ml/trainer');

async function triggerTraining() {
  try {
    console.log('\n🚀 Starting Recommendation Model Training...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventhub');
    console.log('✅ MongoDB connected\n');
    
    // Run training
    console.log('🧠 Training in progress (this may take 2-5 minutes)...\n');
    const result = await trainRecommendationModels();
    
    console.log('\n✅ TRAINING COMPLETE!\n');
    console.log('📊 Results:');
    console.log(`   - Dataset Size: ${result.dataSize} users`);
    console.log(`   - Training Date: ${result.trainingDate}`);
    console.log(`   - Overall Accuracy: ${result.accuracy}`);
    console.log(`\n✨ Model has been saved to database and is ready for use!\n`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Training failed:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Is MongoDB running?');
    console.error('   2. Check that .env file has MONGODB_URI set');
    console.error('   3. Run: npm run build (to compile TypeScript)');
    process.exit(1);
  }
}

triggerTraining();
