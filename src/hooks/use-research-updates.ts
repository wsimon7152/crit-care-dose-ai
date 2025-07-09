import { useEffect, useState } from 'react';
import { Research } from '../types';
import { toast } from 'sonner';

export const useResearchUpdates = () => {
  const [lastResearchUpdate, setLastResearchUpdate] = useState<number>(0);

  useEffect(() => {
    const checkForResearchChanges = () => {
      const saved = localStorage.getItem('researchList');
      if (!saved) return;

      const currentResearch: Research[] = JSON.parse(saved);
      const currentTimestamp = Math.max(...currentResearch.map(r => new Date(r.uploadedAt).getTime()));

      if (currentTimestamp > lastResearchUpdate && lastResearchUpdate > 0) {
        // New research added or existing research modified
        const recentChanges = currentResearch.filter(r => 
          new Date(r.uploadedAt).getTime() > lastResearchUpdate
        );

        const newApproved = recentChanges.filter(r => r.status === 'approved');
        const newRevoked = currentResearch.filter(r => r.status === 'revoked');

        if (newApproved.length > 0) {
          toast.success(
            `${newApproved.length} study/studies approved - dosing recommendations will be updated`,
            { duration: 5000 }
          );
        }

        if (newRevoked.length > 0) {
          toast.warning(
            `Studies have been revoked - all calculations automatically updated`,
            { duration: 5000 }
          );
        }
      }

      setLastResearchUpdate(currentTimestamp);
    };

    // Check initially
    checkForResearchChanges();

    // Set up periodic checking
    const interval = setInterval(checkForResearchChanges, 2000);

    return () => clearInterval(interval);
  }, [lastResearchUpdate]);

  return { lastResearchUpdate };
};