import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/sales/new", label: "Nova Venda", icon: "➕" },
  { to: "/certificates", label: "Certificados", icon: "🔐" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const breadcrumb = () => {
    switch (location.pathname) {
      case "/":
        return "Dashboard";
      case "/sales/new":
        return "Nova Venda";
      case "/certificates":
        return "Certificados";
      default:
        return "NFS-e Emissor";
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-dark-surface border-r border-dark-border flex flex-col fixed h-full">
        <div className="p-6 border-b border-dark-border">
          <h1 className="text-lg font-bold font-mono text-accent-green">
            NFS-e Emissor
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">v1.0.0</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-dark-bg"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-dark-border">
          <div className="text-sm text-slate-400 truncate mb-2">{user?.email}</div>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-60">
        <header className="h-14 border-b border-dark-border flex items-center px-6 bg-dark-surface/50 backdrop-blur sticky top-0 z-10">
          <span className="text-sm text-slate-400 font-mono">{breadcrumb()}</span>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
