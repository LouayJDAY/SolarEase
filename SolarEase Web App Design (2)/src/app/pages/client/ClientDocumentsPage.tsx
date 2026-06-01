import React, { useEffect, useState } from "react";
import { DocumentCard, DocumentType, DocumentStatus } from "../../components/client/DocumentCard";
import { FileText, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import documentService from "../../services/documentService";
import { useAuth } from "../../context/AuthContext";

export function ClientDocumentsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const data = await documentService.getDocuments(user.userId);
        setDocuments(data.map((d) => ({ ...d, date: new Date(d.date).toLocaleDateString() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Mes documents</h1>
        <p className="text-gray-600">Tous vos documents liés à vos projets solaires</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un document..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white">
              <option value="all">Tous les documents</option>
              <option value="DEVIS">Devis</option>
              <option value="FACTURE">Factures</option>
              <option value="CERTIFICAT">Certificats</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <DocumentCard
            key={doc.id}
            id={doc.id}
            name={doc.name}
            type={doc.type as DocumentType}
            status={doc.status as DocumentStatus}
            date={doc.date}
            size={doc.size}
            onView={() => toast.info("Ouverture du document...")}
            onDownload={() => toast.success("Téléchargement en cours...")}
            onShare={() => toast.info("Fonctionnalité de partage à venir")}
          />
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary mb-2">Aucun document trouvé</h3>
        </div>
      )}
    </div>
  );
}
