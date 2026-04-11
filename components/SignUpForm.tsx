"use client";

import { signUpSchema } from "@/schemas/signUpSchema";
import { useForm } from "react-hook-form";
import { useSignUp } from "@clerk/nextjs";
import { z } from "zod";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authErr, SetauthErr] = useState<null | string>(null);
  const [verificationErr, setVerificationErr] = useState<null | string>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { signUp } = useSignUp();

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    SetauthErr(null);

    try {
      await signUp.password({
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.update({
        firstName: data.name,
      });

      if (signUp.status === "complete") {
        router.push("/dashboard");
      } else {
        await signUp.verifications.sendEmailCode();
        setVerifying(true);
      }
    } catch (error: any) {
      SetauthErr(
        error.errors?.[0]?.message || "An error in Signup please try again!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationCode = async () => {
    if (!signUp) return;

    SetauthErr(null);
    setIsSubmitting(true);
    setVerificationErr(null);

    try {
      await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });

      if (signUp.status === "complete") {
        router.push("/dashboard");
      } else {
        setVerificationErr("Verification is incomplete. Try Again!");
      }
    } catch (error: any) {
      setVerificationErr(
        error.errors?.[0]?.message ||
          "An error in Verification please try again!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold text-center mb-4">
            Verify Email
          </h2>

          <input
            id="verificationCodeF"
            type="text"
            placeholder="Enter OTP"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full p-2 border rounded mb-3"
            autoFocus
          />

          {verificationErr && (
            <p className="text-red-500 text-sm mb-2">{verificationErr}</p>
          )}

          <button
            type="submit"
            onClick={handleVerificationCode}
            disabled={isSubmitting}
            className="w-full bg-black text-white p-2 rounded"
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white p-6 rounded-2xl shadow"
      >
        <h2 className="text-xl font-semibold text-center mb-4">
          Create Account
        </h2>

        <input
          type="text"
          placeholder="Name"
          {...register("name")}
          className="w-full p-2 border rounded mb-2"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mb-2">{errors.name.message}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          {...register("email")}
          className="w-full p-2 border rounded mb-2"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mb-2">{errors.email.message}</p>
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

        <input
          type="password"
          placeholder="Confirm Password"
          {...register("confirmPassword")}
          className="w-full p-2 border rounded mb-2"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mb-2">
            {errors.confirmPassword.message}
          </p>
        )}

        {authErr && <p className="text-red-500 text-sm mb-3">{authErr}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white p-2 rounded mt-2"
        >
          {isSubmitting ? "Creating..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
