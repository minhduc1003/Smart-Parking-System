import axiosInstance from "./axiosConfig";

export const loginApi = async (email: string, password: string) => {
  return axiosInstance.post<any>(`/user/login`, { email, password });
};
export const registerApi = async (
  email: string,
  name: string,
  password: string,
  numberPlate: string
) => {
  return await axiosInstance.post<any>(`/user/register`, {
    email,
    name,
    password,
    numberPlate,
  });
};
export const depositApi = async (userId: string, amount: number) => {
  return await axiosInstance.post<any>(`/user/deposit`, { userId, amount });
};
export const withdrawApi = async (userId: string, amount: number) => {
  return await axiosInstance.post<any>(`/user/withdraw`, { userId, amount });
};

export const getUserApi = async () => {
  return await axiosInstance.get<any>(`/user/getUser`);
};
