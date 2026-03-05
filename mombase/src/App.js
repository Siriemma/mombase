import { useState, useEffect } from "react";

const SECTIONS = ["Dashboard","Calendar","Alarms","Notes","Recipes","Files","Locations","Bills"];
const ICONS = {Dashboard:"🏡",Calendar:"📅",Alarms:"⏰",Notes:"📝",Recipes:"🍳",Files:"📁",Locations:"📍",Bills:"💸"};

const c = {
  bg:"#f5f0e8", card:"#fdfaf4", sidebar:"#3d2b1f", sidebarH:"#5c4033",
  a1:"#a0522d", a2:"#6b8e4e", a3:"#c8a96e", text:"#2d1e14",
  muted:"#7a6652", border:"#d4c4a8", danger:"#c0392b", tag:"#e8dcc8"
};

const DEFAULT_DATA = {
  events:[
    {id:1,title:"School pickup",date:"2026-03-04",time:"15:00",color:"#6b8e4e"},
    {id:2,title:"Grocery run",date:"2026-03-03",time:"10:00",color:"#a0522d"}
  ],
  alarms:[
    {id:1,label:"Take medication",time:"08:00",days:["Mon","Tue","Wed","Thu","Fri"],active:true},
    {id:2,label:"Start dinner prep",time:"17:00",days:["Mon","Tue","Wed","Thu","Fri"],active:true}
  ],
  notes:[
    {id:1,title:"School supply list",content:"Glue sticks, markers, composition notebook, scissors",color:"#fef9c3",pinned:true,date:"2026-02-28"},
    {id:2,title:"Self-care reminder",content:"You are doing amazing. Rest is productive. ✨",color:"#dcfce7",pinned:true,date:"2026-03-01"}
  ],
  recipes:[
    {id:1,title:"One-Pot Pasta",ingredients:"Pasta\nCanned tomatoes\nGarlic (3 cloves)\nFresh basil\nOlive oil\nParmesan",steps:"1. Boil salted pasta water.\n2. Sauté garlic in olive oil 1 min.\n3. Add tomatoes, simmer 5 min.\n4. Drain pasta, combine with sauce.\n5. Top with fresh basil and parmesan.",tags:["easy","quick","dinner"],time:"20 min"},
    {id:2,title:"Sheet Pan Chicken",ingredients:"Chicken thighs (4)\nBaby potatoes\nBroccoli florets\nOlive oil\nGarlic powder, Italian herbs\nSalt & pepper",steps:"1. Preheat oven to 425°F.\n2. Toss everything in olive oil and seasoning.\n3. Spread on a sheet pan in a single layer.\n4. Roast 35 min until chicken is cooked through.\n5. Broil last 2 min for crispy skin.",tags:["dinner","meal prep"],time:"40 min"}
  ],
  files:[
    {id:1,name:"Insurance card",type:"file",icon:"📄",date:"2026-01-15",tag:"Health"},
    {id:2,name:"Family photo Jan",type:"photo",icon:"🖼️",date:"2026-01-20",tag:"Family"}
  ],
  locations:[
    {id:1,name:"Pediatrician",address:"123 Maple St",phone:"555-0101",notes:"Dr. Kim — 2nd floor, bring insurance card",category:"Health"},
    {id:2,name:"Best Grocery Store",address:"456 Oak Ave",phone:"",notes:"Best produce section, parking lot on the side street",category:"Shopping"},
    {id:3,name:"Kids' Favorite Park",address:"Riverside Park, Main Entrance",phone:"",notes:"Bring bug spray in summer! Picnic tables near the east gate.",category:"Fun"}
  ],
  bills:[
    {id:1,name:"Electric Bill",amount:120,due:15,paid:false,auto:false,category:"Utilities"},
    {id:2,name:"Internet",amount:65,due:1,paid:true,auto:true,category:"Utilities"},
    {id:3,name:"Mortgage",amount:1450,due:1,paid:true,auto:true,category:"Housing"},
    {id:4,name:"Car Insurance",amount:180,due:22,paid:false,auto:false,category:"Insurance"}
  ]
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const NOTE_COLORS = ["#fef9c3","#dcfce7","#dbeafe","#fce7f3","#f3e8ff","#fed7aa"];

// ── Persistence ───────────────────────────────────────────────────────────────
function useData() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("mombase_v1");
      return saved ? JSON.parse(saved) : DEFAULT_DATA;
    } catch { return DEFAULT_DATA; }
  });

  const update = (key, val) => {
    setData(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem("mombase_v1", JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };

  return [data, update];
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", small, style }) => {
  const vs = {
    primary: { background: c.a1, color: "#fff" },
    green:   { background: c.a2, color: "#fff" },
    danger:  { background: c.danger, color: "#fff" },
    ghost:   { background: "transparent", color: c.muted, border: `1px solid ${c.border}` },
  };
  return (
    <button onClick={onClick} style={{
      border:"none", borderRadius:8, cursor:"pointer", fontFamily:"inherit",
      fontWeight:600, padding: small ? "6px 12px" : "10px 20px",
      fontSize: small ? 13 : 14, ...vs[variant], ...style
    }}>{children}</button>
  );
};

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: c.card, border: `1px solid ${c.border}`, borderRadius:14,
    padding:20, cursor: onClick ? "pointer" : "default", ...style
  }}>{children}</div>
);

const Inp = ({ style, ...p }) => (
  <input style={{
    width:"100%", padding:"9px 12px", border:`1.5px solid ${c.border}`,
    borderRadius:8, fontFamily:"inherit", fontSize:14, background:c.bg,
    color:c.text, outline:"none", boxSizing:"border-box", ...style
  }} {...p} />
);

const TA = ({ style, ...p }) => (
  <textarea style={{
    width:"100%", padding:"9px 12px", border:`1.5px solid ${c.border}`,
    borderRadius:8, fontFamily:"inherit", fontSize:14, background:c.bg,
    color:c.text, outline:"none", resize:"vertical", boxSizing:"border-box", ...style
  }} {...p} />
);

const Tag = ({ children }) => (
  <span style={{
    background:c.tag, color:c.muted, borderRadius:20, padding:"3px 10px",
    fontSize:12, fontWeight:600, display:"inline-block"
  }}>{children}</span>
);

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:1000, padding:16
    }}>
      <div style={{
        background:c.card, borderRadius:16, padding:28, width:"100%",
        maxWidth:480, maxHeight:"85vh", overflowY:"auto",
        boxShadow:"0 8px 40px rgba(0,0,0,.25)"
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, color:c.text, fontSize:18 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:c.muted }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const FormCol = ({ children }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>{children}</div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ data }) {
  const today = new Date();
  const ts = today.toISOString().slice(0,10);
  const dw = DAYS[today.getDay()];
  const h = today.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const todayEvents = data.events.filter(e => e.date === ts);
  const unpaidBills = data.bills.filter(b => !b.paid);
  const todayAlarms = data.alarms.filter(a => a.active && a.days.includes(dw));
  const pinnedNotes = data.notes.filter(n => n.pinned);

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ margin:0, color:c.a1, fontSize:30 }}>{greeting} 🌿</h2>
        <p style={{ margin:"6px 0 0", color:c.muted, fontSize:15 }}>
          {today.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:28 }}>
        {[
          { l:"Today's Events",  v:todayEvents.length,  i:"📅", bg:"#a0522d18" },
          { l:"Unpaid Bills",    v:unpaidBills.length,  i:"💸", bg:"#c0392b18" },
          { l:"Active Alarms",   v:todayAlarms.length,  i:"⏰", bg:"#6b8e4e18" },
          { l:"Pinned Notes",    v:pinnedNotes.length,  i:"📌", bg:"#c8a96e28" },
        ].map(s => (
          <Card key={s.l} style={{ background:s.bg, textAlign:"center", padding:"18px 12px" }}>
            <div style={{ fontSize:28 }}>{s.i}</div>
            <div style={{ fontSize:28, fontWeight:700, color:c.text }}>{s.v}</div>
            <div style={{ fontSize:12, color:c.muted }}>{s.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:16 }}>
        <Card>
          <h4 style={{ margin:"0 0 12px", color:c.a1 }}>📅 Today's Schedule</h4>
          {todayEvents.length ? todayEvents.map(e => (
            <div key={e.id} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:e.color, flexShrink:0 }} />
              <b style={{ fontSize:14 }}>{e.time}</b>
              <span style={{ fontSize:14, color:c.muted }}>{e.title}</span>
            </div>
          )) : <p style={{ color:c.muted, fontSize:14, margin:0 }}>Free day — enjoy it! 🎉</p>}
        </Card>

        <Card>
          <h4 style={{ margin:"0 0 12px", color:c.a1 }}>⏰ Today's Alarms</h4>
          {todayAlarms.length ? todayAlarms.map(a => (
            <div key={a.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:14 }}>{a.label}</span>
              <b style={{ fontSize:14, color:c.a2 }}>{a.time}</b>
            </div>
          )) : <p style={{ color:c.muted, fontSize:14, margin:0 }}>No alarms today</p>}
        </Card>

        <Card>
          <h4 style={{ margin:"0 0 12px", color:c.a1 }}>💸 Bills to Pay</h4>
          {unpaidBills.slice(0,4).map(b => (
            <div key={b.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:14 }}>{b.name}</span>
              <b style={{ fontSize:14, color:c.danger }}>${b.amount} · Day {b.due}</b>
            </div>
          ))}
          {!unpaidBills.length && <p style={{ color:c.muted, fontSize:14, margin:0 }}>All bills paid! 🎉</p>}
        </Card>

        <Card>
          <h4 style={{ margin:"0 0 12px", color:c.a1 }}>📌 Pinned Notes</h4>
          {pinnedNotes.slice(0,3).map(n => (
            <div key={n.id} style={{ background:n.color, borderRadius:8, padding:"8px 12px", marginBottom:8 }}>
              <b style={{ fontSize:13 }}>{n.title}</b>
              <div style={{ fontSize:12, color:c.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.content}</div>
            </div>
          ))}
          {!pinnedNotes.length && <p style={{ color:c.muted, fontSize:14, margin:0 }}>No pinned notes yet</p>}
        </Card>
      </div>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function CalendarSection({ data, update }) {
  const today = new Date();
  const [yr, setYr] = useState(today.getFullYear());
  const [mo, setMo] = useState(today.getMonth());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title:"", date:"", time:"", color:"#6b8e4e" });

  const fd = new Date(yr, mo, 1).getDay();
  const dim = new Date(yr, mo+1, 0).getDate();
  const ts = today.toISOString().slice(0,10);
  const cells = [];
  for (let i = 0; i < fd; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  const prev = () => { if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1); };
  const next = () => { if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1); };
  const add = () => {
    if (!form.title || !form.date) return;
    update("events", [...data.events, { ...form, id:Date.now() }]);
    setModal(false); setForm({ title:"", date:"", time:"", color:"#6b8e4e" });
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={prev} style={{ background:c.tag, border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:18 }}>‹</button>
          <h3 style={{ margin:0, minWidth:190, textAlign:"center" }}>{MONTHS[mo]} {yr}</h3>
          <button onClick={next} style={{ background:c.tag, border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:18 }}>›</button>
        </div>
        <Btn onClick={() => setModal(true)}>+ Add Event</Btn>
      </div>

      <Card style={{ marginBottom:24 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:6 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:c.muted, padding:"3px 0" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={"e"+i} />;
            const ds = `${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const evs = data.events.filter(e => e.date === ds);
            const isToday = ds === ts;
            return (
              <div key={ds} style={{
                minHeight:56, borderRadius:8, padding:4,
                background: isToday ? c.a3+"40" : c.bg,
                border: isToday ? `2px solid ${c.a3}` : `1px solid ${c.border}`
              }}>
                <div style={{ fontSize:11, fontWeight:isToday?800:500, color:isToday?c.a1:c.text, marginBottom:1 }}>{d}</div>
                {evs.slice(0,2).map(e => (
                  <div key={e.id} style={{ fontSize:9, background:e.color, color:"#fff", borderRadius:3, padding:"1px 3px", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.title}</div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      <h4 style={{ color:c.a1, margin:"0 0 12px" }}>All Events</h4>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {data.events.sort((a,b) => a.date.localeCompare(b.date)).map(e => (
          <Card key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:e.color, flexShrink:0 }} />
              <div>
                <b>{e.title}</b>
                <div style={{ fontSize:12, color:c.muted }}>{e.date}{e.time ? ` · ${e.time}` : ""}</div>
              </div>
            </div>
            <Btn small variant="danger" onClick={() => update("events", data.events.filter(x => x.id!==e.id))}>✕</Btn>
          </Card>
        ))}
      </div>

      <Modal show={modal} onClose={() => setModal(false)} title="New Event">
        <FormCol>
          <Inp placeholder="Event title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          <Inp type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
          <Inp type="time" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))} />
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:13, color:c.muted }}>Color:</span>
            {["#6b8e4e","#a0522d","#c8a96e","#7b5ea7","#2980b9","#e74c3c"].map(col => (
              <div key={col} onClick={() => setForm(f=>({...f,color:col}))} style={{ width:26, height:26, borderRadius:"50%", background:col, cursor:"pointer", border:form.color===col?"3px solid #333":"2px solid #ddd" }} />
            ))}
          </div>
          <Btn onClick={add}>Save Event</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

// ── Alarms ────────────────────────────────────────────────────────────────────
function AlarmsSection({ data, update }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ label:"", time:"08:00", days:[] });
  const toggleDay = d => setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x=>x!==d) : [...f.days,d] }));
  const add = () => {
    if (!form.label || !form.time) return;
    update("alarms", [...data.alarms, { ...form, id:Date.now(), active:true }]);
    setModal(false); setForm({ label:"", time:"08:00", days:[] });
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0 }}>⏰ Alarms & Reminders</h3>
        <Btn onClick={() => setModal(true)}>+ New Alarm</Btn>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {data.alarms.map(a => (
          <Card key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", opacity:a.active?1:.55 }}>
            <div>
              <div style={{ fontSize:32, fontWeight:700, color:a.active?c.a1:c.muted }}>{a.time}</div>
              <b style={{ display:"block", marginTop:2, marginBottom:8 }}>{a.label}</b>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {DAYS.map(d => (
                  <span key={d} style={{ fontSize:11, padding:"2px 7px", borderRadius:20, fontWeight:600, background:a.days.includes(d)?c.a2:c.tag, color:a.days.includes(d)?"#fff":c.muted }}>{d}</span>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div onClick={() => update("alarms", data.alarms.map(x => x.id===a.id ? {...x,active:!x.active} : x))}
                style={{ width:50, height:28, borderRadius:14, background:a.active?c.a2:c.border, cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
                <div style={{ position:"absolute", top:4, left:a.active?26:4, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
              </div>
              <Btn small variant="danger" onClick={() => update("alarms", data.alarms.filter(x => x.id!==a.id))}>✕</Btn>
            </div>
          </Card>
        ))}
      </div>

      <Modal show={modal} onClose={() => setModal(false)} title="New Alarm">
        <FormCol>
          <Inp placeholder="Label (e.g. Take vitamins)" value={form.label} onChange={e => setForm(f=>({...f,label:e.target.value}))} />
          <Inp type="time" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))} />
          <div>
            <div style={{ fontSize:13, color:c.muted, marginBottom:8 }}>Repeat on:</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {DAYS.map(d => (
                <div key={d} onClick={() => toggleDay(d)} style={{ padding:"6px 12px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:600, background:form.days.includes(d)?c.a2:c.tag, color:form.days.includes(d)?"#fff":c.muted }}>{d}</div>
              ))}
            </div>
          </div>
          <Btn onClick={add}>Save Alarm</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

// ── Notes ─────────────────────────────────────────────────────────────────────
function NotesSection({ data, update }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title:"", content:"", color:"#fef9c3", pinned:false });
  const [search, setSearch] = useState("");

  const add = () => {
    if (!form.title) return;
    update("notes", [...data.notes, { ...form, id:Date.now(), date:new Date().toISOString().slice(0,10) }]);
    setModal(false); setForm({ title:"", content:"", color:"#fef9c3", pinned:false });
  };

  const filtered = data.notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const NoteCard = ({ note }) => {
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(note.content);
    return (
      <div style={{ background:note.color, borderRadius:12, padding:16, border:`1px solid ${c.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <b style={{ fontSize:14 }}>{note.title}</b>
          <div style={{ display:"flex", gap:4 }}>
            <button onClick={() => update("notes", data.notes.map(n => n.id===note.id ? {...n,pinned:!n.pinned} : n))}
              style={{ background:"none", border:"none", cursor:"pointer", fontSize:15 }}>{note.pinned?"📌":"📍"}</button>
            <button onClick={() => update("notes", data.notes.filter(n => n.id!==note.id))}
              style={{ background:"none", border:"none", cursor:"pointer", fontSize:15, color:c.muted }}>✕</button>
          </div>
        </div>
        {editing ? (
          <div>
            <TA value={content} onChange={e => setContent(e.target.value)} style={{ minHeight:80, background:"rgba(255,255,255,0.6)", marginBottom:8 }} />
            <Btn small onClick={() => { update("notes", data.notes.map(n => n.id===note.id ? {...n,content} : n)); setEditing(false); }}>Save</Btn>
          </div>
        ) : (
          <div onClick={() => setEditing(true)} style={{ fontSize:13, lineHeight:1.6, cursor:"pointer", minHeight:36, color:c.text }}>
            {note.content || <i style={{ color:c.muted }}>Click to edit…</i>}
          </div>
        )}
        <div style={{ fontSize:11, color:c.muted, marginTop:8 }}>{note.date}</div>
      </div>
    );
  };

  const pinned = filtered.filter(n => n.pinned);
  const rest = filtered.filter(n => !n.pinned);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ margin:0 }}>📝 Notes</h3>
        <Btn onClick={() => setModal(true)}>+ New Note</Btn>
      </div>
      <Inp placeholder="🔍 Search notes…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom:20 }} />

      {pinned.length > 0 && <>
        <div style={{ fontSize:12, fontWeight:700, color:c.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>📌 Pinned</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:12, marginBottom:20 }}>
          {pinned.map(n => <NoteCard key={n.id} note={n} />)}
        </div>
      </>}
      {rest.length > 0 && <>
        <div style={{ fontSize:12, fontWeight:700, color:c.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>All Notes</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:12 }}>
          {rest.map(n => <NoteCard key={n.id} note={n} />)}
        </div>
      </>}

      <Modal show={modal} onClose={() => setModal(false)} title="New Note">
        <FormCol>
          <Inp placeholder="Title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          <TA placeholder="Write your note…" value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))} style={{ minHeight:120 }} />
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:13, color:c.muted }}>Color:</span>
            {NOTE_COLORS.map(col => <div key={col} onClick={() => setForm(f=>({...f,color:col}))} style={{ width:24, height:24, borderRadius:"50%", background:col, cursor:"pointer", border:form.color===col?"3px solid #555":"2px solid #ccc" }} />)}
          </div>
          <label style={{ display:"flex", gap:8, alignItems:"center", cursor:"pointer", fontSize:14 }}>
            <input type="checkbox" checked={form.pinned} onChange={e => setForm(f=>({...f,pinned:e.target.checked}))} />
            Pin this note
          </label>
          <Btn onClick={add}>Save Note</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

// ── Recipes ───────────────────────────────────────────────────────────────────
function RecipesSection({ data, update }) {
  const [modal, setModal] = useState(false);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ title:"", ingredients:"", steps:"", tags:"", time:"" });
  const [search, setSearch] = useState("");

  const add = () => {
    if (!form.title) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    update("recipes", [...data.recipes, { ...form, tags, id:Date.now() }]);
    setModal(false); setForm({ title:"", ingredients:"", steps:"", tags:"", time:"" });
  };

  const filtered = data.recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.tags||[]).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  if (sel) {
    const r = data.recipes.find(x => x.id === sel);
    if (!r) { setSel(null); return null; }
    return (
      <div>
        <Btn small variant="ghost" onClick={() => setSel(null)} style={{ marginBottom:16 }}>← Back to Recipes</Btn>
        <Card>
          <h2 style={{ color:c.a1, margin:"0 0 8px" }}>{r.title}</h2>
          {r.time && <Tag>⏱ {r.time}</Tag>}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", margin:"12px 0" }}>
            {(r.tags||[]).map(t => <Tag key={t}>#{t}</Tag>)}
          </div>
          <h4 style={{ color:c.a2, margin:"16px 0 8px" }}>🧾 Ingredients</h4>
          <div style={{ whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.8, background:c.bg, borderRadius:8, padding:14 }}>{r.ingredients}</div>
          <h4 style={{ color:c.a2, margin:"16px 0 8px" }}>👩‍🍳 Instructions</h4>
          <div style={{ whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.8, background:c.bg, borderRadius:8, padding:14 }}>{r.steps}</div>
          <Btn variant="danger" small style={{ marginTop:16 }} onClick={() => { update("recipes", data.recipes.filter(x => x.id!==r.id)); setSel(null); }}>Delete Recipe</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ margin:0 }}>🍳 Recipes</h3>
        <Btn onClick={() => setModal(true)}>+ Save Recipe</Btn>
      </div>
      <Inp placeholder="🔍 Search by name or tag…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom:20 }} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
        {filtered.map(r => (
          <Card key={r.id} onClick={() => setSel(r.id)}>
            <div style={{ fontSize:38, marginBottom:10 }}>🍽️</div>
            <h4 style={{ margin:"0 0 6px" }}>{r.title}</h4>
            {r.time && <div style={{ fontSize:12, color:c.muted, marginBottom:8 }}>⏱ {r.time}</div>}
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {(r.tags||[]).map(t => <Tag key={t}>#{t}</Tag>)}
            </div>
          </Card>
        ))}
      </div>
      <Modal show={modal} onClose={() => setModal(false)} title="Save a Recipe">
        <FormCol>
          <Inp placeholder="Recipe name" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          <Inp placeholder="Cook time (e.g. 30 min)" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))} />
          <TA placeholder="Ingredients (one per line)" value={form.ingredients} onChange={e => setForm(f=>({...f,ingredients:e.target.value}))} style={{ minHeight:90 }} />
          <TA placeholder="Steps / Instructions" value={form.steps} onChange={e => setForm(f=>({...f,steps:e.target.value}))} style={{ minHeight:110 }} />
          <Inp placeholder="Tags: easy, dinner, quick (comma separated)" value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} />
          <Btn onClick={add}>Save Recipe</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

// ── Files & Photos ────────────────────────────────────────────────────────────
function FilesSection({ data, update }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", type:"file", tag:"" });
  const [filter, setFilter] = useState("All");

  const allTags = ["All", ...new Set(data.files.map(f => f.tag).filter(Boolean))];
  const filtered = data.files.filter(f => filter === "All" || f.tag === filter);

  const add = () => {
    if (!form.name) return;
    update("files", [...data.files, { ...form, id:Date.now(), date:new Date().toISOString().slice(0,10), icon:form.type==="photo"?"🖼️":"📄" }]);
    setModal(false); setForm({ name:"", type:"file", tag:"" });
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ margin:0 }}>📁 Files & Photos</h3>
        <Btn onClick={() => setModal(true)}>+ Add Item</Btn>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {allTags.map(t => (
          <div key={t} onClick={() => setFilter(t)} style={{ padding:"6px 14px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:600, background:filter===t?c.a1:c.tag, color:filter===t?"#fff":c.muted }}>{t}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
        {filtered.map(f => (
          <Card key={f.id} style={{ textAlign:"center", position:"relative" }}>
            <button onClick={() => update("files", data.files.filter(x => x.id!==f.id))} style={{ position:"absolute", top:8, right:10, background:"none", border:"none", cursor:"pointer", color:c.muted, fontSize:16 }}>✕</button>
            <div style={{ fontSize:44, marginBottom:10 }}>{f.icon}</div>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:6, wordBreak:"break-word" }}>{f.name}</div>
            {f.tag && <Tag>{f.tag}</Tag>}
            <div style={{ fontSize:11, color:c.muted, marginTop:8 }}>{f.date}</div>
          </Card>
        ))}
      </div>
      <Modal show={modal} onClose={() => setModal(false)} title="Add File or Photo">
        <FormCol>
          <Inp placeholder="Name / Description" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          <div style={{ display:"flex", gap:8 }}>
            {["file","photo"].map(t => (
              <div key={t} onClick={() => setForm(f=>({...f,type:t}))} style={{ flex:1, padding:10, borderRadius:8, cursor:"pointer", textAlign:"center", fontWeight:600, background:form.type===t?c.a2:c.tag, color:form.type===t?"#fff":c.muted }}>
                {t==="file"?"📄 File":"🖼️ Photo"}
              </div>
            ))}
          </div>
          <Inp placeholder="Tag (Health, School, Insurance…)" value={form.tag} onChange={e => setForm(f=>({...f,tag:e.target.value}))} />
          <Btn onClick={add}>Add Item</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

// ── Locations ─────────────────────────────────────────────────────────────────
const CAT_COLORS = { Health:"#fee2e2", Shopping:"#dcfce7", Fun:"#dbeafe", School:"#fef9c3", Other:"#f3e8ff" };

function LocationsSection({ data, update }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", address:"", phone:"", notes:"", category:"Other" });

  const add = () => {
    if (!form.name) return;
    update("locations", [...data.locations, { ...form, id:Date.now() }]);
    setModal(false); setForm({ name:"", address:"", phone:"", notes:"", category:"Other" });
  };

  const categories = [...new Set(data.locations.map(l => l.category))];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0 }}>📍 Saved Locations</h3>
        <Btn onClick={() => setModal(true)}>+ Add Location</Btn>
      </div>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom:28 }}>
          <div style={{ fontSize:12, fontWeight:700, color:c.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>{cat}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
            {data.locations.filter(l => l.category===cat).map(l => (
              <Card key={l.id} style={{ background:CAT_COLORS[cat]||"#f5f5f5" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <b>{l.name}</b>
                  <button onClick={() => update("locations", data.locations.filter(x => x.id!==l.id))} style={{ background:"none", border:"none", cursor:"pointer", color:c.muted }}>✕</button>
                </div>
                {l.address && <div style={{ fontSize:13, color:c.muted, marginBottom:3 }}>📍 {l.address}</div>}
                {l.phone && <div style={{ fontSize:13, color:c.muted, marginBottom:3 }}>📞 {l.phone}</div>}
                {l.notes && <div style={{ fontSize:13, color:c.text, fontStyle:"italic", marginTop:6 }}>"{l.notes}"</div>}
                {l.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize:12, color:c.a1, fontWeight:600, textDecoration:"none", display:"block", marginTop:10 }}>
                    🗺 Open in Maps →
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
      <Modal show={modal} onClose={() => setModal(false)} title="Save a Location">
        <FormCol>
          <Inp placeholder="Place name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          <Inp placeholder="Address" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} />
          <Inp placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
          <TA placeholder="Notes (parking, hours, tips…)" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} style={{ minHeight:70 }} />
          <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} style={{ padding:"9px 12px", border:`1.5px solid ${c.border}`, borderRadius:8, fontFamily:"inherit", fontSize:14, background:c.bg, color:c.text }}>
            {["Health","Shopping","Fun","School","Other"].map(x => <option key={x}>{x}</option>)}
          </select>
          <Btn onClick={add}>Save Location</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

// ── Bills ─────────────────────────────────────────────────────────────────────
function BillsSection({ data, update }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", amount:"", due:"", auto:false, category:"Utilities" });

  const add = () => {
    if (!form.name || !form.amount) return;
    update("bills", [...data.bills, { ...form, amount:parseFloat(form.amount), due:parseInt(form.due)||1, id:Date.now(), paid:false }]);
    setModal(false); setForm({ name:"", amount:"", due:"", auto:false, category:"Utilities" });
  };

  const total = data.bills.reduce((s,b) => s+b.amount, 0);
  const paidTotal = data.bills.filter(b=>b.paid).reduce((s,b) => s+b.amount, 0);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ margin:0 }}>💸 Bills & Budget</h3>
        <Btn onClick={() => setModal(true)}>+ Add Bill</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
        <Card style={{ textAlign:"center", background:"#f0fdf4" }}>
          <div style={{ fontSize:22, fontWeight:800, color:c.a2 }}>${total.toFixed(2)}</div>
          <div style={{ fontSize:12, color:c.muted }}>Monthly Total</div>
        </Card>
        <Card style={{ textAlign:"center", background:"#eff6ff" }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#2563eb" }}>${paidTotal.toFixed(2)}</div>
          <div style={{ fontSize:12, color:c.muted }}>Paid</div>
        </Card>
        <Card style={{ textAlign:"center", background:"#fef2f2" }}>
          <div style={{ fontSize:22, fontWeight:800, color:c.danger }}>${(total-paidTotal).toFixed(2)}</div>
          <div style={{ fontSize:12, color:c.muted }}>Remaining</div>
        </Card>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {data.bills.sort((a,b) => a.due-b.due).map(b => (
          <Card key={b.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", opacity:b.paid?.65:1, borderLeft:`4px solid ${b.paid?c.a2:c.danger}` }}>
            <div>
              <div style={{ fontWeight:600, textDecoration:b.paid?"line-through":"none" }}>{b.name}</div>
              <div style={{ fontSize:12, color:c.muted }}>Due day {b.due} · {b.category}{b.auto?" · 🔄 Auto-pay":""}</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <b style={{ fontSize:16 }}>${b.amount}</b>
              <Btn small variant={b.paid?"ghost":"green"} onClick={() => update("bills", data.bills.map(x => x.id===b.id ? {...x,paid:!x.paid} : x))}>
                {b.paid?"Undo":"✓ Paid"}
              </Btn>
              <Btn small variant="danger" onClick={() => update("bills", data.bills.filter(x => x.id!==b.id))}>✕</Btn>
            </div>
          </Card>
        ))}
      </div>

      <Modal show={modal} onClose={() => setModal(false)} title="Add a Bill">
        <FormCol>
          <Inp placeholder="Bill name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          <Inp type="number" placeholder="Amount ($)" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
          <Inp type="number" placeholder="Due on day of month (e.g. 15)" value={form.due} onChange={e => setForm(f=>({...f,due:e.target.value}))} />
          <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} style={{ padding:"9px 12px", border:`1.5px solid ${c.border}`, borderRadius:8, fontFamily:"inherit", fontSize:14, background:c.bg, color:c.text }}>
            {["Utilities","Housing","Insurance","Subscriptions","Food","Other"].map(x => <option key={x}>{x}</option>)}
          </select>
          <label style={{ display:"flex", gap:8, alignItems:"center", cursor:"pointer", fontSize:14 }}>
            <input type="checkbox" checked={form.auto} onChange={e => setForm(f=>({...f,auto:e.target.checked}))} />
            Auto-pay enabled
          </label>
          <Btn onClick={add}>Add Bill</Btn>
        </FormCol>
      </Modal>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 600);
  const [data, update] = useData();

  const renderSection = () => {
    switch(active) {
      case "Dashboard":    return <Dashboard data={data} />;
      case "Calendar":     return <CalendarSection data={data} update={update} />;
      case "Alarms":       return <AlarmsSection data={data} update={update} />;
      case "Notes":        return <NotesSection data={data} update={update} />;
      case "Recipes":      return <RecipesSection data={data} update={update} />;
      case "Files":        return <FilesSection data={data} update={update} />;
      case "Locations":    return <LocationsSection data={data} update={update} />;
      case "Bills":        return <BillsSection data={data} update={update} />;
      default:             return null;
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", background:c.bg, color:c.text, overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:sidebarOpen?220:60, background:c.sidebar, transition:"width .2s ease", flexShrink:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"20px 14px 14px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${c.sidebarH}` }}>
          {sidebarOpen && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#e8dcc8", fontWeight:800, fontSize:17, letterSpacing:.5 }}>MomBase</div>
              <div style={{ color:c.a3, fontSize:11, marginTop:2 }}>your life, organized 🌿</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background:"none", border:"none", color:c.a3, cursor:"pointer", fontSize:18, flexShrink:0, padding:4, lineHeight:1 }}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        <nav style={{ flex:1, paddingTop:8 }}>
          {SECTIONS.map(s => (
            <div key={s} onClick={() => { setActive(s); if(window.innerWidth<=600) setSidebarOpen(false); }} title={s}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", cursor:"pointer", transition:"background .15s", background:active===s?c.sidebarH:"transparent", borderLeft:active===s?`3px solid ${c.a3}`:"3px solid transparent" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{ICONS[s]}</span>
              {sidebarOpen && <span style={{ color:active===s?"#fff":"#c4a882", fontSize:14, fontWeight:active===s?700:400, whiteSpace:"nowrap", overflow:"hidden" }}>{s}</span>}
            </div>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding:"12px 16px 20px", color:"#6b5040", fontSize:11, textAlign:"center", borderTop:`1px solid ${c.sidebarH}` }}>
            You're doing great today 💛
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 24px 60px" }}>
        {renderSection()}
      </div>
    </div>
  );
}
