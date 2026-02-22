export type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  clientId: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
}

export const mockClients: Client[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Oak Street, San Francisco, CA 94102",
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@techcorp.com",
    phone: "+1 (555) 234-5678",
    address: "456 Pine Avenue, Austin, TX 78701",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@greentech.io",
    phone: "+1 (555) 345-6789",
    address: "789 Maple Drive, Seattle, WA 98101",
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "emily.r@sustainability.org",
    phone: "+1 (555) 456-7890",
    address: "321 Cedar Lane, Portland, OR 97201",
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Williams",
    email: "d.williams@ecohomes.com",
    phone: "+1 (555) 567-8901",
    address: "654 Birch Road, Denver, CO 80201",
  },
];

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "Residential Solar Installation - Smith Residence",
    description: "Complete solar panel installation for a 3-bedroom home with 15kW capacity",
    location: "San Francisco, CA",
    clientId: "1",
    status: "IN_PROGRESS",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    title: "Commercial Solar Array - TechCorp HQ",
    description: "Large-scale solar array for corporate headquarters, 500kW capacity",
    location: "Austin, TX",
    clientId: "2",
    status: "PLANNED",
    createdAt: "2026-02-01",
  },
  {
    id: "3",
    title: "Community Solar Farm - GreenTech",
    description: "Community solar project with battery storage system",
    location: "Seattle, WA",
    clientId: "3",
    status: "COMPLETED",
    createdAt: "2025-11-20",
  },
  {
    id: "4",
    title: "Non-Profit Solar Initiative",
    description: "Solar installation for sustainability education center",
    location: "Portland, OR",
    clientId: "4",
    status: "IN_PROGRESS",
    createdAt: "2026-01-28",
  },
  {
    id: "5",
    title: "Eco-Friendly Housing Development",
    description: "Solar panels for 20-unit residential development",
    location: "Denver, CO",
    clientId: "5",
    status: "PLANNED",
    createdAt: "2026-02-10",
  },
  {
    id: "6",
    title: "Retrofit Project - Old Mill Building",
    description: "Solar retrofit for historic building conversion",
    location: "San Francisco, CA",
    clientId: "1",
    status: "CANCELLED",
    createdAt: "2025-12-05",
  },
];

export function getClientById(clientId: string): Client | undefined {
  return mockClients.find((client) => client.id === clientId);
}

export function getProjectsByClientId(clientId: string): Project[] {
  return mockProjects.filter((project) => project.clientId === clientId);
}

export function getProjectCountByClientId(clientId: string): number {
  return mockProjects.filter((project) => project.clientId === clientId).length;
}
