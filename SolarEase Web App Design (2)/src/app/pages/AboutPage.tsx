import React from "react";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import {
  Target,
  Users,
  Award,
  Zap,
  Shield,
  TrendingUp,
  Heart,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";

export function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Excellence",
      description:
        "Nous sélectionnons les meilleurs équipements et formons nos équipes aux dernières technologies solaires.",
    },
    {
      icon: Shield,
      title: "Transparence",
      description:
        "Prix clairs, processus transparent, aucun frais caché. Vous savez toujours où vous en êtes.",
    },
    {
      icon: Heart,
      title: "Engagement",
      description:
        "Nous croyons en un avenir énergétique durable et accompagnons la Tunisie dans sa transition.",
    },
    {
      icon: Users,
      title: "Proximité",
      description:
        "Une équipe locale disponible et réactive pour vous accompagner avant, pendant et après l'installation.",
    },
  ];

  const stats = [
    { number: "2018", label: "Année de création" },
    { number: "500+", label: "Installations réalisées" },
    { number: "15 MW", label: "Puissance installée" },
    { number: "98%", label: "Clients satisfaits" },
    { number: "25+", label: "Experts certifiés" },
    { number: "100%", label: "Équipements premium" },
  ];

  const team = [
    {
      name: "Karim Benjelloun",
      role: "Directeur Général",
      description: "15 ans d'expérience dans les énergies renouvelables",
    },
    {
      name: "Leila Mansouri",
      role: "Directrice Technique",
      description: "Ingénieure énergétique, spécialiste photovoltaïque",
    },
    {
      name: "Ahmed Trabelsi",
      role: "Responsable Commercial",
      description: "Expert en solutions solaires sur mesure",
    },
    {
      name: "Sonia Khelifi",
      role: "Service Client",
      description: "Accompagnement et suivi personnalisé",
    },
  ];

  const milestones = [
    {
      year: "2018",
      title: "Création de SolarEase",
      description:
        "Lancement de l'activité avec une vision : rendre le solaire accessible à tous en Tunisie.",
    },
    {
      year: "2019",
      title: "100 premières installations",
      description:
        "Atteinte d'un cap symbolique avec des clients satisfaits partout en Tunisie.",
    },
    {
      year: "2021",
      title: "Certification Tier 1",
      description:
        "Obtention de la certification pour l'utilisation exclusive de panneaux Tier 1.",
    },
    {
      year: "2023",
      title: "Expansion industrielle",
      description:
        "Lancement d'une division dédiée aux grandes installations industrielles.",
    },
    {
      year: "2024",
      title: "500+ installations",
      description:
        "Plus de 500 clients nous font confiance à travers tout le pays.",
    },
    {
      year: "2026",
      title: "Innovation digitale",
      description:
        "Lancement de notre plateforme de monitoring et suivi client en temps réel.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
              À propos de SolarEase
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Votre partenaire de confiance pour la transition énergétique en
              Tunisie depuis 2018
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-6">
                Notre mission
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Chez SolarEase, nous croyons que l'énergie solaire doit être
                accessible à tous. Notre mission est de démocratiser l'accès à
                une énergie propre, rentable et durable en Tunisie.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Nous accompagnons particuliers, entreprises et industries dans
                leur transition énergétique avec des solutions clé en main,
                transparentes et performantes.
              </p>
              <div className="space-y-3">
                {[
                  "Réduire la facture énergétique de nos clients",
                  "Contribuer à la transition énergétique nationale",
                  "Offrir un service d'excellence de A à Z",
                  "Garantir la rentabilité de chaque installation",
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12"
            >
              <div className="grid grid-cols-2 gap-6">
                {stats.slice(0, 4).map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-3xl font-bold text-primary mb-2">
                      {stat.number}
                    </p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Nos valeurs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident notre action au quotidien
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-secondary mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Notre parcours
            </h2>
            <p className="text-lg text-gray-600">
              8 ans d'innovation et de croissance au service de l'énergie solaire
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative flex items-start space-x-8"
                >
                  {/* Timeline Dot */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold z-10 border-4 border-white shadow-lg">
                      {milestone.year.slice(2)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-2">
                      <span className="text-primary font-bold text-lg md:hidden mr-3">
                        {milestone.year}
                      </span>
                      <h3 className="font-semibold text-xl text-secondary">
                        {milestone.title}
                      </h3>
                    </div>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Notre équipe
            </h2>
            <p className="text-lg text-gray-600">
              Des experts passionnés à votre service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                  <Users className="w-20 h-20 text-primary/40" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-secondary mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary text-sm font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-sm text-gray-600">{member.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Certifications & Partenaires
            </h2>
            <p className="text-lg text-white/80">
              Qualité et expertise reconnues
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-10 h-10 text-primary" />
                </div>
                <p className="text-white text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Rejoignez nos 500+ clients satisfaits
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Faites confiance à l'expertise SolarEase pour votre projet solaire
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-50 transition-all font-medium text-lg"
              >
                Demander un devis
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg hover:bg-white hover:text-primary transition-all font-medium text-lg"
              >
                Accés au tableau de bord
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
