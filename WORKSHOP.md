# BananaShop CTF - Workshop Guide

## Challenges

Les **10 challenges actifs** sont classés par difficulté croissante. Chaque flag est au format `ASY{...}`.

| # | Challenge | Difficulté | Points |
| --- | ----------- | ----------- | ------ |
| 1 | Mes données = Tes données (IDOR) | Facile | 10 |
| 2 | Sensitive Data Exposure | Facile | 10 |
| 3 | Exploration fichiers (Path Traversal) | Facile | 10 |
| 4 | Review nulle (Zero Rating) | Facile | 10 |
| 5 | Reflected XSS | Facile | 10 |
| 6 | Go admin (Mass Assignment) | Moyen | 15 |
| 7 | Go superadmin (JWT Forging) | Moyen | 15 |
| 8 | SQL Injection (Login Bypass) | Moyen | 15 |
| 9 | 1000 crédits (Business Logic) | Moyen | 15 |
| 10 | SQL Injection (UNION) | Difficile | 25 |

---

### Challenge #1 - Mes données = Tes données (IDOR, Facile)

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

`GET /api/users/3` — regardez le champ "bio"

</details>

---

### Challenge #2 - Sensitive Data Exposure (Facile)

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

`GET /api/config`

</details>

---

### Challenge #3 - Exploration fichiers (Path Traversal, Facile)

> Les chemins mènent parfois plus loin que prévu...

<details>
<summary>Hint 1</summary>
L'application a un endpoint pour récupérer des fichiers. Regardez les endpoints liés aux produits.
</details>

<details>
<summary>Hint 2</summary>

`GET /api/products/image?file=organic.txt` — que se passe-t-il si vous remontez dans l'arborescence ?

</details>

<details>
<summary>Hint 3</summary>

`GET /api/products/image?file=../../secret_flag.txt`

</details>

---

### Challenge #4 - Review nulle (Zero Rating, Facile)

> Qui contrôle vraiment la note que vous soumettez ?

<details>
<summary>Hint 1</summary>
L'interface ne vous laisse noter qu'entre 1 et 5 étoiles. Cette contrainte est-elle vérifiée côté serveur ?
</details>

<details>
<summary>Hint 2</summary>
Interceptez la requête de soumission d'avis avec Burp Suite. Regardez le champ `rating` dans le body.
</details>

<details>
<summary>Hint 3</summary>

Modifiez le champ `rating` à `0` directement dans la requête. Le flag est retourné dans la réponse.

</details>

---

### Challenge #5 - Reflected XSS (Facile)

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

```text
/shop?search=<img src=x onerror="fetch('/api/xss-flag?type=reflected').then(r=>r.json()).then(d=>alert(d.flag))">
```

</details>

---

### Challenge #6 - Go admin (Mass Assignment, Moyen)

> Un champ de trop dans une mise à jour de profil...

<details>
<summary>Hint 1</summary>
Regardez la requête envoyée lors de la mise à jour du profil (email, bio...). Quels champs accepte-t-elle ?
</details>

<details>
<summary>Hint 2</summary>
L'API applique-t-elle aveuglément tous les champs du body ? Essayez d'ajouter des champs inattendus.
</details>

<details>
<summary>Hint 3</summary>

Ajoutez `"role": "admin"` dans le body de `PUT /api/users/me`. Rechargez la page et accédez à /admin.

</details>

---

### Challenge #7 - Go superadmin (JWT Forging, Moyen)

> Les secrets devraient être secrets. Celui-ci l'est-il ?

<details>
<summary>Hint 1</summary>
Examinez votre cookie de session. C'est un JWT. Décodez-le sur jwt.io.
</details>

<details>
<summary>Hint 2</summary>
Le JWT contient un champ "role". Si vous trouvez le secret de signature, vous pouvez le modifier. Essayez des secrets courants ou regardez les endpoints de debug...
</details>

<details>
<summary>Hint 3</summary>

Le secret JWT est `secret-pass-to-change`. Changez `"role":"user"` en `"role":"superadmin"`, re-signez avec HS256, et accédez à /admin.

</details>

---

### Challenge #8 - SQL Injection (Login Bypass, Moyen)

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

Username : `admin' --` (avec un espace avant le --), mot de passe : n'importe quoi

</details>

---

### Challenge #9 - 1000 crédits (Business Logic, Moyen)

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

Envoyez `-5000` crédits à n'importe quel utilisateur. Le flag apparaît quand votre solde dépasse 9999.

</details>

---

### Challenge #10 - SQL Injection UNION (Difficile)

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

`GET /api/products?search=' UNION SELECT 1,value,3,4,5,6 FROM secrets --`

</details>

---

## Challenges désactivés (démo formateur uniquement)

Les challenges suivants sont présents dans le code mais désactivés pour cet atelier. Ils peuvent être activés via `shared/flags.json` (`"enabled": true`).

| Challenge | Difficulté | Raison |
| ----------- | ----------- | ------ |
| CSRF | Moyen | Démo live par le formateur en fin d'atelier |
| Stored XSS | Difficile | Nécessite un compte victime actif |
| SSRF | Difficile | Niveau avancé |
| Vol de cookie (Cookie Theft) | Difficile | Dépend du Stored XSS |
