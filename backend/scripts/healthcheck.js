const port = process.env.PORT || '3000';
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 4000);

try {
  const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
    signal: controller.signal,
  });
  if (!response.ok) {
    process.exitCode = 1;
  }
} catch {
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
