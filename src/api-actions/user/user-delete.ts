import { axiosInstance } from "../axios-instance";

export async function deleteUser(id: string): Promise<void> {
  try {
    await axiosInstance.delete("/admin-user/" + id);
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "User delete failed");
  }
}
