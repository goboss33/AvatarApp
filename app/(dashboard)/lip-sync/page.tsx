"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Image as ImageIcon,
  Mic,
  Sparkles,
  Loader2,
  AlertCircle,
  Film,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  DollarSign,
  Clock,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudioItem {
  id: string;
  file: File;
  name: string;
  duration: number;
  objectUrl: string;
}

interface AvatarLook {
  id: string;
  name: string;
  preview_image_url: string | null;
  supported_api_engines: string[];
}

interface BatchState {
  status: "idle" | "running" | "done" | "error";
  current: number;
  total: number;
  currentFileName: string;
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}

// ─── AudioRow ──────────────────────────────────────────────────────────────────

function AudioRow({
  item,
  onRemove,
}: {
  item: AudioItem;
  onRemove: (id: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border-[3px] border-black bg-white comic-shadow group">
      <audio
        ref={audioRef}
        src={item.objectUrl}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 rounded-lg border-[3px] border-black bg-primary flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0.5 transition-transform comic-shadow"
      >
        {playing ? (
          <Pause className="w-4 h-4 text-black" strokeWidth={3} />
        ) : (
          <Play className="w-4 h-4 text-black" strokeWidth={3} />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-black uppercase tracking-wide truncate">
          {item.name}
        </p>
        <p className="text-xs font-bold text-gray-500 mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(item.duration)}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
        className="flex-shrink-0 w-10 h-10 rounded-lg border-[3px] border-black bg-destructive flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0.5 transition-transform comic-shadow opacity-70 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4 text-black" strokeWidth={3} />
      </button>
    </div>
  );
}

// ─── MultiAudioDropZone ────────────────────────────────────────────────────────

function MultiAudioDropZone({
  onFilesAdd,
  disabled,
}: {
  onFilesAdd: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = "multi-audio-input";

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const valid = Array.from(files).filter((f) => f.type.startsWith("audio/"));
      if (valid.length > 0) onFilesAdd(valid);
    },
    [onFilesAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById(inputId)?.click()}
      className={`drop-zone relative rounded-xl py-10 text-center cursor-pointer ${isDragging ? "dragging" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        id={inputId}
        type="file"
        accept="audio/*"
        multiple
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-primary border-[3px] border-black flex items-center justify-center">
          <Mic className="w-8 h-8 text-black" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-base font-black text-black uppercase tracking-wide">
            Glissez vos fichiers audio ici
          </p>
          <p className="text-sm text-gray-600 font-bold mt-1">
            Plusieurs fichiers acceptés — MP3, WAV, M4A…
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ConfirmModal ──────────────────────────────────────────────────────────────

function ConfirmModal({
  audioItems,
  costPerSecond,
  onConfirm,
  onCancel,
}: {
  audioItems: AudioItem[];
  costPerSecond: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const totalSeconds = audioItems.reduce((acc, a) => acc + a.duration, 0);
  const totalCost = (totalSeconds * costPerSecond).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border-[4px] border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-black" strokeWidth={3} />
          <h2 className="text-2xl font-black text-black uppercase tracking-wider">
            Confirmer le batch
          </h2>
        </div>

        {/* Summary */}
        <div className="p-5 rounded-xl border-[3px] border-black bg-primary space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-black uppercase text-sm text-black tracking-wide">Fichiers</span>
            <span className="font-black text-xl text-black">{audioItems.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-black uppercase text-sm text-black tracking-wide">Durée totale</span>
            <span className="font-black text-xl text-black">{formatDuration(totalSeconds)}</span>
          </div>
          <div className="h-[3px] bg-black rounded-full" />
          <div className="flex justify-between items-center">
            <span className="font-black uppercase text-sm text-black tracking-wide">Coût estimé</span>
            <span className="font-black text-2xl text-black">~${totalCost}</span>
          </div>
        </div>

        <p className="text-sm font-bold text-gray-600">
          Les {audioItems.length} vidéos seront générées séquentiellement et apparaîtront sur votre Dashboard. Vous pouvez fermer l&apos;application après confirmation.
        </p>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-xl text-base">
            Annuler
          </Button>
          <Button onClick={onConfirm} className="flex-1 h-12 rounded-xl text-base">
            <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
            <span className="text-black">Lancer le batch</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── ImageDropZone (single, for upload tab) ──────────────────────────────────

function ImageDropZone({
  onFileSelect,
  preview,
  uploaded,
  disabled,
}: {
  onFileSelect: (file: File) => void;
  preview?: string | null;
  uploaded?: boolean;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById("image-input")?.click()}
      className={`drop-zone relative rounded-xl py-10 text-center cursor-pointer ${uploaded ? "uploaded" : isDragging ? "dragging" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        id="image-input"
        type="file"
        accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }}
        className="hidden"
        disabled={disabled}
      />
      {uploaded && preview ? (
        <div className="flex flex-col items-center gap-4">
          <img src={preview} alt="Preview" className="max-h-32 rounded-xl object-contain border-[3px] border-black comic-shadow" />
          <span className="text-sm font-black text-black uppercase tracking-wide flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Image prête
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-secondary border-[3px] border-black flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-black text-black uppercase tracking-wide">Image du visage</p>
            <p className="text-sm text-gray-600 font-bold mt-1">Glissez-déposez ou cliquez pour parcourir</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LipSyncPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"avatar" | "upload">("avatar");
  const [heygenModel, setHeygenModel] = useState<"avatar_iv" | "avatar_v">("avatar_iv");
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [avatars, setAvatars] = useState<AvatarLook[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [costPerSecond, setCostPerSecond] = useState(0.05);
  const [showConfirm, setShowConfirm] = useState(false);
  const [batch, setBatch] = useState<BatchState>({
    status: "idle",
    current: 0,
    total: 0,
    currentFileName: "",
    errors: [],
  });

  // Load API cost from settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.apiCostPerSecond) setCostPerSecond(parseFloat(d.apiCostPerSecond));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingAvatars(true);
    setAvatarError(null);
    fetch("/api/heygen/avatars")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load avatars");
        return r.json();
      })
      .then((d) => {
        setAvatars(d.avatars || []);
      })
      .catch((err) => {
        setAvatarError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => setLoadingAvatars(false));
  }, []);

  // Add audio files to the list
  const handleFilesAdd = useCallback(async (files: File[]) => {
    const newItems: AudioItem[] = await Promise.all(
      files.map(async (file) => {
        const duration = await getAudioDuration(file);
        return {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          duration,
          objectUrl: URL.createObjectURL(file),
        };
      })
    );
    setAudioItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleRemoveAudio = useCallback((id: string) => {
    setAudioItems((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  // ─── API calls ─────────────────────────────────────────────────────────────

  const uploadAudio = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", file);
    const res = await fetch("/api/heygen/upload-audio", { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).asset_id;
  };

  const createTalkingPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/heygen/create-talking-photo", { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).talking_photo_id;
  };

  const generateVideo = async (payload: {
    avatarId?: string;
    talkingPhotoId?: string;
    audioAssetId: string;
    engine?: "avatar_iv" | "avatar_v";
  }): Promise<string> => {
    const res = await fetch("/api/heygen/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).video_id;
  };

  // ─── Batch execution ───────────────────────────────────────────────────────

  const runBatch = async () => {
    setShowConfirm(false);
    const errors: string[] = [];

    let talkingPhotoId: string | undefined;
    if (activeTab === "upload" && imageFile) {
      setBatch({ status: "running", current: 0, total: audioItems.length, currentFileName: "Création de l'avatar photo...", errors: [] });
      try {
        talkingPhotoId = await createTalkingPhoto(imageFile);
      } catch (err) {
        setBatch({ status: "error", current: 0, total: audioItems.length, currentFileName: "", errors: [`Erreur création avatar: ${err instanceof Error ? err.message : err}`] });
        return;
      }
    }

    for (let i = 0; i < audioItems.length; i++) {
      const item = audioItems[i];
      setBatch((prev) => ({
        ...prev,
        status: "running",
        current: i + 1,
        total: audioItems.length,
        currentFileName: item.name,
        errors,
      }));

      try {
        const audioAssetId = await uploadAudio(item.file);
        await generateVideo({
          avatarId: activeTab === "avatar" ? selectedAvatarId : undefined,
          talkingPhotoId,
          audioAssetId,
          engine: activeTab === "avatar" ? heygenModel : undefined,
        });
      } catch (err) {
        errors.push(`${item.name}: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
      }
    }

    setBatch({ status: "done", current: audioItems.length, total: audioItems.length, currentFileName: "", errors });

    // Redirect to dashboard after 2s
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  // ─── Derived ───────────────────────────────────────────────────────────────

  const isRunning = batch.status === "running";
  const canGenerate =
    audioItems.length > 0 &&
    (activeTab === "avatar" ? !!selectedAvatarId : !!imageFile);

  const totalDuration = audioItems.reduce((acc, a) => acc + a.duration, 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (batch.status === "done") {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-wider">Avatar LipSync</h1>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-black" strokeWidth={3} />
              <CardTitle className="text-2xl font-black uppercase tracking-wider">
                Batch envoyé avec succès !
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="font-bold text-gray-700">
                {batch.total - batch.errors.length} / {batch.total} vidéos lancées sur HeyGen.
                Redirection vers le Dashboard…
              </p>
              {batch.errors.length > 0 && (
                <div className="space-y-2">
                  {batch.errors.map((err, i) => (
                    <Alert key={i} variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="font-bold text-sm">{err}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          audioItems={audioItems}
          costPerSecond={costPerSecond}
          onConfirm={runBatch}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-wider">Avatar LipSync</h1>
          <p className="text-gray-600 font-bold mt-2 text-lg">
            Générez plusieurs vidéos avatar en un seul batch
          </p>
        </div>

        {/* Error banner */}
        {batch.status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
            <AlertDescription className="font-bold">{batch.errors[0]}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "avatar" | "upload")}>
          <TabsList className="grid w-full max-w-lg grid-cols-2 h-14 rounded-xl bg-secondary border-[3px] border-black comic-shadow p-2">
            <TabsTrigger
              value="avatar"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-[3px] data-[state=active]:border-black font-bold text-base transition-all duration-200"
            >
              <Film className="w-5 h-5 mr-2" strokeWidth={2.5} />
              Avatar ID
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-[3px] data-[state=active]:border-black font-bold text-base transition-all duration-200"
            >
              <ImageIcon className="w-5 h-5 mr-2" strokeWidth={2.5} />
              Upload Image
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Avatar ID ────────────────────────────────────────── */}
          <TabsContent value="avatar">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-black uppercase tracking-wider">Mode Avatar ID</CardTitle>
                <CardDescription className="font-bold">Sélectionnez un avatar HeyGen et le modèle de génération.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Model Toggle */}
                <div className="space-y-3">
                  <Label className="text-black font-black uppercase tracking-wide text-sm">Modèle HeyGen</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHeygenModel("avatar_iv")}
                      className={`h-14 rounded-xl border-[3px] border-black font-bold text-base transition-all duration-200 comic-shadow ${
                        heygenModel === "avatar_iv"
                          ? "bg-primary text-black"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Avatar IV
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeygenModel("avatar_v")}
                      className={`h-14 rounded-xl border-[3px] border-black font-bold text-base transition-all duration-200 comic-shadow ${
                        heygenModel === "avatar_v"
                          ? "bg-primary text-black"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Avatar V
                    </button>
                  </div>
                </div>

                {/* Avatar Picker */}
                <div className="space-y-3">
                  <Label className="text-black font-black uppercase tracking-wide text-sm">Choisir un avatar</Label>
                  
                  {avatarError && (
                    <Alert variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="font-bold text-sm">{avatarError}</AlertDescription>
                    </Alert>
                  )}

                  {loadingAvatars ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-32 rounded-xl border-[3px] border-black" />
                          <Skeleton className="h-4 w-3/4 mx-auto" />
                        </div>
                      ))}
                    </div>
                  ) : avatars.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border-[3px] border-dashed border-black bg-gray-50">
                      <p className="font-bold text-gray-600">Aucun avatar trouvé.</p>
                      <p className="text-sm text-gray-500 mt-1">Créez un avatar sur HeyGen d&apos;abord.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {avatars.map((avatar) => {
                        const supportsV = avatar.supported_api_engines.includes("avatar_v");
                        const isDisabled = heygenModel === "avatar_v" && !supportsV;
                        const isSelected = selectedAvatarId === avatar.id;

                        return (
                          <div key={avatar.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => !isDisabled && setSelectedAvatarId(avatar.id)}
                              disabled={isDisabled}
                              className={`w-full rounded-xl border-[3px] border-black overflow-hidden transition-all duration-200 comic-shadow ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : isDisabled
                                  ? "opacity-40 cursor-not-allowed grayscale"
                                  : "bg-white hover:-translate-y-0.5"
                              }`}
                            >
                              <div className="aspect-square bg-gray-100 relative">
                                {avatar.preview_image_url ? (
                                  <img
                                    src={avatar.preview_image_url}
                                    alt={avatar.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-black" strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <div className="p-2 text-center">
                                <p className="text-xs font-bold text-black truncate">{avatar.name}</p>
                              </div>
                            </button>
                            {isDisabled && (
                              <div className="absolute -top-2 -right-2 z-10">
                                <div className="group/tooltip relative">
                                  <div className="w-6 h-6 rounded-full bg-destructive border-[2px] border-black flex items-center justify-center">
                                    <Info className="w-3 h-3 text-black" />
                                  </div>
                                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block w-40 p-2 rounded-lg border-[2px] border-black bg-white comic-shadow z-20">
                                    <p className="text-xs font-bold text-black text-center">Incompatible AVATAR V</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Upload Image ─────────────────────────────────────── */}
          <TabsContent value="upload">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-black uppercase tracking-wider">Mode Upload Image</CardTitle>
                <CardDescription className="font-bold">Uploadez une image pour créer un avatar personnalisé.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageDropZone
                  onFileSelect={handleImageSelect}
                  preview={imagePreview}
                  uploaded={!!imageFile}
                  disabled={isRunning}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Audio Batch Section ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="w-7 h-7 text-black" strokeWidth={3} />
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-wider">Fichiers Audio</CardTitle>
                  <CardDescription className="font-bold mt-0.5">
                    {audioItems.length === 0
                      ? "Ajoutez un ou plusieurs fichiers audio"
                      : `${audioItems.length} fichier${audioItems.length > 1 ? "s" : ""} — durée totale : ${formatDuration(totalDuration)}`}
                  </CardDescription>
                </div>
              </div>
              {audioItems.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-[3px] border-black bg-accent comic-shadow">
                  <DollarSign className="w-4 h-4 text-black" strokeWidth={3} />
                  <span className="font-black text-sm text-black uppercase">
                    ~${(totalDuration * costPerSecond).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MultiAudioDropZone onFilesAdd={handleFilesAdd} disabled={isRunning} />

            {audioItems.length > 0 && (
              <div className="space-y-3 mt-4">
                {audioItems.map((item) => (
                  <AudioRow key={item.id} item={item} onRemove={handleRemoveAudio} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Progress Bar ───────────────────────────────────────────────── */}
        {isRunning && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-6 h-6 text-black animate-spin flex-shrink-0" strokeWidth={2.5} />
                  <div className="flex-1">
                    <p className="text-sm font-black text-black uppercase tracking-wide">
                      Envoi {batch.current} / {batch.total}
                    </p>
                    <p className="text-xs font-bold text-gray-600 mt-0.5 truncate">{batch.currentFileName}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-4 rounded-lg border-[3px] border-black bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${batch.total > 0 ? (batch.current / batch.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-gray-500">Ne fermez pas cette page</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Generate Button ────────────────────────────────────────────── */}
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={isRunning || !canGenerate}
          className="w-full h-16 text-lg rounded-xl"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-black" />
              <span className="text-black">Génération en cours…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-black" strokeWidth={2.5} />
              <span className="text-black">
                Générer {audioItems.length > 0 ? `${audioItems.length} vidéo${audioItems.length > 1 ? "s" : ""}` : "la vidéo"}
              </span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
