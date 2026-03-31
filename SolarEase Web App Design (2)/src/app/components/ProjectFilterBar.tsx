import React from "react";
import { Grid, List, ChevronDown } from "lucide-react";

export type ProjectStatus = "all" | "draft" | "inProgress" | "completed" | "cancelled";
export type SortOption = "date" | "name" | "client";
export type ViewMode = "table" | "grid";

interface ProjectFilterBarProps {
  activeStatus: ProjectStatus;
  onStatusChange: (status: ProjectStatus) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const statusTabs: { value: ProjectStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "draft", label: "Créé" },
  { value: "inProgress", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
];

export function ProjectFilterBar({
  activeStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: ProjectFilterBarProps) {
  const [showSortMenu, setShowSortMenu] = React.useState(false);

  const sortOptions = [
    { value: "date" as SortOption, label: "Date de création" },
    { value: "name" as SortOption, label: "Nom du projet" },
    { value: "client" as SortOption, label: "Client" },
  ];

  const getSortLabel = () => {
    return sortOptions.find((opt) => opt.value === sortBy)?.label || "Date de création";
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Status Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeStatus === tab.value
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-3">
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-secondary hover:bg-gray-50 transition-colors"
          >
            <span className="text-muted-foreground">Trier par:</span>
            <span className="font-medium">{getSortLabel()}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showSortMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                      sortBy === option.value
                        ? "text-primary font-medium"
                        : "text-secondary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => onViewModeChange("table")}
            className={`p-2 rounded transition-colors ${
              viewMode === "table"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-secondary"
            }`}
            title="Vue tableau"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-secondary"
            }`}
            title="Vue grille"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
