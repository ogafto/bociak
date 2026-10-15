// Klasy przycisków – działają na <button>, <Link> i <a>.
const base =
  "btn-fx inline-flex items-center justify-center gap-2 font-medium transition-[background,border-color,color,box-shadow,transform] duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 cursor-pointer whitespace-nowrap";

// Te same przyciski co na stronie głównej: biały główny, ciemny z jasną krawędzią, blurple dla akcji „marki”.
const variants = {
  primary:
    "bg-[linear-gradient(180deg,#ffffff,#e9e9f0)] text-[#0d0d0f] shadow-[inset_0_-2px_0_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.5)] hover:shadow-[inset_0_-2px_0_rgb(0_0_0/0.12),0_10px_36px_-10px_rgb(138_147_255/0.9)]",
  white:
    "bg-[linear-gradient(180deg,#ffffff,#e9e9f0)] text-[#0d0d0f] shadow-[inset_0_-2px_0_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.5)] hover:shadow-[inset_0_-2px_0_rgb(0_0_0/0.12),0_10px_36px_-10px_rgb(138_147_255/0.9)]",
  brand: "bg-brand-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.4)] hover:bg-[#6b76f5] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_10px_36px_-10px_rgb(88_101_242/0.9)]",
  secondary:
    "border border-transparent text-white [background:linear-gradient(#17171a,#17171a)_padding-box,linear-gradient(180deg,rgb(255_255_255/0.18),rgb(255_255_255/0.05))_border-box] hover:[background:linear-gradient(#1c1c20,#1c1c20)_padding-box,linear-gradient(180deg,rgb(181_187_255/0.55),rgb(255_255_255/0.08))_border-box]",
  ghost: "text-white/65 hover:text-white hover:bg-white/[0.06]",
  danger: "bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20",
};

const sizes = {
  sm: "h-9 rounded-[10px] px-3.5 text-[13.5px]",
  md: "h-11 rounded-[12px] px-5 text-[14.5px]",
  lg: "h-12 rounded-[12px] px-6 text-[15px]",
};

export function btn(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}
