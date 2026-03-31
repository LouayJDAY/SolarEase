import React from "react";
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
import { motion } from "motion/react";

export function LandingPage() {
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
                  to="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg font-medium text-lg group"
                >
                  Demander un devis gratuit
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-secondary border-2 border-secondary rounded-lg hover:bg-secondary hover:text-white transition-all font-medium text-lg"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Accés tableau de bord
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
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Économies moyennes/an
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        2,500 TND
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">
                        Production mensuelle
                      </p>
                      <p className="text-sm font-medium text-secondary">
                        850 kWh
                      </p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[85%] rounded-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-primary/5 rounded-lg p-4">
                      <p className="text-2xl font-bold text-secondary mb-1">
                        4-5 ans
                      </p>
                      <p className="text-xs text-gray-600">
                        Retour sur investissement
                      </p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-4">
                      <p className="text-2xl font-bold text-secondary mb-1">
                        -6 tonnes
                      </p>
                      <p className="text-xs text-gray-600">CO2/an évités</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-accent text-white px-6 py-3 rounded-full shadow-lg">
                <p className="text-sm font-medium">🎉 500+ clients satisfaits</p>
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
                to="/login"
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
