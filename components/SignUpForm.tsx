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

  const { isSignedIn } = useAuth();

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    SetauthErr(null);
    try {
      if (isSignedIn) {
        SetauthErr("You are already logged in. Please logout first.");
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
      <div className="flex min-h-screen">
        {/* Left Side - Verification Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[#FAFAFA]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex items-center gap-1 mb-6 lg:hidden"
              >
                <span className="text-2xl font-bold tracking-tight text-[#0A0A0A]">drop</span>
                <span className="text-2xl font-bold tracking-tight text-[#D31100]">ee</span>
                <span className="text-[#D31100] text-3xl leading-none">.</span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-2"
              >
                VERIFY EMAIL
              </motion.h2>
              <p className="text-[#666666] text-sm">
                Enter the verification code sent to your email
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <label className="block text-xs font-medium tracking-widest text-[#666666] uppercase mb-2">
                Verification Code
              </label>
              <input
                id="verificationCodeF"
                type="text"
                placeholder="Enter OTP"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#E5E5E5] text-[#0A0A0A] placeholder-[#999999] focus:outline-none focus:border-[#D31100] focus:ring-1 focus:ring-[#D31100] transition-all"
                autoFocus
              />
            </motion.div>

            {verificationErr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <p className="text-[#D31100] text-sm mb-3 p-3 bg-[#FEF2F2] border border-[#FECACA]">
                  {verificationErr}
                </p>
                <button
                  type="button"
                  onClick={() => signUp.verifications.sendEmailCode()}
                  className="text-sm text-[#D31100] hover:text-[#D14D2D] font-medium tracking-wide"
                >
                  RESEND CODE
                </button>
              </motion.div>
            )}

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              type="submit"
              onClick={handleVerificationCode}
              disabled={isSubmitting}
              className="w-full mt-6 px-6 py-3 bg-[#D31100] hover:bg-[#D14D2D] disabled:bg-[#CCCCCC] text-white font-medium tracking-widest uppercase transition-all"
            >
              {isSubmitting ? (
                <motion.span
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  VERIFYING...
                </motion.span>
              ) : (
                "VERIFY"
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] items-center justify-center p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-64 h-64 border border-white/20 rounded-full" />
            <div className="absolute bottom-32 right-16 w-48 h-48 border border-white/20 rounded-full" />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 border border-white/20 rounded-full" />
          </div>
          
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center justify-center gap-1 mb-8"
            >
              <span className="text-5xl font-bold tracking-tight text-white">drop</span>
              <span className="text-5xl font-bold tracking-tight text-[#D31100]">ee</span>
              <span className="text-[#D31100] text-6xl leading-none">.</span>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-white/60 text-lg tracking-wide max-w-xs mx-auto"
            >
              Almost there! Verify your email to complete registration.
            </motion.p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[#FAFAFA]">
        <motion.form
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center gap-1 mb-6 lg:hidden"
            >
              <span className="text-2xl font-bold tracking-tight text-[#0A0A0A]">drop</span>
              <span className="text-2xl font-bold tracking-tight text-[#D31100]">ee</span>
              <span className="text-[#D31100] text-3xl leading-none">.</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-2"
            >
              CREATE ACCOUNT
            </motion.h2>
            <p className="text-[#666666] text-sm">
              Join Dropee and start storing your files securely
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-xs font-medium tracking-widest text-[#666666] uppercase mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Full Name"
                {...register("name")}
                className="w-full px-4 py-3 bg-white border border-[#E5E5E5] text-[#0A0A0A] placeholder-[#999999] focus:outline-none focus:border-[#D31100] focus:ring-1 focus:ring-[#D31100] transition-all"
              />
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-[#D31100] text-xs mt-2"
                >
                  {errors.name.message}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest text-[#666666] uppercase mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="w-full px-4 py-3 bg-white border border-[#E5E5E5] text-[#0A0A0A] placeholder-[#999999] focus:outline-none focus:border-[#D31100] focus:ring-1 focus:ring-[#D31100] transition-all"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-[#D31100] text-xs mt-2"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest text-[#666666] uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a strong password"
                {...register("password")}
                className="w-full px-4 py-3 bg-white border border-[#E5E5E5] text-[#0A0A0A] placeholder-[#999999] focus:outline-none focus:border-[#D31100] focus:ring-1 focus:ring-[#D31100] transition-all"
              />
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-[#D31100] text-xs mt-2"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest text-[#666666] uppercase mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                className="w-full px-4 py-3 bg-white border border-[#E5E5E5] text-[#0A0A0A] placeholder-[#999999] focus:outline-none focus:border-[#D31100] focus:ring-1 focus:ring-[#D31100] transition-all"
              />
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-[#D31100] text-xs mt-2"
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
              className="text-[#D31100] text-sm mt-4 p-3 bg-[#FEF2F2] border border-[#FECACA]"
            >
              {authErr}
            </motion.p>
          )}

          <div className="flex justify-end mt-4">
            <p className="text-sm text-[#666666]">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-[#0A0A0A] font-medium hover:text-[#D31100] transition-colors"
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
            className="w-full mt-6 px-6 py-3 bg-[#D31100] hover:bg-[#D14D2D] disabled:bg-[#CCCCCC] text-white font-medium tracking-widest uppercase transition-all"
          >
            {isSubmitting ? (
              <motion.span
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                CREATING...
              </motion.span>
            ) : (
              "SIGN UP"
            )}
          </motion.button>
        </motion.form>
      </div>

      <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white/20 rounded-full" />
          <div className="absolute bottom-32 right-16 w-48 h-48 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 border border-white/20 rounded-full" />
        </div>
        
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center justify-center gap-1 mb-8"
          >
            <Link href={"/"}>
            <span className="text-5xl font-bold tracking-tight text-white">drop</span>
            <span className="text-5xl font-bold tracking-tight text-[#D31100]">ee</span>
            <span className="text-[#D31100] text-6xl leading-none">.</span>
            </Link>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/60 text-lg tracking-wide max-w-xs mx-auto"
          >
            Join thousands of users who trust Dropee for their cloud storage needs.
          </motion.p>
        </div>
      </div>
    </div>
  );
}