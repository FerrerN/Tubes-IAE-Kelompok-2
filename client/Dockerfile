# ── Build Stage ──────────────────────────────────────────────────────────────
# Menggunakan nginx:alpine yang ringan untuk serve static files
FROM nginx:alpine

# Hapus konfigurasi default Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Salin konfigurasi custom Nginx
COPY nginx.conf /etc/nginx/conf.d/

# Salin semua file statis client ke direktori default Nginx
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Jalankan Nginx di foreground
CMD ["nginx", "-g", "daemon off;"]
