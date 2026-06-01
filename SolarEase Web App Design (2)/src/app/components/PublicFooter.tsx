import { Link } from "react-router";

export function PublicFooter() {
  return (
    <footer className="bg-secondary text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-3">SolarEase</h3>
          <p className="text-sm text-slate-300">
            Plateforme de dimensionnement solaire moderne pour particuliers et professionnels.
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-3">Navigation</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link to="/" className="hover:text-white">Accueil</Link></li>
            <li><Link to="/simulateur" className="hover:text-white">Simulateur</Link></li>
            <li><Link to="/about" className="hover:text-white">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/login" className="hover:text-white">Connexion</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-3">Support</h4>
          <p className="text-sm text-slate-300">Email: support@solarease.com</p>
          <p className="text-sm text-slate-300">Téléphone: +216 70 000 000</p>
        </div>
      </div>

      <div className="border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-slate-400">
          © {new Date().getFullYear()} SolarEase. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
