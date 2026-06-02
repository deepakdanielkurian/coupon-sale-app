import { useState } from "react";
import { useApp } from "../data/AppContext";
import { ROLES, fmt } from "../data/store";

const GREEN = "#1a6b3c";

function Row({ icon, iconBg="#e8f5ee", iconColor=GREEN, label, value, onClick, danger, badge, sub }) {
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderBottom:"1px solid #f5f7f5", cursor:onClick?"pointer":"default" }}>
      <div style={{ width:36, height:36, borderRadius:10, background:danger?"#ffebee":iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <i className={`ti ${icon}`} style={{ color:danger?"#dc2626":iconColor, fontSize:16 }}/>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:500, color:danger?"#dc2626":"#1a1a1a" }}>{label}</div>
        {sub && <div style={{ fontSize:10, color:"#aaa", marginTop:1 }}>{sub}</div>}
      </div>
      {badge && <span style={{ fontSize:10, fontWeight:700, background:"#e8f5ee", color:GREEN, padding:"2px 9px", borderRadius:8 }}>{badge}</span>}
      {value && <span style={{ fontSize:12, color:"#aaa" }}>{value}</span>}
      {onClick && <i className="ti ti-chevron-right" style={{ color:"#ddd", fontSize:14 }}/>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:7, paddingLeft:2 }}>{title}</div>
      <div style={{ background:"#fff", borderRadius:13, border:"1px solid #eee", overflow:"hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ── Inline create user form ────────────────────────────────────
function CreateUserForm({ onDone, onCancel, existingUsers }) {
  const { addUser, showToast } = useApp();
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"member" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const roleOptions = [
    { key:"admin",  label:"Admin",  desc:"Reports, assign books, collect cash" },
    { key:"member", label:"Member", desc:"Collect cash, add members" },
    { key:"viewer", label:"Viewer", desc:"View only — no edits" },
  ];

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (!form.password.trim()) e.password = "Password is required";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (existingUsers.find(u => u.email.toLowerCase() === form.email.toLowerCase())) e.email = "Email already in use";
    return e;
  }

  function handleCreate() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addUser({ name:form.name.trim(), email:form.email.trim(), password:form.password, role:form.role });
    showToast(`${form.name} created as ${ROLES[form.role]?.label}`);
    onDone();
  }

  return (
    <div style={{ background:"#f8fdf9", borderRadius:13, border:`2px solid ${GREEN}`, padding:"14px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:GREEN }}>Create new user</div>
          <div style={{ fontSize:10, color:"#aaa", marginTop:1 }}>Fill details and select a role</div>
        </div>
        <button onClick={onCancel} style={{ background:"#f0f0f0", border:"none", borderRadius:8, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#888" }}>
          <i className="ti ti-x" style={{ fontSize:14 }}/>
        </button>
      </div>

      {/* Name */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Full name *</div>
        <input value={form.name} onChange={e=>{set("name",e.target.value);setErrors(v=>({...v,name:""}));}}
          placeholder="e.g. Rajan Kumar"
          style={{ width:"100%", background:"#fff", border:`1.5px solid ${errors.name?"#dc2626":form.name?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
        {errors.name && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>{errors.name}</div>}
      </div>

      {/* Email */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Email address *</div>
        <input type="email" value={form.email} onChange={e=>{set("email",e.target.value);setErrors(v=>({...v,email:""}));}}
          placeholder="user@example.com"
          style={{ width:"100%", background:"#fff", border:`1.5px solid ${errors.email?"#dc2626":form.email?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
        {errors.email && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>{errors.email}</div>}
      </div>

      {/* Password */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Password *</div>
        <div style={{ position:"relative" }}>
          <input type={showPass?"text":"password"} value={form.password} onChange={e=>{set("password",e.target.value);setErrors(v=>({...v,password:""}));}}
            placeholder="Min 6 characters"
            style={{ width:"100%", background:"#fff", border:`1.5px solid ${errors.password?"#dc2626":form.password?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"9px 36px 9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
          <button type="button" onClick={()=>setShowPass(s=>!s)}
            style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa" }}>
            <i className={`ti ${showPass?"ti-eye-off":"ti-eye"}`} style={{ fontSize:15 }}/>
          </button>
        </div>
        {errors.password && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>{errors.password}</div>}
      </div>

      {/* Role selector */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:6 }}>Role *</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {roleOptions.map(r => {
            const ri = ROLES[r.key];
            return (
              <div key={r.key} onClick={()=>set("role",r.key)}
                style={{ display:"flex", alignItems:"center", gap:10, border:`1.5px solid ${form.role===r.key?ri.color:"#e0e0e0"}`, borderRadius:9, padding:"8px 12px", background:form.role===r.key?ri.bg:"#fff", cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${form.role===r.key?ri.color:"#ccc"}`, background:form.role===r.key?ri.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {form.role===r.key && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:form.role===r.key?ri.color:"#1a1a1a" }}>{r.label}</div>
                  <div style={{ fontSize:10, color:"#888", marginTop:1 }}>{r.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      {form.name && form.email && (
        <div style={{ background:"#fff", borderRadius:9, border:"1px solid #eee", padding:"10px 12px", marginBottom:12 }}>
          <div style={{ fontSize:9, color:"#aaa", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:6 }}>Account preview</div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:ROLES[form.role]?.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:ROLES[form.role]?.color }}>
              {form.name[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>{form.name}</div>
              <div style={{ fontSize:11, color:"#888" }}>{form.email}</div>
              <span style={{ display:"inline-block", marginTop:3, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:6, background:ROLES[form.role]?.bg, color:ROLES[form.role]?.color }}>
                {ROLES[form.role]?.label}
              </span>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleCreate}
        style={{ width:"100%", background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 3px 12px rgba(26,107,60,0.25)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <i className="ti ti-user-plus" style={{ fontSize:16 }}/> Create user account
      </button>
    </div>
  );
}

// ── Main Settings Screen ───────────────────────────────────────
export default function SettingsScreen({ onSubScreen }) {
  const { data, appUsers, currentUser, can, logout, showToast } = useApp();
  const { org, books, collections, members, logs } = data;
  const roleInfo = ROLES[currentUser?.role] || ROLES.viewer;
  const totalC = collections.reduce((s,c) => s+(c.amount||0), 0);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div style={{ background:"#f5f7f5", padding:"10px 12px 28px" }}>

      {/* Profile banner */}
      <div style={{ background:`linear-gradient(135deg,${GREEN},#2e7d32)`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:50, height:50, borderRadius:14, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:24, fontWeight:700, flexShrink:0 }}>
            {currentUser?.name?.[0]?.toUpperCase()||"?"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{currentUser?.name}</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginTop:2 }}>{currentUser?.email}</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:9, padding:"5px 12px", color:"#fff", fontSize:11, fontWeight:700 }}>
            {roleInfo.label}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginTop:12 }}>
          {[
            { l:"Collected", v:fmt(totalC).replace("Rs.","₹") },
            { l:"Members",   v:members.length },
            { l:"Books",     v:`${books.length}/500` },
            { l:"Complete",  v:books.filter(b=>b.status==="complete").length },
          ].map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 6px", textAlign:"center" }}>
              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:8 }}>{s.l}</div>
              <div style={{ color:"#fff", fontSize:12, fontWeight:700, marginTop:1 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SUPER ADMIN: User management ── */}
      {can.manageUsers() && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:7, paddingLeft:2 }}>User management</div>

          {/* Existing users list */}
          <div style={{ background:"#fff", borderRadius:13, border:"1px solid #eee", overflow:"hidden", marginBottom:8 }}>
            {(appUsers||[]).map((user, idx) => {
              const r = ROLES[user.role]||ROLES.viewer;
              const isMe = user.id===currentUser?.id;
              return (
                <div key={user.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:idx<(appUsers||[]).length-1?"1px solid #f5f7f5":"none" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:r.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:r.color, flexShrink:0 }}>
                    {user.name?.[0]?.toUpperCase()||"?"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
                      {isMe && <span style={{ fontSize:9, background:"#e8f5ee", color:GREEN, fontWeight:700, padding:"1px 5px", borderRadius:5, flexShrink:0 }}>You</span>}
                    </div>
                    <div style={{ fontSize:10, color:"#aaa", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:8, background:r.bg, color:r.color, flexShrink:0 }}>{r.label}</span>
                  <button onClick={()=>onSubScreen("users")}
                    style={{ background:"#f5f5f5", border:"none", borderRadius:7, padding:"5px 8px", fontSize:10, color:"#888", cursor:"pointer", flexShrink:0 }}>
                    <i className="ti ti-edit" style={{ fontSize:12 }}/>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Inline create form or button */}
          {showCreateForm
            ? <CreateUserForm onDone={()=>setShowCreateForm(false)} onCancel={()=>setShowCreateForm(false)} existingUsers={appUsers||[]}/>
            : (
              <button onClick={()=>setShowCreateForm(true)}
                style={{ width:"100%", background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(26,107,60,0.25)" }}>
                <i className="ti ti-user-plus" style={{ fontSize:17 }}/> Create new user
              </button>
            )
          }
        </div>
      )}

      {/* ── Admin tools ── */}
      {can.viewLogs() && (
        <Section title="Admin tools">
          <Row icon="ti-activity" iconBg="#f3e5f5" iconColor="#6a1b9a" label="Activity log" sub="All actions by all users" badge={`${logs?.length||0}`} onClick={()=>onSubScreen("logs")}/>
        </Section>
      )}

      {/* ── Organisation ── */}
      <Section title="Organisation">
        <Row icon="ti-building-community" label={org.name.split("&")[0].trim()} sub={org.reg}/>
        <Row icon="ti-ticket" iconBg="#fff3e0" iconColor="#e65100" label="Ticket price" value="Rs.1,000 (fixed)"/>
        <Row icon="ti-calendar-event" iconBg="#e3f2fd" iconColor="#1565c0" label="Event" value={org.event}/>
      </Section>

      {/* ── Your access ── */}
      <Section title="Your access level">
        <div style={{ padding:"12px 14px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {[
              { label:"View app",       ok:true },
              { label:"Collect cash",   ok:can.collectCash() },
              { label:"Add members",    ok:can.addMember() },
              { label:"Delete members", ok:can.deleteMember() },
              { label:"Assign books",   ok:can.assignBook() },
              { label:"Reports",        ok:can.viewReports() },
              { label:"PDF export",     ok:can.downloadPDF() },
              { label:"Activity log",   ok:can.viewLogs() },
              { label:"Manage users",   ok:can.manageUsers() },
            ].map((p,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4, background:p.ok?"#e8f5ee":"#f5f5f5", borderRadius:7, padding:"4px 9px" }}>
                <i className={`ti ${p.ok?"ti-check":"ti-x"}`} style={{ fontSize:11, color:p.ok?GREEN:"#ccc" }}/>
                <span style={{ fontSize:10, color:p.ok?GREEN:"#bbb", fontWeight:p.ok?600:400 }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── App ── */}
      <Section title="App">
        <Row icon="ti-code" iconBg="#f5f5f5" iconColor="#555" label="Version" value="v6.0"/>
        <Row icon="ti-download" iconBg="#e3f2fd" iconColor="#1565c0" label="Export all data" onClick={()=>showToast("Data exported")}/>
      </Section>

      {/* ── Account ── */}
      <Section title="Account">
        <Row icon="ti-logout" label="Sign out" onClick={logout} danger/>
      </Section>

      <div style={{ textAlign:"center", fontSize:10, color:"#ccc", marginTop:10, lineHeight:1.8 }}>
        NBC Coupon Sale App · Mega Lucky Draw 2026<br/>
        Niranam Chudan Vallasamithi & NBC
      </div>
    </div>
  );
}
