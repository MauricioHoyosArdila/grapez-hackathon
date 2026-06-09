import type { Client } from "./types"

// ─── Demo 1: Tienda Demo — E-commerce, ciclo completo ────────────────────────

const tiendaDemoConversation: NonNullable<Client["demoConversation"]> = [
  {
    id: "td-1",
    role: "user",
    content: "Hola, quiero diagnosticar el ecosistema de medición de Tienda Demo. Es una tienda online de ropa y accesorios.",
    timestamp: new Date("2026-05-10T10:00:00"),
  },
  {
    id: "td-2",
    role: "assistant",
    content:
      "**Paso 1 de 5 — Conocer tu negocio**\n\nSoy tu consultor de medición de Grapez Studio. Vamos a trabajar en 5 pasos: primero entiendo tu negocio, decidimos cómo trabajar, reviso tu medición, te muestro resultados y aplicamos mejoras.\n\nAntes de escribirte ya revisé tiendademo.vercel.app: tienda de moda con pago en el mismo sitio. Las acciones que más valen para ti: compra completada, inicio de pago y agregar al carrito. Ahora dime cómo quieres trabajar:",
    components: [
      {
        __a2ui: true,
        type: "choice_card",
        title: "¿Cómo quieres trabajar hoy?",
        description: "Las dos opciones incluyen el diagnóstico completo — la diferencia es si aplico los arreglos.",
        choices: [
          { id: "audit", label: "Solo diagnóstico (~5 min)", description: "Reviso tu Google Analytics, tus medidores (GTM) y el sitio, y te entrego un informe claro: qué funciona, qué no, y qué arreglaría yo primero. No toco ninguna configuración." },
          { id: "impl", label: "Diagnóstico + arreglos (~10-15 min)", description: "Lo mismo que A, y además aplico las correcciones una por una — solo las que tú apruebes con un clic. Puedes parar cuando quieras; lo no aprobado queda anotado como pendiente." },
        ],
      },
    ],
    timestamp: new Date("2026-05-10T10:00:05"),
  },
  {
    id: "td-3",
    role: "user",
    content: "Diagnóstico + arreglos (~10-15 min)",
    timestamp: new Date("2026-05-10T10:00:30"),
  },
  {
    id: "td-4",
    role: "assistant",
    content:
      "**Paso 3 de 5 — Revisar tu medición**\n\nPerfecto. Voy a revisar tu Google Analytics y tus medidores (Google Tag Manager): comparo lo que tu tienda DEBERÍA medir con lo que realmente está configurado. Tardo 1-2 minutos — no necesitas hacer nada.",
    components: [
      {
        __a2ui: true,
        type: "progress",
        title: "Paso 3 de 5 — Revisando tu medición",
        current: 1,
        total: 3,
        current_step: "Revisando Google Analytics: qué datos de tus clientes están llegando (GA4-320491823)",
      },
    ],
    timestamp: new Date("2026-05-10T10:00:35"),
  },
  {
    id: "td-5",
    role: "assistant",
    content:
      "**Paso 4 de 5 — Resultados: qué funciona y qué no**\n\nLo más importante: hoy tus ventas no cuentan como conversiones en Google Analytics — no sabes qué campañas generan dinero. Encontré 3 problemas críticos y 2 mejorables. La buena noticia: la medición automática de Google (Enhanced Measurement) está bien instalada.",
    components: [
      {
        __a2ui: true,
        type: "table",
        title: "Resultados — Tienda Demo (GA4-320491823)",
        columns: ["Área", "Estado", "Qué significa", "Prioridad"],
        rows: [
          ["Ventas — Conversiones", "❌", "Ninguna compra cuenta como conversión — no puedes optimizar campañas hacia ventas reales", "Alta"],
          ["Ventas — Segmentación de clientes", "❌", "No distingues clientes nuevos de recurrentes (sin custom dimensions) — todas tus decisiones son a ciegas", "Alta"],
          ["Calidad de datos — Tráfico interno", "❌", "Las visitas de tu propio equipo inflan tus números — no hay filtro", "Alta"],
          ["Calidad de datos — Aviso de cookies", "⚠️", "El aviso de cookies (Consent Mode) está a medias — Google puede descartar parte de tus datos", "Media"],
          ["Configuración — Historial", "⚠️", "Google solo guarda 2 meses de historial (retención de datos) — no podrás comparar este Black Friday con el anterior", "Media"],
          ["Configuración — Medición automática", "✅", "Clics, scroll y videos se miden solos (Enhanced Measurement)", "—"],
        ],
      },
    ],
    timestamp: new Date("2026-05-10T10:01:20"),
  },
  {
    id: "td-6",
    role: "assistant",
    content: "Propongo **3 arreglos**, ordenados por lo que más afecta tus ventas. Apruebas uno por uno — el que omitas queda anotado como pendiente:",
    components: [
      {
        __a2ui: true,
        type: "action_card",
        title: "Registrar cada compra como conversión",
        description:
          "Marco el evento 'purchase' como conversión en tu cuenta (GA4-320491823). Qué ganas: desde hoy sabrás qué campañas generan ventas reales. Es reversible en cualquier momento.",
        impact: "high",
        requires_confirmation: true,
        action_id: "create_conversion_purchase",
      },
      {
        __a2ui: true,
        type: "action_card",
        title: "Guardar 14 meses de historial en vez de 2",
        description:
          "Amplío la retención de datos de 2 a 14 meses. Qué ganas: podrás comparar temporadas completas (Black Friday 2025 vs 2026) y entender cuánto tarda un cliente en volver a comprar.",
        impact: "medium",
        requires_confirmation: true,
        action_id: "update_data_retention",
      },
      {
        __a2ui: true,
        type: "action_card",
        title: "Etiquetar clientes: nuevo, recurrente o VIP",
        description:
          "Creo la etiqueta 'tipo_cliente' (custom dimension) en tu cuenta. Qué ganas: ver qué compra cada tipo de cliente y dirigir tus campañas al que más vale.",
        impact: "medium",
        requires_confirmation: true,
        action_id: "create_dimension_tipo_cliente",
      },
    ],
    timestamp: new Date("2026-05-10T10:01:45"),
  },
  {
    id: "td-7",
    role: "user",
    content: "Confirmo: Registrar cada compra como conversión",
    timestamp: new Date("2026-05-10T10:02:10"),
  },
  {
    id: "td-8",
    role: "assistant",
    content: "",
    components: [
      {
        __a2ui: true,
        type: "progress",
        title: "Implementando cambios",
        current: 1,
        total: 3,
        current_step: "✅ Listo — desde hoy cada compra cuenta como conversión (GA4-320491823)",
      },
    ],
    timestamp: new Date("2026-05-10T10:02:15"),
  },
  {
    id: "td-9",
    role: "user",
    content: "Confirmo: Guardar 14 meses de historial en vez de 2",
    timestamp: new Date("2026-05-10T10:02:30"),
  },
  {
    id: "td-10",
    role: "assistant",
    content: "",
    components: [
      {
        __a2ui: true,
        type: "progress",
        title: "Implementando cambios",
        current: 2,
        total: 3,
        current_step: "✅ Listo — Google ahora guarda 14 meses de tu historial (GA4-320491823)",
      },
    ],
    timestamp: new Date("2026-05-10T10:02:35"),
  },
  {
    id: "td-11",
    role: "user",
    content: "Confirmo: Etiquetar clientes: nuevo, recurrente o VIP",
    timestamp: new Date("2026-05-10T10:02:50"),
  },
  {
    id: "td-12",
    role: "assistant",
    content: "**Paso 5 de 5 — Resumen final**\n\nLos 3 cambios quedaron aplicados. Esto es lo que cambia para ti desde hoy:",
    components: [
      {
        __a2ui: true,
        type: "summary_card",
        title: "Ecosistema GA4 configurado — Tienda Demo",
        mode: "auditoria_implementacion",
        stats: {
          criticos_encontrados: 3,
          mejorables_encontrados: 3,
          correctos: 1,
          acciones_implementadas: 3,
        },
        top_wins: [
          "Cada compra ya cuenta como conversión — sabrás qué campañas generan ventas reales",
          "Google guarda 14 meses de historial — podrás comparar temporadas completas",
          "Clientes etiquetados (nuevo / recurrente / VIP) — campañas dirigidas al que más vale",
        ],
        pending_actions: [
          "Filtrar las visitas de tu propio equipo — hoy inflan tus números",
          "Completar el aviso de cookies (Consent Mode) — Google puede descartar parte de tus datos",
        ],
        next_steps:
          "En 24-48 horas revisa tus reportes: deberías ver ventas reales con su valor. Yo arreglaría también el filtro de tráfico interno pendiente — tu propio equipo está inflando tus visitas.",
      },
    ],
    timestamp: new Date("2026-05-10T10:03:10"),
  },
]

// ─── Demo 2: Retail Colombia — Retail, auditoría GTM ─────────────────────────

const retailColombiaConversation: NonNullable<Client["demoConversation"]> = [
  {
    id: "rc-1",
    role: "user",
    content: "Necesito revisar el GTM de Retail Colombia. Vendemos muebles y electrodomésticos — generamos leads por formulario.",
    timestamp: new Date("2026-05-08T14:00:00"),
  },
  {
    id: "rc-2",
    role: "assistant",
    content:
      "¡Hola! Analizo **Retail Colombia** — negocio de generación de leads en el sector retail. Conversiones clave: `generate_lead`, `whatsapp_click`, `phone_click`.\n\n¿Qué alcance necesitas?",
    components: [
      {
        __a2ui: true,
        type: "choice_card",
        title: "Alcance del diagnóstico",
        choices: [
          { id: "audit", label: "Solo auditoría", description: "Diagnóstico sin modificar configuraciones." },
          { id: "impl", label: "Auditoría + implementación", description: "Diagnóstico y ejecución de mejoras con aprobación." },
        ],
      },
    ],
    timestamp: new Date("2026-05-08T14:00:08"),
  },
  {
    id: "rc-3",
    role: "user",
    content: "Solo auditoría",
    timestamp: new Date("2026-05-08T14:00:25"),
  },
  {
    id: "rc-4",
    role: "assistant",
    content: "Perfecto. Diagnóstico de solo lectura — no se modificará ninguna configuración.\n\nResultados del análisis GA4:",
    components: [
      {
        __a2ui: true,
        type: "table",
        title: "GA4 — Retail Colombia (GA4-198476321)",
        columns: ["Área", "Estado", "Hallazgo", "Prioridad"],
        rows: [
          ["Conversiones", "⚠️", "Solo 'generate_lead' marcado — faltan whatsapp_click y phone_click", "Alta"],
          ["Retención de datos", "✅", "Configurada en 14 meses", "—"],
          ["Dimensiones custom", "⚠️", "Dimensión 'lead_source' presente pero sin datos — parámetro mal nombrado", "Alta"],
          ["Enhanced Measurement", "✅", "Activado — scroll y outbound clicks configurados", "—"],
          ["Datos de conversión", "❌", "0 conversiones en los últimos 30 días — tracking roto", "Crítico"],
        ],
      },
    ],
    timestamp: new Date("2026-05-08T14:01:10"),
  },
  {
    id: "rc-5",
    role: "assistant",
    content: "Diagnóstico GTM — estado detallado del contenedor:",
    components: [
      {
        __a2ui: true,
        type: "table",
        title: "GTM — Retail Colombia (GTM-NKLP892)",
        columns: ["Componente", "Estado", "Problema detectado", "Prioridad"],
        rows: [
          ["Tag GA4 principal", "⚠️", "Measurement ID hardcodeado — riesgo de desincronización", "Media"],
          ["Trigger 'Form Submit'", "❌", "Configurado en 'All Forms' — dispara en cualquier form", "Alta"],
          ["Variable 'lead_source'", "❌", "'leadSource' (camelCase) ≠ 'lead_source' que espera GA4", "Crítico"],
          ["Workspace", "⚠️", "Todos los cambios en Default Workspace — sin trazabilidad", "Media"],
          ["Tag Ads Conversion", "✅", "Correctamente configurado con conversion ID y label", "—"],
        ],
      },
    ],
    timestamp: new Date("2026-05-08T14:01:55"),
  },
  {
    id: "rc-6",
    role: "assistant",
    content:
      "El diagnóstico revela la causa raíz de los **0 leads reportados**: la variable `lead_source` usa camelCase en GTM pero GA4 espera snake_case, rompiendo el mapeo completo.\n\nEs una corrección de 5 minutos con alto impacto — el formulario sí envía datos, pero GA4 no los recibe correctamente.",
    components: [
      {
        __a2ui: true,
        type: "summary_card",
        title: "Auditoría GA4 + GTM — Retail Colombia",
        mode: "auditoria",
        stats: {
          criticos_encontrados: 2,
          mejorables_encontrados: 3,
          correctos: 2,
          acciones_implementadas: 0,
        },
        top_wins: [
          "Retención de 14 meses configurada correctamente",
          "Tag de Google Ads correctamente implementado",
        ],
        pending_actions: [
          "Corregir variable: 'leadSource' → 'lead_source' en GTM",
          "Ajustar trigger 'Form Submit' — solo formulario de contacto",
          "Mover cambios de Default Workspace a workspace versionado",
          "Agregar conversiones whatsapp_click y phone_click en GA4",
        ],
        next_steps:
          "Prioridad 1: corregir la variable lead_source en GTM y publicar. Es el cambio más urgente — recupera todos los datos de leads que se están perdiendo hoy.",
      },
    ],
    timestamp: new Date("2026-05-08T14:02:40"),
  },
]

// ─── Demo 3: E-commerce Test — pendiente de confirmación ─────────────────────

const ecommerceTestConversation: NonNullable<Client["demoConversation"]> = [
  {
    id: "et-1",
    role: "user",
    content: "Diagnóstico completo del ecosistema de ecomtest.co — tienda de electrónica y tecnología.",
    timestamp: new Date("2026-05-12T09:00:00"),
  },
  {
    id: "et-2",
    role: "assistant",
    content:
      "¡Hola! Voy a analizar **E-commerce Test** — tienda de electrónica. Conversiones clave para este modelo: purchase, begin_checkout, add_to_cart, view_item con revenue.\n\n¿Qué alcance necesitas?",
    components: [
      {
        __a2ui: true,
        type: "choice_card",
        title: "Alcance del diagnóstico",
        choices: [
          { id: "audit", label: "Solo auditoría", description: "Diagnóstico completo sin modificar configuraciones." },
          { id: "impl", label: "Auditoría + implementación", description: "Diagnóstico y ejecución de mejoras con tu aprobación." },
        ],
      },
    ],
    timestamp: new Date("2026-05-12T09:00:07"),
  },
  {
    id: "et-3",
    role: "user",
    content: "Auditoría + implementación",
    timestamp: new Date("2026-05-12T09:00:22"),
  },
  {
    id: "et-4",
    role: "assistant",
    content: "Conectando con GA4 y GTM... Diagnóstico completado:",
    components: [
      {
        __a2ui: true,
        type: "table",
        title: "Diagnóstico completo — E-commerce Test",
        columns: ["Sistema", "Área", "Estado", "Hallazgo"],
        rows: [
          ["GA4", "Conversiones", "❌", "Evento 'purchase' presente pero NO marcado como conversión"],
          ["GA4", "Parámetros ecommerce", "❌", "Faltan 'value' y 'currency' — revenue = $0 en reportes"],
          ["GA4", "Retención", "⚠️", "Configurada en 2 meses"],
          ["GA4", "Audiences", "✅", "Audiencia 'Compradores 30d' correctamente configurada"],
          ["GTM", "Tag GA4", "✅", "Variable de Measurement ID correctamente configurada"],
          ["GTM", "Trigger purchase", "❌", "Dispara en cualquier pageview '/gracias' — no valida dataLayer"],
          ["GTM", "Variable 'ecommerce'", "⚠️", "Variable de capa de datos sin valor por defecto"],
          ["GTM", "Workspace", "⚠️", "8 cambios sin publicar en Default Workspace (3 semanas)"],
        ],
      },
    ],
    timestamp: new Date("2026-05-12T09:01:30"),
  },
  {
    id: "et-5",
    role: "assistant",
    content:
      "Encontré **2 problemas críticos** que explican por qué el revenue reportado es $0 a pesar de haber ventas reales. Confirma cada acción para ejecutarla:",
    components: [
      {
        __a2ui: true,
        type: "action_card",
        title: "Marcar 'purchase' como conversión en GA4",
        description:
          "El evento 'purchase' llega a GA4 pero no está marcado como conversión. Sin esto, las campañas de Google Ads no pueden optimizar hacia ventas reales y los reportes muestran 0 conversiones.",
        impact: "high",
        requires_confirmation: true,
        action_id: "create_conversion_purchase",
      },
      {
        __a2ui: true,
        type: "action_card",
        title: "Actualizar retención de datos a 14 meses",
        description:
          "Actualmente en 2 meses — se perderán todos los datos de la temporada navideña 2025 en febrero 2026 si no se corrige ahora.",
        impact: "medium",
        requires_confirmation: true,
        action_id: "update_data_retention",
      },
    ],
    timestamp: new Date("2026-05-12T09:01:55"),
  },
]

// ─── Clientes ─────────────────────────────────────────────────────────────────

export const mockClients: Client[] = [
  {
    id: "tienda-demo",
    name: "Tienda Demo",
    websiteUrl: "https://tiendademo.vercel.app",
    industry: "E-commerce",
    status: "connected",
    lastDiagnosed: "2026-05-10",
    isDemo: true,
    demoConversation: tiendaDemoConversation,
  },
  {
    id: "retail-colombia",
    name: "Retail Colombia",
    websiteUrl: "https://retailcolombia.com",
    industry: "Retail",
    status: "connected",
    lastDiagnosed: "2026-05-08",
    isDemo: true,
    demoConversation: retailColombiaConversation,
  },
  {
    id: "ecommerce-test",
    name: "E-commerce Test",
    websiteUrl: "https://ecomtest.co",
    industry: "E-commerce",
    status: "pending",
    lastDiagnosed: "2026-05-12",
    isDemo: true,
    demoConversation: ecommerceTestConversation,
  },
  {
    // Cliente real — sesión en vivo con el agente
    id: "grapez-studio",
    name: "Grapez Studio",
    websiteUrl: "https://grapez.co",
    industry: "Marketing Agency",
    status: "connected",
    lastDiagnosed: "2026-05-12",
    isDemo: false,
  },
]
