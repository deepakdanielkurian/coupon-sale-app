import { useState } from "react";
import { useApp } from "../data/AppContext";
import { DEMO_USERS } from "../data/AppContext";
import { ROLES } from "../data/store";

export default function LoginScreen() {
  const { login } = useApp();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 600));
    const result = login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#e8f5ee 0%,#f0f4ff 50%,#fff3e0 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>

      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ width:64, height:64, borderRadius:16, background:"linear-gradient(135deg,#1a6b3c,#2e7d32)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:"0 8px 24px rgba(26,107,60,0.25)" }}>
          <i className="ti ti-ticket" style={{ color:"#fff", fontSize:30 }} />
        </div>
        <div style={{ fontSize:20, fontWeight:600, color:"#1a1a1a" }}>NBC Coupon Sale</div>
        <div style={{ fontSize:12, color:"#666", marginTop:4 }}>Niranam Chudan Vallasamithi</div>
        <div style={{ fontSize:11, color:"#999", marginTop:2 }}>Mega Lucky Draw 2026</div>
      </div>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:360, background:"#fff", borderRadius:16, boxShadow:"0 4px 32px rgba(0,0,0,0.08)", padding:24 }}>
        <div style={{ fontSize:16, fontWeight:600, color:"#1a1a1a", marginBottom:4 }}>Sign in</div>
        <div style={{ fontSize:12, color:"#888", marginBottom:20 }}>Access your dashboard</div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#555", marginBottom:5, fontWeight:500 }}>Email</div>
            <div style={{ position:"relative" }}>
              <i className="ti ti-mail" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#aaa", fontSize:16 }} />
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
                style={{ width:"100%", background:"#f8f9fa", border:`1.5px solid ${email?"#1a6b3c":"#e0e0e0"}`, borderRadius:9, padding:"10px 12px 10px 34px", fontSize:13, outline:"none", boxSizing:"border-box", transition:"border 0.2s" }} />
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#555", marginBottom:5, fontWeight:500 }}>Password</div>
            <div style={{ position:"relative" }}>
              <i className="ti ti-lock" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#aaa", fontSize:16 }} />
              <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password"
                style={{ width:"100%", background:"#f8f9fa", border:`1.5px solid ${password?"#1a6b3c":"#e0e0e0"}`, borderRadius:9, padding:"10px 36px 10px 34px", fontSize:13, outline:"none", boxSizing:"border-box", transition:"border 0.2s" }} />
              <button type="button" onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa", padding:0 }}>
                <i className={`ti ${showPass?"ti-eye-off":"ti-eye"}`} style={{ fontSize:16 }} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"#fff5f5", border:"1px solid #fecaca", borderRadius:8, padding:"8px 10px", marginBottom:14 }}>
              <i className="ti ti-circle-x" style={{ color:"#dc2626", fontSize:14 }} />
              <span style={{ fontSize:11, color:"#dc2626" }}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width:"100%", background:loading?"#ccc":"linear-gradient(135deg,#1a6b3c,#2e7d32)", color:"#fff", border:"none", borderRadius:10, padding:12, fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:loading?"none":"0 4px 12px rgba(26,107,60,0.3)" }}>
            {loading ? <><i className="ti ti-loader-2" style={{ fontSize:16, animation:"spin 1s linear infinite" }} />Signing in...</> : <><i className="ti ti-login" style={{ fontSize:16 }} />Sign in</>}
          </button>
        </form>

        {/* Role hint */}
        <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #f0f0f0" }}>
          <div style={{ fontSize:10, color:"#aaa", marginBottom:8, textAlign:"center" }}>Test accounts</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
            {DEMO_USERS.map(u => {
              const r = ROLES[u.role];
              return (
                <div key={u.id} onClick={()=>{ setEmail(u.email); setPassword(u.password); }} style={{ background:r.bg, borderRadius:7, padding:"6px 8px", cursor:"pointer", border:`1px solid ${r.color}20` }}>
                  <div style={{ fontSize:10, fontWeight:600, color:r.color }}>{r.label}</div>
                  <div style={{ fontSize:9, color:"#666", marginTop:1 }}>{u.email}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop:20, fontSize:10, color:"#aaa", textAlign:"center" }}>
        NBC Coupon Sale App · Niranam Chudan Vallasamithi<br/>Reg. PTM/TC/105/2022
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
