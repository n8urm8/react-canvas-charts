import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '../../utils/cn';

export interface CanvasWrapperProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  onDraw: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
  style?: React.CSSProperties;
  onMouseMove?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onMouseLeave?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onClick?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
  onMouseEnter?: (event: MouseEvent, canvas: HTMLCanvasElement) => void;
}

export const CanvasWrapper: React.FC<CanvasWrapperProps> = ({
  width = 800,
  height = 400,
  className,
  onDraw,
  style,
  onMouseMove,
  onMouseLeave,
  onClick,
  onMouseEnter,
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
    
    // Call the drawing function
    onDraw(context, canvas);
  }, [onDraw, dimensions]);

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

    const handleMouseMove = (event: MouseEvent) => {
      onMouseMove?.(event, canvas);
      draw(); // Redraw to show cursor
    };

    const handleMouseLeave = (event: MouseEvent) => {
      onMouseLeave?.(event, canvas);
      draw(); // Redraw to hide cursor
    };

    const handleClick = (event: MouseEvent) => {
      onClick?.(event, canvas);
    };

    const handleMouseEnter = (event: MouseEvent) => {
      onMouseEnter?.(event, canvas);
    };

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

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [onMouseMove, onMouseLeave, onClick, onMouseEnter, draw]);

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
      className={cn('block', className)}
      style={containerStyle}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
