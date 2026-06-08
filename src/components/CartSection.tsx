import React, { useState, useEffect } from "react";
import { db, handleFirestoreError } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { OrderItem, PurchaseOrder, OperationType } from "../types";
import { ShoppingBag, X, PlusCircle, MinusCircle, Truck, CreditCard, ShoppingCart, Award } from "lucide-react";
import { useNotifications } from "./NotificationsContext";

interface CartSectionProps {
  cart: OrderItem[];
  user: { email: string; name: string; role: "customer" | "admin" } | null;
  onUpdateQty: (productId: string, action: "increase" | "decrease") => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigateToTab: (tab: string) => void;
  onNavigateToAuth: () => void;
}

export const CartSection: React.FC<CartSectionProps> = ({
  cart,
  user,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onNavigateToTab,
  onNavigateToAuth,
}) => {
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");

  // Checkout inputs
  const [addressData, setAddressData] = useState({
    name: user?.name || "",
    phone: "",
    address: "",
    city: "New Delhi",
    state: "Delhi",
    zip: "110001",
  });

  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PurchaseOrder | null>(null);
  const [draftedEmail, setDraftedEmail] = useState("");
  const { triggerNotification } = useNotifications();

  // Keep contact inputs updated as user changes
  useEffect(() => {
    if (user) {
      setAddressData((prev) => ({
        ...prev,
        name: user.name,
      }));
    }
  }, [user]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingMethod === "express" ? 199 : 0;
  const grandTotal = subtotal + shippingCost;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login or create an account to proceed with checkout.");
      onNavigateToAuth();
      return;
    }

    if (!addressData.name || !addressData.phone || !addressData.address || !addressData.zip) {
      alert("Please enter full delivery and contact address information.");
      return;
    }

    setLoading(true);

    const orderId = `ORD-${Date.now()}`;
    const trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderPayload: PurchaseOrder = {
      id: orderId,
      userId: user.email,
      customerName: addressData.name,
      customerPhone: addressData.phone,
      customerEmail: user.email,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip,
      items: cart,
      subtotal,
      shipping: shippingCost,
      total: grandTotal,
      shippingMethod,
      paymentMethod,
      status: "Pending",
      trackingNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Save purchase order to Firestore
      await addDoc(collection(db, "orders"), orderPayload);

      // 2. Decrement stock levels of products in collection
      const unsub = onSnapshot(collection(db, "products"), async (snap) => {
        for (const item of cart) {
          const docSnap = snap.docs.find((d) => d.id === item.id);
          if (docSnap) {
            const currentStock = docSnap.data().stock || 0;
            const updatedStock = Math.max(0, currentStock - item.quantity);
            await updateDoc(doc(db, "products", docSnap.id), { stock: updatedStock });
          }
        }
      });
      setTimeout(() => unsub(), 2000);

      // 3. Draft beautifully written confirmation email server-side via Gemini API
      let draftedConfirmation = "";
      try {
        const mailResponse = await fetch("/api/generate-order-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            customerName: addressData.name,
            items: cart,
            total: grandTotal,
            status: "Pending",
            customerEmail: user.email,
          }),
        });
        
        if (mailResponse.ok) {
          const data = await mailResponse.json();
          draftedConfirmation = data.emailText;
          
          // Write record to email_logs
          await addDoc(collection(db, "email_logs"), {
            recipient: user.email,
            subject: data.subject || `Order Placed - ${orderId}`,
            content: draftedConfirmation,
            sentAt: new Date().toISOString(),
          });
        }
      } catch (mailError) {
        console.error("Gemini mail server request failed locally.", mailError);
      }

      setDraftedEmail(draftedConfirmation);
      setPlacedOrder(orderPayload);
      onClearCart();

      // Trigger standard audio notification
      triggerNotification(
        "Order Confirmed!",
        `Congratulations! Order ${orderId} has been submitted successfully to SKB technicians.`,
        "order"
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "orders");
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    return (
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center space-y-7 animate-fade-up">
        
        {/* Animated Celebration Burst */}
        <div className="flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <Award className="h-10 w-10 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-600 font-bold block">Congratulations!</span>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">Order Received Successfully</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
            Your transaction has been confirmed and catalog parts are booked. Thank you for choosing SKB Computer Services.
          </p>
        </div>

        <div className="bg-teal-50/20 border border-teal-100/50 rounded-2xl p-6 text-left space-y-4 max-w-md mx-auto">
          <div className="space-y-1 text-xs">
            <p className="text-gray-600"><strong>Order reference ID:</strong> <span className="font-mono text-teal-800 font-extrabold">{placedOrder.id}</span></p>
            <p className="text-gray-600"><strong>Push tracking:</strong> <span className="font-semibold text-teal-800">{placedOrder.trackingNumber}</span></p>
            <p className="text-gray-600"><strong>Estimated dispatch:</strong> 2-3 working days</p>
          </div>

          {draftedEmail && (
            <div className="bg-white border text-[11px] font-mono leading-relaxed p-4 rounded-xl text-gray-600 max-h-48 overflow-y-auto whitespace-pre-line">
              <strong className="block text-xs font-sans text-teal-850 font-bold mb-1 border-b pb-1">Auto-Drafted confirmation mail:</strong>
              {draftedEmail}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={() => onNavigateToTab("account")}
            className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 text-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Track on Dashboard
          </button>
          
          <button
            onClick={() => { setPlacedOrder(null); onNavigateToTab("products"); }}
            className="flex-1 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 text-xs cursor-pointer shadow-xs"
          >
            Come back again
          </button>
        </div>

      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 animate-fade-up">
      
      <div className="border-b border-gray-150 pb-6.5 text-left mb-10">
        <span className="font-mono text-xs uppercase tracking-wider text-teal-600 font-bold block">Purchase Spares</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-none mt-1">
          Review Your Shopping Cart
        </h2>
      </div>

      {cart.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center space-y-4.5 bg-white border border-dashed border-gray-200">
          <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto" />
          <h4 className="text-base font-bold text-gray-700">Your shopping cart is currently empty</h4>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">Please visit the parts shop page and choose high-quality motherboards or workstation batteries to proceed.</p>
          <button
            onClick={() => onNavigateToTab("products")}
            className="inline-flex rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 text-xs cursor-pointer hover:scale-[1.01] transition-all"
          >
            Go Shop Spares
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Items review block */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-gray-800 pr-1">Cart Items</h3>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-lg flex-shrink-0">
                      📦
                    </div>
                    <div>
                      <strong className="block text-sm font-bold text-gray-800 leading-tight">{item.name}</strong>
                      <span className="block text-[10px] text-gray-400 font-mono mt-0.5">{item.category} • ₹{item.price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="flex items-center gap-2 border border-gray-100/60 bg-gray-50/50 rounded-xl p-0.8">
                      <button
                        onClick={() => onUpdateQty(item.id, "decrease")}
                        className="p-1.2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-white transition-colors cursor-pointer"
                      >
                        <MinusCircle className="h-4.5 w-4.5" />
                      </button>
                      <span className="font-mono text-xs font-bold w-5 text-center text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.id, "increase")}
                        className="p-1.2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-white transition-colors cursor-pointer"
                      >
                        <PlusCircle className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 rounded-xl cursor-pointer"
                      title="Remove product item"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout billing / forms */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-base font-bold text-gray-800 pr-1">Shipping & Checkout</h3>

            <div className="glass-panel p-6 rounded-3xl space-y-5">
              
              <form onSubmit={handleCheckout} className="space-y-4.5">
                
                <div className="space-y-3 p-4 bg-teal-50/15 border border-teal-100/40 rounded-2xl text-xs">
                  <header className="font-mono font-bold uppercase tracking-wider text-teal-800 mb-2">Delivery Address</header>
                  
                  <div className="space-y-3.5">
                    <label className="block space-y-1">
                      <span className="text-[10px] font-semibold text-gray-500 pl-1">Full Delivery Name *</span>
                      <input
                        type="text"
                        required
                        value={addressData.name}
                        onChange={(e) => setAddressData({ ...addressData, name: e.target.value })}
                        className="w-full text-xs rounded-xl border border-gray-100 bg-white px-3.5 py-2.5"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[10px] font-semibold text-gray-500 pl-1">Contact Phone *</span>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 70113 96007"
                        value={addressData.phone}
                        onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                        className="w-full text-xs rounded-xl border border-gray-100 bg-white px-3.5 py-2.5"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[10px] font-semibold text-gray-500 pl-1">Street Address *</span>
                      <input
                        type="text"
                        required
                        placeholder="House No, Street, Landmark"
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        className="w-full text-xs rounded-xl border border-gray-100 bg-white px-3.5 py-2.5"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <label className="block space-y-1">
                        <span className="text-[10px] font-semibold text-gray-500 pl-1">Postal Zip Code *</span>
                        <input
                          type="text"
                          required
                          value={addressData.zip}
                          onChange={(e) => setAddressData({ ...addressData, zip: e.target.value })}
                          className="w-full text-xs rounded-xl border border-gray-100 bg-white px-3.5 py-2.5"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[10px] font-semibold text-gray-500 pl-1">City State</span>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={`${addressData.city}, ${addressData.state}`}
                          className="w-full text-xs rounded-xl border border-gray-50 bg-gray-50 text-gray-400 select-none px-3.5 py-2.5"
                        />
                      </label>
                    </div>
                  </div>

                </div>

                {/* Delivery options */}
                <div className="space-y-2 text-xs">
                  <header className="font-semibold text-gray-600 pl-1">Shipping Speed Option</header>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShippingMethod("standard")}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        shippingMethod === "standard"
                          ? "bg-teal-50 border-teal-500 text-teal-850"
                          : "bg-white border-gray-100 text-gray-500"
                      }`}
                    >
                      <strong className="block">Standard Dispatch</strong>
                      <span className="text-[10px] text-gray-400">Within 3-5 days • FREE</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShippingMethod("express")}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        shippingMethod === "express"
                          ? "bg-teal-50 border-teal-500 text-teal-850"
                          : "bg-white border-gray-100 text-gray-500"
                      }`}
                    >
                      <strong className="block">Express Flight</strong>
                      <span className="text-[10px] text-gray-400">Within 1-2 days • ₹199</span>
                    </button>
                  </div>
                </div>

                {/* Payment Option */}
                <div className="space-y-2 text-xs">
                  <header className="font-semibold text-gray-600 pl-1">Payment Method</header>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "bg-teal-50 border-teal-500 text-teal-850"
                          : "bg-white border-gray-100 text-gray-500"
                      }`}
                    >
                      Cash on Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        paymentMethod === "online"
                          ? "bg-teal-50 border-teal-500 text-teal-850"
                          : "bg-white border-gray-100 text-gray-500"
                      }`}
                    >
                      UPI / Cards Online
                    </button>
                  </div>
                </div>

                {/* Cost aggregate listings */}
                <div className="border-t border-gray-100/60 pt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span>Parts subtotal:</span>
                    <span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping charge:</span>
                    <span className="font-mono">₹{shippingCost.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100/60 pt-2 text-sm font-extrabold">
                    <span>Grand total paid:</span>
                    <span className="text-teal-700 font-mono">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {!user && (
                  <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 text-center">
                    User checkout session required. Please log in or register before checking out.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 text-sm cursor-pointer shadow-md shadow-teal-500/10 disabled:opacity-45"
                >
                  <Truck className="h-4.5 w-4.5" />
                  {loading ? "Placing secure order..." : "Confirm & Place Cleanroom Order"}
                </button>

              </form>

            </div>
          </div>

        </div>
      )}

    </section>
  );
};
export default CartSection;
