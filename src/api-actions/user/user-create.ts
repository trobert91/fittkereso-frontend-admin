import { axiosInstance } from "../axios-instance";
import { AdminUser } from "@/models/admin-user";
import { UserCreateDto } from "@/models/dtos/user-create.dto";

export async function postUserCreate(dto: UserCreateDto): Promise<AdminUser> {
  try {
    const response = await axiosInstance.post<AdminUser>("/admin-user", dto);

    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "User create failed");
  }
}
