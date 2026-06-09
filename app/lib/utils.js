// Math Process & Consolidation logic
export function computeMetricsForList(list) {
  let currentKeiko = 0;
  let currentRoberto = 0;
  let currentValid = 0;
  
  let extrapKeiko = 0;
  let extrapRoberto = 0;
  let extrapValid = 0;
  
  let totalActs = 0;
  let contabilizadas = 0;
  
  const processed = list.map(r => {
    const kVotes = r.keiko_votos || 0;
    const rVotes = r.roberto_votos || 0;
    const valid = kVotes + rVotes;
    
    const kProj = r.keiko_projected || 0;
    const rProj = r.roberto_projected || 0;
    const validProj = kProj + rProj;
    
    currentKeiko += kVotes;
    currentRoberto += rVotes;
    currentValid += valid;
    
    extrapKeiko += kProj;
    extrapRoberto += rProj;
    extrapValid += validProj;
    
    totalActs += r.totalActas || 0;
    contabilizadas += r.contabilizadas || 0;
    
    return {
      ...r,
      calc: {
        kPct: valid > 0 ? (kVotes / valid * 100) : 50.0,
        rPct: valid > 0 ? (rVotes / valid * 100) : 50.0,
        valid: valid,
        kPctExtrap: validProj > 0 ? (kProj / validProj * 100) : 50.0,
        rPctExtrap: validProj > 0 ? (rProj / validProj * 100) : 50.0,
        validExtrap: validProj,
        winner: kVotes > rVotes ? 'keiko' : (rVotes > kVotes ? 'roberto' : 'tie')
      }
    };
  });
  
  const actsPct = totalActs > 0 ? (contabilizadas / totalActs * 100) : 0.0;
  
  const national = {
    actsPct: actsPct,
    totalActs: totalActs,
    contabilizadas: contabilizadas,
    current: {
      keiko: currentKeiko,
      keikoPct: currentValid > 0 ? (currentKeiko / currentValid * 100) : 50.0,
      roberto: currentRoberto,
      robertoPct: currentValid > 0 ? (currentRoberto / currentValid * 100) : 50.0,
      valid: currentValid,
      margin: Math.abs(currentKeiko - currentRoberto),
      marginPct: currentValid > 0 ? Math.abs((currentKeiko / currentValid * 100) - (currentRoberto / currentValid * 100)) : 0.0,
      leader: currentKeiko > currentRoberto ? 'Keiko Fujimori' : 'Roberto Sánchez'
    },
    extrapolated: {
      keiko: extrapKeiko,
      keikoPct: extrapValid > 0 ? (extrapKeiko / extrapValid * 100) : 50.0,
      roberto: extrapRoberto,
      robertoPct: extrapValid > 0 ? (extrapRoberto / extrapValid * 100) : 50.0,
      valid: extrapValid,
      margin: Math.abs(extrapKeiko - extrapRoberto),
      marginPct: extrapValid > 0 ? Math.abs((extrapKeiko / extrapValid * 100) - (extrapRoberto / extrapValid * 100)) : 0.0,
      leader: extrapKeiko > extrapRoberto ? 'Keiko Fujimori' : 'Roberto Sánchez'
    }
  };
  
  return { processed, national };
}

export function processData(raw) {
  if (!raw) return null;
  const peRes = computeMetricsForList(raw.regiones || []);
  const exRes = computeMetricsForList(raw.extranjero || []);
  return {
    ...raw,
    regiones: peRes.processed,
    extranjero: exRes.processed,
    national: {
      peru: peRes.national,
      extranjero: exRes.national
    }
  };
}
