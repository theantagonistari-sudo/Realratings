import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, LogOut, User, Brain, Lock } from "lucide-react";
import IQTest from "./IQTest";

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [iqOpen, setIqOpen] = useState(false);
  const navigate = useNavigate();

  const linkCls = ({ isActive }) =>
    `overline hover:text-ink transition-colors ${isActive ? "text-ink" : "text-graphite"}`;

  return (
    <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-rule" data-testid="site-navbar">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2" data-testid="nav-brand">
          <span className="font-serif text-3xl tracking-tighter text-ink leading-none">Real Ratings</span>
          <span className="hidden sm:inline overline text-moss">Editorial</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" end className={linkCls} data-testid="nav-home">Home</NavLink>
          <NavLink to="/properties?rental_type=rent" className={linkCls} data-testid="nav-rent">For Rent</NavLink>
          <NavLink to="/properties?rental_type=short_stay" className={linkCls} data-testid="nav-shortstay">Short Stay</NavLink>
          <NavLink to="/submit" className={linkCls} data-testid="nav-submit">Submit</NavLink>
          <NavLink to="/tests" className={linkCls} data-testid="nav-tests">Tests</NavLink>
          <button onClick={() => setIqOpen(true)} className="overline text-graphite hover:text-ink transition-colors flex items-center gap-1.5" data-testid="nav-iq">
            <Brain size={12} /> Test IQ
          </button>
          {user && <NavLink to="/profile" className={linkCls} data-testid="nav-profile">Profile</NavLink>}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkCls} data-testid="nav-admin">Admin</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/profile")} className="flex items-center gap-2 hover:opacity-80" data-testid="user-menu">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-rule" data-testid="user-avatar" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone2 flex items-center justify-center">
                    <User size={14} />
                  </div>
                )}
                <span className="hidden sm:block text-sm text-graphite" data-testid="user-name">{user.name?.split(" ")[0]}</span>
              </button>
              <button
                onClick={logout}
                className="overline text-graphite hover:text-ink transition-colors flex items-center gap-1"
                data-testid="btn-logout"
              >
                <LogOut size={12} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/admin/login" title="Editor sign-in" className="text-graphite hover:text-ink transition-colors" data-testid="nav-admin-login">
                <Lock size={16} />
              </Link>
              <button
                onClick={login}
                className="bg-ink text-paper hover:bg-moss transition-colors duration-300 rounded-sm px-5 py-2.5 font-sans uppercase tracking-widest text-xs flex items-center gap-2"
                data-testid="btn-login"
              >
                <LogIn size={14} /> Sign in
              </button>
            </div>
          )}
        </div>
      </div>
      <IQTest open={iqOpen} onOpenChange={setIqOpen} />
    </header>
  );
}
