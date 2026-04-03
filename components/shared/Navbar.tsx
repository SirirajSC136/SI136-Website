"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, RefreshCcw, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ModeSwitch } from "./ModeSwitch";
import { SessionSummary } from "@/lib/auth/sessionSummary";

type NavbarProps = {
  session: SessionSummary;
};

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className="group relative px-3 py-2 transition-colors">
      <span
        className={`absolute inset-0 z-0 rounded-md transition-transform duration-300 ${
          isActive
            ? "scale-100 bg-emerald-500/10"
            : "scale-0 bg-gray-500/10 group-hover:scale-100"
        }`}
      />
      <span
        className={`relative z-10 ${
          isActive ? "font-semibold text-emerald-600" : "text-primary"
        }`}
      >
        {children}
      </span>
    </Link>
  );
};

function SessionControl({
  user,
  onSwitchAccount,
  switching,
  compact = false,
  isScrolled,
}: {
  user: any;
  onSwitchAccount: () => void;
  switching: boolean;
  compact?: boolean;
  isScrolled: boolean;
}) {
  if (!user) return null;

  const label = user.displayName || user.email || "Signed in";
  const sublabel = user.email && user.email !== label ? user.email : undefined;
  const initial = label.trim().charAt(0).toUpperCase() || "U";
  const photoURL = user.photoURL
    ? user.photoURL
        .replace(/&quot;/g, "")
        .replace(/^"|"$/g, "")
        .replace("=s96-c", "=s200-c")
    : null;

  return (
    <div
      className={`flex justify-center md:justify-between items-center gap-3 rounded-2xl transition-all duration-300 ${
        compact ? "w-full justify-between px-4 py-3" : "px-3 py-2"
      } ${
        isScrolled
          ? "lg:border border-border/0 lg:bg-background/0 hidden xl:block"
          : "lg:border border-border/80 lg:bg-background/80 md:hidden lg:flex"
      }`}
    >
      <div className={`flex min-w-0 items-center gap-3 `}>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-700 `}
          style={
            photoURL
              ? {
                  backgroundImage: `url(${photoURL})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
          aria-hidden="true"
        >
          {photoURL ? null : initial}
        </div>

        <div
          className={`transition-all duration-300 ${
            isScrolled ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
          }`}
        >
          <p className="truncate text-sm font-semibold text-primary">{label}</p>
          {sublabel && (
            <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
      </div>

      {!isScrolled && (
        <button
          onClick={onSwitchAccount}
          disabled={switching}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <RefreshCcw size={14} className={switching ? "animate-spin" : ""} />
          {switching ? "Switching..." : "Switch"}
        </button>
      )}
    </div>
  );
}

export default function Navbar({ session }: NavbarProps) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [switching, setSwitching] = useState(false);
  const pathname = usePathname();

  const sessionUser = session.isAuthenticated
    ? {
        displayName: session.name,
        email: session.email,
        photoURL: session.picture,
      }
    : null;

  const effectiveUser = user ?? sessionUser;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Academics", href: "/academics" },
    { name: "Books", href: "/Books" },
    { name: "Student Impact", href: "/StudentImpacts" },
    { name: "Useful Info", href: "/UsefulInfo" },
  ];

  const handleSwitchAccount = async () => {
    setSwitching(true);
    try {
      await signOut();
      await signInWithGoogle();
    } catch (error) {
      console.error("Switch account failed:", error);
      alert("Could not switch accounts.");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <>
      <nav
        className={`sticky mx-auto z-50 transition-all duration-300 ${
          isScrolled
            ? "top-1 w-fit max-w-full min-w-4/5 md:min-w-3/4 rounded-2xl border bg-background/50 px-4 shadow backdrop-blur-lg"
            : "top-0 w-full"
        }`}
      >
        <div className=" container mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-3 w-fit shrink-0">
            <Image
              src="/images/logo.jpg"
              alt="SI136 Logo"
              width={36}
              height={36}
              className="rounded-full"
            />
            <div className="text-xl font-bold text-primary">SI136</div>
          </Link>

          <div className="hidden md:flex items-center gap-2 flex-nowrap whitespace-nowrap">
            {navLinks.map((link) => (
              <NavLink key={link.name} href={link.href}>
                {link.name}
              </NavLink>
            ))}

            <ModeSwitch />

            <SessionControl
              user={user}
              onSwitchAccount={handleSwitchAccount}
              switching={switching}
              isScrolled={isScrolled}
            />
          </div>

          {/* Mobile */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-background transition-transform md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <SessionControl
            user={user}
            onSwitchAccount={handleSwitchAccount}
            switching={switching}
            isScrolled={isScrolled}
            compact
          />

          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-3xl font-semibold"
            >
              {link.name}
            </Link>
          ))}

          <ModeSwitch />
        </div>
      </div>
    </>
  );
}
