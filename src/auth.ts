export async function getPluggyAccessToken(): Promise<string> {
  const authResponse = await fetch('https://api.pluggy.ai/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET,
    }),
  });
  const authJson = await authResponse.json();
  return authJson.apiKey;
}
