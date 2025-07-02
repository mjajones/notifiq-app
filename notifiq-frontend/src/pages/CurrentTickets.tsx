import { useEffect, useState, useMemo, useCallback, useRef, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FaPlus, FaUserPlus, FaTimes, FaFileCsv, FaTrash, FaCopy } from 'react-icons/fa';
import { FiChevronDown, FiSearch, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import StatusSelector from '../components/ui/StatusSelector';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import EditLabelsModal from '../components/ui/EditLabelsModal';
import { Ticket, Employee, TicketStatus, Message } from '../types';
import { StatusSelectorDropdownProps } from '../types/ui';

interface AgentDropdownMenuProps {
    options: Employee[];
    onSelect: (agentId: number) => void;
    onClose: () => void;
    targetRect: DOMRect | null;
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
}

function AgentDropdownMenu({ options, onSelect, onClose, targetRect, searchTerm, onSearchChange }: AgentDropdownMenuProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dropdownEl = dropdownRef.current;
        if (!dropdownEl || !targetRect) return;
        const { innerHeight } = window;
        const dropdownHeight = dropdownEl.offsetHeight;
        let top = targetRect.bottom + 4;
        if ((top + dropdownHeight) > innerHeight && targetRect.top > dropdownHeight) {
            top = targetRect.top - dropdownHeight - 4;
        }
        dropdownEl.style.top = `${top}px`;
        dropdownEl.style.left = `${targetRect.left}px`;
        dropdownEl.style.width = `${targetRect.width < 256 ? 256 : targetRect.width}px`;
    }, [targetRect]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return createPortal(
        <div ref={dropdownRef} className="fixed z-50 text-left">
            <div className="w-full bg-white border border-border rounded-md shadow-lg">
                <div className="p-2 border-b"><div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search names..." className="w-full bg-gray-100 p-2 pl-9 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" value={searchTerm} onChange={(e) => onSearchChange?.(e.target.value)} autoFocus /></div></div>
                <ul className="max-h-48 overflow-y-auto">{options.length > 0 ? (options.map(staff => (<li key={staff.id} onClick={() => onSelect(staff.id)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer font-normal">{`${staff.first_name} ${staff.last_name}`.trim() || staff.username}</li>))) : (<li className="px-3 py-2 text-gray-500 font-normal">No results found.</li>)}</ul>
            </div>
        </div>,
        document.body
    );
}

export default function CurrentTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [statusLabels, setStatusLabels] = useState<TicketStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assigningTicket, setAssigningTicket] = useState<number | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
    const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [agentSearchTerm, setAgentSearchTerm] = useState("");
    const [isEditLabelsModalOpen, setIsEditLabelsModalOpen] = useState(false);
    const [bulkStatus, setBulkStatus] = useState('');
    const [bulkPriority, setBulkPriority] = useState('');
    const [bulkTeam, setBulkTeam] = useState('');
    const [bulkAgent, setBulkAgent] = useState('');
    const [bulkTag, setBulkTag] = useState('');
    const [bulkMove, setBulkMove] = useState('');
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [pendingBulkAction, setPendingBulkAction] = useState<(() => Promise<void>) | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [showMenu, setShowMenu] = useState<number | null>(null);
    const [itStaff, setItStaff] = useState<Employee[]>([]);
    
    const { authTokens, user, loading: authLoading } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const priorityOptions = [
        { value: 'Low', label: 'Low', colorClass: 'bg-stone-400' },
        { value: 'Medium', label: 'Medium', colorClass: 'bg-amber-500' },
        { value: 'High', label: 'High', colorClass: 'bg-red-500' },
        { value: 'Urgent', label: 'Urgent', colorClass: 'bg-red-700' },
        { value: 'Critical', label: 'Critical', colorClass: 'bg-black' },
    ];
    
    const moveOptions = ['Unassigned Tickets', 'Open Tickets', 'Waiting for Response', 'Resolved Tickets'];

    const fetchData = useCallback(async () => {
        if (authLoading || !authTokens) return;
        setLoading(true);
        setError(null);

        try {
            const [ticketsRes, usersRes, itStaffRes, statusLabelsRes] = await Promise.all([
                fetch(`${API_URL}/api/incidents/`, { headers: { 'Authorization': `Bearer ${authTokens.access}` } }),
                fetch(`${API_URL}/api/users/employees/`, { headers: { 'Authorization': `Bearer ${authTokens.access}` } }),
                fetch(`${API_URL}/api/users/it-staff/`, { headers: { 'Authorization': `Bearer ${authTokens.access}` } }),
                fetch(`${API_URL}/api/status-labels/`, { headers: { 'Authorization': `Bearer ${authTokens.access}` } })
            ]);

            if (ticketsRes.ok) {
                const data = await ticketsRes.json();
                setTickets(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
            } else { setError("Failed to load tickets."); }

            if (usersRes.ok) {
                const data = await usersRes.json();
                setAllEmployees(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
            }

            if (itStaffRes.ok) {
                const data = await itStaffRes.json();
                setItStaff(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
            }

            if (statusLabelsRes.ok) {
                const data = await statusLabelsRes.json();
                setStatusLabels(Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : []);
            }
        } catch (err) {
            setError("An error occurred while fetching data.");
        } finally {
            setLoading(false);
        }
    }, [authTokens, API_URL, authLoading]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setTags(['Bug', 'Feature', 'Customer', 'Internal']);
    }, []);

    const handleTicketUpdate = async (ticketId: number, field: string, value: string | number) => {
        setAssigningTicket(null);
        try {
            const formData = new FormData();
            const fieldName = field === 'agent' ? 'agent_id' : field;
            formData.append(fieldName, String(value));
            
            const response = await fetch(`${API_URL}/api/incidents/${ticketId}/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${authTokens.access}` },
                body: formData
            });

            if (response.ok) {
                await fetchData();
            } else {
                console.error("Update failed on the backend.");
                await fetchData(); // Re-fetch even on failure to re-sync state
            }
        } catch (err) {
            console.error('Update failed on the client-side:', err);
        }
    };
    
    const handleSelectTicket = (ticketId) => { setSelectedTickets(prev => prev.includes(ticketId) ? prev.filter(id => id !== ticketId) : [...prev, ticketId]); };

    const handleBulkMove = async (groupName) => {
        setIsMoveMenuOpen(false);
        const updates = selectedTickets.map(id => {
            const formData = new FormData();
            let statusToApply;
            switch (groupName) {
                case 'Unassigned Tickets': formData.append('agent_id', ''); break;
                case 'Open Tickets': statusToApply = statusLabels.find(l => l.name.toLowerCase() === 'open'); break;
                case 'Waiting for Response': statusToApply = statusLabels.find(l => l.name.toLowerCase() === 'awaiting customer'); break;
                case 'Resolved Tickets': statusToApply = statusLabels.find(l => l.name.toLowerCase() === 'resolved'); break;
                default: return null;
            }
            if (statusToApply) {
                formData.append('status_id', statusToApply.id);
            }
            return fetch(`${API_URL}/api/incidents/${id}/`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${authTokens.access}` }, body: formData });
        }).filter(Boolean);
        
        await Promise.all(updates);
        await fetchData();
        setSelectedTickets([]);
    };

    const handleExportSelected = () => {
        // This function does not need changes
        const ticketsToExport = tickets.filter(t => selectedTickets.includes(t.id));
        if (ticketsToExport.length === 0) return;
        const headers = ['ID', 'Title', 'Status', 'Priority', 'Category', 'Employee', 'Agent'];
        const rows = ticketsToExport.map(ticket => {
            const agentName = allEmployees.find(staff => staff.id === ticket.agent?.id)?.username || 'Unassigned';
            const title = `"${ticket.title.replace(/"/g, '""')}"`;
            return [ticket.id, title, ticket.status?.name, ticket.priority, ticket.category, ticket.requester_name, agentName].join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "notifiq_tickets.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSelectedTickets([]);
    };

    const handleDuplicateSelected = async () => {
        const duplicatePromises = selectedTickets.map(id => fetch(`${API_URL}/api/incidents/${id}/duplicate/`, { method: 'POST', headers: { 'Authorization': `Bearer ${authTokens.access}` } }));
        await Promise.all(duplicatePromises);
        await fetchData();
        setSelectedTickets([]);
    };

    const handleDeleteSelected = async () => {
        setIsConfirmingDelete(false);
        const deletePromises = selectedTickets.map(id => fetch(`${API_URL}/api/incidents/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authTokens.access}` } }));
        await Promise.all(deletePromises);
        await fetchData();
        setSelectedTickets([]);
    };

    const handleLabelCreate = async (labelData) => { await fetch(`${API_URL}/api/status-labels/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` }, body: JSON.stringify(labelData) }); fetchData(); };
    const handleLabelUpdate = async (labelId, labelData) => { await fetch(`${API_URL}/api/status-labels/${labelId}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` }, body: JSON.stringify(labelData) }); fetchData(); };
    const handleLabelDelete = async (labelId) => { if (window.confirm("Are you sure? This will remove the label from all tickets.")) { await fetch(`${API_URL}/api/status-labels/${labelId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authTokens.access}` } }); fetchData(); } };
    
    const allTicketGroups = useMemo(() => {
        const groups = { 'Unassigned Tickets': [], 'Open Tickets': [], 'Waiting for Response': [], 'Resolved Tickets': [] };
        if (Array.isArray(tickets)) {
            tickets.forEach(ticket => {
                const statusName = ticket.status?.name?.toLowerCase();
                if (!ticket.agent) { groups['Unassigned Tickets'].push(ticket); } 
                else if (statusName === 'awaiting customer') { groups['Waiting for Response'].push(ticket); } 
                else if (statusName === 'resolved' || statusName === 'closed') { groups['Resolved Tickets'].push(ticket); } 
                else { groups['Open Tickets'].push(ticket); }
            });
        }
        return groups;
    }, [tickets]);

    const filteredStaff = itStaff.filter(staff => {
        const fullName = `${staff.first_name} ${staff.last_name}`.trim().toLowerCase();
        return fullName.includes(agentSearchTerm.toLowerCase()) || staff.username.toLowerCase().includes(agentSearchTerm.toLowerCase());
    });
    const isITStaff = user?.groups?.includes('IT Staff') || user?.is_superuser;

    const getAgentInitials = (agentData) => {
        const agentId = (typeof agentData === 'object' && agentData !== null) ? agentData.id : agentData;
        if (!agentId) return <FaUserPlus />;
        const agent = allEmployees.find(emp => emp.id === agentId);
        if (!agent) return <FaUserPlus />;
        const firstInitial = agent.first_name?.[0] || '';
        const lastInitial = agent.last_name?.[0] || '';
        if (firstInitial && lastInitial) return `${firstInitial}${lastInitial}`.toUpperCase();
        return (agent.username?.substring(0, 2) || 'NA').toUpperCase();
    };

    const handleBulkApply = async () => {
        if (["Archive", "Spam", "Trash"].includes(bulkMove)) {
            setShowBulkConfirm(true);
            setPendingBulkAction(() => doBulkApply);
            return;
        }
        await doBulkApply();
    };

    const doBulkApply = async () => {
        const updates = selectedTickets.map(id => {
            const formData = new FormData();
            if (bulkStatus) {
                const statusObj = statusLabels.find(l => l.name === bulkStatus);
                if (statusObj) formData.append('status_id', statusObj.id);
            }
            if (bulkPriority) formData.append('priority', bulkPriority);
            if (bulkTeam) formData.append('group', bulkTeam);
            if (bulkAgent) formData.append('agent_id', bulkAgent);
            if (bulkTag) formData.append('tags', JSON.stringify([bulkTag]));
            if (bulkMove) formData.append('folder', bulkMove);
            return fetch(`${API_URL}/api/incidents/${id}/`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${authTokens.access}` }, body: formData });
        });
        await Promise.all(updates);
        await fetchData();
        setSelectedTickets([]);
        setBulkStatus(''); setBulkPriority(''); setBulkTeam(''); setBulkAgent(''); setBulkTag(''); setBulkMove('');
        setShowBulkConfirm(false);
    };

    const handleMenuAction = async (ticketId, action, value) => {
        if (["Archive", "Spam", "Trash"].includes(action)) {
            if (!window.confirm(`Are you sure you want to move this ticket to ${action}?`)) return;
        }
        const formData = new FormData();
        if (["Open", "Pending", "On Hold", "Solved", "Closed"].includes(action)) {
            const statusObj = statusLabels.find(l => l.name === action);
            if (statusObj) formData.append('status_id', statusObj.id);
        }
        if (["Low", "Medium", "High", "Urgent"].includes(action)) formData.append('priority', action);
        if (["Archive", "Spam", "Trash"].includes(action)) formData.append('folder', action);
        if (action === 'Assign Agent' && value) formData.append('agent_id', value);
        await fetch(`${API_URL}/api/incidents/${ticketId}/`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${authTokens.access}` }, body: formData });
        await fetchData();
    };

    // Debug: log allEmployees and itStaff structure
    console.log('allEmployees:', allEmployees);
    console.log('itStaff:', itStaff);

    // --- Custom Tickets Sidebar ---
    const ticketsSidebar = (
        <aside className="w-72 min-w-[16rem] max-w-xs bg-white border-r border-border h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <h2 className="text-xl font-bold text-text-primary">Tickets</h2>
                <Link to="/tickets/create" className="bg-primary text-white px-3 py-1.5 rounded-md flex items-center gap-2 hover:bg-primary-hover">
                    <FaPlus /> <span className="font-semibold">New ticket</span>
                </Link>
            </div>
            <div className="p-4 border-b border-border">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search in all tickets..." className="w-full bg-gray-100 p-2 pl-9 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                    <div className="text-xs font-semibold text-text-secondary mb-2">TICKET VIEWS</div>
                    <ul className="space-y-1">
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100">All recent tickets</Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100">Tickets to handle</Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100">My open tickets</Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100">My tickets in last 7 days</Link></li>
                        <li><button className="text-primary text-xs ml-2">Manage</button></li>
                    </ul>
                </div>
                <div>
                    <div className="text-xs font-semibold text-text-secondary mb-2">STATUSES</div>
                    <ul className="space-y-1">
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100 flex items-center justify-between">Open <span className="text-xs bg-gray-200 rounded px-2">4</span></Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100 flex items-center justify-between">Pending <span className="text-xs bg-gray-200 rounded px-2">0</span></Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100 flex items-center justify-between">On hold <span className="text-xs bg-gray-200 rounded px-2">0</span></Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100 flex items-center justify-between">Solved <span className="text-xs bg-gray-200 rounded px-2">0</span></Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100 flex items-center justify-between">Closed <span className="text-xs bg-gray-200 rounded px-2">0</span></Link></li>
                    </ul>
                </div>
                <div>
                    <div className="text-xs font-semibold text-text-secondary mb-2">FOLDERS</div>
                    <ul className="space-y-1">
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100">Archive</Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100">Spam</Link></li>
                        <li><Link to="#" className="block px-2 py-1 rounded hover:bg-gray-100">Trash</Link></li>
                    </ul>
                </div>
            </div>
        </aside>
    );

    // --- Main Tickets Page Layout ---
    return (
        <div className="flex h-[calc(100vh-0px)]">
            {ticketsSidebar}
            <main className="flex-1 overflow-x-auto">
                <div className="p-6 bg-gray-100 min-h-screen">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold">Open</h1>
                        <div className="flex items-center gap-2">
                            <button className="bg-white border border-border rounded px-3 py-1 text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
                                + Add filter
                            </button>
                            <span className="text-xs text-text-secondary ml-2">{tickets.length} tickets</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow border border-border overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-2 py-3 text-left text-xs font-semibold text-text-secondary">
                                        <input type="checkbox" checked={selectedTickets.length === tickets.length && tickets.length > 0} onChange={e => setSelectedTickets(e.target.checked ? tickets.map(t => t.id) : [])} />
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-semibold text-text-secondary">REQUESTER</th>
                                    <th className="px-2 py-3 text-left text-xs font-semibold text-text-secondary">SUBJECT</th>
                                    <th className="px-2 py-3 text-left text-xs font-semibold text-text-secondary">AGENT</th>
                                    <th className="px-2 py-3 text-left text-xs font-semibold text-text-secondary">STATUS</th>
                                    <th className="px-2 py-3 text-left text-xs font-semibold text-text-secondary">LAST MESSAGE <span className="inline-block align-middle">↓</span></th>
                                    <th className="px-2 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-border">
                                {tickets.map(ticket => {
                                    const requester = allEmployees.find(emp => emp.email === ticket.requester_email);
                                    const agent = allEmployees.find(emp => emp.id === ticket.agent?.id);
                                    return (
                                        <tr key={ticket.id} className="hover:bg-gray-50">
                                            <td className="px-2 py-2">
                                                <input type="checkbox" checked={selectedTickets.includes(ticket.id)} onChange={() => handleSelectTicket(ticket.id)} />
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                                                        {requester ? ((requester.first_name?.[0] || '') + (requester.last_name?.[0] || '')).toUpperCase() : (ticket.requester_name?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-text-primary text-sm">{requester ? `${requester.first_name} ${requester.last_name}` : ticket.requester_name || 'Unknown'}</div>
                                                        <div className="text-xs text-text-secondary">{requester ? requester.email : ticket.requester_email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">●</span>
                                                    <span className="font-medium text-text-primary">{ticket.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                {ticket.agent
                                                    ? `${ticket.agent.first_name} ${ticket.agent.last_name}`
                                                    : 'unassigned'}
                                            </td>
                                            <td className="px-2 py-2">
                                                <button
                                                    className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold hover:bg-blue-200"
                                                    onClick={async () => {
                                                        // Find the next status (toggle Open/Pending for demo, or use a menu for all options)
                                                        const nextStatusName = ticket.status?.name === 'Open' ? 'Pending' : 'Open';
                                                        const nextStatus = statusLabels.find(l => l.name === nextStatusName);
                                                        if (nextStatus) {
                                                            const formData = new FormData();
                                                            formData.append('status_id', nextStatus.id);
                                                            await fetch(`${API_URL}/api/incidents/${ticket.id}/`, {
                                                                method: 'PATCH',
                                                                headers: { 'Authorization': `Bearer ${authTokens.access}` },
                                                                body: formData
                                                            });
                                                            await fetchData();
                                                        }
                                                    }}
                                                >
                                                    {ticket.status?.name || 'Open'}
                                                </button>
                                            </td>
                                            <td className="px-2 py-2 text-xs text-text-secondary">{ticket.submitted_at ? new Date(ticket.submitted_at).toLocaleDateString() : ''}</td>
                                            <td className="px-2 text-right relative">
                                                <button onClick={() => setShowMenu(ticket.id)} className="p-2 rounded hover:bg-gray-100"><FiMoreVertical /></button>
                                                {showMenu === ticket.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded shadow-lg z-50">
                                                        {['Urgent', 'High', 'Medium', 'Low'].map(priority => (
                                                            <button key={priority} className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={async () => { await handleMenuAction(ticket.id, priority); await fetchData(); }}>
                                                                Set priority to {priority}
                                                            </button>
                                                        ))}
                                                        <hr />
                                                        {['Open', 'Pending', 'On Hold', 'Solved', 'Closed'].map(status => (
                                                            <button key={status} className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={async () => { await handleMenuAction(ticket.id, status); await fetchData(); }}>
                                                                Set as {status}
                                                            </button>
                                                        ))}
                                                        <hr />
                                                        {['Archive', 'Spam', 'Trash'].map(folder => (
                                                            <button key={folder} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={async () => { await handleMenuAction(ticket.id, folder); await fetchData(); }}>
                                                                Move to {folder}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {selectedTickets.length > 0 && (
                      <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-md mb-4 border border-border">
                        <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="p-2 rounded border">
                          <option value="">Set status...</option>
                          <option value="Open">Open</option>
                          <option value="Pending">Pending</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Solved">Solved</option>
                          <option value="Closed">Closed</option>
                        </select>
                        <select value={bulkPriority} onChange={e => setBulkPriority(e.target.value)} className="p-2 rounded border">
                          <option value="">Set priority...</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                        <select value={bulkTeam} onChange={e => setBulkTeam(e.target.value)} className="p-2 rounded border">
                          <option value="">Assign team...</option>
                          <option value="Level 1 Helpdesk">Level 1 Helpdesk</option>
                          <option value="Level 2 Helpdesk">Level 2 Helpdesk</option>
                          <option value="Level 3 Helpdesk">Level 3 Helpdesk</option>
                        </select>
                        <select value={bulkAgent} onChange={e => setBulkAgent(e.target.value)} className="p-2 rounded border">
                          <option value="">Assign agent...</option>
                          {itStaff.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.first_name} {agent.last_name}</option>
                          ))}
                        </select>
                        <select value={bulkTag} onChange={e => setBulkTag(e.target.value)} className="p-2 rounded border">
                          <option value="">Add tag...</option>
                          {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                        </select>
                        <select value={bulkMove} onChange={e => setBulkMove(e.target.value)} className="p-2 rounded border">
                          <option value="">Move to...</option>
                          <option value="Archive">Archive</option>
                          <option value="Spam">Spam</option>
                          <option value="Trash">Trash</option>
                        </select>
                        <button onClick={handleBulkApply} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">Apply</button>
                      </div>
                    )}
                </div>
            </main>
        </div>
    );
}