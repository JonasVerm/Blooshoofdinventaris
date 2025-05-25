import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import { ArrowLeft, Package, Tag, CalendarDays, DollarSign, Boxes, Palette } from "lucide-react";

type ItemPageParams = {
  itemId: Id<"items">; 
};

// Define a more specific type for the item, including associatedKits
type ItemWithKits = NonNullable<ReturnType<typeof useQuery<typeof api.items.get>>>;


export default function ItemDetailPage() {
  const { itemId } = useParams<ItemPageParams>();
  const item = useQuery(api.items.get, itemId ? { id: itemId } : "skip") as ItemWithKits | undefined | null;

  if (item === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-destructive mb-4">Item not found</h2>
        <Link to="/" className="text-primary hover:underline">
          Go back to Inventory
        </Link>
      </div>
    );
  }

  const itemPageUrl = window.location.href;

  const formatDate = (timestamp: number | null | undefined): string => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-primary hover:text-primary-hover mb-6 text-sm"
      >
        <ArrowLeft size={18} /> Back to Inventory
      </Link>

      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 flex flex-col items-center">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="w-full max-w-xs h-auto object-cover rounded-lg shadow-md mb-4"
              />
            ) : (
              <div className="w-full max-w-xs h-64 bg-gray-100 flex items-center justify-center rounded-lg shadow-md mb-4">
                <Package size={64} className="text-gray-400" />
              </div>
            )}
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
               <QRCode value={itemPageUrl} size={160} level="H" />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Scan to view this page</p>
          </div>

          <div className="md:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">{item.name}</h1>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">{item.description || "No description provided."}</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <DollarSign size={20} className="text-primary" />
                <span className="text-gray-700 font-medium">Price:</span>
                <span className="text-gray-900 text-lg font-semibold">${item.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <Tag size={20} className="text-primary" />
                <span className="text-gray-700 font-medium">Category:</span>
                <span className="text-gray-900">{item.categoryName}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <CalendarDays size={20} className="text-primary" />
                <span className="text-gray-700 font-medium">Purchased Date:</span>
                <span className="text-gray-900">{formatDate(item.purchasedDate)}</span>
              </div>
               <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <Package size={20} className="text-primary" />
                <span className="text-gray-700 font-medium">Item ID:</span>
                <span className="text-gray-900 text-xs">{item._id}</span>
              </div>

              {item.associatedKits && item.associatedKits.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Boxes size={20} className="text-primary" />
                    <span className="text-gray-700 font-medium">Part of Kits:</span>
                  </div>
                  <ul className="space-y-1 pl-1">
                    {item.associatedKits.map(kit => (
                      <li key={kit._id} className="flex items-center text-sm">
                        {kit.color && (
                          <Palette size={14} style={{ color: kit.color }} className="mr-2 flex-shrink-0" />
                        )}
                        <span className="text-gray-800" style={{ color: kit.color || 'inherit' }}>
                          {kit.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
