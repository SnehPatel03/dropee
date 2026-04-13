"use client";

import { signInSchema } from "@/schemas/signInSchema";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { isSignedIn , signOut } = useAuth();
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
      console.log("data of sign in", signIn);

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            const url = decorateUrl("/dashboard");
            router.push(url);
          },
        });
      } else {
        setAuthErr("Sign-in not complete. Try again.");
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.form
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-200"
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-2xl font-semibold text-center mb-6 text-gray-900"
        >
          Sign In
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-4"
        >
          <div>
            <input
              type="text"
              placeholder="Email"
              {...register("identifier")}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 transition-colors bg-gray-50 text-gray-900 placeholder-gray-600 shadow-sm"
            />
            {errors.identifier && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-red-500 text-sm mt-1"
              >
                {errors.identifier.message}
              </motion.p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 transition-colors bg-gray-50 text-gray-900 placeholder-gray-600 shadow-sm"
            />
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-red-500 text-sm mt-1"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>
        </motion.div>

        {authErr && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="text-red-600 text-sm mt-4 p-3 bg-red-50 rounded-lg border border-red-200"
          >
            {authErr}
          </motion.p>
        )}

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-500 text-white p-3 rounded-xl font-medium transition-colors mt-6 shadow-md"
        >
          {isSubmitting ? (
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Signing In...
            </motion.span>
          ) : (
            "Sign In"
          )}
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-center mt-4"
        >
          <p className="text-gray-600 text-sm">
            New user?{" "}
            <Link
              href="/sign-up"
              className="text-gray-900 font-semibold hover:underline transition-all"
            >
              Create Account
            </Link>
          </p>
        </motion.div>
      </motion.form>
    </div>
  );
}
