export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    password: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
  };
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
