import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import handlebars from 'vite-plugin-handlebars'
import { resolve } from 'path'

export default defineConfig(() => {
  const basePath = '' // Empty for custom domain (aciky.org)

  return {
    base: basePath + '/',
    plugins: [
      tailwindcss(),
      handlebars({
        partialDirectory: resolve(__dirname, 'src/partials'),
        context: {
          siteName: 'ACIKY',
          siteTitle: 'ACIKY - Alianza Cubana de Instructores en Kundalini Yoga',
          year: new Date().getFullYear(),
          basePath
        }
      })
    ],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          about: resolve(__dirname, 'pages/about.html'),
          posturas: resolve(__dirname, 'pages/posturas.html'),
          videos: resolve(__dirname, 'pages/videos.html'),
          schedule: resolve(__dirname, 'pages/schedule.html'),
          login: resolve(__dirname, 'pages/login.html'),
          register: resolve(__dirname, 'pages/register.html'),
          dashboard: resolve(__dirname, 'pages/dashboard.html'),
          adminDashboard: resolve(__dirname, 'pages/admin/dashboard.html'),
          adminUsers: resolve(__dirname, 'pages/admin/users.html'),
          adminSchedule: resolve(__dirname, 'pages/admin/schedule.html'),
          adminPosturas: resolve(__dirname, 'pages/admin/posturas.html'),
          adminVideos: resolve(__dirname, 'pages/admin/videos.html'),
          adminBlog: resolve(__dirname, 'pages/admin/blog.html'),
          adminTestimonials: resolve(__dirname, 'pages/admin/testimonials.html'),
          adminGoldenRoutes: resolve(__dirname, 'pages/admin/golden-routes.html'),
          adminSpaces: resolve(__dirname, 'pages/admin/spaces.html'),
          adminTeamOrder: resolve(__dirname, 'pages/admin/team-order.html'),
          adminCleanup: resolve(__dirname, 'pages/admin/cleanup.html'),
          blog: resolve(__dirname, 'pages/blog.html'),
          testimonials: resolve(__dirname, 'pages/testimonials.html'),
          goldenRoutes: resolve(__dirname, 'pages/golden-routes.html'),
          contact: resolve(__dirname, 'pages/contact.html'),
          rebirthing: resolve(__dirname, 'pages/rebirthing.html'),
          onlinesadhana: resolve(__dirname, 'pages/onlinesadhana.html'),
          festival: resolve(__dirname, 'pages/festival.html'),
          spaces: resolve(__dirname, 'pages/spaces.html'),
          instructorClasses: resolve(__dirname, 'pages/instructor/my-classes.html'),
          instructorMySpace: resolve(__dirname, 'pages/instructor/my-space.html'),
          instructorMyRebirthing: resolve(__dirname, 'pages/instructor/my-rebirthing.html'),
          adminRebirthing: resolve(__dirname, 'pages/admin/rebirthing.html'),
          verifyEmail: resolve(__dirname, 'pages/verify-email.html'),
          event: resolve(__dirname, 'pages/event.html'),
          adminEvents: resolve(__dirname, 'pages/admin/events.html'),
          adminFestival: resolve(__dirname, 'pages/admin/festival.html'),
          adminOnlineSadhana: resolve(__dirname, 'pages/admin/online-sadhana.html'),
          forgotPassword: resolve(__dirname, 'pages/forgot-password.html'),
          resetPassword: resolve(__dirname, 'pages/reset-password.html'),
          privacy: resolve(__dirname, 'pages/privacy.html'),
          terms: resolve(__dirname, 'pages/terms.html'),
          notFound: resolve(__dirname, 'pages/404.html')
        }
      }
    }
  }
})
