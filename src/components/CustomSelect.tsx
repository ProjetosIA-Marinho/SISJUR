import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Option {
  value: string;
  label: string;
  avatar?: string;
  color?: string; // Optional dot color
}

interface CustomSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
  variant?: 'default' | 'modal' | 'nav';
}

export function CustomSelect({ label, value, options, onChange, className, variant = 'default' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full text-left", className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2 block mb-2 select-none">
          {label}
        </label>
      )}

      {/* Select button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between text-left focus:outline-none transition-all cursor-pointer",
          variant === 'modal' 
            ? "bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-5 text-slate-850 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 text-sm font-bold"
            : variant === 'nav'
              ? "bg-surface-container-low dark:bg-slate-800/40 border border-surface-container-high dark:border-slate-800/60 rounded-full py-2 px-4 text-on-surface-variant hover:text-primary hover:bg-surface-container text-xs font-bold uppercase tracking-wider shadow-sm"
              : "bg-surface-container-low/50 dark:bg-slate-855 border border-surface-container-high dark:border-slate-800 rounded-[1.5rem] py-4 px-6 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 shadow-sm text-sm font-bold",
          isOpen && "ring-2 ring-primary border-primary"
        )}
      >
        <div className={cn("flex items-center", variant === 'nav' ? "gap-2" : "gap-3")}>
          {/* Avatar or Circle indicator */}
          {selectedOption?.avatar ? (
            <img
              src={selectedOption.avatar}
              alt={selectedOption.label}
              className={cn("rounded-full object-cover border border-white dark:border-slate-800 shadow-sm", variant === 'nav' ? "w-4.5 h-4.5" : "w-7 h-7")}
            />
          ) : (
            <div className={cn(
              "rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center",
              variant === 'nav' ? "w-2.5 h-2.5" : "w-7 h-7",
              selectedOption?.color
            )} />
          )}
          <span className={cn("font-bold", variant === 'nav' ? "text-xs tracking-wider" : "text-sm text-slate-800 dark:text-slate-100")}>
            {selectedOption?.label || value}
          </span>
        </div>
        <ChevronDown 
          size={variant === 'nav' ? 14 : 18} 
          className={cn(
            "text-slate-400 dark:text-slate-500 transition-transform duration-200", 
            isOpen && "rotate-180 text-primary"
          )} 
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl z-50 py-3 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex items-center justify-between px-5 py-3.5 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-all rounded-[1.25rem] mx-2 text-sm font-bold",
                  isSelected ? "bg-slate-50 dark:bg-slate-855 text-primary dark:text-amber-400" : "text-slate-700 dark:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Left Circle/Avatar */}
                  {option.avatar ? (
                    <img
                      src={option.avatar}
                      alt={option.label}
                      className="w-7 h-7 rounded-full object-cover border border-white dark:border-slate-800 shadow-sm"
                    />
                  ) : (
                    <div className={cn(
                      "w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0",
                      option.color
                    )} />
                  )}
                  <span>{option.label}</span>
                </div>
                {/* ChevronRight on the selected option */}
                {isSelected && (
                  <ChevronRight size={18} className="text-primary dark:text-amber-400 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
