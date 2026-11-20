/* SkillArc admin panel */
S.unread = 0;
function shell(active, title, inner, actions = '') {
  const it = (k, href, label) => `<a href="${href}" class="${active === k ? 'on' : ''}">${label}${k === 'messages' && S.unread ? `<span class="badge">${S.unread}</span>` : ''}</a>`;
  view(`<div class="adm"><aside class="a-side"><a class="brand" href="#/admin">${logo(30)}${esc(S.settings.site_name)}</a>
    ${it('dash', '#/admin', '📊 Dashboard')}${it('courses', '#/admin/courses', '📚 Courses')}${it('students', '#/admin/students', '🎓 Students')}${it('certs', '#/admin/certificates', '🏅 Certificates')}${it('messages', '#/admin/messages', '✉ Messages')}${it('settings', '#/admin/settings', '⚙ Settings')}
    <div class="sp"></div><a href="#/">↗ View website</a><a href="#/profile">👤 My account</a><button onclick="logout()">⎋ Sign out</button></aside>
    <section class="a-main"><div class="a-top"><h1>${title}</h1><div class="row">${actions}</div></div>${inner}</section></div>`, 'admin');
}
const guard = () => requireLogin('admin');

/* ---------- dashboard ---------- */
route('/admin', async alive => {
  if (!guard()) return; loading(); const d = await api('/admin/stats'); if (!alive()) return; S.unread = d.unread;
  const max = Math.max(1, ...d.chart.map(x => Math.max(x.enrollments, x.signups)));
  shell('dash', 'Dashboard', `${d.default_password ? '<div class="notice">⚠ You are still using the default admin password. <a href="#/profile"><b>Change it now</b></a> to keep your site secure.</div>' : ''}
  <div class="stats"><div class="stat"><b>${d.students}</b><span>Students</span></div><div class="stat"><b>${d.courses}</b><span>Courses</span></div><div class="stat"><b>${d.enrollments}</b><span>Enrollments</span></div><div class="stat"><b>${d.certificates}</b><span>Certificates issued</span></div></div>
  <div class="adm-grid"><div class="panel"><h3>Last 14 days</h3><div class="legend"><span><i style="background:var(--brand)"></i>Enrollments</span><span><i style="background:var(--lime);border:1px solid #bfe03a"></i>New students</span></div>
    <div class="chart">${d.chart.map(x => `<div class="col" title="${x.day}: ${x.enrollments} enrollments, ${x.signups} sign-ups"><div class="bars"><i style="height:${x.enrollments / max * 100}%;background:var(--brand)"></i><i style="height:${x.signups / max * 100}%;background:var(--lime)"></i></div>${x.day.slice(8)}</div>`).join('')}</div></div>
  <div class="panel"><h3>Top courses</h3>${d.top.map(t => `<div class="list-r"><span>${esc(t.title)}</span><b>${t.n}</b></div>`).join('') || '<p class="muted">No data yet.</p>'}</div></div>
  <div class="panel mt"><div class="row between"><h3 style="margin:0">Recent enrollments</h3><span class="muted" style="font-size:13px">${d.attempts} quiz attempts in total · ${d.unread} unread message${d.unread === 1 ? '' : 's'}</span></div>
    ${d.recent.map(r => `<div class="list-r"><span><b>${esc(r.name)}</b> enrolled in ${esc(r.title)}</span><span class="muted">${fmtDate(r.created_at)}</span></div>`).join('') || '<p class="muted">Nobody has enrolled yet.</p>'}</div>`,
    '<a class="btn btn-primary" href="#/admin/courses/new">+ New course</a>');
});

/* ---------- courses list ---------- */
let CL = [];
route('/admin/courses', async alive => {
  if (!guard()) return; loading(); const d = await api('/admin/courses'); if (!alive()) return; CL = d.courses;
  shell('courses', 'Courses', `<div class="tbl-wrap"><table><thead><tr><th>Course</th><th>Lessons</th><th>Quiz</th><th>Learners</th><th>Status</th><th></th></tr></thead><tbody>
  ${d.courses.map(c => `<tr><td><div class="t-title">${coverArt({ ...c, category: '' })}<div><b>${esc(c.title)}</b><span class="muted" style="font-size:13px">${esc(c.category)} · ${esc(c.level)}</span></div></div></td><td>${c.lesson_count}</td><td>${c.question_count} Qs</td><td>${c.enrolled}</td>
  <td><span class="chip ${c.published ? 'ok' : 'warn'}">${c.published ? 'Published' : 'Draft'}</span></td><td><div class="t-act"><a class="btn btn-ghost btn-sm" href="#/course/${c.slug}">View</a><a class="btn btn-dark btn-sm" href="#/admin/courses/${c.id}">Edit</a><button class="btn btn-danger btn-sm" onclick="AD.delCourse(${c.id})">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="center muted" style="padding:40px">No courses yet. Create your first one!</td></tr>'}</tbody></table></div>`,
    '<a class="btn btn-primary" href="#/admin/courses/new">+ New course</a>');
});

/* ---------- course editor ---------- */
const E = { c: null, tab: 'details', outcomes: '' };
const blankCourse = () => ({ id: null, title: '', summary: '', description: '', category: '', level: 'Beginner', duration: '', instructor: '', instructor_bio: '', outcomes: [], cover: '', theme: 0, published: 1, pass_mark: 70,
  lessons: [{ title: '', video_url: '', content: '', minutes: 5 }], questions: [{ text: '', options: ['', '', '', ''], answer: 0 }] });
route('/admin/courses/(new|\\d+)', async (id, alive) => {
  if (!guard()) return; loading(); const c = id === 'new' ? blankCourse() : await api('/admin/courses/' + id); if (!alive()) return;
  c.questions.forEach(q => { while (q.options.length < 4) q.options.push(''); }); E.c = c; E.tab = 'details'; E.outcomes = (c.outcomes || []).join('\n'); drawEditor();
});
function drawEditor() {
  const c = E.c;
  shell('courses', c.id ? 'Edit course' : 'New course', `<div class="tabs">${[['details', 'Details'], ['lessons', `Lessons (${c.lessons.length})`], ['quiz', `Final quiz (${c.questions.length})`]].map(([k, l]) => `<button class="${E.tab === k ? 'on' : ''}" onclick="E.tab='${k}';drawEditor()">${l}</button>`).join('')}</div><div id="etab">${editorTab()}</div>`,
    `<a class="btn btn-ghost" href="#/admin/courses">Cancel</a><button class="btn btn-primary" onclick="AD.save()">💾 Save course</button>`);
}
const bind = (path, v) => { const p = path.split('.'); let o = E.c; while (p.length > 1) o = o[p.shift()]; o[p[0]] = v; };
const ev = (path, extra = '') => `oninput="bind('${path}',this.value)${extra}"`;
function editorTab() {
  const c = E.c;
  if (E.tab === 'details') return `<div class="panel"><div class="field"><label>Course title *</label><input value="${esc(c.title)}" ${ev('title')} placeholder="e.g. Introduction to Data Science"></div>
    <div class="field"><label>Short summary</label><input value="${esc(c.summary)}" ${ev('summary')} maxlength="300" placeholder="One sentence shown on course cards"></div>
    <div class="two"><div class="field"><label>Category</label><input value="${esc(c.category)}" ${ev('category')} placeholder="e.g. Programming"></div><div class="field"><label>Level</label><select onchange="bind('level',this.value)">${['Beginner', 'Intermediate', 'Advanced'].map(l => `<option ${c.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="two"><div class="field"><label>Duration</label><input value="${esc(c.duration)}" ${ev('duration')} placeholder="e.g. 4 hours"></div><div class="field"><label>Instructor name</label><input value="${esc(c.instructor)}" ${ev('instructor')}></div></div>
    <div class="field"><label>Instructor bio</label><input value="${esc(c.instructor_bio)}" ${ev('instructor_bio')}></div>
    <div class="field"><label>Full description</label><textarea ${ev('description')} style="min-height:150px">${esc(c.description)}</textarea><div class="hint">Supports simple formatting: ## Heading, - bullet, **bold**.</div></div>
    <div class="field"><label>What students will learn (one per line)</label><textarea oninput="E.outcomes=this.value" style="min-height:120px">${esc(E.outcomes)}</textarea></div>
    <div class="field"><label>Cover image</label><div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div style="width:240px;flex:none" id="coverprev">${coverArt({ ...c, category: '' })}</div><div class="grow">
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onchange="AD.upload(this)"><div class="hint">Upload a 16:9 image (PNG, JPG, WEBP up to 4 MB), or leave empty to use the generated artwork below.</div>
      ${c.cover ? '<button class="btn btn-ghost btn-sm mt" onclick="E.c.cover=\'\';drawEditor()">Remove image</button>' : ''}
      <label style="margin-top:16px">Generated artwork colour</label><div class="swatches">${THEMES.map((t, i) => `<button class="${(c.theme || 0) === i ? 'on' : ''}" style="background:linear-gradient(135deg,${t[0]},${t[1]})" onclick="E.c.theme=${i};E.c.cover='';drawEditor()" aria-label="Theme ${i + 1}"></button>`).join('')}</div></div></div></div>
    <label class="check"><input type="checkbox" ${c.published ? 'checked' : ''} onchange="bind('published',this.checked?1:0)"> Published (visible to students)</label></div>`;
  if (E.tab === 'lessons') return `${c.lessons.map((l, i) => `<div class="edit-card"><div class="hd"><span class="chip">Lesson ${i + 1}</span><span class="grow"></span>
    <button class="btn btn-ghost btn-sm" ${i === 0 ? 'disabled' : ''} onclick="AD.move('lessons',${i},-1)">↑</button><button class="btn btn-ghost btn-sm" ${i === c.lessons.length - 1 ? 'disabled' : ''} onclick="AD.move('lessons',${i},1)">↓</button><button class="btn btn-danger btn-sm" onclick="AD.remove('lessons',${i})">Delete</button></div>
    <div class="two"><div class="field"><label>Lesson title *</label><input value="${esc(l.title)}" ${ev(`lessons.${i}.title`)}></div><div class="field"><label>Minutes</label><input type="number" min="1" max="600" value="${l.minutes}" ${ev(`lessons.${i}.minutes`)}></div></div>
    <div class="field"><label>Video link (optional)</label><input value="${esc(l.video_url)}" ${ev(`lessons.${i}.video_url`)} placeholder="YouTube, Vimeo or .mp4 link"></div>
    <div class="field" style="margin:0"><label>Lesson content</label><textarea ${ev(`lessons.${i}.content`)} style="min-height:170px" placeholder="Write the lesson here...">${esc(l.content)}</textarea><div class="hint">Formatting: ## Heading, ### Sub-heading, - bullets, 1. numbers, **bold**, \`code\`, and \`\`\` code blocks.</div></div></div>`).join('')}
    <button class="btn btn-dark" onclick="AD.add('lessons')">+ Add lesson</button>`;
  return `<div class="panel mb"><div class="field" style="max-width:240px;margin:0"><label>Pass mark (%)</label><input type="number" min="1" max="100" value="${c.pass_mark}" ${ev('pass_mark')}><div class="hint">Students need at least this score to earn the certificate.</div></div></div>
  ${c.questions.map((q, i) => `<div class="edit-card"><div class="hd"><span class="chip">Question ${i + 1}</span><span class="grow"></span><button class="btn btn-ghost btn-sm" ${i === 0 ? 'disabled' : ''} onclick="AD.move('questions',${i},-1)">↑</button><button class="btn btn-ghost btn-sm" ${i === c.questions.length - 1 ? 'disabled' : ''} onclick="AD.move('questions',${i},1)">↓</button><button class="btn btn-danger btn-sm" onclick="AD.remove('questions',${i})">Delete</button></div>
    <div class="field"><label>Question *</label><input value="${esc(q.text)}" ${ev(`questions.${i}.text`)}></div><label>Answer options <span class="muted" style="font-weight:500">(select the correct one)</span></label>
    ${q.options.map((o, k) => `<div class="opt-edit"><input type="radio" name="ans${i}" ${q.answer === k ? 'checked' : ''} onchange="bind('questions.${i}.answer',${k})" title="Correct answer"><input value="${esc(o)}" ${ev(`questions.${i}.options.${k}`)} placeholder="Option ${'ABCD'[k]}${k > 1 ? ' (optional)' : ''}"></div>`).join('')}</div>`).join('')}
  <button class="btn btn-dark" onclick="AD.add('questions')">+ Add question</button>`;
}

const AD = {
  add(k) { E.c[k].push(k === 'lessons' ? { title: '', video_url: '', content: '', minutes: 5 } : { text: '', options: ['', '', '', ''], answer: 0 }); drawEditor(); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 30); },
  remove(k, i) { E.c[k].splice(i, 1); drawEditor(); },
  move(k, i, d) { const a = E.c[k], j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; drawEditor(); },
  async upload(inp) {
    const f = inp.files[0]; if (!f) return; if (f.size > 4 * 1024 * 1024) return toast('Image must be smaller than 4 MB.', 'bad');
    const r = new FileReader(); r.onload = async () => { try { const d = await api('/admin/upload', { method: 'POST', body: { filename: f.name, data: r.result } }); E.c.cover = d.url; toast('Image uploaded.', 'ok'); drawEditor(); } catch (e) { fail(e); } }; r.readAsDataURL(f);
  },
  async save() {
    const c = E.c, body = { ...c, outcomes: E.outcomes.split('\n').map(x => x.trim()).filter(Boolean) };
    if (!c.title.trim()) { E.tab = 'details'; drawEditor(); return toast('Please enter a course title.', 'bad'); }
    try { const d = await api(c.id ? '/admin/courses/' + c.id : '/admin/courses', { method: c.id ? 'PUT' : 'POST', body }); toast('Course saved.', 'ok'); if (!c.id) go('/admin/courses/' + d.id); else { const t = E.tab; E.c = await api('/admin/courses/' + c.id); E.c.questions.forEach(q => { while (q.options.length < 4) q.options.push(''); }); E.tab = t; drawEditor(); } } catch (e) { fail(e); }
  },
  async delCourse(id) { const title = (CL.find(c => c.id === id) || {}).title || 'This course'; if (await confirmBox('Delete course?', `“${title}” and all of its lessons, quiz, progress and certificates will be permanently deleted.`, 'Delete course')) { try { await api('/admin/courses/' + id, { method: 'DELETE' }); toast('Course deleted.'); router(); } catch (e) { fail(e); } } },
  async addStudent() {
    await modal({ title: 'Add a student', body: `<div class="field"><label>Full name</label><input id="ns-n"></div><div class="field"><label>Email</label><input id="ns-e" type="email"></div><div class="field"><label>Temporary password</label><input id="ns-p" type="text" placeholder="6+ characters"></div>`,
      actions: [{ label: 'Cancel' }, { label: 'Add student', cls: 'btn-primary', fn: async ov => { await api('/admin/students', { method: 'POST', body: { name: $('#ns-n', ov).value, email: $('#ns-e', ov).value, password: $('#ns-p', ov).value } }); toast('Student added.', 'ok'); router(); } }] });
  },
  async viewStudent(id) {
    try {
      const d = await api('/admin/students/' + id);
      modal({ title: esc(d.student.name), wide: true, body: `<p class="muted">${esc(d.student.email)} · joined ${fmtDate(d.created_at)} · <span class="chip ${d.active ? 'ok' : 'bad'}">${d.active ? 'Active' : 'Disabled'}</span></p>
        ${d.courses.length ? `<div class="tbl-wrap"><table><thead><tr><th>Course</th><th>Progress</th><th>Best score</th><th>Certificate</th></tr></thead><tbody>${d.courses.map(c => `<tr><td>${esc(c.title)}</td><td>${c.done}/${c.total}</td><td>${c.best != null ? c.best + '%' : '-'}</td><td>${c.certificate ? `<a href="#/certificate/${c.certificate}" onclick="$('.ov').remove()">${c.certificate}</a>` : '-'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Not enrolled in any course yet.</p>'}`, actions: [{ label: 'Close', cls: 'btn-dark' }] });
    } catch (e) { fail(e); }
  },
  async toggleStudent(id, active) { if (!active && !await confirmBox('Disable this student?', 'They will be signed out and will not be able to log in until you enable the account again.', 'Disable')) return; try { await api('/admin/students/' + id, { method: 'PATCH', body: { active } }); toast(active ? 'Account enabled.' : 'Account disabled.', 'ok'); router(); } catch (e) { fail(e); } },
  async resetPw(id) { const name = (STU.find(s => s.id === id) || {}).name || ''; await modal({ title: 'Reset password', body: `<p class="muted">Set a new password for <b>${esc(name)}</b>.</p><div class="field"><input id="rp" type="text" placeholder="New password (6+ characters)"></div>`, actions: [{ label: 'Cancel' }, { label: 'Reset password', cls: 'btn-primary', fn: async ov => { await api('/admin/students/' + id, { method: 'PATCH', body: { password: $('#rp', ov).value } }); toast('Password updated.', 'ok'); } }] }); },
  async delStudent(id) { const name = (STU.find(s => s.id === id) || {}).name || 'This student'; if (await confirmBox('Delete student?', `<b>${esc(name)}</b> and all of their progress and certificates will be permanently deleted.`, 'Delete')) { try { await api('/admin/students/' + id, { method: 'DELETE' }); toast('Student deleted.'); router(); } catch (e) { fail(e); } } },
  async revoke(code) { if (await confirmBox('Revoke certificate?', `Certificate ${code} will be deleted and will no longer verify. The student can earn a new one by passing the quiz again.`, 'Revoke')) { try { await api('/admin/certificates/' + code, { method: 'DELETE' }); toast('Certificate revoked.'); router(); } catch (e) { fail(e); } } },
  async readMsg(id) { try { await api('/admin/messages/' + id, { method: 'PATCH', body: {} }); router(); } catch (e) { fail(e); } },
  async delMsg(id) { try { await api('/admin/messages/' + id, { method: 'DELETE' }); router(); } catch (e) { fail(e); } },
  async settings(e) { e.preventDefault(); const f = e.target; try { const d = await api('/admin/settings', { method: 'PUT', body: { site_name: f.site_name.value, tagline: f.tagline.value, contact_email: f.contact_email.value } }); S.settings = d.settings; renderNav(); renderFooter(); toast('Settings saved.', 'ok'); router(); } catch (er) { fail(er); } }
};

/* ---------- students ---------- */
let STU = [];
route('/admin/students', async alive => {
  if (!guard()) return; loading(); STU = (await api('/admin/students')).students; if (!alive()) return;
  shell('students', 'Students', `<div class="search mb" style="max-width:420px"><input placeholder="Search by name or email" oninput="drawStudents(this.value)"></div><div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Joined</th><th>Courses</th><th>Certificates</th><th>Status</th><th></th></tr></thead><tbody id="stu"></tbody></table></div>`, '<button class="btn btn-primary" onclick="AD.addStudent()">+ Add student</button>'); drawStudents('');
});
function drawStudents(q) {
  q = q.toLowerCase(); const rows = STU.filter(s => (s.name + s.email).toLowerCase().includes(q));
  $('#stu').innerHTML = rows.map(s => `<tr><td><b>${esc(s.name)}</b><br><span class="muted" style="font-size:13px">${esc(s.email)}</span></td><td>${fmtDate(s.created_at)}</td><td>${s.enrolled}</td><td>${s.certificates}</td><td><span class="chip ${s.active ? 'ok' : 'bad'}">${s.active ? 'Active' : 'Disabled'}</span></td>
  <td><div class="t-act"><button class="btn btn-ghost btn-sm" onclick="AD.viewStudent(${s.id})">View</button><button class="btn btn-ghost btn-sm" onclick="AD.resetPw(${s.id})">Reset password</button><button class="btn btn-ghost btn-sm" onclick="AD.toggleStudent(${s.id},${s.active ? 'false' : 'true'})">${s.active ? 'Disable' : 'Enable'}</button><button class="btn btn-danger btn-sm" onclick="AD.delStudent(${s.id})">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="center muted" style="padding:40px">No students found.</td></tr>';
}

/* ---------- certificates, messages, settings ---------- */
route('/admin/certificates', async alive => {
  if (!guard()) return; loading(); const d = await api('/admin/certificates'); if (!alive()) return;
  shell('certs', 'Certificates', `<div class="tbl-wrap"><table><thead><tr><th>Certificate ID</th><th>Student</th><th>Course</th><th>Score</th><th>Issued</th><th></th></tr></thead><tbody>${d.certificates.map(c => `<tr><td><b>${esc(c.code)}</b></td><td>${esc(c.student)}<br><span class="muted" style="font-size:13px">${esc(c.email)}</span></td><td>${esc(c.course)}</td><td>${c.percent}%</td><td>${fmtDate(c.issued_at)}</td>
  <td><div class="t-act"><a class="btn btn-ghost btn-sm" href="#/certificate/${c.code}">View</a><button class="btn btn-danger btn-sm" onclick="AD.revoke('${c.code}')">Revoke</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="center muted" style="padding:40px">No certificates have been issued yet.</td></tr>'}</tbody></table></div>`);
});
route('/admin/messages', async alive => {
  if (!guard()) return; loading(); const d = await api('/admin/messages'); if (!alive()) return; S.unread = d.messages.filter(m => !m.is_read).length;
  shell('messages', 'Messages', d.messages.map(m => `<div class="panel mb" style="${m.is_read ? '' : 'border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-l)'}"><div class="row between"><div><b>${esc(m.subject || '(no subject)')}</b> ${m.is_read ? '' : '<span class="chip">New</span>'}<div class="muted" style="font-size:13px">${esc(m.name)} · ${esc(m.email)} · ${fmtDate(m.created_at)}</div></div>
  <div class="row">${m.is_read ? '' : `<button class="btn btn-ghost btn-sm" onclick="AD.readMsg(${m.id})">Mark as read</button>`}<a class="btn btn-dark btn-sm" href="mailto:${esc(m.email)}?subject=Re: ${encodeURIComponent(m.subject || '')}">Reply</a><button class="btn btn-danger btn-sm" onclick="AD.delMsg(${m.id})">Delete</button></div></div><p style="margin:14px 0 0;white-space:pre-wrap">${esc(m.body)}</p></div>`).join('') || '<div class="empty"><div class="big">📭</div><h3>No messages yet</h3><p class="muted">Messages sent from the contact page will appear here.</p></div>');
});
route('/admin/settings', async alive => {
  if (!guard()) return;
  shell('settings', 'Settings', `<div class="panel" style="max-width:640px"><form onsubmit="AD.settings(event)"><div class="field"><label>Website name</label><input name="site_name" required value="${esc(S.settings.site_name)}"><div class="hint">Shown in the navigation bar, footer and on certificates.</div></div>
  <div class="field"><label>Tagline</label><input name="tagline" value="${esc(S.settings.tagline)}"></div><div class="field"><label>Contact email</label><input name="contact_email" type="email" value="${esc(S.settings.contact_email)}"></div><button class="btn btn-primary">Save settings</button></form></div>
  <div class="panel mt" style="max-width:640px"><h3>Your admin account</h3><p class="muted">Signed in as <b>${esc(S.user.email)}</b>.</p><a class="btn btn-dark" href="#/profile">Change password</a></div>`);
});
