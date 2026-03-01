// ── pages/data/PartyDataPage.jsx ─────────────────────────────────────────────
// Party Data — two tabs:
//   1. Members  — fetched from n8n, hierarchical org cards, add/edit/delete
//   2. Documents — upload + category-grouped view, fetched from n8n

import { useState, useEffect } from "react";
import "../globals.css";

const BASE     = import.meta.env.VITE_N8N_WEBHOOK_URL;
const MAX_FILE = 10 * 1024 * 1024; // 10 MB

// ── Config ────────────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  leadership: { label: "Leadership",    color: "#6366f1", bg: "rgba(99,102,241,0.09)" },
  senior:     { label: "Senior Member", color: "#10b981", bg: "rgba(16,185,129,0.09)" },
  member:     { label: "Member",        color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
};
const LEVELS = ["leadership", "senior", "member"];

const DOC_CAT_ICONS = {
  "Constitution":  "📜",
  "Finance":       "💰",
  "Manifesto":     "📋",
  "Press Release": "📰",
  "Minutes":       "📝",
  "Legal":         "⚖️",
  "Other":         "📄",
};
const DOC_CATEGORIES = Object.keys(DOC_CAT_ICONS);

const FILE_TYPE_ICON = {
  pdf:"📑", doc:"📝", docx:"📝", txt:"📃",
  xlsx:"📊", xls:"📊", ppt:"📊", pptx:"📊", default:"📄",
};
const getFileIcon = (name = "") =>
  FILE_TYPE_ICON[name.split(".").pop()?.toLowerCase()] || FILE_TYPE_ICON.default;
const formatSize = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;

// ── CSV export ────────────────────────────────────────────────────────────────
function downloadCSV(members) {
  const header = "ID,Level,Role,Name,Sector,Phone,Email,Status";
  const rows   = members.map(m =>
    `${m.id},${m.level},"${m.role}","${m.name}",${m.sector},${m.phone},${m.email},${m.status}`
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a    = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob), download: "party-members.csv",
  });
  a.click(); URL.revokeObjectURL(a.href);
}

// ── Inline editable field ─────────────────────────────────────────────────────
function InlineEdit({ value, onChange, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);
  useEffect(() => { setVal(value); }, [value]);

  if (editing) {
    return (
      <input autoFocus
        className={`pd-inline-input ${className}`}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { setEditing(false); onChange(val); }}
        onKeyDown={e => { if (e.key === "Enter") { setEditing(false); onChange(val); } }}
      />
    );
  }
  return (
    <span className={`pd-inline-value ${className}`} onClick={() => setEditing(true)} title="Click to edit">
      {val || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
      <span className="pd-edit-icon">✏️</span>
    </span>
  );
}

// ── Member card ───────────────────────────────────────────────────────────────
function MemberCard({ m, onUpdate, onDelete }) {
  const initials = (m.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const lvlCfg   = LEVEL_CONFIG[m.level] || LEVEL_CONFIG.member;

  return (
    <div className={`pd-member-card ${m.status === "inactive" ? "inactive" : ""}`}>

      <div className="pd-card-top">
        <div className="pd-card-avatar"
          style={{ background: `linear-gradient(135deg, ${lvlCfg.color}cc, ${lvlCfg.color}88)` }}>
          {initials}
        </div>
        <div className="pd-card-header-right" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className={`pd-status-dot ${m.status}`} title={m.status} />
          <button className="pd-icon-btn pd-del-btn" onClick={() => onDelete(m.id)} title="Remove member">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="pd-card-name">
        <InlineEdit value={m.name} onChange={v => onUpdate(m.id, "name", v)} />
      </div>
      <div className="pd-card-role">
        <InlineEdit value={m.role} onChange={v => onUpdate(m.id, "role", v)} className="small" />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
        {m.sector && <span className="pd-card-sector">{m.sector}</span>}
        <span className="pd-card-sector" style={{ color: lvlCfg.color, background: lvlCfg.bg }}>
          {lvlCfg.label}
        </span>
      </div>

      <div className="pd-card-contact">
        <InlineEdit value={m.phone} onChange={v => onUpdate(m.id, "phone", v)} />
        <InlineEdit value={m.email} onChange={v => onUpdate(m.id, "email", v)} className="small" />
      </div>

      <div className="pd-card-footer">
        <button className="pd-toggle-btn"
          onClick={() => onUpdate(m.id, "status", m.status === "active" ? "inactive" : "active")}>
          {m.status === "active" ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

// ── Add member form ───────────────────────────────────────────────────────────
function AddMemberForm({ onAdd, onCancel, saving }) {
  const [form, setForm] = useState({
    name: "", role: "", sector: "", phone: "", email: "", level: "member", status: "active",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="pd-add-form">
      <div className="pd-add-form-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Member
      </div>

      <div className="pd-add-grid">
        {[
          { label:"Name",   key:"name",   color:"#6366f1", ph:"Full name"                  },
          { label:"Role",   key:"role",   color:"#10b981", ph:"e.g. District Coordinator"  },
          { label:"Sector", key:"sector", color:"#f59e0b", ph:"e.g. Communications"        },
          { label:"Phone",  key:"phone",  color:"#3b82f6", ph:"+91 98400 00000"            },
          { label:"Email",  key:"email",  color:"#8b5cf6", ph:"name@party.in"             },
        ].map(f => (
          <div key={f.key}>
            <div className="field-label" style={{ marginBottom: 6 }}>
              <span style={{ background: f.color }} />{f.label}
            </div>
            <input className="input-field" placeholder={f.ph}
              value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
        <div>
          <div className="field-label" style={{ marginBottom: 6 }}>
            <span style={{ background: "#ef4444" }} />Level
          </div>
          <select className="input-field" value={form.level} onChange={e => set("level", e.target.value)}>
            {LEVELS.map(l => <option key={l} value={l}>{LEVEL_CONFIG[l].label}</option>)}
          </select>
        </div>
      </div>

      <div className="pd-add-actions">
        <button className="btn-primary" disabled={saving || !form.name.trim()}
          onClick={() => onAdd(form)} style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "💾 Add Member"}
        </button>
        <button className="cs-status-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Document category group ───────────────────────────────────────────────────
function DocGroup({ category, docs, onDelete }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="dtg-group">
      <button className="dtg-header" onClick={() => setOpen(p => !p)}>
        <div className="dtg-header-left">
          <span className="dtg-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
          <span className="dtg-topic-icon">{DOC_CAT_ICONS[category] || "📄"}</span>
          <span className="dtg-topic-name">{category}</span>
          <span className="dtg-count">{docs.length} {docs.length === 1 ? "file" : "files"}</span>
        </div>
        <span className="dtg-topic-badge">{category}</span>
      </button>
      <div className={`dtg-body ${open ? "open" : ""}`}>
        <div className="dtg-doc-grid">
          {docs.map((d, i) => (
            <div key={d.fileUrl || d.id || i} className="doc-card dtg-doc-card">
              <div className="doc-header">
                <div className="doc-icon">{getFileIcon(d.fileName)}</div>
                <div className="doc-info">
                  <div className="doc-title">{d.fileName}</div>
                  <div className="doc-topic">🗂 {d.category || category}</div>
                  {d.uploadedAt && (
                    <div className="dtg-doc-date">
                      {new Date(d.uploadedAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="doc-actions">
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn-primary">Open</a>
                <button className="btn-delete" onClick={() => onDelete(d)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function MembersSkeleton() {
  return (
    <div className="pd-org-root">
      {[1, 2].map(g => (
        <div key={g} className="pd-level-group">
          <div className="pd-level-header">
            <div className="pm2-skeleton-line" style={{ width: 100, height: 22, borderRadius: 20 }} />
            <div className="pd-level-line" />
          </div>
          <div className="pd-cards-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="pd-member-card" style={{ gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div className="pm2-skeleton-line" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="pm2-skeleton-line" style={{ width: "70%", height: 12 }} />
                    <div className="pm2-skeleton-line" style={{ width: "50%", height: 10 }} />
                  </div>
                </div>
                <div className="pm2-skeleton-line" style={{ width: "40%", height: 20, borderRadius: 20 }} />
                <div className="pm2-skeleton-line" style={{ width: "90%", height: 10 }} />
                <div className="pm2-skeleton-line" style={{ width: "80%", height: 10 }} />
                <div className="pm2-skeleton-line" style={{ width: "100%", height: 32, borderRadius: 7, marginTop: 4 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════════
export default function PartyDataPage() {

  const [activeTab, setActiveTab] = useState("members");

  // ── Members ────────────────────────────────────────────────────────────────
  const [members,       setMembers]       = useState([]);
  const [loadingMembers,setLoadingMembers]= useState(true);
  const [fetchErr,      setFetchErr]      = useState(false);
  const [filterLevel,   setFilterLevel]   = useState("All");
  const [filterSector,  setFilterSector]  = useState("All");
  const [search,        setSearch]        = useState("");
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [savingMember,  setSavingMember]  = useState(false);

  // ── Documents ──────────────────────────────────────────────────────────────
  const [partyDocs,   setPartyDocs]   = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [category,    setCategory]    = useState(DOC_CATEGORIES[0]);
  const [uploading,   setUploading]   = useState(false);
  const [docSearch,   setDocSearch]   = useState("");

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  // ── Fetch members from n8n ─────────────────────────────────────────────────
  const fetchMembers = async () => {
    setLoadingMembers(true);
    setFetchErr(false);
    try {
      const res  = await fetch(`${BASE}/meet-fetch-party-members`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : (data.members ?? data.data ?? []);
      setMembers(arr);
    } catch {
      setFetchErr(true);
      setMembers([]); // no dummy fallback — show real error state
    } finally {
      setLoadingMembers(false);
    }
  };

  // ── Fetch party docs from n8n ──────────────────────────────────────────────
  const fetchDocs = async () => {
    try {
      const res  = await fetch(`${BASE}/meet-fetch-party-documents`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPartyDocs(Array.isArray(data) ? data : []);
    } catch {
      setPartyDocs([]);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchDocs();
  }, []);

  // ── Member helpers ─────────────────────────────────────────────────────────
  const sectors = ["All", ...new Set(members.map(m => m.sector).filter(Boolean))];

  const filtered = members.filter(m => {
    if (filterLevel  !== "All" && m.level  !== filterLevel)  return false;
    if (filterSector !== "All" && m.sector !== filterSector) return false;
    if (search && !m.name?.toLowerCase().includes(search.toLowerCase()) &&
        !m.role?.toLowerCase().includes(search.toLowerCase()))           return false;
    return true;
  });

  const updateMember = (id, field, value) => {
    setMembers(p => p.map(m => m.id === id ? { ...m, [field]: value } : m));
    fetch(`${BASE}/meet-update-party-member`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, field, value }),
    }).catch(() => {});
  };

  const deleteMember = (id) => {
    setMembers(p => p.filter(m => m.id !== id));
    fetch(`${BASE}/meet-delete-party-member`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    showToast("Member removed");
  };

  const addMember = async (form) => {
    setSavingMember(true);
    const newM = { ...form, id: `m-${Date.now()}`, name: form.name.trim() };
    try {
      const res = await fetch(`${BASE}/meet-add-party-member`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newM),
      });
      if (!res.ok) throw new Error();
      // Prefer server-assigned record if returned
      const saved = await res.json().catch(() => null);
      setMembers(p => [...p, saved?.id ? saved : newM]);
    } catch {
      setMembers(p => [...p, newM]); // optimistic fallback
    } finally {
      setShowAddForm(false);
      setSavingMember(false);
      showToast("Member added ✓");
    }
  };

  // ── Document helpers ───────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = [];
    for (const f of files) {
      if (f.size > MAX_FILE) { showToast(`${f.name} exceeds 10 MB`); continue; }
      valid.push({ id: crypto.randomUUID(), name: f.name, size: f.size, category, file: f });
    }
    if (valid.length) setPendingDocs(p => [...p, ...valid]);
    e.target.value = "";
  };

  const uploadDoc = async (doc) => {
    if (uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",     doc.file);
      fd.append("category", doc.category);
      fd.append("name",     doc.name);
      const res = await fetch(`${BASE}/meet-upload-party-document`, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      setPendingDocs(p => p.filter(d => d.id !== doc.id));
      fetchDocs();
      showToast("Document uploaded ✓");
    } catch { showToast("Upload failed"); }
    finally   { setUploading(false); }
  };

  const deleteDoc = async (doc) => {
    try {
      await fetch(`${BASE}/meet-delete-party-document`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: doc.category, fileName: doc.fileName, fileUrl: doc.fileUrl }),
      });
      showToast("Document removed");
      fetchDocs();
    } catch { showToast("Failed to delete"); }
  };

  // Group docs by category
  const filteredPartyDocs = partyDocs.filter(d =>
    !docSearch || d.fileName?.toLowerCase().includes(docSearch.toLowerCase())
  );
  const docGroups = filteredPartyDocs.reduce((acc, d) => {
    const k = d.category || "Other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(d);
    return acc;
  }, {});
  const groupKeys = [
    ...DOC_CATEGORIES.filter(c => docGroups[c]),
    ...Object.keys(docGroups).filter(k => !DOC_CATEGORIES.includes(k)),
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="cs-root">

      {/* ── Page header ── */}
      <div className="cs-page-header">
        <div>
          <h2 className="cs-page-title">Party Data</h2>
          <p className="cs-page-sub">Manage party members and official documents</p>
        </div>
        <div className="cs-header-stats">
          <div className="cs-stat">
            <span className="cs-stat-num" style={{ color: "#6366f1" }}>{members.length}</span>
            <span className="cs-stat-label">Members</span>
          </div>
          <div className="cs-stat">
            <span className="cs-stat-num" style={{ color: "#10b981" }}>
              {members.filter(m => m.status === "active").length}
            </span>
            <span className="cs-stat-label">Active</span>
          </div>
          <div className="cs-stat">
            <span className="cs-stat-num" style={{ color: "#f59e0b" }}>{partyDocs.length}</span>
            <span className="cs-stat-label">Docs</span>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="pd-tabs">
        <button className={`pd-tab ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Members
          <span className="pd-tab-count">{members.length}</span>
        </button>
        <button className={`pd-tab ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Documents
          <span className="pd-tab-count">{partyDocs.length}</span>
        </button>
      </div>

      {/* ════════ MEMBERS TAB ════════ */}
      {activeTab === "members" && (
        <>
          <div className="cs-filters">
            <input className="input-field cs-search" placeholder="🔍  Search name or role…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input-field cs-filter-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
              <option value="All">All Levels</option>
              {LEVELS.map(l => <option key={l} value={l}>{LEVEL_CONFIG[l].label}</option>)}
            </select>
            <select className="input-field cs-filter-select" value={filterSector} onChange={e => setFilterSector(e.target.value)}>
              {sectors.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="btn-primary" style={{ whiteSpace: "nowrap" }}
              onClick={() => setShowAddForm(p => !p)}>
              {showAddForm ? "✕ Cancel" : "➕ Add Member"}
            </button>
            <button className="cs-status-btn" onClick={() => downloadCSV(members)}>⬇ CSV</button>
            <button className={`btn-refresh ${loadingMembers ? "spinning" : ""}`} onClick={fetchMembers} title="Refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>

          {showAddForm && (
            <AddMemberForm onAdd={addMember} onCancel={() => setShowAddForm(false)} saving={savingMember} />
          )}

          {/* Loading skeleton */}
          {loadingMembers && <MembersSkeleton />}

          {/* Fetch error */}
          {!loadingMembers && fetchErr && (
            <div className="state-box">
              <div className="state-icon">⚠️</div>
              <p>Could not load members — webhook unreachable.</p>
              <button className="btn-primary" style={{ marginTop: 12 }} onClick={fetchMembers}>Retry</button>
            </div>
          )}

          {/* Empty state — no error, just no data yet */}
          {!loadingMembers && !fetchErr && members.length === 0 && (
            <div className="state-box">
              <div className="state-icon">👥</div>
              <p>No party members yet. Add the first one above.</p>
            </div>
          )}

          {/* Hierarchical org */}
          {!loadingMembers && !fetchErr && members.length > 0 && (
            <div className="pd-org-root">
              {LEVELS.map(level => {
                const group = filtered.filter(m => m.level === level);
                if (group.length === 0) return null;
                const cfg = LEVEL_CONFIG[level];
                return (
                  <div key={level} className="pd-level-group">
                    <div className="pd-level-header">
                      <span className="pd-level-label" style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.label}
                      </span>
                      <span className="pd-level-count">
                        {group.length} {group.length === 1 ? "person" : "people"}
                      </span>
                      <div className="pd-level-line" />
                    </div>
                    <div className="pd-cards-grid">
                      {group.map(m => (
                        <MemberCard key={m.id} m={m} onUpdate={updateMember} onDelete={deleteMember} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="cs-empty">No members match your filters.</div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════ DOCUMENTS TAB ════════ */}
      {activeTab === "documents" && (
        <>
          <div className="qa-card" style={{ marginBottom: 4 }}>
            <div className="qa-card-header">
              <span className="qa-num">UPLOAD PARTY DOCUMENT</span>
            </div>
            <div style={{ padding: 24 }}>
              <label className="dtg-upload-zone">
                <div className="dtg-upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                </div>
                <strong className="dtg-upload-label">Click to upload party documents</strong>
                <span className="dtg-upload-hint">PDF, DOCX, TXT · Max 10 MB each</span>
                <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.xlsx" hidden onChange={handleFileSelect} />
              </label>
              <div style={{ marginTop: 18 }}>
                <div className="field-label"><span />Category</div>
                <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                  {DOC_CATEGORIES.map(c => <option key={c} value={c}>{DOC_CAT_ICONS[c]} {c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {pendingDocs.length > 0 && (
            <>
              <div className="divider" />
              <div className="section-label">
                Pending Uploads
                <span className="field-optional"> · {pendingDocs.length} file{pendingDocs.length > 1 ? "s" : ""}</span>
              </div>
              <div className="doc-grid">
                {pendingDocs.map(d => (
                  <div key={d.id} className="doc-card dtg-pending-card">
                    <div className="doc-header">
                      <div className="doc-icon">{getFileIcon(d.name)}</div>
                      <div className="doc-info">
                        <div className="doc-title">{d.name}</div>
                        <div className="doc-topic">🗂 {d.category}</div>
                        <div className="dtg-doc-date">{formatSize(d.size)}</div>
                      </div>
                    </div>
                    <div className="dtg-pending-bar">
                      <div className="dtg-pending-fill" style={{ width: uploading ? "55%" : "0%" }} />
                    </div>
                    <div className="doc-actions">
                      <button className="btn-primary" disabled={uploading}
                        style={{ opacity: uploading ? 0.7 : 1 }} onClick={() => uploadDoc(d)}>
                        {uploading ? "Uploading…" : "💾 Save"}
                      </button>
                      <button className="btn-delete"
                        onClick={() => setPendingDocs(p => p.filter(x => x.id !== d.id))}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="divider" />
          <div className="dtg-saved-header">
            <div className="section-label" style={{ margin: 0 }}>
              Party Documents
              {partyDocs.length > 0 && <span className="field-optional"> · {partyDocs.length} total</span>}
            </div>
            <input className="input-field dtg-search" placeholder="🔍  Search documents…"
              value={docSearch} onChange={e => setDocSearch(e.target.value)} style={{ maxWidth: 240 }} />
          </div>

          {partyDocs.length === 0 ? (
            <div className="state-box">
              <div className="state-icon">📂</div>
              <p>No party documents uploaded yet.</p>
            </div>
          ) : groupKeys.length === 0 ? (
            <div className="state-box">
              <div className="state-icon">🔍</div>
              <p>No documents match your search.</p>
            </div>
          ) : (
            <div className="dtg-groups">
              {groupKeys.map(cat => (
                <DocGroup key={cat} category={cat} docs={docGroups[cat]} onDelete={deleteDoc} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Toast ── */}
      <div
        className={`status-bar ${toast ? "show" : ""}`}
        style={toast?.includes("fail") || toast?.includes("Failed")
          ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }
          : {}}
      >
        {toast}
      </div>

    </div>
  );
}