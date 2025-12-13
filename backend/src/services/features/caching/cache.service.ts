import { Prisma } from '@prisma/client'
import crypto from 'crypto'
import prisma from 'src/prisma/client'
import { RetrievalOptions } from 'src/types/chat.types'

function normalizeQuery(q: string) {
  return q
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[?.!,;:]+$/, '')
}

export function buildQueryCacheKey(params: {
  sessionId: string
  query: string
  attachmentIds: string[]
  options?: RetrievalOptions
}) {
  const payload = {
    sessionId: params.sessionId,
    query: normalizeQuery(params.query),
    attachments: [...params.attachmentIds].sort(),
    options: {
      bm25: !!params.options?.bm25,
      rrf: !!params.options?.rrf,
    },
  }

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
}

export class QueryCacheService {
    static async check(cacheKey: string) {
        return prisma.queryRequestCache.findUnique({
            where: { cacheKey },
        })
    }

    static async recordRequest(params: {
        cacheKey: string
        sessionId: string
        query: string
        attachmentIds: string[]
        options?: RetrievalOptions
    }) {
        return prisma.queryRequestCache.upsert({
            where: { cacheKey: params.cacheKey },
            update: { lastSeenAt: new Date() },
            create: {
                cacheKey: params.cacheKey,
                sessionId: params.sessionId,
                query: params.query,
                attachments: params.attachmentIds,
                options: params.options
                    ? (params.options as Prisma.InputJsonValue)
                    : {},
            },
        })
    }


    static async attachAssistantMessage(cacheKey: string, messageId: string) {
        await prisma.queryRequestCache.update({
            where: { cacheKey },
            data: { assistantMessageId: messageId },
        })
    }

    static async getCachedResponse(cacheKey: string) {
        const cache = await prisma.queryRequestCache.findUnique({
            where: { cacheKey },
        })

        if (!cache?.assistantMessageId) return null

        return prisma.chat.findUnique({
            where: { id: cache.assistantMessageId },
        })
    }
}