import React from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { QuoteDetailContent } from "../components/QuoteDetailContent";

export function QuoteDetailPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <QuoteDetailContent variant="installer" />
      </main>
    </div>
  );
}
