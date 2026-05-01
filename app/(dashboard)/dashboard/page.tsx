import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generations } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { BarChart3, CheckCircle2, Clock, Film, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userGenerations = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, session.user.id))
    .orderBy(desc(generations.createdAt))
    .limit(10);

  const totalGenerations = userGenerations.length;
  const completedGenerations = userGenerations.filter((g) => g.status === "completed").length;
  const processingGenerations = userGenerations.filter((g) => g.status === "processing").length;

  const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "processing" | "destructive" }> = {
    pending: { label: "En attente", variant: "warning" },
    processing: { label: "En cours", variant: "processing" },
    completed: { label: "Terminé", variant: "success" },
    failed: { label: "Échoué", variant: "destructive" },
  };

  const stats = [
    {
      label: "Total générations",
      value: totalGenerations,
      icon: Film,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-primary",
      textColor: "text-black",
    },
    {
      label: "Terminées",
      value: completedGenerations,
      icon: CheckCircle2,
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-accent",
      textColor: "text-black",
    },
    {
      label: "En cours",
      value: processingGenerations,
      icon: Clock,
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-blue-300",
      textColor: "text-black",
    },
    {
      label: "Échouées",
      value: userGenerations.filter((g) => g.status === "failed").length,
      icon: BarChart3,
      color: "from-rose-500 to-red-600",
      bgColor: "bg-destructive",
      textColor: "text-black",
    },
  ];

  return (
    <div className="space-y-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-wider">Dashboard</h1>
          <p className="text-gray-600 font-bold mt-3 text-lg">Vue d&apos;ensemble de vos générations</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-accent border-[3px] border-black comic-shadow">
          <TrendingUp className="w-5 h-5 text-black" strokeWidth={2.5} />
          <span className="text-sm font-black uppercase text-black">
            {totalGenerations > 0 ? `${Math.round((completedGenerations / totalGenerations) * 100)}% succès` : "Aucune donnée"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <CardTitle className="text-sm font-black uppercase tracking-wide text-black">{stat.label}</CardTitle>
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg border-[3px] border-black ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} strokeWidth={2.5} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-4xl font-black ${stat.textColor}`}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-8">
          <CardTitle className="text-2xl font-black uppercase text-black tracking-wider">Dernières générations</CardTitle>
        </CardHeader>
        <CardContent>
          {userGenerations.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary border-[3px] border-black comic-shadow mb-8">
                <Film className="w-12 h-12 text-black" strokeWidth={2.5} />
              </div>
              <p className="text-black font-black uppercase text-xl">Aucune génération pour le moment</p>
              <p className="text-gray-600 font-bold mt-4 text-lg">Commencez par créer votre première vidéo LipSync</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[3px] border-black">
                    <th className="text-left text-xs font-black text-black uppercase tracking-wider px-8 py-6">Mode</th>
                    <th className="text-left text-xs font-black text-black uppercase tracking-wider px-8 py-6">Statut</th>
                    <th className="text-left text-xs font-black text-black uppercase tracking-wider px-8 py-6">Date</th>
                    <th className="text-left text-xs font-black text-black uppercase tracking-wider px-8 py-6">Video ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y-[3px] divide-black">
                  {userGenerations.map((gen) => {
                    const config = statusConfig[gen.status] || { label: gen.status, variant: "warning" as const };
                    return (
                      <tr key={gen.id} className="hover:bg-secondary transition-colors duration-200">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary border-[3px] border-black comic-shadow hover:-translate-y-1 transition-transform">
                              <Film className="w-6 h-6 text-black" strokeWidth={2.5} />
                            </div>
                            <span className="text-base text-black font-black uppercase">
                              {gen.mode === "avatar" ? "Avatar ID" : "Upload Image"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </td>
                        <td className="px-8 py-6 text-base font-bold text-gray-800">
                          {gen.createdAt ? formatDate(gen.createdAt) : "-"}
                        </td>
                        <td className="px-8 py-6 text-base text-gray-600 font-bold font-mono">
                          {gen.videoId ? `${gen.videoId.slice(0, 12)}...` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
