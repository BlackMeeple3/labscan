import { useState, useRef, useEffect, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { supabase, TEAM_USERS, getDeviceId, getSavedUser, saveUser, getAvatarUrl } from "./supabase.js";

const C = {
  bg: "#0f1117", surface: "#1a1d27", card: "#22263a",
  accent: "#4f8ef7", accentDim: "#2a4a8a", success: "#2ecc71",
  warn: "#f39c12", danger: "#e74c3c", text: "#e8eaf0",
  muted: "#7a8099", border: "#2e3350",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f1117; color: #e8eaf0; font-family: 'DM Sans', sans-serif; min-height: 100dvh; overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
  .app { max-width: 480px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; }
  .header { padding: 14px 20px 10px; border-bottom: 1px solid #2e3350; display: flex; align-items: center; gap: 10px; background: #1a1d27; position: sticky; top: 0; z-index: 10; }
  .header-logo { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #4f8ef7; letter-spacing: 2px; }
  .screen { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 16px; padding-bottom: 90px; }
  .photo-zone { border: 2px dashed #2e3350; border-radius: 16px; height: 190px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; background: #1a1d27; position: relative; overflow: hidden; }
  .photo-zone img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.7; }
  .photo-zone-overlay { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; background: rgba(15,17,23,0.65); padding: 10px 18px; border-radius: 10px; }
  .btn { display: flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; transition: opacity 0.15s, transform 0.1s; -webkit-user-select: none; user-select: none; }
  .btn:active { opacity: 0.78; transform: scale(0.96); }
  .btn-primary { background: #4f8ef7; color: #fff; padding: 14px 20px; font-size: 15px; width: 100%; }
  .btn-secondary { background: #22263a; color: #e8eaf0; padding: 12px 18px; font-size: 14px; border: 1px solid #2e3350; width: 100%; }
  .btn-success { background: #2ecc71; color: #fff; padding: 14px 20px; font-size: 15px; width: 100%; }
  .btn-danger { background: #e74c3c; color: #fff; padding: 12px 18px; font-size: 14px; }
  .btn-sm { background: #22263a; color: #7a8099; padding: 8px 14px; font-size: 12px; border: 1px solid #2e3350; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
  .btn:disabled, .btn-sm:disabled { opacity: 0.38; pointer-events: none; }
  .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; flex: 1; min-height: 300px; }
  .spinner { width: 44px; height: 44px; border: 3px solid #2e3350; border-top-color: #4f8ef7; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .progress-bar { width: 200px; height: 4px; background: #2e3350; border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: #4f8ef7; border-radius: 2px; transition: width 0.3s; }
  .sec-title { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #7a8099; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 2px; }
  .sample-list { display: flex; flex-direction: column; gap: 8px; }
  .sample-card { background: #22263a; border: 1px solid #2e3350; border-radius: 12px; padding: 13px 15px; cursor: pointer; transition: border-color 0.15s; -webkit-user-select: none; user-select: none; }
  .sample-card:active { background: #2a2f4a; }
  .sample-card.filled { border-color: #2ecc71; }
  .s-code { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #4f8ef7; display: flex; align-items: center; gap: 8px; }
  .s-dot { width: 8px; height: 8px; border-radius: 50%; background: #2e3350; flex-shrink: 0; }
  .s-dot.on { background: #2ecc71; }
  .s-text { font-size: 12px; color: #7a8099; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .badge { font-size: 10px; padding: 2px 7px; border-radius: 20px; margin-left: auto; font-family: 'JetBrains Mono', monospace; }
  .badge-ok { background: #1a4a30; color: #2ecc71; }
  .badge-warn { background: #4a3a1a; color: #f39c12; }
  .overlay-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.78); z-index: 100; display: flex; flex-direction: column; justify-content: flex-end; animation: fIn 0.14s ease; }
  @keyframes fIn { from { opacity: 0; } }
  .sheet { background: #1a1d27; border-radius: 20px 20px 0 0; padding: 20px; display: flex; flex-direction: column; gap: 14px; max-height: 94dvh; overflow-y: auto; animation: sUp 0.2s ease; }
  @keyframes sUp { from { transform: translateY(36px); opacity: 0; } }
  .handle { width: 40px; height: 4px; background: #2e3350; border-radius: 2px; margin: 0 auto -6px; }
  .sh-title { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: #4f8ef7; }
  .field-label { font-size: 11px; color: #7a8099; letter-spacing: 1px; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; margin-bottom: 6px; }
  .divider { height: 1px; background: #2e3350; }
  .row { display: flex; gap: 8px; }
  .f1 { flex: 1; }
  .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { padding: 11px 14px; border-radius: 10px; border: 1px solid #2e3350; background: #22263a; color: #7a8099; font-size: 13px; cursor: pointer; font-weight: 500; -webkit-user-select: none; user-select: none; flex: 1; text-align: center; min-width: 80px; transition: all 0.13s; }
  .chip.on { background: #2a4a8a; border-color: #4f8ef7; color: #4f8ef7; font-weight: 700; }
  .num-wrap { display: flex; align-items: center; background: #22263a; border: 1px solid #2e3350; border-radius: 10px; overflow: hidden; }
  .num-btn { background: none; border: none; color: #4f8ef7; font-size: 22px; width: 52px; height: 52px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .num-btn:active { background: #2a4a8a; }
  .num-val { flex: 1; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; color: #e8eaf0; background: none; border: none; outline: none; }
  .num-unit { color: #7a8099; font-size: 13px; padding-right: 12px; flex-shrink: 0; }
  .prop-list { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }
  .prop-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: #22263a; border: 1px solid #2e3350; cursor: pointer; }
  .prop-item.on { border-color: #4f8ef7; background: #1e2540; }
  .prop-check { width: 20px; height: 20px; border-radius: 6px; border: 2px solid #2e3350; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; }
  .prop-item.on .prop-check { background: #4f8ef7; border-color: #4f8ef7; color: #fff; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #2ecc71; color: #fff; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 999; white-space: nowrap; animation: tIn 0.2s ease, tOut 0.2s ease 1.6s forwards; }
  @keyframes tIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } }
  @keyframes tOut { to { opacity: 0; } }
  .fab { position: fixed; bottom: 24px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f8ef7; border: none; color: #fff; font-size: 24px; cursor: pointer; z-index: 50; box-shadow: 0 4px 20px rgba(79,142,247,0.4); display: flex; align-items: center; justify-content: center; }
  .fab:active { transform: scale(0.91); }
  textarea { background: #22263a; border: 1px solid #2e3350; border-radius: 10px; color: #e8eaf0; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 10px 12px; width: 100%; resize: none; outline: none; line-height: 1.5; }
  textarea:focus { border-color: #4f8ef7; }
  .mic-row { display: flex; align-items: center; gap: 10px; }
  .mic-btn { width: 46px; height: 46px; border-radius: 50%; border: none; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mic-idle { background: #22263a; border: 2px solid #2e3350; }
  .mic-rec { background: #e74c3c; animation: pulse 0.85s ease infinite; }
  @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  .info-panel { background: #0f1117; border: 1px solid #2e3350; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 6px; }
  .info-panel-code { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: #4f8ef7; }
  .info-panel-label { font-size: 10px; color: #7a8099; text-transform: uppercase; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }
  .info-panel-val { font-size: 13px; color: #e8eaf0; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .disc-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; background: #22263a; border: 1px solid #2e3350; cursor: pointer; transition: all 0.13s; }
  .disc-item.kept { border-color: #2ecc71; }
  .disc-item.gone { opacity: 0.33; border-style: dashed; border-color: #e74c3c; }
  .disc-toggle { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .disc-item.kept .disc-toggle { background: #1a4a30; color: #2ecc71; }
  .disc-item.gone .disc-toggle { background: #3a1a1a; color: #e74c3c; }
  .sum-card { background: #22263a; border: 1px solid #2e3350; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 5px; }
  .sum-code { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #4f8ef7; }
  .sum-rawtext { font-size: 11px; color: #7a8099; white-space: pre-wrap; word-break: break-word; margin-bottom: 4px; line-height: 1.4; }
  .sum-row { display: flex; justify-content: space-between; font-size: 12px; padding: 1px 0; }
  .sum-key { color: #7a8099; }
  .sum-val { font-family: 'JetBrains Mono', monospace; color: #e8eaf0; font-weight: 600; font-size: 13px; }
  .sum-empty { color: #2e3350; font-family: 'JetBrains Mono', monospace; }
  .sum-note { font-size: 12px; color: #7a8099; font-style: italic; margin-top: 2px; }
  .code-input-big { background: #22263a; border: 2px solid #4f8ef7; border-radius: 12px; padding: 14px 16px; font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; color: #e8eaf0; text-align: center; letter-spacing: 3px; width: 100%; outline: none; }
  .code-preview { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; color: #4f8ef7; text-align: center; letter-spacing: 3px; padding: 8px 0; }
  .info-tabs { display: flex; gap: 6px; }
  .info-tab { padding: 8px 14px; border-radius: 8px; border: 1px solid #2e3350; background: #22263a; color: #7a8099; font-size: 12px; cursor: pointer; font-weight: 600; }
  .info-tab.on { background: #2a4a8a; border-color: #4f8ef7; color: #4f8ef7; }
  .sel-text-wrap { background: #22263a; border: 1px solid #2e3350; border-radius: 10px; padding: 12px; font-size: 13px; color: #e8eaf0; line-height: 1.8; white-space: pre-wrap; max-height: 180px; overflow-y: auto; }
  .word { cursor: pointer; border-radius: 4px; padding: 1px 3px; transition: background 0.1s; }
  .word.picked { background: #2a4a8a; color: #4f8ef7; }

  /* User selection screen */
  .user-select-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px; padding: 40px 20px; }
  .user-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; max-width: 340px; }
  .user-avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
  .user-avatar-wrap:active { transform: scale(0.93); }
  .user-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #2e3350; transition: border-color 0.15s, transform 0.15s; background: #22263a; display: flex; align-items: center; justify-content: center; font-size: 32px; overflow: hidden; }
  .user-avatar:active { border-color: #4f8ef7; }
  .user-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .user-name { font-size: 13px; font-weight: 600; color: #e8eaf0; }
`;

// ── constants ─────────────────────────────────────────────────────────────────
const ALLESTIMENTI = ["Riempimento", "Immersione", "Cella", "Tasca", "Vassoio"];
const ALLESTIMENTO_UNIT = { Riempimento: "ml", Immersione: "ml", Cella: "ml", Tasca: "ml", Vassoio: "g" };
const PATTERN = /\b(\d{2}LD\d{5})\b/i;
const NOISE_PATTERNS = [
  /^testo\s+(trovato|estratto)/i, /^codice\s+non\s+trovato/i,
  /^nessun\s+(codice|campione)/i, /^riga\s*\d+/i,
  /^ecco\s+il\s+testo/i, /^il\s+documento\s+contiene/i,
  /^ho\s+(trovato|estratto|analizzato)/i, /^non\s+(riesco|trovo)/i,
  /^risultato/i, /^\s*---+\s*$/, /^nota:/i, /^output:/i,
];
function isNoiseLine(l) { return NOISE_PATTERNS.some(p => p.test(l.trim())); }
function extractSamplesFromLines(text) {
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 1 && !isNoiseLine(l))
    .map((line, i) => {
      const m = line.match(PATTERN);
      return { id: crypto.randomUUID(), code: m ? m[1].toUpperCase() : null, rawText: line, data: null };
    });
}
function emptyData() { return { pesata: "", superficie: "", allestimento: null, volume: "", articoli: "", note: "" }; }
function isDataFilled(d) { return d && (d.pesata || d.superficie || d.allestimento || d.articoli); }
function padCode(digits) {
  const year = new Date().getFullYear().toString().slice(-2);
  return `${year}LD${digits.padStart(5, "0")}`;
}

// ── Tesseract ─────────────────────────────────────────────────────────────────
function useTesseract() {
  const workerRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const worker = await createWorker("ita+eng", 1, { logger: () => {} });
      if (!cancelled) { workerRef.current = worker; setReady(true); }
    })();
    return () => { cancelled = true; workerRef.current?.terminate(); };
  }, []);
  const recognize = useCallback(async (imageData) => {
    if (!workerRef.current) return "";
    const result = await workerRef.current.recognize(imageData);
    return result.data.text;
  }, []);
  return { ready, recognize };
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function loadUserCampioni(userName) {
  const { data, error } = await supabase
    .from("campioni")
    .select("*")
    .eq("user_name", userName)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(r => ({
    id: r.id,
    code: r.code,
    rawText: r.raw_text,
    data: {
      pesata: r.pesata || "",
      superficie: r.superficie || "",
      allestimento: r.allestimento || null,
      volume: r.volume || "",
      articoli: r.articoli || "",
      note: r.note || "",
    }
  }));
}

async function upsertCampione(userName, sample) {
  const row = {
    id: sample.id,
    user_name: userName,
    code: sample.code,
    raw_text: sample.rawText,
    pesata: sample.data?.pesata || null,
    superficie: sample.data?.superficie || null,
    allestimento: sample.data?.allestimento || null,
    volume: sample.data?.volume || null,
    articoli: sample.data?.articoli || null,
    note: sample.data?.note || null,
  };
  const { error } = await supabase.from("campioni").upsert(row, { onConflict: "id" });
  if (error) console.error("upsert error:", error);
}

async function getAvailableUsers() {
  const { data, error } = await supabase.from("team_users").select("name, device_id");
  if (error) { console.error(error); return TEAM_USERS; }
  const deviceId = getDeviceId();
  // Show only users with no device_id, or whose device_id matches this device
  return (data || []).filter(u => !u.device_id || u.device_id === deviceId).map(u => u.name);
}

async function claimUser(userName) {
  const deviceId = getDeviceId();
  const { error } = await supabase.from("team_users")
    .update({ device_id: deviceId })
    .eq("name", userName);
  if (error) console.error("claim error:", error);
  saveUser(userName);
}

// ── NumPadInput ───────────────────────────────────────────────────────────────
function NumPadInput({ value, onChange, unit = "", decimalDigits = 2 }) {
  const parts = (value || "").split(".");
  const intStr = parts[0] || "";
  const decStr = (parts[1] || "").slice(0, decimalDigits);
  function setInt(s) { if (!s && !decStr) { onChange(""); return; } onChange(s + (decStr ? "." + decStr : "")); }
  function setDec(s) { if (!s && !intStr) { onChange(""); return; } onChange((intStr || "0") + "." + s.slice(0, decimalDigits)); }
  const displayInt = intStr || "0";
  const displayDec = decStr.padEnd(decimalDigits, "0");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "#22263a", border: "2px solid #4f8ef7", borderRadius: 12, padding: "10px 16px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, letterSpacing: 2 }}>
        <span style={{ color: "#2ecc71" }}>{displayInt}</span>
        <span style={{ color: "#7a8099" }}>,</span>
        <span style={{ color: "#7dcea0" }}>{displayDec}</span>
        {unit && <span style={{ fontSize: 15, color: "#7a8099", marginLeft: 8 }}>{unit}</span>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, color: "#7a8099", textAlign: "center", fontFamily: "'JetBrains Mono'", letterSpacing: 1, textTransform: "uppercase" }}>Interi</div>
          <MiniPad value={intStr} onChange={setInt} maxLen={6} color="#2ecc71" />
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 28, color: "#7a8099", fontFamily: "'JetBrains Mono'", fontWeight: 700, paddingTop: 24 }}>,</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, color: "#7a8099", textAlign: "center", fontFamily: "'JetBrains Mono'", letterSpacing: 1, textTransform: "uppercase" }}>Decimali</div>
          <MiniPad value={decStr} onChange={setDec} maxLen={decimalDigits} color="#7dcea0" />
        </div>
      </div>
      {(intStr || decStr) && <button className="btn-sm" style={{ alignSelf: "center" }} onClick={() => onChange("")}>✕ Azzera</button>}
    </div>
  );
}

function MiniPad({ value, onChange, maxLen = 4, color = "#4f8ef7" }) {
  function press(d) { if (d === "⌫") { onChange(value.slice(0, -1)); return; } if (value.length >= maxLen) return; onChange(value + d); }
  const keys = ["7","8","9","4","5","6","1","2","3","⌫","0",""];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
      {keys.map((k, i) => (
        <button key={i} onClick={() => k && press(k)} style={{
          height: 52, borderRadius: 10, border: k && k !== "⌫" ? "1px solid #2e3350" : "none",
          background: k === "⌫" ? "#2a4a8a" : k === "" ? "transparent" : "#22263a",
          color: k === "⌫" ? "#4f8ef7" : "#e8eaf0",
          fontSize: k === "⌫" ? 18 : 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          cursor: k ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: !k ? 0 : 1, WebkitUserSelect: "none", userSelect: "none",
        }}>{k}</button>
      ))}
    </div>
  );
}

function NumInput({ value, onChange, step = 1, unit = "" }) {
  const n = parseFloat(value) || 0;
  return (
    <div className="num-wrap">
      <button className="num-btn" onClick={() => onChange(String(Math.max(0, +(n - step).toFixed(2))))}>−</button>
      <input className="num-val" type="number" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder="0" />
      <span className="num-unit">{unit}</span>
      <button className="num-btn" onClick={() => onChange(String(+(n + step).toFixed(2)))}>+</button>
    </div>
  );
}

function NotesInput({ value, onChange }) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Usa il microfono della tastiera iOS (tasto 🎤)."); return; }
    if (listening) { recogRef.current?.abort(); recogRef.current = null; setListening(false); return; }
    const recog = new SR();
    recog.lang = "it-IT"; recog.continuous = false; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onstart = () => setListening(true);
    recog.onresult = e => { const t = e.results[0]?.[0]?.transcript || ""; if (t) onChange(value ? value + " " + t : t); };
    recog.onerror = e => { if (e.error !== "aborted") console.warn(e.error); setListening(false); };
    recog.onend = () => { setListening(false); recogRef.current = null; };
    try { recog.start(); recogRef.current = recog; } catch(e) { setListening(false); }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="mic-row">
        <button className={`mic-btn ${listening ? "mic-rec" : "mic-idle"}`} onClick={toggleVoice}>{listening ? "⏹" : "🎤"}</button>
        <span style={{ fontSize: 12, color: "#7a8099" }}>{listening ? "In ascolto… tocca ⏹ per fermare" : "Tocca 🎤 — parla — si ferma da solo"}</span>
      </div>
      <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder="Note libere…" />
    </div>
  );
}

function InfoPanel({ sample }) {
  const raw = sample.rawText || "";
  const cols = raw.includes("\t") ? raw.split("\t") : raw.includes("|") ? raw.split("|") : null;
  return (
    <div className="info-panel">
      <div className="info-panel-code">{sample.code || <span style={{ color: "#f39c12" }}>Codice non trovato</span>}</div>
      {cols ? cols.filter(c => c.trim()).map((col, i) => (
        <div key={i}><div className="info-panel-label">Campo {i + 1}</div><div className="info-panel-val">{col.trim()}</div></div>
      )) : <div><div className="info-panel-label">Informazioni riga</div><div className="info-panel-val">{raw}</div></div>}
    </div>
  );
}

function DiscardScreen({ samples, onConfirm }) {
  const [kept, setKept] = useState(() => new Set(samples.map(s => s.id)));
  const toggle = id => setKept(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div className="screen">
      <div className="sec-title">Seleziona campioni da tenere</div>
      <div style={{ fontSize: 13, color: "#7a8099" }}>Tocca per escludere. ✓ verde = tenuto.</div>
      <div className="sample-list">
        {samples.map(s => (
          <div key={s.id} className={`disc-item ${kept.has(s.id) ? "kept" : "gone"}`} onClick={() => toggle(s.id)}>
            <div className="disc-toggle">{kept.has(s.id) ? "✓" : "✕"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="s-code" style={{ fontSize: 14 }}>{s.code || <span style={{ color: "#f39c12" }}>⚠ Codice non trovato</span>}</div>
              <div className="s-text">{s.rawText}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" disabled={kept.size === 0} onClick={() => onConfirm(samples.filter(s => kept.has(s.id)))}>
        Continua con {kept.size} campion{kept.size === 1 ? "e" : "i"} →
      </button>
    </div>
  );
}

function buildReportText(samples, userName) {
  const date = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  let lines = [`LAB·SCAN — ${userName} — ${date}`, ""];
  samples.forEach((s, i) => {
    const d = s.data;
    lines.push(`${i + 1}. ${s.code || "—"}`);
    lines.push(`   Info: ${s.rawText}`);
    if (d) {
      if (d.allestimento) lines.push(`   Allestimento: ${d.allestimento}`);
      if (d.pesata) lines.push(`   Pesata: ${d.pesata} g`);
      if (d.volume && d.allestimento) lines.push(`   ${d.allestimento === "Vassoio" ? "Peso" : "Volume"}: ${d.volume} ${ALLESTIMENTO_UNIT[d.allestimento]}`);
      if (d.superficie) lines.push(`   Superficie: ${d.superficie} dm²`);
      if (d.articoli) lines.push(`   N° articoli: ${d.articoli}`);
      if (d.note) lines.push(`   Note: ${d.note}`);
    } else lines.push("   (non compilato)");
    lines.push("");
  });
  return lines.join("\n");
}

function SummaryScreen({ samples, imagePreview, userName }) {
  const [copyDone, setCopyDone] = useState(false);
  const reportText = buildReportText(samples, userName);
  function share() {
    if (navigator.share) { navigator.share({ title: "LAB·SCAN Rapporto", text: reportText }).catch(() => {}); }
    else copyText();
  }
  function copyText() {
    const el = document.createElement("textarea");
    el.value = reportText; el.setAttribute("readonly", "");
    el.style.cssText = "position:absolute;left:-9999px;top:0;";
    document.body.appendChild(el);
    if (/ipad|iphone/i.test(navigator.userAgent)) {
      const range = document.createRange(); range.selectNodeContents(el);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); el.setSelectionRange(0, 999999);
    } else el.select();
    try { document.execCommand("copy"); setCopyDone(true); setTimeout(() => setCopyDone(false), 2500); } catch (_) {}
    document.body.removeChild(el);
  }
  const Empty = () => <span className="sum-empty">—</span>;
  return (
    <div className="screen">
      {imagePreview && <div style={{ height: 70, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}><img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} /></div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="sec-title">{samples.filter(s => isDataFilled(s.data)).length}/{samples.length} compilati</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-sm" onClick={share}>📤 Condividi</button>
          <button className="btn-sm" onClick={copyText}>{copyDone ? "✓ Copiato" : "📋 Copia"}</button>
        </div>
      </div>
      {samples.map(s => {
        const d = s.data;
        return (
          <div key={s.id} className="sum-card">
            <div className="sum-code">{s.code || "—"}</div>
            <div className="sum-rawtext">{s.rawText}</div>
            <div className="divider" style={{ margin: "4px 0" }} />
            {d ? <>
              <div className="sum-row"><span className="sum-key">Allestimento</span><span className="sum-val">{d.allestimento || <Empty />}</span></div>
              <div className="sum-row"><span className="sum-key">Pesata</span><span className="sum-val">{d.pesata ? `${d.pesata} g` : <Empty />}</span></div>
              {d.allestimento && <div className="sum-row"><span className="sum-key">{d.allestimento === "Vassoio" ? "Peso" : "Volume"}</span><span className="sum-val">{d.volume ? `${d.volume} ${ALLESTIMENTO_UNIT[d.allestimento]}` : <Empty />}</span></div>}
              <div className="sum-row"><span className="sum-key">Superficie</span><span className="sum-val">{d.superficie ? `${d.superficie} dm²` : <Empty />}</span></div>
              <div className="sum-row"><span className="sum-key">N° articoli</span><span className="sum-val">{d.articoli || <Empty />}</span></div>
              {d.note && <div className="sum-note">📝 {d.note}</div>}
            </> : <div style={{ fontSize: 12, color: "#7a8099", fontStyle: "italic" }}>Non compilato</div>}
          </div>
        );
      })}
    </div>
  );
}

function ManualCodeOverlay({ onConfirm, onClose, recognize }) {
  const [digits, setDigits] = useState("");
  const [infoTab, setInfoTab] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [pickedWords, setPickedWords] = useState([]);
  const [voiceNote, setVoiceNote] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const fileRef = useRef();
  const year = new Date().getFullYear().toString().slice(-2);
  const trimmed = digits.replace(/\D/g, "").slice(0, 5);
  const preview = trimmed ? padCode(trimmed) : `${year}LD_____`;
  const isReady = trimmed.length > 0;

  async function handleInfoPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setOcrLoading(true);
    try { const text = await recognize(file); setExtractedText(text.trim()); setPickedWords([]); }
    catch (_) { setExtractedText("Errore OCR"); }
    setOcrLoading(false);
  }
  function toggleWord(w) { setPickedWords(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]); }
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Usa il microfono della tastiera iOS."); return; }
    if (listening) { recogRef.current?.abort(); recogRef.current = null; setListening(false); return; }
    const r = new SR(); r.lang = "it-IT"; r.continuous = false; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onresult = e => { const t = e.results[0]?.[0]?.transcript || ""; setVoiceNote(v => v ? v + " " + t : t); };
    r.onerror = () => setListening(false); r.onend = () => { setListening(false); recogRef.current = null; };
    try { r.start(); recogRef.current = r; } catch(e) { setListening(false); }
  }
  const selectedInfo = pickedWords.length ? pickedWords.join(" ") : voiceNote;
  return (
    <div className="overlay-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div className="sh-title">Aggiungi campione</div>
        <div>
          <div className="field-label">Cifre del codice</div>
          <div className="code-preview">{preview}</div>
          <input className="code-input-big" type="number" inputMode="numeric" placeholder="es. 564" value={digits} onChange={e => setDigits(e.target.value.replace(/\D/g, "").slice(0, 5))} />
          <div style={{ fontSize: 11, color: "#7a8099", marginTop: 6, textAlign: "center" }}>Digita le cifre → si completa con zeri</div>
        </div>
        <div className="divider" />
        <div>
          <div className="field-label">Informazioni aggiuntive (opzionale)</div>
          <div className="info-tabs">
            <div className={`info-tab ${infoTab === "photo" ? "on" : ""}`} onClick={() => setInfoTab(infoTab === "photo" ? null : "photo")}>📷 Da foto</div>
            <div className={`info-tab ${infoTab === "voice" ? "on" : ""}`} onClick={() => setInfoTab(infoTab === "voice" ? null : "voice")}>🎤 Voce</div>
          </div>
        </div>
        {infoTab === "photo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleInfoPhoto} />
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>📷 Scatta / carica foto</button>
            {ocrLoading && <div style={{ color: "#7a8099", fontSize: 13, textAlign: "center" }}>Analisi OCR…</div>}
            {extractedText && !ocrLoading && <>
              <div style={{ fontSize: 11, color: "#7a8099" }}>Tocca le parole da associare:</div>
              <div className="sel-text-wrap">{extractedText.split(/(\s+)/).map((token, i) => {
                if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
                return <span key={i} className={`word ${pickedWords.includes(token) ? "picked" : ""}`} onClick={() => toggleWord(token)}>{token}</span>;
              })}</div>
              {pickedWords.length > 0 && <div style={{ fontSize: 12, color: "#4f8ef7" }}>✓ {pickedWords.join(" ")}</div>}
            </>}
          </div>
        )}
        {infoTab === "voice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="mic-row">
              <button className={`mic-btn ${listening ? "mic-rec" : "mic-idle"}`} onClick={toggleVoice}>{listening ? "⏹" : "🎤"}</button>
              <span style={{ fontSize: 12, color: "#7a8099" }}>{listening ? "In ascolto…" : "Oppure scrivi sotto"}</span>
            </div>
            <textarea rows={2} value={voiceNote} onChange={e => setVoiceNote(e.target.value)} placeholder="Nota sul campione…" />
          </div>
        )}
        {selectedInfo && <div style={{ fontSize: 12, background: "#22263a", borderRadius: 8, padding: "8px 12px", color: "#e8eaf0", fontStyle: "italic" }}>📎 {selectedInfo}</div>}
        <div className="row">
          <button className="btn btn-secondary" style={{ width: 56 }} onClick={onClose}>✕</button>
          <button className="btn btn-primary f1" disabled={!isReady} onClick={() => { const code = padCode(trimmed); onConfirm({ code, rawText: selectedInfo ? `${code} — ${selectedInfo}` : code }); }}>✓ Aggiungi {isReady ? preview : ""}</button>
        </div>
      </div>
    </div>
  );
}

function CompileOverlay({ sample, onSave, onClose, allSamples }) {
  const [d, setD] = useState(() => sample.data ? { ...sample.data } : emptyData());
  const [phase, setPhase] = useState("form");
  const [selected, setSelected] = useState([]);
  const [confirmQueue, setConfirmQueue] = useState([]);
  const [currentConfirm, setCurrentConfirm] = useState(null);
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const unit = d.allestimento ? ALLESTIMENTO_UNIT[d.allestimento] : "";
  const volLabel = d.allestimento === "Vassoio" ? "Peso" : "Volume";
  const others = allSamples.filter(s => s.id !== sample.id);

  function saveAndPropagate() { onSave([{ id: sample.id, data: { ...d } }]); setPhase("propagate"); }
  function applyPropagation() {
    if (!selected.length) { onClose(); return; }
    const targets = selected.map(id => allSamples.find(s => s.id === id)).filter(Boolean);
    onSave(targets.filter(s => !isDataFilled(s.data)).map(s => ({ id: s.id, data: { ...d } })));
    const q = targets.filter(s => isDataFilled(s.data));
    if (q.length) { setConfirmQueue(q); setCurrentConfirm(q[0]); setPhase("confirm"); } else onClose();
  }
  function handleConfirm(yes) {
    if (yes) onSave([{ id: currentConfirm.id, data: { ...d } }]);
    const next = confirmQueue.slice(1);
    if (next.length) { setConfirmQueue(next); setCurrentConfirm(next[0]); } else onClose();
  }

  if (phase === "confirm") return (
    <div className="overlay-bg"><div className="sheet">
      <div className="handle" /><div className="sh-title">Sovrascrivere?</div>
      <div style={{ background: "#22263a", border: "1px solid #f39c12", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f39c12" }}>⚠️ Campione già compilato</div>
        <InfoPanel sample={currentConfirm} />
        <div className="row">
          <button className="btn btn-danger f1" onClick={() => handleConfirm(true)}>Sì, sovrascrivi</button>
          <button className="btn btn-secondary f1" onClick={() => handleConfirm(false)}>No, mantieni</button>
        </div>
      </div>
      <div style={{ color: "#7a8099", fontSize: 12, textAlign: "center" }}>{confirmQueue.length} rimanenti</div>
    </div></div>
  );

  if (phase === "propagate") return (
    <div className="overlay-bg" onClick={e => e.target === e.currentTarget && onClose()}><div className="sheet">
      <div className="handle" /><div className="sh-title">Applica ad altri?</div>
      {others.length === 0
        ? <div style={{ color: "#7a8099", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Nessun altro campione</div>
        : <div className="prop-list">{others.map(s => (
            <div key={s.id} className={`prop-item ${selected.includes(s.id) ? "on" : ""}`}
              onClick={() => setSelected(sel => sel.includes(s.id) ? sel.filter(x => x !== s.id) : [...sel, s.id])}>
              <div className="prop-check">{selected.includes(s.id) ? "✓" : ""}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 700, color: "#4f8ef7" }}>{s.code || "—"}</div>
                <div style={{ fontSize: 11, color: "#7a8099", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.rawText}</div>
              </div>
              {isDataFilled(s.data) && <span className="badge badge-warn">compilato</span>}
            </div>
          ))}</div>
      }
      <div className="row">
        <button className="btn btn-secondary f1" onClick={onClose}>Salta</button>
        <button className="btn btn-primary f1" onClick={applyPropagation}>Applica{selected.length ? ` (${selected.length})` : ""}</button>
      </div>
    </div></div>
  );

  return (
    <div className="overlay-bg" onClick={e => e.target === e.currentTarget && onClose()}><div className="sheet">
      <div className="handle" />
      <InfoPanel sample={sample} />
      <div className="divider" />
      <div>
        <div className="field-label">Allestimento</div>
        <div className="chip-row">{ALLESTIMENTI.map(a => (
          <div key={a} className={`chip ${d.allestimento === a ? "on" : ""}`}
            onClick={() => { if (d.allestimento === a) { set("allestimento", null); set("volume", ""); } else { set("allestimento", a); if (a === "Tasca") { set("superficie", "2"); set("volume", "100"); } } }}>
            {a}
          </div>
        ))}</div>
        {d.allestimento && <div style={{ fontSize: 11, color: "#7a8099", marginTop: 4 }}>Tocca di nuovo per deselezionare</div>}
      </div>
      <div><div className="field-label">Pesata</div><NumPadInput value={d.pesata} onChange={v => set("pesata", v)} unit="g" decimalDigits={2} /></div>
      {d.allestimento && <div>
        <div className="field-label">{volLabel}</div>
        <NumPadInput value={d.volume} onChange={v => set("volume", v)} unit={unit} decimalDigits={d.allestimento === "Vassoio" ? 2 : 0} />
        {d.allestimento === "Tasca" && <div style={{ fontSize: 11, color: "#7a8099", marginTop: 4 }}>ℹ️ Default: 2 dm² / 100 ml</div>}
      </div>}
      <div><div className="field-label">Superficie</div><NumInput value={d.superficie} onChange={v => set("superficie", v)} step={0.5} unit="dm²" /></div>
      <div><div className="field-label">N° Articoli</div><NumInput value={d.articoli} onChange={v => set("articoli", v)} step={1} unit="pz" /></div>
      <div><div className="field-label">Note</div><NotesInput value={d.note} onChange={v => set("note", v)} /></div>
      <div className="divider" />
      <div className="row">
        <button className="btn btn-secondary" style={{ width: 56 }} onClick={onClose}>✕</button>
        <button className="btn btn-success f1" onClick={saveAndPropagate}>✓ Salva</button>
      </div>
    </div></div>
  );
}

// ── UserSelectScreen ──────────────────────────────────────────────────────────
function UserSelectScreen({ onSelect }) {
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailableUsers().then(users => { setAvailable(users); setLoading(false); });
  }, []);

  return (
    <div className="user-select-screen">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 8 }}>🧪</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: "#4f8ef7" }}>LAB·SCAN</div>
        <div style={{ fontSize: 13, color: "#7a8099", marginTop: 6 }}>Chi sei?</div>
      </div>
      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="user-grid">
          {available.map(name => (
            <div key={name} className="user-avatar-wrap" onClick={() => onSelect(name)}>
              <div className="user-avatar">
                <img
                  src={getAvatarUrl(name)}
                  alt={name}
                  onError={e => {
                    // Try png fallback, then show initial
                    if (e.target.src.endsWith(".jpg")) {
                      e.target.src = getAvatarUrl(name).replace(".jpg", ".png");
                    } else {
                      e.target.style.display = "none";
                      e.target.parentNode.innerHTML = `<span style="font-size:32px;color:#4f8ef7;font-weight:700">${name[0]}</span>`;
                    }
                  }}
                />
              </div>
              <div className="user-name">{name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [appReady, setAppReady] = useState(false);
  const [screen, setScreen] = useState("home");
  const [imagePreview, setImagePreview] = useState(null);
  const [rawSamples, setRawSamples] = useState([]);
  const [samples, setSamples] = useState([]);
  const [activeSample, setActiveSample] = useState(null);
  const [showManualCode, setShowManualCode] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [mergeModal, setMergeModal] = useState(null);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();
  const { ready: tessReady, recognize } = useTesseract();

  // On mount: check if device already has a user
  useEffect(() => {
    const saved = getSavedUser();
    if (saved) {
      setCurrentUser(saved);
      // Load their samples from Supabase
      loadUserCampioni(saved).then(data => { setSamples(data); setAppReady(true); });
    } else {
      setAppReady(true);
    }
  }, []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 1800); };

  async function handleUserSelect(name) {
    await claimUser(name);
    setCurrentUser(name);
    const data = await loadUserCampioni(name);
    setSamples(data);
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      setImagePreview(ev.target.result);
      setScreen("loading");
      setOcrProgress(0);
      try {
        const interval = setInterval(() => setOcrProgress(p => Math.min(p + 8, 90)), 300);
        const text = await recognize(file);
        clearInterval(interval);
        setOcrProgress(100);
        const extracted = extractSamplesFromLines(text);
        setRawSamples(extracted);
        setTimeout(() => {
          if (extracted.length > 0) setScreen("discard");
          else { setSamples([]); setScreen("list"); }
        }, 300);
      } catch (_) { setRawSamples([]); setSamples([]); setScreen("list"); }
    };
    reader.readAsDataURL(file);
  }

  function handleDiscardConfirm(kept) {
    if (samples.length > 0) setMergeModal({ newSamples: kept });
    else { setSamples(kept); kept.forEach(s => upsertCampione(currentUser, s)); setScreen("list"); }
  }

  async function handleMerge(mode) {
    const { newSamples } = mergeModal;
    let final;
    if (mode === "add") {
      const existing = new Set(samples.map(s => s.code + s.rawText));
      const toAdd = newSamples.filter(s => !existing.has(s.code + s.rawText));
      final = [...samples, ...toAdd];
      showToast(`${toAdd.length} campioni aggiunti`);
    } else {
      final = newSamples;
      showToast("Lista sostituita");
    }
    setSamples(final);
    final.forEach(s => upsertCampione(currentUser, s));
    setMergeModal(null);
    setScreen("list");
  }

  async function handleSave(updates) {
    setSamples(prev => {
      const m = new Map(updates.map(u => [u.id, u.data]));
      const next = prev.map(s => m.has(s.id) ? { ...s, data: m.get(s.id) } : s);
      // Save to Supabase
      updates.forEach(u => {
        const s = next.find(x => x.id === u.id);
        if (s) upsertCampione(currentUser, s);
      });
      return next;
    });
    showToast("Salvato ✓");
  }

  const filled = samples.filter(s => isDataFilled(s.data)).length;

  if (!appReady) return (
    <>
      <style>{css}</style>
      <div className="app"><div className="loading"><div className="spinner" /></div></div>
    </>
  );

  if (!currentUser) return (
    <>
      <style>{css}</style>
      <div className="app"><UserSelectScreen onSelect={handleUserSelect} /></div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="header-logo">LAB·SCAN</div>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
            {/* User avatar in header */}
            <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "#22263a", border: "2px solid #2e3350", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={getAvatarUrl(currentUser)} alt={currentUser} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style="font-size:13px;color:#4f8ef7;font-weight:700">${currentUser[0]}</span>`; }} />
            </div>
            {screen === "photo" && <button className="btn-sm" onClick={() => setScreen(samples.length > 0 ? "list" : "home")}>← Indietro</button>}
            {screen === "list" && <>
              <span style={{ fontSize: 11, color: "#7a8099", fontFamily: "'JetBrains Mono'" }}>{filled}/{samples.length}</span>
              {samples.length > 0 && <button className="btn-sm" onClick={() => setScreen("summary")}>📋 Riepilogo</button>}
            </>}
            {screen === "summary" && <button className="btn-sm" onClick={() => setScreen("list")}>← Lista</button>}
            {screen === "discard" && <button className="btn-sm" onClick={() => setScreen("photo")}>← Foto</button>}
            {screen === "loading" && <button className="btn-sm" onClick={() => setScreen(samples.length > 0 ? "list" : "photo")}>← Annulla</button>}
          </div>
        </div>

        {screen === "home" && (
          <div className="screen" style={{ justifyContent: "center", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🧪</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: "#4f8ef7" }}>Ciao, {currentUser}</div>
              <div style={{ fontSize: 13, color: "#7a8099", marginTop: 6 }}>Cosa vuoi fare?</div>
            </div>
            <button className="btn btn-primary" onClick={() => setScreen("photo")}>📷 Nuova foto / sessione</button>
            {samples.length > 0 && (
              <button className="btn btn-secondary" onClick={() => setScreen("list")}>
                📋 Continua — {samples.length} campioni ({filled} compilati)
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => { setSamples([]); setScreen("list"); }}>+ Sessione vuota manuale</button>
            {!tessReady && <div style={{ fontSize: 12, color: "#7a8099", textAlign: "center" }}>⏳ Caricamento motore OCR…</div>}
          </div>
        )}

        {screen === "photo" && (
          <div className="screen">
            {!tessReady && <div style={{ fontSize: 12, color: "#f39c12", textAlign: "center", padding: "8px 12px", background: "#22263a", borderRadius: 8 }}>⏳ Caricamento motore OCR…</div>}
            <div style={{ fontSize: 14, color: "#7a8099", lineHeight: 1.6 }}>Fotografa il documento. Ogni riga = un campione.</div>
            <div className="photo-zone" onClick={() => tessReady && fileRef.current?.click()}>
              {imagePreview && <img src={imagePreview} alt="" />}
              <div className="photo-zone-overlay">
                <div style={{ fontSize: 36 }}>{tessReady ? "📷" : "⏳"}</div>
                <div style={{ fontSize: 13, color: "#7a8099" }}>{tessReady ? "Tocca per fotografare" : "Caricamento OCR…"}</div>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
            <button className="btn btn-primary" disabled={!tessReady} onClick={() => fileRef.current?.click()}>📷 Scatta / Carica foto</button>
          </div>
        )}

        {screen === "loading" && (
          <div className="screen"><div className="loading">
            <div className="spinner" />
            <div style={{ fontSize: 14, color: "#7a8099" }}>Analisi OCR in corso…</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${ocrProgress}%` }} /></div>
            <div style={{ fontSize: 12, color: "#7a8099" }}>{ocrProgress}%</div>
          </div></div>
        )}

        {screen === "discard" && <DiscardScreen samples={rawSamples} onConfirm={handleDiscardConfirm} />}

        {screen === "list" && (
          <div className="screen">
            {imagePreview && (
              <div style={{ height: 56, borderRadius: 10, overflow: "hidden", cursor: "pointer", flexShrink: 0 }} onClick={() => setScreen("photo")}>
                <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
              </div>
            )}
            {samples.length > 0 ? <>
              <div className="sec-title">{samples.length} campioni</div>
              <div className="sample-list">
                {samples.map(s => (
                  <div key={s.id} className={`sample-card ${isDataFilled(s.data) ? "filled" : ""}`} onClick={() => setActiveSample(s)}>
                    <div className="s-code">
                      <div className={`s-dot ${isDataFilled(s.data) ? "on" : ""}`} />
                      {s.code || <span style={{ color: "#f39c12" }}>⚠ Codice non trovato</span>}
                      {isDataFilled(s.data) && <span className="badge badge-ok" style={{ marginLeft: "auto" }}>✓</span>}
                    </div>
                    <div className="s-text">{s.rawText}</div>
                  </div>
                ))}
              </div>
            </> : (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                <div style={{ color: "#7a8099", fontSize: 14 }}>Nessun campione. Scatta una foto o aggiungi manualmente.</div>
              </div>
            )}
            <button className="btn btn-secondary" onClick={() => setShowManualCode(true)}>+ Aggiungi campione manuale</button>
            <button className="fab" onClick={() => setScreen("photo")}>📷</button>
          </div>
        )}

        {screen === "summary" && <SummaryScreen samples={samples} imagePreview={imagePreview} userName={currentUser} />}

        {mergeModal && (
          <div className="overlay-bg"><div className="sheet">
            <div className="handle" />
            <div className="sh-title">Nuovi campioni trovati</div>
            <div style={{ fontSize: 13, color: "#7a8099", lineHeight: 1.6 }}>
              Hai già <strong style={{ color: "#e8eaf0" }}>{samples.length} campioni</strong> in lista.<br />
              Vuoi aggiungere i <strong style={{ color: "#4f8ef7" }}>{mergeModal.newSamples.length} nuovi</strong> o sostituire tutto?
            </div>
            <button className="btn btn-primary" onClick={() => handleMerge("add")}>➕ Aggiungi ai campioni esistenti</button>
            <button className="btn btn-danger" onClick={() => handleMerge("replace")}>🔄 Sostituisci tutto</button>
            <button className="btn btn-secondary" onClick={() => { setMergeModal(null); setScreen("list"); }}>Annulla</button>
          </div></div>
        )}

        {showManualCode && (
          <ManualCodeOverlay recognize={recognize}
            onConfirm={({ code, rawText }) => {
              const newS = { id: crypto.randomUUID(), code, rawText, data: null };
              setSamples(prev => [...prev, newS]);
              upsertCampione(currentUser, newS);
              setShowManualCode(false);
              showToast("Campione aggiunto");
            }}
            onClose={() => setShowManualCode(false)}
          />
        )}

        {activeSample && (
          <CompileOverlay sample={activeSample} allSamples={samples} onSave={handleSave} onClose={() => setActiveSample(null)} />
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
