import React, { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FaHome, FaTicketAlt, FaPlus, FaBox, FaSignOutAlt } from 'react-icons/fa';
import AuthContext from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { user, logoutUser } = useContext(AuthContext);
  const isITStaff = user?.groups?.includes('IT Staff') || user?.is_superuser;

  const baseLinkClass = 'flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-text-on-sidebar/70 hover:bg-sidebar-hover hover:text-text-on-sidebar';
  const activeLinkClass = 'bg-primary text-white';

  return (
    <aside
      className="group/sidebar h-full bg-sidebar flex flex-col transition-all duration-300 ease-in-out w-16 hover:w-64 z-30 fixed md:static"
    >
      <div className="px-2 py-4 flex items-center justify-center border-b border-sidebar-hover">
        <Link to="/dashboard">
          <img
            src="/notifiqlogo.png"
            alt="NotifiQ Desk Logo"
            className="h-10 w-auto"
          />
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {isITStaff && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}> <FaHome className="text-lg" /> <span className="ml-3 sidebar-label group-hover/sidebar:inline hidden">Dashboard</span></NavLink>
            <NavLink to="/assets/create" className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}> <FaBox className="text-lg" /> <span className="ml-3 sidebar-label group-hover/sidebar:inline hidden">Assets</span></NavLink>
          </>
        )}
        <NavLink to="/tickets" className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}> <FaTicketAlt className="text-lg" /> <span className="ml-3 sidebar-label group-hover/sidebar:inline hidden">{isITStaff ? 'Tickets' : 'My Tickets'}</span></NavLink>
        <NavLink to="/tickets/create" className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}> <FaPlus className="text-lg" /> <span className="ml-3 sidebar-label group-hover/sidebar:inline hidden">Create Ticket</span></NavLink>
      </nav>
      <div className="px-2 py-4 mt-auto border-t border-sidebar-hover">
        <div className="text-xs text-text-on-sidebar/50 mb-2 px-2 sidebar-label group-hover/sidebar:block hidden">Logged in as: {user?.username}</div>
        <button onClick={logoutUser} className={`${baseLinkClass} w-full`}> <FaSignOutAlt className="text-lg" /> <span className="ml-3 sidebar-label group-hover/sidebar:inline hidden">Logout</span></button>
      </div>
    </aside>
  );
}