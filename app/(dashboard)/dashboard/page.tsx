import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generations } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { BarChart3, CheckCircle2, Clock, Film } from "lucide-react";

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Vue d&apos;ensemble de vos générations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total générations</CardTitle>
            <Film className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalGenerations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Terminées</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedGenerations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">En cours</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processingGenerations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Échouées</CardTitle>
            <BarChart3 className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {userGenerations.filter((g) => g.status === "failed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dernières générations</CardTitle>
        </CardHeader>
        <CardContent>
          {userGenerations.length === 0 ? (
            <div className="text-center py-12">
              <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune génération pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">Commencez par créer votre première vidéo LipSync</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Mode</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Video ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {userGenerations.map((gen) => {
                    const config = statusConfig[gen.status] || { label: gen.status, variant: "warning" as const };
                    return (
                      <tr key={gen.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {gen.mode === "avatar" ? "Avatar ID" : "Upload Image"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {gen.createdAt ? formatDate(gen.createdAt) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 font-mono">
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
