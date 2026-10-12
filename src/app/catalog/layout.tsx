import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import CatalogNavbar from "./CatalogNavbar";

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
      <CatalogNavbar user={session?.user} />
      <main className="pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
