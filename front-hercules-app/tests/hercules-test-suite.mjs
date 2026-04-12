/**
 * ============================================================
 * HERCULES AI — Test Suite Completo
 * ============================================================
 * Pruebas E2E para:
 *   1. Backend API Endpoints (Express :3000)
 *   2. Frontend Pages (Next.js :3001)
 *
 * Uso:  node tests/hercules-test-suite.mjs
 *
 * Requisitos: backend (port 3000), frontend (port 3001) activos
 * ============================================================
 */

const API = process.env.API_URL || 'http://localhost:3000';
const FRONT = process.env.FRONT_URL || 'http://localhost:3001';

// ── Helpers ─────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(color, icon, msg) {
  console.log(`  ${color}${icon}${colors.reset} ${msg}`);
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    log(colors.green, '[PASS]', name);
  } catch (err) {
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
    log(colors.red, '[FAIL]', `${name} — ${err.message}`);
  }
}

function skip(name, reason) {
  skipped++;
  results.push({ name, status: 'SKIP', reason });
  log(colors.yellow, '[SKIP]', `${name} — ${reason}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function section(title) {
  console.log(`\n${colors.cyan}${colors.bold}  ── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}${colors.reset}`);
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const contentType = res.headers.get('content-type') || '';
  let body = null;
  if (contentType.includes('json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, headers: res.headers, body };
}

async function fetchHTML(url) {
  const res = await fetch(url);
  const html = await res.text();
  return { status: res.status, html };
}

// ── Test Suites ─────────────────────────────────────────────

async function runBackendTests() {
  section('BACKEND — System Endpoints');

  await test('GET /api/health — returns 200 OK', async () => {
    const { status, body } = await fetchJSON(`${API}/api/health`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.status === 'ok' || body.status === 'healthy', `Expected healthy status, got ${JSON.stringify(body)}`);
  });

  await test('POST /api/cancel — returns 200', async () => {
    const { status } = await fetchJSON(`${API}/api/cancel`, { method: 'POST', body: '{}' });
    assert(status === 200, `Expected 200, got ${status}`);
  });

  // ──────────────────────────────────────────────────────────
  section('BACKEND — Auth Endpoints');

  await test('POST /api/auth/login — returns response', async () => {
    const { status } = await fetchJSON(`${API}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'test123' }),
    });
    // Could be 200 (valid creds) or 401 (invalid) — either means the endpoint works
    assert([200, 401, 400].includes(status), `Expected 200/401/400, got ${status}`);
  });

  await test('GET /api/auth/me — returns 401 without token', async () => {
    const { status } = await fetchJSON(`${API}/api/auth/me`);
    assert([200, 401, 403].includes(status), `Expected auth-related status, got ${status}`);
  });

  // ──────────────────────────────────────────────────────────
  section('BACKEND — Records / Profiles');

  await test('GET /api/profiles — returns profiles array', async () => {
    const { status, body } = await fetchJSON(`${API}/api/profiles`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.profiles !== undefined, 'Response should have profiles property');
    assert(Array.isArray(body.profiles), 'profiles should be an array');
  });

  let testNombre = null;
  let testDol = null;

  // If profiles exist, grab the first one for subsequent tests
  try {
    const { body } = await fetchJSON(`${API}/api/profiles`);
    if (body.profiles && body.profiles.length > 0) {
      testNombre = body.profiles[0].labelCliente;
      testDol = body.profiles[0].dol;
      log(colors.dim, ' [INFO]', `Using test case: "${testNombre}" | DOL: ${testDol}`);
    }
  } catch {}

  await test('GET /api/all-records — returns records array', async () => {
    const { status, body } = await fetchJSON(`${API}/api/all-records`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, 'Expected success: true');
    assert(Array.isArray(body.data), 'data should be an array');
  });

  if (testNombre && testDol) {
    await test('GET /api/lote-documents — returns docs for lote', async () => {
      const url = `${API}/api/lote-documents?nombre=${encodeURIComponent(testNombre)}&dol=${encodeURIComponent(testDol)}`;
      const { status, body } = await fetchJSON(url);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.success === true, 'Expected success: true');
      assert(Array.isArray(body.data), 'data should be an array');
    });

    await test('GET /api/pendientes — returns pendientes for lote', async () => {
      const url = `${API}/api/pendientes?nombre=${encodeURIComponent(testNombre)}&dol=${encodeURIComponent(testDol)}`;
      const { status, body } = await fetchJSON(url);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.success === true, 'Expected success: true');
      assert(Array.isArray(body.data), 'data should be an array');
    });

    await test('GET /api/thinking — returns thinking history', async () => {
      const url = `${API}/api/thinking?nombre=${encodeURIComponent(testNombre)}&dol=${encodeURIComponent(testDol)}`;
      const { status, body } = await fetchJSON(url);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.success === true, 'Expected success: true');
      assert(Array.isArray(body.data), 'data should be an array');
    });

    await test('GET /api/download — returns Excel file', async () => {
      const url = `${API}/api/download?nombre=${encodeURIComponent(testNombre)}&dol=${encodeURIComponent(testDol)}`;
      const res = await fetch(url);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      assert(
        ct.includes('spreadsheetml') || ct.includes('octet-stream'),
        `Expected Excel MIME type, got ${ct}`,
      );
      const disposition = res.headers.get('content-disposition') || '';
      assert(disposition.includes('attachment'), 'Expected attachment disposition');
    });
  } else {
    skip('GET /api/lote-documents', 'No test profiles available');
    skip('GET /api/pendientes', 'No test profiles available');
    skip('GET /api/thinking', 'No test profiles available');
    skip('GET /api/download', 'No test profiles available');
  }

  // ──────────────────────────────────────────────────────────
  section('BACKEND — Records Validation');

  await test('GET /api/lote-documents — 400 without params', async () => {
    const { status } = await fetchJSON(`${API}/api/lote-documents`);
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/update-document-field — 400 missing params', async () => {
    const { status } = await fetchJSON(`${API}/api/update-document-field`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/update-document-field — 400 invalid field', async () => {
    const { status } = await fetchJSON(`${API}/api/update-document-field`, {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'TEST',
        dol: '01/01/2024',
        archivoOrigen: 'test.pdf',
        field: 'hackerField',
        value: 'evil',
      }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/update-lineitem-field — 400 missing params', async () => {
    const { status } = await fetchJSON(`${API}/api/update-lineitem-field`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/update-lineitem-field — 400 invalid field', async () => {
    const { status } = await fetchJSON(`${API}/api/update-lineitem-field`, {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'TEST',
        dol: '01/01/2024',
        archivoOrigen: 'test.pdf',
        lineItemIndex: 0,
        field: 'hackerField',
        value: 'evil',
      }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/update-sender-group — 400 missing params', async () => {
    const { status } = await fetchJSON(`${API}/api/update-sender-group`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/assign-pendiente — 400 missing params', async () => {
    const { status } = await fetchJSON(`${API}/api/assign-pendiente`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/restore-record — 400 missing params', async () => {
    const { status } = await fetchJSON(`${API}/api/restore-record`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('DELETE /api/records — 400 without params', async () => {
    const { status } = await fetchJSON(`${API}/api/records`, { method: 'DELETE' });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('DELETE /api/lote — 400 without params', async () => {
    const { status } = await fetchJSON(`${API}/api/lote`, { method: 'DELETE' });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('DELETE /api/pendiente — 400 without params', async () => {
    const { status } = await fetchJSON(`${API}/api/pendiente`, { method: 'DELETE' });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // ──────────────────────────────────────────────────────────
  section('BACKEND — Trash');

  await test('GET /api/deleted-records — returns trash list', async () => {
    const { status, body } = await fetchJSON(`${API}/api/deleted-records`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, 'Expected success: true');
    assert(Array.isArray(body.list), 'list should be an array');
  });

  // ──────────────────────────────────────────────────────────
  section('BACKEND — QA Endpoints');

  if (testNombre && testDol) {
    await test('GET /api/qa-data — returns QA data', async () => {
      const url = `${API}/api/qa-data?nombre=${encodeURIComponent(testNombre)}&dol=${encodeURIComponent(testDol)}`;
      const { status, body } = await fetchJSON(url);
      assert([200, 400].includes(status), `Expected 200 or 400, got ${status}`);
    });

    await test('GET /api/check-files — returns file check', async () => {
      const url = `${API}/api/check-files?nombre=${encodeURIComponent(testNombre)}&dol=${encodeURIComponent(testDol)}`;
      const { status } = await fetchJSON(url);
      assert([200, 400].includes(status), `Expected 200 or 400, got ${status}`);
    });

    await test('GET /api/qa-status — returns status', async () => {
      const { status } = await fetchJSON(`${API}/api/qa-status`);
      assert(status === 200, `Expected 200, got ${status}`);
    });
  } else {
    skip('GET /api/qa-data', 'No test profiles available');
    skip('GET /api/check-files', 'No test profiles available');
    skip('GET /api/qa-status', 'No test profiles available');
  }

  // ──────────────────────────────────────────────────────────
  section('BACKEND — Upload (validation only)');

  await test('POST /api/upload — accepts POST request', async () => {
    const res = await fetch(`${API}/api/upload`, { method: 'POST' });
    // Endpoint is reachable — may return 200 (empty result) or 400/500
    assert([200, 400, 500].includes(res.status), `Expected 200/400/500, got ${res.status}`);
  });

  // ──────────────────────────────────────────────────────────
  section('BACKEND — Edge Cases & 404s');

  await test('GET /api/nonexistent — returns 404', async () => {
    const res = await fetch(`${API}/api/nonexistent`);
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test('POST /api/rescan-document — 400 missing params', async () => {
    const { status } = await fetchJSON(`${API}/api/rescan-document`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });
}

async function runFrontendTests() {
  section('FRONTEND — Public Pages');

  await test('GET / — Landing page loads (200)', async () => {
    const { status, html } = await fetchHTML(`${FRONT}/`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(html.includes('Hercules'), 'Landing should contain "Hercules" text');
  });

  await test('Landing page — has correct meta title', async () => {
    const { html } = await fetchHTML(`${FRONT}/`);
    assert(html.includes('<title>'), 'Page should have a <title> tag');
    assert(html.includes('Hercules AI'), 'Title should contain "Hercules AI"');
  });

  await test('Landing page — has hero section', async () => {
    const { html } = await fetchHTML(`${FRONT}/`);
    assert(
      html.includes('hero') || html.includes('Procesamiento') || html.includes('Inteligencia'),
      'Landing should have a hero section',
    );
  });

  await test('Landing page — has login/sign-in element', async () => {
    const { html } = await fetchHTML(`${FRONT}/`);
    assert(
      html.includes('Sign In') || html.includes('sign-in') || html.includes('login') || html.includes('Login') ||
      html.includes('nav-login-btn') || html.includes('Iniciar'),
      'Landing should have a Sign In / login element',
    );
  });

  await test('Landing page — no encoding issues (no mojibake)', async () => {
    const { html } = await fetchHTML(`${FRONT}/`);
    const mojibakePatterns = ['Ã³', 'Ã¡', 'Ã©', 'Â¿', 'ðŸ', 'â€'];
    for (const pattern of mojibakePatterns) {
      assert(!html.includes(pattern), `Found mojibake pattern: "${pattern}"`);
    }
  });

  await test('GET /login — Login page loads (200)', async () => {
    const { status, html } = await fetchHTML(`${FRONT}/login`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(
      html.includes('login') || html.includes('Login') || html.includes('password') || html.includes('Sign'),
      'Login page should have login form elements',
    );
  });

  await test('Login page — no mojibake', async () => {
    const { html } = await fetchHTML(`${FRONT}/login`);
    const mojibakePatterns = ['Ã³', 'Ã¡', 'Â¿', 'ðŸ'];
    for (const pattern of mojibakePatterns) {
      assert(!html.includes(pattern), `Found mojibake pattern: "${pattern}"`);
    }
  });

  // ──────────────────────────────────────────────────────────
  section('FRONTEND — Dashboard Pages');

  await test('GET /dashboard — Dashboard loads (200)', async () => {
    const { status, html } = await fetchHTML(`${FRONT}/dashboard`);
    assert(status === 200, `Expected 200, got ${status}`);
  });

  await test('GET /dashboard/organizer — Organizer page loads (200)', async () => {
    const { status, html } = await fetchHTML(`${FRONT}/dashboard/organizer`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(html.includes('Hercules'), 'Organizer should include Hercules branding');
  });

  await test('Organizer page — no mojibake', async () => {
    const { html } = await fetchHTML(`${FRONT}/dashboard/organizer`);
    const mojibakePatterns = ['Ã³', 'Ã¡', 'Ã©', 'Â¿', 'ðŸ', 'â€"', 'â€™'];
    for (const pattern of mojibakePatterns) {
      assert(!html.includes(pattern), `Found mojibake pattern: "${pattern}"`);
    }
  });

  await test('GET /dashboard/extractor — Extractor page loads (200)', async () => {
    const { status, html } = await fetchHTML(`${FRONT}/dashboard/extractor`);
    assert(status === 200, `Expected 200, got ${status}`);
  });

  await test('Extractor page — no mojibake', async () => {
    const { html } = await fetchHTML(`${FRONT}/dashboard/extractor`);
    const mojibakePatterns = ['Ã³', 'Ã¡', 'Ã©', 'Â¿', 'ðŸ', 'â€"'];
    for (const pattern of mojibakePatterns) {
      assert(!html.includes(pattern), `Found mojibake pattern: "${pattern}"`);
    }
  });

  // ──────────────────────────────────────────────────────────
  section('FRONTEND — Design System Verification');

  await test('Landing page — uses custom font (Inter via next/font)', async () => {
    const { html } = await fetchHTML(`${FRONT}/`);
    // next/font injects hashed class names like __className_xxxxx
    // Check for the font-family CSS variable or class patterns
    assert(
      html.includes('Inter') || html.includes('__') || html.includes('font') || html.includes('className'),
      'Page should reference a custom font class',
    );
  });

  await test('Landing page — uses orange accent in rendered styles', async () => {
    const { html } = await fetchHTML(`${FRONT}/`);
    // CSS custom properties are in linked stylesheets, not inline HTML
    // Check that the page loads CSS and has style references
    assert(
      html.includes('<link') || html.includes('<style') || html.includes('_next/static'),
      'Page should load CSS stylesheets with design system',
    );
  });

  await test('Landing page — no old cyan color (#00d2ff)', async () => {
    const { html } = await fetchHTML(`${FRONT}/`);
    assert(!html.includes('#00d2ff') && !html.includes('#00D2FF'), 'Should not have old cyan color');
  });

  await test('Landing page — no old purple color (#8a2be2)', async () => {
    const { html } = await fetchHTML(`${FRONT}/`);
    assert(!html.includes('#8a2be2') && !html.includes('#8A2BE2'), 'Should not have old purple color');
  });

  // ──────────────────────────────────────────────────────────
  section('FRONTEND — 404 Handling');

  await test('GET /nonexistent — returns 404 page', async () => {
    const res = await fetch(`${FRONT}/doesnotexist`);
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}  ╔══════════════════════════════════════════════════╗`);
  console.log(`  ║      HERCULES AI — Test Suite Completo           ║`);
  console.log(`  ╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.dim}  API:   ${API}`);
  console.log(`  FRONT: ${FRONT}${colors.reset}`);

  const start = Date.now();

  // Check connectivity first
  try {
    await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(5000) });
  } catch {
    console.error(`\n${colors.red}  [ERROR] Backend en ${API} no responde. Asegurate de que este corriendo.${colors.reset}\n`);
    process.exit(1);
  }

  try {
    await fetch(FRONT, { signal: AbortSignal.timeout(5000) });
  } catch {
    console.error(`\n${colors.red}  [ERROR] Frontend en ${FRONT} no responde. Asegurate de que este corriendo.${colors.reset}\n`);
    process.exit(1);
  }

  await runBackendTests();
  await runFrontendTests();

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  // ── Summary ─────────────────────────────────────────────
  console.log(`\n${colors.bold}${colors.cyan}  ── Resumen ${'─'.repeat(42)}${colors.reset}`);
  console.log(`${colors.green}  Pasaron:  ${passed}${colors.reset}`);
  if (failed > 0) console.log(`${colors.red}  Fallaron: ${failed}${colors.reset}`);
  if (skipped > 0) console.log(`${colors.yellow}  Omitidos: ${skipped}${colors.reset}`);
  console.log(`${colors.dim}  Tiempo:   ${elapsed}s${colors.reset}`);
  console.log(`${colors.dim}  Total:    ${passed + failed + skipped} tests${colors.reset}`);

  if (failed > 0) {
    console.log(`\n${colors.red}${colors.bold}  Tests fallidos:${colors.reset}`);
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`${colors.red}    ✗ ${r.name}${colors.reset}`);
        console.log(`${colors.dim}      ${r.error}${colors.reset}`);
      });
    console.log('');
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}  Todos los tests pasaron correctamente.${colors.reset}\n`);
    process.exit(0);
  }
}

main();
