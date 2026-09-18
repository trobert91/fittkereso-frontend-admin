import { axiosInstance } from "../axios-instance";
import { AdminUser } from "@/models/admin-user";
import { UserUpdateDto } from "@/models/dtos/user-update.dto";

/** PATCH, not PUT: only the changed fields are sent. */
export async function patchUserUpdate(
  id: string,
  dto: UserUpdateDto
): Promise<AdminUser> {
  try {
    const response = await axiosInstance.patch<AdminUser>(
      "/admin-user/" + id,
      dto
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "User update failed");
  }
}
