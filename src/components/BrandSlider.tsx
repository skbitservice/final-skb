import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { BrandItem } from "../types";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export const BrandSlider: React.FC = () => {
  const [brands, setBrands] = useState<BrandItem[]>([]);

  useEffect(() => {
    // Realtime sync with branding list
    const unsub = onSnapshot(
      collection(db, "brands"),
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BrandItem[];
        
        // Sort by creation time or name
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setBrands(list);
      },
      (err) => {
        console.warn("Realtime brands sync offline or fallback active:", err);
      }
    );

    return () => unsub();
  }, []);

  // Default elegant partner brands to display if the database is empty initially
  const defaultBrands = [
    { id: "d1", name: "Apple", createdAt: "" },
    { id: "d2", name: "Dell", createdAt: "" },
    { id: "d3", name: "HP Workstations", createdAt: "" },
    { id: "d4", name: "Lenovo ThinkPad", createdAt: "" },
    { id: "d5", name: "ASUS ROG", createdAt: "" },
    { id: "d6", name: "Acer Predator", createdAt: "" },
    { id: "d7", name: "MSI Core", createdAt: "" },
    { id: "d8", name: "Samsung Pro", createdAt: "" },
    { id: "d9", name: "Intel Xeon", createdAt: "" },
    { id: "d10", name: "AMD Ryzen", createdAt: "" },
  ];

  const activeBrands = brands.length > 0 ? brands : defaultBrands;

  // Multiply the active brands list to ensure a truly nonstop seamless scroll
  let duplicatedBrands = [...activeBrands];
  while (duplicatedBrands.length < 30) {
    duplicatedBrands = [...duplicatedBrands, ...activeBrands];
  }

  return (
    <div className="w-full bg-linear-to-r from-gray-50/10 via-gray-50/50 to-gray-50/10 border-y border-gray-150/50 py-8 overflow-hidden select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-4 flex items-center gap-2 text-left">
        <Sparkles className="h-4 w-4 text-teal-500 animate-pulse" />
        <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400 font-bold">
          Partner Brands & Supported Architectures
        </span>
      </div>

      <div className="relative w-full flex overflow-x-hidden">
        {/* Left gradient shading fader */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 25,
            repeat: Infinity,
          }}
          className="flex gap-14 whitespace-nowrap pl-4"
        >
          {duplicatedBrands.map((brand, idx) => (
            <div
              key={`${brand.id}-${idx}`}
              className="inline-flex items-center gap-2.5 bg-white border border-gray-100 px-4.5 py-2.5 rounded-full shadow-xs hover:border-teal-300 transition-colors"
            >
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-gray-800 font-sans text-xs font-bold leading-none tracking-tight">
                {brand.name}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Right gradient shading fader */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  );
};
