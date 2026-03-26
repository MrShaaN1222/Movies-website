"use client";

import Link from "next/link";
import { useState } from "react";

export default function NavMenu({ navItems, dropdownMenus, yearOptions }) {
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <div className="flex flex-wrap gap-2 text-sm" onMouseLeave={() => setActiveMenu(null)}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 transition hover:border-brandAccent hover:text-white"
        >
          {item.label}
        </Link>
      ))}

      {dropdownMenus.map((menu) => {
        const menuKey = `menu-${menu.label}`;
        const isOpen = activeMenu === menuKey;
        return (
          <div key={menu.label} className="relative pb-1" onMouseEnter={() => setActiveMenu(menuKey)}>
            <button
              type="button"
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 transition hover:border-brandAccent hover:text-white"
            >
              {menu.label} <span className="text-xs">▼</span>
            </button>
            {isOpen ? (
              <div className="absolute left-0 top-full z-30 w-72 pt-1">
                <div className="overflow-hidden rounded-md border border-slate-800 bg-black/95 shadow-lg">
                  {menu.items.map((item) => (
                    <Link
                      key={`${menu.label}-${item}`}
                      href={`/search?q=${encodeURIComponent(item)}`}
                      className="block border-b border-slate-800 px-4 py-2.5 text-sm text-white last:border-b-0 hover:bg-slate-900"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="relative pb-1" onMouseEnter={() => setActiveMenu("by-year")}>
        <button
          type="button"
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 transition hover:border-brandAccent hover:text-white"
        >
          By Year <span className="text-xs">▼</span>
        </button>
        {activeMenu === "by-year" ? (
          <div className="absolute left-0 top-full z-30 w-40 pt-1">
            <div className="overflow-hidden rounded-md border border-slate-800 bg-black/95 shadow-lg">
              {yearOptions.map((year) => (
                <Link
                  key={`year-${year}`}
                  href={`/search?q=${year}`}
                  className="block border-b border-slate-800 px-4 py-2.5 text-sm text-white last:border-b-0 hover:bg-slate-900"
                >
                  {year}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
