import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { SalesStatistics, ProductSales, CategorySales, MonthlySales } from '../models/sales-statistics.model';

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
        } else {
          productSalesMap.set(key, {
            productId: order.productId,
            productName: product.name,
            quantitySold: parseInt(order.quantity),
            totalRevenue: order.totalAmount,
            categoryName: category?.name || 'Unknown',
            brandName: brand?.name || 'Unknown'
          });
        }
      }
    });

    const productsSold = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold);

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
        } else {
          const categoryProducts = products.filter(p => p.categoryId === category.id);
          categorySalesMap.set(key, {
            categoryId: category.id,
            categoryName: category.name,
            quantitySold: parseInt(order.quantity),
            totalRevenue: order.totalAmount,
            productCount: categoryProducts.length
          });
        }
      }
    });

    const categorySales = Array.from(categorySalesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

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
        } else {
          monthlySalesMap.set(monthKey, {
            month: date.toLocaleString('default', { month: 'long' }),
            year: date.getFullYear(),
            totalSales: parseInt(order.quantity),
            totalRevenue: order.totalAmount
          });
        }
      }
    });

    const monthlySales = Array.from(monthlySalesMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
      });

    return {
      totalSales,
      totalRevenue,
      productsSold,
      categorySales,
      monthlySales
    };
  }
}