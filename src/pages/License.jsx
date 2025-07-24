import React, { useState, useEffect } from 'react'
import { FileText, ScrollText, Users, User } from 'lucide-react'
import AdminLayout from "../components/layout/AdminLayout";

const License = () => {
    const [userRole, setUserRole] = useState("")
    const [username, setUsername] = useState("")

    // Get user info from sessionStorage
    useEffect(() => {
        const storedRole = sessionStorage.getItem('role') || 'user'
        const storedUsername = sessionStorage.getItem('username') || 'User'
        setUserRole(storedRole)
        setUsername(storedUsername)
    }, [])

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                    <ScrollText className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800">License Agreement</h1>
                                    <p className="text-gray-600 mt-1">
                                        Software license terms and conditions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* License Content */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <FileText className="h-6 w-6 text-blue-600" />
                                <h2 className="text-2xl font-semibold text-gray-800">License Terms & Conditions</h2>
                            </div>

                            <div className="text-sm text-gray-600 space-y-6 h-[600px] overflow-y-auto pr-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="font-semibold text-blue-800 text-base">SOFTWARE LICENSE AGREEMENT</p>
                                    <p className="text-blue-700 mt-1">Checklist & Delegation System</p>
                                </div>

                                <div className="space-y-4">
                                    {/* <div className="border-l-4 border-blue-500 pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">1. Grant of License</h3>
                                        <p className="text-gray-600">
                                            You can use this software within your organization. This license is just for you—don’t share, sell, or give it to others.
                                        </p>
                                    </div> */}

                                    {/* <div className="border-l-4 border-purple-500 pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">2. Restrictions</h3>
                                        <p className="text-gray-600">
                                            Do not copy, change, or try to break the software. Don’t share it with others or use it for anything illegal or harmful.
                                        </p> */}
                                    {/* </div> */}



                                    <div className="border-l-4 border-yellow-500 pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">1. Copyright ©  BOTIVATE SERVICES LLP</h3>
                                        <p className="text-gray-600">
                                            This software is specially developed by botivate for use by its clients
                                            Unauthorized use & copying of this software will attract penalties.
                                            For support contact info is below.
                                        </p>
                                    </div>

                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">2. Data Protection & Privacy</h3>
                                        <p className="text-gray-600">
                                            We protect your data using secure methods and follow privacy laws. Your information is safe with us.
                                        </p>
                                    </div>
                                    {/* <div className="border-l-4 border-red-500 pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">5. Limitation of Liability</h3>
                                        <p className="text-gray-600">
                                            The software is provided “as is.” We are not responsible for any issues or losses you may experience while using it.
                                        </p>
                                    </div> */}

                                    <div className="border-l-4 border-indigo-500 pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">3. Support & Updates</h3>
                                        <p className="text-gray-600">
                                            We offer support during business hours. Software updates and fixes will be provided regularly to improve performance and security.
                                        </p>
                                    </div>

                                    {/* <div className="border-l-4 border-pink-500 pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">7. Termination</h3>
                                        <p className="text-gray-600">
                                            Either you or we can end this license with written notice. After that, you must stop using the software immediately.
                                        </p>
                                    </div> */}

                                    {/* <div className="border-l-4 border-gray-500 pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">8. Governing Law</h3>
                                        <p className="text-gray-600">
                                            This agreement follows the laws of the region or country where you’re using the software.
                                        </p>
                                    </div> */}
                                </div>

                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mt-6">
                                    <h4 className="font-semibold text-blue-800 mb-2">Contact Information</h4>
                                    <p className="text-blue-700 text-sm">
                                        For license inquiries or technical support, please contact our support team:
                                    </p>
                                    <div className="mt-2 space-y-1">
                                        <a href="mailto:info@botivate.in" className="text-blue-600 font-medium hover:text-blue-800 transition-colors block">📧 info@botivate.in</a>
                                        <a href="https://www.botivate.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:text-blue-800 transition-colors block">🌐 www.botivate.in</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

export default License