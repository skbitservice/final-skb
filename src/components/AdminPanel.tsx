import React, { useState, useEffect } from "react";
import { db, handleFirestoreError } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { ProductItem, SupportTicket, SupportContact, PurchaseOrder, UserProfile, OperationType, BrandItem } from "../types";
import { PlusCircle, Trash, Send, CheckSquare, Users, ShoppingCart, Loader2, RefreshCw, Layers } from "lucide-react";

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"products" | "tickets" | "orders" | "contacts" | "users" | "brands">("tickets");
  
  // Database states
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);

  // Brand management local state
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);

  // Add Product Form
  const [newProduct, setNewProduct] = useState<{
    name: string;
    category: string;
    price: string;
    stock: string;
    description: string;
    image: string;
    images: string[];
  }>({
    name: "",
    category: "Motherboards",
    price: "",
    stock: "",
    description: "",
    image: "",
    images: [],
  });
  const [uploading, setUploading] = useState(false);

  // Ticket Reply Form local map
  const [ticketReplies, setTicketReplies] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    // Synchronize Realtime Data snapshots
    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProductItem[]);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "products")
    );

    const unsubTickets = onSnapshot(
      collection(db, "tickets"),
      (snap) => {
        setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SupportTicket[]);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "tickets")
    );

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PurchaseOrder[]);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "orders")
    );

    const unsubContacts = onSnapshot(
      collection(db, "contacts"),
      (snap) => {
        setContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SupportContact[]);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "contacts")
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserProfile[]);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "users")
    );

    const unsubBrands = onSnapshot(
      collection(db, "brands"),
      (snap) => {
        setBrands(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BrandItem[]);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "brands")
    );

    return () => {
      unsubProducts();
      unsubTickets();
      unsubOrders();
      unsubContacts();
      unsubUsers();
      unsubBrands();
    };
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert("Please enter product title, price, and initial stock quantities.");
      return;
    }

    setUploading(true);
    try {
      const payload = {
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        description: newProduct.description,
        image: newProduct.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e8d8ff'/%3E%3Ctext x='100' y='110' font-size='48' text-anchor='middle' fill='%237fe7dc' font-family='Arial'%3E📦%3C/text%3E%3C/svg%3E",
        images: newProduct.images || [],
      };

      await addDoc(collection(db, "products"), payload);
      setNewProduct({
        name: "",
        category: "Motherboards",
        price: "",
        stock: "",
        description: "",
        image: "",
        images: [],
      });
      alert("Product added in live catalog!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "products");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (dbId: string) => {
    if (!confirm("Are you sure you want to remove this product from the inventory stock?")) return;
    try {
      // Find the document reference to delete
      const unsub = onSnapshot(collection(db, "products"), async (snap) => {
        const found = snap.docs.find((d) => d.id === dbId);
        if (found) {
          await deleteDoc(doc(db, "products", found.id));
        }
      });
      setTimeout(() => unsub(), 2000);
      alert("Product deleted!");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${dbId}`);
    }
  };

  const handleTicketReply = async (ticketId: string, replyMsg: string) => {
    if (!replyMsg.trim()) {
      alert("Please write a response reply text first.");
      return;
    }

    try {
      const unsub = onSnapshot(collection(db, "tickets"), async (snap) => {
        const docSnap = snap.docs.find((d) => d.data().id === ticketId);
        if (docSnap) {
          await updateDoc(doc(db, "tickets", docSnap.id), {
            reply: replyMsg,
            status: "Resolved",
            updatedAt: new Date().toISOString(),
          });
          alert("Response sent! Status changed to resolved.");
        }
      });
      setTimeout(() => unsub(), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "tickets");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const unsub = onSnapshot(collection(db, "orders"), async (snap) => {
        const docSnap = snap.docs.find((d) => d.data().id === orderId);
        if (docSnap) {
          await updateDoc(doc(db, "orders", docSnap.id), {
            status: newStatus,
            updatedAt: new Date().toISOString(),
          });
          
          // Triggers visual push notifications simulation backend endpoint
          try {
            await fetch("/api/trigger-push-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, status: newStatus }),
            });
          } catch (notifErr) {
            console.error("Local api triggered.", notifErr);
          }
          alert(`Order status adjusted to ${newStatus}! Logged email update dispatched.`);
        }
      });
      setTimeout(() => unsub(), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "orders");
    }
  };

  const handleContactResolve = async (contactId: string) => {
    try {
      const unsub = onSnapshot(collection(db, "contacts"), async (snap) => {
        const docSnap = snap.docs.find((d) => d.id === contactId);
        if (docSnap) {
          await updateDoc(doc(db, "contacts", docSnap.id), {
            responded: true,
          });
        }
      });
      setTimeout(() => unsub(), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "contacts");
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      alert("Please enter a brand name.");
      return;
    }
    setCreatingBrand(true);
    try {
      const payload = {
        name: newBrandName.trim(),
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "brands"), payload);
      setNewBrandName("");
      alert("Brand registered successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "brands");
    } finally {
      setCreatingBrand(false);
    }
  };

  const handleDeleteBrand = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this brand?")) return;
    try {
      await deleteDoc(doc(db, "brands", docId));
      alert("Brand removed successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `brands/${docId}`);
    }
  };

  // Base64 image reader for local uploads supporting multi-files
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const loadedImages: string[] = [];
      let loadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            loadedImages.push(event.target.result as string);
          }
          loadedCount++;
          if (loadedCount === files.length) {
            setNewProduct((prev) => ({
              ...prev,
              image: loadedImages[0] || "",
              images: loadedImages,
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 space-y-10 border-t border-gray-100 animate-fade-up text-left">
      
      {/* Top statistics matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5.5 rounded-2xl">
          <header className="text-xs text-gray-400 font-medium font-sans uppercase">Total Products</header>
          <strong className="text-2xl font-extrabold text-teal-700 block mt-1">{products.length}</strong>
        </div>
        <div className="glass-panel p-5.5 rounded-2xl">
          <header className="text-xs text-gray-400 font-medium font-sans uppercase">Open Support Tickets</header>
          <strong className="text-2xl font-extrabold text-amber-600 block mt-1">
            {tickets.filter((t) => t.status === "Open" || t.status === "Pending").length}
          </strong>
        </div>
        <div className="glass-panel p-5.5 rounded-2xl">
          <header className="text-xs text-gray-400 font-medium font-sans uppercase">Unassigned Contacts</header>
          <strong className="text-2xl font-extrabold text-purple-600 block mt-1">{contacts.filter((c) => !c.responded).length}</strong>
        </div>
        <div className="glass-panel p-5.5 rounded-2xl">
          <header className="text-xs text-gray-400 font-medium font-sans uppercase">Orders Shipped</header>
          <strong className="text-2xl font-extrabold text-teal-800 block mt-1">
            {orders.filter((o) => o.status === "Shipped" || o.status === "Delivered").length}
          </strong>
        </div>
      </div>

      {/* Admin sections Navigation tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3.5">
        {[
          { id: "tickets", label: "Resolve Tickets" },
          { id: "orders", label: "Manage Orders" },
          { id: "products", label: "Edit Catalog" },
          { id: "contacts", label: "Contact Inquiries" },
          { id: "users", label: "Admin Profiles" },
          { id: "brands", label: "Manage Brands" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all focus:outline-none ${
              activeTab === tab.id
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-150 text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Admin Sub Views */}
      <div className="space-y-6">

        {/* Resolve Tickets View */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 font-sans pl-1">Device Repair Tickets</h3>
            {tickets.length === 0 ? (
              <p className="text-xs text-gray-400 font-mono py-12 text-center italic bg-white border border-gray-100 rounded-3xl">No tickets submitted in system database yet.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <span className="font-mono text-xs text-teal-600 font-semibold">{t.id} • Customer: {t.customerName} ({t.customerEmail})</span>
                      <h4 className="text-base font-extrabold text-gray-900">{t.subject}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-xl bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                        {t.message}
                      </p>
                      <span className="block text-[10px] text-gray-400 font-mono">Date Raised: {new Date(t.createdAt).toLocaleString()} | Mobile: {t.phone}</span>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 text-right">
                      <span className={`text-[9px] font-mono tracking-wider uppercase font-bold px-2 py-0.5 rounded ${
                        t.priority === "Urgent" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {t.priority}
                      </span>
                      <span className={`text-[9px] font-mono tracking-wider uppercase font-bold px-2 py-0.5 rounded ${
                        t.status === "Open" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-4.5">
                    <div className="bg-teal-50/20 p-4 rounded-xl border border-teal-100/50 text-xs">
                      <p className="font-bold text-teal-800 mb-1">Current response reply on user board:</p>
                      <p className="text-gray-600 italic">"{t.reply}"</p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Draft response diagnoses (e.g. Parts replacement confirmed. Shipping tracker code TRK-8829...)"
                        value={ticketReplies[t.id] || ""}
                        onChange={(e) => setTicketReplies({ ...ticketReplies, [t.id]: e.target.value })}
                        className="flex-1 text-xs rounded-xl border border-gray-100 px-4 py-3 bg-gray-50/60 focus:bg-white"
                      />
                      <button
                        onClick={() => {
                          handleTicketReply(t.id, ticketReplies[t.id] || "");
                          setTicketReplies({ ...ticketReplies, [t.id]: "" });
                        }}
                        className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 text-xs font-bold cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Manage Orders View */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 font-sans pl-1">Shipping Orders Invoices</h3>
            {orders.length === 0 ? (
              <p className="text-xs text-gray-400 font-mono py-12 text-center italic bg-white border border-gray-100 rounded-3xl">No product purchase checkout records found.</p>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6.5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-50 pb-4">
                    <div>
                      <strong className="block text-sm text-gray-800 font-bold">{ord.id} • Customer: {ord.customerName} ({ord.customerEmail})</strong>
                      <p className="text-[10px] text-gray-400 font-mono">Mobile: {ord.customerPhone} | Address: {ord.address}, {ord.city} | Tracking Code: <strong className="text-teal-700 font-mono">{ord.trackingNumber}</strong></p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold block text-teal-700">INR {ord.total}</span>
                      <span className="text-[9px] font-mono uppercase tracking-wide bg-teal-50 px-2 py-0.5 rounded text-teal-800 font-semibold">{ord.status}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs font-semibold text-gray-500 pl-1 mr-2">Discharge order status:</span>
                    {["Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateOrderStatus(ord.id, status)}
                        className={`text-[10px] font-bold font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                          ord.status === status
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white border-gray-100 hover:bg-gray-50 text-gray-500"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Catalog editing products */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Add product form */}
            <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6.5">
              <h3 className="text-base font-bold text-gray-800 pl-1 mb-6 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-teal-500" />
                Upload New Product
              </h3>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600 pl-1">Product Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AMD Ryzen CPU workstation"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full text-xs rounded-xl border border-gray-100 px-4 py-3"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-gray-600 pl-1">Category Code</span>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full text-xs rounded-xl border border-gray-100 px-4 py-3"
                    >
                      <option value="Motherboards">Motherboards</option>
                      <option value="Batteries">Batteries</option>
                      <option value="Chargers">Chargers</option>
                      <option value="RAM">RAM</option>
                      <option value="Spares">Spares</option>
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-gray-600 pl-1">Initial Stock *</span>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 15"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full text-xs rounded-xl border border-gray-100 px-4 py-3"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600 pl-1">Retail Price INR *</span>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="INR Price e.g. 3500"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full text-xs rounded-xl border border-gray-100 px-4 py-3"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600 pl-1">Upload Product Images (Multiple Allowed)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full text-xs rounded-xl border border-gray-100 px-4 py-2.5 bg-gray-50/50"
                  />
                  {newProduct.images && newProduct.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {newProduct.images.map((imgSrc, idx) => (
                        <div key={idx} className="relative h-12 w-12 rounded-lg border overflow-hidden shadow-xs">
                          <img src={imgSrc} alt={`Uploaded ${idx + 1}`} className="h-full w-full object-cover" />
                          <span className="absolute bottom-0 right-0 bg-teal-500 text-white font-mono text-[8px] px-1 font-bold rounded-tl">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600 pl-1">Brief Description</span>
                  <textarea
                    rows={3}
                    placeholder="Stock description of product..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full text-xs rounded-xl border border-gray-100 px-4 py-3 focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 text-xs rounded-xl cursor-pointer"
                >
                  {uploading ? "Uploading..." : "Publish Product SKU"}
                </button>
              </form>
            </div>

            {/* List products for deletion */}
            <div className="lg:col-span-7 bg-white border border-gray-100 rouded-3xl p-6.5 space-y-4">
              <h3 className="text-base font-bold text-gray-800 font-sans pl-1">Verification Stock items</h3>
              
              <div className="space-y-2.5 max-h-120 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-xs text-gray-400 font-mono py-10 italic">No inventory products found.</p>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3.5 border border-gray-50 rounded-2xl bg-gray-50/50">
                      <div>
                        <strong className="block text-xs font-bold text-gray-800">{p.name}</strong>
                        <span className="block text-[10px] text-gray-400 font-mono">{p.category} | INR {p.price} | Qty: {p.stock}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete product item SKU"
                      >
                        <Trash className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* Contact form resolution listing */}
        {activeTab === "contacts" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 font-sans pl-1">Client Inquiries</h3>
            {contacts.length === 0 ? (
              <p className="text-xs text-gray-400 font-mono py-12 text-center bg-white border rounded-3xl italic">No contact entries logged.</p>
            ) : (
              contacts.map((c) => (
                <div key={c.id} className="bg-white border border-gray-100 rounded-3xl p-5 flex justify-between items-center text-left">
                  <div className="space-y-1.5 flex-1 pr-6.5">
                    <span className="font-mono text-[10px] text-teal-600 font-bold">{c.id} • {c.name} ({c.email})</span>
                    <p className="text-xs text-gray-600 italic">"{c.message}"</p>
                    <span className="block text-[10px] text-gray-400 font-mono">Date Raised: {new Date(c.createdAt).toLocaleDateString()} | Phone: {c.mobile}</span>
                  </div>

                  <div>
                    {c.responded ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                        Responded
                      </span>
                    ) : (
                      <button
                        onClick={() => handleContactResolve(c.id)}
                        className="inline-flex items-center gap-1.5 border border-amber-600/20 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2 px-3.5 text-xs rounded-xl cursor-pointer"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        Resolve Inquiries
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* User Account Registry listing */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 pl-1">Accounts Database Registry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.length === 0 ? (
                <p className="md:col-span-2 text-xs text-center text-gray-400 italic py-10">No customer records saved yet in users collection.</p>
              ) : (
                users.map((u) => (
                  <div key={u.id || u.email} className="bg-white border border-gray-100 rounded-3xl p-5 text-left flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 flex-shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    
                    <div className="space-y-1">
                      <strong className="block text-sm text-gray-800">{u.name}</strong>
                      <span className="block text-[10px] text-gray-400 font-mono">Email: {u.email}</span>
                      <span className="block text-[10px] text-gray-400 font-mono">Mobile Contact: {u.mobile || "NA"}</span>
                      <span className="inline-block text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                        {u.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Manage Brands View */}
        {activeTab === "brands" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create Brand Form */}
            <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6.5">
              <h3 className="text-base font-bold text-gray-800 pl-1 mb-6 flex items-center gap-1.5 font-sans">
                <Layers className="h-5 w-5 text-teal-500" />
                Add Supported Brand
              </h3>

              <form onSubmit={handleCreateBrand} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600 pl-1">Brand Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Work With Brad"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-100 px-4 py-3 bg-gray-50/50"
                  />
                </label>

                <button
                  type="submit"
                  disabled={creatingBrand}
                  className="w-full inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 text-xs rounded-xl cursor-pointer transition-all"
                >
                  {creatingBrand ? "Registering Brand..." : "Add Brand"}
                </button>
              </form>
            </div>

            {/* List and Delete Brands */}
            <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6.5 space-y-4">
              <h3 className="text-base font-bold text-gray-800 font-sans pl-1">Active Slide Brands</h3>
              <p className="text-[11px] text-gray-400 pl-1 leading-relaxed">
                Brand names managed here dynamically populate the non-stop looping homepage marquee slider.
              </p>

              <div className="space-y-2.5 max-h-120 overflow-y-auto pr-1">
                {brands.length === 0 ? (
                  <div className="text-xs text-gray-400 font-mono py-12 italic border border-dashed border-gray-100 rounded-2xl text-center bg-gray-50/20">
                    No custom brands added yet. Home page is displaying fallback list of major manufacturers.
                  </div>
                ) : (
                  brands.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-2xl bg-white hover:border-teal-200 transition-colors">
                      <div>
                        <strong className="block text-xs font-bold text-gray-800">{b.name}</strong>
                        <span className="block text-[10px] text-gray-400 font-mono">
                          Registered: {new Date(b.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteBrand(b.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Brand"
                      >
                        <Trash className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </section>
  );
};
