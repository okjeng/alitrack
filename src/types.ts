export interface Product {
  id: string;
  name: string;
  shortName: string;
  price: number;
  orig: number;
  discount: number;
  image: string;
  tag: string;
  deliveryDays: number;
  rating: number;
  reviews: number;
  affiliate_url?: string;
}

export interface LocalAlert {
  product_id: string;
  product_name: string;
  image: string;
  target_price: number;
  current_price: number;
  saved_at: string;
  push_endpoint?: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface User {
  user_id: string;
  email: string;
  provider: string;
  logged_in: boolean;
}

export interface Category {
  id: string;
  icon: string;
  label: string;
  keyword: string;
  sort: string;
}
