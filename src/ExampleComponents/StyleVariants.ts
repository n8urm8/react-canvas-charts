// Style variants for Bar Charts
export const barStyleVariants = [
  // Default style
  {},
  // Modern style with rounded bars and gradients
  {
    barComponent: {
      borderRadius: 8,
      showShadow: true,
      gradient: {
        enabled: true,
        direction: 'vertical' as const,
      }
    },
    titleComponent: {
      fontSize: 24,
      color: '#1e40af',
      fontWeight: 'bold',
    },
    gridComponent: {
      color: '#f3f4f6',
      lineDash: [5, 5],
    }
  },
  // Minimalist style
  {
    barComponent: {
      showBorder: true,
      borderColor: '#374151',
      borderWidth: 2,
    },
    titleComponent: {
      fontSize: 18,
      color: '#374151',
      fontWeight: 'normal',
    },
    gridComponent: {
      show: false,
    },
    xAxisComponent: {
      labelColor: '#6b7280',
      color: '#6b7280',
    },
    yAxisComponent: {
      labelColor: '#6b7280',
      color: '#6b7280',
    },
    labelComponent: {
      show: false,
    }
  },
  // Colorful style with custom labels
  {
    barComponent: {
      borderRadius: 12,
      showBorder: true,
      borderColor: '#ffffff',
      borderWidth: 3,
      showShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      shadowBlur: 8,
    },
    titleComponent: {
      fontSize: 22,
      color: '#7c3aed',
      fontWeight: 'bold',
    },
    labelComponent: {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 4,
      padding: 4,
      fontWeight: 'bold',
      color: '#1f2937',
    },
    gridComponent: {
      color: '#e5e7eb',
      opacity: 0.7,
    }
  }
];

// Style variants for Line Charts
export const lineStyleVariants = [
  // Default style
  {},
  // Smooth curves with area fill
  {
    lineComponent: {
      smooth: true,
      lineWidth: 3,
      showShadow: true,
    },
    pointComponent: {
      size: 8,
      showShadow: true,
      borderWidth: 3,
    },
    titleComponent: {
      fontSize: 24,
      color: '#1e40af',
      fontWeight: 'bold',
    },
    fillArea: true,
    fillOpacity: 0.2,
  },
  // Dashed lines with custom points
  {
    lineComponent: {
      lineDash: [10, 5],
      lineWidth: 2,
    },
    pointComponent: {
      shape: 'diamond' as const,
      size: 10,
      hollow: true,
      borderWidth: 2,
    },
    titleComponent: {
      fontSize: 18,
      color: '#374151',
      fontWeight: 'normal',
    },
    gridComponent: {
      show: false,
    },
  },
  // Gradient lines with star points
  {
    lineComponent: {
      gradient: {
        enabled: true,
      },
      lineWidth: 4,
      showShadow: true,
    },
    pointComponent: {
      shape: 'star' as const,
      size: 12,
      showShadow: true,
    },
    titleComponent: {
      fontSize: 22,
      color: '#7c3aed',
      fontWeight: 'bold',
    },
    showValues: true,
    labelComponent: {
      backgroundColor: '#ffffff',
      borderRadius: 4,
      padding: 2,
    },
  }
]; 