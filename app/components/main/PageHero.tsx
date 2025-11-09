// PageHero.tsx
"use client";

import React from "react";
import { BookHeart, Home, Globe } from "lucide-react";

const icons = {
	BookHeart,
	Home,
	Globe,
};

interface PageHeroProps {
	title: string;
	subtitle: string;
	link?: string;
	icon?: keyof typeof icons;
	linkDisplay?: string;
}

const PageHero: React.FC<PageHeroProps> = ({
	title,
	subtitle,
	link,
	icon,
	linkDisplay,
}) => {
	const Icon = icon ? icons[icon] : null;

	return (
		<div className="relative overflow-hidden bg-slate-800 py-24 text-center border-b border-slate-800">
			<div className="container mx-auto px-4 relative z-10">
				<div className="text-5xl font-extrabold text-white">{title}</div>
				<p className="mt-4 text-lg text-white">{subtitle}</p>
				{link && (
					<a
						href={link}
						className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-emerald-500/90 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-emerald-500 hover:shadow-emerald-500/30">
						{Icon && <Icon size={20} />}
						{linkDisplay}
					</a>
				)}
			</div>
		</div>
	);
};

export default PageHero;
