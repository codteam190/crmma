import InventoryClient from '@/components/InventoryClient';

export const metadata = {
  title: "Inventory | CRM",
};

export default function InventoryPage() {
  return (
    <div>
      {/* 🪄 L-7ssab dyal Stock ghay-dar aoutomatiqument l-dakhel */}
      <InventoryClient />
    </div>
  );
}