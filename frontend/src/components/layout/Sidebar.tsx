import { NavLink } from "react-router-dom";
import { useState } from "react";

const menuItems = [
  { label: "Dashboard", path: "/", icon: "📊" },
  { label: "Startups", path: "/startups", icon: "🚀" },
  { label: "Investors", path: "/investors", icon: "💼" },
  { label: "AI Query (Cypher)", path: "/ai-query", icon: "🧠" },
  { label: "Semantic Search", path: "/semantic-search", icon: "🔍" },
  { label: "Hybrid AI", path: "/hybrid-ai", icon: "⚡" },
  { label: "Multi-Agent System", path: "/ai-multi-agent", icon: "🤖" },
  { label: "Developer Tools", path: "/dev-tools", icon: "🛠️" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-full bg-gray-900 text-gray-200 transition-all duration-300 shadow-lg
        ${collapsed ? "w-16" : "w-56"}
      `}
    >
      {/* Brand */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h1 className="text-lg font-bold tracking-wide">Dealflow AI</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4 flex flex-col gap-1 px-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `
              flex items-center gap-3 px-3 py-2 rounded-md text-sm
              transition-colors cursor-pointer
              ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-700"}
            `
            }
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
