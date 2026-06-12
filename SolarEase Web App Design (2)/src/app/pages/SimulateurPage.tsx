import React, { useState } from "react";
import { Link } from "react-router";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import {
  Calculator,
  Home,
  Zap,
  TrendingDown,
  Leaf,
  ArrowRight,
  CheckCircle,
  Info,
  MapPin,
  Sun,
} from "lucide-react";
import { motion } from "motion/react";
import InvoiceUploadModal from "../components/InvoiceUploadModal";
import {
  getSolarRegion,
  IRRADIANCE_LABELS,
  SOLAR_REGIONS,
} from "../constants/solarRegions";
import { simulateurWizardSchema } from "../validation/projectSchemas";
import { toast } from "sonner";

export function SimulateurPage() {
  // Paramètres validés entreprise (Tunisie)
  const USABLE_SURFACE_COEFFICIENT = 0.7;
  const PANEL_AREA_M2 = 1.9;
  const PANEL_POWER_KW = 0.4;
  const DEFAULT_PRODUCTIVITY_KWH_PER_KWP = 1600;
  const ELECTRICITY_PRICE_TND_KWH = 0.28;
  const INSTALLED_COST_TND_PER_KW = 2500;
  const CO2_FACTOR_KG_PER_KWH = 0.6;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyType: "",
    quarterlyBill: "",
    roofArea: "",
    region: "",
  });
  const [results, setResults] = useState<null | {
    systemSize: number;
    estimatedCost: number;
    annualSavings: number;
    roi: number;
    co2Reduction: number;
    annualProduction: number;
  }>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [billInputMode, setBillInputMode] = useState<"manual" | "import">("manual");

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const selectedRegion = getSolarRegion(formData.region);
  const productivityKwhPerKwp =
    selectedRegion?.productivityKwhPerKwp ?? DEFAULT_PRODUCTIVITY_KWH_PER_KWP;

  const calculateResults = () => {
    const quarterlyBill = parseFloat(formData.quarterlyBill);
    const roofArea = parseFloat(formData.roofArea);
    const regionProductivity =
      getSolarRegion(formData.region)?.productivityKwhPerKwp ??
      DEFAULT_PRODUCTIVITY_KWH_PER_KWP;

    const roofLimitedSystemSize =
      (roofArea * USABLE_SURFACE_COEFFICIENT * PANEL_POWER_KW) / PANEL_AREA_M2;
    const billLimitedSystemSize =
      (quarterlyBill * 4) /
      (regionProductivity * ELECTRICITY_PRICE_TND_KWH);

    const systemSize = Math.min(roofLimitedSystemSize, billLimitedSystemSize);
    const estimatedCost = systemSize * INSTALLED_COST_TND_PER_KW;
    const annualProduction = systemSize * regionProductivity;
    const annualSavings = annualProduction * ELECTRICITY_PRICE_TND_KWH;
    const roi = estimatedCost / annualSavings;
    const co2Reduction = annualProduction * CO2_FACTOR_KG_PER_KWH;

    setResults({
      systemSize: Math.round(systemSize * 10) / 10,
      estimatedCost: Math.round(estimatedCost),
      annualSavings: Math.round(annualSavings),
      roi: Math.round(roi * 10) / 10,
      co2Reduction: Math.round(co2Reduction),
      annualProduction: Math.round(annualProduction),
    });
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      const parsed = simulateurWizardSchema.safeParse({
        propertyType: formData.propertyType,
        quarterlyBill: formData.quarterlyBill,
        roofArea: formData.roofArea,
        region: formData.region,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Complétez toutes les étapes.");
        return;
      }
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.propertyType !== "";
      case 2:
        return formData.quarterlyBill !== "";
      case 3:
        return formData.roofArea !== "";
      case 4:
        return formData.region !== "";
      default:
        return false;
    }
  };

  const resetSimulator = () => {
    setStep(1);
    setFormData({
      propertyType: "",
      quarterlyBill: "",
      roofArea: "",
      region: "",
    });
    setResults(null);
  };

  const buildContactQuery = () => {
    if (!results) return "";
    const params = new URLSearchParams({
      source: "simulateur",
      propertyType: formData.propertyType,
      quarterlyBill: formData.quarterlyBill,
      roofArea: formData.roofArea,
      region: formData.region,
      systemSize: String(results.systemSize),
      estimatedCost: String(results.estimatedCost),
      annualSavings: String(results.annualSavings),
      annualProduction: String(results.annualProduction),
      roi: String(results.roi),
    });
    return params.toString();
  };

  if (results) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />

        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
                  Voici votre simulation personnalisée
                </h1>
                <p className="text-lg text-gray-600">
                  Estimation basée sur vos informations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                  <Zap className="w-8 h-8 text-primary mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Puissance recommandée
                  </p>
                  <p className="text-3xl font-bold text-secondary">
                    {results.systemSize} kWc
                  </p>
                </div>

                <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-6 border border-accent/20">
                  <Calculator className="w-8 h-8 text-accent mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Investissement</p>
                  <p className="text-3xl font-bold text-secondary">
                    {results.estimatedCost.toLocaleString()} TND
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                  <TrendingDown className="w-8 h-8 text-primary mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Économies/an</p>
                  <p className="text-3xl font-bold text-secondary">
                    {results.annualSavings.toLocaleString()} TND
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">
                    Production annuelle
                  </p>
                  <p className="text-2xl font-bold text-secondary">
                    {results.annualProduction.toLocaleString()} kWh
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">
                    Retour sur investissement
                  </p>
                  <p className="text-2xl font-bold text-secondary">
                    {results.roi} ans
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <Leaf className="w-6 h-6 text-primary mb-2" />
                  <p className="text-sm text-gray-600 mb-1">CO2 évité/an</p>
                  <p className="text-2xl font-bold text-secondary">
                    {(results.co2Reduction / 1000).toFixed(1)} tonnes
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-secondary mb-2">
                      À propos de cette simulation
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      Cette estimation est basée sur une consommation moyenne et
                      l&apos;ensoleillement de{" "}
                      <strong>
                        {selectedRegion?.label ?? formData.region}
                      </strong>
                      {selectedRegion
                        ? ` (~${selectedRegion.productivityKwhPerKwp} kWh/kWc/an)`
                        : ""}
                      . Le calcul prend en compte :
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1 ml-4">
                      <li>
                        • Productivité régionale de {productivityKwhPerKwp}{" "}
                        kWh/kWc/an
                      </li>
                      <li>
                        • Tarif STEG moyen de 0.18 TND/kWh (progressif selon
                        tranches)
                      </li>
                      <li>• Coût installation moyen de 3,500 TND/kWc TTC</li>
                      <li>
                        • Rendement garanti à 80% après 25 ans (panneaux Tier
                        1)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Passez à l'étape suivante
                </h3>
                <p className="text-white/90 mb-6">
                  Obtenez un devis précis et personnalisé de nos experts sous
                  24h. Visite technique gratuite et sans engagement.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to={`/contact?${buildContactQuery()}`}
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-50 transition-all font-medium group"
                  >
                    Demander un devis personnalisé
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/tarifs"
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary/20 text-white border-2 border-white/40 rounded-lg hover:bg-primary/30 transition-all font-medium"
                  >
                    Voir les offres
                  </Link>
                  <button
                    onClick={resetSimulator}
                    className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg hover:bg-white hover:text-primary transition-all font-medium"
                  >
                    Nouvelle simulation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-5 text-primary text-sm font-medium">
                <Calculator className="w-4 h-4" />
                Simulation rapide et guidée
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
                Simulateur solaire gratuit
              </h1>
              <p className="text-lg text-gray-600">
                Estimez votre installation en 2 minutes
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs text-gray-600">
                <CheckCircle className="w-4 h-4 text-primary" />
                Résultat estimatif, économique et prêt à être partagé
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`flex items-center ${
                      s !== 4 ? "flex-1" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                        s < step
                          ? "bg-primary text-white"
                          : s === step
                            ? "bg-primary text-white ring-4 ring-primary/20"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                    {s !== 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                          s < step ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {showInvoiceModal && (
                <InvoiceUploadModal
                  onClose={() => setShowInvoiceModal(false)}
                  onApply={(data) => {
                    handleInputChange(
                      "quarterlyBill",
                      String(data.quarterlyBill)
                    );
                    setBillInputMode("manual");
                    setShowInvoiceModal(false);
                  }}
                />
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Type</span>
                <span>Facture</span>
                <span>Surface</span>
                <span>Région</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold text-secondary mb-6">
                    Quel type de bien ?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { value: "house", label: "Maison", icon: Home },
                      { value: "commercial", label: "Commerce", icon: Home },
                      { value: "industrial", label: "Industrie", icon: Home },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleInputChange("propertyType", option.value)
                        }
                        className={`p-6 rounded-lg border-2 transition-all ${
                          formData.propertyType === option.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <option.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-secondary">
                          {option.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold text-secondary mb-2">
                    Quelle est votre facture trimestrielle ?
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Indiquez votre consommation STEG pour estimer la taille de
                    l&apos;installation.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setBillInputMode("manual")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        billInputMode === "manual"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-medium text-secondary">Saisir le montant</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Vous connaissez déjà le total trimestriel
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBillInputMode("import");
                        setShowInvoiceModal(true);
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        billInputMode === "import"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-medium text-secondary">Importer facture STEG</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Photo ou PDF — extraction automatique
                      </p>
                    </button>
                  </div>

                  {billInputMode === "manual" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Montant en TND / trimestre
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={formData.quarterlyBill}
                          onChange={(e) =>
                            handleInputChange("quarterlyBill", e.target.value)
                          }
                          placeholder="Ex: 450"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          En Tunisie, la facture STEG est souvent{" "}
                          <strong>trimestrielle</strong>. Utilisez le montant
                          total à payer sur la période.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                      {formData.quarterlyBill ? (
                        <>
                          <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
                          <p className="font-medium text-secondary">
                            Montant retenu : {formData.quarterlyBill} TND /
                            trimestre
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowInvoiceModal(true)}
                            className="mt-3 text-sm text-primary font-medium hover:underline"
                          >
                            Importer une autre facture
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-700 mb-4">
                            Téléversez votre facture pour pré-remplir cette
                            étape.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowInvoiceModal(true)}
                            className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium"
                          >
                            Ouvrir l&apos;import
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold text-secondary mb-6">
                    Quelle surface de toiture disponible ?
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Surface en m²
                      </label>
                      <input
                        type="number"
                        value={formData.roofArea}
                        onChange={(e) =>
                          handleInputChange("roofArea", e.target.value)
                        }
                        placeholder="Ex: 50"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        💡 Info : Environ 7m² sont nécessaires pour installer 1
                        kWc de panneaux solaires.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold text-secondary mb-2">
                    Dans quelle région habitez-vous ?
                  </h2>
                  <p className="text-gray-600 mb-6">
                    L&apos;ensoleillement varie selon la zone — cela influence
                    directement la production estimée.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {SOLAR_REGIONS.map((region) => {
                      const selected = formData.region === region.id;
                      const irr = IRRADIANCE_LABELS[region.irradiance];
                      const barWidth =
                        (region.productivityKwhPerKwp / 1780) * 100;

                      return (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() =>
                            handleInputChange("region", region.id)
                          }
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-medium text-secondary">
                                {region.label}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${irr.bg} ${irr.color}`}
                            >
                              {irr.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                            {region.governorates}
                          </p>
                          <div className="flex items-center gap-2">
                            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-primary rounded-full transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                              {region.productivityKwhPerKwp} kWh/kWc
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedRegion ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
                          <Sun className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary">
                            {selectedRegion.label} —{" "}
                            {selectedRegion.productivityKwhPerKwp} kWh/kWc/an
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedRegion.hint}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            ~{selectedRegion.sunHoursPerDay} h d&apos;ensoleillement
                            moyen / jour
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                      Sélectionnez votre zone pour affiner la simulation
                    </div>
                  )}
                </motion.div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={step === 1}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    step === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-secondary hover:bg-gray-200"
                  }`}
                >
                  Précédent
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    isStepValid()
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {step === 4 ? "Voir les résultats" : "Suivant"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
