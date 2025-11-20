"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { aizu } from "../../instrumentation-client";

export default function Navigation() {
  const pathname = usePathname();

  const handleNavigationClick = (destination: string) => {
    aizu.event("global_navigation_clicked", {
      destination,
      source: pathname,
      current_page: pathname,
    });
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/server-demo", label: "Server Demo" },
  ];

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            onClick={() => handleNavigationClick("home")}
            className="text-xl font-bold text-black dark:text-white"
          >
            Aizu Analytics
          </Link>

          <div className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavigationClick(item.href)}
                className={`font-medium transition-colors ${
                  pathname === item.href
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
