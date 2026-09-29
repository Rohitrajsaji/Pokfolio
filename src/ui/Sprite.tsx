import Image from "next/image";
import type { CSSProperties, ReactEventHandler } from "react";

interface SpriteProps {
  src: string;
  alt: string;
  /** Intrinsic size in CSS pixels; scale up with className (e.g. h-40 w-40). */
  size: number;
  className?: string;
  style?: CSSProperties;
  preload?: boolean;
  onLoad?: ReactEventHandler<HTMLImageElement>;
}

/**
 * Pixel-art sprite. Never optimised, so animated GIFs keep animating, and
 * scaled with nearest-neighbour so pixels stay sharp.
 */
export function Sprite({ src, alt, size, className, style, preload, onLoad }: SpriteProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      preload={preload}
      onLoad={onLoad}
      style={style}
      className={className ? `pixelated ${className}` : "pixelated"}
    />
  );
}
