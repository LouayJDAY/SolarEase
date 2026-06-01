import api from "./api";

export type Invoice = {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
};

export type InvoicePage = {
  content: Invoice[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const clientBase = "/clients";
const base = "/invoices";

export const getInvoices = async (clientId: string): Promise<Invoice[]> => {
  try {
    const res = await api.get<InvoicePage>(`${base}/client/list`);
    return res.data.content;
  } catch {
    const res = await api.get<Invoice[]>(`${clientBase}/${clientId}/invoices`);
    return res.data;
  }
};

export const getInvoicesByProject = async (projectId: number): Promise<Invoice[]> => {
  const res = await api.get<Invoice[]>(`${base}/project/${projectId}`);
  return res.data;
};

export default { getInvoices, getInvoicesByProject };
