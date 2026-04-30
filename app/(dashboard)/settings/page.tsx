"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Loader2, Key, Shield, Zap } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) setApiKey(data.apiKey);
      })
      .catch(() => {});
  }, []);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configuration de l&apos;application</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <CardTitle>Clé API HeyGen</CardTitle>
          </div>
          <CardDescription>
            Configurez votre clé API pour utiliser les services HeyGen.{" "}
            <a
              href="https://app.heygen.com/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              Obtenir une clé API
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Clé API</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Entrez votre clé API HeyGen"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleTest} disabled={testing || !apiKey}>
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Tester la connexion
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={loading || !apiKey}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? "success" : "destructive"}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert variant="success">
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription>Clé API sauvegardée avec succès</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Sécurité</p>
              <p className="text-sm text-gray-500">Votre clé API est stockée de manière sécurisée dans la base de données locale.</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">HeyGen API</p>
              <p className="text-sm text-gray-500">Les vidéos sont générées via l&apos;API HeyGen. Le temps de génération varie selon la durée de l&apos;audio.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
