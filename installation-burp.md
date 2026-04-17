# Documentation d'installation Burp | ASYMIS

Burp Suite est un proxy web. Son but est d'intercepter le trafic HTTP et WebSocket entre le client web dans votre navigateur et le serveur.

Intercepter ces requêtes vont nous permettre d'en savoir plus sur le fonctionnement de l'application et de pouvoir modifier les requêtes pour trouver des vulnérabilités.

## Fonctionnement global

L'idée est d'installer un module dans votre navigateur pour rediriger le trafic vers Burp. Ce dernier redirigera le trafic vers le serveur. C'est le principe d'un proxy.

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│ Navigateur web  │ ──▶ │  Proxy Web   │ ──▶ │  Serveur web │
│                 │     │              │     │              │
│ • Firefox       │     │ • Burp Suite │     │              │
│ • Chrome        │     │ • Fiddler    │     │              │
│ • Opéra         │     │ • ZAP        │     │              │
└─────────────────┘     └──────────────┘     └──────────────┘
```

> Burp écoute sur le port **8080**

## Étape 1 : Mise en place du web proxy

- Installer **Burp Suite Community** ([ici](https://portswigger.net/burp/communitydownload))
- Installer **FoxyProxy** dans le navigateur
  - Configurez un proxy :

| Champ | Valeur |
|---|---|
| Nom ou Description | `Burp` |
| Type | `HTTP` |
| Hostname | `localhost` |
| Port | `8080` |
| Nom d'utilisateur (optionnel) | — |
| Mot de passe (optionnel) | — |

- Dans **BurpSuite**, activez le scope pour exclure les autres sites de votre proxy :
  - `Proxy` → `Proxy settings` → `Scope`
  - Ajouter votre site cible via **Add** (ex. `http://localhost:8091`)

La boîte de dialogue va apparaître : sélectionnez **YES**. Cela va permettre de ne pas faire transiter le trafic en dehors de votre scope vers Burp.

> En d'autres termes : **SEUL le trafic vers le scope passera dans Burp.**

### Message affiché

> **Proxy history logging**
>
> You have added an item to Target scope. Do you want Burp Proxy to stop sending out-of-scope items to the history or other Burp tools?
>
> Answering "yes" will avoid accumulating project data for out-of-scope items.
>
> → Cliquez sur **Yes**

### Vérification

Vérifier dans **Burp Suite** que l'intercepteur est désactivé :

```
Dashboard  Target  Proxy  Intruder  ...
───────────────────────────────────────
Intercept   HTTP history   WebSockets history

  [ Intercept off ]   →  Forward
```

L'intercepteur est une fonctionnalité de Burp pour arrêter la requête. Cela vous permet de la modifier avant de la laisser filer (*forward*).

## Étape 2 : Vérification du trafic

Naviguez sur le site : le trafic devrait apparaître après navigation dans l'onglet **HTTP history** :

| # | Host | Method | URL |
|---|---|---|---|
| 42 | http://localhost:8091 | POST | /token |
| 41 | http://localhost:8091 | OPTIONS | /register |
| 40 | http://localhost:8091 | OPTIONS | /register |
| 39 | http://localhost:8091 | OPTIONS | /register |

> Filter settings: Hiding CSS and image content; hiding specific extensions

---

*DOCUMENTATION D'INSTALLATION BURP | ASYMIS*
