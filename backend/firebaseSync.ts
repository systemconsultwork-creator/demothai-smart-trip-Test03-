import crypto from 'node:crypto';

const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Firestore sync is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.'
    );
  }

  return { projectId, clientEmail, privateKey };
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const { clientEmail, privateKey } = getFirebaseConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: FIRESTORE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firebase OAuth token request failed (${response.status}): ${body}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

function toFirestoreValue(value: unknown): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, any> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      fields[key] = toFirestoreValue(nestedValue);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(value: Record<string, unknown>) {
  const fields: Record<string, any> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    fields[key] = toFirestoreValue(nestedValue);
  }
  return fields;
}

async function commitChunk(projectId: string, accessToken: string, places: any[]) {
  const writes = places.map((place) => ({
    update: {
      name: `projects/${projectId}/databases/(default)/documents/places/${String(place.id)}`,
      fields: toFirestoreFields(place),
    },
  }));

  const response = await fetch(`${FIRESTORE_BASE}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ writes }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firestore commit failed (${response.status}): ${body}`);
  }

  return response.json();
}

export async function syncPlacesToFirebase(places: any[]) {
  const { projectId } = getFirebaseConfig();
  const accessToken = await getAccessToken();
  const chunkSize = 400;
  let synced = 0;

  for (let index = 0; index < places.length; index += chunkSize) {
    const chunk = places.slice(index, index + chunkSize);
    await commitChunk(projectId, accessToken, chunk);
    synced += chunk.length;
  }

  return {
    success: true,
    collection: 'places',
    synced,
    projectId,
    syncedAt: new Date().toISOString(),
  };
}

export async function syncPlacesFromJsonFile(places: any[]) {
  try {
    return await syncPlacesToFirebase(places);
  } catch (error) {
    console.error('[Firebase Sync] Failed:', error);
    return {
      success: false,
      collection: 'places',
      synced: 0,
      error: error instanceof Error ? error.message : String(error),
      syncedAt: new Date().toISOString(),
    };
  }
}
