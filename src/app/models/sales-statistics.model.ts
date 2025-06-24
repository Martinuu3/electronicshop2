export interface SalesStatistics {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  productsSold: ProductSales[];
  categorySales: CategorySales[];
  brandSales: BrandSales[];
  monthlySales: MonthlySales[];
  topSellingProducts: ProductSales[];
  lowStockProducts: LowStockProduct[];
}

export interface ProductSales {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  categoryName: string;
  brandName: string;
  availableStock: number;
}

export interface CategorySales {
  categoryId: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  productCount: number;
  averagePrice: number;
  percentage: number;
}

export interface BrandSales {
  brandId: string;
  brandName: string;
  quantitySold: number;
  totalRevenue: number;
  productCount: number;
  percentage: number;
}

export interface MonthlySales {
  month: string;
  year: number;
  totalSales: number;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  availableQuantity: number;
  categoryName: string;
  brandName: string;
  isLowStock: boolean;
}