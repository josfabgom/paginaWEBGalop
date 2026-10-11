import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function CatalogAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple navbar for catalog admin */}
      <div className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
         <div className="font-bold text-xl">GaLop S.R.L.</div>
         <div className="text-sm text-slate-300">Sesión iniciada como Admin</div>
      </div>
      <main className="pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
