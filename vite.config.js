import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import handlebars from 'vite-plugin-handlebars'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  const basePath = command === 'build' ? '/ACIKY-frontend' : ''

  return {
    base: basePath + '/',
    plugins: [
      tailwindcss(),
      handlebars({
        partialDirectory: resolve(__dirname, 'src/partials'),
        context: {
          siteName: 'ACIKY',
          siteTitle: 'ACIKY - Yoga para Todos',
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
          blog: resolve(__dirname, 'pages/blog.html'),
          testimonials: resolve(__dirname, 'pages/testimonials.html'),
          instructorClasses: resolve(__dirname, 'pages/instructor/my-classes.html'),
          verifyEmail: resolve(__dirname, 'pages/verify-email.html')
        }
      }
    }
  }
})
