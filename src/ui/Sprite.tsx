import Image from "next/image";

interface SpriteProps {
  src: string;
  alt: string;
  /** Intrinsic size in CSS pixels; scale up with className (e.g. h-40 w-40). */
  size: number;
  className?: string;
  preload?: boolean;
}

/**
 * Pixel-art sprite. Never optimised, so animated GIFs keep animating, and
 * scaled with nearest-neighbour so pixels stay sharp.
 */
export function Sprite({ src, alt, size, className, preload }: SpriteProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      preload={preload}
      className={className ? `pixelated ${className}` : "pixelated"}
    />
  );
}
