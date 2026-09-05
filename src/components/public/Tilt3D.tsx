"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  /** Max pointer tilt angle in degrees (desktop hover). Default 10. */
  maxTilt?: number;
  /** Scroll parallax intensity in px. Default 40. */
  parallax?: number;
  /** Max scroll-linked 3D rotation in degrees (visible without a mouse). Default 14. */
  scrollRotate?: number;
  /** Enable pointer-driven 3D tilt (desktop only). Default true. */
  pointer?: boolean;
}

/**
 * Ultra-lightweight 3D depth effect — ZERO dependencies (~1KB).
 *
 * Three layered effects, all driven by a single requestAnimationFrame loop:
 *
 * 1. **Scroll rotation (always on):** as the element travels through the
 *    viewport it tilts in 3D — leaning back at the bottom, level in the
 *    middle, leaning forward at the top. Clearly visible, no mouse needed.
 * 2. **Scroll parallax:** the element translates at a different rate to the
 *    page, creating depth separation between sibling layers.
 * 3. **Pointer tilt (desktop only):** subtle rotateX/rotateY that follows the
 *    cursor, like a floating product card.
 *
 * Fully respects `prefers-reduced-motion` (disables all motion).
 */
export function Tilt3D({
  children,
  className = "",
  maxTilt = 10,
  parallax = 40,
  scrollRotate = 14,
  pointer = true,
}: Tilt3DProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const usePointer = pointer && finePointer && !reduceMotion;

    let raf = 0;
    // scroll state
    let progress = 0; // -1 (top) .. 1 (bottom) of viewport travel
    let currentProgress = 0;
    let targetY = 0;
    let currentY = 0;
    // pointer state
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let hasPointer = false;

    const updateScrollState = () => {
      const rect = outer.getBoundingClientRect();
      const vh = window.innerHeight;
      const viewportCenter = vh / 2;
      const elementCenter = rect.top + rect.height / 2;
      // progress = how far the element has travelled through the viewport
      progress = Math.max(-1, Math.min(1, (viewportCenter - elementCenter) / (vh / 2)));
      targetY = (elementCenter - viewportCenter) * -0.06 * (parallax / 40);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = outer.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      tx = (px - 0.5) * 2;
      ty = (py - 0.5) * 2;
      hasPointer = true;
    };

    const onPointerLeave = () => {
      tx = 0;
      ty = 0;
      hasPointer = false;
    };

    const loop = () => {
      currentProgress += (progress - currentProgress) * 0.09;
      currentY += (targetY - currentY) * 0.08;
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;

      if (reduceMotion) {
        inner.style.transform = "";
      } else {
        // scroll-linked 3D rotation (leaning back -> level -> leaning forward)
        const scrollRx = -currentProgress * scrollRotate;
        // pointer tilt on top of scroll rotation
        const tiltX = hasPointer ? cy * maxTilt : 0;
        const tiltY = hasPointer ? -cx * maxTilt : 0;
        inner.style.transform =
          `perspective(900px) translateY(${currentY.toFixed(1)}px) ` +
          `rotateX(${(scrollRx + tiltX).toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };

    updateScrollState();
    raf = requestAnimationFrame(loop);

    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    if (usePointer) {
      outer.addEventListener("pointermove", onPointerMove, { passive: true });
      outer.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      if (usePointer) {
        outer.removeEventListener("pointermove", onPointerMove);
        outer.removeEventListener("pointerleave", onPointerLeave);
      }
    };
  }, [maxTilt, parallax, scrollRotate, pointer]);

  return (
    <div ref={outerRef} className={`[perspective:900px] ${className}`}>
      <div ref={innerRef} className="will-change-transform" style={{ transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </div>
  );
}
