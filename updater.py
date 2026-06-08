import urllib.request
import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta

def fetch_json(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-PE,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://resultadosegundavuelta.onpe.gob.pe/main/resumen',
        'Origin': 'https://resultadosegundavuelta.onpe.gob.pe',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8'))
            elif response.status == 204:
                return None
    except Exception as e:
        print(f"Error fetching {url}: {e}", file=sys.stderr)
        return None
    return None

def fetch_ambito_data(base, id_ambito, items_list, existing_series_map):
    results = []
    
    total_acts = 0
    total_contabilizadas = 0
    
    sum_keiko = 0
    sum_roberto = 0
    sum_valid = 0
    
    sum_extrap_keiko = 0
    sum_extrap_roberto = 0
    sum_extrap_valid = 0
    
    max_epoch = 0
    
    for item in items_list:
        ubigeo = item["ubigeo"]
        nombre = item["nombre"]
        print(f"  Fetching {nombre} ({ubigeo})...")
        
        url_totals = f"{base}/resumen-general/totales?idEleccion=10&tipoFiltro=ubigeo_nivel_01&idUbigeoDepartamento={ubigeo}&idAmbitoGeografico={id_ambito}"
        url_candidates = f"{base}/eleccion-presidencial/participantes-ubicacion-geografica-nombre?idEleccion=10&idAmbitoGeografico={id_ambito}&tipoFiltro=ubigeo_nivel_01&ubigeoNivel1={ubigeo}&ubigeoNivel2=&ubigeoNivel3="
        
        tot_res = fetch_json(url_totals)
        cand_res = fetch_json(url_candidates)
        
        if not tot_res or "data" not in tot_res or not cand_res or "data" not in cand_res:
            print(f"    [ERROR] Skip {nombre} due to API failure")
            continue
            
        tot_info = tot_res["data"]
        cand_list = cand_res["data"]
        
        epoch = tot_info.get("fechaActualizacion", 0)
        if epoch > max_epoch:
            max_epoch = epoch
            
        actas_pct = tot_info.get("actasContabilizadas", 0)
        total_actas = tot_info.get("totalActas", 0)
        contabilizadas = tot_info.get("contabilizadas", 0)
        total_emitidos = tot_info.get("totalVotosEmitidos", 0)
        total_validos = tot_info.get("totalVotosValidos", 0)
        
        total_acts += total_actas
        total_contabilizadas += contabilizadas
        
        keiko_votes = 0
        roberto_votes = 0
        blank_votes = 0
        null_votes = 0
        
        for cand in cand_list:
            code = cand.get("codigoAgrupacionPolitica")
            votes = cand.get("totalVotosValidos", 0)
            if code == "8":
                keiko_votes = votes
            elif code == "10":
                roberto_votes = votes
            elif code == "80":
                blank_votes = votes
            elif code == "81":
                null_votes = votes
                
        curr_valid = keiko_votes + roberto_votes
        
        # Extrapolation
        factor = 100.0 / actas_pct if actas_pct > 0 else 1.0
        extrap_keiko = round(keiko_votes * factor)
        extrap_roberto = round(roberto_votes * factor)
        extrap_valid = extrap_keiko + extrap_roberto
        
        # Accumulates
        sum_keiko += keiko_votes
        sum_roberto += roberto_votes
        sum_valid += curr_valid
        
        sum_extrap_keiko += extrap_keiko
        sum_extrap_roberto += extrap_roberto
        sum_extrap_valid += extrap_valid
        
        r_serie = existing_series_map.get(ubigeo, [])
        
        record = {
            "ubigeo": ubigeo,
            "nombre": nombre,
            "actasContabilizadas": actas_pct,
            "totalActas": total_actas,
            "contabilizadas": contabilizadas,
            "totalVotos": total_emitidos,
            "votosValidos": total_validos,
            "keiko_votos": keiko_votes,
            "roberto_votos": roberto_votes,
            "blank_votos": blank_votes,
            "null_votos": null_votes,
            "keiko_projected": extrap_keiko,
            "roberto_projected": extrap_roberto,
            "serie": r_serie
        }
        results.append(record)
        
        time.sleep(0.2)
        
    return results, total_acts, total_contabilizadas, sum_keiko, sum_roberto, sum_valid, sum_extrap_keiko, sum_extrap_roberto, sum_extrap_valid, max_epoch

def main():
    base = "https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend"
    lima_tz = timezone(timedelta(hours=-5))
    
    # 1. Fetch Peru Departments
    print("Fetching Peru departments list...")
    url_pe_depts = f"{base}/ubigeos/departamentos?idEleccion=10&idAmbitoGeografico=1"
    pe_depts_res = fetch_json(url_pe_depts)
    if not pe_depts_res or "data" not in pe_depts_res:
        print("Error: Could not retrieve Peru departments list.", file=sys.stderr)
        sys.exit(1)
    pe_depts_list = pe_depts_res["data"]
    
    # 2. Fetch Extranjero Continents
    print("Fetching Extranjero continents list...")
    url_ex_conts = f"{base}/ubigeos/departamentos?idEleccion=10&idAmbitoGeografico=2"
    ex_conts_res = fetch_json(url_ex_conts)
    if not ex_conts_res or "data" not in ex_conts_res:
        print("Error: Could not retrieve Extranjero continents list.", file=sys.stderr)
        sys.exit(1)
    ex_conts_list = ex_conts_res["data"]
    
    print(f"Loaded config: {len(pe_depts_list)} Peru departments, {len(ex_conts_list)} Extranjero continents.")
    
    # Load existing database
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_json_path = os.path.join(script_dir, "data.json")
    data_js_path = os.path.join(script_dir, "data.js")
    
    db_data = {"regiones": [], "extranjero": [], "latest": {}, "projections_history": []}
    if os.path.exists(data_json_path):
        try:
            with open(data_json_path, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                if isinstance(loaded, dict):
                    db_data = loaded
        except Exception as e:
            print(f"Warning: Could not read existing data.json: {e}", file=sys.stderr)
            
    if "regiones" not in db_data or not isinstance(db_data["regiones"], list):
        db_data["regiones"] = []
    if "extranjero" not in db_data or not isinstance(db_data["extranjero"], list):
        db_data["extranjero"] = []
    if "projections_history" not in db_data or not isinstance(db_data["projections_history"], list):
        db_data["projections_history"] = []

    # Map existing series maps
    existing_series_map = {}
    for r in db_data["regiones"]:
        existing_series_map[r.get("ubigeo")] = r.get("serie", [])
    for r in db_data["extranjero"]:
        existing_series_map[r.get("ubigeo")] = r.get("serie", [])

    # Fetch Peru Data
    print("\n>>> FETCHING PERU DATA (Ambito 1)...")
    pe_records, pe_total_acts, pe_contab, pe_k, pe_r, pe_val, pe_ex_k, pe_ex_r, pe_ex_val, pe_epoch = fetch_ambito_data(
        base, 1, pe_depts_list, existing_series_map
    )
    
    # Fetch Extranjero Data
    print("\n>>> FETCHING EXTRANJERO DATA (Ambito 2)...")
    ex_records, ex_total_acts, ex_contab, ex_k, ex_r, ex_val, ex_ex_k, ex_ex_r, ex_ex_val, ex_epoch = fetch_ambito_data(
        base, 2, ex_conts_list, existing_series_map
    )
    
    pe_acts_pct = (pe_contab / pe_total_acts * 100) if pe_total_acts > 0 else 0.0
    ex_acts_pct = (ex_contab / ex_total_acts * 100) if ex_total_acts > 0 else 0.0
    
    max_update_epoch = max(pe_epoch, ex_epoch)
    if max_update_epoch > 0:
        dt_update = datetime.fromtimestamp(max_update_epoch / 1000.0, tz=lima_tz)
    else:
        dt_update = datetime.now(lima_tz)
        
    timestamp_str = dt_update.isoformat()
    time_display = dt_update.strftime("%I:%M:%S %p")
    
    # Check if we should append to national history (based on Peru acts percentage change)
    should_append = True
    history = db_data["projections_history"]
    if len(history) > 0:
        last = history[-1]
        if abs(last["acts_pct"] - pe_acts_pct) < 0.00001:
            should_append = False
            print("\nNo new national Peru data progress. History timeline and regional/continental series not updated.")
            
    if should_append:
        new_entry = {
            "timestamp": timestamp_str,
            "time_display": time_display,
            "acts_pct": pe_acts_pct,
            "current_keiko": pe_k,
            "current_roberto": pe_r,
            "current_keiko_pct": (pe_k / pe_val * 100) if pe_val > 0 else 50.0,
            "current_roberto_pct": (pe_r / pe_val * 100) if pe_val > 0 else 50.0,
            "projected_keiko": pe_ex_k,
            "projected_roberto": pe_ex_r,
            "projected_keiko_pct": (pe_ex_k / pe_ex_val * 100) if pe_ex_val > 0 else 50.0,
            "projected_roberto_pct": (pe_ex_r / pe_ex_val * 100) if pe_ex_val > 0 else 50.0
        }
        history.append(new_entry)
        
        # Append corresponding point to each Peru region's serie
        for r in pe_records:
            valid = r["keiko_votos"] + r["roberto_votos"]
            k_pct = (r["keiko_votos"] / valid * 100) if valid > 0 else 50.0
            r_pct = (r["roberto_votos"] / valid * 100) if valid > 0 else 50.0
            r["serie"].append({
                "a": round(r_pct, 3), # Roberto
                "b": round(k_pct, 3), # Keiko
                "t": time_display
            })
            
        # Append corresponding point to each continent's serie
        for r in ex_records:
            valid = r["keiko_votos"] + r["roberto_votos"]
            k_pct = (r["keiko_votos"] / valid * 100) if valid > 0 else 50.0
            r_pct = (r["roberto_votos"] / valid * 100) if valid > 0 else 50.0
            r["serie"].append({
                "a": round(r_pct, 3), # Roberto
                "b": round(k_pct, 3), # Keiko
                "t": time_display
            })
            
        print(f"\nAppended new snapshot at {time_display} (Peru Acts: {pe_acts_pct:.3f}%, Extranjero Acts: {ex_acts_pct:.3f}%)")
        
    combined = {
        "regiones": pe_records,
        "extranjero": ex_records,
        "latest": {
            "fechaActualizacion": max_update_epoch if max_update_epoch > 0 else int(time.time() * 1000)
        },
        "projections_history": history
    }
    
    # Save files
    with open(data_json_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    print(f"Saved database to {data_json_path}")
    
    with open(data_js_path, "w", encoding="utf-8") as f:
        f.write("// generated automatically by updater.py\n")
        f.write("const ELECTION_DATA = ")
        json.dump(combined, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    print(f"Generated data.js successfully to {data_js_path}")

if __name__ == "__main__":
    main()
