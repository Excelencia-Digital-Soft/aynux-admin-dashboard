# Aynux Admin Dashboard

Panel de administracion construido con Vue.js 3, TypeScript y PrimeVue.

## Tecnologias

- **Frontend**: Vue 3 (Composition API) + TypeScript
- **UI**: PrimeVue (tema Aura) + Tailwind CSS
- **Estado**: Pinia con persistencia en localStorage
- **Build**: Vite
- **Testing**: Vitest (unitarias) + Playwright (E2E)
- **Visualizacion**: Chart.js, Vue Flow, D3.js

## Requisitos

- Node.js 18+
- npm 9+
- Backend API corriendo en `localhost:8080`

## Instalacion

```bash
# Clonar repositorio
git clone <repo-url>
cd vuejs

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## Variables de Entorno

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_V1_STR=/api/v1
```

## Comandos

```bash
# Desarrollo (puerto 3000)
npm run dev

# Build de produccion
npm run build

# Vista previa del build
npm run preview

# Tests unitarios
npm run test:unit

# Tests E2E
npm run test:e2e

# Linting
npm run lint

# Formateo
npm run format
```

## Estructura del Proyecto

```
src/
├── api/                 # Clientes API (Axios)
│   ├── index.ts         # Configuracion base con interceptores
│   ├── auth.api.ts      # Autenticacion
│   ├── chat.api.ts      # Chat y conversaciones
│   ├── knowledge.api.ts # Base de conocimiento
│   └── ...
├── components/          # Componentes reutilizables
│   ├── analytics/       # Graficos y metricas
│   ├── chat/            # Visualizador de chat
│   ├── documents/       # Gestion de documentos
│   └── organizations/   # Gestion de organizaciones
├── composables/         # Logica reutilizable
│   ├── useAuth.ts       # Autenticacion
│   ├── useKnowledge.ts  # Base de conocimiento
│   ├── usePagination.ts # Paginacion
│   └── useToast.ts      # Notificaciones
├── layouts/             # Layouts de pagina
│   ├── AuthLayout.vue   # Login (sin sidebar)
│   └── DefaultLayout.vue # App principal (con sidebar)
├── pages/               # Paginas/Vistas
│   ├── auth/            # Login
│   ├── chat/            # Visualizador de chat
│   ├── config/          # Configuracion de agentes
│   ├── knowledge/       # Base de conocimiento, embeddings
│   ├── organizations/   # Gestion multi-tenant
│   └── tenant/          # Configuracion de tenant
├── router/              # Vue Router
├── stores/              # Pinia stores
│   ├── auth.store.ts    # Estado de autenticacion
│   ├── chat.store.ts    # Estado de chat
│   └── ...
├── types/               # Tipos TypeScript
└── utils/               # Utilidades
```

## Funcionalidades

### Autenticacion
- Login con JWT
- Persistencia de sesion
- Cambio de organizacion

### Base de Conocimiento
- Subida de documentos
- Gestion de embeddings
- Dashboard RAG

### Chat
- Visualizador de conversaciones
- Historial de mensajes

### Multi-Tenant
- Gestion de organizaciones
- Gestion de usuarios
- Configuracion por tenant

### Configuracion
- Configuracion de agentes IA
- Estadisticas y analytics

## Desarrollo

### Convencion de Codigo

- Componentes en PascalCase (ej: `ChatMessage.vue`)
- Composables con prefijo `use` (ej: `useAuth.ts`)
- Stores con sufijo `.store.ts`
- Tipos con sufijo `.types.ts`
- APIs con sufijo `.api.ts`

### Agregar Nueva Pagina

1. Crear componente en `src/pages/<dominio>/`
2. Agregar ruta en `src/router/index.ts`
3. Agregar entrada en el menu de `DefaultLayout.vue`

### Agregar Nuevo Store

1. Crear archivo en `src/stores/<nombre>.store.ts`
2. Usar Composition API con `defineStore`
3. Agregar `persist: true` si requiere persistencia

## Licencia

Privado - Aynux
