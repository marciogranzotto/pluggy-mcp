import { describe, it, expect } from 'vitest';
import { handleListConnectors } from '../../tools.js';

const hasCredentials = !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);

describe.skipIf(!hasCredentials)('Pluggy API smoke test (requires real credentials)', () => {
  it('listConnectors connects to the API and returns a results array', async () => {
    const result = await handleListConnectors({});
    expect(result.content[0].text).not.toMatch(/^Error/);
    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty('results');
    expect(Array.isArray(json.results)).toBe(true);
  });
});
