#!/usr/bin/env node

const { spawn } = require('child_process');

const port = process.env.PORT || '3000';
const host = process.env.HOSTNAME || '0.0.0.0';

console.log(`[PG-SETU] Starting Next.js production server on ${host}:${port}...`);

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'start', '-H', host, '-p', String(port)], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('[PG-SETU] Failed to start Next.js process:', err);
  process.exit(1);
});
