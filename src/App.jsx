import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const B = {
  void:"#050507",deep:"#0A0A0E",panel:"#0D0D15",card:"#111119",
  cardHi:"#16161F",border:"#1C1C2C",borderHi:"#26263A",
  orange:"#FF6B00",orangeHi:"#FF8C2A",orangeDim:"#FF6B0014",orangeGlow:"#FF6B0030",
  amber:"#FFA500",amberDim:"#FFA50014",
  red:"#FF2040",redDim:"#FF204012",
  green:"#00E87A",greenDim:"#00E87A12",
  yellow:"#FFD020",yellowDim:"#FFD02012",
  blue:"#00A8FF",blueDim:"#00A8FF12",
  purple:"#9B6DFF",purpleDim:"#9B6DFF12",
  teal:"#00D4B4",
  t1:"#F4F4FF",t2:"#6868A0",t3:"#32324A",t4:"#1A1A28",
  bg:"#0A0A0E",
};

const EMPRESAS = [
  {codigo:"TRANS",    nombre:"Trans",           color:"#FF6B00", deps:["Artigas","Rivera","Tacuarembó","Durazno","Cerro Largo"]},
  {codigo:"MAVILOR",  nombre:"Mavilor",         color:"#00A8FF", deps:["Salto","Paysandú"]},
  {codigo:"TREDECIM", nombre:"Tredecim",        color:"#9B6DFF", deps:["Río Negro","Soriano","Colonia","Lavalleja","Rocha"]},
  {codigo:"TEAMPOS",  nombre:"TeamPos",         color:"#00E87A", deps:["San José","Flores","Florida","Canelones Oeste"]},
  {codigo:"PINVERDE", nombre:"Pin y Verde",     color:"#FFD020", deps:["Canelones Este"]},
  {codigo:"GEOCOM",   nombre:"Geocom Maldonado",color:"#FF2040", deps:["Maldonado"]},
  {codigo:"MARINO",   nombre:"Mariño",          color:"#00D4B4", deps:["Treinta y Tres"]},
  {codigo:"FISERV",   nombre:"Fiserv",          color:"#A855F7", deps:["Montevideo","Canelones"]},
];

const TIPOS_PROCESO = [
  {codigo:"INSTALACION",      nombre:"Instalación",              icono:"📦",color:"#00E87A",sla:24},
  {codigo:"SERVICIO_TECNICO", nombre:"Servicio Técnico",         icono:"🔧",color:"#00A8FF",sla:4},
  {codigo:"RETIRO",           nombre:"Retiro de Terminal",       icono:"🔄",color:"#FF6B00",sla:8},
  {codigo:"VISITA_PROACTIVA", nombre:"Visita Técnica Proactiva", icono:"👁",color:"#9B6DFF",sla:48},
];

const ESTADOS = ["PENDIENTE","ASIGNADO","EN_PROCESO","PAUSADO","FINALIZADO","CANCELADO","RECOORDINADO"];
const EC = {
  PENDIENTE:"#FF6B00",ASIGNADO:"#00A8FF",EN_PROCESO:"#FFD020",
  PAUSADO:"#9B6DFF",FINALIZADO:"#00E87A",CANCELADO:"#FF2040",RECOORDINADO:"#00D4B4"
};
const PRIORS = ["CRITICA","ALTA","MEDIA","BAJA"];
const PC = {CRITICA:"#FF2040",ALTA:"#FF6B00",MEDIA:"#FFD020",BAJA:"#00E87A"};
const CRITICIDADES = ["NORMAL","ALTA","MUY_ALTA","CRITICA"];
const RUBROS = ["Supermercado","Farmacia","Combustible","Restaurante","Hotel","Retail","Banco","Otro"];
const RANGOS_HORARIO = ["Sin restricción","08 a 10hs","10 a 12hs","12 a 14hs","14 a 16hs","16 a 18hs","+ de las 17hs","+ de las 18hs","Madrugada"];
const RAREZA_COLOR = {COMMON:"#6868A0",RARE:"#00A8FF",EPIC:"#9B6DFF",LEGENDARY:"#FFA500",MYTHIC:"#FF2040"};

const LOGROS_DEMO = [
  {codigo:"INST_10",  titulo:"Instalador Novato",  icono:"🔧",rareza:"COMMON",   xp:50,  desbloqueado:true, desc:"10 instalaciones"},
  {codigo:"INST_50",  titulo:"Instalador Experto", icono:"📦",rareza:"RARE",     xp:150, desbloqueado:true, desc:"50 instalaciones"},
  {codigo:"INST_100", titulo:"Instalador Senior",  icono:"⚡",rareza:"EPIC",     xp:300, desbloqueado:true, desc:"100 instalaciones"},
  {codigo:"INST_250", titulo:"Maestro Operativo",  icono:"🏆",rareza:"LEGENDARY",xp:500, desbloqueado:false,desc:"250 instalaciones"},
  {codigo:"SLA_7",    titulo:"Velocista SLA",      icono:"🎯",rareza:"RARE",     xp:200, desbloqueado:false,desc:"SLA ≥95% por 7 días"},
  {codigo:"NIV_25",   titulo:"Leyenda BOOLEAN",    icono:"👑",rareza:"MYTHIC",   xp:1000,desbloqueado:false,desc:"Nivel 25 alcanzado"},
];

const now  = () => new Date().toISOString();
const fmtD = iso => {if(!iso) return "—"; const d=new Date(iso); return d.toLocaleDateString("es-UY",{day:"2-digit",month:"2-digit",year:"2-digit"})+" "+d.toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"});};

// Cuenta regresiva hasta fecha+franja de recoordinación
const cuentaRegresiva = (caso) => {
  if(caso.estado!=="ASIGNADO"||!caso.fecha_recoordinacion) return null;
  const FRANJA_H = {"FH1 (8-12)":8,"FH2 (12-16)":12,"FH3 (16-19)":16,"FH4 (19-22)":19};
  const h = FRANJA_H[caso.franja_horaria||caso.rango_horario]||8;
  const [y,m,d] = caso.fecha_recoordinacion.split("-").map(Number);
  const target = new Date(y,m-1,d,h,0,0);
  const diff = target - Date.now();
  if(diff<=0) return null;
  const dias  = Math.floor(diff/86400000);
  const horas = Math.floor((diff%86400000)/3600000);
  const mins  = Math.floor((diff%3600000)/60000);
  if(dias>0) return `📅 ${dias}d ${horas}h`;
  if(horas>0) return `⏰ ${horas}h ${mins}min`;
  return `⏰ ${mins}min`;
};
const genN = () => "CASO-"+String(Math.floor(Math.random()*900000)+100000);

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(()=>{
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  },[]);
  return isMobile;
};

// ─── DÍAS HÁBILES ────────────────────────────────────────────
// Cache de feriados cargado una vez al inicio
let FERIADOS_CACHE = null;
const cargarFeriados = async () => {
  if(FERIADOS_CACHE) return FERIADOS_CACHE;
  const {data} = await supabase.from("feriados").select("fecha").eq("activo",true);
  FERIADOS_CACHE = new Set((data||[]).map(f=>f.fecha));
  return FERIADOS_CACHE;
};

const esFeriado = (fecha, feriadosSet) => {
  const iso = fecha.toISOString().split("T")[0];
  // Feriados fijos siempre aplican
  const FIJOS = new Set(["01-01","05-01","07-18","08-25","12-25"]);
  const mesdia = iso.slice(5); // MM-DD
  if(FIJOS.has(mesdia)) return true;
  return feriadosSet ? feriadosSet.has(iso) : false;
};

const esDiaHabil = (fecha, feriadosSet) => {
  const dow = fecha.getDay(); // 0=dom, 6=sab
  if(dow === 0 || dow === 6) return false;
  return !esFeriado(fecha, feriadosSet);
};

// Calcula la fecha límite sumando N días hábiles desde fecha inicio
const sumarDiasHabiles = (fechaInicio, diasHabiles, feriadosSet) => {
  const fecha = new Date(fechaInicio);
  let contados = 0;
  while(contados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    if(esDiaHabil(fecha, feriadosSet)) contados++;
  }
  return fecha;
};

// SLA en días hábiles por tipo de proceso
const SLA_DIAS_HABILES = {
  INSTALACION:      3,
  SERVICIO_TECNICO: 2,
  RETIRO:           5,
  VISITA_PROACTIVA: 7,
};

// Calcula días hábiles restantes hasta un deadline
const diasHabilesRestantes = (deadline, feriadosSet) => {
  if(!deadline) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const fin  = new Date(deadline); fin.setHours(0,0,0,0);
  if(fin <= hoy) return 0;
  let dias = 0;
  const cursor = new Date(hoy);
  while(cursor < fin) {
    cursor.setDate(cursor.getDate()+1);
    if(esDiaHabil(cursor, feriadosSet)) dias++;
  }
  return dias;
};

const slaInfo = (deadline, estado, feriadosSet) => {
  if(!deadline) return {label:"—", color:"#32324A"};
  if(["FINALIZADO","CANCELADO"].includes(estado)) return {label:"✓ OK", color:"#00E87A"};
  const diasRes = diasHabilesRestantes(deadline, feriadosSet);
  if(diasRes === null) return {label:"—", color:"#32324A"};
  if(diasRes === 0){
    // Verificar si venció (deadline en el pasado)
    const h = (new Date(deadline)-new Date())/3600000;
    if(h < 0) return {label:`⚠ VENCIDO`, color:"#FF2040"};
    return {label:`Vence hoy`, color:"#FFD020"};
  }
  if(diasRes === 1) return {label:`1 día hábil`, color:"#FFD020"};
  return {label:`${diasRes} días hábiles`, color:diasRes<=2?"#FFD020":"#00E87A"};
};
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#050507;overflow:hidden}
  body{color:#F4F4FF;font-family:'Rajdhani',sans-serif;font-size:14px}
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-thumb{background:#1C1C2C;border-radius:2px}
  ::-webkit-scrollbar-thumb:hover{background:#FF6B00}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{opacity:0;transform:scale(.92)}60%{transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes glow{0%,100%{text-shadow:0 0 10px #FF6B0088}50%{text-shadow:0 0 24px #FF6B00,0 0 48px #FFA50055}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes scanLine{0%{top:0}50%{top:calc(100% - 3px)}100%{top:0}}
  /* Mobile */
  @media(max-width:767px){
    .mobile-main{padding:12px 12px 80px 12px!important;}
    table{font-size:12px;}
    th,td{padding:7px 8px!important;}
    .modal-box{clip-path:none!important;border-radius:8px 8px 0 0;}
    .modal-bg{align-items:flex-end!important;padding:0!important;}
  }
  .fade-in{animation:fadeIn .28s ease both}
  .pop-in{animation:popIn .32s cubic-bezier(.34,1.4,.64,1) both}
  .live{animation:pulse 2s infinite}
  .spin{animation:spin .75s linear infinite}
  .glow{animation:glow 3s ease-in-out infinite}
  .float{animation:float 3.5s ease-in-out infinite}
  .btn{cursor:pointer;border:none;outline:none;font-family:'Rajdhani',sans-serif;font-weight:700;
    letter-spacing:.07em;text-transform:uppercase;transition:all .15s;
    display:inline-flex;align-items:center;gap:6px}
  .btn:hover{filter:brightness(1.18);transform:translateY(-1px)}
  .btn:active{filter:brightness(.88);transform:translateY(0)}
  .btn:disabled{opacity:.3;pointer-events:none}
  .field{background:#0A0A0E;border:1px solid #1C1C2C;border-radius:3px;
    color:#F4F4FF;padding:9px 12px;font-size:13px;width:100%;
    font-family:'Rajdhani',sans-serif;font-weight:500;transition:border-color .15s,box-shadow .15s}
  .field:focus{outline:none;border-color:#FF6B00;box-shadow:0 0 0 2px #FF6B0030}
  .field::placeholder{color:#32324A}
  .mono{font-family:'Share Tech Mono',monospace}
  .tag{display:inline-flex;align-items:center;padding:2px 8px;font-size:10px;font-weight:700;
    letter-spacing:.07em;text-transform:uppercase;
    clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)}
  .nav-item{cursor:pointer;transition:all .15s;border-left:2px solid transparent}
  .nav-item:hover{background:#1C1C2C44;border-left-color:#FF6B0044}
  .nav-active{background:#FF6B0014!important;border-left-color:#FF6B00!important}
  .card{background:#111119;border:1px solid #1C1C2C}
  .tab-btn{background:none;border:none;cursor:pointer;padding:8px 16px;
    font-family:'Rajdhani',sans-serif;font-weight:700;font-size:12px;
    border-bottom:2px solid transparent;transition:all .15s;
    color:#32324A;text-transform:uppercase;letter-spacing:.08em}
  .tab-btn:hover{color:#6868A0}
  .tab-btn.on{color:#FF6B00;border-bottom-color:#FF6B00}
  .modal-bg{position:fixed;inset:0;background:#000D;z-index:2000;
    display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)}
  .modal-box{background:#0D0D15;border:1px solid #FF6B0044;max-height:92vh;overflow:hidden;
    display:flex;flex-direction:column;width:100%;
    clip-path:polygon(14px 0%,100% 0%,100% calc(100% - 14px),calc(100% - 14px) 100%,0% 100%,0% 14px);
    animation:popIn .3s ease;box-shadow:0 0 80px #FF6B0015}
  .ticker-wrap{overflow:hidden;white-space:nowrap}
  .ticker-inner{display:inline-flex;animation:ticker 30s linear infinite}
  .ticker-inner:hover{animation-play-state:paused}
  .xp-bar{height:4px;background:#1C1C2C;overflow:hidden}
  .xp-fill{height:100%;background:linear-gradient(90deg,#FF6B00,#FFA500);transition:width 1s ease}
  .mission-bar{height:7px;background:#1C1C2C;overflow:hidden;position:relative}
  .mission-fill{height:100%;background:linear-gradient(90deg,#FF6B00,#FFA500);transition:width 1.2s ease;position:relative}
  .mission-fill::after{content:'';position:absolute;right:0;top:0;bottom:0;width:10px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3))}
  .progress{height:4px;background:#1C1C2C;overflow:hidden}
  .progress-fill{height:100%;transition:width .8s ease}
  .hex{clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
    display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-weight:900}
  table{width:100%;border-collapse:collapse}
  th{padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#32324A;
    text-transform:uppercase;letter-spacing:.09em;background:#0D0D15;border-bottom:1px solid #1C1C2C}
  td{padding:10px 12px;border-bottom:1px solid #1C1C2C18;font-size:13px}
  tr:hover td{background:#16161F!important}
  .kpi-bar{display:flex;border-top:1px solid #1C1C2C;background:#0D0D15;flex-shrink:0}
  .kpi-item{flex:1;padding:7px 14px;border-right:1px solid #1C1C2C;display:flex;align-items:center;gap:9px}
  .kpi-item:last-child{border-right:none}
  .msg-mine{align-self:flex-end}
  .msg-other{align-self:flex-start}
  .corner-tl{position:absolute;top:0;left:0;width:44px;height:44px;
    border-top:2px solid #FF6B00;border-left:2px solid #FF6B00;pointer-events:none;z-index:5}
`;

const Spin = ({s=18}) => <div style={{width:s,height:s,border:`2px solid ${B.border}`,borderTopColor:B.orange,borderRadius:"50%"}} className="spin"/>;
const Dot  = ({c,pulse,s=7}) => <div style={{width:s,height:s,borderRadius:"50%",background:c,flexShrink:0}} className={pulse?"live":""}/>;

const Bb = ({label,onClick,color=B.orange,ghost,small,disabled,icon,style={},full}) => (
  <button className="btn" onClick={onClick} disabled={disabled} style={{
    background:ghost?color+"18":color, color:ghost?color:"#050507",
    border:`1px solid ${ghost?color+"55":"transparent"}`,
    padding:small?"5px 13px":"10px 20px", fontSize:small?11:13,
    clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
    width:full?"100%":"auto", justifyContent:full?"center":"flex-start", ...style}}>
  {icon&&<span>{icon}</span>}{label}
  </button>
);

const Tg = ({label,color}) => (
  <span className="tag" style={{background:color+"20",color,border:`1px solid ${color}33`}}>{label}</span>
);

const FL = ({label,color=B.t3,req}) => (
  <div style={{fontSize:10,color:req?B.orange:color,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",marginBottom:6}}>
    {req&&<span style={{color:B.orange,marginRight:3}}>*</span>}{label}
  </div>
);

const Toast = ({msg,type,onClose}) => (
  <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:B.card,
    border:`1px solid ${type==="success"?B.green:type==="error"?B.red:B.orange}55`,
    borderLeft:`3px solid ${type==="success"?B.green:type==="error"?B.red:B.orange}`,
    padding:"11px 16px",display:"flex",alignItems:"center",gap:10,fontSize:13,maxWidth:340,
    clipPath:"polygon(8px 0%,100% 0%,100% 100%,0% 100%,0% 8px)",
    boxShadow:"0 8px 32px #00000066",animation:"popIn .3s ease"}}>
    <span style={{fontSize:16,color:type==="success"?B.green:type==="error"?B.red:B.orange}}>
      {type==="success"?"✓":type==="error"?"✗":"!"}
    </span>
    <span style={{flex:1,color:B.t1,fontWeight:600}}>{msg}</span>
    <button className="btn" onClick={onClose} style={{background:"none",color:B.t3,fontSize:18,padding:0}}>×</button>
  </div>
);

const Modal = ({title,onClose,children,width=680}) => (
  <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal-box" style={{maxWidth:width}}>
      <div style={{padding:"14px 22px",borderBottom:`1px solid ${B.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:B.panel}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:B.orange,letterSpacing:".07em"}}>{title}</div>
        <button className="btn" onClick={onClose} style={{background:"none",color:B.t3,fontSize:22,padding:0}}>×</button>
      </div>
      <div style={{padding:22,overflowY:"auto",flex:1}}>{children}</div>
    </div>
  </div>
);
const Ticker = ({casos}) => {
  const breach=casos.filter(c=>c.sla_deadline&&new Date(c.sla_deadline)<new Date()&&!["FINALIZADO","CANCELADO"].includes(c.estado||"")).length;
  const items=[`◈ ${casos.length} casos en el sistema`,`⚠ ${breach} casos con SLA vencido`,`✓ ${casos.filter(c=>c.estado==="FINALIZADO").length} casos resueltos`,`⚙ ${casos.filter(c=>c.estado==="EN_PROGRESO").length} en progreso`,`★ BOOLEAN · La lógica detrás de toda la operación`];
  const full=[...items,...items];
  return (
    <div style={{background:B.orange,height:24,display:"flex",alignItems:"center",overflow:"hidden",flexShrink:0}}>
      <div style={{background:B.void,color:B.orange,padding:"0 14px",height:"100%",display:"flex",alignItems:"center",fontSize:9,fontWeight:700,letterSpacing:".18em",flexShrink:0,borderRight:`1px solid ${B.orange}55`}}>● LIVE</div>
      <div className="ticker-wrap" style={{flex:1}}>
        <div className="ticker-inner">{full.map((t,i)=><span key={i} style={{fontSize:11,fontWeight:600,color:"#050507",paddingRight:70,whiteSpace:"nowrap"}}>{t}</span>)}</div>
      </div>
    </div>
  );
};

const Login = ({onLogin}) => {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [loading,setL]=useState(false); const [err,setErr]=useState("");
  const go = async () => {
    if(!email||!pass){setErr("Completá email y contraseña");return;}
    setL(true);setErr("");
    const {data,error}=await supabase.auth.signInWithPassword({email,password:pass});
    if(error){setErr(error.message);setL(false);return;}
    onLogin(data.user);
  };
  return (
    <div style={{minHeight:"100vh",background:B.void,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="pop-in" style={{width:"100%",maxWidth:420,background:B.panel,border:`1px solid ${B.orange}33`,padding:38,clipPath:"polygon(16px 0%,100% 0%,100% calc(100% - 16px),calc(100% - 16px) 100%,0% 100%,0% 16px)",boxShadow:`0 0 80px ${B.orange}15`}}>
        <div style={{textAlign:"center",marginBottom:34}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:38,fontWeight:900,color:B.orange,letterSpacing:".06em",lineHeight:1}} className="glow">BOOLEAN</div>
          <div style={{width:220,height:2,background:`linear-gradient(90deg,transparent,${B.orange},${B.amber},transparent)`,margin:"12px auto 14px"}}/>
          <div style={{fontSize:11,color:B.t2,letterSpacing:".1em",textTransform:"uppercase"}}>La lógica detrás de toda la operación</div>
        </div>
        <div style={{marginBottom:12}}><FL label="Email" req/><input className="field" type="email" placeholder="usuario@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/></div>
        <div style={{marginBottom:20}}><FL label="Contraseña" req/><input className="field" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/></div>
        {err&&<div style={{background:B.redDim,border:`1px solid ${B.red}33`,borderLeft:`3px solid ${B.red}`,padding:"9px 13px",marginBottom:14,fontSize:12,color:B.red}}>{err}</div>}
        <Bb label={loading?"INGRESANDO...":"INGRESAR AL SISTEMA"} onClick={go} disabled={loading} full/>
        <div style={{marginTop:18,padding:12,background:B.deep,border:`1px solid ${B.border}`,fontSize:11,color:B.t3,lineHeight:1.8}}>
          <span style={{color:B.orange,fontWeight:700,fontSize:10}}>PRIMER ACCESO: </span>Supabase → Authentication → Users → Add user
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({view,setView,user,onLogout,casos,perfil,noLeidosChat}) => {
  const isMobile = useMobile();
  const breach=casos.filter(c=>!["FINALIZADO","CANCELADO"].includes(c.estado||"")&&c.sla_deadline&&new Date(c.sla_deadline)<new Date()).length;
  const abiertos=casos.filter(c=>!["FINALIZADO","CANCELADO"].includes(c.estado||"")).length;
  const rol=perfil?.rol||"DIRECTOR";

  const MENU_COMPLETO=[
    {id:"mision",        icon:"◎",  emoji:"🎯", label:"MISIÓN",          roles:["DIRECTOR","REGIONAL","SUPERVISOR","TECNICO"]},
    {id:"ruta",          icon:"🗺", emoji:"🗺", label:"RUTA",             roles:["DIRECTOR","REGIONAL","SUPERVISOR","TECNICO"]},
    {id:"casos",         icon:"≣",  emoji:"📋", label:"CASOS",            roles:["DIRECTOR","REGIONAL","SUPERVISOR","TECNICO"], badge:abiertos},
    {id:"nuevo",         icon:"+",  emoji:"➕", label:"NUEVO",            roles:["DIRECTOR","REGIONAL","SUPERVISOR"]},
    {id:"bulk",          icon:"⬆", emoji:"📤", label:"CARGA",            roles:["DIRECTOR","REGIONAL","SUPERVISOR"]},
    {id:"analitica",     icon:"◑",  emoji:"📊", label:"ANÁLISIS",         roles:["DIRECTOR","REGIONAL","SUPERVISOR"]},
    {id:"comunicaciones",icon:"💬", emoji:"💬", label:"CHAT",             roles:["DIRECTOR","REGIONAL","SUPERVISOR","TECNICO"], badge:noLeidosChat||0},
    {id:"logros",        icon:"★",  emoji:"🏆", label:"LOGROS",           roles:["DIRECTOR","REGIONAL","SUPERVISOR","TECNICO"]},
    {id:"usuarios",      icon:"👥", emoji:"👥", label:"USUARIOS",         roles:["DIRECTOR","REGIONAL"]},
    {id:"config",        icon:"⟲", emoji:"⚙️", label:"CONFIG",           roles:["DIRECTOR"]},
  ];
  const menu=MENU_COMPLETO.filter(m=>m.roles.includes(rol));
  const initials=(user?.email||"U").substring(0,2).toUpperCase();

  // ── MOBILE — barra inferior fija estilo WhatsApp ──────────
  if(isMobile) return (
    <>
      {/* Contenido ocupa toda la pantalla con padding abajo para la barra */}
      <style>{`
        .mobile-main { padding-bottom: 70px !important; }
        .mob-nav-item { flex:1; display:flex; flex-direction:column; align-items:center;
          justify-content:center; padding:6px 2px; cursor:pointer; position:relative;
          min-height:56px; background:none; border:none; }
        .mob-nav-item.active { color: #FF6B00; }
        .mob-nav-item:not(.active) { color: #666; }
      `}</style>
      {/* Barra de alerta SLA si hay breach */}
      {breach>0&&(
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,
          background:B.red,padding:"6px 14px",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#fff",fontWeight:700}}>⚠ {breach} SLA VENCIDO{breach>1?"S":""}</span>
        </div>
      )}
      {/* Barra de navegación inferior */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:200,
        background:"#0A0A0F",
        borderTop:"1px solid #1a1a1a",
        display:"flex", alignItems:"stretch",
        paddingBottom:"env(safe-area-inset-bottom, 0px)",
      }}>
        {menu.slice(0,5).map(item=>(
          <button key={item.id}
            className={`mob-nav-item${view===item.id?" active":""}`}
            onClick={()=>setView(item.id)}>
            <span style={{fontSize:22, lineHeight:1}}>{item.emoji}</span>
            <span style={{fontSize:9,fontWeight:700,marginTop:2,letterSpacing:".02em",
              color:view===item.id?B.orange:"#555"}}>{item.label}</span>
            {item.badge>0&&(
              <span style={{
                position:"absolute",top:6,right:"50%",transform:"translateX(8px)",
                background:B.orange,color:"#050507",
                borderRadius:10,padding:"1px 5px",fontSize:8,fontWeight:900,
                fontFamily:"'Orbitron',sans-serif",minWidth:16,textAlign:"center",
              }}>{item.badge}</span>
            )}
          </button>
        ))}
        {/* Botón más opciones si hay más de 5 items */}
        {menu.length>5&&(
          <MobileMoreMenu menu={menu.slice(5)} view={view} setView={setView} onLogout={onLogout} user={user} perfil={perfil}/>
        )}
      </div>
    </>
  );

  // ── DESKTOP — sidebar lateral original ───────────────────
  return (
    <div style={{width:210,background:B.panel,borderRight:`1px solid ${B.border}`,display:"flex",flexDirection:"column",height:"100%",flexShrink:0}}>
      <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${B.border}`,flexShrink:0}}>
        <img src="/logo-boolean.png" alt="BOOLEAN"
          style={{width:"100%",maxWidth:180,height:"auto",
            filter:"drop-shadow(0 0 8px #FF6B0033)"}}/>
      </div>
      {breach>0&&(
        <div style={{margin:"8px 10px 0",background:B.redDim,border:`1px solid ${B.red}33`,borderLeft:`2px solid ${B.red}`,padding:"6px 10px",display:"flex",gap:7,alignItems:"center"}}>
          <Dot c={B.red} pulse s={6}/><span style={{fontSize:11,color:B.red,fontWeight:700}}>{breach} SLA VENCIDO{breach>1?"S":""}</span>
        </div>
      )}
      <nav style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
        {menu.map(item=>(
          <div key={item.id} className={`nav-item ${view===item.id?"nav-active":""}`} onClick={()=>setView(item.id)}
            style={{padding:"9px 14px",display:"flex",alignItems:"center",gap:9,marginBottom:1}}>
            <span style={{fontSize:13,color:view===item.id?B.orange:B.t3,minWidth:16,textAlign:"center"}}>{item.icon}</span>
            <span style={{fontSize:12,fontWeight:700,letterSpacing:".05em",color:view===item.id?B.t1:B.t2,flex:1}}>{item.label}</span>
            {item.badge>0&&<span style={{background:B.orange,color:"#050507",padding:"1px 6px",fontSize:9,fontWeight:900,fontFamily:"'Orbitron',sans-serif",clipPath:"polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)"}}>{item.badge}</span>}
          </div>
        ))}
      </nav>
      <div style={{padding:"12px 14px",borderTop:`1px solid ${B.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:9}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${B.orange},${B.amber})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,fontFamily:"'Orbitron',sans-serif",color:"#050507",flexShrink:0}}>{initials}</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{perfil?.nombre||user?.email||""}</div>
            <div style={{fontSize:9,color:B.orange,fontWeight:700,letterSpacing:".06em",marginTop:1}}>
              {perfil?.rol==="REGIONAL"?"REPRESENTANTE REGIONAL":perfil?.rol==="SUPERVISOR"?"SUPERVISOR":perfil?.rol==="TECNICO"?"TÉCNICO DE CAMPO":"DIRECTOR OPERATIVO"}
            </div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".08em"}}>NIVEL 23</span>
          <span style={{fontSize:9,color:B.amber,fontFamily:"'Share Tech Mono',monospace"}}>8.450 XP</span>
        </div>
        <div className="xp-bar"><div className="xp-fill" style={{width:"84.5%"}}/></div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:9}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><Dot c={B.green} s={5} pulse/><span style={{fontSize:9,color:B.t3}}>EN LÍNEA</span></div>
          <button className="btn" onClick={onLogout} style={{background:"none",color:B.t3,fontSize:10,padding:"2px 8px",border:`1px solid ${B.border}`}}>SALIR</button>
        </div>
      </div>
    </div>
  );
};

// Menú "más opciones" para mobile cuando hay más de 5 items
const MobileMoreMenu = ({menu, view, setView, onLogout, user, perfil}) => {
  const [open, setOpen] = useState(false);
  const initials=(user?.email||"U").substring(0,2).toUpperCase();
  const hasActive = menu.some(m=>m.id===view);
  return (
    <>
      <button className={`mob-nav-item${hasActive?" active":""}`} onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:22}}>☰</span>
        <span style={{fontSize:9,fontWeight:700,marginTop:2,color:hasActive?B.orange:"#555"}}>MÁS</span>
      </button>
      {open&&(
        <>
          {/* Backdrop */}
          <div onClick={()=>setOpen(false)}
            style={{position:"fixed",inset:0,zIndex:290,background:"rgba(0,0,0,0.7)"}}/>
          {/* Panel */}
          <div style={{
            position:"fixed",bottom:70,left:0,right:0,zIndex:295,
            background:"#0A0A0F",borderTop:`2px solid ${B.orange}`,
            padding:"8px 0 8px",
          }}>
            {/* Usuario info */}
            <div style={{padding:"10px 20px 12px",borderBottom:"1px solid #1a1a1a",
              display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
              <div style={{width:38,height:38,borderRadius:"50%",
                background:`linear-gradient(135deg,${B.orange},${B.amber})`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:13,fontWeight:900,color:"#050507"}}>{initials}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#ccc"}}>{perfil?.nombre||user?.email}</div>
                <div style={{fontSize:10,color:B.orange,fontWeight:700}}>
                  {perfil?.rol==="TECNICO"?"TÉCNICO DE CAMPO":perfil?.rol||"DIRECTOR"}
                </div>
              </div>
            </div>
            {menu.map(item=>(
              <button key={item.id} onClick={()=>{setView(item.id);setOpen(false);}}
                style={{
                  width:"100%",padding:"14px 20px",background:"none",border:"none",
                  display:"flex",alignItems:"center",gap:16,cursor:"pointer",
                  borderLeft:`3px solid ${view===item.id?B.orange:"transparent"}`,
                  background:view===item.id?B.orangeDim:"transparent",
                }}>
                <span style={{fontSize:22}}>{item.emoji}</span>
                <span style={{fontSize:15,fontWeight:700,color:view===item.id?B.orange:"#ccc"}}>{item.label}</span>
                {item.badge>0&&<span style={{marginLeft:"auto",background:B.orange,color:"#050507",
                  borderRadius:10,padding:"2px 8px",fontSize:11,fontWeight:900}}>{item.badge}</span>}
              </button>
            ))}
            <div style={{padding:"12px 20px 4px",borderTop:"1px solid #1a1a1a",marginTop:6}}>
              <button onClick={onLogout}
                style={{width:"100%",padding:"12px 0",background:"none",
                  border:`1px solid #333`,color:"#666",cursor:"pointer",
                  fontSize:14,fontWeight:700,borderRadius:2}}>
                CERRAR SESIÓN
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ─── LOGO SVG BOOLEAN ────────────────────────────────────────
const LogoBoolean = ({size=1}) => (
  <img
    src="/logo-boolean.png"
    alt="BOOLEAN — La lógica que convierte decisiones en resultados"
    style={{
      width: Math.round(320*size),
      maxWidth: "100%",
      height: "auto",
      display: "block",
      margin: "0 auto",
      filter: "drop-shadow(0 0 12px #FF6B0044)",
    }}
  />
);

// ─── XP POR ACCIÓN ───────────────────────────────────────────
const XP_ACCIONES = [
  {accion:"Instalación completada",     xp:150, icono:"📦"},
  {accion:"Servicio técnico resuelto",  xp:120, icono:"🔧"},
  {accion:"Retiro completado",          xp:80,  icono:"🔄"},
  {accion:"Visita proactiva",           xp:60,  icono:"👁"},
  {accion:"SLA cumplido",               xp:50,  icono:"⏱"},
  {accion:"Encuesta completada",        xp:20,  icono:"📋"},
  {accion:"Caso recoordinado",          xp:10,  icono:"📅"},
];

// ─── COMPONENTE MISIÓN ───────────────────────────────────────
const Mision = ({casos,setView,user,perfil}) => {
  const [time,setTime]       = useState(new Date());
  const [mensaje,setMensaje] = useState(null);
  const [editMsg,setEditMsg] = useState(false);
  const [nuevoMsg,setNuevoMsg]= useState("");
  const [misiones,setMisiones]= useState([]);
  const [saving,setSaving]   = useState(false);

  const esDirector = perfil?.rol==="DIRECTOR";
  const esTecnico  = perfil?.rol==="TECNICO";

  useEffect(()=>{
    const t=setInterval(()=>setTime(new Date()),1000);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    // Cargar mensaje activo
    supabase.from("mensajes_director").select("*")
      .eq("activo",true).order("created_at",{ascending:false}).limit(1)
      .then(({data})=>{ if(data?.length) setMensaje(data[0]); });
    // Cargar misiones activas
    supabase.from("misiones_config").select("*").eq("activa",true)
      .then(({data})=>setMisiones(data||[]));
  },[]);

  // Calcular progreso de una misión para el usuario actual
  const calcProgreso = (m) => {
    const misCasos = esTecnico
      ? casos.filter(c=>c.tecnico_id===(perfil?.auth_id||perfil?.id))
      : casos;
    const finalizados = misCasos.filter(c=>c.estado==="FINALIZADO");
    switch(m.metrica){
      case "instalaciones":      return finalizados.filter(c=>c.tipo_proceso==="INSTALACION").length;
      case "servicios_tecnicos": return finalizados.filter(c=>c.tipo_proceso==="SERVICIO_TECNICO").length;
      case "visitas_proactivas": return finalizados.filter(c=>c.tipo_proceso==="VISITA_PROACTIVA").length;
      case "retiros":            return finalizados.filter(c=>c.tipo_proceso==="RETIRO").length;
      case "casos_totales":      return finalizados.length;
      case "sla_cumplido":
        const total = finalizados.length;
        const enTiempo = finalizados.filter(c=>c.sla_deadline&&new Date(c.fecha_cierre||c.updated_at)<new Date(c.sla_deadline)).length;
        return total ? Math.round(enTiempo/total*100) : 0;
      default: return 0;
    }
  };

  // Indicadores según rol
  const total       = casos.length;
  const activos     = casos.filter(c=>!["FINALIZADO","CANCELADO"].includes(c.estado||"")).length;
  const enProceso   = casos.filter(c=>c.estado==="EN_PROCESO").length;
  const finalizados = casos.filter(c=>c.estado==="FINALIZADO").length;
  const breach      = casos.filter(c=>c.sla_deadline&&new Date(c.sla_deadline)<new Date()&&!["FINALIZADO","CANCELADO"].includes(c.estado||"")).length;
  const slaComp     = total ? Math.round(((total-breach)/total)*100) : 100;
  const pendientes  = casos.filter(c=>c.estado==="PENDIENTE").length;
  const sinAsignar  = casos.filter(c=>!c.tecnico_id&&c.estado==="PENDIENTE").length;

  const guardarMensaje = async() => {
    setSaving(true);
    // Desactivar mensajes anteriores
    await supabase.from("mensajes_director").update({activo:false}).eq("activo",true);
    if(nuevoMsg.trim()){
      const{data}=await supabase.from("mensajes_director").insert({
        texto:nuevoMsg.trim(), activo:true,
        autor:user?.email, created_at:new Date().toISOString()
      }).select().single();
      setMensaje(data);
    } else {
      setMensaje(null);
    }
    setEditMsg(false); setSaving(false);
    setNuevoMsg("");
  };

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"0 0 40px"}}>

      {/* ── LOGO ── */}
      <div style={{textAlign:"center",padding:"20px 0 8px"}}>
        <LogoBoolean size={0.9}/>
      </div>

      {/* ── MENSAJE DEL DIRECTOR ── */}
      {(mensaje||esDirector)&&(
        <div style={{margin:"16px 0",background:"#1A0400",
          border:`1px solid ${B.orange}`,padding:"14px 16px",position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:mensaje?8:0}}>
            <span style={{fontSize:18,flexShrink:0}}>📢</span>
            <div style={{fontSize:10,fontWeight:700,color:B.orange,
              fontFamily:"'Orbitron',sans-serif",letterSpacing:".1em"}}>
              MENSAJE DE OPERACIONES
            </div>
            {esDirector&&(
              <button onClick={()=>{setNuevoMsg(mensaje?.texto||"");setEditMsg(true);}}
                style={{marginLeft:"auto",background:"none",border:`1px solid ${B.orange}44`,
                  color:B.orange,cursor:"pointer",padding:"4px 10px",fontSize:10,flexShrink:0}}>
                {mensaje?"✎ EDITAR":"+ NUEVO"}
              </button>
            )}
          </div>
          {mensaje&&(
            <div style={{fontSize:15,color:"#fff",fontWeight:600,lineHeight:1.6}}>
              {mensaje.texto}
            </div>
          )}
          {!mensaje&&esDirector&&(
            <div style={{fontSize:12,color:B.t3,fontStyle:"italic"}}>
              Sin mensaje activo. Tocá "+ NUEVO" para escribir uno.
            </div>
          )}
        </div>
      )}

      {/* Modal editar mensaje */}
      {editMsg&&(
        <Modal title="📢 MENSAJE DE OPERACIONES" onClose={()=>setEditMsg(false)} width={500}>
          <div style={{marginBottom:14}}>
            <FL label="Mensaje (dejá vacío para eliminar el actual)"/>
            <textarea className="field" rows={4}
              placeholder="Ej: INCIDENTE DE ERROR DE CONEXIÓN GPRS — Todos los técnicos revisar conectividad"
              value={nuevoMsg} onChange={e=>setNuevoMsg(e.target.value)}
              style={{fontSize:14,resize:"vertical"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,
            paddingTop:14,borderTop:`1px solid ${B.border}`}}>
            <Bb label="CANCELAR" onClick={()=>setEditMsg(false)} ghost small color={B.t2}/>
            <Bb label={saving?"GUARDANDO...":"PUBLICAR"} onClick={guardarMensaje} disabled={saving}/>
          </div>
        </Modal>
      )}

      {/* ── HORA Y FECHA ── */}
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:36,
          fontWeight:700,color:B.orange,letterSpacing:".06em",
          textShadow:`0 0 20px ${B.orange}66`}}>
          {time.toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}
        </div>
        <div style={{fontSize:12,color:B.t3,marginTop:2,letterSpacing:".08em"}}>
          {time.toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).toUpperCase()}
        </div>
      </div>

      {/* ── MISIONES ACTIVAS ── */}
      {misiones.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,
            letterSpacing:".14em",marginBottom:12,fontFamily:"'Orbitron',sans-serif"}}>
            ◈ MISIONES ACTIVAS
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {misiones.map(m=>{
              const progreso = calcProgreso(m);
              const pct = Math.min(100,Math.round(progreso/m.objetivo*100));
              const completada = pct>=100;
              return (
                <div key={m.id} style={{background:B.card,
                  border:`1px solid ${completada?B.green:B.border}`,
                  borderLeft:`3px solid ${completada?B.green:B.orange}`,
                  padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:B.t1}}>{m.nombre}</div>
                      <div style={{fontSize:10,color:B.t3,marginTop:2}}>
                        {({dia:"HOY",semana:"ESTA SEMANA",mes:"ESTE MES"})[m.periodo]} · {m.metrica==="sla_cumplido"?`Meta: ${m.objetivo}%`:`Meta: ${m.objetivo}`}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,
                        fontWeight:900,color:completada?B.green:B.orange}}>
                        {progreso}{m.metrica==="sla_cumplido"?"%":""} / {m.objetivo}{m.metrica==="sla_cumplido"?"%":""}
                      </div>
                      <div style={{fontSize:10,color:B.green,marginTop:1}}>+{m.xp} XP</div>
                    </div>
                  </div>
                  <div style={{height:6,background:B.deep,borderRadius:3}}>
                    <div style={{height:6,width:`${pct}%`,
                      background:completada?B.green:`linear-gradient(90deg,${B.orange},${B.amber})`,
                      borderRadius:3,transition:"width .5s"}}/>
                  </div>
                  {completada&&(
                    <div style={{marginTop:8,fontSize:11,color:B.green,fontWeight:700}}>
                      ✓ MISIÓN COMPLETADA · +{m.xp} XP desbloqueado
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── INDICADORES DE ALTO IMPACTO ── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,
          letterSpacing:".14em",marginBottom:12,fontFamily:"'Orbitron',sans-serif"}}>
          ◈ INDICADORES CLAVE
        </div>
        {esTecnico ? (
          // Vista técnico — sus propios datos
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {label:"MIS CASOS HOY",    val:casos.length,          color:B.blue,   icono:"📋"},
              {label:"EN PROCESO",       val:enProceso,             color:B.yellow, icono:"⚡"},
              {label:"FINALIZADOS HOY",  val:finalizados,           color:B.green,  icono:"✅"},
              {label:"SLA CUMPLIDO",     val:`${slaComp}%`,         color:slaComp>=90?B.green:B.red, icono:"⏱"},
            ].map(k=>(
              <div key={k.label} style={{background:B.card,border:`1px solid ${B.border}`,
                borderLeft:`3px solid ${k.color}`,padding:"14px 14px"}}>
                <div style={{fontSize:10,color:B.t3,fontWeight:700,letterSpacing:".08em",marginBottom:6}}>
                  {k.icono} {k.label}
                </div>
                <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:26,
                  fontWeight:900,color:k.color}}>{k.val}</div>
              </div>
            ))}
          </div>
        ) : (
          // Vista Director/Supervisor — datos globales
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {label:"CASOS ACTIVOS",    val:activos,               color:B.blue,   icono:"📋"},
              {label:"EN CAMPO AHORA",   val:enProceso,             color:B.yellow, icono:"⚡"},
              {label:"SIN ASIGNAR",      val:sinAsignar,            color:sinAsignar>0?B.red:B.green, icono:"⚠"},
              {label:"SLA VENCIDO",      val:breach,                color:breach>0?B.red:B.green, icono:"🚨"},
              {label:"FINALIZADOS HOY",  val:finalizados,           color:B.green,  icono:"✅"},
              {label:"SLA CUMPLIDO",     val:`${slaComp}%`,         color:slaComp>=90?B.green:B.red, icono:"⏱"},
            ].map(k=>(
              <div key={k.label} style={{background:B.card,border:`1px solid ${B.border}`,
                borderLeft:`3px solid ${k.color}`,padding:"14px 14px"}}>
                <div style={{fontSize:10,color:B.t3,fontWeight:700,letterSpacing:".08em",marginBottom:6}}>
                  {k.icono} {k.label}
                </div>
                <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:26,
                  fontWeight:900,color:k.color}}>{k.val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── XP POR ACCIÓN ── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,
          letterSpacing:".14em",marginBottom:12,fontFamily:"'Orbitron',sans-serif"}}>
          ◈ XP POR ACCIÓN
        </div>
        <div style={{background:B.card,border:`1px solid ${B.border}`,overflow:"hidden"}}>
          {XP_ACCIONES.map((a,i)=>(
            <div key={a.accion} style={{
              display:"flex",alignItems:"center",gap:12,
              padding:"12px 16px",
              borderBottom:i<XP_ACCIONES.length-1?`1px solid ${B.border}22`:"none",
              background:i%2===0?"transparent":B.deep+"44",
            }}>
              <span style={{fontSize:20,flexShrink:0}}>{a.icono}</span>
              <span style={{fontSize:13,color:B.t1,flex:1}}>{a.accion}</span>
              <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,
                fontWeight:900,color:B.green,flexShrink:0}}>+{a.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── EMPRESAS (solo Director/Supervisor) ── */}
      {!esTecnico&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,
            letterSpacing:".14em",marginBottom:12,fontFamily:"'Orbitron',sans-serif"}}>
            ◈ CASOS POR EMPRESA
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {EMPRESAS.map(e=>{
              const empCasos=casos.filter(c=>c.empresa_id===e.codigo);
              const empActivos=empCasos.filter(c=>!["FINALIZADO","CANCELADO"].includes(c.estado||"")).length;
              if(!empCasos.length) return null;
              return (
                <div key={e.codigo} style={{background:B.card,
                  border:`1px solid ${B.border}`,
                  borderLeft:`3px solid ${e.color}`,
                  padding:"10px 16px",
                  display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:e.color}}>{e.nombre}</div>
                    <div style={{fontSize:10,color:B.t3,marginTop:2}}>{empCasos.length} casos totales</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:700,color:B.t1}}>{empActivos}</div>
                    <div style={{fontSize:9,color:B.t3}}>activos</div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
};


const COLUMNAS_STD = [
  {id:"tipo",      label:"TIPO",         ancho:50,  visible:true},
  {id:"terminal",  label:"TERMINAL",     ancho:110, visible:true},
  {id:"razon",     label:"RAZÓN SOCIAL", ancho:160, visible:true},
  {id:"rut",       label:"RUT",          ancho:110, visible:true},
  {id:"estado",    label:"ESTADO",       ancho:110, visible:true},
  {id:"prioridad", label:"PRIORIDAD",    ancho:90,  visible:true},
  {id:"franja",    label:"FRANJA",       ancho:100, visible:true},
  {id:"telefono",  label:"TEL.",         ancho:100, visible:true},
  {id:"direccion", label:"DIRECCIÓN",    ancho:160, visible:true},
  {id:"localidad", label:"LOCALIDAD",    ancho:110, visible:true},
  {id:"depto",     label:"DEPTO",        ancho:100, visible:true},
];

const TIPO_ICONO = {
  INSTALACION:"📦", SERVICIO_TECNICO:"🔧", RETIRO:"🔄", VISITA_PROACTIVA:"👁"
};

const CasosList = ({casos,onSelect,onNew,user,perfil,onRecargar}) => {
  const [search,   setSearch]   = useState("");
  const [fE,       setFE]       = useState([]);
  const [fP,       setFP]       = useState([]);
  const [fT,       setFT]       = useState([]);
  const [fAsig,    setFAsig]    = useState([]);
  const [selIds,   setSelIds]   = useState(new Set());
  const [tecnicos, setTecnicos] = useState([]);
  const [tecSel,   setTecSel]   = useState("");
  const [asignando,setAsig]     = useState(false);
  const [encuestasMasivo,setEncMasivo] = useState([]);
  const [encuestaSel,setEncSel] = useState("");
  const [activandoEnc,setActEnc]= useState(false);

  const isMobile = useMobile();
  const esRolTecnico = perfil?.rol==="TECNICO";

  useEffect(()=>{
    supabase.from("usuarios").select("*").eq("rol","TECNICO").eq("activo",true)
      .then(({data})=>setTecnicos(data||[]));
    supabase.from("encuestas_config").select("*").eq("activa",true)
      .then(({data})=>setEncMasivo(data||[]));
  },[]);

  const matchFiltro = (arr,val) => arr.length===0||arr.includes(val);

  const fil = casos.filter(c=>{
    if(!matchFiltro(fT,c.tipo_proceso)) return false;
    if(!matchFiltro(fE,c.estado)) return false;
    if(!matchFiltro(fP,c.prioridad)) return false;
    if(fAsig.includes("ASIGNADO")&&!c.tecnico_id) return false;
    if(fAsig.includes("SIN_ASIGNAR")&&c.tecnico_id) return false;
    if(search){
      const q=search.toLowerCase();
      return (c.razon_social||"").toLowerCase().includes(q)||
             (c.numero||"").toLowerCase().includes(q)||
             (c.direccion||"").toLowerCase().includes(q)||
             (c.localidad||"").toLowerCase().includes(q)||
             (c.rut||"").toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSel=(id,e)=>{
    e.stopPropagation();
    setSelIds(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  };

  const toggleAll=()=>{
    if(selIds.size===fil.length) setSelIds(new Set());
    else setSelIds(new Set(fil.map(c=>c.id)));
  };

  const asignarMasivo=async()=>{
    if(!tecSel||selIds.size===0) return; setAsig(true);
    const tec=tecnicos.find(t=>t.id===tecSel);
    const ts=new Date().toISOString();
    for(const id of selIds){
      const caso=casos.find(c=>c.id===id); if(!caso) continue;
      const h=[...(caso.historial||[]),{id:Date.now(),tipo:"ASIGNACION",
        texto:`Asignado a ${tec?.nombre||""} ${tec?.apellido||""} por ${user?.email}`,
        usuario:user?.email,ts}];
      await supabase.from("casos").update({tecnico_id:tec.auth_id||tec.id,estado:"ASIGNADO",historial:h,updated_at:ts}).eq("id",id);
    }
    setAsig(false); setSelIds(new Set()); setTecSel("");
    if(onRecargar) await onRecargar();
  };

  const activarEncuestaMasivo=async()=>{
    if(!encuestaSel||selIds.size===0) return; setActEnc(true);
    for(const id of selIds){
      await supabase.from("casos_encuestas").insert({
        caso_id:id,encuesta_id:encuestaSel,
        activada_por:user?.email,activada_at:new Date().toISOString()
      });
    }
    setActEnc(false); setEncSel(""); setSelIds(new Set());
    if(onRecargar) await onRecargar();
  };

  // Filtro múltiple
  const FiltroMultiple=({label,opciones,valor,onChange})=>{
    const [open,setOpen]=useState(false);
    const ref=useRef(null);
    useEffect(()=>{
      const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
    },[]);
    return(
      <div ref={ref} style={{position:"relative"}}>
        <button onClick={()=>setOpen(o=>!o)}
          style={{padding:"10px 14px",background:valor.length>0?B.orangeDim:B.deep,
            border:`1px solid ${valor.length>0?B.orange:B.border}`,color:valor.length>0?B.orange:B.t2,
            cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:6,borderRadius:2,
            whiteSpace:"nowrap",minHeight:44}}>
          {label}
          {valor.length>0&&<span style={{background:B.orange,color:"#050507",borderRadius:"50%",
            width:18,height:18,fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {valor.length}</span>}
          <span style={{fontSize:10}}>▼</span>
        </button>
        {open&&(
          <div style={{position:"absolute",top:"100%",left:0,zIndex:200,minWidth:180,
            background:B.panel,border:`1px solid ${B.border}`,padding:6,marginTop:4,
            boxShadow:"0 8px 24px #00000088",borderRadius:2}}>
            {opciones.map(([v,l])=>(
              <label key={v} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                cursor:"pointer",fontSize:14,color:valor.includes(v)?B.orange:B.t2,
                background:valor.includes(v)?B.orangeDim:"transparent",borderRadius:2}}>
                <input type="checkbox" checked={valor.includes(v)}
                  onChange={()=>onChange(valor.includes(v)?valor.filter(x=>x!==v):[...valor,v])}
                  style={{accentColor:B.orange,width:16,height:16}}/>
                {l}
              </label>
            ))}
            {valor.length>0&&(
              <button onClick={()=>onChange([])}
                style={{width:"100%",marginTop:4,padding:"8px 0",background:"none",
                  border:`1px solid ${B.border}`,color:B.t3,cursor:"pointer",fontSize:12,borderRadius:2}}>
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Colores por prioridad
  const PRIO_BG = {CRITICA:"#1a0000",ALTA:"#1a0a00",MEDIA:"#001a1a",BAJA:"#001a00"};
  const PRIO_BORDER = {CRITICA:B.red,ALTA:B.orange,MEDIA:B.blue,BAJA:B.green};

  // WhatsApp helper
  const abrirWhatsApp=(tel)=>{
    if(!tel) return;
    const num = tel.replace(/\D/g,"");
    const numUY = num.startsWith("598")?num:"598"+num;
    window.open(`https://wa.me/${numUY}`,"_blank");
  };

  const cr = (c) => cuentaRegresiva(c);

  // ── VISTA MOBILE — tarjetas ─────────────────────────────
  if(isMobile) return (
    <div style={{padding:"12px 12px 80px"}}>
      {/* Header */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em"}}>GESTIÓN DE</div>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,color:B.t1}}>
          CASOS
          <span style={{fontSize:13,color:B.t3,marginLeft:10,fontWeight:400}}>{fil.length} de {casos.length}</span>
        </div>
      </div>

      {/* Búsqueda */}
      <input className="field" placeholder="🔍 Buscar razón social, dirección..."
        style={{width:"100%",marginBottom:10,fontSize:15,padding:"12px 14px",boxSizing:"border-box"}}
        value={search} onChange={e=>setSearch(e.target.value)}/>

      {/* Filtros en fila scrolleable */}
      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
        <FiltroMultiple label="Estado" valor={fE} onChange={setFE}
          opciones={ESTADOS.map(s=>[s,s])}/>
        <FiltroMultiple label="Tipo" valor={fT} onChange={setFT}
          opciones={TIPOS_PROCESO.map(t=>[t.codigo,`${TIPO_ICONO[t.codigo]} ${t.nombre}`])}/>
        <FiltroMultiple label="Prioridad" valor={fP} onChange={setFP}
          opciones={PRIORS.map(p=>[p,p])}/>
        {!esRolTecnico&&<FiltroMultiple label="Asignación" valor={fAsig} onChange={setFAsig}
          opciones={[["ASIGNADO","✓ Asignados"],["SIN_ASIGNAR","○ Sin asignar"]]}/>}
      </div>

      {/* Tarjetas */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {fil.map(c=>{
          const tp = TIPOS_PROCESO.find(t=>t.codigo===c.tipo_proceso);
          const tec = tecnicos.find(t=>(t.auth_id||t.id)===c.tecnico_id);
          const prioColor = PRIO_BORDER[c.prioridad]||B.t3;
          const prioBg = PRIO_BG[c.prioridad]||B.card;
          const cuenta = cr(c);
          const sl = slaInfo(c.sla_deadline,c.estado);
          const sel = selIds.has(c.id);
          return(
            <div key={c.id}
              onClick={()=>onSelect(c)}
              style={{
                background: sel?B.orangeDim:prioBg,
                border:`1px solid ${sel?B.orange:prioColor}`,
                borderLeft:`4px solid ${prioColor}`,
                borderRadius:2, overflow:"hidden",
                cursor:"pointer",
              }}>
              {/* Cabezal */}
              <div style={{padding:"12px 14px 8px",display:"flex",alignItems:"flex-start",gap:10}}>
                {!esRolTecnico&&(
                  <div onClick={e=>toggleSel(c.id,e)} style={{paddingTop:2,flexShrink:0}}>
                    <input type="checkbox" checked={sel} onChange={()=>{}}
                      style={{width:18,height:18,accentColor:B.orange,cursor:"pointer"}}/>
                  </div>
                )}
                <div style={{fontSize:28,flexShrink:0,lineHeight:1}}>{tp?.icono||"◈"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:B.t1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {c.razon_social||"Sin nombre"}
                  </div>
                  <div style={{fontSize:12,color:B.t3,marginTop:1,display:"flex",gap:8,flexWrap:"wrap"}}>
                    {c.numero_serie&&<span>📟 {c.numero_serie}</span>}
                    {c.rubro&&<span>🏪 {c.rubro}</span>}
                    {c.tier&&<span style={{color:({VIP:B.amber,T1a:B.orange,T1b:B.blue,T2:B.green})[c.tier]||B.t3,fontWeight:700}}>{c.tier}</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <Tg label={c.estado||"—"} color={EC[c.estado]||B.t3}/>
                  {cuenta&&<div style={{fontSize:10,color:B.teal,fontWeight:700,marginTop:3}}>{cuenta}</div>}
                </div>
              </div>

              {/* Datos */}
              <div style={{padding:"0 14px 10px",display:"flex",flexDirection:"column",gap:5}}>
                {c.direccion&&(
                  <div style={{fontSize:13,color:B.t2,display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{flexShrink:0}}>📍</span>
                    <span>{c.direccion}{c.localidad?` · ${c.localidad}`:""}{c.departamento?` · ${c.departamento}`:""}</span>
                  </div>
                )}
                {/* Descripción/Observaciones según tipo */}
                {(()=>{
                  const esST = ["SERVICIO_TECNICO","SOPORTE"].includes(c.tipo_proceso);
                  const texto = esST ? c.descripcion : c.observaciones;
                  if(!texto) return null;
                  return (
                    <div style={{fontSize:13,color:"#CC8800",display:"flex",gap:6,alignItems:"flex-start",
                      padding:"6px 10px",background:"#1a1000",border:"1px solid #CC880033",borderRadius:2}}>
                      <span style={{flexShrink:0}}>{esST?"🔍":"📋"}</span>
                      <span style={{lineHeight:1.5,
                        overflow:"hidden",display:"-webkit-box",
                        WebkitLineClamp:2,WebkitBoxOrient:"vertical",textOverflow:"ellipsis"}}>
                        {texto}
                      </span>
                    </div>
                  );
                })()}
                <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                  {c.franja_horaria&&(
                    <span style={{fontSize:12,color:"#CC7700",fontWeight:600}}>
                      🕐 {c.franja_horaria||c.rango_horario}
                    </span>
                  )}
                  {c.sla_deadline&&(
                    <span style={{fontSize:12,color:sl.color,fontWeight:600}}>
                      ⏱ {sl.label}
                    </span>
                  )}
                  <span style={{fontSize:12,fontWeight:700,color:prioColor}}>
                    {c.prioridad}
                  </span>
                </div>
                {/* Técnico asignado — visible para Director, Regional y Supervisor */}
                {["DIRECTOR","REGIONAL","SUPERVISOR"].includes(perfil?.rol)&&(
                  <div style={{fontSize:12,color:tec?B.green:B.t3,fontWeight:600}}>
                    👤 {tec?`${tec.nombre} ${tec.apellido}`:"Sin asignar"}
                  </div>
                )}
              </div>

              {/* Footer — teléfono WhatsApp */}
              {c.telefono&&(
                <div style={{borderTop:`1px solid ${prioColor}33`,padding:"8px 14px"}}
                  onClick={e=>e.stopPropagation()}>
                  <button
                    onClick={e=>{ e.stopPropagation(); abrirWhatsApp(c.telefono); }}
                    style={{
                      display:"flex",alignItems:"center",gap:8,
                      background:"#001a00",border:"1px solid #25D36644",
                      color:"#25D366",cursor:"pointer",padding:"8px 14px",
                      fontSize:14,fontWeight:700,borderRadius:2,width:"100%",
                      justifyContent:"center",
                    }}>
                    <span style={{fontSize:20}}>💬</span>
                    WhatsApp · {c.telefono}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {fil.length===0&&(
          <div style={{textAlign:"center",padding:40,color:B.t3}}>
            <div style={{fontSize:40,marginBottom:12}}>◎</div>
            <div style={{fontSize:14}}>Sin casos</div>
          </div>
        )}
      </div>

      {/* Barra de acciones masivas */}
      {selIds.size>0&&!esRolTecnico&&(
        <div style={{position:"fixed",bottom:70,left:0,right:0,
          background:B.panel,borderTop:`2px solid ${B.orange}`,
          padding:"12px 16px",zIndex:100,boxShadow:`0 -8px 32px ${B.orange}22`}}>
          <div style={{fontSize:13,fontWeight:900,color:B.orange,
            fontFamily:"'Orbitron',sans-serif",marginBottom:10}}>
            {selIds.size} CASO{selIds.size>1?"S":""} SEL.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",gap:8}}>
              <select className="field" value={tecSel} onChange={e=>setTecSel(e.target.value)}
                style={{flex:1,fontSize:14}}>
                <option value="">👤 Asignar técnico...</option>
                {tecnicos.map(t=>{
                  const carga=casos.filter(c=>c.tecnico_id===(t.auth_id||t.id)&&!["FINALIZADO","CANCELADO"].includes(c.estado||"")).length;
                  return <option key={t.id} value={t.id}>{t.nombre} {t.apellido} — {carga} casos</option>;
                })}
              </select>
              <Bb label={asignando?"...":"⚡"} onClick={asignarMasivo}
                disabled={!tecSel||asignando} small/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <select className="field" value={encuestaSel} onChange={e=>setEncSel(e.target.value)}
                style={{flex:1,fontSize:14}}>
                <option value="">📋 Activar encuesta...</option>
                {encuestasMasivo.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <Bb label={activandoEnc?"...":"📋"} onClick={activarEncuestaMasivo}
                disabled={!encuestaSel||activandoEnc} small ghost color={B.purple}/>
            </div>
            <Bb label="✕ CANCELAR SELECCIÓN" onClick={()=>setSelIds(new Set())}
              ghost small color={B.t2} full/>
          </div>
        </div>
      )}
    </div>
  );

  // ── VISTA DESKTOP — tabla ───────────────────────────────
  return (
    <div style={{padding:20,height:"100%",overflowY:"auto",paddingBottom:selIds.size>0?100:20}}>
      {/* Modal configuración columnas */}
      {false&&null}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em",marginBottom:3}}>GESTIÓN DE</div>
          <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900}}>CASOS OPERATIVOS</h1>
          <div style={{fontSize:11,color:B.t2,marginTop:2}}>
            {fil.length} de {casos.length} casos
            {selIds.size>0&&<span style={{color:B.orange,marginLeft:10,fontWeight:700}}>· {selIds.size} sel.</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {selIds.size>0&&<Bb label="✕" onClick={()=>setSelIds(new Set())} ghost small color={B.t2}/>}
          {!esRolTecnico&&<Bb label="+ NUEVO CASO" onClick={onNew}/>}
        </div>
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
        <input className="field" placeholder="🔍 Buscar..."
          style={{flex:2,minWidth:200}} value={search} onChange={e=>setSearch(e.target.value)}/>
        <FiltroMultiple label="Estado" valor={fE} onChange={setFE} opciones={ESTADOS.map(s=>[s,s])}/>
        <FiltroMultiple label="Tipo" valor={fT} onChange={setFT}
          opciones={TIPOS_PROCESO.map(t=>[t.codigo,`${TIPO_ICONO[t.codigo]} ${t.nombre}`])}/>
        <FiltroMultiple label="Prioridad" valor={fP} onChange={setFP} opciones={PRIORS.map(p=>[p,p])}/>
        {!esRolTecnico&&<FiltroMultiple label="Asignación" valor={fAsig} onChange={setFAsig}
          opciones={[["ASIGNADO","✓ Asignados"],["SIN_ASIGNAR","○ Sin asignar"]]}/>}
      </div>

      {/* Tabla */}
      <div className="card" style={{overflow:"auto"}}>
        <table>
          <thead>
            <tr>
              {!esRolTecnico&&<th style={{width:36}}>
                <input type="checkbox" checked={selIds.size===fil.length&&fil.length>0}
                  onChange={toggleAll} style={{width:14,height:14,accentColor:B.orange,cursor:"pointer"}}/>
              </th>}
              {["TIPO","RAZÓN SOCIAL","ESTADO","PRIOR.","FRANJA","SLA","TÉCNICO"].map(h=><th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {fil.map(c=>{
              const tp=TIPOS_PROCESO.find(t=>t.codigo===c.tipo_proceso);
              const sl=slaInfo(c.sla_deadline,c.estado);
              const tec=tecnicos.find(t=>(t.auth_id||t.id)===c.tecnico_id);
              const sel=selIds.has(c.id);
              const cuenta=cr(c);
              return(
                <tr key={c.id} style={{cursor:"pointer",background:sel?B.orangeDim:"transparent"}}
                  onClick={()=>onSelect(c)}>
                  {!esRolTecnico&&<td onClick={e=>toggleSel(c.id,e)}>
                    <input type="checkbox" checked={sel} onChange={()=>{}}
                      style={{width:14,height:14,accentColor:B.orange,cursor:"pointer"}}/>
                  </td>}
                  <td><span title={c.tipo_proceso} style={{fontSize:18}}>{tp?.icono||"◈"}</span></td>
                  <td>
                    <div style={{fontSize:12,fontWeight:600}}>{c.razon_social||"—"}</div>
                    <div style={{fontSize:10,color:B.t3}}>{c.numero||c.id_externo}</div>
                  </td>
                  <td>
                    <Tg label={c.estado||"—"} color={EC[c.estado]||B.t3}/>
                    {cuenta&&<div style={{fontSize:10,color:B.teal,fontWeight:700,marginTop:3}}>{cuenta}</div>}
                  </td>
                  <td><Tg label={c.prioridad||"—"} color={PC[c.prioridad]||B.t2}/></td>
                  <td style={{fontSize:11,color:"#CC7700",fontWeight:600}}>{c.franja_horaria||c.rango_horario||"—"}</td>
                  <td><span style={{fontSize:11,fontWeight:700,color:sl.color}}>{sl.label}</span></td>
                  <td>{tec
                    ?<span style={{fontSize:11,color:B.green,fontWeight:700}}>{tec.nombre}</span>
                    :<span style={{fontSize:11,color:B.t3}}>Sin asignar</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {fil.length===0&&(
          <div style={{padding:40,textAlign:"center",color:B.t3}}>
            <div style={{fontSize:28,marginBottom:10}}>◎</div>Sin casos
          </div>
        )}
      </div>

      {/* Barra de acciones masivas desktop */}
      {selIds.size>0&&!esRolTecnico&&(
        <div style={{position:"fixed",bottom:0,left:210,right:0,background:B.panel,
          borderTop:`2px solid ${B.orange}`,padding:"10px 20px",
          display:"flex",alignItems:"center",gap:12,zIndex:100,flexWrap:"wrap",
          boxShadow:`0 -8px 32px ${B.orange}22`}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:900,color:B.orange,flexShrink:0}}>
            {selIds.size} CASO{selIds.size>1?"S":""} SEL.
          </div>
          <select className="field" value={tecSel} onChange={e=>setTecSel(e.target.value)}
            style={{flex:1,maxWidth:260}}>
            <option value="">👤 Asignar técnico...</option>
            {tecnicos
              .filter(t=>{
                // Filtrar por empresa de los casos seleccionados
                const empresasCasos=[...new Set([...selIds].map(id=>casos.find(c=>c.id===id)?.empresa_id).filter(Boolean))];
                return empresasCasos.length===0||empresasCasos.some(emp=>t.empresa_codigo===emp);
              })
              .map(t=>{
                const carga=casos.filter(c=>c.tecnico_id===(t.auth_id||t.id)&&!["FINALIZADO","CANCELADO"].includes(c.estado||"")).length;
                return <option key={t.id} value={t.id}>{t.nombre} {t.apellido} ({t.empresa_codigo}) — {carga} casos</option>;
              })}
          </select>
          <Bb label={asignando?"...":"⚡ ASIGNAR"} onClick={asignarMasivo} disabled={!tecSel||asignando} small/>
          <div style={{width:1,height:28,background:B.border}}/>
          <select className="field" value={encuestaSel} onChange={e=>setEncSel(e.target.value)} style={{flex:1,maxWidth:200}}>
            <option value="">📋 Encuesta...</option>
            {encuestasMasivo.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <Bb label={activandoEnc?"...":"📋"} onClick={activarEncuestaMasivo} disabled={!encuestaSel||activandoEnc} small ghost color={B.purple}/>
          <Bb label="✕" onClick={()=>setSelIds(new Set())} ghost small color={B.t2}/>
        </div>
      )}
    </div>
  );
};

const NuevoCaso = ({onSave,onCancel,loading}) => {
  const [f,setF]=useState({tipo_proceso:"SOPORTE",prioridad:"MEDIUM",descripcion:"",numero_serie:"",rut:"",razon_social:"",departamento:"",localidad:"",direccion:"",telefono:"",rubro:"",empresa_id:"",rango_horario:"Sin restricción",es_incidente:false,incidente_id:"",sla_horas:4,tiene_instrucciones:false,instrucciones_texto:""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const tp=TIPOS_PROCESO.find(t=>t.codigo===f.tipo_proceso);
  const emp=EMPRESAS.find(e=>e.codigo===f.empresa_id);
  useEffect(()=>{const t=TIPOS_PROCESO.find(t=>t.codigo===f.tipo_proceso);if(t) s("sla_horas",t.sla);},[f.tipo_proceso]);
  const deps=emp?emp.deps:EMPRESAS.flatMap(e=>e.deps);
  return (
    <div style={{padding:20,height:"100%",overflowY:"auto"}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em",marginBottom:3}}>CREAR</div>
        <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900}}>NUEVO CASO</h1>
      </div>
      <div className="card" style={{padding:22,maxWidth:860}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${B.border}`}}>◈ PROCESO</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          <div><FL label="Tipo de Proceso" req/><select className="field" value={f.tipo_proceso} onChange={e=>s("tipo_proceso",e.target.value)}>{TIPOS_PROCESO.map(t=><option key={t.codigo} value={t.codigo}>{t.icono} {t.nombre}</option>)}</select></div>
          <div><FL label="Prioridad" req/><select className="field" value={f.prioridad} onChange={e=>s("prioridad",e.target.value)}>{PRIORS.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
          <div><FL label="Tier"/><select className="field" value={f.tier||""} onChange={e=>s("tier",e.target.value)}>
            <option value="">Sin tier</option>
            {["VIP","T1a","T1b","T2"].map(t=><option key={t} value={t}>{t}</option>)}
          </select></div>
          <div><FL label="SLA (horas)"/><input className="field" type="number" value={f.sla_horas} onChange={e=>s("sla_horas",parseInt(e.target.value)||4)}/></div>
          <div><FL label="Rango Horario"/><select className="field" value={f.rango_horario} onChange={e=>s("rango_horario",e.target.value)}>{RANGOS_HORARIO.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
        </div>
        {(f.tipo_proceso==="SERVICIO_TECNICO"||f.tipo_proceso==="VISITA_PROACTIVA")&&(
          <div style={{background:B.redDim,border:`1px solid ${B.red}22`,borderLeft:`3px solid ${B.red}33`,padding:"12px 14px",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <input type="checkbox" id="esInc" checked={f.es_incidente} onChange={e=>s("es_incidente",e.target.checked)} style={{width:16,height:16,accentColor:B.red,cursor:"pointer"}}/>
              <label htmlFor="esInc" style={{fontSize:12,fontWeight:700,color:B.red,cursor:"pointer"}}>⚠ Este caso pertenece a un incidente</label>
            </div>
            {f.es_incidente&&(<div><FL label="ID del Incidente (ej: #Caida_Tigo_3G)"/><input className="field" placeholder="#Nombre_del_incidente" value={f.incidente_id} onChange={e=>s("incidente_id",e.target.value.startsWith("#")?e.target.value:"#"+e.target.value.replace(/^#+/,""))}/></div>)}
          </div>
        )}
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${B.border}`}}>◈ DATOS DEL CLIENTE</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:18}}>
          <div><FL label="Número de Terminal" req/><input className="field" placeholder="TER-XXXXXXX" value={f.numero_serie} onChange={e=>s("numero_serie",e.target.value)}/></div>
          <div><FL label="RUT"/><input className="field" placeholder="XX XXXXXX X" value={f.rut} onChange={e=>s("rut",e.target.value)}/></div>
          <div><FL label="Razón Social"/><input className="field" placeholder="Nombre del comercio" value={f.razon_social} onChange={e=>s("razon_social",e.target.value)}/></div>
          <div><FL label="Teléfono"/><input className="field" placeholder="09X XXX XXX" value={f.telefono} onChange={e=>s("telefono",e.target.value)}/></div>
          <div><FL label="Rubro"/><select className="field" value={f.rubro} onChange={e=>s("rubro",e.target.value)}><option value="">Seleccionar...</option>{RUBROS.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
        </div>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${B.border}`}}>◈ UBICACIÓN</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:18}}>
          <div><FL label="Empresa" req/><select className="field" value={f.empresa_id} onChange={e=>s("empresa_id",e.target.value)}><option value="">Seleccionar...</option>{EMPRESAS.map(e=><option key={e.codigo} value={e.codigo}>{e.nombre}</option>)}</select></div>
          <div><FL label="Departamento" req/><select className="field" value={f.departamento} onChange={e=>s("departamento",e.target.value)}><option value="">Seleccionar...</option>{deps.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
          <div><FL label="Localidad"/><input className="field" placeholder="Ciudad / Localidad" value={f.localidad} onChange={e=>s("localidad",e.target.value)}/></div>
          <div style={{gridColumn:"1/-1"}}><FL label="Dirección"/><input className="field" placeholder="Calle, número, esquina..." value={f.direccion} onChange={e=>s("direccion",e.target.value)}/></div>
        </div>
        {/* Descripción del problema — obligatorio para ST, oculto para otros */}
        {["SERVICIO_TECNICO","SOPORTE"].includes(f.tipo_proceso) && (
          <div style={{marginBottom:18}}>
            <FL label="Descripción del Problema" req/>
            <textarea className="field" rows={3}
              placeholder="Describí el problema aparente del equipo..."
              value={f.descripcion} onChange={e=>s("descripcion",e.target.value)}
              style={{resize:"vertical",fontSize:15}}/>
          </div>
        )}
        {/* Observaciones — para Instalación, Retiro y VTP */}
        {["INSTALACION","RETIRO","VISITA_PROACTIVA"].includes(f.tipo_proceso) && (
          <div style={{marginBottom:18}}>
            <FL label="Observaciones (opcional)"/>
            <textarea className="field" rows={3}
              placeholder="Alguna particularidad del caso que el técnico deba saber..."
              value={f.observaciones||""} onChange={e=>s("observaciones",e.target.value)}
              style={{resize:"vertical",fontSize:15}}/>
          </div>
        )}

        {/* ── INSTRUCCIONES ESPECIALES ── */}
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
            background:f.tiene_instrucciones?"#1A0400":B.deep,
            border:`1px solid ${f.tiene_instrucciones?B.orange+"44":B.border}`,
            cursor:"pointer",transition:"all .2s"}}
            onClick={()=>s("tiene_instrucciones",!f.tiene_instrucciones)}>
            <div style={{width:36,height:20,borderRadius:10,background:f.tiene_instrucciones?B.orange:B.border,
              position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,left:f.tiene_instrucciones?18:2,width:16,height:16,
                borderRadius:"50%",background:B.t1,transition:"left .2s"}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:f.tiene_instrucciones?B.orange:B.t2}}>
                ⚠ Agregar instrucciones especiales para el técnico
              </div>
              <div style={{fontSize:10,color:B.t3,marginTop:2}}>
                El técnico deberá confirmar que las leyó antes de comenzar
              </div>
            </div>
          </div>
          {f.tiene_instrucciones&&(
            <div style={{marginTop:0,border:`1px solid ${B.orange}44`,borderTop:"none",background:"#0E0800",padding:14}}>
              <textarea className="field" rows={4}
                placeholder={"Escribí las instrucciones especiales...\n\nEj: 'Llamar al encargado antes de ir'\n'Acceso por puerta lateral'\n'Cliente solicita identificación al ingresar'"}
                value={f.instrucciones_texto}
                onChange={e=>s("instrucciones_texto",e.target.value)}
                style={{resize:"vertical",lineHeight:1.7,background:"#0E0800",borderColor:B.orange+"44"}}/>
              <div style={{fontSize:9,color:B.t3,marginTop:6}}>
                💡 Imágenes y audios se pueden adjuntar desde el detalle del caso una vez creado
              </div>
            </div>
          )}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:14,borderTop:`1px solid ${B.border}`}}>
          <div style={{background:B.orangeDim,border:`1px solid ${B.orange}22`,padding:"7px 13px",fontSize:11,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <span>{tp?.icono}</span>
            <span style={{color:B.t3}}>SLA:</span><span style={{color:B.orange,fontFamily:"'Orbitron',sans-serif",fontWeight:700}}>{f.sla_horas}h</span>
            <span style={{color:B.t3}}>· Vence:</span><span style={{color:B.t1}}>{fmtD(new Date(Date.now()+f.sla_horas*3600000).toISOString())}</span>
            {f.rango_horario!=="Sin restricción"&&<><span style={{color:B.t3}}>· Horario:</span><span style={{color:B.purple,fontWeight:700}}>{f.rango_horario}</span></>}
            {f.es_incidente&&f.incidente_id&&<Tg label={f.incidente_id} color={B.red}/>}
            {f.tiene_instrucciones&&f.instrucciones_texto&&<Tg label="⚠ INSTRUCCIONES" color={B.orange}/>}
          </div>
          <div style={{display:"flex",gap:10}}>
            <Bb label="CANCELAR" onClick={onCancel} color={B.t2} ghost small/>
            <Bb label={loading?"GUARDANDO...":"CREAR CASO"} onClick={()=>onSave(f)}
              disabled={
                !f.tipo_proceso||!f.numero_serie||!f.razon_social||!f.empresa_id||loading||
                (["SERVICIO_TECNICO","SOPORTE"].includes(f.tipo_proceso)&&!f.descripcion)
              }/>
          </div>
        </div>
      </div>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════
// INSTRUCCIONES ESPECIALES — helpers, visor y modal de carga
// ═══════════════════════════════════════════════════════════

const subirArchivoInstruccion = async (file, casoId) => {
  const ext  = file.name.split(".").pop();
  const path = `instrucciones/${casoId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from("boolean-adjuntos").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("boolean-adjuntos").getPublicUrl(path);
  return { path, url: urlData.publicUrl, nombre: file.name, tipo: file.type, tamanio: file.size };
};

const BloqueInstrucciones = ({ instrucciones, onConfirmar, yaConfirmado, esRolTecnico }) => {
  if (!instrucciones?.texto && !instrucciones?.adjuntos?.length) return null;
  const [audioActivo, setAudioActivo] = useState(null);
  const audioRef = useRef(null);
  const toggleAudio = (url) => {
    if (audioActivo === url) { audioRef.current?.pause(); setAudioActivo(null); }
    else { setAudioActivo(url); setTimeout(() => audioRef.current?.play(), 50); }
  };
  return (
    <div style={{
      background: yaConfirmado ? B.deep : "#1A0400",
      border: `2px solid ${yaConfirmado ? B.border : B.red}`,
      borderLeft: `5px solid ${yaConfirmado ? B.green : B.red}`,
      padding: 16, marginBottom: 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{yaConfirmado ? "✅" : "⚠️"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 900,
            color: yaConfirmado ? B.green : B.red, letterSpacing: ".1em" }}>
            {yaConfirmado ? "INSTRUCCIONES LEÍDAS Y CONFIRMADAS" : "⚠ INSTRUCCIONES ESPECIALES — LEER ANTES DE COMENZAR"}
          </div>
          {instrucciones.autor && (
            <div style={{ fontSize: 9, color: B.t3, marginTop: 3 }}>
              Cargado por {instrucciones.autor} · {fmtD(instrucciones.ts)}
              {instrucciones.editado && <span style={{ color: B.amber, marginLeft: 8 }}>(editado)</span>}
            </div>
          )}
        </div>
      </div>
      {instrucciones.texto && (
        <div style={{ fontSize: 13, color: B.t1, lineHeight: 1.7, marginBottom: 12,
          background: B.deep, padding: "10px 14px",
          borderLeft: `3px solid ${yaConfirmado ? B.green : B.orange}` }}>
          {instrucciones.texto}
        </div>
      )}
      {instrucciones.adjuntos?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 14 }}>
          {instrucciones.adjuntos.map((adj, i) => {
            const esImagen = adj.tipo?.startsWith("image/");
            const esAudio  = adj.tipo?.startsWith("audio/");
            return (
              <div key={i} style={{ border: `1px solid ${B.border}`, background: B.card, overflow: "hidden" }}>
                {esImagen && (
                  <a href={adj.url} target="_blank" rel="noopener noreferrer">
                    <img src={adj.url} alt={adj.nombre}
                      style={{ width: 130, height: 90, objectFit: "cover", display: "block", cursor: "pointer" }}/>
                  </a>
                )}
                {esAudio && (
                  <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 9, minWidth: 200 }}>
                    <button onClick={() => toggleAudio(adj.url)}
                      style={{ width: 32, height: 32, borderRadius: "50%",
                        background: audioActivo === adj.url ? B.orange : B.border,
                        border: "none", cursor: "pointer",
                        color: audioActivo === adj.url ? "#050507" : B.t1, fontSize: 14,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {audioActivo === adj.url ? "⏸" : "▶"}
                    </button>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: B.t1 }}>{adj.nombre}</div>
                      <div style={{ fontSize: 9, color: B.t3 }}>Audio · {(adj.tamanio/1024).toFixed(0)} KB</div>
                    </div>
                    {audioActivo === adj.url && (
                      <audio ref={audioRef} src={adj.url} onEnded={() => setAudioActivo(null)} style={{ display: "none" }}/>
                    )}
                  </div>
                )}
                {!esImagen && !esAudio && (
                  <a href={adj.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", padding: "8px 12px", fontSize: 11, color: B.blue, textDecoration: "none" }}>
                    📎 {adj.nombre}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
      {esRolTecnico && !yaConfirmado && (
        <button onClick={onConfirmar}
          style={{ width: "100%", padding: "12px 0", background: B.red, border: "none", cursor: "pointer",
            fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 12, color: "#050507",
            letterSpacing: ".1em", clipPath: "polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)" }}>
          ✓ CONFIRMO QUE LEÍ LAS INSTRUCCIONES — CONTINUAR
        </button>
      )}
      {yaConfirmado && instrucciones.confirmado_por && (
        <div style={{ fontSize: 9, color: B.green, textAlign: "center", fontWeight: 700, marginTop: 8 }}>
          ✓ Confirmado por {instrucciones.confirmado_por} · {fmtD(instrucciones.confirmado_ts)}
        </div>
      )}
    </div>
  );
};

const ModalInstrucciones = ({ caso, user, onClose, onSave }) => {
  const [texto,    setTexto]    = useState(caso.instrucciones_especiales?.texto || "");
  const [adjuntos, setAdjuntos] = useState(caso.instrucciones_especiales?.adjuntos || []);
  const [subiendo, setSubiendo] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    setSubiendo(true);
    try {
      const nuevos = await Promise.all(Array.from(files).map(f => subirArchivoInstruccion(f, caso.id)));
      setAdjuntos(p => [...p, ...nuevos]);
    } catch (e) { alert("Error al subir archivo: " + e.message); }
    setSubiendo(false);
  };

  const quitarAdjunto = (i) => setAdjuntos(p => p.filter((_, idx) => idx !== i));

  const guardar = async () => {
    setSaving(true);
    const payload = {
      texto: texto.trim(), adjuntos,
      autor: user.email, ts: new Date().toISOString(),
      editado: !!caso.instrucciones_especiales?.texto,
      version_anterior: caso.instrucciones_especiales || null,
    };
    await onSave(payload);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="⚠ INSTRUCCIONES ESPECIALES DEL CASO" onClose={onClose} width={620}>
      <div style={{ marginBottom: 14, padding: "8px 12px", background: B.orangeDim,
        border: `1px solid ${B.orange}22`, fontSize: 11, color: B.t2, lineHeight: 1.6 }}>
        El técnico <strong style={{ color: B.t1 }}>deberá confirmar que leyó estas instrucciones</strong> antes
        de poder cambiar el estado del caso a EN PROGRESO.
      </div>
      <div style={{ marginBottom: 14 }}>
        <FL label="Instrucciones" req/>
        <textarea className="field" rows={5}
          placeholder={"Escribí las instrucciones especiales para el técnico...\n\nEj: 'El local abre recién a las 10hs, llamar antes de ir'\n'El acceso es por la puerta lateral, el portón está bloqueado'"}
          value={texto} onChange={e => setTexto(e.target.value)}
          style={{ resize: "vertical", lineHeight: 1.7 }}/>
      </div>
      <div style={{ marginBottom: 16 }}>
        <FL label="Adjuntos — imagen o audio (opcional)"/>
        <div onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${B.border}`, background: B.deep, padding: "14px 16px",
            cursor: "pointer", textAlign: "center", marginBottom: 10, transition: "border-color .15s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = B.orange}
          onMouseLeave={e => e.currentTarget.style.borderColor = B.border}>
          <input ref={fileRef} type="file" multiple
            accept="image/*,audio/*"
            style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)}/>
          {subiendo
            ? <div style={{ color: B.orange, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Spin s={14}/> Subiendo...</div>
            : <div style={{ color: B.t3, fontSize: 12 }}>
                📎 Clic para adjuntar imágenes o audios
                <div style={{ fontSize: 10, marginTop: 4 }}>JPG · PNG · MP3 · OGG · WAV</div>
              </div>
          }
        </div>
        {adjuntos.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {adjuntos.map((adj, i) => (
              <div key={i} style={{ position: "relative", border: `1px solid ${B.border}`, background: B.card }}>
                {adj.tipo?.startsWith("image/")
                  ? <img src={adj.url} alt={adj.nombre} style={{ width: 80, height: 60, objectFit: "cover", display: "block" }}/>
                  : <div style={{ padding: "8px 12px", fontSize: 10, color: B.blue }}>🎤 {adj.nombre}</div>
                }
                <button onClick={() => quitarAdjunto(i)}
                  style={{ position: "absolute", top: 2, right: 2, background: B.red, border: "none",
                    color: "#fff", width: 18, height: 18, cursor: "pointer", fontSize: 11,
                    display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: `1px solid ${B.border}` }}>
        <Bb label="CANCELAR" onClick={onClose} ghost small color={B.t2}/>
        <Bb label={saving ? "GUARDANDO..." : "GUARDAR INSTRUCCIONES"}
          onClick={guardar} disabled={!texto.trim() && !adjuntos.length || saving || subiendo}/>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════
// PART 6 — CasoDetalle + Modal Encuesta
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// ESCÁNER DE CÓDIGO DE BARRAS — usa cámara del celular
// ═══════════════════════════════════════════════════════════════
const MODELOS_TERMINAL = [
  "Move 2500","Move 5000","Lane 3000","Lane 7000",
  "Dx 8000","RX 5000","RX 7000"
];

// ═══════════════════════════════════════════════════════════════
// PANTALLA COMPLETA DE INSTRUCCIONES ESPECIALES
// ═══════════════════════════════════════════════════════════════
const PantallaInstrucciones = ({ caso, onConfirmar, confirmando }) => {
  const instr = caso.instrucciones_especiales;
  const [audioActivo, setAudioActivo] = useState(null);
  const audioRef = useRef(null);

  const toggleAudio = (url) => {
    if (audioActivo === url) { audioRef.current?.pause(); setAudioActivo(null); }
    else { setAudioActivo(url); setTimeout(() => audioRef.current?.play(), 50); }
  };

  return (
    <div style={{ minHeight:"100vh", background:B.void, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:600, animation:"popIn .3s ease" }}>
        {/* Header */}
        <div style={{ background:"#1A0400", border:`2px solid ${B.red}`,
          borderBottom:"none", padding:"20px 24px", display:"flex", gap:14, alignItems:"center" }}>
          <span style={{ fontSize:32 }}>⚠️</span>
          <div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900,
              color:B.red, letterSpacing:".08em" }}>INSTRUCCIONES ESPECIALES</div>
            <div style={{ fontSize:11, color:B.t2, marginTop:3 }}>
              Leé con atención antes de comenzar · {caso.razon_social}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ background:"#0E0400", border:`2px solid ${B.red}`,
          borderTop:`1px solid ${B.red}44`, borderBottom:"none", padding:24 }}>
          {instr?.texto && (
            <div style={{ fontSize:15, color:B.t1, lineHeight:1.8, marginBottom:16,
              padding:"14px 16px", background:B.deep,
              borderLeft:`4px solid ${B.orange}` }}>
              {instr.texto}
            </div>
          )}
          {instr?.adjuntos?.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginTop:12 }}>
              {instr.adjuntos.map((adj, i) => {
                const esImg = adj.tipo?.startsWith("image/");
                const esAud = adj.tipo?.startsWith("audio/");
                return (
                  <div key={i} style={{ border:`1px solid ${B.border}`, background:B.card, overflow:"hidden" }}>
                    {esImg && (
                      <a href={adj.url} target="_blank" rel="noopener noreferrer">
                        <img src={adj.url} alt={adj.nombre}
                          style={{ width:180, height:130, objectFit:"cover", display:"block" }}/>
                      </a>
                    )}
                    {esAud && (
                      <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:10, minWidth:220 }}>
                        <button onClick={() => toggleAudio(adj.url)}
                          style={{ width:36, height:36, borderRadius:"50%",
                            background:audioActivo===adj.url?B.orange:B.border,
                            border:"none", cursor:"pointer",
                            color:audioActivo===adj.url?"#050507":B.t1, fontSize:16,
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {audioActivo===adj.url ? "⏸" : "▶"}
                        </button>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:B.t1 }}>{adj.nombre}</div>
                          <div style={{ fontSize:9, color:B.t3 }}>Audio adjunto</div>
                        </div>
                        {audioActivo===adj.url && (
                          <audio ref={audioRef} src={adj.url}
                            onEnded={()=>setAudioActivo(null)} style={{ display:"none" }}/>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {instr?.autor && (
            <div style={{ marginTop:16, fontSize:10, color:B.t3 }}>
              Cargado por {instr.autor} · {fmtD(instr.ts)}
            </div>
          )}
        </div>

        {/* Botón confirmar */}
        <button onClick={onConfirmar} disabled={confirmando}
          style={{ width:"100%", padding:"18px 0",
            background:confirmando?B.t3:B.red, border:"none", cursor:confirmando?"not-allowed":"pointer",
            fontFamily:"'Orbitron',sans-serif", fontWeight:900, fontSize:14,
            color:"#050507", letterSpacing:".1em", transition:"all .2s",
            borderTop:`2px solid ${B.red}` }}>
          {confirmando ? "CONFIRMANDO..." : "✓ CONFIRMO QUE LEÍ LAS INSTRUCCIONES — CONTINUAR"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PANTALLA DE FINALIZAR — flujo paso a paso
// ═══════════════════════════════════════════════════════════════
const PantallaFinalizar = ({ caso, user, perfil, onVolver, onFinalizado }) => {
  const [paso, setPaso] = useState(1); // 1=resolvio 2=modelo+serie 3=cierre_st
  const [resolvio, setResolvio] = useState(null);
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [showScan, setShowScan] = useState(false);
  const [formCierre, setFormCierre] = useState({
    descripcion_problema:"", como_resolvio:"", requirio_n2:null
  });
  const [saving, setSaving] = useState(false);

  const esServicioTecnico = ["SERVICIO_TECNICO","SOPORTE"].includes((caso.tipo_proceso||"").toUpperCase());

  const continuar = async () => {
    if (paso === 1) { setPaso(2); return; }
    if (paso === 2) {
      if (resolvio && esServicioTecnico) { setPaso(3); return; }
      // No ST o No resolvio → finalizar directo
      await guardar();
      return;
    }
    if (paso === 3) { await guardar(); return; }
  };

  const guardar = async () => {
    setSaving(true);
    const updates = {
      estado:"FINALIZADO",
      resolvio: resolvio === true,
      cierre_modelo_terminal: modelo,
      cierre_serie_terminal: serie,
      ...(paso === 3 ? {
        cierre_descripcion_problema: formCierre.descripcion_problema,
        cierre_como_resolvio: formCierre.como_resolvio,
        cierre_requirio_n2: formCierre.requirio_n2,
        cierre_completado: true,
        cierre_at: new Date().toISOString(),
      } : {}),
    };
    await onFinalizado(updates, resolvio);
    setSaving(false);
  };

  const PASOS_TITULO = ["","¿RESOLVISTE EL PROBLEMA?","DATOS DEL EQUIPO","DETALLES DE LA RESOLUCIÓN"];
  const puedeAvanzar = paso===1 ? resolvio!==null
    : paso===2 ? modelo && serie.trim()
    : formCierre.descripcion_problema.trim() && formCierre.como_resolvio.trim() && formCierre.requirio_n2!==null;

  return (
    <>
      {showScan && (
        <EscanerBarras onScan={v=>{setSerie(v);setShowScan(false);}} onClose={()=>setShowScan(false)}/>
      )}
      <div style={{ minHeight:"100vh", background:B.void, display:"flex",
        flexDirection:"column", alignItems:"center", padding:20, paddingTop:40 }}>
        <div style={{ width:"100%", maxWidth:560 }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
            <button onClick={onVolver}
              style={{ background:"none", border:`1px solid ${B.border}`, color:B.t2,
                cursor:"pointer", padding:"6px 12px", fontSize:11, fontFamily:"'Orbitron',sans-serif" }}>
              ← VOLVER
            </button>
            <div>
              <div style={{ fontSize:9, color:B.t3, fontWeight:700, letterSpacing:".18em" }}>
                PASO {paso} DE {resolvio && esServicioTecnico ? 3 : 2}
              </div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:B.t1 }}>
                🏁 {PASOS_TITULO[paso]}
              </div>
            </div>
          </div>

          {/* Info del caso */}
          <div style={{ background:B.card, border:`1px solid ${B.border}`, padding:"10px 14px",
            marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:18 }}>{({INSTALACION:"📦",SERVICIO_TECNICO:"🔧",RETIRO:"🔄",VISITA_PROACTIVA:"👁"})[caso.tipo_proceso]||"◈"}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:B.t1 }}>{caso.razon_social}</div>
              <div style={{ fontSize:10, color:B.t3 }}>{caso.numero||caso.id_externo} · {caso.departamento}</div>
            </div>
          </div>

          {/* PASO 1 — ¿Resolviste? */}
          {paso===1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                ["✓ SÍ, lo resolví", true, B.green],
                ["✗ NO pude resolverlo", false, B.red]
              ].map(([label, val, color]) => (
                <button key={String(val)} onClick={()=>setResolvio(val)}
                  style={{ padding:"24px 20px", border:`2px solid ${resolvio===val?color:B.border}`,
                    background:resolvio===val?color+"22":B.card,
                    color:resolvio===val?color:B.t2, cursor:"pointer",
                    fontSize:16, fontWeight:700, textAlign:"left",
                    transition:"all .2s", display:"flex", alignItems:"center", gap:14 }}>
                  <span style={{ fontSize:28 }}>{val?"✅":"❌"}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* PASO 2 — Modelo y serie */}
          {paso===2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <FL label="Modelo del equipo" req/>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {MODELOS_TERMINAL.map(m=>(
                    <button key={m} onClick={()=>setModelo(m)}
                      style={{ padding:"10px 16px",
                        border:`1px solid ${modelo===m?B.orange:B.border}`,
                        background:modelo===m?B.orangeDim:B.deep,
                        color:modelo===m?B.orange:B.t2, cursor:"pointer",
                        fontSize:13, fontWeight:modelo===m?700:400, transition:"all .15s" }}>
                      {modelo===m?"◉ ":"○ "}{m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FL label="Serie del equipo del cliente" req/>
                <div style={{ display:"flex", gap:8 }}>
                  <input className="field" style={{ flex:1, fontSize:15, letterSpacing:".06em" }}
                    placeholder="Ingresá o escaneá la serie..."
                    value={serie} onChange={e=>setSerie(e.target.value)}/>
                  <Bb label="📷 ESCANEAR" onClick={()=>setShowScan(true)} ghost small color={B.blue}/>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3 — Cierre ST (solo si resolvio + servicio técnico) */}
          {paso===3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <FL label="Descripción del problema" req/>
                <textarea className="field" rows={3} style={{ resize:"vertical" }}
                  placeholder="Describí el problema que tenía el equipo..."
                  value={formCierre.descripcion_problema}
                  onChange={e=>setFormCierre(f=>({...f,descripcion_problema:e.target.value}))}/>
              </div>
              <div>
                <FL label="Cómo lo resolviste" req/>
                <textarea className="field" rows={3} style={{ resize:"vertical" }}
                  placeholder="Describí la solución que aplicaste..."
                  value={formCierre.como_resolvio}
                  onChange={e=>setFormCierre(f=>({...f,como_resolvio:e.target.value}))}/>
              </div>
              <div>
                <FL label="¿Requirió soporte N2?" req/>
                <div style={{ display:"flex", gap:10 }}>
                  {[["SÍ", true, B.red],["NO", false, B.green]].map(([l,v,c])=>(
                    <button key={l} onClick={()=>setFormCierre(f=>({...f,requirio_n2:v}))}
                      style={{ flex:1, padding:"12px 0",
                        border:`1px solid ${formCierre.requirio_n2===v?c:B.border}`,
                        background:formCierre.requirio_n2===v?c+"22":B.deep,
                        color:formCierre.requirio_n2===v?c:B.t2,
                        cursor:"pointer", fontSize:14, fontWeight:700, transition:"all .15s" }}>
                      {formCierre.requirio_n2===v?"◉ ":"○ "}{l}
                    </button>
                  ))}
                </div>
                {formCierre.requirio_n2===true && (
                  <div style={{ marginTop:8, padding:"8px 12px", background:B.redDim,
                    border:`1px solid ${B.red}33`, fontSize:11, color:B.red }}>
                    ⚠ Caso registrado con soporte N2 para análisis posterior
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botón continuar/finalizar */}
          <button onClick={continuar} disabled={!puedeAvanzar||saving}
            style={{ width:"100%", marginTop:28, padding:"16px 0",
              background:puedeAvanzar&&!saving?B.green:B.t3,
              border:"none", cursor:puedeAvanzar&&!saving?"pointer":"not-allowed",
              fontFamily:"'Orbitron',sans-serif", fontWeight:900, fontSize:14,
              color:"#050507", letterSpacing:".1em", transition:"all .2s" }}>
            {saving ? "GUARDANDO..." :
              paso===1 ? "CONTINUAR →" :
              paso===2 && resolvio && esServicioTecnico ? "CONTINUAR →" :
              "✓ FINALIZAR CASO"}
          </button>
        </div>
      </div>
    </>
  );
};

const EscanerBarras = ({ onScan, onClose }) => {
  const [error, setError]   = useState("");
  const [cargando, setCarg] = useState(true);
  const [manual, setManual] = useState("");
  const divRef  = useRef(null);
  const scanRef = useRef(null);

  useEffect(()=>{
    let mounted = true;
    const cargarZxing = async () => {
      try {
        // Cargar ZXing desde CDN si no está cargado
        if(!window.ZXing) {
          await new Promise((res,rej)=>{
            const s = document.createElement("script");
            s.src = "https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js";
            s.onload = res;
            s.onerror = ()=>rej(new Error("No se pudo cargar el escáner"));
            document.head.appendChild(s);
          });
        }
        if(!mounted) return;
        // Pedir permiso de cámara
        await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
        if(!mounted || !divRef.current) return;

        const codeReader = new window.ZXing.BrowserMultiFormatReader();
        scanRef.current = codeReader;
        setCarg(false);

        const devices = await window.ZXing.BrowserCodeReader.listVideoInputDevices();
        // Preferir cámara trasera
        const cam = devices.find(d=>d.label.toLowerCase().includes("back")||d.label.toLowerCase().includes("rear")||d.label.toLowerCase().includes("environment"))
          || devices[devices.length-1];

        await codeReader.decodeFromVideoDevice(cam?.deviceId||undefined, divRef.current, (result, err) => {
          if(result && mounted) {
            onScan(result.getText());
          }
        });
      } catch(e) {
        if(mounted) {
          setError(e.message || "No se pudo acceder a la cámara");
          setCarg(false);
        }
      }
    };
    cargarZxing();
    return ()=>{
      mounted = false;
      scanRef.current?.reset?.();
      scanRef.current?.stopContinuousDecode?.();
    };
  },[]);

  const confirmarManual = () => {
    if(manual.trim()) onScan(manual.trim());
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:400,
      background:"#050507",
      display:"flex", flexDirection:"column",
    }}>
      {/* Header */}
      <div style={{padding:"16px 20px",borderBottom:"1px solid #1a1a1a",flexShrink:0,
        display:"flex",alignItems:"center",gap:14}}>
        <button onClick={()=>{ scanRef.current?.reset?.(); onClose(); }}
          style={{background:"none",border:"1px solid #333",color:"#888",
            cursor:"pointer",padding:"10px 18px",fontSize:14,borderRadius:2}}>
          ← VOLVER
        </button>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:B.blue,fontFamily:"'Orbitron',sans-serif"}}>
            📷 ESCANEAR SERIE
          </div>
          <div style={{fontSize:11,color:"#666",marginTop:2}}>Apuntá al código de barras del equipo</div>
        </div>
      </div>

      {error ? (
        /* Error — modo manual */
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:24,gap:20}}>
          <div style={{fontSize:48}}>📷</div>
          <div style={{fontSize:15,color:"#FF6B00",textAlign:"center",lineHeight:1.6}}>
            {error}
          </div>
          <div style={{fontSize:13,color:"#666",textAlign:"center"}}>
            Escribí la serie manualmente:
          </div>
          <input className="field"
            placeholder="Ej: A1B2C3D4E5"
            value={manual} onChange={e=>setManual(e.target.value)}
            style={{fontSize:20,padding:"16px",textAlign:"center",
              letterSpacing:".1em",width:"100%",maxWidth:340}}
            autoFocus/>
          <button onClick={confirmarManual} disabled={!manual.trim()}
            style={{width:"100%",maxWidth:340,padding:"18px 0",
              background:manual.trim()?B.green:"#333",border:"none",
              cursor:manual.trim()?"pointer":"not-allowed",
              fontFamily:"'Orbitron',sans-serif",fontWeight:900,
              fontSize:16,color:"#050507",borderRadius:2}}>
            ✓ CONFIRMAR SERIE
          </button>
        </div>
      ) : (
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          {/* Visor de cámara */}
          <div style={{flex:1,position:"relative",background:"#000",overflow:"hidden"}}>
            {cargando&&(
              <div style={{position:"absolute",inset:0,display:"flex",
                alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,zIndex:1}}>
                <Spin s={40}/>
                <div style={{fontSize:13,color:"#666"}}>Iniciando cámara...</div>
              </div>
            )}
            <video ref={divRef} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            {/* Guía de escaneo */}
            {!cargando&&(
              <div style={{position:"absolute",inset:0,display:"flex",
                alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                <div style={{
                  width:"80%",maxWidth:300,height:100,
                  border:`3px solid ${B.orange}`,
                  boxShadow:`0 0 0 2000px rgba(0,0,0,0.5)`,
                  position:"relative",
                }}>
                  {/* Línea animada */}
                  <div style={{
                    position:"absolute",left:0,right:0,height:3,
                    background:B.orange,opacity:0.8,
                    animation:"scanLine 2s ease-in-out infinite",
                  }}/>
                  {/* Esquinas */}
                  {[[0,0,"top","left"],[0,"auto","top","right"],["auto",0,"bottom","left"],["auto","auto","bottom","right"]].map(([t,b,vp,hp],i)=>(
                    <div key={i} style={{position:"absolute",
                      top:t,bottom:b===0?0:b,
                      left:hp==="left"?-3:undefined,right:hp==="right"?-3:undefined,
                      width:20,height:20,
                      borderTop:vp==="top"?`4px solid ${B.orange}`:"none",
                      borderBottom:vp==="bottom"?`4px solid ${B.orange}`:"none",
                      borderLeft:hp==="left"?`4px solid ${B.orange}`:"none",
                      borderRight:hp==="right"?`4px solid ${B.orange}`:"none",
                    }}/>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Input manual abajo */}
          <div style={{padding:16,background:"#0A0A0F",borderTop:"1px solid #1a1a1a"}}>
            <div style={{fontSize:11,color:"#555",textAlign:"center",marginBottom:10}}>
              O escribí la serie manualmente
            </div>
            <div style={{display:"flex",gap:10}}>
              <input className="field" style={{flex:1,fontSize:15,textAlign:"center",letterSpacing:".06em"}}
                placeholder="Serie del equipo..."
                value={manual} onChange={e=>setManual(e.target.value)}/>
              <button onClick={confirmarManual} disabled={!manual.trim()}
                style={{padding:"0 20px",background:manual.trim()?B.green:"#333",
                  border:"none",cursor:manual.trim()?"pointer":"not-allowed",
                  fontWeight:900,color:"#050507",fontSize:14,borderRadius:2,flexShrink:0}}>
                ✓
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: calc(100% - 3px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};

const ModalCierre = ({ caso, user, onClose, onGuardar }) => {
  const [form, setForm] = useState({
    descripcion_problema: caso.cierre_descripcion_problema || "",
    como_resolvio:        caso.cierre_como_resolvio || "",
    modelo_terminal:      caso.cierre_modelo_terminal || "",
    serie_terminal:       caso.cierre_serie_terminal || "",
    requirio_n2:          caso.cierre_requirio_n2 ?? null,
  });
  const [saving,    setSaving]    = useState(false);
  const [showScan,  setShowScan]  = useState(false);
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const completo = form.descripcion_problema.trim() &&
                   form.como_resolvio.trim() &&
                   form.modelo_terminal &&
                   form.serie_terminal.trim() &&
                   form.requirio_n2 !== null;

  const guardar = async () => {
    setSaving(true);
    await onGuardar(form);
    setSaving(false);
  };

  return (
    <>
      {showScan && (
        <EscanerBarras
          onScan={v => { s("serie_terminal", v); setShowScan(false); }}
          onClose={() => setShowScan(false)}
        />
      )}
      <Modal title="🔧 FORMULARIO DE CIERRE — SERVICIO TÉCNICO" onClose={onClose} width={600}>
        <div style={{ marginBottom: 14, padding: "10px 14px", background: B.orangeDim,
          border: `1px solid ${B.orange}22`, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 20 }}>🔧</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.orange }}>{caso.numero} · {caso.razon_social}</div>
            <div style={{ fontSize: 10, color: B.t2 }}>Todos los campos son obligatorios para resolver el caso</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Descripción del problema */}
          <div>
            <FL label="Descripción del problema" req/>
            <textarea className="field" rows={3} style={{ resize: "vertical" }}
              placeholder="Describí el problema que presentaba el equipo..."
              value={form.descripcion_problema} onChange={e => s("descripcion_problema", e.target.value)}/>
          </div>

          {/* Cómo lo resolvió */}
          <div>
            <FL label="Cómo lo resolvió" req/>
            <textarea className="field" rows={3} style={{ resize: "vertical" }}
              placeholder="Describí la solución aplicada..."
              value={form.como_resolvio} onChange={e => s("como_resolvio", e.target.value)}/>
          </div>

          {/* Modelo de terminal */}
          <div>
            <FL label="Modelo de terminal" req/>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MODELOS_TERMINAL.map(m => (
                <button key={m} onClick={() => s("modelo_terminal", m)}
                  style={{ padding: "8px 14px", border: `1px solid ${form.modelo_terminal === m ? B.orange : B.border}`,
                    background: form.modelo_terminal === m ? B.orangeDim : B.deep,
                    color: form.modelo_terminal === m ? B.orange : B.t2,
                    cursor: "pointer", fontSize: 12, fontWeight: form.modelo_terminal === m ? 700 : 400,
                    transition: "all .15s" }}>
                  {form.modelo_terminal === m ? "◉ " : "○ "}{m}
                </button>
              ))}
            </div>
          </div>

          {/* Serie del equipo */}
          <div>
            <FL label="Serie del equipo del cliente" req/>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="field" style={{ flex: 1 }}
                placeholder="Ingresá o escaneá la serie del equipo..."
                value={form.serie_terminal} onChange={e => s("serie_terminal", e.target.value)}/>
              <Bb label="📷 ESCANEAR" onClick={() => setShowScan(true)} ghost small color={B.blue}/>
            </div>
          </div>

          {/* Soporte N2 */}
          <div>
            <FL label="¿Requirió soporte N2?" req/>
            <div style={{ display: "flex", gap: 10 }}>
              {[["Sí", true], ["No", false]].map(([label, val]) => (
                <button key={label} onClick={() => s("requirio_n2", val)}
                  style={{ flex: 1, padding: "10px 0", border: `1px solid ${form.requirio_n2 === val ? (val ? B.red : B.green) : B.border}`,
                    background: form.requirio_n2 === val ? (val ? B.redDim : B.greenDim) : B.deep,
                    color: form.requirio_n2 === val ? (val ? B.red : B.green) : B.t2,
                    cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .15s" }}>
                  {form.requirio_n2 === val ? "◉ " : "○ "}{label}
                </button>
              ))}
            </div>
            {form.requirio_n2 === true && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: B.redDim,
                border: `1px solid ${B.red}33`, fontSize: 11, color: B.red }}>
                ⚠ Este caso quedará registrado con soporte N2 para análisis posterior
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10,
          paddingTop: 16, marginTop: 16, borderTop: `1px solid ${B.border}` }}>
          <Bb label="CANCELAR" onClick={onClose} ghost small color={B.t2}/>
          <Bb label={saving ? "GUARDANDO..." : "GUARDAR Y CONTINUAR →"}
            onClick={guardar} disabled={!completo || saving} color={B.green}/>
        </div>
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODAL ENCUESTA CONFIGURABLE — nueva versión
// ═══════════════════════════════════════════════════════════════
const ModalEncuestaConfig = ({ encuesta, caso, user, onClose, onSave }) => {
  const preguntas = encuesta.preguntas || [];
  const [resp, setResp] = useState({});
  const [saving, setSaving] = useState(false);

  const completo = preguntas.filter(p => p.obligatoria).every(p => resp[p.id]?.trim());

  const guardar = async () => {
    setSaving(true);
    await onSave(encuesta.id, resp);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={`📋 ${encuesta.nombre}`} onClose={onClose} width={560}>
      {encuesta.descripcion && (
        <div style={{ marginBottom: 14, fontSize: 11, color: B.t2, padding: "8px 12px",
          background: B.deep, border: `1px solid ${B.border}` }}>
          {encuesta.descripcion}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        {preguntas.map((p, i) => (
          <div key={p.id}>
            <div style={{ fontSize: 12, fontWeight: 700, color: B.t1, marginBottom: 8 }}>
              {i + 1}. {p.pregunta}
              {p.obligatoria && <span style={{ color: B.orange, marginLeft: 4 }}>*</span>}
            </div>
            {p.tipo === "texto_libre" ? (
              <textarea className="field" rows={3} style={{ resize: "vertical" }}
                placeholder="Escribí tu respuesta..."
                value={resp[p.id] || ""}
                onChange={e => setResp(r => ({ ...r, [p.id]: e.target.value }))}/>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {p.opciones?.map(opt => (
                  <button key={opt} onClick={() => setResp(r => ({ ...r, [p.id]: opt }))}
                    style={{ padding: "8px 10px", textAlign: "left", cursor: "pointer",
                      border: `1px solid ${resp[p.id] === opt ? B.orange : B.border}`,
                      background: resp[p.id] === opt ? B.orangeDim : "transparent",
                      color: resp[p.id] === opt ? B.orange : B.t2,
                      fontSize: 11, fontWeight: resp[p.id] === opt ? 700 : 400, transition: "all .15s" }}>
                    {resp[p.id] === opt ? "◉ " : "○ "}{opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10,
        paddingTop: 14, borderTop: `1px solid ${B.border}` }}>
        <Bb label="CANCELAR" onClick={onClose} ghost small color={B.t2}/>
        <Bb label={saving ? "GUARDANDO..." : "GUARDAR ENCUESTA"}
          onClick={guardar} disabled={!completo || saving}/>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE ENCUESTAS — en Configuración
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// GESTOR DE MISIONES — Configurable por Director
// ═══════════════════════════════════════════════════════════
const METRICAS_MISION = [
  {id:"instalaciones",     label:"Instalaciones completadas"},
  {id:"servicios_tecnicos",label:"Servicios técnicos resueltos"},
  {id:"visitas_proactivas",label:"Visitas técnicas proactivas"},
  {id:"retiros",           label:"Retiros completados"},
  {id:"casos_totales",     label:"Casos totales finalizados"},
  {id:"sla_cumplido",      label:"SLA cumplido (%)"},
];

const PERIODOS = [
  {id:"dia",   label:"DÍA",    icono:"📅"},
  {id:"semana",label:"SEMANA", icono:"📆"},
  {id:"mes",   label:"MES",    icono:"🗓"},
];

// ═══════════════════════════════════════════════════════════
// GESTOR DE MOTIVOS — Configurable por Director
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// OVERLAY EDITAR CASO
// ═══════════════════════════════════════════════════════════
const OverlayEditarCaso = ({ caso, user, perfil, onVolver, onGuardar }) => {
  const [f, setF] = useState({
    direccion:    caso.direccion||"",
    localidad:    caso.localidad||"",
    departamento: caso.departamento||"",
    telefono:     caso.telefono||"",
    franja_horaria: caso.franja_horaria||caso.rango_horario||"",
    observaciones: caso.observaciones||"",
    descripcion:  caso.descripcion||"",
    empresa_id:   caso.empresa_id||"",
    tecnico_id:   caso.tecnico_id||"",
    prioridad:    caso.prioridad||"MEDIA",
  });
  const [tecnicos,  setTecnicos]  = useState([]);
  const [saving,    setSaving]    = useState(false);
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  const esDirector = perfil?.rol==="DIRECTOR";
  const esST = ["SERVICIO_TECNICO","SOPORTE"].includes((caso.tipo_proceso||"").toUpperCase());

  useEffect(()=>{
    supabase.from("usuarios").select("*").eq("rol","TECNICO").eq("activo",true)
      .then(({data})=>setTecnicos(data||[]));
  },[]);

  const tecnicosFiltrados = tecnicos.filter(t=>
    !f.empresa_id || t.empresa_codigo===f.empresa_id
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"#050507",
      display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{height:5,background:B.blue,flexShrink:0}}/>
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${B.border}`,
        display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={onVolver}
          style={{background:"none",border:`1px solid ${B.border}`,color:"#888",
            cursor:"pointer",padding:"10px 18px",fontSize:14,borderRadius:2}}>
          ← VOLVER
        </button>
        <div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:900,color:B.blue}}>
            ✎ EDITAR CASO
          </div>
          <div style={{fontSize:11,color:"#666",marginTop:2}}>{caso.razon_social} · {caso.numero}</div>
        </div>
      </div>
      <div style={{flex:1,padding:20,overflowY:"auto"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:560}}>
          {/* Empresa — solo Director */}
          {esDirector&&(
            <div>
              <FL label="Empresa"/>
              <select className="field" value={f.empresa_id}
                onChange={e=>{s("empresa_id",e.target.value);s("tecnico_id","");}}>
                <option value="">Sin empresa</option>
                {EMPRESAS.map(e=><option key={e.codigo} value={e.codigo}>{e.nombre}</option>)}
              </select>
            </div>
          )}
          {/* Técnico asignado */}
          <div>
            <FL label="Técnico asignado"/>
            <select className="field" value={f.tecnico_id}
              onChange={e=>s("tecnico_id",e.target.value)}>
              <option value="">Sin asignar</option>
              {tecnicosFiltrados.map(t=>(
                <option key={t.id} value={t.auth_id||t.id}>
                  {t.nombre} {t.apellido} ({t.empresa_codigo})
                </option>
              ))}
            </select>
          </div>
          {/* Prioridad */}
          <div>
            <FL label="Prioridad"/>
            <div style={{display:"flex",gap:8}}>
              {PRIORS.map(p=>(
                <button key={p} onClick={()=>s("prioridad",p)}
                  style={{flex:1,padding:"10px 8px",
                    border:`2px solid ${f.prioridad===p?PC[p]:B.border}`,
                    background:f.prioridad===p?PC[p]+"22":B.deep,
                    color:f.prioridad===p?PC[p]:B.t2,
                    cursor:"pointer",fontSize:12,fontWeight:700,borderRadius:2}}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {/* Dirección */}
          <div><FL label="Dirección"/>
            <input className="field" value={f.direccion}
              onChange={e=>s("direccion",e.target.value)} placeholder="Ej: Av. Brasil 1234"/>
          </div>
          {/* Localidad y Departamento */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><FL label="Localidad"/>
              <input className="field" value={f.localidad}
                onChange={e=>s("localidad",e.target.value)}/></div>
            <div><FL label="Departamento"/>
              <select className="field" value={f.departamento} onChange={e=>s("departamento",e.target.value)}>
                <option value="">Seleccioná...</option>
                {["Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores","Florida",
                  "Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro","Rivera","Rocha",
                  "Salto","San José","Soriano","Tacuarembó","Treinta y Tres"].map(d=>(
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Teléfono */}
          <div><FL label="Teléfono"/>
            <input className="field" value={f.telefono}
              onChange={e=>s("telefono",e.target.value)} placeholder="Ej: 099 123 456"/>
          </div>
          {/* Franja horaria */}
          <div><FL label="Franja Horaria"/>
            <select className="field" value={f.franja_horaria} onChange={e=>s("franja_horaria",e.target.value)}>
              <option value="">Sin franja</option>
              {["FH1 (8-12)","FH2 (12-16)","FH3 (16-19)","FH4 (19-22)"].map(fh=>(
                <option key={fh} value={fh}>{fh}</option>
              ))}
            </select>
          </div>
          {/* Descripción / Observaciones */}
          {esST ? (
            <div><FL label="Descripción del problema"/>
              <textarea className="field" rows={3} value={f.descripcion}
                onChange={e=>s("descripcion",e.target.value)} style={{resize:"vertical",fontSize:15}}/>
            </div>
          ) : (
            <div><FL label="Observaciones"/>
              <textarea className="field" rows={3} value={f.observaciones}
                onChange={e=>s("observaciones",e.target.value)} style={{resize:"vertical",fontSize:15}}/>
            </div>
          )}
        </div>
      </div>
      {/* Botón guardar */}
      <div style={{padding:16,background:"#0A0A0F",borderTop:`1px solid #1a1a1a`,flexShrink:0}}>
        <button onClick={async()=>{
          setSaving(true);
          await onGuardar({
            direccion:f.direccion, localidad:f.localidad, departamento:f.departamento,
            telefono:f.telefono, franja_horaria:f.franja_horaria, rango_horario:f.franja_horaria,
            observaciones:f.observaciones, descripcion:f.descripcion,
            empresa_id:f.empresa_id, tecnico_id:f.tecnico_id||null,
            prioridad:f.prioridad,
            estado: f.tecnico_id ? (caso.estado==="PENDIENTE"?"ASIGNADO":caso.estado) : "PENDIENTE",
          });
          setSaving(false);
        }} disabled={saving}
          style={{width:"100%",padding:"20px 0",background:saving?"#333":B.blue,
            border:"none",cursor:saving?"not-allowed":"pointer",
            fontFamily:"'Orbitron',sans-serif",fontWeight:900,
            fontSize:16,color:"#050507",borderRadius:2}}>
          {saving?"GUARDANDO...":"✓ GUARDAR CAMBIOS"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// GESTOR DE FERIADOS — Configurable por Director
// ═══════════════════════════════════════════════════════════
const GestorFeriados = ({ toast }) => {
  const [feriados, setFeriados] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [nueva,    setNueva]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(()=>{ cargar(); },[]);

  const cargar = async () => {
    setLoading(true);
    const {data} = await supabase.from("feriados")
      .select("*").order("fecha");
    setFeriados(data||[]);
    // Invalidar cache
    FERIADOS_CACHE = null;
    setLoading(false);
  };

  const agregar = async () => {
    if(!nueva) return;
    setSaving(true);
    const {error} = await supabase.from("feriados").insert({
      fecha: nueva,
      descripcion: desc.trim()||"Feriado",
      activo: true,
    });
    if(error) toast("Error: "+error.message);
    else { toast("✓ Feriado agregado"); setNueva(""); setDesc(""); await cargar(); }
    setSaving(false);
  };

  const toggleActivo = async (f) => {
    await supabase.from("feriados").update({activo:!f.activo}).eq("id",f.id);
    await cargar();
  };

  const eliminar = async (id) => {
    if(!window.confirm("¿Eliminar este feriado?")) return;
    await supabase.from("feriados").delete().eq("id",id);
    await cargar();
    toast("Feriado eliminado");
  };

  const FIJOS = new Set(["01-01","05-01","07-18","08-25","12-25"]);
  const esFijo = (fecha) => FIJOS.has(fecha?.slice(5));

  return (
    <div>
      <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:14}}>
        ◈ FERIADOS CONFIGURADOS
      </div>
      <div style={{fontSize:12,color:B.t2,marginBottom:16,lineHeight:1.6}}>
        Los días feriados no se cuentan como días hábiles en el cálculo del SLA.
        Los feriados nacionales fijos (marcados con 🔒) no se pueden eliminar.
      </div>

      {/* Agregar nuevo */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:12}}>
          + AGREGAR FERIADO
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr auto",gap:10,alignItems:"end"}}>
          <div>
            <FL label="Fecha" req/>
            <input type="date" className="field" value={nueva}
              onChange={e=>setNueva(e.target.value)}
              style={{fontSize:14}}/>
          </div>
          <div>
            <FL label="Descripción"/>
            <input className="field" value={desc}
              onChange={e=>setDesc(e.target.value)}
              placeholder="Ej: Feriado departamental Rivera"
              style={{fontSize:14}}/>
          </div>
          <Bb label={saving?"...":"AGREGAR"} onClick={agregar}
            disabled={!nueva||saving} color={B.orange}/>
        </div>
      </div>

      {/* Lista */}
      {loading ? <Spin/> : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {feriados.map(f=>(
            <div key={f.id} style={{
              display:"flex",alignItems:"center",gap:12,
              padding:"12px 16px",
              background:f.activo?B.card:"#0a0a0a",
              border:`1px solid ${f.activo?B.border:"#1a1a1a"}`,
              opacity:f.activo?1:0.5,
            }}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,
                    color:B.orange,fontWeight:700}}>
                    {new Date(f.fecha+"T12:00:00").toLocaleDateString("es-UY",
                      {weekday:"short",day:"2-digit",month:"long",year:"numeric"})}
                  </span>
                  {esFijo(f.fecha)&&<span style={{fontSize:10,color:B.t3}}>🔒 Nacional</span>}
                </div>
                <div style={{fontSize:11,color:B.t3,marginTop:2}}>{f.descripcion}</div>
              </div>
              <button onClick={()=>toggleActivo(f)}
                style={{background:"none",border:`1px solid ${B.border}`,
                  color:f.activo?B.green:B.t3,cursor:"pointer",
                  padding:"4px 10px",fontSize:10,borderRadius:2}}>
                {f.activo?"ACTIVO":"INACTIVO"}
              </button>
              {!esFijo(f.fecha)&&(
                <button onClick={()=>eliminar(f.id)}
                  style={{background:"none",border:"none",color:B.red,
                    cursor:"pointer",fontSize:18,padding:"0 4px"}}>
                  ×
                </button>
              )}
            </div>
          ))}
          {feriados.length===0&&(
            <div style={{textAlign:"center",padding:30,color:B.t3,fontSize:12}}>
              Sin feriados configurados
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GestorMotivos = ({ toast }) => {
  const TIPOS = [
    {id:"PAUSA",          label:"⏸ Motivos de Pausa",          color:B.purple},
    {id:"CANCELACION",    label:"✗ Motivos de Cancelación",     color:B.red},
    {id:"RECOORDINACION", label:"📅 Motivos de Recoordinación", color:B.teal},
  ];
  const [tab,      setTab]      = useState("PAUSA");
  const [motivos,  setMotivos]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [nuevo,    setNuevo]    = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(()=>{ cargar(); },[tab]);

  const cargar=async()=>{
    setLoading(true);
    const{data}=await supabase.from("motivos_config")
      .select("*").eq("tipo",tab).order("orden");
    setMotivos(data||[]); setLoading(false);
  };

  const agregar=async()=>{
    if(!nuevo.trim()) return;
    setSaving(true);
    const orden=(motivos.length>0?Math.max(...motivos.map(m=>m.orden)):0)+1;
    await supabase.from("motivos_config").insert({
      tipo:tab, texto:nuevo.trim(), activo:true, orden
    });
    setNuevo(""); await cargar(); toast("✓ Motivo agregado");
    setSaving(false);
  };

  const toggleActivo=async(m)=>{
    await supabase.from("motivos_config").update({activo:!m.activo}).eq("id",m.id);
    await cargar();
  };

  const eliminar=async(id)=>{
    await supabase.from("motivos_config").delete().eq("id",id);
    await cargar(); toast("Motivo eliminado");
  };

  const tabActual = TIPOS.find(t=>t.id===tab);

  return(
    <div>
      {/* Tabs por tipo */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {TIPOS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"12px 16px",textAlign:"left",
              border:`2px solid ${tab===t.id?t.color:B.border}`,
              background:tab===t.id?t.color+"22":B.deep,
              color:tab===t.id?t.color:B.t2,
              cursor:"pointer",fontSize:14,fontWeight:700,borderRadius:2,
              transition:"all .15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista de motivos del tipo seleccionado */}
      <div style={{background:B.card,border:`1px solid ${tabActual?.color}44`,padding:16,borderRadius:2}}>
        <div style={{fontSize:10,color:tabActual?.color,fontWeight:700,
          letterSpacing:".12em",marginBottom:14}}>
          ◈ {tabActual?.label.toUpperCase()}
        </div>

        {loading ? <Spin/> : (
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {motivos.length===0&&(
              <div style={{textAlign:"center",padding:20,color:B.t3,fontSize:12}}>
                Sin motivos configurados. Agregá el primero.
              </div>
            )}
            {motivos.map((m,i)=>(
              <div key={m.id} style={{
                display:"flex",alignItems:"center",gap:10,
                padding:"10px 14px",
                background:m.activo?B.deep:"#0a0a0a",
                border:`1px solid ${m.activo?B.border:"#1a1a1a"}`,
                borderRadius:2,opacity:m.activo?1:0.5,
              }}>
                <span style={{fontSize:12,color:B.t3,minWidth:20,fontFamily:"'Orbitron',sans-serif"}}>
                  {i+1}
                </span>
                <span style={{flex:1,fontSize:14,color:m.activo?B.t1:B.t3}}>
                  {m.texto}
                </span>
                <button onClick={()=>toggleActivo(m)}
                  style={{background:"none",border:`1px solid ${B.border}`,
                    color:m.activo?B.green:B.t3,cursor:"pointer",
                    padding:"4px 10px",fontSize:11,borderRadius:2,flexShrink:0}}>
                  {m.activo?"✓ ACTIVO":"INACTIVO"}
                </button>
                <button onClick={()=>eliminar(m.id)}
                  style={{background:"none",border:"none",color:B.red,
                    cursor:"pointer",fontSize:18,padding:"0 4px",flexShrink:0}}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Agregar nuevo motivo */}
        <div style={{display:"flex",gap:8}}>
          <input className="field" style={{flex:1,fontSize:14}}
            placeholder={`Nuevo motivo de ${tabActual?.label.toLowerCase().replace("motivos de ","")}...`}
            value={nuevo} onChange={e=>setNuevo(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&agregar()}/>
          <Bb label={saving?"...":"+ AGREGAR"} onClick={agregar}
            disabled={!nuevo.trim()||saving} small
            color={tabActual?.color||B.orange}/>
        </div>
      </div>
    </div>
  );
};

const GestorMisiones = ({ toast }) => {
  const [misiones,  setMisiones]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editando,  setEditando]  = useState(null); // null | "nueva" | mision
  const [empresas,  setEmpresas]  = useState([]);
  const [form, setForm] = useState({
    nombre:"", descripcion:"", periodo:"dia",
    metrica:"instalaciones", objetivo:10, xp:100,
    aplica_a:"todos", empresa_id:null, activa:true,
  });

  useEffect(()=>{
    cargar();
    supabase.from("empresas_config").select("*")
      .then(({data})=>setEmpresas(data||[]));
  },[]);

  const cargar=async()=>{
    const{data}=await supabase.from("misiones_config")
      .select("*").order("created_at",{ascending:false});
    setMisiones(data||[]); setLoading(false);
  };

  const guardar=async()=>{
    if(editando==="nueva"){
      await supabase.from("misiones_config").insert({...form,created_at:new Date().toISOString()});
    } else {
      await supabase.from("misiones_config").update({...form,updated_at:new Date().toISOString()}).eq("id",editando.id);
    }
    await cargar(); setEditando(null);
    toast("✓ Misión guardada");
  };

  const toggleActiva=async(m)=>{
    await supabase.from("misiones_config").update({activa:!m.activa}).eq("id",m.id);
    await cargar();
  };

  const eliminar=async(id)=>{
    if(!window.confirm("¿Eliminar esta misión?")) return;
    await supabase.from("misiones_config").delete().eq("id",id);
    await cargar(); toast("Misión eliminada");
  };

  const abrirNueva=()=>{
    setForm({nombre:"",descripcion:"",periodo:"dia",metrica:"instalaciones",objetivo:10,xp:100,aplica_a:"todos",empresa_id:null,activa:true});
    setEditando("nueva");
  };

  const abrirEditar=(m)=>{
    setForm({nombre:m.nombre,descripcion:m.descripcion||"",periodo:m.periodo,
      metrica:m.metrica,objetivo:m.objetivo,xp:m.xp,
      aplica_a:m.aplica_a||"todos",empresa_id:m.empresa_id,activa:m.activa});
    setEditando(m);
  };

  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const completo = form.nombre.trim() && form.objetivo>0 && form.xp>0;

  // ── FORMULARIO ──────────────────────────────────────────
  if(editando) return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={()=>setEditando(null)}
          style={{background:"none",border:`1px solid ${B.border}`,color:B.t2,
            cursor:"pointer",padding:"6px 12px",fontSize:11,fontFamily:"'Orbitron',sans-serif"}}>
          ← VOLVER
        </button>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:B.t1}}>
          {editando==="nueva"?"NUEVA MISIÓN":`EDITANDO: ${editando.nombre}`}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:600}}>
        {/* Nombre */}
        <div>
          <FL label="Nombre de la misión" req/>
          <input className="field" value={form.nombre}
            onChange={e=>s("nombre",e.target.value)}
            placeholder="Ej: Instalar 10 terminales esta semana"/>
        </div>

        {/* Descripción */}
        <div>
          <FL label="Descripción (opcional)"/>
          <input className="field" value={form.descripcion}
            onChange={e=>s("descripcion",e.target.value)}
            placeholder="Detalle adicional de la misión"/>
        </div>

        {/* Período */}
        <div>
          <FL label="Período" req/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {PERIODOS.map(p=>(
              <button key={p.id} onClick={()=>s("periodo",p.id)}
                style={{padding:"14px 10px",textAlign:"center",
                  border:`2px solid ${form.periodo===p.id?B.orange:B.border}`,
                  background:form.periodo===p.id?B.orangeDim:B.deep,
                  color:form.periodo===p.id?B.orange:B.t2,
                  cursor:"pointer",borderRadius:2,transition:"all .15s"}}>
                <div style={{fontSize:24,marginBottom:4}}>{p.icono}</div>
                <div style={{fontSize:12,fontWeight:700}}>{p.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Métrica */}
        <div>
          <FL label="¿Qué se mide?" req/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {METRICAS_MISION.map(m=>(
              <button key={m.id} onClick={()=>s("metrica",m.id)}
                style={{padding:"12px 16px",textAlign:"left",
                  border:`2px solid ${form.metrica===m.id?B.orange:B.border}`,
                  background:form.metrica===m.id?B.orangeDim:B.deep,
                  color:form.metrica===m.id?B.orange:B.t2,
                  cursor:"pointer",borderRadius:2,fontSize:13,
                  display:"flex",alignItems:"center",gap:10,transition:"all .15s"}}>
                <span style={{fontSize:16}}>{form.metrica===m.id?"◉":"○"}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Objetivo y XP */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <FL label="Objetivo (número)" req/>
            <input className="field" type="number" min={1}
              value={form.objetivo} onChange={e=>s("objetivo",parseInt(e.target.value)||1)}
              style={{fontSize:20,textAlign:"center",fontFamily:"'Orbitron',sans-serif",fontWeight:700,color:B.orange}}/>
            <div style={{fontSize:10,color:B.t3,marginTop:4,textAlign:"center"}}>
              {form.metrica==="sla_cumplido"?"%":"cantidad"}
            </div>
          </div>
          <div>
            <FL label="XP al completar" req/>
            <input className="field" type="number" min={10}
              value={form.xp} onChange={e=>s("xp",parseInt(e.target.value)||10)}
              style={{fontSize:20,textAlign:"center",fontFamily:"'Orbitron',sans-serif",fontWeight:700,color:B.green}}/>
            <div style={{fontSize:10,color:B.t3,marginTop:4,textAlign:"center"}}>puntos XP</div>
          </div>
        </div>

        {/* Aplica a */}
        <div>
          <FL label="¿A quién aplica?" req/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["todos","🌐 Todos los técnicos"],["empresa","🏢 Por empresa"]].map(([v,l])=>(
              <button key={v} onClick={()=>s("aplica_a",v)}
                style={{padding:"14px 12px",
                  border:`2px solid ${form.aplica_a===v?B.blue:B.border}`,
                  background:form.aplica_a===v?B.blue+"22":B.deep,
                  color:form.aplica_a===v?B.blue:B.t2,
                  cursor:"pointer",borderRadius:2,fontSize:13,fontWeight:700,
                  transition:"all .15s"}}>
                {l}
              </button>
            ))}
          </div>
          {form.aplica_a==="empresa"&&(
            <div>
              <FL label="Empresa"/>
              <select className="field" value={form.empresa_id||""}
                onChange={e=>s("empresa_id",e.target.value||null)}>
                <option value="">Seleccioná una empresa...</option>
                {EMPRESAS.map(e=>(
                  <option key={e.codigo} value={e.codigo}>{e.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Activa */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
          background:B.card,border:`1px solid ${B.border}`}}>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:B.t1}}>Misión activa</div>
            <div style={{fontSize:11,color:B.t3}}>Los técnicos la verán en su Dashboard</div>
          </div>
          <button onClick={()=>s("activa",!form.activa)}
            style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",
              background:form.activa?B.green:B.t3,position:"relative",transition:"background .2s"}}>
            <div style={{position:"absolute",top:3,left:form.activa?26:3,
              width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
          </button>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <Bb label="CANCELAR" onClick={()=>setEditando(null)} ghost small color={B.t2}/>
          <Bb label="GUARDAR MISIÓN" onClick={guardar} disabled={!completo}/>
        </div>
      </div>
    </div>
  );

  // ── LISTA ────────────────────────────────────────────────
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em"}}>
          ◈ MISIONES CONFIGURADAS
        </div>
        <Bb label="+ NUEVA MISIÓN" onClick={abrirNueva} small/>
      </div>

      {loading?<div style={{textAlign:"center",padding:30}}><Spin/></div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {misiones.length===0&&(
            <div style={{textAlign:"center",padding:40,color:B.t3,fontSize:12}}>
              Sin misiones configuradas. Creá la primera.
            </div>
          )}
          {misiones.map(m=>{
            const periodo = PERIODOS.find(p=>p.id===m.periodo);
            const metrica = METRICAS_MISION.find(mt=>mt.id===m.metrica);
            return (
              <div key={m.id} style={{background:B.card,
                border:`1px solid ${m.activa?B.orange+"44":B.border}`,
                borderLeft:`3px solid ${m.activa?B.orange:B.t3}`,
                padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                  <span style={{fontSize:24,flexShrink:0}}>{periodo?.icono||"🎯"}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{fontSize:13,fontWeight:700,color:B.t1}}>{m.nombre}</div>
                      <Tg label={m.activa?"ACTIVA":"INACTIVA"} color={m.activa?B.green:B.t3}/>
                    </div>
                    {m.descripcion&&<div style={{fontSize:11,color:B.t3,marginBottom:6}}>{m.descripcion}</div>}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <Tg label={periodo?.label||m.periodo} color={B.blue}/>
                      <Tg label={metrica?.label||m.metrica} color={B.purple}/>
                      <Tg label={`Meta: ${m.objetivo}`} color={B.orange}/>
                      <Tg label={`+${m.xp} XP`} color={B.green}/>
                      <Tg label={m.aplica_a==="todos"?"🌐 Todos":m.empresa_id||"empresa"} color={B.t2}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>toggleActiva(m)}
                      style={{background:"none",border:`1px solid ${B.border}`,
                        color:B.t2,cursor:"pointer",padding:"4px 10px",fontSize:10}}>
                      {m.activa?"DESACTIVAR":"ACTIVAR"}
                    </button>
                    <Bb label="✎" onClick={()=>abrirEditar(m)} ghost small color={B.blue}/>
                    <Bb label="✗" onClick={()=>eliminar(m.id)} ghost small color={B.red}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const GestorEncuestas = ({ user, toast }) => {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // null | "nueva" | encuesta
  const [form, setForm] = useState({ nombre: "", descripcion: "", preguntas: [] });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data } = await supabase.from("encuestas_config").select("*").order("created_at");
    setEncuestas(data || []); setLoading(false);
  };

  const guardar = async () => {
    if (editando === "nueva") {
      await supabase.from("encuestas_config").insert({ ...form, created_at: new Date().toISOString() });
    } else {
      await supabase.from("encuestas_config").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editando.id);
    }
    await cargar();
    setEditando(null);
    toast("✓ Encuesta guardada");
  };

  const toggleActiva = async (enc) => {
    await supabase.from("encuestas_config").update({ activa: !enc.activa }).eq("id", enc.id);
    await cargar();
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminár esta encuesta?")) return;
    await supabase.from("encuestas_config").delete().eq("id", id);
    await cargar();
    toast("Encuesta eliminada");
  };

  const agregarPregunta = () => {
    setForm(f => ({ ...f, preguntas: [...f.preguntas, {
      id: `p${Date.now()}`, pregunta: "", tipo: "opcion_multiple",
      opciones: ["Excelente","Bueno","Regular","Malo"], obligatoria: true
    }]}));
  };

  const editarPregunta = (idx, campo, valor) => {
    setForm(f => {
      const ps = [...f.preguntas];
      ps[idx] = { ...ps[idx], [campo]: valor };
      return { ...f, preguntas: ps };
    });
  };

  const editarOpcion = (pidx, oidx, valor) => {
    setForm(f => {
      const ps = [...f.preguntas];
      const opts = [...(ps[pidx].opciones || [])];
      opts[oidx] = valor;
      ps[pidx] = { ...ps[pidx], opciones: opts };
      return { ...f, preguntas: ps };
    });
  };

  const quitarPregunta = (idx) => {
    setForm(f => ({ ...f, preguntas: f.preguntas.filter((_, i) => i !== idx) }));
  };

  const abrirNueva = () => {
    setForm({ nombre: "", descripcion: "", preguntas: [] });
    setEditando("nueva");
  };

  const abrirEditar = (enc) => {
    setForm({ nombre: enc.nombre, descripcion: enc.descripcion || "", preguntas: enc.preguntas || [] });
    setEditando(enc);
  };

  if (editando) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setEditando(null)}
          style={{ background: "none", border: `1px solid ${B.border}`, color: B.t2, cursor: "pointer", padding: "6px 12px", fontSize: 11 }}>
          ← VOLVER
        </button>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 900, color: B.t1 }}>
          {editando === "nueva" ? "NUEVA ENCUESTA" : `EDITANDO: ${editando.nombre}`}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 700 }}>
        <div><FL label="Nombre de la encuesta" req/>
          <input className="field" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Satisfacción General"/></div>
        <div><FL label="Descripción (opcional)"/>
          <input className="field" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción breve de la encuesta"/></div>

        <div style={{ fontSize: 10, color: B.orange, fontWeight: 700, letterSpacing: ".1em", marginTop: 8 }}>◈ PREGUNTAS</div>

        {form.preguntas.map((p, pidx) => (
          <div key={p.id} style={{ background: B.card, border: `1px solid ${B.border}`, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: B.orange, fontWeight: 700 }}>Pregunta {pidx + 1}</span>
              <button onClick={() => quitarPregunta(pidx)}
                style={{ background: "none", border: "none", color: B.red, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="field" value={p.pregunta}
                onChange={e => editarPregunta(pidx, "pregunta", e.target.value)}
                placeholder="Escribí la pregunta..."/>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <FL label="Tipo"/>
                  <select className="field" value={p.tipo}
                    onChange={e => editarPregunta(pidx, "tipo", e.target.value)}>
                    <option value="opcion_multiple">Opción múltiple</option>
                    <option value="texto_libre">Texto libre</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: B.t2 }}>
                    <input type="checkbox" checked={p.obligatoria}
                      onChange={e => editarPregunta(pidx, "obligatoria", e.target.checked)}
                      style={{ width: 14, height: 14, accentColor: B.orange }}/>
                    Obligatoria
                  </label>
                </div>
              </div>
              {p.tipo === "opcion_multiple" && (
                <div>
                  <FL label="Opciones"/>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(p.opciones || []).map((opt, oidx) => (
                      <div key={oidx} style={{ display: "flex", gap: 8 }}>
                        <input className="field" value={opt}
                          onChange={e => editarOpcion(pidx, oidx, e.target.value)}
                          placeholder={`Opción ${oidx + 1}`} style={{ flex: 1 }}/>
                        <button onClick={() => {
                          const opts = p.opciones.filter((_, i) => i !== oidx);
                          editarPregunta(pidx, "opciones", opts);
                        }} style={{ background: "none", border: "none", color: B.red, cursor: "pointer", fontSize: 16 }}>×</button>
                      </div>
                    ))}
                    <Bb label="+ AGREGAR OPCIÓN" onClick={() => editarPregunta(pidx, "opciones", [...(p.opciones || []), ""])}
                      ghost small color={B.blue}/>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <Bb label="+ AGREGAR PREGUNTA" onClick={agregarPregunta} ghost color={B.orange}/>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Bb label="CANCELAR" onClick={() => setEditando(null)} ghost small color={B.t2}/>
          <Bb label="GUARDAR ENCUESTA" onClick={guardar} disabled={!form.nombre.trim() || form.preguntas.length === 0}/>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: B.orange, fontWeight: 700, letterSpacing: ".1em" }}>◈ ENCUESTAS CONFIGURADAS</div>
        <Bb label="+ NUEVA ENCUESTA" onClick={abrirNueva} small/>
      </div>
      {loading ? <Spin/> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {encuestas.map(enc => (
            <div key={enc.id} style={{ background: B.card, border: `1px solid ${enc.activa ? B.green + "44" : B.border}`,
              borderLeft: `3px solid ${enc.activa ? B.green : B.t3}`, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: B.t1 }}>{enc.nombre}</div>
                <div style={{ fontSize: 10, color: B.t3, marginTop: 2 }}>
                  {enc.preguntas?.length || 0} preguntas · {enc.descripcion || "Sin descripción"}
                </div>
              </div>
              <Tg label={enc.activa ? "ACTIVA" : "INACTIVA"} color={enc.activa ? B.green : B.t3}/>
              <button onClick={() => toggleActiva(enc)}
                style={{ background: "none", border: `1px solid ${B.border}`, color: B.t2,
                  cursor: "pointer", padding: "4px 10px", fontSize: 10 }}>
                {enc.activa ? "DESACTIVAR" : "ACTIVAR"}
              </button>
              <Bb label="✎ EDITAR" onClick={() => abrirEditar(enc)} ghost small color={B.blue}/>
              <Bb label="✗" onClick={() => eliminar(enc.id)} ghost small color={B.red}/>
            </div>
          ))}
          {encuestas.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: B.t3 }}>
              Sin encuestas configuradas. Creá la primera.
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const ESTADOS_FLUJO = ["PENDIENTE","ASIGNADO","EN_PROCESO","PAUSADO","FINALIZADO","CANCELADO","RECOORDINADO"];
const EST_COLOR={
  PENDIENTE:B=>B.orange, ASIGNADO:B=>B.blue, EN_PROCESO:B=>B.yellow,
  PAUSADO:B=>B.purple, FINALIZADO:B=>B.green, CANCELADO:B=>B.red, RECOORDINADO:B=>B.teal
};

const CasoDetalle=({caso:casoInit,user,onBack,toast,perfil,onUpdate})=>{
  const [caso,setCaso]        = useState(casoInit);
  const [loading,setLoading]  = useState(false);
  const [confirmando,setConf] = useState(false);
  const [nota,setNota]        = useState("");
  const [showInstr,setShowInstr]   = useState(false);
  const [showCierre,setShowCierre] = useState(false);
  const [encuestaActiva,setEncuestaActiva] = useState(null);
  const [encuestasDelCaso,setEncuestasDelCaso] = useState([]);
  const [showPausar,setShowPausar]     = useState(false);
  const [showCancelar,setShowCancelar] = useState(false);
  const [showFinalizar,setShowFinalizar] = useState(false);
  const [showRecoord,setShowRecoord]   = useState(false);
  const [showEditar,setShowEditar]     = useState(false);
  const [pantallaInstr,setPantallaInstr] = useState(false);

  // Tiempo guardado en DB — sin contador en vivo por ahora
  const tiempoSegundos = caso.tiempo_total_seg || 0;

  const fmtTiempo=(s)=>{
    const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); const sg=s%60;
    return `${h>0?h+"h ":""}${m}min ${sg}seg`;
  };

  const tp  = TIPOS_PROCESO.find(t=>t.codigo===caso.tipo_proceso);
  const emp = EMPRESAS.find(e=>e.codigo===caso.empresa_id);
  const vencido = caso.sla_deadline&&new Date(caso.sla_deadline)<new Date();
  const pct = caso.sla_deadline?Math.max(0,Math.min(100,100-(Date.now()-new Date(caso.created_at))/(new Date(caso.sla_deadline)-new Date(caso.created_at))*100)):100;
  const esRolTecnico = perfil?.rol==="TECNICO";
  const esRolSuperior = !esRolTecnico;
  const esServicioTecnico = ["SERVICIO_TECNICO","SOPORTE"].includes((caso.tipo_proceso||"").toUpperCase());
  const tieneInstr = !!(caso.instrucciones_especiales?.texto||caso.instrucciones_especiales?.adjuntos?.length);
  const yaConfirmado = !!caso.instrucciones_especiales?.confirmado_por;
  const estadoColor=EST_COLOR[caso.estado]?.(B)||B.t3;

  useEffect(()=>{
    supabase.from("casos_encuestas").select("*, encuesta:encuesta_id(*)")
      .eq("caso_id",caso.id).then(({data})=>setEncuestasDelCaso(data||[]));
  },[caso.id]);


  const autoStartRef = useRef(false);
  useEffect(()=>{
    if(autoStartRef.current) return;
    autoStartRef.current = true;
    if(!esRolTecnico) return;
    // Mostrar instrucciones si no fueron confirmadas
    if(tieneInstr && !yaConfirmado){
      setPantallaInstr(true);
      return;
    }
    // Solo auto-iniciar si está ASIGNADO y no tiene tecnico_inicio_at
    // tecnico_inicio_at es el flag persistido en DB — si existe, ya fue iniciado antes
    if(caso.estado==="ASIGNADO" && !caso.tecnico_inicio_at){
      (async()=>{
        const ts = new Date().toISOString();
        const {error} = await supabase.from("casos").update({
          estado:"EN_PROCESO",
          tecnico_inicio_at: ts,
          updated_at: ts,
        }).eq("id",caso.id);
        if(!error){
          const casActualizado={...caso,estado:"EN_PROCESO",tecnico_inicio_at:ts};
          setCaso(casActualizado);
          if(onUpdate) onUpdate(casActualizado);
        }
      })();
    }
  },[]);


  const addHistorial=async(tipo,texto)=>{
    const entrada={id:Date.now(),tipo,texto,usuario:user.email,ts:new Date().toISOString()};
    const nuevo=[...(caso.historial||[]),entrada];
    await supabase.from("casos").update({historial:nuevo}).eq("id",caso.id);
    setCaso(c=>({...c,historial:nuevo})); return nuevo;
  };

  const actualizarCaso=async(updates,msgHistorial,tipoHistorial="ESTADO")=>{
    setLoading(true);
    const h=[...(caso.historial||[]),{id:Date.now(),tipo:tipoHistorial,texto:msgHistorial,usuario:user.email,ts:new Date().toISOString()}];
    const payload={...updates,historial:h,updated_at:new Date().toISOString()};
    const {error} = await supabase.from("casos").update(payload).eq("id",caso.id);
    if(error){
      toast("Error al guardar: "+error.message);
      setLoading(false);
      return null;
    }
    const casActualizado={...caso,...payload};
    setCaso(casActualizado);
    if(onUpdate) onUpdate(casActualizado);
    setLoading(false);
    return casActualizado;
  };

  const cambiarEstadoDirecto=async(nuevoEstado,msg)=>{
    const ts = new Date().toISOString();
    const extras = {};
    if(nuevoEstado === "EN_PROCESO"){
      // Guardar cuándo inició para calcular tiempo real al re-entrar
      extras.tecnico_inicio_at = ts;
    } else {
      // Al pausar/cancelar/finalizar: acumular tiempo y limpiar inicio_at
      extras.tiempo_total_seg = tiempoSegundos;
      extras.tecnico_inicio_at = null;
    }
    await actualizarCaso({estado:nuevoEstado,...extras},msg);
    toast(`Estado: ${nuevoEstado}`);
  };

  const confirmarInstrucciones=async()=>{
    if(confirmando) return; setConf(true);
    const instrActualizadas={...caso.instrucciones_especiales,confirmado_por:user.email,confirmado_ts:new Date().toISOString()};
    await supabase.from("casos").update({instrucciones_especiales:instrActualizadas}).eq("id",caso.id);
    await addHistorial("INSTRUCCIONES","✓ Técnico confirmó lectura de instrucciones especiales");
    const casActualizado={...caso,instrucciones_especiales:instrActualizadas};
    setCaso(casActualizado); if(onUpdate) onUpdate(casActualizado);
    toast("✓ Instrucciones confirmadas"); setConf(false);
    setPantallaInstr(false); // cerrar pantalla completa
    if(["ASIGNADO"].includes(caso.estado)){
      await cambiarEstadoDirecto("EN_PROCESO","Técnico inició la atención del caso");
    }
  };

  const guardarInstrucciones=async(payload)=>{
    setLoading(true);
    const accion=caso.instrucciones_especiales?.texto?"INSTRUCCIONES EDITADAS":"INSTRUCCIONES CARGADAS";
    await supabase.from("casos").update({instrucciones_especiales:payload}).eq("id",caso.id);
    await addHistorial("INSTRUCCIONES",accion+" por "+user.email);
    setCaso(c=>({...c,instrucciones_especiales:payload})); toast("✓ Instrucciones guardadas"); setLoading(false);
  };

  const pausar=async(motivo)=>{
    await actualizarCaso({
      estado:"PAUSADO",
      tiempo_total_seg:tiempoSegundos,
      tecnico_inicio_at:null,
    },`PAUSADO — Motivo: ${motivo}`,"PAUSA");
    toast("Caso pausado");
  };
  const reanudar=async()=>{
    const ts=new Date().toISOString();
    await actualizarCaso({
      estado:"EN_PROCESO",
      tecnico_inicio_at:ts,
    },"Caso reanudado");
    toast("Caso reanudado");
  };
  const cancelar=async(motivo)=>{
    await actualizarCaso({
      estado:"CANCELADO",
      tiempo_total_seg:tiempoSegundos,
      tecnico_inicio_at:null,
    },`CANCELADO — Motivo: ${motivo}`,"CANCELACION");
    toast("Caso cancelado");
  };

  const finalizar=async(resolvio)=>{
    if(resolvio && esServicioTecnico && !caso.cierre_completado){
      setShowFinalizar(false); setShowCierre(true); return;
    }
    await actualizarCaso(
      {estado:"FINALIZADO",tiempo_total_seg:tiempoSegundos,resolvio:resolvio===true},
      `FINALIZADO — ${resolvio?"Problema resuelto":"No resuelto"}`,
      "FINALIZACION"
    );
    toast(resolvio?"✓ Caso finalizado — problema resuelto":"Caso finalizado — no resuelto");
    const pendientes=encuestasDelCaso.filter(e=>!e.completada);
    if(pendientes.length>0) setEncuestaActiva(pendientes[0]);
  };

  const guardarCierre=async(formCierre)=>{
    setLoading(true);
    const updates={
      cierre_descripcion_problema:formCierre.descripcion_problema,
      cierre_como_resolvio:formCierre.como_resolvio,
      cierre_modelo_terminal:formCierre.modelo_terminal,
      cierre_serie_terminal:formCierre.serie_terminal,
      cierre_requirio_n2:formCierre.requirio_n2,
      cierre_completado:true, cierre_at:new Date().toISOString(),
      estado:"FINALIZADO", resolvio:true, tiempo_total_seg:tiempoSegundos,
    };
    const h=[...(caso.historial||[]),{id:Date.now(),tipo:"CIERRE",
      texto:`Caso resuelto · Modelo: ${formCierre.modelo_terminal} · N2: ${formCierre.requirio_n2?"Sí":"No"}`,
      usuario:user.email,ts:new Date().toISOString()}];
    await supabase.from("casos").update({...updates,historial:h}).eq("id",caso.id);
    const casActualizado={...caso,...updates,historial:h};
    setCaso(casActualizado); if(onUpdate) onUpdate(casActualizado);
    setShowCierre(false); toast("✓ Caso finalizado correctamente");
    const pendientes=encuestasDelCaso.filter(e=>!e.completada);
    if(pendientes.length>0) setEncuestaActiva(pendientes[0]);
    setLoading(false);
  };

  const recoordinar=async({nuevaFecha,nuevaFranja,motivo})=>{
    await actualizarCaso({
      estado:"ASIGNADO", franja_horaria:nuevaFranja, rango_horario:nuevaFranja,
      fecha_recoordinacion:nuevaFecha, tiempo_total_seg:tiempoSegundos,
    },`RECOORDINADO — Nueva fecha: ${nuevaFecha} · Franja: ${nuevaFranja} · Motivo: ${motivo}`,"RECOORDINACION");
    toast("✓ Caso recoordinado");
  };

  const agregarNota=async()=>{
    if(!nota.trim()) return; setLoading(true);
    await addHistorial("NOTA",nota.trim()); setNota(""); setLoading(false); toast("Nota registrada");
  };

  const guardarEncuestaConfig=async(encuestaId,respuestas)=>{
    await supabase.from("casos_encuestas").update({completada:true,respuestas,completada_at:new Date().toISOString()})
      .eq("caso_id",caso.id).eq("encuesta_id",encuestaId);
    await addHistorial("ENCUESTA","Encuesta completada por el técnico");
    setEncuestasDelCaso(prev=>prev.map(e=>e.encuesta_id===encuestaId?{...e,completada:true}:e));
    const pendientes=encuestasDelCaso.filter(e=>!e.completada&&e.encuesta_id!==encuestaId);
    setEncuestaActiva(pendientes.length>0?pendientes[0]:null);
    toast("+20 XP · Encuesta completada ✓");
  };

  const historial=caso.historial||[];
  const HIST_ICON={ESTADO:"⚡",NOTA:"📝",ENCUESTA:"📊",CREACION:"🆕",SISTEMA:"🔧",
    INSTRUCCIONES:"⚠",CIERRE:"✅",ASIGNACION:"👤",PAUSA:"⏸",CANCELACION:"✗",FINALIZACION:"🏁",RECOORDINACION:"📅"};
  const HIST_COL={ESTADO:B=>B.orange,NOTA:B=>B.blue,ENCUESTA:B=>B.green,CREACION:B=>B.purple,
    INSTRUCCIONES:B=>B.orange,CIERRE:B=>B.green,ASIGNACION:B=>B.blue,
    PAUSA:B=>B.purple,CANCELACION:B=>B.red,FINALIZACION:B=>B.green,RECOORDINACION:B=>B.teal};

  // ── PANTALLA COMPLETA DE INSTRUCCIONES ──
  if(pantallaInstr && tieneInstr && !yaConfirmado){
    return <PantallaInstrucciones caso={caso} onConfirmar={confirmarInstrucciones} confirmando={confirmando}/>;
  }

  return(
    <div style={{padding:"0 0 40px"}}>
      {showInstr&&<ModalInstrucciones caso={caso} user={user} onClose={()=>setShowInstr(false)} onSave={guardarInstrucciones}/>}
      {showEditar&&<OverlayEditarCaso caso={caso} user={user} perfil={perfil}
        onVolver={()=>setShowEditar(false)}
        onGuardar={async(updates)=>{
          const{error}=await supabase.from("casos").update({...updates,updated_at:new Date().toISOString()}).eq("id",caso.id);
          if(error){toast("Error: "+error.message);return;}
          const casActualizado={...caso,...updates};
          setCaso(casActualizado); if(onUpdate) onUpdate(casActualizado);
          setShowEditar(false); toast("✓ Caso actualizado");
        }}
      />}
      {showCierre&&<ModalCierre caso={caso} user={user} onClose={()=>setShowCierre(false)} onGuardar={guardarCierre}/>}
      {showFinalizar&&<OverlayFinalizar caso={caso} onVolver={()=>setShowFinalizar(false)} onGuardar={async(updates, extras)=>{
        const h=[...(caso.historial||[]),{id:Date.now(),tipo:"FINALIZACION",
          texto:`FINALIZADO — ${updates.resolvio?"Resuelto":"No resuelto"}${updates.cierre_modelo_terminal?` · Modelo: ${updates.cierre_modelo_terminal}`:""}${updates.cierre_serie_terminal?` · Serie: ${updates.cierre_serie_terminal}`:""}`,
          usuario:user.email,ts:new Date().toISOString()}];
        const payload={...updates,tiempo_total_seg:tiempoSegundos,historial:h,updated_at:new Date().toISOString()};
        const{error}=await supabase.from("casos").update(payload).eq("id",caso.id);
        if(error){ toast("Error: "+error.message); return; }
        // Generar caso ST si VTP requiere seguimiento
        if(extras?.generarST){
          await supabase.from("casos").insert({
            tipo_proceso:"SERVICIO_TECNICO",
            empresa_id:caso.empresa_id,
            tecnico_id:caso.tecnico_id,
            razon_social:caso.razon_social,
            rut:caso.rut,
            direccion:caso.direccion,
            localidad:caso.localidad,
            departamento:caso.departamento,
            telefono:caso.telefono,
            rubro:caso.rubro,
            numero_serie:caso.numero_serie,
            prioridad:caso.prioridad||"MEDIA",
            estado:"ASIGNADO",
            fecha_visita:extras.fechaSeguimiento,
            descripcion:`Seguimiento generado desde Visita Técnica Proactiva #${caso.numero||caso.id}`,
            creado_por:user.id,
            sla_horas:4,
            sla_deadline:new Date(extras.fechaSeguimiento+"T23:59:59").toISOString(),
            historial:[{id:Date.now(),tipo:"CREACION",
              texto:`Caso ST generado automáticamente desde VTP #${caso.numero||caso.id}`,
              usuario:user.email,ts:new Date().toISOString()}],
            created_at:new Date().toISOString(),
          });
          toast("✓ Caso ST generado para el "+new Date(extras.fechaSeguimiento+"T12:00:00").toLocaleDateString("es-UY"));
        }
        const casActualizado={...caso,...payload};
        if(onUpdate) onUpdate(casActualizado);
        toast("✓ Caso finalizado");
        onBack();
      }}/>}
      {encuestaActiva&&<ModalEncuestaConfig encuesta={encuestaActiva.encuesta} caso={caso} user={user} onClose={()=>setEncuestaActiva(null)} onSave={guardarEncuestaConfig}/>}
      {showPausar&&<OverlayPausar caso={caso} onVolver={()=>setShowPausar(false)} onGuardar={async(txt)=>{await pausar(txt);setShowPausar(false);onBack();}}/>}
      {showCancelar&&<OverlayCancelar caso={caso} onVolver={()=>setShowCancelar(false)} onGuardar={async(txt)=>{await cancelar(txt);setShowCancelar(false);onBack();}}/>}
      {showRecoord&&<OverlayRecoordinar caso={caso} onVolver={()=>setShowRecoord(false)} onGuardar={async(data)=>{await recoordinar(data);setShowRecoord(false);onBack();}}/>}

      {/* Instrucciones confirmadas — badge en cabezal */}
      <BloqueInstrucciones instrucciones={caso.instrucciones_especiales} onConfirmar={confirmarInstrucciones} yaConfirmado={yaConfirmado} esRolTecnico={false}/>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.t2,cursor:"pointer",padding:"6px 12px",fontSize:11,fontFamily:"'Orbitron',sans-serif"}}>← VOLVER</button>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:18,color:B.t1}}>#{caso.numero||caso.id_externo}</span>
            <Tg label={caso.tipo_proceso} color={tp?.color||B.orange}/>
            {caso.tier&&<Tg label={caso.tier} color={{VIP:B.amber,T1a:B.orange,T1b:B.blue,T2:B.green}[caso.tier]||B.t2}/>}
            <Tg label={caso.estado} color={estadoColor}/>
            {cuentaRegresiva(caso)&&<span style={{fontSize:12,color:B.teal,fontWeight:700}}>{cuentaRegresiva(caso)}</span>}
            {caso.es_incidente&&<Tg label={`INC ${caso.incidente_id||""}`} color={B.red}/>}
            {tieneInstr&&yaConfirmado&&<Tg label="⚠ INSTRUCCIONES LEÍDAS" color={B.green}/>}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ ACCIONES</div>
        <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
          {caso.estado==="PAUSADO"&&<Bb label="▶ REANUDAR" onClick={reanudar} color={B.blue}/>}
          {caso.estado==="EN_PROCESO"&&<Bb label="⏸ PAUSAR" onClick={()=>setShowPausar(true)} color={B.purple} ghost/>}
          {["EN_PROCESO","PAUSADO"].includes(caso.estado)&&<Bb label="🏁 FINALIZAR" onClick={()=>setShowFinalizar(true)} color={B.green}/>}
          {["EN_PROCESO","PAUSADO","ASIGNADO"].includes(caso.estado)&&<Bb label="📅 RECOORDINAR" onClick={()=>setShowRecoord(true)} color={B.teal} ghost/>}
          {["EN_PROCESO","PAUSADO","ASIGNADO"].includes(caso.estado)&&<Bb label="✗ CANCELAR" onClick={()=>setShowCancelar(true)} color={B.red} ghost/>}
          {esRolSuperior&&["DIRECTOR","REGIONAL"].includes(perfil?.rol)&&(
            <Bb label="✎ EDITAR CASO" onClick={()=>setShowEditar(true)} ghost small color={B.blue}/>
          )}
          {esRolSuperior&&<Bb label={tieneInstr?"✎ INSTRUCCIONES":"+ INSTRUCCIONES"} onClick={()=>setShowInstr(true)} ghost small color={B.orange}/>}
        </div>
        {caso.estado==="EN_PROCESO"&&(
          <div style={{marginTop:12,display:"flex",gap:8}}>
            <input className="field" style={{flex:1}} placeholder="Agregar nota al historial..."
              value={nota} onChange={e=>setNota(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&agregarNota()}/>
            <Bb label="NOTA" onClick={agregarNota} disabled={!nota.trim()||loading} small ghost/>
          </div>
        )}
      </div>

      {/* Datos */}
      {/* DATOS DEL CLIENTE */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:12}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ DATOS DEL CLIENTE</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[["Terminal",caso.numero_serie],["RUT",caso.rut],["Razón Social",caso.razon_social],["Rubro",caso.rubro]].map(([l,v])=>v&&(
            <div key={l} style={{display:"flex",gap:8}}>
              <div style={{fontSize:10,color:B.t3,fontWeight:600,letterSpacing:".06em",minWidth:90,paddingTop:2}}>{l}</div>
              <div style={{fontSize:13,color:B.t1,flex:1}}>{v}</div>
            </div>
          ))}
          {caso.tier&&(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{fontSize:10,color:B.t3,fontWeight:600,letterSpacing:".06em",minWidth:90}}>TIER</div>
              <Tg label={caso.tier} color={({VIP:B.amber,T1a:B.orange,T1b:B.blue,T2:B.green})[caso.tier]||B.t2}/>
            </div>
          )}
          {caso.prioridad&&(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{fontSize:10,color:B.t3,fontWeight:600,letterSpacing:".06em",minWidth:90}}>PRIORIDAD</div>
              <Tg label={caso.prioridad} color={PC[caso.prioridad]||B.t2}/>
            </div>
          )}
          {caso.telefono&&(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{fontSize:10,color:B.t3,fontWeight:600,letterSpacing:".06em",minWidth:90}}>TELÉFONO</div>
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:B.t1}}>{caso.telefono}</span>
                <button onClick={()=>{
                  const num=(caso.telefono||"").replace(/\D/g,"");
                  const numUY=num.startsWith("598")?num:"598"+num;
                  window.open(`https://wa.me/${numUY}`,"_blank");
                }} style={{background:"#001a00",border:"1px solid #25D36644",
                  color:"#25D366",cursor:"pointer",padding:"4px 12px",
                  fontSize:12,fontWeight:700,borderRadius:2,
                  display:"flex",alignItems:"center",gap:6}}>
                  💬 WhatsApp
                </button>
              </div>
            </div>
          )}
          {/* Problema aparente u Observaciones */}
          {(()=>{
            const esST=["SERVICIO_TECNICO","SOPORTE"].includes((caso.tipo_proceso||"").toUpperCase());
            const label=esST?"PROBLEMA APARENTE":"OBSERVACIONES";
            const texto=esST?caso.descripcion:caso.observaciones;
            if(!texto) return null;
            return(
              <div style={{marginTop:4}}>
                <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".06em",marginBottom:6}}>
                  {esST?"🔍":"📋"} {label}
                </div>
                <div style={{fontSize:14,color:"#CC8800",lineHeight:1.7,
                  padding:"10px 14px",background:"#1a1000",
                  border:"1px solid #CC880033",borderRadius:2}}>
                  {texto}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* DATOS OPERATIVOS */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ DATOS OPERATIVOS</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[["Empresa",emp?.nombre||caso.empresa_id],["Departamento",caso.departamento],["Localidad",caso.localidad],["Dirección",caso.direccion]].map(([l,v])=>v&&(
            <div key={l} style={{display:"flex",gap:8}}>
              <div style={{fontSize:10,color:B.t3,fontWeight:600,letterSpacing:".06em",minWidth:90,paddingTop:2}}>{l}</div>
              <div style={{fontSize:13,color:B.t1,flex:1}}>{v}</div>
            </div>
          ))}
          {(caso.franja_horaria||caso.rango_horario)&&(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{fontSize:10,color:B.t3,fontWeight:600,letterSpacing:".06em",minWidth:90}}>FRANJA HORARIA</div>
              <span style={{fontSize:13,color:"#CC7700",fontWeight:600}}>{caso.franja_horaria||caso.rango_horario}</span>
            </div>
          )}
          {caso.sla_deadline&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:10,color:B.t3,fontWeight:600,letterSpacing:".06em"}}>SLA</span>
                <span style={{fontSize:11,color:vencido?B.red:B.green,fontWeight:700}}>{vencido?"⚠ VENCIDO":"✓ EN TIEMPO"}</span>
              </div>
              <div style={{height:6,background:B.deep,borderRadius:3}}>
                <div style={{height:6,width:`${pct}%`,background:vencido?B.red:pct<30?B.orange:B.green,borderRadius:3}}/>
              </div>
            </div>
          )}
          {/* Botón Google Maps */}
          {caso.direccion&&(
            <button onClick={()=>{
              const dir=encodeURIComponent(`${caso.direccion}${caso.localidad?", "+caso.localidad:""}${caso.departamento?", "+caso.departamento:""}, Uruguay`);
              window.open(`https://www.google.com/maps/search/?api=1&query=${dir}`,"_blank");
            }} style={{marginTop:4,width:"100%",padding:"14px 0",
              background:"#001a33",border:"1px solid #4285F444",
              color:"#4285F4",cursor:"pointer",fontSize:15,fontWeight:700,
              borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <span style={{fontSize:24}}>📍</span> VER EN GOOGLE MAPS
            </button>
          )}
        </div>
      </div>

      {/* Cierre técnico */}
      {/* Cierre técnico */}
      {caso.cierre_completado&&(
        <div style={{background:`${B.green}11`,border:`1px solid ${B.green}33`,borderLeft:`3px solid ${B.green}`,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:10,color:B.green,fontWeight:700,letterSpacing:".1em",marginBottom:10}}>✅ CIERRE TÉCNICO</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Problema",caso.cierre_descripcion_problema],["Solución",caso.cierre_como_resolvio],["Modelo",caso.cierre_modelo_terminal],["Serie",caso.cierre_serie_terminal],["Soporte N2",caso.cierre_requirio_n2?"✓ SÍ":"✗ NO"]].map(([l,v])=>v&&(
              <div key={l}><div style={{fontSize:9,color:B.t3,fontWeight:600}}>{l}</div>
              <div style={{fontSize:12,color:l==="Soporte N2"&&caso.cierre_requirio_n2?B.red:B.t1,fontWeight:l==="Soporte N2"?700:400,marginTop:2}}>{v}</div></div>
            ))}
          </div>
        </div>
      )}

      {/* Encuestas */}
      {encuestasDelCaso.length>0&&(
        <div style={{background:B.card,border:`1px solid ${B.border}`,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:10}}>📋 ENCUESTAS</div>
          {encuestasDelCaso.map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${B.border}22`}}>
              <Tg label={e.completada?"✓ COMPLETADA":"PENDIENTE"} color={e.completada?B.green:B.orange}/>
              <span style={{fontSize:12,flex:1}}>{e.encuesta?.nombre||"Encuesta"}</span>
              {!e.completada&&esRolTecnico&&caso.estado==="FINALIZADO"&&(
                <Bb label="COMPLETAR" onClick={()=>setEncuestaActiva(e)} small ghost color={B.orange}/>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Historial */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ HISTORIAL ({historial.length})</div>
        {historial.length===0&&<div style={{color:B.t3,fontSize:12,textAlign:"center",padding:20}}>Sin entradas</div>}
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:320,overflowY:"auto"}}>
          {[...historial].reverse().map(h=>(
            <div key={h.id} style={{display:"flex",gap:10,padding:"8px 10px",background:B.deep,border:`1px solid ${B.border}`,borderLeft:`3px solid ${HIST_COL[h.tipo]?.(B)||B.t3}`}}>
              <span style={{fontSize:16,flexShrink:0}}>{HIST_ICON[h.tipo]||"📌"}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:HIST_COL[h.tipo]?.(B)||B.t1,fontWeight:600}}>{h.texto}</div>
                <div style={{fontSize:10,color:B.t3,marginTop:2}}>{h.usuario} · {fmtD(h.ts)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════
// OVERLAYS MOBILE — PAUSAR / CANCELAR / RECOORDINAR / FINALIZAR
// Diseñados para Android gama media/baja
// ═══════════════════════════════════════════════════════════

// Wrapper base para todos los overlays de acción
// ═══════════════════════════════════════════════════════════
// OVERLAYS MOBILE — Cada paso es una pantalla completa
// ═══════════════════════════════════════════════════════════

// Pantalla base reutilizable para todos los flujos de acción
const PantallaAccion = ({color, icono, titulo, subtitulo, pasoActual, totalPasos, children, botonLabel, botonDisabled, onBoton, onVolver, saving}) => (
  <div style={{
    position:"fixed", inset:0, zIndex:300,
    background:"#050507",
    display:"flex", flexDirection:"column",
    overflowY:"hidden",
  }}>
    {/* Franja color */}
    <div style={{height:5, background:color, flexShrink:0}}/>

    {/* Header */}
    <div style={{
      padding:"16px 20px 14px", flexShrink:0,
      borderBottom:`1px solid ${color}33`,
      background:"#0A0A0F",
    }}>
      <button onClick={onVolver} style={{
        background:"none", border:`1px solid #333`,
        color:"#888", cursor:"pointer", padding:"10px 18px",
        fontSize:14, marginBottom:14, borderRadius:2,
        display:"flex", alignItems:"center", gap:8,
      }}>← VOLVER</button>

      {/* Barra de progreso */}
      {totalPasos>1&&(
        <div style={{display:"flex", gap:5, marginBottom:14}}>
          {Array.from({length:totalPasos}).map((_,i)=>(
            <div key={i} style={{
              flex:1, height:5, borderRadius:3,
              background: i<pasoActual-1 ? "#00E87A"
                : i===pasoActual-1 ? color
                : "#222",
              transition:"background .3s",
            }}/>
          ))}
        </div>
      )}

      <div style={{fontSize:11, color:"#666", marginBottom:4, letterSpacing:".1em"}}>
        {totalPasos>1?`PASO ${pasoActual} DE ${totalPasos}`:""} {subtitulo}
      </div>
      <div style={{
        fontSize:22, fontWeight:900, color,
        fontFamily:"'Orbitron',sans-serif", lineHeight:1.2,
        display:"flex", alignItems:"center", gap:10,
      }}>
        <span>{icono}</span> {titulo}
      </div>
    </div>

    {/* Contenido scrolleable */}
    <div style={{flex:1, overflowY:"auto", padding:"20px 20px 0"}}>
      {children}
    </div>

    {/* Botón fijo abajo */}
    <div style={{padding:16, flexShrink:0, background:"#0A0A0F", borderTop:`1px solid #1a1a1a`}}>
      <button onClick={onBoton} disabled={botonDisabled||saving}
        style={{
          width:"100%", padding:"22px 0",
          background: botonDisabled||saving ? "#333" : color,
          border:"none",
          cursor: botonDisabled||saving ? "not-allowed" : "pointer",
          fontFamily:"'Orbitron',sans-serif", fontWeight:900,
          fontSize:17, color: botonDisabled||saving ? "#666" : "#050507",
          letterSpacing:".06em", borderRadius:2,
          transition:"background .15s",
        }}>
        {saving ? "GUARDANDO..." : botonLabel}
      </button>
    </div>
  </div>
);

// ─── OVERLAY PAUSAR ─────────────────────────────────────────
const OverlayPausar = ({ caso, onVolver, onGuardar }) => {
  const [motivo,   setMotivo]  = useState("");
  const [motivos,  setMotivos] = useState([]);
  const [saving,   setSaving]  = useState(false);

  useEffect(()=>{
    supabase.from("motivos_config").select("*")
      .eq("tipo","PAUSA").eq("activo",true).order("orden")
      .then(({data})=>setMotivos(data||[]));
  },[]);

  return (
    <PantallaAccion
      color={B.purple} icono="⏸" titulo="PAUSAR CASO"
      subtitulo={caso.razon_social}
      pasoActual={1} totalPasos={1}
      botonLabel="CONFIRMAR PAUSA"
      botonDisabled={!motivo.trim()}
      saving={saving}
      onVolver={onVolver}
      onBoton={async()=>{ setSaving(true); await onGuardar(motivo); setSaving(false); }}>
      <div style={{marginBottom:8,fontSize:16,fontWeight:700,color:"#ccc"}}>¿Por qué pausás?</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {motivos.map(m=>(
          <button key={m.id} onClick={()=>setMotivo(m.texto)}
            style={{
              padding:"18px 16px", textAlign:"left",
              border:`2px solid ${motivo===m.texto?B.purple:"#2a2a2a"}`,
              background:motivo===m.texto?B.purple+"22":"#0e0e14",
              color:motivo===m.texto?B.purple:"#ccc",
              cursor:"pointer", fontSize:15, borderRadius:2,
              display:"flex", alignItems:"center", gap:14, transition:"all .15s",
            }}>
            <span style={{fontSize:22,flexShrink:0}}>{motivo===m.texto?"◉":"○"}</span>{m.texto}
          </button>
        ))}
      </div>
      <div style={{fontSize:13,color:"#666",marginBottom:8}}>O escribí otro motivo:</div>
      <textarea className="field" rows={3}
        placeholder="Describí el motivo..."
        value={motivo} onChange={e=>setMotivo(e.target.value)}
        style={{fontSize:16,resize:"none"}}/>
    </PantallaAccion>
  );
};

// ─── OVERLAY CANCELAR — 2 pasos ─────────────────────────────
const OverlayCancelar = ({ caso, onVolver, onGuardar }) => {
  const [paso,    setPaso]    = useState(1);
  const [motivo,  setMotivo]  = useState("");
  const [motivos, setMotivos] = useState([]);
  const [saving,  setSaving]  = useState(false);

  useEffect(()=>{
    supabase.from("motivos_config").select("*")
      .eq("tipo","CANCELACION").eq("activo",true).order("orden")
      .then(({data})=>setMotivos(data||[]));
  },[]);

  if(paso===1) return (
    <PantallaAccion
      color={B.red} icono="✗" titulo="CANCELAR CASO"
      subtitulo={caso.razon_social}
      pasoActual={1} totalPasos={2}
      botonLabel="SIGUIENTE →"
      botonDisabled={!motivo.trim()}
      onVolver={onVolver}
      onBoton={()=>setPaso(2)}>
      <div style={{marginBottom:8,fontSize:16,fontWeight:700,color:"#ccc"}}>¿Por qué cancelás?</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {motivos.map(m=>(
          <button key={m.id} onClick={()=>setMotivo(m.texto)}
            style={{
              padding:"18px 16px", textAlign:"left",
              border:`2px solid ${motivo===m.texto?B.red:"#2a2a2a"}`,
              background:motivo===m.texto?B.red+"22":"#0e0e14",
              color:motivo===m.texto?B.red:"#ccc",
              cursor:"pointer", fontSize:15, borderRadius:2,
              display:"flex", alignItems:"center", gap:14, transition:"all .15s",
            }}>
            <span style={{fontSize:22}}>{motivo===m.texto?"◉":"○"}</span>{m.texto}
          </button>
        ))}
      </div>
      <textarea className="field" rows={3}
        placeholder="O escribí otro motivo..."
        value={motivo} onChange={e=>setMotivo(e.target.value)}
        style={{fontSize:16,resize:"none"}}/>
    </PantallaAccion>
  );

  return (
    <PantallaAccion
      color={B.red} icono="⚠️" titulo="¿ESTÁS SEGURO?"
      subtitulo={caso.razon_social}
      pasoActual={2} totalPasos={2}
      botonLabel="✗ SÍ, CANCELAR DEFINITIVAMENTE"
      saving={saving}
      onVolver={()=>setPaso(1)}
      onBoton={async()=>{ setSaving(true); await onGuardar(motivo); setSaving(false); }}>
      <div style={{textAlign:"center",padding:"10px 0"}}>
        <div style={{fontSize:70,marginBottom:20}}>⚠️</div>
        <div style={{fontSize:18,color:"#FF2040",fontWeight:700,marginBottom:16}}>
          Esta acción no se puede deshacer
        </div>
        <div style={{padding:"16px",background:"#1a0000",border:"1px solid #FF204033",
          fontSize:15,color:"#ccc",textAlign:"left",lineHeight:1.7,borderRadius:2}}>
          <strong style={{color:"#FF2040"}}>Motivo:</strong><br/>{motivo}
        </div>
      </div>
    </PantallaAccion>
  );
};

// ─── OVERLAY RECOORDINAR — 3 pasos ──────────────────────────
const OverlayRecoordinar = ({ caso, onVolver, onGuardar }) => {
  const [paso,    setPaso]    = useState(1);
  const [fecha,   setFecha]   = useState("");
  const [franja,  setFranja]  = useState("");
  const [motivo,  setMotivo]  = useState("");
  const [motivos, setMotivos] = useState([]);
  const [saving,  setSaving]  = useState(false);

  useEffect(()=>{
    supabase.from("motivos_config").select("*")
      .eq("tipo","RECOORDINACION").eq("activo",true).order("orden")
      .then(({data})=>setMotivos(data||[]));
  },[]);
  const FRANJAS = [
    {id:"FH1 (8-12)",  label:"FH1", hora:"08:00 – 12:00", icono:"🌅"},
    {id:"FH2 (12-16)", label:"FH2", hora:"12:00 – 16:00", icono:"☀️"},
    {id:"FH3 (16-19)", label:"FH3", hora:"16:00 – 19:00", icono:"🌆"},
    {id:"FH4 (19-22)", label:"FH4", hora:"19:00 – 22:00", icono:"🌙"},
  ];

  if(paso===1) return (
    <PantallaAccion
      color={B.teal} icono="📅" titulo="NUEVA FECHA"
      subtitulo={caso.razon_social}
      pasoActual={1} totalPasos={3}
      botonLabel="SIGUIENTE →"
      botonDisabled={!fecha}
      onVolver={onVolver}
      onBoton={()=>setPaso(2)}>
      <div style={{fontSize:16,fontWeight:700,color:"#ccc",marginBottom:20}}>¿Para qué día recoordinás?</div>
      <input type="date" className="field"
        value={fecha} onChange={e=>setFecha(e.target.value)}
        min={new Date().toISOString().split("T")[0]}
        style={{fontSize:20,padding:"18px 16px",textAlign:"center",letterSpacing:".05em"}}/>
      {fecha&&(
        <div style={{marginTop:14,padding:"12px 16px",background:"#001a1a",
          border:`1px solid ${B.teal}44`,fontSize:15,color:B.teal,textAlign:"center",borderRadius:2}}>
          ✓ {new Date(fecha+"T12:00:00").toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long"})}
        </div>
      )}
    </PantallaAccion>
  );

  if(paso===2) return (
    <PantallaAccion
      color={B.teal} icono="🕐" titulo="NUEVA FRANJA"
      subtitulo={caso.razon_social}
      pasoActual={2} totalPasos={3}
      botonLabel="SIGUIENTE →"
      botonDisabled={!franja}
      onVolver={()=>setPaso(1)}
      onBoton={()=>setPaso(3)}>
      <div style={{fontSize:16,fontWeight:700,color:"#ccc",marginBottom:20}}>¿En qué horario?</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {FRANJAS.map(f=>(
          <button key={f.id} onClick={()=>setFranja(f.id)}
            style={{
              padding:"20px 12px",
              border:`2px solid ${franja===f.id?B.teal:"#2a2a2a"}`,
              background:franja===f.id?B.teal+"22":"#0e0e14",
              color:franja===f.id?B.teal:"#ccc",
              cursor:"pointer", textAlign:"center", borderRadius:2,
              transition:"all .15s",
            }}>
            <div style={{fontSize:32,marginBottom:6}}>{f.icono}</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:2}}>{f.label}</div>
            <div style={{fontSize:12,color:"#666"}}>{f.hora}</div>
          </button>
        ))}
      </div>
    </PantallaAccion>
  );

  return (
    <PantallaAccion
      color={B.teal} icono="📝" titulo="MOTIVO"
      subtitulo={caso.razon_social}
      pasoActual={3} totalPasos={3}
      botonLabel="✓ CONFIRMAR RECOORDINACIÓN"
      botonDisabled={!motivo.trim()}
      saving={saving}
      onVolver={()=>setPaso(2)}
      onBoton={async()=>{ setSaving(true); await onGuardar({nuevaFecha:fecha,nuevaFranja:franja,motivo}); setSaving(false); }}>
      <div style={{marginBottom:10,padding:"12px 16px",background:"#001a1a",
        border:`1px solid ${B.teal}44`,fontSize:14,color:"#aaa",lineHeight:1.7,borderRadius:2}}>
        <div>📅 <strong style={{color:B.teal}}>{new Date(fecha+"T12:00:00").toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long"})}</strong></div>
        <div>🕐 <strong style={{color:B.teal}}>{franja}</strong></div>
      </div>
      <div style={{fontSize:16,fontWeight:700,color:"#ccc",marginBottom:12}}>¿Por qué recoordinás?</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {motivos.map(m=>(
          <button key={m.id} onClick={()=>setMotivo(m.texto)}
            style={{
              padding:"16px 16px", textAlign:"left",
              border:`2px solid ${motivo===m.texto?B.teal:"#2a2a2a"}`,
              background:motivo===m.texto?B.teal+"22":"#0e0e14",
              color:motivo===m.texto?B.teal:"#ccc",
              cursor:"pointer", fontSize:15, borderRadius:2,
              display:"flex", alignItems:"center", gap:14, transition:"all .15s",
            }}>
            <span style={{fontSize:22,flexShrink:0}}>{motivo===m.texto?"◉":"○"}</span>{m.texto}
          </button>
        ))}
      </div>
      <textarea className="field" rows={4}
        placeholder="O escribí otro motivo..."
        value={motivo} onChange={e=>setMotivo(e.target.value)}
        style={{fontSize:16,resize:"none"}}/>
    </PantallaAccion>
  );
};

// ─── OVERLAY FINALIZAR — hasta 7 pasos ──────────────────────
const OverlayFinalizar = ({ caso, onVolver, onGuardar }) => {
  const tipo = caso.tipo_proceso?.toUpperCase();
  const esST  = ["SERVICIO_TECNICO","SOPORTE"].includes(tipo);
  const esINS = tipo === "INSTALACION";
  const esRET = tipo === "RETIRO";
  const esVTP = tipo === "VISITA_PROACTIVA";

  // ── SERVICIO TÉCNICO ────────────────────────────────────
  const FlujST = () => {
    const [paso,setPaso] = useState(1);
    const [resolvio,setRes] = useState(null);
    const [detProb,setDetProb] = useState("");
    const [modelo,setModelo] = useState("");
    const [serie,setSerie] = useState("");
    const [descProb,setDesc] = useState("");
    const [comoRes,setComo] = useState("");
    const [n2,setN2] = useState(null);
    const [showScan,setScan] = useState(false);
    const [saving,setSaving] = useState(false);

    const totalPasos = resolvio===true ? 6 : resolvio===false ? 4 : 1;

    const guardar = async() => {
      setSaving(true);
      await onGuardar({
        estado:"FINALIZADO",
        resolvio: resolvio===true,
        cierre_modelo_terminal: modelo,
        cierre_serie_terminal: serie,
        cierre_descripcion_problema: resolvio===true ? descProb : detProb,
        cierre_como_resolvio: comoRes||"",
        cierre_requirio_n2: n2||false,
        cierre_completado: true,
        cierre_at: new Date().toISOString(),
      });
      setSaving(false);
    };

    if(paso===1) return (
      <PantallaAccion color={B.green} icono="🏁" titulo="¿RESOLVISTE?"
        subtitulo={caso.razon_social} pasoActual={1} totalPasos={totalPasos}
        botonLabel="SIGUIENTE →" botonDisabled={resolvio===null}
        onVolver={onVolver} onBoton={()=>setPaso(2)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:24}}>
          ¿Resolviste el problema del cliente?
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {[[true,"✅","SÍ, lo resolví",B.green],[false,"❌","NO pude resolverlo",B.red]].map(([val,ic,lbl,col])=>(
            <button key={String(val)} onClick={()=>setRes(val)}
              style={{padding:"24px 20px",border:`3px solid ${resolvio===val?col:"#2a2a2a"}`,
                background:resolvio===val?col+"22":"#0e0e14",color:resolvio===val?col:"#ccc",
                cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:18,transition:"all .15s"}}>
              <span style={{fontSize:44,flexShrink:0}}>{ic}</span>
              <span style={{fontSize:18,fontWeight:700}}>{lbl}</span>
            </button>
          ))}
        </div>
      </PantallaAccion>
    );

    // Si NO resolvió → detalla el problema
    if(paso===2 && resolvio===false) return (
      <PantallaAccion color={B.red} icono="📋" titulo="DETALLA EL PROBLEMA"
        subtitulo={caso.razon_social} pasoActual={2} totalPasos={totalPasos}
        botonLabel="SIGUIENTE →" botonDisabled={!detProb.trim()}
        onVolver={()=>setPaso(1)} onBoton={()=>setPaso(3)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:16}}>
          ¿Cuál era el problema que no pudiste resolver?
        </div>
        <textarea className="field" rows={6}
          placeholder="Describí el problema encontrado..."
          value={detProb} onChange={e=>setDetProb(e.target.value)}
          style={{fontSize:16,resize:"none",lineHeight:1.7}}/>
      </PantallaAccion>
    );

    // Modelo
    if((paso===2&&resolvio===true)||(paso===3&&resolvio===false)) return (
      <PantallaAccion color={B.orange} icono="🖥️" titulo="MODELO DEL EQUIPO"
        subtitulo={caso.razon_social}
        pasoActual={resolvio===true?2:3} totalPasos={totalPasos}
        botonLabel="SIGUIENTE →" botonDisabled={!modelo}
        onVolver={()=>setPaso(resolvio===true?1:2)}
        onBoton={()=>setPaso(resolvio===true?3:4)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:20}}>¿Cuál es el modelo del equipo?</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {MODELOS_TERMINAL.map(m=>(
            <button key={m} onClick={()=>setModelo(m)}
              style={{padding:"20px 20px",border:`2px solid ${modelo===m?B.orange:"#2a2a2a"}`,
                background:modelo===m?B.orangeDim:"#0e0e14",color:modelo===m?B.orange:"#ccc",
                cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:16,
                fontSize:17,fontWeight:modelo===m?700:400,transition:"all .15s"}}>
              <span style={{fontSize:24}}>{modelo===m?"◉":"○"}</span>{m}
            </button>
          ))}
        </div>
      </PantallaAccion>
    );

    // Serie
    if((paso===3&&resolvio===true)||(paso===4&&resolvio===false)) return (
      <>
        {showScan&&<EscanerBarras onScan={v=>{setSerie(v);setScan(false);}} onClose={()=>setScan(false)}/>}
        <PantallaAccion color={B.orange} icono="🔢" titulo="SERIE DEL EQUIPO"
          subtitulo={caso.razon_social}
          pasoActual={resolvio===true?3:4} totalPasos={totalPasos}
          botonLabel={resolvio===true?"SIGUIENTE →":"✓ FINALIZAR CASO"}
          botonDisabled={!serie.trim()} saving={saving}
          onVolver={()=>setPaso(resolvio===true?2:3)}
          onBoton={async()=>{ if(resolvio===true){setPaso(4);} else {await guardar();} }}>
          <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:20}}>Serie del equipo</div>
          <button onClick={()=>setScan(true)}
            style={{width:"100%",padding:"22px 0",marginBottom:16,background:"#001a33",
              border:`2px solid ${B.blue}`,color:B.blue,cursor:"pointer",fontSize:17,fontWeight:700,
              borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
            <span style={{fontSize:32}}>📷</span> ESCANEAR CÓDIGO DE BARRAS
          </button>
          <div style={{fontSize:12,color:"#555",textAlign:"center",marginBottom:12}}>— o escribí la serie —</div>
          <input className="field" placeholder="Serie del equipo..."
            value={serie} onChange={e=>setSerie(e.target.value)}
            style={{fontSize:20,padding:"18px",textAlign:"center",letterSpacing:".1em"}}/>
          {serie&&<div style={{marginTop:14,padding:"14px",background:"#001a0a",
            border:`1px solid ${B.green}44`,fontSize:16,color:B.green,textAlign:"center",borderRadius:2}}>
            ✓ <strong>{serie}</strong></div>}
        </PantallaAccion>
      </>
    );

    // Solo si SÍ resolvió: pasos 4,5,6
    if(paso===4) return (
      <PantallaAccion color={B.blue} icono="🔍" titulo="EL PROBLEMA"
        subtitulo={caso.razon_social} pasoActual={4} totalPasos={6}
        botonLabel="SIGUIENTE →" botonDisabled={!descProb.trim()}
        onVolver={()=>setPaso(3)} onBoton={()=>setPaso(5)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:16}}>¿Cuál era el problema?</div>
        <textarea className="field" rows={7}
          placeholder="Describí el problema que tenía el equipo..."
          value={descProb} onChange={e=>setDesc(e.target.value)}
          style={{fontSize:16,resize:"none",lineHeight:1.7}}/>
      </PantallaAccion>
    );

    if(paso===5) return (
      <PantallaAccion color={B.blue} icono="🔧" titulo="LA SOLUCIÓN"
        subtitulo={caso.razon_social} pasoActual={5} totalPasos={6}
        botonLabel="SIGUIENTE →" botonDisabled={!comoRes.trim()}
        onVolver={()=>setPaso(4)} onBoton={()=>setPaso(6)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:16}}>¿Cómo lo resolviste?</div>
        <textarea className="field" rows={7}
          placeholder="Describí la solución aplicada..."
          value={comoRes} onChange={e=>setComo(e.target.value)}
          style={{fontSize:16,resize:"none",lineHeight:1.7}}/>
      </PantallaAccion>
    );

    if(paso===6) return (
      <PantallaAccion color={B.green} icono="🆘" titulo="SOPORTE N2"
        subtitulo={caso.razon_social} pasoActual={6} totalPasos={6}
        botonLabel="✓ FINALIZAR CASO" botonDisabled={n2===null} saving={saving}
        onVolver={()=>setPaso(5)} onBoton={guardar}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:24}}>¿Requirió soporte de nivel 2?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[[true,"⚠️","SÍ",B.red],[false,"✓","NO",B.green]].map(([val,ic,lbl,col])=>(
            <button key={String(val)} onClick={()=>setN2(val)}
              style={{padding:"28px 16px",border:`2px solid ${n2===val?col:"#2a2a2a"}`,
                background:n2===val?col+"22":"#0e0e14",color:n2===val?col:"#ccc",
                cursor:"pointer",borderRadius:2,textAlign:"center",transition:"all .15s"}}>
              <div style={{fontSize:44,marginBottom:8}}>{ic}</div>
              <div style={{fontSize:20,fontWeight:700}}>{lbl}</div>
            </button>
          ))}
        </div>
        {n2===true&&<div style={{marginTop:16,padding:"14px",background:"#1a0000",
          border:"1px solid #FF204033",fontSize:14,color:"#FF2040",lineHeight:1.7,borderRadius:2}}>
          ⚠ Se registrará como caso con soporte N2 para análisis estadístico posterior
        </div>}
      </PantallaAccion>
    );
    return null;
  };

  // ── INSTALACIÓN ─────────────────────────────────────────
  const FlujINS = () => {
    const [paso,setPaso] = useState(1);
    const [completa,setCompleta] = useState(null);
    const [pruebas,setPruebas] = useState({venta:false,anulacion:false,lote:false,devolucion:false});
    const [modelo,setModelo] = useState("");
    const [serie,setSerie] = useState("");
    const [obs,setObs] = useState("");
    const [showScan,setScan] = useState(false);
    const [saving,setSaving] = useState(false);

    const PRUEBAS_LIST = [
      {id:"venta",     label:"Prueba de Venta exitosa"},
      {id:"anulacion", label:"Prueba de Anulación exitosa"},
      {id:"lote",      label:"Prueba de Cierre de Lote exitoso"},
      {id:"devolucion",label:"Prueba de Devolución exitosa"},
    ];
    const todasOk = Object.values(pruebas).every(Boolean);

    const guardar = async() => {
      setSaving(true);
      await onGuardar({
        estado:"FINALIZADO",
        resolvio: completa===true,
        cierre_completado: completa===true,
        cierre_modelo_terminal: modelo,
        cierre_serie_terminal: serie,
        cierre_descripcion_problema: completa===false ? obs : "Instalación completa con pruebas exitosas",
        cierre_at: new Date().toISOString(),
        ...(completa===false ? {obs_supervisor: obs} : {}),
      });
      setSaving(false);
    };

    if(paso===1) return (
      <PantallaAccion color={B.green} icono="📦" titulo="¿INSTALACIÓN COMPLETA?"
        subtitulo={caso.razon_social} pasoActual={1} totalPasos={completa===true?3:2}
        botonLabel="SIGUIENTE →" botonDisabled={completa===null}
        onVolver={onVolver} onBoton={()=>setPaso(2)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:24}}>
          ¿La instalación quedó completa?
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {[[true,"✅","SÍ, quedó completa",B.green],[false,"❌","NO quedó completa",B.red]].map(([val,ic,lbl,col])=>(
            <button key={String(val)} onClick={()=>setCompleta(val)}
              style={{padding:"24px 20px",border:`3px solid ${completa===val?col:"#2a2a2a"}`,
                background:completa===val?col+"22":"#0e0e14",color:completa===val?col:"#ccc",
                cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:18,transition:"all .15s"}}>
              <span style={{fontSize:44,flexShrink:0}}>{ic}</span>
              <span style={{fontSize:18,fontWeight:700}}>{lbl}</span>
            </button>
          ))}
        </div>
      </PantallaAccion>
    );

    // Si SÍ → pruebas básicas
    if(paso===2 && completa===true) return (
      <PantallaAccion color={B.green} icono="✅" titulo="PRUEBAS BÁSICAS"
        subtitulo={caso.razon_social} pasoActual={2} totalPasos={3}
        botonLabel="SIGUIENTE →" botonDisabled={!todasOk}
        onVolver={()=>setPaso(1)} onBoton={()=>setPaso(3)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:8}}>
          Confirmá que todas las pruebas fueron exitosas:
        </div>
        <div style={{fontSize:13,color:"#666",marginBottom:20}}>
          Tocá cada prueba para confirmarla
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {PRUEBAS_LIST.map(p=>(
            <button key={p.id} onClick={()=>setPruebas(prev=>({...prev,[p.id]:!prev[p.id]}))}
              style={{padding:"20px 18px",textAlign:"left",
                border:`2px solid ${pruebas[p.id]?B.green:"#2a2a2a"}`,
                background:pruebas[p.id]?"#001a0a":"#0e0e14",
                color:pruebas[p.id]?B.green:"#ccc",
                cursor:"pointer",borderRadius:2,
                display:"flex",alignItems:"center",gap:16,
                fontSize:16,transition:"all .15s"}}>
              <span style={{fontSize:28,flexShrink:0}}>{pruebas[p.id]?"✅":"○"}</span>
              {p.label}
            </button>
          ))}
        </div>
        {!todasOk&&<div style={{marginTop:16,fontSize:13,color:"#666",textAlign:"center"}}>
          Confirmá todas las pruebas para continuar
        </div>}
      </PantallaAccion>
    );

    // Si SÍ → modelo y serie
    if(paso===3 && completa===true) return (
      <>
        {showScan&&<EscanerBarras onScan={v=>{setSerie(v);setScan(false);}} onClose={()=>setScan(false)}/>}
        <PantallaAccion color={B.green} icono="🖥️" titulo="DATOS DEL EQUIPO"
          subtitulo={caso.razon_social} pasoActual={3} totalPasos={3}
          botonLabel="✓ FINALIZAR INSTALACIÓN" botonDisabled={!modelo||!serie.trim()}
          saving={saving} onVolver={()=>setPaso(2)} onBoton={guardar}>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#ccc",marginBottom:12}}>Modelo instalado</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {MODELOS_TERMINAL.map(m=>(
                  <button key={m} onClick={()=>setModelo(m)}
                    style={{padding:"16px 18px",border:`2px solid ${modelo===m?B.green:"#2a2a2a"}`,
                      background:modelo===m?"#001a0a":"#0e0e14",color:modelo===m?B.green:"#ccc",
                      cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:14,
                      fontSize:15,fontWeight:modelo===m?700:400,transition:"all .15s"}}>
                    <span style={{fontSize:20}}>{modelo===m?"◉":"○"}</span>{m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#ccc",marginBottom:10}}>Serie del equipo</div>
              <button onClick={()=>setScan(true)}
                style={{width:"100%",padding:"18px 0",marginBottom:12,background:"#001a33",
                  border:`2px solid ${B.blue}`,color:B.blue,cursor:"pointer",fontSize:16,fontWeight:700,
                  borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
                <span style={{fontSize:28}}>📷</span> ESCANEAR
              </button>
              <input className="field" placeholder="O escribí la serie..."
                value={serie} onChange={e=>setSerie(e.target.value)}
                style={{fontSize:18,padding:"16px",textAlign:"center",letterSpacing:".08em"}}/>
              {serie&&<div style={{marginTop:10,padding:"12px",background:"#001a0a",
                border:`1px solid ${B.green}44`,fontSize:15,color:B.green,textAlign:"center",borderRadius:2}}>
                ✓ <strong>{serie}</strong></div>}
            </div>
          </div>
        </PantallaAccion>
      </>
    );

    // Si NO → observaciones
    if(paso===2 && completa===false) return (
      <PantallaAccion color={B.red} icono="📝" titulo="OBSERVACIONES"
        subtitulo={caso.razon_social} pasoActual={2} totalPasos={2}
        botonLabel="✓ FINALIZAR" botonDisabled={!obs.trim()}
        saving={saving} onVolver={()=>setPaso(1)} onBoton={guardar}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:8}}>
          ¿Por qué no quedó completa?
        </div>
        <div style={{marginBottom:16,padding:"12px 14px",background:"#1a0000",
          border:"1px solid #FF204033",fontSize:13,color:"#FF6060",lineHeight:1.6,borderRadius:2}}>
          ⚠ Esta observación será visible para tu Supervisor
        </div>
        <textarea className="field" rows={7}
          placeholder="Describí el motivo por el cual la instalación no pudo completarse..."
          value={obs} onChange={e=>setObs(e.target.value)}
          style={{fontSize:16,resize:"none",lineHeight:1.7}}/>
      </PantallaAccion>
    );
    return null;
  };

  // ── RETIRO DE TERMINAL ──────────────────────────────────
  const FlujRET = () => {
    const [paso,setPaso] = useState(1);
    const [modelo,setModelo] = useState("");
    const [serie,setSerie] = useState("");
    const [accesorios,setAcc] = useState(null);
    const [remito,setRemito] = useState("");
    const [obs,setObs] = useState("");
    const [showScan,setScan] = useState(false);
    const [saving,setSaving] = useState(false);

    const guardar = async() => {
      setSaving(true);
      await onGuardar({
        estado:"FINALIZADO",
        resolvio: true,
        cierre_completado: true,
        cierre_modelo_terminal: modelo,
        cierre_serie_terminal: serie,
        cierre_descripcion_problema: `Retiro completado · Accesorios: ${accesorios?"SÍ":"NO"} · Remito: ${remito}${obs?` · Obs: ${obs}`:""}`,
        cierre_at: new Date().toISOString(),
      });
      setSaving(false);
    };

    if(paso===1) return (
      <PantallaAccion color={B.orange} icono="🔄" titulo="MODELO DEL EQUIPO"
        subtitulo={caso.razon_social} pasoActual={1} totalPasos={4}
        botonLabel="SIGUIENTE →" botonDisabled={!modelo}
        onVolver={onVolver} onBoton={()=>setPaso(2)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:20}}>¿Cuál es el modelo del equipo retirado?</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {MODELOS_TERMINAL.map(m=>(
            <button key={m} onClick={()=>setModelo(m)}
              style={{padding:"18px 18px",border:`2px solid ${modelo===m?B.orange:"#2a2a2a"}`,
                background:modelo===m?B.orangeDim:"#0e0e14",color:modelo===m?B.orange:"#ccc",
                cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:14,
                fontSize:16,fontWeight:modelo===m?700:400,transition:"all .15s"}}>
              <span style={{fontSize:22}}>{modelo===m?"◉":"○"}</span>{m}
            </button>
          ))}
        </div>
      </PantallaAccion>
    );

    if(paso===2) return (
      <>
        {showScan&&<EscanerBarras onScan={v=>{setSerie(v);setScan(false);}} onClose={()=>setScan(false)}/>}
        <PantallaAccion color={B.orange} icono="🔢" titulo="SERIE DEL EQUIPO"
          subtitulo={caso.razon_social} pasoActual={2} totalPasos={4}
          botonLabel="SIGUIENTE →" botonDisabled={!serie.trim()}
          onVolver={()=>setPaso(1)} onBoton={()=>setPaso(3)}>
          <button onClick={()=>setScan(true)}
            style={{width:"100%",padding:"22px 0",marginBottom:16,background:"#001a33",
              border:`2px solid ${B.blue}`,color:B.blue,cursor:"pointer",fontSize:17,fontWeight:700,
              borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
            <span style={{fontSize:32}}>📷</span> ESCANEAR CÓDIGO DE BARRAS
          </button>
          <input className="field" placeholder="O escribí la serie..."
            value={serie} onChange={e=>setSerie(e.target.value)}
            style={{fontSize:20,padding:"18px",textAlign:"center",letterSpacing:".1em"}}/>
          {serie&&<div style={{marginTop:14,padding:"14px",background:"#001a0a",
            border:`1px solid ${B.green}44`,fontSize:16,color:B.green,textAlign:"center",borderRadius:2}}>
            ✓ <strong>{serie}</strong></div>}
        </PantallaAccion>
      </>
    );

    if(paso===3) return (
      <PantallaAccion color={B.orange} icono="📦" titulo="ACCESORIOS Y REMITO"
        subtitulo={caso.razon_social} pasoActual={3} totalPasos={4}
        botonLabel="SIGUIENTE →" botonDisabled={accesorios===null||!remito.trim()}
        onVolver={()=>setPaso(2)} onBoton={()=>setPaso(4)}>
        <div style={{display:"flex",flexDirection:"column",gap:24}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#ccc",marginBottom:14}}>¿Devuelve accesorios?</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[[true,"SÍ",B.green,"📦"],[false,"NO",B.red,"✗"]].map(([val,lbl,col,ic])=>(
                <button key={String(val)} onClick={()=>setAcc(val)}
                  style={{padding:"22px 12px",border:`2px solid ${accesorios===val?col:"#2a2a2a"}`,
                    background:accesorios===val?col+"22":"#0e0e14",color:accesorios===val?col:"#ccc",
                    cursor:"pointer",borderRadius:2,textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:36,marginBottom:6}}>{ic}</div>
                  <div style={{fontSize:18,fontWeight:700}}>{lbl}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#ccc",marginBottom:10}}>Número de remito</div>
            <input className="field" type="number" placeholder="Ej: 00123456"
              value={remito} onChange={e=>setRemito(e.target.value)}
              style={{fontSize:22,padding:"18px",textAlign:"center",letterSpacing:".1em"}}/>
          </div>
        </div>
      </PantallaAccion>
    );

    if(paso===4) return (
      <PantallaAccion color={B.green} icono="📝" titulo="OBSERVACIONES"
        subtitulo={caso.razon_social} pasoActual={4} totalPasos={4}
        botonLabel="✓ FINALIZAR RETIRO" saving={saving}
        onVolver={()=>setPaso(3)} onBoton={guardar}>
        <div style={{fontSize:16,fontWeight:700,color:"#ccc",marginBottom:10}}>
          Observaciones adicionales (opcional)
        </div>
        <textarea className="field" rows={6}
          placeholder="Alguna observación adicional sobre el retiro..."
          value={obs} onChange={e=>setObs(e.target.value)}
          style={{fontSize:16,resize:"none",lineHeight:1.7}}/>
        <div style={{marginTop:16,padding:"14px 16px",background:B.deep,
          border:`1px solid ${B.border}`,fontSize:13,color:B.t3,lineHeight:1.8,borderRadius:2}}>
          <div>🔄 Modelo: <strong style={{color:B.orange}}>{modelo}</strong></div>
          <div>🔢 Serie: <strong style={{color:B.orange}}>{serie}</strong></div>
          <div>📦 Accesorios: <strong style={{color:accesorios?B.green:B.red}}>{accesorios?"SÍ":"NO"}</strong></div>
          <div>📋 Remito: <strong style={{color:B.orange}}>#{remito}</strong></div>
        </div>
      </PantallaAccion>
    );
    return null;
  };

  // ── VISITA TÉCNICA PROACTIVA ────────────────────────────
  const FlujVTP = () => {
    const [paso,setPaso] = useState(1);
    const [problema,setProblema] = useState(null);
    const [descProb,setDescProb] = useState("");
    const [obs,setObs] = useState("");
    const [seguimiento,setSeg] = useState(null);
    const [fechaSeg,setFechaSeg] = useState("");
    const [resolvio,setResolvio] = useState(null);
    const [modelo,setModelo] = useState("");
    const [serie,setSerie] = useState("");
    const [n2,setN2] = useState(null);
    const [showScan,setScan] = useState(false);
    const [saving,setSaving] = useState(false);

    const guardar = async() => {
      setSaving(true);
      const updates = {
        estado:"FINALIZADO",
        resolvio: resolvio===true,
        cierre_completado: true,
        cierre_descripcion_problema: problema ? descProb : "Sin problemas detectados",
        cierre_como_resolvio: resolvio===true ? "Resuelto en visita proactiva" : "",
        cierre_requirio_n2: n2||false,
        cierre_modelo_terminal: modelo||"",
        cierre_serie_terminal: serie||"",
        cierre_at: new Date().toISOString(),
      };
      await onGuardar(updates, seguimiento===true ? {
        generarST: true,
        fechaSeguimiento: fechaSeg,
      } : null);
      setSaving(false);
    };

    if(paso===1) return (
      <PantallaAccion color={B.purple} icono="👁" titulo="¿PROBLEMA DETECTADO?"
        subtitulo={caso.razon_social} pasoActual={1} totalPasos={5}
        botonLabel="SIGUIENTE →" botonDisabled={problema===null}
        onVolver={onVolver} onBoton={()=>setPaso(2)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:24}}>
          ¿Se detectó algún problema?
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {[[true,"⚠️","SÍ, detecté un problema",B.red],[false,"✅","NO, todo en orden",B.green]].map(([val,ic,lbl,col])=>(
            <button key={String(val)} onClick={()=>setProblema(val)}
              style={{padding:"24px 20px",border:`3px solid ${problema===val?col:"#2a2a2a"}`,
                background:problema===val?col+"22":"#0e0e14",color:problema===val?col:"#ccc",
                cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:18,transition:"all .15s"}}>
              <span style={{fontSize:44,flexShrink:0}}>{ic}</span>
              <span style={{fontSize:18,fontWeight:700}}>{lbl}</span>
            </button>
          ))}
        </div>
      </PantallaAccion>
    );

    if(paso===2) return (
      <PantallaAccion color={B.purple} icono="📋" titulo="OBSERVACIONES"
        subtitulo={caso.razon_social} pasoActual={2} totalPasos={5}
        botonLabel="SIGUIENTE →" botonDisabled={problema&&!descProb.trim()}
        onVolver={()=>setPaso(1)} onBoton={()=>setPaso(3)}>
        {problema&&(
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#ccc",marginBottom:10}}>Descripción del problema</div>
            <textarea className="field" rows={5}
              placeholder="Describí el problema detectado..."
              value={descProb} onChange={e=>setDescProb(e.target.value)}
              style={{fontSize:16,resize:"none",marginBottom:20}}/>
          </div>
        )}
        <div style={{fontSize:16,fontWeight:700,color:"#ccc",marginBottom:10}}>Observaciones generales (opcional)</div>
        <textarea className="field" rows={4}
          placeholder="Observaciones adicionales de la visita..."
          value={obs} onChange={e=>setObs(e.target.value)}
          style={{fontSize:16,resize:"none"}}/>
      </PantallaAccion>
    );

    if(paso===3) return (
      <PantallaAccion color={B.purple} icono="📅" titulo="¿REQUIERE SEGUIMIENTO?"
        subtitulo={caso.razon_social} pasoActual={3} totalPasos={5}
        botonLabel="SIGUIENTE →" botonDisabled={seguimiento===null||(seguimiento&&!fechaSeg)}
        onVolver={()=>setPaso(2)} onBoton={()=>setPaso(4)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:24}}>
          ¿El caso requiere un seguimiento con Servicio Técnico?
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
          {[[true,"🔧","SÍ, requiere ST",B.orange],[false,"✅","NO, caso cerrado",B.green]].map(([val,ic,lbl,col])=>(
            <button key={String(val)} onClick={()=>setSeg(val)}
              style={{padding:"22px 20px",border:`3px solid ${seguimiento===val?col:"#2a2a2a"}`,
                background:seguimiento===val?col+"22":"#0e0e14",color:seguimiento===val?col:"#ccc",
                cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:16,transition:"all .15s"}}>
              <span style={{fontSize:36,flexShrink:0}}>{ic}</span>
              <span style={{fontSize:17,fontWeight:700}}>{lbl}</span>
            </button>
          ))}
        </div>
        {seguimiento===true&&(
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"#ccc",marginBottom:10}}>Fecha de visita de ST</div>
            <input type="date" className="field"
              value={fechaSeg} onChange={e=>setFechaSeg(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={{fontSize:18,padding:"16px"}}/>
            {fechaSeg&&<div style={{marginTop:10,padding:"10px 14px",background:"#001a0a",
              border:`1px solid ${B.orange}44`,fontSize:14,color:B.orange,borderRadius:2}}>
              🔧 Se generará un caso ST para el {new Date(fechaSeg+"T12:00:00").toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long"})}
            </div>}
          </div>
        )}
      </PantallaAccion>
    );

    if(paso===4) return (
      <PantallaAccion color={B.purple} icono="✅" titulo="¿RESOLVIÓ EN LA VISITA?"
        subtitulo={caso.razon_social} pasoActual={4} totalPasos={5}
        botonLabel="SIGUIENTE →" botonDisabled={resolvio===null}
        onVolver={()=>setPaso(3)} onBoton={()=>setPaso(resolvio===true?5:99)}>
        <div style={{fontSize:17,fontWeight:700,color:"#ccc",marginBottom:24}}>
          ¿Resolviste el problema durante la visita?
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {[[true,"✅","SÍ, lo resolví en la visita",B.green],[false,"❌","NO, requiere más trabajo",B.red]].map(([val,ic,lbl,col])=>(
            <button key={String(val)} onClick={()=>setResolvio(val)}
              style={{padding:"24px 20px",border:`3px solid ${resolvio===val?col:"#2a2a2a"}`,
                background:resolvio===val?col+"22":"#0e0e14",color:resolvio===val?col:"#ccc",
                cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:18,transition:"all .15s"}}>
              <span style={{fontSize:44,flexShrink:0}}>{ic}</span>
              <span style={{fontSize:18,fontWeight:700}}>{lbl}</span>
            </button>
          ))}
        </div>
      </PantallaAccion>
    );

    // Si resolvió: modelo + serie + N2
    if(paso===5) return (
      <>
        {showScan&&<EscanerBarras onScan={v=>{setSerie(v);setScan(false);}} onClose={()=>setScan(false)}/>}
        <PantallaAccion color={B.green} icono="🖥️" titulo="DATOS DEL EQUIPO"
          subtitulo={caso.razon_social} pasoActual={5} totalPasos={5}
          botonLabel="✓ FINALIZAR VISITA" botonDisabled={!modelo||!serie.trim()||n2===null}
          saving={saving} onVolver={()=>setPaso(4)} onBoton={guardar}>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#ccc",marginBottom:10}}>Modelo del equipo</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {MODELOS_TERMINAL.map(m=>(
                  <button key={m} onClick={()=>setModelo(m)}
                    style={{padding:"14px 16px",border:`2px solid ${modelo===m?B.green:"#2a2a2a"}`,
                      background:modelo===m?"#001a0a":"#0e0e14",color:modelo===m?B.green:"#ccc",
                      cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:12,
                      fontSize:14,fontWeight:modelo===m?700:400,transition:"all .15s"}}>
                    <span style={{fontSize:18}}>{modelo===m?"◉":"○"}</span>{m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#ccc",marginBottom:10}}>Serie del equipo</div>
              <button onClick={()=>setScan(true)}
                style={{width:"100%",padding:"16px 0",marginBottom:10,background:"#001a33",
                  border:`2px solid ${B.blue}`,color:B.blue,cursor:"pointer",fontSize:15,fontWeight:700,
                  borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <span style={{fontSize:24}}>📷</span> ESCANEAR
              </button>
              <input className="field" placeholder="O escribí la serie..."
                value={serie} onChange={e=>setSerie(e.target.value)}
                style={{fontSize:18,padding:"14px",textAlign:"center"}}/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#ccc",marginBottom:12}}>¿Requirió soporte N2?</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[[true,"⚠️","SÍ",B.red],[false,"✓","NO",B.green]].map(([val,ic,lbl,col])=>(
                  <button key={String(val)} onClick={()=>setN2(val)}
                    style={{padding:"20px 12px",border:`2px solid ${n2===val?col:"#2a2a2a"}`,
                      background:n2===val?col+"22":"#0e0e14",color:n2===val?col:"#ccc",
                      cursor:"pointer",borderRadius:2,textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:32,marginBottom:6}}>{ic}</div>
                    <div style={{fontSize:16,fontWeight:700}}>{lbl}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PantallaAccion>
      </>
    );

    // Si NO resolvió en visita → finalizar directo
    if(paso===99) {
      guardar();
      return <div style={{position:"fixed",inset:0,background:"#050507",display:"flex",
        alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <Spin s={40}/><div style={{color:B.t2,fontSize:14}}>Guardando...</div>
      </div>;
    }
    return null;
  };

  // ── RENDER PRINCIPAL ────────────────────────────────────
  return (
    <>
      {esST  && <FlujST/>}
      {esINS && <FlujINS/>}
      {esRET && <FlujRET/>}
      {esVTP && <FlujVTP/>}
      {!esST&&!esINS&&!esRET&&!esVTP&&(
        // Flujo genérico para tipos no definidos
        <PantallaAccion color={B.green} icono="🏁" titulo="FINALIZAR CASO"
          subtitulo={caso.razon_social} pasoActual={1} totalPasos={1}
          botonLabel="✓ FINALIZAR" onVolver={onVolver}
          onBoton={()=>onGuardar({estado:"FINALIZADO",resolvio:true,cierre_completado:true,cierre_at:new Date().toISOString()})}>
          <div style={{fontSize:16,color:"#ccc",textAlign:"center",padding:"30px 0"}}>
            ¿Confirmás que el caso fue atendido?
          </div>
        </PantallaAccion>
      )}
    </>
  );
};

// ─── FUNCIONES DE GEOCODIFICACIÓN Y RUTA ─────────────────────
const geocodificarDireccion = async (direccion, departamento, localidad) => {
  if(!direccion) return {ok:false,lat:null,lng:null};
  try {
    const q = encodeURIComponent(`${direccion}${localidad?", "+localidad:""}${departamento?", "+departamento:""}, Uruguay`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=uy`,
      {headers:{"Accept-Language":"es","User-Agent":"BooleanApp/1.0"}});
    const data = await res.json();
    if(data?.length){
      return {ok:true, lat:parseFloat(data[0].lat), lng:parseFloat(data[0].lon)};
    }
    return {ok:false,lat:null,lng:null};
  } catch(e) {
    return {ok:false,lat:null,lng:null};
  }
};

const ordenarPorCercania = (base, paradas) => {
  if(!paradas.length) return [];
  if(!base?.lat) return paradas;
  // Algoritmo del vecino más cercano (nearest neighbor)
  const pendientes = [...paradas];
  const resultado = [];
  let actual = base;
  while(pendientes.length > 0){
    let minDist = Infinity;
    let minIdx = 0;
    pendientes.forEach((p, i) => {
      const dist = Math.sqrt(Math.pow(p.lat - actual.lat, 2) + Math.pow(p.lng - actual.lng, 2));
      if(dist < minDist){ minDist = dist; minIdx = i; }
    });
    resultado.push(pendientes[minIdx]);
    actual = pendientes[minIdx];
    pendientes.splice(minIdx, 1);
  }
  return resultado;
};

const calcularRutaORS = async (puntos) => {
  // Sin API key ORS — devuelve ruta aproximada con líneas rectas
  if(puntos.length < 2) return {ok:false};
  try {
    // Intentar con ORS si hay key en localStorage
    const orsKey = localStorage.getItem("ors_api_key");
    if(orsKey){
      const coords = puntos.map(p => [p.lng, p.lat]);
      const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":orsKey},
        body:JSON.stringify({coordinates:coords})
      });
      if(res.ok){
        const data = await res.json();
        const seg = data.features?.[0]?.properties?.segments;
        const totalKm = seg?.reduce((a,s)=>a+s.distance,0)/1000||0;
        const totalMin = seg?.reduce((a,s)=>a+s.duration,0)/60||0;
        const coords2d = data.features?.[0]?.geometry?.coordinates||[];
        const polyline = coords2d.map(([lng,lat])=>({lat,lng}));
        return {ok:true, polyline, totalKm:Math.round(totalKm*10)/10, totalMin:Math.round(totalMin)};
      }
    }
    // Fallback: línea recta entre puntos
    const polyline = puntos.map(p=>({lat:p.lat,lng:p.lng}));
    let totalKm = 0;
    for(let i=1;i<puntos.length;i++){
      const dlat = (puntos[i].lat-puntos[i-1].lat)*111;
      const dlng = (puntos[i].lng-puntos[i-1].lng)*111*Math.cos(puntos[i-1].lat*Math.PI/180);
      totalKm += Math.sqrt(dlat*dlat+dlng*dlng);
    }
    return {ok:true, polyline, totalKm:Math.round(totalKm*10)/10, totalMin:Math.round(totalKm*3), approx:true};
  } catch(e){
    return {ok:false};
  }
};

// ─── MAPA DE RUTA (Leaflet) ───────────────────────────────────
const MapaRuta = ({ base, paradas, polyline, destino }) => {
  const mapRef = useRef(null);
  const mapInstRef = useRef(null);
  const markersRef = useRef([]);
  const polyRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // Cargar Leaflet dinámicamente si no está cargado
    const initMap = () => {
      if (mapInstRef.current) return;
      const L = window.L;
      if (!L) return;
      const center = base?.lat ? [base.lat, base.lng] : [-32.5, -56.0];
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);
      map.setView(center, 10);
      mapInstRef.current = map;
    };

    if (!window.L) {
      // Cargar CSS de Leaflet
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      // Cargar JS de Leaflet
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  // Actualizar marcadores y polilínea
  useEffect(() => {
    const map = mapInstRef.current;
    const L = window.L;
    if (!map || !L) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (polyRef.current) map.removeLayer(polyRef.current);

    const bounds = [];

    // Marcador base
    if (base?.lat) {
      const icon = L.divIcon({
        html: `<div style="background:#FF6B00;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px #0008">🏠</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16], className: ""
      });
      const m = L.marker([base.lat, base.lng], { icon })
        .addTo(map).bindPopup("📍 Base operativa");
      markersRef.current.push(m);
      bounds.push([base.lat, base.lng]);
    }

    // Marcadores de paradas
    paradas.forEach((p, i) => {
      if (!p.lat) return;
      const color = p.prioridad === "CRITICA" ? "#FF2040" : p.prioridad === "ALTA" ? "#FF6B00" : "#00A8FF";
      const icon = L.divIcon({
        html: `<div style="background:${color};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;border:2px solid #fff;box-shadow:0 2px 8px #0008">${i + 1}</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15], className: ""
      });
      const m = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${p.razon_social}</b><br>${p.direccion}<br>${p.localidad}`);
      markersRef.current.push(m);
      bounds.push([p.lat, p.lng]);
    });

    // Polilínea de ruta
    if (polyline?.length > 1) {
      polyRef.current = L.polyline(
        polyline.map(p => [p.lat, p.lng]),
        { color: "#FF6B00", weight: 3, opacity: 0.8, dashArray: "6,4" }
      ).addTo(map);
    }

    // Marcador destino final (si es diferente a base)
    if (destino?.lat && destino.lat !== base?.lat) {
      const icon = L.divIcon({
        html: `<div style="background:#00D4B4;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px #0008">🏁</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16], className: ""
      });
      const m = L.marker([destino.lat, destino.lng], { icon })
        .addTo(map).bindPopup("🏁 Destino final");
      markersRef.current.push(m);
      bounds.push([destino.lat, destino.lng]);
    }

    // Ajustar vista
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [base, paradas, polyline]);

  return (
    <div ref={mapRef} style={{
      width: "100%", height: 340,
      background: "#0a0a14",
      position: "relative",
    }}/>
  );
};

const MiRutaDelDia = ({ user, toast, perfil }) => {
  const [casos,       setCasos]      = useState([]);
  const [tecnicos,    setTecnicos]   = useState([]);
  const [tecnicoSel,  setTecnicoSel] = useState(null);
  // Base y destino
  const [baseTxt,     setBaseTxt]    = useState("");
  const [destinoTxt,  setDestinoTxt] = useState("");
  const [destinoDif,  setDestinoDif] = useState(false); // destino diferente a base
  const [base,        setBase]       = useState({lat:null,lng:null,direccion:""});
  const [destino,     setDestino]    = useState({lat:null,lng:null,direccion:""});
  // Paradas y ruta
  const [paradas,     setParadas]    = useState([]);
  const [orden,       setOrden]      = useState([]);
  const [polyline,    setPolyline]   = useState([]);
  const [rutaInfo,    setRutaInfo]   = useState(null);
  // Estados UI
  const [loadingPage, setLoadingPage]= useState(true);
  const [calculando,  setCalculando] = useState(false);
  const [dragging,    setDragging]   = useState(null);
  const [dragOver,    setDragOver]   = useState(null);
  const [editBase,    setEditBase]   = useState(false);

  const hoy = new Date().toISOString().split("T")[0];
  const esRolTecnico  = perfil?.rol === "TECNICO";
  const esRolSuperior = !esRolTecnico;

  // Guardar orden de ruta en Supabase
  const guardarOrden = async (nuevasParadas, baseOp, destinoOp, destinoDifOp) => {
    const tecId = perfil?.auth_id || perfil?.id;
    const ordenIds = nuevasParadas.map(p=>p.id);
    await supabase.from("ruta_orden").upsert({
      tecnico_id: tecId,
      fecha: hoy,
      orden_casos: ordenIds,
      base_txt: baseOp||baseTxt,
      destino_txt: destinoOp||destinoTxt,
      destino_dif: destinoDifOp!==undefined?destinoDifOp:destinoDif,
      updated_at: new Date().toISOString(),
    }, {onConflict:"tecnico_id,fecha"});
  };

  // Cargar orden guardado del día
  const cargarOrdenGuardado = async (casosActivos) => {
    const tecId = perfil?.auth_id || perfil?.id;
    const {data} = await supabase.from("ruta_orden")
      .select("*").eq("tecnico_id", tecId).eq("fecha", hoy).maybeSingle();
    if(data?.orden_casos?.length) {
      // Restaurar base y destino
      if(data.base_txt) { setBaseTxt(data.base_txt); }
      if(data.destino_txt) { setDestinoTxt(data.destino_txt); setDestinoDif(data.destino_dif||false); }
      // Reordenar casos según orden guardado
      const ordenGuardado = data.orden_casos;
      const casosOrdenados = [
        ...ordenGuardado.map(id=>casosActivos.find(c=>c.id===id)).filter(Boolean),
        ...casosActivos.filter(c=>!ordenGuardado.includes(c.id))
      ];
      return {casosOrdenados, baseTxtGuardado:data.base_txt, destinoTxtGuardado:data.destino_txt, destinoDifGuardado:data.destino_dif};
    }
    return null;
  };

  useEffect(() => { if(perfil) cargarDatos(); }, [perfil]);

  const cargarDatos = async () => {
    setLoadingPage(true);
    try {
      if(esRolSuperior) {
        const { data: tecs } = await supabase.from("usuarios").select("*")
          .eq("rol","TECNICO").eq("activo",true);
        setTecnicos(tecs||[]);
        if(tecs?.length > 0) await cargarCasosTecnico(tecs[0]);
        else setLoadingPage(false);
      } else {
        // Restaurar base desde perfil si existe
        if(perfil?.base_operativa) {
          setBaseTxt(perfil.base_operativa);
          const coords = await geocodificarDireccion(perfil.base_operativa,"","");
          setBase({...coords, direccion:perfil.base_operativa});
        }
        await cargarCasosTecnico(perfil);
      }
    } catch(e) {
      toast("Error cargando datos: "+e.message);
    } finally {
      setLoadingPage(false);
    }
  };

  const cargarCasosTecnico = async (tec) => {
    setTecnicoSel(tec);
    try {
      const tecId = tec.auth_id || tec.id;
      const { data: c } = await supabase.from("casos").select("*")
        .eq("tecnico_id", tecId)
        .not("estado","in","(FINALIZADO,CANCELADO)")
        .order("created_at", {ascending:true});
      const casosActivos = c||[];
      setCasos(casosActivos);
      if(casosActivos.length > 0) {
        // Cargar orden guardado para técnico propio
        if(tec.id===perfil?.id || tec.auth_id===perfil?.auth_id){
          const guardado = await cargarOrdenGuardado(casosActivos);
          if(guardado){
            const {casosOrdenados,baseTxtGuardado,destinoTxtGuardado,destinoDifGuardado} = guardado;
            if(baseTxtGuardado){
              setBaseTxt(baseTxtGuardado);
              const coords = await geocodificarDireccion(baseTxtGuardado,"","");
              const nuevaBase = {...coords, direccion:baseTxtGuardado};
              setBase(nuevaBase);
              if(destinoTxtGuardado){ setDestinoTxt(destinoTxtGuardado); setDestinoDif(destinoDifGuardado||false); }
              const conCoords = await Promise.all(casosOrdenados.map(async cc=>{
                const c2 = await geocodificarDireccion(cc.direccion,cc.departamento,cc.localidad);
                return {...cc,...c2};
              }));
              const validos = conCoords.filter(cc=>cc.ok&&cc.lat);
              setParadas(validos); setOrden(validos.map((_,i)=>i));
              await calcularRuta(validos, nuevaBase);
              return;
            }
          }
        }
        await geocodificarYOrdenar(casosActivos, base);
      } else {
        setParadas([]); setOrden([]); setPolyline([]); setRutaInfo(null);
      }
    } catch(e) { console.error("Error cargando casos:", e); }
  };


  const geocodificarYOrdenar = async (listaCasos, baseCoords) => {
    setCalculando(true);
    try {
      const conCoords = await Promise.all(
        listaCasos.map(async c => {
          const coords = await geocodificarDireccion(c.direccion, c.departamento, c.localidad);
          return {...c, ...coords};
        })
      );
      const validos = conCoords.filter(c => c.ok && c.lat);
      const base_c  = baseCoords?.lat ? baseCoords : {lat:-34.9, lng:-56.18};
      const ordenados = ordenarPorCercania(base_c, validos);
      setParadas(ordenados);
      setOrden(ordenados.map((_,i) => i));
      await calcularRuta(ordenados, base_c);
    } catch(e) {
      console.error("Error geocodificando:", e);
    } finally {
      setCalculando(false);
    }
  };

  const calcularRuta = async (stops, baseCoords, destinoCoords) => {
    const b = baseCoords || base;
    const d = destinoCoords || (destinoDif ? destino : b);
    if(!b?.lat || stops.length === 0) return;
    const stopsValidos = stops.filter(s => s.lat);
    const puntos = [b, ...stopsValidos, d].filter(p => p?.lat);
    const resultado = await calcularRutaORS(puntos);
    if(resultado?.ok) {
      setPolyline(resultado.polyline);
      setRutaInfo({
        km: resultado.totalKm,
        min: resultado.totalMin,
        approx: resultado.approx||false,
      });
    }
  };

  // Confirmar base operativa
  const confirmarBase = async () => {
    if(!baseTxt.trim()) return;
    setCalculando(true);
    const coords = await geocodificarDireccion(baseTxt,"","");
    if(!coords.ok) { toast("No se encontró la dirección"); setCalculando(false); return; }
    const nuevaBase = {...coords, direccion:baseTxt};
    setBase(nuevaBase);
    setEditBase(false);
    // Guardar en perfil
    await supabase.from("usuarios").update({base_operativa:baseTxt})
      .eq("auth_id", user.id);
    // Recalcular ruta con nueva base
    if(paradas.length > 0) await calcularRuta(paradas, nuevaBase);
    await guardarOrden(paradas, baseTxt);
    setCalculando(false);
    toast("✓ Base operativa guardada");
  };

  // Confirmar destino final
  const confirmarDestino = async () => {
    if(!destinoTxt.trim()) return;
    setCalculando(true);
    const coords = await geocodificarDireccion(destinoTxt,"","");
    if(!coords.ok) { toast("No se encontró la dirección"); setCalculando(false); return; }
    const nuevoDestino = {...coords, direccion:destinoTxt};
    setDestino(nuevoDestino);
    if(paradas.length > 0) await calcularRuta(paradas, base, nuevoDestino);
    setCalculando(false);
    toast("✓ Destino final configurado");
  };

  // Reordenar manualmente con drag
  const handleDragStart = (i) => setDragging(i);
  const handleDragOver = (e, i) => { e.preventDefault(); setDragOver(i); };
  const handleDrop = async (i) => {
    if(dragging === null || dragging === i) { setDragging(null); setDragOver(null); return; }
    const nuevo = [...orden];
    const [item] = nuevo.splice(dragging, 1);
    nuevo.splice(i, 0, item);
    setOrden(nuevo);
    setDragging(null); setDragOver(null);
    const nuevasParadas = nuevo.map(idx => paradas[idx]);
    setParadas(nuevasParadas);
    setOrden(nuevasParadas.map((_,i)=>i));
    await calcularRuta(nuevasParadas, base);
    await guardarOrden(nuevasParadas);
  };

  // Optimizar ruta automáticamente
  const optimizarRuta = async () => {
    setCalculando(true);
    const reordenadas = ordenarPorCercania(base?.lat ? base : {lat:-34.9,lng:-56.18}, paradas);
    setParadas(reordenadas);
    setOrden(reordenadas.map((_,i)=>i));
    await calcularRuta(reordenadas, base);
    await guardarOrden(reordenadas);
    setCalculando(false);
    toast("✓ Ruta optimizada automáticamente");
  };

  const ESTADO_COL = {ASIGNADO:B.blue, EN_PROCESO:B.yellow, PAUSADO:B.purple, RECOORDINADO:B.teal};
  const TIPO_IC = {INSTALACION:"📦", SERVICIO_TECNICO:"🔧", RETIRO:"🔄", VISITA_PROACTIVA:"👁"};

  if(loadingPage) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:16}}>
      <Spin s={36}/>
      <div style={{fontSize:13,color:B.t3}}>Cargando módulo de ruta...</div>
    </div>
  );

  return (
    <div style={{padding:"0 0 40px"}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em"}}>MÓDULO DE</div>
        <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900}}>
          RUTA DEL DÍA
          {calculando&&<span style={{fontSize:11,color:B.orange,marginLeft:12,fontWeight:400}}>⟳ calculando...</span>}
        </h1>
      </div>

      {/* Selector de técnico (para superiores) */}
      {esRolSuperior && tecnicos.length > 0 && (
        <div style={{background:B.card,border:`1px solid ${B.border}`,padding:"12px 16px",marginBottom:16}}>
          <FL label="Ver ruta de técnico"/>
          <select className="field" value={tecnicoSel?.id||""}
            onChange={e=>{
              const tec=tecnicos.find(t=>t.id===e.target.value);
              if(tec) cargarCasosTecnico(tec);
            }}>
            {tecnicos.map(t=>(
              <option key={t.id} value={t.id}>{t.nombre} {t.apellido} — {t.empresa_codigo}</option>
            ))}
          </select>
        </div>
      )}

      {/* Configuración base y destino */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {/* Base operativa */}
        <div style={{background:B.card,border:`1px solid ${B.border}`,padding:"12px 16px"}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:8}}>
            🏠 BASE OPERATIVA (INICIO)
          </div>
          <div style={{display:"flex",gap:8}}>
            <input className="field" style={{flex:1,fontSize:14}}
              placeholder="Ej: Rivera 1234, Montevideo"
              value={baseTxt} onChange={e=>setBaseTxt(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&confirmarBase()}/>
            <Bb label={calculando?"...":"✓"} onClick={confirmarBase}
              disabled={!baseTxt.trim()||calculando} small
              color={base.lat?B.green:B.orange}/>
          </div>
          {base.lat&&(
            <div style={{fontSize:11,color:B.green,marginTop:6,display:"flex",alignItems:"center",gap:6}}>
              ✓ Geocodificado · {base.lat.toFixed(4)}, {base.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Destino final */}
        <div style={{background:B.card,border:`1px solid ${B.border}`,padding:"12px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{fontSize:10,color:B.teal,fontWeight:700,letterSpacing:".1em"}}>
              🏁 DESTINO FINAL
            </div>
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",marginLeft:"auto"}}>
              <input type="checkbox" checked={destinoDif}
                onChange={e=>setDestinoDif(e.target.checked)}
                style={{accentColor:B.teal,width:14,height:14}}/>
              <span style={{fontSize:11,color:B.t2}}>Diferente a base</span>
            </label>
          </div>
          {destinoDif ? (
            <>
              <div style={{display:"flex",gap:8}}>
                <input className="field" style={{flex:1,fontSize:14}}
                  placeholder="Dirección de destino final..."
                  value={destinoTxt} onChange={e=>setDestinoTxt(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&confirmarDestino()}/>
                <Bb label={calculando?"...":"✓"} onClick={confirmarDestino}
                  disabled={!destinoTxt.trim()||calculando} small color={B.teal}/>
              </div>
              {destino.lat&&(
                <div style={{fontSize:11,color:B.teal,marginTop:6}}>
                  ✓ Geocodificado · {destino.lat.toFixed(4)}, {destino.lng.toFixed(4)}
                </div>
              )}
            </>
          ) : (
            <div style={{fontSize:12,color:B.t3}}>
              La ruta termina en la base operativa
            </div>
          )}
        </div>
      </div>

      {/* Info de ruta */}
      {rutaInfo&&(
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[
            {label:"DISTANCIA",val:`${rutaInfo.km} km`,color:B.orange},
            {label:"TIEMPO EST.",val:`${rutaInfo.min} min`,color:B.blue},
            {label:"PARADAS",val:paradas.length,color:B.green},
          ].map(k=>(
            <div key={k.label} style={{flex:1,background:B.card,border:`1px solid ${B.border}`,
              padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".1em",marginBottom:4}}>{k.label}</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900,color:k.color}}>{k.val}</div>
            </div>
          ))}
        </div>
      )}
      {rutaInfo?.approx&&(
        <div style={{fontSize:10,color:B.t3,marginBottom:12,padding:"6px 12px",
          background:B.deep,border:`1px solid ${B.border}`}}>
          ⚠ Ruta aproximada (línea recta). Para rutas exactas configurá una API key de OpenRouteService.
        </div>
      )}

      {/* Mapa */}
      {paradas.length > 0 && (
        <div style={{background:B.card,border:`1px solid ${B.border}`,overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${B.border}`,fontSize:10,
            color:B.orange,fontWeight:700,letterSpacing:".1em"}}>◈ MAPA DE RUTA</div>
          <MapaRuta base={base} paradas={paradas} polyline={polyline} destino={destinoDif?destino:null}/>
        </div>
      )}

      {/* Lista de paradas con drag & drop */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,marginBottom:16}}>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${B.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em"}}>
            ◈ ORDEN DE PARADAS ({paradas.length})
          </div>
          {paradas.length > 1&&(
            <Bb label={calculando?"CALCULANDO...":"⚡ OPTIMIZAR RUTA"} onClick={optimizarRuta}
              disabled={calculando} small/>
          )}
        </div>
        {paradas.length === 0 ? (
          <div style={{padding:40,textAlign:"center",color:B.t3}}>
            <div style={{fontSize:32,marginBottom:10}}>🗺</div>
            <div style={{fontSize:13}}>Sin casos activos para rutear</div>
            <div style={{fontSize:11,marginTop:6}}>Los casos asignados aparecerán aquí automáticamente</div>
          </div>
        ) : (
          <div>
            {/* Base */}
            <div style={{padding:"10px 16px",background:B.orangeDim,
              borderBottom:`1px solid ${B.border}`,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:18}}>🏠</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:B.orange}}>BASE OPERATIVA</div>
                <div style={{fontSize:11,color:B.t3}}>{base.direccion||"Sin configurar"}</div>
              </div>
            </div>
            {/* Paradas */}
            {paradas.map((p, i) => (
              <div key={p.id}
                draggable
                onDragStart={()=>handleDragStart(i)}
                onDragOver={e=>handleDragOver(e,i)}
                onDrop={()=>handleDrop(i)}
                onDragEnd={()=>{setDragging(null);setDragOver(null);}}
                style={{
                  padding:"12px 16px",
                  borderBottom:`1px solid ${B.border}`,
                  display:"flex",gap:12,alignItems:"center",
                  background:dragOver===i?B.orangeDim:dragging===i?"#1a1a2a":B.card,
                  cursor:"grab",transition:"background .15s",
                  opacity:dragging===i?0.5:1,
                }}>
                {/* Número */}
                <div style={{
                  width:32,height:32,borderRadius:"50%",flexShrink:0,
                  background:({CRITICA:"#FF2040",ALTA:"#FF6B00",MEDIA:"#00A8FF",BAJA:"#00E87A"})[p.prioridad]||B.t3,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:900,color:"#050507",
                }}>
                  {i+1}
                </div>
                {/* Datos */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:B.t1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {TIPO_IC[p.tipo_proceso]||"◈"} {p.razon_social}
                  </div>
                  <div style={{fontSize:11,color:B.t2,marginTop:2}}>
                    📍 {p.direccion}{p.localidad?` · ${p.localidad}`:""}
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                    <Tg label={p.estado} color={ESTADO_COL[p.estado]||B.t3}/>
                    {p.franja_horaria&&<span style={{fontSize:10,color:"#CC7700",fontWeight:600}}>🕐 {p.franja_horaria}</span>}
                    {!p.lat&&<span style={{fontSize:10,color:B.red}}>⚠ Sin coordenadas</span>}
                  </div>
                </div>
                {/* Handle drag */}
                <div style={{color:B.t3,fontSize:18,flexShrink:0,cursor:"grab"}}>⠿</div>
              </div>
            ))}
            {/* Destino */}
            <div style={{padding:"10px 16px",background:destinoDif&&destino.lat?"#001a1a":B.deep,
              display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:18}}>🏁</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:B.teal}}>DESTINO FINAL</div>
                <div style={{fontSize:11,color:B.t3}}>
                  {destinoDif&&destino.lat ? destino.direccion : base.direccion||"Base operativa"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones drag */}
      {paradas.length > 1&&(
        <div style={{fontSize:11,color:B.t3,textAlign:"center",padding:"8px 0"}}>
          ⠿ Arrastrá las paradas para reordenarlas manualmente
        </div>
      )}
    </div>
  );
};

// ─── COMUNICACIONES ──────────────────────────────────────
const Comunicaciones=({user,perfil,toast})=>{
  const [canales,    setCanales]    = useState([]);
  const [canalAct,   setCanalAct]   = useState(null);
  const [mensajes,   setMensajes]   = useState([]);
  const [texto,      setTexto]      = useState("");
  const [loading,    setLoading]    = useState(true);
  const [enviando,   setEnviando]   = useState(false);
  const [usuarios,   setUsuarios]   = useState([]);
  const [noLeidos,   setNoLeidos]   = useState({}); // {canal_id: count}
  const [vistaMovil, setVistaMovil] = useState("lista"); // lista | chat
  const mensajesEndRef = useRef(null);
  const subRef = useRef(null);
  const isMobile = useMobile();

  const rol    = perfil?.rol;
  const empresa= perfil?.empresa_codigo;
  const miId   = perfil?.id;
  const miNombre = `${perfil?.nombre||""} ${perfil?.apellido||""}`.trim();

  useEffect(()=>{
    supabase.from("usuarios").select("*").eq("activo",true)
      .then(({data})=>setUsuarios(data||[]));
  },[]);

  useEffect(()=>{
    if(!perfil||!usuarios.length) return;
    construirCanales();
  },[perfil,usuarios]);

  const canalPrivadoId=(id1,id2)=>{
    return `privado_${[id1,id2].sort().join("_")}`;
  };

  const construirCanales=()=>{
    const lista=[];
    // Grupos por empresa
    if(rol==="DIRECTOR"){
      EMPRESAS.forEach(e=>{
        const miembros=usuarios.filter(u=>u.empresa_codigo===e.codigo);
        if(miembros.length>0) lista.push({
          id:`grupo_${e.codigo}`,tipo:"grupo",
          nombre:`🏢 Equipo ${e.nombre}`,empresa:e.codigo,
          color:e.color,miembros:miembros.length,
        });
      });
    } else {
      const empData=EMPRESAS.find(e=>e.codigo===empresa);
      const miembros=usuarios.filter(u=>u.empresa_codigo===empresa);
      if(miembros.length>0) lista.push({
        id:`grupo_${empresa}`,tipo:"grupo",
        nombre:`🏢 Equipo ${empData?.nombre||empresa}`,
        empresa,color:empData?.color||B.orange,miembros:miembros.length,
      });
    }
    // Canales privados según rol
    if(rol==="DIRECTOR"){
      usuarios.filter(u=>u.rol==="REGIONAL").forEach(reg=>{
        lista.push({id:canalPrivadoId(miId,reg.id),tipo:"privado",
          nombre:`${reg.nombre} ${reg.apellido}`,
          subtitulo:`Regional · ${reg.empresa_codigo}`,contraparte:reg});
      });
    }
    if(rol==="REGIONAL"){
      const dir=usuarios.find(u=>u.rol==="DIRECTOR");
      if(dir) lista.push({id:canalPrivadoId(miId,dir.id),tipo:"privado",
        nombre:`${dir.nombre} ${dir.apellido}`,subtitulo:"Director Operativo",contraparte:dir});
      usuarios.filter(u=>u.rol==="SUPERVISOR"&&u.empresa_codigo===empresa).forEach(sup=>{
        lista.push({id:canalPrivadoId(miId,sup.id),tipo:"privado",
          nombre:`${sup.nombre} ${sup.apellido}`,subtitulo:"Supervisor",contraparte:sup});
      });
    }
    if(rol==="SUPERVISOR"){
      const reg=usuarios.find(u=>u.rol==="REGIONAL"&&u.empresa_codigo===empresa);
      if(reg) lista.push({id:canalPrivadoId(miId,reg.id),tipo:"privado",
        nombre:`${reg.nombre} ${reg.apellido}`,subtitulo:"Representante Regional",contraparte:reg});
      usuarios.filter(u=>u.rol==="TECNICO"&&u.supervisor_id===miId).forEach(tec=>{
        lista.push({id:canalPrivadoId(miId,tec.id),tipo:"privado",
          nombre:`${tec.nombre} ${tec.apellido}`,subtitulo:"Técnico de campo",contraparte:tec});
      });
    }
    if(rol==="TECNICO"){
      const sup=usuarios.find(u=>u.id===perfil?.supervisor_id);
      if(sup) lista.push({id:canalPrivadoId(miId,sup.id),tipo:"privado",
        nombre:`${sup.nombre} ${sup.apellido}`,subtitulo:"Tu Supervisor",contraparte:sup});
    }
    setCanales(lista);
    // Cargar contadores de no leídos
    cargarNoLeidos(lista);
    setLoading(false);
  };

  const cargarNoLeidos=async(lista)=>{
    const storageKey=`boolean_chat_leido_${miId}`;
    let ultimosLeidos={};
    try{ ultimosLeidos=JSON.parse(localStorage.getItem(storageKey)||"{}"); }catch{}
    const counts={};
    for(const c of lista){
      const {count}=await supabase.from("mensajes_chat")
        .select("*",{count:"exact",head:true})
        .eq("canal_id",c.id)
        .neq("autor_id",miId)
        .gt("created_at",ultimosLeidos[c.id]||"2000-01-01");
      counts[c.id]=count||0;
    }
    setNoLeidos(counts);
  };

  const marcarLeido=(canalId)=>{
    const storageKey=`boolean_chat_leido_${miId}`;
    let ultimosLeidos={};
    try{ ultimosLeidos=JSON.parse(localStorage.getItem(storageKey)||"{}"); }catch{}
    ultimosLeidos[canalId]=new Date().toISOString();
    try{ localStorage.setItem(storageKey,JSON.stringify(ultimosLeidos)); }catch{}
    setNoLeidos(prev=>({...prev,[canalId]:0}));
  };

  const abrirCanal=async(canal)=>{
    setCanalAct(canal);
    if(isMobile) setVistaMovil("chat");
    // Cancelar sub anterior
    if(subRef.current){ supabase.removeChannel(subRef.current); subRef.current=null; }
    // Cargar mensajes
    const {data}=await supabase.from("mensajes_chat")
      .select("*").eq("canal_id",canal.id)
      .order("created_at",{ascending:true}).limit(100);
    setMensajes(data||[]);
    marcarLeido(canal.id);
    setTimeout(()=>mensajesEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
    // Suscripción realtime
    const sub=supabase.channel(`chat_${canal.id}_${Date.now()}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",
        table:"mensajes_chat",filter:`canal_id=eq.${canal.id}`},
        payload=>{
          setMensajes(prev=>{
            if(prev.find(m=>m.id===payload.new.id)) return prev;
            return [...prev,payload.new];
          });
          marcarLeido(canal.id);
        }
      ).subscribe();
    subRef.current=sub;
  };

  useEffect(()=>{
    mensajesEndRef.current?.scrollIntoView({behavior:"smooth"});
  },[mensajes]);

  const enviar=async()=>{
    if(!texto.trim()||!canalAct||enviando) return;
    setEnviando(true);
    const msg={
      canal_id:canalAct.id,
      tipo_canal:canalAct.tipo,
      autor_id:miId,
      autor_email:user?.email,
      autor_nombre:miNombre,
      texto:texto.trim(),
      created_at:new Date().toISOString(),
    };
    // Optimistic update
    const tmpId=`tmp_${Date.now()}`;
    setMensajes(prev=>[...prev,{...msg,id:tmpId}]);
    setTexto("");
    setTimeout(()=>mensajesEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
    await supabase.from("mensajes_chat").insert(msg);
    setEnviando(false);
  };

  const totalNoLeidos=Object.values(noLeidos).reduce((a,b)=>a+b,0);
  const ROL_COLOR_MAP={DIRECTOR:B.orange,REGIONAL:B.blue,SUPERVISOR:B.purple,TECNICO:B.green};

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh"}}><Spin s={36}/></div>;

  // ── PANEL LISTA DE CANALES ───────────────────────────────
  const PanelLista=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${B.border}`,background:B.panel,flexShrink:0}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:B.orange}}>
          💬 COMUNICACIONES
          {totalNoLeidos>0&&<span style={{
            marginLeft:8,background:B.red,color:"#fff",
            borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:900,
          }}>{totalNoLeidos}</span>}
        </div>
        <div style={{fontSize:10,color:B.t3,marginTop:2}}>{canales.length} canales</div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {/* Grupos */}
        {canales.filter(c=>c.tipo==="grupo").length>0&&(
          <div>
            <div style={{padding:"8px 14px 4px",fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".1em"}}>GRUPOS</div>
            {canales.filter(c=>c.tipo==="grupo").map(c=>{
              const nl=noLeidos[c.id]||0;
              return(
                <button key={c.id} onClick={()=>abrirCanal(c)}
                  style={{width:"100%",padding:"12px 16px",textAlign:"left",
                    background:canalAct?.id===c.id?B.orangeDim:"transparent",
                    border:"none",borderLeft:`3px solid ${canalAct?.id===c.id?B.orange:"transparent"}`,
                    cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,
                    background:c.color+"22",border:`2px solid ${c.color}`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏢</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,
                      color:canalAct?.id===c.id?B.orange:B.t1,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nombre}</div>
                    <div style={{fontSize:10,color:B.t3}}>{c.miembros} miembros</div>
                  </div>
                  {nl>0&&<span style={{background:B.orange,color:"#050507",borderRadius:10,
                    padding:"2px 7px",fontSize:11,fontWeight:900,flexShrink:0}}>{nl}</span>}
                </button>
              );
            })}
          </div>
        )}
        {/* Privados */}
        {canales.filter(c=>c.tipo==="privado").length>0&&(
          <div>
            <div style={{padding:"8px 14px 4px",fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".1em"}}>MENSAJES DIRECTOS</div>
            {canales.filter(c=>c.tipo==="privado").map(c=>{
              const nl=noLeidos[c.id]||0;
              const rolColor=ROL_COLOR_MAP[c.contraparte?.rol]||B.t3;
              const initials=`${(c.contraparte?.nombre||"?")[0]}${(c.contraparte?.apellido||"?")[0]}`.toUpperCase();
              return(
                <button key={c.id} onClick={()=>abrirCanal(c)}
                  style={{width:"100%",padding:"12px 16px",textAlign:"left",
                    background:canalAct?.id===c.id?B.orangeDim:"transparent",
                    border:"none",borderLeft:`3px solid ${canalAct?.id===c.id?B.orange:"transparent"}`,
                    cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <div style={{width:40,height:40,borderRadius:"50%",
                      background:`${rolColor}22`,border:`2px solid ${rolColor}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:13,fontWeight:900,color:rolColor,fontFamily:"'Orbitron',sans-serif"}}>
                      {initials}
                    </div>
                    {nl>0&&<span style={{position:"absolute",top:-4,right:-4,
                      background:B.red,color:"#fff",borderRadius:"50%",
                      width:18,height:18,fontSize:10,fontWeight:900,
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {nl>9?"9+":nl}
                    </span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:nl>0?700:600,
                      color:canalAct?.id===c.id?B.orange:nl>0?B.t1:B.t2,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nombre}</div>
                    <div style={{fontSize:10,color:B.t3}}>{c.subtitulo}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {canales.length===0&&(
          <div style={{padding:24,textAlign:"center",color:B.t3,fontSize:12}}>Sin canales disponibles</div>
        )}
      </div>
    </div>
  );

  // ── PANEL CHAT ───────────────────────────────────────────
  const PanelChat=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Header */}
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.border}`,
        display:"flex",alignItems:"center",gap:12,background:B.panel,flexShrink:0}}>
        {isMobile&&(
          <button onClick={()=>{setVistaMovil("lista");setCanalAct(null);}}
            style={{background:"none",border:`1px solid ${B.border}`,color:B.t2,
              cursor:"pointer",padding:"8px 14px",fontSize:14,borderRadius:2,flexShrink:0}}>
            ←
          </button>
        )}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:B.t1,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {canalAct?.nombre}
          </div>
          <div style={{fontSize:10,color:B.t3}}>
            {canalAct?.tipo==="grupo"?`${canalAct?.miembros} miembros`:canalAct?.subtitulo}
          </div>
        </div>
      </div>
      {/* Mensajes */}
      <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
        {mensajes.length===0&&(
          <div style={{textAlign:"center",color:B.t3,padding:40,fontSize:13}}>
            ¡Empezá la conversación!
          </div>
        )}
        {mensajes.map(m=>{
          const esMio=m.autor_id===miId;
          const usu=usuarios.find(u=>u.id===m.autor_id);
          const rolColor=ROL_COLOR_MAP[usu?.rol]||B.t3;
          return(
            <div key={m.id} style={{display:"flex",justifyContent:esMio?"flex-end":"flex-start",gap:8}}>
              {!esMio&&(
                <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,
                  background:`${rolColor}22`,border:`1px solid ${rolColor}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:900,color:rolColor,alignSelf:"flex-end"}}>
                  {(m.autor_nombre||"?")[0]}
                </div>
              )}
              <div style={{maxWidth:"75%"}}>
                {!esMio&&<div style={{fontSize:10,color:rolColor,fontWeight:700,marginBottom:3,paddingLeft:4}}>
                  {m.autor_nombre||m.autor_email}
                </div>}
                <div style={{
                  padding:"10px 14px",
                  background:esMio?B.orange+"33":B.card,
                  border:`1px solid ${esMio?B.orange+"55":B.border}`,
                  borderRadius:esMio?"16px 16px 4px 16px":"16px 16px 16px 4px",
                  fontSize:15,color:B.t1,lineHeight:1.5,
                  opacity:m.id?.startsWith("tmp_")?0.7:1,
                }}>
                  {m.texto}
                </div>
                <div style={{fontSize:9,color:B.t3,marginTop:3,
                  textAlign:esMio?"right":"left",paddingLeft:4,paddingRight:4}}>
                  {new Date(m.created_at).toLocaleTimeString("es-UY",
                    {hour:"2-digit",minute:"2-digit",hour12:false})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={mensajesEndRef}/>
      </div>
      {/* Input */}
      <div style={{padding:"10px 12px",borderTop:`1px solid ${B.border}`,
        display:"flex",gap:8,background:B.panel,flexShrink:0}}>
        <input className="field" style={{flex:1,fontSize:15,padding:"12px 14px"}}
          placeholder="Escribí un mensaje..."
          value={texto} onChange={e=>setTexto(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&enviar()}
          disabled={enviando}/>
        <button onClick={enviar} disabled={!texto.trim()||enviando}
          style={{padding:"0 18px",background:texto.trim()?B.orange:"#333",
            border:"none",cursor:texto.trim()?"pointer":"not-allowed",
            color:texto.trim()?"#050507":"#666",fontWeight:900,fontSize:20,
            borderRadius:2,flexShrink:0,minWidth:50}}>
          ➤
        </button>
      </div>
    </div>
  );

  // ── LAYOUT ───────────────────────────────────────────────
  if(isMobile){
    return (
      <div style={{height:"calc(100vh - 80px)",display:"flex",flexDirection:"column"}}>
        {vistaMovil==="lista" ? <PanelLista/> : <PanelChat/>}
      </div>
    );
  }

  return (
    <div style={{display:"flex",height:"calc(100vh - 120px)",
      border:`1px solid ${B.border}`,background:B.void}}>
      <div style={{width:280,flexShrink:0,borderRight:`1px solid ${B.border}`}}>
        <PanelLista/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        {canalAct ? <PanelChat/> : (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",
            height:"100%",flexDirection:"column",gap:14,color:B.t3}}>
            <div style={{fontSize:48}}>💬</div>
            <div style={{fontSize:14}}>Seleccioná un canal para comenzar</div>
          </div>
        )}
      </div>
    </div>
  );
};

const Usuarios=({user,perfil,toast,casos})=>{
  const [usuarios,  setUsuarios]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editando,  setEditando]  = useState(null); // null | "nuevo" | usuario
  const [filtroRol, setFiltroRol] = useState("ALL");
  const [search,    setSearch]    = useState("");
  const [form, setForm] = useState({
    nombre:"", apellido:"", email:"", rol:"TECNICO",
    empresa_codigo:"", supervisor_id:"", activo:true,
  });

  const esDirector   = perfil?.rol==="DIRECTOR";
  const esRegional   = perfil?.rol==="REGIONAL";
  const esSupervisor = perfil?.rol==="SUPERVISOR";
  const soloLectura  = esSupervisor;

  useEffect(()=>{ cargar(); },[]);

  const cargar=async()=>{
    setLoading(true);
    let q = supabase.from("usuarios").select("*").order("empresa_codigo").order("rol");
    if(esRegional||esSupervisor){
      q = q.eq("empresa_codigo", perfil.empresa_codigo);
    }
    const{data}=await q;
    setUsuarios(data||[]);
    setLoading(false);
  };

  const supervisores = usuarios.filter(u=>u.rol==="SUPERVISOR"&&u.activo);
  const tecnicos     = usuarios.filter(u=>u.rol==="TECNICO");

  const fil = usuarios.filter(u=>{
    if(filtroRol!=="ALL"&&u.rol!==filtroRol) return false;
    if(search){
      const q=search.toLowerCase();
      return (u.nombre||"").toLowerCase().includes(q)||
             (u.apellido||"").toLowerCase().includes(q)||
             (u.email||"").toLowerCase().includes(q);
    }
    return true;
  });

  const s=(k,v)=>setForm(f=>({...f,[k]:v}));

  const abrirNuevo=()=>{
    setForm({nombre:"",apellido:"",email:"",rol:"TECNICO",
      empresa_codigo:esRegional?perfil.empresa_codigo:"",
      supervisor_id:"",activo:true});
    setEditando("nuevo");
  };

  const abrirEditar=(u)=>{
    setForm({nombre:u.nombre||"",apellido:u.apellido||"",
      email:u.email||"",rol:u.rol||"TECNICO",
      empresa_codigo:u.empresa_codigo||"",
      supervisor_id:u.supervisor_id||"",activo:u.activo!==false});
    setEditando(u);
  };

  const guardar=async()=>{
    if(editando==="nuevo"){
      // Crear usuario en Supabase Auth via Admin API no disponible en frontend
      // Insertamos en tabla usuarios — el email se usa para login manual
      const{error}=await supabase.from("usuarios").insert({
        ...form,
        created_at:new Date().toISOString(),
      });
      if(error){ toast("Error: "+error.message); return; }
      toast("✓ Usuario creado. Pedile que se registre con ese email.");
    } else {
      const{error}=await supabase.from("usuarios").update({
        nombre:form.nombre, apellido:form.apellido,
        rol:form.rol, empresa_codigo:form.empresa_codigo,
        supervisor_id:form.supervisor_id||null,
        activo:form.activo, updated_at:new Date().toISOString(),
      }).eq("id",editando.id);
      if(error){ toast("Error: "+error.message); return; }
      toast("✓ Usuario actualizado");
    }
    await cargar(); setEditando(null);
  };

  const toggleActivo=async(u)=>{
    await supabase.from("usuarios").update({activo:!u.activo}).eq("id",u.id);
    await cargar();
    toast(u.activo?"Usuario desactivado":"Usuario activado");
  };

  const asignarSupervisor=async(tecnicoId, supId)=>{
    await supabase.from("usuarios").update({
      supervisor_id: supId||null
    }).eq("id",tecnicoId);
    await cargar();
    toast("✓ Supervisor asignado");
  };

  const ROL_COLOR={DIRECTOR:B.orange,REGIONAL:B.blue,SUPERVISOR:B.purple,TECNICO:B.green};
  const ROL_ICON={DIRECTOR:"👑",REGIONAL:"🏢",SUPERVISOR:"👔",TECNICO:"🔧"};

  // ── FORMULARIO ─────────────────────────────────────────
  if(editando&&!soloLectura) return(
    <div style={{maxWidth:600}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={()=>setEditando(null)}
          style={{background:"none",border:`1px solid ${B.border}`,color:B.t2,
            cursor:"pointer",padding:"8px 16px",fontSize:13,fontFamily:"'Orbitron',sans-serif"}}>
          ← VOLVER
        </button>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:900,color:B.t1}}>
          {editando==="nuevo"?"NUEVO USUARIO":`EDITANDO: ${editando.nombre} ${editando.apellido}`}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><FL label="Nombre" req/>
            <input className="field" value={form.nombre}
              onChange={e=>s("nombre",e.target.value)} placeholder="Nombre"/></div>
          <div><FL label="Apellido" req/>
            <input className="field" value={form.apellido}
              onChange={e=>s("apellido",e.target.value)} placeholder="Apellido"/></div>
        </div>

        <div><FL label="Email" req/>
          <input className="field" type="email" value={form.email}
            onChange={e=>s("email",e.target.value)}
            placeholder="usuario@boolean.uy"
            disabled={editando!=="nuevo"}
            style={{opacity:editando!=="nuevo"?0.5:1}}/></div>

        <div><FL label="Rol" req/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {["DIRECTOR","REGIONAL","SUPERVISOR","TECNICO"].map(r=>(
              <button key={r} onClick={()=>s("rol",r)}
                style={{padding:"12px 10px",border:`2px solid ${form.rol===r?ROL_COLOR[r]:B.border}`,
                  background:form.rol===r?ROL_COLOR[r]+"22":B.deep,
                  color:form.rol===r?ROL_COLOR[r]:B.t2,
                  cursor:"pointer",fontSize:13,fontWeight:700,borderRadius:2,
                  transition:"all .15s"}}>
                {ROL_ICON[r]} {r}
              </button>
            ))}
          </div>
        </div>

        <div><FL label="Empresa" req/>
          <select className="field" value={form.empresa_codigo}
            onChange={e=>s("empresa_codigo",e.target.value)}
            disabled={esRegional}>
            <option value="">Seleccioná una empresa...</option>
            {EMPRESAS.map(e=>(
              <option key={e.codigo} value={e.codigo}>{e.nombre}</option>
            ))}
          </select>
        </div>

        {form.rol==="TECNICO"&&(
          <div><FL label="Supervisor asignado"/>
            <select className="field" value={form.supervisor_id}
              onChange={e=>s("supervisor_id",e.target.value)}>
              <option value="">Sin supervisor asignado</option>
              {supervisores
                .filter(su=>!form.empresa_codigo||su.empresa_codigo===form.empresa_codigo)
                .map(su=>(
                  <option key={su.id} value={su.id}>
                    {su.nombre} {su.apellido} ({su.empresa_codigo})
                  </option>
                ))}
            </select>
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
          background:B.card,border:`1px solid ${B.border}`,borderRadius:2}}>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:B.t1}}>Usuario activo</div>
            <div style={{fontSize:11,color:B.t3}}>Puede iniciar sesión en el sistema</div>
          </div>
          <button onClick={()=>s("activo",!form.activo)}
            style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",
              background:form.activo?B.green:B.t3,position:"relative",transition:"background .2s"}}>
            <div style={{position:"absolute",top:3,left:form.activo?26:3,
              width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
          </button>
        </div>

        <div style={{padding:"12px 14px",background:B.orangeDim,
          border:`1px solid ${B.orange}22`,fontSize:12,color:B.t2,lineHeight:1.6}}>
          ℹ Para que el usuario pueda iniciar sesión, debés crearlo también en
          <strong style={{color:B.orange}}> Supabase → Authentication → Users</strong> con
          el mismo email y contraseña <strong style={{color:B.orange}}>boolean</strong>.
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <Bb label="CANCELAR" onClick={()=>setEditando(null)} ghost small color={B.t2}/>
          <Bb label="GUARDAR" onClick={guardar}
            disabled={!form.nombre.trim()||!form.apellido.trim()||!form.email.trim()||!form.empresa_codigo}/>
        </div>
      </div>
    </div>
  );

  // ── LISTA ─────────────────────────────────────────────
  return(
    <div style={{padding:"0 0 40px"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em"}}>GESTIÓN DE</div>
          <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900}}>USUARIOS</h1>
          <div style={{fontSize:11,color:B.t2,marginTop:2}}>{fil.length} de {usuarios.length} usuarios</div>
        </div>
        {!soloLectura&&<Bb label="+ NUEVO USUARIO" onClick={abrirNuevo}/>}
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <input className="field" placeholder="🔍 Buscar nombre, email..."
          style={{flex:2,minWidth:180}} value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="field" style={{flex:1,minWidth:120}}
          value={filtroRol} onChange={e=>setFiltroRol(e.target.value)}>
          <option value="ALL">Todos los roles</option>
          {["DIRECTOR","REGIONAL","SUPERVISOR","TECNICO"].map(r=>(
            <option key={r} value={r}>{ROL_ICON[r]} {r}</option>
          ))}
        </select>
      </div>

      {/* Lista de usuarios */}
      {loading?<div style={{textAlign:"center",padding:40}}><Spin/></div>:(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {fil.map(u=>{
            const sup = usuarios.find(s=>s.id===u.supervisor_id);
            const casosActivos = casos.filter(c=>c.tecnico_id===(u.auth_id||u.id)&&
              !["FINALIZADO","CANCELADO"].includes(c.estado||"")).length;
            const initials = `${(u.nombre||"?")[0]}${(u.apellido||"?")[0]}`.toUpperCase();
            return(
              <div key={u.id} style={{
                background:B.card,
                border:`1px solid ${u.activo?B.border:"#1a1a1a"}`,
                borderLeft:`3px solid ${u.activo?ROL_COLOR[u.rol]||B.t3:"#333"}`,
                padding:"14px 16px",
                opacity:u.activo?1:0.6,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  {/* Avatar */}
                  <div style={{width:42,height:42,borderRadius:"50%",flexShrink:0,
                    background:`linear-gradient(135deg,${ROL_COLOR[u.rol]||B.t3}66,${ROL_COLOR[u.rol]||B.t3}22)`,
                    border:`2px solid ${ROL_COLOR[u.rol]||B.t3}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:14,fontWeight:900,color:ROL_COLOR[u.rol]||B.t1,
                    fontFamily:"'Orbitron',sans-serif"}}>
                    {initials}
                  </div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:700,color:B.t1}}>
                        {u.nombre} {u.apellido}
                      </span>
                      <Tg label={`${ROL_ICON[u.rol]} ${u.rol}`} color={ROL_COLOR[u.rol]||B.t3}/>
                      {!u.activo&&<Tg label="INACTIVO" color={B.t3}/>}
                    </div>
                    <div style={{fontSize:12,color:B.t3,marginTop:2}}>{u.email}</div>
                    <div style={{display:"flex",gap:12,marginTop:4,flexWrap:"wrap"}}>
                      {u.empresa_codigo&&(
                        <span style={{fontSize:11,color:EMPRESAS.find(e=>e.codigo===u.empresa_codigo)?.color||B.t2,fontWeight:600}}>
                          🏢 {EMPRESAS.find(e=>e.codigo===u.empresa_codigo)?.nombre||u.empresa_codigo}
                        </span>
                      )}
                      {u.rol==="TECNICO"&&sup&&(
                        <span style={{fontSize:11,color:B.purple}}>
                          👔 {sup.nombre} {sup.apellido}
                        </span>
                      )}
                      {u.rol==="TECNICO"&&casosActivos>0&&(
                        <span style={{fontSize:11,color:B.orange,fontWeight:700}}>
                          📋 {casosActivos} casos activos
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Acciones */}
                  {!soloLectura&&(
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <Bb label="✎" onClick={()=>abrirEditar(u)} ghost small color={B.blue}/>
                      <button onClick={()=>toggleActivo(u)}
                        style={{background:"none",border:`1px solid ${B.border}`,
                          color:u.activo?B.red:B.green,cursor:"pointer",
                          padding:"4px 10px",fontSize:10,borderRadius:2}}>
                        {u.activo?"DESACTIVAR":"ACTIVAR"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Asignación de supervisor para técnicos */}
                {u.rol==="TECNICO"&&!soloLectura&&(
                  <div style={{marginTop:10,paddingTop:10,
                    borderTop:`1px solid ${B.border}22`,
                    display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:11,color:B.t3,flexShrink:0}}>👔 Supervisor:</span>
                    <select
                      value={u.supervisor_id||""}
                      onChange={e=>asignarSupervisor(u.id,e.target.value)}
                      onClick={e=>e.stopPropagation()}
                      style={{flex:1,background:B.deep,border:`1px solid ${B.border}`,
                        color:B.t1,padding:"6px 10px",fontSize:12,cursor:"pointer",
                        outline:"none",borderRadius:2}}>
                      <option value="">Sin supervisor</option>
                      {supervisores
                        .filter(su=>su.empresa_codigo===u.empresa_codigo)
                        .map(su=>(
                          <option key={su.id} value={su.id}>
                            {su.nombre} {su.apellido}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
          {fil.length===0&&(
            <div style={{textAlign:"center",padding:40,color:B.t3}}>
              <div style={{fontSize:32,marginBottom:10}}>👥</div>
              <div style={{fontSize:13}}>Sin usuarios que coincidan</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── CONFIG ──────────────────────────────────────────────
// ─── BULK UPLOAD ─────────────────────────────────────────────
const BulkUpload = ({ user, toast }) => {
  const [csv, setCsv]         = useState("");
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setRes]   = useState(null);

  const COLS = ["tipo_proceso","numero_serie","razon_social","rut","telefono","rubro",
    "empresa_id","departamento","localidad","direccion","prioridad","franja_horaria",
    "sla_horas","descripcion","observaciones","tier"];

  const parsear = (texto) => {
    const lineas = texto.trim().split("\n").filter(l=>l.trim());
    if(!lineas.length) return [];
    const headers = lineas[0].split(";").map(h=>h.trim().toLowerCase().replace(/ /g,"_"));
    return lineas.slice(1).map(linea=>{
      const vals = linea.split(";").map(v=>v.trim());
      const obj = {};
      headers.forEach((h,i)=>{ if(vals[i]) obj[h]=vals[i]; });
      return obj;
    });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const texto = ev.target.result;
      setCsv(texto);
      setPreview(parsear(texto).slice(0,5));
    };
    reader.readAsText(file);
  };

  const importar = async () => {
    const casos = parsear(csv);
    if(!casos.length){ toast("Sin datos para importar"); return; }
    setLoading(true);
    let ok=0, err=0;
    const ts = new Date().toISOString();
    for(const c of casos){
      const slaH = parseInt(c.sla_horas)||4;
      const deadline = new Date(Date.now()+slaH*3600000).toISOString();
      const {error} = await supabase.from("casos").insert({
        ...c,
        estado:"PENDIENTE",
        sla_horas:slaH,
        sla_deadline:deadline,
        creado_por:user?.email,
        historial:[{id:Date.now(),tipo:"CREACION",
          texto:"Caso creado por carga masiva",usuario:user?.email,ts}],
        created_at:ts, updated_at:ts,
      });
      if(error) err++; else ok++;
    }
    setRes({ok,err,total:casos.length});
    setLoading(false);
    if(ok>0) toast(`✓ ${ok} casos importados correctamente`);
    if(err>0) toast(`⚠ ${err} casos con error`);
  };

  const TEMPLATE = "tipo_proceso;numero_serie;razon_social;rut;telefono;rubro;empresa_id;departamento;localidad;direccion;prioridad;franja_horaria;sla_horas;descripcion;observaciones;tier\nSERVICIO_TECNICO;12345678;Comercio Ejemplo;210000000001;099123456;Retail;TRANS;Montevideo;Montevideo;Rivera 1234;MEDIA;FH2 (12-16);4;Equipo no enciende;;T1b";

  return (
    <div style={{maxWidth:700,padding:"0 0 40px"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em"}}>IMPORTACIÓN</div>
        <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900}}>CARGA MASIVA DE CASOS</h1>
      </div>

      {/* Plantilla */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:10}}>◈ PLANTILLA CSV</div>
        <div style={{fontSize:12,color:B.t2,marginBottom:12,lineHeight:1.6}}>
          Descargá la plantilla, completá los datos y subí el archivo. Separador: punto y coma (;)
        </div>
        <button onClick={()=>{
          const blob = new Blob([TEMPLATE],{type:"text/csv"});
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "plantilla_casos_boolean.csv";
          a.click();
        }} style={{background:B.deep,border:`1px solid ${B.border}`,color:B.t1,
          cursor:"pointer",padding:"10px 20px",fontSize:13,fontWeight:700,borderRadius:2}}>
          ⬇ DESCARGAR PLANTILLA
        </button>
      </div>

      {/* Subir archivo */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ SUBIR ARCHIVO</div>
        <input type="file" accept=".csv,.txt" onChange={handleFile}
          style={{fontSize:13,color:B.t1,marginBottom:12,display:"block"}}/>
        {preview.length>0&&(
          <div>
            <div style={{fontSize:10,color:B.t3,marginBottom:8}}>Vista previa (primeras {preview.length} filas):</div>
            <div style={{overflowX:"auto"}}>
              <table><thead><tr>{Object.keys(preview[0]).map(k=><th key={k}>{k}</th>)}</tr></thead>
                <tbody>{preview.map((r,i)=><tr key={i}>{Object.values(r).map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {resultado&&(
        <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:B.t1,marginBottom:8}}>Resultado de importación</div>
          <div style={{display:"flex",gap:16}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:28,color:B.green,fontWeight:900}}>{resultado.ok}</div>
              <div style={{fontSize:10,color:B.t3}}>IMPORTADOS</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:28,color:resultado.err>0?B.red:B.t3,fontWeight:900}}>{resultado.err}</div>
              <div style={{fontSize:10,color:B.t3}}>ERRORES</div>
            </div>
          </div>
        </div>
      )}

      {preview.length>0&&(
        <Bb label={loading?`IMPORTANDO...`:`⬆ IMPORTAR ${parsear(csv).length} CASOS`}
          onClick={importar} disabled={loading} full/>
      )}
    </div>
  );
};

// ─── ANALÍTICA ───────────────────────────────────────────────
const Analitica = ({ user, toast }) => {
  const [casos, setCasos]   = useState([]);
  const [loading,setLoading]= useState(true);
  const [rango, setRango]   = useState("7d");

  useEffect(()=>{
    const desde = new Date();
    desde.setDate(desde.getDate()-({7:7,30:30,90:90}[rango.replace("d","")]||7));
    supabase.from("casos").select("*")
      .gte("created_at",desde.toISOString())
      .then(({data})=>{ setCasos(data||[]); setLoading(false); });
  },[rango]);

  const finalizados = casos.filter(c=>c.estado==="FINALIZADO");
  const cancelados  = casos.filter(c=>c.estado==="CANCELADO");
  const enCurso     = casos.filter(c=>!["FINALIZADO","CANCELADO"].includes(c.estado||""));
  const slaOk       = finalizados.filter(c=>c.sla_deadline&&new Date(c.updated_at)<new Date(c.sla_deadline)).length;
  const slaPct      = finalizados.length ? Math.round(slaOk/finalizados.length*100) : 0;
  const resueltos   = finalizados.filter(c=>c.resolvio===true).length;
  const resPct      = finalizados.length ? Math.round(resueltos/finalizados.length*100) : 0;

  const porTipo = TIPOS_PROCESO.map(t=>({
    nombre:t.nombre, icono:t.icono, color:t.color,
    total:casos.filter(c=>c.tipo_proceso===t.codigo).length,
    fin:casos.filter(c=>c.tipo_proceso===t.codigo&&c.estado==="FINALIZADO").length,
  }));

  const porEmpresa = EMPRESAS.map(e=>({
    nombre:e.nombre, color:e.color,
    total:casos.filter(c=>c.empresa_id===e.codigo).length,
    fin:casos.filter(c=>c.empresa_id===e.codigo&&c.estado==="FINALIZADO").length,
  })).filter(e=>e.total>0);

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh"}}><Spin s={36}/></div>;

  return (
    <div style={{maxWidth:800,padding:"0 0 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em"}}>MÓDULO DE</div>
          <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900}}>ANALÍTICA OPERATIVA</h1>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[["7d","7 días"],["30d","30 días"],["90d","90 días"]].map(([v,l])=>(
            <button key={v} onClick={()=>setRango(v)}
              style={{padding:"8px 14px",background:rango===v?B.orangeDim:B.deep,
                border:`1px solid ${rango===v?B.orange:B.border}`,
                color:rango===v?B.orange:B.t2,cursor:"pointer",fontSize:12,fontWeight:700,borderRadius:2}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs principales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"CASOS TOTALES",   val:casos.length,        color:B.blue,   icono:"📋"},
          {label:"FINALIZADOS",     val:finalizados.length,  color:B.green,  icono:"✅"},
          {label:"SLA CUMPLIDO",    val:`${slaPct}%`,        color:slaPct>=90?B.green:B.red, icono:"⏱"},
          {label:"TASA RESOLUCIÓN", val:`${resPct}%`,        color:resPct>=80?B.green:B.orange, icono:"🔧"},
          {label:"EN CURSO",        val:enCurso.length,      color:B.yellow, icono:"⚡"},
          {label:"CANCELADOS",      val:cancelados.length,   color:B.red,    icono:"✗"},
        ].map(k=>(
          <div key={k.label} style={{background:B.card,border:`1px solid ${B.border}`,
            borderLeft:`3px solid ${k.color}`,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:B.t3,fontWeight:700,letterSpacing:".08em",marginBottom:6}}>
              {k.icono} {k.label}
            </div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:26,fontWeight:900,color:k.color}}>
              {k.val}
            </div>
          </div>
        ))}
      </div>

      {/* Por tipo de proceso */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:14}}>◈ POR TIPO DE PROCESO</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {porTipo.filter(t=>t.total>0).map(t=>(
            <div key={t.nombre}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,color:B.t1}}>{t.icono} {t.nombre}</span>
                <span style={{fontSize:12,color:t.color,fontWeight:700}}>{t.fin}/{t.total}</span>
              </div>
              <div style={{height:6,background:B.deep,borderRadius:3}}>
                <div style={{height:6,width:t.total?`${Math.round(t.fin/t.total*100)}%`:"0%",
                  background:t.color,borderRadius:3,transition:"width .5s"}}/>
              </div>
            </div>
          ))}
          {porTipo.every(t=>t.total===0)&&(
            <div style={{color:B.t3,fontSize:12,textAlign:"center",padding:20}}>Sin datos para el período seleccionado</div>
          )}
        </div>
      </div>

      {/* Por empresa */}
      {porEmpresa.length>0&&(
        <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:14}}>◈ POR EMPRESA</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {porEmpresa.map(e=>(
              <div key={e.nombre}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13,color:e.color,fontWeight:600}}>{e.nombre}</span>
                  <span style={{fontSize:12,color:B.t2}}>{e.fin}/{e.total} finalizados</span>
                </div>
                <div style={{height:6,background:B.deep,borderRadius:3}}>
                  <div style={{height:6,width:e.total?`${Math.round(e.fin/e.total*100)}%`:"0%",
                    background:e.color,borderRadius:3,transition:"width .5s"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LOGROS ──────────────────────────────────────────────────
const Logros = ({ user, toast }) => {
  const [perfil, setPerfil] = useState(null);

  useEffect(()=>{
    supabase.from("usuarios").select("*").eq("auth_id",user?.id).maybeSingle()
      .then(({data})=>setPerfil(data));
  },[]);

  const LOGROS_DEF = [
    {id:"primer_caso",   icono:"🎯", nombre:"Primer Caso",        desc:"Finalizaste tu primer caso",          xp:50,  condicion:p=>p?.casos_finalizados>=1},
    {id:"diez_casos",    icono:"⚡", nombre:"Velocista",          desc:"10 casos finalizados",                xp:200, condicion:p=>p?.casos_finalizados>=10},
    {id:"cincuenta",     icono:"🏆", nombre:"Medio Centenar",     desc:"50 casos finalizados",                xp:500, condicion:p=>p?.casos_finalizados>=50},
    {id:"sla_master",    icono:"⏱", nombre:"SLA Master",         desc:"100% SLA cumplido en una semana",     xp:300, condicion:()=>false},
    {id:"sin_cancelar",  icono:"💪", nombre:"Sin Rendirse",       desc:"30 días sin cancelaciones",           xp:400, condicion:()=>false},
    {id:"velocidad",     icono:"🚀", nombre:"Velocidad Máxima",   desc:"5 casos en un día",                   xp:250, condicion:()=>false},
    {id:"instalador",    icono:"📦", nombre:"Instalador Pro",     desc:"20 instalaciones completadas",        xp:350, condicion:p=>p?.instalaciones>=20},
    {id:"tecnico_elite", icono:"🔧", nombre:"Técnico Elite",      desc:"Nivel 50 alcanzado",                  xp:1000,condicion:p=>(p?.nivel||0)>=50},
  ];

  const xpTotal = perfil?.xp_total || 0;
  const nivel   = Math.floor(xpTotal/500)+1;
  const xpNivel = xpTotal%500;
  const pctNivel = Math.round(xpNivel/500*100);

  return (
    <div style={{maxWidth:600,padding:"0 0 40px"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em"}}>MÓDULO DE</div>
        <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900}}>LOGROS Y PROGRESO</h1>
      </div>

      {/* XP y nivel */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:20,marginBottom:20,
        borderLeft:`4px solid ${B.orange}`}}>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
          <div style={{width:60,height:60,borderRadius:"50%",
            background:`linear-gradient(135deg,${B.orange},${B.amber})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,color:"#050507"}}>
            {nivel}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:B.orange}}>
              NIVEL {nivel}
            </div>
            <div style={{fontSize:12,color:B.t2,marginTop:2}}>
              {xpNivel} / 500 XP para el siguiente nivel
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:22,fontWeight:700,color:B.amber}}>
              {xpTotal.toLocaleString()}
            </div>
            <div style={{fontSize:9,color:B.t3,letterSpacing:".1em"}}>XP TOTAL</div>
          </div>
        </div>
        <div style={{height:8,background:B.deep,borderRadius:4}}>
          <div style={{height:8,width:`${pctNivel}%`,borderRadius:4,
            background:`linear-gradient(90deg,${B.orange},${B.amber})`,transition:"width .5s"}}/>
        </div>
      </div>

      {/* Tabla XP por acción */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,marginBottom:20,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${B.border}`,fontSize:10,
          color:B.orange,fontWeight:700,letterSpacing:".12em"}}>◈ XP POR ACCIÓN</div>
        {XP_ACCIONES.map((a,i)=>(
          <div key={a.accion} style={{display:"flex",alignItems:"center",gap:12,
            padding:"12px 16px",
            borderBottom:i<XP_ACCIONES.length-1?`1px solid ${B.border}22`:"none",
            background:i%2===0?"transparent":B.deep+"44"}}>
            <span style={{fontSize:20,flexShrink:0}}>{a.icono}</span>
            <span style={{fontSize:13,color:B.t1,flex:1}}>{a.accion}</span>
            <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:B.green}}>
              +{a.xp} XP
            </span>
          </div>
        ))}
      </div>

      {/* Logros */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:14}}>◈ LOGROS</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {LOGROS_DEF.map(l=>{
            const desbloqueado = l.condicion(perfil);
            return(
              <div key={l.id} style={{display:"flex",alignItems:"center",gap:14,
                padding:"12px 14px",
                background:desbloqueado?B.green+"11":B.deep,
                border:`1px solid ${desbloqueado?B.green+"44":B.border}`,
                borderRadius:2,opacity:desbloqueado?1:0.5}}>
                <span style={{fontSize:32,flexShrink:0,filter:desbloqueado?"none":"grayscale(1)"}}>
                  {l.icono}
                </span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:desbloqueado?B.green:B.t2}}>
                    {l.nombre}
                  </div>
                  <div style={{fontSize:11,color:B.t3,marginTop:2}}>{l.desc}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:900,
                    color:desbloqueado?B.green:B.t3}}>
                    +{l.xp} XP
                  </div>
                  {desbloqueado&&<div style={{fontSize:9,color:B.green,marginTop:2}}>✓ DESBLOQUEADO</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── CONFIG NOTIFICACIONES ───────────────────────────────────
const ConfigNotificaciones = ({ user, minutosAntes, setMinutosAntes, toast }) => {
  const [permiso, setPermiso] = useState(Notification.permission);
  const [guardando, setGuardando] = useState(false);

  const pedirPermiso = async () => {
    const result = await Notification.requestPermission();
    setPermiso(result);
    if(result === "granted") toast("✓ Notificaciones activadas");
    else toast("Permiso denegado por el browser");
  };

  const guardar = async () => {
    setGuardando(true);
    await supabase.from("usuarios").update({minutos_recordatorio: minutosAntes})
      .eq("auth_id", user?.id);
    toast("✓ Preferencias guardadas");
    setGuardando(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:480}}>
      {/* Estado del permiso */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,borderRadius:2}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>
          ◈ PERMISOS DEL BROWSER
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",flexShrink:0,
            background:permiso==="granted"?B.green:permiso==="denied"?B.red:B.orange}}/>
          <span style={{fontSize:13,color:B.t1}}>
            {permiso==="granted"?"Notificaciones activadas":
             permiso==="denied"?"Bloqueadas por el browser — cambiá en la configuración del sitio":
             "Sin configurar"}
          </span>
        </div>
        {permiso!=="granted"&&(
          <Bb label="ACTIVAR NOTIFICACIONES" onClick={pedirPermiso} small/>
        )}
      </div>

      {/* Minutos de anticipación */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,borderRadius:2}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>
          ◈ ANTICIPACIÓN DEL RECORDATORIO
        </div>
        <div style={{fontSize:12,color:B.t2,marginBottom:16,lineHeight:1.6}}>
          Recibís una notificación este tiempo antes del inicio de cada franja horaria.
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16}}>
          {[15,30,45,60].map(m=>(
            <button key={m} onClick={()=>setMinutosAntes(m)}
              style={{flex:1,padding:"12px 0",
                border:`2px solid ${minutosAntes===m?B.orange:B.border}`,
                background:minutosAntes===m?B.orangeDim:B.deep,
                color:minutosAntes===m?B.orange:B.t2,
                cursor:"pointer",fontSize:13,fontWeight:700,borderRadius:2,
                transition:"all .15s"}}>
              {m} min
            </button>
          ))}
        </div>
        <Bb label={guardando?"GUARDANDO...":"GUARDAR PREFERENCIAS"}
          onClick={guardar} disabled={guardando} small/>
      </div>
    </div>
  );
};

const Config=({user,toast,minutosAntes,setMinutosAntes})=>{
  const [tab,setTab]=useState("notificaciones");
  const [procesos,setProcesos]=useState(TIPOS_PROCESO);
  const [misiones,setMisiones]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      const{data}=await supabase.from("misiones_config").select("*").order("orden");
      setMisiones(data||[]);setLoading(false);
    })();
  },[]);

  const TABS=[
    {id:"notificaciones",label:"🔔 NOTIFICACIONES"},
    {id:"encuestas",label:"📋 ENCUESTAS"},
    {id:"motivos",label:"💬 MOTIVOS"},
    {id:"feriados",label:"📅 FERIADOS"},
    {id:"procesos",label:"PROCESOS & SLA"},
    {id:"misiones",label:"MISIONES"},
    {id:"sistema",label:"SISTEMA"},
  ];

  return(
    <div>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:18,color:B.t1,marginBottom:20}}>◈ CONFIGURACIÓN</div>
      <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:`1px solid ${B.border}`}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"8px 14px",background:tab===t.id?B.orange:"none",color:tab===t.id?B.bg:B.t3,border:"none",cursor:"pointer",fontSize:10,fontFamily:"'Orbitron',sans-serif",fontWeight:700,letterSpacing:".08em"}}>
            {t.label}
          </button>
        ))}
      </div>
      {tab==="notificaciones"&&(
        <ConfigNotificaciones user={user} minutosAntes={minutosAntes} setMinutosAntes={setMinutosAntes} toast={toast}/>
      )}
      {tab==="encuestas"&&(
        <GestorEncuestas user={user} toast={toast}/>
      )}
      {tab==="motivos"&&(
        <GestorMotivos toast={toast}/>
      )}
      {tab==="feriados"&&(
        <GestorFeriados toast={toast}/>
      )}
      {tab==="procesos"&&(
        <div>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:14}}>◈ SLA POR TIPO DE PROCESO</div>
          <div style={{fontSize:11,color:B.t2,marginBottom:16,lineHeight:1.6}}>
            Configurá el tiempo máximo de atención para cada tipo de proceso. Se aplica a todos los casos nuevos.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {procesos.map((p,i)=>(
              <div key={p.codigo} style={{background:B.card,border:`1px solid ${B.border}`,
                borderLeft:`3px solid ${p.color}`,padding:"14px 16px",
                display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:28,flexShrink:0}}>{p.icono}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:B.t1}}>{p.nombre}</div>
                  <div style={{fontSize:10,color:B.t3,marginTop:2}}>{p.codigo}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,background:B.deep,
                    border:`1px solid ${B.border}`,padding:"4px 10px"}}>
                    <button onClick={()=>{
                      const np=[...procesos];
                      np[i]={...np[i],sla:Math.max(1,np[i].sla-1)};
                      setProcesos(np);
                    }} style={{background:"none",border:"none",color:B.t2,cursor:"pointer",
                      fontSize:18,padding:"0 4px",fontWeight:700}}>−</button>
                    <input
                      type="number" min={1} max={168}
                      value={p.sla}
                      onChange={e=>{
                        const np=[...procesos];
                        np[i]={...np[i],sla:Math.max(1,parseInt(e.target.value)||1)};
                        setProcesos(np);
                      }}
                      style={{width:48,textAlign:"center",background:"none",border:"none",
                        color:p.color,fontFamily:"'Orbitron',sans-serif",
                        fontSize:20,fontWeight:900,outline:"none"}}/>
                    <button onClick={()=>{
                      const np=[...procesos];
                      np[i]={...np[i],sla:np[i].sla+1};
                      setProcesos(np);
                    }} style={{background:"none",border:"none",color:B.t2,cursor:"pointer",
                      fontSize:18,padding:"0 4px",fontWeight:700}}>+</button>
                  </div>
                  <span style={{fontSize:11,color:B.t3,fontWeight:700}}>horas</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}>
            <Bb label="GUARDAR CAMBIOS DE SLA" onClick={async()=>{
              // Guardar en tabla config_sla (o crear si no existe)
              for(const p of procesos){
                await supabase.from("config_sla").upsert({
                  tipo_proceso:p.codigo, sla_horas:p.sla, updated_at:new Date().toISOString()
                },{onConflict:"tipo_proceso"});
              }
              toast("✓ SLA actualizado correctamente");
            }}/>
          </div>
          <div style={{marginTop:10,padding:"10px 14px",background:B.orangeDim,
            border:`1px solid ${B.orange}22`,fontSize:11,color:B.t2}}>
            ℹ Los cambios aplican a casos nuevos. Los casos existentes mantienen su SLA original.
          </div>
        </div>
      )}
      {tab==="misiones"&&(
        <GestorMisiones toast={toast}/>
      )}
      {tab==="sistema"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            ["Versión BOOLEAN","1.0.0 MVP"],["Backend","Supabase PostgreSQL"],["Frontend","React + Vite"],["Deploy","Vercel"],
            ["Autenticación","Supabase Auth"],["Realtime","Supabase Channels"],
          ].map(([k,v])=>(
            <div key={k} style={{background:B.card,border:`1px solid ${B.border}`,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:B.t2}}>{k}</span>
              <span style={{fontSize:11,fontWeight:700,color:B.t1,fontFamily:"'Share Tech Mono',monospace"}}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════
// ─── HOOK RECORDATORIOS ──────────────────────────────────────
const useRecordatorios = (casos, user, minutosAntes) => {
  const timersRef  = useRef([]);
  const casosIdRef = useRef(new Set());

  const FRANJA_INICIO = {
    "FH1 (8-12)": {h:8,m:0}, "FH2 (12-16)": {h:12,m:0},
    "FH3 (16-19)": {h:16,m:0}, "FH4 (19-22)": {h:19,m:0},
  };

  const msHastaAviso = (caso, restMin) => {
    const franja = caso.franja_horaria||caso.rango_horario;
    const def = FRANJA_INICIO[franja];
    if(!def) return null;
    const hoy = new Date();
    const target = new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate(),def.h,def.m,0,0);
    const aviso = new Date(target.getTime()-restMin*60000);
    const diff = aviso.getTime()-Date.now();
    return diff>0?diff:null;
  };

  const programarCaso = useCallback((caso)=>{
    if(casosIdRef.current.has(caso.id)) return;
    const franja = caso.franja_horaria||caso.rango_horario;
    if(!franja||!FRANJA_INICIO[franja]) return;
    if(["FINALIZADO","CANCELADO"].includes(caso.estado||"")) return;
    casosIdRef.current.add(caso.id);
    const msPrinc = msHastaAviso(caso, minutosAntes);
    if(msPrinc!==null){
      const t = setTimeout(()=>{
        if(Notification.permission==="granted"){
          new Notification(`🔔 ${caso.razon_social||"Caso"}`,{
            body:`${caso.direccion||""}\n${franja}`,
            icon:"/favicon.ico",
          });
        }
      }, msPrinc);
      timersRef.current.push(t);
    }
  },[minutosAntes]);

  useEffect(()=>{
    if(Notification.permission!=="granted") return;
    if(!casos?.length) return;
    casos.forEach(c=>programarCaso(c));
  },[casos,programarCaso]);

  useEffect(()=>{
    return()=>timersRef.current.forEach(t=>clearTimeout(t));
  },[]);
};

export default function App(){
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState(()=>{
    try{
      const saved=localStorage.getItem("boolean_view");
      return saved||"mision";
    }catch{ return "mision"; }
  });

  const setViewPersist = (v) => {
    setViewPersist(v);
    try{ localStorage.setItem("boolean_view",v); }catch{}
  };
  const [toastMsg,setToastMsg]=useState(null);
  const [casoDetalle,setCasoDetalle]=useState(null);
  const [casos,setCasos]=useState([]);
  const [minutosAntes,setMinutosAntes]=useState(30);
  const [perfil,setPerfil]=useState(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setSession(session));
    return()=>subscription.unsubscribe();
  },[]);

  const [noLeidosChat, setNoLeidosChat] = useState(0);

  // Calcular mensajes no leídos para el badge del menú
  useEffect(()=>{
    if(!perfil) return;
    const storageKey=`boolean_chat_leido_${perfil.id}`;
    let ultimosLeidos={};
    try{ ultimosLeidos=JSON.parse(localStorage.getItem(storageKey)||"{}"); }catch{}
    const ultimoGlobal = Object.values(ultimosLeidos).sort().pop()||"2000-01-01";
    supabase.from("mensajes_chat").select("*",{count:"exact",head:true})
      .neq("autor_id",perfil.id)
      .gt("created_at",ultimoGlobal)
      .then(({count})=>setNoLeidosChat(count||0));
  },[perfil]);

  useEffect(()=>{
    if(!session) return;
    if(sessionLoadedRef.current) return; // solo cargar UNA vez por sesión
    sessionLoadedRef.current = true;
    (async()=>{
      const{data:p}=await supabase.from("usuarios").select("*").eq("auth_id",session.user.id).maybeSingle();
      if(p){ setPerfil(p); if(p.minutos_recordatorio) setMinutosAntes(p.minutos_recordatorio); }
      let query=supabase.from("casos").select("*").order("created_at",{ascending:false}).limit(500);
      if(p?.rol==="TECNICO"){
        query=query.eq("tecnico_id",p.auth_id||p.id)
          .not("estado","in","(FINALIZADO,CANCELADO)");
      } else if(p?.rol==="REGIONAL"||p?.rol==="SUPERVISOR"){
        query=query.eq("empresa_id",p.empresa_codigo);
      }
      const{data}=await query;
      const hoy=new Date(); hoy.setHours(0,0,0,0);
      const filtrados=p?.rol==="TECNICO"
        ?(data||[]).filter(c=>{
            if(c.estado==="ASIGNADO"&&c.fecha_recoordinacion){
              const fR=new Date(c.fecha_recoordinacion+"T00:00:00");
              return fR<=hoy;
            }
            return true;
          })
        :(data||[]);
      setCasos(filtrados);
    })();
  },[session]);

  // ── Motor de recordatorios activo siempre que haya sesión ──
  useRecordatorios(casos, session?.user, minutosAntes);

  // ── Redirección por rol — debe estar antes de cualquier return condicional ──
  useEffect(()=>{
    if(!perfil) return;
    if(casoDetalle) return; // no redirigir si hay un caso abierto
    const PERMISOS={
      DIRECTOR:   ["mision","ruta","casos","nuevo","bulk","analitica","comunicaciones","logros","usuarios","config","detalle"],
      REGIONAL:   ["mision","ruta","casos","nuevo","bulk","analitica","comunicaciones","logros","usuarios","detalle"],
      SUPERVISOR: ["mision","ruta","casos","nuevo","bulk","analitica","comunicaciones","logros","detalle"],
      TECNICO:    ["mision","ruta","casos","comunicaciones","logros","detalle"],
    };
    const permitidos=PERMISOS[perfil.rol]||PERMISOS.DIRECTOR;
    if(!permitidos.includes(view)) setViewPersist("mision");
  },[perfil,view,casoDetalle]);

  const toast=(msg,dur=3000)=>{
    setToastMsg(msg);
    setTimeout(()=>setToastMsg(null),dur);
  };

  const recargarCasos=async()=>{
    let query=supabase.from("casos").select("*").order("created_at",{ascending:false}).limit(500);
    if(perfil?.rol==="TECNICO"){
      query=query.eq("tecnico_id",perfil.auth_id||perfil.id)
        .not("estado","in","(FINALIZADO,CANCELADO)");
    } else if(perfil?.rol==="REGIONAL"||perfil?.rol==="SUPERVISOR"){
      query=query.eq("empresa_id",perfil.empresa_codigo);
    }
    const{data}=await query;
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    const filtrados=perfil?.rol==="TECNICO"
      ?(data||[]).filter(c=>{
          if(c.estado==="ASIGNADO"&&c.fecha_recoordinacion){
            const fR=new Date(c.fecha_recoordinacion+"T00:00:00");
            return fR<=hoy;
          }
          return true;
        })
      :(data||[]);
    setCasos(filtrados);
  };

  if(loading)return(
    <div style={{minHeight:"100vh",background:B.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:24,fontWeight:900,color:B.orange}}>BOOLEAN</div>
      <Spin/>
    </div>
  );

  if(!session)return<Login onLogin={()=>{}}/>;

  const user=session.user;
  const rol=perfil?.rol||"DIRECTOR";
  const PERMISOS={
    DIRECTOR:   ["mision","ruta","casos","nuevo","bulk","analitica","comunicaciones","logros","usuarios","config","detalle"],
    REGIONAL:   ["mision","ruta","casos","nuevo","bulk","analitica","comunicaciones","logros","usuarios","detalle"],
    SUPERVISOR: ["mision","ruta","casos","nuevo","bulk","analitica","comunicaciones","logros","detalle"],
    TECNICO:    ["mision","ruta","casos","comunicaciones","logros","detalle"],
  };
  const puedeVer=(v)=>(PERMISOS[rol]||PERMISOS.DIRECTOR).includes(v);

  return(
    <div style={{minHeight:"100vh",background:B.bg,color:B.t1,fontFamily:"'Rajdhani',sans-serif",display:"flex",flexDirection:"column"}}>
      <Ticker casos={casos}/>
      <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 24px)"}}>
        <Sidebar view={view} setView={v=>{setViewPersist(v);setCasoDetalle(null);}} user={user} onLogout={async()=>{
          setCasos([]); setPerfil(null); setCasoDetalle(null);
          setViewPersist("mision");
          sessionLoadedRef.current = false;
          try{ localStorage.removeItem("boolean_view"); }catch{}
          await supabase.auth.signOut();
        }} casos={casos} perfil={perfil} noLeidosChat={noLeidosChat}/>
        <main className={window.innerWidth<768?"mobile-main":""} style={{flex:1,overflowY:"auto",padding:window.innerWidth<768?"16px 14px":"24px 28px"}}>
          {view==="mision"&&!casoDetalle&&<Mision casos={casos} setView={setView} user={user} perfil={perfil}/>}
          {view==="ruta"&&<MiRutaDelDia user={user} toast={toast} perfil={perfil}/>}
          {view==="casos"&&!casoDetalle&&<CasosList casos={casos} user={user} perfil={perfil} onRecargar={recargarCasos} onSelect={c=>{setCasoDetalle(c);}} onNew={()=>setViewPersist("nuevo")}/>}
          {view==="nuevo"&&<NuevoCaso onCancel={()=>setViewPersist("casos")} loading={false} onSave={async(f)=>{
            const tp=TIPOS_PROCESO.find(t=>t.codigo===f.tipo_proceso);
            const instrEsp = f.tiene_instrucciones && f.instrucciones_texto?.trim()
              ? { texto: f.instrucciones_texto.trim(), adjuntos: [], autor: user.email, ts: new Date().toISOString(), editado: false }
              : null;
            // Calcular SLA en días hábiles
            const feriados = await cargarFeriados();
            const diasHab = SLA_DIAS_HABILES[f.tipo_proceso] || 3;
            const slaDeadline = sumarDiasHabiles(new Date(), diasHab, feriados);
            slaDeadline.setHours(23,59,59,999);
            const{error}=await supabase.from("casos").insert({
              ...f,
              instrucciones_especiales: instrEsp,
              tiene_instrucciones: undefined,
              instrucciones_texto: undefined,
              estado:"PENDIENTE",creado_por:user.id,
              sla_horas: diasHab * 8, // referencia en horas para compatibilidad
              sla_deadline: slaDeadline.toISOString(),
              sla_dias_habiles: diasHab,
              historial:[
                {id:Date.now(),tipo:"CREACION",texto:`Caso creado · SLA: ${diasHab} días hábiles`,usuario:user.email,ts:new Date().toISOString()},
                ...(instrEsp?[{id:Date.now()+1,tipo:"INSTRUCCIONES",texto:"Instrucciones especiales cargadas al crear el caso",usuario:user.email,ts:new Date().toISOString()}]:[])
              ]
            });
            if(error){toast("Error: "+error.message);}
            else{toast(`✓ Caso creado · +${tp?.xp||50} XP`);await recargarCasos();setViewPersist("casos");}
          }}/>}
          {casoDetalle&&<CasoDetalle
            caso={casoDetalle}
            user={user}
            toast={toast}
            perfil={perfil}
            onBack={async()=>{
              setCasoDetalle(null);
              setViewPersist("casos");
              await recargarCasos();
            }}
            onUpdate={(casoActualizado)=>{
              const esTecnico = perfil?.rol==="TECNICO";
              const estadosOcultos = ["FINALIZADO","CANCELADO"];
              if(esTecnico && estadosOcultos.includes(casoActualizado.estado)){
                setCasos(prev=>prev.filter(c=>c.id!==casoActualizado.id));
              } else {
                setCasos(prev=>prev.map(c=>c.id===casoActualizado.id?casoActualizado:c));
              }
            }}
          />}
          {view==="bulk"&&<BulkUpload user={user} toast={async(m)=>{toast(m);await recargarCasos();}}/>}
          {view==="analitica"&&<Analitica user={user} toast={toast}/>}
          {view==="comunicaciones"&&<Comunicaciones user={user} perfil={perfil} toast={toast}/>}
          {view==="logros"&&<Logros user={user} toast={toast}/>}
          {view==="usuarios"&&<Usuarios user={user} perfil={perfil} toast={toast} casos={casos}/>}
          {view==="config"&&<Config user={user} toast={toast} minutosAntes={minutosAntes} setMinutosAntes={setMinutosAntes}/>}
        </main>
      </div>
      {toastMsg&&<Toast msg={toastMsg}/>}
    </div>
  );
}