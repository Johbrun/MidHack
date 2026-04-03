export default function Instructions() {
  const challenges = [
    { name: 'Sensitive Data Exposure', difficulty: 'facile', hint: 'Certaines portes n\'ont jamais été fermées.' },
    { name: 'IDOR', difficulty: 'facile', hint: 'L\'identité est une question de perspective... et de chiffres.' },
    { name: 'Reflected XSS', difficulty: 'moyen', hint: 'Le miroir renvoie tout ce qu\'on lui donne.' },
    { name: 'SQL Injection', difficulty: 'moyen', hint: 'La porte d\'entrée parle une langue que peu maîtrisent.' },
    { name: 'Business Logic Flaw', difficulty: 'moyen', hint: 'Quand le négatif devient positif, les règles s\'inversent.' },
    { name: 'JWT Forging', difficulty: 'difficile', hint: 'Un sceau facile à reproduire ne protège rien.' },
    { name: 'Stored XSS', difficulty: 'difficile', hint: 'Les mots déposés ici vivent plus longtemps qu\'on ne le croit.' },
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
          <p>Votre équipe dispose d'un serveur d'exploitation dédié qui agit comme récepteur de webhooks. Toute requête HTTP envoyée à ce serveur sera enregistrée et affichée en temps réel.</p>
          <p>Accédez au tableau de bord de votre serveur d'exploitation pour voir les requêtes entrantes. À vous de trouver comment l'utiliser...</p>
        </div>
      </div>
    </div>
  );
}
