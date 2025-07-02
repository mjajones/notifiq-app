import { StatsCardProps } from '../types/ui';

// Small component to display a stat card
export default function StatsCard({ label, count }: StatsCardProps) {
  return (
    <div className="bg-foreground p-4 rounded-lg text-center shadow-sm transition-all hover:shadow-md border border-border">
      <p className="text-2xl font-bold text-text-primary">{count}</p>
      <p className="text-sm text-text-secondary mt-1">{label}</p>
    </div>
  );
}