export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';

export type UserDTO = {
  id: number;
  email: string;
  role: string;
  token: string;
  imgUrl: string;
  firstName: string;
  lastName: string;
  userName: string;
  city?: string | null;
  description?: string | null;
  birthDate?: string | null;
  age?: number | null;
  isPremium?: boolean;
  authProvider?: AuthProvider;
};

export type UserRegistrationDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userName: string;
  age: number;
};
