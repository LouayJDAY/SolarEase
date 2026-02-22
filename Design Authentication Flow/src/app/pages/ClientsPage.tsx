import { useState, useEffect } from "react";
import { Plus, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ClientService, ProjectService } from "../services/api";
import { Client, Project } from "../data/mockData";

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, projectsData] = await Promise.all([
          ClientService.getAllClients(),
          ProjectService.getAllProjects()
        ]);
        setClients(clientsData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Failed to fetch clients", error);
      }
    };
    fetchData();
  }, []);

  const getProjectCountByClientId = (clientId: string | number) => {
    return projects.filter((p) => String(p.clientId) === String(clientId)).length;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-emerald-600",
      "bg-amber-500",
      "bg-blue-600",
      "bg-purple-600",
      "bg-pink-600",
    ];
    const index = parseInt(id, 10) % colors.length;
    return colors[index];
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Client Management</h1>
            <p className="text-slate-600">
              Manage your client information and contacts
            </p>
          </div>
          <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold text-slate-700">
                  Client Name
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Email Address
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Phone Number
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Address
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">
                  Projects
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const projectCount = getProjectCountByClientId(client.id);
                return (
                  <TableRow
                    key={client.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Client Name with Avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getAvatarColor(
                            client.id
                          )}`}
                        >
                          <span className="text-sm">
                            {getInitials(client.firstName, client.lastName)}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-900">
                            {client.firstName} {client.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">{client.email}</span>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    </TableCell>

                    {/* Address */}
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">{client.address}</span>
                      </div>
                    </TableCell>

                    {/* Projects Count */}
                    <TableCell>
                      <div className="flex justify-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span className="text-sm">{projectCount}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Clients</p>
                <p className="text-2xl text-slate-900">{clients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Projects</p>
                <p className="text-2xl text-slate-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg. Projects/Client</p>
                <p className="text-2xl text-slate-900">1.2</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
