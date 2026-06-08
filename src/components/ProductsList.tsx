import React, { useState, useEffect } from "react";
import { db, handleFirestoreError } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ProductItem, OperationType } from "../types";
import { Search, SlidersHorizontal, AlertCircle } from "lucide-react";
import { useNotifications } from "./NotificationsContext";
import { ProductCard } from "./ProductCard";

interface ProductsListProps {
  onAddToCart: (product: ProductItem) => void;
  onBuyNow: (product: ProductItem) => void;
}

const CATEGORIES = ["All", "Motherboards", "Batteries", "Chargers", "RAM", "Spares"];

export const ProductsList: React.FC<ProductsListProps> = ({ onAddToCart, onBuyNow }) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local filter conditions
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortKey, setSortKey] = useState<"featured" | "price-low" | "price-high" | "stock">("featured");
  const { triggerNotification } = useNotifications();

  useEffect(() => {
    // Realtime snapshot sync: so customers can see live inventories in real-time!
    const unsub = onSnapshot(
      collection(db, "products"),
      (snap) => {
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ProductItem[];

        // Seed initial products if none exist
        if (items.length === 0) {
          setProducts([
            { id: "p1", name: "Dell Inspiron Motherboard API Module", category: "Motherboards", price: 7500, stock: 12, description: "Compatible with modern high performance chip systems." },
            { id: "p2", name: "Premium Apple logic power supply component", category: "Motherboards", price: 9200, stock: 3, description: "Highly stable Apple workstation power interface module." },
            { id: "p3", name: "Heavy-Duty Laptop Battery Workstation pack", category: "Batteries", price: 2800, stock: 24, description: "Guaranteed 4-cell brand OEM replacement battery pack." },
            { id: "p4", name: "Universal Apple logic USB-C fast charger", category: "Chargers", price: 3400, stock: 18, description: "Premium certified replacement charger desk set." },
            { id: "p5", name: "High Speed DDR5 RAM 16GB component", category: "RAM", price: 5400, stock: 8, description: "Fast memory modules supporting multithread operations." },
          ]);
        } else {
          setProducts(items);
        }
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "products");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = selectedCategory === "All" || p.category === selectedCategory;
      
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortKey === "price-low") return a.price - b.price;
      if (sortKey === "price-high") return b.price - a.price;
      if (sortKey === "stock") return b.stock - a.stock;
      return 0; // featured retains relative ID order
    });

  const handleCartAdd = (p: ProductItem) => {
    onAddToCart(p);
    triggerNotification("Item added to cart", `${p.name} has been added to your checkout session!`, "order");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 space-y-10 border-t border-gray-100 animate-fade-up">
      
      {/* Search and control drawers */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 space-y-6 text-left">
        <h2 className="text-xl font-bold font-sans text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-teal-500" />
          Filter Accessories & Spares
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search components, brand name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 pl-10.5 pr-4.5 py-3 text-gray-800 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-gray-500 focus:bg-white cursor-pointer"
            >
              <option disabled>Filter Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-gray-500 focus:bg-white cursor-pointer"
            >
              <option disabled>Order Sorting</option>
              <option value="featured">Featured Spares</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock">In Stock First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog items grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-teal-600 space-y-4">
          <div className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Synchronizing verified parts inventories...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-dashed border-gray-200 rounded-3xl space-y-3.5">
          <AlertCircle className="h-10 w-10 text-gray-400 mx-auto" />
          <h4 className="text-sm font-bold text-gray-700">No matching components found</h4>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">Try updating search phrases, clearing custom filters, or categories selections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={handleCartAdd}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}

    </section>
  );
};
