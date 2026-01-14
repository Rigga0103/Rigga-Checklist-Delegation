"use client";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Database,
  ChevronDown,
  ChevronRight,
  Zap,
  FileText,
  X,
  Play,
  Pause,
  KeyRound,
  Video,
  Calendar,
  CalendarCheck,
  CirclePlus,
  BookmarkCheck,
  MoreHorizontalIcon,
  PersonStanding,
  FormInput,
  LayoutDashboard,
  Wrench,
  Settings,
  Clock,
  History,
} from "lucide-react";

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false);
  const [isRepairingOpen, setIsRepairingOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [headerAnimatedText, setHeaderAnimatedText] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);

  // Authentication check + user info + header animation
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const storedRole = sessionStorage.getItem("role");

    if (!storedUsername) {
      navigate("/login");
      return;
    }

    setUsername(storedUsername);
    setUserRole(storedRole || "user");

    // Auto-expand section based on current path
    if (location.pathname.includes("/repairing")) {
      setIsRepairingOpen(true);
    }
    if (
      location.pathname.includes("/mentenance") ||
      location.pathname.includes("/maintenance")
    ) {
      setIsMaintenanceOpen(true);
    }

    // Show welcome text animation once on mount
    const hasSeenAnimation = sessionStorage.getItem("hasSeenWelcomeAnimation");
    if (!hasSeenAnimation) {
      setShowAnimation(true);
      sessionStorage.setItem("hasSeenWelcomeAnimation", "true");

      let currentIndex = 0;
      const welcomeText = `Welcome, ${storedUsername}`;

      const typingInterval = setInterval(() => {
        if (currentIndex <= welcomeText.length) {
          setAnimatedText(welcomeText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setShowAnimation(false);
          startHeaderAnimation(storedUsername);
        }
      }, 80);

      return () => clearInterval(typingInterval);
    } else {
      setHeaderAnimatedText(`Welcome, ${storedUsername}`);
    }
  }, [navigate, location.pathname]);

  // Header typing animation function
  function startHeaderAnimation(name) {
    let currentIndex = 0;
    const headerText = `Welcome, ${name}`;
    const headerInterval = setInterval(() => {
      if (currentIndex <= headerText.length) {
        setHeaderAnimatedText(headerText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(headerInterval);
      }
    }, 80);
  }

  // Handle logout
  const handleLogout = () => {
    navigate("/login");
  };

  // Filter dataCategories based on user role
  const dataCategories = [
    { id: "sales", name: "Checklist", link: "/dashboard/data/sales" },
    {
      id: "approval",
      name: "Approval Pending",
      link: "/dashboard/data/approval",
    },
  ];

  const getAccessibleDepartments = () => {
    const userRole = sessionStorage.getItem("role") || "user";
    return dataCategories.filter(
      (cat) => !cat.showFor || cat.showFor.includes(userRole)
    );
  };

  const accessibleDepartments = getAccessibleDepartments();

  // Get current username for route filtering
  const getCurrentUsername = () => sessionStorage.getItem("username") || "";
  const getCurrentRole = () => sessionStorage.getItem("role") || "user";

  // Check if user can access a route
  const canAccessRoute = (route) => {
    const userRole = getCurrentRole();
    const username = getCurrentUsername();
    const usernameLower = username.toLowerCase();

    const roleMatch = route.showFor?.includes(userRole) || false;
    const userMatch = route.showForUsers
      ? route.showForUsers.some(
          (allowedUser) => allowedUser.toLowerCase() === usernameLower
        )
      : false;

    return roleMatch || userMatch;
  };

  // Main routes (non-grouped)
  const mainRoutes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin"],
    },
    {
      href: "/dashboard/quick-task",
      label: "Quick Task Checklist",
      icon: Zap,
      active: location.pathname === "/dashboard/quick-task",
      showFor: ["admin"],
    },
    {
      href: "/dashboard/assign-task",
      label: "Assign Task",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin"],
    },
    {
      href: "/dashboard/delegation",
      label: "Delegation",
      icon: ClipboardList,
      active: location.pathname === "/dashboard/delegation",
      showFor: ["admin", "user"],
    },
    ...accessibleDepartments.map((category) => ({
      href: category.link || `/dashboard/data/${category.id}`,
      label: category.name,
      icon: FileText,
      active:
        location.pathname ===
        (category.link || `/dashboard/data/${category.id}`),
      showFor: ["admin", "user"],
    })),
    {
      href: "/dashboard/calendar",
      label: "Calendar",
      icon: Calendar,
      active: location.pathname === "/dashboard/calendar",
      showFor: ["admin", "user"],
    },
  ];

  // Repairing system routes
  const repairingRoutes = [
    {
      href: "/repairing-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/repairing-dashboard",
      showFor: ["admin"],
    },
    {
      href: "/repairing-form",
      label: "Request Form",
      icon: FormInput,
      active: location.pathname === "/repairing-form",
      showFor: ["admin"],
      showForUsers: ["pratap kumar rout"],
    },
    {
      href: "/repairing-pending",
      label: "Pending",
      icon: Clock,
      active: location.pathname === "/repairing-pending",
      showFor: ["admin"],
      showForUsers: [
        "pratap kumar rout",
        "Rakesh Kumar Rout",
        "Kamal Sharma 65-18",
        "Santosh Das 52-18",
      ],
    },
    {
      href: "/repairing-history",
      label: "History",
      icon: History,
      active: location.pathname === "/repairing-history",
      showFor: ["admin"],
      showForUsers: ["pratap kumar rout"],
    },
  ];

  // Maintenance system routes
  const maintenanceRoutes = [
    {
      href: "/maintenance-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/maintenance-dashboard",
      showFor: ["admin"],
    },
    {
      href: "/mentenance-pending",
      label: "Pending",
      icon: Clock,
      active: location.pathname === "/mentenance-pending",
      showFor: ["admin", "user"],
    },
    {
      href: "/mentenance-history",
      label: "History",
      icon: History,
      active: location.pathname === "/mentenance-history",
      showFor: ["admin", "user"],
    },
    {
      href: "/mentenance-calendar",
      label: "Calendar",
      icon: Calendar,
      active: location.pathname === "/mentenance-calendar",
      showFor: ["admin", "user"],
    },
  ];

  // Other routes (License, Training Video)
  const otherRoutes = [
    {
      href: "/dashboard/license",
      label: "License",
      icon: KeyRound,
      active: location.pathname === "/dashboard/license",
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/traning-video",
      label: "Training Video",
      icon: Video,
      active: location.pathname === "/dashboard/traning-video",
      showFor: ["admin", "user"],
    },
  ];

  // Filter routes based on access
  const accessibleMainRoutes = mainRoutes.filter(canAccessRoute);
  const accessibleRepairingRoutes = repairingRoutes.filter(canAccessRoute);
  const accessibleMaintenanceRoutes = maintenanceRoutes.filter(canAccessRoute);
  const accessibleOtherRoutes = otherRoutes.filter(canAccessRoute);

  // Check if any repairing/maintenance routes are active
  const isRepairingActive = repairingRoutes.some((r) => r.active);
  const isMaintenanceActive = maintenanceRoutes.some((r) => r.active);

  // Collapsible Section Component
  const CollapsibleSection = ({
    title,
    icon: Icon,
    isOpen,
    setIsOpen,
    routes,
    accentColor,
    isActive,
  }) => {
    if (routes.length === 0) return null;

    return (
      <div className="mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-slate-800 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-md ${
                isActive ? "bg-white/20" : accentColor
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-white" : "text-white"}`}
              />
            </div>
            <span>{title}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-200 ${
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="py-1 pl-4 mt-1 space-y-0.5 border-l-2 border-slate-200 ml-5">
            {routes.map((route) => (
              <li key={route.href}>
                <Link
                  to={route.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                    route.active
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <route.icon
                    className={`h-4 w-4 ${
                      route.active ? "text-slate-700" : "text-slate-400"
                    }`}
                  />
                  <span>{route.label}</span>
                  {route.active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto"></div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Single Route Link Component
  const RouteLink = ({ route }) => (
    <Link
      to={route.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        route.active
          ? "bg-slate-800 text-white"
          : "text-slate-700 hover:bg-slate-100"
      }`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <div
        className={`p-1.5 rounded-md ${
          route.active ? "bg-white/20" : "bg-slate-200"
        }`}
      >
        <route.icon
          className={`h-4 w-4 ${
            route.active ? "text-white" : "text-slate-600"
          }`}
        />
      </div>
      <span>{route.label}</span>
      {route.active && (
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto"></div>
      )}
    </Link>
  );

  // Sidebar Content Component (shared between desktop and mobile)
  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-slate-800">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800">Checklist System</h1>
          <p className="text-xs text-slate-500">& Delegation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {/* Main Routes Section */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
            Main Menu
          </p>
          <ul className="space-y-1">
            {accessibleMainRoutes.map((route) => (
              <li key={route.href}>
                <RouteLink route={route} />
              </li>
            ))}
          </ul>
        </div>

        {/* Systems Section */}
        {(accessibleRepairingRoutes.length > 0 ||
          accessibleMaintenanceRoutes.length > 0) && (
          <div className="mb-6">
            <p className="px-3 mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
              Systems
            </p>

            {/* Repairing Section */}
            {accessibleRepairingRoutes.length > 0 && (
              <CollapsibleSection
                title="Repairing"
                icon={Wrench}
                isOpen={isRepairingOpen}
                setIsOpen={setIsRepairingOpen}
                routes={accessibleRepairingRoutes}
                accentColor="bg-orange-500"
                isActive={isRepairingActive}
              />
            )}

            {/* Maintenance Section */}
            {accessibleMaintenanceRoutes.length > 0 && (
              <CollapsibleSection
                title="Maintenance"
                icon={Settings}
                isOpen={isMaintenanceOpen}
                setIsOpen={setIsMaintenanceOpen}
                routes={accessibleMaintenanceRoutes}
                accentColor="bg-teal-500"
                isActive={isMaintenanceActive}
              />
            )}
          </div>
        )}

        {/* Other Routes Section */}
        {accessibleOtherRoutes.length > 0 && (
          <div className="mb-6">
            <p className="px-3 mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
              Resources
            </p>
            <ul className="space-y-1">
              {accessibleOtherRoutes.map((route) => (
                <li key={route.href}>
                  <RouteLink route={route} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700">
            <span className="text-sm font-bold text-white">
              {username ? username.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-slate-800">
              {username || "User"}
            </p>
            <p className="text-xs text-slate-500">
              {userRole === "admin" ? "Administrator" : "Team Member"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 transition-colors rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="flex-shrink-0 hidden w-64 bg-white border-r border-slate-200 md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="absolute z-50 p-2 transition-colors bg-white rounded-lg shadow-md text-slate-700 md:hidden left-4 top-3 hover:bg-slate-100"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Mobile Sidebar */}
          <div className="fixed inset-y-0 left-0 flex flex-col max-h-screen bg-white shadow-xl w-72 animate-slide-in">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 md:px-6">
          <div className="flex w-8 md:hidden"></div>
          <div className="flex flex-col gap-1">
            {headerAnimatedText && (
              <div className="relative">
                <p className="text-lg md:text-xl font-['Inter',_'Segoe_UI',_sans-serif] tracking-wide">
                  <span className="font-bold text-slate-800">
                    {headerAnimatedText}
                  </span>
                  <span className="inline-block ml-2 animate-bounce">👋</span>
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 pb-20 overflow-y-auto md:p-6 bg-slate-50">
          {children}
        </main>

        {/* Mobile Footer Tabs */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden">
          <nav className="flex justify-around py-2">
            <Link
              to="/dashboard/admin"
              className={`flex flex-col items-center text-sm p-2 transition-colors ${
                location.pathname === "/dashboard/admin"
                  ? "text-slate-800 font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              aria-label="Dashboard"
            >
              <Home
                className={`w-6 h-6 mb-1 ${
                  location.pathname === "/dashboard/admin"
                    ? "text-slate-800"
                    : ""
                }`}
              />
              <span className="text-xs">Home</span>
            </Link>

            <Link
              to="/dashboard/data/sales"
              className={`flex flex-col items-center text-sm p-2 transition-colors ${
                location.pathname === "/dashboard/data/sales"
                  ? "text-slate-800 font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              aria-label="Checklist"
            >
              <CalendarCheck
                className={`w-6 h-6 mb-1 ${
                  location.pathname === "/dashboard/data/sales"
                    ? "text-slate-800"
                    : ""
                }`}
              />
              <span className="text-xs">Checklist</span>
            </Link>

            {userRole === "admin" && (
              <Link
                to="/dashboard/assign-task"
                className={`flex flex-col items-center text-sm p-2 transition-colors ${
                  location.pathname === "/dashboard/assign-task"
                    ? "text-slate-800 font-semibold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                aria-label="Assign Task"
              >
                <CirclePlus
                  className={`w-6 h-6 mb-1 ${
                    location.pathname === "/dashboard/assign-task"
                      ? "text-slate-800"
                      : ""
                  }`}
                />
                <span className="text-xs">Assign</span>
              </Link>
            )}

            <Link
              to="/dashboard/delegation"
              className={`flex flex-col items-center text-sm p-2 transition-colors ${
                location.pathname === "/dashboard/delegation"
                  ? "text-slate-800 font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              aria-label="Delegation"
            >
              <BookmarkCheck
                className={`w-6 h-6 mb-1 ${
                  location.pathname === "/dashboard/delegation"
                    ? "text-slate-800"
                    : ""
                }`}
              />
              <span className="text-xs">Delegation</span>
            </Link>
          </nav>

          {/* Botivate footer */}
          <div className="w-full py-1.5 text-xs text-center text-white bg-slate-800">
            <a
              href="https://www.botivate.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Powered by <span className="font-semibold">Botivate</span>
            </a>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-10 hidden py-2 text-sm text-center text-white md:left-64 md:block bg-slate-800">
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Powered by <span className="font-semibold">Botivate</span>
          </a>
        </div>
      </div>

      {/* CSS for slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
