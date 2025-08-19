import { Navbar } from "@/components/layout/Navbar";
import { SerialsTable } from "@/components/tables/SerialsTable";

export function Serials() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Serial Numbers</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600">View all generated serial numbers and their status</p>
        </div>
        <SerialsTable />
      </main>
    </div>
  );
}
