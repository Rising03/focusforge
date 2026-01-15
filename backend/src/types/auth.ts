export interface User {
  id: string;
  email: string;
  password_hash?: string;
  google_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRegistration {
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password_hash'>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface GoogleOAuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}