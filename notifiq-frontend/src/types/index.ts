// User and Authentication Types
export interface User {
    user_id: number;
    username: string;
    is_staff: boolean;
    email: string;
    exp: number;
    groups?: string[];
    is_superuser?: boolean;
    first_name?: string;
    last_name?: string;
    id?: number;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

// Ticket Types
export interface TicketStatus {
    id: number;
    name: string;
}

export interface Ticket {
    id: number;
    title: string;
    description: string;
    requester_name: string;
    status: TicketStatus;
    priority: string;
    category: string;
    subcategory?: string;
    agent?: User | null;
    submitted_at: string;
    due_date?: string;
    tags?: string[];
    activity_log?: ActivityLogItem[];
}

export interface ActivityLogItem {
    id: number;
    activity_type: string;
    user: string;
    timestamp: string;
    note?: string;
}

// Form Types
export interface TicketFormData {
    requester_name: string;
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

export interface Message {
    type: 'success' | 'error';
    text: string;
}

// Component Props Types
export interface HeaderProps {
    onMenuClick?: () => void;
}

export interface StatsCardProps {
    label: string;
    value: string | number;
    large?: boolean;
}

export interface TicketListProps {
    title: string;
    tickets: Ticket[];
    employees: User[];
}

// Environment Variables
declare global {
    interface ImportMeta {
        env: {
            VITE_API_URL?: string;
            [key: string]: any;
        };
    }
}