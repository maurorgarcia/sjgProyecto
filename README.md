# ⏱ TimeClock Errors — Control de Fichadas

Sistema de gestión de errores de fichadas para contratistas industriales.  
Reemplaza el Excel diario con una aplicación web en tiempo real con soporte multiusuario.

---

## Stack

| Tecnología | Uso |
|---|---|
| **Next.js 14** (App Router) | Framework frontend + API routes |
| **Supabase** | Base de datos PostgreSQL + Realtime + Auth |
| **TailwindCSS** | Estilos |
| **TanStack Table v8** | Tabla editable tipo Excel |
| **SheetJS (xlsx)** | Importación de archivos Excel |
| **react-hot-toast** | Notificaciones |

---

## Estructura del proyecto

```
timeclock-app/
├── src/
│   ├── app/
│   │   ├── api/time-errors/route.ts   # API REST (GET, POST, PATCH, DELETE)
│   │   ├── globals.css                # Estilos globales + design tokens
│   │   ├── layout.tsx                 # Root layout
│   │   └── page.tsx                   # Página principal
│   ├── components/
│   │   ├── TimeErrorTable.tsx         # Tabla principal con TanStack Table
│   │   ├── EditableCell.tsx           # Celda editable inline
│   │   ├── StatusBadge.tsx            # Badge de estado (Pendiente/En revisión/Corregido)
│   │   ├── ImportExcel.tsx            # Botón + lógica de importación Excel
│   │   └── AddRowModal.tsx            # Modal para agregar registro
│   ├── lib/
│   │   └── supabase.ts                # Cliente Supabase + helpers CRUD
│   └── types/
│       └── index.ts                   # TypeScript types
├── supabase/
│   └── schema.sql                     # Schema SQL completo para Supabase
├── .env.local.example                 # Variables de entorno requeridas
└── package.json
```

---

## 🚀 Setup local paso a paso

### 1. Clonar e instalar dependencias

```bash
cd timeclock-app
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → **New Project**
2. Crear el proyecto (guardar la contraseña de la DB)
3. Ir a **SQL Editor** y ejecutar el contenido de `supabase/schema.sql`

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Las claves se encuentran en Supabase → **Project Settings → API**.

### 4. Activar Realtime en Supabase

1. Ir a **Database → Replication**
2. Activar `time_errors` en la sección **Source**

> El schema.sql ya incluye `alter publication supabase_realtime add table public.time_errors;`

### 5. Correr la aplicación

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 📋 Columnas de la tabla

| Campo DB | Columna UI | Tipo |
|---|---|---|
| `fecha` | Fecha | date |
| `dia` | Día | text (auto) |
| `contrato` | Contrato | text |
| `empleado` | Apellido y Nombre | text |
| `motivo` | Motivo | text |
| `sector` | Área / Sector | text |
| `ot` | OT | text |
| `ot_em` | OT Em. | text |
| `ot_em2` | OT Em.2 | text |
| `hh_normales` | HH Nor. | numeric |
| `hh_50` | HH E.50% | numeric |
| `hh_100` | HH E.100% | numeric |
| `insa` | INSA | numeric |
| `polu` | POLU | numeric |
| `noct` | NOCT | numeric |
| `estado` | Estado | enum |
| `observaciones` | Observaciones | text |

---

## 📥 Formato del Excel para importar

El archivo Excel debe tener las siguientes columnas en la primera fila (el orden no importa):

```
Fecha | Contrato | Apellido y Nombre | Motivo | Área / Sector | OT | OT Em. | OT Em.2 | HH Nor. | HH E.50% | HH E.100% | Estado | Observaciones
```

- **Fecha**: acepta `DD/MM/YYYY`, `YYYY-MM-DD` o número serial de Excel
- **Estado**: debe ser exactamente `Pendiente`, `En revisión` o `Corregido` (si no coincide, se asigna `Pendiente`)
- Las columnas vacías se omiten sin error

---

## 🔴 Funcionalidades en tiempo real

Todos los cambios se sincronizan automáticamente entre todos los usuarios conectados vía **Supabase Realtime (PostgreSQL CDC)**:
- Nuevas filas → aparecen instantáneamente
- Ediciones de celda → se propagan en tiempo real
- Eliminaciones → la fila desaparece para todos

---

## 🛠 Despliegue en producción

### Vercel (recomendado)

```bash
npm install -g vercel
vercel --prod
```

Agregar las variables de entorno en el dashboard de Vercel.

### Variables requeridas en producción

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 📊 Estados del sistema

| Estado | Color | Significado |
|---|---|---|
| **Pendiente** | 🟡 Amarillo | Error detectado, sin acción |
| **En revisión** | 🔵 Azul | Supervisor revisando |
| **Corregido** | 🟢 Verde | Horas cargadas correctamente |

---

## Próximas mejoras sugeridas

- [ ] Autenticación con Supabase Auth (roles: supervisor / operador)
- [ ] Exportar a Excel los registros filtrados
- [ ] Dashboard de métricas (errores por sector, tendencias)
- [ ] Historial de cambios por registro (audit log)
- [ ] Notificaciones por email al cambiar estado
# sjgProyecto
