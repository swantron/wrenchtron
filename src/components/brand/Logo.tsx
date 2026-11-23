export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/icons/icon.svg"
      alt=""
      width={512}
      height={512}
      className={className}
    />
  );
}
