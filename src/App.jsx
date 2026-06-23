import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

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
  {codigo:"FISERV",   nombre:"Fiserv",          color:"#A855F7", deps:["Montevideo","Área Metropolitana"]},
];

const TIPOS_PROCESO = [
  {codigo:"INSTALACION",nombre:"Instalación",                icono:"📦",color:"#00E87A",sla:24},
  {codigo:"SOPORTE",    nombre:"Soporte Técnico",            icono:"🔧",color:"#00A8FF",sla:4},
  {codigo:"RETIRO",     nombre:"Retiro de Terminal",         icono:"🔄",color:"#FF6B00",sla:8},
  {codigo:"PROACTIVO",  nombre:"Servicio Técnico Proactivo", icono:"👁",color:"#9B6DFF",sla:48},
];

const ESTADOS = ["ABIERTO","EN_PROGRESO","PENDIENTE","DERIVADO","RESUELTO","CERRADO"];
const EC = {ABIERTO:"#00A8FF",EN_PROGRESO:"#FFD020",PENDIENTE:"#FF6B00",DERIVADO:"#9B6DFF",RESUELTO:"#00E87A",CERRADO:"#6868A0"};
const PRIORS = ["CRITICAL","HIGH","MEDIUM","LOW"];
const PC = {CRITICAL:"#FF2040",HIGH:"#FF6B00",MEDIUM:"#FFD020",LOW:"#00E87A"};
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
const genN = () => "CASO-"+String(Math.floor(Math.random()*900000)+100000);
const slaInfo = (deadline,estado) => {
  if(!deadline) return {label:"—",color:"#32324A"};
  if(["RESUELTO","CERRADO"].includes(estado)) return {label:"✓ OK",color:"#00E87A"};
  const h=(new Date(deadline)-new Date())/3600000;
  if(h<0) return {label:`Venc. ${Math.abs(h).toFixed(0)}h`,color:"#FF2040"};
  if(h<1) return {label:`${(h*60).toFixed(0)}min`,color:"#FFD020"};
  return {label:`${h.toFixed(1)}h`,color:h<4?"#FFD020":"#00E87A"};
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
  const breach=casos.filter(c=>c.sla_deadline&&new Date(c.sla_deadline)<new Date()&&!["RESUELTO","CERRADO"].includes(c.estado||"")).length;
  const items=[`◈ ${casos.length} casos en el sistema`,`⚠ ${breach} casos con SLA vencido`,`✓ ${casos.filter(c=>c.estado==="RESUELTO").length} casos resueltos`,`⚙ ${casos.filter(c=>c.estado==="EN_PROGRESO").length} en progreso`,`★ BOOLEAN · La lógica detrás de toda la operación`];
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

const Sidebar = ({view,setView,user,onLogout,casos}) => {
  const breach=casos.filter(c=>!["RESUELTO","CERRADO"].includes(c.estado||"")&&c.sla_deadline&&new Date(c.sla_deadline)<new Date()).length;
  const abiertos=casos.filter(c=>c.estado!=="CERRADO").length;
  const menu=[
    {id:"mision",icon:"◎",label:"MISIÓN"},
    {id:"ruta",icon:"🗺",label:"MI RUTA DEL DÍA"},
    {id:"casos",icon:"≣",label:"CASOS",badge:abiertos},
    {id:"nuevo",icon:"+",label:"NUEVO CASO"},
    {id:"bulk",icon:"⬆",label:"CARGA MASIVA"},
    {id:"analitica",icon:"◑",label:"ANALÍTICA"},
    {id:"comunicaciones",icon:"💬",label:"COMUNICACIONES"},
    {id:"logros",icon:"★",label:"LOGROS"},
    {id:"usuarios",icon:"👥",label:"USUARIOS"},
    {id:"config",icon:"⟲",label:"CONFIGURACIÓN"},
  ];
  const initials=(user?.email||"U").substring(0,2).toUpperCase();
  return (
    <div style={{width:210,background:B.panel,borderRight:`1px solid ${B.border}`,display:"flex",flexDirection:"column",height:"100%",flexShrink:0}}>
      <div style={{padding:"16px 16px 12px",borderBottom:`1px solid ${B.border}`,flexShrink:0}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:21,fontWeight:900,color:B.orange,letterSpacing:".06em",lineHeight:1}} className="glow">BOOLEAN</div>
        <div style={{fontSize:8,color:B.t3,letterSpacing:".1em",marginTop:4,textTransform:"uppercase",lineHeight:1.5}}>La lógica detrás de<br/>toda la operación</div>
        <div style={{width:"100%",height:1,background:`linear-gradient(90deg,${B.orange}66,transparent)`,marginTop:10}}/>
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
            <div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email||""}</div>
            <div style={{fontSize:9,color:B.orange,fontWeight:700,letterSpacing:".06em",marginTop:1}}>DIRECTOR OPERATIVO</div>
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
const Mision = ({casos,setView}) => {
  const [time,setTime]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);
  const total=casos.length;
  const breach=casos.filter(c=>c.sla_deadline&&new Date(c.sla_deadline)<new Date()&&!["RESUELTO","CERRADO"].includes(c.estado||"")).length;
  const slaComp=total?Math.round(((total-breach)/total)*100):100;
  const installs=casos.filter(c=>c.tipo_proceso==="INSTALACION").length;
  const incidentes=casos.filter(c=>c.es_incidente&&!["RESUELTO","CERRADO"].includes(c.estado||"")).length;
  const MISIONES=[
    {titulo:"Instalar terminales del día",prog:installs,meta:15,xp:250,icono:"📦",done:installs>=15},
    {titulo:"Resolver incidentes críticos",prog:Math.min(incidentes,3),meta:3,xp:150,icono:"🔥",done:incidentes>=3},
    {titulo:"Cumplir SLA diario ≥ 95%",prog:slaComp,meta:100,xp:100,icono:"⏱",done:slaComp>=95},
    {titulo:"Completar 5 retiros",prog:casos.filter(c=>c.tipo_proceso==="RETIRO"&&c.estado==="CERRADO").length,meta:5,xp:80,icono:"🔄",done:casos.filter(c=>c.tipo_proceso==="RETIRO"&&c.estado==="CERRADO").length>=5},
  ];
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"12px 20px 10px",borderBottom:`1px solid ${B.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div>
          <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em",marginBottom:2}}>CENTRO DE MANDO · MISIÓN ACTIVA</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:17,fontWeight:900,background:`linear-gradient(90deg,${B.t1},${B.orange})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MISIÓN DEL DÍA</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,color:B.orange}}>{time.toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</div>
          <div style={{fontSize:9,color:B.t3}}>{time.toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <div className="card fade-in" style={{padding:16,borderTop:`2px solid ${B.orange}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em"}}>MISIONES ACTIVAS</div>
            <div className="hex float" style={{width:42,height:48,background:`linear-gradient(135deg,${B.orange},${B.amber})`,fontSize:20}}>★</div>
          </div>
          {MISIONES.map((m,i)=>(
            <div key={i} style={{marginBottom:11,opacity:m.done?.6:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:13}}>{m.icono}</span>
                  <span style={{fontSize:11,fontWeight:m.done?400:700,color:m.done?B.t3:B.t1,textDecoration:m.done?"line-through":"none"}}>{m.titulo}</span>
                </div>
                <span style={{fontSize:10,color:B.amber,fontFamily:"'Orbitron',sans-serif",fontWeight:700,flexShrink:0,marginLeft:6}}>+{m.xp}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div className="mission-bar" style={{flex:1}}><div className="mission-fill" style={{width:`${Math.min(100,(m.prog/m.meta)*100)}%`}}/></div>
                <span style={{fontSize:9,color:B.t2,fontFamily:"'Share Tech Mono',monospace",minWidth:36,textAlign:"right"}}>{m.prog}/{m.meta}</span>
              </div>
              {m.done&&<div style={{fontSize:8,color:B.green,fontWeight:700,letterSpacing:".1em",marginTop:2}}>✓ COMPLETADA · +{m.xp} XP</div>}
            </div>
          ))}
        </div>
        <div className="card fade-in" style={{padding:16}}>
          <div style={{fontSize:10,color:B.t2,fontWeight:700,letterSpacing:".1em",marginBottom:12}}>INDICADORES CLAVE</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {[{label:"INSTALACIONES",value:installs||128,delta:"▲ 12%",color:B.orange},{label:"SLA CUMPLIDO",value:`${slaComp}%`,delta:"▲ 5%",color:B.green,circle:true},{label:"INCIDENTES",value:incidentes||7,delta:"▼ 13%",color:B.red},{label:"TÉCNICOS",value:42,delta:"▲ 7%",color:B.blue}].map(k=>(
              <div key={k.label} style={{background:B.deep,padding:"10px 11px",border:`1px solid ${B.border}`}}>
                <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>{k.label}</div>
                {k.circle?(
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:34,height:34,borderRadius:"50%",border:`3px solid ${k.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,fontFamily:"'Orbitron',sans-serif",color:k.color}}>{k.value}</div>
                    <span style={{fontSize:10,color:k.delta.startsWith("▲")?B.green:B.red,fontWeight:700}}>{k.delta}</span>
                  </div>
                ):(
                  <div>
                    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:22,fontWeight:900,color:k.color,lineHeight:1}}>{k.value}</div>
                    <div style={{fontSize:10,color:k.delta.startsWith("▲")?B.green:B.red,fontWeight:700,marginTop:2}}>{k.delta}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="card fade-in" style={{padding:16,borderTop:`2px solid ${B.amber}`,background:B.amber+"06"}}>
          <div style={{fontSize:10,color:B.amber,fontWeight:700,letterSpacing:".1em",marginBottom:10}}>⚡ LOGRO DESBLOQUEADO</div>
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
            <div className="hex float" style={{width:50,height:58,background:`linear-gradient(135deg,${B.orange},${B.amber})`,fontSize:24,flexShrink:0}}>⚡</div>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:900,color:B.amber,lineHeight:1.2}}>MAESTRO OPERATIVO</div>
              <div style={{fontSize:10,color:B.t2,marginTop:4}}>250 instalaciones completadas</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:900,color:B.orange,marginTop:5}}>+500 XP</div>
            </div>
          </div>
          <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".1em",marginBottom:7}}>RANKING GLOBAL</div>
          {[{n:1,name:"Diego Cayetano",xp:9100,c:B.amber},{n:2,name:"Lucía Pereyra",xp:7200,c:"#C0C0C0"},{n:3,name:"Martín Sosa",xp:5800,c:"#CD7F32"}].map(r=>(
            <div key={r.n} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:`1px solid ${B.border}22`}}>
              <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:900,color:r.c,minWidth:14}}>{r.n}</span>
              <span style={{fontSize:11,flex:1}}>{r.name}</span>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:r.c}}>{r.xp.toLocaleString()} XP</span>
            </div>
          ))}
        </div>
        <div className="card fade-in" style={{padding:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:10,color:B.t2,fontWeight:700,letterSpacing:".1em"}}>CASOS RECIENTES</div>
            <button className="btn" onClick={()=>setView("casos")} style={{background:"none",color:B.orange,fontSize:10,fontWeight:700,padding:0}}>VER TODOS →</button>
          </div>
          {casos.length===0&&<div style={{textAlign:"center",color:B.t3,padding:16,fontSize:12}}>Sin casos aún. ¡Creá el primero!</div>}
          {casos.slice(0,5).map(c=>{const tp=TIPOS_PROCESO.find(t=>t.codigo===c.tipo_proceso);return(
            <div key={c.id} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${B.border}22`,alignItems:"center"}}>
              <span style={{fontSize:15,flexShrink:0}}>{tp?.icono||"◈"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div className="mono" style={{fontSize:10,color:B.orange,fontWeight:700}}>{c.numero}</div>
                <div style={{fontSize:11,color:B.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.razon_social||c.descripcion||"—"}</div>
              </div>
              <Tg label={c.estado||"ABIERTO"} color={EC[c.estado]||B.t3}/>
            </div>
          );})}
        </div>
        <div className="card fade-in" style={{padding:14}}>
          <div style={{fontSize:10,color:B.t2,fontWeight:700,letterSpacing:".1em",marginBottom:10}}>XP POR ACCIÓN</div>
          {[["Instalación completada","📦",100,B.green],["Soporte resuelto","🔧",50,B.blue],["Cumplimiento SLA","⏱",30,B.blue],["Cierre de incidente","🔥",80,B.orange],["Encuesta completada","📋",20,B.purple],["Capacitación","🎓",150,B.amber]].map(([a,ic,xp,c])=>(
            <div key={a} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${B.border}22`,alignItems:"center"}}>
              <span style={{fontSize:12,color:B.t2}}>{ic} {a}</span>
              <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:c}}>+{xp}</span>
            </div>
          ))}
        </div>
        <div className="card fade-in" style={{padding:14}}>
          <div style={{fontSize:10,color:B.t2,fontWeight:700,letterSpacing:".1em",marginBottom:10}}>EMPRESAS</div>
          {EMPRESAS.map(e=>{const count=casos.filter(c=>c.empresa_id===e.codigo).length;return(
            <div key={e.codigo} style={{display:"flex",alignItems:"center",gap:9,padding:"5px 0",borderBottom:`1px solid ${B.border}22`}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:e.color,flexShrink:0}}/>
              <span style={{fontSize:12,flex:1,color:B.t2}}>{e.nombre}</span>
              <span style={{fontSize:11,fontWeight:700,color:e.color,fontFamily:"'Share Tech Mono',monospace"}}>{count}</span>
            </div>
          );})}
        </div>
      </div>
      <div className="kpi-bar">
        {[{icon:"👥",label:"TÉCNICOS",value:"42",delta:"▲7%",c:B.blue},{icon:"📦",label:"INSTALACIONES",value:String(installs||128),delta:"▲12%",c:B.orange},{icon:"⚠",label:"INCIDENTES",value:String(incidentes||7),delta:"▼13%",c:B.red},{icon:"⏱",label:"SLA NACIONAL",value:`${slaComp}%`,delta:"▲5%",c:B.green},{icon:"✓",label:"RESUELTOS",value:String(casos.filter(c=>c.estado==="RESUELTO").length),delta:"",c:B.green},{icon:"★",label:"XP TOTAL",value:"18.250",delta:"",c:B.amber}].map(k=>(
          <div key={k.label} className="kpi-item">
            <span style={{fontSize:15}}>{k.icon}</span>
            <div>
              <div style={{fontSize:8,color:B.t3,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase"}}>{k.label}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:5}}>
                <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:k.c}}>{k.value}</span>
                {k.delta&&<span style={{fontSize:9,color:k.delta.startsWith("▲")?B.green:B.red,fontWeight:700}}>{k.delta}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const CasosList = ({casos,onSelect,onNew}) => {
  const [search,setSearch]=useState(""); const [fT,setFT]=useState("ALL"); const [fE,setFE]=useState("ALL"); const [fP,setFP]=useState("ALL"); const [fEmp,setFEmp]=useState("ALL");
  const fil=casos.filter(c=>{
    if(fT!=="ALL"&&c.tipo_proceso!==fT) return false;
    if(fE!=="ALL"&&c.estado!==fE) return false;
    if(fP!=="ALL"&&c.prioridad!==fP) return false;
    if(fEmp!=="ALL"&&c.empresa_id!==fEmp) return false;
    if(search){const q=search.toLowerCase();if(!(c.numero||"").toLowerCase().includes(q)&&!(c.descripcion||"").toLowerCase().includes(q)&&!(c.rut||"").toLowerCase().includes(q)&&!(c.razon_social||"").toLowerCase().includes(q)) return false;}
    return true;
  });
  const Sel=({v,onChange,opts,ph})=>(<select className="field" style={{flex:1,minWidth:100}} value={v} onChange={e=>onChange(e.target.value)}><option value="ALL">{ph}</option>{opts.map(([a,b])=><option key={a} value={a}>{b}</option>)}</select>);
  return (
    <div style={{padding:20,height:"100%",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em",marginBottom:3}}>GESTIÓN DE</div>
          <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900}}>CASOS OPERATIVOS</h1>
          <div style={{fontSize:11,color:B.t2,marginTop:2}}>{fil.length} de {casos.length} casos</div>
        </div>
        <Bb label="+ NUEVO CASO" onClick={onNew}/>
      </div>
      <div className="card" style={{padding:12,marginBottom:12}}>
        <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
          <input className="field" placeholder="🔍  Número, descripción, RUT, razón social..." style={{flex:2,minWidth:200}} value={search} onChange={e=>setSearch(e.target.value)}/>
          <Sel v={fT} onChange={setFT} ph="Todos los tipos" opts={TIPOS_PROCESO.map(t=>[t.codigo,`${t.icono} ${t.nombre}`])}/>
          <Sel v={fE} onChange={setFE} ph="Todos los estados" opts={ESTADOS.map(s=>[s,s])}/>
          <Sel v={fP} onChange={setFP} ph="Todas las prioridades" opts={PRIORS.map(p=>[p,p])}/>
          <Sel v={fEmp} onChange={setFEmp} ph="Todas las empresas" opts={EMPRESAS.map(e=>[e.codigo,e.nombre])}/>
        </div>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        <table>
          <thead><tr>{["NÚMERO","TIPO","RUT / RAZÓN SOCIAL","DPTO","ESTADO","PRIOR.","SLA","EMPRESA","FECHA"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {fil.map(c=>{
              const tp=TIPOS_PROCESO.find(t=>t.codigo===c.tipo_proceso);
              const sl=slaInfo(c.sla_deadline,c.estado);
              const emp=EMPRESAS.find(e=>e.codigo===c.empresa_id);
              return (
                <tr key={c.id} style={{cursor:"pointer"}} onClick={()=>onSelect(c)}>
                  <td><div style={{display:"flex",alignItems:"center",gap:6}}><span className="mono" style={{fontSize:11,color:B.orange,fontWeight:700}}>{c.numero}</span>{c.es_incidente&&<span style={{fontSize:8,background:B.redDim,color:B.red,padding:"1px 5px",fontWeight:700}}>INC</span>}</div></td>
                  <td><div style={{display:"flex",alignItems:"center",gap:5}}><span>{tp?.icono||"◈"}</span><span style={{fontSize:11}}>{tp?.nombre||c.tipo_proceso}</span></div></td>
                  <td><div style={{fontSize:11,fontWeight:600}}>{c.razon_social||"—"}</div><div className="mono" style={{fontSize:9,color:B.t3}}>{c.rut||"—"}</div></td>
                  <td style={{fontSize:11,color:B.t2}}>{c.departamento||"—"}</td>
                  <td><Tg label={c.estado||"ABIERTO"} color={EC[c.estado]||B.t3}/></td>
                  <td><Tg label={c.prioridad||"MEDIUM"} color={PC[c.prioridad]||B.t2}/></td>
                  <td><span className="mono" style={{fontSize:11,fontWeight:700,color:sl.color}}>{sl.label}</span></td>
                  <td>{emp?<span style={{fontSize:11,color:emp.color,fontWeight:700}}>{emp.nombre}</span>:<span style={{color:B.t3}}>—</span>}</td>
                  <td style={{fontSize:10,color:B.t3}}>{fmtD(c.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {fil.length===0&&<div style={{padding:40,textAlign:"center",color:B.t3}}><div style={{fontSize:28,marginBottom:10}}>◎</div>Sin casos</div>}
      </div>
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
          <div><FL label="SLA (horas)"/><input className="field" type="number" value={f.sla_horas} onChange={e=>s("sla_horas",parseInt(e.target.value)||4)}/></div>
          <div><FL label="Rango Horario"/><select className="field" value={f.rango_horario} onChange={e=>s("rango_horario",e.target.value)}>{RANGOS_HORARIO.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
        </div>
        {(f.tipo_proceso==="SOPORTE"||f.tipo_proceso==="PROACTIVO")&&(
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
        <div style={{marginBottom:18}}><FL label="Descripción del Problema" req/><textarea className="field" rows={3} placeholder="Describí el problema o tarea..." value={f.descripcion} onChange={e=>s("descripcion",e.target.value)} style={{resize:"vertical"}}/></div>

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
            <Bb label={loading?"GUARDANDO...":"CREAR CASO"} onClick={()=>onSave(f)} disabled={!f.descripcion||!f.tipo_proceso||loading}/>
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
const ENCUESTAS = {
  INSTALACION:[
    {id:"sat_inst",label:"¿Cómo calificarías la instalación?",opts:["Excelente","Buena","Regular","Mala"]},
    {id:"tiempo",label:"¿El tiempo de instalación fue adecuado?",opts:["Muy rápido","Adecuado","Un poco lento","Muy lento"]},
    {id:"tecnico",label:"¿Cómo fue la atención del técnico?",opts:["Excelente","Buena","Regular","Mala"]},
    {id:"equipo",label:"¿El equipo quedó funcionando correctamente?",opts:["Sí, perfectamente","Sí, con observaciones","No del todo","No funcionó"]},
  ],
  SOPORTE:[
    {id:"resolucion",label:"¿Se resolvió el problema?",opts:["Sí, completamente","Sí, parcialmente","No se resolvió","Requiere revisita"]},
    {id:"sat_soporte",label:"¿Cómo calificarías el soporte?",opts:["Excelente","Bueno","Regular","Malo"]},
    {id:"tiempo_resp",label:"¿El tiempo de respuesta fue aceptable?",opts:["Muy rápido","Adecuado","Demoró mucho","Inaceptable"]},
    {id:"tecnico",label:"¿Cómo fue la atención del técnico?",opts:["Excelente","Buena","Regular","Mala"]},
  ],
  RETIRO:[
    {id:"sat_retiro",label:"¿Cómo calificarías el proceso de retiro?",opts:["Excelente","Bueno","Regular","Malo"]},
    {id:"coordinacion",label:"¿La coordinación previa fue adecuada?",opts:["Muy buena","Buena","Regular","Mala"]},
    {id:"tecnico",label:"¿Cómo fue la atención del técnico?",opts:["Excelente","Buena","Regular","Mala"]},
  ],
  PROACTIVO:[
    {id:"sat_visita",label:"¿Cómo calificarías la visita proactiva?",opts:["Excelente","Buena","Regular","Mala"]},
    {id:"utilidad",label:"¿La visita resultó útil?",opts:["Muy útil","Útil","Poco útil","Sin valor"]},
    {id:"tecnico",label:"¿Cómo fue la atención del técnico?",opts:["Excelente","Buena","Regular","Mala"]},
    {id:"seguimiento",label:"¿Necesita seguimiento adicional?",opts:["No, todo OK","Sí, menor","Sí, importante","Urgente"]},
  ],
};

const ModalEncuesta = ({caso,onClose,onSave})=>{
  const preguntas = ENCUESTAS[caso.tipo_proceso]||ENCUESTAS.SOPORTE;
  const [resp,setResp] = useState(caso.respuestas_encuesta||{});
  const [saving,setSaving] = useState(false);
  const complete = preguntas.every(p=>resp[p.id]);
  const handleSave = async()=>{
    setSaving(true);
    await onSave(resp);
    setSaving(false);
  };
  return(
    <Modal title="◈ ENCUESTA DE SATISFACCIÓN" onClose={onClose} width={520}>
      <div style={{marginBottom:16,padding:"10px 14px",background:B.orangeDim,border:`1px solid ${B.orange}22`,display:"flex",gap:12,alignItems:"center"}}>
        <span style={{fontSize:20}}>{TIPOS_PROCESO.find(t=>t.codigo===caso.tipo_proceso)?.icono||"📋"}</span>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:B.orange}}>{caso.tipo_proceso} · #{caso.numero}</div>
          <div style={{fontSize:12,color:B.t2}}>{caso.razon_social||caso.numero_serie}</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
        {preguntas.map((p,i)=>(
          <div key={p.id}>
            <div style={{fontSize:11,color:B.t2,marginBottom:6,fontWeight:600}}>{i+1}. {p.label}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {p.opts.map(opt=>(
                <button key={opt} onClick={()=>setResp(r=>({...r,[p.id]:opt}))}
                  style={{padding:"8px 10px",border:`1px solid ${resp[p.id]===opt?B.orange:B.border}`,background:resp[p.id]===opt?B.orangeDim:"transparent",color:resp[p.id]===opt?B.orange:B.t2,cursor:"pointer",fontSize:11,fontWeight:resp[p.id]===opt?700:400,transition:"all .15s",textAlign:"left"}}>
                  {resp[p.id]===opt?"◉ ":"○ "}{opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,paddingTop:14,borderTop:`1px solid ${B.border}`}}>
        <Bb label="CANCELAR" onClick={onClose} ghost small color={B.t2}/>
        <Bb label={saving?"GUARDANDO...":"GUARDAR ENCUESTA"} onClick={handleSave} disabled={!complete||saving}/>
      </div>
    </Modal>
  );
};

const ESTADOS_FLUJO = ["PENDIENTE","EN_PROCESO","EN_ESPERA","RESUELTO","CERRADO"];
const EST_COLOR={PENDIENTE:B=>B.orange,EN_PROCESO:B=>B.blue,EN_ESPERA:B=>B.purple,RESUELTO:B=>B.green,CERRADO:B=>B.t3};

const CasoDetalle=({caso:casoInit,user,onBack,toast})=>{
  const [caso,setCaso]=useState(casoInit);
  const [loading,setLoading]=useState(false);
  const [nota,setNota]=useState("");
  const [nuevoEstado,setNuevoEstado]=useState(casoInit.estado);
  const [showEnc,setShowEnc]=useState(false);
  const [showInstr,setShowInstr]=useState(false);
  const tp=TIPOS_PROCESO.find(t=>t.codigo===caso.tipo_proceso);
  const emp=EMPRESAS.find(e=>e.codigo===caso.empresa_id);
  const pct=caso.sla_deadline?Math.max(0,Math.min(100,100-(Date.now()-new Date(caso.created_at))/(new Date(caso.sla_deadline)-new Date(caso.created_at))*100)):100;
  const vencido=caso.sla_deadline&&new Date(caso.sla_deadline)<new Date();

  // rol simulado — en producción viene del perfil del usuario
  const esRolTecnico = user?.email?.includes("tecnico") || user?.user_metadata?.rol === "tecnico";
  const esRolSupervisorOSuperior = !esRolTecnico;

  // ¿Tiene instrucciones y el técnico ya las confirmó?
  const tieneInstr = !!(caso.instrucciones_especiales?.texto || caso.instrucciones_especiales?.adjuntos?.length);
  const yaConfirmado = !!caso.instrucciones_especiales?.confirmado_por;
  // Bloqueo: técnico no puede pasar a EN_PROGRESO sin confirmar
  const bloqueado = esRolTecnico && tieneInstr && !yaConfirmado && nuevoEstado === "EN_PROCESO";

  const addHistorial=async(tipo,texto)=>{
    const entrada={id:Date.now(),tipo,texto,usuario:user.email,ts:new Date().toISOString()};
    const nuevo=[...(caso.historial||[]),entrada];
    await supabase.from("casos").update({historial:nuevo}).eq("id",caso.id);
    setCaso(c=>({...c,historial:nuevo}));
  };

  const confirmarInstrucciones=async()=>{
    setLoading(true);
    const instrActualizadas={
      ...caso.instrucciones_especiales,
      confirmado_por: user.email,
      confirmado_ts:  new Date().toISOString(),
    };
    await supabase.from("casos").update({instrucciones_especiales:instrActualizadas}).eq("id",caso.id);
    await addHistorial("INSTRUCCIONES","✓ Técnico confirmó lectura de instrucciones especiales");
    setCaso(c=>({...c,instrucciones_especiales:instrActualizadas}));
    toast("✓ Instrucciones confirmadas — podés cambiar el estado");
    setLoading(false);
  };

  const guardarInstrucciones=async(payload)=>{
    setLoading(true);
    // Si había instrucciones anteriores, guardar versión en historial
    const accion = caso.instrucciones_especiales?.texto ? "INSTRUCCIONES EDITADAS" : "INSTRUCCIONES CARGADAS";
    await supabase.from("casos").update({instrucciones_especiales:payload}).eq("id",caso.id);
    await addHistorial("INSTRUCCIONES", accion + " por " + user.email);
    setCaso(c=>({...c,instrucciones_especiales:payload}));
    toast("✓ Instrucciones guardadas");
    setLoading(false);
  };

  const cambiarEstado=async()=>{
    if(nuevoEstado===caso.estado)return;
    if(bloqueado){toast("⚠ Debés confirmar las instrucciones antes de cambiar el estado","error");return;}
    setLoading(true);
    const updates={estado:nuevoEstado};
    if(nuevoEstado==="CERRADO"){updates.fecha_cierre=new Date().toISOString();}
    await supabase.from("casos").update(updates).eq("id",caso.id);
    await addHistorial("ESTADO",`Estado cambiado a ${nuevoEstado}`);
    setCaso(c=>({...c,...updates}));
    toast(`Estado actualizado: ${nuevoEstado}`);
    setLoading(false);
  };

  const agregarNota=async()=>{
    if(!nota.trim())return;
    setLoading(true);
    await addHistorial("NOTA",nota.trim());
    setNota("");
    toast("Nota agregada");
    setLoading(false);
  };

  const guardarEncuesta=async(resp)=>{
    await supabase.from("casos").update({respuestas_encuesta:resp,estado:"CERRADO",fecha_cierre:new Date().toISOString()}).eq("id",caso.id);
    await addHistorial("ENCUESTA","Encuesta de satisfacción completada");
    setCaso(c=>({...c,respuestas_encuesta:resp,estado:"CERRADO"}));
    setShowEnc(false);
    toast("+20 XP · Encuesta completada 🎯");
  };

  const historial=caso.historial||[];
  const HIST_ICON={ESTADO:"⚡",NOTA:"📝",ENCUESTA:"📊",CREACION:"🆕",SISTEMA:"🔧",INSTRUCCIONES:"⚠"};
  const HIST_COL={ESTADO:B=>B.orange,NOTA:B=>B.blue,ENCUESTA:B=>B.green,CREACION:B=>B.purple,SISTEMA:B=>B.t3,INSTRUCCIONES:B=>B.red};

  return(
    <div style={{padding:"0 0 40px"}}>
      {showEnc&&<ModalEncuesta caso={caso} onClose={()=>setShowEnc(false)} onSave={guardarEncuesta}/>}
      {showInstr&&<ModalInstrucciones caso={caso} user={user} onClose={()=>setShowInstr(false)} onSave={guardarInstrucciones}/>}

      {/* ── INSTRUCCIONES ESPECIALES — siempre arriba del todo ── */}
      <BloqueInstrucciones
        instrucciones={caso.instrucciones_especiales}
        onConfirmar={confirmarInstrucciones}
        yaConfirmado={yaConfirmado}
        esRolTecnico={esRolTecnico}
      />

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.t2,cursor:"pointer",padding:"6px 12px",fontSize:11,fontFamily:"'Orbitron',sans-serif"}}>← VOLVER</button>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:18,color:B.t1}}>#{caso.numero}</span>
            <Tg label={caso.tipo_proceso} color={tp?.color||B.orange}/>
            <Tg label={caso.prioridad} color={caso.prioridad==="CRITICA"?B.red:caso.prioridad==="ALTA"?B.orange:B.blue}/>
            <Tg label={caso.estado} color={EST_COLOR[caso.estado]?.(B)||B.t3}/>
            {caso.es_incidente&&<Tg label={`INC ${caso.incidente_id||""}`} color={B.red}/>}
            {tieneInstr&&<Tg label={yaConfirmado?"⚠ LEÍDAS":"⚠ INSTRUCCIONES"} color={yaConfirmado?B.green:B.orange}/>}
          </div>
          <div style={{fontSize:12,color:B.t2,marginTop:4}}>{caso.descripcion?.substring(0,80)}{caso.descripcion?.length>80?"...":""}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {esRolSupervisorOSuperior&&(
            <Bb label={tieneInstr?"✎ EDITAR INSTRUCCIONES":"+ INSTRUCCIONES ESPECIALES"}
              onClick={()=>setShowInstr(true)} small ghost color={B.orange}/>
          )}
          {(caso.estado==="RESUELTO"||caso.estado==="EN_PROCESO")&&!caso.respuestas_encuesta&&(
            <Bb label="📊 ENCUESTA CLIENTE" onClick={()=>setShowEnc(true)} small/>
          )}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ DATOS DEL CLIENTE</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Terminal",caso.numero_serie],["RUT",caso.rut],["Razón Social",caso.razon_social],["Teléfono",caso.telefono],["Rubro",caso.rubro]].map(([l,v])=>v&&(
              <div key={l}><div style={{fontSize:9,color:B.t3,fontWeight:600,letterSpacing:".08em"}}>{l}</div><div style={{fontSize:12,color:B.t1,marginTop:2}}>{v}</div></div>
            ))}
          </div>
        </div>
        <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ DATOS OPERATIVOS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Empresa",emp?.nombre||caso.empresa_id],["Departamento",caso.departamento],["Localidad",caso.localidad],["Dirección",caso.direccion],["Rango Horario",caso.rango_horario],["Creado",fmtD(caso.created_at)]].map(([l,v])=>v&&(
              <div key={l}><div style={{fontSize:9,color:B.t3,fontWeight:600,letterSpacing:".08em"}}>{l}</div><div style={{fontSize:12,color:B.t1,marginTop:2}}>{v}</div></div>
            ))}
          </div>
          {caso.sla_deadline&&(
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${B.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:B.t3}}>SLA</span>
                <span style={{fontSize:10,color:vencido?B.red:B.green,fontWeight:700}}>{vencido?"⚠ VENCIDO":"✓ EN TIEMPO"}</span>
              </div>
              <div style={{height:4,background:B.bg,borderRadius:2}}>
                <div style={{height:4,width:`${pct}%`,background:vencido?B.red:pct<30?B.orange:B.green,borderRadius:2,transition:"width .3s"}}/>
              </div>
              <div style={{fontSize:10,color:B.t3,marginTop:4}}>Vence: {fmtD(caso.sla_deadline)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Gestión */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,marginBottom:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ GESTIÓN</div>
        {bloqueado&&(
          <div style={{background:B.redDim,border:`1px solid ${B.red}33`,borderLeft:`3px solid ${B.red}`,padding:"9px 14px",marginBottom:12,fontSize:12,color:B.red,fontWeight:700}}>
            ⚠ Debés confirmar las instrucciones especiales antes de cambiar el estado a EN PROGRESO
          </div>
        )}
        <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}>
            <FL label="Cambiar Estado"/>
            <select className="field" value={nuevoEstado} onChange={e=>setNuevoEstado(e.target.value)}>
              {ESTADOS_FLUJO.map(e=><option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <Bb label={loading?"...":"APLICAR ESTADO"} onClick={cambiarEstado}
            disabled={nuevoEstado===caso.estado||loading||bloqueado} small
            color={bloqueado?B.t3:B.orange}/>
        </div>
        <div style={{marginTop:12,display:"flex",gap:8}}>
          <input className="field" style={{flex:1}} placeholder="Agregar nota al historial..."
            value={nota} onChange={e=>setNota(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&agregarNota()}/>
          <Bb label="AGREGAR NOTA" onClick={agregarNota} disabled={!nota.trim()||loading} small ghost/>
        </div>
      </div>

      {/* Historial */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16}}>
        <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".12em",marginBottom:12}}>◈ HISTORIAL ({historial.length})</div>
        {historial.length===0&&<div style={{color:B.t3,fontSize:12,textAlign:"center",padding:20}}>Sin entradas en el historial</div>}
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:320,overflowY:"auto"}}>
          {[...historial].reverse().map(h=>(
            <div key={h.id} style={{display:"flex",gap:10,padding:"8px 10px",background:B.bg,border:`1px solid ${B.border}`,
              borderLeft:h.tipo==="INSTRUCCIONES"?`3px solid ${B.orange}`:`1px solid ${B.border}`}}>
              <span style={{fontSize:16,flexShrink:0}}>{HIST_ICON[h.tipo]||"📌"}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:HIST_COL[h.tipo]?.(B)||B.t1,fontWeight:600}}>{h.texto}</div>
                <div style={{fontSize:10,color:B.t3,marginTop:2}}>{h.usuario} · {fmtD(h.ts)}</div>
              </div>
            </div>
          ))}
        </div>
        {caso.respuestas_encuesta&&(
          <div style={{marginTop:12,padding:"10px 14px",background:`${B.green}11`,border:`1px solid ${B.green}33`}}>
            <div style={{fontSize:10,color:B.green,fontWeight:700,marginBottom:6}}>✓ ENCUESTA COMPLETADA</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.entries(caso.respuestas_encuesta).map(([k,v])=>(
                <span key={k} style={{fontSize:10,padding:"3px 8px",background:`${B.green}22`,color:B.green,border:`1px solid ${B.green}33`}}>{v}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════
// PART 7 — BulkUpload + Analitica
// ═══════════════════════════════════════════════════════════
// ─── CONSTANTES NUEVOS CAMPOS ─────────────────────────────────
const TIERS=["VIP","T1a","T1b","T2"];
const TIER_SLA={VIP:2,T1a:4,T1b:6,T2:8};
const TIER_C={VIP:B=>B.amber,T1a:B=>B.orange,T1b:B=>B.blue,T2:B=>B.green};
const SUB_TIPOS=["FISICO","CONEXION","CONFIGURACION","BATERIA","CARGADOR","OTRO"];
const FRANJAS=["FH1 (8-12)","FH2 (12-16)","FH3 (16-19)","FH4 (19-22)"];
const TIPOS_ACCION=["INSTALACION","SERVICIO_TECNICO","RETIRO","VISITA_PROACTIVA"];
const TIPO_ACCION_C={INSTALACION:B=>B.green,SERVICIO_TECNICO:B=>B.orange,RETIRO:B=>B.blue,VISITA_PROACTIVA:B=>B.purple};
const TIPO_ACCION_IC={INSTALACION:"📦",SERVICIO_TECNICO:"🔧",RETIRO:"🔄",VISITA_PROACTIVA:"👁"};
const PRIORIDADES_N=["CRITICA","ALTA","MEDIA","BAJA"];
const PRIOR_N_C={CRITICA:B=>B.red,ALTA:B=>B.orange,MEDIA:B=>B.blue,BAJA:B=>B.green};

const genBooleanId=()=>"BN-"+String(Math.floor(Math.random()*999999)).padStart(6,"0");

const BulkUpload=({user,toast})=>{
  const [file,setFile]=useState(null);
  const [rows,setRows]=useState([]);
  const [errors,setErrors]=useState([]);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(0);
  const [step,setStep]=useState(1); // 1=upload 2=preview 3=done
  const fileRef=useRef(null);

  // Mapeo flexible de columnas — acepta nombres en español e inglés
  const normalize=(r)=>{
    const get=(...keys)=>{for(const k of keys){const v=r[k]||r[k?.toUpperCase()]||r[k?.toLowerCase()];if(v!==undefined&&v!=="")return String(v).trim();}return "";};
    return {
      id_externo:     get("ID_EXTERNO","id_externo","ID","id","EXT_ID") || genBooleanId(),
      tipo_accion:    get("TIPO_ACCION","tipo_accion","TIPO","tipo","tipo_proceso","TIPO_PROCESO"),
      sub_tipo:       get("SUB_TIPO","sub_tipo","SUBTIPO","subtipo"),
      nro_terminal:   get("NRO_TERMINAL","nro_terminal","NUMERO_TERMINAL","numero_terminal","terminal","TERMINAL","numero_serie","NUMERO_SERIE"),
      obs_modelo:     get("OBS_MODELO","obs_modelo","MODELO","modelo","observaciones_modelo"),
      rut:            get("RUT","rut"),
      razon_social:   get("RAZON_SOCIAL","razon_social","NOMBRE","nombre","COMERCIO"),
      tier:           get("TIER","tier","SEGMENTO","segmento"),
      departamento:   get("DEPARTAMENTO","departamento","DEPTO","depto"),
      localidad:      get("LOCALIDAD","localidad","CIUDAD","ciudad"),
      direccion:      get("DIRECCION","direccion","DIRECCIÓN","dirección"),
      telefono:       get("TELEFONO","telefono","TEL","tel"),
      rubro:          get("RUBRO","rubro"),
      franja_horaria: get("FRANJA_HORARIA","franja_horaria","FRANJA_HOR","franja_hor","FRANJA","franja","rango_horario","RANGO_HORARIO"),
      prioridad:      get("PRIORIDAD","prioridad","PRIOR","prior"),
    };
  };

  const validateRow=(r,i)=>{
    const errs=[];
    if(!r.tipo_accion) errs.push(`Fila ${i+2}: TIPO_ACCION es requerido`);
    else if(!TIPOS_ACCION.includes(r.tipo_accion.toUpperCase())) errs.push(`Fila ${i+2}: TIPO_ACCION inválido ('${r.tipo_accion}')`);
    if(!r.nro_terminal) errs.push(`Fila ${i+2}: NRO_TERMINAL es requerido`);
    else if(isNaN(Number(String(r.nro_terminal).replace(/\s/g,"")))) errs.push(`Fila ${i+2}: NRO_TERMINAL debe ser numérico`);
    if(!r.rut) errs.push(`Fila ${i+2}: RUT es requerido`);
    if(!r.razon_social) errs.push(`Fila ${i+2}: RAZON_SOCIAL es requerida`);
    if(!r.tier) errs.push(`Fila ${i+2}: TIER es requerido`);
    else if(!TIERS.includes(r.tier.toUpperCase())) errs.push(`Fila ${i+2}: TIER inválido ('${r.tier}') — usá VIP/T1a/T1b/T2`);
    if(!r.departamento) errs.push(`Fila ${i+2}: DEPARTAMENTO es requerido`);
    if(!r.localidad) errs.push(`Fila ${i+2}: LOCALIDAD es requerida`);
    if(!r.direccion) errs.push(`Fila ${i+2}: DIRECCION es requerida`);
    if(!r.franja_horaria) errs.push(`Fila ${i+2}: FRANJA_HORARIA es requerida`);
    if(!r.prioridad) errs.push(`Fila ${i+2}: PRIORIDAD es requerida`);
    return errs;
  };

  const parseFile=async(f)=>{
    try{
      
      const buf=await f.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      // busca primera hoja que no sea diccionario/encuesta
      const sheetName=wb.SheetNames.find(n=>!["DICCIONARIO","FRANJAS","ENCUESTAS","INCIDENTES"].includes(n))||wb.SheetNames[0];
      const ws=wb.Sheets[sheetName];
      const raw=XLSX.utils.sheet_to_json(ws,{defval:""});
      const normalized=raw.map(normalize).filter(r=>Object.values(r).some(v=>v&&v.length>0&&!v.startsWith("BN-")));
      setRows(normalized);
      const allErrs=normalized.flatMap((r,i)=>validateRow(r,i));
      setErrors(allErrs);
      if(allErrs.length===0) setStep(2);
    }catch(e){
      toast("Error al leer el archivo: "+e.message);
    }
  };

  const importar=async()=>{
    if(rows.length===0)return;
    setLoading(true); let ok=0;
    for(const r of rows){
      const tier=(r.tier||"T2").toUpperCase();
      const slaH=TIER_SLA[tier]||8;
      const tipo=(r.tipo_accion||"SERVICIO_TECNICO").toUpperCase();
      const prio=(r.prioridad||"MEDIA").toUpperCase();
      const {error}=await supabase.from("casos").insert({
        id_externo:      r.id_externo||genBooleanId(),
        tipo_proceso:    tipo,
        sub_tipo:        r.sub_tipo?.toUpperCase()||null,
        numero_serie:    String(r.nro_terminal||"").replace(/\s/g,""),
        obs_modelo:      r.obs_modelo||null,
        rut:             r.rut,
        razon_social:    r.razon_social,
        tier:            tier,
        departamento:    r.departamento,
        localidad:       r.localidad,
        direccion:       r.direccion,
        telefono:        r.telefono||null,
        rubro:           r.rubro||null,
        franja_horaria:  r.franja_horaria||"FH2 (12-16)",
        prioridad:       prio,
        estado:          "PENDIENTE",
        creado_por:      user.id,
        sla_deadline:    new Date(Date.now()+slaH*3600000).toISOString(),
        historial:[{id:Date.now()+ok,tipo:"CREACION",texto:`Carga masiva · ID externo: ${r.id_externo}`,usuario:user.email,ts:new Date().toISOString()}]
      });
      if(!error) ok++; else console.warn("Insert error row",ok,error.message);
    }
    setDone(ok); setLoading(false);
    setStep(3); toast(`✓ ${ok}/${rows.length} casos importados correctamente`);
  };

  const PRIO_C_LOCAL={CRITICA:B.red,ALTA:B.orange,MEDIA:B.blue,BAJA:B.green};
  const TIPO_C_LOCAL={INSTALACION:B.green,SERVICIO_TECNICO:B.orange,RETIRO:B.blue,VISITA_PROACTIVA:B.purple};
  const TIER_C_LOCAL={VIP:B.amber,T1a:B.orange,T1b:B.blue,T2:B.green};

  const reset=()=>{setFile(null);setRows([]);setErrors([]);setDone(0);setStep(1);if(fileRef.current)fileRef.current.value="";};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".18em",marginBottom:3}}>IMPORTAR</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:18,color:B.t1}}>CARGA MASIVA</div>
        </div>
        <div style={{display:"flex",gap:9}}>
          <Bb label="⬇ PLANTILLA EXCEL" ghost small color={B.green} onClick={async()=>{
            try{
              
              const ejemplo=[
                {ID_EXTERNO:"",TIPO_ACCION:"INSTALACION",SUB_TIPO:"",NRO_TERMINAL:"1234567",OBS_MODELO:"POS Ingenico Move 5000",RUT:"21 000001 5",RAZON_SOCIAL:"Supermercado Norte S.A.",TIER:"VIP",DEPARTAMENTO:"Montevideo",LOCALIDAD:"Pocitos",DIRECCION:"Av. Brasil 2785",TELEFONO:"099111222",RUBRO:"Supermercado",FRANJA_HORARIA:"FH2 (12-16)",PRIORIDAD:"ALTA"},
                {ID_EXTERNO:"EXT-00123",TIPO_ACCION:"SERVICIO_TECNICO",SUB_TIPO:"CONEXION",NRO_TERMINAL:"7654321",OBS_MODELO:"Verifone V240m",RUT:"21 000002 3",RAZON_SOCIAL:"Farmacia Central",TIER:"T1a",DEPARTAMENTO:"Maldonado",LOCALIDAD:"Punta del Este",DIRECCION:"Gorlero 1234",TELEFONO:"099333444",RUBRO:"Farmacia",FRANJA_HORARIA:"FH1 (8-12)",PRIORIDAD:"CRITICA"},
                {ID_EXTERNO:"EXT-00456",TIPO_ACCION:"SERVICIO_TECNICO",SUB_TIPO:"BATERIA",NRO_TERMINAL:"9871234",OBS_MODELO:"PAX A920",RUT:"21 000003 1",RAZON_SOCIAL:"Estación ANCAP Centro",TIER:"T1b",DEPARTAMENTO:"Salto",LOCALIDAD:"Salto",DIRECCION:"Artigas 456",TELEFONO:"099555666",RUBRO:"Combustible",FRANJA_HORARIA:"FH3 (16-19)",PRIORIDAD:"MEDIA"},
                {ID_EXTERNO:"",TIPO_ACCION:"RETIRO",SUB_TIPO:"",NRO_TERMINAL:"1122334",OBS_MODELO:"Ingenico iCT220",RUT:"21 000004 9",RAZON_SOCIAL:"Hotel Carrasco",TIER:"VIP",DEPARTAMENTO:"Montevideo",LOCALIDAD:"Carrasco",DIRECCION:"Rambla República 5101",TELEFONO:"099777888",RUBRO:"Hotel",FRANJA_HORARIA:"FH4 (19-22)",PRIORIDAD:"BAJA"},
                {ID_EXTERNO:"EXT-00789",TIPO_ACCION:"VISITA_PROACTIVA",SUB_TIPO:"",NRO_TERMINAL:"5566778",OBS_MODELO:"Verifone VX520",RUT:"21 000005 7",RAZON_SOCIAL:"Restaurante El Fogón",TIER:"T2",DEPARTAMENTO:"Canelones",LOCALIDAD:"Ciudad de la Costa",DIRECCION:"Av. Giannattasio km 14",TELEFONO:"099999000",RUBRO:"Restaurante",FRANJA_HORARIA:"FH2 (12-16)",PRIORIDAD:"MEDIA"},
              ];
              const ws=XLSX.utils.json_to_sheet(ejemplo);
              // Anchos de columna
              ws["!cols"]=[{wch:14},{wch:18},{wch:18},{wch:14},{wch:22},{wch:14},{wch:24},{wch:8},{wch:16},{wch:18},{wch:24},{wch:13},{wch:14},{wch:16},{wch:12}];
              const wb=XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb,"CARGA_MASIVA",ws);
              // Hoja diccionario
              const dict=[
                {CAMPO:"ID_EXTERNO",REQUERIDO:"NO",DESCRIPCION:"ID del sistema externo. Si vacío Boolean asigna BN-XXXXXX",VALORES:"EXT-00123 · MAX-456"},
                {CAMPO:"TIPO_ACCION",REQUERIDO:"SÍ",DESCRIPCION:"Tipo de trabajo a realizar",VALORES:"INSTALACION | SERVICIO_TECNICO | RETIRO | VISITA_PROACTIVA"},
                {CAMPO:"SUB_TIPO",REQUERIDO:"NO",DESCRIPCION:"Solo para SERVICIO_TECNICO",VALORES:"FISICO | CONEXION | CONFIGURACION | BATERIA | CARGADOR | OTRO"},
                {CAMPO:"NRO_TERMINAL",REQUERIDO:"SÍ",DESCRIPCION:"Número de terminal — SOLO NUMÉRICO",VALORES:"1234567 · 9871234"},
                {CAMPO:"OBS_MODELO",REQUERIDO:"NO",DESCRIPCION:"Observación del modelo del equipo",VALORES:"POS Ingenico Move 5000 · PAX A920"},
                {CAMPO:"RUT",REQUERIDO:"SÍ",DESCRIPCION:"RUT del comercio con dígito verificador",VALORES:"21 000001 5"},
                {CAMPO:"RAZON_SOCIAL",REQUERIDO:"SÍ",DESCRIPCION:"Nombre legal del comercio",VALORES:"Supermercado Norte S.A."},
                {CAMPO:"TIER",REQUERIDO:"SÍ",DESCRIPCION:"VIP=2h · T1a=4h · T1b=6h · T2=8h de SLA",VALORES:"VIP | T1a | T1b | T2"},
                {CAMPO:"DEPARTAMENTO",REQUERIDO:"SÍ",DESCRIPCION:"Departamento de Uruguay",VALORES:"Montevideo | Maldonado | Salto..."},
                {CAMPO:"LOCALIDAD",REQUERIDO:"SÍ",DESCRIPCION:"Ciudad o localidad exacta",VALORES:"Pocitos · Punta del Este · Melo"},
                {CAMPO:"DIRECCION",REQUERIDO:"SÍ",DESCRIPCION:"Dirección completa del comercio",VALORES:"Av. Brasil 2785 esq. Dr. Jiménez"},
                {CAMPO:"TELEFONO",REQUERIDO:"NO",DESCRIPCION:"Teléfono de contacto",VALORES:"099111222 · 2XXX XXXX"},
                {CAMPO:"RUBRO",REQUERIDO:"NO",DESCRIPCION:"Rubro comercial",VALORES:"Supermercado | Farmacia | Combustible | Restaurante | Hotel | Retail | Banco | Otro"},
                {CAMPO:"FRANJA_HORARIA",REQUERIDO:"SÍ",DESCRIPCION:"Ventana horaria — 8am a 22hs en 4 franjas",VALORES:"FH1 (8-12) | FH2 (12-16) | FH3 (16-19) | FH4 (19-22)"},
                {CAMPO:"PRIORIDAD",REQUERIDO:"SÍ",DESCRIPCION:"Nivel de prioridad del caso",VALORES:"CRITICA | ALTA | MEDIA | BAJA"},
              ];
              const ws2=XLSX.utils.json_to_sheet(dict);
              ws2["!cols"]=[{wch:16},{wch:10},{wch:40},{wch:46}];
              XLSX.utils.book_append_sheet(wb,"DICCIONARIO",ws2);
              XLSX.writeFile(wb,"BOOLEAN_plantilla_carga_masiva.xlsx");
            }catch(e){alert("Error generando plantilla: "+e.message);}
          }}/>
          {step>1&&<Bb label="↺ NUEVA CARGA" onClick={reset} ghost small color={B.t2}/>}
        </div>
      </div>

      {/* Stepper */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
        {[["1","SUBIR ARCHIVO"],["2","VALIDAR"],["3","IMPORTADO"]].map(([n,l],i)=>(
          <div key={n} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,flexShrink:0,
              background:step>i?B.green:step===i+1?B.orange:B.border,
              color:step>i||step===i+1?"#050507":B.t3,fontFamily:"'Orbitron',sans-serif"}}>
              {step>i?"✓":n}
            </div>
            <span style={{fontSize:9,color:step===i+1?B.orange:B.t3,fontWeight:700,letterSpacing:".08em"}}>{l}</span>
            {i<2&&<div style={{width:20,height:1,background:B.border,flexShrink:0}}/>}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step===1&&(
        <>
          <div style={{background:B.orangeDim,border:`1px solid ${B.orange}22`,borderLeft:`3px solid ${B.orange}`,padding:"12px 16px",marginBottom:14,fontSize:11}}>
            <div style={{color:B.orange,fontWeight:700,letterSpacing:".08em",marginBottom:6}}>CAMPOS REQUERIDOS EN EL EXCEL:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {["TIPO_ACCION","NRO_TERMINAL","RUT","RAZON_SOCIAL","TIER","DEPARTAMENTO","LOCALIDAD","DIRECCION","FRANJA_HORARIA","PRIORIDAD"].map(f=>(
                <span key={f} style={{background:B.red+"22",color:B.red,border:`1px solid ${B.red}33`,padding:"2px 9px",fontSize:9,fontWeight:700}}>★ {f}</span>
              ))}
              {["ID_EXTERNO","SUB_TIPO","OBS_MODELO","TELEFONO","RUBRO"].map(f=>(
                <span key={f} style={{background:B.border,color:B.t3,padding:"2px 9px",fontSize:9}}>· {f}</span>
              ))}
            </div>
            <div style={{marginTop:8,fontSize:10,color:B.t2}}>
              ℹ <strong style={{color:B.t1}}>ID_EXTERNO</strong> — si no se provee, el sistema asigna un ID con prefijo <span style={{color:B.blue,fontWeight:700}}>BN-</span>&nbsp;·&nbsp;
              <strong style={{color:B.t1}}>NRO_TERMINAL</strong> solo numérico&nbsp;·&nbsp;
              <strong style={{color:B.t1}}>SUB_TIPO</strong> solo para SERVICIO_TECNICO
            </div>
          </div>
          <div onClick={()=>fileRef.current?.click()}
            style={{border:`2px dashed ${B.border}`,background:B.deep,padding:"36px 20px",textAlign:"center",cursor:"pointer",transition:"all .15s",marginBottom:14}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=B.orange}
            onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}}
              onChange={e=>{const f=e.target.files[0];if(f){setFile(f);setRows([]);setErrors([]);setDone(0);parseFile(f);}}}/>
            <div style={{fontSize:38,marginBottom:9}}>📂</div>
            <div style={{fontSize:13,color:B.t1,fontWeight:600,marginBottom:4}}>Arrastrá o hacé clic para seleccionar</div>
            <div style={{fontSize:10,color:B.t3}}>{file?file.name:".xlsx · .xls · .csv — Máximo 500 filas"}</div>
          </div>
          {errors.length>0&&(
            <div style={{background:B.redDim,border:`1px solid ${B.red}33`,borderLeft:`3px solid ${B.red}`,padding:14,marginBottom:14}}>
              <div style={{color:B.red,fontWeight:700,marginBottom:8,letterSpacing:".06em"}}>⚠ {errors.length} ERRORES DETECTADOS — CORREGÍ EL ARCHIVO Y VOLVÉ A SUBIRLO</div>
              {errors.slice(0,8).map((e,i)=><div key={i} style={{fontSize:11,color:B.t2,marginBottom:2}}>· {e}</div>)}
              {errors.length>8&&<div style={{fontSize:10,color:B.t3,marginTop:4}}>...y {errors.length-8} más</div>}
            </div>
          )}
          {rows.length>0&&errors.length===0&&(
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <Bb label={`CONTINUAR → ${rows.length} FILAS VÁLIDAS`} onClick={()=>setStep(2)}/>
            </div>
          )}
        </>
      )}

      {/* STEP 2: Preview + import */}
      {step===2&&(
        <>
          <div style={{display:"flex",gap:11,marginBottom:14,flexWrap:"wrap"}}>
            {[[rows.length,"FILAS TOTALES",B.orange],[rows.filter(r=>!r.id_externo?.startsWith("BN-")).length,"CON ID EXTERNO",B.blue],[rows.filter(r=>r.id_externo?.startsWith("BN-")).length,"ID BOOLEAN AUTO",B.purple]].map(([v,l,c])=>(
              <div key={l} className="card" style={{flex:1,minWidth:110,padding:12,borderTop:`2px solid ${c}`,textAlign:"center"}}>
                <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:24,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:9,color:B.t3,fontWeight:700,letterSpacing:".08em",marginTop:3}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{overflowX:"auto",marginBottom:14}}>
            <table>
              <thead>
                <tr>
                  {["ID","TIPO","SUB_TIPO","TERMINAL","RUT / RAZÓN SOCIAL","TIER","DPTO","FRANJA","PRIORIDAD","ESTADO"].map(h=><th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0,10).map((r,i)=>{
                  const tipo=r.tipo_accion?.toUpperCase();
                  const prio=r.prioridad?.toUpperCase();
                  const tier=r.tier?.toUpperCase();
                  const isAutoId=r.id_externo?.startsWith("BN-");
                  return(
                    <tr key={i}>
                      <td>
                        <span style={{fontSize:9,fontFamily:"monospace",color:isAutoId?B.purple:B.blue,fontWeight:700,padding:"1px 5px",background:isAutoId?B.purpleDim:B.blueDim,border:`1px solid ${isAutoId?B.purple:B.blue}33`}}>
                          {r.id_externo}
                        </span>
                      </td>
                      <td><span style={{color:TIPO_C_LOCAL[tipo]||B.t2,fontWeight:700,fontSize:10}}>{TIPO_ACCION_IC[tipo]||"◈"} {tipo}</span></td>
                      <td style={{fontSize:10,color:B.purple}}>{r.sub_tipo||"—"}</td>
                      <td style={{fontFamily:"monospace",fontSize:10,color:B.t1}}>{r.nro_terminal}</td>
                      <td>
                        <div style={{fontSize:11,fontWeight:600}}>{r.razon_social}</div>
                        <div style={{fontSize:9,color:B.t3,fontFamily:"monospace"}}>{r.rut}</div>
                      </td>
                      <td><span style={{color:TIER_C_LOCAL[tier]||B.t2,fontWeight:700,fontSize:10}}>{tier}</span></td>
                      <td style={{fontSize:10,color:B.t2}}>{r.departamento}</td>
                      <td style={{fontSize:10,color:"#CC7700"}}>{r.franja_horaria}</td>
                      <td><Tg label={prio||"MEDIA"} color={PRIO_C_LOCAL[prio]||B.t2}/></td>
                      <td><Tg label="PENDIENTE" color={B.t3}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length>10&&<div style={{fontSize:10,color:B.t3,padding:"6px 12px"}}>...y {rows.length-10} filas más</div>}
          </div>
          <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
            <Bb label="← VOLVER" onClick={()=>setStep(1)} ghost small color={B.t2}/>
            <Bb label={loading?`IMPORTANDO... ${done}/${rows.length}`:`⬆ IMPORTAR ${rows.length} CASOS`} onClick={importar} disabled={loading}/>
          </div>
        </>
      )}

      {/* STEP 3: Done */}
      {step===3&&(
        <div className="fade-in card" style={{padding:24,maxWidth:480,borderLeft:`4px solid ${B.green}`}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:900,color:B.green,marginBottom:10}}>✓ IMPORTACIÓN COMPLETADA</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:32,fontWeight:900,color:B.orange,marginBottom:6}}>{done}</div>
          <div style={{fontSize:12,color:B.t2,marginBottom:18}}>casos creados correctamente y disponibles en el módulo de Casos.</div>
          <Bb label="↺ NUEVA IMPORTACIÓN" onClick={reset}/>
        </div>
      )}
    </div>
  );
};

// ─── ANALÍTICA ───────────────────────────────────────────────
const Analitica=({user,toast})=>{
  const [tab,setTab]=useState("productividad");
  const [casos,setCasos]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      const{data}=await supabase.from("casos").select("*").order("created_at",{ascending:false}).limit(500);
      setCasos(data||[]);setLoading(false);
    })();
  },[]);

  const TABS=[
    {id:"productividad",label:"PRODUCTIVIDAD"},
    {id:"sla",label:"SLA"},
    {id:"incidentes",label:"INCIDENTES"},
    {id:"empresas",label:"EMPRESAS"},
    {id:"alertas",label:"🔔 RECORDATORIOS"},
  ];

  if(loading)return<div style={{textAlign:"center",padding:60,color:B.t3}}><Spin/></div>;

  const total=casos.length;
  const cerrados=casos.filter(c=>c.estado==="CERRADO"||c.estado==="RESUELTO").length;
  const slaOk=casos.filter(c=>c.sla_deadline&&c.fecha_cierre&&new Date(c.fecha_cierre)<new Date(c.sla_deadline)).length;
  const incidentes=casos.filter(c=>c.es_incidente).length;
  const pctCierre=total?Math.round(cerrados/total*100):0;
  const pctSla=cerrados?Math.round(slaOk/cerrados*100):0;

  const byEmpresa=EMPRESAS.map(e=>({...e,count:casos.filter(c=>c.empresa_id===e.codigo).length})).sort((a,b)=>b.count-a.count);
  const byTipo=TIPOS_PROCESO.map(t=>({...t,count:casos.filter(c=>c.tipo_proceso===t.codigo).length}));
  const byEstado=["PENDIENTE","EN_PROCESO","EN_ESPERA","RESUELTO","CERRADO"].map(e=>({estado:e,count:casos.filter(c=>c.estado===e).length}));

  const KPI=({val,label,sub,color})=>(
    <div style={{background:B.card,border:`1px solid ${B.border}`,padding:16,textAlign:"center"}}>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:28,fontWeight:900,color:color||B.orange}}>{val}</div>
      <div style={{fontSize:11,fontWeight:700,color:B.t1,marginTop:4}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:B.t3,marginTop:2}}>{sub}</div>}
    </div>
  );

  const BarChart=({data,keyField,valField,color})=>{
    const max=Math.max(...data.map(d=>d[valField]),1);
    return(
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {data.filter(d=>d[valField]>0).map(d=>(
          <div key={d[keyField]} style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:100,fontSize:10,color:B.t2,textAlign:"right",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d[keyField]}</div>
            <div style={{flex:1,height:20,background:B.bg,position:"relative"}}>
              <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${d[valField]/max*100}%`,background:color||B.orange,transition:"width .4s"}}/>
              <span style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",fontSize:10,fontWeight:700,color:B.t1,zIndex:1}}>{d[valField]}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return(
    <div>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:18,color:B.t1,marginBottom:20}}>◈ ANALÍTICA OPERATIVA</div>
      {/* KPIs globales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <KPI val={total} label="TOTAL CASOS"/>
        <KPI val={cerrados} label="CERRADOS" sub={`${pctCierre}% del total`} color={B.green}/>
        <KPI val={`${pctSla}%`} label="SLA CUMPLIDO" color={pctSla>=80?B.green:pctSla>=60?B.orange:B.red}/>
        <KPI val={incidentes} label="INCIDENTES" color={B.red}/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:`1px solid ${B.border}`,paddingBottom:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"8px 14px",background:tab===t.id?B.orange:"none",color:tab===t.id?B.bg:B.t3,border:"none",cursor:"pointer",fontSize:10,fontFamily:"'Orbitron',sans-serif",fontWeight:700,letterSpacing:".08em",transition:"all .15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:20}}>
        {tab==="productividad"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div>
              <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:12}}>CASOS POR ESTADO</div>
              <BarChart data={byEstado.map(d=>({name:d.estado,count:d.count}))} keyField="name" valField="count" color={B.blue}/>
            </div>
            <div>
              <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:12}}>CASOS POR TIPO</div>
              <BarChart data={byTipo.map(d=>({name:d.nombre,count:d.count}))} keyField="name" valField="count" color={B.purple}/>
            </div>
          </div>
        )}
        {tab==="sla"&&(
          <div>
            <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:16}}>CUMPLIMIENTO SLA POR EMPRESA</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {byEmpresa.filter(e=>e.count>0).map(e=>{
                const empCasos=casos.filter(c=>c.empresa_id===e.codigo&&(c.estado==="CERRADO"||c.estado==="RESUELTO"));
                const empSla=empCasos.filter(c=>c.sla_deadline&&c.fecha_cierre&&new Date(c.fecha_cierre)<new Date(c.sla_deadline)).length;
                const pct=empCasos.length?Math.round(empSla/empCasos.length*100):0;
                return(
                  <div key={e.codigo} style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:90,fontSize:10,color:B.t2,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.nombre}</div>
                    <div style={{flex:1,height:18,background:B.bg,position:"relative"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:pct>=80?B.green:pct>=60?B.orange:B.red,transition:"width .4s"}}/>
                    </div>
                    <div style={{width:36,fontSize:11,fontWeight:700,color:pct>=80?B.green:pct>=60?B.orange:B.red,textAlign:"right"}}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {tab==="incidentes"&&(
          <div>
            <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:12}}>INCIDENTES ACTIVOS</div>
            {casos.filter(c=>c.es_incidente).length===0?(
              <div style={{textAlign:"center",padding:30,color:B.t3}}>Sin incidentes registrados</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[...new Set(casos.filter(c=>c.es_incidente&&c.incidente_id).map(c=>c.incidente_id))].map(inc=>{
                  const incCasos=casos.filter(c=>c.incidente_id===inc);
                  const abiertos=incCasos.filter(c=>c.estado!=="CERRADO").length;
                  return(
                    <div key={inc} style={{background:B.bg,border:`1px solid ${B.red}33`,borderLeft:`3px solid ${B.red}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
                      <Tg label="INC" color={B.red}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:700,color:B.t1}}>{inc}</div>
                        <div style={{fontSize:10,color:B.t3}}>{incCasos.length} casos · {abiertos} abiertos</div>
                      </div>
                      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,color:abiertos>0?B.red:B.green}}>{abiertos}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {tab==="empresas"&&(
          <div>
            <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:12}}>CASOS POR EMPRESA</div>
            <BarChart data={byEmpresa.map(e=>({name:e.nombre,count:e.count}))} keyField="name" valField="count" color={B.orange}/>
          </div>
        )}
        {tab==="alertas"&&(
          <AlertasRecordatorio user={user}/>
        )}
      </div>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════
// PART 8 — Comunicaciones, Logros, Usuarios, Config, App Root
// ═══════════════════════════════════════════════════════════

// ─── MI RUTA DEL DÍA ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// MI RUTA DEL DÍA — Módulo completo con mapa y ruta óptima
// Usa OpenRouteService (gratuito) + Leaflet (mapa visual)
// ═══════════════════════════════════════════════════════════════

// ─── CONSTANTE API KEY ORS ─────────────────────────────────────
// El usuario debe poner su key de openrouteservice.org (gratuita)
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || "";

// ─── HELPERS DE GEOCODIFICACIÓN Y RUTA ────────────────────────
const geocodificarDireccion = async (direccion, departamento, localidad) => {
  const query = [direccion, localidad, departamento, "Uruguay"].filter(Boolean).join(", ");
  try {
    const res = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&boundary.country=UY&size=1`,
      { headers: { Accept: "application/json" } }
    );
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng, ok: true };
    }
  } catch (e) { /* si falla ORS, usa Nominatim */ }
  // Fallback: Nominatim (OpenStreetMap, sin key)
  try {
    const res2 = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=uy`,
      { headers: { "Accept-Language": "es" } }
    );
    const data2 = await res2.json();
    if (data2.length > 0) return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon), ok: true };
  } catch (e) {}
  return { lat: null, lng: null, ok: false };
};

const calcularRutaORS = async (puntos) => {
  // puntos: [{lat,lng}, ...] — primer y último son la base
  if (puntos.length < 2) return null;
  if (!ORS_API_KEY) return null;
  try {
    const coords = puntos.map(p => [p.lng, p.lat]);
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/json", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: ORS_API_KEY },
      body: JSON.stringify({ coordinates: coords, instructions: false })
    });
    const data = await res.json();
    if (data.routes?.[0]) {
      const route = data.routes[0];
      const totalKm  = (route.summary.distance / 1000).toFixed(1);
      const totalMin = Math.round(route.summary.duration / 60);
      // Decodificar polyline encoded geometry
      const geom = route.geometry;
      let polyline = [];
      try {
        // ORS devuelve GeoJSON o encoded — intentar ambos
        if (typeof geom === "string") {
          polyline = decodePolyline(geom);
        } else if (geom?.coordinates) {
          polyline = geom.coordinates.map(([lng, lat]) => [lat, lng]);
        }
      } catch {}
      // Distancias entre paradas
      const legs = route.segments || [];
      return { totalKm, totalMin, polyline, legs, ok: true };
    }
  } catch (e) {}
  return { ok: false };
};

// Decoder de Polyline encoded (formato Google/ORS)
const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
};

// Algoritmo greedy de vecino más cercano para ordenar paradas
const ordenarPorCercania = (base, paradas) => {
  if (!paradas.length) return [];
  const dist = (a, b) => Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
  const resultado = [];
  let restantes = [...paradas];
  let actual = base;
  while (restantes.length > 0) {
    let minIdx = 0;
    let minDist = Infinity;
    restantes.forEach((p, i) => { const d = dist(actual, p); if (d < minDist) { minDist = d; minIdx = i; } });
    resultado.push(restantes[minIdx]);
    actual = restantes[minIdx];
    restantes.splice(minIdx, 1);
  }
  return resultado;
};

// ─── MAPA LEAFLET (inyectado via script dinámico) ─────────────
const useLeaflet = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    // CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
};

const MapaRuta = ({ base, paradas, polyline }) => {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);
  const leafletOk = useLeaflet();

  useEffect(() => {
    if (!leafletOk || !mapRef.current || !base?.lat) return;
    const L = window.L;

    // Inicializar o reusar mapa
    if (!mapObj.current) {
      mapObj.current = L.map(mapRef.current, { zoomControl: true }).setView([base.lat, base.lng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18
      }).addTo(mapObj.current);
    } else {
      // limpiar capas anteriores
      mapObj.current.eachLayer(l => { if (l._url) return; mapObj.current.removeLayer(l); });
    }

    const map = mapObj.current;
    const bounds = [];

    // Marcador base
    const iconBase = L.divIcon({
      className: "",
      html: `<div style="width:32px;height:32px;background:#FF6B00;border:3px solid #FFA500;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 12px #FF6B0088;color:#050507;font-weight:900">🏠</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16]
    });
    L.marker([base.lat, base.lng], { icon: iconBase })
      .addTo(map).bindPopup("<b>BASE OPERATIVA</b>");
    bounds.push([base.lat, base.lng]);

    // Marcadores de paradas
    const PRIO_C_MAP = { CRITICA: "#FF2040", ALTA: "#FF6B00", MEDIA: "#00A8FF", BAJA: "#00E87A" };
    paradas.forEach((p, i) => {
      if (!p.lat) return;
      const color = PRIO_C_MAP[p.prioridad] || "#6868A0";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:30px;height:30px;background:#0D0D15;border:2px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:${color};font-family:Orbitron,sans-serif;box-shadow:0 0 8px ${color}66">${i + 1}</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15]
      });
      L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${i + 1}. ${p.razon_social || "Comercio"}</b><br>${p.direccion || ""}<br><span style="color:${color}">${p.tipo_proceso} · ${p.prioridad}</span>`);
      bounds.push([p.lat, p.lng]);
    });

    // Trazar ruta si hay polyline
    if (polyline?.length > 1) {
      L.polyline(polyline, { color: "#FF6B00", weight: 4, opacity: 0.85, dashArray: null }).addTo(map);
    } else if (bounds.length > 1) {
      // Sin ruta ORS: línea recta entre puntos
      L.polyline(bounds, { color: "#FF6B0066", weight: 2, dashArray: "6 4" }).addTo(map);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [leafletOk, base, paradas, polyline]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: 340, background: B.deep, borderRadius: 2 }}/>
      {!leafletOk && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: B.deep, flexDirection: "column", gap: 10 }}>
          <Spin s={24}/><span style={{ fontSize: 11, color: B.t3 }}>Cargando mapa...</span>
        </div>
      )}
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────
const MiRutaDelDia = ({ user, toast }) => {
  const [casos,      setCasos]      = useState([]);
  const [tecnicoSel, setTecnicoSel] = useState(null);  // para supervisor
  const [tecnicos,   setTecnicos]   = useState([]);
  const [base,       setBase]       = useState({ lat: null, lng: null, direccion: "" });
  const [baseTxt,    setBaseTxt]    = useState("");
  const [editBase,   setEditBase]   = useState(false);
  const [paradas,    setParadas]    = useState([]);
  const [polyline,   setPolyline]   = useState([]);
  const [rutaInfo,   setRutaInfo]   = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [loadingPage,setLoadingPage]= useState(true);
  const [orden,      setOrden]      = useState([]);  // índices ordenados
  const [dragging,   setDragging]   = useState(null);

  const esRolTecnico = user?.user_metadata?.rol === "tecnico" || user?.email?.includes("tecnico");
  const esRolSupervisor = !esRolTecnico;

  // Carga inicial
  useEffect(() => { cargarDatos(); }, []);

  // Recalcular cuando cambian casos (caso nuevo agregado en el día)
  useEffect(() => {
    if (paradas.length > 0 && base.lat) calcularRuta(paradas);
  }, [casos.length]);

  const cargarDatos = async () => {
    setLoadingPage(true);
    const hoyInicio = new Date(); hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin    = new Date(); hoyFin.setHours(23, 59, 59, 999);

    if (esRolSupervisor) {
      // Supervisor: carga todos los técnicos de su equipo
      const { data: tecs } = await supabase.from("usuarios").select("*").eq("rol", "tecnico");
      setTecnicos(tecs || []);
      if (tecs?.length > 0) await cargarCasosTecnico(tecs[0], hoyInicio, hoyFin);
    } else {
      // Técnico: carga sus propios casos del día
      const { data: perfil } = await supabase.from("usuarios").select("*").eq("auth_id", user.id).single();
      if (perfil?.base_operativa) {
        setBaseTxt(perfil.base_operativa);
        const coords = await geocodificarDireccion(perfil.base_operativa, "", "");
        setBase({ ...coords, direccion: perfil.base_operativa });
      }
      const { data: c } = await supabase.from("casos").select("*")
        .eq("tecnico_id", user.id)
        .not("estado", "in", "(CERRADO,RESUELTO)")
        .order("created_at", { ascending: true });
      setCasos(c || []);
      if (c?.length) await geocodificarYOrdenar(c, base);
    }
    setLoadingPage(false);
  };

  const cargarCasosTecnico = async (tec, hoyInicio, hoyFin) => {
    setTecnicoSel(tec);
    if (tec.base_operativa) {
      setBaseTxt(tec.base_operativa);
      const coords = await geocodificarDireccion(tec.base_operativa, "", "");
      setBase({ ...coords, direccion: tec.base_operativa });
    }
    const { data: c } = await supabase.from("casos").select("*")
      .eq("tecnico_id", tec.auth_id || tec.id)
      .not("estado", "in", "(CERRADO,RESUELTO)")
      .order("created_at", { ascending: true });
    setCasos(c || []);
    if (c?.length) await geocodificarYOrdenar(c, base);
  };

  const geocodificarYOrdenar = async (listaCasos, baseCoords) => {
    setCalculando(true);
    // Geocodificar cada caso
    const conCoords = await Promise.all(
      listaCasos.map(async c => {
        const coords = await geocodificarDireccion(c.direccion, c.departamento, c.localidad);
        return { ...c, ...coords };
      })
    );
    const validos = conCoords.filter(c => c.ok && c.lat);
    const base_c  = (baseCoords?.lat) ? baseCoords : { lat: -34.9, lng: -56.18 }; // default Montevideo
    const ordenados = ordenarPorCercania(base_c, validos);
    setParadas(ordenados);
    setOrden(ordenados.map((_, i) => i));
    await calcularRuta(ordenados, base_c);
    setCalculando(false);
  };

  const calcularRuta = async (stops, baseCoords) => {
    const b = baseCoords || base;
    if (!b?.lat || stops.length === 0) return;
    const puntos = [b, ...stops.filter(s => s.lat), b];
    const resultado = await calcularRutaORS(puntos);
    if (resultado?.ok) {
      setPolyline(resultado.polyline);
      setRutaInfo({ km: resultado.totalKm, min: resultado.totalMin });
    } else {
      setPolyline([]);
      setRutaInfo(null);
    }
  };

  const guardarBase = async () => {
    if (!baseTxt.trim()) return;
    const coords = await geocodificarDireccion(baseTxt, "", "");
    setBase({ ...coords, direccion: baseTxt });
    // Guardar en perfil
    await supabase.from("usuarios").update({ base_operativa: baseTxt }).eq("auth_id", user.id);
    setEditBase(false);
    toast("✓ Base operativa guardada");
    if (paradas.length > 0) await calcularRuta(paradas, coords);
  };

  const moverParada = (desde, hacia) => {
    const nuevo = [...paradas];
    const [item] = nuevo.splice(desde, 1);
    nuevo.splice(hacia, 0, item);
    setParadas(nuevo);
    calcularRuta(nuevo);
  };

  const abrirEnMaps = () => {
    if (!base.lat || paradas.length === 0) return;
    const origen = `${base.lat},${base.lng}`;
    const stops  = paradas.filter(p => p.lat).map(p => `${p.lat},${p.lng}`).join("/");
    window.open(`https://www.google.com/maps/dir/${origen}/${stops}/${origen}`, "_blank");
  };

  const abrirEnWaze = () => {
    if (paradas.length === 0) return;
    const p = paradas[0];
    window.open(`https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`, "_blank");
  };

  const FRANJA_HORA = { "FH1 (8-12)": "08:00", "FH2 (12-16)": "12:00", "FH3 (16-19)": "16:00", "FH4 (19-22)": "19:00" };
  const PRIO_C_L    = { CRITICA: B.red, ALTA: B.orange, MEDIA: B.blue, BAJA: B.green };
  const TIER_C_L    = { VIP: B.amber, T1a: B.orange, T1b: B.blue, T2: B.green };
  const TIPO_IC     = { INSTALACION:"📦", SERVICIO_TECNICO:"🔧", RETIRO:"🔄", VISITA_PROACTIVA:"👁" };

  if (loadingPage) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, flexDirection: "column", gap: 14 }}>
      <Spin s={28}/><span style={{ color: B.t3, fontSize: 12 }}>Cargando casos del día...</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: B.t3, fontWeight: 700, letterSpacing: ".18em", marginBottom: 3 }}>MÓDULO DE CAMPO</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 18, color: B.t1 }}>◈ MI RUTA DEL DÍA</div>
          <div style={{ fontSize: 11, color: B.t2, marginTop: 4 }}>
            {paradas.length} paradas · {rutaInfo ? `${rutaInfo.km} km · ~${rutaInfo.min} min` : "Calculando ruta..."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {base.lat && paradas.length > 0 && (
            <>
              <Bb label="🗺 Google Maps" onClick={abrirEnMaps} ghost small color={B.blue}/>
              <Bb label="🔵 Waze" onClick={abrirEnWaze} ghost small color={B.purple}/>
            </>
          )}
          {calculando && <div style={{ display: "flex", alignItems: "center", gap: 6, color: B.t3, fontSize: 11 }}><Spin s={14}/> Recalculando...</div>}
        </div>
      </div>

      {/* Selector de técnico (solo supervisor) */}
      {esRolSupervisor && tecnicos.length > 0 && (
        <div style={{ background: B.card, border: `1px solid ${B.border}`, padding: 14, marginBottom: 16 }}>
          <FL label="Ver ruta de técnico"/>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {tecnicos.map(t => (
              <button key={t.id} onClick={() => cargarCasosTecnico(t)}
                style={{ padding: "6px 14px", background: tecnicoSel?.id === t.id ? B.orange : B.deep,
                  color: tecnicoSel?.id === t.id ? "#050507" : B.t2,
                  border: `1px solid ${tecnicoSel?.id === t.id ? B.orange : B.border}`,
                  cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all .15s" }}>
                {t.nombre || t.email}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Base operativa */}
      <div style={{ background: B.card, border: `1px solid ${B.orange}33`, padding: 14, marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 20 }}>🏠</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: B.orange, fontWeight: 700, letterSpacing: ".1em", marginBottom: 4 }}>BASE OPERATIVA</div>
          {editBase ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input className="field" style={{ flex: 1 }} value={baseTxt}
                onChange={e => setBaseTxt(e.target.value)}
                placeholder="Dirección de tu base operativa..."
                onKeyDown={e => e.key === "Enter" && guardarBase()}/>
              <Bb label="GUARDAR" onClick={guardarBase} small/>
              <Bb label="✕" onClick={() => setEditBase(false)} ghost small color={B.t2}/>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: base.lat ? B.t1 : B.t3 }}>
                {base.direccion || "Sin base configurada"}
              </span>
              {!esRolSupervisor && (
                <button onClick={() => setEditBase(true)}
                  style={{ background: "none", border: `1px solid ${B.border}`, color: B.t3,
                    cursor: "pointer", fontSize: 10, padding: "2px 8px" }}>✎</button>
              )}
              {base.lat && <Dot c={B.green} s={6}/>}
            </div>
          )}
        </div>
        {rutaInfo && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: B.orange }}>{rutaInfo.km} km</div>
            <div style={{ fontSize: 10, color: B.t3 }}>~{rutaInfo.min} min de ruta</div>
          </div>
        )}
      </div>

      {/* Sin casos */}
      {paradas.length === 0 && !calculando && (
        <div style={{ background: B.card, border: `1px solid ${B.border}`, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗺</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: B.t2, marginBottom: 6 }}>Sin casos asignados para hoy</div>
          <div style={{ fontSize: 11, color: B.t3 }}>Cuando se asignen casos aparecerán aquí ordenados por cercanía</div>
        </div>
      )}

      {paradas.length > 0 && (
        <>
          {/* Mapa */}
          <div style={{ background: B.card, border: `1px solid ${B.border}`, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: B.orange, fontWeight: 700, letterSpacing: ".1em" }}>◈ MAPA DE RUTA</span>
              {!ORS_API_KEY && (
                <span style={{ fontSize: 9, color: B.t3 }}>
                  Sin key ORS — ruta aproximada · <a href="https://openrouteservice.org/dev/#/signup" target="_blank"
                    style={{ color: B.blue, textDecoration: "none" }}>Obtener key gratis →</a>
                </span>
              )}
            </div>
            <MapaRuta base={base} paradas={paradas} polyline={polyline}/>
          </div>

          {/* Lista de paradas */}
          <div style={{ background: B.card, border: `1px solid ${B.border}`, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: B.orange, fontWeight: 700, letterSpacing: ".1em" }}>◈ PARADAS EN ORDEN ÓPTIMO</span>
              <span style={{ fontSize: 10, color: B.t3 }}>Arrastrá para reordenar</span>
            </div>

            {/* Salida */}
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${B.border}18`,
              display: "flex", alignItems: "center", gap: 12, background: "#0E0800" }}>
              <div style={{ width: 28, height: 28, background: B.orange, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏠</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: B.orange }}>SALIDA — BASE OPERATIVA</div>
                <div style={{ fontSize: 10, color: B.t3 }}>{base.direccion}</div>
              </div>
            </div>

            {paradas.map((p, i) => {
              const prioColor  = PRIO_C_L[p.prioridad]  || B.t2;
              const tierColor  = TIER_C_L[p.tier]        || B.t2;
              const franjaHora = FRANJA_HORA[p.franja_horaria] || p.rango_horario || "—";
              const tieneInstr = !!(p.instrucciones_especiales?.texto || p.instrucciones_especiales?.adjuntos?.length);
              return (
                <div key={p.id}
                  draggable={!esRolSupervisor}
                  onDragStart={() => setDragging(i)}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={() => { if (dragging !== null && dragging !== i) { moverParada(dragging, i); setDragging(null); } }}
                  style={{ padding: "12px 16px", borderBottom: `1px solid ${B.border}18`,
                    display: "flex", alignItems: "flex-start", gap: 12,
                    background: dragging === i ? B.orangeDim : i % 2 === 0 ? B.cardHi : B.card,
                    cursor: esRolSupervisor ? "default" : "grab", transition: "background .15s" }}>

                  {/* Número */}
                  <div style={{ width: 28, height: 28, background: B.deep, border: `2px solid ${prioColor}`,
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 900, color: prioColor, flexShrink: 0 }}>
                    {i + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{TIPO_IC[p.tipo_proceso] || "◈"}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: B.t1 }}>{p.razon_social || "Comercio"}</span>
                      {tieneInstr && (
                        <span style={{ fontSize: 9, background: B.orange + "22", color: B.orange,
                          border: `1px solid ${B.orange}44`, padding: "1px 6px", fontWeight: 700 }}>⚠ INSTRUCCIONES</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: B.t2, marginBottom: 4 }}>{p.direccion || "—"}{p.localidad ? ` · ${p.localidad}` : ""}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="mono" style={{ fontSize: 9, color: B.t3 }}>{p.numero || p.id_externo || "—"}</span>
                      {p.tier && <span style={{ fontSize: 9, color: tierColor, fontWeight: 700 }}>{p.tier}</span>}
                      {p.prioridad && <Tg label={p.prioridad} color={prioColor}/>}
                      {(p.franja_horaria || p.rango_horario) && (
                        <span style={{ fontSize: 9, background: "#FFFFF8E8", color: "#CC7700",
                          padding: "1px 7px", fontWeight: 700, border: "1px solid #CC770033" }}>
                          🕐 {p.franja_horaria || p.rango_horario} {franjaHora !== "—" ? `(desde ${franjaHora})` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Distancia al siguiente */}
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 60 }}>
                    <div style={{ fontSize: 9, color: B.t3 }}>al siguiente</div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: B.t2, fontWeight: 700 }}>
                      {rutaInfo && p.distSig ? `${(p.distSig / 1000).toFixed(1)} km` : "—"}
                    </div>
                    {!esRolSupervisor && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-end" }}>
                        {i > 0 && (
                          <button onClick={() => moverParada(i, i - 1)}
                            style={{ background: B.border, border: "none", color: B.t2, cursor: "pointer",
                              width: 20, height: 20, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>▲</button>
                        )}
                        {i < paradas.length - 1 && (
                          <button onClick={() => moverParada(i, i + 1)}
                            style={{ background: B.border, border: "none", color: B.t2, cursor: "pointer",
                              width: 20, height: 20, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>▼</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Regreso */}
            <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, background: "#0E0800" }}>
              <div style={{ width: 28, height: 28, background: B.green, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏁</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: B.green }}>REGRESO — BASE OPERATIVA</div>
                <div style={{ fontSize: 10, color: B.t3 }}>{base.direccion}</div>
              </div>
              {rutaInfo && (
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: B.green }}>{rutaInfo.km} km</div>
                  <div style={{ fontSize: 9, color: B.t3 }}>total · ~{rutaInfo.min} min</div>
                </div>
              )}
            </div>
          </div>

          {/* Info ORS key */}
          {!ORS_API_KEY && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: B.blueDim,
              border: `1px solid ${B.blue}33`, borderLeft: `3px solid ${B.blue}`, fontSize: 11 }}>
              <div style={{ color: B.blue, fontWeight: 700, marginBottom: 4 }}>◈ PARA RUTA ÓPTIMA REAL</div>
              <div style={{ color: B.t2, lineHeight: 1.7 }}>
                1. Registrate gratis en <a href="https://openrouteservice.org/dev/#/signup" target="_blank"
                  style={{ color: B.blue }}>openrouteservice.org</a> y copiá tu API key<br/>
                2. En tu proyecto Vercel, agregá la variable: <span className="mono" style={{ color: B.t1 }}>VITE_ORS_API_KEY=tu_key</span><br/>
                3. Redesplegá — la ruta pasará a ser calculada por calles reales
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};


// ─── COMUNICACIONES ──────────────────────────────────────
const Comunicaciones=({user,toast})=>{
  const [canales,setCanales]=useState([]);
  const [canalActivo,setCanalActivo]=useState(null);
  const [msgs,setMsgs]=useState([]);
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(true);
  const bottomRef=useRef(null);

  useEffect(()=>{
    (async()=>{
      let ch=[
        {id:"global",nombre:"🌐 General",descripcion:"Canal global de la operación"},
        ...EMPRESAS.map(e=>({id:`emp_${e.codigo}`,nombre:`${e.nombre}`,descripcion:`Canal de ${e.nombre}`}))
      ];
      setCanales(ch);
      setCanalActivo(ch[0]);
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{
    if(!canalActivo)return;
    setMsgs([]);
    const cargar=async()=>{
      const{data}=await supabase.from("mensajes_chat").select("*").eq("canal_id",canalActivo.id).order("created_at",{ascending:true}).limit(50);
      setMsgs(data||[]);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
    };
    cargar();
    const sub=supabase.channel(`chat_${canalActivo.id}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"mensajes_chat",filter:`canal_id=eq.${canalActivo.id}`},
        payload=>{setMsgs(m=>[...m,payload.new]);setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),50);})
      .subscribe();
    return()=>{supabase.removeChannel(sub);};
  },[canalActivo]);

  const enviar=async()=>{
    if(!msg.trim()||!canalActivo)return;
    const texto=msg.trim();setMsg("");
    const{error}=await supabase.from("mensajes_chat").insert({canal_id:canalActivo.id,autor_id:user.id,autor_email:user.email,texto});
    if(error)toast("Error al enviar mensaje");
  };

  return(
    <div style={{height:"calc(100vh - 160px)",display:"flex",gap:0,overflow:"hidden"}}>
      {/* Sidebar canales */}
      <div style={{width:200,background:B.card,borderRight:`1px solid ${B.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"12px 14px",fontSize:9,fontWeight:700,color:B.orange,letterSpacing:".12em",borderBottom:`1px solid ${B.border}`}}>◈ CANALES</div>
        <div style={{flex:1,overflowY:"auto"}}>
          {canales.map(c=>(
            <button key={c.id} onClick={()=>setCanalActivo(c)}
              style={{width:"100%",display:"block",padding:"10px 14px",background:canalActivo?.id===c.id?B.orangeDim:"none",border:"none",borderLeft:canalActivo?.id===c.id?`3px solid ${B.orange}`:"3px solid transparent",color:canalActivo?.id===c.id?B.orange:B.t2,cursor:"pointer",textAlign:"left",fontSize:11,fontWeight:canalActivo?.id===c.id?700:400,transition:"all .15s"}}>
              # {c.nombre}
            </button>
          ))}
        </div>
      </div>
      {/* Chat */}
      <div style={{flex:1,display:"flex",flexDirection:"column",background:B.bg}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.border}`,background:B.card}}>
          <div style={{fontWeight:700,color:B.t1,fontSize:13}}># {canalActivo?.nombre}</div>
          <div style={{fontSize:10,color:B.t3}}>{canalActivo?.descripcion}</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8}}>
          {msgs.length===0&&<div style={{textAlign:"center",color:B.t3,fontSize:12,padding:30}}>Sin mensajes aún. ¡Sé el primero en escribir!</div>}
          {msgs.map(m=>{
            const esPropio=m.autor_id===user.id||m.autor_email===user.email;
            return(
              <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:esPropio?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"70%",background:esPropio?B.orangeDim:B.card,border:`1px solid ${esPropio?B.orange+"44":B.border}`,padding:"8px 12px",borderRadius:2}}>
                  {!esPropio&&<div style={{fontSize:9,color:B.orange,fontWeight:700,marginBottom:4}}>{m.autor_email?.split("@")[0]?.toUpperCase()}</div>}
                  <div style={{fontSize:12,color:B.t1,lineHeight:1.5}}>{m.texto}</div>
                  <div style={{fontSize:9,color:B.t3,marginTop:4,textAlign:"right"}}>{m.created_at?new Date(m.created_at).toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"}):""}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:12,borderTop:`1px solid ${B.border}`,display:"flex",gap:8}}>
          <input className="field" style={{flex:1}} placeholder={`Mensaje en #${canalActivo?.nombre||"canal"}...`}
            value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviar()}/>
          <Bb label="ENVIAR ▶" onClick={enviar} disabled={!msg.trim()} small/>
        </div>
      </div>
    </div>
  );
};

// ─── LOGROS ──────────────────────────────────────────────
const Logros=({user,toast})=>{
  const [xpData,setXpData]=useState(null);
  const [logros,setLogros]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      const[{data:xp},{data:lg}]=await Promise.all([
        supabase.from("usuario_xp").select("*").eq("usuario_id",user.id).single(),
        supabase.from("logros_config").select("*").order("rareza")
      ]);
      setXpData(xp);setLogros(lg||[]);setLoading(false);
    })();
  },[]);

  const RAREZA_ORDER=["COMMON","RARE","EPIC","LEGENDARY","MYTHIC"];
  const RAREZA_COLOR={COMMON:B=>B.t3,RARE:B=>B.blue,EPIC:B=>B.purple,LEGENDARY:B=>B.orange,MYTHIC:B=>B.red};
  const RAREZA_LABEL={COMMON:"COMÚN",RARE:"RARO",EPIC:"ÉPICO",LEGENDARY:"LEGENDARIO",MYTHIC:"MÍTICO"};

  const xp=xpData?.xp_total||0;
  const nivel=Math.floor(xp/500)+1;
  const pctNivel=(xp%500)/500*100;

  if(loading)return<div style={{textAlign:"center",padding:60}}><Spin/></div>;

  const Hexagon=({logro,desbloqueado})=>{
    const col=RAREZA_COLOR[logro.rareza]?.(B)||B.t3;
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,opacity:desbloqueado?1:0.35,transition:"all .2s",cursor:"default"}}>
        <div style={{width:72,height:72,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg viewBox="0 0 100 100" style={{position:"absolute",width:"100%",height:"100%"}}>
            <polygon points="50,2 95,26 95,74 50,98 5,74 5,26" fill={desbloqueado?`${col}22`:`${B.bg}`} stroke={col} strokeWidth={desbloqueado?2:1}/>
          </svg>
          <span style={{fontSize:26,zIndex:1}}>{logro.icono||"🏆"}</span>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:9,fontWeight:700,color:desbloqueado?col:B.t3,letterSpacing:".06em"}}>{logro.nombre}</div>
          <div style={{fontSize:8,color:B.t3,marginTop:2}}>{RAREZA_LABEL[logro.rareza]}</div>
          {desbloqueado&&<div style={{fontSize:8,color:B.green,marginTop:2}}>+{logro.xp_reward} XP</div>}
        </div>
      </div>
    );
  };

  return(
    <div>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:18,color:B.t1,marginBottom:20}}>◈ LOGROS & XP</div>
      {/* Perfil XP */}
      <div style={{background:B.card,border:`1px solid ${B.border}`,padding:20,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{textAlign:"center",minWidth:80}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:36,fontWeight:900,color:B.orange}}>{nivel}</div>
            <div style={{fontSize:9,color:B.t3,letterSpacing:".1em"}}>NIVEL</div>
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:700,color:B.t1}}>{user.email?.split("@")[0]?.toUpperCase()}</span>
              <span style={{fontSize:11,color:B.orange,fontWeight:700,fontFamily:"'Orbitron',sans-serif"}}>{xp.toLocaleString()} XP</span>
            </div>
            <div style={{height:8,background:B.bg,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pctNivel}%`,background:`linear-gradient(90deg,${B.orange},${B.red})`,borderRadius:4,transition:"width .5s"}}/>
            </div>
            <div style={{fontSize:10,color:B.t3,marginTop:4}}>{xp%500}/{500} XP para nivel {nivel+1}</div>
          </div>
        </div>
        <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${B.border}`,display:"flex",gap:20,flexWrap:"wrap"}}>
          {[["Instalaciones",xpData?.instalaciones_completadas||0,"📦"],["Soportes",xpData?.soportes_completados||0,"🔧"],["Retiros",xpData?.retiros_completados||0,"📤"],["Proactivos",xpData?.proactivos_completados||0,"🔍"]].map(([l,v,ic])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:20}}>{ic}</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900,color:B.t1}}>{v}</div>
              <div style={{fontSize:9,color:B.t3}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Grilla de logros */}
      {RAREZA_ORDER.map(rareza=>{
        const del_rareza=logros.filter(l=>l.rareza===rareza);
        if(!del_rareza.length)return null;
        const col=RAREZA_COLOR[rareza]?.(B)||B.t3;
        return(
          <div key={rareza} style={{marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:700,color:col,letterSpacing:".14em",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
              <span>◈ {RAREZA_LABEL[rareza]}</span>
              <div style={{flex:1,height:1,background:col+"33"}}/>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:20}}>
              {del_rareza.map(l=><Hexagon key={l.id} logro={l} desbloqueado={false}/>)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── USUARIOS ────────────────────────────────────────────
const Usuarios=({user,toast})=>{
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showNew,setShowNew]=useState(false);
  const [form,setForm]=useState({email:"",nombre:"",rol:"tecnico",empresa_id:"",zona_id:""});
  const [saving,setSaving]=useState(false);
  const ROLES=["director","representante_regional","supervisor","tecnico"];
  const ROL_LABEL={director:"Director",representante_regional:"Rep. Regional",supervisor:"Supervisor",tecnico:"Técnico de Campo"};
  const ROL_COLOR={director:B=>B.red,representante_regional:B=>B.orange,supervisor:B=>B.blue,tecnico:B=>B.green};

  useEffect(()=>{
    (async()=>{
      const{data}=await supabase.from("usuarios").select("*").order("created_at",{ascending:false});
      setUsers(data||[]);setLoading(false);
    })();
  },[]);

  const crearUsuario=async()=>{
    if(!form.email||!form.nombre)return;
    setSaving(true);
    const{error}=await supabase.from("usuarios").insert({...form,activo:true});
    if(error){toast("Error: "+error.message);}
    else{
      const{data}=await supabase.from("usuarios").select("*").order("created_at",{ascending:false});
      setUsers(data||[]);
      setShowNew(false);setForm({email:"",nombre:"",rol:"tecnico",empresa_id:"",zona_id:""});
      toast("Usuario creado · Enviar invitación desde Supabase Auth");
    }
    setSaving(false);
  };

  const JERARQUIA=["director","representante_regional","supervisor","tecnico"];
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:18,color:B.t1}}>◈ USUARIOS</div>
        <Bb label="+ NUEVO USUARIO" onClick={()=>setShowNew(true)} small/>
      </div>
      {showNew&&(
        <div style={{background:B.card,border:`1px solid ${B.orange}44`,padding:20,marginBottom:20}}>
          <div style={{fontSize:10,color:B.orange,fontWeight:700,letterSpacing:".1em",marginBottom:14}}>◈ NUEVO USUARIO</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
            <div><FL label="Email" req/><input className="field" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div><FL label="Nombre completo" req/><input className="field" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/></div>
            <div><FL label="Rol"/><select className="field" value={form.rol} onChange={e=>setForm(f=>({...f,rol:e.target.value}))}>
              {ROLES.map(r=><option key={r} value={r}>{ROL_LABEL[r]}</option>)}</select></div>
            <div><FL label="Empresa"/><select className="field" value={form.empresa_id} onChange={e=>setForm(f=>({...f,empresa_id:e.target.value}))}>
              <option value="">Global</option>{EMPRESAS.map(e=><option key={e.codigo} value={e.codigo}>{e.nombre}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Bb label="CANCELAR" onClick={()=>setShowNew(false)} ghost small color={B.t2}/>
            <Bb label={saving?"GUARDANDO...":"CREAR USUARIO"} onClick={crearUsuario} disabled={!form.email||!form.nombre||saving} small/>
          </div>
        </div>
      )}
      {loading?<div style={{textAlign:"center",padding:40}}><Spin/></div>:(
        <div>
          {JERARQUIA.map(rol=>{
            const del_rol=users.filter(u=>u.rol===rol);
            if(!del_rol.length)return null;
            const col=ROL_COLOR[rol]?.(B)||B.t3;
            return(
              <div key={rol} style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:col,letterSpacing:".12em",marginBottom:8}}>◈ {ROL_LABEL[rol].toUpperCase()} ({del_rol.length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {del_rol.map(u=>(
                    <div key={u.id} style={{background:B.card,border:`1px solid ${B.border}`,borderLeft:`3px solid ${col}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:32,height:32,background:`${col}22`,border:`1px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>
                        {u.nombre?.[0]?.toUpperCase()||"?"}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:700,color:B.t1}}>{u.nombre||u.email}</div>
                        <div style={{fontSize:10,color:B.t3}}>{u.email}{u.empresa_id?` · ${EMPRESAS.find(e=>e.codigo===u.empresa_id)?.nombre||u.empresa_id}`:""}</div>
                      </div>
                      <Tg label={u.activo?"ACTIVO":"INACTIVO"} color={u.activo?B.green:B.t3}/>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {users.length===0&&<div style={{textAlign:"center",color:B.t3,padding:30,fontSize:12}}>Sin usuarios registrados. Los usuarios se crean desde Supabase Auth y se sincronizan aquí.</div>}
        </div>
      )}
    </div>
  );
};

// ─── NOTIFICACIONES & RECORDATORIOS ──────────────────────
// ═══════════════════════════════════════════════════════════════
// PUNTO 3 — MOTOR DE RECORDATORIOS POR VENTANA HORARIA
// Web Push API nativa del browser — sin paquetes extra — sin costo
// ═══════════════════════════════════════════════════════════════

// ─── CONSTANTES DE FRANJAS ────────────────────────────────────
const FRANJA_INICIO = {
  "FH1 (8-12)":  { h: 8,  m: 0  },
  "FH2 (12-16)": { h: 12, m: 0  },
  "FH3 (16-19)": { h: 16, m: 0  },
  "FH4 (19-22)": { h: 19, m: 0  },
};

// ─── HELPERS DE PUSH ─────────────────────────────────────────

// Solicita permiso al browser una sola vez
const pedirPermisoNotificaciones = async () => {
  if (!("Notification" in window)) return "no_soportado";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied")  return "denied";
  const result = await Notification.requestPermission();
  return result;
};

// Muestra una notificación nativa del browser
const mostrarNotificacion = (titulo, cuerpo, opciones = {}) => {
  if (Notification.permission !== "granted") return;
  const n = new Notification(titulo, {
    body:    cuerpo,
    icon:    "/favicon.ico",
    badge:   "/favicon.ico",
    tag:     opciones.tag || "boolean-recordatorio",
    silent:  false,
    requireInteraction: opciones.importante || false,
    ...opciones,
  });
  n.onclick = () => { window.focus(); n.close(); };
  // Auto-cerrar a los 12 segundos si no es importante
  if (!opciones.importante) setTimeout(() => n.close(), 12000);
};

// Construye el mensaje de notificación para un caso
const buildMsgNotif = (caso, tipo) => {
  const TIPO_IC = { INSTALACION:"📦", SERVICIO_TECNICO:"🔧", RETIRO:"🔄", VISITA_PROACTIVA:"👁" };
  const ic  = TIPO_IC[caso.tipo_proceso] || "◈";
  const dir = caso.direccion ? caso.direccion.substring(0, 50) : "";
  const com = caso.razon_social || caso.numero || "Caso";
  const franja = caso.franja_horaria || caso.rango_horario || "";

  if (tipo === "principal") {
    return {
      titulo: `${ic} RECORDATORIO · ${com}`,
      cuerpo: `${dir}\n${franja}${caso.instrucciones_especiales?.texto ? "\n⚠ Tiene instrucciones especiales" : ""}`,
    };
  }
  // 10 min antes
  return {
    titulo: `⏰ EN 10 MIN · ${com}`,
    cuerpo: `${dir}\n${franja} — Preparate para salir`,
  };
};

// ─── HOOK PRINCIPAL — useRecordatorios ────────────────────────
const useRecordatorios = (casos, user, minutosAntes) => {
  const timersRef     = useRef([]);   // IDs de setTimeout activos
  const casosIdRef    = useRef(new Set()); // casos ya programados
  const permRef       = useRef(Notification.permission);

  // Calcula ms hasta el inicio de la franja MENOS n minutos
  const msHastaAviso = (caso, restMin) => {
    const franja = caso.franja_horaria || caso.rango_horario;
    const def    = FRANJA_INICIO[franja];
    if (!def) return null;
    const hoy   = new Date();
    const target = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), def.h, def.m, 0, 0);
    const aviso  = new Date(target.getTime() - restMin * 60000);
    const diff   = aviso.getTime() - Date.now();
    return diff > 0 ? diff : null;   // null si ya pasó
  };

  const programarCaso = useCallback((caso) => {
    if (casosIdRef.current.has(caso.id)) return; // ya programado
    const franja = caso.franja_horaria || caso.rango_horario;
    if (!franja || !FRANJA_INICIO[franja]) return;
    if (["CERRADO","RESUELTO"].includes(caso.estado)) return;

    casosIdRef.current.add(caso.id);

    // Aviso principal (N minutos antes configurados por el técnico)
    const msPrinc = msHastaAviso(caso, minutosAntes);
    if (msPrinc !== null) {
      const t1 = setTimeout(() => {
        const { titulo, cuerpo } = buildMsgNotif(caso, "principal");
        mostrarNotificacion(titulo, cuerpo, { tag: `boolean-${caso.id}-p`, importante: true });
        // Notificar también al Supervisor via Supabase Realtime
        enviarAlertaSupervision(caso, "RECORDATORIO_PRINCIPAL", user, minutosAntes);
      }, msPrinc);
      timersRef.current.push(t1);
    }

    // Aviso fijo 10 minutos antes
    const ms10 = msHastaAviso(caso, 10);
    if (ms10 !== null && minutosAntes > 10) {
      const t2 = setTimeout(() => {
        const { titulo, cuerpo } = buildMsgNotif(caso, "10min");
        mostrarNotificacion(titulo, cuerpo, { tag: `boolean-${caso.id}-10` });
        enviarAlertaSupervision(caso, "RECORDATORIO_10MIN", user, 10);
      }, ms10);
      timersRef.current.push(t2);
    }
  }, [minutosAntes, user]);

  // Programa todos los casos del día al montar / al cambiar la lista
  useEffect(() => {
    if (permRef.current !== "granted") return;
    if (!casos?.length) return;
    casos.forEach(c => programarCaso(c));
  }, [casos, programarCaso]);

  // Limpia timers al desmontar
  useEffect(() => {
    return () => timersRef.current.forEach(t => clearTimeout(t));
  }, []);
};

// ─── ALERTA DE SUPERVISIÓN via Supabase Realtime ──────────────
const enviarAlertaSupervision = async (caso, tipo, user, min) => {
  try {
    await supabase.from("alertas_recordatorio").insert({
      caso_id:       caso.id,
      tecnico_id:    user.id,
      tecnico_email: user.email,
      tipo,
      minutos_antes: min,
      franja:        caso.franja_horaria || caso.rango_horario,
      razon_social:  caso.razon_social,
      direccion:     caso.direccion,
      created_at:    new Date().toISOString(),
    });
  } catch (e) { /* no crítico — el push al técnico ya se mostró */ }
};

// ─── PANEL DE CONFIGURACIÓN DE NOTIFICACIONES ─────────────────
const ConfigNotificaciones = ({ user, minutosAntes, setMinutosAntes, toast }) => {
  const [permiso,   setPermiso]   = useState(Notification.permission || "default");
  const [guardando, setGuardando] = useState(false);
  const [testEnv,   setTestEnv]   = useState(false);

  const solicitar = async () => {
    const result = await pedirPermisoNotificaciones();
    setPermiso(result);
    if (result === "granted") toast("✓ Notificaciones activadas");
    else if (result === "denied") toast("⚠ Permiso denegado — activalo desde la configuración del browser");
  };

  const guardar = async () => {
    setGuardando(true);
    await supabase.from("usuarios").update({ minutos_recordatorio: minutosAntes }).eq("auth_id", user.id);
    toast(`✓ Recordatorio configurado: ${minutosAntes} min + 10 min fijos`);
    setGuardando(false);
  };

  const testNotif = () => {
    setTestEnv(true);
    mostrarNotificacion(
      "📦 RECORDATORIO DE PRUEBA · Supermercado Norte",
      "Av. Brasil 2785 · Pocitos\nFH2 (12-16) — desde las 12:00\n⚠ Tiene instrucciones especiales",
      { tag: "boolean-test", importante: true }
    );
    setTimeout(() => setTestEnv(false), 3000);
  };

  const PERM_INFO = {
    granted: { color: B.green,  icon: "✓", label: "ACTIVAS",           sub: "Recibirás recordatorios en este dispositivo" },
    denied:  { color: B.red,    icon: "✗", label: "BLOQUEADAS",        sub: "Activá los permisos desde la configuración del browser" },
    default: { color: B.orange, icon: "?", label: "SIN CONFIGURAR",    sub: "Hacé clic en 'Activar' para recibir recordatorios" },
    no_soportado: { color: B.t3, icon: "—", label: "NO SOPORTADO",     sub: "Tu browser no soporta notificaciones push" },
  };
  const pi = PERM_INFO[permiso] || PERM_INFO.default;

  const OPCIONES_MIN = [15, 20, 30, 45, 60, 90, 120];

  return (
    <div>
      {/* Estado del permiso */}
      <div style={{ background: B.card, border: `1px solid ${pi.color}44`, borderLeft: `4px solid ${pi.color}`,
        padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: pi.color + "22",
          border: `2px solid ${pi.color}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{pi.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900,
            color: pi.color, letterSpacing: ".08em", marginBottom: 3 }}>
            NOTIFICACIONES {pi.label}
          </div>
          <div style={{ fontSize: 11, color: B.t2 }}>{pi.sub}</div>
        </div>
        {permiso !== "granted" && permiso !== "no_soportado" && (
          <Bb label="ACTIVAR" onClick={solicitar} small color={B.orange}/>
        )}
        {permiso === "granted" && (
          <Bb label={testEnv ? "ENVIANDO..." : "🔔 PROBAR"} onClick={testNotif} small ghost color={B.green} disabled={testEnv}/>
        )}
      </div>

      {/* Configuración de minutos */}
      <div style={{ background: B.card, border: `1px solid ${B.border}`, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: B.orange, fontWeight: 700, letterSpacing: ".12em", marginBottom: 14 }}>
          ◈ TIEMPO DE ANTICIPACIÓN
        </div>
        <div style={{ fontSize: 12, color: B.t2, marginBottom: 14, lineHeight: 1.6 }}>
          Elegí cuántos minutos antes del inicio de la franja horaria querés recibir el primer aviso.
          El segundo aviso llega siempre <strong style={{ color: B.t1 }}>10 minutos antes</strong>, fijo.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {OPCIONES_MIN.map(min => (
            <button key={min} onClick={() => setMinutosAntes(min)}
              style={{ padding: "8px 16px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700,
                fontSize: 12, cursor: "pointer", transition: "all .15s",
                background: minutosAntes === min ? B.orange : B.deep,
                color:      minutosAntes === min ? "#050507" : B.t2,
                border:    `1px solid ${minutosAntes === min ? B.orange : B.border}`,
                clipPath:  "polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)" }}>
              {min >= 60 ? `${min / 60}h` : `${min}min`}
            </button>
          ))}
        </div>

        {/* Timeline visual */}
        <div style={{ background: B.deep, border: `1px solid ${B.border}`, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: B.t3, fontWeight: 700, letterSpacing: ".1em", marginBottom: 10 }}>
            EJEMPLO — CASO CON FH2 (12:00 - 16:00)
          </div>
          <div style={{ position: "relative", height: 6, background: B.border, borderRadius: 3, marginBottom: 20 }}>
            {/* Barra de tiempo */}
            <div style={{ position: "absolute", right: 0, width: "100%", height: "100%",
              background: `linear-gradient(90deg,${B.border},${B.green})`, borderRadius: 3 }}/>
            {/* Marcador aviso principal */}
            <div style={{ position: "absolute", left: `${Math.max(0, 100 - minutosAntes / 120 * 100)}%`,
              top: -18, transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: B.orange, fontWeight: 700, whiteSpace: "nowrap",
                background: B.orangeDim, padding: "1px 6px", border: `1px solid ${B.orange}44` }}>
                🔔 {minutosAntes >= 60 ? `${minutosAntes / 60}h` : `${minutosAntes}min`} antes
              </div>
              <div style={{ width: 2, height: 18, background: B.orange, margin: "2px auto 0" }}/>
            </div>
            {/* Marcador 10 min */}
            {minutosAntes > 10 && (
              <div style={{ position: "absolute", left: `${Math.max(0, 100 - 10 / 120 * 100)}%`,
                top: -18, transform: "translateX(-50%)", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: B.yellow, fontWeight: 700, whiteSpace: "nowrap",
                  background: B.yellowDim, padding: "1px 6px", border: `1px solid ${B.yellow}44` }}>
                  ⏰ 10min antes
                </div>
                <div style={{ width: 2, height: 18, background: B.yellow, margin: "2px auto 0" }}/>
              </div>
            )}
            {/* Marcador inicio franja */}
            <div style={{ position: "absolute", right: 0, top: -18, transform: "translateX(50%)", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: B.green, fontWeight: 700,
                background: B.greenDim, padding: "1px 6px", border: `1px solid ${B.green}44` }}>
                🏁 12:00
              </div>
              <div style={{ width: 2, height: 18, background: B.green, margin: "2px auto 0" }}/>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { icon: "🔔", color: B.orange, label: `${minutosAntes >= 60 ? minutosAntes / 60 + "h" : minutosAntes + " min"} antes`, desc: `a las ${11}:${(60 - minutosAntes % 60).toString().padStart(2,"0")} — Recordatorio principal`, bold: true },
              ...(minutosAntes > 10 ? [{ icon: "⏰", color: B.yellow, label: "10 min antes", desc: "a las 11:50 — Recordatorio final (fijo)", bold: false }] : []),
              { icon: "🏁", color: B.green, label: "12:00", desc: "Inicio de franja FH2", bold: false },
            ].map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{ev.icon}</span>
                <div style={{ minWidth: 90, fontSize: 10, color: ev.color, fontWeight: 700 }}>{ev.label}</div>
                <div style={{ fontSize: 10, color: ev.bold ? B.t1 : B.t3 }}>{ev.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <Bb label={guardando ? "GUARDANDO..." : "GUARDAR CONFIGURACIÓN"} onClick={guardar} disabled={guardando || permiso !== "granted"}/>
        {permiso !== "granted" && (
          <div style={{ fontSize: 10, color: B.t3, marginTop: 8 }}>Activá las notificaciones primero para guardar</div>
        )}
      </div>

      {/* Info para Supervisor */}
      <div style={{ background: B.card, border: `1px solid ${B.border}`, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: B.blue, fontWeight: 700, letterSpacing: ".12em", marginBottom: 10 }}>◈ COPIA PARA SUPERVISORES</div>
        <div style={{ fontSize: 11, color: B.t2, lineHeight: 1.7 }}>
          Cada vez que un técnico de tu equipo recibe un recordatorio, el sistema registra una copia
          en la tabla <span className="mono" style={{ color: B.t1 }}>alertas_recordatorio</span> de Supabase.
          El Supervisor puede ver los recordatorios activos de su equipo desde la sección de Analítica o
          recibir su propio aviso push si tiene el sistema abierto.
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", background: B.deep, border: `1px solid ${B.border}`,
          fontSize: 10, color: B.t3, lineHeight: 1.8 }}>
          <span style={{ color: B.blue, fontWeight: 700 }}>NOTA: </span>
          El técnico no puede desactivar notificaciones de casos individuales. Solo puede cambiar
          el tiempo de anticipación o revocar el permiso desde la configuración de su browser.
        </div>
      </div>

      {/* Guía de instalación en celular */}
      <div style={{ background: B.card, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 10, color: B.purple, fontWeight: 700, letterSpacing: ".12em", marginBottom: 10 }}>
          ◈ CÓMO ACTIVAR EN EL CELULAR
        </div>
        {[
          { os: "Android (Chrome)", pasos: ["Abrí boole-app.vercel.app", "Tocá el ícono de candado en la barra de direcciones", "Permisos del sitio → Notificaciones → Permitir", "Volvé aquí y tocá ACTIVAR"] },
          { os: "iPhone (Safari)", pasos: ["Abrí boole-app.vercel.app en Safari", "Tocá el botón Compartir (cuadrado con flecha)", "Seleccioná 'Agregar a pantalla de inicio'", "Abrí la app desde el ícono en la pantalla, luego tocá ACTIVAR"] },
        ].map(g => (
          <div key={g.os} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.t1, marginBottom: 6 }}>{g.os}</div>
            {g.pasos.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, alignItems: "flex-start" }}>
                <span style={{ fontSize: 9, color: B.purple, fontWeight: 900, minWidth: 16,
                  fontFamily: "'Orbitron',sans-serif" }}>{i + 1}.</span>
                <span style={{ fontSize: 11, color: B.t2 }}>{p}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PANEL DE ALERTAS PARA SUPERVISOR ─────────────────────────
const AlertasRecordatorio = ({ user }) => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("alertas_recordatorio")
        .select("*").order("created_at", { ascending: false }).limit(50);
      setAlertas(data || []); setLoading(false);
    })();
    // Suscripción realtime para alertas nuevas
    const sub = supabase.channel("alertas-sup")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alertas_recordatorio" },
        payload => setAlertas(prev => [payload.new, ...prev]))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 30 }}><Spin/></div>;

  return (
    <div>
      <div style={{ fontSize: 10, color: B.orange, fontWeight: 700, letterSpacing: ".12em", marginBottom: 12 }}>
        ◈ RECORDATORIOS DEL EQUIPO (últimos 50)
      </div>
      {alertas.length === 0 && (
        <div style={{ textAlign: "center", padding: 30, color: B.t3, fontSize: 12 }}>
          Sin recordatorios registrados hoy
        </div>
      )}
      {alertas.map((a, i) => (
        <div key={a.id || i} style={{ display: "flex", gap: 12, padding: "10px 14px", marginBottom: 6,
          background: B.card, border: `1px solid ${B.border}`,
          borderLeft: `3px solid ${a.tipo?.includes("10MIN") ? B.yellow : B.orange}` }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{a.tipo?.includes("10MIN") ? "⏰" : "🔔"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: B.t1 }}>{a.razon_social}</div>
            <div style={{ fontSize: 10, color: B.t2 }}>{a.tecnico_email} · {a.franja} · {a.minutos_antes}min antes</div>
          </div>
          <div style={{ fontSize: 9, color: B.t3 }}>{fmtD(a.created_at)}</div>
        </div>
      ))}
    </div>
  );
};


// ─── CONFIG ──────────────────────────────────────────────
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
      {tab==="procesos"&&(
        <div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {procesos.map(p=>(
              <div key={p.codigo} style={{background:B.card,border:`1px solid ${B.border}`,borderLeft:`3px solid ${p.color}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>{p.icono}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:B.t1}}>{p.nombre}</div>
                  <div style={{fontSize:10,color:B.t3}}>{p.codigo}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:22,fontWeight:900,color:p.color}}>{p.sla}h</div>
                  <div style={{fontSize:9,color:B.t3}}>SLA</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:"10px 14px",background:B.orangeDim,border:`1px solid ${B.orange}22`,fontSize:11,color:B.t2}}>
            ℹ Los valores de SLA se configuran directamente en la base de datos. Contactá al administrador para modificarlos.
          </div>
        </div>
      )}
      {tab==="misiones"&&(
        loading?<div style={{textAlign:"center",padding:40}}><Spin/></div>:(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {misiones.map(m=>(
              <div key={m.id} style={{background:B.card,border:`1px solid ${B.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:22}}>{m.icono||"🎯"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:B.t1}}>{m.nombre}</div>
                  <div style={{fontSize:10,color:B.t3}}>{m.descripcion}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <Tg label={`+${m.xp_reward} XP`} color={B.green}/>
                  <div style={{fontSize:10,color:B.t3,marginTop:4}}>{m.tipo_proceso||"Todos"}</div>
                </div>
              </div>
            ))}
          </div>
        )
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
export default function App(){
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("mision");
  const [toastMsg,setToastMsg]=useState(null);
  const [casoDetalle,setCasoDetalle]=useState(null);
  const [casos,setCasos]=useState([]);
  const [minutosAntes,setMinutosAntes]=useState(30); // default 30 min

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setSession(session));
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session)return;
    (async()=>{
      const{data}=await supabase.from("casos").select("*").order("created_at",{ascending:false}).limit(200);
      setCasos(data||[]);
      // Cargar minutos de recordatorio del perfil del usuario
      const{data:perfil}=await supabase.from("usuarios").select("minutos_recordatorio").eq("auth_id",session.user.id).single();
      if(perfil?.minutos_recordatorio) setMinutosAntes(perfil.minutos_recordatorio);
    })();
  },[session]);

  // ── Motor de recordatorios activo siempre que haya sesión ──
  useRecordatorios(casos, session?.user, minutosAntes);

  const toast=(msg,dur=3000)=>{
    setToastMsg(msg);
    setTimeout(()=>setToastMsg(null),dur);
  };

  const recargarCasos=async()=>{
    const{data}=await supabase.from("casos").select("*").order("created_at",{ascending:false}).limit(200);
    setCasos(data||[]);
  };

  if(loading)return(
    <div style={{minHeight:"100vh",background:B.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:24,fontWeight:900,color:B.orange}}>BOOLEAN</div>
      <Spin/>
    </div>
  );

  if(!session)return<Login onLogin={()=>{}}/>;

  const user=session.user;

  return(
    <div style={{minHeight:"100vh",background:B.bg,color:B.t1,fontFamily:"'Rajdhani',sans-serif",display:"flex",flexDirection:"column"}}>
      <Ticker casos={casos}/>
      <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 24px)"}}>
        <Sidebar view={view} setView={v=>{setView(v);setCasoDetalle(null);}} user={user} onLogout={()=>supabase.auth.signOut()} casos={casos}/>
        <main style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
          {view==="mision"&&<Mision casos={casos} setView={setView}/>}
          {view==="ruta"&&<MiRutaDelDia user={user} toast={toast}/>}
          {view==="casos"&&!casoDetalle&&<CasosList casos={casos} onSelect={c=>{setCasoDetalle(c);setView("detalle");}} onNew={()=>setView("nuevo")}/>}
          {view==="nuevo"&&<NuevoCaso onCancel={()=>setView("casos")} loading={false} onSave={async(f)=>{
            const tp=TIPOS_PROCESO.find(t=>t.codigo===f.tipo_proceso);
            const instrEsp = f.tiene_instrucciones && f.instrucciones_texto?.trim()
              ? { texto: f.instrucciones_texto.trim(), adjuntos: [], autor: user.email, ts: new Date().toISOString(), editado: false }
              : null;
            const{error}=await supabase.from("casos").insert({
              ...f,
              instrucciones_especiales: instrEsp,
              tiene_instrucciones: undefined,
              instrucciones_texto: undefined,
              estado:"PENDIENTE",creado_por:user.id,
              sla_deadline:new Date(Date.now()+f.sla_horas*3600000).toISOString(),
              historial:[
                {id:Date.now(),tipo:"CREACION",texto:"Caso creado",usuario:user.email,ts:new Date().toISOString()},
                ...(instrEsp?[{id:Date.now()+1,tipo:"INSTRUCCIONES",texto:"Instrucciones especiales cargadas al crear el caso",usuario:user.email,ts:new Date().toISOString()}]:[])
              ]
            });
            if(error){toast("Error: "+error.message);}
            else{toast(`✓ Caso creado · +${tp?.xp||50} XP`);await recargarCasos();setView("casos");}
          }}/>}
          {view==="detalle"&&casoDetalle&&<CasoDetalle caso={casoDetalle} user={user} toast={toast} onBack={()=>{setCasoDetalle(null);setView("casos");}}/>}
          {view==="bulk"&&<BulkUpload user={user} toast={async(m)=>{toast(m);await recargarCasos();}}/>}
          {view==="analitica"&&<Analitica user={user} toast={toast}/>}
          {view==="comunicaciones"&&<Comunicaciones user={user} toast={toast}/>}
          {view==="logros"&&<Logros user={user} toast={toast}/>}
          {view==="usuarios"&&<Usuarios user={user} toast={toast}/>}
          {view==="config"&&<Config user={user} toast={toast} minutosAntes={minutosAntes} setMinutosAntes={setMinutosAntes}/>}
        </main>
      </div>
      {toastMsg&&<Toast msg={toastMsg}/>}
    </div>
  );
}