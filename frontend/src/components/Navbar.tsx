import { NavLink } from "react-router-dom";

function Navbar() {
    const linkClasses =
        "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    const activeClasses = "bg-blue-600 text-white";
    const inactiveClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

    return (
        <nav className="bg-gray-800">
            <div className="container mx-auto flex items-center justify-between p-4">
                <h1 className="text-xl font-bold text-white">Dealflow</h1>
                <div className="flex space-x-4">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`
                        }
                    >
                        Startups
                    </NavLink>
                    <NavLink
                        to="/investors"
                        className={({ isActive }) =>
                            `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`
                        }
                    >
                        Investors
                    </NavLink>
                    <NavLink
                        to="/ai-query"
                        className={({ isActive }) =>
                            `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`
                        }
                    >
                        AI Query
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
