import React, { useState, useEffect } from "react";
import { auth, db, setCachedAccessToken } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, onSnapshot, getDoc } from "firebase/firestore";
import { OrderItem, ProductItem } from "./types";

// Dynamic view components
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/HeroSection";
import { BrandSlider } from "./components/BrandSlider";
import { ServicesSection } from "./components/ServicesSection";
import { ProductsList } from "./components/ProductsList";
import { SupportCenter } from "./components/SupportCenter";
import { AboutContact } from "./components/AboutContact";
import { CartSection } from "./components/CartSection";
import { AuthInterface } from "./components/AuthInterface";
import { UserDashboard } from "./components/UserDashboard";
import { AdminPanel } from "./components/AdminPanel";
import { NotificationsProvider, useNotifications } from "./components/NotificationsContext";

// Child layout wrapper to connect inner trigger utilities with useNotifications hook safely
const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [cart, setCart] = useState<OrderItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("skb-cart-items");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [user, setUser] = useState<{ email: string; name: string; role: "customer" | "admin"; photoURL?: string } | null>(null);
  const [appReady, setAppReady] = useState(false);
  const { triggerNotification } = useNotifications();

  const [theme, setTheme] = useState<"light" | "dark-surface">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("skb-theme");
      return (saved as "light" | "dark-surface") || "light";
    }
    return "light";
  });

  // Track and apply theme changes to global document classes
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === "dark-surface") {
      root.classList.add("dark-surface");
      body.classList.add("dark-surface");
    } else {
      root.classList.remove("dark-surface");
      body.classList.remove("dark-surface");
    }
    localStorage.setItem("skb-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark-surface" : "light"));
  };

  // Save cart changes
  useEffect(() => {
    localStorage.setItem("skb-cart-items", JSON.stringify(cart));
  }, [cart]);

  // Synchronize Auth coordinates on boot
  useEffect(() => {
    let unsubOrders: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous active order subscriptions on auth shift
      if (unsubOrders) {
        unsubOrders();
        unsubOrders = null;
      }

      if (firebaseUser?.email) {
        // Auto-assign skbitservice as super admin
        const isAdminEmail = firebaseUser.email.toLowerCase() === "skbitservice@gmail.com";
        const roleVal = isAdminEmail ? "admin" : "customer";

        // Retrieve Firestore users collection for profile metadata details directly
        let userName = firebaseUser.displayName || firebaseUser.email.split("@")[0];
        let dbRole = roleVal;
        let photoURL = firebaseUser.photoURL || "";

        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const dbData = snap.data();
            userName = dbData.name || userName;
            dbRole = dbData.role || dbRole;
            photoURL = dbData.photoURL || photoURL;
          }
        } catch (err) {
          console.warn("Using offline fallback profile info.");
        }

        setUser({
          email: firebaseUser.email,
          name: userName,
          role: dbRole as "customer" | "admin",
          photoURL: photoURL,
        });

        // Set up background snapshot listener on user's active orders
        // This monitors status shifts (e.g., Pending -> Confirmed -> Packed -> Shipped)
        // and triggers push notification alerts instantly to the browser and notification badge!
        const ordersQuery = query(
          collection(db, "orders"),
          where("customerEmail", "==", firebaseUser.email.toLowerCase())
        );

        let initialLoad = true;
        unsubOrders = onSnapshot(
          ordersQuery,
          (snap) => {
            if (initialLoad) {
              initialLoad = false;
              return;
            }
            
            snap.docChanges().forEach((change) => {
              if (change.type === "modified") {
                const orderData = change.doc.data();
                triggerNotification(
                  "Order Status Shifted!",
                  `Success: Your Order reference ${orderData.id} status has been updated to "${orderData.status}"!`,
                  "order"
                );
              }
            });
          },
          (err) => {
            console.warn("Background order status snapshot listener sync alert:", err);
          }
        );

      } else {
        setUser(null);
        setCachedAccessToken(null);
      }
      setAppReady(true);
    });

    return () => {
      unsub();
      if (unsubOrders) {
        unsubOrders();
      }
    };
  }, [triggerNotification]);

  // Logout operations
  const handleLogout = async () => {
    await signOut(auth);
    setCachedAccessToken(null);
    setUser(null);
    setActiveTab("home");
    triggerNotification("Session logged out", "You have successfully signed out of SKB Services.");
  };

  const handleAddToCart = (product: ProductItem) => {
    setCart((prev) => {
      const match = prev.find((item) => item.id === product.id);
      if (match) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ];
    });
  };

  const handleBuyNow = (product: ProductItem) => {
    handleAddToCart(product);
    setActiveTab("cart");
  };

  const handleUpdateQty = (productId: string, action: "increase" | "decrease") => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = action === "increase" ? item.quantity + 1 : item.quantity - 1;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => setCart([]);

  if (!appReady) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-teal-600 space-y-4">
        <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <strong className="block font-sans font-extrabold text-sm tracking-wide">
          Seeding SKB Computer Services...
        </strong>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        user={user}
        onLogout={handleLogout}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <main className="flex-grow">
        {/* SPA Landing page dynamic loaders */}
        {activeTab === "home" && (
          <>
            <HeroSection onActionClick={setActiveTab} />
            <BrandSlider />
            <ServicesSection />
            <AboutContact />
          </>
        )}

        {activeTab === "services" && <ServicesSection />}

        {activeTab === "products" && (
          <ProductsList onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
        )}

        {activeTab === "support" && (
          <SupportCenter user={user} onNavigateToDashboard={() => setActiveTab("account")} />
        )}

        {activeTab === "contact" && <AboutContact />}

        {activeTab === "cart" && (
          <CartSection
            cart={cart}
            user={user}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onNavigateToTab={setActiveTab}
            onNavigateToAuth={() => setActiveTab("account")}
          />
        )}

        {activeTab === "account" && (
          user ? (
            <UserDashboard
              user={user}
              onRefreshUser={(name, photoURL) => setUser((p) => p ? { ...p, name, ...(photoURL !== undefined ? { photoURL } : {}) } : null)}
            />
          ) : (
            <AuthInterface
              onSuccess={(profile) => {
                setUser(profile);
                setActiveTab(profile.role === "admin" ? "admin" : "home");
              }}
            />
          )
        )}

        {activeTab === "admin" && user?.role === "admin" && <AdminPanel />}
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <NotificationsProvider>
      <AppContent />
    </NotificationsProvider>
  );
}
