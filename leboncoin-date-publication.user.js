// ==UserScript==
// @name         Leboncoin - Date de publication V8
// @namespace    https://github.com/
// @version      8.0.0
// @description  Affiche la date de première publication des annonces Leboncoin 
// @match        https://www.leboncoin.fr/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';


    // ============================================================
    // CONFIGURATION
    // ============================================================

    const DEBUG = false;

    const VERSION = '8.0.0';

    const DATE_CLASS =
        'lbc-publication-date-v8';

    const STORAGE_KEY =
        'lbc-first-publication-dates-v8';


    /*
     * Limites de sécurité.
     */

    const MAX_NETWORK_TEXT =
        2 * 1024 * 1024; // 2 Mo

    const MAX_SCRIPT_TEXT =
        4 * 1024 * 1024; // 4 Mo

    const MAX_MATCHES_PER_TEXT =
        500;

    const MAX_CACHE_ENTRIES =
        5000;

    const MAX_CACHE_SIZE =
        512 * 1024; // 512 Ko

    const MAX_DOM_CARDS_PER_PASS =
        500;


    // ============================================================
    // DEBUG
    // ============================================================

    function debug(...args) {

        if (DEBUG) {

            console.log(
                '[LBC DATE V8]',
                ...args
            );
        }
    }


    // ============================================================
    // CACHE MÉMOIRE
    // ============================================================

    const dates =
        new Map();


    let saveTimer = null;


    // ============================================================
    // VALIDATION ID
    // ============================================================

    function isValidAdId(
        value
    ) {

        if (
            typeof value !== 'string' &&
            typeof value !== 'number'
        ) {

            return false;
        }


        const id =
            String(value);


        /*
         * Les IDs Leboncoin observés sont numériques.
         *
         * Limite volontaire pour éviter des valeurs
         * absurdes / gigantesques.
         */

        return /^\d{5,15}$/.test(id);
    }


    // ============================================================
    // VALIDATION DATE
    // ============================================================

    function isValidDateString(
        value
    ) {

        if (
            typeof value !== 'string'
        ) {

            return false;
        }


        /*
         * Format attendu :
         *
         * YYYY-MM-DD HH:MM:SS
         *
         * ou
         *
         * YYYY-MM-DDTHH:MM:SS
         */

        return /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/
            .test(value);
    }


    // ============================================================
    // CHARGEMENT CACHE
    // ============================================================

    function loadCache() {

        try {

            const raw =
                sessionStorage.getItem(
                    STORAGE_KEY
                );


            if (
                !raw ||
                raw.length >
                    MAX_CACHE_SIZE
            ) {

                return;
            }


            const parsed =
                JSON.parse(raw);


            if (
                !parsed ||
                typeof parsed !== 'object' ||
                Array.isArray(parsed)
            ) {

                return;
            }


            let count = 0;


            for (
                const [id, date]
                of Object.entries(parsed)
            ) {

                if (
                    count >=
                    MAX_CACHE_ENTRIES
                ) {

                    break;
                }


                if (
                    isValidAdId(id) &&
                    isValidDateString(date)
                ) {

                    dates.set(
                        id,
                        date
                    );


                    count++;
                }
            }


            debug(
                'Cache chargé:',
                dates.size
            );

        } catch (error) {

            debug(
                'Cache invalide:',
                error
            );
        }
    }


    loadCache();


    // ============================================================
    // SAUVEGARDE CACHE
    // ============================================================

    function saveCache() {

        if (saveTimer) {
            return;
        }


        saveTimer =
            setTimeout(
                () => {

                    saveTimer = null;


                    try {

                        /*
                         * On limite le nombre d'entrées.
                         */

                        while (
                            dates.size >
                            MAX_CACHE_ENTRIES
                        ) {

                            const first =
                                dates.keys().next().value;


                            if (
                                first ===
                                undefined
                            ) {

                                break;
                            }


                            dates.delete(first);
                        }


                        const object =
                            Object.fromEntries(
                                dates
                            );


                        const serialized =
                            JSON.stringify(
                                object
                            );


                        /*
                         * Protection supplémentaire
                         * contre un cache trop volumineux.
                         */

                        if (
                            serialized.length >
                            MAX_CACHE_SIZE
                        ) {

                            debug(
                                'Cache trop volumineux, sauvegarde ignorée'
                            );


                            return;
                        }


                        sessionStorage.setItem(
                            STORAGE_KEY,
                            serialized
                        );

                    } catch (error) {

                        debug(
                            'Erreur sauvegarde cache:',
                            error
                        );
                    }

                },
                500
            );
    }


    // ============================================================
    // STOCKAGE DATE
    // ============================================================

    function storeDate(
        id,
        date
    ) {

        if (
            !isValidAdId(id)
        ) {

            return false;
        }


        if (
            !isValidDateString(date)
        ) {

            return false;
        }


        id =
            String(id);


        const previous =
            dates.get(id);


        /*
         * Ne rien faire si la donnée
         * n'a pas changé.
         */

        if (
            previous === date
        ) {

            return false;
        }


        dates.set(
            id,
            date
        );


        debug(
            'Date:',
            id,
            date
        );


        saveCache();


        scheduleUpdate();


        return true;
    }


    // ============================================================
    // PARSING TEXTE
    // ============================================================

    function scanText(
        text,
        source = ''
    ) {

        if (
            typeof text !== 'string' ||
            !text
        ) {

            return 0;
        }


        /*
         * Protection contre les réponses
         * gigantesques.
         */

        if (
            text.length >
            MAX_NETWORK_TEXT
        ) {

            debug(
                'Réponse ignorée car trop grande:',
                text.length,
                source
            );


            return 0;
        }


        let found = 0;


        /*
         * --------------------------------------------------------
         * list_id -> first_publication_date
         * --------------------------------------------------------
         */

        const regex1 =
            /["']?list_id["']?\s*[:=]\s*["']?(\d{5,15})["']?[\s\S]{0,500}?"first_publication_date"\s*[:=]\s*["']?(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?)/gi;


        let match;


        while (
            found <
            MAX_MATCHES_PER_TEXT &&
            (match =
                regex1.exec(text))
        ) {

            if (
                storeDate(
                    match[1],
                    match[2]
                )
            ) {

                found++;
            }
        }


        /*
         * --------------------------------------------------------
         * first_publication_date -> list_id
         * --------------------------------------------------------
         */

        if (
            found <
            MAX_MATCHES_PER_TEXT
        ) {

            const regex2 =
                /"first_publication_date"\s*[:=]\s*["']?(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?)["']?[\s\S]{0,500}?"list_id"\s*[:=]\s*["']?(\d{5,15})/gi;


            while (
                found <
                MAX_MATCHES_PER_TEXT &&
                (match =
                    regex2.exec(text))
            ) {

                if (
                    storeDate(
                        match[2],
                        match[1]
                    )
                ) {

                    found++;
                }
            }
        }


        if (
            found
        ) {

            debug(
                'Extraction:',
                source,
                found
            );
        }


        return found;
    }


    // ============================================================
    // PARSING OBJET
    // ============================================================

    function scanObject(
        object,
        depth = 0
    ) {

        /*
         * Protection contre les objets
         * volontairement ou accidentellement
         * extrêmement profonds.
         */

        if (
            depth > 40
        ) {

            return;
        }


        if (
            !object ||
            typeof object !== 'object'
        ) {

            return;
        }


        /*
         * Structure principale.
         */

        if (

            Object.prototype.hasOwnProperty.call(
                object,
                'list_id'
            ) &&

            Object.prototype.hasOwnProperty.call(
                object,
                'first_publication_date'
            )

        ) {

            storeDate(
                object.list_id,
                object.first_publication_date
            );
        }


        /*
         * Variante éventuelle.
         */

        if (

            Object.prototype.hasOwnProperty.call(
                object,
                'listId'
            ) &&

            Object.prototype.hasOwnProperty.call(
                object,
                'firstPublicationDate'
            )

        ) {

            storeDate(
                object.listId,
                object.firstPublicationDate
            );
        }


        /*
         * Tableau.
         */

        if (
            Array.isArray(object)
        ) {

            /*
             * Limitation du nombre d'éléments
             * parcourus dans un tableau.
             */

            const length =
                Math.min(
                    object.length,
                    MAX_CACHE_ENTRIES
                );


            for (
                let i = 0;
                i < length;
                i++
            ) {

                scanObject(
                    object[i],
                    depth + 1
                );
            }


            return;
        }


        /*
         * Objet.
         */

        let processed = 0;


        for (
            const value
            of Object.values(object)
        ) {

            if (
                processed >=
                MAX_CACHE_ENTRIES
            ) {

                break;
            }


            if (
                value &&
                typeof value ===
                    'object'
            ) {

                scanObject(
                    value,
                    depth + 1
                );


                processed++;
            }
        }
    }


    // ============================================================
    // SCAN SCRIPT
    // ============================================================

    function scanScript(
        script
    ) {

        if (!script) {
            return;
        }


        const text =
            script.textContent || '';


        if (
            !text ||
            text.length >
            MAX_SCRIPT_TEXT
        ) {

            return;
        }


        scanText(
            text,
            `script:${script.id || 'anonymous'}`
        );


        /*
         * JSON pur.
         */

        const trimmed =
            text.trim();


        if (
            trimmed[0] !== '{' &&
            trimmed[0] !== '['
        ) {

            return;
        }


        try {

            const parsed =
                JSON.parse(
                    trimmed
                );


            scanObject(
                parsed
            );

        } catch (_) {

            /*
             * Ce n'est pas nécessairement du JSON.
             * Aucun problème.
             */
        }
    }


    // ============================================================
    // SCAN SCRIPTS
    // ============================================================

    function scanAllScripts() {

        const scripts =
            document.querySelectorAll(
                'script'
            );


        for (
            const script
            of scripts
        ) {

            scanScript(
                script
            );
        }
    }


    // ============================================================
    // HOOK FETCH
    // ============================================================
    //
    // Le code injecté est CONSTANT.
    //
    // Aucune donnée réseau n'est concaténée
    // dans ce JavaScript.
    //
    // ============================================================

    function installFetchHook() {

        const code = `

(() => {

    if (
        window.__LBC_V8_FETCH_HOOK__
    ) {
        return;
    }


    window.__LBC_V8_FETCH_HOOK__ =
        true;


    const originalFetch =
        window.fetch;


    if (
        typeof originalFetch !==
        'function'
    ) {

        return;
    }


    window.fetch =
        async function (...args) {

            const response =
                await originalFetch.apply(
                    this,
                    args
                );


            try {

                /*
                 * Ne lire que les réponses
                 * potentiellement JSON.
                 */

                const contentType =
                    response.headers.get(
                        'content-type'
                    ) || '';


                if (
                    !contentType.includes(
                        'json'
                    ) &&
                    !contentType.includes(
                        'text'
                    )
                ) {

                    return response;
                }


                const clone =
                    response.clone();


                clone
                    .text()
                    .then(text => {

                        /*
                         * Ne transmettre que les
                         * réponses raisonnables.
                         */

                        if (
                            typeof text !==
                            'string' ||
                            text.length >
                            ${MAX_NETWORK_TEXT}
                        ) {

                            return;
                        }


                        window.dispatchEvent(
                            new CustomEvent(
                                '__LBC_V8_RESPONSE__',
                                {
                                    detail: {
                                        text
                                    }
                                }
                            )
                        );

                    })
                    .catch(() => {});


            } catch (_) {}


            return response;
        };

})();

`;


        injectPageScript(
            code
        );
    }


    // ============================================================
    // HOOK XHR
    // ============================================================

    function installXHRHook() {

        const code = `

(() => {

    if (
        window.__LBC_V8_XHR_HOOK__
    ) {
        return;
    }


    window.__LBC_V8_XHR_HOOK__ =
        true;


    const originalOpen =
        XMLHttpRequest.prototype.open;


    const originalSend =
        XMLHttpRequest.prototype.send;


    XMLHttpRequest.prototype.open =
        function (
            method,
            url,
            ...rest
        ) {

            this.__LBC_V8_URL =
                String(
                    url || ''
                );


            return originalOpen.call(
                this,
                method,
                url,
                ...rest
            );
        };


    XMLHttpRequest.prototype.send =
        function (...args) {

            this.addEventListener(
                'load',
                function () {

                    try {

                        const text =
                            this.responseText;


                        if (
                            typeof text !==
                            'string' ||
                            text.length >
                            ${MAX_NETWORK_TEXT}
                        ) {

                            return;
                        }


                        window.dispatchEvent(
                            new CustomEvent(
                                '__LBC_V8_RESPONSE__',
                                {
                                    detail: {
                                        text
                                    }
                                }
                            )
                        );

                    } catch (_) {}

                }
            );


            return originalSend.apply(
                this,
                args
            );
        };

})();

`;


        injectPageScript(
            code
        );
    }


    // ============================================================
    // INJECTION SCRIPT PAGE
    // ============================================================

    function injectPageScript(
        code
    ) {

        /*
         * Sécurité :
         *
         * `code` est toujours une constante définie
         * dans ce script.
         *
         * Aucune donnée provenant de Leboncoin
         * n'est incorporée dans `code`.
         */

        const script =
            document.createElement(
                'script'
            );


        script.textContent =
            code;


        const root =
            document.documentElement;


        if (!root) {

            return;
        }


        root.appendChild(
            script
        );


        script.remove();
    }


    // ============================================================
    // RÉCEPTION RÉSEAU
    // ============================================================

    window.addEventListener(
        '__LBC_V8_RESPONSE__',
        function (event) {

            try {

                const detail =
                    event.detail;


                if (
                    !detail ||
                    typeof detail.text !==
                        'string'
                ) {

                    return;
                }


                const text =
                    detail.text;


                if (
                    text.length >
                    MAX_NETWORK_TEXT
                ) {

                    return;
                }


                scanText(
                    text,
                    'network'
                );


                /*
                 * Deuxième passage JSON.
                 */

                try {

                    const parsed =
                        JSON.parse(
                            text
                        );


                    scanObject(
                        parsed
                    );

                } catch (_) {}

            } catch (error) {

                debug(
                    'Erreur réponse réseau',
                    error
                );
            }
        }
    );


    // ============================================================
    // DATE
    // ============================================================

    function parseDate(
        value
    ) {

        if (
            !isValidDateString(value)
        ) {

            return null;
        }


        const match =
            String(value).match(
                /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
            );


        if (!match) {
            return null;
        }


        const year =
            Number(match[1]);


        const month =
            Number(match[2]) - 1;


        const day =
            Number(match[3]);


        const hour =
            Number(match[4]);


        const minute =
            Number(match[5]);


        const second =
            Number(match[6] || 0);


        /*
         * Validation calendaire.
         */

        const date =
            new Date(
                year,
                month,
                day,
                hour,
                minute,
                second
            );


        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month ||
            date.getDate() !== day ||
            date.getHours() !== hour ||
            date.getMinutes() !== minute ||
            date.getSeconds() !== second
        ) {

            return null;
        }


        return date;
    }


    function formatDate(
        value
    ) {

        const date =
            parseDate(value);


        if (!date) {
            return null;
        }


        const now =
            new Date();


        if (

            date.getFullYear() ===
                now.getFullYear() &&

            date.getMonth() ===
                now.getMonth() &&

            date.getDate() ===
                now.getDate()

        ) {

            return (
                'Publié aujourd’hui à ' +
                date.toLocaleTimeString(
                    'fr-FR',
                    {
                        hour: '2-digit',
                        minute: '2-digit'
                    }
                )
            );
        }


        const yesterday =
            new Date(now);


        yesterday.setDate(
            yesterday.getDate() - 1
        );


        if (

            date.getFullYear() ===
                yesterday.getFullYear() &&

            date.getMonth() ===
                yesterday.getMonth() &&

            date.getDate() ===
                yesterday.getDate()

        ) {

            return (
                'Publié hier à ' +
                date.toLocaleTimeString(
                    'fr-FR',
                    {
                        hour: '2-digit',
                        minute: '2-digit'
                    }
                )
            );
        }


        return (
            'Publié le ' +

            date.toLocaleDateString(
                'fr-FR',
                {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }
            ) +

            ' à ' +

            date.toLocaleTimeString(
                'fr-FR',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            )
        );
    }


    // ============================================================
    // ID ANNONCE
    // ============================================================

    function getAdId(
        link
    ) {

        if (!link) {
            return null;
        }


        const href =
            link.getAttribute(
                'href'
            );


        if (
            typeof href !==
            'string'
        ) {

            return null;
        }


        /*
         * On accepte uniquement le chemin
         * d'une annonce Leboncoin.
         */

        const match =
            href.match(
                /^\/ad\/[^/?#]+\/(\d+)(?:[/?#]|$)/
            );


        if (!match) {

            const fallback =
                href.match(
                    /^\/ad\/(\d+)(?:[/?#]|$)/
                );


            return fallback
                ? fallback[1]
                : null;
        }


        return match[1];
    }


    // ============================================================
    // CARTE
    // ============================================================

    function findCard(
        link
    ) {

        const article =
            link.closest(
                'article'
            );


        if (article) {
            return article;
        }


        let element =
            link;


        for (
            let i = 0;
            i < 8;
            i++
        ) {

            element =
                element.parentElement;


            if (!element) {
                return null;
            }


            const links =
                element.querySelectorAll(
                    'a[href*="/ad/"]'
                );


            if (
                links.length === 1
            ) {

                return element;
            }
        }


        return null;
    }


    // ============================================================
    // AFFICHAGE
    // ============================================================

    function addDateToCard(
        card,
        id
    ) {

        if (
            !card ||
            !isValidAdId(id)
        ) {

            return;
        }


        const rawDate =
            dates.get(
                String(id)
            );


        if (!rawDate) {
            return;
        }


        const formatted =
            formatDate(rawDate);


        if (!formatted) {
            return;
        }


        let element =
            card.querySelector(
                `.${DATE_CLASS}`
            );


        if (element) {

            /*
             * textContent uniquement.
             *
             * Aucune interprétation HTML.
             */

            element.textContent =
                `📅 ${formatted}`;


            return;
        }


        element =
            document.createElement(
                'div'
            );


        element.className =
            DATE_CLASS;


        element.dataset.lbcId =
            String(id);


        /*
         * IMPORTANT :
         * textContent et non innerHTML.
         */

        element.textContent =
            `📅 ${formatted}`;


        element.title =
            `Première publication : ${rawDate}`;


        const price =
            card.querySelector(
                '[data-test-id*="price"],' +
                '[data-qa-id*="price"]'
            );


        if (
            price &&
            price.parentElement
        ) {

            price.parentElement.appendChild(
                element
            );

        } else {

            card.appendChild(
                element
            );
        }
    }


    // ============================================================
    // CARTES
    // ============================================================

    function processCards() {

        const links =
            document.querySelectorAll(
                'a[href*="/ad/"]'
            );


        const limit =
            Math.min(
                links.length,
                MAX_DOM_CARDS_PER_PASS
            );


        let displayed = 0;


        for (
            let i = 0;
            i < limit;
            i++
        ) {

            const link =
                links[i];


            const id =
                getAdId(link);


            if (!id) {
                continue;
            }


            if (
                !dates.has(id)
            ) {

                continue;
            }


            const card =
                findCard(link);


            if (!card) {
                continue;
            }


            addDateToCard(
                card,
                id
            );


            displayed++;
        }


        debug(
            'Cartes:',
            links.length,
            'affichées:',
            displayed,
            'dates:',
            dates.size
        );
    }


    // ============================================================
    // PAGE ANNONCE
    // ============================================================

    function processAdPage() {

        const match =
            location.pathname.match(
                /^\/ad\/[^/]+\/(\d+)/
            );


        if (!match) {
            return;
        }


        const id =
            match[1];


        if (
            !isValidAdId(id)
        ) {

            return;
        }


        const rawDate =
            dates.get(id);


        if (!rawDate) {
            return;
        }


        const formatted =
            formatDate(rawDate);


        if (!formatted) {
            return;
        }


        let element =
            document.querySelector(
                `.${DATE_CLASS}[data-lbc-id="${id}"]`
            );


        if (element) {

            element.textContent =
                `📅 ${formatted}`;


            return;
        }


        element =
            document.createElement(
                'div'
            );


        element.className =
            DATE_CLASS;


        element.dataset.lbcId =
            id;


        element.textContent =
            `📅 ${formatted}`;


        element.title =
            `Première publication : ${rawDate}`;


        const price =
            document.querySelector(
                '[data-qa-id*="price"],' +
                '[data-test-id*="price"],' +
                '[data-testid*="price"]'
            );


        if (
            price &&
            price.parentElement
        ) {

            price.parentElement.appendChild(
                element
            );
        }
    }


    // ============================================================
    // CSS
    // ============================================================

    function injectStyle() {

        if (
            document.getElementById(
                'lbc-date-v8-style'
            )
        ) {

            return;
        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'lbc-date-v8-style';


        /*
         * CSS statique.
         * Aucune donnée externe.
         */

        style.textContent = `

            .${DATE_CLASS} {

                display: block !important;

                color: #666 !important;

                font-size: 13px !important;

                line-height: 1.4 !important;

                margin-top: 5px !important;

                font-weight: 500 !important;

                visibility: visible !important;

                opacity: 1 !important;

                position: relative !important;

                z-index: 10 !important;
            }

        `;


        (
            document.head ||
            document.documentElement
        ).appendChild(
            style
        );
    }


    // ============================================================
    // UPDATE
    // ============================================================

    let updateTimer = null;


    function scheduleUpdate() {

        if (updateTimer) {
            return;
        }


        updateTimer =
            setTimeout(
                () => {

                    updateTimer = null;


                    injectStyle();


                    scanAllScripts();


                    if (
                        location.pathname
                            .startsWith(
                                '/recherche'
                            )
                    ) {

                        processCards();
                    }


                    if (
                        location.pathname
                            .startsWith(
                                '/ad/'
                            )
                    ) {

                        processAdPage();
                    }

                },
                100
            );
    }


    // ============================================================
    // MUTATION OBSERVER
    // ============================================================

    function startObserver() {

        if (!document.body) {

            setTimeout(
                startObserver,
                50
            );


            return;
        }


        const observer =
            new MutationObserver(
                mutations => {

                    /*
                     * On ne rescane pas immédiatement chaque
                     * mutation : scheduleUpdate() regroupe
                     * les changements.
                     */

                    if (
                        mutations.some(
                            mutation =>
                                mutation.addedNodes.length ||
                                mutation.removedNodes.length
                        )
                    ) {

                        scheduleUpdate();
                    }
                }
            );


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }


    // ============================================================
    // SCROLL
    // ============================================================

    let scrollTimer = null;


    window.addEventListener(
        'scroll',
        () => {

            if (scrollTimer) {
                return;
            }


            scrollTimer =
                setTimeout(
                    () => {

                        scrollTimer = null;


                        processCards();

                    },
                    150
                );

        },
        {
            passive: true
        }
    );


    // ============================================================
    // NAVIGATION SPA
    // ============================================================

    let lastUrl =
        location.href;


    function checkNavigation() {

        const current =
            location.href;


        if (
            current === lastUrl
        ) {

            return;
        }


        lastUrl =
            current;


        debug(
            'Navigation:',
            current
        );


        const delays = [
            0,
            100,
            300,
            600,
            1000,
            1500,
            2500
        ];


        for (
            const delay
            of delays
        ) {

            setTimeout(
                scheduleUpdate,
                delay
            );
        }
    }


    const originalPushState =
        history.pushState;


    history.pushState =
        function (...args) {

            const result =
                originalPushState.apply(
                    this,
                    args
                );


            setTimeout(
                checkNavigation,
                0
            );


            return result;
        };


    const originalReplaceState =
        history.replaceState;


    history.replaceState =
        function (...args) {

            const result =
                originalReplaceState.apply(
                    this,
                    args
                );


            setTimeout(
                checkNavigation,
                0
            );


            return result;
        };


    window.addEventListener(
        'popstate',
        () => {

            setTimeout(
                checkNavigation,
                0
            );

        }
    );


    setInterval(
        checkNavigation,
        500
    );


    // ============================================================
    // API DEBUG
    // ============================================================

    window.__LBC_DATE_V8__ = Object.freeze({

        count() {

            return dates.size;
        },


        dump() {

            console.table(
                [...dates.entries()]
                    .map(
                        ([id, date]) => ({

                            list_id:
                                id,

                            first_publication_date:
                                date,

                            formatted:
                                formatDate(date)

                        })
                    )
            );
        },


        scan() {

            scanAllScripts();

            processCards();

            processAdPage();
        },


        status() {

            console.table({

                version:
                    VERSION,

                url:
                    location.href,

                dates:
                    dates.size,

                adLinks:
                    document.querySelectorAll(
                        'a[href*="/ad/"]'
                    ).length

            });
        },


        clear() {

            dates.clear();


            try {

                sessionStorage.removeItem(
                    STORAGE_KEY
                );

            } catch (_) {}


            console.log(
                '[LBC DATE V8] Cache effacé'
            );
        }

    });


    // ============================================================
    // DÉMARRAGE
    // ============================================================

    function start() {

        debug(
            'V8 démarrage'
        );


        /*
         * Hooks installés très tôt.
         */

        installFetchHook();

        installXHRHook();


        injectStyle();


        /*
         * Premier scan.
         */

        scanAllScripts();


        scheduleUpdate();


        /*
         * Rendus différés de Next/React.
         */

        [
            100,
            300,
            700,
            1500,
            3000
        ].forEach(
            delay => {

                setTimeout(
                    scheduleUpdate,
                    delay
                );
            }
        );


        startObserver();


        debug(
            'V8 prête'
        );
    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            start,
            {
                once: true
            }
        );

    } else {

        start();
    }

})();
