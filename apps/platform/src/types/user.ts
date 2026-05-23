export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences: UserPreferences;
  role: 'customer' | 'organizer' | 'admin';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  favoriteCategories: string[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token?: string;
}