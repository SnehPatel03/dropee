import * as z from "zod";

export const signUpSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }).min(3, { message: "Name must have atleast 3 characters" }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter valid Email address." }),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must have atleast 8 Characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm Password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password is not matched.",
    path: ["confirmPassword"],
  });
