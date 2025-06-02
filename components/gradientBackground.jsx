"use client";
import { useEffect } from "react";
import { Gradient } from "../lib/gradient";

export function GradientBackground() {
  useEffect(() => {
    const gradient = new Gradient();
    gradient.initGradient("#gradient-canvas");
    return () => {
      if (gradient.disconnect) gradient.disconnect();
    };
  }, []);

  return (
    <canvas 
    id="gradient-canvas" 
    className="
    absolute top-0 left-0 
    w-screen h-1/2 z-[-1]
    pointer-events-none
    " 
    />
  );
}