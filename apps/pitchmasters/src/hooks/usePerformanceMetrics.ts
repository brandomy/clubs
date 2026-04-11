import { logger } from '../utils/logger'
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  inp: number | null; // Interaction to Next Paint
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    cls: null,
    fcp: null,
    inp: null
  });

  useEffect(() => {
    // Track LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
      }
    });

    // Track CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count unexpected layout shifts
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          clsValue += (entry as PerformanceEntry & { value?: number }).value ?? 0;
        }
      }
      setMetrics(prev => ({ ...prev, cls: clsValue }));
    });

    // Track FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      logger.warn('Performance Observer not supported:', error);
    }

    // Track page load time
    const handleLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        logger.log('Page Load Metrics:', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        });
      }
    };

    window.addEventListener('load', handleLoad);

    return () => {
      lcpObserver.disconnect();
      clsObserver.disconnect();
      fcpObserver.disconnect();
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Function to log metrics for debugging
  const logMetrics = () => {
    logger.log('Performance Metrics:', {
      LCP: metrics.lcp ? `${metrics.lcp.toFixed(2)}ms` : 'Not measured',
      CLS: metrics.cls ? metrics.cls.toFixed(4) : 'Not measured',
      FCP: metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'Not measured',
      thresholds: {
        LCP: '< 2500ms (good), < 4000ms (needs improvement)',
        CLS: '< 0.1 (good), < 0.25 (needs improvement)',
        FCP: '< 1800ms (good), < 3000ms (needs improvement)'
      }
    });
  };

  return {
    metrics,
    logMetrics,
    isGoodLCP: metrics.lcp !== null && metrics.lcp < 2500,
    isGoodCLS: metrics.cls !== null && metrics.cls < 0.1,
    isGoodFCP: metrics.fcp !== null && metrics.fcp < 1800
  };
}

// Hook for tracking user interactions and responsiveness
export function useInteractionMetrics() {
  const [interactionCount, setInteractionCount] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);

  useEffect(() => {
    const responseTimes: number[] = [];

    const trackInteraction = (startTime: number) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      setInteractionCount(prev => prev + 1);
      setAvgResponseTime(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    };

    const handleClick = () => {
      const startTime = performance.now();
      requestAnimationFrame(() => trackInteraction(startTime));
    };

    const handleKeyPress = () => {
      const startTime = performance.now();
      requestAnimationFrame(() => trackInteraction(startTime));
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  return {
    interactionCount,
    avgResponseTime,
    isResponsive: avgResponseTime !== null && avgResponseTime < 100
  };
}