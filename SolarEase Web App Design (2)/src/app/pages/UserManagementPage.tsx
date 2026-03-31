import React, { useState } from "react";
import { UserPlus, Trash2, Edit, Shield, User } from "lucide-react";
import { Button } from "../components/Button";
import { AddUserModal } from "../components/AddUserModal";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";

// Mock data - In real app, this would come from backend with company_id filter
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "INSTALLATEUR";
  company_id: string;
  createdAt: string;
  status: "active" | "pending";
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@solarpro.fr",
    role: "ADMIN",
    company_id: "company_1",
    createdAt: "2024-01-15",
    status: "active"
  },
  {
    id: "2",
    firstName: "Marie",
    lastName: "Martin",
    email: "marie.martin@solarpro.fr",
    role: "INSTALLATEUR",
    company_id: "company_1",
    createdAt: "2024-02-01",
    status: "active"
  },
  {
    id: "3",
    firstName: "Pierre",
    lastName: "Bernard",
    email: "pierre.bernard@solarpro.fr",
    role: "INSTALLATEUR",
    company_id: "company_1",
    createdAt: "2024-02-10",
    status: "pending"
  },
  {
    id: "4",
    firstName: "Sophie",
    lastName: "Rousseau",
    email: "sophie.rousseau@solarpro.fr",
    role: "INSTALLATEUR",
    company_id: "company_1",
    createdAt: "2024-02-15",
    status: "active"
  }
];

export function UserManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddUser = (userData: { firstName: string; lastName: string; email: string; role: "ADMIN" | "INSTALLATEUR" }) => {
    const newEmployee: Employee = {
      id: `${Date.now()}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      company_id: "company_1", // Current company
      createdAt: new Date().toISOString().split('T')[0],
      status: "pending"
    };
    setEmployees([...employees, newEmployee]);
    setIsAddModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="ADMIN" />
      <TopBar />

      {/* Main Content */}
      <main className="ml-64 pt-16">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl text-secondary">Gestion des Utilisateurs</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gérez les employés de votre entreprise
                </p>
              </div>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <UserPlus className="w-5 h-5 mr-2" />
                Ajouter un employé
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date d'ajout
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-secondary">
                              {employee.firstName} {employee.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {employee.role === "ADMIN" ? (
                            <>
                              <Shield className="w-4 h-4 text-accent" />
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
                                Administrateur
                              </span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 text-primary" />
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                Installateur
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {employee.status === "active" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(employee.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="text-primary hover:text-[#27AE60] transition-colors p-2"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {employee.role !== "ADMIN" && (
                            <button
                              onClick={() => handleDeleteUser(employee.id)}
                              className="text-destructive hover:text-red-700 transition-colors p-2"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-muted-foreground">
                Total: {employees.length} utilisateur{employees.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUser}
      />
    </div>
  );
}