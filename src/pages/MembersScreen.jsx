import { useState } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, generateMemberId, getMemberStats } from "../data/store";
import { Card, Badge, Avatar, SectionLabel, InputField, SelectField, PrimaryButton, OutlineButton, InfoChip, fmt } from "../components/UI";

const RED = "#8B0000", GOLD = "#FFD700";

function MemberForm({ onSave, onCancel, existing }) {
  const { data } = useApp();
  const [form, setForm] = useState(existing || { firstName: "", lastName: "", phone: "", whatsapp: "", address: "", label: "committee_member", commission: 0, notes: "" });
  const [errors, setErrors] = useState({});

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    return e;
  }

  function submit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  }

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "12px 10px 14px" }}>
      <SectionLabel>Personal details</SectionLabel>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1 }}><InputField label="First name" required value={form.firstName} onChange={v => set("firstName", v)} error={errors.firstName} /></div>
        <div style={{ flex: 1 }}><InputField label="Last name" required value={form.lastName} onChange={v => set("lastName", v)} error={errors.lastName} /></div>
      </div>
      <InputField label="Phone number" required value={form.phone} onChange={v => set("phone", v)} placeholder="+91 94470 ..." error={errors.phone} />
      <InputField label="WhatsApp number" value={form.whatsapp} onChange={v => set("whatsapp", v)} placeholder="Same as phone or different" />
      <InputField label="House / address" value={form.address} onChange={v => set("address", v)} placeholder="House name, street..." />

      <SectionLabel>Label / category</SectionLabel>
      <InfoChip>This label identifies how this person is connected to the coupon sale. It does not affect app access.</InfoChip>

      {Object.entries(LABELS).map(([key, cfg]) => (
        <div key={key} onClick={() => set("label", key)} style={{ background: "#fff", borderRadius: 10, border: form.label === key ? `1.5px solid ${RED}` : "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, fontSize: 15 }}>
            <i className={key === "committee_member" ? "ti ti-users" : key === "outside_member" ? "ti ti-user" : "ti ti-handshake"} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A" }}>{cfg.label}</div>
            <div style={{ fontSize: 10, color: "#888780", marginTop: 1 }}>
              {key === "committee_member" ? "Existing committee member selling books" : key === "outside_member" ? "Non-committee person given a book to sell" : "Agent selling on behalf; earns commission"}
            </div>
          </div>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${form.label === key ? RED : "#ccc"}`, background: form.label === key ? RED : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {form.label === key && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
          </div>
        </div>
      ))}

      {form.label === "commission_agent" && (
        <InputField label="Commission %" type="number" value={form.commission} onChange={v => set("commission", v)} placeholder="e.g. 5" />
      )}

      <InputField label="Remarks / notes" value={form.notes} onChange={v => set("notes", v)} placeholder="Any note about this person..." />

      <PrimaryButton onClick={submit}>
        <i className="ti ti-check" /> {existing ? "Update member" : "Save member"}
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

function MemberDetail({ member, onBack, onEdit }) {
  const { data } = useApp();
  const stats = getMemberStats(member.id, data.books, data.collections);
  const cfg = LABELS[member.label];

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 14px" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar name={`${member.firstName} ${member.lastName}`} size={44} bg={cfg.bg} color={cfg.color} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#2C2C2A" }}>{member.firstName} {member.lastName}</div>
            <Badge label={cfg.label} type={member.label} />
            <div style={{ fontSize: 10, color: "#888780", marginTop: 2 }}>{member.id}</div>
          </div>
          <button onClick={onEdit} style={{ marginLeft: "auto", background: "#fff", border: `0.5px solid ${RED}`, color: RED, borderRadius: 7, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
            <i className="ti ti-edit" /> Edit
          </button>
        </div>
        <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.07)", paddingTop: 8 }}>
          {[
            { icon: "ti-phone", val: member.phone },
            member.whatsapp && { icon: "ti-brand-whatsapp", val: member.whatsapp },
            member.address && { icon: "ti-map-pin", val: member.address },
            member.commission > 0 && { icon: "ti-percentage", val: `${member.commission}% commission` },
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", fontSize: 12, color: "#444441" }}>
              <i className={`ti ${row.icon}`} style={{ color: "#888780", fontSize: 14, width: 16 }} />
              {row.val}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        {[
          { label: "Books assigned", value: stats.memberBooks.length, color: "#2C2C2A" },
          { label: "Total collected", value: fmt(stats.totalCollected), color: "#3B6D11" },
          { label: "Tickets sold", value: `${stats.soldTickets} / ${stats.totalTickets}`, color: "#2C2C2A" },
          { label: "Balance due", value: fmt(stats.totalPending), color: stats.totalPending > 0 ? "#854F0B" : "#3B6D11" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#888780" }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <SectionLabel>Assigned books</SectionLabel>
      {stats.memberBooks.length === 0 ? (
        <div style={{ fontSize: 12, color: "#888780", textAlign: "center", padding: "20px 0" }}>No books assigned yet</div>
      ) : stats.memberBooks.map(book => {
        const bookCols = data.collections.filter(c => c.bookId === book.id);
        const sold = bookCols.reduce((s, c) => s + c.ticketsSold, 0);
        const collected = bookCols.reduce((s, c) => s + c.amount, 0);
        const pct = Math.round((sold / book.ticketCount) * 100);
        return (
          <Card key={book.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <i className="ti ti-ticket" style={{ color: RED, fontSize: 16 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>Book {book.bookNumber}</div>
                <div style={{ fontSize: 10, color: "#888780" }}>Tickets {book.ticketFrom}–{book.ticketTo} · Issued {book.issueDate}</div>
              </div>
              <span style={{ display: "inline-block", fontSize: 9, padding: "2px 6px", borderRadius: 8, fontWeight: 500, background: book.status === "complete" ? "#EAF3DE" : book.status === "ongoing" ? "#FAEEDA" : "#FCEBEB", color: book.status === "complete" ? "#3B6D11" : book.status === "ongoing" ? "#854F0B" : "#A32D2D" }}>
                {book.status === "complete" ? "Complete" : book.status === "ongoing" ? "Ongoing" : "Not started"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 7, background: "#f0ede8", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: book.status === "complete" ? "#639922" : "#EF9F27", borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 10, color: "#888780" }}>{sold}/{book.ticketCount}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#3B6D11" }}>{fmt(collected)}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function MembersScreen() {
  const { data, addMember, updateMember } = useApp();
  const [view, setView] = useState("list"); // list | add | detail | edit
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = data.members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.phone} ${m.id}`.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave(form) {
    if (view === "edit" && selected) {
      updateMember(selected.id, form);
      setSelected({ ...selected, ...form });
      setView("detail");
    } else {
      const id = generateMemberId(data.members);
      addMember({ ...form, id, createdAt: new Date().toISOString().split("T")[0] });
      setView("list");
    }
  }

  if (view === "add") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}><i className="ti ti-arrow-left" /></button>
        <div>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Add new member</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>Super admin · Member registration</div>
        </div>
      </div>
      <MemberForm onSave={handleSave} onCancel={() => setView("list")} />
    </div>
  );

  if (view === "detail" && selected) return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}><i className="ti ti-arrow-left" /></button>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>{selected.firstName} {selected.lastName}</div>
      </div>
      <MemberDetail member={data.members.find(m => m.id === selected.id) || selected} onBack={() => setView("list")} onEdit={() => setView("edit")} />
    </div>
  );

  if (view === "edit" && selected) return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setView("detail")} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}><i className="ti ti-arrow-left" /></button>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Edit member</div>
      </div>
      <MemberForm onSave={handleSave} onCancel={() => setView("detail")} existing={data.members.find(m => m.id === selected.id)} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px" }}>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Members</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>{data.members.length} registered</div>
      </div>
      <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 4px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.12)", display: "flex", alignItems: "center", padding: "0 10px", gap: 6 }}>
            <i className="ti ti-search" style={{ color: "#888780", fontSize: 15 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, ID..." style={{ flex: 1, border: "none", outline: "none", fontSize: 12, color: "#2C2C2A", background: "transparent", padding: "8px 0" }} />
          </div>
          <button onClick={() => setView("add")} style={{ background: RED, color: GOLD, border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-plus" /> Add
          </button>
        </div>

        {filtered.length === 0 && <div style={{ textAlign: "center", color: "#888780", fontSize: 12, padding: "30px 0" }}>No members found</div>}

        {filtered.map(m => {
          const stats = getMemberStats(m.id, data.books, data.collections);
          const cfg = LABELS[m.label];
          return (
            <Card key={m.id} onClick={() => { setSelected(m); setView("detail"); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={`${m.firstName} ${m.lastName}`} bg={cfg.bg} color={cfg.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{m.firstName} {m.lastName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Badge label={cfg.label} type={m.label} />
                    <span style={{ fontSize: 10, color: "#888780" }}>{m.id}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#3B6D11" }}>{fmt(stats.totalCollected)}</div>
                  <div style={{ fontSize: 10, color: stats.totalPending > 0 ? "#854F0B" : "#888780" }}>{stats.memberBooks.length} books</div>
                </div>
                <i className="ti ti-chevron-right" style={{ color: "#ccc", fontSize: 14, marginLeft: 4 }} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
