# Grapez Analytics Standards
## Conocimiento especializado para diagnóstico e implementación de ecosistemas de medición en PYMEs

---

## 1. Contexto: Cómo son los clientes de Grapez

Los clientes de Grapez son PYMEs latinoamericanas. Antes de diagnosticar cualquier ecosistema, asume lo siguiente:

**Realidad del 80% de los clientes:**
- No miden nada, o lo que tienen implementado está mal
- Nunca parten de cero limpio — siempre hay algo instalado a medias, duplicado o incorrecto
- Sus ecosistemas son simples: no necesitan BigQuery, server-side tracking, ni cross-domain
- Sus conversiones reales son pocas y concretas: compra, formulario, WhatsApp, llamada telefónica
- GTM existe pero nadie sabe quién lo configuró ni qué hace cada tag
- Google Ads existe pero nunca ha estado vinculado a GA4

**Principio fundamental del diagnóstico:**
> No asumas que nada funciona. Verifica todo desde cero. Un tag que "debería estar funcionando" casi nunca lo está correctamente.

---

## 2. Modelos de negocio comunes y sus conversiones obligatorias

### 2.1 Ecommerce (tienda online)

**Conversiones obligatorias — sin estas el ecosistema no está listo:**
- `purchase` — con `transaction_id`, `value`, `currency`, array `items` completo
- `begin_checkout` — inicio del proceso de compra
- `add_to_cart` — agregación de producto al carrito

**Conversiones recomendadas:**
- `view_item` — vista de producto
- `add_payment_info` — ingreso de datos de pago
- `remove_from_cart` — si aplica

**Micro conversiones útiles para PYMEs:**
- Clic en WhatsApp (si venden por WhatsApp además del carrito)
- Búsqueda interna del sitio

**Red flag crítico:** Si `purchase` no tiene el array `items` completo, todos los reportes de productos están rotos aunque el evento aparezca en GA4.

---

### 2.2 Leadgen (servicios, consultoría, educación, inmobiliaria)

**Conversiones obligatorias:**
- Envío del formulario principal del negocio — evento `generate_lead` o custom según el sitio
- Con parámetro `lead_source` (distinguir: formulario web, WhatsApp, llamada)

**Conversiones recomendadas:**
- Clic en número de teléfono (`tel:` links)
- Clic en WhatsApp (`wa.me` links)
- Si hay múltiples formularios: diferenciarlos por `form_id` o `form_name`

**Micro conversiones útiles:**
- Descarga de brochure o PDF
- Vista de página de precios
- Tiempo en página de servicios > 60 segundos

**Red flag crítico:** El formulario dispara el evento en el `page load` del formulario, no en el `submit`. Esto infla conversiones falsas.

---

### 2.3 Servicios locales (restaurantes, clínicas, talleres, salones)

**Conversiones obligatorias:**
- Clic en WhatsApp
- Clic en número de teléfono
- Reserva o cita agendada (si tienen sistema de reservas)

**Conversiones recomendadas:**
- Clic en dirección / "Cómo llegar"
- Vista de menú o carta (si es restaurante)
- Formulario de contacto

**Micro conversiones útiles:**
- Vista de horarios
- Clic en Instagram / redes sociales

---

### 2.4 Negocio mixto (ecommerce + servicios)

Aplica conversiones de ecommerce **y** leadgen según las líneas de negocio activas. El agente debe preguntar cuál es la fuente de ingresos principal para priorizar.

---

## 3. Checklist de auditoría — qué verificar siempre

### 3.1 Configuración base GA4 (verificar primero)

| Item | Qué verificar | Estado bueno | Red flag |
|---|---|---|---|
| Data retention | Configuración en Admin | 14 meses | 2 meses (default) — datos históricos se pierden |
| Timezone | Admin > Property settings | Timezone del país del cliente | UTC o timezone incorrecta |
| Currency | Admin > Property settings | Moneda local del negocio | USD en negocio que vende en COP/MXN |
| Internal traffic | Admin > Data filters | Filtro activo con IP de la empresa | Sin filtros — el equipo contamina las conversiones |
| Stream web | Admin > Data streams | Un stream activo con URL correcta | Sin stream, o URL incorrecta |
| Enhanced measurement | Admin > Data streams | Activado con scroll, outbound clicks | Desactivado completamente |

### 3.2 Implementación técnica

| Item | Qué verificar | Estado bueno | Red flag |
|---|---|---|---|
| Método de instalación | Cómo está instalado GA4 | GTM **o** gtag.js — solo uno | Ambos instalados → eventos duplicados |
| GTM container | Presencia en el sitio | Un container, bien posicionado | Múltiples containers, o posición incorrecta |
| Measurement ID | ID en el sitio vs ID en GA4 | Coinciden exactamente | IDs diferentes → datos van a otra propiedad |
| Consent Mode | Implementación | Consent Mode v2 activo | No implementado (problema legal en algunos mercados) |

### 3.3 Conversiones

| Item | Qué verificar | Estado bueno | Red flag |
|---|---|---|---|
| Conversiones configuradas | Cuáles están marcadas como key events | Solo las acciones realmente valiosas (3-5) | Ninguna, o todas las páginas vistas marcadas como conversión |
| Momento del disparo | Cuándo se dispara el evento | En la acción completada (thank-you page, submit exitoso) | En carga de página del formulario |
| Parámetros del evento | Qué datos acompañan el evento | `value`, `currency`, `transaction_id` presentes | Eventos vacíos sin parámetros |
| Items en ecommerce | Array items en evento purchase | Completo con item_id, item_name, price, quantity | Vacío o ausente |

### 3.4 Integraciones

| Item | Qué verificar | Estado bueno | Red flag |
|---|---|---|---|
| Google Ads vinculado | Admin > Product links | Vinculado con auto-tagging ON | No vinculado, o auto-tagging OFF |
| Conversiones en Ads | Configuración en Google Ads | Importadas desde GA4 | Tag de Ads duplicado instalado en el sitio |
| Search Console | Admin > Product links | Conectado | No conectado |

---

## 4. Naming conventions — estándar Grapez

Todos los eventos custom que Grapez implementa siguen estas reglas:

**Formato:** `snake_case` — minúsculas, palabras separadas por guión bajo
**Longitud máxima:** 40 caracteres
**Prohibido:** espacios, guiones, mayúsculas, caracteres especiales, prefijos `google_` / `ga_`

**Eventos estándar Grapez para PYMEs:**

```
whatsapp_click          — clic en cualquier botón/link de WhatsApp
phone_click             — clic en número de teléfono (tel: links)
form_submit             — envío exitoso de formulario (diferencia con form_start)
form_start              — primer campo completado en un formulario
file_download           — descarga de archivo (PDF, brochure)
video_play              — reproducción de video
social_click            — clic en ícono de red social
map_click               — clic en "cómo llegar" o mapa
appointment_booked      — reserva o cita confirmada
chat_open               — apertura de chat en vivo
```

**Parámetros estándar que siempre acompañan los eventos:**

```
form_id         — identifica qué formulario (ej: "contacto_home", "cotizacion_servicios")
click_url       — URL de destino en clics externos
file_name       — nombre del archivo descargado
video_title     — título del video
```

---

## 5. Criterios de prioridad — cómo clasificar hallazgos

### Crítico ❌ — el ecosistema no funciona sin esto
- No hay ninguna conversión configurada
- GA4 no está instalado o el Measurement ID es incorrecto
- Eventos duplicados (doble conteo de todo)
- Data retention en 2 meses con más de 2 meses de historia del negocio
- `purchase` sin array `items` en negocio ecommerce
- Google Ads activo sin estar vinculado a GA4

### Mejorable ⚠️ — funciona pero con problemas
- Conversiones configuradas no corresponden al modelo de negocio real
- Falta filtro de internal traffic
- Evento de conversión dispara en momento incorrecto
- Faltan conversiones secundarias importantes (WhatsApp, teléfono)
- Auto-tagging de Ads desactivado
- Timezone o currency incorrectos

### Recomendado 💡 — buenas prácticas no urgentes
- Enhanced measurement no optimizado
- Falta Search Console vinculado
- Sin micro conversiones configuradas
- Naming conventions inconsistentes en eventos existentes
- Sin Consent Mode implementado

---

## 6. Principios de implementación — lo que Grapez siempre hace

1. **Nunca borrar lo que existe** — primero auditar, luego decidir qué reemplazar
2. **Un solo método de instalación** — GTM o gtag.js, nunca los dos
3. **Validar antes de publicar** — todo pasa por GTM Preview + DebugView antes de ir a producción
4. **Workspace limpio en GTM** — nunca trabajar en Default Workspace; crear workspace por implementación
5. **Documentar cada cambio** — cada versión publicada en GTM debe tener descripción del cambio
6. **Conversiones solo en acciones completadas** — nunca en cargas de página ni clics sin confirmación
7. **Máximo 5 key events** — para PYMEs, más de 5 conversiones es ruido
8. **Siempre vincular Ads a GA4** — si el cliente tiene Ads activo, es la primera integración a hacer

---

## 7. Preguntas clave para el brief del cliente

El agente debe recopilar esta información antes de diagnosticar. Si alguna respuesta no está clara, preguntar directamente:

```
NEGOCIO
- ¿A qué se dedica el negocio y cómo genera ingresos?
- ¿Cuál es la acción más valiosa que un usuario puede hacer en el sitio?
- ¿Venden directamente en el sitio o el sitio genera leads/contactos?
- ¿Operan en uno o varios países?

ESTADO ACTUAL
- ¿Tienen GA4 instalado? (si no saben, el Web Analyzer lo detecta)
- ¿Tienen GTM? (si no saben, el Web Analyzer lo detecta)
- ¿Están activos en Google Ads?
- ¿Han tenido problemas o sospechas de datos incorrectos?

TÉCNICO
- ¿Cuál es la URL del sitio?
- ¿En qué plataforma está el sitio? (Shopify, WordPress, custom, etc.)
- ¿Pueden modificar el código del sitio o todo debe ir por GTM?
```

---

## 8. Lo que un agente NO debe hacer

- Crear cuentas de GA4, GTM o Google Ads — las cuentas deben existir
- Publicar versiones en GTM sin confirmación del consultor
- Eliminar tags, triggers o variables existentes sin auditar primero su uso
- Marcar más de 5 eventos como key events en una PYME
- Implementar soluciones enterprise (BigQuery, server-side, cross-domain) sin que el cliente lo necesite explícitamente
- Asumir que porque un tag existe en GTM, está funcionando correctamente
