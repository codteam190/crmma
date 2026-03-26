"use client";

import Link from 'next/link';
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh(); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] relative overflow-hidden">
      <div className="bg-white p-10 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 w-full max-w-[450px] z-10">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Welcome Back!</h2>
          <p className="text-gray-500 text-sm">Sign in to continue.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-md text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-blue-50/50 text-gray-800 text-sm transition-all" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-900">Password</label>
              <Link href="#" className="text-xs text-blue-500 hover:underline">Forgot Password?</Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-blue-50/50 text-gray-800 text-sm tracking-widest transition-all" 
            />
          </div>

          <div className="flex items-center pt-1 pb-2">
            <input 
              type="checkbox" 
              id="remember" 
              className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-400 cursor-pointer" 
            />
            <label htmlFor="remember" className="ml-2 block text-sm font-medium text-gray-900 cursor-pointer">
              Remember me
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-medium py-3 rounded-md transition duration-200 text-sm flex justify-center items-center ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#3b82f6] hover:bg-blue-600'}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account? <Link href="/signup" className="text-gray-700 font-bold hover:text-blue-500 transition-colors">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}