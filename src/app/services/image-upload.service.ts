import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UploadCustomerImagesResponse, CustomerImagesResponse, DeleteImageResponse } from '../models/upload.interface';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private apiUrl = 'https://localhost:7110/api'; // Your .NET API URL

  constructor(private http: HttpClient) { }

getCustomerImages(customerId: number): Observable<CustomerImagesResponse> {
  return this.http.get<CustomerImagesResponse>(`${this.apiUrl}/customerimages/${customerId}`).pipe(
    catchError(this.handleError)
  );
}


uploadCustomerImages(customerId: number, files: File[]): Observable<UploadCustomerImagesResponse> {
  const formData = new FormData();
  formData.append('customerId', customerId.toString());
  files.forEach(file => formData.append('images', file));

  return this.http.post<UploadCustomerImagesResponse>(`${this.apiUrl}/customerimages/upload`, formData);
}

deleteImage(imageId: number): Observable<DeleteImageResponse> {
  return this.http.delete<DeleteImageResponse>(`${this.apiUrl}/customerimages/${imageId}`);
}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error (CORS, network issues)
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'CORS Error: Unable to connect to the API. Please check if CORS is configured in your .NET API.';
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('Image Upload Error Details:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error,
      url: error.url
    });
    
    return throwError(() => new Error(errorMessage));
  }
}
