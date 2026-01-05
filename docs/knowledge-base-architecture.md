# Arquitectura de Base de Conocimiento

Este documento describe la arquitectura y separacion de los sistemas de gestion de conocimiento en la aplicacion.

## Sistemas Independientes

Existen **dos sistemas separados** para gestionar informacion:

| Sistema | Proposito | Ruta Frontend |
|---------|-----------|---------------|
| **Knowledge Base** | Documentos generales de conocimiento | `/knowledge-base` |
| **Excelencia** | Catalogo de productos de software | `/excelencia` |

---

## 1. Knowledge Base (Base de Conocimiento)

### Descripcion
Sistema para gestionar documentos de conocimiento general: FAQs, guias, politicas, informacion de contacto, etc.

### Tabla de Base de Datos
```
core.company_knowledge
```

### Endpoint API
```
/admin/knowledge
```

### Estructura de Documento
```typescript
interface Document {
  id: string
  title: string
  content: string
  document_type: string      // 'general', 'faq', 'mission_vision', 'contact_info', etc.
  category?: string
  tags?: string[]
  meta_data?: Record<string, unknown>
  active: boolean
  has_embedding: boolean
  embedding_model?: string
  created_at: string
  updated_at: string
}
```

### Tipos de Documento Soportados
| Tipo | Descripcion | Contexto |
|------|-------------|----------|
| `general` | Documentos de proposito general | Global, Tenant |
| `faq` | Preguntas frecuentes | Global, Tenant |
| `mission_vision` | Mision y vision de la empresa | Global |
| `contact_info` | Informacion de contacto | Global |
| `clients` | Informacion de clientes | Global |
| `success_stories` | Casos de exito | Global |
| `guide` | Guias y manuales | Tenant |
| `policy` | Politicas y procedimientos | Tenant |
| `product_info` | Informacion de productos | Tenant |
| `uploaded_pdf` | PDFs subidos | Tenant |
| `training` | Material de capacitacion | Tenant |
| `support` | Documentacion de soporte | Tenant |

### Archivos de Codigo
- **API**: `src/api/knowledge.api.ts`
- **Store**: `src/stores/knowledge.store.ts`
- **Composable**: `src/composables/useKnowledge.ts`
- **Pagina**: `src/pages/knowledge/KnowledgeBasePage.vue`
- **Componentes**: `src/components/documents/`

---

## 2. Excelencia (Catalogo de Software)

### Descripcion
Sistema para gestionar el catalogo de productos y modulos de software de la empresa.

### Tabla de Base de Datos
```
excelencia.software_modules
```

### Endpoint API
```
/admin/modules
```

### Estructura de Modulo
```typescript
interface SoftwareModule {
  id: string
  code: string                 // Ej: "MEDBOT-001", "TM-001"
  name: string
  description: string
  category: ModuleCategory     // 'healthcare', 'hospitality', 'finance', etc.
  status: ModuleStatus         // 'active', 'beta', 'coming_soon', 'deprecated'
  features: string[]
  pricing_tier: PricingTier    // 'standard', 'premium', 'enterprise'
  active: boolean
  knowledge_synced: boolean
  created_at: string
  updated_at: string
}
```

### Categorias de Modulo
- `general` - General
- `healthcare` - Salud
- `hospitality` - Hoteleria
- `finance` - Finanzas
- `retail` - Retail
- `education` - Educacion
- `government` - Gobierno

### Estados de Modulo
- `active` - Activo (disponible)
- `beta` - En fase beta
- `coming_soon` - Proximamente
- `deprecated` - Deprecado

### Planes de Precio
- `standard` - Plan estandar
- `premium` - Plan premium
- `enterprise` - Plan empresarial

### Archivos de Codigo
- **API**: `src/api/agent.api.ts` (catalogApi)
- **Tipos**: `src/types/agent.types.ts`
- **Adapter**: `src/adapters/moduleAdapter.ts`
- **Pagina**: `src/pages/excelencia/ExcelenciaPage.vue`
- **Modal**: `src/components/excelencia/ModuleEditDialog.vue`

---

## 3. Diferencias Clave

| Aspecto | Knowledge Base | Excelencia |
|---------|----------------|------------|
| **Proposito** | Documentos de conocimiento | Catalogo de productos |
| **Schema.Tabla** | `core.company_knowledge` | `excelencia.software_modules` |
| **API** | `/admin/knowledge` | `/admin/modules` |
| **Embeddings** | Si (busqueda semantica) | No |
| **Estructura** | Flexible (document_type) | Fija (campos especificos) |
| **Edicion** | Titulo, contenido, categoria, tags | Codigo, nombre, features, pricing, etc. |

---

## 4. Notas Importantes

### Tipo `software_catalog` en Knowledge Base (DEPRECADO)
Anteriormente existia un tipo de documento `software_catalog` en Knowledge Base que duplicaba informacion del catalogo de software. **Este tipo ya no debe usarse.**

Todo el catalogo de software debe gestionarse exclusivamente desde **Excelencia** (`/excelencia`).

### Flujo Recomendado
- **Documentos generales** → Knowledge Base (`/knowledge-base`)
- **Catalogo de software** → Excelencia (`/excelencia`)
- **Knowledge de agentes** → Knowledge Base con source "Agente"

---

## 5. Diagrama de Arquitectura

```
+------------------+     +------------------+
|  Knowledge Base  |     |    Excelencia    |
+------------------+     +------------------+
        |                        |
        v                        v
+------------------+     +------------------+
| /admin/knowledge |     | /admin/modules   |
+------------------+     +------------------+
        |                        |
        v                        v
+----------------------+  +-------------------------+
| core.company_knowledge|  | excelencia.software_modules |
|       (tabla)        |  |         (tabla)         |
+----------------------+  +-------------------------+
```
"core"."agent_knowledge"

### Conexion a Base de Datos
```bash
PGPASSWORD=aynux_dev psql -h localhost -U enzo -d aynux
```

---

## 6. APIs Disponibles

### Knowledge Base API
```typescript
knowledgeApi.list(params)           // Listar documentos
knowledgeApi.getById(id)            // Obtener documento
knowledgeApi.create(data)           // Crear documento
knowledgeApi.update(id, data)       // Actualizar documento
knowledgeApi.delete(id, hard)       // Eliminar documento
knowledgeApi.search(params)         // Busqueda semantica
knowledgeApi.batchDelete(ids, hard) // Eliminar en lote
```

### Catalog API (Excelencia)
```typescript
catalogApi.getModules(filters)      // Listar modulos
catalogApi.getModule(id)            // Obtener modulo
catalogApi.createModule(data)       // Crear modulo
catalogApi.updateModule(id, data)   // Actualizar modulo
catalogApi.deleteModule(id, hard)   // Eliminar modulo
```
