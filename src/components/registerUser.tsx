'use client'
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { useState } from "react"
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { FaMicrosoft } from "react-icons/fa"
import { registerAction, loginWithGoogleAction, loginWithAzureAction } from "@/app/actions/auth"

export default function RegisterUser() {
   const [fullName, setFullName] = useState("")
   const [email, setEmail] = useState("")
   const [password, setPassword] = useState("")
   const [isLoading, setIsLoading] = useState(false)
   const [isGoogleLoading, setIsGoogleLoading] = useState(false)
   const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)

      const urlParams = new URLSearchParams(window.location.search)
      const callback = urlParams.get("callbackUrl") || undefined

      try {
         const data = await registerAction(email, password, fullName, callback)

         if (data.error) {
            alert(data.error || "Something went wrong.")
            return
         }

         // ✅ Registration success
         alert("Account created successfully!")
         setFullName("")
         setEmail("")
         setPassword("")
         window.location.href = data.redirect || "/"
      } catch (error) {
         alert("Error: " + (error as Error).message)
      } finally {
         setIsLoading(false)
      }
   }

   const handleGoogleSignIn = async (e: React.MouseEvent) => {
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
   }

   const handleMicrosoftSignIn = async (e: React.MouseEvent) => {
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
   }

   return (
      <div>
         <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground mt-1">Enjoy our mulidimensional virtual try-on and much more...</p>
         </div>

         <form onSubmit={handleSubmit}>
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                     id="fullName"
                     type="text"
                     placeholder="Your Full Name"
                     className="rounded-lg border-border focus:border-primary bg-background text-foreground"
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     required
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                     <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                     <Input
                        id="register-email"
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
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                     <Input
                        id="register-password"
                        type="password"
                        placeholder="A-z0-9!@#$%^&*()_+"
                        className="pl-9 rounded-lg border-border focus:border-primary bg-background text-foreground"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        maxLength={20}
                     />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Password must be at least 8 characters long</p>
               </div>

               <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <label
                     htmlFor="terms"
                     className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                  >
                     I agree to the{" "}
                     <a
                        href="/terms-of-service"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 hover:underline underline-offset-2 font-medium"
                     >
                        Terms of Service
                     </a>{" "}
                     and{" "}
                     <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 hover:underline underline-offset-2 font-medium"
                     >
                        Privacy Policy
                     </a>
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
                           Creating account...
                        </>
                     ) : (
                        <>
                           Create Account
                           <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                     )}
                  </Button>
               </div>
            </div>
         </form>

         <div className="mt-6">
            <div className="relative">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
               </div>
               <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-card/80 text-muted-foreground">Or continue with</span>
               </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
               <Button
                  variant="outline"
                  className="rounded-lg border-border hover:bg-accent flex-1 bg-background text-foreground"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isMicrosoftLoading || isLoading}
               >
                  {isGoogleLoading ? (
                     <>
                        <FcGoogle className="mr-2 h-4 w-4" />
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     </>
                  ) : (
                     <>
                        <FcGoogle className="mr-2 h-4 w-4" />
                        Google
                     </>
                  )}
               </Button>

               <Button
                  variant="outline"
                  className="rounded-lg border-border hover:bg-accent flex-1 bg-background text-foreground"
                  onClick={handleMicrosoftSignIn}
                  disabled={isGoogleLoading || isMicrosoftLoading || isLoading}
               >
                  {isMicrosoftLoading ? (
                     <>
                        <FaMicrosoft className="mr-2 h-4 w-4 text-[#00a4ef]" />
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     </>
                  ) : (
                     <>
                        <FaMicrosoft className="mr-2 h-4 w-4 text-[#00a4ef]" />
                        Microsoft
                     </>
                  )}
               </Button>
            </div>
         </div>
      </div>
   )
}
