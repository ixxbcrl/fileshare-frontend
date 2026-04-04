import type { BreadcrumbItem } from '../types';

interface BreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate: (directoryId: string | null) => void;
}

const Breadcrumb = ({ path, onNavigate }: BreadcrumbProps) => {
  return (
    <nav className="flex items-center gap-2 text-xs text-on-surface-variant overflow-x-auto">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-on-surface transition-colors flex-shrink-0"
      >
        Library
      </button>

      {path.map((item, index) => (
        <div key={item.id || 'root'} className="flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            chevron_right
          </span>
          <button
            onClick={() => onNavigate(item.id)}
            className={`transition-colors ${
              index === path.length - 1
                ? 'text-on-surface font-medium'
                : 'hover:text-on-surface'
            }`}
          >
            {item.name}
          </button>
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
