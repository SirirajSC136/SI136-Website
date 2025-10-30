'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image, { StaticImageData } from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';


// A more robust NavLink sub-component for the new "pill" animation
const NavLink = ({ href, children, isScrolled }: { href: string; children: React.ReactNode; isScrolled: boolean }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href} className="group relative px-3 py-2 transition-colors">
            {/* Background Pill for Hover/Active State */}
            <span
                className={`absolute inset-0 z-0 rounded-md transition-transform duration-300 ease-in-out
                ${isActive ? 'scale-100 bg-emerald-500/10' : 'scale-0 group-hover:scale-100 bg-gray-500/10'}
                `}
            />
            {/* Text Content */}
            <span className={`relative z-10 transition-colors duration-200
                ${isActive ? 'text-emerald-600 font-semibold' : (isScrolled ? 'text-slate-700' : 'text-black')}
                group-hover:${isScrolled ? 'text-slate-900' : 'text-black'}
            `}>
                {children}
            </span>
        </Link>
    );
};

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // FIX: Call usePathname once at the top level of the component.
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Academics', href: '/academics' },
        { name: 'Books', href: '/Books' },
        { name: 'Student Impact', href: '/StudentImpacts' },
        { name: 'Useful Info', href: '/UsefulInfo' },
    ];

    return (
        <>
            <nav className={`sticky mx-auto z-50 transition-all duration-300 ease-in-out${
                isScrolled
                    ? 'border-b border-gray-200/80 bg-white/50 shadow-sm backdrop-blur-lg w-3/5 md:w-3/4 lg:w-3/5 top-1 rounded-2xl border px-4'
                    : 'bg-transparent w-full top-0'
            }`}>
                <div className="container mx-auto flex items-center justify-between p-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 transition-transform hover:scale-105">
                        <Image src={`/images/logo.jpg`} alt="SI136 Logo" width={36} height={36} className={`rounded-full ${!isScrolled ? 'drop-shadow-lg' : ''}`} />
                        <span className={`text-xl font-bold tracking-wide transition-colors ${isScrolled ? 'text-slate-800' : 'text-black drop-shadow-md'
                            }`}>
                            SI136
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                        {navLinks.map((link) => (
                            <NavLink key={link.name} href={link.href} isScrolled={isScrolled}>
                                {link.name}
                            </NavLink>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className={`transition-colors ${isScrolled ? 'text-slate-800' : 'text-black'}`}>
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-white transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col items-center justify-center h-full space-y-8">
                    {navLinks.map((link) => {
                        // FIX: Use the 'pathname' variable here instead of calling the hook again.
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`text-3xl font-semibold transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-800'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Navbar;