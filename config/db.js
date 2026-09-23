// ============================================================
//  config/db.js
//  MongoDB Atlas connection via Mongoose
// ============================================================

const mongoose = require('mongoose');
const dns = require('dns');

// Use reliable public DNS resolvers to handle MongoDB Atlas SRV records on Windows
if (process.platform === 'win32') {
  try {
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Fallback if DNS setServers fails in constrained runtime environments
  }
}

/**
 * Establishes or reuses a connection to MongoDB Atlas.
 * Reads the URI from process.env.MONGODB_URI.
 * Supports serverless connection reuse (e.g. Vercel lambdas).
 */
let cachedConn = null;
let cachedPromise = null;

const connectDB = async () => {
  // If already connected, return active connection
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not defined in environment variables.');
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw new Error('MONGODB_URI is not defined');
  }

  if (!cachedPromise) {
    const opts = {
      serverSelectionTimeoutMS: 15000, // Tolerant selection window for network latency
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,                        // Force IPv4 DNS lookup
      maxPoolSize: 10,
      minPoolSize: process.env.VERCEL ? 0 : 2,
      bufferCommands: false,           // Fail fast if connection is lost
    };

    cachedPromise = mongoose.connect(uri, opts).then((conn) => {
      console.log(`✅  MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }).catch((error) => {
      cachedPromise = null;
      console.error(`❌  MongoDB connection failed: ${error.message}`);
      if (!process.env.VERCEL) {
        process.exit(1);
      }
      throw error;
    });
  }

  try {
    cachedConn = await cachedPromise;
    return cachedConn;
  } catch (error) {
    cachedPromise = null;
    throw error;
  }
};

module.exports = connectDB;
