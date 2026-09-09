"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { HeroSlide } from "@/data/config/hero-slides"

/*
  The ONLY client piece of the hero. Renders the stacked, crossfading background
  images and restrained slide controls. The hero content (H1, copy, CTAs) stays
  server-rendered in HomeHero.

  - Images are decorative: alt="" + aria-hidden; no aria-live on change.
  - Only the first image is prioritized (LCP); the rest load normally.
  - Reduced motion: initializes with autoplay OFF and only starts after
    confirming motion is allowed — no hydration mismatch, no pre-detection
    autoplay. Reduced motion shows slide 1 with no rotation.
  - Auto-advance pauses when the tab is hidden or the hero leaves the viewport.
  - Calm editorial crossfade (~700ms); no horizontal movement, no zoom.
*/
const INTERVAL_MS = 6000
const CROSSFADE_MS = 700

export function HeroBackgroundRotator({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [motionOK, setMotionOK] = useState(false)
  const inViewRef = useRef(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect reduced motion after mount (SSR + first render show slide 1, static).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setMotionOK(!mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = useCallback(() => {
    clearTimer()
    if (!motionOK || slides.length <= 1) return
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible" && inViewRef.current) {
        setIndex((i) => (i + 1) % slides.length)
      }
    }, INTERVAL_MS)
  }, [motionOK, slides.length])

  useEffect(() => {
    startTimer()
    return clearTimer
  }, [startTimer])

  // Resync the timer when the tab becomes visible again.
  useEffect(() => {
    const onVisibility = () => startTimer()
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [startTimer])

  // Pause when the hero has substantially left the viewport.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const select = (i: number) => {
    setIndex(i)
    startTimer() // manual selection resets the auto-advance timer
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-mineral">
      {slides.map((slide, i) => (
        <Image
          key={slide.id}
          src={slide.src}
          alt=""
          aria-hidden="true"
          fill
          priority={i === 0}
          sizes="100vw"
          style={{
            objectPosition: slide.focalPosition,
            transitionDuration: `${CROSSFADE_MS}ms`,
          }}
          className={cn(
            "object-cover transition-opacity ease-[var(--ease-standard)]",
            i === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}

      {slides.length > 1 ? (
        <div
          role="group"
          aria-label="Choose background image"
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => select(i)}
              aria-label={`Show background image ${i + 1} of ${slides.length}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-1 rounded-pill outline-none transition-all duration-300 focus-visible:ring-3 focus-visible:ring-ring/60",
                i === index
                  ? "w-8 bg-mineral-foreground"
                  : "w-4 bg-mineral-foreground/40 hover:bg-mineral-foreground/70"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
