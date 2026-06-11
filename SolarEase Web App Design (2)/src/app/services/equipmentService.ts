import api from "./api";

export type EquipmentTypeCode =
  | "SOLAR_PANEL"
  | "NIGHT_PANEL"
  | "INVERTER"
  | "BATTERY"
  | "MOUNTING_SYSTEM"
  | "CABLE"
  | "CIRCUIT_BREAKER_DC"
  | "CIRCUIT_BREAKER_AC";

export type PanelCategoryCode = "TOPCON_N_TYPE" | "BIFACIAL" | "GLASS_GLASS";

export interface EquipmentRequest {
  name: string;
  brand: string;
  type: EquipmentTypeCode;
  panelCategory?: PanelCategoryCode;
  nominalPower?: number;
  efficiency?: number;
  price: number;
  warrantyYears?: number;
  specifications?: string;
  imageUrl?: string;
}

export interface EquipmentResponse {
  id: number;
  name: string;
  brand: string;
  model: string;
  type: EquipmentTypeCode;
  panelCategory?: PanelCategoryCode;
  nominalPower: number;
  efficiency: number;
  area: number;
  storageCapacityKwh?: number;
  price: number;
  warrantyYears: number;
  specifications: string;
  imageUrl: string;
}

const equipmentService = {
  getAll: () =>
    api.get<EquipmentResponse[]>("/equipment").then((r) => r.data),

  getByType: (type: string, category?: PanelCategoryCode) =>
    api
      .get<EquipmentResponse[]>(`/equipment/type/${type}`, {
        params: category ? { category } : undefined,
      })
      .then((r) => r.data),

  getById: (id: number) =>
    api.get<EquipmentResponse>(`/equipment/${id}`).then((r) => r.data),

  create: (data: EquipmentRequest) =>
    api.post<EquipmentResponse>("/equipment", data).then((r) => r.data),

  update: (id: number, data: EquipmentRequest) =>
    api.put<EquipmentResponse>(`/equipment/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/equipment/${id}`).then((r) => r.data),

  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post<{ imageUrl: string }>("/equipment/photos", formData)
      .then((r) => r.data);
  },
};

export default equipmentService;
