import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import { v4 } from 'https://deno.land/std/uuid/mod.ts';
import * as yup from 'https://cdn.pika.dev/yup@^0.28.1';

// Types 
interface Repository {
  id?: string;
  name: string;
  tags: string[];
}

interface RequestError extends Error {
  status: number;
}

// Schema Validation 
const repositoryInsertSchema = yup.object().shape({
  name: yup.string().trim().min(2).required(),
  tags: yup.array().required()
});
const repositoryUpdateSchema = yup.object().shape({
  name: yup.string().trim().min(2),
  tags: yup.array()
});

const DB = new Map<string, Repository>();

const router = new Router();

router.get('/', (ctx) => {
  ctx.response.body = {
    message: 'Hello! Come learn with me 🦕'
  };
});

router.get('/repository', (ctx) => {
  ctx.response.body = [...DB.values()];
});

router.post('/repository', async (ctx) => {
  try {
    const body = await ctx.request.body();

    if (body.type !== 'json') throw new Error('Invalid Body type! 🦕');

    const repository = (await repositoryInsertSchema.validate(body.value) as Repository);
    repository.id = v4.generate();
    DB.set(repository.id, repository);
    ctx.response.body = repository;
  } catch (error) {
    error.status = 422;
    throw error;
  }
});

router.put('/repository/:id', async (ctx) => {
  try {
    const body = await ctx.request.body();

    if (body.type !== 'json') throw new Error('Invalid Body type! 🦕');

    const { id } = ctx.params;
    if (id && DB.has(id)) {
      const repositoryToUpdate = (await repositoryUpdateSchema.validate(body.value) as Repository);

      const repository =  {...DB.get(id), ...repositoryToUpdate};
      DB.set(id, repository);

      ctx.response.body = repository
    } else {
      throw new Error('Repository not found! 🦕') as RequestError;
    }
  } catch (error) {
    error.status = 404;
    throw error;
  }
});

router.delete('/repository/:id', (ctx) => {
  const { id } = ctx.params;
  if (id && DB.has(id)) {
    DB.delete(id);
    ctx.response.status = 204;
    ctx.response.body = { 
      message: 'Repository deleted! 🦕'
    }
  } else {
    const error = new Error('Repository not found! 🦕') as RequestError;
    error.status = 404;
    throw error;
  }
});

const app = new Application();

// Error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as RequestError;
    ctx.response.status = error.status || 500;
    ctx.response.body = {
      message: error.message
    };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log('Running Repository Deno Server v1.0.0.0');
console.log('Listening on http://localhost:3333');
await app.listen({ port: 3333 });