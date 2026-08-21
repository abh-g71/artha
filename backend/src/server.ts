import app from './app';
import { getConfig } from './config';

const config = getConfig();

const port = config.port || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});
