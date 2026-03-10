export interface User {
  id: number
  email: string
  created_at: string
  subscription_plan: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface FileUploadResponse {
  id: number
  filename: string
  file_type: string
  uploaded_at: string
  user_id: number
}

export interface FileListResponse {
  files: FileUploadResponse[]
  total: number
}

export interface AnalyticsMetrics {
  total_revenue: number
  total_orders: number
  average_order_value: number
  total_products: number
  unique_products: number
  total_clients: number
  unique_clients: number
  revenue_by_period?: Array<{
    period: string
    revenue: number
  }>
  top_products?: Array<{
    product: string
    revenue: number
  }>
}



