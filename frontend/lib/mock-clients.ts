import { Client } from "./types"
import { A2UITable, A2UIActionCard, A2UISummaryCard } from "./types"

export const mockClients: Client[] = [
  {
    id: "tienda-demo",
    name: "Tienda Demo",
    websiteUrl: "https://tiendademo.vercel.app",
    industry: "E-commerce",
    status: "connected",
    lastDiagnosed: "2026-05-10",
  },
  {
    id: "retail-colombia",
    name: "Retail Colombia",
    websiteUrl: "https://retailcolombia.com",
    industry: "Retail",
    status: "connected",
    lastDiagnosed: "2026-05-08",
  },
  {
    id: "ecommerce-test",
    name: "E-commerce Test",
    websiteUrl: "https://ecomtest.co",
    industry: "E-commerce",
    status: "pending",
  },
  {
    id: "grapez-studio",
    name: "Grapez Studio",
    websiteUrl: "https://grapez.co",
    industry: "Marketing Agency",
    status: "connected",
    lastDiagnosed: "2026-05-12",
  },
]

export const mockDiagnosisTable: A2UITable = {
  __a2ui: true,
  type: "table",
  title: "Diagnóstico GA4 — Tienda Demo",
  columns: ["Área", "Estado", "Descripción", "Prioridad"],
  rows: [
    ["Conversiones", "❌", "No hay eventos de purchase configurados", "Alta"],
    ["Retención de datos", "⚠️", "Configurada en 2 meses (recomendado: 14)", "Media"],
    ["Enhanced Measurement", "✅", "Activado correctamente", "—"],
    ["Dimensiones custom", "❌", "Sin dimensiones personalizadas definidas", "Alta"],
    ["Consent Mode v2", "⚠️", "Implementado parcialmente", "Media"],
    ["BigQuery Link", "❌", "No configurado", "Baja"],
  ],
}

export const mockActionCard: A2UIActionCard = {
  __a2ui: true,
  type: "action_card",
  title: "Crear conversión 'purchase'",
  description:
    "Se creará el evento de conversión 'purchase' en la propiedad GA4-320491823. Esta acción no puede deshacerse desde la API.",
  impact: "high",
  requires_confirmation: true,
  action_id: "create_conversion_purchase",
}

export const mockSummaryCard: A2UISummaryCard = {
  __a2ui: true,
  type: "summary_card",
  title: "Ecosistema configurado exitosamente",
  sections: [
    { label: "GA4", items_fixed: 4, status: "complete" },
    { label: "GTM", items_fixed: 7, status: "complete" },
  ],
}
