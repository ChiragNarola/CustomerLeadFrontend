export interface UploadCustomerImagesRequest {
  customerId: number;
  images: File[];
}

export interface UploadCustomerImagesResponse {
  isSuccess: boolean;
  message: string | null;
  data: any[];
}

export interface CustomerImage {
  id: number;
  base64Data: string;
  mimeType: string;
  uploadedAt: string;
}

export interface CustomerImagesResponse {
  isSuccess: boolean;
  message: string | null;
  data: CustomerImage[];
}

export interface DeleteImageResponse {
  isSuccess: boolean;
  message: string | null;
  data: any;
}
