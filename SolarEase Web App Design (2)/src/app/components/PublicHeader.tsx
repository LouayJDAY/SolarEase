import { Link, useLocation } from "react-router";

const navItems = [
	{ to: "/", label: "Solutions" },
	{ to: "/simulateur", label: "Simulateur" },
	{ to: "/tarifs", label: "Tarifs" },
	{ to: "/about", label: "À propos" },
	{ to: "/contact", label: "FAQ" },
];

export function PublicHeader() {
	const location = useLocation();
	const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

	return (
		<header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
				<Link to="/" className="flex items-center gap-3 text-xl font-semibold text-secondary">
					<span className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm">S</span>
					<span>SolarEase</span>
				</Link>

				<nav className="hidden md:flex items-center gap-6">
					{navItems.map((item) => {
						const active = isActive(item.to);
						return (
							<Link
								key={item.to}
								to={item.to}
								className={active ? "text-primary font-medium" : "text-slate-600 hover:text-secondary transition-colors"}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className="flex items-center gap-3">
					<Link
						to="/login"
						className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
					>
						Connexion
					</Link>
					<Link
						to="/simulateur"
						className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
					>
						Simuler
					</Link>
					<Link
						to="/contact"
						className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
					>
						Devis gratuit
					</Link>
				</div>
			</div>
		</header>
	);
}

