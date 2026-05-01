"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, Video } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-8 bg-background overflow-hidden">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary border-[3px] border-black comic-shadow mb-8 transform -rotate-3 hover:rotate-0 transition-transform">
            <Video className="w-12 h-12 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-black text-black uppercase tracking-wider mb-4 transform rotate-1 inline-block">Avatar App</h1>
          <p className="text-gray-600 font-bold text-lg mt-2">Créez des avatars vidéo IA époustouflants</p>
        </div>

        <Card>
          <CardHeader className="pb-10">
            <CardTitle className="text-2xl font-black text-black uppercase tracking-wider">Connexion</CardTitle>
            <CardDescription className="text-gray-600 font-bold text-base mt-2">
              Accédez à votre espace de création
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive" className="border-[3px] border-black bg-destructive comic-shadow text-black">
                  <AlertDescription className="font-bold">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Label htmlFor="email" className="text-black font-black uppercase tracking-wide text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="h-14 rounded-xl text-base"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="password" className="text-black font-black uppercase tracking-wide text-base">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-14 rounded-xl text-base"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl text-base mt-6">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
                    <span className="text-black">Se connecter</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 font-bold text-sm mt-12">
          Propulsé par l&apos;intelligence artificielle HeyGen
        </p>
      </div>
    </div>
  );
}
