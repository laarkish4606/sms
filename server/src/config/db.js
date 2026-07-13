import mongoose from 'mongoose';
import env from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log(`[mongo] connected -> ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[mongo] connection error:', err.message);
  });

  await mongoose.connect(env.mongoUri);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export default connectDB;
