import { useApp } from "../data/AppContext";
import { getBookStats, fmt, ROLES } from "../data/store";
import { BOOK_SERIES, TOTAL_TICKETS, getSeriesFromBook } from "../data/bookConfig";

const GREEN = "#1a6b3c", LIGHT_GREEN = "#e8f5ee";

// ── Donut chart ───────────────────────────────────────────────
function DonutChart({ sold, total, size=80, stroke=12 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(sold / total, 1) : 0;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ display:"block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8ece8" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={GREEN} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 0.8s ease"}}/>
      <text x={size/2} y={size/2 - 3} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1a1a1a">{Math.round(pct*100)}%</text>
      <text x={size/2} y={size/2 + 10} textAnchor="middle" fontSize={8} fill="#888">sold</text>
    </svg>
  );
}

// ── Horizontal stacked bar ────────────────────────────────────
function StackedBar({ segments, height=10 }) {
  const total = segments.reduce((s,x)=>s+x.value,0);
  if (total===0) return <div style={{height,background:"#eee",borderRadius:5}}/>;
  return (
    <div style={{display:"flex",height,borderRadius:5,overflow:"hidden",gap:1}}>
      {segments.map((seg,i)=>{
        const w = (seg.value/total)*100;
        if (w<0.5) return null;
        return <div key={i} style={{width:`${w}%`,background:seg.color,transition:"width 0.5s"}} title={`${seg.label}: ${fmt(seg.value)}`}/>;
      })}
    </div>
  );
}

// ── Sparkline chart ───────────────────────────────────────────
function Sparkline({ data, color=GREEN, width=200, height=40 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d=>d.value), 1);
  const min = Math.min(...data.map(d=>d.value), 0);
  const range = max - min || 1;
  const pts = data.map((d,i) => {
    const x = (i/(data.length-1)) * width;
    const y = height - ((d.value - min)/range)*(height-8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const areaBottom = data.map((d,i)=>`${(i/(data.length-1))*width},${height}`).reverse().join(" ");
  return (
    <svg width={width} height={height} style={{overflow:"visible"}}>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={color} fillOpacity="0.12"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d,i)=>{
        const x=(i/(data.length-1))*width, y=height-((d.value-min)/range)*(height-8)-4;
        return <circle key={i} cx={x} cy={y} r={i===data.length-1?3:1.5} fill={color}/>;
      })}
    </svg>
  );
}

export default function HomeScreen({ onNavigate }) {
  const { data, loading, currentUser } = useApp();
  const { books, collections, members, org } = data;

  // ── Correct totals ────────────────────────────────────────
  const totalCollected  = collections.reduce((s,c)=>s+(c.amount||0),0);
  const totalValue      = TOTAL_TICKETS * 1000;
  const soldTickets     = collections.reduce((s,c)=>s+(c.ticketsSold||0),0);
  const completeBooks   = books.filter(b=>b.status==="complete").length;
  const pendingBalance  = totalValue - totalCollected;

  // ── Weekly data for sparkline (last 8 weeks) ──────────────
  const weeklyData = (() => {
    const wks = {};
    collections.forEach(c => {
      const d = new Date(c.date);
      const yr = d.getFullYear();
      const wn = Math.ceil(((d - new Date(yr,0,1))/86400000 + 1)/7);
      const key = `${yr}-W${wn}`;
      wks[key] = (wks[key]||0)+(c.amount||0);
    });
    const entries = Object.entries(wks).sort(([a],[b])=>a.localeCompare(b)).slice(-8);
    return entries.map(([k,v])=>({ label:k.split("-")[1], value:v }));
  })();

  // ── Monthly data ──────────────────────────────────────────
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyData = (() => {
    const ms = {};
    collections.forEach(c => {
      const d = new Date(c.date); const k = MON[d.getMonth()];
      ms[k] = (ms[k]||0)+(c.amount||0);
    });
    return MON.filter(m=>ms[m]).map(m=>({ label:m, value:ms[m]||0 }));
  })();

  const recent = [...collections].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,5);

  if (loading) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f7f5"}}>
      <div style={{textAlign:"center"}}>
        <i className="ti ti-loader-2" style={{fontSize:36,color:GREEN,animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:12,color:"#888",marginTop:10}}>Loading...</div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{background:"#f5f7f5",padding:"10px 12px 4px"}}>

      {/* Welcome banner */}
      <div style={{background:`linear-gradient(135deg,${GREEN},#2e7d32)`,borderRadius:14,padding:"14px 16px",marginBottom:12,color:"#fff"}}>
        <div style={{fontSize:10,opacity:0.7,marginBottom:2}}>{org.name} · {org.reg}</div>
        <div style={{fontSize:16,fontWeight:700}}>Mega Lucky Draw 2026</div>
        <div style={{fontSize:11,opacity:0.75,marginTop:2,marginBottom:14}}>{org.event} · Coordinator Dashboard</div>

        {/* Donut + key stats */}
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <DonutChart sold={soldTickets} total={TOTAL_TICKETS} size={82} stroke={11}/>
          <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[
              {l:"Collected",    v:fmt(totalCollected), c:"#fff"},
              {l:"Pending",      v:fmt(pendingBalance), c:"#ffe0b2"},
              {l:"Tickets sold", v:`${soldTickets}/${TOTAL_TICKETS}`, c:"#fff"},
              {l:"Books done",   v:`${completeBooks}/${books.length}`,c:"#c8e6c9"},
            ].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"5px 8px"}}>
                <div style={{fontSize:9,opacity:0.7}}>{s.l}</div>
                <div style={{fontSize:12,fontWeight:700,color:s.c,marginTop:1}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Series stacked progress */}
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"12px 14px",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>Series progress</div>
        {Object.entries(BOOK_SERIES).map(([key,s])=>{
          const sb = books.filter(b=>b.series===key||b.bookNumber?.startsWith(key));
          const sc = sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.amount||0),0),0);
          const ss = sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.ticketsSold||0),0),0);
          const total = s.totalBooks * s.ticketsPerBook;
          const pct = total>0 ? Math.round((ss/total)*100) : 0;
          return (
            <div key={key} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:22,height:22,borderRadius:6,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:s.color}}>{key}</div>
                  <div>
                    <span style={{fontSize:11,fontWeight:600,color:"#1a1a1a"}}>{s.name}</span>
                    <span style={{fontSize:10,color:"#888",marginLeft:5}}>{s.ticketsPerBook}t/book · {s.totalBooks} books</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,fontWeight:700,color:GREEN}}>{fmt(sc)}</div>
                  <div style={{fontSize:9,color:"#aaa"}}>{ss}/{total} tickets · {pct}%</div>
                </div>
              </div>
              <div style={{height:7,background:"#f0f0f0",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",background:s.color,borderRadius:4,transition:"width 0.5s"}}/>
              </div>
            </div>
          );
        })}
        {/* Overall stacked */}
        <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #f0f0f0"}}>
          <div style={{fontSize:10,color:"#888",marginBottom:5}}>Overall collection breakdown</div>
          <StackedBar segments={[
            { label:"A Series", value:collections.filter(c=>{ const b=books.find(x=>x.id===c.bookId); return b?.series==="A"||b?.bookNumber?.startsWith("A"); }).reduce((s,c)=>s+(c.amount||0),0), color:"#1565c0" },
            { label:"B Series", value:collections.filter(c=>{ const b=books.find(x=>x.id===c.bookId); return b?.series==="B"||b?.bookNumber?.startsWith("B"); }).reduce((s,c)=>s+(c.amount||0),0), color:"#1a6b3c" },
            { label:"C Series", value:collections.filter(c=>{ const b=books.find(x=>x.id===c.bookId); return b?.series==="C"||b?.bookNumber?.startsWith("C"); }).reduce((s,c)=>s+(c.amount||0),0), color:"#e65100" },
          ]} height={12}/>
          <div style={{display:"flex",gap:10,marginTop:5}}>
            {[{l:"A",c:"#1565c0"},{l:"B",c:"#1a6b3c"},{l:"C",c:"#e65100"}].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#888"}}>
                <div style={{width:8,height:8,borderRadius:2,background:x.c}}/>{x.l} Series
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sparkline charts */}
      {weeklyData.length>=2 && (
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"12px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>Weekly trend</div>
              <div style={{fontSize:10,color:"#888",marginTop:1}}>Last {weeklyData.length} weeks</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:14,fontWeight:700,color:GREEN}}>{fmt(weeklyData[weeklyData.length-1]?.value||0)}</div>
              <div style={{fontSize:9,color:"#aaa"}}>this week</div>
            </div>
          </div>
          <div style={{marginBottom:6}}>
            <Sparkline data={weeklyData} color={GREEN} width={280} height={48}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {weeklyData.map((d,i)=>(
              <div key={i} style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:8,color:"#aaa"}}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthlyData.length>=2 && (
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"12px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>Monthly trend</div>
              <div style={{fontSize:10,color:"#888",marginTop:1}}>Collection by month</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1565c0"}}>{fmt(monthlyData.reduce((s,d)=>s+d.value,0))}</div>
              <div style={{fontSize:9,color:"#aaa"}}>total</div>
            </div>
          </div>
          <Sparkline data={monthlyData} color="#1565c0" width={280} height={48}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            {monthlyData.map((d,i)=>(
              <div key={i} style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:8,color:"#aaa"}}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
        {[
          {icon:"ti-users",label:"Members",value:members.length,color:"#1565c0",bg:"#e3f2fd"},
          {icon:"ti-books",label:"Assigned",value:`${books.length}/500`,color:GREEN,bg:LIGHT_GREEN},
          {icon:"ti-alert-circle",label:"Pending",value:books.filter(b=>b.status!=="complete").length,color:"#e65100",bg:"#fff3e0"},
        ].map((s,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 8px",textAlign:"center"}}>
            <div style={{width:32,height:32,borderRadius:8,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 5px"}}>
              <i className={`ti ${s.icon}`} style={{color:s.color,fontSize:16}}/>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:s.color}}>{s.value}</div>
            <div style={{fontSize:9,color:"#aaa",marginTop:1}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {pendingBalance > 0 && (
        <div onClick={()=>onNavigate("books")} style={{background:"#fff8e1",border:"1px solid #ffe082",borderRadius:10,padding:"9px 12px",marginBottom:10,display:"flex",gap:8,cursor:"pointer",alignItems:"center"}}>
          <i className="ti ti-alert-triangle" style={{color:"#f57c00",fontSize:16,flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:600,color:"#e65100"}}>{fmt(pendingBalance)} pending</div>
            <div style={{fontSize:10,color:"#888",marginTop:1}}>From {books.filter(b=>b.status!=="complete").length} active books · Tap to follow up</div>
          </div>
          <i className="ti ti-chevron-right" style={{color:"#ccc",fontSize:14}}/>
        </div>
      )}

      {/* Recent activity */}
      <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Recent activity</div>
      {recent.length===0 && <div style={{textAlign:"center",color:"#aaa",fontSize:12,padding:"20px 0"}}>No collections yet</div>}
      {recent.map(col=>{
        const book = books.find(b=>b.id===col.bookId);
        const member = members.find(m=>m.id===col.memberId);
        const s = book ? getSeriesFromBook(book.bookNumber) : null;
        const modeC = {cash:GREEN, upi:"#1565c0", bank:"#e65100"}[col.paymentMode||"cash"];
        if (!member) return null;
        return (
          <div key={col.id} onClick={()=>onNavigate("books")} style={{background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:s?s.bg:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className="ti ti-cash" style={{color:s?s.color:GREEN,fontSize:17}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{member.firstName} {member.lastName}</div>
              <div style={{fontSize:10,color:"#888",marginTop:1}}>Book {book?.bookNumber||"—"} · {col.date} · <span style={{color:modeC,fontWeight:500}}>{(col.paymentMode||"cash").toUpperCase()}</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,fontWeight:700,color:GREEN}}>{fmt(col.amount)}</div>
              <div style={{fontSize:10,color:"#aaa"}}>{col.ticketsSold} tickets</div>
            </div>
          </div>
        );
      })}

      <button onClick={()=>onNavigate("books")} style={{width:"100%",background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:11,padding:"12px",fontSize:13,fontWeight:600,cursor:"pointer",marginTop:4,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 12px rgba(26,107,60,0.25)"}}>
        <i className="ti ti-cash" style={{fontSize:17}}/> Collect Cash
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
