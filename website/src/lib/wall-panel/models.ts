export type WallPanelCategory = {
  id: string;
  name: string;
  title: string;
  description?: string;
  image: string;
  tags?: string[];
  active?: boolean;
  sortOrder?: number;
};

export type WallPanelComponent = {
  id: string;
  name: string;
  description?: string;
  icon?: string; // 'layers' | 'lightbulb' | 'sparkles' | 'shield' | 'palette' | 'hammer' | 'box'
  price: number;
  isDefault?: boolean;
};

export type WallPanelProduct = {
  id: string;
  title: string;
  name: string;
  tagline?: string;
  categoryId: string;
  categoryName?: string;
  price: number; // e.g. 16999
  dimensions: string; // e.g. "9.5 × 6 ft wall"
  description?: string;
  tags?: string[];
  images: string[];
  components: WallPanelComponent[];
  similarProductIds?: string[];
  active?: boolean;
  sortOrder?: number;
};

export type WallPanelCustomCard = {
  id: string;
  title: string;
  image: string;
  serialNumber?: string;
  productId: string;
  active?: boolean;
  sortOrder?: number;
};

export type WallPanelSection = {
  id: string;
  title: string;
  showTitle: boolean;
  displayType: "slider" | "slideshow" | "list" | "grid";
  contentType: "categories" | "products" | "customCards";
  selectedItemIds?: string[];
  customCards?: WallPanelCustomCard[];
  active?: boolean;
  sortOrder?: number;
};

export type WallPanelBanner = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  active?: boolean;
  sortOrder?: number;
};
