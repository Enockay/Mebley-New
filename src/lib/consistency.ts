import { pgQuery } from '@/lib/postgres'

export async function recordConsistencyIssue(params: {
  entityType: string
  entityId: string
  source: string
  severity?: 'warning' | 'critical'
  details?: Record<string, unknown>
}) {
  try {
    await pgQuery(
      `
      INSERT INTO consistency_issues (entity_type, entity_id, source, severity, details)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        params.entityType,
        params.entityId,
        params.source,
        params.severity ?? 'warning',
        JSON.stringify(params.details ?? {}),
      ]
    )
  } catch (error) {
    console.error('[consistency] failed to persist issue:', error)
  }
}

