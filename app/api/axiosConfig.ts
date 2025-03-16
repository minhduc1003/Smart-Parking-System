import axios from "axios";
import * as SecureStore from "expo-secure-store";

const axiosInstance = axios.create({
  baseURL: "http://192.168.0.245:3000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  withCredentials: false,
});

const setAuthToken = async () => {
  try {
    const token = await SecureStore.getItemAsync("secure_token");
    if (token) {
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error getting token from storage:", error);
  }
};

setAuthToken();

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Axios error:", error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
