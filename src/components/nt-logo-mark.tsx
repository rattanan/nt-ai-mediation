import Image from "next/image";

export function NtLogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ${className}`}>
      <Image src="/images/nt-logo.png" alt="NT" width={48} height={48} className="h-full w-full object-contain" />
    </span>
  );
}
