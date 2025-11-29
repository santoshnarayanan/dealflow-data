// frontend/src/components/Navbar.tsx

import { NavLink } from "react-router-dom";

function Navbar() {
  const linkClasses =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeClasses = "bg-blue-600 text-white";
  const inactiveClasses =
    "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <nav className="bg-gray-800">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Brand */}
        <h1 className="text-xl font-bold text-white">Dealflow</h1>

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          <NavLink
            to="/"
            className={({ isActive }: { isActive: boolean }) =>
              `${linkClasses} ${isActive ? activeClasses : inactiveClasses
              }`
            }
          >
            Startups
          </NavLink>

          <NavLink
            to="/investors"
            className={({ isActive }: { isActive: boolean }) =>
              `${linkClasses} ${isActive ? activeClasses : inactiveClasses
              }`
            }
          >
            Investors
          </NavLink>

          <NavLink
            to="/ai-query"
            className={({ isActive }: { isActive: boolean }) =>
              `${linkClasses} ${isActive ? activeClasses : inactiveClasses
              }`
            }
          >
            AI Query
          </NavLink>

          <NavLink
            to="/semantic-search"
            className={({ isActive }: { isActive: boolean }) =>
              `${linkClasses} ${isActive ? activeClasses : inactiveClasses
              }`
            }
          >
            Semantic Search
          </NavLink>

          <NavLink
            to="/hybrid-ai"
            className={({ isActive }: { isActive: boolean }) =>
              `${linkClasses} ${isActive ? activeClasses : inactiveClasses
              }`
            }
          >
            Hybrid AI
          </NavLink>
          <NavLink
            to="/ai-multi-agent"
            className={({ isActive }: { isActive: boolean }) =>
              `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            AI Multi-Agent
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
