"use client";

import { signInSchema } from "@/schemas/signInSchema";
import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export default function SignInForm() {
  const router = useRouter();
  const { signIn } = useSignIn();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authErr, SetauthErr] = useState<null | string>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);
    SetauthErr(null);

    try {
      await signIn.password({
        identifier: data.identifier,
        password: data.password,
      });

      if (signIn.status == "complete") {
        router.push("/dashboard");
      } else {
        SetauthErr("SignIn Error");
      }
    } catch (error: any) {
      SetauthErr(
        error.errors?.[0]?.messege ||
          "An error occured while signin...! Please try again",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white p-6 rounded-2xl shadow"
      >
        <h2 className="text-xl font-semibold text-center mb-4">Sign In</h2>
        <input
          type="text"
          placeholder="Email or Username"
          {...register("identifier")}
          className="w-full p-2 border rounded mb-2"
        />
        {errors.identifier && (
          <p className="text-red-500 text-sm mb-2">
            {errors.identifier.message}
          </p>
        )}
        <input
          type="password"
          placeholder="Password"
          {...register("password")}
          className="w-full p-2 border rounded mb-2"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mb-2">{errors.password.message}</p>
        )}
        {authErr && <p className="text-red-500 text-sm mb-3">{authErr}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white p-2 rounded mt-2"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
