import axiosInstance from "./axiosConfig";

export const loginApi = async (email: string, password: string) => {
  return axiosInstance.post<any>(`/user/login`, { email, password });
};
export const registerApi = async () => {
  return await axiosInstance.post<any>(`/user/register`);
};
