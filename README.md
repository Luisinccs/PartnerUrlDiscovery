# 🔍 PartnerUrlDiscovery

Este es el **Actor de Descubrimiento** dentro de la solución completa "Affiliate Partner Solution".

Su principal propósito es automatizar la fase de investigación, identificando y recolectando proactivamente URLs de sitios web que probablemente tengan programas de afiliados o socios, basándose en búsquedas por palabras clave de nicho.

## 🎯 Rol en la Solución (Pipeline)

Este Actor es la **primera fase** de un pipeline de dos pasos:

1.  **PartnerUrlDiscovery (Este Actor):** Toma palabras clave de nicho (ej: "CRM software") y devuelve una lista de URLs candidatas.
2.  **AffiliatePartnerFinder (Segundo Actor):** Toma la lista de URLs de este Actor y las analiza en profundidad para extraer correos electrónicos de contacto y enlaces directos al programa.

## 🛠️ Tecnología

* **Framework:** Crawlee / Apify SDK
* **Crawler:** PlaywrightCrawler (Necesario para simular la interacción del navegador y evitar bloqueos en motores de búsqueda).
* **Lenguaje:** TypeScript / JavaScript.