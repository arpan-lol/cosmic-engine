import { GenerationService } from '../../llm/generation.service'
import { buildQEPrompt } from '../../llm/prompts/query-expansion.prompt'
import { logger } from '../../../utils/logger.util'
import prisma from 'src/prisma/client'

const MIN_QUERY_LENGTH_FOR_EXPANSION = 3
const MAX_QUERY_LENGTH_FOR_EXPANSION = 200
const DEFAULT_TEMPERATURE = 0.5
const DEFAULT_MAX_TOKENS = 300

export class QueryExpansionService {
  static async expand(
    query: string,
    attachmentIds?: string[],
    options?: {
      enabled?: boolean
      temperature?: number
      maxExpansionLength?: number
    }
  ): Promise<string> {
    if (!options?.enabled) {
      return query
    }

    const trimmedQuery = query.trim()
    
    if (trimmedQuery.length < MIN_QUERY_LENGTH_FOR_EXPANSION) {
      logger.warn('[QueryExpansion]', 'Query too short for expansion', { queryLength: trimmedQuery.length })
      return query
    }

    if (trimmedQuery.length > MAX_QUERY_LENGTH_FOR_EXPANSION) {
      logger.info('[QueryExpansion]', 'Query already detailed, skipping expansion', { queryLength: trimmedQuery.length })
      return query
    }

    const temperature = options.temperature ?? DEFAULT_TEMPERATURE
    const maxTokens = options.maxExpansionLength ?? DEFAULT_MAX_TOKENS

    try {
      const attachmentsPromise =
        attachmentIds && attachmentIds.length > 0
          ? prisma.attachment.findMany({
              where: { id: { in: attachmentIds } },
              select: { filename: true },
            })
          : Promise.resolve([])

      const attachments = await attachmentsPromise

      const systemPrompt = buildQEPrompt(
        attachments.map(a => a.filename)
      )

      const response = await GenerationService.generate({
        systemPrompt,
        userPrompt: trimmedQuery,
        temperature,
        maxTokens,
      })

      const expanded = response?.trim()

      if (!expanded) {
        logger.warn('[QueryExpansion]', 'Empty expansion, falling back', {
          query: trimmedQuery,
        })
        return query
      }

      if (expanded.length < trimmedQuery.length * 0.8) {
        logger.warn('[QueryExpansion]', 'Expansion shorter than original, falling back', {
          original: trimmedQuery,
          expanded,
        })
        return query
      }

      if (expanded.toLowerCase() === trimmedQuery.toLowerCase()) {
        logger.info('[QueryExpansion]', 'Expansion identical to original, using original', {
          query: trimmedQuery,
        })
        return query
      }

      logger.info('[QueryExpansion] Expanded query', JSON.stringify({
        original: trimmedQuery,
        expanded,
        temperature,
        originalLength: trimmedQuery.length,
        expandedLength: expanded.length,
        attachments: attachments.map(a => a.filename),
      }))

      return expanded
    } catch (error) {
      logger.error(
        '[QueryExpansion]',  'Expansion failed, falling back',
        error instanceof Error ? error : undefined
      )
      return query
    }
  }
}
