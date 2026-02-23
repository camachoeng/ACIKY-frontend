# ACIKY Deployment & Domain Setup Guide

## Current Status: What's Missing for Production

### ✅ What You Have
- ✅ Good HTML structure with meta descriptions
- ✅ Responsive design (mobile-first)
- ✅ Favicon configured
- ✅ Proper build process (Vite)
- ✅ Clean URLs

### ❌ What You Need Before Going Live

#### 1. SEO Essentials (Critical)
- ❌ **robots.txt** - Tells search engines what to index
- ❌ **sitemap.xml** - Helps search engines find all your pages
- ❌ **Open Graph tags** - For social media sharing (Facebook, WhatsApp)
- ❌ **Structured data** - Helps Google understand your business
- ❌ **Better meta descriptions** - Some pages need Spanish/English descriptions
- ❌ **Canonical URLs** - Prevents duplicate content issues

#### 2. Analytics & Monitoring
- ❌ **Google Analytics** - Track visitors
- ❌ **Google Search Console** - Monitor search performance
- ❌ **Facebook Pixel** (optional) - If you plan to run ads

#### 3. Performance & Security
- ❌ **404 Page** - Custom error page
- ❌ **Security headers** - HTTPS, CSP, etc.
- ❌ **Image optimization** - Some images might be too large

#### 4. Legal & Privacy (Important in many countries)
- ❌ **Privacy Policy page**
- ❌ **Terms of Service** (if collecting user data)
- ❌ **Cookie consent** (if using analytics/cookies)

---

## Step-by-Step: Getting Your Custom Domain

### Phase 1: Buy Your Domain (15 minutes)

#### Option A: Namecheap (Recommended - Affordable)
1. Go to [namecheap.com](https://www.namecheap.com)
2. Search for your desired domain (examples):
   - `aciky.org` - Best for non-profit organizations
   - `aciky.com` - Most popular, but might be taken
   - `acikycuba.com` - More specific
   - `acikyyoga.com` - Descriptive
3. Check availability and price (usually $10-15/year for .com, $5-10 for .org)
4. Create account and purchase
5. **Don't buy hosting** - you already have GitHub Pages (free!)

#### Option B: Cloudflare Registrar (Cheapest at-cost pricing)
1. Go to [cloudflare.com](https://www.cloudflare.com)
2. Create account (free)
3. Add your desired domain
4. Follow transfer/registration process
5. Benefit: Free SSL, CDN, and better security included

#### Option C: Google Domains / Squarespace (Easy but more expensive)
- More expensive ($12-20/year) but very beginner-friendly

**My Recommendation**: Start with **Namecheap** for the domain, then use **Cloudflare** (free plan) for DNS management. Best of both worlds.

---

### Phase 2: Connect Domain to GitHub Pages (30 minutes)

#### Step 1: Configure GitHub Repository
1. Go to your GitHub repository: `https://github.com/YOUR-USERNAME/ACIKY-frontend`
2. Click **Settings** (top menu)
3. Scroll to **Pages** (left sidebar)
4. Under "Custom domain", enter your new domain: `www.aciky.org`
5. Click **Save**
6. Check "Enforce HTTPS" (wait 24 hours for certificate if not available immediately)

#### Step 2: Configure DNS at Your Domain Registrar
You need to add these DNS records:

**For Apex Domain (aciky.org):**
```
Type: A
Name: @ (or leave blank)
Value: 185.199.108.153
TTL: Automatic or 3600

Type: A
Name: @ (or leave blank)
Value: 185.199.109.153
TTL: Automatic or 3600

Type: A
Name: @ (or leave blank)
Value: 185.199.110.153
TTL: Automatic or 3600

Type: A
Name: @ (or leave blank)
Value: 185.199.111.153
TTL: Automatic or 3600
```

**For WWW Subdomain (www.aciky.org):**
```
Type: CNAME
Name: www
Value: YOUR-GITHUB-USERNAME.github.io
TTL: Automatic or 3600
```

#### Step 3: Wait for DNS Propagation
- DNS changes take 1-48 hours (usually 1-4 hours)
- Check status: [dnschecker.org](https://dnschecker.org)

#### Step 4: Update Vite Config
After domain is working, update `vite.config.js`:
```javascript
// Change line 7 from:
const basePath = command === 'build' ? '/ACIKY-frontend' : ''

// To (for custom domain):
const basePath = '' // Empty for custom domain
```

---

### Phase 3: Add Essential SEO Files (Required!)

#### Create robots.txt
Create `public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /pages/admin/
Disallow: /pages/instructor/
Disallow: /pages/dashboard.html
Disallow: /pages/login.html
Disallow: /pages/register.html

Sitemap: https://www.aciky.org/sitemap.xml
```

#### Create sitemap.xml
Create `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.aciky.org/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/about.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/schedule.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/spaces.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/blog.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/golden-routes.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/testimonials.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/contact.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/rebirthing.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.aciky.org/pages/onlinesadhana.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

#### Add Open Graph Tags to Header Partial
Update `src/partials/header.hbs` to include in `<head>`:
```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.aciky.org/" />
<meta property="og:title" content="ACIKY - Yoga para Todos" />
<meta property="og:description" content="Asociación de Kundalini Yoga en Cuba. Clases, espacios, rutas doradas y más." />
<meta property="og:image" content="https://www.aciky.org/images/og-image.jpg" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://www.aciky.org/" />
<meta property="twitter:title" content="ACIKY - Yoga para Todos" />
<meta property="twitter:description" content="Asociación de Kundalini Yoga en Cuba." />
<meta property="twitter:image" content="https://www.aciky.org/images/og-image.jpg" />
```

**Important**: Create an Open Graph image at `public/images/og-image.jpg`:
- Size: 1200x630 pixels
- Content: ACIKY logo + tagline
- Format: JPG (keep under 300KB)

---

### Phase 4: Add Google Analytics (Track Visitors)

#### Step 1: Create Google Analytics Account
1. Go to [analytics.google.com](https://analytics.google.com)
2. Sign in with Google account
3. Click "Start measuring"
4. Create account name: "ACIKY"
5. Create property: "ACIKY Website"
6. Enter website details
7. Get your **Measurement ID** (looks like `G-XXXXXXXXXX`)

#### Step 2: Add to Your Website
Add to `src/partials/header.hbs` before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

### Phase 5: Setup Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property: `https://www.aciky.org`
3. Verify ownership (DNS verification recommended):
   - Copy the TXT record
   - Add to your domain DNS settings
   - Wait and verify
4. Submit sitemap: `https://www.aciky.org/sitemap.xml`

---

## Pre-Launch Checklist

### Technical
- [ ] All images optimized (compress large images)
- [ ] Test site on mobile devices
- [ ] Test all forms work
- [ ] Test WhatsApp links work
- [ ] 404 page created
- [ ] HTTPS working (green padlock)
- [ ] Site loads in under 3 seconds

### SEO
- [ ] robots.txt created
- [ ] sitemap.xml created and submitted
- [ ] Open Graph tags added
- [ ] Google Analytics installed
- [ ] Google Search Console setup
- [ ] All pages have unique titles
- [ ] All pages have meta descriptions

### Content
- [ ] Check all Spanish text for typos
- [ ] Check all English translations
- [ ] Add Privacy Policy page
- [ ] Test email addresses work
- [ ] Test phone numbers work

### Testing
- [ ] Test on Chrome, Safari, Firefox
- [ ] Test on iPhone and Android
- [ ] Share link on WhatsApp (check preview)
- [ ] Share link on Facebook (check preview)
- [ ] Ask friends to test booking flow

---

## Common First-Time Mistakes to Avoid

1. **Not testing on mobile** - 70% of users will be on phones
2. **Forgetting to compress images** - Slows down site
3. **No analytics** - You won't know what's working
4. **Not submitting sitemap** - Google won't find all pages
5. **Hardcoded URLs** - Use relative URLs (you did this correctly!)
6. **No 404 page** - Users get confused when page not found
7. **No SSL/HTTPS** - Browsers show "Not Secure" warning
8. **Forgetting social meta tags** - Links look bad when shared

---

## Timeline Summary

- **Day 1**: Buy domain, configure DNS (2 hours)
- **Day 1-2**: Wait for DNS propagation (automated)
- **Day 2**: Update vite.config, add SEO files, test (2 hours)
- **Day 3**: Setup analytics and Search Console (1 hour)
- **Day 4**: Final testing, soft launch (2 hours)
- **Week 1-2**: Monitor analytics, fix any issues

---

## Cost Summary

### One-Time
- Domain: $10-15/year
- (Optional) Professional email: $6/month if you want info@aciky.org

### Free Forever
- ✅ GitHub Pages hosting: **FREE**
- ✅ Cloudflare CDN & SSL: **FREE**
- ✅ Google Analytics: **FREE**
- ✅ Google Search Console: **FREE**

**Total first year cost: ~$10-15** (just the domain!)

---

## Need Help? Common Issues

### "My domain isn't working after 24 hours"
- Check DNS propagation: [dnschecker.org](https://dnschecker.org)
- Verify A records point to correct GitHub IPs
- Check GitHub Pages settings show your domain

### "I get 404 errors after domain change"
- Update `basePath` in `vite.config.js` to empty string
- Rebuild: `npm run build`
- Commit and push to GitHub

### "Links are broken after domain change"
- Your code already uses relative URLs correctly
- Just update `basePath` in vite.config

### "WhatsApp preview shows no image"
- Create og-image.jpg (1200x630px)
- Add Open Graph meta tags
- Test: [opengraph.xyz](https://www.opengraph.xyz)

---

## Next Steps After Launch

1. **Week 1**: Monitor Google Analytics daily, fix issues
2. **Week 2**: Share on social media, WhatsApp groups
3. **Month 1**: Start creating SEO content (blog posts)
4. **Month 2**: Analyze top pages, improve them
5. **Month 3**: Consider Google Ads if budget allows

---

## Resources

- [GitHub Pages Custom Domain Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Google Analytics Setup](https://support.google.com/analytics/answer/1008015)
- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)

---

**Questions?** This is your first deployment, so it's normal to have questions. Common beginner concerns:
- "Will I break something?" - Probably not! GitHub keeps all versions
- "What if I choose wrong domain?" - You can always buy another later
- "Do I need the www?" - No, but it looks more professional
- "Can I change domain later?" - Yes, but involves redirects
