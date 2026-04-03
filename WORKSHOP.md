# BananaShop CTF — Workshop Guide

## Challenges

Les 7 challenges sont classés par difficulté croissante. Chaque flag est au format `CTF{...}`.

---

### Challenge #1 — Sensitive Data Exposure (Facile)

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
<code>GET /api/debug/config</code>
</details>

---

### Challenge #2 — IDOR (Facile)

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
<code>GET /api/users/3</code> — regardez le champ "bio"
</details>

---

### Challenge #3 — Reflected XSS (Facile-Moyen)

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

### Challenge #4 — SQL Injection (Moyen)

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

### Challenge #5 — Business Logic (Moyen)

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

### Challenge #6 — JWT Forging (Moyen-Difficile)

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

### Challenge #7 — Stored XSS (Difficile)

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
