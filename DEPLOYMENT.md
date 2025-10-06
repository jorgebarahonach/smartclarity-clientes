# Guía de Implementación - SmartClarity Document Portal

## 📋 Resumen

Este documento describe los pasos necesarios para implementar y tomar control del proyecto SmartClarity Document Portal en su propia infraestructura.

---

## 🚀 Pasos de Implementación

### 1. Obtener el Código (GitHub)

**Opción A - Fork del Repositorio (Recomendado)**
1. Ir al repositorio original en GitHub
2. Hacer clic en el botón "Fork" (esquina superior derecha)
3. Seleccionar su cuenta/organización de GitHub
4. Clonar su fork localmente:
   ```bash
   git clone https://github.com/SU-ORGANIZACION/nombre-del-repo.git
   cd nombre-del-repo
   ```

**Opción B - Transferencia Directa**
1. Si prefieren que se les transfiera el repositorio directamente, coordinar con el desarrollador

---

### 2. Configurar Supabase (Base de Datos + Storage)

#### 2.1 Crear Proyecto en Supabase
1. Ir a [https://supabase.com](https://supabase.com)
2. Crear cuenta o iniciar sesión
3. Click en "New Project"
4. Completar:
   - **Organization**: Su organización
   - **Project Name**: smartclarity-portal (o el nombre que prefieran)
   - **Database Password**: Guardar en lugar seguro
   - **Region**: Seleccionar la más cercana (e.g., South America)
5. Esperar 1-2 minutos mientras se crea el proyecto

#### 2.2 Ejecutar Migraciones de Base de Datos
1. En Supabase Dashboard, ir a **SQL Editor**
2. Ejecutar las migraciones en orden (archivos en `supabase/migrations/`):

   **Primera migración - Estructura base:**
   ```sql
   -- Copiar y ejecutar el contenido del archivo:
   -- supabase/migrations/20240101000000_initial_schema.sql
   ```

   **Migraciones adicionales:**
   ```sql
   -- Ejecutar cada archivo .sql en orden cronológico
   -- (revisar carpeta supabase/migrations/)
   ```

3. Verificar que las tablas se crearon:
   - `companies`
   - `projects`
   - `documents`
   - `user_roles`

#### 2.3 Configurar Storage (Almacenamiento de Archivos)
1. En Supabase Dashboard, ir a **Storage**
2. El bucket `documents` debería estar creado por las migraciones
3. Verificar las políticas RLS del bucket

#### 2.4 Obtener Credenciales de Supabase
1. En Supabase Dashboard, ir a **Settings** → **API**
2. Copiar:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project Reference ID** (e.g., `xxxxx`)
   - **anon/public key** (empieza con `eyJ...`)
   - **service_role key** (⚠️ NUNCA exponer públicamente)

---

### 3. Configurar Variables del Proyecto

#### 3.1 Actualizar Credenciales en el Código
Editar el archivo `src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = "https://SU-PROJECT-ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "SU-ANON-KEY-AQUI";
```

#### 3.2 Configurar Secrets en Supabase (para Edge Functions)
1. En Supabase Dashboard, ir a **Settings** → **Edge Functions**
2. Agregar los siguientes secrets:
   - `SUPABASE_URL`: Su Project URL
   - `SUPABASE_ANON_KEY`: Su anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Su service role key
   - `RESEND_API_KEY`: (si usan emails) API key de Resend.com

---

### 4. Desplegar Edge Functions

Las Edge Functions son necesarias para la administración de usuarios.

#### 4.1 Instalar Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Windows (con Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

#### 4.2 Desplegar Functions
```bash
# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref SU-PROJECT-ID

# Desplegar todas las functions
supabase functions deploy admin-create-user
supabase functions deploy admin-delete-user
supabase functions deploy admin-update-password
supabase functions deploy admin-assign-role
supabase functions deploy admin-get-current-user
supabase functions deploy send-support-email
supabase functions deploy create-admin-user
supabase functions deploy bootstrap-admin
supabase functions deploy setup-admin
supabase functions deploy setup-complete-system
```

---

### 5. Crear Usuario Administrador Inicial

#### Opción A - Usando Edge Function (Recomendado)
```bash
curl -X POST \
  https://SU-PROJECT-ID.supabase.co/functions/v1/bootstrap-admin \
  -H "Authorization: Bearer SU-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@suempresa.com",
    "password": "Password123!",
    "role": "admin"
  }'
```

#### Opción B - Desde Supabase Dashboard
1. Ir a **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Ingresar email y password
4. Luego ir a **SQL Editor** y ejecutar:
```sql
INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@suempresa.com'),
  'admin'
);
```

---

### 6. Desplegar la Aplicación

#### 6.1 Instalar Dependencias
```bash
npm install
# o
bun install
```

#### 6.2 Opción de Hosting

**Opción A - Vercel (Recomendado para React)**
1. Ir a [vercel.com](https://vercel.com)
2. Importar su repositorio de GitHub
3. Framework preset: **Vite**
4. Deploy

**Opción B - Netlify**
1. Ir a [netlify.com](https://netlify.com)
2. New site from Git
3. Build command: `npm run build`
4. Publish directory: `dist`

**Opción C - Lovable (con Custom Domain)**
- Si prefieren hosting en Lovable con su dominio personalizado
- Requiere Lovable Pro Plan ($25/mes)

---

### 7. Configurar Dominio Personalizado

#### En Vercel:
1. Settings → Domains
2. Agregar su dominio
3. Configurar DNS según instrucciones

#### En Netlify:
1. Domain settings → Add custom domain
2. Configurar DNS según instrucciones

---

## 🔄 Flujo de Actualizaciones Futuras

### Cuando se requieran nuevas funcionalidades:

1. **Desarrollador** trabaja en su ambiente Lovable
2. Cambios se sincronizan automáticamente a su repositorio GitHub
3. **Desarrollador** crea Pull Request desde su repo → fork de ustedes
4. **Sus ingenieros** revisan el PR:
   - Cambios de código
   - Nuevas migraciones SQL (si las hay)
   - Documentación de cambios
5. **Sus ingenieros** aprueban y hacen merge
6. Si hay migraciones de DB:
   - Ejecutarlas en su Supabase (SQL Editor)
   - O usar `supabase db push` con CLI
7. Deploy automático se activa (Vercel/Netlify)

---

## 📊 Estructura del Proyecto

```
smartclarity-portal/
├── src/
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas principales
│   ├── hooks/            # Custom hooks (useAuth, etc.)
│   ├── integrations/     # Cliente Supabase
│   └── lib/              # Utilidades
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Scripts SQL de base de datos
└── public/               # Assets estáticos
```

---

## 🔐 Seguridad - Checklist

- [ ] Service Role Key de Supabase NUNCA en código público
- [ ] Service Role Key solo en Supabase Edge Functions secrets
- [ ] Row Level Security (RLS) habilitado en todas las tablas
- [ ] Políticas RLS revisadas y probadas
- [ ] Bucket de storage con políticas correctas
- [ ] Solo admin puede acceder a panel de administración
- [ ] Usuarios solo ven sus propios proyectos/documentos

---

## 📞 Soporte Post-Entrega

Para consultas sobre nuevas funcionalidades o upgrades, contactar al desarrollador.

Para issues técnicos de infraestructura (Supabase, hosting), su equipo de ingenieros tiene acceso completo a:
- GitHub repository (código fuente)
- Supabase project (base de datos, storage, functions)
- Hosting platform (Vercel/Netlify)

---

## 📝 Notas Importantes

1. **Backup de Base de Datos**: Supabase hace backups automáticos (Plan Pro), pero recomendamos backups adicionales para producción
2. **Monitoreo**: Revisar logs en Supabase Dashboard → Edge Functions → Logs
3. **Escalabilidad**: Plan Free de Supabase: hasta 500MB DB, 1GB storage, 2GB bandwidth. Para crecer, considerar Plan Pro ($25/mes)
4. **Actualizaciones de Seguridad**: Revisar dependencias regularmente con `npm audit`

---

**Fecha de Entrega**: [FECHA]  
**Versión del Proyecto**: 1.0.0  
**Desarrollador**: [SU NOMBRE/EMPRESA]
