# Guide Formateur - MidHack BananaShop CTF

Document réservé aux formateurs. **Ne pas partager avec les participants.**

## Avant l'atelier

### Prérequis techniques

- Docker et Docker Compose (plugin) installés
- Un écran/projecteur pour le dashboard live
- Chaque équipe a besoin d'un navigateur avec Burp Suite Community installé

### Installation et lancement

```bash
# Générer la configuration pour N équipes (défaut : 4)
./setup.sh 6

# Ou tout-en-un : générer + lancer
./setup.sh 6 --deploy
```

Le script vérifie automatiquement :
- Présence de Docker et Docker Compose
- Que le daemon Docker tourne
- RAM et espace disque suffisants
- Disponibilité des ports nécessaires

Après exécution, le script génère :
- `docker-compose.yml` avec healthchecks, limites mémoire et volumes persistants
- `credentials.json` — identifiants au format JSON
- `credentials.html` — cartes imprimables à découper (ouvrir dans un navigateur, imprimer)

Le mot de passe admin du dashboard est affiché dans le résumé et sauvegardé dans `credentials.json`.

Si vous n'utilisez pas `--deploy`, lancez manuellement :

```bash
docker compose up --build -d
```

### Configuration avancée

Les paramètres de l'événement sont déclarés dans le `docker-compose.yml` généré, dans le bloc `x-event-config` en haut du fichier. Modifiez-les **avant** de lancer `docker compose up` :

```yaml
# Variables partagées pour le dashboard (modifiables ici)
x-event-config: &event-config
  ADMIN_PASSWORD: "aBcD1234"       # Mot de passe du panel admin
  EVENT_TITLE: "BananaShop CTF"    # Titre affiché sur le dashboard
  HINT_PENALTY: "3"               # Points retirés par indice utilisé
```

Pour le branding Nantes@Hack, modifier `x-build-args` (nécessite un rebuild) :

```yaml
x-build-args: &build-args
  VITE_NANTES_HACK: "0"   # "0" = désactivé, "1" = activé
```

### Vérification des services

```bash
# Vérifier que tous les conteneurs sont healthy
docker compose ps
```

| Service | URL | Vérification |
|---------|-----|--------------|
| Dashboard | <http://localhost:5000> | Le tableau de scores s'affiche |
| Site Team N | <http://localhost:300N> | La boutique BananaShop s'affiche |
| Exploit Team N | <http://localhost:400N> | Page de login |

### Mots de passe des serveurs d'exploit

Les mots de passe sont **générés aléatoirement** à chaque exécution de `setup.sh`. Ils sont affichés dans le terminal et sauvegardés dans :
- `credentials.json` — pour un usage programmatique
- `credentials.html` — cartes imprimables à distribuer aux équipes

### Comptes utilisateurs sur le site

| Utilisateur | Mot de passe | Rôle | Notes |
|-------------|-------------|------|-------|
| `admin` | `SuperSecretAdmin123!` | admin | Compte admin principal |
| `john` | `john123` | user | Compte utilisateur standard |
| `flag_holder` | `unfindable_password_42!` | user | Bio contient le flag IDOR |

### Secret JWT

Le secret JWT est `secret-pass-to-change` (chaîne littérale). Le serveur accepte les algorithmes `HS256` et `none`.

---

## Panel d'administration

Le dashboard dispose d'un panneau d'administration accessible via le bouton **Admin** en haut à droite du scoreboard.

Le mot de passe admin est affiché lors du `setup.sh` et sauvegardé dans `credentials.json`.

### Fonctionnalités du panel admin

| Fonction | Description |
|----------|-------------|
| **Timer** | Démarrer/arrêter un compte à rebours (en minutes) |
| **Annonces** | Envoyer un message en direct à toutes les équipes (toast sur les exploit-servers + scoreboard) |
| **Geler le scoreboard** | Les captures continuent d'être enregistrées mais le classement public ne se met plus à jour (suspense pour les dernières minutes) |
| **Dégeler le scoreboard** | Révéler le classement final |
| **Réinitialiser les scores** | Remet tous les scores à zéro |
| **Export JSON/CSV** | Télécharger les résultats complets |
| **Certificats** | Générer une page HTML imprimable avec un certificat par équipe (rang, score, challenges résolus) |

### Contrôle du timer via curl (alternative)

```bash
# Démarrer le timer (ex: 90 minutes)
curl -X POST http://localhost:5000/api/timer/start \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: MOT_DE_PASSE_ADMIN" \
  -d '{"duration": 90}'

# Arrêter le timer
curl -X POST http://localhost:5000/api/timer/stop \
  -H "X-Admin-Token: MOT_DE_PASSE_ADMIN"

# Voir l'état du timer
curl http://localhost:5000/api/timer
```

### Annonces via curl

```bash
curl -X POST http://localhost:5000/api/announce \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: MOT_DE_PASSE_ADMIN" \
  -d '{"message": "Plus que 30 minutes !"}'
```

---

## Déroulement de l'atelier (2h)

### Phase 1 - Introduction (15 min)

1. Présenter le contexte : sécurité offensive, OWASP Top 10
2. Montrer les outils : DevTools, Burp Suite, extension JWT de Burp
3. Distribuer les cartes d'accès imprimées (`credentials.html`) à chaque équipe
4. Expliquer les règles :
   - Chaque flag trouvé rapporte des points
   - Les indices coûtent -3 pts (configurable)
   - **First Blood** : +5 pts bonus pour la première équipe à capturer un flag
   - Les challenges se déverrouillent progressivement (2 Faciles → Moyens, 2 Moyens → Difficiles)
5. **Lancer le timer** depuis le panel admin du dashboard

### Phase 2 - CTF libre (1h30)

- Les équipes exploitent les vulnérabilités à leur rythme
- Le dashboard projète le scoreboard en temps réel
- Les participants peuvent consulter l'Académie dans leur serveur d'exploit
- Circuler entre les équipes pour débloquer si besoin (donner des indices oraux)
- Utiliser les **annonces** pour donner des indices globaux ou marquer les étapes ("Plus que 30 min !")
- **Geler le scoreboard** 15 minutes avant la fin pour maintenir le suspense

### Phase 3 - Debrief (15 min)

- **Dégeler le scoreboard** pour la révélation du classement final
- Walkthrough de chaque vulnérabilité avec les participants
- Montrer le code vulnérable vs. le code corrigé via le bouton **Fix-It** sur la page Challenges (disponible pour chaque flag capturé)
- Discuter des remédiations et bonnes pratiques
- **Exporter les certificats** depuis le panel admin et les distribuer

### Phase 4 - Démo CSRF en live (5-10 min)

Terminer l'atelier par une démonstration concrète d'attaque CSRF pour marquer les esprits.

1. **Préparer la démo** : sur le serveur d'exploit d'une équipe, créer une page HTML piégée contenant un formulaire caché qui effectue un transfert de crédits :

   ```html
   <h1>🎁 Vous avez gagné des bananes gratuites !</h1>
   <form id="csrf" action="http://localhost:3001/api/credits/send" method="POST">
     <input type="hidden" name="toUserId" value="1" />
     <input type="hidden" name="amount" value="500" />
   </form>
   <script>document.getElementById('csrf').submit();</script>
   ```

2. **Scénario** : se connecter en tant que `john` sur le site BananaShop, puis ouvrir la page piégée dans un autre onglet du même navigateur
3. **Résultat** : montrer que le transfert s'exécute sans aucune action de la victime, car le cookie de session est envoyé automatiquement et aucun token CSRF ne protège l'endpoint
4. **Leçon** : expliquer les protections (token CSRF synchronisé, attribut `SameSite` sur les cookies, vérification de l'en-tête `Origin`/`Referer`)

---

## Nouvelles fonctionnalités pour les participants

### Déverrouillage progressif des challenges

Les challenges ne sont pas tous visibles dès le départ :
- **Facile** : toujours visibles
- **Moyen** : se débloquent après avoir capturé 2 flags Faciles
- **Difficile** : se débloquent après avoir capturé 2 flags Moyens

Les challenges verrouillés apparaissent en grisé avec "???".

### Mode Fix-It

Après avoir capturé un flag, un bouton **🔧 Fix-It** apparaît sur la page Challenges. Il ouvre une modale avec :
- La description du danger
- La correction recommandée
- La référence OWASP
- Un diff side-by-side du code vulnérable vs. corrigé

### First Blood

La première équipe à capturer un flag spécifique reçoit un bonus de **+5 points**. Un toast rouge "FIRST BLOOD" s'affiche sur le scoreboard projeté.

### Confetti

Une animation confetti se déclenche à chaque soumission de flag réussie pour récompenser visuellement les participants.

---

## Réinitialisation

### Reset complet (recommandé)

```bash
# Supprime conteneurs, volumes et fichiers générés
./setup.sh --reset

# Puis relancer
./setup.sh 4 --deploy
```

### Réinitialiser une équipe (base de données)

Chaque équipe a sa propre base de données SQLite. Pour réinitialiser :

```bash
docker compose exec site-team1 rm /app/server/banana_shop.db
docker compose restart site-team1
```

La base sera recréée automatiquement au démarrage avec les données initiales.

### Réinitialiser le scoreboard

Utiliser le bouton **Réinitialiser les scores** dans le panel admin, ou :

```bash
docker compose exec dashboard rm /app/dashboard/data/scoreboard.json
docker compose restart dashboard
```

### Données persistantes

Les données suivantes survivent à un `docker compose restart` grâce aux volumes Docker :
- `dashboard-data` : scoreboard
- `exploit-teamN-data` : logs webhook par équipe

Un `docker compose down -v` ou `./setup.sh --reset` supprime ces volumes.

### Réinitialisation en développement local

```bash
rm server/banana_shop.db
rm dashboard/data/scoreboard.json
npm run dev
```

---

## Problèmes courants

| Problème | Solution |
|----------|----------|
| Le dashboard n'affiche pas les équipes | Les équipes s'enregistrent au démarrage de leur exploit-server. Vérifier que les conteneurs exploit sont lancés (`docker compose ps`) |
| Un conteneur n'est pas "healthy" | `docker compose logs <service>` pour diagnostiquer. Les healthchecks utilisent `wget` sur les endpoints principaux |
| Une équipe ne peut plus se connecter | Réinitialiser la base de données de l'équipe (voir section Réinitialisation) |
| Le timer ne se lance pas | Utiliser le panel admin (bouton Admin sur le dashboard) ou vérifier le mot de passe admin |
| Les flags ne sont pas validés | Vérifier la connexion entre exploit-server et dashboard (réseau Docker) |
| Les annonces ne s'affichent pas chez les équipes | Vérifier que l'exploit-server est connecté au WebSocket du dashboard (voir les logs) |
| Port déjà utilisé | `./setup.sh --reset` puis relancer |
| Mots de passe perdus | Consulter `credentials.json` ou relancer `./setup.sh` (attention : régénère de nouveaux mots de passe) |
| Données perdues après redémarrage | Les volumes Docker persistent les données. Un `docker compose down -v` les supprime |
