import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEndpoint } from '../src/accounts/endpoint';
test('credentials travel over HTTPS except on explicit local development networks', () => {
  for (const url of ['https://api.example.com', 'http://127.0.0.1:4174', 'http://192.168.1.3:4174', 'http://10.0.0.2:4174']) assert.equal(validateEndpoint(url), url);
  for (const url of ['http://api.example.com', 'https://user:secret@example.com', 'https://api.example.com/path', 'http://192.168.evil.test']) assert.throws(() => validateEndpoint(url));
});
