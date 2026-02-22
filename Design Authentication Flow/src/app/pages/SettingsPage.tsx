import { DashboardLayout } from "../components/DashboardLayout";
import { User, Bell, Lock, Palette } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";

export function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-xl text-slate-900">Profile Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input defaultValue="John" className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input defaultValue="Doe" className="rounded-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  defaultValue="john.doe@solarease.com"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  defaultValue="+1 (555) 000-0000"
                  className="rounded-lg"
                />
              </div>
              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg">
                Save Changes
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-xl text-slate-900">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900">Email Notifications</p>
                  <p className="text-sm text-slate-600">
                    Receive email updates about your projects
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900">Project Updates</p>
                  <p className="text-sm text-slate-600">
                    Get notified when project status changes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900">Client Messages</p>
                  <p className="text-sm text-slate-600">
                    Receive notifications for client communications
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl text-slate-900">Security</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" className="rounded-lg" />
              </div>
              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg">
                Update Password
              </Button>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Palette className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl text-slate-900">Appearance</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900">Dark Mode</p>
                  <p className="text-sm text-slate-600">
                    Use dark theme across the application
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
