import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Seo
        title="Mentions légales"
        description="Mentions légales du site rue25.fr : éditeur, directeur de publication, hébergeur et conditions d'utilisation."
        path="/mentions-legales" />

      <header className="sticky top-0 z-40 bg-white border-b border-stone">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-[26px] font-normal tracking-[0.08em]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent">25</span>
          </Link>
          <Link to="/" className="text-[10px] tracking-[0.15em] uppercase border border-stone text-muted px-3 py-1.5 hover:border-dark transition-colors">
            ← Boutique
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-10 py-16 fade-up">
        <p className="text-[10px] tracking-[0.3em] text-accent uppercase mb-4">Juridique</p>
        <h1 className="font-serif text-4xl font-normal mb-12">Mentions légales</h1>

        <div className="space-y-10 text-sm text-dark leading-relaxed">

          <Section title="Éditeur du site">
            <Row label="Nom / raison sociale" value="[À compléter : votre nom ou raison sociale]" />
            <Row label="Statut juridique" value="[À compléter : auto-entrepreneur, EI, SASU…]" />
            <Row label="SIRET" value="[À compléter : votre numéro SIRET]" />
            <Row label="Adresse" value="[À compléter : adresse de l'établissement]" />
            <Row label="Email" value="contact@rue25.fr" />
            <Row label="Directeur de publication" value="Lucas Mettetal" />
          </Section>

          <Section title="Hébergement">
            <p className="text-muted">Le site et son API sont hébergés par :</p>
            <div className="mt-3 pl-4 border-l border-stone text-muted space-y-3">
              <p><strong className="text-dark">Cloudflare, Inc.</strong> — hébergement du site (front-end).<br />
                101 Townsend St, San Francisco, CA 94107, États-Unis.</p>
              <p><strong className="text-dark">Railway Corp.</strong> — hébergement de l'API et de la base de données.<br />
                [À compléter : adresse postale de Railway]</p>
            </div>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              L'ensemble des contenus présents sur le site rue25.fr (textes, images, photographies, logos, vidéos) sont la propriété exclusive de Rue 25 ou de leurs auteurs respectifs, et sont protégés par le droit d'auteur français et international.
            </p>
            <p className="mt-3">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation écrite préalable de Rue 25.
            </p>
          </Section>

          <Section title="Responsabilité">
            <p>
              Rue 25 s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, Rue 25 ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
            </p>
            <p className="mt-3">
              Rue 25 décline toute responsabilité pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations mises à disposition sur le site.
            </p>
          </Section>

          <Section title="Données personnelles">
            <p>
              Le traitement des données personnelles collectées sur ce site est décrit dans notre{' '}
              <Link to="/politique-de-confidentialite" className="text-accent hover:underline">
                Politique de confidentialité
              </Link>.
            </p>
            <p className="mt-3">
              Conformément à la loi Informatique et Libertés du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour l'exercer, contactez : <strong>contact@rue25.fr</strong>
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Ce site utilise uniquement des cookies techniques strictement nécessaires à son fonctionnement (authentification, panier). Aucun cookie de traçage ou à des fins publicitaires n'est déposé.
            </p>
          </Section>

          <Section title="Droit applicable">
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-stone flex gap-6 text-xs text-muted">
          <Link to="/politique-de-confidentialite" className="hover:text-dark transition-colors">Politique de confidentialité</Link>
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

function Row({ label, value }) {
  return (
    <div className="flex gap-4 py-2 border-b border-stone/50 last:border-0">
      <span className="text-muted w-44 flex-shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}
