import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load @vercel/kv conditionally if env variables are available
let kv = null;
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (kvUrl && kvToken) {
  try {
    const { createClient } = require('@vercel/kv');
    kv = createClient({
      url: kvUrl,
      token: kvToken,
    });
    console.log("Initialized Vercel KV Client successfully.");
  } catch (e) {
    console.error("Failed to initialize Vercel KV client:", e);
  }
}

const BASE_URL = "https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend";

// HTTP Headers matching the scraper Python script
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-PE,es;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://resultadosegundavuelta.onpe.gob.pe/main/resumen',
  'Origin': 'https://resultadosegundavuelta.onpe.gob.pe',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin'
};

// Helper to get Lima Time (UTC-5)
function getLimaTime(dateOrEpoch) {
  const d = new Date(dateOrEpoch);
  const formatterIso = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const pts = formatterIso.formatToParts(d);
  const year = pts.find(p => p.type === 'year').value;
  const month = pts.find(p => p.type === 'month').value;
  const day = pts.find(p => p.type === 'day').value;
  const hour = pts.find(p => p.type === 'hour').value;
  const minute = pts.find(p => p.type === 'minute').value;
  const second = pts.find(p => p.type === 'second').value;
  
  const timestampStr = `${year}-${month}-${day}T${hour}:${minute}:${second}-05:00`;
  
  // time_display formatting: e.g. "04:30:15 PM"
  let hr = parseInt(hour, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12;
  if (hr === 0) hr = 12;
  const hrStr = hr.toString().padStart(2, '0');
  const timeDisplay = `${hrStr}:${minute}:${second} ${ampm}`;
  
  return { timestampStr, timeDisplay };
}

// Fetch helper with error handling
async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      next: { revalidate: 0 } // Bypass Next.js default fetch cache
    });
    if (res.status === 200) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error(`Error fetching JSON from ${url}:`, err);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// EMA Projection: Computes projected votes at 100% using Exponential
// Moving Average of the marginal vote share from the last N deltas.
// ──────────────────────────────────────────────────────────────────────────
function computeEmaProjection(rSerie, keikoVotes, robertoVotes, actasPct) {
  const currValid = keikoVotes + robertoVotes;

  // Default shares (fallback: use accumulated proportions)
  let emaShareKeiko = currValid > 0 ? keikoVotes / currValid : 0.5;
  let emaShareRoberto = currValid > 0 ? robertoVotes / currValid : 0.5;

  // Collect all consecutive deltas from series entries that have kv/rv
  let prevKv = null;
  let prevRv = null;
  let validDeltas = 0;
  let emaK = null; // EMA of keiko's share of new votes
  let emaR = null;

  for (const pt of rSerie) {
    if (pt && typeof pt.kv === 'number' && typeof pt.rv === 'number') {
      if (prevKv !== null) {
        const dk = pt.kv - prevKv;
        const dr = pt.rv - prevRv;
        const dt = dk + dr;
        if (dt > 0 && dk >= 0 && dr >= 0) {
          validDeltas++;
          const N = Math.min(validDeltas, 10);
          const alpha = 2 / (N + 1);
          const sk = dk / dt;
          const sr = dr / dt;
          if (emaK === null) {
            emaK = sk;
            emaR = sr;
          } else {
            emaK = alpha * sk + (1 - alpha) * emaK;
            emaR = alpha * sr + (1 - alpha) * emaR;
          }
        }
      }
      prevKv = pt.kv;
      prevRv = pt.rv;
    }
  }

  // Also include the delta from the last series point to current ONPE data
  if (prevKv !== null) {
    const dk = keikoVotes - prevKv;
    const dr = robertoVotes - prevRv;
    const dt = dk + dr;
    if (dt > 0 && dk >= 0 && dr >= 0) {
      validDeltas++;
      const N = Math.min(validDeltas, 10);
      const alpha = 2 / (N + 1);
      const sk = dk / dt;
      const sr = dr / dt;
      if (emaK === null) {
        emaK = sk;
        emaR = sr;
      } else {
        emaK = alpha * sk + (1 - alpha) * emaK;
        emaR = alpha * sr + (1 - alpha) * emaR;
      }
    }
  }

  // Use EMA shares if we have at least one valid delta
  if (emaK !== null) {
    emaShareKeiko = emaK;
    emaShareRoberto = emaR;
  }

  // Estimate remaining valid votes and project
  const factor = actasPct > 0 ? (100.0 / actasPct) : 1.0;
  const validEst = currValid * factor;
  const remaining = Math.max(0, validEst - currValid);

  const extrapKeiko = Math.round(keikoVotes + remaining * emaShareKeiko);
  const extrapRoberto = Math.round(robertoVotes + remaining * emaShareRoberto);

  return { extrapKeiko, extrapRoberto };
}

// Scrape helper for a single department/continent
async function fetchItemData(idAmbito, item, existingSeriesMap) {
  const ubigeo = item.ubigeo;
  const nombre = item.nombre;
  
  const urlTotals = `${BASE_URL}/resumen-general/totales?idEleccion=10&tipoFiltro=ubigeo_nivel_01&idUbigeoDepartamento=${ubigeo}&idAmbitoGeografico=${idAmbito}`;
  const urlCandidates = `${BASE_URL}/eleccion-presidencial/participantes-ubicacion-geografica-nombre?idEleccion=10&idAmbitoGeografico=${idAmbito}&tipoFiltro=ubigeo_nivel_01&ubigeoNivel1=${ubigeo}&ubigeoNivel2=&ubigeoNivel3=`;
  
  const [totRes, candRes] = await Promise.all([
    fetchJson(urlTotals),
    fetchJson(urlCandidates)
  ]);
  
  if (!totRes || !totRes.data || !candRes || !candRes.data) {
    return null;
  }
  
  const totInfo = totRes.data;
  const candList = candRes.data;
  
  const epoch = totInfo.fechaActualizacion || 0;
  const actasPct = totInfo.actasContabilizadas || 0;
  const totalActas = totInfo.totalActas || 0;
  const contabilizadas = totInfo.contabilizadas || 0;
  const totalEmitidos = totInfo.totalVotosEmitidos || 0;
  const totalValidos = totInfo.totalVotosValidos || 0;
  
  let keikoVotes = 0;
  let robertoVotes = 0;
  let blankVotes = 0;
  let nullVotes = 0;
  
  for (const cand of candList) {
    const code = cand.codigoAgrupacionPolitica;
    const votes = cand.totalVotosValidos || 0;
    if (code === "8") {
      keikoVotes = votes;
    } else if (code === "10") {
      robertoVotes = votes;
    } else if (code === "80") {
      blankVotes = votes;
    } else if (code === "81") {
      nullVotes = votes;
    }
  }
  
  const rSerie = existingSeriesMap[ubigeo] || [];

  // EMA-based projection
  const { extrapKeiko, extrapRoberto } = computeEmaProjection(
    rSerie, keikoVotes, robertoVotes, actasPct
  );
  
  return {
    ubigeo,
    nombre,
    actasContabilizadas: actasPct,
    totalActas,
    contabilizadas,
    totalVotos: totalEmitidos,
    votosValidos: totalValidos,
    keiko_votos: keikoVotes,
    roberto_votos: robertoVotes,
    blank_votos: blankVotes,
    null_votos: nullVotes,
    keiko_projected: extrapKeiko,
    roberto_projected: extrapRoberto,
    serie: rSerie,
    epoch
  };
}

export async function GET(request) {
  try {
    // Detect if this is a cron invocation
    const isCron = request.headers.get('x-vercel-cron') === '1'
                || request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;

    // 1. Load existing database (Vercel KV or Local File)
    let dbData = { regiones: [], extranjero: [], latest: {}, projections_history: [] };
    let loadedFromKV = false;
    
    if (kv) {
      try {
        const stored = await kv.get('election_data');
        if (stored && typeof stored === 'object') {
          dbData = stored;
          loadedFromKV = true;
          console.log("Loaded existing data from Vercel KV.");
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
          console.log("Loaded existing data from local data.json.");
        }
      } catch (e) {
        console.error("Error reading local data.json:", e);
      }
    }
    
    // Ensure lists are present
    if (!dbData.regiones) dbData.regiones = [];
    if (!dbData.extranjero) dbData.extranjero = [];
    if (!dbData.projections_history) dbData.projections_history = [];
    
    // Create map of existing series
    const existingSeriesMap = {};
    for (const r of dbData.regiones) {
      existingSeriesMap[r.ubigeo] = r.serie || [];
    }
    for (const r of dbData.extranjero) {
      existingSeriesMap[r.ubigeo] = r.serie || [];
    }
    
    // 2. Fetch list of departments and continents from ONPE
    const urlPeruDepts = `${BASE_URL}/ubigeos/departamentos?idEleccion=10&idAmbitoGeografico=1`;
    const urlExtraConts = `${BASE_URL}/ubigeos/departamentos?idEleccion=10&idAmbitoGeografico=2`;
    
    const [peDeptsRes, exContsRes] = await Promise.all([
      fetchJson(urlPeruDepts),
      fetchJson(urlExtraConts)
    ]);
    
    if (!peDeptsRes || !peDeptsRes.data || !exContsRes || !exContsRes.data) {
      console.warn("ONPE API departments list failed. Serving cached database.");
      return NextResponse.json(dbData, {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=30'
        }
      });
    }
    
    const peDeptsList = peDeptsRes.data;
    const exContsList = exContsRes.data;
    
    // 3. Fetch data in parallel to avoid long execution times
    const pePromises = peDeptsList.map(item => fetchItemData(1, item, existingSeriesMap));
    const exPromises = exContsList.map(item => fetchItemData(2, item, existingSeriesMap));
    
    const [peRecordsRaw, exRecordsRaw] = await Promise.all([
      Promise.all(pePromises),
      Promise.all(exPromises)
    ]);
    
    // Filter out null records from API errors
    const peRecords = peRecordsRaw.filter(r => r !== null);
    const exRecords = exRecordsRaw.filter(r => r !== null);
    
    if (peRecords.length === 0 || exRecords.length === 0) {
      console.warn("ONPE API detailed data failed. Serving cached database.");
      return NextResponse.json(dbData, {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=30'
        }
      });
    }
    
    // Calculate totals for Peru
    let peTotalActs = 0;
    let peContab = 0;
    let peK = 0;
    let peR = 0;
    let peVal = 0;
    let peExK = 0;
    let peExR = 0;
    let peExVal = 0;
    let peEpoch = 0;
    
    for (const r of peRecords) {
      peTotalActs += r.totalActas || 0;
      peContab += r.contabilizadas || 0;
      peK += r.keiko_votos || 0;
      peR += r.roberto_votos || 0;
      peVal += (r.keiko_votos + r.roberto_votos);
      peExK += r.keiko_projected || 0;
      peExR += r.roberto_projected || 0;
      peExVal += (r.keiko_projected + r.roberto_projected);
      if (r.epoch > peEpoch) peEpoch = r.epoch;
    }
    
    // Calculate totals for Extranjero
    let exTotalActs = 0;
    let exContab = 0;
    let exK = 0;
    let exR = 0;
    let exVal = 0;
    let exExK = 0;
    let exExR = 0;
    let exExVal = 0;
    let exEpoch = 0;

    for (const r of exRecords) {
      exTotalActs += r.totalActas || 0;
      exContab += r.contabilizadas || 0;
      exK += r.keiko_votos || 0;
      exR += r.roberto_votos || 0;
      exVal += (r.keiko_votos + r.roberto_votos);
      exExK += r.keiko_projected || 0;
      exExR += r.roberto_projected || 0;
      exExVal += (r.keiko_projected + r.roberto_projected);
      if (r.epoch > exEpoch) exEpoch = r.epoch;
    }
    
    const peActsPct = peTotalActs > 0 ? (peContab / peTotalActs * 100) : 0.0;
    const exActsPct = exTotalActs > 0 ? (exContab / exTotalActs * 100) : 0.0;
    
    const maxUpdateEpoch = Math.max(peEpoch, exEpoch);
    const { timestampStr, timeDisplay } = getLimaTime(maxUpdateEpoch > 0 ? maxUpdateEpoch : Date.now());
    
    // 4. Separate shouldAppend checks for Peru and Extranjero
    const history = dbData.projections_history || [];
    let shouldAppendPeru = true;
    let shouldAppendExtra = true;

    if (history.length > 0) {
      const lastEntry = history[history.length - 1];
      // Check Peru progress
      if (typeof lastEntry.acts_pct === 'number' && Math.abs(lastEntry.acts_pct - peActsPct) < 0.00001) {
        shouldAppendPeru = false;
      }
      // Check Extranjero progress independently
      if (typeof lastEntry.ex_acts_pct === 'number' && Math.abs(lastEntry.ex_acts_pct - exActsPct) < 0.00001) {
        shouldAppendExtra = false;
      }
    }

    // Add to projections_history if EITHER changed
    if (shouldAppendPeru || shouldAppendExtra) {
      const newEntry = {
        timestamp: timestampStr,
        time_display: timeDisplay,
        acts_pct: peActsPct,
        ex_acts_pct: exActsPct,
        current_keiko: peK,
        current_roberto: peR,
        current_keiko_pct: peVal > 0 ? (peK / peVal * 100) : 50.0,
        current_roberto_pct: peVal > 0 ? (peR / peVal * 100) : 50.0,
        projected_keiko: peExK,
        projected_roberto: peExR,
        projected_keiko_pct: peExVal > 0 ? (peExK / peExVal * 100) : 50.0,
        projected_roberto_pct: peExVal > 0 ? (peExR / peExVal * 100) : 50.0,
        // Extranjero totals in history
        ex_current_keiko: exK,
        ex_current_roberto: exR,
        ex_projected_keiko: exExK,
        ex_projected_roberto: exExR,
      };
      history.push(newEntry);
    }
    
    // Append time point to Peru regions (only if Peru data changed)
    if (shouldAppendPeru) {
      for (const r of peRecords) {
        const valid = r.keiko_votos + r.roberto_votos;
        const kPct = valid > 0 ? (r.keiko_votos / valid * 100) : 50.0;
        const rPct = valid > 0 ? (r.roberto_votos / valid * 100) : 50.0;
        r.serie.push({
          a: parseFloat(rPct.toFixed(3)), // Roberto
          b: parseFloat(kPct.toFixed(3)), // Keiko
          t: timeDisplay,
          kv: r.keiko_votos,
          rv: r.roberto_votos
        });
      }
    }
    
    // Append time point to Extranjero continents (only if Extranjero data changed)
    if (shouldAppendExtra) {
      for (const r of exRecords) {
        const valid = r.keiko_votos + r.roberto_votos;
        const kPct = valid > 0 ? (r.keiko_votos / valid * 100) : 50.0;
        const rPct = valid > 0 ? (r.roberto_votos / valid * 100) : 50.0;
        r.serie.push({
          a: parseFloat(rPct.toFixed(3)), // Roberto
          b: parseFloat(kPct.toFixed(3)), // Keiko
          t: timeDisplay,
          kv: r.keiko_votos,
          rv: r.roberto_votos
        });
      }
    }
    
    const combined = {
      regiones: peRecords,
      extranjero: exRecords,
      latest: {
        fechaActualizacion: maxUpdateEpoch > 0 ? maxUpdateEpoch : Date.now()
      },
      projections_history: history
    };
    
    // 5. Save back database if KV is available
    if (kv) {
      try {
        await kv.set('election_data', combined);
        console.log("Successfully saved updated database to Vercel KV.");
      } catch (e) {
        console.error("Failed to save to Vercel KV:", e);
      }
    }
    
    // CDN cache: 60s (reduced from 300s), cron calls bypass CDN
    const cacheControl = isCron
      ? 'no-store'
      : 's-maxage=60, stale-while-revalidate=30';

    return NextResponse.json(combined, {
      headers: {
        'Cache-Control': cacheControl,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error("Fatal error in GET route:", err);
    return NextResponse.json({ error: "Fatal server error" }, { status: 500 });
  }
}
