import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { SalesStatistics, ProductSales, CategorySales, BrandSales, MonthlySales, LowStockProduct } from '../models/sales-statistics.model';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private ordersUrl = 'http://localhost:3000/orders';
  private productsUrl = 'http://localhost:3000/products';
  private categoriesUrl = 'http://localhost:3000/categories';
  private brandsUrl = 'http://localhost:3000/brands';

  constructor(private http: HttpClient) { }

  getSalesStatistics(): Observable<SalesStatistics> {
    return forkJoin({
      orders: this.http.get<any[]>(this.ordersUrl),
      products: this.http.get<any[]>(this.productsUrl),
      categories: this.http.get<any[]>(this.categoriesUrl),
      brands: this.http.get<any[]>(this.brandsUrl)
    }).pipe(
      map(({ orders, products, categories, brands }) => {
        return this.calculateStatistics(orders, products, categories, brands);
      })
    );
  }

  private calculateStatistics(orders: any[], products: any[], categories: any[], brands: any[]): SalesStatistics {
    const totalSales = orders.reduce((sum, order) => sum + parseInt(order.quantity), 0);
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate product sales
    const productSalesMap = new Map<string, ProductSales>();
    
    orders.forEach(order => {
      const product = products.find(p => p.id === order.productId);
      const category = categories.find(c => c.id === product?.categoryId);
      const brand = brands.find(b => b.id === product?.brandId);
      
      if (product) {
        const key = order.productId;
        if (productSalesMap.has(key)) {
          const existing = productSalesMap.get(key)!;
          existing.quantitySold += parseInt(order.quantity);
          existing.totalRevenue += order.totalAmount;
          existing.averagePrice = existing.totalRevenue / existing.quantitySold;
        } else {
          const quantitySold = parseInt(order.quantity);
          productSalesMap.set(key, {
            productId: order.productId,
            productName: product.name,
            quantitySold: quantitySold,
            totalRevenue: order.totalAmount,
            averagePrice: order.totalAmount / quantitySold,
            categoryName: category?.name || 'Unknown',
            brandName: brand?.name || 'Unknown',
            availableStock: product.availableQuantity || 0
          });
        }
      }
    });

    const productsSold = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold);

    const topSellingProducts = productsSold.slice(0, 10);

    // Calculate category sales
    const categorySalesMap = new Map<string, CategorySales>();
    
    orders.forEach(order => {
      const product = products.find(p => p.id === order.productId);
      const category = categories.find(c => c.id === product?.categoryId);
      
      if (product && category) {
        const key = category.id;
        if (categorySalesMap.has(key)) {
          const existing = categorySalesMap.get(key)!;
          existing.quantitySold += parseInt(order.quantity);
          existing.totalRevenue += order.totalAmount;
          existing.averagePrice = existing.totalRevenue / existing.quantitySold;
        } else {
          const categoryProducts = products.filter(p => p.categoryId === category.id);
          const quantitySold = parseInt(order.quantity);
          categorySalesMap.set(key, {
            categoryId: category.id,
            categoryName: category.name,
            quantitySold: quantitySold,
            totalRevenue: order.totalAmount,
            productCount: categoryProducts.length,
            averagePrice: order.totalAmount / quantitySold,
            percentage: 0 // Will be calculated later
          });
        }
      }
    });

    const categorySales = Array.from(categorySalesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate percentages for categories
    categorySales.forEach(category => {
      category.percentage = totalRevenue > 0 ? (category.totalRevenue / totalRevenue) * 100 : 0;
    });

    // Calculate brand sales
    const brandSalesMap = new Map<string, BrandSales>();
    
    orders.forEach(order => {
      const product = products.find(p => p.id === order.productId);
      const brand = brands.find(b => b.id === product?.brandId);
      
      if (product && brand) {
        const key = brand.id;
        if (brandSalesMap.has(key)) {
          const existing = brandSalesMap.get(key)!;
          existing.quantitySold += parseInt(order.quantity);
          existing.totalRevenue += order.totalAmount;
        } else {
          const brandProducts = products.filter(p => p.brandId === brand.id);
          brandSalesMap.set(key, {
            brandId: brand.id,
            brandName: brand.name,
            quantitySold: parseInt(order.quantity),
            totalRevenue: order.totalAmount,
            productCount: brandProducts.length,
            percentage: 0 // Will be calculated later
          });
        }
      }
    });

    const brandSales = Array.from(brandSalesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate percentages for brands
    brandSales.forEach(brand => {
      brand.percentage = totalRevenue > 0 ? (brand.totalRevenue / totalRevenue) * 100 : 0;
    });

    // Calculate monthly sales
    const monthlySalesMap = new Map<string, MonthlySales>();
    
    orders.forEach(order => {
      if (order.orderDate) {
        const date = new Date(order.orderDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (monthlySalesMap.has(monthKey)) {
          const existing = monthlySalesMap.get(monthKey)!;
          existing.totalSales += parseInt(order.quantity);
          existing.totalRevenue += order.totalAmount;
          existing.orderCount += 1;
          existing.averageOrderValue = existing.totalRevenue / existing.orderCount;
        } else {
          monthlySalesMap.set(monthKey, {
            month: date.toLocaleString('ro-RO', { month: 'long' }),
            year: date.getFullYear(),
            totalSales: parseInt(order.quantity),
            totalRevenue: order.totalAmount,
            orderCount: 1,
            averageOrderValue: order.totalAmount
          });
        }
      }
    });

    const monthlySales = Array.from(monthlySalesMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
      });

    // Calculate low stock products
    const lowStockProducts: LowStockProduct[] = products
      .filter(product => product.availableQuantity < 10)
      .map(product => {
        const category = categories.find(c => c.id === product.categoryId);
        const brand = brands.find(b => b.id === product.brandId);
        
        return {
          productId: product.id,
          productName: product.name,
          availableQuantity: product.availableQuantity,
          categoryName: category?.name || 'Unknown',
          brandName: brand?.name || 'Unknown',
          isLowStock: product.availableQuantity < 5
        };
      })
      .sort((a, b) => a.availableQuantity - b.availableQuantity);

    return {
      totalSales,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      productsSold,
      categorySales,
      brandSales,
      monthlySales,
      topSellingProducts,
      lowStockProducts
    };
  }
}