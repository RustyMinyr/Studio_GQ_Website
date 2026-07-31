import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-[#a7a7a3]/45 bg-[#f7f7f5]">
      <ol className="site-container flex flex-wrap items-center gap-x-3 gap-y-2 py-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#565656]">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-3">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link className="transition-colors hover:text-[#050505]" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-[#050505]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
