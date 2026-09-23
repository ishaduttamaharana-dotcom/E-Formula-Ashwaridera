// ============================================================
//  server.js
//  HTTP server entry point.
//  Responsibilities:
//    1. Load environment variables
//    2. Connect to MongoDB
//    3. Start the HTTP server
//  All Express configuration lives in app.js.
// ============================================================

// Load environment variables FIRST — before any other imports
require('dotenv').config();

const dns = require('dns');
if (process.platform === 'win32') {
  try {
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {}
}

const app        = require('./app');
const connectDB  = require('./config/db');
const { seedAdmin } = require('./services/authService');
const { seedDefaultContentTypes } = require('./controllers/contentTypeController');

const PORT = process.env.PORT || 5000;
const ENV  = process.env.NODE_ENV || 'development';

// ─── Connect to database, then start server ──────────────────
const startServer = async () => {
  // Establish MongoDB connection before accepting traffic
  await connectDB();

  // Seed admin account from env vars (idempotent — safe to run every startup)
  await seedAdmin();

  // Seed default CMS content types (idempotent)
  await seedDefaultContentTypes();

  const server = app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log(`🚀  Server is running`);
    console.log(`📡  http://localhost:${PORT}`);
    console.log(`🌍  Environment : ${ENV}`);
    console.log(`🔗  API Base    : http://localhost:${PORT}/api/v1`);
    console.log(`💚  Health check: http://localhost:${PORT}/api/v1/health`);
    console.log('═══════════════════════════════════════════════');
    console.log('');
  });

  // ─── Graceful shutdown ────────────────────────────────────
  const gracefulShutdown = (signal) => {
    console.log(`\n⚠️   ${signal} received. Closing server gracefully...`);
    server.close(() => {
      console.log('✅  HTTP server closed.');
      process.exit(0);
    });

    // Force exit after 10 seconds if server hasn't closed
    setTimeout(() => {
      console.error('❌  Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  // ─── Unhandled promise rejections ────────────────────────
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌  Unhandled Promise Rejection:', reason);
    // Gracefully shut down on unhandled rejection
    server.close(() => process.exit(1));
  });

  // ─── Uncaught exceptions ──────────────────────────────────
  process.on('uncaughtException', (err) => {
    console.error('❌  Uncaught Exception:', err.message);
    process.exit(1);
  });
};

startServer();