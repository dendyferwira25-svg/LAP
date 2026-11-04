import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';

const DEPARTMENTS = ['Kepala Unit', 'Desain Grafis', 'Admin', 'Operator Mesin', 'Finishing', 'Welder'];
const emptyForm = { title: '', description: '', department: 'Desain Grafis', assigned_to: '', work_date: new Date().toISOString().slice(0, 10), priority: 'Normal', status: 'Belum dikerjakan' };

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
  const [filterDepartment, setFilterDepartment] = useState('Semua bagian');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session?.user) loadProfileAndData(); else { setProfile(null); setTasks([]); } }, [session?.user?.id]);

  async function loadProfileAndData() {
    const { data: p, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (profileError) setNotice('Gagal membaca profil: ' + profileError.message);
    setProfile(p || null);
    const [taskResult, memberResult] = await Promise.all([
      supabase.from('agenda_tasks').select('*').order('work_date', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, department, role').order('full_name')
    ]);
    if (taskResult.error) setNotice('Gagal memuat agenda. Pastikan SQL database sudah dijalankan: ' + taskResult.error.message);
    else setTasks(taskResult.data || []);
    setMembers(memberResult.data || []);
  }

  const canSeeAll = profile?.role === 'head' || profile?.department === 'Kepala Unit';
  const visibleTasks = useMemo(() => tasks.filter(t => {
    const monthMatch = !filterDate || (t.work_date || '').startsWith(filterDate);
    const deptMatch = filterDepartment === 'Semua bagian' || t.department === filterDepartment;
    const accessMatch = canSeeAll || (profile && (t.created_by === profile.id || t.assigned_to === profile.id || t.department === profile.department));
    return monthMatch && deptMatch && accessMatch;
  }), [tasks, filterDate, filterDepartment, canSeeAll, profile]);

  async function signIn(e) {
    e.preventDefault(); setLoginError(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
    if (error) setLoginError(error.message);
    setBusy(false);
  }

  async function signOut() { await supabase.auth.signOut(); }

  async function addTask(e) {
    e.preventDefault(); setBusy(true); setNotice('');
    const payload = { ...form, created_by: session.user.id, assigned_to: form.assigned_to || null };
    const { error } = await supabase.from('agenda_tasks').insert(payload);
    if (error) setNotice('Agenda belum tersimpan: ' + error.message);
    else { setNotice('Agenda berhasil ditambahkan.'); setForm({ ...emptyForm, work_date: new Date().toISOString().slice(0, 10) }); setShowForm(false); await loadProfileAndData(); }
    setBusy(false);
  }

  async function updateStatus(task, status) {
    const { error } = await supabase.from('agenda_tasks').update({ status }).eq('id', task.id);
    if (error) setNotice('Status belum berubah: ' + error.message); else { setNotice('Status agenda diperbarui.'); await loadProfileAndData(); }
  }

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (!session) return <main className="login-wrap"><section className="login-card"><div className="brand-mark">LAP</div><p className="eyebrow">LUPUNG ADVERTISING & PRINTING</p><h1>Agenda Kerja Tim</h1><p className="muted">Masuk untuk melihat dan mengelola agenda kerja tim.</p><form onSubmit={signIn} className="stack"><label>Email pengguna<input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="nama@perusahaan.com" required /></label><label>Password<input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Masukkan password" required /></label>{loginError && <p className="error">{loginError}</p>}<button disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button></form><p className="hint">Akun pengguna dibuat melalui Supabase Authentication. Hubungi administrator jika belum memiliki akun.</p></section></main>;

  return <div className="app-shell"><header className="topbar"><div className="brand"><div className="brand-mark small">LAP</div><div><strong>Agenda Kerja Tim</strong><span>Lupung Advertising & Printing</span></div></div><div className="user-box"><span>{profile?.full_name || session.user.email}</span><button className="button-light" onClick={signOut}>Keluar</button></div></header><main className="content"><section className="welcome"><div><p className="eyebrow">DASHBOARD TIM</p><h1>Agenda Kerja</h1><p className="muted">Rencanakan pekerjaan, pantau progres, dan koordinasikan tim LAP.</p></div><button onClick={() => setShowForm(v => !v)}>{showForm ? 'Tutup formulir' : '+ Tambah agenda'}</button></section>
    {notice && <div className="notice" role="status">{notice}<button className="notice-close" onClick={() => setNotice('')}>×</button></div>}
    {!profile && <div className="notice warning">Profil pengguna belum dibuat. Administrator perlu menambahkan baris profil pada tabel <code>profiles</code> sesuai petunjuk README.</div>}
    {showForm && <section className="panel"><h2>Agenda baru</h2><form onSubmit={addTask} className="form-grid"><label>Judul pekerjaan<input value={form.title} onChange={e => setForm({...form, title:e.target.value})} required placeholder="Contoh: Cetak spanduk kegiatan" /></label><label>Tanggal kerja<input type="date" value={form.work_date} onChange={e => setForm({...form, work_date:e.target.value})} required /></label><label>Bagian<select value={form.department} onChange={e => setForm({...form, department:e.target.value})}>{DEPARTMENTS.filter(d => d !== 'Kepala Unit').map(d => <option key={d}>{d}</option>)}</select></label><label>Penanggung jawab<select value={form.assigned_to} onChange={e => setForm({...form, assigned_to:e.target.value})}><option value="">Belum ditentukan</option>{members.map(m => <option value={m.id} key={m.id}>{m.full_name} — {m.department}</option>)}</select></label><label>Prioritas<select value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}><option>Rendah</option><option>Normal</option><option>Tinggi</option><option>Mendesak</option></select></label><label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value})}><option>Belum dikerjakan</option><option>Sedang dikerjakan</option><option>Selesai</option><option>Tertunda</option></select></label><label className="full">Keterangan<textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows="3" placeholder="Detail pekerjaan, bahan, atau tenggat" /></label><div className="full actions"><button disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan agenda'}</button><button type="button" className="button-light" onClick={() => setShowForm(false)}>Batal</button></div></form></section>}
    <section className="stats"><div className="stat-card"><span>Total agenda tampil</span><strong>{visibleTasks.length}</strong></div><div className="stat-card"><span>Belum dikerjakan</span><strong>{visibleTasks.filter(t=>t.status==='Belum dikerjakan').length}</strong></div><div className="stat-card"><span>Sedang dikerjakan</span><strong>{visibleTasks.filter(t=>t.status==='Sedang dikerjakan').length}</strong></div><div className="stat-card"><span>Selesai</span><strong>{visibleTasks.filter(t=>t.status==='Selesai').length}</strong></div></section>
    <section className="panel"><div className="list-heading"><div><h2>Daftar agenda</h2><p className="muted">{canSeeAll ? 'Anda dapat melihat agenda seluruh bagian.' : `Tampilan agenda untuk bagian ${profile?.department || 'Anda'}.`}</p></div><div className="filters"><label>Bulan<input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)} /></label>{canSeeAll && <label>Bagian<select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}><option>Semua bagian</option>{DEPARTMENTS.filter(d=>d!=='Kepala Unit').map(d=><option key={d}>{d}</option>)}</select></label>}</div></div>
    {visibleTasks.length === 0 ? <div className="empty"><div className="empty-icon">▤</div><strong>Belum ada agenda untuk filter ini</strong><p className="muted">Tambahkan agenda baru untuk mulai menggunakan aplikasi.</p></div> : <div className="task-list">{visibleTasks.map(task => <article className="task" key={task.id}><div className="task-date"><strong>{new Date(`${task.work_date}T00:00:00`).getDate()}</strong><span>{new Date(`${task.work_date}T00:00:00`).toLocaleDateString('id-ID',{month:'short'})}</span></div><div className="task-main"><div className="task-title-row"><h3>{task.title}</h3><span className={`status status-${task.status==='Selesai'?'done':task.status==='Sedang dikerjakan'?'progress':task.status==='Tertunda'?'paused':'todo'}`}>{task.status}</span></div><p className="task-meta">{task.department} · {task.priority} {task.assigned_to ? `· ${members.find(m=>m.id===task.assigned_to)?.full_name || 'Penanggung jawab'}` : ''}</p>{task.description && <p className="task-description">{task.description}</p>}</div><div className="task-actions"><select aria-label="Ubah status" value={task.status} onChange={e=>updateStatus(task,e.target.value)}><option>Belum dikerjakan</option><option>Sedang dikerjakan</option><option>Selesai</option><option>Tertunda</option></select></div></article>)}</div>}</section><footer>Agenda Kerja Tim LAP · Versi awal</footer></main></div>;
}

function SetupScreen() { return <main className="setup-wrap"><section className="setup-card"><div className="brand-mark">LAP</div><p className="eyebrow">LUPUNG ADVERTISING & PRINTING</p><h1>Agenda Kerja Tim</h1><p>File program sudah siap. Hubungkan ke proyek Supabase Anda untuk mengaktifkan login dan penyimpanan agenda.</p><div className="setup-step"><strong>1. Siapkan konfigurasi</strong><p>Salin <code>.env.example</code> menjadi <code>.env</code>, lalu isi Project URL dan kunci API publik Supabase.</p></div><div className="setup-step"><strong>2. Siapkan database</strong><p>Jalankan SQL yang tersedia di folder <code>supabase/schema.sql</code> melalui SQL Editor Supabase.</p></div><div className="setup-step"><strong>3. Jalankan website</strong><p>Baca <code>README.md</code> untuk panduan instalasi dan penerbitan di Vercel.</p></div><p className="hint">Halaman ini tampil sebelum konfigurasi Supabase diisi.</p></section></main>; }
