import { Home, ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '../types';

interface BreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate: (directoryId: string | null) => void;
}

const Breadcrumb = ({ path, onNavigate }: BreadcrumbProps) => {
  return (
    <nav className="flex items-center space-x-1 overflow-x-auto py-2 px-1">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        title="Home"
      >
        <Home className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Home</span>
      </button>

      {path.map((item, index) => (
        <div key={item.id || 'root'} className="flex items-center flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          <button
            onClick={() => onNavigate(item.id)}
            className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
              index === path.length - 1
                ? 'font-semibold text-blue-600 bg-blue-50'
                : 'font-medium text-gray-700 hover:bg-gray-100'
            }`}
            title={item.name}
          >
            <span className="max-w-[150px] sm:max-w-[200px] truncate inline-block">
              {item.name}
            </span>
          </button>
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
