import { useState } from "react";
import { useApp } from "../data/AppContext";

const GREEN = "#1a6b3c";

export default function LoginScreen() {
  const { login } = useApp();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError("Please enter email and password"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 700));
    const result = login(email.trim(), password);
    if (!result.success) {
      setError(result.error || "Invalid email or password");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#e8f5ee 0%,#f0f9f4 40%,#ffffff 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>

      {/* Logo mark */}
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ width:70, height:70, borderRadius:20, background:`linear-gradient(135deg,${GREEN},#2e7d32)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 10px 32px rgba(26,107,60,0.28)" }}>
          <i className="ti ti-ticket" style={{ color:"#fff", fontSize:32 }} />
        </div>
        <div style={{ fontSize:22, fontWeight:700, color:"#1a1a1a", letterSpacing:"-0.3px" }}>NBC Coupon Sale</div>
        <div style={{ fontSize:12, color:"#777", marginTop:5, lineHeight:1.6 }}>
          Niranam Chudan Vallasamithi & NBC<br/>
          <span style={{ fontSize:11, color:"#aaa" }}>Mega Lucky Draw 2026</span>
        </div>
      </div>

      {/* Login card */}
      <div style={{ width:"100%", maxWidth:360, background:"#fff", borderRadius:18, boxShadow:"0 8px 40px rgba(0,0,0,0.08)", padding:"28px 24px" }}>
        <div style={{ fontSize:17, fontWeight:700, color:"#1a1a1a", marginBottom:4 }}>Welcome back</div>
        <div style={{ fontSize:12, color:"#aaa", marginBottom:22 }}>Sign in to your account to continue</div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:"#555", fontWeight:600, display:"block", marginBottom:5 }}>Email address</label>
            <div style={{ position:"relative" }}>
              <i className="ti ti-mail" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#bbb", fontSize:16, pointerEvents:"none" }}/>
              <input
                type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}}
                placeholder="Enter your email"
                style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${email?"#1a6b3c":"#e8e8e8"}`, borderRadius:10, padding:"11px 12px 11px 38px", fontSize:13, color:"#1a1a1a", outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, color:"#555", fontWeight:600, display:"block", marginBottom:5 }}>Password</label>
            <div style={{ position:"relative" }}>
              <i className="ti ti-lock" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#bbb", fontSize:16, pointerEvents:"none" }}/>
              <input
                type={showPass?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
                placeholder="Enter your password"
                style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${password?"#1a6b3c":"#e8e8e8"}`, borderRadius:10, padding:"11px 38px 11px 38px", fontSize:13, color:"#1a1a1a", outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
              />
              <button type="button" onClick={()=>setShowPass(s=>!s)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#bbb", padding:0, display:"flex", alignItems:"center" }}>
                <i className={`ti ${showPass?"ti-eye-off":"ti-eye"}`} style={{ fontSize:16 }}/>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:7, background:"#fff5f5", border:"1.5px solid #fecaca", borderRadius:9, padding:"9px 12px", marginBottom:16 }}>
              <i className="ti ti-alert-circle" style={{ color:"#dc2626", fontSize:15, flexShrink:0 }}/>
              <span style={{ fontSize:12, color:"#dc2626" }}>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{ width:"100%", background:loading?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:11, padding:"13px", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:loading?"none":"0 4px 16px rgba(26,107,60,0.3)", transition:"opacity 0.2s" }}>
            {loading
              ? <><i className="ti ti-loader-2" style={{ fontSize:17, animation:"spin 1s linear infinite" }}/> Signing in...</>
              : <><i className="ti ti-login" style={{ fontSize:17 }}/> Sign in</>
            }
          </button>
        </form>

        {/* Contact hint — no credentials shown */}
        <div style={{ marginTop:20, padding:"12px 14px", background:"#f8faf8", borderRadius:10, border:"1px solid #eee" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <i className="ti ti-info-circle" style={{ color:"#1a6b3c", fontSize:15, flexShrink:0 }}/>
            <div style={{ fontSize:11, color:"#666", lineHeight:1.5 }}>
              Contact your <strong style={{ color:"#1a1a1a" }}>coordinator</strong> if you don't have login credentials. Only the coordinator can create accounts for other users.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop:24, fontSize:10, color:"#ccc", textAlign:"center", lineHeight:1.8 }}>
        NBC Coupon Sale App · Reg. PTM/TC/105/2022<br/>
        Niranam Chudan Vallasamithi & NBC
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        input::placeholder { color:#bbb; }
      `}</style>
    </div>
  );
}
