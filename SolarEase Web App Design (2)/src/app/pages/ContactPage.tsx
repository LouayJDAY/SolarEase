import React, { useState } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Facebook,
  Linkedin,
  Instagram,
} from "lucide-react";
import { motion } from "motion/react";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "devis",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to submit form
    console.log("Form submitted:", formData);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "devis",
        message: "",
      });
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Adresse",
      content: "Centre Urbain Nord, 1082 Tunis, Tunisie",
      link: "#",
    },
    {
      icon: Phone,
      title: "Téléphone",
      content: "+216 71 123 456",
      link: "tel:+21671123456",
    },
    {
      icon: Mail,
      title: "Email",
      content: "contact@solarease.tn",
      link: "mailto:contact@solarease.tn",
    },
    {
      icon: Clock,
      title: "Horaires",
      content: "Lun-Ven: 8h-18h, Sam: 9h-13h",
      link: null,
    },
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <PublicHeader />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-secondary mb-4">
            Message envoyé !
          </h2>
          <p className="text-gray-600 mb-8">
            Merci pour votre demande. Notre équipe vous contactera dans les plus
            brefs délais (généralement sous 24h).
          </p>
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
              Contactez-nous
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une question ? Un projet ? Notre équipe d'experts est à votre
              écoute pour vous accompagner.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-secondary mb-6">
                  Envoyez-nous un message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Votre nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="devis">Demande de devis</option>
                      <option value="info">Demande d'information</option>
                      <option value="sav">Service après-vente</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      placeholder="Décrivez votre projet ou votre question..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-lg hover:bg-primary/90 transition-all font-medium text-lg flex items-center justify-center group"
                  >
                    Envoyer le message
                    <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-sm text-gray-500 text-center">
                    En soumettant ce formulaire, vous acceptez notre{" "}
                    <a href="#" className="text-primary hover:underline">
                      politique de confidentialité
                    </a>
                    .
                  </p>
                </form>
              </div>
            </motion.div>

            {/* Contact Info & Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Contact Cards */}
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary mb-1">
                          {info.title}
                        </h3>
                        {info.link ? (
                          <a
                            href={info.link}
                            className="text-gray-600 hover:text-primary transition-colors"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p className="text-gray-600">{info.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Media */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                <h3 className="font-semibold text-secondary mb-4">
                  Suivez-nous sur les réseaux sociaux
                </h3>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center border border-gray-200">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-primary" />
                  <p className="text-sm">
                    Carte interactive
                    <br />
                    Centre Urbain Nord, Tunis
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Quick */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Questions fréquentes
            </h2>
            <p className="text-gray-600">
              Vous avez peut-être déjà la réponse à votre question
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Quel est le délai de réponse ?",
                a: "Nous répondons généralement sous 24h ouvrées.",
              },
              {
                q: "Le devis est-il gratuit ?",
                a: "Oui, 100% gratuit et sans engagement.",
              },
              {
                q: "Intervenez-vous partout en Tunisie ?",
                a: "Oui, nous couvrons tout le territoire tunisien.",
              },
              {
                q: "Proposez-vous des visites ?",
                a: "Oui, visite technique gratuite sur rendez-vous.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h3 className="font-semibold text-secondary mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
