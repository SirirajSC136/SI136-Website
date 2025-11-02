"use client";

import { BookHeart } from "lucide-react";
import React from "react";

const AcademicHero = () => {
	const keyframes = `
        @keyframes move-light-1 {
            0% { transform: translate(-20%, -20%); opacity: 0.6; }
            50% { transform: translate(20%, 10%); opacity: 0.4; }
            100% { transform: translate(-20%, -20%); opacity: 0.6; }
        }
        @keyframes move-light-2 {
            0% { transform: translate(10%, 20%); opacity: 0.3; }
            50% { transform: translate(-10%, -20%); opacity: 0.5; }
            100% { transform: translate(10%, 20%); opacity: 0.3; }
        }
    `;

	return (
		<>
			<style>{keyframes}</style>
			<div className="relative overflow-hidden bg-slate-800 py-24 text-center border-b border-slate-800">
				<div className="absolute top-0 left-0 w-full h-full z-0">
					<div
						className="absolute h-[500px] w-[500px] rounded-full bg-sky-500/30"
						style={{
							animation: "move-light-1 15s ease-in-out infinite",
							filter: "blur(120px)",
						}}
					/>
					<div
						className="absolute h-[400px] w-[400px] rounded-full bg-emerald-500/30"
						style={{
							animation: "move-light-2 18s ease-in-out infinite alternate",
							filter: "blur(100px)",
							right: 0,
							bottom: 0,
						}}
					/>
				</div>

				{/* Content */}
				<div className="container mx-auto px-4 relative z-10">
					<h1
						className="text-5xl font-extrabold text-white tracking-tight sm:text-6xl"
						style={{ textShadow: "0 3px 15px rgba(0,0,0,0.5)" }}>
						Academic Resources
					</h1>
					<p
						className="mt-4 text-lg text-white max-w-3xl mx-auto"
						style={{ textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>
						A comprehensive collection of course materials, lecture notes, and
						resources.
					</p>
					<a
						href="https://forms.gle/tC41NLtj9S6jTB7j8"
						className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-emerald-500/90 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-emerald-500 hover:shadow-emerald-500/30">
						<BookHeart size={20} />
						Donate Resource
					</a>
				</div>
			</div>
		</>
	);
};

export default AcademicHero;
