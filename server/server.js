import app from './src/app.js';
import connectDB from './src/config/db.js';
import env from './src/config/env.js';

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] School Management System API running on port ${env.port} (${env.nodeEnv})`);
  });

  process.on('unhandledRejection', (err) => {
    // eslint-disable-next-line no-console
    console.error('[server] Unhandled rejection:', err);
    server.close(() => process.exit(1));
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
