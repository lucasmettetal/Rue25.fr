import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

const LAST_UPDATE = '20 août 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Seo
        title="Politique de confidentialité"
        description="Comment Rue 25 collecte, utilise et protège vos données personnelles, conformément au RGPD."
        path="/politique-de-confidentialite" />

      <header className="sticky top-0 z-40 bg-white border-b border-stone">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-[26px] font-normal tracking-[0.08em]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent-ink">25</span>
          </Link>
          <Link to="/" className="text-[10px] tracking-[0.15em] uppercase border border-line text-muted px-3 py-1.5 hover:border-dark transition-colors">
            ← Boutique
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-10 py-16 fade-up">
        <p className="text-[10px] tracking-[0.3em] text-accent-ink uppercase mb-4">Juridique</p>
        <h1 className="font-serif text-4xl font-normal mb-2">Politique de confidentialité</h1>
        <p className="text-xs text-muted mb-12">Dernière mise à jour : {LAST_UPDATE}</p>

        <div className="prose-rue space-y-10 text-sm text-dark leading-relaxed">

          <Section title="1. Responsable du traitement">
            <p>Le responsable du traitement des données personnelles collectées sur le site <strong>rue25.fr</strong> est :</p>
            <p className="mt-3 pl-4 border-l border-stone text-muted">
              [À compléter : nom / raison sociale de l'éditeur]<br />
              [À compléter : adresse]<br />
              Email : contact@rue25.fr
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p>Nous collectons les données suivantes selon les interactions :</p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                ['Création de compte', 'Prénom, nom, adresse email, mot de passe (hashé)'],
                ['Commande', 'Nom, email, contenu du panier, montant total'],
                ['Sur mesure', 'Coordonnées, description du projet, mensurations (optionnelles)'],
                ['Contact', 'Nom, email, message'],
              ].map(([ctx, data]) => (
                <li key={ctx} className="flex gap-3">
                  <span className="text-accent-ink flex-shrink-0">◈</span>
                  <span><strong>{ctx} :</strong> {data}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-muted">Nous ne collectons pas de données sensibles (santé, origine ethnique, opinions politiques, etc.).</p>
          </Section>

          <Section title="3. Finalités et bases légales">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-3">
                <thead>
                  <tr className="bg-stone/40">
                    <th className="text-left p-3 font-medium uppercase tracking-widest">Finalité</th>
                    <th className="text-left p-3 font-medium uppercase tracking-widest">Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Gestion des commandes et paiements', 'Exécution du contrat'],
                    ['Gestion du compte client', 'Exécution du contrat'],
                    ['Demandes sur-mesure', 'Consentement + exécution du contrat'],
                    ['Réponse aux messages de contact', 'Intérêt légitime'],
                    ['Envoi d\'emails transactionnels', 'Exécution du contrat'],
                    ['Sécurité et prévention de la fraude', 'Intérêt légitime'],
                  ].map(([fin, base]) => (
                    <tr key={fin} className="border-b border-stone">
                      <td className="p-3">{fin}</td>
                      <td className="p-3 text-muted">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Durées de conservation">
            <ul className="space-y-2 list-none pl-0 mt-3">
              {[
                ['Données de compte', '3 ans après la dernière activité'],
                ['Données de commandes', '10 ans (obligation légale comptable)'],
                ['Demandes sur-mesure', '3 ans'],
                ['Messages de contact', '1 an'],
              ].map(([type, duree]) => (
                <li key={type} className="flex gap-3">
                  <span className="text-accent-ink flex-shrink-0">◈</span>
                  <span><strong>{type} :</strong> {duree}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="5. Destinataires des données">
            <p>Vos données sont traitées par nos prestataires dans le strict cadre de leurs missions :</p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                ['Stripe', 'Traitement des paiements (certifié PCI-DSS)'],
                ['Railway', 'Hébergement de l\'API et de la base de données'],
                ['Cloudflare', 'Hébergement et diffusion du site'],
                ['Prestataire email (SMTP)', 'Envoi des emails transactionnels et de contact'],
              ].map(([dest, role]) => (
                <li key={dest} className="flex gap-3">
                  <span className="text-accent-ink flex-shrink-0">◈</span>
                  <span><strong>{dest} :</strong> {role}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-muted">Nous ne vendons ni ne louons vos données à des tiers.</p>
          </Section>

          <Section title="6. Cookies et stockage local">
            <p>Ce site utilise uniquement des cookies et données de stockage <strong>strictement nécessaires</strong> :</p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                ['Token d\'authentification', 'Maintenir votre session ouverte', 'Session / 7 jours'],
                ['Panier', 'Conserver votre panier entre les visites', 'Indéfini (localStorage)'],
              ].map(([name, usage, duree]) => (
                <li key={name} className="flex gap-3">
                  <span className="text-accent-ink flex-shrink-0">◈</span>
                  <span><strong>{name} :</strong> {usage} — <em className="text-muted">{duree}</em></span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-muted">Aucun cookie de suivi publicitaire ou analytique n'est utilisé.</p>
          </Section>

          <Section title="7. Vos droits">
            <p>Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :</p>
            <ul className="mt-3 space-y-1.5 list-none pl-0">
              {[
                'Droit d\'accès à vos données',
                'Droit de rectification',
                'Droit à l\'effacement (« droit à l\'oubli »)',
                'Droit à la limitation du traitement',
                'Droit à la portabilité',
                'Droit d\'opposition',
                'Droit de retirer votre consentement à tout moment',
              ].map(r => (
                <li key={r} className="flex gap-3">
                  <span className="text-accent-ink flex-shrink-0">◈</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à <strong>contact@rue25.fr</strong> avec un justificatif d'identité.
              Vous disposez également du droit de déposer une réclamation auprès de la{' '}
              <strong>CNIL</strong> (cnil.fr).
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Pour toute question relative au traitement de vos données personnelles :<br />
              <strong>contact@rue25.fr</strong>
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-stone flex gap-6 text-xs text-muted">
          <Link to="/mentions-legales" className="hover:text-dark transition-colors">Mentions légales</Link>
          <Link to="/" className="hover:text-dark transition-colors">Retour à la boutique</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-serif text-xl font-normal mb-4 pb-3 border-b border-stone">{title}</h2>
      {children}
    </div>
  );
}
