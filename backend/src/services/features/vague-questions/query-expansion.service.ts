import { GenerationService } from '../../llm/generation.service'
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

      const attachmentContext =
        attachments.length > 0
          ? `The query may be related to the following document names:\n${attachments
              .map(a => `- ${a.filename}`)
              .join('\n')}\n\n`
          : ''

      const systemPrompt =
        `You are a query expansion expert.
Expand the following query by adding related terms, synonyms, and contextual details that preserve the original intent. ${attachmentContext}
Return only the expanded query without explanations.`

      const response = await GenerationService.generate({
        systemPrompt,
        userPrompt: query,
        temperature,
        maxTokens,
      })

      console.log('ANKJADN', response)

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
