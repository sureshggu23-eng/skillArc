/* SkillArc public site + student pages */
const courseCard = c => `<a class="cc" href="#/course/${esc(c.slug)}">${coverArt(c)}<div class="cc-b"><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p>
  <div class="meta"><span>📖 ${plural(c.lesson_count, 'lesson')}</span><span>⏱ ${esc(c.duration || mins(c.minutes))}</span><span>📶 ${esc(c.level)}</span></div>
  <div class="cc-f"><span class="chip free">Free</span><span class="muted">${plural(c.enrolled, 'learner')}</span></div></div></a>`;

/* ---------- home ---------- */
route('/', async alive => {
  loading(); const d = await api('/home'); if (!alive()) return; const st = d.stats, n = esc(S.settings.site_name);
  view(`<section class="hero"><div class="container hero-grid"><div>
    <div class="pill"><i>100% free</i> Courses, quizzes &amp; certificates</div>
    <h1>Learn skills that <em>move</em> your career forward.</h1>
    <p class="lead">${n} gives you structured, bite-sized courses taught by practitioners. Finish the lessons, pass the final quiz and earn a certificate you can verify and share, at no cost.</p>
    <div class="row"><a class="btn btn-primary btn-lg" href="#/courses">Explore courses →</a>${S.user ? '' : '<a class="btn btn-ghost btn-lg" href="#/register">Create free account</a>'}</div>
    <div class="hero-stats"><div><b>${st.courses}</b><span>Free courses</span></div><div><b>${st.lessons}</b><span>Lessons</span></div><div><b>${st.students}</b><span>Learners</span></div><div><b>${st.certificates}</b><span>Certificates issued</span></div></div></div>
    <div class="stage"><div class="blob"><img src="img/hero.jpg" alt="Learner studying analytics dashboards at a desk"></div>
      <div class="float f1"><div class="tag">Lesson 3 of 8</div><h4>CSS: colours, spacing &amp; layout</h4><div class="bar"><i style="width:62%"></i></div><div class="row between muted" style="font-size:12px;margin-top:8px"><span>62% complete</span><span>14 min</span></div></div>
      <div class="float f2"><div class="ring"></div><div><b>Quiz passed!</b><span>Score 92% · pass mark 70%</span></div></div>
      <div class="float f3"><div class="mini"><small>Certificate of completion</small><strong>Your Name</strong><small>Verified · ${n}</small></div></div></div></div></section>
  <section class="section tight"><div class="container"><div class="row between" style="align-items:flex-end;margin-bottom:34px"><div><span class="eyebrow">Start learning</span><h2 style="margin:0">Popular free courses</h2></div><a class="btn btn-ghost" href="#/courses">View all courses →</a></div>
    <div class="grid">${d.courses.map(courseCard).join('') || '<p class="muted">New courses are coming soon.</p>'}</div></div></section>
  <section class="section dark-band"><div class="container"><div class="section-head"><span class="eyebrow">How it works</span><h2>From curious to certified in four steps</h2><p>No payments, no hidden tiers. Everything on ${n} is free.</p></div>
    <div class="steps"><div class="step"><h3>Create an account</h3><p>Sign up with your email in under a minute.</p></div><div class="step"><h3>Enroll in a course</h3><p>Pick any course and enroll with a single click.</p></div><div class="step"><h3>Learn &amp; pass the quiz</h3><p>Complete every lesson, then score above the pass mark.</p></div><div class="step"><h3>Get your certificate</h3><p>Download it and share a link anyone can verify.</p></div></div></div></section>
  <section class="section"><div class="container"><div class="section-head"><span class="eyebrow">Why ${n}</span><h2>Built for learners who want proof of progress</h2></div>
    <div class="features"><div class="feature"><div class="ic">📚</div><h3>Learn at your pace</h3><p>Short lessons you can finish between tasks. Your progress is saved automatically, so you can pick up where you left off.</p></div>
    <div class="feature"><div class="ic">✅</div><h3>Prove it with a quiz</h3><p>Every course ends with a graded assessment. Retake it as many times as you need until you pass.</p></div>
    <div class="feature"><div class="ic">🏅</div><h3>Certificates that verify</h3><p>Each certificate has a unique ID and public verification page, so employers can confirm it is real.</p></div></div></div></section>
  <section class="container" style="padding-bottom:40px"><div class="cta"><h2>Ready to learn something new today?</h2><p>Join ${st.students} learner${st.students === 1 ? '' : 's'} building skills for free.</p>
    <a class="btn btn-lime btn-lg" href="${S.user ? '#/courses' : '#/register'}">${S.user ? 'Browse courses' : 'Get started - it\'s free'}</a></div></section>`);
});

/* ---------- courses ---------- */
const CAT = { all: [], cats: [], f: { q: '', cat: '', lvl: '' } };
route('/courses', async alive => {
  loading(); const d = await api('/courses'); if (!alive()) return; CAT.all = d.courses; CAT.cats = d.categories; CAT.f = { q: '', cat: '', lvl: '' };
  view(`<div class="container"><div class="page-head"><span class="eyebrow">Course catalogue</span><h1>Find your next skill</h1><p>Every course is free and includes a final quiz and a certificate of completion.</p></div>
  <div class="filters"><div class="search"><input id="q" placeholder="Search courses, topics or instructors" oninput="CAT.f.q=this.value;drawCourses()"></div>
  <select id="lvl" style="width:auto" onchange="CAT.f.lvl=this.value;drawCourses()"><option value="">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
  <div class="pills mb" id="pills"></div><div id="clist"></div></div>`); drawCourses();
});
function drawCourses() {
  const f = CAT.f, q = f.q.toLowerCase();
  $('#pills').innerHTML = ['', ...CAT.cats].map((c, i) => `<button class="${f.cat === c ? 'on' : ''}" onclick="CAT.f.cat=${i ? 'CAT.cats[' + (i - 1) + ']' : "''"};drawCourses()">${c ? esc(c) : 'All'}</button>`).join('');
  const rows = CAT.all.filter(c => (!f.cat || c.category === f.cat) && (!f.lvl || c.level === f.lvl) && (!q || (c.title + c.summary + c.category + c.instructor).toLowerCase().includes(q)));
  $('#clist').innerHTML = rows.length ? `<div class="grid" style="margin-bottom:60px">${rows.map(courseCard).join('')}</div>` : `<div class="empty"><div class="big">🔎</div><h3>No courses match your search</h3><p class="muted">Try different keywords or clear the filters.</p></div>`;
}

/* ---------- course detail ---------- */
route('/course/([a-z0-9-]+)', async (slug, alive) => {
  loading(); const c = await api('/courses/' + slug); if (!alive()) return; const me = !!S.user, enr = c.enrolled_me, pct = c.total ? Math.round(c.done * 100 / c.total) : 0;
  const cta = enr ? (c.certificate ? `<a class="btn btn-lime btn-lg btn-block" href="#/certificate/${c.certificate}">🏅 View your certificate</a>` : `<a class="btn btn-primary btn-lg btn-block" href="#/learn/${c.slug}">${c.done ? 'Continue learning' : 'Start learning'} →</a>`)
    : `<button class="btn btn-primary btn-lg btn-block" onclick="A.enroll(${c.id},'${c.slug}')">Enroll for free</button>`;
  view(`<section class="cd-hero"><div class="container"><span class="chip free">Free course</span><h1 style="margin-top:16px">${esc(c.title)}</h1><p>${esc(c.summary)}</p>
    <div class="meta"><span>📶 ${esc(c.level)}</span><span>📖 ${plural(c.lesson_count, 'lesson')}</span><span>⏱ ${esc(c.duration || mins(c.minutes))}</span><span>👥 ${plural(c.enrolled, 'learner')}</span><span>👤 ${esc(c.instructor || 'Instructor')}</span></div></div></section>
  <div class="container cd-grid"><div>
    <h2 style="font-size:30px">About this course</h2><div class="prose mb">${md(c.description) || `<p>${esc(c.summary)}</p>`}</div>
    ${c.outcomes.length ? `<h2 style="font-size:30px">What you will learn</h2><ul class="out mb">${c.outcomes.map(o => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
    <h2 style="font-size:30px">Course content</h2><p class="muted">${plural(c.lesson_count, 'lesson')} · final quiz${c.question_count ? ` (${plural(c.question_count, 'question')}, ${c.pass_mark}% to pass)` : ''}</p>
    <div class="curr mb">${c.lessons.map((l, i) => `<div class="curr-i"><span class="n">${i + 1}</span><b>${esc(l.title)}</b>${l.has_video ? '<span title="Video">🎬</span>' : ''}<small>${mins(l.minutes)}</small></div>`).join('')}${c.question_count ? `<div class="curr-i" style="background:#fbf9f5"><span class="n">★</span><b>Final quiz &amp; certificate</b><small>${c.question_count} questions</small></div>` : ''}</div>
    ${c.instructor ? `<h2 style="font-size:30px">Your instructor</h2><div class="panel instr"><div class="av">${esc(initials(c.instructor))}</div><div><b style="font-size:18px">${esc(c.instructor)}</b><p class="muted" style="margin:4px 0 0">${esc(c.instructor_bio)}</p></div></div>` : ''}
  </div><aside class="cd-side"><div class="panel">${coverArt({ ...c, category: '' })}<div class="price">Free</div><p class="muted">Forever. No credit card required.</p>
    ${enr ? `<div class="bar ${pct === 100 ? 'ok' : ''}" style="margin:6px 0 6px"><i style="width:${pct}%"></i></div><p class="muted" style="font-size:13px">${c.done} of ${c.total} lessons complete</p>` : ''}${cta}
    <ul><li>📖 ${plural(c.lesson_count, 'lesson')}</li><li>✅ Final quiz with instant results</li><li>🏅 Verifiable certificate</li><li>♾ Lifetime access</li></ul></div></aside></div>`);
});

/* ---------- actions ---------- */
const A = {
  async enroll(id, slug) {
    if (!S.user) { sessionStorage.setItem('next', '/course/' + slug); toast('Please sign in to enroll.'); return go('/login'); }
    try { await api(`/courses/${id}/enroll`, { method: 'POST', body: {} }); toast('You are enrolled. Happy learning!', 'ok'); go('/learn/' + slug); } catch (e) { fail(e); }
  },
  async login(e) {
    e.preventDefault(); const f = e.target, b = $('button[type=submit]', f); b.disabled = true; $('.err', f)?.remove();
    try { const d = await api('/login', { method: 'POST', body: { email: f.email.value, password: f.password.value } }); S.user = d.user; await refreshMe(); renderNav(); renderFooter(); afterAuth(); }
    catch (er) { f.insertAdjacentHTML('afterbegin', `<div class="err">${esc(er.message)}</div>`); b.disabled = false; }
  },
  async register(e) {
    e.preventDefault(); const f = e.target, b = $('button[type=submit]', f); $('.err', f)?.remove();
    if (f.password.value !== f.confirm.value) return f.insertAdjacentHTML('afterbegin', '<div class="err">Passwords do not match.</div>');
    b.disabled = true;
    try { const d = await api('/register', { method: 'POST', body: { name: f.name.value, email: f.email.value, password: f.password.value } }); S.user = d.user; renderNav(); renderFooter(); toast('Welcome aboard! Your account is ready.', 'ok'); afterAuth(); }
    catch (er) { f.insertAdjacentHTML('afterbegin', `<div class="err">${esc(er.message)}</div>`); b.disabled = false; }
  },
  async contact(e) {
    e.preventDefault(); const f = e.target; try { await api('/contact', { method: 'POST', body: { name: f.name.value, email: f.email.value, subject: f.subject.value, message: f.message.value } }); f.reset(); toast('Message sent. We will get back to you soon.', 'ok'); } catch (er) { fail(er); }
  },
  async profile(e) { e.preventDefault(); try { await api('/me/profile', { method: 'POST', body: { name: e.target.name.value } }); await refreshMe(); renderNav(); toast('Profile updated.', 'ok'); } catch (er) { fail(er); } },
  async password(e) {
    e.preventDefault(); const f = e.target; try { await api('/me/password', { method: 'POST', body: { old: f.old.value, new: f.new_.value } }); f.reset(); toast('Password changed.', 'ok'); } catch (er) { fail(er); }
  },
  verify(e) { e.preventDefault(); const v = e.target.code.value.trim(); if (v) go('/certificate/' + encodeURIComponent(v.toUpperCase())); }
};

/* ---------- auth pages ---------- */
const authArt = (h, items) => `<div class="auth-art"><h2>${h}</h2><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul><svg class="arc" viewBox="0 0 200 200"><g fill="none" stroke="#fff" stroke-width="6"><circle cx="100" cy="100" r="30"/><circle cx="100" cy="100" r="60"/><circle cx="100" cy="100" r="90"/></g></svg></div>`;
route('/login', async alive => {
  if (S.user) return go('/dashboard');
  view(`<div class="auth">${authArt('Welcome back.<br>Pick up where you left off.', ['Your progress is saved automatically', 'Resume any course in one click', 'Download your certificates anytime'])}
  <div class="auth-form"><div class="box"><h1>Sign in</h1><p class="muted mb">New here? <a href="#/register">Create a free account</a></p>
  <form onsubmit="A.login(event)"><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
  <div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password" placeholder="Your password"></div>
  <button class="btn btn-primary btn-lg btn-block" type="submit">Sign in</button></form></div></div></div>`);
});
route('/register', async alive => {
  if (S.user) return go('/dashboard');
  view(`<div class="auth">${authArt('Learn for free.<br>Get certified.', ['Every course is 100% free', 'Instant quiz results', 'Certificates with a public verification link'])}
  <div class="auth-form"><div class="box"><h1>Create your account</h1><p class="muted mb">Already registered? <a href="#/login">Sign in</a></p>
  <form onsubmit="A.register(event)"><div class="field"><label>Full name</label><input name="name" required minlength="2" autocomplete="name" placeholder="As it should appear on your certificate"></div>
  <div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
  <div class="two"><div class="field"><label>Password</label><input name="password" type="password" required minlength="6" autocomplete="new-password" placeholder="6+ characters"></div>
  <div class="field"><label>Confirm</label><input name="confirm" type="password" required autocomplete="new-password" placeholder="Repeat password"></div></div>
  <button class="btn btn-primary btn-lg btn-block" type="submit">Create account</button></form></div></div></div>`);
});

/* ---------- student dashboard ---------- */
route('/dashboard', async alive => {
  if (!requireLogin()) return; loading(); const d = await api('/my/courses'); if (!alive()) return; const cs = d.courses;
  const lessons = cs.reduce((a, c) => a + c.done, 0), certs = cs.filter(c => c.certificate).length, active = cs.filter(c => !c.certificate).length;
  view(`<div class="container" style="padding-bottom:70px"><div class="page-head" style="padding-bottom:30px"><span class="eyebrow">My learning</span><h1>Hello, ${esc(S.user.name.split(' ')[0])} 👋</h1><p>Here is where you stand. Keep the momentum going.</p></div>
  <div class="stats"><div class="stat"><b>${cs.length}</b><span>Courses enrolled</span></div><div class="stat"><b>${active}</b><span>In progress</span></div><div class="stat"><b>${lessons}</b><span>Lessons completed</span></div><div class="stat"><b>${certs}</b><span>Certificates earned</span></div></div>
  <div class="row between mb"><h2 style="margin:0;font-size:30px">My courses</h2><a class="btn btn-ghost btn-sm" href="#/courses">Find more courses</a></div>
  ${cs.length ? cs.map(c => { const pct = c.total ? Math.round(c.done * 100 / c.total) : 0; return `<div class="mc">${coverArt({ ...c, category: '' })}<div><h3>${esc(c.title)}</h3><div class="bar ${c.certificate ? 'ok' : ''}"><i style="width:${pct}%"></i></div>
    <div class="meta" style="margin-top:8px"><span>${c.done}/${c.total} lessons · ${pct}%</span>${c.best != null ? `<span>Best quiz score: ${c.best}%</span>` : ''}${c.certificate ? '<span class="chip ok">Completed</span>' : ''}</div></div>
    <div class="row">${c.certificate ? `<a class="btn btn-lime btn-sm" href="#/certificate/${c.certificate}">🏅 Certificate</a>` : `<a class="btn btn-primary btn-sm" href="#/learn/${c.slug}">${pct === 100 ? 'Take the quiz' : c.done ? 'Continue' : 'Start'} →</a>`}</div></div>`; }).join('')
    : `<div class="empty"><div class="big">🚀</div><h3>You have not enrolled in any course yet</h3><p class="muted">Pick a course and start learning for free.</p><a class="btn btn-primary" href="#/courses">Browse courses</a></div>`}</div>`);
});

/* ---------- learn ---------- */
const L = { data: null, cur: 0 };
route('/learn/([a-z0-9-]+)(?:/(\\d+))?', async (slug, lid, alive) => {
  if (!requireLogin()) return;
  if (!L.data || L.data.slug !== slug || !lid) { loading(); L.data = await api('/learn/' + slug); if (!alive()) return; }
  const d = L.data; let i = lid ? d.lessons.findIndex(l => l.id == lid) : d.lessons.findIndex(l => !d.completed.includes(l.id));
  if (i < 0) i = lid ? 0 : Math.max(0, d.lessons.length - 1); L.cur = i; drawLearn();
});
function drawLearn() {
  const d = L.data, l = d.lessons[L.cur], done = d.completed, all = d.lessons.length && done.length >= d.lessons.length, pct = d.lessons.length ? Math.round(done.length * 100 / d.lessons.length) : 0;
  const hasQuiz = d.question_count > 0, next = d.lessons[L.cur + 1], prev = d.lessons[L.cur - 1], isDone = l && done.includes(l.id);
  if (!l) return view(`<div class="container section center"><h2>This course has no lessons yet.</h2><a class="btn btn-primary" href="#/courses">Back to courses</a></div>`, 'learn');
  view(`<div class="learn"><aside class="l-side"><a href="#/course/${d.slug}" class="muted" style="font-size:13px;font-weight:600">← Course overview</a><h3 style="margin-top:12px">${esc(d.title)}</h3>
    <div class="bar ${all ? 'ok' : ''}"><i style="width:${pct}%"></i></div><p class="muted" style="font-size:13px;margin:8px 0 14px">${done.length} of ${d.lessons.length} lessons · ${pct}%</p>
    ${d.lessons.map((x, k) => `<a class="l-item ${k === L.cur ? 'on' : ''} ${done.includes(x.id) ? 'done' : ''}" href="#/learn/${d.slug}/${x.id}"><span class="dot">${done.includes(x.id) ? '✓' : ''}</span><span>${esc(x.title)}<br><small class="muted" style="font-weight:500">${mins(x.minutes)}</small></span></a>`).join('')}
    ${hasQuiz ? `<a class="l-item ${all ? '' : 'locked'}" href="${all ? '#/quiz/' + d.slug : '#'}" ${all ? '' : 'onclick="toast(\'Complete all lessons to unlock the final quiz.\');return false"'}><span class="dot" style="background:${all ? 'var(--brand)' : ''};border-color:${all ? 'var(--brand)' : ''}">${all ? '★' : '🔒'}</span><span>Final quiz &amp; certificate<br><small class="muted" style="font-weight:500">${d.question_count} questions · ${d.pass_mark}% to pass</small></span></a>` : ''}
    ${d.certificate ? `<a class="btn btn-lime btn-sm btn-block mt" href="#/certificate/${d.certificate}">🏅 View certificate</a>` : ''}</aside>
  <section class="l-main">${d.enrolled === false ? '<div class="notice">👀 Preview mode: you are viewing this course as an administrator. Progress is not tracked.</div>' : ''}
    <span class="chip">Lesson ${L.cur + 1} of ${d.lessons.length}</span><h1 style="margin-top:12px">${esc(l.title)}</h1>${videoEmbed(l.video_url)}<div class="prose">${md(l.content) || '<p class="muted">No written content for this lesson.</p>'}</div>
    <div class="l-nav"><div>${prev ? `<a class="btn btn-ghost" href="#/learn/${d.slug}/${prev.id}">← Previous</a>` : ''}</div>
    <div class="row">${d.enrolled === false ? (next ? `<a class="btn btn-primary" href="#/learn/${d.slug}/${next.id}">Next →</a>` : '')
      : isDone ? `<button class="btn btn-ghost" onclick="A2.complete(${l.id},false)">Mark as not done</button>${next ? `<a class="btn btn-primary" href="#/learn/${d.slug}/${next.id}">Next lesson →</a>` : hasQuiz && all ? `<a class="btn btn-lime" href="#/quiz/${d.slug}">Take the final quiz ★</a>` : ''}`
      : `<button class="btn btn-primary" onclick="A2.complete(${l.id},true,${next ? next.id : 0})">${next ? 'Complete &amp; continue →' : 'Complete lesson ✓'}</button>`}</div></div></section></div>`, 'learn');
}
const A2 = {
  async complete(id, doneFlag, nextId) {
    try {
      const r = await api(`/lessons/${id}/complete`, { method: 'POST', body: { done: doneFlag } }); const d = L.data;
      d.completed = doneFlag ? [...new Set([...d.completed, id])] : d.completed.filter(x => x !== id);
      if (doneFlag && r.done === r.total && d.question_count) { toast('All lessons complete! The final quiz is unlocked 🎉', 'ok'); }
      if (doneFlag && nextId) go(`/learn/${d.slug}/${nextId}`); else drawLearn();
    } catch (e) { fail(e); }
  }
};

/* ---------- quiz ---------- */
const Q = { d: null, ans: {}, phase: 'intro', res: null };
route('/quiz/([a-z0-9-]+)', async (slug, alive) => {
  if (!requireLogin()) return; loading();
  try { Q.d = await api('/quiz/' + slug); } catch (e) { if (!alive()) return; toast(e.message, 'bad'); return go('/learn/' + slug); }
  if (!alive()) return; Q.ans = {}; Q.phase = 'intro'; Q.res = null; drawQuiz();
});
function drawQuiz() {
  const d = Q.d, c = d.course, n = d.questions.length;
  if (Q.phase === 'intro') return view(`<div class="narrow" style="padding:56px 0 80px"><a href="#/learn/${c.slug}" class="muted" style="font-weight:600">← Back to lessons</a><span class="eyebrow" style="margin-top:26px">Final quiz</span><h1 style="font-size:44px">${esc(c.title)}</h1>
    <div class="panel mb"><div class="row" style="gap:30px"><div><b style="font:600 34px var(--serif)">${n}</b><br><span class="muted">Questions</span></div><div><b style="font:600 34px var(--serif)">${c.pass_mark}%</b><br><span class="muted">To pass</span></div><div><b style="font:600 34px var(--serif)">∞</b><br><span class="muted">Retakes</span></div></div>
    <p class="muted" style="margin:18px 0 0">Choose one answer per question. When you pass you will receive your certificate immediately. You can retake the quiz as often as you like.</p></div>
    ${d.certificate ? `<div class="notice" style="background:var(--ok-l);border-color:#b8e6d1">🏅 You have already earned a certificate for this course. <a href="#/certificate/${d.certificate}"><b>View it</b></a></div>` : ''}
    ${d.attempts.length ? `<h3>Your recent attempts</h3><div class="panel" style="padding:8px 22px">${d.attempts.map(a => `<div class="list-r"><span>${fmtDate(a.created_at)}</span><span>${a.score}/${a.total} · <b>${a.percent}%</b></span><span class="chip ${a.passed ? 'ok' : 'bad'}">${a.passed ? 'Passed' : 'Not passed'}</span></div>`).join('')}</div>` : ''}
    <button class="btn btn-primary btn-lg mt" onclick="Q.phase='taking';drawQuiz()">${d.attempts.length ? 'Retake quiz' : 'Start quiz'} →</button></div>`);
  if (Q.phase === 'taking') return view(`<div class="narrow" style="padding:40px 0 0"><span class="eyebrow">${esc(c.title)}</span><h1 style="font-size:34px">Final quiz</h1>
    ${d.questions.map((q, qi) => `<div class="q"><span class="num">QUESTION ${qi + 1} OF ${n}</span><h3>${esc(q.text)}</h3>${q.options.map((o, oi) => o ? `<div class="opt" data-q="${q.id}" data-o="${oi}" onclick="pick(${q.id},${oi},this)"><span class="k">${'ABCDEF'[oi]}</span>${esc(o)}</div>` : '').join('')}</div>`).join('')}
    <div class="qbar"><span id="qcount" class="muted" style="font-weight:600">0 of ${n} answered</span><button class="btn btn-primary" id="qsub" disabled onclick="submitQuiz()">Submit answers</button></div></div>`);
  const r = Q.res, col = r.passed ? 'var(--ok)' : 'var(--coral)';
  view(`<div class="narrow" style="padding:56px 0 80px"><div class="center mb"><div class="score" style="background:conic-gradient(${col} ${r.percent * 3.6}deg,#e8e2d6 0)"><span>${r.percent}%</span></div>
    <h1 style="font-size:40px">${r.passed ? 'You passed! 🎉' : 'Not quite there yet'}</h1><p class="muted">You answered ${r.score} of ${r.total} correctly. The pass mark is ${r.pass_mark}%.</p>
    <div class="row" style="justify-content:center">${r.passed ? `<a class="btn btn-lime btn-lg" href="#/certificate/${r.certificate}">🏅 Get your certificate</a>` : `<button class="btn btn-primary btn-lg" onclick="Q.ans={};Q.phase='taking';drawQuiz()">Try again</button>`}<a class="btn btn-ghost btn-lg" href="#/learn/${c.slug}">${r.passed ? 'Back to course' : 'Review lessons'}</a></div></div>
    <h2 style="font-size:28px">Review your answers</h2>${r.review.map((q, qi) => `<div class="q"><span class="num">QUESTION ${qi + 1} · ${q.ok ? '<span style="color:var(--ok)">CORRECT</span>' : '<span style="color:var(--bad)">INCORRECT</span>'}</span><h3>${esc(q.text)}</h3>
    ${q.options.map((o, oi) => o ? `<div class="opt static ${oi === q.correct ? 'good' : oi === q.chosen ? 'wrong' : ''}"><span class="k">${oi === q.correct ? '✓' : oi === q.chosen ? '✗' : 'ABCDEF'[oi]}</span>${esc(o)}</div>` : '').join('')}</div>`).join('')}</div>`);
}
function pick(qid, oi, el) {
  Q.ans[qid] = oi; $$(`.opt[data-q="${qid}"]`).forEach(o => o.classList.remove('sel')); el.classList.add('sel');
  const n = Object.keys(Q.ans).length, t = Q.d.questions.length; $('#qcount').textContent = `${n} of ${t} answered`; $('#qsub').disabled = n < t;
}
async function submitQuiz() {
  const b = $('#qsub'); b.disabled = true; b.textContent = 'Grading…';
  try { Q.res = await api(`/quiz/${Q.d.course.slug}/submit`, { method: 'POST', body: { answers: Q.ans } }); Q.phase = 'result'; if (Q.res.passed) Q.d.certificate = Q.res.certificate; drawQuiz(); window.scrollTo(0, 0); } catch (e) { fail(e); b.disabled = false; b.textContent = 'Submit answers'; }
}

/* ---------- certificates ---------- */
route('/certificates', async alive => {
  if (!requireLogin()) return; loading(); const d = await api('/my/certificates'); if (!alive()) return;
  view(`<div class="container" style="padding-bottom:70px"><div class="page-head"><span class="eyebrow">Achievements</span><h1>My certificates</h1><p>Download, print or share a verification link for each certificate you earn.</p></div>
  ${d.certificates.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">${d.certificates.map(c => `<a class="cert-card" href="#/certificate/${c.code}"><div style="padding:10px 10px 0">${certSVG(c).replace('width="1100" height="780"', 'style="width:100%;height:auto;display:block"')}</div><div class="pad"><b>${esc(c.course)}</b><div class="muted" style="font-size:13px">Issued ${fmtDate(c.issued_at)} · ${c.percent}%</div></div></a>`).join('')}</div>`
    : `<div class="empty"><div class="big">🏅</div><h3>No certificates yet</h3><p class="muted">Finish a course and pass its final quiz to earn your first certificate.</p><a class="btn btn-primary" href="#/dashboard">Go to my courses</a></div>`}</div>`);
});
route('/certificate/([A-Za-z0-9-]+)', async (code, alive) => {
  loading(); const d = await api('/verify/' + code); if (!alive()) return; const c = d.certificate, mine = S.user && S.user.name === c.student;
  view(`<div class="container" style="padding:40px 0 80px"><div class="row between mb"><div><span class="chip ok">✓ Verified certificate</span><h1 style="font-size:36px;margin:12px 0 0">${esc(c.student)}</h1><p class="muted" style="margin:0">completed <b>${esc(c.course)}</b> on ${fmtDate(c.issued_at)} with a score of ${c.percent}%.</p></div>
    <div class="row"><button class="btn btn-primary" onclick="downloadCertPNG('${esc(c.code)}')">⬇ Download PNG</button><button class="btn btn-dark" onclick="window.print()">🖨 Print / Save as PDF</button><button class="btn btn-ghost" onclick="navigator.clipboard.writeText(location.href).then(()=>toast('Link copied','ok'))">🔗 Copy link</button></div></div>
    <div class="cert-box cert-print" id="certsvg">${certSVG(c)}</div><p class="muted center mt" style="font-size:13.5px">Anyone can verify this certificate at <b>${esc(location.host)}/#/verify</b> using ID <b>${esc(c.code)}</b>.</p></div>`);
});
route('/verify', async alive => {
  view(`<div class="narrow" style="padding:70px 0 100px;text-align:center"><span class="eyebrow">Verification</span><h1 style="font-size:46px">Verify a certificate</h1><p class="muted mb">Enter the certificate ID printed at the bottom of the certificate.</p>
  <form onsubmit="A.verify(event)" class="row" style="justify-content:center;flex-wrap:nowrap"><input name="code" placeholder="e.g. SA-2026-AB12CD34" style="max-width:360px;text-transform:uppercase" required><button class="btn btn-primary" type="submit">Verify</button></form></div>`);
});

/* ---------- profile ---------- */
route('/profile', async alive => {
  if (!requireLogin()) return;
  view(`<div class="narrow" style="padding:56px 0 80px"><span class="eyebrow">Account</span><h1 style="font-size:44px">Profile</h1>
  <div class="panel mb"><h3>Your details</h3><p class="muted">Your name appears on certificates, so make sure it is correct. New certificates use your current name.</p><form onsubmit="A.profile(event)"><div class="field"><label>Full name</label><input name="name" value="${esc(S.user.name)}" required minlength="2"></div>
  <div class="field"><label>Email</label><input value="${esc(S.user.email)}" disabled></div><button class="btn btn-primary">Save changes</button></form></div>
  <div class="panel"><h3>Change password</h3><form onsubmit="A.password(event)"><div class="field"><label>Current password</label><input name="old" type="password" required></div><div class="field"><label>New password</label><input name="new_" type="password" minlength="6" required></div><button class="btn btn-dark">Update password</button></form></div></div>`);
});

/* ---------- about & contact ---------- */
route('/about', async alive => {
  const n = esc(S.settings.site_name);
  view(`<div class="container"><div class="page-head"><span class="eyebrow">About us</span><h1>Education should not have a price tag.</h1><p>${n} exists to make practical, job-ready learning free for everyone, and to give learners proof of what they have achieved.</p></div>
  <div class="features" style="margin:30px 0 70px"><div class="feature"><div class="ic">🎯</div><h3>Practical first</h3><p>Lessons focus on the skills used on the job today, explained in plain language with real examples.</p></div><div class="feature"><div class="ic">🤝</div><h3>Free, always</h3><p>No subscriptions and no paywalls. Every course, quiz and certificate is free for every learner.</p></div><div class="feature"><div class="ic">🔍</div><h3>Verifiable results</h3><p>Certificates carry a unique ID and a public verification page, so your achievement can be trusted.</p></div></div>
  <div class="cta" style="margin-bottom:60px"><h2>Join the community of learners</h2><p>Create your free account and start your first course today.</p><a class="btn btn-lime btn-lg" href="${S.user ? '#/courses' : '#/register'}">${S.user ? 'Browse courses' : 'Get started'}</a></div></div>`);
});
route('/contact', async alive => {
  view(`<div class="container" style="padding-bottom:80px"><div class="page-head"><span class="eyebrow">Contact</span><h1>We would love to hear from you</h1><p>Questions, feedback or a course idea? Send us a message.</p></div>
  <div class="cd-grid" style="padding-top:10px"><div class="panel"><form onsubmit="A.contact(event)"><div class="two"><div class="field"><label>Your name</label><input name="name" required value="${esc(S.user?.name || '')}"></div><div class="field"><label>Email</label><input name="email" type="email" required value="${esc(S.user?.email || '')}"></div></div>
  <div class="field"><label>Subject</label><input name="subject"></div><div class="field"><label>Message</label><textarea name="message" required style="min-height:160px"></textarea></div><button class="btn btn-primary btn-lg">Send message</button></form></div>
  <aside class="panel" style="background:var(--ink);color:#fff;border:0"><h3 style="color:#fff">Get in touch</h3><p style="color:#b9bccb">✉ ${esc(S.settings.contact_email || '')}</p><p style="color:#b9bccb;margin:0">We usually reply within two working days.</p></aside></div></div>`);
});
