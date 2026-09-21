const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const port = 5517;
const baseUrl = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  PORT: String(port),
  DATABASE_URL: 'postgresql://dummy:dummy@127.0.0.1:65432/dummy',
  DIRECT_URL: 'postgresql://dummy:dummy@127.0.0.1:65432/dummy',
  JWT_SECRET: 'dummy-smoke-test-secret-with-at-least-32-chars',
  CORS_ORIGIN: 'http://localhost:5173',
};

const child = spawn(process.execPath, ['dist/index.js'], {
  cwd: process.cwd(),
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
child.stdout.on('data', (chunk) => { output += chunk.toString(); });
child.stderr.on('data', (chunk) => { output += chunk.toString(); });

const stop = () => {
  if (!child.killed) child.kill('SIGTERM');
};

const waitForServer = async () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      await fetch(`${baseUrl}/api/health`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Server did not start. Output:\n${output}`);
};

const request = (path, options) => fetch(`${baseUrl}${path}`, options);

(async () => {
  try {
    await waitForServer();

    const health = await request('/api/health');
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'OK');

    const boards = await request('/api/boards');
    assert.equal(boards.status, 401);

    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'invalid', password: 'x' }),
    });
    assert.equal(invalidLogin.status, 400);
    assert.equal((await invalidLogin.json()).message, 'Validation failed');

    const unavailableDatabase = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'dummy@example.com',
        password: 'password123',
        name: 'Dummy',
      }),
    });
    assert.equal(unavailableDatabase.status, 500);

    console.log('Backend dummy smoke test passed');
  } finally {
    stop();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
