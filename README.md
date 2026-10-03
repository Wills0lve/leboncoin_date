Leboncoin — Date de publication des annonces

Userscript Tampermonkey / Greasemonkey / Violentmonkey permettant de réafficher la date et l'heure de première publication des annonces Leboncoin.

Leboncoin n'affichant plus systématiquement cette information dans l'interface, ce script récupère first_publication_date lorsque cette donnée est présente dans les données chargées par le site.

✨ Fonctionnalités

Affiche la date de première publication sur les listes de recherche.

Affiche également la date sur la page d'une annonce.

Fonctionne avec la navigation interne de Leboncoin sans nécessiter de rechargement manuel.

Fonctionne avec le chargement dynamique des annonces lors du défilement.

Conserve temporairement les dates déjà récupérées.

Affiche des formats lisibles :

📅 Publié aujourd’hui à 09:15

📅 Publié hier à 09:15

📅 Publié le 24/09/2026 à 18:01

Aucun compte ou service externe n'est nécessaire.

Aucun suivi utilisateur n'est intégré au script.

🔒 Sécurité

Le script a été conçu pour limiter les risques liés au traitement des données provenant du site.

En particulier :

les données réseau ne sont jamais exécutées comme du JavaScript ;

aucune donnée distante n'est injectée avec innerHTML ;

les dates sont validées avant utilisation ;

les identifiants d'annonce sont validés ;

les réponses réseau trop volumineuses sont ignorées ;

le nombre de données traitées est limité ;

aucun eval() ou new Function() n'est utilisé ;

le script utilise @grant none ;

aucune donnée personnelle n'est envoyée vers un serveur tiers.

Le script intercepte uniquement les réponses fetch/XHR nécessaires à la récupération des données déjà chargées par Leboncoin.

📦 Installation
Tampermonkey

Installer Tampermonkey.

Ouvrir le fichier leboncoin-date-publication.user.js.

Copier son contenu.

Dans Tampermonkey, créer un nouveau script.

Remplacer le contenu par celui du projet.

Enregistrer.

Ouvrir ou actualiser Leboncoin.

Greasemonkey

Le script peut également être installé avec Greasemonkey en créant un nouveau script utilisateur puis en y copiant le fichier .user.js.

Violentmonkey

Même principe : créer un nouveau script et importer/copier le fichier .user.js.

🧪 Mode DEBUG

Le script dispose d'une API de diagnostic accessible depuis la console du navigateur.

Afficher les dates récupérées
__LBC_DATE_V8__.dump()


Cela affiche un tableau contenant notamment :

list_id
first_publication_date
formatted

Afficher l'état du script
__LBC_DATE_V8__.status()

Forcer une analyse
__LBC_DATE_V8__.scan()

Afficher le nombre de dates connues
__LBC_DATE_V8__.count()

Effacer le cache
__LBC_DATE_V8__.clear()

🛠️ Fonctionnement

Le site Leboncoin charge certaines informations des annonces dans les données utilisées par son application.

Lorsque le champ suivant est disponible :

first_publication_date


le script l'associe à :

list_id


Il peut alors afficher la date correspondante sur l'annonce.

Le script fonctionne donc sans appeler une API publique externe et sans envoyer les données vers un serveur tiers.

⚠️ Compatibilité

Leboncoin peut modifier à tout moment :

son HTML ;

ses composants React/Next.js ;

ses URLs ;

ses structures JSON ;

ses requêtes réseau ;

les noms de certains champs.

Une modification du site peut donc temporairement empêcher le script de fonctionner.

Si cela arrive, merci d'ouvrir une issue avec :

la version du script ;

le navigateur utilisé ;

Tampermonkey/Greasemonkey/Violentmonkey et sa version ;

l'URL concernée ;

les éventuelles erreurs de la console ;

le résultat de :

__LBC_DATE_V8__.status()


et, si possible :

__LBC_DATE_V8__.dump()

📄 Licence

Projet distribué sous licence MIT.

⚖️ Avertissement

Ce projet est un userscript indépendant et n'est pas affilié à, maintenu ou approuvé par Leboncoin.

Leboncoin est une marque appartenant à ses propriétaires respectifs.
