import { createServerStack } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const { httpServer } = createServerStack();

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Mastery League server listening on http://0.0.0.0:${port}`);
});
