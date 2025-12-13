import { useCallback, useEffect, useRef } from 'react'
import { EmblaCarouselType, EmblaEventType } from 'embla-carousel'

// Reduced from 1.2 to 0.2 to prevent whitespace and aggressive movement
const PARALLAX_FACTOR = 0.2 

export const useParallax = (emblaApi: EmblaCarouselType | undefined) => {
  const tweenFactor = useRef(0)

  const setTweenFactor = useCallback((emblaApi: EmblaCarouselType) => {
    tweenFactor.current = PARALLAX_FACTOR * emblaApi.scrollSnapList().length
  }, [])

  const tweenParallax = useCallback(
    (emblaApi: EmblaCarouselType, eventName?: EmblaEventType) => {
      const engine = emblaApi.internalEngine()
      const scrollProgress = emblaApi.scrollProgress()
      const slidesInView = emblaApi.slidesInView()
      const isScrollEvent = eventName === 'scroll'

      emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
        let diffToTarget = scrollSnap - scrollProgress
        const slidesInSnap = engine.slideRegistry[snapIndex]

        slidesInSnap.forEach((slideIndex) => {
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return

          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem) => {
              const target = loopItem.target()

              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target)

                if (sign === -1) {
                  diffToTarget = scrollSnap - (1 + scrollProgress)
                }
                if (sign === 1) {
                  diffToTarget = scrollSnap + (1 - scrollProgress)
                }
              }
            })
          }

          // Calculate the translation percentage
          const translate = diffToTarget * (-1 * tweenFactor.current) * 100
          
          const tweenNode = emblaApi.slideNodes()[slideIndex].querySelector(
            '.embla-parallax-img'
          ) as HTMLElement

          if (tweenNode) {
            tweenNode.style.transform = `translateX(${translate}%)`
          }
        })
      })
    },
    []
  )

  useEffect(() => {
    if (!emblaApi) return

    setTweenFactor(emblaApi)
    tweenParallax(emblaApi)
    
    emblaApi
      .on('reInit', setTweenFactor)
      .on('reInit', tweenParallax)
      .on('scroll', tweenParallax)
      .on('slideFocus', tweenParallax)
  }, [emblaApi, tweenParallax, setTweenFactor])
}