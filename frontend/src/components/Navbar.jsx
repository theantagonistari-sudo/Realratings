import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, login, logout } = useAuth();

  const linkCls = ({ isActive }) =>
    `overline hover:text-ink transition-colors ${isActive ? "text-ink" : "text-graphite"}`;

  return (
    <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-rule" data-testid="site-navbar">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2" data-testid="nav-brand">
          <span className="font-serif text-3xl tracking-tighter text-ink leading-none">Real Ratings</span>
          <span className="hidden sm:inline overline text-moss">Editorial</span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <NavLink to="/" end className={linkCls} data-testid="nav-home">Home</NavLink>
          <NavLink to="/properties" className={linkCls} data-testid="nav-properties">Properties</NavLink>
          <NavLink to="/submit" className={linkCls} data-testid="nav-submit">Submit</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkCls} data-testid="nav-admin">Admin</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-rule" data-testid="user-avatar" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone2 flex items-center justify-center">
                  <User size={14} />
                </div>
              )}
              <span className="hidden sm:block text-sm text-graphite" data-testid="user-name">{user.name?.split(" ")[0]}</span>
              <button
                onClick={logout}
                className="overline text-graphite hover:text-ink transition-colors flex items-center gap-1"
                data-testid="btn-logout"
              >
                <LogOut size={12} /> Logout
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="bg-ink text-paper hover:bg-moss transition-colors duration-300 rounded-sm px-5 py-2.5 font-sans uppercase tracking-widest text-xs flex items-center gap-2"
              data-testid="btn-login"
            >
              <LogIn size={14} /> Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
