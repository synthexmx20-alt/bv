export interface ProductSize {
  name: string;
  price: number;
  seasonalPrice?: number;
  description?: string;
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  type: 'mariposa' | 'corona' | 'banda' | 'extra';
  active: boolean;
  customText?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string; // Made required to match previous
  category: string;
  occasions?: string[];
  sizes?: ProductSize[];
  meta_title?: string; // New
  meta_description?: string; // New
}

export interface CartItem { // Restoring CartItem if it was there or defining if needed. 
  // In 1559 output, CartItem wasn't explicitly exported but used in CheckoutState.items.
  // Let's define it generally or keep it inline if that's how it was. 
  // Actually 1559 showed: items: { product: Product; size: ProductSize; quantity: number; selectedAddons?: ProductAddon[] }[];
  // So I don't strictly need CartItem interface if it wasn't there, but it's good to have.
  // However, to be safe and minimized breakage, I will stick to what was there + additions.
}

export interface CheckoutState {
  shipping: {
    fullName: string;
    phone: string;
    street: string;
    colonia: string;
    reference: string;
    date: string;
    timeSlot: string;
    zipCode?: string;
    city?: string;
    state?: string;
  };
  message: {
    from: string;
    to: string;
    note: string;
    isAnonymous: boolean;
    withoutNote: boolean;
  };
  shippingCost?: number; // Added for dynamic shipping rules
  paymentMethod: 'card' | 'spei';
  discount?: {
    code: string;
    amount: number;
    type: 'percentage' | 'fixed';
  };
  items: {
    id?: string;
    product: Product;
    size: ProductSize;
    quantity: number;
    selectedAddons?: ProductAddon[]
  }[];
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Occasion {
  id: string;
  name: string;
  created_at: string;
}

// Re-adding Address/UserProfile if they are actually used elsewhere, but I should be careful.
// If I don't see them in 1559, adding them is fine, but changing CheckoutState is bad.
// I will just Add SEO fields to Product and keep CheckoutState as it was in 1559 (plus any recent changes I might have missed if view wasn't full? No, view was full file).

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}