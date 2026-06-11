import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Mail, MapPin, Phone } from "lucide-react";
import {
  clientCreateSchema,
  type ClientCreateFormValues,
} from "../validation/clientSchemas";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientCreateFormValues) => Promise<boolean | void> | boolean | void;
}

const tunisianCities = [
  "Tunis",
  "Sousse",
  "Sfax",
  "Nabeul",
  "Hammamet",
  "Kairouan",
  "Bizerte",
  "Gabès",
  "Ariana",
  "Monastir",
];

const defaultValues: ClientCreateFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "+216 ",
  address: "",
  city: "Tunis",
  postalCode: "",
  clientType: "Particulier",
  notes: "",
};

export function NewClientModal({
  isOpen,
  onClose,
  onSubmit,
}: NewClientModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientCreateFormValues>({
    resolver: zodResolver(clientCreateSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (isOpen) {
      setSubmitError("");
      reset(defaultValues);
    }
  }, [isOpen, reset]);

  const onFormSubmit = handleSubmit(async (data) => {
    setSubmitError("");
    try {
      setIsSubmitting(true);
      const result = await onSubmit(data);
      if (result === false) {
        setSubmitError("Impossible d'ajouter le client. Veuillez réessayer.");
        return;
      }
      onClose();
      reset(defaultValues);
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "Impossible d'ajouter le client. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
          <h2 className="text-xl font-semibold text-secondary">Nouveau Client</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={onFormSubmit} className="p-6 space-y-5">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("firstName")}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.firstName ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="Ahmed"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("lastName")}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.lastName ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="Ben Ali"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                {...register("email")}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.email ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="ahmed.benali@email.tn"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  {...register("phone")}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="+216 98 123 456"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Type</label>
              <select
                {...register("clientType")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="Particulier">Particulier</option>
                <option value="Entreprise">Entreprise</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                {...register("address")}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="12 Rue de Carthage"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Ville</label>
              <select
                {...register("city")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                {tunisianCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Code postal</label>
              <input
                type="text"
                {...register("postalCode")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="1000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Notes</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary resize-none"
              placeholder="Notes ou remarques sur le client..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 text-secondary rounded-lg hover:bg-gray-50 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium disabled:opacity-60"
            >
              {isSubmitting ? "Ajout en cours..." : "Ajouter le client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
