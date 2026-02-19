import { describe, it, expect } from 'vitest';
import { handleListItems } from '../../tools.js';

const hasCredentials = !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);

describe.skipIf(!hasCredentials)('Pluggy API smoke test (requires real credentials)', () => {
  it('listItems connects to the API and returns a results array', async () => {
    const result = await handleListItems({});
    // If auth failed, the text will start with "Error"
    expect(result.content[0].text).not.toMatch(/^Error/);
    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty('results');
    expect(Array.isArray(json.results)).toBe(true);
  });
});
