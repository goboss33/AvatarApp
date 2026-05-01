import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 relative overflow-hidden font-sans text-black">
      <Sidebar user={session.user} />
      <main className="flex-1 min-w-0 relative z-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8 md:p-12 lg:p-16">{children}</div>
      </main>
    </div>
  );
}
