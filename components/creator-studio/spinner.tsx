export function Spinner({ label }: { label: string }) {
  return <span role="status" className="inline-flex items-center gap-3"><span aria-hidden="true" className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" /><span>{label}</span></span>;
}
