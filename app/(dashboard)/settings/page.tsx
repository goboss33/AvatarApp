"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Loader2, Key, Shield, Zap, User, Lock } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) setApiKey(data.apiKey);
      })
      .catch(() => {});
  }, []);

  const handleProfileSave = async () => {
    setProfileError(null);
    setProfileSaved(false);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!currentPassword) {
      setProfileError("Veuillez entrer votre mot de passe actuel pour confirmer");
      return;
    }

    setProfileLoading(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          name,
          email,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save");
      setProfileSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!response.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setTestResult({ success: false, message: "Erreur lors de la sauvegarde" });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/heygen/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await response.json();
      if (data.success) {
        setTestResult({ success: true, message: data.warning || "Connexion réussie ! L'API HeyGen est accessible." });
      } else {
        setTestResult({ success: false, message: `${data.error || "Connexion échouée"}. Vous pouvez quand même sauvegarder la clé.` });
      }
    } catch {
      setTestResult({ success: false, message: "Erreur réseau. Vous pouvez quand même sauvegarder la clé." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-black text-black uppercase tracking-wider">Settings</h1>
        <p className="text-gray-600 font-bold mt-3 text-lg">Configuration de l&apos;application</p>
      </div>

      <Card className="comic-card">
        <CardHeader className="pb-8">
          <div className="flex items-center gap-4">
            <User className="w-8 h-8 text-black" strokeWidth={3} />
            <div>
              <CardTitle className="text-2xl font-black text-black uppercase tracking-wider">Profil</CardTitle>
              <CardDescription className="text-gray-600 font-bold mt-1 text-base">
                Modifiez vos informations de connexion.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-black font-black uppercase tracking-wide text-base">Nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="h-14 rounded-xl text-base"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="email" className="text-black font-black uppercase tracking-wide text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  className="h-14 rounded-xl text-base"
                />
              </div>
            </div>

            <Separator className="bg-black h-[3px] w-full rounded-full" />

            <div className="space-y-4">
              <Label htmlFor="currentPassword" className="text-black font-black uppercase tracking-wide text-base">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
                className="h-14 rounded-xl text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <Label htmlFor="newPassword" className="text-black font-black uppercase tracking-wide text-base">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Optionnel"
                  className="h-14 rounded-xl text-base"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="confirmPassword" className="text-black font-black uppercase tracking-wide text-base">Confirmer</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le mot de passe"
                  className="h-14 rounded-xl text-base"
                />
              </div>
            </div>

            {profileError && (
              <Alert variant="destructive" className="border-[3px] border-black bg-destructive comic-shadow text-black">
                <XCircle className="w-5 h-5 text-black" strokeWidth={2.5} />
                <AlertDescription className="text-base font-bold">{profileError}</AlertDescription>
              </Alert>
            )}

            {profileSaved && (
              <Alert variant="success" className="border-[3px] border-black bg-accent comic-shadow text-black">
                <CheckCircle2 className="w-5 h-5 text-black" strokeWidth={2.5} />
                <AlertDescription className="text-base font-bold">Profil mis à jour avec succès</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleProfileSave} disabled={profileLoading || !currentPassword} className="h-14 rounded-xl px-10 text-base w-full sm:w-auto">
              {profileLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Sauvegarder le profil
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="comic-card">
        <CardHeader className="pb-8">
          <div className="flex items-center gap-4">
            <Key className="w-8 h-8 text-black" strokeWidth={3} />
            <div>
              <CardTitle className="text-2xl font-black text-black uppercase tracking-wider">Clé API HeyGen</CardTitle>
              <CardDescription className="text-gray-600 font-bold mt-1 text-base">
                Configurez votre clé API pour utiliser les services HeyGen.{" "}
                <a
                  href="https://app.heygen.com/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black font-black underline hover:text-gray-700 transition-colors"
                >
                  Obtenir une clé API
                </a>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-10">
            <div className="space-y-4">
              <Label htmlFor="apiKey" className="text-black font-black uppercase tracking-wide text-base">Clé API</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Entrez votre clé API HeyGen"
                className="h-14 rounded-xl text-base"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
              <Button variant="outline" onClick={handleTest} disabled={testing || !apiKey} className="h-14 rounded-xl px-10 text-base w-full sm:w-auto">
                {testing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Tester la connexion
                  </>
                )}
              </Button>
              <Button onClick={handleSave} disabled={loading || !apiKey} className="h-14 rounded-xl px-10 text-base w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "success" : "destructive"} className={`border-[3px] border-black comic-shadow text-black ${testResult.success ? "bg-accent" : "bg-destructive"}`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-black" strokeWidth={2.5} />
                ) : (
                  <XCircle className="w-5 h-5 text-black" strokeWidth={2.5} />
                )}
                <AlertDescription className="text-base font-bold">{testResult.message}</AlertDescription>
              </Alert>
            )}

            {saved && (
              <Alert variant="success" className="border-[3px] border-black bg-accent comic-shadow text-black">
                <CheckCircle2 className="w-5 h-5 text-black" strokeWidth={2.5} />
                <AlertDescription className="text-base font-bold">Clé API sauvegardée avec succès</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="comic-card">
        <CardHeader className="pb-8">
          <CardTitle className="text-2xl font-black text-black uppercase tracking-wider">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-5 p-6 rounded-xl bg-secondary border-[3px] border-black comic-shadow">
              <Lock className="w-8 h-8 text-black flex-shrink-0" strokeWidth={2.5} />
              <div>
                <p className="text-base font-black text-black uppercase tracking-wide">Sécurité</p>
                <p className="text-sm text-gray-700 font-bold mt-1">Votre clé API est stockée de manière sécurisée dans la base de données locale.</p>
              </div>
            </div>
            <div className="flex items-start gap-5 p-6 rounded-xl bg-accent border-[3px] border-black comic-shadow">
              <Zap className="w-8 h-8 text-black flex-shrink-0" strokeWidth={2.5} />
              <div>
                <p className="text-base font-black text-black uppercase tracking-wide">HeyGen API</p>
                <p className="text-sm text-gray-700 font-bold mt-1">Les vidéos sont générées via l&apos;API HeyGen. Le temps de génération varie selon la durée de l&apos;audio.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
