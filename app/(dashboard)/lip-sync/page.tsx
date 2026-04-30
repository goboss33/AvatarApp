"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  Image as ImageIcon,
  Mic,
  Sparkles,
  Loader2,
  Download,
  Copy,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Film,
} from "lucide-react";

interface GenerationState {
  status: "idle" | "uploading-audio" | "uploading-image" | "creating-avatar" | "generating" | "polling" | "completed" | "error";
  videoUrl: string | null;
  error: string | null;
  progress: string;
}

function DropZone({
  accept,
  onFileSelect,
  label,
  icon: Icon,
  preview,
  uploaded,
}: {
  accept: string;
  onFileSelect: (file: File) => void;
  label: string;
  icon: React.ElementType;
  preview?: string | null;
  uploaded?: boolean;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
      onClick={() => document.getElementById(`input-${label}`)?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        uploaded
          ? "border-blue-400 bg-blue-50"
          : isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
      }`}
    >
      <input
        id={`input-${label}`}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {uploaded ? (
        <div className="flex flex-col items-center gap-3">
          {preview && accept.includes("image") && (
            <img src={preview} alt="Preview" className="max-h-24 rounded-lg object-contain shadow-sm" />
          )}
          {accept.includes("audio") && (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Fichier prêt
          </Badge>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-1">Glissez-déposez ou cliquez pour parcourir</p>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoPlayer({ videoUrl, onReset }: { videoUrl: string; onReset: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avatar-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, "_blank");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <CardTitle>Vidéo générée avec succès</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video src={videoUrl} controls className="w-full h-full" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleDownload} className="flex-1">
            <Download className="w-4 h-4" />
            Télécharger
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier URL"}
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
            Nouvelle vidéo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LipSyncPage() {
  const [activeTab, setActiveTab] = useState<"avatar" | "upload">("avatar");
  const [avatarId, setAvatarId] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [state, setState] = useState<GenerationState>({
    status: "idle",
    videoUrl: null,
    error: null,
    progress: "",
  });

  const reset = () => {
    setState({ status: "idle", videoUrl: null, error: null, progress: "" });
    setAudioFile(null);
    setImageFile(null);
    setAudioPreview(null);
    setImagePreview(null);
  };

  const handleAudioSelect = useCallback((file: File) => {
    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
  }, []);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const uploadAudio = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", file);
    const response = await fetch("/api/heygen/upload-audio", { method: "POST", body: formData });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.asset_id;
  };

  const createTalkingPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/heygen/create-talking-photo", { method: "POST", body: formData });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.talking_photo_id;
  };

  const generateVideo = async (payload: { avatarId?: string; talkingPhotoId?: string; audioAssetId: string }): Promise<string> => {
    const response = await fetch("/api/heygen/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.video_id;
  };

  const pollVideoStatus = async (videoId: string): Promise<string> => {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const response = await fetch(`/api/heygen/video-status?video_id=${videoId}`);
      if (!response.ok) throw new Error("Failed to get video status");
      const data = await response.json();
      if (data.status === "completed") return data.video_url;
      if (data.status === "failed") throw new Error(data.error || "Video generation failed");
    }
  };

  const handleGenerate = async () => {
    if (!audioFile) return;
    if (activeTab === "avatar" && !avatarId) return;
    if (activeTab === "upload" && !imageFile) return;

    try {
      setState({ status: "uploading-audio", videoUrl: null, error: null, progress: "Upload de l&apos;audio..." });
      const audioAssetId = await uploadAudio(audioFile);

      let talkingPhotoId: string | undefined;
      if (activeTab === "upload" && imageFile) {
        setState({ status: "uploading-image", videoUrl: null, error: null, progress: "Création de l&apos;avatar..." });
        talkingPhotoId = await createTalkingPhoto(imageFile);
      }

      setState({ status: "generating", videoUrl: null, error: null, progress: "Lancement de la génération..." });
      const videoId = await generateVideo({
        avatarId: activeTab === "avatar" ? avatarId : undefined,
        talkingPhotoId,
        audioAssetId,
      });

      setState({ status: "polling", videoUrl: null, error: null, progress: "Génération en cours, cela peut prendre quelques minutes..." });
      const videoUrl = await pollVideoStatus(videoId);
      setState({ status: "completed", videoUrl, error: null, progress: "" });
    } catch (err) {
      setState({
        status: "error",
        videoUrl: null,
        error: err instanceof Error ? err.message : "Une erreur est survenue",
        progress: "",
      });
    }
  };

  const isGenerating = ["uploading-audio", "uploading-image", "creating-avatar", "generating", "polling"].includes(state.status);

  if (state.status === "completed" && state.videoUrl) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avatar LipSync</h1>
          <p className="text-gray-500 mt-1">Créez des vidéos lip-sync avec HeyGen</p>
        </div>
        <VideoPlayer videoUrl={state.videoUrl} onReset={reset} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avatar LipSync</h1>
        <p className="text-gray-500 mt-1">Créez des vidéos lip-sync avec HeyGen</p>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "avatar" | "upload")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="avatar">HeyGen Avatar ID</TabsTrigger>
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
        </TabsList>

        <TabsContent value="avatar">
          <Card>
            <CardHeader>
              <CardTitle>Mode Avatar ID</CardTitle>
              <CardDescription>
                Utilisez un avatar HeyGen existant avec son ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatarId">HeyGen Avatar ID</Label>
                <Input
                  id="avatarId"
                  value={avatarId}
                  onChange={(e) => setAvatarId(e.target.value)}
                  placeholder="e.g. Avatar_ID_xxx"
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label>Fichier audio</Label>
                <DropZone
                  accept="audio/*"
                  onFileSelect={handleAudioSelect}
                  label="Déposez un fichier audio ici"
                  icon={Mic}
                  preview={audioPreview}
                  uploaded={!!audioFile}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Mode Upload Image</CardTitle>
              <CardDescription>
                Uploadez une image pour créer un avatar personnalisé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Image du visage</Label>
                <DropZone
                  accept="image/*"
                  onFileSelect={handleImageSelect}
                  label="Déposez une image ici"
                  icon={ImageIcon}
                  preview={imagePreview}
                  uploaded={!!imageFile}
                />
              </div>
              <div className="space-y-2">
                <Label>Fichier audio</Label>
                <DropZone
                  accept="audio/*"
                  onFileSelect={handleAudioSelect}
                  label="Déposez un fichier audio ici"
                  icon={Mic}
                  preview={audioPreview}
                  uploaded={!!audioFile}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {state.progress && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-gray-900">{state.progress}</p>
                <p className="text-xs text-gray-400">Ne fermez pas cette page</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleGenerate}
        disabled={
          isGenerating ||
          !audioFile ||
          (activeTab === "avatar" && !avatarId) ||
          (activeTab === "upload" && !imageFile)
        }
        className="w-full h-12 text-base"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Générer la vidéo
          </>
        )}
      </Button>
    </div>
  );
}
