# Manual de Usuario - SmartClarity Document Portal

## 👋 Bienvenido a su Portal de Documentos

Este manual le guiará en el uso y administración de su nuevo sistema de gestión documental SmartClarity. El sistema ya ha sido configurado y está listo para usar.

---

## 🌐 Acceso al Sistema

### URL de Acceso
Su portal está disponible en: **[URL-DEL-CLIENTE.com]**

### Credenciales Iniciales de Administrador
- **Email**: [admin@suempresa.com]
- **Contraseña**: [Proporcionada de forma segura]

⚠️ **IMPORTANTE**: Cambie su contraseña en el primer inicio de sesión.

---

## 📱 Funcionalidades del Sistema

### Para Administradores
✅ Crear y gestionar empresas clientes  
✅ Crear proyectos para cada empresa  
✅ Subir documentos organizados por proyecto  
✅ Crear usuarios (clientes) y asignarlos a empresas  
✅ Gestionar accesos y permisos  
✅ Ver toda la actividad del sistema

### Para Clientes (Empresas)
✅ Ver sus proyectos asignados  
✅ Descargar documentos de sus proyectos  
✅ Visualizar información de sus empresas  
✅ Acceso seguro solo a su información

---

## 🚀 Guía de Uso - Administrador

### 1. Primer Inicio de Sesión
1. Acceder a **[URL]/admin-login**
2. Ingresar con las credenciales proporcionadas
3. Cambiar contraseña inmediatamente

### 2. Crear una Empresa Cliente
1. Ir al panel de administración
2. Click en "Crear Empresa"
3. Completar:
   - **Nombre de la empresa**: Nombre completo
   - **Email**: Email corporativo del cliente
4. Click en "Guardar"

### 3. Crear un Usuario para la Empresa
1. En el panel de administración
2. Click en "Crear Usuario"
3. Completar:
   - **Email**: Email del usuario cliente (debe coincidir con el email de la empresa)
   - **Contraseña temporal**: El sistema generará una
4. Enviar credenciales al cliente de forma segura

### 4. Crear Proyectos
1. Panel de administración → "Proyectos"
2. Click en "Nuevo Proyecto"
3. Completar:
   - **Nombre del proyecto**: Identificador claro
   - **Empresa asociada**: Seleccionar de la lista
   - **Descripción**: (Opcional) Detalles del proyecto
4. Click en "Crear"

### 5. Subir Documentos
1. Seleccionar un proyecto
2. Click en "Subir Documento"
3. Seleccionar archivo desde su computadora
4. Completar información:
   - **Nombre del documento**: Nombre descriptivo
   - **Tipo de documento**: Categoría (contrato, plano, certificado, etc.)
5. Click en "Subir"

**Formatos soportados**: PDF, Word, Excel, Imágenes (JPG, PNG), AutoCAD (DWG), etc.

---

## 👤 Guía de Uso - Cliente

### 1. Acceso al Portal
1. Ir a **[URL-DEL-CLIENTE.com]**
2. Click en "Iniciar Sesión"
3. Ingresar email y contraseña proporcionados

### 2. Ver sus Proyectos
1. En el dashboard, verá todos sus proyectos asignados
2. Click en cualquier proyecto para ver detalles

### 3. Descargar Documentos
1. Dentro de un proyecto, verá la lista de documentos
2. Click en cualquier documento para descargarlo
3. Los archivos se descargan directamente a su computadora

### 4. Cambiar Contraseña
1. Click en su perfil (esquina superior derecha)
2. Seleccionar "Cambiar Contraseña"
3. Ingresar contraseña actual y nueva contraseña
4. Confirmar cambio

---

## 🔧 Información Técnica (Para su Equipo de TI)

### Arquitectura del Sistema

**Frontend**:
- Tecnología: React + TypeScript + Vite
- Hosting: [Vercel/Netlify/Lovable]
- URL: [URL-DEL-CLIENTE.com]

**Backend**:
- Base de datos: Supabase (PostgreSQL)
- Storage: Supabase Storage
- API: Edge Functions (Serverless)

**Seguridad**:
- ✅ Autenticación con JWT
- ✅ Row Level Security (RLS) en base de datos
- ✅ Encriptación de datos en tránsito (HTTPS)
- ✅ Acceso basado en roles (Admin/Client)

### Acceso a Infraestructura

Su equipo técnico tiene acceso completo a:

1. **Repositorio de Código (GitHub)**
   - URL: [REPO-URL]
   - Acceso: Push/Pull completo
   - Branch principal: `main`

2. **Base de Datos (Supabase)**
   - Dashboard: [https://supabase.com/dashboard/project/SU-PROJECT-ID]
   - Credenciales enviadas de forma segura
   - Backups automáticos habilitados

3. **Hosting (Vercel/Netlify)**
   - Dashboard: [URL del hosting]
   - Deploy automático desde GitHub
   - SSL automático configurado

### Estructura de la Base de Datos

**Tablas principales**:
- `companies`: Empresas clientes
- `projects`: Proyectos por empresa
- `documents`: Archivos y metadatos
- `user_roles`: Permisos de usuarios
- `auth.users`: Usuarios del sistema (gestionada por Supabase)

**Storage**:
- Bucket: `documents` (privado)
- Políticas RLS configuradas

---

## 🔄 Actualizaciones y Mantenimiento

### Actualizaciones del Sistema
El desarrollador puede enviar actualizaciones mediante:
1. Pull Request al repositorio GitHub
2. Su equipo revisa y aprueba los cambios
3. Deploy automático una vez aprobado

### Respaldo de Datos
- ✅ Supabase realiza backups automáticos diarios
- ✅ Retención: 7 días (Plan Free) / 30 días (Plan Pro)
- ✅ Recomendación: Backups manuales adicionales para datos críticos

### Monitoreo
- Dashboard de Supabase: Ver logs y estadísticas
- Alertas automáticas de errores
- Monitoreo de uso de recursos

---

## 📊 Límites y Escalabilidad

### Plan Actual: Supabase Free Tier
- **Base de datos**: 500 MB
- **Storage**: 1 GB
- **Bandwidth**: 2 GB/mes
- **Edge Functions**: 500,000 invocaciones/mes

### ¿Cuándo actualizar a Plan Pro ($25/mes)?
- Más de 500 MB de datos en base de datos
- Más de 1 GB de archivos almacenados
- Más de 50 usuarios activos simultáneos
- Necesidad de backups con mayor retención

---

## 🆘 Soporte y Asistencia

### Para Dudas de Uso
- Consultar este manual
- Contactar al administrador del sistema

### Para Soporte Técnico
- Nuevas funcionalidades: Contactar al desarrollador
- Problemas de infraestructura: Su equipo de TI tiene acceso completo

### Para Emergencias
1. Verificar estado del sistema en dashboards
2. Revisar logs en Supabase
3. Contactar soporte de Supabase si es necesario

---

## 🔐 Políticas de Seguridad

### Contraseñas
- Mínimo 8 caracteres
- Cambio obligatorio en primer login
- No compartir credenciales

### Datos Sensibles
- Todos los datos encriptados en tránsito
- Acceso basado en roles estricto
- Auditoría de accesos disponible

### Recomendaciones
✅ Cambiar contraseñas cada 90 días  
✅ No usar la misma contraseña en múltiples servicios  
✅ Habilitar 2FA cuando esté disponible  
✅ Revisar logs de acceso regularmente

---

## 📞 Contacto

**Desarrollador**: [SU NOMBRE/EMPRESA]  
**Email**: [su-email@ejemplo.com]  
**Entrega**: [FECHA]  
**Versión**: 1.0.0

---

## 📝 Changelog (Historial de Versiones)

### v1.0.0 - [FECHA]
- ✅ Sistema de autenticación (Admin y Cliente)
- ✅ Gestión de empresas y proyectos
- ✅ Upload y descarga de documentos
- ✅ Panel de administración completo
- ✅ Dashboard de cliente
- ✅ Sistema de roles y permisos

---

**¡Gracias por confiar en SmartClarity Document Portal!**
