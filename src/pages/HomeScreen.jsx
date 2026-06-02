import { useApp } from "../data/AppContext";
import { getMemberStats, getBookStats, fmt } from "../data/store";
import { BOOK_SERIES, TOTAL_TICKETS, getSeriesFromBook } from "../data/bookConfig";
import { Card, SectionLabel, ProgressBar } from "../components/UI";

const RED="#8B0000", GOLD="#FFD700";

function MiniBar({value,max,color="#8B0000",label,sub}){
  const pct = max>0?Math.min(100,Math.round((value/max)*100)):0;
  return (
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}>
        <span style={{color:"#5F5E5A"}}>{label}</span>
        <span style={{color,fontWeight:500}}>{sub}</span>
      </div>
      <div style={{height:7,background:"#f0ede8",borderRadius:4,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.5s"}}/>
      </div>
    </div>
  );
}

export default function HomeScreen({ onNavigate }) {
  const { data, loading } = useApp();
  const { books, collections, members, org } = data;

  const totalCollected = collections.reduce((s,c)=>s+(c.amount||0),0);
  const totalValue     = TOTAL_TICKETS * 1000;
  const totalPending   = totalValue - totalCollected;
  const soldTickets    = collections.reduce((s,c)=>s+(c.ticketsSold||0),0);
  const completeBooks  = books.filter(b=>b.status==="complete").length;

  // Weekly trend (last 8 weeks)
  const weeklyData = (() => {
    const wks = {};
    collections.forEach(c=>{
      const d = new Date(c.date);
      const wn= `W${Math.ceil(((d-new Date(d.getFullYear(),0,1))/86400000+1)/7)}`;
      wks[wn] = (wks[wn]||0)+(c.amount||0);
    });
    return Object.entries(wks).slice(-8);
  })();
  const maxWk = Math.max(...weeklyData.map(([,v])=>v),1);

  // Monthly trend
  const monthlyData = (() => {
    const ms = {};
    const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    collections.forEach(c=>{
      const d=new Date(c.date); const k=MON[d.getMonth()];
      ms[k] = (ms[k]||0)+(c.amount||0);
    });
    return Object.entries(ms).slice(-6);
  })();
  const maxMon = Math.max(...monthlyData.map(([,v])=>v),1);

  const recent = [...collections].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  if (loading) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"#f7f4f0"}}>
      <div style={{textAlign:"center"}}>
        <i className="ti ti-loader-2" style={{fontSize:36,color:RED,animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:12,color:"#888780",marginTop:10}}>Loading data...</div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"10px 10px 4px"}}>

      {/* Header banner */}
      <div style={{background:RED,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
        <div style={{fontSize:9,color:GOLD,letterSpacing:"0.3px",marginBottom:4}}>Niranam Chudan Vallasamithi & NBC · Reg. PTM/TC/105/2022</div>
        <div style={{fontSize:15,fontWeight:500,color:"#fff"}}>Mega Lucky Draw 2026</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.65)",marginTop:2}}>Coupon Sale Management · Coordinator Dashboard</div>
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {Object.entries(BOOK_SERIES).map(([key,s])=>(
            <div key={key} style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:8,padding:"6px 6px",textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:500,color:GOLD}}>{key}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.7)"}}>{s.totalBooks} books</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>{s.ticketsPerBook} tickets</div>
            </div>
          ))}
          <div style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:8,padding:"6px 6px",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:500,color:GOLD}}>500</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.7)"}}>total books</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>10k tickets</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <SectionLabel>Collection overview</SectionLabel>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {[
          {label:"Total collected",value:fmt(totalCollected),color:"#3B6D11"},
          {label:"Pending balance", value:fmt(totalPending),  color:"#854F0B"},
          {label:"Books assigned",  value:`${books.length}/500`, color:"#2C2C2A"},
          {label:"Books complete",  value:`${completeBooks}/${books.length}`, color:"#3B6D11"},
          {label:"Tickets sold",    value:`${soldTickets}/${TOTAL_TICKETS}`, color:"#2C2C2A"},
          {label:"Members",         value:members.length,     color:"#2C2C2A"},
        ].map((s,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 10px"}}>
            <div style={{fontSize:10,color:"#888780"}}>{s.label}</div>
            <div style={{fontSize:15,fontWeight:500,color:s.color,marginTop:2}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A",marginBottom:8}}>Overall sale progress</div>
        <MiniBar value={soldTickets} max={TOTAL_TICKETS} color={soldTickets/TOTAL_TICKETS>0.7?"#639922":"#EF9F27"} label="Tickets sold" sub={`${Math.round((soldTickets/TOTAL_TICKETS)*100)}%`}/>
        <MiniBar value={totalCollected} max={totalValue} color="#185FA5" label="Amount collected" sub={fmt(totalCollected)}/>
        {Object.entries(BOOK_SERIES).map(([key,s])=>{
          const sb=books.filter(b=>b.series===key||b.bookNumber?.startsWith(key));
          const sc=sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.ticketsSold||0),0),0);
          return <MiniBar key={key} value={sc} max={s.totalBooks*s.ticketsPerBook} color={s.color} label={`${s.name} (${s.ticketsPerBook}t books)`} sub={`${sc}/${s.totalBooks*s.ticketsPerBook}`}/>;
        })}
      </div>

      {/* Weekly trend chart */}
      {weeklyData.length>0 && (
        <div style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A",marginBottom:12}}>Weekly collection trend</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:3,height:64}}>
            {weeklyData.map(([wk,amt])=>(
              <div key={wk} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:8,color:"#888780"}}>{fmt(amt).replace("₹","")}</div>
                <div style={{width:"100%",background:RED,borderRadius:"3px 3px 0 0",height:`${Math.max(6,Math.round((amt/maxWk)*50))}px`,opacity:0.85}}/>
                <div style={{fontSize:8,color:"#888780",textAlign:"center"}}>{wk}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly trend chart */}
      {monthlyData.length>0 && (
        <div style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A",marginBottom:12}}>Monthly collection trend</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:64}}>
            {monthlyData.map(([mon,amt])=>(
              <div key={mon} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:8,color:"#888780"}}>{fmt(amt).replace("₹","")}</div>
                <div style={{width:"100%",background:"#185FA5",borderRadius:"3px 3px 0 0",height:`${Math.max(6,Math.round((amt/maxMon)*50))}px`,opacity:0.85}}/>
                <div style={{fontSize:8,color:"#888780"}}>{mon}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending alert */}
      {totalPending>0 && books.filter(b=>b.status!=="complete").length>0 && (
        <div onClick={()=>onNavigate("books")} style={{background:"#FAEEDA",borderRadius:8,padding:"8px 10px",marginBottom:10,display:"flex",gap:7,cursor:"pointer"}}>
          <i className="ti ti-alert-triangle" style={{color:"#854F0B",fontSize:14,flexShrink:0,marginTop:1}}/>
          <span style={{fontSize:11,color:"#633806"}}>{fmt(totalPending)} pending from {books.filter(b=>b.status!=="complete").length} active books. Tap to follow up.</span>
        </div>
      )}

      {/* Recent collections */}
      <SectionLabel>Recent activity</SectionLabel>
      {recent.length===0 && <div style={{textAlign:"center",color:"#888780",fontSize:12,padding:"16px 0"}}>No collections yet</div>}
      {recent.map(col=>{
        const book=books.find(b=>b.id===col.bookId);
        const member=members.find(m=>m.id===col.memberId);
        const s=book?getSeriesFromBook(book.bookNumber):null;
        const modeIcon={cash:"ti-cash",upi:"ti-device-mobile",bank:"ti-building-bank"}[col.paymentMode||"cash"];
        if (!member) return null;
        return (
          <div key={col.id} onClick={()=>onNavigate("books")} style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"9px 12px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:34,height:34,borderRadius:8,background:s?s.bg:"#f0ede8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className={`ti ${modeIcon}`} style={{color:s?s.color:"#888",fontSize:16}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>{member.firstName} {member.lastName}</div>
              <div style={{fontSize:10,color:"#888780",marginTop:1}}>
                Book {book?.bookNumber||"—"} · {col.date} · {(col.paymentMode||"cash").toUpperCase()}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,fontWeight:500,color:"#3B6D11"}}>{fmt(col.amount)}</div>
              <div style={{fontSize:10,color:"#888780"}}>{col.ticketsSold} tickets</div>
            </div>
          </div>
        );
      })}

      <button onClick={()=>onNavigate("books")} style={{width:"100%",background:RED,color:GOLD,border:"none",borderRadius:10,padding:11,fontSize:13,fontWeight:500,cursor:"pointer",marginTop:4,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <i className="ti ti-cash"/> Collect Cash
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
