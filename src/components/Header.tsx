import { NavLink } from "react-router"
import { useState } from "react";

import { Menu } from "lucide-react";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { title: "Home", link: "/" },
        { title: "Blogs", link: "/blogs" },
        { title: "Projects", link: "/projects" }
    ]

    return (
        <header className="bg-darker mb-10 sticky top-0">
            <nav className="mx-auto flex max-w-5xl items-center
                  justify-between px-5 py-4 md:px-8">

                <NavLink to="/" className="text-3xl font-semibold font-heading">
                    <span className="text-maroon">A</span>rveix
                </NavLink>

                {/* Mobile menu button */}
                <button
                    className="p-2 md:hidden"
                    aria-label="Open navigation"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Menu />
                </button>

                {/* Desktop navigation */}
                <ul className="hidden items-center gap-2 md:flex">
                    {navItems.map(item => (
                        <li key={item.link}>
                            <NavLink
                                to={item.link}
                                className={({ isActive }) =>
                                    `block rounded-lg px-4 py-2 transition-colors
                                    ${isActive
                                        ? "bg-maroon text-light"
                                        : "text-light/70 hover:bg-light/5 hover:text-light"}`
                                }
                            >
                                {item.title}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Mobile dropdown */}
            {isOpen && (
                <ul className="space-y-1 border-t border-light/10 px-5 py-3 md:hidden">
                    {navItems.map((item) => (
                        <li key={item.link}>
                            <NavLink
                                to={item.link}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `block rounded-lg px-4 py-3
                                    ${isActive
                                        ? "bg-maroon text-light"
                                        : "text-light/70 hover:bg-light/5"}`
                                }
                            >
                                {item.title}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            )}
        </header>
    )
}