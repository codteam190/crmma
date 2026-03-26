"use client";

import Link from 'next/link';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }), 
      });

      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Something went wrong!");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Server error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] relative overflow-hidden py-10">
      <div className="bg-white p-10 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 w-full max-w-[450px] z-10">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Create Account</h2>
          <p className="text-gray-500 text-sm">Get your free LeadsBounty account now</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-md text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400 text-sm transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400 text-sm transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">WhatsApp Number</label>
            <div className="flex items-center border border-gray-200 rounded-md focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 overflow-hidden bg-white transition-all">
              <div className="flex items-center pl-3 pr-2 py-2.5 bg-gray-50/50 border-r border-gray-200">
                <span className="text-lg leading-none mr-2">🇲🇦</span>
                <span className="text-sm text-gray-700 font-medium">+212</span>
              </div>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="6XX XX XX XX"
                className="w-full px-3 py-2.5 focus:outline-none text-gray-800 text-sm" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400 text-sm transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400 text-sm transition-all" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-medium py-3 rounded-md transition duration-200 text-sm mt-2 flex justify-center items-center ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#3b82f6] hover:bg-blue-600'}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-gray-700 font-bold hover:text-blue-500 transition-colors">Sign In</Link>
        </div>
      </div>
    </div>
  );
}