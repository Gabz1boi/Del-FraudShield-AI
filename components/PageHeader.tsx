export function PageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-100/55">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-white md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
        {description}
      </p>
    </section>
  );
}
