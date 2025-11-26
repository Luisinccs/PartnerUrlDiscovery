// 2025-11-23

import { Actor } from 'apify';
import { PlaywrightCrawler, RequestQueue } from 'crawlee';
import { URL } from 'url';

// Palabras clave que el Actor usará para buscar programas de afiliados en Google
// Se añadirán a las palabras clave de nicho definidas por el usuario.
const GOOGLE_SEARCH_KEYWORDS = [' "affiliate program"', ' "partner program"'];

await Actor.main(async () => {

    // #region Variables
    ///<summary>Almacenamiento clave-valor para la configuracion y estado</summary>
    const _input = await Actor.getInput();

    // Obtenemos las palabras clave de nicho del usuario desde el input. Por ejemplo: ['CRM software', 'Email marketing']
    ///<summary>Lista de terminos de nicho proporcionados por el usuario</summary>
    const _nicheTerms = _input?.nicheTerms || [];

    ///<summary>La cola para gestionar las URLs pendientes</summary>
    const _requestQueue = await RequestQueue.open();
    // #endregion Variables

    // #region Funciones Internas

    ///<summary>Construye la URL de busqueda de Google para el termino dado</summary>
    const buildGoogleSearchUrl = (nicheTerm, searchKeyword) => {
        // Codificamos la cadena de busqueda para la URL
        const query = encodeURIComponent(`${nicheTerm}${searchKeyword}`);
        return `https://www.google.com/search?q=${query}&num=50`; // Pedimos hasta 50 resultados por SERP
    };

    ///<summary>Funcion que procesa cada pagina rastreada (SERP de Google)</summary>
    const requestHandler = async ({ page, request, enqueueLinks }) => {
        // Si es una URL candidata, la guardamos y terminamos
        if (request.userData.isCandidateUrl) {
            await Actor.pushData({ url: request.url });
            return;
        }

        // Solo necesitamos que la pagina sea la SERP de Google para extraer enlaces
        if (request.url.includes('google.com/search')) {

            // Selector CSS para los enlaces de resultados organicos de Google
            // (Esta es una de las estructuras CSS mas comunes de Google)
            await page.waitForSelector('div#search');

            await enqueueLinks({
                // Selector que apunta a los enlaces dentro de los resultados de busqueda organicos
                selector: 'div#search a[href]:not([class])',
                // Usaremos PlaywrightCrawler.enqueueLinks, que funciona bien con Playwright
                requestQueue: _requestQueue,
                // Funcion de filtro para guardar solo las URLs que queremos (sitios web externos)
                transformRequestFunction: (req) => {
                    const url = req.url.toLowerCase();
                    // Filtramos URLs que son de Google o que son enlaces de imagenes/noticias
                    if (url.includes('google.com') || url.includes('youtube.com') || url.includes('apify.com')) {
                        return false;
                    }
                    // Marcamos la URL como candidata para el siguiente paso (Dataset)
                    req.userData.isCandidateUrl = true;
                    return req;
                }
            });
        }
    };

    // #endregion Funciones Internas

    // #region Logica Principal

    if (_nicheTerms.length === 0) {
        console.log('WARN: No se proporcionaron terminos de nicho. El Actor terminara.');
        return;
    }

    // 1. Añadir URLs de búsqueda de Google a la cola
    for (const term of _nicheTerms) {
        for (const keyword of GOOGLE_SEARCH_KEYWORDS) {
            const searchUrl = buildGoogleSearchUrl(term, keyword);
            await _requestQueue.addRequest({ url: searchUrl });
        }
    }

    // 2. Creamos y configuramos el rastreador
    const crawler = new PlaywrightCrawler({
        requestQueue: _requestQueue,
        requestHandler: requestHandler,
        ///<summary>Configuracion de Proxy para evitar bloqueos de Google</summary>
        proxyConfiguration: await Actor.createProxyConfiguration({
            // Usaremos un grupo de proxies que son muy buenos para Google
            // Si tienes una cuenta de Apify, usa 'RESIDENTIAL' para la máxima fiabilidad.
            // Para la prueba inicial, 'APIFY' suele funcionar.
            groups: ['AUTO'],
            // Si esto falla, debes cambiar a 'RESIDENTIAL' en Apify Console para tu Actor.
        }),
        launchContext: {
            // Configuracion para emular un navegador comun y evitar deteccion de bot
            launchOptions: {
                headless: true,
                args: ['--disable-web-security', '--no-sandbox']
            }
        },
        // El PlaywrightCrawler es mas lento que CheerioCrawler; reducimos las peticiones
        maxRequestsPerCrawl: 50
    });

    // 3. Ejecutamos el rastreador
    await crawler.run();

    // #endregion Logica Principal

    // 4. Finalización
    console.log('Proceso de descubrimiento finalizado.');

});