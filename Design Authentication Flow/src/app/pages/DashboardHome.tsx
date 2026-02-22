import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar
} from "lucide-react";
import { ProjectService, ClientService } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { Project, Client } from "../data/mockData";

export function DashboardHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsData, clientsData] = await Promise.all([
        ProjectService.getAllProjects(),
        ClientService.getAllClients()
      ]);
      setProjects(projectsData);
      setClients(clientsData);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;
  const totalClients = clients.length;

  const recentProjects = projects.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-slate-900 mb-2">
            Welcome back, John! 👋
          </h1>
          <p className="text-slate-600">
            Here's what's happening with your solar projects today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Projects */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-emerald-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Projects</p>
            <p className="text-3xl text-slate-900">{totalProjects}</p>
            <p className="text-xs text-emerald-600 mt-2">+2 this month</p>
          </div>

          {/* Active Projects */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">In Progress</p>
            <p className="text-3xl text-slate-900">{activeProjects}</p>
            <p className="text-xs text-slate-600 mt-2">Requires attention</p>
          </div>

          {/* Completed Projects */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Completed</p>
            <p className="text-3xl text-slate-900">{completedProjects}</p>
            <p className="text-xs text-green-600 mt-2">+1 this week</p>
          </div>

          {/* Total Clients */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Clients</p>
            <p className="text-3xl text-slate-900">{totalClients}</p>
            <p className="text-xs text-slate-600 mt-2">Active clients</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-slate-900">Recent Projects</h2>
            <a href="/dashboard/projects" className="text-sm text-emerald-600 hover:text-emerald-700">
              View All
            </a>
          </div>

          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="flex-1">
                  <h3 className="text-slate-900 mb-1">{project.title}</h3>
                  <p className="text-sm text-slate-600">{project.location}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
