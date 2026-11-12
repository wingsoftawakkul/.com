# Wings of Tawakkul website: set up your admin page

Once set up, you edit your website at **yoursite.com/admin**: log in, change books,
prices, photos, printables, articles and page text in simple forms, press **Publish**,
and the live website updates in about a minute. Works on computer and phone.

One-time setup takes about 20–30 minutes on a computer.

---

## Step 1: Put the files on GitHub (free)

GitHub stores your website files so the admin page can save your changes.

1. Sign up at **github.com/signup**.
2. Click **+** (top right) → **New repository**.
   - Repository name: `wings-of-tawakkul`
   - Choose **Private**
   - Leave everything else as it is → **Create repository**.
3. On the next page, click the link **uploading an existing file**.
4. Unzip `wings-of-tawakkul.zip` on your computer and open the folder.
   Select **everything inside it** (`index.html`, `admin`, `content`, `css`, `js`, `images`, `README.md`)
   and drag it all onto the GitHub page.
5. Wait for the uploads to finish, then click **Commit changes**.

Check: your repository should show the folders `admin`, `content`, `css`, `images`, `js` and the file `index.html` at the top level.

## Step 2: Connect GitHub to Netlify

1. Log in at **app.netlify.com**.
2. **Add new project** (or "Add new site") → **Import an existing project** → **GitHub**.
3. Allow Netlify to access GitHub, then pick **wings-of-tawakkul**.
4. Leave the build command and publish directory **empty** → **Deploy**.
5. Open the address Netlify gives you (e.g. `something.netlify.app`) to check the site.
   Change it under **Project configuration → Change project name** if you like.

If you uploaded the site earlier by drag-and-drop, you can delete that old project
(**Project configuration → Delete project**) once the new one works.

## Step 3: Turn on the admin login

In your new Netlify project:

1. **Project configuration → Identity → Enable Identity.**
2. Under **Registration**, set it to **Invite only** (so nobody else can sign up).
3. Under **Services → Git Gateway**, click **Enable Git Gateway**.
4. Open the **Identity** tab of the project → **Invite users** → enter your email.
5. Open the invite email, click the link, and choose your password.
   You'll be taken to the admin page.

## Step 4: Edit your website

1. Go to **yoursite.netlify.app/admin** (or **yourdomain.com/admin**) and log in.
2. Choose what to edit:
   - **Shop → Books**: titles, prices, photos, Payhip links, availability, homepage picks
   - **Shop → Printables**
   - **Journal → Articles**: write or edit blog posts
   - **Pages & settings**: homepage text, Instagram, About, FAQ, Shipping, Privacy
3. Click an item to open it, make your changes, then press **Publish** (top right).
4. The live website updates in about a minute. Refresh to see it.

Tips
- **Add a book:** in Books, click **Add books** at the top of the list.
- **Book photo:** in a book, click **Choose an image** and upload a front-cover photo (portrait shape).
- **Sold out:** change **Availability** to Sold out. The Buy button changes to "Ask us".
- **Homepage:** turn on **Show on homepage** for the books you want featured.
- **Qur'an quotes in articles:** use the quote button. Put the Arabic on its own line,
  the English on the next, and the reference on a last line starting with `— `.
- Prices on the website don't update from Payhip by themselves. When you change a
  price on Payhip, change it here too.

## Step 5: Your own domain (e.g. wingsoftawakkul.com)

**Easiest:** in Netlify, **Domain management → Add a domain** → type the domain you want → buy it.
Netlify sets it up automatically, including HTTPS.

**Already own a domain elsewhere?** Add it in Netlify (**Domain management → Add a domain**, choose external DNS),
then in your domain company's DNS settings add:

| Type | Host / Name | Value |
|---|---|---|
| A | `@` | `75.2.60.5` |
| CNAME | `www` | `yourprojectname.netlify.app` |

It can take up to a day to start working.

---

## For reference: where things live

| Folder | What's inside |
|---|---|
| `content/` | All your text, products and articles (edited by the admin page) |
| `images/` | Photos you upload in the admin page |
| `admin/` | The admin page itself |
| `css/`, `js/` | The website's design and code. No need to touch these. |
