import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { getApiUrl } from '../../client/src/utils/api.js';

describe('Frontend API URL Construction for Cloudflare Pages & Local Proxy', () => {
  const prodBaseUrl = 'https://span-industrial-api.ankitbathla-ind.workers.dev';

  test('1. Unset VITE_API_BASE_URL preserves relative URL for local Vite proxy', () => {
    const url = getApiUrl('/api/inquiries', undefined);
    assert.strictEqual(url, '/api/inquiries', 'Should return relative path when base URL is undefined');
  });

  test('2. Empty or whitespace VITE_API_BASE_URL preserves relative URL', () => {
    assert.strictEqual(getApiUrl('/api/inquiries', ''), '/api/inquiries');
    assert.strictEqual(getApiUrl('/api/inquiries', '   '), '/api/inquiries');
  });

  test('3. Configured VITE_API_BASE_URL prepends base URL to path', () => {
    const url = getApiUrl('/api/inquiries', prodBaseUrl);
    assert.strictEqual(
      url,
      'https://span-industrial-api.ankitbathla-ind.workers.dev/api/inquiries',
      'Should construct absolute API URL with production Worker domain'
    );
  });

  test('4. Trailing slashes on VITE_API_BASE_URL are stripped cleanly without double slashes', () => {
    const withSingleSlash = `${prodBaseUrl}/`;
    const withMultiSlashes = `${prodBaseUrl}///`;

    assert.strictEqual(
      getApiUrl('/api/inquiries', withSingleSlash),
      'https://span-industrial-api.ankitbathla-ind.workers.dev/api/inquiries',
      'Single trailing slash must not result in // in path'
    );
    assert.strictEqual(
      getApiUrl('/api/inquiries', withMultiSlashes),
      'https://span-industrial-api.ankitbathla-ind.workers.dev/api/inquiries',
      'Multiple trailing slashes must not result in // in path'
    );
  });

  test('5. Path without leading slash is normalized properly', () => {
    assert.strictEqual(
      getApiUrl('api/inquiries', prodBaseUrl),
      'https://span-industrial-api.ankitbathla-ind.workers.dev/api/inquiries'
    );
    assert.strictEqual(
      getApiUrl('api/inquiries', undefined),
      '/api/inquiries'
    );
  });

  test('6. Contact.tsx imports and invokes getApiUrl for inquiry submission', () => {
    const candidates = [
      path.resolve(process.cwd(), '../client/src/components/Contact.tsx'),
      path.resolve(process.cwd(), 'client/src/components/Contact.tsx'),
      path.resolve(__dirname, '../../client/src/components/Contact.tsx'),
    ];
    const contactFilePath = candidates.find((p) => fs.existsSync(p));
    assert.ok(contactFilePath && fs.existsSync(contactFilePath), 'Contact.tsx must exist');
    const content = fs.readFileSync(contactFilePath, 'utf8');

    assert.ok(
      content.includes("import { getApiUrl } from '../utils/api'"),
      'Contact.tsx must import getApiUrl'
    );
    assert.ok(
      content.includes("fetch(getApiUrl('/api/inquiries')"),
      'Contact.tsx must invoke getApiUrl for /api/inquiries fetch'
    );
    assert.ok(
      !content.includes('https://span-industrial-api.ankitbathla-ind.workers.dev'),
      'Contact.tsx must not hardcode the production Worker API URL'
    );
  });
});
