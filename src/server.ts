import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { sql } from "./lib/postgres";
import postgres from "postgres";

const requestBodySchema = z.object({
  code: z.string().min(3),
  url: z.string().url()
})

const requestParamsSchema = z.object({
  code: z.string().min(3),
})

const app = fastify()

app.post('/api/', async (request: FastifyRequest, reply: FastifyReply) => {
  const { code, url } = requestBodySchema.parse(request.body)
  
  try {

    const result = await sql/* sql */`
    INSERT INTO short_links(code, original_url)
    VALUES (${code},${url})
    RETURNING id
  `

    const link = result[0]

    return reply.status(201).send({ shortLinkId: link.id })

  } catch (error) {

    if (error instanceof postgres.PostgresError) {
      if (error.code === '23505') {
        return reply.status(400).send({message: 'Duplicated code'})
      }
    }

    console.log(error)

    return reply.status(500).send({ message: 'Internal error' })
  }
})

app.get('/:code', async (request: FastifyRequest, reply: FastifyReply) => {
  const { code } = requestParamsSchema.parse(request.params)

  const result = await sql/* sql */`
    SELECT id, original_url
    FROM short_links
    WHERE short_links.code = ${code}
  `

  if (result.length === 0) {
    reply.status(400).send({message: 'Link not found'})
  }
  
  const link = result[0]

  return reply.redirect(301, link.original_url)
})

app.get('/api/fetch-links', async (request: FastifyRequest, reply: FastifyReply) => {
  const result = await sql/*sql*/`
    SELECT *
    FROM short_links
    ORDER BY created_at DESC
  `

  return result
})

app.listen({
  port: 3333
}).then(() => console.log('🔥 Server Running 🔥'))