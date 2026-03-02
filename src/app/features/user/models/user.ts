import { FileHandle } from 'src/app/common/models/file-handle.model';

export type User = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  imgUrl: FileHandle[];
  userName: string;
  description: string;
  birthdate: Date;
  city: string;
  age: number;
  isPremium?: boolean;
  profileStatus?: string;
  authProvider?: string;
  lastLoginAt?: string;
  createdAt?: string;
};
