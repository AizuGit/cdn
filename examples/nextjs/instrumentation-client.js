// instrumentation-client.js
import { Aizu } from "aizu-js";

const aizu = new Aizu({
  apiKey: process.env.NEXT_PUBLIC_YORIN_PUBLISHABLE_KEY,
  apiUrl: process.env.NEXT_PUBLIC_YORIN_API_URL,
});

aizu.init();

export { aizu };
