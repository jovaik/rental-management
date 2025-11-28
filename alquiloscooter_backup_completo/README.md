# 📦 BACKUP COMPLETO DE ALQUILOSCOOTER

**Fecha del Backup**: 25 de Noviembre de 2025  
**Versión**: Optimizada con Gantt sincronizados y matrículas completas  
**Tamaño aproximado**: ~300 MB (sin node_modules ni builds)  

---

## 📝 CONTENIDO DEL BACKUP

### ✅ **INCLUIDO EN ESTE BACKUP**

#### 1. **Código Fuente Completo**
- ✅ Todas las páginas (app/)
- ✅ Todos los componentes (components/)
- ✅ Todas las APIs (app/api/)
- ✅ Todas las utilidades (lib/)
- ✅ Tipos TypeScript (types/)
- ✅ Hooks personalizados (hooks/)

#### 2. **Configuración**
- ✅ package.json (dependencias)
- ✅ yarn.lock (versiones exactas)
- ✅ tsconfig.json (TypeScript)
- ✅ next.config.js (Next.js)
- ✅ tailwind.config.ts (estilos)
- ✅ .env (PLANTILLA con variables)
- ✅ prisma/schema.prisma (base de datos)

#### 3. **Documentación Técnica**
- ✅ Todos los archivos .md de correcciones
- ✅ Documentación del sistema de OCR
- ✅ Documentación de integraciones
- ✅ Guías de troubleshooting
- ✅ Manual de instalación completo

#### 4. **Scripts de Utilidad**
- ✅ Scripts de importación (import_rodeeo.js)
- ✅ Scripts de sincronización (sync_gscontrol_*.js)
- ✅ Scripts de diagnóstico
- ✅ Scripts de migración
- ✅ Scripts de seed (scripts/seed.ts)

#### 5. **Assets y Recursos**
- ✅ Logos e iconos (public/)
- ✅ Favicons y PWA icons
- ✅ Service Worker (sw.js)
- ✅ Manifest (manifest.json)

---

### ❌ **NO INCLUIDO** (Se generan o son externos)

1. **node_modules/** (4 GB)  
   ➡️ Se regenera con: `yarn install`

2. **.build/** o **.next/** (1.9 GB)  
   ➡️ Se regenera con: `yarn build`

3. **Base de datos PostgreSQL**  
   ➡️ Vive en tu servidor de base de datos  
   ➡️ El schema está incluido en prisma/schema.prisma

4. **Archivos en S3**  
   ➡️ Fotos de inspecciones  
   ➡️ Documentos de clientes  
   ➡️ PDFs de contratos  
   ➡️ Permanecen en tu cuenta de AWS S3

5. **Archivos en Google Drive**  
   ➡️ Documentos sincronizados  
   ➡️ Permanecen en tu cuenta de Google Drive

---

## 🚀 INICIO RÁPIDO

### Opción 1: Instalación Completa (RECOMENDADO)

**Lee el archivo**: `INSTALACION_SERVIDOR_PROPIO.md`

Este documento contiene:
- Requisitos del servidor
- Instalación paso a paso
- Configuración de servicios
- Troubleshooting completo

### Opción 2: Instalación Rápida (Desarrolladores experimentados)

```bash
# 1. Subir archivos al servidor
scp -r * usuario@tu-servidor:/var/www/alquiloscooter/

# 2. Conectar al servidor
ssh usuario@tu-servidor

# 3. Ir al directorio
cd /var/www/alquiloscooter

# 4. Configurar .env (IMPORTANTE)
nano .env
# Edita DATABASE_URL, NEXTAUTH_SECRET, AWS credentials, SMTP, etc.

# 5. Instalar dependencias
yarn install

# 6. Generar cliente Prisma
yarn prisma generate

# 7. Ejecutar migraciones
yarn prisma migrate deploy

# 8. Compilar aplicación
NODE_OPTIONS="--max-old-space-size=6144" yarn build

# 9. Iniciar aplicación
npm install -g pm2
pm2 start yarn --name "alquiloscooter" -- start
pm2 save

# 10. Acceder
# http://tu-servidor:3000
```

---

## 🔑 VARIABLES DE ENTORNO CRÍTICAS

**DEBES CONFIGURAR ESTAS VARIABLES EN `.env`**:

```env
# 1. BASE DE DATOS (OBLIGATORIO)
DATABASE_URL="postgresql://usuario:password@localhost:5432/alquiloscooter_db"

# 2. AUTENTICACIÓN (OBLIGATORIO)
NEXTAUTH_SECRET="genera-secreto-aleatorio-aqui"  # openssl rand -base64 32
NEXTAUTH_URL="https://tu-dominio.com"

# 3. AWS S3 (OBLIGATORIO para fotos)
AWS_REGION="eu-west-3"
AWS_ACCESS_KEY_ID="tu_access_key"
AWS_SECRET_ACCESS_KEY="tu_secret_key"
AWS_BUCKET_NAME="tu-bucket"
AWS_FOLDER_PREFIX="alquiloscooter/"

# 4. EMAIL (OBLIGATORIO)
SMTP_HOST="smtp.tu-servidor.com"
SMTP_PORT="587"
SMTP_USER="tu@email.com"
SMTP_PASSWORD="tu_password"
SMTP_FROM="AlquiloScooter <tu@email.com>"
ADMIN_EMAIL="admin@tu-empresa.com"

# 5. OPCIONALES
ABACUSAI_API_KEY="tu_api_key"  # Para OCR
GSCONTROLL_API_KEY="tu_api_key"  # Para contabilidad
GOOGLE_CLIENT_EMAIL="..."  # Para Google Drive
GOOGLE_PRIVATE_KEY="..."  # Para Google Drive
GOOGLE_DRIVE_FOLDER_ID="..."  # Para Google Drive
```

---

## 📊 VERIFICACIÓN DE INTEGRIDAD

### Archivos Clave que DEBEN Existir:

```bash
# Verificar estructura
ls -la

# Deben existir:
✅ package.json
✅ yarn.lock
✅ next.config.js
✅ tsconfig.json
✅ .env (o .env.example)
✅ prisma/schema.prisma
✅ app/
✅ components/
✅ lib/
✅ public/
✅ scripts/
```

---

## 🏗️ ESTRUCTURA DEL PROYECTO

```
alquiloscooter_backup_completo/
├── 📄 README.md (este archivo)
├── 📄 INSTALACION_SERVIDOR_PROPIO.md (guía completa)
├── 📄 package.json
├── 📄 yarn.lock
├── 📄 .env (plantilla)
├── 📄 next.config.js
├── 📄 tsconfig.json
├── 📄 tailwind.config.ts
├── 📜 *.md (documentación técnica)
├── 📁 app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── 📁 api/ (todas las APIs)
│   ├── 📁 dashboard/
│   ├── 📁 bookings/
│   ├── 📁 customers/
│   └── ... (todas las páginas)
├── 📁 components/
│   ├── 📁 dashboard/
│   ├── 📁 planning/
│   ├── 📁 modals/
│   ├── 📁 ui/
│   └── ...
├── 📁 lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── s3.ts
│   ├── google-drive.ts
│   └── ...
├── 📁 prisma/
│   ├── schema.prisma
│   └── 📁 migrations/
├── 📁 public/
│   ├── logo.png
│   ├── favicon.ico
│   ├── manifest.json
│   └── sw.js
├── 📁 scripts/
│   ├── seed.ts
│   └── ...
└── 📁 types/
    └── next-auth.d.ts
```

---

## ⚠️ IMPORTANTE

### ANTES DE INSTALAR:

1. **💾 Haz backup de tu base de datos actual** (si migras desde otro servidor)
2. **🔑 Ten preparadas todas las credenciales**:
   - AWS S3 (Access Key, Secret Key, Bucket Name)
   - SMTP (Host, Port, Usuario, Password)
   - Base de datos (Host, Usuario, Password)
3. **🖥️ Verifica recursos del servidor**:
   - Mínimo 8 GB RAM
   - 50 GB disco SSD
   - 4 CPU cores

### DURANTE LA INSTALACIÓN:

1. **NO olvides configurar `.env`** con tus credenciales reales
2. **Genera un NEXTAUTH_SECRET único**: `openssl rand -base64 32`
3. **Verifica permisos de archivos**: `chmod -R 755`
4. **Prueba primero en desarrollo**: `yarn dev` antes de produccion

### DESPUÉS DE INSTALAR:

1. **Crea un usuario administrador**
2. **Haz backup de la base de datos**
3. **Configura backups automáticos**
4. **Configura SSL/HTTPS** con Certbot
5. **Monitorea logs** regularmente

---

## 📞 SOPORTE Y AYUDA

### Si encuentras problemas:

1. **Lee primero**: `INSTALACION_SERVIDOR_PROPIO.md` (sección Troubleshooting)
2. **Verifica logs**:
   - PM2: `pm2 logs alquiloscooter`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
   - PostgreSQL: `sudo tail -f /var/log/postgresql/*.log`
3. **Verifica variables de entorno**: `cat .env`
4. **Verifica servicios**:
   - `sudo systemctl status postgresql`
   - `pm2 status`
   - `sudo systemctl status nginx`

---

## 🔄 ACTUALIZACIONES

Cuando recibas una nueva versión del backup:

```bash
# 1. Hacer backup de base de datos
pg_dump -U usuario alquiloscooter_db > backup_$(date +%Y%m%d).sql

# 2. Detener aplicación
pm2 stop alquiloscooter

# 3. Hacer backup del .env actual
cp .env .env.backup

# 4. Subir nuevos archivos (sobrescribir)
scp -r * usuario@servidor:/var/www/alquiloscooter/

# 5. Restaurar .env
cp .env.backup .env

# 6. Instalar nuevas dependencias
yarn install

# 7. Ejecutar migraciones
yarn prisma migrate deploy

# 8. Recompilar
NODE_OPTIONS="--max-old-space-size=6144" yarn build

# 9. Reiniciar
pm2 restart alquiloscooter
```

---

## ✅ CHECKLIST RÁPIDA

Antes de comprimir y descargar, verifica:

- [ ] Todos los archivos de código fuente están incluidos
- [ ] package.json y yarn.lock presentes
- [ ] prisma/schema.prisma existe
- [ ] Documentación .md incluida
- [ ] Scripts de utilidad incluidos
- [ ] Assets (logos, iconos) incluidos
- [ ] Archivo .env con plantilla (sin credenciales reales)

Después de descomprimir en el servidor:

- [ ] Archivos extraídos correctamente
- [ ] .env configurado con credenciales reales
- [ ] PostgreSQL instalado y configurado
- [ ] Base de datos creada
- [ ] Node.js 18+ o 20+ instalado
- [ ] Yarn instalado
- [ ] `yarn install` ejecutado exitosamente
- [ ] `yarn prisma generate` ejecutado
- [ ] `yarn prisma migrate deploy` ejecutado
- [ ] `yarn build` completado sin errores
- [ ] Aplicación iniciada con PM2
- [ ] Nginx configurado (si producción)
- [ ] SSL configurado con Certbot
- [ ] Aplicación accesible desde navegador
- [ ] Login funcionando correctamente

---

## 🎉 ¡LISTO!

Ahora tienes un **backup completo y portable** de AlquiloScooter que puedes:

✅ Instalar en cualquier servidor  
✅ Guardar en tu disco duro como seguridad  
✅ Enviar a otro desarrollador  
✅ Migrar a otro hosting  
✅ Usar como base para otro proyecto  

**Este backup es 100% independiente** de Abacus.AI o cualquier servicio de hosting específico.

---

**Creado el**: 25 de Noviembre de 2025  
**Versión**: Gantt sincronizados + Matrículas completas  
**Peso**: ~300 MB (sin node_modules)  
**Estado**: ✅ Completamente funcional y probado  
