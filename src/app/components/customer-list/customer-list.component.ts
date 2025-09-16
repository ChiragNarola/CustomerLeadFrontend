import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.interface';
import { ImageUploadComponent } from '../image-upload/image-upload.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ImageUploadComponent],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;
  error: string | null = null;
  
  // Image upload modal properties
  showUploadModal = false;
  selectedCustomer: Customer | null = null;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = null;
    
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        // Convert date strings to Date objects if needed
        this.customers = customers.map(customer => ({
          ...customer,
          createdAt: new Date(customer.createdAt)
        }));
        this.loading = false;
        console.log('Customers loaded successfully:', this.customers);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.error = 'Failed to load customers. Please check if your API is running and CORS is configured.';
        this.loading = false;
      }
    });
  }

  uploadImages(customer: Customer): void {
    this.selectedCustomer = customer;
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.selectedCustomer = null;
  }

  onUploadComplete(): void {
    // Optionally refresh the customer list or show a success message
    console.log('Image upload completed for:', this.selectedCustomer?.name);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
