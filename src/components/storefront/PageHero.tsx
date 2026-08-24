import Image from "next/image";

interface PageHeroProps {
  image: string;
  alt: string;
  eyebrow?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Shared catalogue/story hero: photography first, type sitting on a warm
 * gradient so the image stays visible instead of washing out to beige.
 */
export function PageHero({
  image,
  alt,
  eyebrow,
  title,
  children,
}: PageHeroProps) {
  return (
    <div className="relative overflow-hidden bg-muted">
      <div className="relative min-h-48 lg:min-h-72">
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
        <div className="relative mx-auto flex min-h-48 max-w-7xl items-end px-4 pb-8 pt-16 sm:px-6 lg:min-h-72 lg:px-8 lg:pb-12">
          <div>
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            <h1 className="font-heading text-5xl leading-[0.95] lg:text-6xl">
              {title}
            </h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
