import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';

const RAILWAY_DIGEST_BACKEND = 'https://project-eventix-production-228d.up.railway.app';

const getDigestUrl = (path: string) => {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const base = isLocal ? 'http://localhost:8087' : RAILWAY_DIGEST_BACKEND;
  return `${base}${path}`;
};

export const TrafficTracker: React.FC = () => {
  const location = useLocation();
  const lastRecordedPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastRecordedPath.current === location.pathname) {
      return;
    }
    lastRecordedPath.current = location.pathname;

    try {
      let sessionId = sessionStorage.getItem('eventix_session_id');
      if (!sessionId) {
        sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : 'sess-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now();
        sessionStorage.setItem('eventix_session_id', sessionId);
      }

      const user = useAuthStore.getState().user;
      const customerEmail = user?.email || undefined;

      apiClient.post(getDigestUrl('/api/v1/digest/record-visit'), {
        sessionId,
        page: location.pathname,
        customerEmail,
      }).catch(() => {
        // Silently swallow telemetry errors so site usage is completely smooth
      });
    } catch {
      // Silently handle storage errors
    }
  }, [location.pathname]);

  return null;
};
