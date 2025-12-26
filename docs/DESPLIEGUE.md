# 🚀 Guía de Despliegue en Producción - GallinaApp

## ☁️ Opción 1: Despliegue en DigitalOcean / AWS EC2

### 1. Configurar el Servidor

```bash
# Conectar al servidor
ssh root@tu-servidor

# Actualizar paquetes
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx
apt install -y nginx

# Instalar PM2 (gestor de procesos)
npm install -g pm2
```

### 2. Configurar PostgreSQL

```bash
# Cambiar a usuario postgres
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE gallinaapp;
CREATE USER gallinauser WITH ENCRYPTED PASSWORD 'tu_password_super_seguro';
GRANT ALL PRIVILEGES ON DATABASE gallinaapp TO gallinauser;
\q

# Configurar acceso remoto (opcional)
nano /etc/postgresql/*/main/pg_hba.conf
# Añadir: host all all 0.0.0.0/0 md5

# Reiniciar PostgreSQL
systemctl restart postgresql
```

### 3. Clonar y Configurar la Aplicación

```bash
# Crear directorio
mkdir -p /var/www/gallinaapp
cd /var/www/gallinaapp

# Clonar repositorio
git clone <url-repo> .

# Instalar dependencias del backend
cd backend
npm install --production

# Configurar variables de entorno
cp .env.example .env
nano .env

# Editar .env con valores de producción:
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=gallinaapp
DB_USER=gallinauser
DB_PASSWORD=tu_password_super_seguro
JWT_SECRET=genera_un_secreto_aleatorio_muy_largo
ALLOWED_ORIGINS=https://tudominio.com

# Ejecutar schema
psql -U gallinauser -d gallinaapp -f ../database/schema.sql

# Build del frontend
cd ../frontend
npm install
npm run build
```

### 4. Configurar PM2

```bash
# Desde /var/www/gallinaapp/backend
pm2 start src/index.js --name gallinaapp-api
pm2 startup
pm2 save
```

### 5. Configurar Nginx

```bash
nano /etc/nginx/sites-available/gallinaapp
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend
    location / {
        root /var/www/gallinaapp/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Activar sitio:

```bash
ln -s /etc/nginx/sites-available/gallinaapp /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 6. Configurar SSL con Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tudominio.com -d www.tudominio.com
```

### 7. Configurar Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## ☁️ Opción 2: Despliegue con Docker

### 1. Crear Dockerfile para Backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### 2. Crear docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gallinaapp
      POSTGRES_USER: gallinauser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_NAME: gallinaapp
      DB_USER: gallinauser
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 3. Desplegar

```bash
docker-compose up -d
```

## 📊 Monitoreo y Mantenimiento

### Ver logs

```bash
# PM2
pm2 logs gallinaapp-api

# Docker
docker-compose logs -f
```

### Backup de Base de Datos

```bash
# Crear backup
pg_dump -U gallinauser gallinaapp > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U gallinauser gallinaapp < backup_20241112.sql

# Backup automático (cron)
crontab -e
# Añadir: 0 2 * * * pg_dump -U gallinauser gallinaapp > /backups/db_$(date +\%Y\%m\%d).sql
```

### Actualizar la Aplicación

```bash
cd /var/www/gallinaapp

# Pull de cambios
git pull origin main

# Actualizar backend
cd backend
npm install --production
pm2 restart gallinaapp-api

# Actualizar frontend
cd ../frontend
npm install
npm run build
```

## 🔒 Lista de Verificación de Seguridad

- [ ] JWT_SECRET aleatorio y seguro (mínimo 32 caracteres)
- [ ] Contraseñas fuertes para PostgreSQL
- [ ] Firewall configurado (solo puertos 80, 443, 22)
- [ ] SSL/HTTPS habilitado
- [ ] CORS configurado correctamente
- [ ] Rate limiting activado
- [ ] Backups automáticos programados
- [ ] Logs siendo monitoreados
- [ ] Actualizaciones de seguridad del sistema
- [ ] Variables de entorno no expuestas en el código

## 💰 Estimación de Costos Mensuales

### DigitalOcean / AWS
- **Droplet/EC2 básico**: $5-10/mes
- **Base de datos**: Incluido
- **Dominio**: $10-15/año
- **Total**: ~$5-15/mes

### Vercel + Railway (alternativa serverless)
- **Frontend (Vercel)**: Gratis
- **Backend + DB (Railway)**: $5-10/mes
- **Total**: $5-10/mes

## 📞 Soporte Post-Despliegue

Para problemas en producción:
- Revisar logs: `pm2 logs gallinaapp-api`
- Verificar estado: `pm2 status`
- Reiniciar: `pm2 restart gallinaapp-api`
- Contacto: soporte@gallinaapp.com
