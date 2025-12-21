# 🎵 Qui écoute ça ?

**Qui écoute ça ?** est une application web interactive conçue pour animer vos soirées entre amis. Le concept est simple : tout le monde soumet ses pépites musicales (ou ses plaisirs coupables) et l'assemblée doit deviner quel ami se cache derrière chaque morceau.

## 🚀 Concept du Jeu

1.  **Le Plateau (Admin) :** Un utilisateur crée une partie et affiche l'écran principal (idéalement sur une TV ou un ordinateur). Un QR Code et un code de plateau unique sont générés.
2.  **Les Candidats (Joueurs) :** Les amis rejoignent la partie via leur smartphone. Ils soumettent des liens YouTube de musiques qu'ils aiment (ou pas !).
3.  **L'Émission :** Le présentateur lance la partie. Les musiques sont diffusées aléatoirement.
4.  **Le Vote :** Les joueurs ont un temps limité pour désigner le "coupable" sur leur téléphone.
5.  **La Révélation :** Une fois le temps écoulé ou tous les votes enregistrés, l'identité du candidat est révélée avec les statistiques de vote !

## ✨ Fonctionnalités Clés

-   **📱 Interface Mobile-First :** Design optimisé pour un usage vertical sur smartphone, avec des boutons larges et une navigation intuitive.
-   **⏱️ Timer Personnalisable :** L'administrateur peut régler le temps de vote (en secondes) pour ajuster la difficulté et le rythme.
-   **🎥 Intégration YouTube :** Récupération automatique des titres de vidéos et support des timecodes (commencer la musique à un moment précis).
-   **🔍 Révélation Automatique :** Le jeu gère lui-même la fin des manches dès que tout le monde a voté ou que le chrono arrive à zéro.
-   **🎨 Esthétique "Show TV" :** Une charte graphique vibrante inspirée des jeux télévisés, avec des animations fluides et un feedback visuel constant.

## 🛠️ Détails Techniques

-   **Framework :** React 19 (ESM)
-   **Style :** Tailwind CSS avec une police moderne (Plus Jakarta Sans).
-   **Synchronisation :** Utilisation intelligente du `localStorage` et des `StorageEvents` pour simuler une expérience multi-écrans en local (ou via partage d'écran).
-   **API Tierces :** 
    -   `noembed.com` pour récupérer les titres YouTube sans clé API.
    -   `api.qrserver.com` pour la génération dynamique du QR Code de partage.

## 🎮 Comment Jouer ?

### Côté Présentateur
1. Cliquez sur **PRÉSENTATEUR**.
2. Ajustez le **Temps de vote** selon vos envies.
3. Attendez que tous vos amis aient rejoint et envoyé au moins une musique.
4. Cliquez sur **LANCER L'ÉMISSION**.

### Côté Joueur
1. Saisissez votre **NOM** et le **CODE PLATEAU**.
2. Collez un lien YouTube (ex: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`).
3. Optionnel : Précisez un **TIMECODE** en secondes pour démarrer la musique au meilleur moment.
4. Cliquez sur **ENVOYER**.
5. Pendant la partie, votre téléphone se transforme en manette de vote !

---

## Démarrer le serveur

1. Installer les dépendances :

```bash
npm install
```
2. Lancez le build :

```bash
npm run build
```

2. Lancer le serveur WebSocket :

```bash
npm run start:ws
```