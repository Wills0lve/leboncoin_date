# Leboncoin — Date de publication des annonces

Userscript pour **Tampermonkey, Violentmonkey et Greasemonkey** permettant de réafficher la **date et l'heure de première publication des annonces Leboncoin**.

Leboncoin n'affichant plus systématiquement cette information dans son interface, le script récupère le champ `first_publication_date` lorsqu'il est présent dans les données chargées par le site.

## Fonctionnalités

- Affiche la date de première publication sur les pages de recherche.
- Affiche la date sur la page individuelle d'une annonce.
- Fonctionne avec la navigation interne de Leboncoin sans nécessiter de rechargement manuel.
- Fonctionne avec le chargement dynamique des annonces lors du défilement.
- Détecte les annonces chargées dynamiquement.
- Conserve temporairement les dates déjà récupérées.
- Affiche des formats lisibles :
  - `📅 Publié aujourd’hui à 09:15`
  - `📅 Publié hier à 09:15`
  - `📅 Publié le 24/09/2026 à 18:01`
- Ne nécessite aucun serveur externe.
- N'envoie aucune donnée vers un service tiers.
- Fonctionne directement dans le navigateur.

## Installation

### Tampermonkey

1. Installez [Tampermonkey](https://www.tampermonkey.net/).
2. Ouvrez le fichier `leboncoin-date-publication.user.js`.
3. Copiez son contenu.
4. Dans Tampermonkey, créez un nouveau script.
5. Remplacez le contenu par celui du fichier `.user.js`.
6. Enregistrez le script.
7. Ouvrez ou actualisez Leboncoin.

### Violentmonkey

1. Installez [Violentmonkey](https://violentmonkey.github.io/).
2. Créez un nouveau script.
3. Copiez le contenu du fichier `.user.js`.
4. Enregistrez.
5. Rendez-vous sur Leboncoin.

### Greasemonkey

Le script peut également être utilisé avec Greasemonkey.

Créez un nouveau script utilisateur et copiez-y le contenu du fichier :

```text
leboncoin-date-publication.user.js
