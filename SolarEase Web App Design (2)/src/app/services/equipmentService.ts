import api from "./api";

export interface EquipmentRequest {
  name: string;
  brand: string;
  type: "SOLAR_PANEL" | "NIGHT_PANEL" | "INVERTER" | "BATTERY" | "MOUNTING_SYSTEM" | "CABLE";
  power?: string;
  efficiency?: string;
  price: number;
  warranty?: string;
  description?: string;
}

export interface EquipmentResponse {
  id: number;
  name: string;
  brand: string;
  model: string;
  type: "SOLAR_PANEL" | "NIGHT_PANEL" | "INVERTER" | "BATTERY" | "MOUNTING_SYSTEM" | "CABLE";
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

  getByType: (type: string) =>
    api.get<EquipmentResponse[]>(`/equipment/type/${type}`).then((r) => r.data),

  getById: (id: number) =>
    api.get<EquipmentResponse>(`/equipment/${id}`).then((r) => r.data),

  create: (data: EquipmentRequest) =>
    api.post<EquipmentResponse>("/equipment", data).then((r) => r.data),

  update: (id: number, data: EquipmentRequest) =>
    api.put<EquipmentResponse>(`/equipment/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/equipment/${id}`).then((r) => r.data),
};

export default equipmentService;
