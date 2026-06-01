import React, { useState } from "react";
import { useLocation } from "react-router";
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
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import demandService from "../services/demandService";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

export function ContactPage() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "devis",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const query = new URLSearchParams(location.search);
  const isFromSimulator = query.get("source") === "simulateur";

  React.useEffect(() => {
    if (!isFromSimulator) return;

    const propertyTypeMap: Record<string, string> = {
      house: "Maison",
      commercial: "Commerce",
      industrial: "Industrie",
    };

    const propertyType = propertyTypeMap[query.get("propertyType") || ""] || "N/A";
    const quarterlyBill = query.get("quarterlyBill") || query.get("monthlyBill") || "N/A";
    const roofArea = query.get("roofArea") || "N/A";
    const region = query.get("region") || "N/A";
    const systemSize = query.get("systemSize") || "N/A";
    const estimatedCost = query.get("estimatedCost") || "N/A";
    const annualSavings = query.get("annualSavings") || "N/A";

    const message = [
      "Bonjour,",
      "Je souhaite un devis personnalisé basé sur ma simulation SolarEase.",
      "",
      `Type de bien: ${propertyType}`,
      `Facture trimestrielle: ${quarterlyBill} TND`,
      `Surface toiture: ${roofArea} m²`,
      `Région: ${region}`,
      `Puissance estimée: ${systemSize} kWc`,
      `Investissement estimé: ${estimatedCost} TND`,
      `Économies annuelles estimées: ${annualSavings} TND`,
      "",
      "Merci de me recontacter pour une étude précise.",
    ].join("\n");

    setFormData((prev) => ({
      ...prev,
      subject: "devis",
      message: prev.message || message,
    }));
  }, [isFromSimulator, location.search]);

  const validate = (data: typeof formData): FormErrors => {
    const next: FormErrors = {};
    if (!data.name.trim() || data.name.trim().length < 2) {
      next.name = "Veuillez saisir votre nom complet (2 caractères minimum).";
    }
    if (!data.email.trim()) {
      next.email = "L'email est requis.";
    } else if (!EMAIL_RE.test(data.email.trim())) {
      next.email = "Format d'email invalide.";
    }
    if (data.phone.trim() && !PHONE_RE.test(data.phone.trim())) {
      next.phone = "Numéro de téléphone invalide.";
    }
    if (!data.message.trim() || data.message.trim().length < 10) {
      next.message = "Décrivez votre projet en 10 caractères minimum.";
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate(formData);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error("Merci de corriger les champs indiqués avant d'envoyer.");
      return;
    }

    setSubmitting(true);
    try {
      const demand = await demandService.createPublicDemand({
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject,
        message: formData.message.trim(),
      });

      setSubmittedRef(`DEM-${demand.id}`);
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "devis",
        message: "",
      });
      setErrors({});
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Impossible d'envoyer votre demande pour le moment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const name = e.target.name as keyof typeof formData;
    setFormData({
      ...formData,
      [name]: e.target.value,
    });
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        return next;
      });
    }
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <PublicHeader />
        <div className="pt-32 pb-24 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl border border-primary/10 shadow-xl p-10 text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-secondary mb-3">
              Demande envoyée !
            </h2>
            <p className="text-gray-600 mb-5">
              Merci, votre message est bien arrivé. Notre équipe vous contactera dans les meilleurs délais
              (généralement sous 24h ouvrées).
            </p>
            {submittedRef && (
              <p className="inline-block bg-primary/5 border border-primary/20 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
                Référence : {submittedRef}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
              {[
                { step: "1", title: "Réception", text: "Votre demande est routée vers un administrateur en temps réel." },
                { step: "2", title: "Étude", text: "Nos experts qualifient le besoin et préparent une simulation personnalisée." },
                { step: "3", title: "Contact", text: "Nous vous appelons pour valider le rendez-vous technique sur site." },
              ].map((s) => (
                <div key={s.step} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-semibold mb-2">
                    {s.step}
                  </span>
                  <p className="font-semibold text-sm text-secondary">{s.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{s.text}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setSubmittedRef(null);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Envoyer une autre demande
            </button>
          </motion.div>
        </div>
        <PublicFooter />
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

                {isFromSimulator && (
                  <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <p className="text-sm font-medium text-secondary">Simulation détectée</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Nous avons pré-rempli votre message avec vos résultats pour accélérer votre devis.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <FormField label="Nom complet *" error={errors.name}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      aria-invalid={!!errors.name}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                        errors.name ? "border-red-300 bg-red-50/30" : "border-gray-300"
                      }`}
                      placeholder="Votre nom"
                    />
                  </FormField>

                  <FormField label="Email *" error={errors.email}>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      aria-invalid={!!errors.email}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                        errors.email ? "border-red-300 bg-red-50/30" : "border-gray-300"
                      }`}
                      placeholder="votre@email.com"
                    />
                  </FormField>

                  <FormField label="Téléphone" error={errors.phone} hint="Pour vous rappeler en cas de besoin">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      aria-invalid={!!errors.phone}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                        errors.phone ? "border-red-300 bg-red-50/30" : "border-gray-300"
                      }`}
                      placeholder="+216 XX XXX XXX"
                    />
                  </FormField>

                  <FormField label="Sujet *">
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
                  </FormField>

                  <FormField
                    label="Message *"
                    error={errors.message}
                    hint={`${formData.message.length} caractère(s)`}
                  >
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      aria-invalid={!!errors.message}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none ${
                        errors.message ? "border-red-300 bg-red-50/30" : "border-gray-300"
                      }`}
                      placeholder="Décrivez votre projet ou votre question..."
                    />
                  </FormField>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-white py-4 rounded-lg hover:bg-primary/90 transition-all font-medium text-lg flex items-center justify-center group disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer le message
                        <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
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

              {/* Real Map */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="h-80 w-full">
                  <iframe
                    title="Localisation SolarEase - Centre Urbain Nord, Tunis"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=10.1625%2C36.8430%2C10.2150%2C36.8820&layer=mapnik&marker=36.8625%2C10.1888"
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-primary" />
                    Centre Urbain Nord, 1082 Tunis, Tunisie
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Centre+Urbain+Nord+1082+Tunis+Tunisie"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Ouvrir dans Google Maps
                  </a>
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

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {children}
      <div className="mt-1 min-h-[1rem] flex items-center justify-between gap-2">
        <p className={`text-xs ${error ? "text-red-600" : "text-gray-400"}`}>
          {error || hint || ""}
        </p>
      </div>
    </div>
  );
}
