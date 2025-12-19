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

*Développé avec passion pour des soirées mémorables.*

## Démarrer le serveur WebSocket localement

Pour exécuter un serveur WebSocket local simple (utilisé pour synchroniser plusieurs écrans en local) :

1. Installez les dépendances si ce n'est pas déjà fait :

```bash
npm install
```

2. Lancez le serveur WebSocket :

```bash
npm run start:ws
```

Le serveur écoute par défaut sur le port `3001`.

## Déploiement sur Windows (WAMP) avec nom de domaine

Si votre serveur est une machine Windows avec WAMP (Apache) et que vous souhaitez héberger l'app et le serveur WebSocket :

Prérequis sur le serveur Windows
- Git
- Node.js (>= 18)
- WAMP (Apache + PHP) installé et fonctionnel
- Un utilitaire pour gérer le service Node (ex: NSSM) ou `pm2-windows-service`
- Un client ACME pour Windows pour obtenir des certificats (ex: win-acme)

Étapes (exécuter en tant qu'administrateur quand nécessaire)

1) Récupérer le code depuis GitHub et installer

```powershell
cd C:\path\to\www
git clone https://github.com/<votre-repo>.git qui-ecoute-ca
cd qui-ecoute-ca
npm ci
npm run build
```

2) Servir le frontend via Apache
- Déplacez le contenu de `dist/` vers le dossier racine de votre VirtualHost (ex: `C:\wamp64\www\qui-ecoute-ca\dist`) ou pointez le `DocumentRoot` du VirtualHost vers ce dossier.

Exemple de VirtualHost Apache (http -> ensuite on activera HTTPS):

```
<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com
    DocumentRoot "C:/wamp64/www/qui-ecoute-ca/dist"

    <Directory "C:/wamp64/www/qui-ecoute-ca/dist">
        Require all granted
        AllowOverride All
    </Directory>

    # Proxy WebSocket (/ws/) vers le serveur Node local
    ProxyRequests Off
    ProxyPreserveHost On
    RewriteEngine On

    # proxy websocket tunnel
    ProxyPass "/ws/" "http://127.0.0.1:3001/"
    ProxyPassReverse "/ws/" "http://127.0.0.1:3001/"

    ErrorLog "${APACHE_LOG_DIR}/qui-ecoute-ca-error.log"
    CustomLog "${APACHE_LOG_DIR}/qui-ecoute-ca-access.log" common
</VirtualHost>
```

Assurez-vous d'activer les modules Apache requis : `proxy`, `proxy_http`, `proxy_wstunnel`, `rewrite`.

3) Obtenir un certificat TLS (win-acme)
- Téléchargez et lancez win-acme et suivez la procédure pour générer et installer un certificat pour `example.com`. win-acme sait mettre à jour la configuration Apache automatiquement.

4) Lancer le serveur WebSocket Node en arrière-plan
- Option A (NSSM - recommandée pour Windows simple) :
  1. Téléchargez NSSM (https://nssm.cc/download) et extrayez.
  2. Installez un service :
     ```powershell
     nssm install QuiEcouteCaWS
     # Program: C:\Program Files\nodejs\node.exe
     # Arguments: C:\path\to\qui-ecoute-ca\server\ws-server.js
     # Start directory: C:\path\to\qui-ecoute-ca
     nssm start QuiEcouteCaWS
     ```

- Option B (`pm2` + `pm2-windows-service`): installez pm2 globalement et configurez en service.

5) Firewall
- Autorisez le trafic HTTP/HTTPS (ports 80/443) dans le pare-feu Windows. Le serveur WS n'a normalement pas besoin d'être exposé publiquement directement si vous reverse-proxy `/ws/` via Apache.

6) Config côté client
- J'ai modifié le client WS pour se connecter automatiquement à `ws[s]://<host>/ws/` en fonction du protocole. Si vous utilisez le reverse-proxy Apache vers `127.0.0.1:3001`, aucune autre modification n'est requise côté client.

Remarques
- Mode de fonctionnement conseillé : Apache sert les fichiers statiques et reverse-proxifie `/ws/` vers le serveur Node local. Le Node server reste en écoute sur `localhost:3001` et n'est pas exposé directement.
- Pour production, pensez à sécuriser et surveiller le service Node (logs, redémarrage automatique) ; `NSSM` ou `pm2` sont des solutions simples pour Windows.

Souhaitez-vous que j'ajoute dans le dépôt des fichiers `deploy/windows/nssm-instructions.txt` et un exemple `apache-vhost.conf` prêts à l'emploi ?