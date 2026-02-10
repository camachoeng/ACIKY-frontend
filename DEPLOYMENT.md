# GitHub Pages Deployment Guide

## Overview

This repository is configured for automatic deployment to GitHub Pages using GitHub Actions. Every push to the `main` branch triggers a deployment.

## Initial Setup (One-Time)

Follow these steps to enable GitHub Pages for this repository:

### 1. Enable GitHub Pages

1. Navigate to your repository on GitHub: `https://github.com/camachoeng/ACIKY-frontend`
2. Click on **Settings** (gear icon in the top navigation)
3. In the left sidebar, click **Pages** (under "Code and automation")
4. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions` from the dropdown
   - This tells GitHub to use the workflow file (`.github/workflows/deploy.yml`) for deployment

### 2. Verify Workflow Permissions

Ensure the workflow has the necessary permissions:

1. In **Settings**, go to **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Ensure **Read and write permissions** is selected
4. Check **Allow GitHub Actions to create and approve pull requests** (if needed)
5. Click **Save**

### 3. Trigger Initial Deployment

The easiest way to trigger the first deployment:

1. Make a small change (e.g., update README.md)
2. Commit and push to `main` branch
3. Or manually trigger the workflow:
   - Go to **Actions** tab
   - Select "Deploy to GitHub Pages"
   - Click **Run workflow** → **Run workflow**

## Monitoring Deployments

### Check Deployment Status

1. Go to the **Actions** tab in your repository
2. Look for workflow runs named "Deploy to GitHub Pages"
3. Status indicators:
   - 🟡 **Yellow dot** = In progress
   - ✅ **Green checkmark** = Successful
   - ❌ **Red X** = Failed

### View Deployment Logs

If a deployment fails:

1. Click on the failed workflow run
2. Click on the job name (`build-and-deploy`)
3. Expand each step to see detailed logs
4. Common issues:
   - Build errors (fix code and push again)
   - Permission errors (check workflow permissions)
   - Dependency issues (check `package.json` and `package-lock.json`)

### Access Your Site

After successful deployment, your site will be available at:

**Production URL:** `https://camachoeng.github.io/ACIKY-frontend/`

**Note:** It may take 2-5 minutes for changes to appear after deployment completes.

## How It Works

### Automatic Deployment Process

1. **Trigger**: Push to `main` branch
2. **Checkout**: GitHub Actions checks out your code
3. **Setup**: Node.js 20 is installed
4. **Install**: Dependencies installed via `npm ci`
5. **Build**: Production build created via `npm run build`
6. **Deploy**: `dist/` folder deployed to GitHub Pages

### Important Files

- **`.github/workflows/deploy.yml`**: GitHub Actions workflow configuration
- **`vite.config.js`**: Build configuration with base path `/ACIKY-frontend/`
- **`public/.nojekyll`**: Prevents Jekyll processing (ensures all files are served)
- **`dist/`**: Build output folder (auto-generated, not committed)

### Base Path Configuration

The app is configured to work at the subpath `/ACIKY-frontend/`:

```javascript
// vite.config.js
const basePath = command === 'build' ? '/ACIKY-frontend' : ''
```

This ensures all asset links work correctly on GitHub Pages.

## Manual Deployment (Not Recommended)

While GitHub Actions handles deployment automatically, you can manually deploy if needed:

```bash
# Build locally
npm run build

# The dist/ folder contains the static files
# Manually upload to GitHub Pages settings (not recommended)
```

**Note:** Manual deployment is not recommended. Use the automated GitHub Actions workflow.

## Troubleshooting

### 404 Errors on Page Load

**Problem:** Direct navigation to pages (e.g., `/ACIKY-frontend/pages/about.html`) returns 404.

**Solution:** 
- Ensure `.nojekyll` file exists in `public/` folder
- Verify build includes `.nojekyll` in `dist/`
- Check that base path is correctly set in `vite.config.js`

### Assets Not Loading

**Problem:** CSS, JS, or images return 404.

**Solution:**
- Verify base path in `vite.config.js` matches repository name
- Check that asset paths in HTML use the base path
- Rebuild: `npm run build`

### Deployment Workflow Fails

**Problem:** GitHub Actions workflow shows errors.

**Solution:**
1. Check the workflow logs for specific errors
2. Common fixes:
   - Update `package-lock.json`: `npm install`
   - Fix build errors: `npm run build` locally
   - Check Node version matches workflow (v20)

### Changes Not Appearing

**Problem:** Pushed changes don't appear on live site.

**Solution:**
1. Check workflow completed successfully (green checkmark)
2. Wait 2-5 minutes for GitHub Pages cache to clear
3. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Clear browser cache

## Environment-Specific Behavior

### Development (`npm run dev`)

- Base path: `/` (root)
- Dev server: `http://localhost:5173`
- Hot reload enabled

### Production (`npm run build`)

- Base path: `/ACIKY-frontend/`
- Output: `dist/` folder
- Optimized and minified

## Custom Domain (Optional)

To use a custom domain:

1. In **Settings** → **Pages**
2. Under **Custom domain**, enter your domain (e.g., `aciky.com`)
3. Add DNS records per GitHub's instructions
4. Wait for DNS propagation (can take 24-48 hours)
5. Enable **Enforce HTTPS** after DNS is configured

## Security Notes

- The workflow uses `npm ci` for reproducible builds
- Permissions are scoped to minimum required
- Only `main` branch triggers deployments
- All secrets managed through GitHub Actions

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite GitHub Pages Deployment](https://vitejs.dev/guide/static-deploy.html#github-pages)

## Support

For deployment issues:

1. Check **Actions** tab for error logs
2. Review this guide
3. Consult team or repository maintainers
4. Create an issue with:
   - Error message
   - Workflow logs
   - Steps to reproduce
