import Image from "next/image";

type EditorialImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
};

export function EditorialImage({
  src,
  alt,
  width,
  height,
  sizes = "100vw",
  className = "",
}: EditorialImageProps) {
  return (
    <Image
      unoptimized
      alt={alt}
      className={`h-auto w-full object-cover ${className}`}
      height={height}
      loading="lazy"
      sizes={sizes}
      src={src}
      width={width}
    />
  );
}
