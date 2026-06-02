import { useState, useEffect } from "react";
import { useApp } from "../data/AppContext";
import { listenBackups, createBackup, deleteBackup, downloadBackupJSON } from "../firestoreService";

const GREEN = "#1a6b3c";

function timeAgo(ts) {
  if (!ts) return "—";
  const d    = new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

export default function BackupScreen({ onBack }) {
  const { currentUser, showToast } = useApp();
  const [backups, setBackups]       = useState([]);
  const [creating, setCreating]     = useState(false);
  const [label, setLabel]           = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState(null);

  useEffect(() => {
    const unsub = listenBackups(data => { setBackups(data); setLoading(false); });
    return () => unsub();
  }, []);

  async function handleCreate() {
    if (!label.trim()) { showToast("Enter a backup name", "error"); return; }
    setCreating(true);
    try {
      await createBackup(label.trim(), currentUser?.name || "Coordinator");
      showToast("Backup created successfully");
      setLabel(""); setShowForm(false);
    } catch (e) {
      showToast("Backup failed", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await deleteBackup(id);
      showToast("Backup deleted");
    } catch (e) {
      showToast("Delete failed", "error");
    } finally {
      setDeleting(null);
    }
  }

  function handleDownload(backup) {
    try {
      downloadBackupJSON(backup);
      showToast("Backup downloaded as JSON");
    } catch (e) {
      showToast("Download failed", "error");
    }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ background:GREEN, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", padding:0 }}>
          <i className="ti ti-arrow-left"/>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>Backup & export</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>{backups.length} backup{backups.length!==1?"s":""} saved</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 20px", background:"#f5f7f5" }}>

        {/* Info */}
        <div style={{ background:"#e8f5ee", border:"1px solid #a5d6a7", borderRadius:11, padding:"11px 13px", marginBottom:14, display:"flex", gap:8 }}>
          <i className="ti ti-shield-check" style={{ color:GREEN, fontSize:18, flexShrink:0, marginTop:1 }}/>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:GREEN, marginBottom:3 }}>Your data is safe</div>
            <div style={{ fontSize:11, color:"#2e7d32", lineHeight:1.6 }}>
              Backups are saved to Firebase. You can also download them as a JSON file to your device for extra safety. Create a backup before any major changes.
            </div>
          </div>
        </div>

        {/* Create backup */}
        {!showForm ? (
          <button onClick={()=>setShowForm(true)}
            style={{ width:"100%", background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(26,107,60,0.25)", marginBottom:14 }}>
            <i className="ti ti-database-export" style={{ fontSize:18 }}/> Create new backup
          </button>
        ) : (
          <div style={{ background:"#fff", borderRadius:13, border:`2px solid ${GREEN}`, padding:"14px", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:GREEN, marginBottom:12 }}>
              <i className="ti ti-database-export" style={{ marginRight:6 }}/>New backup
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:5 }}>Backup name *</div>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder={`e.g. Before May collection, Week 3 backup...`}
                autoFocus
                style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${label?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"10px 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}
              />
              <div style={{ fontSize:10, color:"#aaa", marginTop:4 }}>Give a meaningful name so you can identify it later.</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleCreate} disabled={creating}
                style={{ flex:2, background:creating?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:9, padding:"11px", fontSize:13, fontWeight:700, cursor:creating?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {creating
                  ? <><i className="ti ti-loader-2" style={{ animation:"spin 1s linear infinite" }}/> Saving...</>
                  : <><i className="ti ti-check"/> Save backup</>
                }
              </button>
              <button onClick={()=>{ setShowForm(false); setLabel(""); }}
                style={{ flex:1, background:"#f5f5f5", color:"#777", border:"1px solid #e0e0e0", borderRadius:9, padding:"11px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Backup list */}
        <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>
          Saved backups
        </div>

        {loading && (
          <div style={{ textAlign:"center", padding:"30px 0" }}>
            <i className="ti ti-loader-2" style={{ fontSize:28, color:"#ccc", animation:"spin 1s linear infinite" }}/>
            <div style={{ fontSize:12, color:"#aaa", marginTop:8 }}>Loading backups...</div>
          </div>
        )}

        {!loading && backups.length === 0 && (
          <div style={{ textAlign:"center", padding:"30px 0" }}>
            <i className="ti ti-database-off" style={{ fontSize:40, color:"#e0e0e0" }}/>
            <div style={{ fontSize:13, color:"#aaa", marginTop:10 }}>No backups yet</div>
            <div style={{ fontSize:11, color:"#ccc", marginTop:4 }}>Create your first backup above</div>
          </div>
        )}

        {backups.map((backup, i) => (
          <div key={backup.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"12px 14px", marginBottom:9 }}>

            {/* Backup header */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:i===0?"#e8f5ee":"#f5f5f5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <i className="ti ti-database" style={{ fontSize:20, color:i===0?GREEN:"#aaa" }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{backup.label || "Unnamed backup"}</div>
                  {i===0 && <span style={{ fontSize:9, fontWeight:700, background:"#e8f5ee", color:GREEN, padding:"2px 7px", borderRadius:6 }}>Latest</span>}
                </div>
                <div style={{ fontSize:10, color:"#aaa", marginTop:2 }}>
                  {timeAgo(backup.timestamp)} · By {backup.createdBy || "—"}
                </div>
              </div>
            </div>

            {/* Data counts */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5, marginBottom:10 }}>
              {[
                { icon:"ti-users",   label:"Members",     value:backup.counts?.members     || 0 },
                { icon:"ti-ticket",  label:"Books",       value:backup.counts?.books       || 0 },
                { icon:"ti-cash",    label:"Collections", value:backup.counts?.collections || 0 },
              ].map((s,j)=>(
                <div key={j} style={{ background:"#f8faf8", borderRadius:8, padding:"7px 8px", textAlign:"center" }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize:14, color:GREEN }}/>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a", marginTop:2 }}>{s.value}</div>
                  <div style={{ fontSize:9, color:"#aaa" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Date */}
            <div style={{ fontSize:10, color:"#bbb", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
              <i className="ti ti-clock" style={{ fontSize:12 }}/>
              {backup.timestamp ? new Date(backup.timestamp).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:7 }}>
              <button onClick={()=>handleDownload(backup)}
                style={{ flex:1, background:"#e8f5ee", color:GREEN, border:`1px solid ${GREEN}30`, borderRadius:8, padding:"8px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <i className="ti ti-download" style={{ fontSize:14 }}/> Download JSON
              </button>
              <button
                onClick={()=>handleDelete(backup.id)}
                disabled={deleting===backup.id}
                style={{ background:deleting===backup.id?"#f5f5f5":"#fff5f5", color:deleting===backup.id?"#aaa":"#dc2626", border:`1px solid ${deleting===backup.id?"#e0e0e0":"#fca5a5"}`, borderRadius:8, padding:"8px 12px", fontSize:11, fontWeight:700, cursor:deleting===backup.id?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:5 }}>
                {deleting===backup.id
                  ? <i className="ti ti-loader-2" style={{ fontSize:14, animation:"spin 1s linear infinite" }}/>
                  : <i className="ti ti-trash" style={{ fontSize:14 }}/>
                }
              </button>
            </div>
          </div>
        ))}

        {/* Important note */}
        <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:11, padding:"11px 13px", marginTop:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#e65100", marginBottom:4 }}>
            <i className="ti ti-alert-triangle" style={{ marginRight:5 }}/>Important note
          </div>
          <div style={{ fontSize:11, color:"#bf360c", lineHeight:1.7 }}>
            • Backups are <strong>read-only snapshots</strong> — they do not affect live data<br/>
            • Download JSON files to your phone/computer for offline copies<br/>
            • Create a backup <strong>before making any bulk changes</strong><br/>
            • Only super admin can create or delete backups
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
