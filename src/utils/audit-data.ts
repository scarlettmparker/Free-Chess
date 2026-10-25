import { defineLoader } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import { AuditLogsDocument, type AuditLogsQuery } from '~/generated/graphql';

/**
 * Loads the admin audit log.
 */
defineLoader({
  pattern: 'adminAudit',
  async loader() {
    try {
      const result = await executeDocument<AuditLogsQuery>(AuditLogsDocument, {
        pagination: { page: 0, size: 200 },
      });
      if (result?.success && result.data) {
        return { adminAudit: result.data.medusaQueries.auditLogs.items ?? [] };
      }
      return { adminAudit: [] };
    } catch (error) {
      console.error('Failed to load audit log:', error);
      return { adminAudit: [] };
    }
  },
});