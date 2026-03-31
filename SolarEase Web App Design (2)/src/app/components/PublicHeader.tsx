import { Link, useLocation } from "react-router";

const navItems = [
	{ to: "/", label: "Accueil" },
	{ to: "/simulateur", label: "Simulateur" },
	{ to: "/about", label: "À propos" },
	{ to: "/contact", label: "Contact" },
];

export function PublicHeader() {
	const location = useLocation();

	return (
		<header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
				<Link to="/" className="text-xl font-semibold text-secondary">
					SolarEase
				</Link>

				<nav className="hidden md:flex items-center gap-6">
					{navItems.map((item) => {
						const active = location.pathname === item.to;
						return (
							<Link
								key={item.to}
								to={item.to}
								className={active ? "text-primary font-medium" : "text-slate-600 hover:text-secondary"}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className="flex items-center gap-3">
					<Link
						to="/login"
						className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
					>
						Connexion
					</Link>
					<Link
						to="/contact"
						className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
					>
						Devis gratuit
					</Link>
				</div>
			</div>
		</header>
	);
}

