import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const RED = "#8B0000", GOLD = "#FFD700";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/invalid-email": "Invalid email address",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/invalid-credential": "Incorrect email or password",
      };
      setError(msgs[err.code] || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>

      {/* Logo / Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <i className="ti ti-ticket" style={{ color: GOLD, fontSize: 30 }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, color: "#2C2C2A" }}>Coupon Sale App</div>
        <div style={{ fontSize: 11, color: "#888780", marginTop: 4 }}>Niranam Chudan Vallasamithi & NBC</div>
        <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>Mega Lucky Draw 2026</div>
      </div>

      {/* Login Card */}
      <div style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 14, border: "0.5px solid rgba(0,0,0,0.08)", padding: "24px 20px", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: "#2C2C2A", marginBottom: 4 }}>Coordinator login</div>
        <div style={{ fontSize: 12, color: "#888780", marginBottom: 20 }}>Sign in to manage coupon books & reports</div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 5 }}>Email address</div>
            <div style={{ position: "relative" }}>
              <i className="ti ti-mail" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#888780", fontSize: 16 }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="coordinator@niranam.com"
                style={{ width: "100%", background: "#f7f4f0", border: `0.5px solid ${email ? RED : "rgba(0,0,0,0.12)"}`, borderRadius: 8, padding: "10px 12px 10px 34px", fontSize: 13, color: "#2C2C2A", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 5 }}>Password</div>
            <div style={{ position: "relative" }}>
              <i className="ti ti-lock" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#888780", fontSize: 16 }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ width: "100%", background: "#f7f4f0", border: `0.5px solid ${password ? RED : "rgba(0,0,0,0.12)"}`, borderRadius: 8, padding: "10px 36px 10px 34px", fontSize: 13, color: "#2C2C2A", outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888780", padding: 0 }}>
                <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FCEBEB", borderRadius: 7, padding: "8px 10px", marginBottom: 14 }}>
              <i className="ti ti-circle-x" style={{ color: "#A32D2D", fontSize: 14, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#791F1F" }}>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", background: loading ? "#ccc" : RED, color: loading ? "#fff" : GOLD, border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2" style={{ fontSize: 16, animation: "spin 1s linear infinite" }} />
                Signing in...
              </>
            ) : (
              <>
                <i className="ti ti-login" style={{ fontSize: 16 }} />
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Coordinator badge */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
          <div style={{ background: RED, color: GOLD, fontSize: 9, fontWeight: 500, padding: "2px 8px", borderRadius: 10 }}>Super Admin</div>
          <span style={{ fontSize: 10, color: "#888780" }}>Coordinator access only</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, textAlign: "center", fontSize: 10, color: "#aaa", lineHeight: 1.6 }}>
        Niranam Chudan Vallasamithi & NBC<br />
        Reg. PTM/TC/105/2022
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
