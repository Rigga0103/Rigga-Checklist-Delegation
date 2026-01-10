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
} from "lucide-react";

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false);
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
          // Start header animation after typing animation finishes
          startHeaderAnimation(storedUsername);
        }
      }, 80);

      return () => clearInterval(typingInterval);
    } else {
      // Show header text immediately without animation
      setHeaderAnimatedText(`Welcome, ${storedUsername}`);
    }
  }, [navigate]);

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

  // Update the routes array based on user role
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Database,
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
    {
      href: "/mentenance-pending",
      label: "Maintenance-Pending",
      icon: PersonStanding,
      active: location.pathname === "/mentenance-pending",
      showFor: ["admin", "user"],
    },
    {
      href: "/mentenance-history",
      label: "Maintenance-History",
      icon: PersonStanding,
      active: location.pathname === "/mentenance-history",
      showFor: ["admin", "user"],
    },
    {
      href: "/mentenance-calendar",
      label: "Maintenance-Calendar",
      icon: PersonStanding,
      active: location.pathname === "/mentenance-calendar",
      showFor: ["admin", "user"],
    },
    {
      href: "/repairing-dashboard",
      label: "Repairing Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/repairing-dashboard",
      showFor: ["admin"],
    },
    {
      href: "/maintenance-dashboard",
      label: "Maintenance Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/maintenance-dashboard",
      showFor: ["admin"],
    },
    {
      href: "/repairing-form",
      label: "Repairing Request Form",
      icon: FormInput,
      active: location.pathname === "/repairing-form",
      showFor: ["admin"],
      showForUsers: ["pratap kumar rout"],
    },
    {
      href: "/repairing-pending",
      label: "Repairing Pending",
      icon: Wrench,
      active: location.pathname === "/repairing-pending",
      showFor: ["admin"],
      showForUsers: ["pratap kumar rout"],
    },
    {
      href: "/repairing-history",
      label: "Repairing History",
      icon: ClipboardList,
      active: location.pathname === "/repairing-history",
      showFor: ["admin"],
      showForUsers: ["pratap kumar rout"],
    },

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

  // Filter routes based on user role and specific username
  const getAccessibleRoutes = () => {
    const userRole = sessionStorage.getItem("role") || "user";
    const username = sessionStorage.getItem("username") || "";
    console.log(username, "uesrname");

    return routes.filter((route) => {
      // Check if role matches
      const roleMatch = route.showFor.includes(userRole);

      // Check if specific user matches (if showForUsers is defined)
      const userMatch = route.showForUsers
        ? route.showForUsers.includes(username)
        : false;

      return roleMatch || userMatch;
    });
  };

  // Check if the current path is a data category page
  const isDataPage = location.pathname.includes("/dashboard/data/");

  // If it's a data page, expand the submenu by default
  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true);
    }
  }, [isDataPage, isDataSubmenuOpen]);

  const accessibleRoutes = getAccessibleRoutes();

  // License Modal Component
  const LicenseModal = () => {
    const getYouTubeEmbedUrl = (url) => {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`
        : url;
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
          <div className="flex h-[80vh]"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Sidebar for desktop */}
      <aside className="flex-shrink-0 hidden w-64 bg-white border-r border-blue-200 md:flex md:flex-col">
        <div className="flex items-center px-4 border-b border-blue-200 h-14 bg-gradient-to-r from-blue-100 to-purple-100">
          <Link
            to="/dashboard/admin"
            className="flex items-center gap-2 font-semibold text-blue-700"
          >
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span>Checklist & Delegation</span>
          </Link>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                {route.submenu ? (
                  <div>
                    <button
                      onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        route.active
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                          : "text-gray-700 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon
                          className={`h-4 w-4 ${
                            route.active ? "text-blue-600" : ""
                          }`}
                        />
                        {route.label}
                      </div>
                      {isDataSubmenuOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isDataSubmenuOpen && (
                      <ul className="pl-2 mt-1 ml-6 space-y-1 border-l border-blue-100">
                        {accessibleDepartments.map((category) => (
                          <li key={category.id}>
                            <Link
                              to={
                                category.link ||
                                `/dashboard/data/${category.id}`
                              }
                              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                location.pathname ===
                                (category.link ||
                                  `/dashboard/data/${category.id}`)
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={route.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      route.active
                        ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    <route.icon
                      className={`h-4 w-4 ${
                        route.active ? "text-blue-600" : ""
                      }`}
                    />
                    {route.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <span className="text-sm font-medium text-white">
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">
                  {username || "User"} {userRole === "admin" ? "(Admin)" : ""}
                </p>
                <p className="text-xs text-blue-600">
                  {username
                    ? `${username.toLowerCase()}@example.com`
                    : "user@example.com"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="p-1 text-blue-700 rounded-full hover:text-blue-900 hover:bg-blue-100"
                >
                  {darkMode ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 08 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  )}
                  <span className="sr-only">
                    {darkMode ? "Light mode" : "Dark mode"}
                  </span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-1 text-blue-700 rounded-full hover:text-blue-900 hover:bg-blue-100"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="absolute z-50 p-2 text-blue-700 rounded-md md:hidden left-4 top-3 hover:bg-blue-100"
      >
        <Menu className="w-5 h-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex items-center px-4 border-b border-blue-200 h-14 bg-gradient-to-r from-blue-100 to-purple-100">
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-2 font-semibold text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span>Checklist & Delegation</span>
              </Link>
            </div>
            <nav className="flex-1 p-2 overflow-y-auto bg-white">
              <ul className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    {route.submenu ? (
                      <div>
                        <button
                          onClick={() =>
                            setIsDataSubmenuOpen(!isDataSubmenuOpen)
                          }
                          className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            route.active
                              ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                              : "text-gray-700 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <route.icon
                              className={`h-4 w-4 ${
                                route.active ? "text-blue-600" : ""
                              }`}
                            />
                            {route.label}
                          </div>
                          {isDataSubmenuOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {isDataSubmenuOpen && (
                          <ul className="pl-2 mt-1 ml-6 space-y-1 border-l border-blue-100">
                            {accessibleDepartments.map((category) => (
                              <li key={category.id}>
                                <Link
                                  to={
                                    category.link ||
                                    `/dashboard/data/${category.id}`
                                  }
                                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                    location.pathname ===
                                    (category.link ||
                                      `/dashboard/data/${category.id}`)
                                      ? "bg-blue-50 text-blue-700 font-medium"
                                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                  }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {category.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={route.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          route.active
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <route.icon
                          className={`h-4 w-4 ${
                            route.active ? "text-blue-600" : ""
                          }`}
                        />
                        {route.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                    <span className="text-sm font-medium text-white">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"}{" "}
                      {userRole === "admin" ? "(Admin)" : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {username
                        ? `${username.toLowerCase()}@example.com`
                        : "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {toggleDarkMode && (
                    <button
                      onClick={toggleDarkMode}
                      className="p-1 text-blue-700 rounded-full hover:text-blue-900 hover:bg-blue-100"
                    >
                      {darkMode ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 08 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                      )}
                      <span className="sr-only">
                        {darkMode ? "Light mode" : "Dark mode"}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-1 text-blue-700 rounded-full hover:text-blue-900 hover:bg-blue-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="sr-only">Log out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Modal */}
      {isLicenseModalOpen && <LicenseModal />}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 border-b-2 border-blue-200 shadow-md bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 md:px-6">
          <div className="flex w-8 md:hidden"></div>
          <div className="flex flex-col gap-1">
            {headerAnimatedText && (
              <div className="relative">
                <p className="text-lg md:text-xl font-['Poppins',_'Segoe_UI',_sans-serif] tracking-wide">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient">
                    {headerAnimatedText}
                  </span>
                  <span className="inline-block ml-2 text-yellow-500 animate-bounce">
                    👋
                  </span>
                </p>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 pb-20 overflow-y-auto md:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          {children}
        </main>

        {/* Mobile Footer Tabs - Only visible on mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-blue-200 shadow-lg md:hidden">
          {/* Navigation tabs */}
          <nav className="flex justify-around py-2">
            <Link
              to="/dashboard/admin"
              className={`flex flex-col items-center text-sm p-2 transition-colors ${
                location.pathname === "/dashboard/admin"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-500"
              }`}
              aria-label="Dashboard"
            >
              <Home className="w-6 h-6 mb-1" />
              <span className="text-xs">Home</span>
            </Link>

            <Link
              to="/dashboard/data/sales"
              className={`flex flex-col items-center text-sm p-2 transition-colors ${
                location.pathname === "/dashboard/data/sales"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-500"
              }`}
              aria-label="Checklist"
            >
              <CalendarCheck className="w-6 h-6 mb-1" />
              <span className="text-xs">Checklist</span>
            </Link>

            {/* Assign Task - Only for Admin */}
            {userRole === "admin" && (
              <Link
                to="/dashboard/assign-task"
                className={`flex flex-col items-center text-sm p-2 transition-colors ${
                  location.pathname === "/dashboard/assign-task"
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-500"
                }`}
                aria-label="Assign Task"
              >
                <CirclePlus className="w-6 h-6 mb-1" />
                <span className="text-xs">Assign</span>
              </Link>
            )}

            <Link
              to="/dashboard/delegation"
              className={`flex flex-col items-center text-sm p-2 transition-colors ${
                location.pathname === "/dashboard/delegation"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-500"
              }`}
              aria-label="Delegation"
            >
              <BookmarkCheck className="w-6 h-6 mb-1" />
              <span className="text-xs">Delegation</span>
            </Link>
          </nav>

          {/* Botivate footer */}
          <div className="w-full py-1 text-xs text-center text-white border-t border-blue-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <a
              href="https://www.botivate.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Powered by-<span className="font-semibold">Botivate</span>
            </a>
          </div>
        </div>
        {/* Desktop Botivate footer */}
        <div className="fixed bottom-0 left-0 right-0 z-10 hidden px-4 py-1 text-sm text-center text-white shadow-md md:left-64 md:block bg-gradient-to-r from-blue-600 to-purple-600">
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Powered by-<span className="font-semibold">Botivate</span>
          </a>
        </div>
      </div>
    </div>
  );
}
