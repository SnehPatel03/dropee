"use client"
import { useAuth } from "@clerk/nextjs";
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  Lock,
  FolderSync,
  Cloud,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-bold tracking-tight"
          >
            drop<span className="text-primary">ee</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-muted-foreground hover:text-foreground transition"
            >
              About
            </Link>
          </div>
          <Link
            href={isSignedIn ? "/sign-in" : "/sign-up"}
            className="px-5 py-2 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition"
          >
            {isSignedIn ? "Login" : "Get Started"}
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-20 md:pt-32 pb-24">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/40 text-primary text-xs font-medium tracking-wide uppercase mb-8">
            <span className="w-1.5 h-1.5 bg-primary" />
            Simple cloud storage
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[0.95] uppercase">
            Store your
            <br />
            files with
            <br />
            <span className="text-primary">simplicity.</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mt-8 leading-relaxed">
            Cloud storage that just works. Upload, organize, and access your
            files from anywhere. Secure, fast, seamless.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link
              href={"/sign-in"}
              className="group px-7 py-3 bg-foreground text-background font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition"
            >
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              <span className="w-8 h-px bg-primary" />
              Features
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight uppercase">
              Everything you need
              <br />
              <span className="text-primary">for storage.</span>
            </h2>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1 border border-foreground bg-foreground text-background">
              All
            </span>
            <span className="px-3 py-1 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition cursor-pointer">
              Security
            </span>
            <span className="px-3 py-1 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition cursor-pointer">
              Teams
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group p-8 bg-background hover:bg-muted/50 transition"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {feature.category}
                </span>
                <span className="text-[10px] px-2 py-0.5 border border-primary/30 text-primary uppercase tracking-wider">
                  {feature.tag}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-8 pt-6 border-t border-border">
                <div className="w-10 h-10 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition">
                  {feature.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-3 text-xs font-medium text-background/50 uppercase tracking-wider mb-4">
                <span className="w-8 h-px bg-primary" />
                About
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight uppercase leading-tight mb-8">
                Built for teams
                <br />
                who move fast.
              </h2>
              <p className="text-background/60 leading-relaxed mb-6">
                Dropee was created with one goal: eliminate the friction of file
                management. We believe cloud storage should be invisible,
                working seamlessly in the background while you focus on what
                matters.
              </p>
              <p className="text-background/60 leading-relaxed">
                With military-grade encryption, instant sync, and a clean
                interface, Dropee is the storage platform for modern teams and
                individuals who refuse to compromise.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-background/10">
              <div className="p-8 bg-foreground">
                <Cloud className="w-5 h-5 text-primary mb-4" />
                <div className="font-display text-sm font-bold uppercase tracking-wide">
                  Cloud-first
                </div>
                <p className="text-background/50 text-xs mt-2">
                  Access anywhere, anytime
                </p>
              </div>
              <div className="p-8 bg-foreground">
                <Lock className="w-5 h-5 text-primary mb-4" />
                <div className="font-display text-sm font-bold uppercase tracking-wide">
                  Secure
                </div>
                <p className="text-background/50 text-xs mt-2">
                  End-to-end encryption
                </p>
              </div>
              <div className="p-8 bg-foreground">
                <Zap className="w-5 h-5 text-primary mb-4" />
                <div className="font-display text-sm font-bold uppercase tracking-wide">
                  Fast
                </div>
                <p className="text-background/50 text-xs mt-2">
                  Lightning quick uploads
                </p>
              </div>
              <div className="p-8 bg-foreground"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-32 text-center">
        <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight uppercase">
          Ready to simplify
          <br />
          <span className="text-primary">your storage?</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mt-6">
          Join Dropee to store, sync, and share their most important files.
        </p>
        <button className="mt-10 px-8 py-3 bg-foreground text-background font-medium hover:bg-foreground/90 transition inline-flex items-center gap-2 group">
          Get started free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
        </button>
        <p className="text-xs text-muted-foreground mt-4">
          No credit card required
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-display text-xl font-bold tracking-tight">
              drop<span className="text-primary">ee</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground"></div>
            <div className="text-xs text-muted-foreground">
              2026 Dropee All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    category: "Storage",
    tag: "Core",
    icon: <Cloud className="w-5 h-5" />,
    title: "Cloud Storage",
    description:
      "Store all your files securely in the cloud. Access them from any device, anywhere.",
  },
  
  {
    category: "Speed",
    tag: "Quick",
    icon: <Zap className="w-5 h-5" />,
    title: "Fast Uploads",
    description:
      "Our optimized infrastructure ensures lightning-fast upload and download speeds.",
  },
  {
    category: "Privacy",
    tag: "Trust",
    icon: <Lock className="w-5 h-5" />,
    title: "Privacy First",
    description:
      "Your data belongs to you. We never sell or share your information with third parties.",
  },
];
