import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { PlusCircle, Edit3, Trash2, Package, PackagePlus, ListFilter, XCircle, ImageUp, ShoppingCart, Boxes, Tag, CalendarDays, ChevronRight, Palette } from "lucide-react";
import { Link } from "react-router-dom";

// Adjusted types to correctly infer from useQuery's return type
type ItemListType = ReturnType<typeof useQuery<typeof api.items.list>>;
type Item = NonNullable<ItemListType>[number]; // This now includes associatedKits

type KitListType = ReturnType<typeof useQuery<typeof api.kits.list>>;
type Kit = NonNullable<KitListType>[number];

type CategoryListType = ReturnType<typeof useQuery<typeof api.categories.list>>;
type Category = NonNullable<CategoryListType>[number];


const initialItemFormState = {
  name: "",
  description: "",
  categoryId: "" as Id<"categories"> | "",
  price: 0,
  purchasedDate: "" as string, // Store as YYYY-MM-DD string for input
  thumbnailFile: null as File | null,
};

const initialKitFormState = {
  name: "",
  description: "",
  itemIds: [] as Id<"items">[],
  price: 0,
  color: "", // Added color field
};

const initialCategoryFormState = {
  name: "",
};


export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState<"items" | "categories" | "kits">(
    "items"
  );

  // Items State
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemFormData, setItemFormData] = useState(initialItemFormState);
  const [editingItemId, setEditingItemId] = useState<Id<"items"> | null>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState<Id<"categories"> | "all">("all");

  // Categories State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState(initialCategoryFormState);
  const [editingCategoryId, setEditingCategoryId] = useState<Id<"categories"> | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  // Kits State
  const [showKitModal, setShowKitModal] = useState(false);
  const [kitFormData, setKitFormData] = useState(initialKitFormState);
  const [editingKitId, setEditingKitId] = useState<Id<"kits"> | null>(null);
  const [kitSearchTerm, setKitSearchTerm] = useState("");


  // Convex Hooks
  const categories = useQuery(api.categories.list) || [];
  const itemsData = useQuery(api.items.list, { categoryId: itemCategoryFilter === "all" ? undefined : itemCategoryFilter });
  const items = itemsData || [];
  const kitsData = useQuery(api.kits.list);
  const kits = kitsData || [];


  const createCategory = useMutation(api.categories.create);

  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const deleteItem = useMutation(api.items.remove);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const createKit = useMutation(api.kits.create);
  const updateKit = useMutation(api.kits.update);
  const deleteKit = useMutation(api.kits.remove);


  // Effects to reset forms when modals close
  useEffect(() => {
    if (!showItemModal) {
      setItemFormData(initialItemFormState);
      setEditingItemId(null);
    }
  }, [showItemModal]);

  useEffect(() => {
    if (!showCategoryModal) {
      setCategoryFormData(initialCategoryFormState);
      setEditingCategoryId(null);
    }
  }, [showCategoryModal]);

   useEffect(() => {
    if (!showKitModal) {
      setKitFormData(initialKitFormState);
      setEditingKitId(null);
    }
  }, [showKitModal]);


  // Item Handlers
  const handleItemInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setItemFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleItemFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setItemFormData((prev) => ({ ...prev, thumbnailFile: e.target.files![0] }));
    }
  };

  const handleItemSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name || !itemFormData.categoryId || itemFormData.price < 0) {
      toast.error("Please fill in all required item fields and ensure price is not negative.");
      return;
    }

    let thumbnailStorageId: Id<"_storage"> | undefined = undefined;
    if (itemFormData.thumbnailFile) {
      try {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": itemFormData.thumbnailFile.type },
          body: itemFormData.thumbnailFile,
        });
        const json = await result.json();
        if (!result.ok) {
          throw new Error(`Upload failed: ${JSON.stringify(json)}`);
        }
        thumbnailStorageId = json.storageId;
      } catch (error) {
        console.error(error);
        toast.error("Failed to upload thumbnail: " + (error as Error).message);
        return;
      }
    }
    
    const purchasedDateTimestamp = itemFormData.purchasedDate ? new Date(itemFormData.purchasedDate).getTime() : undefined;

    try {
      if (editingItemId) {
        const existingItem = items.find(i => i._id === editingItemId);
        await updateItem({
          id: editingItemId,
          name: itemFormData.name,
          description: itemFormData.description,
          categoryId: itemFormData.categoryId as Id<"categories">,
          price: itemFormData.price,
          purchasedDate: purchasedDateTimestamp,
          thumbnailStorageId: thumbnailStorageId ?? existingItem?.thumbnailStorageId,
        });
        toast.success("Item updated successfully!");
      } else {
        await createItem({
          name: itemFormData.name,
          description: itemFormData.description,
          categoryId: itemFormData.categoryId as Id<"categories">,
          price: itemFormData.price,
          purchasedDate: purchasedDateTimestamp,
          ...(thumbnailStorageId && { thumbnailStorageId }),
        });
        toast.success("Item created successfully!");
      }
      setShowItemModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save item: " + (error as Error).message);
    }
  };

  const handleEditItem = (e: React.MouseEvent, item: Item) => {
    e.preventDefault(); // Prevent Link navigation when clicking edit
    e.stopPropagation(); // Stop event from bubbling to Link
    if (!item) return;
    setEditingItemId(item._id);
    // Convert timestamp to YYYY-MM-DD for date input
    const purchasedDateString = item.purchasedDate ? new Date(item.purchasedDate).toISOString().split('T')[0] : "";
    setItemFormData({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      price: item.price,
      purchasedDate: purchasedDateString,
      thumbnailFile: null, 
    });
    setShowItemModal(true);
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: Id<"items">) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Stop event from bubbling to Link
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      try {
        await deleteItem({ id });
        toast.success("Item deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete item: " + (error as Error).message);
      }
    }
  };

  // Category Handlers
  const handleCategoryInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCategoryFormData({ name: e.target.value });
  };

  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      toast.error("Category name cannot be empty.");
      return;
    }
    try {
      await createCategory({ name: categoryFormData.name });
      toast.success("Category created!");
      setShowCategoryModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category: " + (error as Error).message);
    }
  };

  // Kit Handlers
  const handleKitInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setKitFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleKitItemsChange = (itemId: Id<"items">) => {
    setKitFormData((prev) => {
      const newItems = prev.itemIds.includes(itemId)
        ? prev.itemIds.filter((id) => id !== itemId)
        : [...prev.itemIds, itemId];
      return { ...prev, itemIds: newItems };
    });
  };

 const handleKitSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!kitFormData.name || kitFormData.itemIds.length === 0 || kitFormData.price < 0) {
      toast.error("Please fill in kit name, select at least one item, and ensure price is not negative.");
      return;
    }
    try {
      if (editingKitId) {
        await updateKit({
          id: editingKitId,
          name: kitFormData.name,
          description: kitFormData.description,
          itemIds: kitFormData.itemIds,
          price: kitFormData.price,
          color: kitFormData.color || undefined, // Pass undefined if color is empty
        });
        toast.success("Kit updated successfully!");
      } else {
        await createKit({
          name: kitFormData.name,
          description: kitFormData.description,
          itemIds: kitFormData.itemIds,
          price: kitFormData.price,
          color: kitFormData.color || undefined, // Pass undefined if color is empty
        });
        toast.success("Kit created successfully!");
      }
      setShowKitModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save kit: " + (error as Error).message);
    }
  };

  const handleEditKit = (kit: Kit) => {
    if (!kit) return;
    setEditingKitId(kit._id);
    setKitFormData({
      name: kit.name,
      description: kit.description,
      itemIds: kit.itemIds,
      price: kit.price,
      color: kit.color || "", // Set color, default to empty string if undefined
    });
    setShowKitModal(true);
  };

  const handleDeleteKit = async (id: Id<"kits">) => {
    if (window.confirm("Are you sure you want to delete this kit? This action cannot be undone.")) {
      try {
        await deleteKit({ id });
        toast.success("Kit deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete kit: " + (error as Error).message);
      }
    }
  };


  // Filtered data
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const filteredKits = kits.filter(kit =>
    kit.name.toLowerCase().includes(kitSearchTerm.toLowerCase()) ||
    (kit.description && kit.description.toLowerCase().includes(kitSearchTerm.toLowerCase()))
  );

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  const renderTabs = () => (
    <div className="mb-6 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {(["items", "categories", "kits"] as const).map((tabName) => (
          <button
            key={tabName}
            onClick={() => setActiveTab(tabName)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize flex items-center gap-2
              ${activeTab === tabName
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            {tabName === "items" && <ShoppingCart size={18} />}
            {tabName === "categories" && <Tag size={18} />}
            {tabName === "kits" && <Boxes size={18} />}
            {tabName}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderItems = () => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search items..."
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm w-full sm:w-auto"
            value={itemSearchTerm}
            onChange={(e) => setItemSearchTerm(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white w-full sm:w-auto"
            value={itemCategoryFilter}
            onChange={(e) => setItemCategoryFilter(e.target.value as Id<"categories"> | "all")}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setEditingItemId(null); setItemFormData(initialItemFormState); setShowItemModal(true); }}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto mt-2 sm:mt-0"
        >
          <PlusCircle size={20} /> Add Item
        </button>
      </div>
      {items === undefined && <p className="text-gray-500 text-center py-5">Loading items...</p>}
      {items && filteredItems.length === 0 && <p className="text-gray-500 text-center py-5">No items found. Try adjusting your search or filters, or add a new item.</p>}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredItems.map((item) => (
            <li key={item._id}>
              <Link to={`/item/${item._id}`} className="block hover:bg-gray-50 transition-colors group">
                <div className="flex items-center px-4 py-3 sm:px-6">
                  <div className="flex-shrink-0 mr-4">
                    {item.thumbnailUrl ? (
                      <img className="h-12 w-12 rounded-md object-cover" src={item.thumbnailUrl} alt={item.name} />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="truncate">
                      <div className="flex text-sm">
                        <p className="font-medium text-primary truncate group-hover:underline">{item.name}</p>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <Tag size={14} className="mr-1 text-gray-400" />
                        <p>{item.categoryName}</p>
                      </div>
                      {item.associatedKits && item.associatedKits.length > 0 && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Boxes size={14} className="mr-1 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {item.associatedKits.map(kit => (
                              <span key={kit._id} className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: kit.color ? kit.color + '20' : '#e5e7eb', color: kit.color || '#4b5563' }}>
                                {kit.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex-shrink-0 sm:mt-0 sm:ml-5">
                      <div className="flex items-center text-sm text-gray-900 font-semibold">
                        ${item.price.toFixed(2)}
                      </div>
                       <div className="mt-1 flex items-center text-xs text-gray-500">
                          <CalendarDays size={14} className="mr-1 text-gray-400" />
                          <p>Purchased: {formatDate(item.purchasedDate)}</p>
                        </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditItem(e, item)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
                      title="Edit Item"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteItem(e, item._id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 size={18} />
                    </button>
                     <ChevronRight size={20} className="text-gray-400 group-hover:text-primary" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search categories..."
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm w-full sm:w-auto"
          value={categorySearchTerm}
          onChange={(e) => setCategorySearchTerm(e.target.value)}
        />
        <button
          onClick={() => { setEditingCategoryId(null); setCategoryFormData(initialCategoryFormState); setShowCategoryModal(true); }}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto mt-2 sm:mt-0"
        >
          <PlusCircle size={20} /> Add Category
        </button>
      </div>
      {categories === undefined && <p className="text-gray-500 text-center py-5">Loading categories...</p>}
      {categories && filteredCategories.length === 0 && <p className="text-gray-500 text-center py-5">No categories found. Try adding a new one.</p>}
      <ul className="space-y-3">
        {filteredCategories.map((category) => (
          <li key={category._id} className="bg-white p-4 shadow rounded-lg flex justify-between items-center">
            <span className="text-gray-700 font-medium">{category.name}</span>
            {/* Add Edit/Delete for categories later if needed */}
          </li>
        ))}
      </ul>
    </div>
  );

  const renderKits = () => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
         <input
          type="text"
          placeholder="Search kits..."
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm w-full sm:w-auto"
          value={kitSearchTerm}
          onChange={(e) => setKitSearchTerm(e.target.value)}
        />
        <button
          onClick={() => { setEditingKitId(null); setKitFormData(initialKitFormState); setShowKitModal(true); }}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto mt-2 sm:mt-0"
        >
          <PackagePlus size={20} /> Add Kit
        </button>
      </div>
      {kits === undefined && <p className="text-gray-500 text-center py-5">Loading kits...</p>}
      {kits && filteredKits.length === 0 && <p className="text-gray-500 text-center py-5">No kits found. Try adding a new one.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredKits.map((kit) => (
          <div key={kit._id} className="bg-white shadow-lg rounded-lg p-5 flex flex-col" style={{ borderColor: kit.color || 'transparent', borderLeftWidth: kit.color ? '4px' : '0px' }}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-800">{kit.name}</h3>
              {kit.color && (
                <div className="flex items-center gap-1">
                   <Palette size={16} style={{ color: kit.color }} />
                   <span className="text-xs" style={{ color: kit.color }}>{kit.color}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1 flex-grow min-h-[20px] overflow-hidden text-ellipsis" title={kit.description}>{kit.description || "No description"}</p>
            <p className="text-lg font-bold text-primary mb-3">${kit.price.toFixed(2)}</p>
            <div className="mb-3 flex-grow">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Items in kit:</h4>
              {kit.items && kit.items.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-24 overflow-y-auto">
                  {kit.items.map(item => <li key={item._id}>{item.name} (Purchased: {formatDate(item.purchasedDate)})</li>)}
                </ul>
              ) : <p className="text-xs text-gray-500">No items in this kit.</p>}
            </div>
            <div className="flex justify-end gap-2 border-t pt-3 mt-auto">
              <button
                onClick={() => handleEditKit(kit)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
                title="Edit Kit"
              >
                <Edit3 size={20} />
              </button>
              <button
                onClick={() => handleDeleteKit(kit._id)}
                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                title="Delete Kit"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-0 sm:px-4 py-2">
      {renderTabs()}
      {activeTab === "items" && renderItems()}
      {activeTab === "categories" && renderCategories()}
      {activeTab === "kits" && renderKits()}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-primary">
                {editingItemId ? "Edit Item" : "Add New Item"}
              </h2>
              <button onClick={() => setShowItemModal(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name*</label>
                <input type="text" name="name" id="name" value={itemFormData.name} onChange={handleItemInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" value={itemFormData.description} onChange={handleItemInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea>
              </div>
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category*</label>
                <select name="categoryId" id="categoryId" value={itemFormData.categoryId} onChange={handleItemInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white">
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (€)*</label>
                  <input type="number" name="price" id="price" value={itemFormData.price} onChange={handleItemInputChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="purchasedDate" className="block text-sm font-medium text-gray-700">Purchased Date</label>
                  <input type="date" name="purchasedDate" id="purchasedDate" value={itemFormData.purchasedDate} onChange={handleItemInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="thumbnailFile" className="block text-sm font-medium text-gray-700">Thumbnail Image</label>
                <div className="mt-1 flex items-center gap-2">
                  <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center gap-1">
                    <ImageUp size={16}/> Upload File
                    <input id="thumbnailFile" name="thumbnailFile" type="file" onChange={handleItemFileChange} accept="image/*" className="sr-only" />
                  </label>
                  {itemFormData.thumbnailFile && <span className="text-sm text-gray-500">{itemFormData.thumbnailFile.name}</span>}
                </div>
                {editingItemId && items.find(i => i._id === editingItemId)?.thumbnailUrl && !itemFormData.thumbnailFile && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Current thumbnail:</p>
                    <img src={items.find(i => i._id === editingItemId)?.thumbnailUrl!} alt="Current thumbnail" className="h-20 w-20 object-cover rounded"/>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 shadow-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm">
                  {editingItemId ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-primary">
                  {editingCategoryId ? "Edit Category" : "Add New Category"}
                </h2>
                <button onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">Category Name*</label>
                <input type="text" name="categoryName" id="categoryName" value={categoryFormData.name} onChange={handleCategoryInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 shadow-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm">
                  {editingCategoryId ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kit Modal */}
      {showKitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-primary">
                {editingKitId ? "Edit Kit" : "Create New Kit"}
              </h2>
              <button onClick={() => setShowKitModal(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleKitSubmit} className="space-y-4">
              <div>
                <label htmlFor="kitName" className="block text-sm font-medium text-gray-700">Kit Name*</label>
                <input type="text" name="name" id="kitName" value={kitFormData.name} onChange={handleKitInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="kitDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="kitDescription" value={kitFormData.description} onChange={handleKitInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="kitPrice" className="block text-sm font-medium text-gray-700">Kit Price (€)*</label>
                  <input type="number" name="price" id="kitPrice" value={kitFormData.price} onChange={handleKitInputChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="kitColor" className="block text-sm font-medium text-gray-700">Color Tag</label>
                  <input type="text" name="color" id="kitColor" value={kitFormData.color} onChange={handleKitInputChange} placeholder="e.g., red, #FF0000" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Items for Kit*</label>
                {items.length === 0 && <p className="text-xs text-red-500 mt-1">No items available. Please add items first to create a kit.</p>}
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {items.map(item => (
                    <div key={item._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`kit-item-${item._id}`}
                        checked={kitFormData.itemIds.includes(item._id)}
                        onChange={() => handleKitItemsChange(item._id)}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor={`kit-item-${item._id}`} className="ml-2 block text-sm text-gray-700">
                        {item.name} (${item.price.toFixed(2)}) - Purchased: {formatDate(item.purchasedDate)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowKitModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 shadow-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm" disabled={items.length === 0 && !editingKitId && kitFormData.itemIds.length === 0}>
                  {editingKitId ? "Save Changes" : "Create Kit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
