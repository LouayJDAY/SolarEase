import type { ClientRequest } from "../services/clientService";

export interface ClientFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  clientType?: string;
  notes?: string;
}

export function buildClientAddress(form: Pick<ClientFormValues, "address" | "city" | "postalCode">): string | undefined {
  const parts = [form.address?.trim(), form.city?.trim(), form.postalCode?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : form.address?.trim() || undefined;
}

export function toClientRequest(form: ClientFormValues): ClientRequest {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phoneNumber: form.phone?.trim() || undefined,
    address: buildClientAddress(form),
    city: form.city?.trim() || undefined,
    postalCode: form.postalCode?.trim() || undefined,
    clientType: form.clientType?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
  };
}

export interface ProjectFormValues {
  name: string;
  clientId: number | string;
  description?: string;
  location?: string;
  latitude?: number | string;
  longitude?: number | string;
  availableArea?: number | string;
  inclination?: number | string;
  orientation?: number | string;
  budget?: number | string;
}

export function toProjectRequest(form: ProjectFormValues) {
  const clientId = typeof form.clientId === "string" ? parseInt(form.clientId, 10) : form.clientId;
  const num = (v: number | string | undefined) => {
    if (v === undefined || v === "") return undefined;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isNaN(n) ? undefined : n;
  };
  return {
    name: form.name.trim(),
    clientId,
    description: form.description?.trim() || undefined,
    location: form.location?.trim() || undefined,
    latitude: num(form.latitude),
    longitude: num(form.longitude),
    availableArea: num(form.availableArea),
    inclination: num(form.inclination),
    orientation: num(form.orientation),
    budget: num(form.budget),
  };
}
