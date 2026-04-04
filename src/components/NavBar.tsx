import React, { useState } from 'react';

type ViewType = 'home' | 'all-files' | 'recent';

interface NavBarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onUploadClick: () => void;
  onToggleSidebar: () => void;
}

const NavBar: React.FC<NavBarProps> = ({
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange,
  onUploadClick,
  onToggleSidebar,
}) => {
  const isLibraryView = currentView === 'all-files' || currentView === 'recent';
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-[#fafaf5]/95 backdrop-blur-sm font-sans tracking-tight">
      <div className="flex justify-between items-center px-4 md:px-8 h-16">
        <div className="flex items-center gap-3 md:gap-12">
          {/* Hamburger — mobile only */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
            title="Menu"
          >
            menu
          </button>

          <button
            onClick={() => onViewChange('home')}
            className="text-xl font-bold tracking-tighter text-on-background hover:opacity-80 transition-opacity"
          >
            Manuscript
          </button>

          {/* Nav tabs — desktop only */}
          <div className="hidden md:flex items-center gap-6">
            {isLibraryView ? (
              <>
                <button
                  onClick={() => onViewChange('all-files')}
                  className={`text-sm font-medium transition-colors duration-300 ${
                    currentView === 'all-files'
                      ? 'text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  All Files
                </button>
                <button
                  onClick={() => onViewChange('recent')}
                  className={`text-sm font-medium transition-colors duration-300 ${
                    currentView === 'recent'
                      ? 'text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Recent
                </button>
                <span className="text-on-surface-variant text-sm cursor-not-allowed opacity-50">Shared</span>
              </>
            ) : (
              <>
                <button
                  onClick={() => onViewChange('home')}
                  className="text-primary font-semibold text-sm"
                >
                  Library
                </button>
                <span className="text-on-surface-variant text-sm cursor-not-allowed opacity-50">Workflow</span>
                <span className="text-on-surface-variant text-sm cursor-not-allowed opacity-50">Insights</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Search bar — desktop, hidden on recent view */}
          {currentView !== 'recent' && (
            <div className="hidden md:flex items-center bg-surface-container-low px-4 py-1.5 rounded-sm">
              <span className="material-symbols-outlined text-on-surface-variant mr-2" style={{ fontSize: '18px' }}>
                search
              </span>
              <input
                className="bg-transparent border-none focus:outline-none text-sm w-64 placeholder:text-outline-variant text-on-surface"
                placeholder="Search archive..."
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}

          {/* Mobile search toggle — shown on all-files view only */}
          {currentView === 'all-files' && (
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
              title="Search"
            >
              {mobileSearchOpen ? 'search_off' : 'search'}
            </button>
          )}

          {/* Icon buttons */}
          <button
            onClick={onUploadClick}
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-pointer active:scale-95"
            title="Upload file"
          >
            upload_file
          </button>
          <span className="hidden sm:inline material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-not-allowed opacity-50">
            settings
          </span>
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-not-allowed opacity-50">
            account_circle
          </span>
        </div>
      </div>

      {/* Mobile search bar — expands below navbar */}
      {mobileSearchOpen && currentView === 'all-files' && (
        <div className="md:hidden px-4 pb-3 bg-[#fafaf5]/95">
          <div className="flex items-center bg-surface-container-low px-4 py-2 rounded-sm">
            <span className="material-symbols-outlined text-on-surface-variant mr-2" style={{ fontSize: '18px' }}>
              search
            </span>
            <input
              autoFocus
              className="bg-transparent border-none focus:outline-none text-sm flex-1 placeholder:text-outline-variant text-on-surface"
              placeholder="Search archive..."
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')}>
                <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '18px' }}>close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom border */}
      <div className="bg-surface-container h-[1px] w-full" />
    </header>
  );
};

export default NavBar;
