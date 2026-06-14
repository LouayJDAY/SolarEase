import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import {
  Sun,
  TrendingDown,
  Leaf,
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  Calculator,
  Users,
  Award,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function LandingPage() {
  const FRAME_COUNT = 240;
  const FRAME_INTERVAL_MS = 20; // ~4,8 s pour une boucle complète

  const [frameIndex, setFrameIndex] = useState(0);

  const heroImage = `/about/sequence/ezgif-frame-${String(frameIndex + 1).padStart(3, "0")}.jpg`;

  const componentHighlights = useMemo(
    () => [
      {
        label: "Focus composant",
        title: "Modules photovoltaïques",
        description:
          "Captation solaire haute performance avec orientation optimisée et rendement stable.",
      },
      {
        label: "Focus composant",
        title: "Onduleur intelligent",
        description:
          "Conversion DC/AC pilotée en temps réel pour une qualité énergétique constante.",
      },
      {
        label: "Focus composant",
        title: "Batterie de stockage",
        description:
          "Stockage stratégique pour couvrir les pics de demande et renforcer l'autonomie.",
      },
      {
        label: "Statut système",
        title: "Chaîne énergétique active",
        description:
          "Supervision continue des composants critiques et visualisation du flux de puissance.",
      },
    ],
    []
  );

  const activeHighlight = useMemo(
    () => Math.floor((frameIndex / FRAME_COUNT) * componentHighlights.length) % componentHighlights.length,
    [frameIndex, componentHighlights.length]
  );

  const calloutStyles = useMemo(() => {
    const highlightBoost = 0.7;
    const isStructureActive = activeHighlight === 0;
    const isFluxActive = activeHighlight === 1 || activeHighlight === 3;
    const isStorageActive = activeHighlight === 2;

    const buildStyle = (isActive: boolean, color: string) => ({
      opacity: isActive ? 0.7 + 0.3 * highlightBoost : 0.35,
      scale: isActive ? 1.05 : 1,
      color: isActive ? color : "rgba(255,255,255,0.65)",
      textShadow: isActive
        ? `0 0 18px ${color}`
        : "0 0 0px transparent",
      lineOpacity: isActive ? 0.95 : 0.35,
    });

    return {
      structure: buildStyle(isStructureActive, "#86efac"),
      flux: buildStyle(isFluxActive, "#a7f3d0"),
      storage: buildStyle(isStorageActive, "#34d399"),
    };
  }, [activeHighlight]);

  const activeTheme = useMemo(
    () => [
      {
        border: "border-primary/20",
        glow: "shadow-[0_24px_70px_rgba(15,23,42,0.10)]",
        panel: "from-primary/10 to-white/40",
      },
      {
        border: "border-emerald-300/20",
        glow: "shadow-[0_24px_70px_rgba(15,23,42,0.10)]",
        panel: "from-emerald-300/10 to-white/40",
      },
      {
        border: "border-emerald-400/20",
        glow: "shadow-[0_24px_70px_rgba(15,23,42,0.10)]",
        panel: "from-emerald-400/10 to-white/40",
      },
      {
        border: "border-accent/25",
        glow: "shadow-[0_24px_70px_rgba(15,23,42,0.10)]",
        panel: "from-accent/10 to-white/40",
      },
    ][activeHighlight],
    [activeHighlight]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAME_COUNT);
    }, FRAME_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Calculator,
      title: "Dimensionnement précis",
      description:
        "Analyse détaillée de vos besoins énergétiques pour un système optimisé.",
    },
    {
      icon: TrendingDown,
      title: "Économies garanties",
      description:
        "Réduisez votre facture d'électricité jusqu'à 80% dès la première année.",
    },
    {
      icon: Leaf,
      title: "Impact environnemental",
      description:
        "Contribuez à la réduction des émissions de CO2 et à la transition énergétique.",
    },
    {
      icon: Shield,
      title: "Garantie 25 ans",
      description:
        "Équipements premium certifiés avec garantie constructeur longue durée.",
    },
  ];

  const processSteps = [
    {
      number: "01",
      title: "Demande de devis",
      description:
        "Remplissez notre formulaire ou utilisez notre simulateur en ligne.",
    },
    {
      number: "02",
      title: "Étude personnalisée",
      description:
        "Notre équipe analyse votre consommation et visite votre site.",
    },
    {
      number: "03",
      title: "Installation",
      description:
        "Pose professionnelle par nos installateurs certifiés en 2-3 jours.",
    },
    {
      number: "04",
      title: "Suivi & maintenance",
      description:
        "Monitoring en temps réel et maintenance préventive incluse.",
    },
  ];

  const stats = [
    { value: "500+", label: "Installations réalisées" },
    { value: "15 MW", label: "Puissance totale installée" },
    { value: "98%", label: "Clients satisfaits" },
    { value: "25 ans", label: "Garantie équipements" },
  ];

  const testimonials = [
    {
      name: "Ahmed Ben Ali",
      role: "Propriétaire, Résidentiel",
      content:
        "SolarEase a transformé notre maison ! Nous économisons 75% sur notre facture d'électricité. L'équipe est professionnelle et le suivi impeccable.",
      rating: 5,
    },
    {
      name: "Société TechnoPlast",
      role: "Directeur, Industrie",
      content:
        "Installation de 100 kWc sur notre usine. ROI atteint en 4 ans. Le monitoring nous permet de suivre la production en temps réel.",
      rating: 5,
    },
    {
      name: "Leila Mansouri",
      role: "Gérante, Commerce",
      content:
        "Processus simple et transparent. De la simulation à l'installation, tout s'est déroulé parfaitement. Je recommande vivement !",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Leader en énergie solaire en Tunisie
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-6 leading-tight">
                Passez à l'énergie solaire en toute simplicité
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Réduisez votre facture d'électricité jusqu'à 80% avec une
                installation solaire clé en main. Simulation gratuite, devis
                personnalisé et accompagnement complet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/simulateur"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg font-medium text-lg group"
                >
                  Simuler mon projet
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-secondary border-2 border-secondary rounded-lg hover:bg-secondary hover:text-white transition-all font-medium text-lg"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Accès tableau de bord
                </Link>
                <Link
                  to="/tarifs"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gray-50 text-secondary border border-gray-200 rounded-lg hover:bg-gray-100 transition-all font-medium text-lg"
                >
                  Voir les tarifs
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Visual/Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,196,61,0.10),transparent_35%)] blur-2xl" />
              <div className={`relative overflow-hidden rounded-[2rem] border bg-white/75 backdrop-blur-xl shadow-[0_24px_70px_rgba(15,23,42,0.10)] ${activeTheme.border} ${activeTheme.glow}`}>
                <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  <span>Système solaire — contexte projet SolarEase</span>
                </div>
                <div className="h-0.5 w-full bg-slate-200/70 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-emerald-300 to-accent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <div className="relative aspect-[16/10] bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.85),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.12),transparent_35%),#04070f]">
                  <img
                    src={heroImage}
                    alt="Installation solaire SolarEase"
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                  />

                 

                  <motion.div
                    className="absolute left-4 top-8 hidden md:flex items-center gap-2 text-[11px]"
                    animate={{
                      opacity: calloutStyles.structure.opacity,
                      scale: calloutStyles.structure.scale,
                      color: calloutStyles.structure.color,
                      textShadow: calloutStyles.structure.textShadow,
                    }}
                    transition={{ duration: 0.35 }}
                  >
                    <span className="h-px w-10 bg-primary/40" style={{ opacity: calloutStyles.structure.lineOpacity }} />
                    Structure module
                  </motion.div>

                  <motion.div
                    className="absolute right-4 top-16 hidden md:flex items-center gap-2 text-[11px]"
                    animate={{
                      opacity: calloutStyles.flux.opacity,
                      scale: calloutStyles.flux.scale,
                      color: calloutStyles.flux.color,
                      textShadow: calloutStyles.flux.textShadow,
                    }}
                    transition={{ duration: 0.35 }}
                  >
                    Flux puissance
                    <span className="h-px w-10 bg-emerald-300/40" style={{ opacity: calloutStyles.flux.lineOpacity }} />
                  </motion.div>

                  <motion.div
                    className="absolute right-4 bottom-14 hidden md:flex items-center gap-2 text-[11px]"
                    animate={{
                      opacity: calloutStyles.storage.opacity,
                      scale: calloutStyles.storage.scale,
                      color: calloutStyles.storage.color,
                      textShadow: calloutStyles.storage.textShadow,
                    }}
                    transition={{ duration: 0.35 }}
                  >
                    Stockage batterie
                    <span className="h-px w-10 bg-accent/40" style={{ opacity: calloutStyles.storage.lineOpacity }} />
                  </motion.div>

                  <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 md:flex flex-col gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/55" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/72 via-transparent to-transparent" />
                </div>

                <div className={`m-4 rounded-2xl border border-slate-200/70 bg-gradient-to-br ${activeTheme.panel} p-4`}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={componentHighlights[activeHighlight].title}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.32 }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
                        {componentHighlights[activeHighlight].label}
                      </p>
                      <p className="text-slate-900 text-lg font-semibold mb-2">
                        {componentHighlights[activeHighlight].title}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {componentHighlights[activeHighlight].description}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Déroulement en temps réel aligné avec l'identité verte SolarEase.
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-4 flex items-center gap-2">
                    {componentHighlights.map((item, idx) => (
                      <motion.span
                        key={item.title}
                        className="h-1.5 rounded-full"
                        animate={{
                          width: idx === activeHighlight ? 28 : 8,
                          opacity: idx === activeHighlight ? 1 : 0.45,
                          backgroundColor:
                            idx === activeHighlight ? "rgb(34,197,94)" : "rgba(148,163,184,0.55)",
                        }}
                        transition={{ duration: 0.25 }}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Pourquoi choisir SolarEase ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une solution complète pour votre transition énergétique, de la
              conception à la maintenance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-secondary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Un processus simple en 4 étapes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              De votre première demande à la mise en service, nous vous
              accompagnons à chaque étape.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
                  <div className="text-5xl font-bold text-primary/20 mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-lg text-secondary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez les témoignages de nos clients satisfaits à travers la
              Tunisie.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-accent fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-secondary">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Prêt à passer à l'énergie solaire ?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Obtenez votre devis personnalisé gratuit en moins de 24h. Notre
              équipe d'experts est à votre écoute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-50 transition-all hover:shadow-lg font-medium text-lg group"
              >
                Demander un devis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/simulateur"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg hover:bg-white hover:text-primary transition-all font-medium text-lg"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Essayer le simulateur
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
