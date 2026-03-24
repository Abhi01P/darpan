'use client';
export default function ForgotPassword() {

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Handle password reset logic here
      alert("Password reset link sent to your email!");
   }

   return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
         <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold text-center mb-6">Forgot Password</h1>
            <p className="text-gray-600 text-center mb-4">
               Enter your email address to reset your password.
            </p>
            <form>
               <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                  </label>
                  <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@example.com"
                  required
                  />
               </div>
               <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleSubmit}
               >
                  Send Reset Link
               </button>
            </form>
            <div className="mt-4 text-sm text-center text-gray-500">
               Remembered your password?{" "}
               <a href="/sign-in" className="text-blue-600 hover:underline">
                  Sign In
               </a>
            </div>
         </div>
      </div>
   );
}