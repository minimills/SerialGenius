import { Navbar } from "@/components/layout/Navbar";
import { PanelsTable } from "@/components/tables/PanelsTable";

export function Panels() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Panels</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600">Manage your panels and sub-components</p>
        </div>
        <PanelsTable />
      </main>
    </div>
  );
}
