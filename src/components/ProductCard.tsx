import React, { useState } from "react";
import { ProductItem } from "../types";
import { ShoppingCart, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCardProps {
  product: ProductItem;
  onAddToCart: (p: ProductItem) => void;
  onBuyNow: (p: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onBuyNow }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Fallback to single image list
  const imagesList = product.images && product.images.length > 0 
    ? product.images 
    : product.image 
      ? [product.image] 
      : [];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagesList.length <= 1) return;
    setActiveImageIdx((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagesList.length <= 1) return;
    setActiveImageIdx((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="glass-panel p-5.5 rounded-2xl flex flex-col justify-between text-left group hover:scale-[1.01] hover:shadow-md transition-all animate-fade-up bg-white border border-gray-100"
    >
      <div className="space-y-4.5">
        
        {/* Product image (Carousel supporting multi-images) */}
        <div className="relative aspect-video rounded-xl bg-gray-100/70 border border-gray-50 overflow-hidden group/img">
          {imagesList.length > 0 ? (
            <>
              <img
                src={imagesList[activeImageIdx]}
                alt={`${product.name} - View ${activeImageIdx + 1}`}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-102 transition-transform duration-350"
              />

              {/* Navigation arrows overlay - only shows on image container hover if > 1 image */}
              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-teal-600 p-1.5 rounded-full shadow-md backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 cursor-pointer focus:outline-none"
                    title="Previous Image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-teal-600 p-1.5 rounded-full shadow-md backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 cursor-pointer focus:outline-none"
                    title="Next Image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Dot markers indicators */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full">
                    {imagesList.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setActiveImageIdx(i); }}
                        className={`h-1.5 w-1.5 rounded-full transition-all cursor-pointer focus:outline-none ${
                          i === activeImageIdx ? "bg-white w-3" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50/50 to-purple-50/40 text-gray-400">
              <span className="font-sans text-3xl">🛍️</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-teal-600/80 font-bold mt-2">Certified Component Pack</span>
            </div>
          )}

          <span className="absolute top-2.5 right-2.5 text-[9px] font-mono tracking-wide uppercase font-bold bg-white text-gray-500 rounded px-2.5 py-1 shadow-xs border border-gray-100/50">
            {product.category}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-gray-800 leading-snug tracking-tight">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

      </div>

      {/* Price and Stock levels */}
      <div className="mt-5 pt-4.5 border-t border-gray-100/60 flex items-center justify-between">
        <div>
          <header className="text-[10px] uppercase text-gray-400 font-medium font-sans">Price INR *</header>
          <strong className="text-lg font-extrabold text-teal-700">₹{product.price.toLocaleString("en-IN")}</strong>
        </div>
        
        <div className="text-right">
          <header className="text-[10px] uppercase text-gray-400 font-medium font-sans">Storage Stock</header>
          {product.stock > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 font-mono">
              <Check className="h-3 w-3" />
              In stock ({product.stock})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 font-mono">
              Out of stock
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-teal-500/20 bg-teal-50/30 hover:bg-teal-50 text-teal-700 py-2.8 text-xs font-bold cursor-pointer transition-all disabled:opacity-40"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
        <button
          onClick={() => onBuyNow(product)}
          disabled={product.stock === 0}
          className="inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-2.8 text-xs font-bold cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40"
        >
          Buy Now
        </button>
      </div>

    </div>
  );
};
