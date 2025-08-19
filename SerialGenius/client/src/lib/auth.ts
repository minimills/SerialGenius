import { User } from "@shared/schema";

interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export class AuthService {
  private token: string | null = null;
  private user: Omit<User, 'password'> | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async logout(): Promise<void> {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser(): Promise<Omit<User, 'password'> | null> {
    if (!this.token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      this.user = await response.json();
      return this.user;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): Omit<User, 'password'> | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  isAdmin(): boolean {
    return this.user?.role === 'Admin';
  }
}

export const authService = new AuthService();
