#!/usr/bin/env python3
"""SkillArc - free e-learning platform. Zero-dependency backend (Python 3.9+ standard library only)."""
import os, json, sqlite3, hashlib, hmac, secrets, time, re, base64, mimetypes, sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from datetime import datetime, timedelta, timezone

BASE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(BASE, 'public')
UPLOADS = os.path.join(BASE, 'uploads')
DB_PATH = os.path.join(BASE, 'data', 'skillarc.db')
PORT = int(os.environ.get('PORT', 8000))
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@skillarc.local').lower()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin@12345')
SESSION_DAYS = 14
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
os.makedirs(UPLOADS, exist_ok=True)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, pw_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires REAL NOT NULL);
CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, summary TEXT DEFAULT '',
  description TEXT DEFAULT '', category TEXT DEFAULT 'General', level TEXT DEFAULT 'Beginner', duration TEXT DEFAULT '',
  instructor TEXT DEFAULT '', instructor_bio TEXT DEFAULT '', outcomes TEXT DEFAULT '[]', cover TEXT DEFAULT '', theme INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1, pass_mark INTEGER DEFAULT 70, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS lessons(id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0, title TEXT NOT NULL, video_url TEXT DEFAULT '', content TEXT DEFAULT '', minutes INTEGER DEFAULT 5);
CREATE TABLE IF NOT EXISTS questions(id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0, text TEXT NOT NULL, options TEXT NOT NULL, answer INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS enrollments(user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  created_at TEXT, PRIMARY KEY(user_id, course_id));
CREATE TABLE IF NOT EXISTS progress(user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  done_at TEXT, PRIMARY KEY(user_id, lesson_id));
CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  score INTEGER, total INTEGER, percent INTEGER, passed INTEGER, created_at TEXT);
CREATE TABLE IF NOT EXISTS certificates(id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE, percent INTEGER, issued_at TEXT, UNIQUE(user_id, course_id));
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, name TEXT, email TEXT, subject TEXT, body TEXT, created_at TEXT, is_read INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
"""
DEFAULT_SETTINGS = {'site_name': 'SkillArc', 'tagline': 'Free courses. Real skills. Verified certificates.', 'contact_email': 'sureshg23edc@gmail.com'}

def now(): return datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

def db():
    c = sqlite3.connect(DB_PATH, timeout=20)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    return c

def hash_pw(pw):
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', pw.encode(), bytes.fromhex(salt), 200_000).hex()
    return f'pbkdf2${salt}${h}'

def check_pw(pw, stored):
    try:
        _, salt, h = stored.split('$')
        calc = hashlib.pbkdf2_hmac('sha256', pw.encode(), bytes.fromhex(salt), 200_000).hex()
        return hmac.compare_digest(calc, h)
    except Exception:
        return False

def slugify(t):
    s = re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')
    return s or 'course'

def unique_slug(c, title, exclude=None):
    base = slugify(title); s = base; i = 2
    while True:
        r = c.execute('SELECT id FROM courses WHERE slug=?', (s,)).fetchone()
        if not r or r['id'] == exclude: return s
        s = f'{base}-{i}'; i += 1

def init_db():
    c = db(); c.executescript(SCHEMA)
    for k, v in DEFAULT_SETTINGS.items():
        c.execute('INSERT OR IGNORE INTO settings VALUES(?,?)', (k, v))
    if not c.execute("SELECT 1 FROM users WHERE role='admin'").fetchone():
        c.execute('INSERT INTO users(name,email,pw_hash,role,created_at) VALUES(?,?,?,?,?)',
                  ('Administrator', ADMIN_EMAIL, hash_pw(ADMIN_PASSWORD), 'admin', now()))
        print(f'\n  Admin account created ->  {ADMIN_EMAIL}  /  {ADMIN_PASSWORD}   (change it after first login)\n')
    # contact email: replace the old placeholder on existing databases
    c.execute("UPDATE settings SET value=? WHERE key='contact_email' AND value='hello@skillarc.local'", (DEFAULT_SETTINGS['contact_email'],))
    from seed_data import COURSES
    from seed_more import MORE
    def add_course(co, i):
        cur = c.execute('INSERT INTO courses(slug,title,summary,description,category,level,duration,instructor,instructor_bio,outcomes,theme,published,pass_mark,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,70,?,?)',
            (unique_slug(c, co['title']), co['title'], co['summary'], co['description'], co['category'], co['level'], co['duration'],
             co['instructor'], co['bio'], json.dumps(co['outcomes']), i, now(), now()))
        cid = cur.lastrowid
        for p, (t, mins, body) in enumerate(co['lessons']):
            c.execute('INSERT INTO lessons(course_id,position,title,minutes,content) VALUES(?,?,?,?,?)', (cid, p, t, mins, body))
        for p, (q, opts, a) in enumerate(co['quiz']):
            c.execute('INSERT INTO questions(course_id,position,text,options,answer) VALUES(?,?,?,?,?)', (cid, p, q, json.dumps(opts), a))
    if not c.execute('SELECT 1 FROM courses').fetchone():
        for i, co in enumerate(COURSES): add_course(co, i)
    # extra sample courses: added once (a marker stops them coming back if you delete them later)
    if not c.execute("SELECT 1 FROM settings WHERE key='seed_more_v1'").fetchone():
        for i, co in enumerate(MORE):
            if not c.execute('SELECT 1 FROM courses WHERE title=?', (co['title'],)).fetchone(): add_course(co, len(COURSES) + i)
        c.execute("INSERT INTO settings VALUES('seed_more_v1','1')")
    c.commit(); c.close()

# ---------- helpers ----------
class ApiError(Exception):
    def __init__(self, msg, status=400): self.msg, self.status = msg, status

def need(cond, msg, status=400):
    if not cond: raise ApiError(msg, status)

def s(v, n=500): return str(v or '').strip()[:n]

def course_row(r, c=None, extra=True):
    d = {k: r[k] for k in ('id','slug','title','summary','description','category','level','duration','instructor','instructor_bio','cover','theme','published','pass_mark')}
    d['outcomes'] = json.loads(r['outcomes'] or '[]')
    if extra and c:
        d['lesson_count'] = c.execute('SELECT COUNT(*) FROM lessons WHERE course_id=?', (r['id'],)).fetchone()[0]
        d['question_count'] = c.execute('SELECT COUNT(*) FROM questions WHERE course_id=?', (r['id'],)).fetchone()[0]
        d['enrolled'] = c.execute('SELECT COUNT(*) FROM enrollments WHERE course_id=?', (r['id'],)).fetchone()[0]
        d['minutes'] = c.execute('SELECT COALESCE(SUM(minutes),0) FROM lessons WHERE course_id=?', (r['id'],)).fetchone()[0]
    return d

def user_progress(c, uid, cid):
    total = c.execute('SELECT COUNT(*) FROM lessons WHERE course_id=?', (cid,)).fetchone()[0]
    done = c.execute('SELECT COUNT(*) FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? AND l.course_id=?', (uid, cid)).fetchone()[0]
    return done, total

def cert_json(c, r):
    return {'code': r['code'], 'percent': r['percent'], 'issued_at': r['issued_at'], 'student': r['sname'], 'course': r['ctitle'],
            'course_slug': r['cslug'], 'instructor': r['cinstr'], 'hours': r['chours']}

CERT_Q = '''SELECT ce.*, u.name sname, co.title ctitle, co.slug cslug, co.instructor cinstr, co.duration chours
            FROM certificates ce JOIN users u ON u.id=ce.user_id JOIN courses co ON co.id=ce.course_id'''

def new_cert_code(c):
    alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    while True:
        code = f'SA-{datetime.now(timezone.utc).year}-' + ''.join(secrets.choice(alpha) for _ in range(8))
        if not c.execute('SELECT 1 FROM certificates WHERE code=?', (code,)).fetchone(): return code

# ---------- route handlers: fn(ctx) ----------
class Ctx:
    def __init__(s, h, user, body, q, m, c): s.h, s.user, s.body, s.q, s.m, s.c = h, user, body, q, m, c
    def login(s): need(s.user, 'Please sign in first.', 401); return s.user
    def admin(s): u = s.login(); need(u['role'] == 'admin', 'Admins only.', 403); return u

def public_user(u): return {'id': u['id'], 'name': u['name'], 'email': u['email'], 'role': u['role']} if u else None
THROTTLE = {}
def throttle(key, limit=8, window=600):
    t = time.time(); L = [x for x in THROTTLE.get(key, []) if t - x < window]
    need(len(L) < limit, 'Too many attempts. Please wait a few minutes and try again.', 429)
    L.append(t); THROTTLE[key] = L

def start_session(c, uid):
    tok = secrets.token_urlsafe(32)
    c.execute('INSERT INTO sessions VALUES(?,?,?)', (hashlib.sha256(tok.encode()).hexdigest(), uid, time.time() + SESSION_DAYS * 86400))
    return tok

def get_settings(c): return {r['key']: r['value'] for r in c.execute('SELECT * FROM settings')}

def r_register(x):
    b = x.body; name, email, pw = s(b.get('name'), 80), s(b.get('email'), 120).lower(), str(b.get('password') or '')
    throttle('reg' + x.h.client_address[0], 20)
    need(len(name) >= 2, 'Please enter your full name.'); need(EMAIL_RE.match(email), 'Please enter a valid email address.')
    need(len(pw) >= 6, 'Password must be at least 6 characters.')
    need(not x.c.execute('SELECT 1 FROM users WHERE email=?', (email,)).fetchone(), 'An account with this email already exists.', 409)
    uid = x.c.execute('INSERT INTO users(name,email,pw_hash,role,created_at) VALUES(?,?,?,?,?)', (name, email, hash_pw(pw), 'student', now())).lastrowid
    x.h.set_cookie = start_session(x.c, uid)
    return {'user': {'id': uid, 'name': name, 'email': email, 'role': 'student'}}

def r_login(x):
    email, pw = s(x.body.get('email'), 120).lower(), str(x.body.get('password') or '')
    throttle('login' + x.h.client_address[0] + email)
    u = x.c.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
    need(u and check_pw(pw, u['pw_hash']), 'Incorrect email or password.', 401)
    need(u['active'], 'This account has been disabled. Please contact the administrator.', 403)
    x.h.set_cookie = start_session(x.c, u['id'])
    return {'user': public_user(u)}

def r_logout(x):
    ck = x.h.cookie('sid')
    if ck: x.c.execute('DELETE FROM sessions WHERE token_hash=?', (hashlib.sha256(ck.encode()).hexdigest(),))
    x.h.set_cookie = ''
    return {'ok': True}

def r_me(x):
    return {'user': public_user(x.user), 'settings': get_settings(x.c)}

def r_password(x):
    u = x.login(); old, new = str(x.body.get('old') or ''), str(x.body.get('new') or '')
    need(check_pw(old, u['pw_hash']), 'Current password is incorrect.'); need(len(new) >= 6, 'New password must be at least 6 characters.')
    x.c.execute('UPDATE users SET pw_hash=? WHERE id=?', (hash_pw(new), u['id'])); return {'ok': True}

def r_profile(x):
    u = x.login(); name = s(x.body.get('name'), 80); need(len(name) >= 2, 'Please enter your name.')
    x.c.execute('UPDATE users SET name=? WHERE id=?', (name, u['id'])); return {'ok': True}

def r_home(x):
    c = x.c
    feat = [course_row(r, c) for r in c.execute('SELECT * FROM courses WHERE published=1 ORDER BY id LIMIT 6')]
    return {'courses': feat, 'stats': {
        'students': c.execute("SELECT COUNT(*) FROM users WHERE role='student'").fetchone()[0],
        'courses': c.execute('SELECT COUNT(*) FROM courses WHERE published=1').fetchone()[0],
        'certificates': c.execute('SELECT COUNT(*) FROM certificates').fetchone()[0],
        'lessons': c.execute('SELECT COUNT(*) FROM lessons l JOIN courses co ON co.id=l.course_id WHERE co.published=1').fetchone()[0]}}

def r_courses(x):
    q = x.q.get('q', [''])[0].lower(); cat = x.q.get('category', [''])[0]; lvl = x.q.get('level', [''])[0]
    rows = [course_row(r, x.c) for r in x.c.execute('SELECT * FROM courses WHERE published=1 ORDER BY id DESC')]
    if q: rows = [r for r in rows if q in (r['title'] + r['summary'] + r['category'] + r['instructor']).lower()]
    if cat: rows = [r for r in rows if r['category'] == cat]
    if lvl: rows = [r for r in rows if r['level'] == lvl]
    cats = sorted({r['category'] for r in x.c.execute('SELECT category FROM courses WHERE published=1')})
    return {'courses': rows, 'categories': cats}

def r_course(x):
    r = x.c.execute('SELECT * FROM courses WHERE slug=?', (x.m.group(1),)).fetchone()
    need(r and (r['published'] or (x.user and x.user['role'] == 'admin')), 'Course not found.', 404)
    d = course_row(r, x.c)
    d['lessons'] = [dict(r2) for r2 in x.c.execute("SELECT id,title,minutes,(video_url<>'') has_video FROM lessons WHERE course_id=? ORDER BY position,id", (r['id'],))]
    d['enrolled_me'] = False
    if x.user:
        d['enrolled_me'] = bool(x.c.execute('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', (x.user['id'], r['id'])).fetchone())
        d['done'], d['total'] = user_progress(x.c, x.user['id'], r['id'])
        ce = x.c.execute('SELECT code FROM certificates WHERE user_id=? AND course_id=?', (x.user['id'], r['id'])).fetchone()
        d['certificate'] = ce['code'] if ce else None
    return d

def r_enroll(x):
    u = x.login(); r = x.c.execute('SELECT * FROM courses WHERE id=? AND published=1', (x.m.group(1),)).fetchone()
    need(r, 'Course not found.', 404)
    x.c.execute('INSERT OR IGNORE INTO enrollments VALUES(?,?,?)', (u['id'], r['id'], now()))
    return {'ok': True, 'slug': r['slug']}

def r_my_courses(x):
    u = x.login(); out = []
    for r in x.c.execute('SELECT co.*, e.created_at enrolled_at FROM enrollments e JOIN courses co ON co.id=e.course_id WHERE e.user_id=? ORDER BY e.created_at DESC', (u['id'],)):
        d = course_row(r, x.c); d['done'], d['total'] = user_progress(x.c, u['id'], r['id'])
        ce = x.c.execute('SELECT code FROM certificates WHERE user_id=? AND course_id=?', (u['id'], r['id'])).fetchone()
        d['certificate'] = ce['code'] if ce else None
        d['best'] = (x.c.execute('SELECT MAX(percent) FROM attempts WHERE user_id=? AND course_id=?', (u['id'], r['id'])).fetchone()[0])
        out.append(d)
    return {'courses': out}

def check_access(x, slug):
    u = x.login(); r = x.c.execute('SELECT * FROM courses WHERE slug=?', (slug,)).fetchone(); need(r, 'Course not found.', 404)
    enrolled = x.c.execute('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', (u['id'], r['id'])).fetchone()
    need(enrolled or u['role'] == 'admin', 'Please enroll in this course first.', 403)
    return u, r, bool(enrolled)

def r_learn(x):
    u, r, enr = check_access(x, x.m.group(1)); d = course_row(r, x.c); d['enrolled'] = enr
    d['lessons'] = [dict(l) for l in x.c.execute('SELECT id,title,video_url,content,minutes FROM lessons WHERE course_id=? ORDER BY position,id', (r['id'],))]
    d['completed'] = [p['lesson_id'] for p in x.c.execute('SELECT p.lesson_id FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? AND l.course_id=?', (u['id'], r['id']))]
    ce = x.c.execute('SELECT code FROM certificates WHERE user_id=? AND course_id=?', (u['id'], r['id'])).fetchone()
    d['certificate'] = ce['code'] if ce else None
    return d

def r_complete(x):
    u = x.login(); l = x.c.execute('SELECT l.*, co.id cid FROM lessons l JOIN courses co ON co.id=l.course_id WHERE l.id=?', (x.m.group(1),)).fetchone(); need(l, 'Lesson not found.', 404)
    need(x.c.execute('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', (u['id'], l['cid'])).fetchone(), 'Please enroll first.', 403)
    if x.body.get('done', True): x.c.execute('INSERT OR IGNORE INTO progress VALUES(?,?,?)', (u['id'], l['id'], now()))
    else: x.c.execute('DELETE FROM progress WHERE user_id=? AND lesson_id=?', (u['id'], l['id']))
    d, t = user_progress(x.c, u['id'], l['cid']); return {'done': d, 'total': t}

def quiz_gate(x, slug):
    u, r, enrolled = check_access(x, slug); done, total = user_progress(x.c, u['id'], r['id'])
    need(u['role'] == 'admin' or done >= total, 'Complete all lessons to unlock the final quiz.', 403)
    qs = x.c.execute('SELECT * FROM questions WHERE course_id=? ORDER BY position,id', (r['id'],)).fetchall(); need(qs, 'This course has no quiz yet.', 404)
    return u, r, qs, enrolled

def r_quiz(x):
    u, r, qs, _ = quiz_gate(x, x.m.group(1))
    att = [dict(a) for a in x.c.execute('SELECT score,total,percent,passed,created_at FROM attempts WHERE user_id=? AND course_id=? ORDER BY id DESC LIMIT 10', (u['id'], r['id']))]
    ce = x.c.execute('SELECT code FROM certificates WHERE user_id=? AND course_id=?', (u['id'], r['id'])).fetchone()
    return {'course': {'title': r['title'], 'slug': r['slug'], 'pass_mark': r['pass_mark']}, 'attempts': att, 'certificate': ce['code'] if ce else None,
            'questions': [{'id': q['id'], 'text': q['text'], 'options': json.loads(q['options'])} for q in qs]}

def r_submit(x):
    u, r, qs, enrolled = quiz_gate(x, x.m.group(1)); need(enrolled, 'Only enrolled students can submit the quiz.', 403)
    ans = x.body.get('answers') or {}; score = 0; review = []
    for q in qs:
        opts = json.loads(q['options']); ch = ans.get(str(q['id'])); ch = ch if isinstance(ch, int) else -1
        ok = ch == q['answer']; score += ok
        review.append({'id': q['id'], 'text': q['text'], 'options': opts, 'chosen': ch, 'correct': q['answer'], 'ok': ok})
    pct = round(score * 100 / len(qs)); passed = pct >= r['pass_mark']
    x.c.execute('INSERT INTO attempts(user_id,course_id,score,total,percent,passed,created_at) VALUES(?,?,?,?,?,?,?)', (u['id'], r['id'], score, len(qs), pct, int(passed), now()))
    code = None
    if passed:
        ce = x.c.execute('SELECT code,percent FROM certificates WHERE user_id=? AND course_id=?', (u['id'], r['id'])).fetchone()
        if ce:
            code = ce['code']
            if pct > ce['percent']: x.c.execute('UPDATE certificates SET percent=? WHERE code=?', (pct, code))
        else:
            code = new_cert_code(x.c)
            x.c.execute('INSERT INTO certificates(code,user_id,course_id,percent,issued_at) VALUES(?,?,?,?,?)', (code, u['id'], r['id'], pct, now()))
    return {'score': score, 'total': len(qs), 'percent': pct, 'passed': passed, 'pass_mark': r['pass_mark'], 'certificate': code, 'review': review}

def r_my_certs(x):
    u = x.login()
    return {'certificates': [cert_json(x.c, r) for r in x.c.execute(CERT_Q + ' WHERE ce.user_id=? ORDER BY ce.issued_at DESC', (u['id'],))]}

def r_verify(x):
    r = x.c.execute(CERT_Q + ' WHERE ce.code=?', (x.m.group(1).strip().upper(),)).fetchone(); need(r, 'No certificate found with this ID.', 404)
    return {'certificate': cert_json(x.c, r)}

def r_contact(x):
    b = x.body; throttle('contact' + x.h.client_address[0], 5, 3600)
    name, email, subj, body = s(b.get('name'), 80), s(b.get('email'), 120), s(b.get('subject'), 140), s(b.get('message'), 3000)
    need(name and EMAIL_RE.match(email) and body, 'Please fill in your name, a valid email and a message.')
    x.c.execute('INSERT INTO messages(name,email,subject,body,created_at) VALUES(?,?,?,?,?)', (name, email, subj, body, now())); return {'ok': True}

# ---------- admin ----------
def r_admin_stats(x):
    x.admin(); c = x.c
    days = [(datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(13, -1, -1)]
    counts = {r[0]: r[1] for r in c.execute("SELECT substr(created_at,1,10), COUNT(*) FROM enrollments GROUP BY 1")}
    signups = {r[0]: r[1] for r in c.execute("SELECT substr(created_at,1,10), COUNT(*) FROM users WHERE role='student' GROUP BY 1")}
    adm = c.execute("SELECT pw_hash FROM users WHERE email=?", (ADMIN_EMAIL,)).fetchone()
    return {'students': c.execute("SELECT COUNT(*) FROM users WHERE role='student'").fetchone()[0],
            'courses': c.execute('SELECT COUNT(*) FROM courses').fetchone()[0],
            'enrollments': c.execute('SELECT COUNT(*) FROM enrollments').fetchone()[0],
            'certificates': c.execute('SELECT COUNT(*) FROM certificates').fetchone()[0],
            'attempts': c.execute('SELECT COUNT(*) FROM attempts').fetchone()[0],
            'unread': c.execute('SELECT COUNT(*) FROM messages WHERE is_read=0').fetchone()[0],
            'chart': [{'day': d, 'enrollments': counts.get(d, 0), 'signups': signups.get(d, 0)} for d in days],
            'top': [dict(r) for r in c.execute('SELECT co.title, COUNT(e.user_id) n FROM courses co LEFT JOIN enrollments e ON e.course_id=co.id GROUP BY co.id ORDER BY n DESC LIMIT 5')],
            'recent': [dict(r) for r in c.execute('SELECT u.name, co.title, e.created_at FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses co ON co.id=e.course_id ORDER BY e.created_at DESC LIMIT 6')],
            'default_password': bool(adm and check_pw(ADMIN_PASSWORD, adm['pw_hash']))}

def r_admin_courses(x):
    x.admin(); return {'courses': [course_row(r, x.c) for r in x.c.execute('SELECT * FROM courses ORDER BY id DESC')]}

def r_admin_course(x):
    x.admin(); r = x.c.execute('SELECT * FROM courses WHERE id=?', (x.m.group(1),)).fetchone(); need(r, 'Course not found.', 404)
    d = course_row(r, x.c, False)
    d['lessons'] = [dict(l) for l in x.c.execute('SELECT id,title,video_url,content,minutes FROM lessons WHERE course_id=? ORDER BY position,id', (r['id'],))]
    d['questions'] = [{'id': q['id'], 'text': q['text'], 'options': json.loads(q['options']), 'answer': q['answer']} for q in x.c.execute('SELECT * FROM questions WHERE course_id=? ORDER BY position,id', (r['id'],))]
    return d

def save_course(x, cid=None):
    x.admin(); b = x.body; c = x.c
    title = s(b.get('title'), 140); need(title, 'Course title is required.')
    outcomes = [s(o, 200) for o in (b.get('outcomes') or []) if s(o)]
    pm = max(1, min(100, int(b.get('pass_mark') or 70)))
    vals = (title, s(b.get('summary'), 300), s(b.get('description'), 6000), s(b.get('category'), 60) or 'General', s(b.get('level'), 20) or 'Beginner',
            s(b.get('duration'), 40), s(b.get('instructor'), 80), s(b.get('instructor_bio'), 400), json.dumps(outcomes), s(b.get('cover'), 300),
            int(b.get('theme') or 0) % 6, 1 if b.get('published') else 0, pm)
    if cid is None:
        cid = c.execute('INSERT INTO courses(title,summary,description,category,level,duration,instructor,instructor_bio,outcomes,cover,theme,published,pass_mark,slug,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                        vals + (unique_slug(c, title), now(), now())).lastrowid
    else:
        need(c.execute('SELECT 1 FROM courses WHERE id=?', (cid,)).fetchone(), 'Course not found.', 404)
        c.execute('UPDATE courses SET title=?,summary=?,description=?,category=?,level=?,duration=?,instructor=?,instructor_bio=?,outcomes=?,cover=?,theme=?,published=?,pass_mark=?,updated_at=? WHERE id=?', vals + (now(), cid))
    # sync lessons
    keep = []
    for i, l in enumerate(b.get('lessons') or []):
        t = s(l.get('title'), 140); need(t, f'Lesson {i + 1} needs a title.')
        mins = max(1, min(600, int(l.get('minutes') or 5)))
        if l.get('id') and c.execute('SELECT 1 FROM lessons WHERE id=? AND course_id=?', (l['id'], cid)).fetchone():
            c.execute('UPDATE lessons SET position=?,title=?,video_url=?,content=?,minutes=? WHERE id=?', (i, t, s(l.get('video_url'), 300), s(l.get('content'), 30000), mins, l['id'])); keep.append(l['id'])
        else:
            keep.append(c.execute('INSERT INTO lessons(course_id,position,title,video_url,content,minutes) VALUES(?,?,?,?,?,?)', (cid, i, t, s(l.get('video_url'), 300), s(l.get('content'), 30000), mins)).lastrowid)
    c.execute(f'DELETE FROM lessons WHERE course_id=? AND id NOT IN ({",".join("?" * len(keep)) or "NULL"})', (cid, *keep))
    keep = []
    for i, q in enumerate(b.get('questions') or []):
        t = s(q.get('text'), 400); opts = [s(o, 200) for o in (q.get('options') or [])]
        need(t and len([o for o in opts if o]) >= 2, f'Question {i + 1} needs text and at least 2 options.')
        ans = int(q.get('answer') or 0); need(0 <= ans < len(opts) and opts[ans], f'Question {i + 1}: choose a valid correct answer.')
        if q.get('id') and c.execute('SELECT 1 FROM questions WHERE id=? AND course_id=?', (q['id'], cid)).fetchone():
            c.execute('UPDATE questions SET position=?,text=?,options=?,answer=? WHERE id=?', (i, t, json.dumps(opts), ans, q['id'])); keep.append(q['id'])
        else:
            keep.append(c.execute('INSERT INTO questions(course_id,position,text,options,answer) VALUES(?,?,?,?,?)', (cid, i, t, json.dumps(opts), ans)).lastrowid)
    c.execute(f'DELETE FROM questions WHERE course_id=? AND id NOT IN ({",".join("?" * len(keep)) or "NULL"})', (cid, *keep))
    return {'id': cid}

def r_admin_course_create(x): return save_course(x)
def r_admin_course_update(x): return save_course(x, int(x.m.group(1)))
def r_admin_course_delete(x): x.admin(); x.c.execute('DELETE FROM courses WHERE id=?', (x.m.group(1),)); return {'ok': True}

def r_admin_students(x):
    x.admin(); rows = []
    for u in x.c.execute("SELECT * FROM users WHERE role='student' ORDER BY id DESC"):
        rows.append({'id': u['id'], 'name': u['name'], 'email': u['email'], 'active': u['active'], 'created_at': u['created_at'],
                     'enrolled': x.c.execute('SELECT COUNT(*) FROM enrollments WHERE user_id=?', (u['id'],)).fetchone()[0],
                     'certificates': x.c.execute('SELECT COUNT(*) FROM certificates WHERE user_id=?', (u['id'],)).fetchone()[0]})
    return {'students': rows}

def r_admin_student(x):
    x.admin(); u = x.c.execute('SELECT * FROM users WHERE id=?', (x.m.group(1),)).fetchone(); need(u, 'Student not found.', 404); out = []
    for r in x.c.execute('SELECT co.id,co.title FROM enrollments e JOIN courses co ON co.id=e.course_id WHERE e.user_id=?', (u['id'],)):
        d, t = user_progress(x.c, u['id'], r['id'])
        ce = x.c.execute('SELECT code FROM certificates WHERE user_id=? AND course_id=?', (u['id'], r['id'])).fetchone()
        out.append({'title': r['title'], 'done': d, 'total': t, 'certificate': ce['code'] if ce else None,
                    'best': x.c.execute('SELECT MAX(percent) FROM attempts WHERE user_id=? AND course_id=?', (u['id'], r['id'])).fetchone()[0]})
    return {'student': public_user(u), 'created_at': u['created_at'], 'active': u['active'], 'courses': out}

def r_admin_student_add(x):
    x.admin(); b = x.body; name, email, pw = s(b.get('name'), 80), s(b.get('email'), 120).lower(), str(b.get('password') or '')
    need(len(name) >= 2 and EMAIL_RE.match(email) and len(pw) >= 6, 'Enter a name, a valid email and a password (6+ characters).')
    need(not x.c.execute('SELECT 1 FROM users WHERE email=?', (email,)).fetchone(), 'That email is already registered.', 409)
    x.c.execute('INSERT INTO users(name,email,pw_hash,role,created_at) VALUES(?,?,?,?,?)', (name, email, hash_pw(pw), 'student', now())); return {'ok': True}

def r_admin_student_patch(x):
    x.admin(); uid = x.m.group(1); b = x.body
    u = x.c.execute("SELECT * FROM users WHERE id=? AND role='student'", (uid,)).fetchone(); need(u, 'Student not found.', 404)
    if 'active' in b:
        x.c.execute('UPDATE users SET active=? WHERE id=?', (1 if b['active'] else 0, uid))
        if not b['active']: x.c.execute('DELETE FROM sessions WHERE user_id=?', (uid,))
    if b.get('password'):
        need(len(str(b['password'])) >= 6, 'Password must be at least 6 characters.'); x.c.execute('UPDATE users SET pw_hash=? WHERE id=?', (hash_pw(str(b['password'])), uid))
    if b.get('name'): x.c.execute('UPDATE users SET name=? WHERE id=?', (s(b['name'], 80), uid))
    return {'ok': True}

def r_admin_student_delete(x):
    x.admin(); x.c.execute("DELETE FROM users WHERE id=? AND role='student'", (x.m.group(1),)); return {'ok': True}

def r_admin_certs(x):
    x.admin(); return {'certificates': [cert_json(x.c, r) | {'email': x.c.execute('SELECT email FROM users WHERE id=?', (r['user_id'],)).fetchone()[0]} for r in x.c.execute(CERT_Q + ' ORDER BY ce.issued_at DESC')]}

def r_admin_cert_revoke(x): x.admin(); x.c.execute('DELETE FROM certificates WHERE code=?', (x.m.group(1),)); return {'ok': True}

def r_admin_messages(x):
    x.admin(); return {'messages': [dict(r) for r in x.c.execute('SELECT * FROM messages ORDER BY id DESC')]}

def r_admin_message_patch(x): x.admin(); x.c.execute('UPDATE messages SET is_read=1 WHERE id=?', (x.m.group(1),)); return {'ok': True}
def r_admin_message_delete(x): x.admin(); x.c.execute('DELETE FROM messages WHERE id=?', (x.m.group(1),)); return {'ok': True}

def r_admin_settings(x):
    x.admin()
    for k in DEFAULT_SETTINGS:
        if k in x.body: x.c.execute('INSERT OR REPLACE INTO settings VALUES(?,?)', (k, s(x.body[k], 200)))
    return {'settings': get_settings(x.c)}

def r_upload(x):
    x.admin(); data = str(x.body.get('data') or ''); name = s(x.body.get('filename'), 100).lower()
    ext = os.path.splitext(name)[1]; need(ext in ('.png', '.jpg', '.jpeg', '.webp', '.gif'), 'Only PNG, JPG, WEBP or GIF images are allowed.')
    if ',' in data: data = data.split(',', 1)[1]
    try: raw = base64.b64decode(data)
    except Exception: raise ApiError('Invalid image data.')
    need(0 < len(raw) <= 4 * 1024 * 1024, 'Image must be smaller than 4 MB.')
    fn = secrets.token_hex(8) + ext
    with open(os.path.join(UPLOADS, fn), 'wb') as f: f.write(raw)
    return {'url': '/uploads/' + fn}

ROUTES = [
    ('POST', r'/api/register', r_register), ('POST', r'/api/login', r_login), ('POST', r'/api/logout', r_logout),
    ('GET', r'/api/me', r_me), ('POST', r'/api/me/password', r_password), ('POST', r'/api/me/profile', r_profile),
    ('GET', r'/api/home', r_home), ('GET', r'/api/courses', r_courses), ('GET', r'/api/courses/([a-z0-9-]+)', r_course),
    ('POST', r'/api/courses/(\d+)/enroll', r_enroll), ('GET', r'/api/my/courses', r_my_courses),
    ('GET', r'/api/learn/([a-z0-9-]+)', r_learn), ('POST', r'/api/lessons/(\d+)/complete', r_complete),
    ('GET', r'/api/quiz/([a-z0-9-]+)', r_quiz), ('POST', r'/api/quiz/([a-z0-9-]+)/submit', r_submit),
    ('GET', r'/api/my/certificates', r_my_certs), ('GET', r'/api/verify/([A-Za-z0-9-]+)', r_verify), ('POST', r'/api/contact', r_contact),
    ('GET', r'/api/admin/stats', r_admin_stats), ('GET', r'/api/admin/courses', r_admin_courses), ('POST', r'/api/admin/courses', r_admin_course_create),
    ('GET', r'/api/admin/courses/(\d+)', r_admin_course), ('PUT', r'/api/admin/courses/(\d+)', r_admin_course_update), ('DELETE', r'/api/admin/courses/(\d+)', r_admin_course_delete),
    ('GET', r'/api/admin/students', r_admin_students), ('POST', r'/api/admin/students', r_admin_student_add),
    ('GET', r'/api/admin/students/(\d+)', r_admin_student), ('PATCH', r'/api/admin/students/(\d+)', r_admin_student_patch), ('DELETE', r'/api/admin/students/(\d+)', r_admin_student_delete),
    ('GET', r'/api/admin/certificates', r_admin_certs), ('DELETE', r'/api/admin/certificates/([A-Za-z0-9-]+)', r_admin_cert_revoke),
    ('GET', r'/api/admin/messages', r_admin_messages), ('PATCH', r'/api/admin/messages/(\d+)', r_admin_message_patch), ('DELETE', r'/api/admin/messages/(\d+)', r_admin_message_delete),
    ('PUT', r'/api/admin/settings', r_admin_settings), ('POST', r'/api/admin/upload', r_upload),
]
ROUTES = [(m, re.compile('^' + p + '$'), f) for m, p, f in ROUTES]

class Handler(BaseHTTPRequestHandler):
    server_version = 'SkillArc'
    def log_message(self, fmt, *a):
        if '/api/' in (a[0] if a else ''): sys.stderr.write('  %s\n' % (fmt % a))
    def cookie(self, name):
        for part in (self.headers.get('Cookie') or '').split(';'):
            k, _, v = part.strip().partition('=')
            if k == name: return v
    def send_json(self, obj, status=200):
        raw = json.dumps(obj).encode()
        self.send_response(status); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        if getattr(self, 'set_cookie', None) is not None:
            if self.set_cookie: self.send_header('Set-Cookie', f'sid={self.set_cookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age={SESSION_DAYS * 86400}')
            else: self.send_header('Set-Cookie', 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
        self.end_headers(); self.wfile.write(raw)
    def handle_api(self, method):
        self.set_cookie = None; u = urlparse(self.path); c = db()
        try:
            for m, rx, fn in ROUTES:
                mt = rx.match(u.path)
                if m == method and mt:
                    body = {}
                    if method in ('POST', 'PUT', 'PATCH'):
                        n = int(self.headers.get('Content-Length') or 0); need(n <= 8_000_000, 'Request too large.', 413)
                        if n:
                            try: body = json.loads(self.rfile.read(n) or b'{}')
                            except ValueError: raise ApiError('Invalid JSON.')
                    user = None; tok = self.cookie('sid')
                    if tok:
                        row = c.execute('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?', (hashlib.sha256(tok.encode()).hexdigest(), time.time())).fetchone()
                        if row and row['active']: user = row
                    res = fn(Ctx(self, user, body if isinstance(body, dict) else {}, parse_qs(u.query), mt, c)); c.commit()
                    return self.send_json(res)
            raise ApiError('Not found.', 404)
        except ApiError as e: c.rollback(); self.send_json({'error': e.msg}, e.status)
        except Exception as e:
            c.rollback(); import traceback; traceback.print_exc(); self.send_json({'error': 'Server error. Please try again.'}, 500)
        finally: c.close()
    def serve_file(self):
        p = unquote(urlparse(self.path).path)
        root, rel = (UPLOADS, p[len('/uploads/'):]) if p.startswith('/uploads/') else (PUBLIC, p.lstrip('/') or 'index.html')
        fp = os.path.realpath(os.path.join(root, rel))
        if not fp.startswith(os.path.realpath(root) + os.sep) or not os.path.isfile(fp):
            if p.startswith('/uploads/') or os.path.splitext(p)[1]: self.send_error(404); return
            fp = os.path.join(PUBLIC, 'index.html')
        ctype = mimetypes.guess_type(fp)[0] or 'application/octet-stream'
        with open(fp, 'rb') as f: raw = f.read()
        self.send_response(200); self.send_header('Content-Type', ctype + ('; charset=utf-8' if ctype.startswith('text') or ctype.endswith('javascript') else ''))
        self.send_header('Content-Length', str(len(raw))); self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache'); self.end_headers(); self.wfile.write(raw)
    def do_GET(self): self.handle_api('GET') if self.path.startswith('/api/') else self.serve_file()
    def do_POST(self): self.handle_api('POST')
    def do_PUT(self): self.handle_api('PUT')
    def do_PATCH(self): self.handle_api('PATCH')
    def do_DELETE(self): self.handle_api('DELETE')

if __name__ == '__main__':
    init_db()
    srv = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print(f'  SkillArc is running  ->  http://localhost:{PORT}\n  Press Ctrl+C to stop.')
    try: srv.serve_forever()
    except KeyboardInterrupt: print('\nStopped.')
