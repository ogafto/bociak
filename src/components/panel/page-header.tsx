import { Enter, Words } from "@/components/landing/motion";

// Nagłówek strony panelu: etykieta, tytuł wjeżdżający słowo po słowie, opis i akcje.
export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker && (
          <Enter y={8}>
            <div className="kicker mb-4">{kicker}</div>
          </Enter>
        )}
        <h1 className="text-[2.2rem] font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-[2.9rem]">
          <Words onLoad text={title} delay={0.05} />
        </h1>
        {description && (
          <Enter delay={0.2} y={8}>
            <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-[#a0a0a8]">{description}</p>
          </Enter>
        )}
      </div>
      {actions && (
        <Enter delay={0.25} y={8} className="flex flex-wrap gap-2">
          {actions}
        </Enter>
      )}
    </div>
  );
}
