export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  role: "customer" | "admin";
  status: "Active" | "Blocked";
  photoURL?: string;
  createdAt: string;
}

export interface BrandItem {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
  images?: string[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  subject: string;
  message: string;
  status: "Open" | "Pending" | "Resolved" | "Closed";
  priority: "Normal" | "High" | "Urgent";
  reply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportContact {
  id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  responded: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface PurchaseOrder {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingMethod: "standard" | "express";
  paymentMethod: "cod" | "online";
  status: "Pending" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Cancelled";
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  content: string;
  sentAt: string;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: "order" | "ticket" | "system";
  link?: string;
  read: boolean;
  timestamp: string;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}
