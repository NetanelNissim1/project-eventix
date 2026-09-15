import React from 'react';
import { AuditLogsView } from '../components/AuditLogsView';

export const AuditPage: React.FC = () => {
  return (
    <div className="pb-16 max-w-6xl mx-auto">
      <AuditLogsView />
    </div>
  );
};
