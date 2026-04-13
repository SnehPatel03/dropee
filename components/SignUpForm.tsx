"use client";
import { motion } from "framer-motion";
import { signUpSchema } from "@/schemas/signUpSchema";
import { useForm } from "react-hook-form";
import { useSignUp } from "@clerk/nextjs";
import { z } from "zod";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
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

  const { isSignedIn, signOut } = useAuth();

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    SetauthErr(null);
    try {
      if (isSignedIn) {
        SetauthErr("User Already Registered.");
        setIsSubmitting(false);
      }

      const { error }: any = await signUp.password({
        emailAddress: data.email,
        password: data.password,
      });

      if (error) {
        const err = error.errors?.[0];

        console.log("ERROR:", err);

        if (err?.code === "form_password_pwned") {
          SetauthErr(
            "This password is weak or found in a data breach. Try a stronger one.",
          );
          return;
        }

        if (err?.code === "form_password_compromised") {
          SetauthErr(
            "This password is compromised. Use a different secure password.",
          );
          return;
        }

        if (err?.code === "form_identifier_exists") {
          SetauthErr("User Already Registered.");
          return;
        }
        if (err?.code === "session_exists") {
          SetauthErr("User Already Registered.");
          return;
        }

        SetauthErr(err?.message || "Signup failed");
        return;
      }

      if (error) {
        const err = error.errors?.[0];
        console.log("ERROR:", err);

        if (err?.code === "form_password_pwned") {
          SetauthErr(
            "Password is too weak or found in breach. Try stronger one.",
          );
        } else if (err?.code === "identifier_already_signed_in") {
          SetauthErr("You are already signed in. Please logout first.");
        } else {
          SetauthErr(err?.message || "Signup failed");
        }

        return;
      }

      await signUp.update({
        firstName: data.name,
      });

      await signUp.verifications.sendEmailCode();
      setVerifying(true);
    } catch (error: any) {
      SetauthErr("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationCode = async () => {
    if (!signUp) return;

    setIsSubmitting(true);
    setVerificationErr(null);

    try {
      await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;

            const url = decorateUrl("/dashboard");
            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else {
        setVerificationErr("Verification incomplete. Try again!");
      }
    } catch (error: any) {
      setVerificationErr(
        error.errors?.[0]?.message || "Verification failed. Try again!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
        >
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-xl font-semibold text-center mb-4 text-gray-900"
          >
            Verify Email
          </motion.h2>

          <motion.input
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            id="verificationCodeF"
            type="text"
            placeholder="Enter OTP"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-gray-900 transition-colors"
            autoFocus
          />

          {verificationErr && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <p className="text-red-500 text-sm mb-3">{verificationErr}</p>
              <button
                type="button"
                onClick={() => signUp.verifications.sendEmailCode()}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Resend OTP
              </button>
            </motion.div>
          )}

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            type="submit"
            onClick={handleVerificationCode}
            disabled={isSubmitting}
            className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-500 text-white p-3 rounded-xl font-medium transition-colors"
          >
            {isSubmitting ? (
              <motion.span
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Verifying...
              </motion.span>
            ) : (
              "Verify"
            )}
          </motion.button>
        </motion.div>
      </div>
    );
  }

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
          Create Account
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
              placeholder="Name"
              {...register("name")}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 transition-colors bg-gray-50 text-gray-900 placeholder-gray-600 shadow-sm"
            />
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-red-500 text-sm mt-1 ml-1"
              >
                {errors.name.message}
              </motion.p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 transition-colors bg-gray-50 text-gray-900 placeholder-gray-600 shadow-sm"
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-red-500 text-sm mt-1 ml-1"
              >
                {errors.email.message}
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
                className="text-red-500 text-sm mt-1 ml-1"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              {...register("confirmPassword")}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 transition-colors bg-gray-50 text-gray-900 placeholder-gray-600 shadow-sm"
            />
            {errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-red-500 text-sm mt-1 ml-1"
              >
                {errors.confirmPassword.message}
              </motion.p>
            )}
          </div>
        </motion.div>

        {authErr && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="text-red-600 text-sm mt-4 p-3  bg-red-50 rounded-lg border border-red-200"
          >
            {authErr}
          </motion.p>
        )}
        <div className="w-full flex justify-end mt-3 -ml-1 py-2">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-black font-medium transition-all duration-300 hover:text-gray-600"
            >
              Sign in
            </Link>
          </p>
        </div>

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-500 text-white p-3 rounded-xl font-medium transition-colors mt-2 shadow-md"
        >
          {isSubmitting ? (
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Creating...
            </motion.span>
          ) : (
            "Sign Up"
          )}
        </motion.button>
      </motion.form>
    </div>
  );
}
