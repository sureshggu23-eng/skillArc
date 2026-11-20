/* SkillArc core: helpers, API, router, layout */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = { user: null, settings: { site_name: 'SkillArc', tagline: '' } };
const app = () => $('#app');

async function api(path, o = {}) {
  const r = await fetch('/api' + path, { method: o.method || 'GET', credentials: 'same-origin',
    headers: o.body ? { 'Content-Type': 'application/json' } : {}, body: o.body ? JSON.stringify(o.body) : undefined });
  let d = {}; try { d = await r.json(); } catch (e) {}
  if (!r.ok) { const e = new Error(d.error || 'Something went wrong. Please try again.'); e.status = r.status; throw e; }
  return d;
}
function toast(msg, type = '') { const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 3800); }
const fail = e => toast(e.message || 'Error', 'bad');
const fmtDate = d => d ? new Date(d.replace(' ', 'T') + 'Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const initials = n => (n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const mins = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + 'm' : ''}`.trim() : `${m} min`;
const go = p => { location.hash = '#' + p; };

/* ---------- logo & cover art ---------- */
const logo = (s = 34) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#5a3df0"/><path d="M7 22a9 9 0 0 1 18 0" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="25" cy="22" r="3" fill="#d6ff4d"/></svg>`;
const THEMES = [['#5a3df0', '#a78bfa', '#d6ff4d'], ['#ff6a4d', '#ffb347', '#14151c'], ['#0e8f7e', '#5ee0b8', '#14151c'], ['#d6338a', '#8b5cf6', '#ffe14d'], ['#2563eb', '#22d3ee', '#14151c'], ['#14151c', '#4b5563', '#d6ff4d']];
let gid = 0;
function coverArt(c) {
  if (c.cover) return `<div class="cover" style="background-image:url('${esc(c.cover)}')">${tags(c)}</div>`;
  const [a, b, hi] = THEMES[(c.theme || 0) % 6], id = 'g' + (++gid), v = (c.id || 0) % 4; let art = '';
  if (v === 0) art = `<circle cx="310" cy="60" r="120" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="26"/><circle cx="310" cy="60" r="60" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="14"/><path d="M40 190a70 70 0 0 1 140 0" fill="none" stroke="${hi}" stroke-width="16" stroke-linecap="round"/><circle cx="180" cy="190" r="16" fill="${hi}"/>`;
  else if (v === 1) art = Array.from({ length: 6 }, (_, r) => Array.from({ length: 12 }, (_, k) => `<circle cx="${40 + k * 30}" cy="${30 + r * 30}" r="${(k + r) % 5 === 0 ? 6 : 2.6}" fill="${(k + r) % 5 === 0 ? hi : '#fff'}" fill-opacity="${(k + r) % 5 === 0 ? 1 : .4}"/>`).join('')).join('') + `<rect x="250" y="120" width="110" height="110" rx="26" fill="#fff" fill-opacity=".18" transform="rotate(14 305 175)"/>`;
  else if (v === 2) art = [0, 1, 2, 3, 4].map(i => `<rect x="${40 + i * 62}" y="${150 - [40, 90, 60, 120, 80][i]}" width="40" height="${[40, 90, 60, 120, 80][i] + 80}" rx="12" fill="${i === 3 ? hi : '#fff'}" fill-opacity="${i === 3 ? 1 : .28}"/>`).join('');
  else art = [0, 1, 2, 3].map(i => `<path d="M-10 ${120 + i * 34} q 60 -50 120 0 t 120 0 t 120 0 t 120 0" fill="none" stroke="${i === 1 ? hi : '#fff'}" stroke-opacity="${i === 1 ? 1 : .3}" stroke-width="${i === 1 ? 10 : 14}" stroke-linecap="round"/>`).join('');
  return `<div class="cover"><svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="225" fill="url(#${id})"/>${art}</svg>${tags(c)}</div>`;
}
const tags = c => c.category ? `<div class="tags"><span class="chip dark">${esc(c.category)}</span></div>` : '';

/* ---------- markdown-lite ---------- */
function md(src) {
  const blocks = []; src = String(src || '').replace(/\r/g, '').replace(/```[a-z]*\n([\s\S]*?)```/g, (m, c) => { blocks.push(c); return `\u0001${blocks.length - 1}\u0001`; });
  const inl = t => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const out = []; let list = null; const flush = () => { if (list) { out.push(`<${list.t}>${list.i.map(x => `<li>${inl(x)}</li>`).join('')}</${list.t}>`); list = null; } };
  let para = []; const fp = () => { if (para.length) { out.push(`<p>${inl(para.join(' '))}</p>`); para = []; } };
  src.split('\n').forEach(raw => {
    const l = raw.trimEnd(); let m;
    if ((m = l.match(/^\u0001(\d+)\u0001$/))) { fp(); flush(); out.push(`<pre><code>${esc(blocks[+m[1]].replace(/\n$/, ''))}</code></pre>`); }
    else if ((m = l.match(/^(#{2,3})\s+(.*)/))) { fp(); flush(); out.push(`<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`); }
    else if ((m = l.match(/^\s*[-*]\s+(.*)/))) { fp(); if (!list || list.t !== 'ul') { flush(); list = { t: 'ul', i: [] }; } list.i.push(m[1]); }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { fp(); if (!list || list.t !== 'ol') { flush(); list = { t: 'ol', i: [] }; } list.i.push(m[1]); }
    else if (!l.trim()) { fp(); flush(); } else { flush(); para.push(l.trim()); }
  });
  fp(); flush(); return out.join('\n');
}
function videoEmbed(url) {
  if (!url) return '';
  const y = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (y) return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${y[1]}" allowfullscreen loading="lazy"></iframe></div>`;
  const v = url.match(/vimeo\.com\/(\d+)/); if (v) return `<div class="video"><iframe src="https://player.vimeo.com/video/${v[1]}" allowfullscreen loading="lazy"></iframe></div>`;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return `<div class="video"><video controls src="${esc(url)}"></video></div>`;
  return /^https?:\/\//.test(url) ? `<p><a class="btn btn-ghost" href="${esc(url)}" target="_blank" rel="noopener">▶ Open video</a></p>` : '';
}

/* ---------- modal ---------- */
function modal({ title, body, wide, actions = [] }) {
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog"><h3>${title}</h3><div class="mbody">${body}</div><div class="acts"></div></div>`;
    const close = v => { ov.remove(); res(v); };
    actions.forEach(a => { const b = document.createElement('button'); b.className = 'btn ' + (a.cls || 'btn-ghost'); b.textContent = a.label; b.onclick = async () => { if (a.fn) { b.disabled = true; try { const r = await a.fn(ov); if (r === false) { b.disabled = false; return; } close(r ?? true); } catch (e) { b.disabled = false; let er = $('.err', ov); if (!er) { er = document.createElement('div'); er.className = 'err'; $('.mbody', ov).prepend(er); } er.textContent = e.message; } } else close(a.value ?? false); }; $('.acts', ov).append(b); });
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(false); }); document.body.append(ov);
    const f = $('input,textarea,select', ov); if (f) f.focus();
  });
}
const confirmBox = (title, text, label = 'Confirm', danger = true) => modal({ title, body: `<p class="muted">${text}</p>`, actions: [{ label: 'Cancel' }, { label, cls: danger ? 'btn-danger' : 'btn-primary', value: true }] });

/* ---------- layout ---------- */
function renderNav() {
  const u = S.user, n = $('#nav'), name = esc(S.settings.site_name);
  n.innerHTML = `<div class="container nav-in"><a class="brand" href="#/">${logo()}${name}</a>
  <nav class="nav-links"><a href="#/" data-r="/">Home</a><a href="#/courses" data-r="/courses">Courses</a><a href="#/about" data-r="/about">About</a><a href="#/contact" data-r="/contact">Contact</a><a href="#/verify" data-r="/verify">Verify certificate</a></nav>
  <div class="nav-cta">${u ? `<a class="btn btn-ghost btn-sm" href="#/dashboard">My learning</a><div class="menu"><button class="avatar" onclick="this.parentNode.classList.toggle('open')" aria-label="Account">${esc(initials(u.name))}</button>
    <div class="menu-pop"><div class="who"><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div>${u.role === 'admin' ? '<a href="#/admin">Admin panel</a>' : ''}<a href="#/dashboard">My learning</a><a href="#/certificates">My certificates</a><a href="#/profile">Profile &amp; password</a><button onclick="logout()">Sign out</button></div></div>`
    : `<a class="btn btn-ghost btn-sm" href="#/login">Sign in</a><a class="btn btn-primary btn-sm" href="#/register">Join for free</a>`}</div>
  <button class="burger" onclick="$('#nav').classList.toggle('open')" aria-label="Menu">☰</button></div>`;
  markNav();
}
function markNav() { const p = location.hash.slice(1) || '/'; $$('.nav-links a').forEach(a => a.classList.toggle('on', a.dataset.r === '/' ? p === '/' : p.startsWith(a.dataset.r))); }
function renderFooter() {
  const n = esc(S.settings.site_name);
  $('#foot').innerHTML = `<div class="container"><div class="fgrid"><div><a class="brand" href="#/">${logo()}${n}</a><p style="margin-top:16px;max-width:300px">${esc(S.settings.tagline)}</p></div>
  <div><h4>Learn</h4><a href="#/courses">All courses</a><a href="#/dashboard">My learning</a><a href="#/certificates">My certificates</a></div>
  <div><h4>Company</h4><a href="#/about">About us</a><a href="#/contact">Contact</a><a href="#/verify">Verify a certificate</a></div>
  <div><h4>Account</h4>${S.user ? '<a href="#/profile">Profile</a><a href="#" onclick="logout();return false">Sign out</a>' : '<a href="#/login">Sign in</a><a href="#/register">Create account</a>'}</div></div>
  <div class="fbot"><span>© ${new Date().getFullYear()} ${n}. All courses are free.</span><span>Made for curious learners.</span></div></div>`;
}
function view(html, mode = 'site') {
  document.body.dataset.mode = mode; app().innerHTML = html; window.scrollTo(0, 0); $('#nav').classList.remove('open');
  document.title = S.settings.site_name + ' - Free online courses with certificates';
}
const loading = () => { app().innerHTML = '<div class="spin"></div>'; };

/* ---------- auth ---------- */
async function refreshMe() { try { const d = await api('/me'); S.user = d.user; S.settings = d.settings; } catch (e) {} }
async function logout() { await api('/logout', { method: 'POST', body: {} }).catch(() => {}); S.user = null; renderNav(); renderFooter(); toast('You have been signed out.'); go('/'); }
function requireLogin(role) {
  if (!S.user) { sessionStorage.setItem('next', location.hash.slice(1)); go('/login'); return false; }
  if (role && S.user.role !== role) { toast('You do not have access to that page.', 'bad'); go('/'); return false; }
  return true;
}
function afterAuth() { const n = sessionStorage.getItem('next'); sessionStorage.removeItem('next'); go(n || (S.user.role === 'admin' ? '/admin' : '/dashboard')); }

/* ---------- router ---------- */
const ROUTES = [];
const route = (re, fn) => ROUTES.push([new RegExp('^' + re + '$'), fn]);
let navToken = 0;
async function router() {
  const p = (location.hash.slice(1) || '/').split('?')[0], tok = ++navToken; markNav(); $('.menu')?.classList.remove('open');
  for (const [re, fn] of ROUTES) { const m = p.match(re); if (m) { try { await fn(...m.slice(1).map(x => x === undefined ? x : decodeURIComponent(x)), () => tok === navToken); } catch (e) { if (tok !== navToken) return; if (e.status === 401) { S.user = null; renderNav(); requireLogin(); } else view(`<div class="container section center"><div class="big" style="font-size:54px">🧭</div><h2>${esc(e.message)}</h2><p class="muted">The page you are looking for may have moved.</p><a class="btn btn-primary" href="#/courses">Browse courses</a></div>`); } return; } }
  view('<div class="container section center"><h2>Page not found</h2><a class="btn btn-primary" href="#/">Go home</a></div>');
}
async function boot() {
  await refreshMe(); renderNav(); renderFooter();
  window.addEventListener('hashchange', router); window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 8), { passive: true });
  document.addEventListener('click', e => { if (!e.target.closest('.menu')) $('.menu')?.classList.remove('open'); });
  router();
}
