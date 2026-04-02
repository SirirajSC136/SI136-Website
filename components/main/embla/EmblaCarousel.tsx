"use client";

import React from "react";
import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { EmblaOptionsType } from "embla-carousel";
import { useParallax } from "./useParallax"; // Assumes you kept the hook from the previous step
import { useDotButton } from "./EmblaCarouselDotButton";
import Autoplay from "embla-carousel-autoplay";
import { getFirebaseClientFirestore } from "@/lib/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";

type PropType = {
  slides: number[];
  options?: EmblaOptionsType;
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options } = props;
  const birthDayDateStart = new Date("2026-04-02T00:00:00+07:00");
  const birthDayDateEnd = new Date("2026-04-03T23:59:59+07:00");
  const isBirthday =
    Date.now() >= birthDayDateStart.getTime() &&
    Date.now() <= birthDayDateEnd.getTime();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("");
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    setAudio(new Audio("/sound/yay.mp3"));
  }, []);
  const db = getFirebaseClientFirestore();

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      await addDoc(collection(db, "Poon_birthday_wishes"), {
        message,
        sender,
        createdAt: serverTimestamp(),
      });
      confetti({
        particleCount: 500,
        spread: 300,
        origin: { y: 0.6 },
      });
      if (audio) {
        audio.volume = 0.5;
        audio.currentTime = 0;
        audio.play();
      }
      

      setSender("");
      setMessage("");
      setTimeout(() => {
        setIsModalOpen(false);
      }, 300);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Configure Embla
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      dragFree: false,
      loop: true,
      duration: 50, // Increased from default (~25) to 50 for slower, smoother slides
      ...options,
    },
    [
      Autoplay({ delay: 6000, stopOnInteraction: false }), // 2. Enable Autoplay (6 seconds delay)
    ],
  );

  // 2. Attach Custom Hooks
  useParallax(emblaApi);
  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  // Data: Images with specific links and text
  const slideItems = [
    {
      src: "/announcement/hailnight/comingsoon.png",
      link: "https://hailnight.com/",
      title: "Hail Night 2026",
      description: "",
    },
    {
      src: "/announcement/merch/merch-1.JPG",
      link: "https://merchandise.siriraj136.com/",
      title: "Siriraj 136 Merchandise",
      description: "The official merchandise of Siriraj 136 is now available.",
    },
    {
      src: "/announcement/merch/merch-2.jpg",
      link: "https://merchandise.siriraj136.com/",
      title: "Siriraj 136 Merchandise",
      description: "The official merchandise of Siriraj 136 is now available.",
    },
    {
      src: "/announcement/merch/merch-3.JPG",
      link: "https://merchandise.siriraj136.com/",
      title: "Siriraj 136 Merchandise",
      description: "The official merchandise of Siriraj 136 is now available.",
    },
    {
      src: "/announcement/merch/merch-4.jpg",
      link: "https://merchandise.siriraj136.com/",
      title: "Siriraj 136 Merchandise",
      description: "The official merchandise of Siriraj 136 is now available.",
    },
  ];

  const BirthDaySlideItems = [
    {
      src: "/images/poon/poon4.jpg",
      link: "https://hailnight.com/",
      title: "Happy BirthDay To Poon🎊🎉",
      description: "Our favourite Head of Activity (คลิกเพื่ออวยพรปูรณ์)",
    },
    {
      src: "/images/poon/poon5.png",
      link: "",
      title: "Happy BirthDay To Poon🎊🎉",
      description: "Our favourite Head of Activity (คลิกเพื่ออวยพรปูรณ์)",
    },
    {
      src: "/images/poon/poon1.jpg",
      link: "",
      title: "Happy BirthDay To Poon🎊🎉",
      description: "Our favourite Head of Activity (คลิกเพื่ออวยพรปูรณ์)",
    },
    {
      src: "/images/poon/poon2.jpg",
      link: "",
      title: "Happy BirthDay To Poon🎊🎉",
      description: "Our favourite Head of Activity (คลิกเพื่ออวยพรปูรณ์)",
    },
    {
      src: "/images/poon/poon3.jpg",
      link: "",
      title: "Happy BirthDay To Poon🎊🎉",
      description: "Our favourite Head of Activity (คลิกเพื่ออวยพรปูรณ์)",
    },
  ];

  return (
    <div className="relative max-w-5xl px-8 mx-auto rounded-lg bg-secondary-background">
      {/* Viewport */}
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex touch-pan-y -ml-4">
          {slides.map((index) => {
            const item = isBirthday
              ? BirthDaySlideItems[index % BirthDaySlideItems.length]
              : slideItems[index % slideItems.length];
            return (
              <div
                className="flex-shrink-0 flex-grow-0 min-w-0 pl-4 w-full relative h-56 sm:h-92 md:h-112 lg:h-124"
                key={index}
              >
                {/* Parallax Container -> Converted to Link (<a>) */}
                {isBirthday ? (
                  <div
                    onClick={() => setIsModalOpen(true)}
                    className="block overflow-hidden h-full w-full relative rounded-xl cursor-pointer group"
                  >
                    {/* Updated Image Styles for Smoother Parallax:
                   - w-[140%] (was 200%) - Reduced buffer as movement is now subtler.
                   - left-[-20%] (was -50%) - Centered the 140% width.
                  */}
                    <img
                      className="embla-parallax-img absolute block top-0 left-[0%] w-[100%] h-full object-cover max-w-none transition-opacity duration-300 group-hover:opacity-90"
                      src={item.src}
                      alt={item.title}
                    />

                    {/* Gradient Fade Overlay at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                    {/* Overlay Text */}
                    <div className="absolute bottom-10 left-6 right-6 pointer-events-none text-white">
                      <h3 className="font-bold text-2xl drop-shadow-md mb-1">
                        {item.title}
                      </h3>
                      <p className=" text-[12px] sm:text-sm text-gray-200 drop-shadow-sm opacity-90">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <a
                    href={item.link}
                    target="_blank" // Opens in new tab
                    rel="noopener noreferrer" // Security best practice for target="_blank"
                    className="block overflow-hidden h-full w-full relative rounded-xl cursor-pointer group"
                  >
                    {/* Updated Image Styles for Smoother Parallax:
                   - w-[140%] (was 200%) - Reduced buffer as movement is now subtler.
                   - left-[-20%] (was -50%) - Centered the 140% width.
                  */}
                    <img
                      className="embla-parallax-img absolute block top-0 left-[0%] w-[100%] h-full object-cover max-w-none transition-opacity duration-300 group-hover:opacity-90"
                      src={item.src}
                      alt={item.title}
                    />

                    {/* Gradient Fade Overlay at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                    {/* Overlay Text */}
                    <div className="absolute bottom-10 left-6 right-6 pointer-events-none text-white">
                      <h3 className="font-bold text-2xl drop-shadow-md mb-1">
                        {item.title}
                      </h3>
                      <p className=" text-[12px] sm:text-sm text-gray-200 drop-shadow-sm opacity-90">
                        {item.description}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-secondary-background rounded-xl p-6 w-[90%] max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-3">
              🎉 Wish Poon a Happy Birthday!
            </h2>
            <div>ข้อความ</div>
            <textarea
              className="w-full border rounded-lg p-2 mb-4 placeholder:text-gray-500/50"
              placeholder="มีความสุขมาก ๆๆๆๆๆๆ"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div>จาก (ไม่จำเป็นต้องเขียน)</div>
            <textarea
              className="w-full border rounded-lg p-2 mb-4 placeholder:text-gray-500/50"
              rows={1}
              placeholder="บุคคลหวังดี"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
            />

            <div className="flex justify-end gap-2 ">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-pointer"
              >
                ไม่ส่งละ😢
              </button>

              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-chart-2 text-white rounded-lg cursor-pointer"
              >
                ส่ง 🎊
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dots Navigation - Positioned absolute at the bottom */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center space-x-3 pointer-events-none">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => onDotButtonClick(index)}
            className={`
              w-3 h-3 rounded-full transition-all duration-300 pointer-events-auto
              ${
                index === selectedIndex
                  ? "bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  : "bg-white/40 hover:bg-white/70 backdrop-blur-sm"
              }
            `}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default EmblaCarousel;
