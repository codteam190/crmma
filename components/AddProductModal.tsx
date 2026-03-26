"use client";

import { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AddProductModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🪄 Convex Mutation
  const addProduct = useMutation(api.products.addProduct);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      await addProduct({
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        image: formData.get("image") as string || undefined,
        url: formData.get("url") as string || undefined,
        country: formData.get("country") as string,
      });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to add product. Make sure SKU is unique.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Product
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Image URL</label>
                  <input type="url" name="image" placeholder="https://..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Landing Page URL</label>
                  <input type="url" name="url" placeholder="https://store.com/product..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Product Name</label>
                  <input type="text" name="name" required placeholder="e.g. قوة الانضباط" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">SKU</label>
                  <input type="text" name="sku" required placeholder="PRD-001" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Country</label>
                  <select name="country" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500">
                    <option value="LB">Lebanon 🇱🇧</option>
                    <option value="EG">Egypt 🇪🇬</option>
                    <option value="MA">Morocco 🇲🇦</option>
                    <option value="SA">Saudi Arabia 🇸🇦</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}
    </>
  );
}