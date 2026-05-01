"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Film,
  TrendingUp,
  RefreshCw,
  Download,
  Copy,
  X,
  Play,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Generation {
  id: string;
  mode: string;
  avatarId: string | null;
  videoId: string | null;
  videoUrl: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

// ─── Video Modal ───────────────────────────────────────────────────────────────

function VideoModal({ gen, onClose }: { gen: Generation; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!gen.videoUrl) return;
    try {
      const res = await fetch(gen.videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avatar-${gen.videoId?.slice(0, 8) ?? "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(gen.videoUrl!, "_blank");
    }
  };

  const handleCopy = async () => {
    if (!gen.videoUrl) return;
    await navigator.clipboard.writeText(gen.videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white border-[4px] border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black bg-accent">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-black" strokeWidth={3} />
            <h2 className="font-black text-black uppercase tracking-wider text-lg">
              {gen.mode === "avatar" ? "Avatar ID" : "Upload Image"} — Vidéo générée
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border-[3px] border-black bg-white flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0.5 transition-transform comic-shadow"
          >
            <X className="w-4 h-4 text-black" strokeWidth={3} />
          </button>
        </div>

        {/* Video */}
        <div className="p-6 space-y-5">
          <div className="aspect-video bg-black rounded-xl overflow-hidden border-[3px] border-black">
            {gen.videoUrl ? (
              <video src={gen.videoUrl} controls className="w-full h-full" autoPlay />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white font-bold">Pas d&apos;URL vidéo disponible</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm font-bold text-gray-700">
            <div>
              <span className="text-xs font-black uppercase text-black">Video ID</span>
              <p className="font-mono mt-0.5 truncate">{gen.videoId ?? "—"}</p>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-black">Terminée le</span>
              <p className="mt-0.5">{gen.completedAt ? formatDate(new Date(gen.completedAt)) : "—"}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleDownload} disabled={!gen.videoUrl} className="flex-1 h-12 rounded-xl text-sm">
              <Download className="w-4 h-4 text-black" strokeWidth={2.5} />
              <span className="text-black">Télécharger</span>
            </Button>
            <Button variant="outline" onClick={handleCopy} disabled={!gen.videoUrl} className="flex-1 h-12 rounded-xl text-sm">
              {copied ? (
                <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <Copy className="w-4 h-4" strokeWidth={2.5} />
              )}
              {copied ? "Copié !" : "Copier URL"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "processing" | "destructive" }> = {
  pending:    { label: "En attente", variant: "warning" },
  processing: { label: "En cours",   variant: "processing" },
  completed:  { label: "Terminé",    variant: "success" },
  failed:     { label: "Échoué",     variant: "destructive" },
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);

  // Fetch latest list from DB
  const fetchGenerations = useCallback(async () => {
    try {
      const res = await fetch("/api/generations");
      if (!res.ok) return;
      const data: Generation[] = await res.json();
      setGenerations(data);
    } catch { /* ignore */ }
  }, []);

  // Sync processing jobs with HeyGen, then refresh list
  const syncProcessing = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/generations/sync", { method: "POST" });
      await fetchGenerations();
    } finally {
      setSyncing(false);
    }
  }, [fetchGenerations]);

  // On mount: fetch + sync
  useEffect(() => {
    fetchGenerations();
    syncProcessing();
  }, [fetchGenerations, syncProcessing]);

  // Auto-poll every 10s while there are processing jobs
  useEffect(() => {
    const hasProcessing = generations.some(
      (g) => g.status === "processing" || g.status === "pending"
    );
    if (!hasProcessing) return;

    const interval = setInterval(syncProcessing, 10_000);
    return () => clearInterval(interval);
  }, [generations, syncProcessing]);

  // ─── Derived stats ──────────────────────────────────────────────────────────

  const total      = generations.length;
  const completed  = generations.filter((g) => g.status === "completed").length;
  const processing = generations.filter((g) => g.status === "processing" || g.status === "pending").length;
  const failed     = generations.filter((g) => g.status === "failed").length;

  const stats = [
    { label: "Total",     value: total,      icon: Film,        bgColor: "bg-primary" },
    { label: "Terminées", value: completed,   icon: CheckCircle2,bgColor: "bg-accent" },
    { label: "En cours",  value: processing,  icon: Clock,       bgColor: "bg-blue-300" },
    { label: "Échouées",  value: failed,      icon: BarChart3,   bgColor: "bg-destructive" },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {selectedGen && (
        <VideoModal gen={selectedGen} onClose={() => setSelectedGen(null)} />
      )}

      <div className="space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-black uppercase tracking-wider">Dashboard</h1>
            <p className="text-gray-600 font-bold mt-2 text-lg">Vue d&apos;ensemble de vos générations</p>
          </div>
          <div className="flex items-center gap-4">
            {processing > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-[3px] border-black bg-blue-300 comic-shadow animate-pulse">
                <Clock className="w-4 h-4 text-black" strokeWidth={2.5} />
                <span className="text-xs font-black uppercase text-black">{processing} en cours</span>
              </div>
            )}
            <button
              onClick={syncProcessing}
              disabled={syncing}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg border-[3px] border-black bg-accent comic-shadow hover:-translate-y-0.5 active:translate-y-0.5 transition-transform text-sm font-black uppercase ${syncing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <RefreshCw className={`w-4 h-4 text-black ${syncing ? "animate-spin" : ""}`} strokeWidth={3} />
              {syncing ? "Sync…" : "Actualiser"}
            </button>
            <div className="flex items-center gap-2 px-5 py-3 rounded-lg border-[3px] border-black bg-accent comic-shadow">
              <TrendingUp className="w-4 h-4 text-black" strokeWidth={2.5} />
              <span className="text-xs font-black uppercase text-black">
                {total > 0 ? `${Math.round((completed / total) * 100)}% succès` : "Aucune donnée"}
              </span>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-wide text-black">{s.label}</CardTitle>
                  <div className={`flex items-center justify-center w-11 h-11 rounded-lg border-[3px] border-black ${s.bgColor}`}>
                    <Icon className="w-5 h-5 text-black" strokeWidth={2.5} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-4xl font-black text-black">{s.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Generations Table */}
        <Card>
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-black uppercase text-black tracking-wider">
                Dernières générations
              </CardTitle>
              {processing > 0 && (
                <span className="text-xs font-bold text-gray-500">
                  Actualisation automatique toutes les 10s
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generations.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary border-[3px] border-black comic-shadow mb-6">
                  <Film className="w-10 h-10 text-black" strokeWidth={2.5} />
                </div>
                <p className="text-black font-black uppercase text-xl">Aucune génération pour le moment</p>
                <p className="text-gray-600 font-bold mt-3 text-base">Commencez par créer votre première vidéo LipSync</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-[3px] border-black">
                      <th className="text-left text-xs font-black text-black uppercase tracking-wider px-6 py-4">Mode</th>
                      <th className="text-left text-xs font-black text-black uppercase tracking-wider px-6 py-4">Statut</th>
                      <th className="text-left text-xs font-black text-black uppercase tracking-wider px-6 py-4">Date</th>
                      <th className="text-left text-xs font-black text-black uppercase tracking-wider px-6 py-4">Video ID</th>
                      <th className="text-left text-xs font-black text-black uppercase tracking-wider px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-[2px] divide-gray-200">
                    {generations.map((gen) => {
                      const cfg = STATUS_CONFIG[gen.status] ?? { label: gen.status, variant: "warning" as const };
                      const isCompleted = gen.status === "completed" && gen.videoUrl;
                      return (
                        <tr
                          key={gen.id}
                          className={`transition-colors duration-150 ${isCompleted ? "hover:bg-accent/40 cursor-pointer" : "hover:bg-gray-50"}`}
                          onClick={() => isCompleted && setSelectedGen(gen)}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary border-[3px] border-black comic-shadow flex-shrink-0">
                                <Film className="w-5 h-5 text-black" strokeWidth={2.5} />
                              </div>
                              <span className="text-sm text-black font-black uppercase">
                                {gen.mode === "avatar" ? "Avatar ID" : "Upload Image"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </td>
                          <td className="px-6 py-5 text-sm font-bold text-gray-700">
                            {gen.createdAt ? formatDate(new Date(gen.createdAt)) : "—"}
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-500 font-bold font-mono">
                            {gen.videoId ? `${gen.videoId.slice(0, 12)}…` : "—"}
                          </td>
                          <td className="px-6 py-5">
                            {isCompleted ? (
                              <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border-[3px] border-black bg-accent font-black text-xs uppercase text-black comic-shadow hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
                                onClick={(e) => { e.stopPropagation(); setSelectedGen(gen); }}
                              >
                                <Play className="w-3.5 h-3.5" strokeWidth={3} />
                                Voir
                              </button>
                            ) : gen.status === "processing" || gen.status === "pending" ? (
                              <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                                <Clock className="w-3.5 h-3.5 animate-pulse" />
                                En attente…
                              </span>
                            ) : null}
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
    </>
  );
}
