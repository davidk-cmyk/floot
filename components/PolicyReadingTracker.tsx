import React, { useEffect, useRef, useState } from 'react';
import { useStartReadingSession, useUpdateReadingSession } from '../helpers/usePolicyReading';
import { useAuth } from '../helpers/useAuth';
import { Progress } from './Progress';
import styles from './PolicyReadingTracker.module.css';

interface PolicyReadingTrackerProps {
  policyId: number;
  contentContainerRef: React.RefObject<HTMLElement | null>;
  className?: string;
  onProgressChange?: (progress: number) => void;
}

export const PolicyReadingTracker: React.FC<PolicyReadingTrackerProps> = ({ policyId, contentContainerRef, className, onProgressChange }) => {
  const props = { onProgressChange };
  const [progress, setProgress] = useState(0);
  const { authState } = useAuth();
  const startSession = useStartReadingSession();
  const updateSession = useUpdateReadingSession();
  const sessionIdRef = useRef<number | null>(null);
  const timeSpentIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeSpentRef = useRef(0);

  useEffect(() => {
    // Only track reading sessions for authenticated users
    if (authState.type !== 'authenticated') {
      return;
    }

    startSession.mutate({ policyId }, {
      onSuccess: (data) => {
        sessionIdRef.current = data.id;
        timeSpentRef.current = data.timeSpentSeconds || 0;

        // Start tracking time spent
        timeSpentIntervalRef.current = setInterval(() => {
          timeSpentRef.current += 1;
        }, 1000);
      },
      onError: (error) => {
        console.error("Failed to start reading session:", error);
      }
    });

    return () => {
      if (timeSpentIntervalRef.current) {
        clearInterval(timeSpentIntervalRef.current);
      }
      // On unmount, send a final update
      if (sessionIdRef.current) {
        updateSession.mutate({
          sessionId: sessionIdRef.current,
          completionPercentage: progress,
          pagesVisited: 0,
          isFinalUpdate: true,
        });
      }
    };
  }, [policyId, authState.type]);

  useEffect(() => {
    const container = contentContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight <= clientHeight) {
        setProgress(100);
        return;
      }
      const currentProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      const newProgress = Math.min(100, Math.max(0, currentProgress));
      setProgress(newProgress);
      if (props.onProgressChange) {
        props.onProgressChange(newProgress);
      }
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [contentContainerRef]);

  // Periodically update the session in the background
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (sessionIdRef.current) {
        updateSession.mutate({
          sessionId: sessionIdRef.current,
          completionPercentage: progress,
          pagesVisited: 0,
          isFinalUpdate: false,
        });
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(updateInterval);
  }, [progress]);

  return (
    <div className={`${styles.trackerContainer} ${className || ''}`}>
      <Progress value={progress} />
      <span className={styles.progressLabel}>{Math.round(progress)}% Read</span>
    </div>
  );
};