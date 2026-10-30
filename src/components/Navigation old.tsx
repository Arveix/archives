import { NavLink } from "react-router"
import { useState } from "react";

import downArrow from "@/assets/down_arrow.svg";
import closeIcon from "@/assets/close_icon.svg";

export default function NavBar() {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { title: "Home", link: "/" },
        { title: "Blogs", link: "/blogs" },
        { title: "Projects", link: "/projects" }
    ]

    return (
        <>
            <nav className="md:hidden flex items-start justify-center">
                <ul
                    className={`w-fit rounded-lg
                        ${isOpen ? "bg-darker" : ""}`}
                >
                    {navItems.map(item => {
                        return (
                            <li key={item.title.split(" ").join("-")}>
                                <NavLink
                                    to={item.link}
                                    className={({ isActive }) =>
                                        `${isActive ? "block border border-maroon text-maroon" : isOpen ? "block" : "hidden"} 
                                        px-3 py-3 grid grid-cols-4 justify text-center rounded-lg
                                    `}
                                    onClick={() => setIsOpen(!isOpen)}
                                >
                                    <span
                                        className={`${isOpen ? "col-span-4" : "col-span-3"}`}
                                    >
                                        {item.title}
                                    </span>
                                    <img
                                        src={downArrow}
                                        alt="Open navigation menu"
                                        className={`${isOpen ? "hidden" : "block"}`}
                                    />

                                </NavLink>

                            </li>
                        )
                    })}
                </ul>
                <img
                    src={closeIcon}
                    alt="close navigation menu"
                    className={isOpen ? "block" : "hidden"}
                    onClick={() => setIsOpen(false)}
                />
            </nav>

            <nav className="hidden md:block">
                <ul className="flex justify-between py-3">
                    {navItems.map(item => {
                        return (
                            <li key={item.title.split(" ").join("-")}>
                                <NavLink
                                    to={item.link}
                                    className={({ isActive }) =>
                                        `block px-3 py-3 justify text-center rounded-lg hover:bg-light/5
                                        ${isActive ? "border border-maroon text-maroon" : ""}
                                    `}
                                    onClick={() => setIsOpen(!isOpen)}
                                >
                                    {item.title}
                                </NavLink>

                            </li>
                        )
                    })}
                </ul>
            </nav>
        </>
    )
}