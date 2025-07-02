import { FiMenu } from 'react-icons/fi';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-foreground md:hidden p-4 border-b border-border sticky top-0 z-10">
      <button onClick={onMenuClick} className="text-text-primary">
        <FiMenu size={24} />
      </button>
    </header>
  );
}