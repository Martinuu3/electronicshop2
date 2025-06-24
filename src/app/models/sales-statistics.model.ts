export interface SalesStatistics {
  totalSales: number;
  totalRevenue: number;
  productsSold: ProductSales[];
  categorySales: CategorySales[];
  monthlySales: MonthlySales[];
}

export interface ProductSales {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  categoryName: string;
  brandName: string;
}

export interface CategorySales {
  categoryId: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  productCount: number;
}

export interface MonthlySales {
  month: string;
  year: number;
  totalSales: number;
  totalRevenue: number;
}