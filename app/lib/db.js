import { createClient } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

let kv = null;
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (kvUrl && kvToken) {
  try {
    kv = createClient({
      url: kvUrl,
      token: kvToken,
    });
    console.log("Initialized Vercel KV Client successfully in lib/db.js.");
  } catch (e) {
    console.error("Failed to initialize Vercel KV client in lib/db.js:", e);
  }
}

export async function getElectionData() {
  let dbData = { regiones: [], extranjero: [], latest: {}, projections_history: [] };
  let loadedFromKV = false;
  
  if (kv) {
    try {
      const stored = await kv.get('election_data');
      if (stored && typeof stored === 'object') {
        dbData = stored;
        loadedFromKV = true;
      }
    } catch (e) {
      console.error("Error fetching from Vercel KV:", e);
    }
  }
  
  if (!loadedFromKV) {
    try {
      const filePath = path.join(process.cwd(), 'data.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        dbData = JSON.parse(fileContent);
        console.log("Loaded existing data from local data.json in lib/db.js.");
      }
    } catch (e) {
      console.error("Error reading local data.json:", e);
    }
  }
  
  // Ensure lists are present
  if (!dbData.regiones) dbData.regiones = [];
  if (!dbData.extranjero) dbData.extranjero = [];
  if (!dbData.projections_history) dbData.projections_history = [];
  
  return dbData;
}

export { kv };
