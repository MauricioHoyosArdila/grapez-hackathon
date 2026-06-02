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
      "¡Hola! Soy el agente de analytics de **Grapez Studio**. Voy a analizar el ecosistema de medición de **Tienda Demo**.\n\nHe investigado tiendademo.vercel.app: e-commerce de moda con checkout propio. Conversiones clave detectadas: compra completada, inicio de checkout, agregar al carrito.\n\n¿Con qué alcance quieres proceder?",
    components: [
      {
        __a2ui: true,
        type: "choice_card",
        title: "Selecciona el alcance del trabajo",
        description: "Define si el agente solo auditará o también implementará los cambios.",
        choices: [
          { id: "audit", label: "Solo auditoría", description: "Diagnóstico completo sin modificar ninguna configuración." },
          { id: "impl", label: "Auditoría + implementación", description: "Diagnóstico + ejecución de cambios con tu aprobación en cada paso." },
        ],
      },
    ],
    timestamp: new Date("2026-05-10T10:00:05"),
  },
  {
    id: "td-3",
    role: "user",
    content: "Auditoría + implementación",
    timestamp: new Date("2026-05-10T10:00:30"),
  },
  {
    id: "td-4",
    role: "assistant",
    content:
      "Perfecto. Iniciando diagnóstico con alcance de **auditoría e implementación**. Conectando con GA4 y GTM de Tienda Demo...",
    components: [
      {
        __a2ui: true,
        type: "progress",
        title: "Analizando ecosistema",
        current: 1,
        total: 4,
        current_step: "Consultando Google Analytics 4 — propiedad Tienda Demo (GA4-320491823)",
      },
    ],
    timestamp: new Date("2026-05-10T10:00:35"),
  },
  {
    id: "td-5",
    role: "assistant",
    content: "**Diagnóstico GA4 completado.** He analizado la propiedad principal:",
    components: [
      {
        __a2ui: true,
        type: "table",
        title: "GA4 — Tienda Demo (GA4-320491823)",
        columns: ["Área", "Estado", "Hallazgo", "Prioridad"],
        rows: [
          ["Conversiones", "❌", "No hay ningún evento marcado como conversión", "Alta"],
          ["Retención de datos", "⚠️", "Configurada en 2 meses — se pierde historial comparativo", "Media"],
          ["Dimensiones custom", "❌", "Sin dimensiones personalizadas (tipo de cliente, canal)", "Alta"],
          ["Enhanced Measurement", "✅", "Activado correctamente — clicks, scroll, video", "—"],
          ["Consent Mode v2", "⚠️", "Implementado parcialmente — falta default 'denied'", "Media"],
          ["Filtro tráfico interno", "❌", "No hay filtro — accesos del equipo contaminan datos", "Alta"],
        ],
      },
    ],
    timestamp: new Date("2026-05-10T10:01:20"),
  },
  {
    id: "td-6",
    role: "assistant",
    content: "Basado en el diagnóstico, propongo **3 acciones** ordenadas por impacto en negocio. Confirma cada una para ejecutarla:",
    components: [
      {
        __a2ui: true,
        type: "action_card",
        title: "Crear conversión 'purchase' en GA4",
        description:
          "Se marcará el evento 'purchase' como conversión en GA4-320491823. Sin esto, no puedes optimizar campañas hacia compras reales. Esta acción es reversible desde la UI de GA4.",
        impact: "high",
        requires_confirmation: true,
        action_id: "create_conversion_purchase",
      },
      {
        __a2ui: true,
        type: "action_card",
        title: "Actualizar retención de datos a 14 meses",
        description:
          "Se cambiará la retención de 2 meses a 14 meses. Esto permite comparar temporadas completas (Black Friday 2025 vs 2026) y analizar ciclo de vida de clientes.",
        impact: "medium",
        requires_confirmation: true,
        action_id: "update_data_retention",
      },
      {
        __a2ui: true,
        type: "action_card",
        title: "Crear dimensión custom 'tipo_cliente'",
        description:
          "Se creará la dimensión de evento 'tipo_cliente' (nuevo / recurrente / VIP) para segmentar el comportamiento de compra por tipo de usuario.",
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
    content: "Confirmo: create_conversion_purchase",
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
        current_step: "✅ Conversión 'purchase' creada — GA4-320491823",
      },
    ],
    timestamp: new Date("2026-05-10T10:02:15"),
  },
  {
    id: "td-9",
    role: "user",
    content: "Confirmo: update_data_retention",
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
        current_step: "✅ Retención actualizada a 14 meses — GA4-320491823",
      },
    ],
    timestamp: new Date("2026-05-10T10:02:35"),
  },
  {
    id: "td-11",
    role: "user",
    content: "Confirmo: create_dimension_tipo_cliente",
    timestamp: new Date("2026-05-10T10:02:50"),
  },
  {
    id: "td-12",
    role: "assistant",
    content: "✅ Los 3 cambios se aplicaron correctamente. Aquí el reporte final:",
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
          "Conversión 'purchase' activa — GA4 reporta ventas reales",
          "Retención de 14 meses — comparación histórica disponible",
          "Dimensión 'tipo_cliente' creada para segmentación avanzada",
        ],
        pending_actions: [
          "Configurar filtro de tráfico interno (IP del equipo)",
          "Completar Consent Mode v2 con valor default 'denied'",
        ],
        next_steps:
          "Monitorear DebugView en GA4 durante 48h para confirmar que 'purchase' llega con los parámetros value, currency e items correctos.",
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
