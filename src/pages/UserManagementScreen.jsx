import { useState } from "react";
import { useApp } from "../data/AppContext";
import { ROLES } from "../data/store";

const GREEN = "#1a6b3c";

function RoleChip({ role }) {
  const r = ROLES[role] || ROLES.viewer;
  return (
    <span style={{ display:"inline-block", fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:8, background:r.bg, color:r.color }}>{r.label}</span>
  );
}

function RoleCard({ roleKey, selected, onClick }) {
  const r = ROLES[roleKey];
  const perms = {
    super_admin: ["View app","Add/edit members","Delete members","Assign books","Collect cash","View reports","Download PDF","View activity logs","Create users"],
    admin:       ["View app","Add/edit members","Assign books","Collect cash","View reports","Download PDF"],
    member:      ["View app","Add/edit members","Collect cash"],
    viewer:      ["View app only — no edits or actions"],
  };
  return (
    <div onClick={onClick} style={{ border:`${selected?"2px":"1px"} solid ${selected?r.color:"#e0e0e0"}`, borderRadius:11, padding:"10px 12px", marginBottom:8, cursor:"pointer", background:selected?r.bg:"#fff", transition:"all 0.15s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${selected?r.color:"#ccc"}`, background:selected?r.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {selected && <div style={{ width:7, height:7, borderRadius:"50%", background:"#fff" }}/>}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.label}</div>
      </div>
      <div style={{ paddingLeft:26 }}>
        {perms[roleKey].map((p,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#555", marginBottom:2 }}>
            <i className="ti ti-check" style={{ color:GREEN, fontSize:11, flexShrink:0 }}/>{p}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserManagementScreen({ onBack }) {
  const { appUsers, addUser, updateUser, deleteUser, currentUser, showToast } = useApp();
  const [view, setView]       = useState("list"); // list | create | edit
  const [editTarget, setEdit] = useState(null);
  const [form, setForm]       = useState({ name:"", email:"", password:"", role:"member" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.email.trim())    e.email    = "Email is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (view === "create" && !form.password.trim()) e.password = "Password is required";
    if (form.password && form.password.length < 6)  e.password = "Min 6 characters";
    // Check duplicate email (skip current user when editing)
    const dup = appUsers.find(u => u.email === form.email.trim() && u.id !== editTarget?.id);
    if (dup) e.email = "This email is already used";
    return e;
  }

  function handleCreate() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addUser({ name:form.name.trim(), email:form.email.trim(), password:form.password, role:form.role });
    showToast(`${form.name} added as ${ROLES[form.role].label}`);
    setView("list"); setForm({ name:"", email:"", password:"", role:"member" }); setErrors({});
  }

  function handleEdit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateUser(editTarget.id, { name:form.name.trim(), email:form.email.trim(), role:form.role, ...(form.password ? { password:form.password } : {}) });
    showToast("User updated");
    setView("list"); setEdit(null); setErrors({});
  }

  function handleDelete(user) {
    if (user.id === currentUser.id) { showToast("Cannot delete yourself","error"); return; }
    if (user.role === "super_admin") { showToast("Cannot delete the super admin","error"); return; }
    deleteUser(user.id);
    showToast(`${user.name} removed`);
  }

  function openEdit(user) {
    setEdit(user);
    setForm({ name:user.name, email:user.email, password:"", role:user.role });
    setErrors({});
    setView("edit");
  }

  function openCreate() {
    setForm({ name:"", email:"", password:"", role:"member" });
    setErrors({});
    setView("create");
  }

  const Header = ({ title, sub }) => (
    <div style={{ background:GREEN, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10 }}>
      <button onClick={view==="list" ? onBack : ()=>setView("list")} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", padding:0 }}>
        <i className="ti ti-arrow-left"/>
      </button>
      <div>
        <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{title}</div>
        {sub && <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );

  // ── Form (create or edit) ─────────────────────────────────
  if (view === "create" || view === "edit") {
    return (
      <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
        <Header title={view==="create"?"Create new user":"Edit user"} sub="Super admin · User management"/>
        <div style={{ flex:1, overflowY:"auto", padding:"14px 12px", background:"#f5f7f5" }}>

          <div style={{ fontSize:10, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>User details</div>

          {/* Name */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:"#555", fontWeight:600, display:"block", marginBottom:5 }}>Full name *</label>
            <input value={form.name} onChange={e=>{set("name",e.target.value);setErrors(ev=>({...ev,name:""}));}} placeholder="e.g. Rajan Kumar"
              style={{ width:"100%", background:"#fff", border:`1.5px solid ${errors.name?"#dc2626":form.name?GREEN:"#e0e0e0"}`, borderRadius:10, padding:"10px 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            {errors.name && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>{errors.name}</div>}
          </div>

          {/* Email */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:"#555", fontWeight:600, display:"block", marginBottom:5 }}>Email address *</label>
            <input type="email" value={form.email} onChange={e=>{set("email",e.target.value);setErrors(ev=>({...ev,email:""}));}} placeholder="user@example.com"
              style={{ width:"100%", background:"#fff", border:`1.5px solid ${errors.email?"#dc2626":form.email?GREEN:"#e0e0e0"}`, borderRadius:10, padding:"10px 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            {errors.email && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>{errors.email}</div>}
          </div>

          {/* Password */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:"#555", fontWeight:600, display:"block", marginBottom:5 }}>
              {view==="edit" ? "New password (leave blank to keep current)" : "Password *"}
            </label>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} value={form.password} onChange={e=>{set("password",e.target.value);setErrors(ev=>({...ev,password:""}));}} placeholder={view==="edit"?"Leave blank to keep unchanged":"Min 6 characters"}
                style={{ width:"100%", background:"#fff", border:`1.5px solid ${errors.password?"#dc2626":form.password?GREEN:"#e0e0e0"}`, borderRadius:10, padding:"10px 38px 10px 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
              <button type="button" onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#bbb" }}>
                <i className={`ti ${showPass?"ti-eye-off":"ti-eye"}`} style={{ fontSize:16 }}/>
              </button>
            </div>
            {errors.password && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>{errors.password}</div>}
          </div>

          {/* Role */}
          <div style={{ fontSize:10, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Select role</div>

          {/* Can't change super_admin's role or create another super_admin */}
          {["admin","member","viewer"].map(key => (
            <RoleCard key={key} roleKey={key} selected={form.role===key} onClick={()=>{
              if (editTarget?.role==="super_admin") return; // can't change super admin role
              set("role",key);
            }}/>
          ))}

          {editTarget?.role==="super_admin" && (
            <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:9, padding:"9px 12px", marginBottom:10, display:"flex", gap:7 }}>
              <i className="ti ti-shield-lock" style={{ color:"#e65100", fontSize:15, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:"#e65100" }}>Super admin role cannot be changed.</span>
            </div>
          )}

          {/* Preview */}
          <div style={{ background:"#fff", borderRadius:11, border:"1px solid #eee", padding:"12px 14px", marginBottom:14, marginTop:4 }}>
            <div style={{ fontSize:10, color:"#aaa", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.3px" }}>Account preview</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:ROLES[form.role]?.bg||"#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:ROLES[form.role]?.color||"#aaa" }}>
                {form.name?form.name[0].toUpperCase():"?"}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a1a" }}>{form.name||"Name"}</div>
                <div style={{ fontSize:11, color:"#aaa", marginTop:1 }}>{form.email||"email@example.com"}</div>
                <div style={{ marginTop:3 }}><RoleChip role={form.role}/></div>
              </div>
            </div>
          </div>

          <button onClick={view==="create"?handleCreate:handleEdit}
            style={{ width:"100%", background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:11, padding:13, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(26,107,60,0.25)", marginBottom:8 }}>
            <i className={`ti ${view==="create"?"ti-user-plus":"ti-device-floppy"}`}/> {view==="create"?"Create user":"Save changes"}
          </button>
          <button onClick={()=>setView("list")}
            style={{ width:"100%", background:"#fff", color:"#555", border:"1.5px solid #e0e0e0", borderRadius:11, padding:12, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── User list ─────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <Header title="User management" sub={`${appUsers.length} users · Super admin only`}/>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 14px", background:"#f5f7f5" }}>

        <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:10, padding:"10px 12px", marginBottom:12, display:"flex", gap:8 }}>
          <i className="ti ti-info-circle" style={{ color:"#e65100", fontSize:16, flexShrink:0 }}/>
          <div style={{ fontSize:11, color:"#e65100", lineHeight:1.5 }}>
            Only you (Super admin) can create and manage user accounts. Share credentials securely with each person.
          </div>
        </div>

        {/* User list */}
        {appUsers.map(user => {
          const r = ROLES[user.role]||ROLES.viewer;
          const isMe = user.id === currentUser?.id;
          const isSuper = user.role === "super_admin";
          return (
            <div key={user.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"12px 14px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:r.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:700, color:r.color, flexShrink:0 }}>
                  {user.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{user.name}</div>
                    {isMe && <span style={{ fontSize:9, background:"#e8f5ee", color:GREEN, fontWeight:700, padding:"1px 6px", borderRadius:6 }}>You</span>}
                  </div>
                  <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{user.email}</div>
                </div>
                <RoleChip role={user.role}/>
              </div>

              {/* Permissions summary */}
              <div style={{ background:"#f8faf8", borderRadius:8, padding:"8px 10px", marginBottom:8 }}>
                <div style={{ fontSize:9, color:"#aaa", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.3px", marginBottom:5 }}>Can access</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {[
                    { label:"View app",     roles:["super_admin","admin","member","viewer"] },
                    { label:"Collect cash", roles:["super_admin","admin","member"] },
                    { label:"Reports",      roles:["super_admin","admin"] },
                    { label:"PDF export",   roles:["super_admin","admin"] },
                    { label:"Delete",       roles:["super_admin"] },
                    { label:"Manage users", roles:["super_admin"] },
                    { label:"Activity log", roles:["super_admin"] },
                  ].filter(p => p.roles.includes(user.role)).map((p,i) => (
                    <span key={i} style={{ fontSize:9, background:"#e8f5ee", color:GREEN, padding:"2px 7px", borderRadius:6, fontWeight:500 }}>{p.label}</span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>openEdit(user)}
                  style={{ flex:1, background:"#fff", color:GREEN, border:`1.5px solid ${GREEN}`, borderRadius:8, padding:"7px", fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                  <i className="ti ti-edit" style={{ fontSize:13 }}/> Edit
                </button>
                {!isMe && !isSuper && (
                  <button onClick={()=>handleDelete(user)}
                    style={{ flex:1, background:"#fff5f5", color:"#dc2626", border:"1.5px solid #fca5a5", borderRadius:8, padding:"7px", fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    <i className="ti ti-trash" style={{ fontSize:13 }}/> Remove
                  </button>
                )}
                {(isMe || isSuper) && (
                  <div style={{ flex:1, background:"#f5f5f5", borderRadius:8, padding:"7px", fontSize:10, color:"#aaa", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    <i className="ti ti-shield" style={{ fontSize:12 }}/>{isMe?"(you)":"(protected)"}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add user button */}
        <button onClick={openCreate}
          style={{ width:"100%", background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(26,107,60,0.25)", marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <i className="ti ti-user-plus" style={{ fontSize:17 }}/> Create new user
        </button>
      </div>
    </div>
  );
}
