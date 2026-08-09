"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { TextInput, Button } from "@mantine/core";
import { useAppDispatch } from "@/store/store-hooks";
import { loginUser } from "@/store/slices/auth-slice";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidRedirectUrl, routes } from "@/utils/routes";

// ✅ Define the Yup schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// ✅ Infer TypeScript types from the schema
type LoginForm = yup.InferType<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
  });

  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSubmit = async (data: LoginForm) => {
    await dispatch(
      loginUser({
        email: data.email,
        password: data.password,
      })
    ).unwrap();

    const redirectUrl = searchParams.get("redirectUrl");
    const destination =
      redirectUrl && isValidRedirectUrl(redirectUrl)
        ? redirectUrl
        : routes.dashboard.root;

    void router.push(destination);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        label="Email"
        placeholder="you@example.com"
        {...register("email")}
        error={errors.email?.message}
        withAsterisk
      />

      <TextInput
        label="Password"
        type="password"
        {...register("password")}
        error={errors.password?.message}
        withAsterisk
        mt="md"
      />

      <Button type="submit" mt="lg" fullWidth>
        Sign In
      </Button>
    </form>
  );
}
