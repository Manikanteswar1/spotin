import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

// Connect to MongoDB with connection string from environment variable
// Falls back to in-memory MongoDB server for development if connection fails
const connectDB = async () => {
  try {
    // First try to connect to MongoDB Atlas if URI is provided
    if (process.env.MONGODB_URI) {
      try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
        return conn;
      } catch (atlasError) {
        console.error(`Failed to connect to MongoDB Atlas: ${atlasError instanceof Error ? atlasError.message : String(atlasError)}`);
        console.log('Falling back to in-memory MongoDB server...');
      }
    }

    // If Atlas connection failed or no URI provided, use in-memory server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory server
    const conn = await mongoose.connect(uri);
    console.log('Connected to in-memory MongoDB server');
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

// Cleanup function to stop in-memory server when the app is shutting down
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export default connectDB;