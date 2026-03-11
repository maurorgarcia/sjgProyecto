# SJG Montajes Industriales — Gestión de Horas

Sistema web para el control de errores de fichada y gestión de horas del personal de SJG Montajes Industriales. Reemplaza el flujo manual en Excel con una interfaz en tiempo real, multiusuario y con historial de cambios.

---

## Demo

🔗 [sjg-proyecto-apog.vercel.app](https://sjg-proyecto-apog.vercel.app)

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Base de datos | Supabase (PostgreSQL + Realtime) |
| Autenticación | Supabase Auth |
| Tabla de datos | TanStack Table v8 |
| Excel | SheetJS (xlsx) |
| Estilos | CSS Variables + inline styles |
| Deploy | Vercel |

---

## Funcionalidades

- **Tabla editable** — clic en cualquier celda para editar inline con validación por tipo de campo
- **Importar Excel** — tres modos: reemplazar por fecha, agregar, o limpiar todo
- **Exportar Excel** — descarga los registros filtrados como `.xlsx`
- **Tiempo real** — sincronización instantánea entre usuarios vía Supabase Realtime
- **Filtros** — por fecha, empleado, estado, motivo y sector
- **Faltantes** — resalta y filtra registros con motivo "Falta parte" / "Falta cargar"
- **Complementos** — editor de INSA, POLU y NOCT por registro
- **Historial** — registro de cambios por campo con valor anterior y nuevo
- **Aislamiento por usuario** — cada usuario ve únicamente sus propios registros (RLS)
- **Dashboard** — gráficos de faltas por día y por sector
- **Mobile responsive** — vista en cards para pantallas pequeñas
- **Estados** — Pendiente / En revisión / Corregido con clic para ciclar

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/time-errors/route.ts   # API REST (GET, POST, PATCH, DELETE)
│   ├── dashboard/page.tsx          # Dashboard con métricas
│   ├── login/page.tsx              # Página de login
│   ├── page.tsx                    # Página principal (tabla)
│   ├── globals.css                 # Design system
│   └── layout.tsx                  # Layout raíz
├── components/
│   ├── TimeErrorTable.tsx          # Tabla principal
│   ├── EditableCell.tsx            # Celda editable con validación
│   ├── StatusBadge.tsx             # Badge de estado clickeable
│   ├── AddRowModal.tsx             # Modal para agregar registro
│   ├── ImportExcel.tsx             # Importación de Excel
│   ├── ExportExcel.tsx             # Exportación a Excel
│   ├── ComplementEditor.tsx        # Editor de INSA/POLU/NOCT
│   ├── HistoryModal.tsx            # Historial de cambios
│   ├── Header.tsx                  # Header con navegación
│   ├── Footer.tsx                  # Footer
│   └── SelectDropdown.tsx          # Dropdown reutilizable
├── lib/
│   └── supabase.ts                 # Cliente Supabase + CRUD + historial
└── types/
    └── index.ts                    # Tipos TypeScript
supabase/
└── schema.sql                      # Schema de base de datos
```

---

## Base de datos

**`time_errors`**

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid | Clave primaria |
| user_id | uuid | FK → auth.users (aislamiento por usuario) |
| fecha | date | Fecha del error |
| empleado | text | Apellido y nombre |
| contrato | text | Número de contrato |
| motivo | text | Motivo del error |
| sector | text | Área / sector |
| ot / ot_em / ot_em2 | text | Órdenes de trabajo |
| hh_normales / hh_50 / hh_100 | text | Horas en formato HH:MM |
| insa / polu / noct | text | Complementos en HH:MM |
| estado | text | Pendiente / En revisión / Corregido |
| grupo_id | text | Agrupación de registros relacionados |
| observaciones | text | Notas libres |

**`time_errors_history`** — historial de cambios por campo (campo, valor anterior, valor nuevo, fecha)

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/maurorgarcia/sjgProyecto.git
cd sjgProyecto

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Completar con las credenciales de Supabase

# 4. Ejecutar el schema en Supabase
# Abrir Supabase → SQL Editor → pegar contenido de supabase/schema.sql

# 5. Crear usuario en Supabase → Authentication → Users

# 6. Iniciar el servidor
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Deploy en Vercel

1. Importar el repositorio en [vercel.com](https://vercel.com)
2. Agregar las variables de entorno en **Settings → Environment Variables**
3. Deploy automático en cada `git push origin main`

---

## Validación de campos

| Tipo | Regla |
|---|---|
| `name` | Solo letras, tildes, espacios y comas. Sin números. Máx 60 caracteres. |
| `hora` | Solo dígitos, autoformatea a HH:MM. Rango válido 00:00–23:59. |
| `ot` | Alfanumérico y guiones. Máx 20 caracteres. |
| `contrato` | Solo números. Máx 10 caracteres. |

---

## Desarrollado por

[Go Dream AI](https://www.godreamai.com/)
