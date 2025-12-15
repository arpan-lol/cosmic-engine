import { GenerationService } from '../../llm/generation.service'
import { buildQEPrompt } from '../../llm/prompts/query-expansion.prompt'
import { logger } from '../../../utils/logger.util'
import prisma from 'src/prisma/client'

type ExpansionStyle = 'conservative' | 'moderate' | 'aggressive'

const STYLE_TO_TEMPERATURE: Record<ExpansionStyle, number> = {
  conservative: 0.3,
  moderate: 0.5,
  aggressive: 0.7,
}

export class QueryExpansionService {
  static async expand(
    query: string,
    attachmentIds?: string[],
    options?: {
      enabled?: boolean
      expansionStyle?: ExpansionStyle
      maxExpansionLength?: number
    }
  ): Promise<string> {
    if (!options?.enabled) {
      return query
    }

    const temperature =
      STYLE_TO_TEMPERATURE[options.expansionStyle ?? 'moderate']

    const maxTokens = options.maxExpansionLength ?? 200

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
        userPrompt: query,
        temperature,
        maxTokens,
      })

      const expanded = response?.trim()

      if (!expanded) {
        logger.warn('[QueryExpansion]', 'Empty expansion, falling back', {
          query,
        })
        return query
      }

      logger.info('[QueryExpansion] Expanded query', JSON.stringify({
        original: query,
        expanded,
        temperature,
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
