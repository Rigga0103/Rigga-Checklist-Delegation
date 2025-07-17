"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CheckSquare, ClipboardList, Home, LogOut, Menu, Database, ChevronDown, ChevronRight, Zap, FileText, X, Play, Pause } from 'lucide-react'

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false)
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username')
    const storedRole = sessionStorage.getItem('role')

    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login")
      return
    }

    setUsername(storedUsername)
    setUserRole(storedRole || "user")
  }, [navigate])

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('department')
    navigate("/login")
  }

  // Filter dataCategories based on user role
  const dataCategories = [
    //{ id: "main", name: "PURAB", link: "/dashboard/data/main" },
    { id: "sales", name: "Admin", link: "/dashboard/data/sales" },
    { id: "home-data", name: "HOME", link: "/dashboard/data/home-data" },
    { id: "service", name: "Security Guard", link: "/dashboard/data/service" },
    { id: "account", name: "Injection Molding", link: "/dashboard/data/account" },
    { id: "warehouse", name: "Packing(Mohan)", link: "/dashboard/data/warehouse" },
    { id: "purchase", name: "Packing(Guddu)", link: "/dashboard/data/purchase" },
    { id: "director", name: "Pipe", link: "/dashboard/data/director" },
    { id: "managing-director", name: "Garden", link: "/dashboard/data/managing-director" },
    { id: "coo", name: "Bend", link: "/dashboard/data/coo" },
    { id: "jockey", name: "Sanjay", link: "/dashboard/data/jockey" },
  ]

  // Update the routes array based on user role
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Database,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin", "user"] // Show for both roles
    },
    {
      href: "/dashboard/quick-task",
      label: "Quick Task",
      icon: Zap,
      active: location.pathname === "/dashboard/quick-task",
      showFor: ["admin", "user"] // Only show for admin
    },
    {
      href: "/dashboard/assign-task",
      label: "Assign Task",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin"] // Only show for admin
    },

    {
      href: "/dashboard/delegation",
      label: "Delegation",
      icon: ClipboardList,
      active: location.pathname === "/dashboard/delegation",
      showFor: ["admin", "user"] // Only show for admin
    },
    {
      href: "#",
      label: "Data",
      icon: Database,
      active: location.pathname.includes("/dashboard/data"),
      submenu: true,
      showFor: ["admin", "user"] // Show for both roles
    },
  ]

  const getAccessibleDepartments = () => {
    const userRole = sessionStorage.getItem('role') || 'user'
    return dataCategories.filter(cat =>
      !cat.showFor || cat.showFor.includes(userRole)
    )
  }

  // Filter routes based on user role
  const getAccessibleRoutes = () => {
    const userRole = sessionStorage.getItem('role') || 'user'
    return routes.filter(route =>
      route.showFor.includes(userRole)
    )
  }

  // Check if the current path is a data category page
  const isDataPage = location.pathname.includes("/dashboard/data/")

  // If it's a data page, expand the submenu by default
  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true)
    }
  }, [isDataPage, isDataSubmenuOpen])

  // Get accessible routes and departments
  const accessibleRoutes = getAccessibleRoutes()
  const accessibleDepartments = getAccessibleDepartments()

  // License Modal Component
  const LicenseModal = () => {
    // Function to convert YouTube URL to embed URL
    const getYouTubeEmbedUrl = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`
        : url;
    };

    const videoUrl = userRole === "admin"
      ? "https://youtu.be/v2yqJc1CKBA?si=J_r0PAIlGOqkHsz3"
      : "https://youtu.be/v2yqJc1CKBA?si=J_r0PAIlGOqkHsz3"

    const embedUrl = getYouTubeEmbedUrl(videoUrl);

    const handleVideoToggle = () => {
      setIsVideoPlaying(!isVideoPlaying)
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">License & Help</h2>
            <button
              onClick={() => {
                setIsLicenseModalOpen(false);
                setIsVideoPlaying(false);
              }}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex h-[80vh]">
            {/* Left Section - License Terms */}
            <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">License Terms & Conditions</h3>
              <div className="text-sm text-gray-600 space-y-4">
                <p className="font-medium text-gray-800">SOFTWARE LICENSE AGREEMENT</p>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">1. Grant of License</h4>
                  <p>Subject to the terms and conditions of this Agreement, we grant you a non-exclusive, non-transferable license to use the Checklist & Delegation software for your internal business operations.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">2. Restrictions</h4>
                  <p>You may not: (a) modify, adapt, or create derivative works; (b) reverse engineer, decompile, or disassemble the software; (c) distribute, sublicense, or transfer the software to third parties; (d) use the software for any unlawful purpose.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">3. Data Protection & Privacy</h4>
                  <p>We implement industry-standard security measures to protect your data. Your information is processed in accordance with applicable data protection laws including GDPR and other privacy regulations.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">4. Intellectual Property</h4>
                  <p>All intellectual property rights in the software remain with the licensor. This license does not grant you any rights to trademarks, copyrights, or patents.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">5. Limitation of Liability</h4>
                  <p>The software is provided "as is" without warranty of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of this software.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">6. Support & Updates</h4>
                  <p>Technical support is provided during business hours. Software updates and patches will be delivered automatically to ensure optimal performance and security.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">7. Termination</h4>
                  <p>This license is effective until terminated. It may be terminated by either party with 30 days written notice. Upon termination, you must cease all use of the software.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">8. Governing Law</h4>
                  <p>This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the software is used.</p>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Contact Information:</strong><br />
                    For license inquiries or technical support, please contact our support team at support@botivate.in
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Help Video */}
            <div className="w-1/2 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Help Video {userRole === "admin" ? "(Admin Guide)" : "(User Guide)"}
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  {!isVideoPlaying ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <button
                          onClick={handleVideoToggle}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 mb-4 transition-colors"
                        >
                          <Play className="h-8 w-8" />
                        </button>
                        <p className="text-gray-600">
                          Click to play {userRole === "admin" ? "Admin" : "User"} Help Video
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          YouTube Video Tutorial
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <iframe
                        width="100%"
                        height="315"
                        src={embedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="rounded-lg"
                      ></iframe>
                      <button
                        onClick={handleVideoToggle}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <h4 className="font-medium text-gray-700 mb-2">What you'll learn:</h4>
                  <ul className="space-y-1 ml-4">
                    {userRole === "admin" ? (
                      <>
                        <li>• Managing user accounts and permissions</li>
                        <li>• Creating and assigning tasks</li>
                        <li>• Monitoring system performance</li>
                        <li>• Generating reports and analytics</li>
                        <li>• System configuration and settings</li>
                      </>
                    ) : (
                      <>
                        <li>• Navigating the dashboard</li>
                        <li>• Completing assigned tasks</li>
                        <li>• Using the checklist system</li>
                        <li>• Updating task status</li>
                        <li>• Accessing delegation features</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50`}>
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-blue-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
          <Link to="/dashboard/admin" className="flex items-center gap-2 font-semibold text-blue-700">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span>Checklist & Delegation</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                {route.submenu ? (
                  <div>
                    <button
                      onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                        ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                        : "text-gray-700 hover:bg-blue-50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                        {route.label}
                      </div>
                      {isDataSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {isDataSubmenuOpen && (
                      <ul className="mt-1 ml-6 space-y-1 border-l border-blue-100 pl-2">
                        {accessibleDepartments.map((category) => (
                          <li key={category.id}>
                            <Link
                              to={category.link || `/dashboard/data/${category.id}`}
                              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${location.pathname === (category.link || `/dashboard/data/${category.id}`)
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 "
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
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                      ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                      : "text-gray-700 hover:bg-blue-50"
                      }`}
                  >
                    <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                    {route.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">
                  {username || "User"} {userRole === "admin" ? "(Admin)" : ""}
                </p>
                <p className="text-xs text-blue-600">
                  {username ? `${username.toLowerCase()}@example.com` : "user@example.com"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* <button
                onClick={() => setIsLicenseModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                title="License & Help"
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium">License</span>
              </button> */}
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                >
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  <span className="sr-only">{darkMode ? "Light mode" : "Dark mode"}</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden absolute left-4 top-3 z-50 text-blue-700 p-2 rounded-md hover:bg-blue-100"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-2 font-semibold text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <span>Checklist & Delegation</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 bg-white">
              <ul className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    {route.submenu ? (
                      <div>
                        <button
                          onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                          className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                            : "text-gray-700 hover:bg-blue-50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                            {route.label}
                          </div>
                          {isDataSubmenuOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isDataSubmenuOpen && (
                          <ul className="mt-1 ml-6 space-y-1 border-l border-blue-100 pl-2">
                            {accessibleDepartments.map((category) => (
                              <li key={category.id}>
                                <Link
                                  to={category.link || `/dashboard/data/${category.id}`}
                                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${location.pathname === (category.link || `/dashboard/data/${category.id}`)
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
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                          : "text-gray-700 hover:bg-blue-50"
                          }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                        {route.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"} {userRole === "admin" ? "(Admin)" : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {username ? `${username.toLowerCase()}@example.com` : "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLicenseModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                    title="License & Help"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="text-xs font-medium">License</span>
                  </button>
                  {toggleDarkMode && (
                    <button
                      onClick={toggleDarkMode}
                      className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                    >
                      {darkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      <span className="sr-only">{darkMode ? "Light mode" : "Dark mode"}</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 "
                  >
                    <LogOut className="h-4 w-4" />
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-blue-200 bg-white px-4 md:px-6">
          <div className="flex md:hidden w-8"></div>
          <h1 className="text-lg font-semibold text-blue-700">Checklist & Delegation</h1>
          <button
            onClick={() => setIsLicenseModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            title="License & Help"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">License</span>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          {children}
          <div className="fixed md:left-64 left-0 right-0 bottom-0 py-1 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center text-sm shadow-md z-10">
            <a
              href="https://www.botivate.in/" // Replace with actual URL
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Powered by-<span className="font-semibold">Botivate</span>
            </a>
          </div>
        </main>
      </div>

    </div>
  )
}
