import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Nav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const lastFocusedElementRef = useRef<HTMLElement | null>(null);

    // Add shadow/blur effect on scroll
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const openMenu = () => {
        lastFocusedElementRef.current = document.activeElement as HTMLElement;
        setIsMenuOpen(true);
        setTimeout(() => menuRef.current?.focus(), 0);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        setTimeout(() => lastFocusedElementRef.current?.focus(), 0);
    };

    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMenuOpen) closeMenu();
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isMenuOpen]);

    return (
        /* Outer wrapper — fixed to top, full width, centers the floating bar */
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
            <nav
                aria-label="Main navigation"
                className={`
          w-full max-w-3xl
          flex items-center justify-between
          bg-[#111118] border border-white/10
          rounded-2xl px-4 py-2.5
          transition-all duration-300
          ${scrolled ? 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'shadow-[0_2px_12px_rgba(0,0,0,0.2)]'}
        `}
            >
                {/* ── Logo ── */}
                <Link
                    to="/"
                    className="flex items-center gap-2 text-white font-semibold text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg px-1"
                >
                    {/* Replace the SVG below with your own logo or <img src={logo} /> */}
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
                    </svg>
                    <span>RESPONDE</span>
                </Link>

                {/* ── Desktop links ── */}
                <ul className="hidden md:flex items-center gap-1 text-sm font-medium text-white/70">
                    {[
                        { label: 'Home', href: '/' },
                        { label: 'About', href: '/about' },
                        { label: 'Features', href: '/features' },
                    ].map(({ label, href }) => (
                        <li key={href}>
                            <Link
                                to={href}
                                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 inline-block"
                            >
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* ── Sign in button + hamburger ── */}
                <div className="flex items-center gap-2">
                    <Link
                        to="/login"
                        className="py-2 px-4 text-sm rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    >
                        Sign in
                    </Link>

                    {/* Hamburger — mobile only */}
                    <button
                        type="button"
                        aria-controls="mobileMenu"
                        aria-expanded={isMenuOpen}
                        aria-haspopup="true"
                        onClick={isMenuOpen ? closeMenu : openMenu}
                        className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                        <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
                        {isMenuOpen ? (
                            /* X icon */
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            /* Hamburger icon */
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* ── Mobile dropdown menu ── */}
            {isMenuOpen && (
                <div
                    id="mobileMenu"
                    ref={menuRef}
                    tabIndex={-1}
                    className="absolute top-[4.5rem] left-4 right-4 bg-[#111118] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] outline-none md:hidden"
                >
                    <ul className="flex flex-col p-2 gap-1 text-sm font-medium text-white/70">
                        {[
                            { label: 'Home', href: '/' },
                            { label: 'About', href: '/about' },
                            { label: 'Features', href: '/features' },
                        ].map(({ label, href }) => (
                            <li key={href}>
                                <Link
                                    to={href}
                                    onClick={closeMenu}
                                    className="block px-4 py-2.5 rounded-xl hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                        <li className="pt-1 border-t border-white/10 mt-1">
                            <Link
                                to="/login"
                                onClick={closeMenu}
                                className="block px-4 py-2.5 rounded-xl text-white bg-violet-600 hover:bg-violet-700 text-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                            >
                                Sign in
                            </Link>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
