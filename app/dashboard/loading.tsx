// app/dashboard/loading.tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-10">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">Loading data...</p>
    </div>
  );
}