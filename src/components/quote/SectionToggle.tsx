'use client';

import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useState } from 'react';

interface SectionToggleProps {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
  onEdit?: () => void;
  onSettingsClick?: () => void;
  settingsLabel?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function SectionToggle({
  title,
  enabled,
  onToggle,
  children,
  onEdit,
  onSettingsClick,
  settingsLabel = 'Instellingen',
  collapsible = true,
  defaultExpanded = true,
  className = ''
}: SectionToggleProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`border rounded-lg overflow-hidden ${enabled ? 'bg-white' : 'bg-gray-50'} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Toggle switch */}
          <button
            onClick={() => onToggle(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          {/* Title */}
          <h3 className={`font-semibold ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings button (optional) */}
          {enabled && onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>{settingsLabel}</span>
            </button>
          )}

          {/* Expand/Collapse button */}
          {enabled && collapsible && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {enabled && expanded && (
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onEdit}
        >
          {children}
        </div>
      )}

      {/* Disabled state message */}
      {!enabled && (
        <div className="p-4 text-center text-gray-400 text-sm">
          Sectie uitgeschakeld - klik op de toggle om in te schakelen
        </div>
      )}
    </div>
  );
}

export default SectionToggle;
