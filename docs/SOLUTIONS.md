# SOLUTIONS — BananaShop CTF

> Comment trouver chaque vulnérabilité (concis).
> Base API : `/api/*`

## 🟢 Facile

### IDOR — « Not Your Profile »
- `GET /api/users/:id` : changer l'`id` de l'URL pour lire le profil d'un autre user.
- **Flag :** `ASY{pr0f1l_v0l3_s4ns_4ut0r1s4t10n}`

### Sensitive Data Exposure — « Hidden Endpoint »
- Endpoint de debug non lié : `GET /api/config` (fuzz de wordlist).
- Renvoie `databasePassword` et `adminCredentials` (username uniquement).
- **Flag :** `ASY{4h_c3_f4m3ux_3ndp01nt_0ubl13}`

### Path Traversal — « Dot Dot Slash »
- Images non statiques : `GET /api/products/image?file=...`
- Mettre `../../` dans `file` pour sortir du dossier bananas (ex : `../../secret_flag.txt`).
- **Flag :** `ASY{tr4v3rs4l_f1ch13r_s3cr3t}`

### Broken Function Level Auth / Zero-Rating — « Very bad review »
- `POST /api/products/:productId/reviews` : le select front limite 1-5, l'API accepte `rating=0` (aucune validation serveur).
- **Flag :** `ASY{z3r0_3t01l3s_v4l1d4t10n_byp4ss}`

### Reflected XSS — « Mirror Search »
- Terme de recherche réaffiché dans la page (`dangerouslySetInnerHTML`).
- Injecter `<img src=x onerror=alert(...)>` dans la barre de recherche.
- **Flag :** `ASY{r3ch3rch3_p13g33_p4r_l3_scr1pt}`

### Privilege Escalation (Mass Assignment) — « Make Me Admin »
- `PUT /api/users/:id` : ajouter le champ `"role":"admin"` dans le body JSON du profil (champ non autorisé écrit en base sans contrôle).
- Le rôle est désormais validé sur une whitelist (`user`/`admin`), mais `role=admin` passe toujours. Se reconnecter ensuite pour que le nouveau rôle soit dans le JWT.
- **Flag :** `ASY{m4ss_4ss1gn_r0l3_4dm1n}`

### Business Logic — « Incorrect Transfer »
- `POST /api/credits/send` : seul `balance >= amount` est vérifié.
- Envoyer un montant **négatif** → l'émetteur est crédité au lieu d'être débité.
- **Flag :** `ASY{b4nqu13r_4ux_cr3d1ts_1nf1n1s}`

## 🟠 Moyen

### Parameter Tampering — « Free Premium »
- `PUT /api/users/:id/subscription` : le serveur compare le solde de **mangues** 🥭 (toujours 0) au prix envoyé par le client, puis débite ce prix.
- Le bouton « Confirmer l'achat » envoie `{"plan":"premium","price":50}` (visible dans le JS / Burp) → 402 « Mangues insuffisantes ».
- Envoyer `{"plan":"premium","price":0}` → premium sans payer.
- **Flag :** `ASY{pr3m1um_s4ns_p4y3r}`

### SQL Injection (Auth Bypass) — « Login Without a Password »
- `POST /api/auth/login` : `username` interpolé dans la requête SQL.
- `username = admin'--` (ou `' OR '1'='1`) pour se connecter sans mot de passe.
- ⚠️ Le flag ne tombe que si l'injection authentifie un compte **admin** (`admin'--`).
- **Flag :** `ASY{4dm1n_s4ns_m0t_d3_p4ss3}`

### JWT Forging — « Forge n' Sign the Token »
- Cookie de session = JWT HS256 signé avec un secret faible (`secret-pass-to-change`).
- Cracker le secret (jwt.io / hashcat), puis re-signer un token avec `super_admin:true` (jamais émis par le serveur, vérifié sur `GET /api/admin/dashboard`).
- Le serveur accepte aussi `alg:none` → forge d'un token non signé possible sans cracker le secret.
- **Flag :** `ASY{j3t0n_f0rg3_4cc3s_t0t4l}`

## 🔴 Difficile

### SQL Injection UNION — « Union of Secrets »
- `GET /api/products?search=...` : injection dans un `LIKE` (6 colonnes).
- Payload : `' UNION SELECT 1,value,3,4,5,6 FROM secrets --` pour lire la table `secrets`.
- **Flag :** `ASY{un10n_s3l3ct_s3cr3ts_3xtr41ts}`

### Stored XSS — « Eternal Message »
- `POST /api/products/:productId/reviews` : filtre naïf qui bloque seulement `<script>`.
- Contourner avec un handler : `<img src=x onerror=...>` ou `javascript:`. Stocké et affiché à tous les visiteurs.
- **Flag :** `ASY{4v1s_emp01s0nn3_p4g3_p13g33}`

### SSRF — « Ask the Server »
- `POST /api/products/:id/image-url` : le serveur fetch l'URL fournie sans filtrage.
- Viser la boucle locale / services internes : `http://127.0.0.1:9000/api/internal/flag`. Cet endpoint vit sur un listener HTTP séparé bindé sur `127.0.0.1` (port `9000`, non exposé, non proxifié) → **injoignable depuis le navigateur**, atteignable uniquement quand c'est le serveur qui émet la requête. C'est ce qui rend le challenge réellement « SSRF-only ».
- **Flag :** `ASY{ssrf_r3qu3t3_1nt3rn3}`

### Session Hijacking / Cookie Theft — « Steal the Cookie »
- Le cookie JWT est posé en `httpOnly:false` → lisible via `document.cookie`.
- Combiner Stored XSS + webhook du QG : injecter un script qui exfiltre `document.cookie` vers `/log?c=<jwt>` (webhook exploit-server).
- ⚠️ L'exfiltration doit venir d'un navigateur : les user-agents CLI (curl/wget/python…) sont rejetés, un `origin`/`referer` est requis.
- **Flag :** `ASY{c00k13_v0l3_xss_c0mpl3t}`

## ⚪ Désactivé (bonus, `enabled:false`)

### CSRF — « Click and Pay »
- Action sensible exécutée sans jeton anti-CSRF ; page tierce qui déclenche la requête (cookie envoyé automatiquement, CORS credentials).
- Détection en place côté serveur mais challenge désactivé (aucun point tant que non réactivé).
- **Flag :** `ASY{csrf_tr4nsf3rt_f0rc3}`

## 🍌 Bonus non documenté

- **Master password** : `POST /api/auth/login` accepte le mot de passe universel `BANANE` pour n'importe quel compte existant. Pas de flag dédié, mais chemin alternatif vers une session admin.
