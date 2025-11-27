import { requireAuth } from '@/lib/auth';
import { ItemForm } from '@/components/items/ItemForm';

export default async function NewItemPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Item</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new item in your rental inventory
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <ItemForm mode="create" />
        </div>
      </div>
    </div>
  );
}
