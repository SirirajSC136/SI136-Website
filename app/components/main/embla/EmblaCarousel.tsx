"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { EmblaOptionsType } from "embla-carousel";
import { useParallax } from "./useParallax"; // Assumes you kept the hook from the previous step
import { useDotButton } from "./EmblaCarouselDotButton";
import Autoplay from "embla-carousel-autoplay";

type PropType = {
  slides: number[];
  options?: EmblaOptionsType;
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options } = props;

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
    ]
  );

  // 2. Attach Custom Hooks
  useParallax(emblaApi);
  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);

  // Data: Images with specific links and text
  const slideItems = [
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

  return (
    <div className="relative max-w-5xl px-8 mx-auto rounded-lg shadow-xl bg-secondary-background">
      {/* Viewport */}
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex touch-pan-y -ml-4">
          {slides.map((index) => {
            const item = slideItems[index % slideItems.length];
            return (
              <div
                className="flex-shrink-0 flex-grow-0 min-w-0 pl-4 w-full relative h-56 sm:h-92 md:h-112 lg:h-124"
                key={index}
              >
                {/* Parallax Container -> Converted to Link (<a>) */}
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
                    <h3 className="font-bold text-2xl drop-shadow-md mb-1">{item.title}</h3>
                    <p className=" text-[12px] sm:text-sm text-gray-200 drop-shadow-sm opacity-90">
                      {item.description}
                    </p>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      </div>

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
