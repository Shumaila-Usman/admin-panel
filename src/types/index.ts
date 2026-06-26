export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  restaurantKey: string;
  timezone: string;
  currencyCode: string;
  currencySymbol: string;
  sourceDbUri: string;
  sourceDbName: string;
  sourceOrderCollection: string;
  sourcePaymentStatusField: string;
  sourcePaidValue: string;
  sourceOrderNumberField: string;
  sourceOrderTypeField: string;
  sourceItemsField: string;
  sourceOrderNoteField: string;
  sourceFulfillmentTypeField: string;
  isActive: boolean;
  printerEnabled: boolean;
  printerNotes: string | null;
  // Website admin credentials (non-sensitive fields only — password returned via separate endpoint)
  websiteAdminUrl: string | null;
  websiteAdminLoginId: string | null;
  websiteAdminEmail: string | null;
  websiteAdminPasswordUpdatedAt: string | null;
  websiteAdminNotes: string | null;
  websiteAdminIntegrationType: 'manual' | 'api' | 'shared_db';
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantUser {
  _id: string;
  restaurantId: string;
  name: string;
  loginId: string | null;
  email: string | null;
  isActive: boolean;
  appPasswordUpdatedAt: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  sourceOrderId: string;
  restaurantId: string;
  restaurantKey: string;
  restaurantName: string;
  restaurantTimezone: string;
  orderNumber: string;
  createdAt: string | null;
  orderStatus: string | null;
  paymentStatus: string | null;
  pickupMode: string;
  pickupTime: string | null;
  fulfillmentType: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  items: unknown[];
  subtotal: number | null;
  tax: number | null;
  deliveryFee: number | null;
  tip: number | null;
  total: number | null;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  orderNote: string | null;
  notes: string | null;
  prepTimeMinutes: number | null;
  customPrepTimeLabel: string | null;
  acknowledgedAt: string | null;
}

export interface Customer {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  lastOrderDate: string | null;
  totalOrders: number;
  totalSpent: number;
}

export interface RestaurantFormData {
  name: string;
  restaurantKey: string;
  timezone: string;
  currencyCode: string;
  currencySymbol: string;
  sourceDbUri: string;
  sourceDbName: string;
  sourceOrderCollection: string;
  sourcePaymentStatusField: string;
  sourcePaidValue: string;
  sourceOrderNumberField: string;
  sourceOrderTypeField: string;
  sourceItemsField: string;
  sourceOrderNoteField: string;
  sourceFulfillmentTypeField: string;
  isActive: boolean;
  printerEnabled: boolean;
  printerNotes: string;
}

export interface AppCredentials {
  loginId: string | null;
  email: string | null;
  currentAppPassword: string | null;
  appPasswordUpdatedAt: string | null;
  message: string | null;
}

export interface WebsiteCredentials {
  websiteAdminUrl: string | null;
  websiteAdminLoginId: string | null;
  websiteAdminEmail: string | null;
  websiteAdminPassword: string | null;
  websiteAdminPasswordUpdatedAt: string | null;
  websiteAdminNotes: string | null;
  websiteAdminIntegrationType: 'manual' | 'api' | 'shared_db';
  message: string | null;
}
