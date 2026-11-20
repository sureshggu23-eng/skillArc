<<<<<<< HEAD
# SkillArc - Free E-Learning Platform

A complete e-learning website: student sign-up/login, free course enrolment, lessons with progress tracking,
final quizzes, auto-issued certificates (with public verification), and a full admin panel.

**No installation of packages needed.** You only need Python 3.9 or newer (https://www.python.org/downloads/).

## Run it
```
cd skillarc
python server.py          (Windows: python server.py   or   py server.py)
```
Open http://localhost:8000

First run creates the database and 11 sample courses automatically.

## Admin login
- URL: http://localhost:8000/#/login
- Email: `admin@skillarc.local`
- Password: `Admin@12345`   **-> change it right away (Profile > Change password)**

To choose your own admin before first run:
`ADMIN_EMAIL=me@mysite.com ADMIN_PASSWORD=MyStrongPass python server.py`
(Windows PowerShell: `$env:ADMIN_EMAIL="me@mysite.com"; $env:ADMIN_PASSWORD="MyStrongPass"; python server.py`)
Use another port with `PORT=5000`.

## What you can do
**Students:** register / sign in, browse & search courses, enrol free, learn lesson by lesson (text + YouTube/Vimeo/MP4 video),
progress saved, final quiz unlocks after all lessons, retake until pass, certificate issued instantly
(download PNG, print/save PDF, shareable verification link), profile & password change.

**Admin:** dashboard stats & chart, create/edit/delete courses, upload cover images, add/reorder lessons,
build quizzes (any number of questions, pass mark), publish/draft, manage students (add, disable, reset password, delete, view progress),
view/revoke certificates, read contact messages, change site name/tagline/email.

## Customising
- Branding: Admin > Settings (name, tagline, contact email - currently sureshg23edc@gmail.com). Colours/fonts: `public/css/style.css` (variables at top).
- Logo: `logo()` function in `public/js/core.js`.  Certificate design: `public/js/cert.js`.
- Sample courses: `seed_data.py` and `seed_more.py` (only used on the very first run) - or just edit them in the Admin panel.
- Your own images: Admin > Courses > Edit > Cover image.

## Files
```
server.py        backend (API + database + static files)
seed_data.py     sample courses
public/          website (index.html, css/, js/)
data/            SQLite database (created automatically) - back this up!
uploads/         uploaded course images
```

## Putting it online
Run `server.py` on any Linux VPS / Render / Railway / PythonAnywhere-style host, put it behind HTTPS (nginx or Caddy),
and set a strong admin password. Back up the `data/` and `uploads/` folders regularly.
=======
# skillArc
>>>>>>> 07c0b206f11ada9e4a681eb11d8611400f2a7f57
