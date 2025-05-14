export type UserDTO = {
  id: number;
  email: string;
  password: string;
  role: string;
  token: string;
  imgUrl: string;
  description: string;
  age: number;
  firstName: string;
  lastName: string;
  userName: string;
};

export type UserRegistrationDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userName: string;
  age: number
};
