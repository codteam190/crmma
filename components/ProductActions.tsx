"use client";

import { useState } from 'react';
import { Edit, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ProductActions({ product }: { product: any }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🪄 Convex Mutations
  const updateProductMutation = useMutation(api.products.updateProduct);
  const deleteProductMutation = useMutation(api.products.deleteProduct);

  // Fonction dyal Edit
  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      await updateProductMutation({
        id: product._id, // 🚨 Darouri n-diro _id hna
        name: formData.get("name") as string,
        country: formData.get("country") as string,
        url: formData.get("url") as string || undefined,
        image: formData.get("image") as string || undefined, // ✅ ZEDNA IMAGE HNA BACH T-SSIFET L-CONVEX
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update product.");
    } finally {
      setIsLoading(false);
    }
  }

  // Fonction dyal Delete
  async function handleDelete() {
    setIsLoading(true);
    try {
      await deleteProductMutation({ id: product._id });
      setIsDeleteOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to delete product. It might be linked to orders.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button onClick={() => setIsEditOpen(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
        <Edit className="w-4 h-4" />
      </button>

      <button onClick={() => setIsDeleteOpen(true)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>

      {/* ================= EDIT POPUP ================= */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEdit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ✅ 7IYEDNA DISABLED W BDDELNA L-ALWAN BACH Y-BANN KHEDDAM */}
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Image URL</label>
                  <input type="url" name="image" defaultValue={product.image || ''} placeholder="https://..." className="w-full px-4 py-2.5 bg-gray-50 border rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Landing Page URL</label>
                  <input type="url" name="url" defaultValue={product.url || ''} placeholder="https://..." className="w-full px-4 py-2.5 bg-gray-50 border rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Product Name</label>
                  <input type="text" name="name" defaultValue={product.name} required className="w-full px-4 py-2.5 bg-gray-50 border rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">SKU</label>
                  <input type="text" name="sku" defaultValue={product.sku} disabled className="w-full px-4 py-2.5 bg-gray-100 text-gray-500 border rounded-lg outline-none cursor-not-allowed" />
                  <p className="text-[10px] text-gray-400">SKU cannot be changed once created.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Country</label>
                  <select name="country" defaultValue={product.country} required className="w-full px-4 py-2.5 bg-gray-50 border rounded-lg outline-none focus:border-blue-500">
                    <option value="LB">Lebanon 🇱🇧</option>
                    <option value="EG">Egypt 🇪🇬</option>
                    <option value="MA">Morocco 🇲🇦</option>
                    <option value="SA">Saudi Arabia 🇸🇦</option>
                  </select>
                </div>

              </div>
              
              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-5 py-2.5 text-gray-700 border rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">
                  <Save className="w-4 h-4" /> {isLoading ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE POPUP ================= */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone and will remove it from the database.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteOpen(false)} className="px-5 py-2.5 text-gray-700 border rounded-lg hover:bg-gray-50 font-medium">
                No, Keep it
              </button>
              <button onClick={handleDelete} disabled={isLoading} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50">
                {isLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}