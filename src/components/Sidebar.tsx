import React from 'react';

type ViewType = 'home' | 'all-files' | 'recent';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onNewFolder: () => void;
  totalItems: number;
  totalSize: number;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { icon: 'folder', label: 'All Files', view: 'all-files' as ViewType },
  { icon: 'history', label: 'Recent', view: 'recent' as ViewType },
  { icon: 'group', label: 'Shared', view: null },
  { icon: 'star', label: 'Starred', view: null },
  { icon: 'delete', label: 'Trash', view: null },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  onNewFolder,
  isOpen,
  onClose,
}) => {
  const handleNavClick = (view: ViewType | null) => {
    if (!view) return;
    onViewChange(view);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <nav
        className={`h-screen w-64 flex flex-col pt-24 pb-8 px-4 fixed left-0 top-0 bg-[#fafaf5] z-40 font-sans text-sm font-medium transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Header */}
        <div className="px-4 mb-8">
          <h2 className="text-xs uppercase tracking-widest text-outline-variant font-semibold mb-1">
            Library
          </h2>
          <p className="text-[10px] text-outline-variant opacity-70">Personal Archive</p>
        </div>

        {/* Nav items */}
        <div className="space-y-1 flex-grow">
          {NAV_ITEMS.map(({ icon, label, view }) => {
            const isActive = view !== null && currentView === view;
            return (
              <button
                key={label}
                onClick={() => handleNavClick(view)}
                className={`w-full flex items-center gap-3 py-2 px-4 transition-all duration-300 ease-out text-left ${
                  isActive
                    ? 'border-l-2 border-primary text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container-low pl-[18px]'
                } ${!view ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {icon}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* New Folder button */}
        <div className="mt-auto px-4">
          <button
            onClick={() => { onNewFolder(); onClose(); }}
            className="w-full bg-primary text-on-primary py-3 px-4 rounded-sm font-medium text-xs flex items-center justify-center gap-2 hover:bg-primary-dim transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            New Folder
          </button>
        </div>

        {/* Right border */}
        <div className="bg-surface-container w-[1px] h-full absolute right-0 top-0" />
      </nav>
    </>
  );
};

export default Sidebar;
