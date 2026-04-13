"use client";

import { signInSchema } from "@/schemas/signInSchema";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { isSignedIn, signOut } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authErr, setAuthErr] = useState<string | null>(null);

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
    setAuthErr(null);

    try {
      if (isSignedIn) {
        await signOut();
      }

      const res: any = await signIn.create({
        identifier: data.identifier,
        password: data.password,
      });
      console.log(res);
      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            router.push(decorateUrl("/dashboard"));
          },
        });
      } else {
        setAuthErr("Invalid credentials.");
      }
    } catch (error: any) {
      console.log("FULL ERROR:", error);
      const err = error?.errors?.[0];
      if (err?.code === "form_identifier_not_found") {
        setAuthErr("No account found with this email.");
      } else if (err?.code === "form_password_incorrect") {
        setAuthErr("Incorrect password.");
      } else if (err?.message?.includes("already signed in")) {
        await signOut();
        setAuthErr("Session conflict. Please try again.");
      } else {
        setAuthErr(err?.message || "Something went wrong.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] flex-col justify-between p-12">
        <div>
          <Link href="/" className="inline-block">
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              drop<span className="text-[#D31100]">ee</span>
              <span className="text-[#D31100]">.</span>
            </span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-white leading-tight">
            Welcome
            <br />
            Back.
          </h1>
          <p className="text-[#888888] text-lg max-w-md">
            Access your files from anywhere. Secure, fast, and simple cloud
            storage for everyone.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-[#666666]"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-12 text-center">
            <Link href="/" className="inline-block">
              <span className="font-display text-3xl font-bold tracking-tight text-[#0A0A0A]">
                drop<span className="text-[#D31100]">ee</span>
                <span className="text-[#D31100]">.</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="font-display text-3xl font-bold text-[#0A0A0A] uppercase tracking-tight"
            >
              Sign In
            </motion.h2>
            <p className="text-[#666666] mt-2">
              Enter your credentials to continue
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-[#0A0A0A] mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="text"
                placeholder="you@example.com"
                {...register("identifier")}
                className="w-full px-4 py-3.5 bg-white border border-[#E5E5E5] rounded-none focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all text-[#0A0A0A] placeholder-[#999999]"
              />
              {errors.identifier && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-[#D31100] text-sm mt-2"
                >
                  {errors.identifier.message}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0A0A] mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                className="w-full px-4 py-3.5 bg-white border border-[#E5E5E5] rounded-none focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all text-[#0A0A0A] placeholder-[#999999]"
              />
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-[#D31100] text-sm mt-2"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {authErr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="p-4 bg-[#FEF2F2] border-l-4 border-[#D31100]"
              >
                <p className="text-[#D31100] text-sm">{authErr}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0A0A0A] hover:bg-[#1A1A1A] disabled:bg-[#CCCCCC] text-white py-4 font-medium uppercase tracking-wider transition-colors"
            >
              {isSubmitting ? (
                <motion.span
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center justify-center gap-2"
                >
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing In...
                </motion.span>
              ) : (
                "Sign In"
              )}
            </motion.button>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
              {/* <Link
                href="/forgot-password"
                className="text-sm text-[#666666] hover:text-[#0A0A0A] transition-colors"
              >
                Forgot password?
              </Link> */}
              <p className="text-sm text-[#666666]">
                New user?{" "}
                <Link
                  href="/sign-up"
                  className="text-[#0A0A0A] font-semibold hover:text-[#D31100] transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </motion.form>

          <div className="mt-12 pt-8 border-t border-[#E5E5E5]">
            <p className="text-xs text-[#999999] text-center">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
