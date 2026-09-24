// ============================================================
//  config/db.js
//  MongoDB Atlas connection via Mongoose
// ============================================================

const mongoose = require('mongoose');
const dns = require('dns');

// Set IPv4 first to avoid IPv6 timeouts in serverless / Node 18+ environments
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore in environments where setDefaultResultOrder is not supported
}

if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Fallback if DNS setServers fails in constrained runtime environments
  }
}

/**
 * Establishes or reuses a connection to MongoDB Atlas.
 * Reads the URI from process.env.MONGODB_URI (or aliases MONGO_URI, DATABASE_URL).
 * Supports serverless connection reuse (e.g. Vercel lambdas).
 */
let cachedConn = null;
let cachedPromise = null;

const connectDB = async () => {
  // If already connected, return active connection
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const rawUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URL ||
    '';

  const uri = rawUri.trim().replace(/^["']|["']$/g, '');

  if (!uri) {
    console.error('❌  MONGODB_URI is not defined in environment variables.');
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw new Error('MONGODB_URI is not defined in environment variables');
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

/**
 * Returns safe diagnostic metadata about the MongoDB configuration and state.
 * NEVER exposes passwords, usernames, or connection string secrets.
 */
const getDatabaseDiagnostic = () => {
  const rawUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URL ||
    '';
  const uri = rawUri.trim().replace(/^["']|["']$/g, '');

  const MONGODB_URI_PRESENT = uri.length > 0;

  let DATABASE_NAME_PRESENT = false;
  if (MONGODB_URI_PRESENT) {
    // Check if database name exists in URI path without exposing user or password
    const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
    DATABASE_NAME_PRESENT = Boolean(match && match[1] && match[1].trim().length > 0);
  }

  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const CONNECTION_STATE = stateMap[mongoose.connection.readyState] || 'unknown';

  return {
    MONGODB_URI_PRESENT,
    DATABASE_NAME_PRESENT,
    CONNECTION_STATE,
  };
};

/**
 * Sanitizes and categorizes MongoDB errors into controlled buckets.
 */
const categorizeMongoError = (err) => {
  if (!err) return 'NONE';
  const msg = (err.message || '').toLowerCase();
  if (msg.includes('not defined') || msg.includes('missing') || msg.includes('empty')) return 'MISSING_ENV';
  if (msg.includes('bad auth') || msg.includes('authentication failed') || msg.includes('auth error')) return 'AUTH_ERROR';
  if (msg.includes('enotfound') || msg.includes('econnrefused') || msg.includes('querysrv') || msg.includes('dns')) return 'DNS_ERROR';
  if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('serverselectionerror')) return 'TIMEOUT';
  if (msg.includes('tls') || msg.includes('ssl') || msg.includes('cert')) return 'TLS_ERROR';
  if (msg.includes('invalid scheme') || msg.includes('invalid uri') || msg.includes('uri malformed')) return 'INVALID_URI';
  if (msg.includes('network') || msg.includes('connection reset') || msg.includes('socket')) return 'NETWORK_ERROR';
  if (msg.includes('pool')) return 'CONNECTION_POOL_ERROR';
  return 'UNKNOWN';
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDatabaseDiagnostic = getDatabaseDiagnostic;
module.exports.categorizeMongoError = categorizeMongoError;
