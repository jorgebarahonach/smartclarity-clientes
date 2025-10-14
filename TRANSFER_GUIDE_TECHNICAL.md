# 🔧 Guía Técnica Completa - Transferencia SmartClarity Document Portal

## 📋 Tabla de Contenidos

1. [Pre-requisitos y Preparación](#pre-requisitos)
2. [Exportación de Supabase](#exportación-supabase)
3. [Transferencia de GitHub](#transferencia-github)
4. [Setup en Nueva Cuenta Supabase](#setup-supabase)
5. [Configuración de Hosting](#configuración-hosting)
6. [Configuración de Dominio](#configuración-dominio)
7. [Testing y Validación](#testing-validación)
8. [Checklist Final](#checklist-final)

---

## 🎯 Pre-requisitos y Preparación

### Información del Proyecto Actual

```yaml
Supabase Project ID: sutmmlryzosbasksamqw
Supabase URL: https://sutmmlryzosbasksamqw.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1dG1tbHJ5em9zYmFza3NhbXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODI3MTQsImV4cCI6MjA3NDE1ODcxNH0.4Tka6Y5Wrqlc1mNmmnVfuo3jrMbI2vXRaQS4_Vvu1XI
Dominio Actual: smartclarity.ayerviernes.com
GitHub Repo: [TU-REPO-URL]
```

### Cuentas Necesarias del Cliente

- ✅ Cuenta GitHub (personal u organizacional)
- ✅ Cuenta Supabase (https://supabase.com)
- ✅ Cuenta Vercel (https://vercel.com) o Netlify
- ✅ Dominio propio registrado (opcional)

### Herramientas Requeridas

```bash
# Instalar Supabase CLI
npm install -g supabase

# Instalar PostgreSQL Client (para backups)
# macOS:
brew install postgresql

# Ubuntu/Debian:
sudo apt-get install postgresql-client

# Windows:
# Descargar desde https://www.postgresql.org/download/windows/
```

---

## 📊 Exportación de Supabase

### Paso 1: Backup de Base de Datos

#### 1.1 Exportar Schema Completo

```bash
# Conectar a la base de datos actual
# Obtener la connection string del dashboard de Supabase
# Settings > Database > Connection string (URI)

# La connection string será algo como:
# postgresql://postgres:[PASSWORD]@db.sutmmlryzosbasksamqw.supabase.co:5432/postgres

# Exportar schema
pg_dump "postgresql://postgres:[PASSWORD]@db.sutmmlryzosbasksamqw.supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  > schema_backup.sql

# Exportar datos
pg_dump "postgresql://postgres:[PASSWORD]@db.sutmmlryzosbasksamqw.supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-acl \
  > data_backup.sql

# Backup completo (alternativa)
pg_dump "postgresql://postgres:[PASSWORD]@db.sutmmlryzosbasksamqw.supabase.co:5432/postgres" \
  --clean \
  --no-owner \
  --no-acl \
  > full_backup.sql
```

#### 1.2 Exportar desde Dashboard (Alternativa GUI)

1. Ir a https://supabase.com/dashboard/project/sutmmlryzosbasksamqw
2. SQL Editor > Nueva Query
3. Ejecutar para cada tabla:

```sql
-- Exportar estructura de tablas
SELECT 
    'CREATE TABLE ' || table_schema || '.' || table_name || ' (' ||
    string_agg(column_name || ' ' || data_type, ', ') || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_schema, table_name;

-- Copiar el resultado y guardar en archivo
```

#### 1.3 Backup de Tablas Individuales

```sql
-- companies
COPY (SELECT * FROM public.companies) TO '/tmp/companies.csv' WITH CSV HEADER;

-- projects
COPY (SELECT * FROM public.projects) TO '/tmp/projects.csv' WITH CSV HEADER;

-- documents
COPY (SELECT * FROM public.documents) TO '/tmp/documents.csv' WITH CSV HEADER;

-- user_roles
COPY (SELECT * FROM public.user_roles) TO '/tmp/user_roles.csv' WITH CSV HEADER;
```

### Paso 2: Backup de Storage (Archivos)

#### 2.1 Listar todos los archivos del bucket

```sql
-- En Supabase SQL Editor
SELECT * FROM storage.objects WHERE bucket_id = 'documents';
```

#### 2.2 Descargar archivos usando API

Crear script de descarga (`download_files.js`):

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://sutmmlryzosbasksamqw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1dG1tbHJ5em9zYmFza3NhbXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODI3MTQsImV4cCI6MjA3NDE1ODcxNH0.4Tka6Y5Wrqlc1mNmmnVfuo3jrMbI2vXRaQS4_Vvu1XI'
);

async function downloadAllFiles() {
  // Listar archivos
  const { data: files, error } = await supabase
    .storage
    .from('documents')
    .list();

  if (error) {
    console.error('Error listing files:', error);
    return;
  }

  // Crear directorio de backup
  const backupDir = './storage_backup';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Descargar cada archivo
  for (const file of files) {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .download(file.name);

    if (error) {
      console.error(`Error downloading ${file.name}:`, error);
      continue;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(
      path.join(backupDir, file.name),
      buffer
    );
    
    console.log(`Downloaded: ${file.name}`);
  }

  console.log('All files downloaded successfully!');
}

downloadAllFiles();
```

Ejecutar:

```bash
npm install @supabase/supabase-js
node download_files.js
```

### Paso 3: Backup de Edge Functions

```bash
# Todas las edge functions están en el repositorio
# Copiar directorio completo
cp -r supabase/functions ./edge_functions_backup/

# Lista de Edge Functions del proyecto:
# - admin-assign-role
# - admin-create-user
# - admin-delete-user
# - admin-get-current-user
# - admin-update-password
# - bootstrap-admin
# - create-admin-user
# - send-support-email
# - setup-admin
# - setup-complete-system
```

### Paso 4: Backup de Secrets

```bash
# Listar secrets actuales (desde Supabase Dashboard)
# Settings > Edge Functions > Secrets

# Secrets del proyecto:
# - RESEND_API_KEY
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_DB_URL
# - SUPABASE_PUBLISHABLE_KEY
```

Guardar en archivo seguro `secrets.env`:

```bash
RESEND_API_KEY=re_xxxxx
SUPABASE_URL=https://sutmmlryzosbasksamqw.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_URL=postgresql://postgres...
SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
```

⚠️ **IMPORTANTE**: Este archivo contiene información sensible. Guardarlo de forma segura.

---

## 🔄 Transferencia de GitHub

### Opción 1: Transferir Repositorio Existente

```bash
# 1. Ir al repositorio en GitHub
# 2. Settings > Danger Zone > Transfer ownership
# 3. Ingresar username del cliente
# 4. Cliente acepta transferencia
```

### Opción 2: Crear Fork/Clone

```bash
# En la cuenta del cliente:
git clone https://github.com/TU-USUARIO/smartclarity.git
cd smartclarity

# Cambiar remote
git remote remove origin
git remote add origin https://github.com/CLIENTE/smartclarity.git
git push -u origin main
```

---

## 🆕 Setup en Nueva Cuenta Supabase

### Paso 1: Crear Proyecto

```bash
# 1. Ir a https://supabase.com/dashboard
# 2. New Project
# 3. Completar:
#    - Name: SmartClarity Production
#    - Database Password: [Generar password seguro]
#    - Region: [Cercano al cliente]
#    - Pricing Plan: Free (o Pro)
# 4. Esperar ~2 minutos para provisioning
```

### Paso 2: Configurar Database

#### 2.1 Importar Schema

```sql
-- En SQL Editor del nuevo proyecto
-- Copiar contenido de schema_backup.sql

-- IMPORTANTE: El schema incluye:
-- 1. Enum app_role
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- 2. Tablas
CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    company_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    document_type text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    file_path text NOT NULL,
    original_file_name text,
    project_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'client'::app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Funciones
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.create_company_auth_user(company_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$;

-- 5. Políticas RLS
-- Companies
CREATE POLICY "Admins can manage all companies" ON public.companies
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert companies" ON public.companies
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own company" ON public.companies
FOR UPDATE TO authenticated
USING (email = (auth.jwt() ->> 'email'::text))
WITH CHECK (email = (auth.jwt() ->> 'email'::text));

CREATE POLICY "Users can view their own company" ON public.companies
FOR SELECT TO authenticated
USING (email = (auth.jwt() ->> 'email'::text));

-- Projects
CREATE POLICY "Admins can manage all projects" ON public.projects
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view their company projects" ON public.projects
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'client'::app_role) AND 
  company_id IN (
    SELECT id FROM companies 
    WHERE email = (auth.jwt() ->> 'email'::text)
  )
);

-- Documents
CREATE POLICY "Admins can manage all documents" ON public.documents
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Documents are viewable by project company" ON public.documents
FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT p.id
    FROM projects p
    JOIN companies c ON p.company_id = c.id
    WHERE c.email = (auth.jwt() ->> 'email'::text)
  )
);

-- User Roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```

#### 2.2 Importar Datos

```sql
-- Método 1: Usar data_backup.sql
-- Copiar y pegar contenido en SQL Editor

-- Método 2: Importar CSV por tabla
-- En Table Editor, usar "Import data from CSV"

-- Método 3: Script SQL manual
INSERT INTO public.companies (id, name, email, created_at)
VALUES 
  ('uuid-1', 'Empresa Ejemplo', 'cliente@ejemplo.com', now());
-- ... resto de datos
```

### Paso 3: Configurar Storage

```sql
-- Crear bucket de documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Políticas de Storage
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Users can view their company documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  (SELECT has_role(auth.uid(), 'client'::app_role))
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);
```

#### Subir archivos de backup

Usar script `upload_files.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://NUEVO-PROJECT-ID.supabase.co',
  'NUEVO-ANON-KEY'
);

async function uploadAllFiles() {
  const backupDir = './storage_backup';
  const files = fs.readdirSync(backupDir);

  for (const filename of files) {
    const filePath = path.join(backupDir, filename);
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase
      .storage
      .from('documents')
      .upload(filename, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${filename}:`, error);
    } else {
      console.log(`Uploaded: ${filename}`);
    }
  }
}

uploadAllFiles();
```

### Paso 4: Configurar Edge Functions

#### 4.1 Actualizar config.toml

```toml
# supabase/config.toml
project_id = "NUEVO-PROJECT-ID"

[api]
enabled = true
port = 54321
schemas = ["public", "storage"]
extra_search_path = ["public"]

[auth]
enabled = true
site_url = "https://NUEVO-DOMINIO.com"

[functions]
enabled = true
```

#### 4.2 Deploy Edge Functions

```bash
# Instalar Supabase CLI si no está instalado
npm install -g supabase

# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref NUEVO-PROJECT-ID

# Deploy todas las functions
supabase functions deploy admin-assign-role
supabase functions deploy admin-create-user
supabase functions deploy admin-delete-user
supabase functions deploy admin-get-current-user
supabase functions deploy admin-update-password
supabase functions deploy bootstrap-admin
supabase functions deploy create-admin-user
supabase functions deploy send-support-email
supabase functions deploy setup-admin
supabase functions deploy setup-complete-system

# O deploy todas a la vez
for func in supabase/functions/*/; do
  supabase functions deploy $(basename $func)
done
```

#### 4.3 Configurar Secrets

```bash
# Desde Dashboard o CLI
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set SUPABASE_URL=https://NUEVO-PROJECT-ID.supabase.co
supabase secrets set SUPABASE_ANON_KEY=NUEVO-ANON-KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=NUEVO-SERVICE-ROLE-KEY
supabase secrets set SUPABASE_DB_URL=postgresql://postgres...
supabase secrets set SUPABASE_PUBLISHABLE_KEY=NUEVO-ANON-KEY
```

---

## 🚀 Configuración de Hosting

### Opción A: Vercel (Recomendado)

#### 1. Importar Proyecto

```bash
# 1. Ir a https://vercel.com
# 2. New Project
# 3. Import Git Repository
# 4. Seleccionar el repo de GitHub transferido
# 5. Configure Project:
```

```yaml
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 2. Configurar Variables de Entorno

En Vercel Dashboard > Settings > Environment Variables:

```bash
VITE_SUPABASE_PROJECT_ID=NUEVO-PROJECT-ID
VITE_SUPABASE_URL=https://NUEVO-PROJECT-ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=NUEVO-ANON-KEY
```

#### 3. Deploy

```bash
# Deploy automático al hacer push a main
git push origin main

# O manual desde Vercel Dashboard
# Deployments > Redeploy
```

### Opción B: Netlify

```bash
# 1. Ir a https://netlify.com
# 2. New site from Git
# 3. Conectar GitHub
# 4. Build settings:

Build command: npm run build
Publish directory: dist

# 5. Environment variables (igual que Vercel)
```

### Opción C: Hosting Propio

```bash
# Build local
npm install
npm run build

# Resultado en /dist
# Servir con cualquier servidor web (Nginx, Apache, etc.)

# Ejemplo Nginx:
server {
    listen 80;
    server_name smartclarity.com;
    root /var/www/smartclarity/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🌐 Configuración de Dominio

### Paso 1: DNS Records (Para Vercel)

En el registrador de dominio (GoDaddy, Namecheap, etc.):

```dns
# Para dominio raíz (smartclarity.com)
Type: A
Name: @
Value: 76.76.21.21

# Para www
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Paso 2: Agregar Dominio en Vercel

```bash
# 1. Vercel Dashboard > Settings > Domains
# 2. Add Domain: smartclarity.com
# 3. Vercel detectará DNS automáticamente
# 4. SSL se genera automáticamente (Let's Encrypt)
# 5. Esperar propagación (1-48 horas)
```

### Paso 3: Actualizar URLs en Supabase

```sql
-- En Supabase Dashboard > Authentication > URL Configuration
Site URL: https://smartclarity.com
Redirect URLs: 
  - https://smartclarity.com/**
  - https://www.smartclarity.com/**
```

---

## ✅ Testing y Validación

### Checklist de Testing

```bash
# 1. Base de Datos
✅ Todas las tablas importadas
✅ Datos migrados correctamente
✅ RLS políticas funcionando
✅ Funciones ejecutándose

# 2. Storage
✅ Bucket creado
✅ Archivos subidos
✅ Políticas funcionando
✅ Download funcionando

# 3. Edge Functions
✅ Todas deployadas
✅ Secrets configurados
✅ Logs sin errores
✅ Invocaciones funcionando

# 4. Frontend
✅ Build exitoso
✅ Deploy funcionando
✅ Variables de entorno correctas
✅ Supabase conectado

# 5. Autenticación
✅ Login funcionando
✅ Signup funcionando
✅ Password reset funcionando
✅ Roles asignados correctamente

# 6. Funcionalidades
✅ Admin puede crear empresas
✅ Admin puede crear proyectos
✅ Admin puede subir documentos
✅ Clientes ven solo sus proyectos
✅ Clientes pueden descargar documentos
```

### Script de Validación

```javascript
// test_deployment.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://NUEVO-PROJECT-ID.supabase.co',
  'NUEVO-ANON-KEY'
);

async function testDeployment() {
  console.log('🧪 Testing Deployment...\n');

  // Test 1: Database Connection
  console.log('1️⃣ Testing Database Connection...');
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('count');
  
  if (companiesError) {
    console.error('❌ Database Error:', companiesError);
  } else {
    console.log('✅ Database Connected');
  }

  // Test 2: Storage
  console.log('\n2️⃣ Testing Storage...');
  const { data: files, error: storageError } = await supabase
    .storage
    .from('documents')
    .list();
  
  if (storageError) {
    console.error('❌ Storage Error:', storageError);
  } else {
    console.log('✅ Storage Working:', files.length, 'files');
  }

  // Test 3: Edge Function
  console.log('\n3️⃣ Testing Edge Functions...');
  const { data: funcData, error: funcError } = await supabase
    .functions
    .invoke('admin-get-current-user');
  
  if (funcError) {
    console.error('❌ Edge Function Error:', funcError);
  } else {
    console.log('✅ Edge Functions Working');
  }

  console.log('\n🎉 Deployment Test Complete!');
}

testDeployment();
```

---

## 📋 Checklist Final

### Pre-Transferencia
- [ ] Backup completo de base de datos
- [ ] Backup de storage (archivos)
- [ ] Lista de secrets guardada de forma segura
- [ ] Edge functions respaldadas
- [ ] Documentación actualizada

### Durante Transferencia
- [ ] Repositorio GitHub transferido
- [ ] Nuevo proyecto Supabase creado
- [ ] Schema importado
- [ ] Datos migrados
- [ ] Storage configurado
- [ ] Archivos subidos
- [ ] Edge functions deployadas
- [ ] Secrets configurados
- [ ] Hosting configurado (Vercel/Netlify)
- [ ] Variables de entorno setteadas
- [ ] Dominio configurado

### Post-Transferencia
- [ ] Testing completo exitoso
- [ ] Login de admin funcionando
- [ ] Crear empresa funcionando
- [ ] Crear proyecto funcionando
- [ ] Upload documentos funcionando
- [ ] Cliente puede ver proyectos
- [ ] Cliente puede descargar documentos
- [ ] SSL activo (HTTPS)
- [ ] Dominio resolviendo correctamente
- [ ] Monitoring configurado
- [ ] Documentación entregada al cliente
- [ ] Credenciales transferidas
- [ ] Accesos revocados de cuentas anteriores

---

## 🆘 Troubleshooting Común

### Problema: "Invalid JWT"

```bash
# Causa: Anon key antigua en código
# Solución: Actualizar variables de entorno y rebuild

# Vercel:
vercel env pull
npm run build
vercel --prod
```

### Problema: "RLS policy violated"

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'companies';

-- Re-aplicar políticas si es necesario
```

### Problema: "Storage bucket not found"

```sql
-- Verificar bucket existe
SELECT * FROM storage.buckets;

-- Crear si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);
```

### Problema: "Edge function not found"

```bash
# Listar functions deployadas
supabase functions list

# Re-deploy si falta
supabase functions deploy FUNCTION-NAME
```

### Problema: "CORS error"

```javascript
// Verificar corsHeaders en edge functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Verificar OPTIONS handler
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

---

## 📞 Información de Soporte

### Recursos Útiles

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase CLI**: https://github.com/supabase/cli
- **Support Supabase**: https://supabase.com/support
- **Support Vercel**: https://vercel.com/support

### Comandos Útiles

```bash
# Ver logs de edge functions
supabase functions logs FUNCTION-NAME

# Ver logs de Vercel
vercel logs

# Test local de Supabase
supabase start
supabase functions serve

# Rollback Vercel
vercel rollback DEPLOYMENT-URL
```

---

## 💰 Costos Post-Transferencia

### Supabase Free Tier
- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB/mes
- Edge Functions: 500K invocaciones/mes

### Cuando Upgradear a Pro ($25/mes)
- Más de 500 MB en DB
- Más de 1 GB de archivos
- Más de 50 usuarios activos
- Necesidad de backups de 30 días

### Hosting
- Vercel: Free (100 GB bandwidth)
- Netlify: Free (100 GB bandwidth)

---

**✅ Con esta guía, el cliente tendrá control completo del sistema SmartClarity**

**Última actualización**: 2025-10-14  
**Versión del sistema**: 1.0.0
