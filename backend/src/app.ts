import express from 'express';
import healthRouter from './routes/health';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import intentRouter from './routes/intent';

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use('/api/health', healthRouter);
app.use('/api/intent', intentRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;
