import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Mail, MapPin, Phone } from "lucide-react";
import { Client } from "./ClientsTable";
import { clientUpdateSchema, type ClientCreateFormValues } from "../validation/clientSchemas";

interface EditClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSubmit: (id: number, data: ClientCreateFormValues) => Promise<boolean | void>;
}

export function EditClientModal({
  isOpen,
  client,
  onClose,
  onSubmit,
}: EditClientModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientCreateFormValues>({
    resolver: zodResolver(clientUpdateSchema),
  });

  React.useEffect(() => {
    if (!isOpen || !client) return;
    reset({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone || "",
      address: client.address || "",
      city: "",
      postalCode: "",
      clientType: "Particulier",
      notes: "",
    });
    setSubmitError("");
  }, [isOpen, client, reset]);

  const onFormSubmit = handleSubmit(async (data) => {
    if (!client?.clientProfileId) {
      setSubmitError("Ce client n'a pas de fiche modifiable.");
      return;
    }
    try {
      setIsSubmitting(true);
      setSubmitError("");
      const result = await onSubmit(client.clientProfileId, data);
      if (result === false) {
        setSubmitError("Impossible de modifier le client.");
        return;
      }
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "Impossible de modifier le client."
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-secondary">Modifier le client</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={onFormSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prénom *</label>
              <input
                {...register("firstName")}
                className={`w-full px-3 py-2 border rounded-lg ${errors.firstName ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <input
                {...register("lastName")}
                className={`w-full px-3 py-2 border rounded-lg ${errors.lastName ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                {...register("email")}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg ${errors.email ? "border-red-400" : "border-gray-300"}`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                {...register("phone")}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                {...register("address")}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-60"
            >
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
