// ═══════════════════════════════════════════════════════════════════
//  BOOLE — Módulo de Carga Masiva (Excel / Google Sheets)
//  Componente standalone listo para integrar
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

// ─── ESQUEMA DE VALIDACIÓN POR TIPO DE IMPORTACIÓN ──────────────────

const IMPORT_SCHEMAS = {
  CASOS: {
    label: "Casos Operativos",
    icon: "📋",
    required: ["numero_serie_terminal", "tipo_proceso", "localidad_codigo", "supervisor_email"],
    optional: ["tecnico_email", "segmento", "prioridad", "descripcion", "sub_etiqueta"],
    types: {
      tipo_proceso:    { type: "enum",   values: ["SOPORTE","INSTALACION","RETIRO","VISITA","RECUPERO"] },
      segmento:        { type: "enum",   values: ["VIP","1A","1B","2","3"],       default: "2" },
      prioridad:       { type: "enum",   values: ["CRITICAL","HIGH","MEDIUM","LOW"], default: "MEDIUM" },
      numero_serie_terminal: { type: "string", maxLen: 50 },
      supervisor_email: { type: "email" },
      tecnico_email:   { type: "email",  optional: true },
      descripcion:     { type: "string", maxLen: 500, optional: true },
    },
    templateRows: [
      { numero_serie_terminal:"TER-1001234", tipo_proceso:"SOPORTE", localidad_codigo:"L09", supervisor_email:"rdiaz@ops.com", tecnico_email:"ptorres@ops.com", segmento:"VIP", prioridad:"HIGH", descripcion:"Terminal sin conexión desde las 8am" },
      { numero_serie_terminal:"TER-1005678", tipo_proceso:"INSTALACION", localidad_codigo:"L33", supervisor_email:"aferreyra@ops.com", tecnico_email:"bmolina@ops.com", segmento:"1A", prioridad:"MEDIUM", descripcion:"Instalación 2 POS nuevas" },
      { numero_serie_terminal:"TER-1009012", tipo_proceso:"RETIRO", localidad_codigo:"L29", supervisor_email:"vnunez@ops.com", tecnico_email:"", segmento:"3", prioridad:"LOW", descripcion:"Retiro por baja voluntaria" },
    ],
  },
  ACTIVOS: {
    label: "Activos / Terminales",
    icon: "⬡",
    required: ["numero_serie", "cliente_nombre", "localidad_codigo", "modelo_codigo"],
    optional: ["cliente_id", "segmento", "direccion", "responsable_email", "lat", "lng"],
    types: {
      numero_serie:    { type: "string", maxLen: 50 },
      cliente_nombre:  { type: "string", maxLen: 200 },
      localidad_codigo:{ type: "string", maxLen: 10 },
      modelo_codigo:   { type: "string", maxLen: 30 },
      segmento:        { type: "enum",   values: ["VIP","1A","1B","2","3"], default: "2" },
      lat:             { type: "decimal", optional: true },
      lng:             { type: "decimal", optional: true },
    },
    templateRows: [
      { numero_serie:"TER-2000001", cliente_nombre:"Supermercado Norte S.A.", localidad_codigo:"L09", modelo_codigo:"A920", cliente_id:"CLI-100", segmento:"1A", direccion:"Av. 18 de Julio 1234" },
      { numero_serie:"TER-2000002", cliente_nombre:"Farmacia Central",        localidad_codigo:"L33", modelo_codigo:"T650", cliente_id:"CLI-101", segmento:"1B", direccion:"Rivera 456" },
    ],
  },
  USUARIOS: {
    label: "Usuarios del Sistema",
    icon: "👤",
    required: ["email", "nombre", "apellido", "rol"],
    optional: ["empresa_codigo", "zona_codigo", "supervisor_email"],
    types: {
      email:           { type: "email" },
      nombre:          { type: "string", maxLen: 100 },
      apellido:        { type: "string", maxLen: 100 },
      rol:             { type: "enum",   values: ["DIRECTOR","REGIONAL","SUPERVISOR","TECNICO"] },
      empresa_codigo:  { type: "string", optional: true },
      zona_codigo:     { type: "string", optional: true },
    },
    templateRows: [
      { email:"nuevo.tecnico@ops.com", nombre:"Carlos", apellido:"Rodríguez", rol:"TECNICO", empresa_codigo:"TRANS", zona_codigo:"Z03", supervisor_email:"rdiaz@ops.com" },
      { email:"nuevo.supervisor@ops.com", nombre:"Ana", apellido:"Martínez", rol:"SUPERVISOR", empresa_codigo:"MAVILOR", zona_codigo:"Z07", supervisor_email:"" },
    ],
  },
  MAESTRO_GEO: {
    label: "Geografía (Regiones/Zonas/Localidades)",
    icon: "🌐",
    required: ["tipo", "codigo", "nombre", "padre_codigo"],
    optional: ["lat", "lng"],
    types: {
      tipo:        { type: "enum", values: ["REGION","ZONA","DEPARTAMENTO","LOCALIDAD"] },
      codigo:      { type: "string", maxLen: 10 },
      nombre:      { type: "string", maxLen: 100 },
      padre_codigo:{ type: "string", maxLen: 10, note: "Código del nivel superior. Vacío para REGION." },
    },
    templateRows: [
      { tipo:"REGION",       codigo:"R5",  nombre:"Región Litoral",    padre_codigo:"",  lat:"",       lng:"" },
      { tipo:"ZONA",         codigo:"Z10", nombre:"Zona Paysandú",      padre_codigo:"R5", lat:"",      lng:"" },
      { tipo:"DEPARTAMENTO", codigo:"D19", nombre:"Paysandú Capital",   padre_codigo:"Z10",lat:"",     lng:"" },
      { tipo:"LOCALIDAD",    codigo:"L37", nombre:"Paysandú",           padre_codigo:"D19",lat:"-32.32",lng:"-58.08" },
    ],
  },
};

// ─── COLORES BOOLE ───────────────────────────────────────────────────
const B = {
  void:"#050507", deep:"#0A0A0F", panel:"#0F0F18", card:"#141420",
  border:"#1E1E30", orange:"#FF6B1A", amber:"#FFAA00",
  red:"#FF2D55", green:"#00FF9C", yellow:"#FFD93D", blue:"#00B4FF",
  t1:"#F0F0FF", t2:"#8888AA", t3:"#444466",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${B.void};color:${B.t1};font-family:'Rajdhani',sans-serif;font-size:14px}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:${B.border};border-radius:2px}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-in{animation:fadeIn .25s ease both}
  .spin{animation:spin .7s linear infinite}
  .mono{font-family:'Share Tech Mono',monospace}
  .btn{cursor:pointer;border:none;outline:none;font-family:'Rajdhani',sans-serif;font-weight:700;
    letter-spacing:.06em;text-transform:uppercase;transition:all .15s;
    display:inline-flex;align-items:center;gap:6px}
  .btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
  .btn:disabled{opacity:.35;pointer-events:none}
  .field{background:${B.deep};border:1px solid ${B.border};border-radius:4px;
    color:${B.t1};padding:9px 12px;font-size:13px;width:100%;
    font-family:'Rajdhani',sans-serif;font-weight:500;transition:border-color .15s}
  .field:focus{outline:none;border-color:${B.orange};box-shadow:0 0 0 2px ${B.orange}22}
  .tag{display:inline-flex;align-items:center;padding:2px 8px;font-size:10px;
    font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)}
`;

// ─── VALIDADOR ────────────────────────────────────────────────────────
const validateRow = (row, schema, rowNum) => {
  const errors = [];
  const warnings = [];

  // Verificar campos requeridos
  schema.required.forEach(field => {
    const val = row[field];
    if (val === undefined || val === null || String(val).trim() === "") {
      errors.push(`Fila ${rowNum}: '${field}' es obligatorio`);
    }
  });

  // Verificar tipos
  Object.entries(schema.types).forEach(([field, def]) => {
    const val = row[field];
    if (!val && def.optional) return;
    if (!val) return;

    if (def.type === "enum" && !def.values.includes(String(val).trim().toUpperCase())) {
      errors.push(`Fila ${rowNum}: '${field}' = '${val}' no es válido. Valores: ${def.values.join(", ")}`);
    }
    if (def.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim())) {
      errors.push(`Fila ${rowNum}: '${field}' = '${val}' no es un email válido`);
    }
    if (def.type === "string" && def.maxLen && String(val).length > def.maxLen) {
      warnings.push(`Fila ${rowNum}: '${field}' excede ${def.maxLen} caracteres`);
    }
    if (def.type === "decimal" && val && isNaN(parseFloat(val))) {
      errors.push(`Fila ${rowNum}: '${field}' debe ser un número decimal`);
    }
  });

  return { errors, warnings };
};

// ─── LECTOR EXCEL/CSV ────────────────────────────────────────────────
const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        // Normalizar claves: lowercase, sin espacios
        const normalized = rows.map(r => {
          const nr = {};
          Object.entries(r).forEach(([k, v]) => {
            nr[k.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")] = v;
          });
          return nr;
        });
        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// ─── GENERADOR DE TEMPLATE ────────────────────────────────────────────
const downloadTemplate = (type) => {
  const schema = IMPORT_SCHEMAS[type];
  const headers = [...schema.required, ...schema.optional];
  const ws = XLSX.utils.json_to_sheet(schema.templateRows, { header: headers });

  // Estilo encabezado (limitado en xlsx-js, pero funcional)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");

  // Hoja de instrucciones
  const instrRows = [
    { campo: "INSTRUCCIONES", obligatorio: "", tipo: "", valores_validos: "", notas: "" },
    { campo: "─────────────", obligatorio: "", tipo: "", valores_validos: "", notas: "" },
    ...headers.map(h => {
      const def = schema.types[h] || {};
      return {
        campo: h,
        obligatorio: schema.required.includes(h) ? "✓ OBLIGATORIO" : "opcional",
        tipo: def.type || "text",
        valores_validos: def.values ? def.values.join(" | ") : def.maxLen ? `máx ${def.maxLen} chars` : "",
        notas: def.note || (def.default ? `Default: ${def.default}` : ""),
      };
    }),
  ];
  const wsInstr = XLSX.utils.json_to_sheet(instrRows);
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

  XLSX.writeFile(wb, `BOOLE_template_${type.toLowerCase()}.xlsx`);
};

// ═══════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════
export default function BulkUpload({ onImport }) {
  const [importType, setImportType] = useState("CASOS");
  const [step, setStep] = useState(1); // 1=select, 2=preview, 3=result
  const [rows, setRows] = useState([]);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const schema = IMPORT_SCHEMAS[importType];

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","csv"].includes(ext)) {
      alert("Formato no soportado. Usá .xlsx, .xls o .csv");
      return;
    }
    setLoading(true);
    try {
      const parsed = await parseFile(file);
      setRows(parsed);

      // Validar
      const allErrors = [];
      const allWarnings = [];
      parsed.forEach((row, i) => {
        const { errors, warnings } = validateRow(row, schema, i + 2);
        allErrors.push(...errors);
        allWarnings.push(...warnings);
      });
      setValidation({ errors: allErrors, warnings: allWarnings });
      setStep(2);
    } catch (e) {
      alert("Error al leer el archivo: " + e.message);
    }
    setLoading(false);
  }, [schema]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    setLoading(true);
    // Aquí se haría el POST al backend real
    // Simulamos procesamiento
    await new Promise(r => setTimeout(r, 1500));
    const validRows = rows.filter((_, i) => {
      const { errors } = validateRow(rows[i], schema, i + 2);
      return errors.length === 0;
    });
    setResult({
      total: rows.length,
      ok: validRows.length,
      errors: validation?.errors?.length || 0,
      warnings: validation?.warnings?.length || 0,
    });
    setStep(3);
    setLoading(false);
    if (onImport) onImport({ type: importType, rows: validRows });
  };

  const reset = () => { setStep(1); setRows([]); setValidation(null); setResult(null); };

  const BBtn = ({ label, onClick, color = B.orange, ghost, small, disabled, icon }) => (
    <button className="btn" onClick={onClick} disabled={disabled} style={{
      background: ghost ? color + "18" : color,
      color: ghost ? color : B.void,
      border: `1px solid ${ghost ? color + "55" : "transparent"}`,
      padding: small ? "6px 14px" : "10px 22px",
      fontSize: small ? 11 : 13,
      clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
    }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: B.void, padding: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900,
            background: `linear-gradient(90deg,${B.orange},${B.amber})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>
            CARGA MASIVA
          </div>
          <div style={{ fontSize: 12, color: B.t2, letterSpacing: ".06em" }}>
            IMPORTAR DATOS DESDE EXCEL / GOOGLE SHEETS / CSV
          </div>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, alignItems: "center" }}>
          {[["1", "TIPO"], ["2", "PREVISUALIZAR"], ["3", "RESULTADO"]].map(([n, l], i) => (
            <div key={n} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 900, fontFamily: "'Orbitron',sans-serif",
                background: step > i ? B.green : step === i + 1 ? B.orange : B.border,
                color: step > i ? B.void : step === i + 1 ? B.void : B.t3,
              }}>{step > i ? "✓" : n}</div>
              <span style={{ fontSize: 10, color: step === i + 1 ? B.orange : B.t3, marginLeft: 6,
                fontWeight: 700, letterSpacing: ".08em", marginRight: 6 }}>{l}</span>
              {i < 2 && <div style={{ width: 40, height: 1, background: B.border, marginRight: 6 }} />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Seleccionar tipo y archivo */}
        {step === 1 && (
          <div className="fade-in">
            {/* Tipo de importación */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: B.t3, fontWeight: 700, letterSpacing: ".1em",
                textTransform: "uppercase", marginBottom: 12 }}>SELECCIONAR TIPO DE IMPORTACIÓN</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {Object.entries(IMPORT_SCHEMAS).map(([type, s]) => (
                  <div key={type} onClick={() => setImportType(type)}
                    style={{
                      background: importType === type ? B.orange + "18" : B.card,
                      border: `1px solid ${importType === type ? B.orange + "66" : B.border}`,
                      borderTop: `2px solid ${importType === type ? B.orange : B.border}`,
                      padding: 14, cursor: "pointer", transition: "all .15s",
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: importType === type ? B.orange : B.t2,
                      letterSpacing: ".06em", textTransform: "uppercase" }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: B.t3, marginTop: 4 }}>
                      {s.required.length} obligatorios · {s.optional.length} opcionales
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campos requeridos */}
            <div style={{ background: B.card, border: `1px solid ${B.border}`, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: B.orange, fontWeight: 700, letterSpacing: ".1em",
                textTransform: "uppercase", marginBottom: 12 }}>CAMPOS — {schema.label}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {schema.required.map(f => (
                  <span key={f} className="tag" style={{ background: B.red + "22", color: B.red,
                    border: `1px solid ${B.red}44` }}>* {f}</span>
                ))}
                {schema.optional.map(f => (
                  <span key={f} className="tag" style={{ background: B.border, color: B.t3 }}>{f}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: B.t3, marginTop: 8 }}>
                Los campos con * son obligatorios. El resto se rellena con valores por defecto si está vacío.
              </div>
            </div>

            {/* Download template */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <BBtn label="⬇ Descargar Plantilla Excel" onClick={() => downloadTemplate(importType)}
                color={B.green} ghost/>
              <div style={{ fontSize: 11, color: B.t3, alignSelf: "center" }}>
                También podés abrir la plantilla en Google Sheets desde Drive
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragOver ? B.orange : B.border}`,
                background: dragOver ? B.orange + "08" : B.deep,
                borderRadius: 4, padding: "40px 24px", textAlign: "center",
                cursor: "pointer", transition: "all .15s",
              }}>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
                style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div className="spin" style={{ width: 24, height: 24, border: `2px solid ${B.border}`,
                    borderTopColor: B.orange, borderRadius: "50%" }} />
                  <span style={{ color: B.t2 }}>Procesando archivo...</span>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                  <div style={{ fontSize: 14, color: B.t1, fontWeight: 600 }}>
                    Arrastrar archivo o hacer clic para seleccionar
                  </div>
                  <div style={{ fontSize: 11, color: B.t3, marginTop: 6 }}>
                    Soporta .xlsx · .xls · .csv · Google Sheets exportado
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 — Preview y validación */}
        {step === 2 && (
          <div className="fade-in">
            {/* Summary */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {[
                [`${rows.length}`, "FILAS ENCONTRADAS", B.orange],
                [`${validation?.errors?.length || 0}`, "ERRORES", validation?.errors?.length > 0 ? B.red : B.green],
                [`${validation?.warnings?.length || 0}`, "ADVERTENCIAS", B.yellow],
                [`${rows.length - (new Set(validation?.errors?.map(e => parseInt(e.match(/Fila (\d+)/)?.[1] || 0)))).size}`, "FILAS VÁLIDAS", B.green],
              ].map(([v, l, c]) => (
                <div key={l} style={{ background: B.card, border: `1px solid ${c}33`,
                  borderTop: `2px solid ${c}`, padding: "12px 16px", flex: 1, textAlign: "center" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, color: B.t3, fontWeight: 700, letterSpacing: ".08em", marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {validation?.errors?.length > 0 && (
              <div style={{ background: B.red + "10", border: `1px solid ${B.red}44`,
                borderLeft: `3px solid ${B.red}`, padding: 14, marginBottom: 14, maxHeight: 160, overflowY: "auto" }}>
                <div style={{ fontSize: 10, color: B.red, fontWeight: 700, letterSpacing: ".1em", marginBottom: 8 }}>
                  ERRORES — Estas filas no se importarán
                </div>
                {validation.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: B.red, padding: "3px 0",
                    borderBottom: `1px solid ${B.red}22` }}>⚠ {e}</div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {validation?.warnings?.length > 0 && (
              <div style={{ background: B.yellow + "10", border: `1px solid ${B.yellow}33`,
                borderLeft: `3px solid ${B.yellow}`, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: B.yellow, fontWeight: 700, letterSpacing: ".1em", marginBottom: 8 }}>
                  ADVERTENCIAS — Se importarán con ajustes automáticos
                </div>
                {validation.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: B.yellow }}>{w}</div>
                ))}
              </div>
            )}

            {/* Table preview */}
            <div style={{ overflowX: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: B.panel, borderBottom: `1px solid ${B.border}` }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, color: B.t3,
                      fontWeight: 700, letterSpacing: ".08em" }}>#</th>
                    {Object.keys(rows[0] || {}).map(k => (
                      <th key={k} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10,
                        color: schema.required.includes(k) ? B.orange : B.t3,
                        fontWeight: 700, letterSpacing: ".08em", whiteSpace: "nowrap" }}>
                        {schema.required.includes(k) ? "* " : ""}{k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => {
                    const { errors } = validateRow(row, schema, i + 2);
                    const hasError = errors.length > 0;
                    return (
                      <tr key={i} style={{
                        borderBottom: `1px solid ${B.border}22`,
                        background: hasError ? B.red + "08" : "transparent",
                      }}>
                        <td style={{ padding: "7px 10px", color: B.t3, fontFamily: "'Share Tech Mono',monospace",
                          fontSize: 10 }}>{i + 2}</td>
                        {Object.values(row).map((v, j) => (
                          <td key={j} style={{ padding: "7px 10px", color: B.t1, maxWidth: 160,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {String(v).substring(0, 40)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length > 10 && (
                <div style={{ fontSize: 11, color: B.t3, padding: "8px 10px", textAlign: "center" }}>
                  ... y {rows.length - 10} filas más
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <BBtn label="← VOLVER" onClick={reset} color={B.t2} ghost small />
              <BBtn label={loading ? "PROCESANDO..." : `⬆ IMPORTAR ${rows.length - (validation?.errors?.length || 0)} FILAS`}
                onClick={handleConfirm} color={B.green}
                disabled={loading || (rows.length - (validation?.errors?.length || 0)) === 0} />
            </div>
          </div>
        )}

        {/* STEP 3 — Resultado */}
        {step === 3 && result && (
          <div className="fade-in" style={{ maxWidth: 600 }}>
            <div style={{ background: result.ok > 0 ? B.green + "10" : B.red + "10",
              border: `1px solid ${result.ok > 0 ? B.green + "44" : B.red + "44"}`,
              borderLeft: `4px solid ${result.ok > 0 ? B.green : B.red}`,
              padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900,
                color: result.ok > 0 ? B.green : B.red, marginBottom: 12 }}>
                {result.ok > 0 ? "✓ IMPORTACIÓN COMPLETADA" : "✗ IMPORTACIÓN FALLIDA"}
              </div>
              {[
                [`${result.ok}`, "registros importados exitosamente", B.green],
                [`${result.errors}`, "filas con errores (no importadas)", result.errors > 0 ? B.red : B.t3],
                [`${result.warnings}`, "advertencias procesadas", result.warnings > 0 ? B.yellow : B.t3],
              ].map(([v, l, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: `1px solid ${B.border}22` }}>
                  <span style={{ fontSize: 13, color: B.t2 }}>{l}</span>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: c }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <BBtn label="NUEVA IMPORTACIÓN" onClick={reset} color={B.orange} />
              <BBtn label="VER REGISTROS" onClick={() => {}} color={B.blue} ghost />
            </div>
          </div>
        )}

        {/* Google Sheets guide */}
        {step === 1 && (
          <div style={{ marginTop: 24, background: B.card, border: `1px solid ${B.border}`,
            borderLeft: `3px solid ${B.blue}`, padding: 16 }}>
            <div style={{ fontSize: 11, color: B.blue, fontWeight: 700, letterSpacing: ".1em",
              textTransform: "uppercase", marginBottom: 10 }}>CÓMO USAR GOOGLE SHEETS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "1. Descargá la plantilla Excel haciendo clic en el botón verde arriba",
                "2. Subila a Google Drive → clic derecho → Abrir con → Google Sheets",
                "3. Completá los datos respetando el formato de cada columna",
                "4. Archivo → Descargar → Microsoft Excel (.xlsx)",
                "5. Arrastrá el archivo descargado aquí o hacé clic en el área de carga",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: B.blue, fontFamily: "'Share Tech Mono',monospace", fontSize: 11, flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: 12, color: B.t2, lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}