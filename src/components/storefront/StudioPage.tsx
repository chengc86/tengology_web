interface StudioPageProps {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
}

export function StudioPage({ eyebrow, title, children }: StudioPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:py-24">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h1 className="font-heading text-5xl leading-[0.95] lg:text-6xl">{title}</h1>
      <div className="mt-10 space-y-5 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
