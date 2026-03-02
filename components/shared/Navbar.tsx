"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ModeSwitch } from "./ModeSwitch";

type NavbarProps = {
	isAdmin: boolean;
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
				className={`absolute inset-0 z-0 rounded-md transition-transform duration-300 ease-in-out ${
					isActive
						? "scale-100 bg-emerald-500/10"
						: "scale-0 bg-gray-500/10 group-hover:scale-100"
				}`}
			/>
			<span
				className={`relative z-10 transition-colors duration-200 ${
					isActive ? "font-semibold text-emerald-600" : "text-primary"
				}`}
			>
				{children}
			</span>
		</Link>
	);
};

export default function Navbar({ isAdmin }: NavbarProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const pathname = usePathname();

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
		...(isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
	];

	return (
		<>
			<nav
				className={`sticky mx-auto z-50 transition-all duration-300 ease-in-out ${
					isScrolled
						? "top-1 w-3/5 rounded-2xl border border-border/80 bg-background/50 px-4 shadow-sm backdrop-blur-lg md:w-4/5 lg:w-[65%] xl:w-3/5"
						: "top-0 w-full bg-transparent"
				}`}
			>
				<div className="container mx-auto flex items-center justify-between p-4">
					<Link
						href="/"
						className="flex items-center space-x-3 transition-transform hover:scale-105"
					>
						<Image
							src="/images/logo.jpg"
							alt="SI136 Logo"
							width={36}
							height={36}
							className={`rounded-full ${!isScrolled ? "drop-shadow-lg" : ""}`}
						/>
						<span className="text-xl font-bold tracking-wide text-primary">SI136</span>
					</Link>

					<div className="hidden items-center space-x-2 md:flex">
						{navLinks.map((link) => (
							<NavLink key={link.name} href={link.href}>
								{link.name}
							</NavLink>
						))}
						<ModeSwitch />
					</div>

					<div className="flex items-center gap-1 md:hidden">
						{!isScrolled && <ModeSwitch />}
						<button
							onClick={() => setIsOpen((value) => !value)}
							className="text-primary transition-colors"
						>
							{isOpen ? <X size={28} /> : <Menu size={28} />}
						</button>
					</div>
				</div>
			</nav>

			<div
				className={`fixed inset-0 z-40 bg-background transition-transform duration-300 ease-in-out md:hidden ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="flex h-full flex-col items-center justify-center space-y-8">
					{navLinks.map((link) => {
						const isActive = pathname === link.href;
						return (
							<Link
								key={link.name}
								href={link.href}
								onClick={() => setIsOpen(false)}
								className={`text-3xl font-semibold transition-colors ${
									isActive ? "text-emerald-600" : "text-primary"
								}`}
							>
								{link.name}
							</Link>
						);
					})}
					<ModeSwitch />
				</div>
			</div>
		</>
	);
}
