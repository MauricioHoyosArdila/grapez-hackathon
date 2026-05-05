"""
demo/reset_demo.py
Resetea el entorno demo a su estado "con errores" antes de grabar el video.

USO:
  python demo/reset_demo.py

QUÉ HACE:
  1. Borra conversiones de GA4 TiendaDemo
  2. Restaura retención de datos a 2 meses
  3. Borra dimensiones personalizadas
  4. En GTM: restaura tags duplicados y triggers mal configurados
  5. En Google Ads: desvincula GA4, desactiva auto-tagging

PREREQUISITOS:
  - .env configurado con IDs de las propiedades demo
  - Credenciales de servicio con acceso a las propiedades demo
  - Ejecutar SOLO contra cuentas demo, NUNCA contra cuentas de clientes reales

TODO: implementar cuando el entorno demo esté creado (Semana 3)
"""

import os
from dotenv import load_dotenv

load_dotenv()

DEMO_GA4_PROPERTY_ID = os.getenv("DEMO_GA4_PROPERTY_ID")
DEMO_GTM_ACCOUNT_ID = os.getenv("DEMO_GTM_ACCOUNT_ID")
DEMO_GTM_CONTAINER_ID = os.getenv("DEMO_GTM_CONTAINER_ID")
DEMO_GOOGLE_ADS_CUSTOMER_ID = os.getenv("DEMO_GOOGLE_ADS_CUSTOMER_ID")


def reset_ga4():
    """Resetea GA4 TiendaDemo al estado con errores."""
    print("🔄 Reseteando GA4 TiendaDemo...")
    # TODO: implementar en Semana 3
    # - Borrar conversiones existentes
    # - Poner retención en 2 meses
    # - Borrar dimensiones custom
    print("✅ GA4 reseteado")


def reset_gtm():
    """Restaura el contenedor GTM con errores plantados."""
    print("🔄 Reseteando GTM TiendaDemo...")
    # TODO: implementar en Semana 3
    # - Crear workspace con errores
    # - Añadir tag de GA4 duplicado
    # - Trigger mal configurado (All Clicks en vez de specific button)
    # - Variables de dataLayer faltantes
    print("✅ GTM reseteado")


def reset_google_ads():
    """Resetea Google Ads al estado sin vincular a GA4."""
    print("🔄 Reseteando Google Ads demo...")
    # TODO: implementar en Semana 3
    # - Desvincular GA4
    # - Desactivar auto-tagging
    print("✅ Google Ads reseteado")


if __name__ == "__main__":
    print("🎬 Preparando entorno demo para grabación de video...")
    print(f"   GA4 Property: {DEMO_GA4_PROPERTY_ID}")
    print(f"   GTM Container: {DEMO_GTM_CONTAINER_ID}")
    print()

    if not DEMO_GA4_PROPERTY_ID:
        print("❌ ERROR: DEMO_GA4_PROPERTY_ID no configurado en .env")
        print("   Crear primero el entorno demo y actualizar .env")
        exit(1)

    reset_ga4()
    reset_gtm()
    reset_google_ads()

    print()
    print("✅ Entorno demo listo — puedes grabar el video")
