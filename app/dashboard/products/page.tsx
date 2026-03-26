import AddProductModal from '@/components/AddProductModal';
import ProductsClient from '@/components/ProductsClient';

export const metadata = {
  title: "Products | CRM",
};

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Warehouse</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your inventory, prices, and add new products.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <AddProductModal />
        </div>
      </div>

      {/* Client Component (Convex) */}
      <ProductsClient />

    </div>
  );
}