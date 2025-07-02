import { ReactNode } from 'react';

// Component prop types
export interface StatsCardProps {
    label: string;
    count: number;
}

export interface ChartCardProps {
    title: string;
    data: {
        labels: string[];
        values: number[];
    };
    colors?: {
        light: string[];
        dark: string[];
    };
}

export interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: ReactNode;
}

export interface EditLabelsModalProps {
    open: boolean;
    onClose: () => void;
    labels: Array<{ id: number; name: string; color?: string }>;
    onUpdate: (label: { id: number; name: string; color?: string }) => void;
    onCreate: (name: string, color: string) => void;
    onDelete: (id: number) => void;
}

export interface StatusSelectorProps {
    options: Array<{ id: number; name: string; color?: string }>;
    value?: { id: number; name: string; color?: string };
    onChange: (option: { id: number; name: string; color?: string }) => void;
    onEditLabels?: () => void;
}

export interface StatusSelectorDropdownProps extends StatusSelectorProps {
    onSelect: (option: { id: number; name: string; color?: string }) => void;
    onClose: () => void;
    targetRect: DOMRect | null;
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
}