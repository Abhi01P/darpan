'use client'
import type React from "react"
import dynamic from "next/dynamic";
import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FcGoogle } from "react-icons/fc";
import { FaMicrosoft } from "react-icons/fa";
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react"
import { ParticleBackground } from "@/components/particleBackground"
import Image from "next/image";
import { loginAction, loginWithGoogleAction, loginWithAzureAction } from "@/app/actions/auth";
const RegisterUser = dynamic(() => import("@/components/registerUser"), { loading: () => <div className="justify-self-center py-44"><Loader2 className="h-12 w-12 text-blue-400 animate-spin" /></div> });

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Import the dynamic client
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        window.location.href = "/";
      } else {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const urlParams = new URLSearchParams(window.location.search)
    const callback = urlParams.get("callbackUrl") || undefined

    try {
      const data = await loginAction(email, password, callback)
      setIsLoading(false)
      if (data.error) {
        alert(data.error)
      } else if (data.success) {
        window.location.href = data.redirect || "/"
      }
    } catch (error) {
      setIsLoading(false)
      console.error("Error signing in:", error)
      alert("An error occurred while signing in. Please try again.")
    }
  }

  const handleGoogleLoginRedirect = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsGoogleLoading(true);
    const callbackParam = new URLSearchParams(window.location.search).get("callbackUrl") || "/";
    try {
      const data = await loginWithGoogleAction(callbackParam);
      if (data.error) {
        alert(data.error);
        setIsGoogleLoading(false);
      } else if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      console.error(error);
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftLoginRedirect = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMicrosoftLoading(true);
    const callbackParam = new URLSearchParams(window.location.search).get("callbackUrl") || "/";
    try {
      const data = await loginWithAzureAction(callbackParam);
      if (data.error) {
        alert(data.error);
        setIsMicrosoftLoading(false);
      } else if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      console.error(error);
      setIsMicrosoftLoading(false);
    }
  };

  return (

    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/70 border-b border-border shadow-sm"
      >
        <div className="container mx-auto px-4 flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center sm:pl-1.5 gap-2">
            <div className="relative h-8 w-8 md:h-10 md:w-10 rounded-full overflow-hidden shadow-lg shadow-blue-500/50">
              <Image
                src="/logo2.png"
                alt="Logo-Darpan"
                className="object-cover w-full h-full"
                fill
              />
            </div>
            <div className="font-extrabold font-serif text-2xl tracking-tighter">
              <span className="text-transparent bg-clip-text bg-primary">Darpan</span>
            </div>
          </Link>
        </div>
      </header>
      <div className="flex-1 relative overflow-hidden flex items-center justify-center pt-6 pb-12">
        {/* Particle background */}
        <ParticleBackground />

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card/40 backdrop-blur-xl rounded-2xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/10 border border-border overflow-hidden"
            >
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full bg-transparent grid-cols-2 px-1.5 h-12">
                    <TabsTrigger
                      value="login"
                      className="rounded-md py-2 transition-all duration-300 border border-transparent border-b-2 text-muted-foreground hover:text-foreground data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-white/10 data-[state=active]:border-b-primary data-[state=active]:bg-gradient-to-b data-[state=active]:from-white/5 data-[state=active]:to-transparent data-[state=active]:shadow-[0_4px_15px_hsl(var(--primary)/0.25)]"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="rounded-md py-2 transition-all duration-300 border border-transparent border-b-2 text-muted-foreground hover:text-foreground data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-white/10 data-[state=active]:border-b-primary data-[state=active]:bg-gradient-to-b data-[state=active]:from-white/5 data-[state=active]:to-transparent data-[state=active]:shadow-[0_4px_15px_hsl(var(--primary)/0.25)]"
                    >
                      Register
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="login" className="mt-4">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
                      <p className="text-muted-foreground mt-1">Be the best of yourself with Darpan</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="your@email.com"
                              className="pl-9 rounded-lg border-border focus:border-primary bg-background text-foreground"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                              href="/forgot-password"
                              className="text-xs text-primary hover:text-primary/80 hover:underline underline-offset-2"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              className="pl-9 rounded-lg border-border focus:border-primary bg-background text-foreground"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox id="remember" />
                          <label
                            htmlFor="remember"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                          >
                            Remember me
                          </label>
                        </div>

                        <div className="pt-4">
                          <Button
                            type="submit"
                            className="w-full rounded-lg"
                            disabled={isLoading || isGoogleLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              <>
                                Sign In
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button></div>
                      </div>
                    </form>

                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-2 bg-card/80 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="rounded-lg border-border hover:bg-accent flex-1 bg-background text-foreground"
                          disabled={isLoading || isGoogleLoading || isMicrosoftLoading}
                          aria-label="Sign in with Google"
                          onClick={handleGoogleLoginRedirect}
                        >
                          {isGoogleLoading ? (
                            <>
                              <FcGoogle className="h-6 w-6 mr-2" />
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </>
                          ) : (
                            <>
                              <FcGoogle className="h-6 w-6 mr-2" />
                              Google
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          className="rounded-lg border-border hover:bg-accent flex-1 bg-background text-foreground"
                          disabled={isLoading || isGoogleLoading || isMicrosoftLoading}
                          aria-label="Sign in with Microsoft"
                          onClick={handleMicrosoftLoginRedirect}
                        >
                          {isMicrosoftLoading ? (
                            <>
                              <FaMicrosoft className="h-4 w-4 mr-2 text-[#00a4ef]" />
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </>
                          ) : (
                            <>
                              <FaMicrosoft className="h-4 w-4 mr-2 text-[#00a4ef]" />
                              Microsoft
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 text-center text-sm">
                      <p className="text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("register")}
                          className="text-primary hover:text-primary/80 hover:underline underline-offset-2 font-medium"
                        >
                          Register now
                        </button>
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="register" className="mt-4">
                    <RegisterUser />

                    <div className="mt-6 text-center text-sm">
                      <p className="text-muted-foreground">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("login")}
                          className="text-primary hover:text-primary/80 hover:underline underline-offset-2 font-medium"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                By signing in or creating an account, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:text-primary/80 hover:underline underline-offset-2">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:text-primary/80 hover:underline underline-offset-2">
                  Privacy Policy
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}