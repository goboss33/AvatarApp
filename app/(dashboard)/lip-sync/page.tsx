"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
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
      className={`drop-zone relative rounded-2xl p-14 text-center cursor-pointer ${
        uploaded ? "uploaded" : isDragging ? "dragging" : ""
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
        <div className="flex flex-col items-center gap-5">
          {preview && accept.includes("image") && (
            <img src={preview} alt="Preview" className="max-h-32 rounded-xl object-contain border-[3px] border-black comic-shadow" />
          )}
          {accept.includes("audio") && (
            <div className="w-20 h-20 rounded-2xl bg-primary border-[3px] border-black comic-shadow flex items-center justify-center">
              <Mic className="w-10 h-10 text-black" strokeWidth={2.5} />
            </div>
          )}
          <Badge variant="success" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            Fichier prêt
          </Badge>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-secondary border-[3px] border-black flex items-center justify-center">
            <Icon className="w-10 h-10 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-black text-black uppercase tracking-wide">{label}</p>
            <p className="text-sm text-gray-600 font-bold mt-2">Glissez-déposez ou cliquez pour parcourir</p>
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
      <CardHeader className="pb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent border-[3px] border-black comic-shadow">
            <CheckCircle2 className="w-7 h-7 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-black uppercase tracking-wider">Vidéo générée avec succès</CardTitle>
            <CardDescription className="text-gray-600 font-bold mt-2 text-base">Votre avatar est prêt à être téléchargé</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="aspect-video bg-secondary rounded-xl overflow-hidden border-[3px] border-black comic-shadow">
            <video src={videoUrl} controls className="w-full h-full" />
          </div>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={handleDownload} className="flex-1 h-14 rounded-xl text-base">
              <Download className="w-5 h-5" strokeWidth={2.5} />
              Télécharger
            </Button>
            <Button variant="outline" onClick={handleCopy} className="h-14 rounded-xl px-8 text-base">
              {copied ? <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} /> : <Copy className="w-5 h-5" strokeWidth={2.5} />}
              {copied ? "Copié !" : "Copier URL"}
            </Button>
            <Button variant="outline" onClick={onReset} className="h-14 rounded-xl px-8 text-base">
              <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
              Nouvelle vidéo
            </Button>
          </div>
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
      setState({ status: "uploading-audio", videoUrl: null, error: null, progress: "Upload de l'audio..." });
      const audioAssetId = await uploadAudio(audioFile);

      let talkingPhotoId: string | undefined;
      if (activeTab === "upload" && imageFile) {
        setState({ status: "uploading-image", videoUrl: null, error: null, progress: "Création de l'avatar..." });
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
      <div className="space-y-12">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-wider">Avatar LipSync</h1>
          <p className="text-gray-600 font-bold mt-3 text-lg">Créez des vidéos lip-sync avec HeyGen</p>
        </div>
        <VideoPlayer videoUrl={state.videoUrl} onReset={reset} />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-black text-black uppercase tracking-wider">Avatar LipSync</h1>
        <p className="text-gray-600 font-bold mt-3 text-lg">Créez des vidéos lip-sync avec HeyGen</p>
      </div>

      {state.error && (
        <Alert variant="destructive" className="border-[3px] border-black bg-destructive comic-shadow text-black">
          <AlertCircle className="w-5 h-5 text-black" strokeWidth={2.5} />
          <AlertDescription className="text-base font-bold">{state.error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "avatar" | "upload")}>
        <TabsList className="grid w-full max-w-lg grid-cols-2 h-14 rounded-xl bg-secondary border-[3px] border-black comic-shadow p-2">
          <TabsTrigger value="avatar" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-[3px] data-[state=active]:border-black data-[state=active]:comic-shadow font-bold text-base transition-all duration-200">
            <Film className="w-5 h-5 mr-2" strokeWidth={2.5} />
            HeyGen Avatar ID
          </TabsTrigger>
          <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-[3px] data-[state=active]:border-black data-[state=active]:comic-shadow font-bold text-base transition-all duration-200">
            <ImageIcon className="w-5 h-5 mr-2" strokeWidth={2.5} />
            Upload Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avatar">
          <Card className="mt-8">
            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-black text-black uppercase tracking-wider">Mode Avatar ID</CardTitle>
              <CardDescription className="text-gray-600 font-bold mt-2 text-base">
                Utilisez un avatar HeyGen existant avec son ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-10">
                <div className="space-y-4">
                  <Label htmlFor="avatarId" className="text-black font-black uppercase tracking-wide text-base">HeyGen Avatar ID</Label>
                  <Input
                    id="avatarId"
                    value={avatarId}
                    onChange={(e) => setAvatarId(e.target.value)}
                    placeholder="e.g. Avatar_ID_xxx"
                    disabled={isGenerating}
                    className="h-14 rounded-xl text-base"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-black font-black uppercase tracking-wide text-base">Fichier audio</Label>
                  <DropZone
                    accept="audio/*"
                    onFileSelect={handleAudioSelect}
                    label="Déposez un fichier audio ici"
                    icon={Mic}
                    preview={audioPreview}
                    uploaded={!!audioFile}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card className="mt-8">
            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-black text-black uppercase tracking-wider">Mode Upload Image</CardTitle>
              <CardDescription className="text-gray-600 font-bold mt-2 text-base">
                Uploadez une image pour créer un avatar personnalisé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-10">
                <div className="space-y-4">
                  <Label className="text-black font-black uppercase tracking-wide text-base">Image du visage</Label>
                  <DropZone
                    accept="image/*"
                    onFileSelect={handleImageSelect}
                    label="Déposez une image ici"
                    icon={ImageIcon}
                    preview={imagePreview}
                    uploaded={!!imageFile}
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-black font-black uppercase tracking-wide text-base">Fichier audio</Label>
                  <DropZone
                    accept="audio/*"
                    onFileSelect={handleAudioSelect}
                    label="Déposez un fichier audio ici"
                    icon={Mic}
                    preview={audioPreview}
                    uploaded={!!audioFile}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {state.progress && (
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary border-[3px] border-black comic-shadow">
                <Loader2 className="w-8 h-8 text-black animate-spin" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-base font-black text-black uppercase tracking-wide">{state.progress}</p>
                <p className="text-sm text-gray-600 font-bold mt-2">Ne fermez pas cette page</p>
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
        className="w-full h-16 text-lg rounded-xl"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-black" />
            <span className="text-black">Génération en cours...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6 text-black" strokeWidth={2.5} />
            <span className="text-black">Générer la vidéo</span>
          </>
        )}
      </Button>
    </div>
  );
}
