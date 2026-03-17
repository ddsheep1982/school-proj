"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "仪表盘", icon: "📊" },
  { href: "/students", label: "学生管理", icon: "👥" },
  { href: "/classes", label: "班级管理", icon: "🏫" },
  { href: "/teachers", label: "招生老师", icon: "👨‍🏫" },
  { href: "/agents", label: "招生代理", icon: "🤝" },
  { href: "/attendance", label: "考勤管理", icon: "📋" },
  { href: "/finance", label: "财务", icon: "💰" },
];

const adminItems = [{ href: "/admin/users", label: "用户管理", icon: "⚙️" }];

export default function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">学校管理系统</h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive(item.href)
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {role === "ADMIN" && (
          <div className="pt-3 mt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400 uppercase px-3 mb-1">管理员</p>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
