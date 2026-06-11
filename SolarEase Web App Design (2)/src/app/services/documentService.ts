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

async function fetchDocumentBlob(id: string, attachment: boolean): Promise<Blob> {
  const res = await api.get(`${base}/${id}/download`, {
    params: { attachment },
    responseType: "blob",
  });
  return res.data as Blob;
}

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

export const openDocument = async (id: string): Promise<void> => {
  const blob = await fetchDocumentBlob(id, false);
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};

export const downloadDocument = async (id: string, filename?: string): Promise<void> => {
  const blob = await fetchDocumentBlob(id, true);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename ? `${filename}.pdf` : `document-${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const shareDocument = async (doc: Document): Promise<"shared" | "copied"> => {
  const shareData = {
    title: doc.name,
    text: `Document SolarEase : ${doc.name}`,
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share(shareData);
    return "shared";
  }

  const text = `${doc.name} — consultez ce document dans votre espace client SolarEase.`;
  await navigator.clipboard.writeText(text);
  return "copied";
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`${base}/${id}`);
};

export default {
  getDocuments,
  getDocumentsByProject,
  openDocument,
  downloadDocument,
  shareDocument,
  deleteDocument,
};
