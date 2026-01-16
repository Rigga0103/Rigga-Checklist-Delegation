"use client";
import React from "react";
import { Navigate } from "react-router-dom";

// Maintenance Dashboard has been merged with Repairing Dashboard
// Redirect to the combined Repair & Maintenance Dashboard
const Maintenance_Dashboard = () => {
  return <Navigate to="/repairing-dashboard" replace />;
};

export default Maintenance_Dashboard;
