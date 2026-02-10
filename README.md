# ACIKY Frontend

Web platform for ACIKY Kundalini Yoga center. Built with HTML5, Tailwind CSS 4, Vanilla JavaScript, and Vite 7.

## 🚀 Live Demo

**Production:** [https://camachoeng.github.io/ACIKY-frontend/](https://camachoeng.github.io/ACIKY-frontend/)

## 📋 Tech Stack

- **HTML5** - Semantic markup with Handlebars partials
- **Tailwind CSS 4** - Utility-first styling with custom theme
- **Vanilla JavaScript (ES2022+)** - No frameworks, pure modern JS
- **Vite 7** - Fast build tool and dev server
- **GitHub Pages** - Static hosting
- **Backend API** - Node.js + Express + MySQL (separate repo)

## 🛠️ Development

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/camachoeng/ACIKY-frontend.git
cd ACIKY-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Build for production
npm run preview   # Preview production build locally
```

### Development Server

The development server runs at `http://localhost:5173` with hot module replacement enabled.

## 📦 Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder with:
- Minified HTML, CSS, and JavaScript
- Asset optimization and fingerprinting
- Correct base path for GitHub Pages (`/ACIKY-frontend/`)

## 🌐 GitHub Pages Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Automatic Deployment

Every push to the `main` branch triggers an automatic deployment:

1. GitHub Actions workflow runs (`/.github/workflows/deploy.yml`)
2. Dependencies are installed
3. Production build is created
4. Build artifacts are deployed to GitHub Pages

### Manual Setup (One-Time)

To enable GitHub Pages for your fork:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select:
   - Source: `GitHub Actions`
4. The site will be available at: `https://[username].github.io/ACIKY-frontend/`

### Deployment Status

Check deployment status:
- Go to the **Actions** tab in your repository
- Look for "Deploy to GitHub Pages" workflow runs
- Green checkmark = successful deployment
- Red X = failed deployment (check logs)

## 📁 Project Structure

```
ACIKY-frontend/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── pages/                      # HTML pages
│   ├── admin/                  # Admin panel pages
│   ├── instructor/             # Instructor pages
│   └── *.html                  # Public pages
├── public/
│   ├── images/                 # Static images
│   └── .nojekyll               # Prevents Jekyll processing
├── src/
│   ├── js/                     # JavaScript modules
│   │   ├── admin/              # Admin modules
│   │   ├── api.js              # API wrapper
│   │   └── auth.js             # Authentication
│   ├── partials/               # Handlebars partials
│   ├── main.js                 # Entry point
│   └── style.css               # Tailwind + theme
├── index.html                  # Home page
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies
```

## 🎨 Styling

This project uses Tailwind CSS 4 with custom theme tokens defined in `src/style.css`:

- `primary` (#708558) - Main brand green
- `accent-teal` (#5AACCC) - Instructor badge
- `accent-rose` (#E87A9A) - Admin badge
- `accent-terracotta` (#E8A090) - Warnings

## 🔐 Authentication

The app uses session-based authentication with:
- httpOnly cookies (primary)
- localStorage fallback
- Role-based access (user, instructor, admin)

## 📝 Contributing

Please refer to `CLAUDE.md` for detailed development guidelines, coding standards, and project conventions.

### Key Conventions

- No TypeScript, React, or other frameworks
- Semantic HTML5 only
- ES2022+ JavaScript with async/await
- Mobile-first responsive design
- All API calls through `apiFetch()` wrapper

## 📄 License

This project is private and proprietary.

## 🔗 Related Repositories

- **Backend API:** `yoga-backend` (separate repository)

## 🐛 Issues

Report issues in the GitHub Issues tab.

## 📞 Support

For support, contact the development team.
