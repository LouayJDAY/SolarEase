const MESSAGE_FR: Record<string, string> = {
  "Email already in use": "Cet email est déjà enregistré pour un autre client.",
  "Email already registered": "Cet email possède déjà un compte SolarEase.",
  "Email already registered as installer": "Cet email est déjà utilisé par un compte installateur. Utilisez une autre adresse pour l'espace client.",
  "Email already registered as admin": "Cet email est déjà utilisé par un compte administrateur.",
  "First name is required": "Le prénom est requis.",
  "Last name is required": "Le nom est requis.",
  "Email is required": "L'email est requis.",
  "Invalid email format": "Veuillez saisir un email valide.",
  "First name must be between 2 and 50 characters": "Le prénom doit contenir entre 2 et 50 caractères.",
  "Last name must be between 2 and 50 characters": "Le nom doit contenir entre 2 et 50 caractères.",
  "Project name is required": "Le nom du projet est requis.",
  "Client ID is required": "Le client est requis.",
  "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères.",
  "Validation failed": "Certaines informations saisies sont invalides.",
  "Validation Failed": "Certaines informations saisies sont invalides.",
};

const FIELD_LABEL_FR: Record<string, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  email: "Email",
  phoneNumber: "Téléphone",
  password: "Mot de passe",
  confirmPassword: "Confirmation",
  name: "Nom",
  clientId: "Client",
  area: "Surface",
  inclination: "Inclinaison",
  latitude: "Latitude",
  longitude: "Longitude",
};

function translateMessage(msg: string): string {
  return MESSAGE_FR[msg] ?? msg;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

export function getApiErrorMessage(err: unknown, fallback = "Une erreur est survenue."): string {
  const res = (err as { response?: { data?: ApiErrorBody } })?.response?.data;
  if (!res) {
    return err instanceof Error && err.message ? err.message : fallback;
  }

  if (res.message) {
    return translateMessage(res.message);
  }

  if (res.fields && Object.keys(res.fields).length > 0) {
    return Object.entries(res.fields)
      .map(([field, msg]) => {
        const label = FIELD_LABEL_FR[field] ?? field;
        return `${label} : ${translateMessage(msg)}`;
      })
      .join(" ");
  }

  if (res.error) {
    return translateMessage(res.error);
  }

  return fallback;
}

export function getApiFieldErrors(err: unknown): Record<string, string> {
  const fields = (err as { response?: { data?: ApiErrorBody } })?.response?.data?.fields;
  if (!fields) return {};
  const out: Record<string, string> = {};
  for (const [key, msg] of Object.entries(fields)) {
    out[key] = translateMessage(msg);
  }
  return out;
}
