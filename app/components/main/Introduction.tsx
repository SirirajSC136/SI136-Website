// app/_components/main/Introduction.tsx

import Image from 'next/image';
import Link from 'next/link';
import { GraduationCap, BookOpen, Info, MessageSquare } from 'lucide-react';
import heroBackground from '@/app/assets/images/hero-background.jpg';
import styles from './main.module.css';

const Introduction = () => {
  const title = "SIRIRAJ 136";

  return (
    <div className="relative h-auto sm:h-[70vh] w-full overflow-hidden bg-gray-900">
      {/* Background image */}
      <Image
        src={heroBackground}
        alt="Cityscape background"
        layout="fill"
        objectFit="cover"
        quality={100}
        priority
        placeholder="blur"
        className={styles.animateSlowZoom}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-black/40 to-transparent" />

      {/* Title + subtitle */}
      <div className="relative z-10 flex flex-col items-center text-center p-4 pt-32 sm:pt-40 md:pt-48">
        <h1
          className={`flex text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-wider text-white ${styles.animateFadeInUp}`}
          style={{ animationDelay: '0.3s' }}
        >
          {title.split('').map((char, index) => (
            <span key={index} className={styles.titleCharacter}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>
        <p
          className={`mt-3 text-xl md:text-3xl font-light text-gray-200 ${styles.animateFadeInUp}`}
          style={{ animationDelay: '0.5s' }}
        >
          SI136 Website
        </p>
      </div>

      {/* Icon grid pinned to bottom on desktop */}
      <div
        className={`z-10 ${styles.animateFadeInUp} relative sm:absolute sm:bottom-0 sm:left-0 sm:right-0`}
        style={{ animationDelay: '0.7s' }}
      >
        <div className="container mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 text-center">
          {/* Academic */}
          <Link href="/academics">
            <div className="group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-110">
              <div className="relative rounded-full p-4 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-violet-500/30 group-hover:shadow-lg group-hover:shadow-violet-500/50">
                <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 transition-colors duration-300 group-hover:text-white" />
              </div>
              <span className="mt-3 font-semibold text-gray-200 transition-colors duration-300 group-hover:text-emerald-300">
                Academic
              </span>
            </div>
          </Link>

          {/* Books */}
          <Link href="">
            <div className="group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-110">
              <div className="relative rounded-full p-4 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-amber-500/30 group-hover:shadow-lg group-hover:shadow-amber-500/50">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 transition-colors duration-300 group-hover:text-white" />
              </div>
              <span className="mt-3 font-semibold text-gray-200 transition-colors duration-300 group-hover:text-emerald-300">
                Books
              </span>
            </div>
          </Link>

          {/* Useful Info */}
          <Link href="/UsefulInfo">
            <div className="group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-110">
              <div className="relative rounded-full p-4 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-violet-500/30 group-hover:shadow-lg group-hover:shadow-violet-500/50">
                <Info className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 transition-colors duration-300 group-hover:text-white" />
              </div>
              <span className="mt-3 font-semibold text-gray-200 transition-colors duration-300 group-hover:text-emerald-300">
                Useful Info
              </span>
            </div>
          </Link>

          {/* Feedback */}
          <Link href="">
            <div className="group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-110">
              <div className="relative rounded-full p-4 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-amber-500/30 group-hover:shadow-lg group-hover:shadow-amber-500/50">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 transition-colors duration-300 group-hover:text-white" />
              </div>
              <span className="mt-3 font-semibold text-gray-200 transition-colors duration-300 group-hover:text-emerald-300">
                Feedback
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Introduction;
