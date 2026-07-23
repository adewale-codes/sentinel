"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/overview", label: "Overview" },
  { href: "/predictions", label: "Predictions" },
  { href: "/drift", label: "Drift Monitor" },
  { href: "/models", label: "Model Versions" },
  { href: "/predict", label: "New Prediction" },
];

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5l-8-3z"
        fill="#f85149"
      />
      <path
        d="M12 6.5l1.4 2.85 3.15.46-2.28 2.22.54 3.14L12 13.6l-2.81 1.57.54-3.14-2.28-2.22 3.15-.46L12 6.5z"
        fill="#080b0f"
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <ShieldIcon />
          <span className="text-lg font-semibold tracking-tight text-text-primary">Sentinel</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 pb-1 text-sm font-medium no-underline transition-colors ${
                  active
                    ? "border-accent text-text-primary"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-col gap-1.5 md:hidden"
        >
          <span className="h-0.5 w-6 bg-text-primary" />
          <span className="h-0.5 w-6 bg-text-primary" />
          <span className="h-0.5 w-6 bg-text-primary" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-border px-6 py-3 md:hidden">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium no-underline ${
                  active ? "bg-bg-elevated text-text-primary" : "text-text-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
