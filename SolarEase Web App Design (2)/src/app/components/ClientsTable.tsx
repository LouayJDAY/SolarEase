import React from "react";
import { MoreVertical, Edit, Trash2, Eye, User } from "lucide-react";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  projectCount: number;
  addedDate: string;
  avatar?: string;
  avatarColor?: string;
}

interface ClientsTableProps {
  clients: Client[];
  onClientClick?: (client: Client) => void;
}

export function ClientsTable({ clients, onClientClick }: ClientsTableProps) {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getAvatarColor = (color?: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-100 text-green-700",
      blue: "bg-blue-100 text-blue-700",
      orange: "bg-orange-100 text-orange-700",
      purple: "bg-purple-100 text-purple-700",
      red: "bg-red-100 text-red-700",
      teal: "bg-teal-100 text-teal-700",
    };
    return colors[color || "green"] || colors.green;
  };

  const getProjectBadgeStyle = (count: number) => {
    if (count === 1) {
      return "bg-gray-100 text-gray-700";
    }
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Client
        </div>
        <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Email
        </div>
        <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Téléphone
        </div>
        <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Adresse
        </div>
        <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Projets
        </div>
        <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Ajouté le
        </div>
        <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
          Actions
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {clients.map((client) => (
          <div
            key={client.id}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
            onClick={() => onClientClick?.(client)}
          >
            {/* Client Name with Avatar */}
            <div className="col-span-2 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${getAvatarColor(
                  client.avatarColor
                )}`}
              >
                {client.avatar || getInitials(client.firstName, client.lastName)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-secondary truncate">
                  {client.firstName} {client.lastName}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-secondary truncate">{client.email}</p>
            </div>

            {/* Phone */}
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-secondary">{client.phone}</p>
            </div>

            {/* Address */}
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-secondary truncate">{client.address}</p>
            </div>

            {/* Project Count */}
            <div className="col-span-1 flex items-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getProjectBadgeStyle(
                  client.projectCount
                )}`}
              >
                {client.projectCount} projet{client.projectCount > 1 ? "s" : ""}
              </span>
            </div>

            {/* Added Date */}
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-secondary">{client.addedDate}</p>
            </div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-center">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === client.id ? null : client.id);
                  }}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Dropdown Menu */}
                {openMenuId === client.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClientClick?.(client);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Voir le profil
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Edit", client.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Delete", client.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {clients.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-secondary font-medium">Aucun client trouvé</p>
          <p className="text-muted-foreground text-sm mt-1">
            Essayez de modifier vos filtres ou créez un nouveau client
          </p>
        </div>
      )}
    </div>
  );
}