# SEO Snippets to Add

## Open Graph Meta Tags

Add these tags to the `<head>` section of your main pages (after existing meta tags, before the title):

### For index.html (Homepage)
```html
<!-- Open Graph / Social Media -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.aciky.org/" />
<meta property="og:title" content="ACIKY - Yoga para Todos | Kundalini Yoga en Cuba" />
<meta property="og:description" content="Asociación Cubana de Instructores de Kundalini Yoga. Clases, espacios, sadhanas online, rutas doradas y más." />
<meta property="og:image" content="https://www.aciky.org/images/og-image.jpg" />
<meta property="og:locale" content="es_ES" />
<meta property="og:locale:alternate" content="en_US" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://www.aciky.org/" />
<meta name="twitter:title" content="ACIKY - Yoga para Todos" />
<meta name="twitter:description" content="Asociación Cubana de Instructores de Kundalini Yoga" />
<meta name="twitter:image" content="https://www.aciky.org/images/og-image.jpg" />

<!-- Additional SEO -->
<link rel="canonical" href="https://www.aciky.org/" />
<meta name="keywords" content="kundalini yoga, yoga cuba, ACIKY, clases de yoga, meditación" />
```

### For pages/schedule.html
```html
<!-- Open Graph / Social Media -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.aciky.org/pages/schedule.html" />
<meta property="og:title" content="Horario de Clases - ACIKY" />
<meta property="og:description" content="Encuentra tu clase perfecta de Kundalini Yoga. Horarios, ubicaciones e instructores." />
<meta property="og:image" content="https://www.aciky.org/images/og-image.jpg" />

<link rel="canonical" href="https://www.aciky.org/pages/schedule.html" />
```

### For pages/spaces.html
```html
<!-- Open Graph / Social Media -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.aciky.org/pages/spaces.html" />
<meta property="og:title" content="Espacios de Práctica - ACIKY" />
<meta property="og:description" content="Encuentra espacios de yoga en toda Cuba. Ubicaciones, instructores y disciplinas." />
<meta property="og:image" content="https://www.aciky.org/images/og-image.jpg" />

<link rel="canonical" href="https://www.aciky.org/pages/spaces.html" />
```

### For pages/blog.html
```html
<!-- Open Graph / Social Media -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.aciky.org/pages/blog.html" />
<meta property="og:title" content="Blog - ACIKY" />
<meta property="og:description" content="Artículos, reflexiones y enseñanzas sobre Kundalini Yoga y espiritualidad." />
<meta property="og:image" content="https://www.aciky.org/images/og-image.jpg" />

<link rel="canonical" href="https://www.aciky.org/pages/blog.html" />
```

### For pages/about.html
```html
<!-- Open Graph / Social Media -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.aciky.org/pages/about.html" />
<meta property="og:title" content="Sobre Nosotros - ACIKY" />
<meta property="og:description" content="Conoce la misión, visión y equipo de ACIKY. Promoviendo Kundalini Yoga en Cuba desde 2022." />
<meta property="og:image" content="https://www.aciky.org/images/og-image.jpg" />

<link rel="canonical" href="https://www.aciky.org/pages/about.html" />
```

### For pages/contact.html
```html
<!-- Open Graph / Social Media -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.aciky.org/pages/contact.html" />
<meta property="og:title" content="Contacto - ACIKY" />
<meta property="og:description" content="Contáctanos para más información sobre clases, espacios o colaboraciones." />
<meta property="og:image" content="https://www.aciky.org/images/og-image.jpg" />

<link rel="canonical" href="https://www.aciky.org/pages/contact.html" />
```

---

## Creating Your Open Graph Image

The `og-image.jpg` is what appears when someone shares your site on WhatsApp, Facebook, etc.

### Requirements
- **Size**: 1200 x 630 pixels (exact)
- **Format**: JPG or PNG
- **File size**: Under 300KB
- **Location**: `public/images/og-image.jpg`

### What to Include
1. **ACIKY logo** (prominent)
2. **Tagline**: "Yoga para Todos" or "Kundalini Yoga en Cuba"
3. **Simple background** (primary green color or yoga image)
4. **Readable text** (large enough to read in preview)

### Design Tips
- Keep text to minimum
- Use high contrast (white text on dark background or vice versa)
- Don't put important info on edges (may be cropped)
- Test preview on WhatsApp before finalizing

### Quick Creation Options
1. **Canva** (easiest): Use "Facebook Post" template (1200x630)
2. **Figma** (free): Create frame 1200x630px
3. **Photoshop**: Create new document 1200x630px

---

## Google Analytics Code

Once you have your Google Analytics Measurement ID (looks like `G-XXXXXXXXXX`), add this to EVERY HTML page's `<head>` section, right before `</head>`:

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

**Replace `G-XXXXXXXXXX` with your actual Measurement ID from Google Analytics**

Pages that need this:
- ✅ index.html
- ✅ All pages in /pages/ folder
- ❌ DON'T add to admin pages (optional - you might not want to track admin activity)

---

## Structured Data (JSON-LD) for Homepage

Add this script right before `</body>` in `index.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ACIKY",
  "alternateName": "Asociación Cubana de Instructores de Kundalini Yoga",
  "url": "https://www.aciky.org",
  "logo": "https://www.aciky.org/images/logo/logo.svg",
  "description": "Asociación Cubana de Instructores de Kundalini Yoga. Clases, espacios y eventos en toda Cuba.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "CU"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+53-5-0759360",
    "contactType": "customer service"
  },
  "sameAs": [
    "https://www.facebook.com/aciky",
    "https://www.instagram.com/aciky"
  ]
}
</script>
```

This helps Google understand your organization and may enable rich results in search.

---

## Update robots.txt for Production

When you get your domain, update `public/robots.txt` to use your real domain:

**Before**:
```
Sitemap: https://www.aciky.org/sitemap.xml
```

**After** (replace with YOUR domain):
```
Sitemap: https://www.YOUR-ACTUAL-DOMAIN.org/sitemap.xml
```

Same for `public/sitemap.xml` - replace all instances of `https://www.aciky.org` with your actual domain.

---

## Priority Order (Do These First)

1. **Critical** (Do before domain launch):
   - [ ] Create og-image.jpg
   - [ ] Add Open Graph tags to index.html
   - [ ] Add Google Analytics to all pages
   - [ ] Update robots.txt and sitemap.xml with final domain

2. **Important** (Do within first week):
   - [ ] Add Open Graph tags to main pages (schedule, spaces, blog, about, contact)
   - [ ] Add structured data to homepage
   - [ ] Test sharing on WhatsApp and Facebook

3. **Nice to Have** (Do within first month):
   - [ ] Add Open Graph tags to remaining pages
   - [ ] Create custom images for different pages
   - [ ] Add more detailed structured data
