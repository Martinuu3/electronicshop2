import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatisticsService } from '../../services/statistics.service';
import { SalesStatistics } from '../../models/sales-statistics.model';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  statistics: SalesStatistics | null = null;
  loading = true;
  error: string | null = null;

  topProductColumns = ['rank', 'productName', 'categoryName', 'quantitySold', 'totalRevenue', 'availableStock'];
  categoryColumns = ['categoryName', 'productCount', 'quantitySold', 'totalRevenue'];
  brandColumns = ['brandName', 'productCount', 'quantitySold', 'totalRevenue', 'percentage'];
  monthlyColumns = ['period', 'orderCount', 'totalSales', 'totalRevenue', 'averageOrderValue'];
  lowStockColumns = ['status', 'productName', 'categoryName', 'availableQuantity'];

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading = true;
    this.error = null;
    
    this.statisticsService.getSalesStatistics().subscribe({
      next: (data) => {
        this.statistics = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load statistics';
        this.loading = false;
        console.error('Error loading statistics:', error);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount);
  }

  getMonthYear(month: string, year: number): string {
    return `${month} ${year}`;
  }
}