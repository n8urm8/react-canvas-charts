import { useRef, useEffect, useCallback, useState } from 'react';

export interface CanvasWrapperProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  onDraw: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
  debugLabel?: string;
  style?: React.CSSProperties;
  onMouseMove?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onMouseLeave?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onClick?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onMouseEnter?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onMouseDown?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onMouseUp?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onTouchStart?: (event: TouchEvent, canvas: HTMLCanvasElement) => void;
  onTouchMove?: (event: TouchEvent, canvas: HTMLCanvasElement) => void;
  onTouchEnd?: (event: TouchEvent, canvas: HTMLCanvasElement) => void;
  canvasClassName?: string;
  canvasStyle?: React.CSSProperties;
  redrawOnPointerEvents?: boolean;
  onRegisterRedraw?: (redraw: (() => void) | null) => void;
}

export const CanvasWrapper: React.FC<CanvasWrapperProps> = ({
  width = 800,
  height = 400,
  className,
  onDraw,
  debugLabel,
  style,
  onMouseMove,
  onMouseLeave,
  onClick,
  onMouseEnter,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  canvasClassName,
  canvasStyle,
  redrawOnPointerEvents = true,
  onRegisterRedraw,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let newWidth: number;
    let newHeight: number;

    // Handle width
    if (typeof width === 'string') {
      newWidth = rect.width;
    } else {
      newWidth = width;
    }

    // Handle height
    if (typeof height === 'string') {
      newHeight = rect.height;
    } else {
      newHeight = height;
    }

    setDimensions({ width: newWidth, height: newHeight });
  }, [width, height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set up high DPI rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    canvas.width = dimensions.width * devicePixelRatio;
    canvas.height = dimensions.height * devicePixelRatio;
    
    context.scale(devicePixelRatio, devicePixelRatio);
    
    // Clear the canvas
    context.clearRect(0, 0, dimensions.width, dimensions.height);

    // Debug logging
    if (debugLabel) {
      console.log(`redrawing canvas: ${debugLabel}`);
    } else {
      console.log('redrawing canvas');
    }
    
    // Call the drawing function
    onDraw(context, canvas);
  }, [debugLabel, dimensions, onDraw]);

  useEffect(() => {
    if (!onRegisterRedraw) {
      return;
    }

    onRegisterRedraw(draw);
    return () => {
      onRegisterRedraw(null);
    };
  }, [draw, onRegisterRedraw]);

  useEffect(() => {
    updateDimensions();
  }, [updateDimensions]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  // Use ResizeObserver for container size changes (responsive sizing)
  useEffect(() => {
    if (!containerRef.current || (typeof width === 'number' && typeof height === 'number')) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions, width, height]);

  // Add mouse event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Helper to call handler and optionally redraw
    const handleEventWithRedraw = <T extends Event>(
      handler: ((event: T, canvas: HTMLCanvasElement) => void) | undefined,
      event: T,
      shouldRedraw: boolean = true
    ) => {
      handler?.(event, canvas);
      if (shouldRedraw && redrawOnPointerEvents) {
        draw();
      }
    };

    const handleMouseMove = (event: MouseEvent) => handleEventWithRedraw(onMouseMove, event);
    const handleMouseLeave = (event: MouseEvent) => handleEventWithRedraw(onMouseLeave, event);
    const handleClick = (event: MouseEvent) => handleEventWithRedraw(onClick, event, false);
    const handleMouseEnter = (event: MouseEvent) => handleEventWithRedraw(onMouseEnter, event, false);
    const handleMouseDown = (event: MouseEvent) => handleEventWithRedraw(onMouseDown, event);
    const handleMouseUp = (event: MouseEvent) => handleEventWithRedraw(onMouseUp, event);
    const handleTouchStart = (event: TouchEvent) => handleEventWithRedraw(onTouchStart, event);
    const handleTouchMove = (event: TouchEvent) => handleEventWithRedraw(onTouchMove, event);
    const handleTouchEnd = (event: TouchEvent) => handleEventWithRedraw(onTouchEnd, event);

    if (onMouseMove) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }
    if (onMouseLeave) {
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }
    if (onClick) {
      canvas.addEventListener('click', handleClick);
    }
    if (onMouseEnter) {
      canvas.addEventListener('mouseenter', handleMouseEnter);
    }
    if (onMouseDown) {
      canvas.addEventListener('mousedown', handleMouseDown);
    }
    if (onMouseUp) {
      canvas.addEventListener('mouseup', handleMouseUp);
    }
    if (onTouchStart) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    }
    if (onTouchMove) {
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    if (onTouchEnd) {
      canvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onMouseMove, onMouseLeave, onClick, onMouseEnter, onMouseDown, onMouseUp, onTouchStart, onTouchMove, onTouchEnd, draw, redrawOnPointerEvents]);

  // Determine container styles based on width/height types
  const containerStyle: React.CSSProperties = {
    ...style,
  };

  if (typeof width === 'string') {
    containerStyle.width = width;
  } else {
    containerStyle.width = `${width}px`;
  }

  if (typeof height === 'string') {
    containerStyle.height = height;
  } else {
    containerStyle.height = `${height}px`;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ display: 'block', ...containerStyle }}
    >
      <canvas
        ref={canvasRef}
        className={canvasClassName}
        style={{
          width: '100%',
          height: '100%',
          ...canvasStyle,
        }}
      />
    </div>
  );
};
