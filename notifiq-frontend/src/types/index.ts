// User and authentication types
export interface User {
    user_id: number;
    username: string;
    email: string;
    is_it_staff: boolean;
    first_name?: string;
    last_name?: string;
    exp: number;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

// Employee and Staff types
export interface Employee {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_it_staff: boolean;
}

// Ticket types
export interface TicketStatus {
    id: number;
    name: string;
    color?: string;
}

export interface Ticket {
    id: number;
    title: string;
    description: string;
    status: TicketStatus | null;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    urgency: string;
    impact: string;
    submitted_at: string;
    updated_at: string;
    requester_id: number;
    requester_name: string;
    requester_email?: string;
    agent: Employee | null;
    group: string;
    department: string;
    category: string;
    subcategory: string;
    tags: string[];
    source: string;
    activity_log?: ActivityLog[];
}

export interface ActivityLog {
    id: number;
    activity_type: string;
    timestamp: string;
    user: string;
    note?: string;
    changes?: Record<string, any>;
}

// Form types
export interface TicketFormData {
    requester_name: string;
    requester_id?: number;
    requester_email?: string;
    title: string;
    source: string;
    status: string;
    urgency: string;
    impact: string;
    priority: string;
    group: string;
    agent: string;
    department: string;
    category: string;
    subcategory: string;
    description: string;
    tags: string[];
}

// Chart and Statistics types
export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
    }[];
}

export interface Stats {
    openCount: number;
    resolvedCount: number;
    majorCount: number;
    unassignedCount: number;
}

// Message types
export interface Message {
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
}