import { useState, useEffect, useRef, useCallback } from "react";

/* ‚îÄ‚îÄ Google Font ‚îÄ‚îÄ */
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Lato:ital,wght@0,300;0,400;0,700;1,400&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

/* ‚îÄ‚îÄ Palette ‚îÄ‚îÄ */
const p = {
  bg:        "#f9f4fb",
  card:      "#ffffff",
  sidebar:   "#9b3d12",
  sidebarH:  "#7a2f0d",
  a1:        "#9b3d12",
  a2:        "#ba3222",
  a3:        "#d3969f",
  soft:      "#ede6f2",
  text:      "#2a1008",
  muted:     "#7a5c58",
  border:    "#e2d0dc",
  danger:    "#ba3222",
  tag:       "#ede6f2",
  tagText:   "#9b3d12",
  gold:      "#c8895a",
};

const SECTIONS = ["Dashboard","Calendar","Alarms","Notes","Recipes","Files","Locations","Bills"];
const ICONS    = {Dashboard:"üè°",Calendar:"üìÖ",Alarms:"‚è∞",Notes:"üìù",Recipes:"üç≥",Files:"üìÅ",Locations:"üìç",Bills:"üí∏"};
const DAYS     = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const NOTE_COLORS = ["#fff8e1","#fce4ec","#e8f5e9","#e3f2fd","#f3e5f5","#fff3e0"];
const CAT_COLORS  = { Health:"#fdecea", Shopping:"#e8f5e9", Fun:"#e3f2fd", School:"#fffde7", Other:"#f3e5f5" };

/* ‚îÄ‚îÄ Alarm Sounds (Web Audio API chimes) ‚îÄ‚îÄ */
const ALARM_SOUNDS = [
  { id:"chime1",  label:"Gentle Chime" },
  { id:"chime2",  label:"Bell Tower" },
  { id:"chime3",  label:"Morning Bird" },
  { id:"chime4",  label:"Soft Ding" },
  { id:"chime5",  label:"Crystal Bowl" },
];

function playChime(id) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sequences = {
      chime1: [[523,0],[659,0.2],[784,0.4],[1047,0.6]],
      chime2: [[392,0],[523,0.15],[659,0.3],[784,0.45],[1047,0.6]],
      chime3: [[880,0],[988,0.1],[1047,0.2],[880,0.4],[784,0.55]],
      chime4: [[1047,0],[1047,0.05]],
      chime5: [[528,0],[0,0.1],[528,0.2],[0,0.3],[792,0.4]],
    };
    const notes = sequences[id] || sequences.chime1;
    notes.forEach(([freq, time]) => {
      if (!freq) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.8);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.9);
    });
  } catch(e) {}
}

/* ‚îÄ‚îÄ Default Data ‚îÄ‚îÄ */
const DEFAULT_DATA = {
  events: [
    {id:1,title:"School pickup",date:"2026-03-10",time:"15:00",color:"#9b3d12",desc:""},
    {id:2,title:"Grocery run",date:"2026-03-08",time:"10:00",color:"#ba3222",desc:""},
  ],
  alarms: [
    {id:1,label:"Take medication",time:"08:00",days:["Mon","Tue","Wed","Thu","Fri"],active:true,sound:"chime1"},
    {id:2,label:"Start dinner prep",time:"17:00",days:["Mon","Tue","Wed","Thu","Fri"],active:true,sound:"chime3"},
  ],
  notes: [
    {id:1,title:"School supply list",content:"Glue sticks, markers, composition notebook, scissors",color:"#fff8e1",pinned:true,date:"2026-02-28",folder:"School",photos:[],links:[]},
    {id:2,title:"Self-care reminder",content:"You are doing amazing. Rest is productive. ‚ú®",color:"#fce4ec",pinned:true,date:"2026-03-01",folder:"Personal",photos:[],links:[]},
  ],
  noteFolders: ["Personal","School","Household","Health"],
  recipes: [
    {id:1,title:"One-Pot Pasta",ingredients:"Pasta\nCanned tomatoes\nGarlic\nBasil\nOlive oil",steps:"1. Boil pasta.\n2. Saut√© garlic.\n3. Add tomatoes.\n4. Combine & top with basil.",tags:["easy","dinner"],time:"20 min",link:""},
    {id:2,title:"Sheet Pan Chicken",ingredients:"Chicken thighs\nPotatoes\nBroccoli\nOlive oil\nHerbs",steps:"1. Preheat 425¬∞F.\n2. Toss in oil & seasoning.\n3. Roast 35 min.",tags:["dinner","meal prep"],time:"40 min",link:""},
  ],
  files: [
    {id:1,name:"Insurance card",type:"file",date:"2026-01-15",tag:"Health",dataUrl:null},
    {id:2,name:"Family photo Jan",type:"photo",date:"2026-01-20",tag:"Family",dataUrl:null},
  ],
  locations: [
    {id:1,name:"Pediatrician",address:"123 Maple St",phone:"555-0101",notes:"Dr. Kim ‚Äî 2nd floor",category:"Health"},
    {id:2,name:"Best Grocery Store",address:"456 Oak Ave",phone:"",notes:"Best produce, side parking",category:"Shopping"},
  ],
  bills: [
    {id:1,name:"Electric Bill",amount:120,due:15,paid:false,auto:false,category:"Utilities"},
    {id:2,name:"Internet",amount:65,due:1,paid:true,auto:true,category:"Utilities"},
    {id:3,name:"Mortgage",amount:1450,due:1,paid:true,auto:true,category:"Housing"},
    {id:4,name:"Car Insurance",amount:180,due:22,paid:false,auto:false,category:"Insurance"},
  ],
};

function useData() {
  const [data, setData] = useState(() => {
    try { const s = localStorage.getItem("mombase_v2"); return s ? JSON.parse(s) : DEFAULT_DATA; }
    catch { return DEFAULT_DATA; }
  });
  const update = (key, val) => setData(prev => {
    const next = {...prev, [key]: val};
    try { localStorage.setItem("mombase_v2", JSON.stringify(next)); } catch {}
    return next;
  });
  return [data, update];
}

/* ‚îÄ‚îÄ Alarm ticker ‚îÄ‚îÄ */
function useAlarmTicker(alarms) {
  const fired = useRef(new Set());
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      const day   = DAYS[now.getDay()];
      alarms.forEach(a => {
        if (!a.active) return;
        if (!a.days.includes(day)) return;
        if (a.time !== hhmm) return;
        const key = `${a.id}-${now.toDateString()}-${hhmm}`;
        if (fired.current.has(key)) return;
        fired.current.add(key);
        playChime(a.sound || "chime1");
        if (Notification.permission === "granted") {
          new Notification("MomBase ‚è∞", { body: a.label });
        }
      });
    }, 10000);
    return () => clearInterval(tick);
  }, [alarms]);
}

/* ‚îÄ‚îÄ Shared UI ‚îÄ‚îÄ */
const FF = "'Lato', sans-serif";
const AF = "'Abril Fatface', serif";

const Btn = ({children,onClick,variant="primary",small,style,disabled}) => {
  const vs = {
    primary:  {background:p.a1, color:"#fff"},
    red:      {background:p.a2, color:"#fff"},
    soft:     {background:p.soft, color:p.a1},
    danger:   {background:p.danger, color:"#fff"},
    ghost:    {background:"transparent", color:p.muted, border:`1px solid ${p.border}`},
    outline:  {background:"transparent", color:p.a1, border:`2px solid ${p.a1}`},
  };
  return <button onClick={onClick} disabled={disabled} style={{
    border:"none", borderRadius:10, cursor:disabled?"not-allowed":"pointer",
    fontFamily:FF, fontWeight:700, letterSpacing:.3,
    padding:small?"6px 14px":"11px 22px", fontSize:small?12:14,
    opacity:disabled?.5:1, transition:"all .15s", ...vs[variant], ...style
  }}>{children}</button>;
};

const Card = ({children,style,onClick}) => (
  <div onClick={onClick} style={{
    background:p.card, border:`1px solid ${p.border}`,
    borderRadius:16, padding:20,
    boxShadow:"0 2px 12px rgba(155,61,18,.06)",
    cursor:onClick?"pointer":"default", ...style
  }}>{children}</div>
);

const Inp = ({style,...props}) => (
  <input style={{
    width:"100%", padding:"10px 14px", border:`1.5px solid ${p.border}`,
    borderRadius:10, fontFamily:FF, fontSize:14,
    background:p.soft+"80", color:p.text, outline:"none",
    boxSizing:"border-box", ...style
  }} {...props} />
);

const TA = ({style,...props}) => (
  <textarea style={{
    width:"100%", padding:"10px 14px", border:`1.5px solid ${p.border}`,
    borderRadius:10, fontFamily:FF, fontSize:14,
    background:p.soft+"80", color:p.text, outline:"none",
    resize:"vertical", boxSizing:"border-box", ...style
  }} {...props} />
);

const Sel = ({style,...props}) => (
  <select style={{
    width:"100%", padding:"10px 14px", border:`1.5px solid ${p.border}`,
    borderRadius:10, fontFamily:FF, fontSize:14,
    background:p.soft+"80", color:p.text, outline:"none", ...style
  }} {...props} />
);

const Pill = ({children, active, onClick}) => (
  <div onClick={onClick} style={{
    padding:"5px 14px", borderRadius:20, cursor:"pointer", fontSize:12,
    fontWeight:700, fontFamily:FF, letterSpacing:.3,
    background:active?p.a1:p.tag, color:active?"#fff":p.tagText,
    transition:"all .15s"
  }}>{children}</div>
);

const Modal = ({show,onClose,title,children,wide}) => {
  if (!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(42,16,8,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16}}>
      <div style={{background:p.card,borderRadius:20,padding:28,width:"100%",maxWidth:wide?680:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 16px 60px rgba(155,61,18,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{margin:0,fontFamily:AF,color:p.a1,fontSize:20}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:p.muted,lineHeight:1}}>√ó</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const FormCol = ({children,gap=12}) => <div style={{display:"flex",flexDirection:"column",gap}}>{children}</div>;

const SectionTitle = ({children}) => (
  <h2 style={{fontFamily:AF,color:p.a1,fontSize:26,margin:"0 0 20px",letterSpacing:.5}}>{children}</h2>
);

const TagBadge = ({children}) => (
  <span style={{background:p.tag,color:p.tagText,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,fontFamily:FF,letterSpacing:.3}}>{children}</span>
);

/* ‚îÄ‚îÄ Dashboard ‚îÄ‚îÄ */
function Dashboard({data}) {
  const today = new Date();
  const ts    = today.toISOString().slice(0,10);
  const dw    = DAYS[today.getDay()];
  const h     = today.getHours();
  const greeting = h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  const te    = data.events.filter(e=>e.date===ts);
  const ub    = data.bills.filter(b=>!b.paid);
  const aa    = data.alarms.filter(a=>a.active&&a.days.includes(dw));
  const pn    = data.notes.filter(n=>n.pinned);

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h1 style={{fontFamily:AF,margin:0,color:p.a1,fontSize:36}}>{greeting} üå∏</h1>
        <p style={{margin:"6px 0 0",color:p.muted,fontFamily:FF,fontSize:15}}>
          {today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:14,marginBottom:28}}>
        {[
          {l:"Today's Events",v:te.length,i:"üìÖ",bg:`${p.a1}15`},
          {l:"Unpaid Bills",  v:ub.length,i:"üí∏",bg:`${p.a2}15`},
          {l:"Alarms Today",  v:aa.length,i:"‚è∞",bg:`${p.a3}30`},
          {l:"Pinned Notes",  v:pn.length,i:"üìå",bg:`${p.gold}20`},
        ].map(s=>(
          <Card key={s.l} style={{background:s.bg,textAlign:"center",padding:"18px 10px",border:"none"}}>
            <div style={{fontSize:26}}>{s.i}</div>
            <div style={{fontSize:28,fontWeight:700,fontFamily:AF,color:p.a1}}>{s.v}</div>
            <div style={{fontSize:11,color:p.muted,fontFamily:FF,marginTop:2}}>{s.l}</div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16}}>
        <Card>
          <div style={{fontFamily:AF,color:p.a1,marginBottom:12,fontSize:16}}>üìÖ Today's Schedule</div>
          {te.length ? te.map(e=>(
            <div key={e.id} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:e.color,flexShrink:0}}/>
              <b style={{fontSize:14,fontFamily:FF}}>{e.time}</b>
              <span style={{fontSize:14,color:p.muted}}>{e.title}</span>
            </div>
          )) : <p style={{color:p.muted,fontSize:13,margin:0,fontStyle:"italic"}}>Free day ‚Äî enjoy it! üéâ</p>}
        </Card>

        <Card>
          <div style={{fontFamily:AF,color:p.a1,marginBottom:12,fontSize:16}}>‚è∞ Alarms Today</div>
          {aa.length ? aa.map(a=>(
            <div key={a.id} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:14}}>{a.label}</span>
              <b style={{fontSize:14,color:p.a2}}>{a.time}</b>
            </div>
          )) : <p style={{color:p.muted,fontSize:13,margin:0,fontStyle:"italic"}}>No alarms today</p>}
        </Card>

        <Card>
          <div style={{fontFamily:AF,color:p.a1,marginBottom:12,fontSize:16}}>üí∏ Bills to Pay</div>
          {ub.slice(0,4).map(b=>(
            <div key={b.id} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:14}}>{b.name}</span>
              <b style={{fontSize:14,color:p.danger}}>${b.amount} ¬∑ Day {b.due}</b>
            </div>
          ))}
          {!ub.length&&<p style={{color:p.muted,fontSize:13,margin:0,fontStyle:"italic"}}>All bills paid! üéâ</p>}
        </Card>

        <Card>
          <div style={{fontFamily:AF,color:p.a1,marginBottom:12,fontSize:16}}>üìå Pinned Notes</div>
          {pn.slice(0,3).map(n=>(
            <div key={n.id} style={{background:n.color,borderRadius:10,padding:"8px 12px",marginBottom:8}}>
              <b style={{fontSize:13}}>{n.title}</b>
              <div style={{fontSize:12,color:p.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.content}</div>
            </div>
          ))}
          {!pn.length&&<p style={{color:p.muted,fontSize:13,margin:0,fontStyle:"italic"}}>No pinned notes yet</p>}
        </Card>
      </div>
    </div>
  );
}

/* ‚îÄ‚îÄ Calendar ‚îÄ‚îÄ */
function CalendarSection({data,update}) {
  const today = new Date();
  const [yr, setYr] = useState(today.getFullYear());
  const [mo, setMo] = useState(today.getMonth());
  const [view, setView] = useState("month"); // month | week | list
  const [modal, setModal] = useState(false);
  const [editEvt, setEditEvt] = useState(null);
  const [selDay, setSelDay] = useState(null);
  const [form, setForm] = useState({title:"",date:"",time:"",endTime:"",color:"#9b3d12",desc:"",repeat:"none",location:""});
  const ts = today.toISOString().slice(0,10);

  const fd = new Date(yr,mo,1).getDay();
  const dim = new Date(yr,mo+1,0).getDate();
  const cells = [];
  for(let i=0;i<fd;i++) cells.push(null);
  for(let d=1;d<=dim;d++) cells.push(d);

  const prev = ()=>{ if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1); };
  const next = ()=>{ if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1); };

  const openAdd = (date="") => {
    setEditEvt(null);
    setForm({title:"",date:date||"",time:"",endTime:"",color:"#9b3d12",desc:"",repeat:"none",location:""});
    setModal(true);
  };
  const openEdit = (evt) => {
    setEditEvt(evt);
    setForm({...evt});
    setModal(true);
  };
  const save = () => {
    if(!form.title||!form.date) return;
    if(editEvt) {
      update("events",data.events.map(e=>e.id===editEvt.id?{...form,id:e.id}:e));
    } else {
      update("events",[...data.events,{...form,id:Date.now()}]);
    }
    setModal(false);
  };
  const del = (id) => update("events",data.events.filter(e=>e.id!==id));

  const dayEvents = (ds) => data.events.filter(e=>e.date===ds);
  const selDayStr = selDay ? `${yr}-${String(mo+1).padStart(2,"0")}-${String(selDay).padStart(2,"0")}` : null;

  /* Week view helpers */
  const startOfWeek = () => {
    const d = new Date(yr,mo,1);
    d.setDate(d.getDate() - d.getDay());
    return d;
  };

  const GOOGLE_CAL = "https://calendar.google.com";
  const OUTLOOK_CAL = "https://outlook.live.com/calendar";
  const APPLE_CAL = "webcal://";

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <SectionTitle>üìÖ Calendar</SectionTitle>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["month","week","list"].map(v=>(
            <Pill key={v} active={view===v} onClick={()=>setView(v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</Pill>
          ))}
          <Btn small onClick={()=>openAdd()}>+ Event</Btn>
        </div>
      </div>

      {/* Connect banners */}
      <Card style={{marginBottom:16,background:`${p.soft}`,border:`1px dashed ${p.a3}`,padding:"12px 16px"}}>
        <div style={{fontSize:12,fontWeight:700,color:p.a1,marginBottom:8,fontFamily:AF}}>üîó Connect Your Calendars</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {name:"Google Calendar",url:GOOGLE_CAL,color:"#4285F4",icon:"üìÖ"},
            {name:"Outlook",url:OUTLOOK_CAL,color:"#0078D4",icon:"üìß"},
            {name:"Apple Calendar",url:"https://www.icloud.com/calendar",color:"#555",icon:"üçé"},
          ].map(cal=>(
            <a key={cal.name} href={cal.url} target="_blank" rel="noreferrer" style={{
              display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",
              borderRadius:20,background:cal.color,color:"#fff",fontSize:12,
              fontWeight:700,textDecoration:"none",fontFamily:FF
            }}>{cal.icon} {cal.name} ‚Üó</a>
          ))}
        </div>
        <p style={{fontSize:11,color:p.muted,margin:"8px 0 0",fontFamily:FF}}>
          Click to open your calendar service. To sync, export an .ics file from your calendar app and import events here.
        </p>
      </Card>

      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <button onClick={prev} style={{background:p.tag,border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:18,color:p.a1}}>‚Äπ</button>
        <h3 style={{margin:0,fontFamily:AF,color:p.text,minWidth:200,textAlign:"center"}}>{MONTHS[mo]} {yr}</h3>
        <button onClick={next} style={{background:p.tag,border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:18,color:p.a1}}>‚Ä∫</button>
        <button onClick={()=>{setYr(today.getFullYear());setMo(today.getMonth());}} style={{background:"none",border:`1px solid ${p.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,color:p.muted,fontFamily:FF}}>Today</button>
      </div>

      {/* Month view */}
      {view==="month" && (
        <Card style={{marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
            {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:p.muted,padding:"4px 0",fontFamily:FF}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {cells.map((d,i)=>{
              if(!d) return <div key={"e"+i}/>;
              const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const evs=dayEvents(ds);
              const isToday=ds===ts;
              const isSel=selDay===d;
              return (
                <div key={ds} onClick={()=>setSelDay(isSel?null:d)} style={{
                  minHeight:64, borderRadius:10, padding:"4px 5px", cursor:"pointer",
                  background:isToday?`${p.a3}40`:isSel?`${p.soft}`:p.bg,
                  border:isToday?`2px solid ${p.a3}`:isSel?`2px solid ${p.a1}`:`1px solid ${p.border}`,
                  transition:"all .1s"
                }}>
                  <div style={{
                    fontSize:12, fontWeight:isToday?800:500,
                    color:isToday?p.a2:p.text, marginBottom:2,
                    fontFamily:isToday?AF:FF
                  }}>{d}</div>
                  {evs.slice(0,2).map(e=>(
                    <div key={e.id} onClick={ev=>{ev.stopPropagation();openEdit(e);}} style={{
                      fontSize:9,background:e.color,color:"#fff",borderRadius:4,
                      padding:"2px 4px",marginBottom:1,overflow:"hidden",
                      textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"
                    }}>{e.title}</div>
                  ))}
                  {evs.length>2&&<div style={{fontSize:9,color:p.muted}}>+{evs.length-2} more</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* List view */}
      {view==="list" && (
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {data.events.length===0&&<p style={{color:p.muted,fontStyle:"italic"}}>No events yet. Add one!</p>}
          {[...data.events].sort((a,b)=>a.date.localeCompare(b.date)).map(e=>(
            <Card key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:12,height:12,borderRadius:"50%",background:e.color,flexShrink:0}}/>
                <div>
                  <b style={{fontFamily:FF}}>{e.title}</b>
                  <div style={{fontSize:12,color:p.muted}}>{e.date}{e.time?` ¬∑ ${e.time}`:""}{e.location?` ¬∑ üìç${e.location}`:""}</div>
                  {e.desc&&<div style={{fontSize:12,color:p.muted,fontStyle:"italic"}}>{e.desc}</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <Btn small variant="soft" onClick={()=>openEdit(e)}>Edit</Btn>
                <Btn small variant="danger" onClick={()=>del(e.id)}>‚úï</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Week view */}
      {view==="week" && (
        <Card style={{marginBottom:20,overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:`80px repeat(7,1fr)`,gap:2,minWidth:600}}>
            <div/>
            {Array.from({length:7},(_,i)=>{
              const d=new Date(yr,mo,1);
              d.setDate(d.getDate()-d.getDay()+i);
              const ds=d.toISOString().slice(0,10);
              const isToday=ds===ts;
              return <div key={i} style={{textAlign:"center",padding:"6px 2px",background:isToday?`${p.a3}40`:"transparent",borderRadius:8}}>
                <div style={{fontSize:11,color:p.muted,fontFamily:FF}}>{DAYS[i]}</div>
                <div style={{fontSize:16,fontWeight:700,fontFamily:isToday?AF:FF,color:isToday?p.a1:p.text}}>{d.getDate()}</div>
              </div>;
            })}
            {Array.from({length:24},(_,hour)=>{
              const label=`${String(hour).padStart(2,"0")}:00`;
              return [
                <div key={`l${hour}`} style={{fontSize:10,color:p.muted,padding:"2px 6px",textAlign:"right",borderTop:`1px solid ${p.border}`,fontFamily:FF}}>{label}</div>,
                ...Array.from({length:7},(_,di)=>{
                  const d=new Date(yr,mo,1);
                  d.setDate(d.getDate()-d.getDay()+di);
                  const ds=d.toISOString().slice(0,10);
                  const slotEvts=data.events.filter(e=>e.date===ds&&e.time&&parseInt(e.time.split(":")[0])===hour);
                  return <div key={`c${hour}-${di}`} style={{borderTop:`1px solid ${p.border}`,minHeight:40,padding:2,position:"relative"}}>
                    {slotEvts.map(e=>(
                      <div key={e.id} onClick={()=>openEdit(e)} style={{background:e.color,color:"#fff",borderRadius:4,padding:"2px 4px",fontSize:9,cursor:"pointer",marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                    ))}
                  </div>;
                })
              ];
            })}
          </div>
        </Card>
      )}

      {/* Selected day detail */}
      {selDay && selDayStr && view==="month" && (
        <Card style={{marginBottom:20,borderLeft:`4px solid ${p.a1}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <b style={{fontFamily:AF,color:p.a1}}>{MONTHS[mo]} {selDay}, {yr}</b>
            <Btn small onClick={()=>openAdd(selDayStr)}>+ Add Event</Btn>
          </div>
          {dayEvents(selDayStr).length===0&&<p style={{color:p.muted,fontSize:13,fontStyle:"italic",margin:0}}>No events. Click "+ Add Event" to add one.</p>}
          {dayEvents(selDayStr).map(e=>(
            <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${p.border}`}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:e.color}}/>
                <div>
                  <b style={{fontSize:14}}>{e.title}</b>
                  {e.time&&<span style={{fontSize:12,color:p.muted,marginLeft:8}}>{e.time}{e.endTime?` ‚Äì ${e.endTime}`:""}</span>}
                  {e.location&&<div style={{fontSize:12,color:p.muted}}>üìç {e.location}</div>}
                  {e.desc&&<div style={{fontSize:12,color:p.muted,fontStyle:"italic"}}>{e.desc}</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <Btn small variant="soft" onClick={()=>openEdit(e)}>Edit</Btn>
                <Btn small variant="danger" onClick={()=>del(e.id)}>‚úï</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Modal show={modal} onClose={()=>setModal(false)} title={editEvt?"Edit Event":"New Event"} wide>
        <FormCol>
          <Inp placeholder="Event title *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:12,color:p.muted,display:"block",marginBottom:4}}>Date *</label><Inp type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <div><label style={{fontSize:12,color:p.muted,display:"block",marginBottom:4}}>Start time</label><Inp type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></div>
            <div><label style={{fontSize:12,color:p.muted,display:"block",marginBottom:4}}>End time</label><Inp type="time" value={form.endTime||""} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/></div>
            <div><label style={{fontSize:12,color:p.muted,display:"block",marginBottom:4}}>Repeat</label>
              <Sel value={form.repeat||"none"} onChange={e=>setForm(f=>({...f,repeat:e.target.value}))}>
                {["none","daily","weekly","biweekly","monthly","yearly"].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </Sel>
            </div>
          </div>
          <Inp placeholder="Location (optional)" value={form.location||""} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/>
          <TA placeholder="Description / notes" value={form.desc||""} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} style={{minHeight:70}}/>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:13,color:p.muted}}>Color:</span>
            {[p.a1,p.a2,p.a3,"#6b8e4e","#2980b9","#8e44ad"].map(col=>(
              <div key={col} onClick={()=>setForm(f=>({...f,color:col}))} style={{width:26,height:26,borderRadius:"50%",background:col,cursor:"pointer",border:form.color===col?"3px solid #333":"2px solid transparent",boxShadow:form.color===col?"0 0 0 2px #fff inset":""}}/>
            ))}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            {editEvt&&<Btn variant="danger" onClick={()=>{del(editEvt.id);setModal(false);}}>Delete</Btn>}
            <Btn onClick={save}>Save Event</Btn>
          </div>
        </FormCol>
      </Modal>
    </div>
  );
}

/* ‚îÄ‚îÄ Alarms ‚îÄ‚îÄ */
function AlarmsSection({data,update}) {
  useAlarmTicker(data.alarms);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({label:"",time:"08:00",days:[],sound:"chime1"});
  const [permAsked, setPermAsked] = useState(false);

  const requestPerm = async () => {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setPermAsked(true);
  };

  const toggleDay = d => setForm(f=>({...f,days:f.days.includes(d)?f.days.filter(x=>x!==d):[...f.days,d]}));
  const add = () => {
    if(!form.label||!form.time) return;
    update("alarms",[...data.alarms,{...form,id:Date.now(),active:true}]);
    setModal(false); setForm({label:"",time:"08:00",days:[],sound:"chime1"});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <SectionTitle>‚è∞ Alarms & Reminders</SectionTitle>
        <Btn onClick={()=>setModal(true)}>+ New Alarm</Btn>
      </div>

      {Notification.permission!=="granted"&&!permAsked&&(
        <Card style={{marginBottom:16,background:`${p.a3}25`,border:`1px dashed ${p.a3}`,padding:"12px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:p.a1,fontFamily:FF}}>üîî Enable notifications so alarms can alert you even when you're not looking at the screen</span>
            <Btn small onClick={requestPerm}>Enable</Btn>
          </div>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {data.alarms.map(a=>(
          <Card key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",opacity:a.active?1:.55,borderLeft:`4px solid ${a.active?p.a1:p.border}`}}>
            <div>
              <div style={{fontSize:34,fontWeight:700,fontFamily:AF,color:a.active?p.a1:p.muted,letterSpacing:1}}>{a.time}</div>
              <b style={{display:"block",marginBottom:6,fontFamily:FF}}>{a.label}</b>
              <div style={{fontSize:11,color:p.muted,marginBottom:8}}>üîî {ALARM_SOUNDS.find(s=>s.id===a.sound)?.label||"Gentle Chime"}</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {DAYS.map(d=>(
                  <span key={d} style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:700,fontFamily:FF,background:a.days.includes(d)?p.a1:p.tag,color:a.days.includes(d)?"#fff":p.muted}}>{d}</span>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <button onClick={()=>playChime(a.sound||"chime1")} style={{background:"none",border:`1px solid ${p.border}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:13,color:p.muted,fontFamily:FF}}>‚ñ∂ Test</button>
              {/* Toggle */}
              <div onClick={()=>update("alarms",data.alarms.map(x=>x.id===a.id?{...x,active:!x.active}:x))} style={{width:52,height:28,borderRadius:14,background:a.active?p.a1:p.border,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute",top:4,left:a.active?28:4,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
              </div>
              <Btn small variant="danger" onClick={()=>update("alarms",data.alarms.filter(x=>x.id!==a.id))}>‚úï</Btn>
            </div>
          </Card>
        ))}
      </div>

      <Modal show={modal} onClose={()=>setModal(false)} title="New Alarm">
        <FormCol>
          <Inp placeholder="Label (e.g. Take vitamins)" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}/>
          <Inp type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
          <div>
            <div style={{fontSize:13,color:p.muted,marginBottom:8,fontFamily:FF}}>Repeat on:</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {DAYS.map(d=>(
                <div key={d} onClick={()=>toggleDay(d)} style={{padding:"7px 13px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FF,background:form.days.includes(d)?p.a1:p.tag,color:form.days.includes(d)?"#fff":p.muted}}>{d}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:13,color:p.muted,marginBottom:8,fontFamily:FF}}>Alarm sound:</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {ALARM_SOUNDS.map(s=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div onClick={()=>setForm(f=>({...f,sound:s.id}))} style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${p.a1}`,background:form.sound===s.id?p.a1:"transparent",cursor:"pointer",flexShrink:0}}/>
                  <span style={{fontSize:13,fontFamily:FF,flex:1}}>{s.label}</span>
                  <button onClick={()=>playChime(s.id)} style={{background:"none",border:`1px solid ${p.border}`,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:12,color:p.muted,fontFamily:FF}}>‚ñ∂</button>
                </div>
              ))}
            </div>
          </div>
          <Btn onClick={add}>Save Alarm</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

/* ‚îÄ‚îÄ Notes ‚îÄ‚îÄ */
function NotesSection({data,update}) {
  const [modal, setModal]     = useState(false);
  const [folderModal, setFolderModal] = useState(false);
  const [form, setForm]       = useState({title:"",content:"",color:"#fff8e1",pinned:false,folder:"",photos:[],links:[]});
  const [search, setSearch]   = useState("");
  const [activeFolder, setActiveFolder] = useState("All");
  const [newFolder, setNewFolder] = useState("");
  const [newLink, setNewLink] = useState("");
  const photoRef = useRef();

  const folders = ["All", ...(data.noteFolders||[])];

  const addFolder = () => {
    if(!newFolder.trim()) return;
    update("noteFolders",[...(data.noteFolders||[]),newFolder.trim()]);
    setNewFolder("");
    setFolderModal(false);
  };

  const addPhotoToForm = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f=>({...f,photos:[...(f.photos||[]),ev.target.result]}));
    reader.readAsDataURL(file);
  };

  const addLink = () => {
    if(!newLink.trim()) return;
    setForm(f=>({...f,links:[...(f.links||[]),newLink.trim()]}));
    setNewLink("");
  };

  const add = () => {
    if(!form.title) return;
    update("notes",[...data.notes,{...form,id:Date.now(),date:new Date().toISOString().slice(0,10)}]);
    setModal(false);
    setForm({title:"",content:"",color:"#fff8e1",pinned:false,folder:"",photos:[],links:[]});
    setNewLink("");
  };

  const filtered = data.notes.filter(n=>{
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase())||n.content.toLowerCase().includes(search.toLowerCase());
    const matchFolder = activeFolder==="All"||(n.folder===activeFolder);
    return matchSearch&&matchFolder;
  });
  const pinned = filtered.filter(n=>n.pinned);
  const rest   = filtered.filter(n=>!n.pinned);

  const NoteCard = ({note}) => {
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(note.content);
    const [addingLink, setAddingLink] = useState(false);
    const [linkVal, setLinkVal] = useState("");
    const notePhotoRef = useRef();

    const addNotePhoto = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        update("notes",data.notes.map(n=>n.id===note.id?{...n,photos:[...(n.photos||[]),ev.target.result]}:n));
      };
      reader.readAsDataURL(file);
    };

    const addNoteLink = () => {
      if(!linkVal.trim()) return;
      update("notes",data.notes.map(n=>n.id===note.id?{...n,links:[...(n.links||[]),linkVal.trim()]}:n));
      setLinkVal("");
      setAddingLink(false);
    };

    return (
      <div style={{background:note.color,borderRadius:14,padding:16,border:`1px solid ${p.border}`,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <b style={{fontSize:14,fontFamily:FF,flex:1,paddingRight:8}}>{note.title}</b>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            {note.folder&&<span style={{fontSize:10,background:"rgba(0,0,0,.08)",borderRadius:10,padding:"2px 6px",fontFamily:FF,color:p.muted}}>üìÅ{note.folder}</span>}
            <button onClick={()=>update("notes",data.notes.map(n=>n.id===note.id?{...n,pinned:!n.pinned}:n))} style={{background:"none",border:"none",cursor:"pointer",fontSize:14}}>{note.pinned?"üìå":"üìç"}</button>
            <button onClick={()=>update("notes",data.notes.filter(n=>n.id!==note.id))} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:p.muted}}>‚úï</button>
          </div>
        </div>

        {editing ? (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <TA value={content} onChange={e=>setContent(e.target.value)} style={{minHeight:80,background:"rgba(255,255,255,.6)"}}/>
            <Btn small onClick={()=>{update("notes",data.notes.map(n=>n.id===note.id?{...n,content}:n));setEditing(false);}}>Save</Btn>
          </div>
        ) : (
          <div onClick={()=>setEditing(true)} style={{fontSize:13,lineHeight:1.6,cursor:"text",minHeight:32,color:p.text,fontFamily:FF}}>
            {note.content||<i style={{color:p.muted}}>Click to edit‚Ä¶</i>}
          </div>
        )}

        {/* Photos */}
        {(note.photos||[]).length>0&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {note.photos.map((ph,i)=>(
              <div key={i} style={{position:"relative"}}>
                <img src={ph} alt="" style={{width:70,height:70,objectFit:"cover",borderRadius:8,border:`1px solid ${p.border}`}}/>
                <button onClick={()=>update("notes",data.notes.map(n=>n.id===note.id?{...n,photos:n.photos.filter((_,j)=>j!==i)}:n))} style={{position:"absolute",top:-4,right:-4,background:p.danger,border:"none",borderRadius:"50%",width:16,height:16,cursor:"pointer",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>√ó</button>
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {(note.links||[]).length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {note.links.map((lk,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                <a href={lk.startsWith("http")?lk:`https://${lk}`} target="_blank" rel="noreferrer" style={{fontSize:12,color:p.a2,textDecoration:"none",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>üîó {lk}</a>
                <button onClick={()=>update("notes",data.notes.map(n=>n.id===note.id?{...n,links:n.links.filter((_,j)=>j!==i)}:n))} style={{background:"none",border:"none",cursor:"pointer",color:p.muted,fontSize:12}}>‚úï</button>
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",borderTop:`1px solid rgba(0,0,0,.06)`,paddingTop:8}}>
          <button onClick={()=>notePhotoRef.current?.click()} style={{background:"rgba(255,255,255,.6)",border:`1px solid ${p.border}`,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,color:p.muted,fontFamily:FF}}>üì∑ Photo</button>
          <input ref={notePhotoRef} type="file" accept="image/*" style={{display:"none"}} onChange={addNotePhoto}/>
          <button onClick={()=>setAddingLink(a=>!a)} style={{background:"rgba(255,255,255,.6)",border:`1px solid ${p.border}`,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,color:p.muted,fontFamily:FF}}>üîó Link</button>
        </div>

        {addingLink&&(
          <div style={{display:"flex",gap:6}}>
            <Inp placeholder="https://..." value={linkVal} onChange={e=>setLinkVal(e.target.value)} style={{flex:1,fontSize:12,padding:"6px 10px"}}/>
            <Btn small onClick={addNoteLink}>Add</Btn>
          </div>
        )}

        <div style={{fontSize:10,color:p.muted,fontFamily:FF}}>{note.date}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <SectionTitle>üìù Notes</SectionTitle>
        <div style={{display:"flex",gap:8}}>
          <Btn small variant="soft" onClick={()=>setFolderModal(true)}>üìÅ Folders</Btn>
          <Btn small onClick={()=>setModal(true)}>+ Note</Btn>
        </div>
      </div>

      <Inp placeholder="üîç Search notes‚Ä¶" value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:14}}/>

      {/* Folder tabs */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {folders.map(f=><Pill key={f} active={activeFolder===f} onClick={()=>setActiveFolder(f)}>{f}</Pill>)}
      </div>

      {pinned.length>0&&<>
        <div style={{fontSize:11,fontWeight:700,color:p.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1,fontFamily:FF}}>üìå Pinned</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:20}}>
          {pinned.map(n=><NoteCard key={n.id} note={n}/>)}
        </div>
      </>}
      {rest.length>0&&<>
        <div style={{fontSize:11,fontWeight:700,color:p.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1,fontFamily:FF}}>All Notes</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
          {rest.map(n=><NoteCard key={n.id} note={n}/>)}
        </div>
      </>}

      {/* New Note Modal */}
      <Modal show={modal} onClose={()=>setModal(false)} title="New Note" wide>
        <FormCol>
          <Inp placeholder="Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
          <TA placeholder="Write your note‚Ä¶" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} style={{minHeight:120}}/>

          <Sel value={form.folder||""} onChange={e=>setForm(f=>({...f,folder:e.target.value}))}>
            <option value="">üìÅ No folder</option>
            {(data.noteFolders||[]).map(f=><option key={f} value={f}>{f}</option>)}
          </Sel>

          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:13,color:p.muted,fontFamily:FF}}>Color:</span>
            {NOTE_COLORS.map(col=><div key={col} onClick={()=>setForm(f=>({...f,color:col}))} style={{width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:form.color===col?"3px solid #555":"2px solid #ddd"}}/>)}
          </div>

          {/* Photos in form */}
          <div>
            <div style={{fontSize:13,color:p.muted,marginBottom:6,fontFamily:FF}}>Photos:</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {(form.photos||[]).map((ph,i)=>(
                <div key={i} style={{position:"relative"}}>
                  <img src={ph} alt="" style={{width:60,height:60,objectFit:"cover",borderRadius:8}}/>
                  <button onClick={()=>setForm(f=>({...f,photos:f.photos.filter((_,j)=>j!==i)}))} style={{position:"absolute",top:-4,right:-4,background:p.danger,border:"none",borderRadius:"50%",width:16,height:16,cursor:"pointer",color:"#fff",fontSize:10}}>√ó</button>
                </div>
              ))}
              <button onClick={()=>photoRef.current?.click()} style={{width:60,height:60,borderRadius:8,border:`2px dashed ${p.border}`,background:"transparent",cursor:"pointer",fontSize:22,color:p.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={addPhotoToForm}/>
            </div>
          </div>

          {/* Links in form */}
          <div>
            <div style={{fontSize:13,color:p.muted,marginBottom:6,fontFamily:FF}}>Links:</div>
            {(form.links||[]).map((lk,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:12,color:p.a2,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>üîó {lk}</span>
                <button onClick={()=>setForm(f=>({...f,links:f.links.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",cursor:"pointer",color:p.muted}}>‚úï</button>
              </div>
            ))}
            <div style={{display:"flex",gap:8}}>
              <Inp placeholder="https://..." value={newLink} onChange={e=>setNewLink(e.target.value)} style={{flex:1,fontSize:13,padding:"7px 10px"}}/>
              <Btn small variant="soft" onClick={addLink}>Add</Btn>
            </div>
          </div>

          <label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",fontSize:14,fontFamily:FF}}>
            <input type="checkbox" checked={form.pinned} onChange={e=>setForm(f=>({...f,pinned:e.target.checked}))}/>
            üìå Pin this note
          </label>
          <Btn onClick={add}>Save Note</Btn>
        </FormCol>
      </Modal>

      {/* Folder Manager */}
      <Modal show={folderModal} onClose={()=>setFolderModal(false)} title="Manage Folders">
        <FormCol>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
            {(data.noteFolders||[]).map(f=>(
              <div key={f} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:p.soft,borderRadius:8}}>
                <span style={{fontFamily:FF}}>üìÅ {f}</span>
                <Btn small variant="danger" onClick={()=>update("noteFolders",(data.noteFolders||[]).filter(x=>x!==f))}>‚úï</Btn>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Inp placeholder="New folder name‚Ä¶" value={newFolder} onChange={e=>setNewFolder(e.target.value)} style={{flex:1}}/>
            <Btn onClick={addFolder}>Add</Btn>
          </div>
        </FormCol>
      </Modal>
    </div>
  );
}

/* ‚îÄ‚îÄ Recipes ‚îÄ‚îÄ */
function RecipesSection({data,update}) {
  const [modal, setModal] = useState(false);
  const [sel, setSel]     = useState(null);
  const [form, setForm]   = useState({title:"",ingredients:"",steps:"",tags:"",time:"",link:""});
  const [search, setSearch] = useState("");

  const add = () => {
    if(!form.title) return;
    const tags = form.tags.split(",").map(t=>t.trim()).filter(Boolean);
    update("recipes",[...data.recipes,{...form,tags,id:Date.now()}]);
    setModal(false); setForm({title:"",ingredients:"",steps:"",tags:"",time:"",link:""});
  };

  const filtered = data.recipes.filter(r=>
    r.title.toLowerCase().includes(search.toLowerCase())||
    (r.tags||[]).some(t=>t.toLowerCase().includes(search.toLowerCase()))
  );

  if(sel) {
    const r = data.recipes.find(x=>x.id===sel);
    if(!r){setSel(null);return null;}
    return (
      <div>
        <Btn small variant="ghost" onClick={()=>setSel(null)} style={{marginBottom:16}}>‚Üê Back</Btn>
        <Card>
          <h2 style={{fontFamily:AF,color:p.a1,margin:"0 0 10px"}}>{r.title}</h2>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
            {r.time&&<TagBadge>‚è± {r.time}</TagBadge>}
            {(r.tags||[]).map(t=><TagBadge key={t}>#{t}</TagBadge>)}
          </div>
          {r.link&&(
            <a href={r.link.startsWith("http")?r.link:`https://${r.link}`} target="_blank" rel="noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:16,padding:"8px 14px",background:`${p.a3}30`,borderRadius:10,color:p.a1,textDecoration:"none",fontSize:13,fontWeight:700,fontFamily:FF}}>
              üîó View Original Recipe ‚Üó
            </a>
          )}
          <h4 style={{color:p.a2,fontFamily:AF,marginBottom:8}}>üßæ Ingredients</h4>
          <div style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.9,background:p.soft,borderRadius:10,padding:14,marginBottom:16,fontFamily:FF}}>{r.ingredients}</div>
          <h4 style={{color:p.a2,fontFamily:AF,marginBottom:8}}>üë©‚Äçüç≥ Instructions</h4>
          <div style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.9,background:p.soft,borderRadius:10,padding:14,fontFamily:FF}}>{r.steps}</div>
          <Btn variant="danger" small style={{marginTop:16}} onClick={()=>{update("recipes",data.recipes.filter(x=>x.id!==r.id));setSel(null);}}>Delete Recipe</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <SectionTitle>üç≥ Recipes</SectionTitle>
        <Btn onClick={()=>setModal(true)}>+ Save Recipe</Btn>
      </div>
      <Inp placeholder="üîç Search by name or tag‚Ä¶" value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:20}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
        {filtered.map(r=>(
          <Card key={r.id} onClick={()=>setSel(r.id)} style={{cursor:"pointer"}}>
            <div style={{fontSize:40,marginBottom:10}}>üçΩÔ∏è</div>
            <h4 style={{margin:"0 0 6px",fontFamily:AF,color:p.text}}>{r.title}</h4>
            {r.time&&<div style={{fontSize:12,color:p.muted,marginBottom:8,fontFamily:FF}}>‚è± {r.time}</div>}
            {r.link&&<div style={{fontSize:11,color:p.a2,marginBottom:8,fontFamily:FF}}>üîó Has source link</div>}
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {(r.tags||[]).map(t=><TagBadge key={t}>#{t}</TagBadge>)}
            </div>
          </Card>
        ))}
      </div>

      <Modal show={modal} onClose={()=>setModal(false)} title="Save a Recipe" wide>
        <FormCol>
          <Inp placeholder="Recipe name" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
          <Inp placeholder="Cook time (e.g. 30 min)" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
          <Inp placeholder="üîó Link to online recipe (optional)" value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))}/>
          <TA placeholder="Ingredients (one per line)" value={form.ingredients} onChange={e=>setForm(f=>({...f,ingredients:e.target.value}))} style={{minHeight:90}}/>
          <TA placeholder="Steps / Instructions" value={form.steps} onChange={e=>setForm(f=>({...f,steps:e.target.value}))} style={{minHeight:110}}/>
          <Inp placeholder="Tags: easy, dinner, quick (comma separated)" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/>
          <Btn onClick={add}>Save Recipe</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

/* ‚îÄ‚îÄ Files & Photos ‚îÄ‚îÄ */
function FilesSection({data,update}) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({name:"",type:"file",tag:"",dataUrl:null});
  const [filter, setFilter] = useState("All");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const allTags = ["All",...new Set(data.files.map(f=>f.tag).filter(Boolean))];
  const filtered = data.files.filter(f=>filter==="All"||f.tag===filter);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const isPhoto = file.type.startsWith("image/");
    setForm(f=>({...f,name:file.name,type:isPhoto?"photo":"file"}));
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f=>({...f,dataUrl:ev.target.result}));
    reader.readAsDataURL(file);
  };

  const add = () => {
    if(!form.name) return;
    update("files",[...data.files,{...form,id:Date.now(),date:new Date().toISOString().slice(0,10)}]);
    setModal(false); setForm({name:"",type:"file",tag:"",dataUrl:null});
    if(fileRef.current) fileRef.current.value="";
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <SectionTitle>üìÅ Files & Photos</SectionTitle>
        <Btn onClick={()=>setModal(true)}>+ Add Item</Btn>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {allTags.map(t=><Pill key={t} active={filter===t} onClick={()=>setFilter(t)}>{t}</Pill>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:12}}>
        {filtered.map(f=>(
          <Card key={f.id} style={{textAlign:"center",position:"relative",padding:14}} onClick={f.dataUrl?()=>setPreview(f):undefined}>
            <button onClick={(e)=>{e.stopPropagation();update("files",data.files.filter(x=>x.id!==f.id));}} style={{position:"absolute",top:8,right:10,background:"none",border:"none",cursor:"pointer",color:p.muted,fontSize:16,zIndex:1}}>‚úï</button>
            {f.dataUrl&&f.type==="photo" ? (
              <img src={f.dataUrl} alt={f.name} style={{width:"100%",height:90,objectFit:"cover",borderRadius:10,marginBottom:8,cursor:"pointer"}}/>
            ) : f.dataUrl&&f.type==="file" ? (
              <div style={{fontSize:40,marginBottom:8}}>üìÑ</div>
            ) : (
              <div style={{fontSize:44,marginBottom:10}}>{f.type==="photo"?"üñºÔ∏è":"üìÑ"}</div>
            )}
            <div style={{fontWeight:700,fontSize:12,marginBottom:6,wordBreak:"break-word",fontFamily:FF}}>{f.name}</div>
            {f.tag&&<TagBadge>{f.tag}</TagBadge>}
            <div style={{fontSize:10,color:p.muted,marginTop:8,fontFamily:FF}}>{f.date}</div>
            {f.dataUrl&&(
              <a href={f.dataUrl} download={f.name} onClick={e=>e.stopPropagation()} style={{display:"block",marginTop:6,fontSize:11,color:p.a1,fontWeight:700,textDecoration:"none",fontFamily:FF}}>‚¨á Download</a>
            )}
          </Card>
        ))}
      </div>

      {/* Photo preview modal */}
      {preview&&(
        <div onClick={()=>setPreview(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000,cursor:"pointer",padding:20}}>
          <img src={preview.dataUrl} alt={preview.name} style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,.5)"}}/>
        </div>
      )}

      <Modal show={modal} onClose={()=>setModal(false)} title="Add File or Photo">
        <FormCol>
          {/* Actual file upload */}
          <div style={{border:`2px dashed ${p.a3}`,borderRadius:12,padding:20,textAlign:"center",cursor:"pointer",background:p.soft}} onClick={()=>fileRef.current?.click()}>
            {form.dataUrl&&form.type==="photo" ? (
              <img src={form.dataUrl} alt="" style={{maxWidth:"100%",maxHeight:150,borderRadius:8,objectFit:"cover"}}/>
            ) : form.dataUrl ? (
              <div style={{fontSize:13,color:p.a1}}>üìÑ {form.name} ready to upload</div>
            ) : (
              <>
                <div style={{fontSize:36,marginBottom:8}}>üìÅ</div>
                <div style={{fontSize:14,color:p.muted,fontFamily:FF}}>Click to choose a file or photo</div>
                <div style={{fontSize:11,color:p.muted,marginTop:4,fontFamily:FF}}>Images, PDFs, documents ‚Äî anything!</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" style={{display:"none"}} onChange={handleFileSelect}/>

          <Inp placeholder="Name / Description" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <div style={{display:"flex",gap:8}}>
            {["file","photo"].map(t=>(
              <div key={t} onClick={()=>setForm(f=>({...f,type:t}))} style={{flex:1,padding:10,borderRadius:10,cursor:"pointer",textAlign:"center",fontWeight:700,fontFamily:FF,background:form.type===t?p.a1:p.tag,color:form.type===t?"#fff":p.muted}}>
                {t==="file"?"üìÑ File":"üñºÔ∏è Photo"}
              </div>
            ))}
          </div>
          <Inp placeholder="Tag (Health, School, Insurance‚Ä¶)" value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))}/>
          <Btn onClick={add}>Add Item</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

/* ‚îÄ‚îÄ Locations ‚îÄ‚îÄ */
function LocationsSection({data,update}) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({name:"",address:"",phone:"",notes:"",category:"Other"});
  const add = () => {
    if(!form.name) return;
    update("locations",[...data.locations,{...form,id:Date.now()}]);
    setModal(false); setForm({name:"",address:"",phone:"",notes:"",category:"Other"});
  };
  const cats = [...new Set(data.locations.map(l=>l.category))];
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <SectionTitle>üìç Saved Locations</SectionTitle>
        <Btn onClick={()=>setModal(true)}>+ Add Location</Btn>
      </div>
      {cats.map(cat=>(
        <div key={cat} style={{marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:700,color:p.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:1,fontFamily:FF}}>{cat}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
            {data.locations.filter(l=>l.category===cat).map(l=>(
              <Card key={l.id} style={{background:CAT_COLORS[cat]||"#f9f4fb"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <b style={{fontFamily:FF}}>{l.name}</b>
                  <button onClick={()=>update("locations",data.locations.filter(x=>x.id!==l.id))} style={{background:"none",border:"none",cursor:"pointer",color:p.muted}}>‚úï</button>
                </div>
                {l.address&&<div style={{fontSize:13,color:p.muted,marginBottom:3,fontFamily:FF}}>üìç {l.address}</div>}
                {l.phone&&<div style={{fontSize:13,color:p.muted,marginBottom:3,fontFamily:FF}}>üìû {l.phone}</div>}
                {l.notes&&<div style={{fontSize:13,color:p.text,fontStyle:"italic",marginTop:6,fontFamily:FF}}>"{l.notes}"</div>}
                {l.address&&<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`} target="_blank" rel="noreferrer" style={{fontSize:12,color:p.a1,fontWeight:700,textDecoration:"none",display:"block",marginTop:10,fontFamily:FF}}>üó∫ Open in Maps ‚Üí</a>}
              </Card>
            ))}
          </div>
        </div>
      ))}
      <Modal show={modal} onClose={()=>setModal(false)} title="Save a Location">
        <FormCol>
          <Inp placeholder="Place name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <Inp placeholder="Address" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
          <Inp placeholder="Phone (optional)" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
          <TA placeholder="Notes (hours, parking, tips‚Ä¶)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{minHeight:70}}/>
          <Sel value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            {["Health","Shopping","Fun","School","Other"].map(x=><option key={x}>{x}</option>)}
          </Sel>
          <Btn onClick={add}>Save Location</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

/* ‚îÄ‚îÄ Bills ‚îÄ‚îÄ */
function BillsSection({data,update}) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({name:"",amount:"",due:"",auto:false,category:"Utilities"});
  const add = () => {
    if(!form.name||!form.amount) return;
    update("bills",[...data.bills,{...form,amount:parseFloat(form.amount),due:parseInt(form.due)||1,id:Date.now(),paid:false}]);
    setModal(false); setForm({name:"",amount:"",due:"",auto:false,category:"Utilities"});
  };
  const total = data.bills.reduce((s,b)=>s+b.amount,0);
  const paidT = data.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <SectionTitle>üí∏ Bills & Budget</SectionTitle>
        <Btn onClick={()=>setModal(true)}>+ Add Bill</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        <Card style={{textAlign:"center",background:"#e8f5e9",border:"none"}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:AF,color:"#2e7d32"}}>${total.toFixed(2)}</div>
          <div style={{fontSize:12,color:p.muted,fontFamily:FF}}>Monthly Total</div>
        </Card>
        <Card style={{textAlign:"center",background:"#e3f2fd",border:"none"}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:AF,color:"#1565c0"}}>${paidT.toFixed(2)}</div>
          <div style={{fontSize:12,color:p.muted,fontFamily:FF}}>Paid</div>
        </Card>
        <Card style={{textAlign:"center",background:"#fdecea",border:"none"}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:AF,color:p.danger}}>${(total-paidT).toFixed(2)}</div>
          <div style={{fontSize:12,color:p.muted,fontFamily:FF}}>Remaining</div>
        </Card>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {data.bills.sort((a,b)=>a.due-b.due).map(b=>(
          <Card key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",opacity:b.paid?.65:1,borderLeft:`4px solid ${b.paid?p.a2:p.danger}`}}>
            <div>
              <div style={{fontWeight:700,fontFamily:FF,textDecoration:b.paid?"line-through":"none"}}>{b.name}</div>
              <div style={{fontSize:12,color:p.muted,fontFamily:FF}}>Due day {b.due} ¬∑ {b.category}{b.auto?" ¬∑ üîÑ Auto-pay":""}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <b style={{fontSize:16,fontFamily:AF}}>${b.amount}</b>
              <Btn small variant={b.paid?"ghost":"red"} onClick={()=>update("bills",data.bills.map(x=>x.id===b.id?{...x,paid:!x.paid}:x))}>{b.paid?"Undo":"‚úì Paid"}</Btn>
              <Btn small variant="danger" onClick={()=>update("bills",data.bills.filter(x=>x.id!==b.id))}>‚úï</Btn>
            </div>
          </Card>
        ))}
      </div>
      <Modal show={modal} onClose={()=>setModal(false)} title="Add a Bill">
        <FormCol>
          <Inp placeholder="Bill name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <Inp type="number" placeholder="Amount ($)" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
          <Inp type="number" placeholder="Due on day of month (e.g. 15)" value={form.due} onChange={e=>setForm(f=>({...f,due:e.target.value}))}/>
          <Sel value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            {["Utilities","Housing","Insurance","Subscriptions","Food","Other"].map(x=><option key={x}>{x}</option>)}
          </Sel>
          <label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",fontSize:14,fontFamily:FF}}>
            <input type="checkbox" checked={form.auto} onChange={e=>setForm(f=>({...f,auto:e.target.checked}))}/>
            Auto-pay enabled
          </label>
          <Btn onClick={add}>Add Bill</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

/* ‚îÄ‚îÄ App Shell ‚îÄ‚îÄ */
export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, update] = useData();

  const renderSection = () => {
    switch(active) {
      case "Dashboard":  return <Dashboard data={data}/>;
      case "Calendar":   return <CalendarSection data={data} update={update}/>;
      case "Alarms":     return <AlarmsSection data={data} update={update}/>;
      case "Notes":      return <NotesSection data={data} update={update}/>;
      case "Recipes":    return <RecipesSection data={data} update={update}/>;
      case "Files":      return <FilesSection data={data} update={update}/>;
      case "Locations":  return <LocationsSection data={data} update={update}/>;
      case "Bills":      return <BillsSection data={data} update={update}/>;
      default:           return null;
    }
  };

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:FF,background:p.bg,color:p.text,overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{
        width:sidebarOpen?230:64, background:p.sidebar,
        transition:"width .22s ease", flexShrink:0,
        display:"flex", flexDirection:"column", overflow:"hidden",
        boxShadow:"4px 0 20px rgba(155,61,18,.2)"
      }}>
        <div style={{padding:"22px 16px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${p.sidebarH}`}}>
          {sidebarOpen&&<div style={{flex:1,minWidth:0}}>
            <div style={{color:"#ede6f2",fontFamily:AF,fontSize:20,letterSpacing:.5}}>MomBase</div>
            <div style={{color:`${p.a3}cc`,fontSize:11,marginTop:2,fontFamily:FF}}>your life, organized üå∏</div>
          </div>}
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:"none",border:"none",color:`${p.a3}cc`,cursor:"pointer",fontSize:18,flexShrink:0,padding:4,lineHeight:1}}>{sidebarOpen?"‚óÄ":"‚ñ∂"}</button>
        </div>

        <nav style={{flex:1,paddingTop:10,overflowY:"auto"}}>
          {SECTIONS.map(s=>(
            <div key={s} onClick={()=>setActive(s)} title={s} style={{
              display:"flex", alignItems:"center", gap:12, padding:"11px 18px",
              cursor:"pointer", transition:"background .15s",
              background:active===s?p.sidebarH:"transparent",
              borderLeft:active===s?`3px solid ${p.a3}`:"3px solid transparent"
            }}>
              <span style={{fontSize:17,flexShrink:0}}>{ICONS[s]}</span>
              {sidebarOpen&&<span style={{
                color:active===s?"#fff":"#e8d0c8",
                fontSize:14, fontWeight:active===s?700:400,
                whiteSpace:"nowrap", overflow:"hidden", fontFamily:FF
              }}>{s}</span>}
            </div>
          ))}
        </nav>

        {sidebarOpen&&<div style={{padding:"12px 16px 20px",color:"#c4856a",fontSize:11,textAlign:"center",borderTop:`1px solid ${p.sidebarH}`,fontFamily:FF}}>
          You're doing great today üíõ
        </div>}
      </div>

      {/* Main */}
      <div style={{flex:1,overflowY:"auto",padding:"28px 28px 60px"}}>
        {renderSection()}
      </div>
    </div>
  );
}

