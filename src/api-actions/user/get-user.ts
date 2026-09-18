import { axiosInstance } from "../axios-instance";
import { AdminUser } from "@/models/admin-user";

export async function getUserById(id: string): Promise<AdminUser> {
  try {
    const response = await axiosInstance.get<AdminUser>("/admin-user/" + id);

    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Fetching user failed");
  }
}
