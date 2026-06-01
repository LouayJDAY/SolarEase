export interface CompanySettings {
  companyName: string;
  taxId: string;
  website: string;
  hqAddress: string;
  city: string;
  postalCode: string;
  emailSignature: string;
  currency: "TND" | "EUR" | "USD";
  defaultVat: number;
  powerUnit: "kWc" | "Wc" | "MWc";
}

export interface PreferencesSettings {
  language: "fr" | "en";
  theme: "light";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  numberFormat: "1 234,56" | "1,234.56";
  dashboardView: "map-projects" | "charts-only" | "kpi-actions";
  defaultTilt: number;
  defaultLoss: number;
  defaultElectricityPrice: number;
  aiRecommendation: boolean;
}

export interface NotificationSettings {
  channels: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  events: {
    newProject: boolean;
    dimDone: boolean;
    pdfReady: boolean;
    quoteExpiring: boolean;
    inactiveClient: boolean;
  };
}

export interface IntegrationSettings {
  aiProvider: "ollama" | "mistral";
  mistralApiKey: string;
}

const defaults = {
  company: {
    companyName: "SolarEase Installations",
    taxId: "",
    website: "",
    hqAddress: "",
    city: "Tunis",
    postalCode: "1000",
    emailSignature: "",
    currency: "TND",
    defaultVat: 19,
    powerUnit: "kWc",
  } as CompanySettings,
  preferences: {
    language: "fr",
    theme: "light",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    dashboardView: "map-projects",
    defaultTilt: 30,
    defaultLoss: 14,
    defaultElectricityPrice: 0.28,
    aiRecommendation: true,
  } as PreferencesSettings,
  notifications: {
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    events: {
      newProject: true,
      dimDone: true,
      pdfReady: false,
      quoteExpiring: true,
      inactiveClient: false,
    },
  } as NotificationSettings,
  integrations: {
    aiProvider: "ollama",
    mistralApiKey: "",
  } as IntegrationSettings,
};

function storageKey(userId: string, section: string): string {
  return `se:settings:${userId}:${section}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const settingsService = {
  getCompanySettings(userId: string): CompanySettings {
    return read(storageKey(userId, "company"), defaults.company);
  },

  saveCompanySettings(userId: string, value: CompanySettings): void {
    write(storageKey(userId, "company"), value);
  },

  getPreferencesSettings(userId: string): PreferencesSettings {
    return read(storageKey(userId, "preferences"), defaults.preferences);
  },

  savePreferencesSettings(userId: string, value: PreferencesSettings): void {
    write(storageKey(userId, "preferences"), value);
  },

  getNotificationSettings(userId: string): NotificationSettings {
    return read(storageKey(userId, "notifications"), defaults.notifications);
  },

  saveNotificationSettings(userId: string, value: NotificationSettings): void {
    write(storageKey(userId, "notifications"), value);
  },

  getIntegrationSettings(userId: string): IntegrationSettings {
    return read(storageKey(userId, "integrations"), defaults.integrations);
  },

  saveIntegrationSettings(userId: string, value: IntegrationSettings): void {
    write(storageKey(userId, "integrations"), value);
  },

  saveTimestamp(userId: string): void {
    localStorage.setItem(storageKey(userId, "lastSavedAt"), new Date().toISOString());
  },

  getLastSavedAt(userId: string): string | null {
    return localStorage.getItem(storageKey(userId, "lastSavedAt"));
  },
};

export default settingsService;
