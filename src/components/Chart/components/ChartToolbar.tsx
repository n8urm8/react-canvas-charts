import React, { useMemo, useState } from 'react';
import { cn } from '../../../utils/cn';

export interface ChartToolbarTool {
  id: string;
  label: string;
  icon?: React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
  ariaLabel?: string;
  showLabel?: boolean;
}

export interface ChartToolbarProps {
  tools: ChartToolbarTool[];
  position?: {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
  };
  className?: string;
  buttonClassName?: string;
  activeToolIds?: string[];
  defaultActiveToolIds?: string[];
  onToggle?: (tool: ChartToolbarTool, isActive: boolean, nextActiveToolIds: string[]) => void;
  multiSelect?: boolean;
  visibility?: 'always' | 'hover';
}

const formatPositionValue = (value: number | string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
};

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  tools,
  position,
  className,
  buttonClassName,
  activeToolIds,
  defaultActiveToolIds,
  onToggle,
  multiSelect = true,
  visibility = 'always',
}) => {
  const isControlled = Array.isArray(activeToolIds);
  const [internalActive, setInternalActive] = useState<string[]>(
    () => defaultActiveToolIds ?? []
  );

  const resolvedActive = useMemo(
    () => (isControlled ? activeToolIds ?? [] : internalActive),
    [activeToolIds, internalActive, isControlled]
  );

  const positionStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {};
    const top = formatPositionValue(position?.top);
    const right = formatPositionValue(position?.right);
    const bottom = formatPositionValue(position?.bottom);
    const left = formatPositionValue(position?.left);

    if (top !== undefined) {
      style.top = top;
    } else if (bottom === undefined) {
      style.top = '16px';
    }

    if (left !== undefined) {
      style.left = left;
    } else if (right === undefined) {
      style.left = '16px';
    }

    if (right !== undefined) {
      style.right = right;
    }

    if (bottom !== undefined) {
      style.bottom = bottom;
    }

    return style;
  }, [position]);

  if (!tools || tools.length === 0) {
    return null;
  }

  const handleToggle = (tool: ChartToolbarTool) => {
    if (tool.disabled) {
      return;
    }

    const isActive = resolvedActive.includes(tool.id);
    let nextActive: string[];

    if (multiSelect) {
      if (isActive) {
        nextActive = resolvedActive.filter((id) => id !== tool.id);
      } else {
        nextActive = [...resolvedActive, tool.id];
      }
    } else {
      nextActive = isActive ? [] : [tool.id];
    }

    if (!isControlled) {
      setInternalActive(nextActive);
    }

    onToggle?.(tool, !isActive, nextActive);
  };

  return (
    <div
      className={cn(
        'absolute z-20 flex flex-wrap gap-2 rounded-md border border-gray-200 bg-white/90 p-2 shadow-sm backdrop-blur-sm transition-opacity duration-150 ease-out',
        visibility === 'hover'
          ? 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto'
          : 'opacity-100 pointer-events-auto',
        className
      )}
      style={positionStyle}
    >
      {tools.map((tool) => {
        const isActive = resolvedActive.includes(tool.id);
        const showLabel = tool.showLabel ?? true;
        const ariaLabel = tool.ariaLabel ?? tool.label;
        const hasIcon = Boolean(tool.icon);
        return (
          <button
            key={tool.id}
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
              isActive
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white/70 text-gray-700 hover:bg-gray-100',
              tool.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              buttonClassName
            )}
            onClick={() => handleToggle(tool)}
            title={tool.tooltip}
            disabled={tool.disabled}
            aria-pressed={isActive}
            aria-label={ariaLabel}
          >
            {hasIcon ? (
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  showLabel ? 'mr-2' : ''
                )}
                aria-hidden
              >
                {tool.icon}
              </span>
            ) : null}
            {showLabel ? (
              <span>{tool.label}</span>
            ) : (
              <span className="sr-only">{ariaLabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
