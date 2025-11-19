import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ChartToolbarTool {
  id: string;
  label: string;
  icon?: React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
  ariaLabel?: string;
  showLabel?: boolean;
}

export interface ChartToolbarPosition {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
}

export interface ChartToolbarProps {
  tools: ChartToolbarTool[];
  position?: ChartToolbarPosition;
  className?: string;
  buttonClassName?: string;
  activeToolIds?: string[];
  defaultActiveToolIds?: string[];
  onToggle?: (tool: ChartToolbarTool, isActive: boolean, nextActiveToolIds: string[]) => void;
  multiSelect?: boolean;
  visibility?: 'always' | 'hover';
  moveable?: boolean;
  onPositionChange?: (position: ChartToolbarPosition) => void;
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

const toNumeric = (value: number | string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const positionsEqual = (
  a?: ChartToolbarPosition | null,
  b?: ChartToolbarPosition | null
): boolean => {
  const keys: Array<keyof ChartToolbarPosition> = ['top', 'right', 'bottom', 'left'];
  return keys.every((key) => {
    const aValue = toNumeric(a?.[key]);
    const bValue = toNumeric(b?.[key]);
    return aValue === bValue;
  });
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
  moveable = false,
  onPositionChange,
}) => {
  const isControlled = Array.isArray(activeToolIds);
  const [internalActive, setInternalActive] = useState<string[]>(
    () => defaultActiveToolIds ?? []
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<ChartToolbarPosition | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const pointerOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const toolbarSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const latestOnPositionChangeRef = useRef<ChartToolbarProps['onPositionChange'] | undefined>(
    onPositionChange
  );
  const wasDraggingRef = useRef(false);
  const previousUserSelectRef = useRef<string | null>(null);
  const previousCursorRef = useRef<string | null>(null);
  const dragPositionRef = useRef<ChartToolbarPosition | null>(null);
  const pendingPositionRef = useRef<ChartToolbarPosition | null>(null);

  useEffect(() => {
    latestOnPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  const restoreBodyStyles = useCallback(() => {
    if (typeof document === 'undefined') {
      previousUserSelectRef.current = null;
      previousCursorRef.current = null;
      return;
    }
    if (previousUserSelectRef.current !== null) {
      document.body.style.userSelect = previousUserSelectRef.current;
      previousUserSelectRef.current = null;
    }
    if (previousCursorRef.current !== null) {
      document.body.style.cursor = previousCursorRef.current;
      previousCursorRef.current = null;
    }
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const toolbarElement = toolbarRef.current;
    const parentElement = toolbarElement?.parentElement;
    if (!toolbarElement || !parentElement) {
      return;
    }

    const containerRect = parentElement.getBoundingClientRect();
    const { width, height } = toolbarSizeRef.current;
    const offset = pointerOffsetRef.current;

    const rawLeft = event.clientX - containerRect.left - offset.x;
    const rawTop = event.clientY - containerRect.top - offset.y;

    const maxLeft = Math.max(0, containerRect.width - width);
    const maxTop = Math.max(0, containerRect.height - height);

    const left = Math.round(Math.min(Math.max(rawLeft, 0), maxLeft));
    const top = Math.round(Math.min(Math.max(rawTop, 0), maxTop));

    const nextPosition: ChartToolbarPosition = { left, top };

    if (
      dragPositionRef.current &&
      dragPositionRef.current.left === nextPosition.left &&
      dragPositionRef.current.top === nextPosition.top
    ) {
      return;
    }

    dragPositionRef.current = nextPosition;
    pendingPositionRef.current = nextPosition;
    setDragPosition(nextPosition);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!wasDraggingRef.current) {
      return;
    }

    wasDraggingRef.current = false;
    setIsDragging(false);

    const pendingPosition = pendingPositionRef.current;
    pendingPositionRef.current = null;

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
    restoreBodyStyles();

    if (pendingPosition) {
      latestOnPositionChangeRef.current?.(pendingPosition);
    }
  }, [handlePointerMove, restoreBodyStyles]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!moveable) {
        return;
      }

      const toolbarElement = toolbarRef.current;
      const parentElement = toolbarElement?.parentElement;
      if (!toolbarElement || !parentElement) {
        return;
      }

      const toolbarRect = toolbarElement.getBoundingClientRect();
      const parentRect = parentElement.getBoundingClientRect();

      pointerOffsetRef.current = {
        x: event.clientX - toolbarRect.left,
        y: event.clientY - toolbarRect.top,
      };
      toolbarSizeRef.current = {
        width: toolbarRect.width,
        height: toolbarRect.height,
      };
      dragPositionRef.current = {
        left: Math.round(toolbarRect.left - parentRect.left),
        top: Math.round(toolbarRect.top - parentRect.top),
      };
      pendingPositionRef.current = null;
      setDragPosition(dragPositionRef.current);

      if (typeof document !== 'undefined') {
        previousUserSelectRef.current = document.body.style.userSelect;
        previousCursorRef.current = document.body.style.cursor;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }

      wasDraggingRef.current = true;
      setIsDragging(true);

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);

      event.preventDefault();
    },
    [handlePointerMove, handlePointerUp, moveable]
  );

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      restoreBodyStyles();
    },
    [handlePointerMove, handlePointerUp, restoreBodyStyles]
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

  useEffect(() => {
    if (!isDragging && dragPosition && positionsEqual(dragPosition, position ?? null)) {
      dragPositionRef.current = null;
      setDragPosition(null);
    }
  }, [dragPosition, isDragging, position]);

  const appliedPositionStyle = useMemo<React.CSSProperties>(() => {
    if (dragPosition) {
      return {
        top: `${dragPosition.top ?? 0}px`,
        left: `${dragPosition.left ?? 0}px`,
        right: 'auto',
        bottom: 'auto',
      };
    }

    return positionStyle;
  }, [dragPosition, positionStyle]);

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
      ref={toolbarRef}
      className={cn(
        'absolute z-20 flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white/90 p-2 shadow-sm backdrop-blur-sm transition-opacity duration-150 ease-out',
        visibility === 'hover'
          ? 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto'
          : 'opacity-100 pointer-events-auto',
        moveable && visibility === 'hover' ? 'cursor-default' : undefined,
        className
      )}
  style={appliedPositionStyle}
    >
      {moveable ? (
        <div
          className={cn(
            'mr-2 flex h-full items-center border-r border-gray-200 pr-2 text-gray-400 transition-colors',
            isDragging ? 'cursor-grabbing text-gray-500' : 'cursor-grab hover:text-gray-500'
          )}
          onPointerDown={handlePointerDown}
          role="presentation"
          aria-hidden="true"
          title="Drag to reposition"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
          <span className="sr-only">Move toolbar</span>
        </div>
      ) : null}
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
