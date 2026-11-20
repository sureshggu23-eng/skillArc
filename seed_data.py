# Sample courses created on first run. Edit/delete them from the Admin panel.
COURSES = [
{
 'title': 'Web Development Fundamentals', 'category': 'Web Development', 'level': 'Beginner', 'duration': '4 hours',
 'summary': 'Build your first real web pages with HTML, CSS and a little JavaScript.',
 'description': 'Start from zero and learn how websites are built. You will understand how the web works, structure pages with HTML, style them with CSS and add interactivity with JavaScript.',
 'instructor': 'Ananya Rao', 'bio': 'Front-end developer and mentor who has helped hundreds of beginners ship their first website.',
 'outcomes': ['Explain how browsers, servers and URLs work', 'Write clean, semantic HTML pages', 'Style layouts with CSS Flexbox', 'Add simple interactivity with JavaScript'],
 'lessons': [
  ('How the web works', 8, """## From URL to page
When you type an address into a browser, your computer asks a **server** for files. The server replies with HTML, CSS and JavaScript, and the browser turns them into the page you see.

### The three building blocks
- **HTML** gives a page its structure and content.
- **CSS** controls how it looks.
- **JavaScript** makes it interactive.

Think of a house: HTML is the walls and rooms, CSS is the paint and furniture, JavaScript is the electricity."""),
  ('HTML: structuring a page', 12, """## Your first page
Every page is made of **elements** written as tags.

```
<h1>My first page</h1>
<p>Hello, <strong>world</strong>!</p>
<a href="https://example.com">A link</a>
<img src="photo.jpg" alt="A description">
```

### Tips
- Use one `h1` per page, then `h2`, `h3` for sub-sections.
- Always write an `alt` text for images.
- Use semantic tags such as `header`, `nav`, `main` and `footer`."""),
  ('CSS: colours, spacing and layout', 14, """## Making it look good
CSS rules select elements and change their appearance.

```
.card {
  padding: 24px;
  border-radius: 12px;
  background: #fff;
}
```

### Flexbox in one minute
Set `display: flex` on a parent to lay children in a row. Use `gap` for spacing, `justify-content` to align along the row and `align-items` across it. Most modern layouts start with Flexbox."""),
  ('JavaScript: adding behaviour', 14, """## Making pages respond
JavaScript lets a page react to the user.

```
const btn = document.querySelector('button');
btn.addEventListener('click', () => {
  alert('You clicked me!');
});
```

### Key ideas
- **Variables** store data: `let count = 0;`
- **Functions** group reusable steps.
- **Events** (click, input, submit) trigger your code.
- The **DOM** is the live tree of elements you can read and change."""),
 ],
 'quiz': [
  ('Which language gives a web page its structure?', ['CSS', 'HTML', 'JavaScript', 'Python'], 1),
  ('What does CSS control?', ['Server logic', 'Database storage', 'Appearance and layout', 'Browser history'], 2),
  ('Which HTML tag is used for the main page heading?', ['<h1>', '<p>', '<head>', '<title>'], 0),
  ('Why should images have an alt attribute?', ['It makes them load faster', 'It describes the image for accessibility', 'It changes the colour', 'It is required to run JavaScript'], 1),
  ('Which CSS declaration starts a Flexbox layout?', ['position: flex', 'layout: flex', 'display: flex', 'flex: display'], 2),
  ('In JavaScript, what is an event?', ['A kind of variable', 'An action such as a click that code can respond to', 'A CSS property', 'A server file'], 1),
 ]
},
{
 'title': 'Python Programming for Beginners', 'category': 'Programming', 'level': 'Beginner', 'duration': '4 hours',
 'summary': 'Learn to think like a programmer using the friendliest language there is.',
 'description': 'A gentle introduction to Python. You will write real programs using variables, decisions, loops and functions.',
 'instructor': 'Daniel Moore', 'bio': 'Software engineer who loves teaching programming through small, practical projects.',
 'outcomes': ['Write and run Python programs', 'Use variables and basic data types', 'Make decisions with if statements and repeat with loops', 'Organise code into functions'],
 'lessons': [
  ('Getting started with Python', 8, """## Hello, Python
Python reads like plain English, which makes it a great first language.

```
print("Hello, world!")
```

Save this in a file ending in `.py` and run it with `python file.py`. The `print` function shows text on the screen."""),
  ('Variables and data types', 12, """## Storing information
A **variable** is a name that points to a value.

```
name = "Asha"
age = 21
price = 19.99
is_student = True
```

Common types: `str` (text), `int` (whole numbers), `float` (decimals) and `bool` (True/False). Use `type(x)` to check a value's type."""),
  ('Decisions and loops', 14, """## Controlling the flow
```
score = 72
if score >= 70:
    print("Pass")
else:
    print("Try again")

for i in range(3):
    print("Round", i)
```

- `if / elif / else` choose between paths.
- `for` repeats over a sequence.
- `while` repeats as long as a condition is true.

Indentation matters in Python: it shows which lines belong together."""),
  ('Functions and lists', 14, """## Reusable code
A **function** packages steps under a name.

```
def greet(name):
    return "Hello, " + name

fruits = ["apple", "mango", "banana"]
for f in fruits:
    print(greet(f))
```

A **list** holds many values in order. Use `append` to add, `len(list)` to count and index numbers (starting at 0) to read an item."""),
 ],
 'quiz': [
  ('Which function prints text to the screen in Python?', ['show()', 'print()', 'echo()', 'display()'], 1),
  ('What is the data type of 19.99?', ['int', 'str', 'float', 'bool'], 2),
  ('What does indentation do in Python?', ['Nothing, it is only decoration', 'Marks which lines belong to a block', 'Comments out code', 'Imports a library'], 1),
  ('Which keyword defines a function?', ['func', 'define', 'def', 'function'], 2),
  ('What is the index of the first item in a Python list?', ['0', '1', '-1', 'first'], 0),
  ('Which loop repeats over a sequence of items?', ['for', 'if', 'def', 'return'], 0),
 ]
},
{
 'title': 'Digital Marketing Essentials', 'category': 'Marketing', 'level': 'Beginner', 'duration': '3 hours',
 'summary': 'Understand how brands attract, convert and keep customers online.',
 'description': 'Learn the core channels of digital marketing: search, social, content and email, and how to measure what works.',
 'instructor': 'Priya Nair', 'bio': 'Growth marketer who has run campaigns for start-ups and e-commerce brands.',
 'outcomes': ['Describe the marketing funnel', 'Apply basic SEO to a page', 'Plan a content and social calendar', 'Read simple analytics metrics'],
 'lessons': [
  ('The marketing funnel', 8, """## Awareness to loyalty
Customers move through stages:
1. **Awareness** - they discover you.
2. **Consideration** - they compare options.
3. **Conversion** - they buy or sign up.
4. **Retention** - they come back and recommend you.

Each channel does a different job. Social media is strong for awareness; email is strong for retention."""),
  ('SEO basics', 12, """## Being found on search engines
**SEO** (search engine optimisation) helps your pages rank for what people search.

- Research the **keywords** your audience uses.
- Put the main keyword in the title, headings and first paragraph.
- Write helpful content that answers the question fully.
- Make the site fast and mobile-friendly.
- Earn **backlinks** from trustworthy sites."""),
  ('Social media and content', 12, """## Showing up consistently
Pick one or two platforms where your audience already spends time. Share a mix of educational, entertaining and promotional posts, often summarised as the 80/20 rule: 80% value, 20% selling.

Plan with a **content calendar** so that you post on a steady schedule, and reuse one idea in many formats, such as a blog post, a short video and a carousel."""),
  ('Email and analytics', 10, """## Measure, then improve
Email lets you speak directly to people who opted in. Keep subject lines clear and send relevant messages.

### Metrics to know
- **Open rate** - how many opened your email.
- **Click-through rate (CTR)** - how many clicked a link.
- **Conversion rate** - how many completed the goal.

Change one thing at a time in an **A/B test** to learn what works."""),
 ],
 'quiz': [
  ('Which funnel stage comes first?', ['Retention', 'Conversion', 'Awareness', 'Consideration'], 2),
  ('What does SEO stand for?', ['Social Engagement Optimisation', 'Search Engine Optimisation', 'Site Experience Operation', 'Search Email Outreach'], 1),
  ('The 80/20 content rule suggests:', ['80% selling, 20% value', '80% value, 20% selling', 'Post 80 times a month', 'Use 20 platforms'], 1),
  ('What is CTR?', ['Cost to run', 'Customer targeting rate', 'Click-through rate', 'Content transfer ratio'], 2),
  ('What is an A/B test?', ['Comparing two versions to see which performs better', 'Testing two websites for speed', 'A survey with two questions', 'Sending email to two lists'], 0),
  ('Backlinks are:', ['Links from other sites to yours', 'Links to your own pages', 'Broken links', 'Paid advertisements'], 0),
 ]
},
{
 'title': 'UI/UX Design Basics', 'category': 'Design', 'level': 'Beginner', 'duration': '3 hours',
 'summary': 'Design interfaces that people actually enjoy using.',
 'description': 'Discover the principles behind good digital design, from understanding users to testing a prototype.',
 'instructor': 'Meera Iyer', 'bio': 'Product designer with experience in mobile apps and design systems.',
 'outcomes': ['Explain the difference between UI and UX', 'Create clear visual hierarchy', 'Choose readable colours and typography', 'Test a prototype with real users'],
 'lessons': [
  ('What is UX and UI?', 8, """## Experience vs. interface
**UX (user experience)** is how easy and pleasant a product is to use overall. **UI (user interface)** is the visual layer: buttons, colours, icons and layout.

Good design starts by understanding the user: who they are, what they want to do, and what frustrates them today."""),
  ('Visual hierarchy', 10, """## Guiding the eye
Hierarchy shows what matters most.

- **Size**: bigger things get noticed first.
- **Contrast**: bold colour or weight stands out.
- **Spacing**: grouping related items together.
- **Position**: top-left is usually read first in left-to-right languages.

A page with one clear primary action is easier to use than a page where everything shouts."""),
  ('Colour and typography', 12, """## Readable and consistent
- Use a small palette: one main colour, one accent, and neutrals.
- Keep strong **contrast** between text and background so it is readable.
- Limit yourself to two typefaces and a clear size scale, for example 14, 16, 20, 28 and 40.
- Use consistent spacing, such as multiples of 8 px."""),
  ('Prototyping and testing', 12, """## Learn before you build
A **wireframe** is a simple sketch of layout. A **prototype** is a clickable simulation.

Test with 5 real users: give them a task, watch silently and note where they hesitate. Fix the biggest problems first, then test again. Design is an iterative loop."""),
 ],
 'quiz': [
  ('UX mainly refers to:', ['The colour palette', 'The overall experience of using a product', 'The programming language', 'The logo'], 1),
  ('Which technique helps users notice the most important element?', ['Visual hierarchy', 'Random placement', 'Using many fonts', 'Low contrast'], 0),
  ('A good colour palette is usually:', ['As many colours as possible', 'Small and consistent', 'Only black and white', 'Different on every page'], 1),
  ('What is a wireframe?', ['A finished website', 'A simple layout sketch', 'A type of font', 'A user survey'], 1),
  ('How many users does a quick usability test typically need to reveal major issues?', ['About 5', 'Exactly 1000', 'None', 'Only 1'], 0),
  ('Why does text contrast matter?', ['It makes files smaller', 'It keeps text readable', 'It speeds up the server', 'It is only for print'], 1),
 ]
},
{
 'title': 'Excel for Data Analysis', 'category': 'Data & Office', 'level': 'Intermediate', 'duration': '3 hours',
 'summary': 'Turn messy spreadsheets into clear insights with formulas, pivots and charts.',
 'description': 'Learn the Excel skills used in everyday analysis: essential formulas, pivot tables and charts that tell a story.',
 'instructor': 'Karthik Menon', 'bio': 'Data analyst who trains teams in spreadsheet and reporting skills.',
 'outcomes': ['Use SUM, AVERAGE, IF and lookup formulas', 'Clean and organise data in tables', 'Summarise data with pivot tables', 'Pick the right chart for your message'],
 'lessons': [
  ('Spreadsheet basics', 8, """## Cells, rows and tables
Data lives in **cells** arranged in rows and columns. Keep one record per row and one field per column, with a single header row.

Convert a range to a **Table** (Ctrl+T) so formulas, filters and formatting expand automatically as data grows."""),
  ('Essential formulas', 14, """## Let Excel calculate
Every formula starts with `=`.

- `=SUM(B2:B20)` adds numbers.
- `=AVERAGE(B2:B20)` finds the mean.
- `=IF(C2>=50,"Pass","Fail")` makes a decision.
- `=VLOOKUP(A2,Prices!A:C,3,FALSE)` finds a value in a table. XLOOKUP is a newer alternative.

Use **absolute references** like `$B$1` when a cell must not move as you copy a formula."""),
  ('Pivot tables', 12, """## Summaries in seconds
A **pivot table** groups and totals data without writing formulas. Select your table, choose Insert > PivotTable, then drag fields into **Rows**, **Columns** and **Values**.

For example, drag Region to Rows and Sales to Values to see total sales per region. Refresh the pivot after your data changes."""),
  ('Charts that communicate', 10, """## Pick the right chart
- **Line** for trends over time.
- **Column or bar** for comparing categories.
- **Pie** only for a few parts of a whole.

Add a clear title that states the message, remove clutter, and label the axes. A chart should answer one question at a glance."""),
 ],
 'quiz': [
  ('Every Excel formula begins with which symbol?', ['#', '=', '@', '$'], 1),
  ('Which function adds a range of numbers?', ['COUNT', 'ADD', 'SUM', 'TOTAL'], 2),
  ('What does a $ sign in $B$1 do?', ['Formats as currency', 'Locks the reference when copied', 'Deletes the cell', 'Creates a chart'], 1),
  ('A pivot table is used to:', ['Summarise data quickly', 'Send email', 'Protect a workbook', 'Spell-check'], 0),
  ('Which chart best shows a trend over time?', ['Pie', 'Line', 'Scatter of names', 'Table'], 1),
  ('Why convert a range into a Table?', ['Formulas and filters expand with new data', 'It encrypts the data', 'It makes the file read-only', 'It removes headers'], 0),
 ]
},
]
