// Replace this placeholder with an officially licensed MRTA logo asset before production use.
// The graphic here is an original wordmark, not the MRTA/BEM logo.
export function MrtBrandLogo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2" aria-label="MRT QuickPass">
      <div
        style={{ width: size, height: size }}
        className="grid place-items-center rounded-xl bg-primary text-primary-foreground font-black tracking-tight shadow-sm"
      >
        <span style={{ fontSize: size * 0.4 }}>MRT</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          MRT
        </span>
        <span className="text-base font-bold text-foreground">QuickPass</span>
      </div>
    </div>
  );
}
