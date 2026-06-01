import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function ClientPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: ClientPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === i
              ? "bg-primary text-white"
              : "text-secondary hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 rounded-b-lg">
      {/* Left: Items count */}
      <p className="text-sm text-muted-foreground">
        Affichage {startItem}-{endItem} sur {totalItems} clients
      </p>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-lg transition-colors ${
            currentPage === 1
              ? "text-muted-foreground cursor-not-allowed opacity-50"
              : "text-secondary hover:bg-gray-100"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded-lg transition-colors ${
            currentPage === totalPages
              ? "text-muted-foreground cursor-not-allowed opacity-50"
              : "text-secondary hover:bg-gray-100"
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
