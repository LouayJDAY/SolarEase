import api from "./api";

export type Document = {
  id: string;
  name: string;
  type: string;
  status: string;
  size: string;
  date: string;
  url?: string;
};

const clientBase = "/clients";
const base = "/documents";

export const getDocuments = async (clientId: string): Promise<Document[]> => {
  try {
    const res = await api.get<Document[]>(`${base}/client/list`);
    return res.data;
  } catch {
    const res = await api.get<Document[]>(`${clientBase}/${clientId}/documents`);
    return res.data;
  }
};

export const getDocumentsByProject = async (projectId: number): Promise<Document[]> => {
  const res = await api.get<Document[]>(`${base}/project/${projectId}`);
  return res.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`${base}/${id}`);
};

export default { getDocuments, getDocumentsByProject, deleteDocument };
