import { useApp } from "../data/AppContext";

const GREEN = "#1a6b3c", WHITE = "#fff";

const ACTION_META = {
  ADD_MEMBER:    { icon:"ti-user-plus",    color:"#1565c0", bg:"#e3f2fd",  label:"Member added" },
  EDIT_MEMBER:   { icon:"ti-user-edit",    color:"#7b4400", bg:"#fff3e0",  label:"Member edited" },
  DELETE_MEMBER: { icon:"ti-user-minus",   color:"#c62828", bg:"#ffebee",  label:"Member deleted" },
  ASSIGN_BOOK:   { icon:"ti-ticket",       color:"#1a6b3c", bg:"#e8f5ee",  label:"Book assigned" },
  EDIT_BOOK:     { icon:"ti-edit",         color:"#7b4400", bg:"#fff3e0",  label:"Book edited" },
  COLLECT_CASH:  { icon:"ti-cash",         color:"#2e7d32", bg:"#e8f5ee",  label:"Cash collected" },
  DEFAULT:       { icon:"ti-activity",     color:"#555",    bg:"#f5f5f5",  label:"Activity" },
};

function timeAgo(ts) {
  if (!ts) return "—";
  const d = new Date(ts), now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"});
}

export default function ActivityLogScreen({ onBack }) {
  const { data } = useApp();
  const logs = data.logs || [];

  // Group by date
  const grouped = {};
  logs.forEach(log => {
    const d = log.timestamp ? new Date(log.timestamp).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "Unknown";
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(log);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <div style={{ background:GREEN, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", padding:0 }}><i className="ti ti-arrow-left"/></button>
        <div>
          <div style={{ color:"#fff", fontSize:15, fontWeight:600 }}>Activity log</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:10, marginTop:1 }}>{logs.length} total entries · Super admin view</div>
        </div>
        <div style={{ marginLeft:"auto", background:"rgba(255,255,255,0.15)", color:"#fff", fontSize:10, padding:"3px 10px", borderRadius:10 }}>{logs.length} logs</div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px 10px 14px", background:"#f5f7f5" }}>
        {logs.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <i className="ti ti-activity" style={{ fontSize:40, color:"#ccc" }} />
            <div style={{ fontSize:13, color:"#999", marginTop:10 }}>No activity logged yet</div>
          </div>
        )}

        {Object.entries(grouped).map(([date, entries]) => (
          <div key={date}>
            <div style={{ fontSize:10, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8, marginTop:12, paddingLeft:4 }}>{date}</div>
            {entries.map((log, i) => {
              const meta = ACTION_META[log.action] || ACTION_META.DEFAULT;
              return (
                <div key={log.id||i} style={{ background:"#fff", borderRadius:10, border:"1px solid #eeeeee", padding:"10px 12px", marginBottom:7, display:"flex", alignItems:"flex-start", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <i className={`ti ${meta.icon}`} style={{ color:meta.color, fontSize:16 }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"#1a1a1a" }}>{meta.label}</div>
                      <div style={{ fontSize:10, color:"#aaa", flexShrink:0 }}>{timeAgo(log.timestamp)}</div>
                    </div>
                    <div style={{ fontSize:11, color:"#555", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{log.details}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#f5f5f5", borderRadius:6, padding:"2px 7px", fontSize:10, color:"#666" }}>
                        <i className="ti ti-user" style={{ fontSize:11 }} />{log.userName||"—"}
                      </div>
                      <div style={{ background:log.userRole==="super_admin"?"#ffebee":log.userRole==="admin"?"#e3f2fd":"#e8f5ee", color:log.userRole==="super_admin"?"#c62828":log.userRole==="admin"?"#1565c0":"#1a6b3c", fontSize:9, fontWeight:600, padding:"2px 7px", borderRadius:6 }}>
                        {log.userRole?.replace("_"," ").toUpperCase()||"—"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
