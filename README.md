# Aizu Analytics JavaScript SDK

A powerful, lightweight analytics SDK for tracking user interactions and events in web applications. Built with TypeScript, featuring automatic retries, event batching, and comprehensive browser support.

## Features

- **Event Tracking**: Track pageviews, custom events, and user interactions
- **Analytics-First**: All events stored for analytics (no database modifications)
- **User Identification**: Associate events with users and groups for analytics tracking
- **Automatic Retries**: Built-in exponential backoff for failed requests
- **Event Batching**: Optimize performance by batching multiple events
- **Session Management**: Automatic session tracking with configurable timeout
- **Type Safety**: Full TypeScript support with branded types
- **Browser Support**: Works with all modern browsers and frameworks
- **SSR Compatible**: Server-side rendering support for Next.js, Nuxt, etc.
- **Privacy-First**: GDPR-compliant with configurable data collection

## Security Model

**This is a client-side SDK that uses publishable keys (`pk_*`) for analytics tracking only.**

### What This SDK Does:

- ✅ **Analytics Tracking**: All events stored in ClickHouse for analytics and insights
- ✅ **Session Management**: Track user sessions and interactions
- ✅ **Event Attribution**: Associate events with users and groups for analytics
- ✅ **Behavioral Analysis**: Track pageviews, clicks, and custom events

### What This SDK Does NOT Do:

- ❌ **Contact Creation**: Does not create or modify contact records in your database
- ❌ **User Management**: Does not create user accounts or profiles
- ❌ **Group Management**: Does not create or modify organization/team records
- ❌ **Data Modifications**: No write access to operational databases

### For Full CRUD Operations:

Use the server-side SDK (aizu-nodejs) with secret keys (`sk_*`) for:

- Creating/updating contacts and groups
- Managing user profiles and organizations
- Database operations and user management

## Installation

```bash
npm install aizu
```

or

```bash
yarn add aizu
```

## Quick Start

```javascript
import { Aizu } from "aizu";

// Initialize the SDK
const aizu = new Aizu({
  apiKey: "pk_your_publishable_key",
  apiUrl: "https://us.aizu.io",
  debug: true, // Enable debug logging in development
});

// Initialize and start tracking
await aizu.init();

// Track a pageview
await aizu.pageview();

// Track custom events
await aizu.track("button_clicked", {
  button_id: "signup-cta",
  page: "/homepage",
});

// Identify users (analytics tracking only)
await aizu.identify("user_123", {
  $email: "user@example.com",
  $first_name: "John",
  $last_name: "Doe",
  subscription_tier: "premium",
});
```

## Configuration Options

```typescript
interface AizuConfig {
  apiKey: string; // Required: Your publishable API key (must start with 'pk_')
  apiUrl: string; // Required: Your Aizu API endpoint
  autoTrackPageviews?: boolean; // Auto-track page views (default: true)
  autoTrackClicks?: boolean; // Auto-track clicks on elements with data-aizu-track (default: false)
  debug?: boolean; // Enable debug logging (default: false)
  sessionTimeout?: number; // Session timeout in milliseconds (default: 30 minutes)
  batchSize?: number; // Events to batch before sending (default: 20)
  flushInterval?: number; // Auto-flush interval in ms (default: 1000)
  enableBatching?: boolean; // Enable event batching (default: true)
}
```

**Important**:

- Only use **publishable keys** (`pk_*`) with this client-side SDK
- Never use secret keys (`sk_*`) in frontend applications
- All events are for analytics tracking only

## API Reference

### Core Methods

#### `init()`

Initialize the SDK and start auto-tracking if configured.

```typescript
await aizu.init();
```

#### `pageview(properties?)`

Track a pageview with optional custom properties.

```typescript
await aizu.pageview({
  title: "Product Page",
  category: "electronics",
  product_id: "SKU-123",
});
```

#### `track(eventName, properties?)`

Track custom events with properties.

```typescript
await aizu.track("add_to_cart", {
  product_id: "SKU-123",
  quantity: 2,
  price: 49.99,
});
```

#### `identify(userId, properties?)`

Associate analytics events with authenticated users. **Analytics tracking only** - does not create contacts in your database.

```typescript
await aizu.identify("user_123", {
  $email: "user@example.com",
  $first_name: "John",
  plan: "premium",
  signup_date: "2024-01-15",
});
```

**Note**: This method tracks user identification events for analytics purposes. To create actual contact records in your database, use the server-side SDK with `addOrUpdateContact` events.

#### `groupIdentify(groupId, properties?)`

Associate analytics events with groups/organizations. **Analytics tracking only** - does not create groups in your database.

```typescript
await aizu.groupIdentify("company_456", {
  $name: "Acme Corporation",
  $industry: "Technology",
  employee_count: 500,
  plan: "enterprise",
});
```

**Note**: This method tracks group identification events for analytics purposes. To create actual group records in your database, use the server-side SDK with `addOrUpdateGroup` events.

#### `flush()`

Manually flush all queued events immediately.

```typescript
// Useful before navigation or when you need immediate sending
await aizu.flush();
```

### Session Management

#### `getSessionId()`

Get the current session identifier.

```typescript
const sessionId = aizu.getSessionId();
```

#### `resetSession()`

Reset the session and generate a new session ID.

```typescript
// Useful for logout scenarios
aizu.resetSession();
```

#### `getAnonymousId()`

Get the current anonymous user identifier.

```typescript
const anonymousId = aizu.getAnonymousId();
```

#### `resetAnonymousId()`

Reset and generate a new anonymous ID.

```typescript
aizu.resetAnonymousId();
```

## Framework Integration

### Next.js

Create an instrumentation file for client-side initialization:

```javascript
// instrumentation-client.js
import { Aizu } from "aizu";

const aizu = new Aizu({
  apiKey: process.env.NEXT_PUBLIC_YORIN_PUBLISHABLE_KEY,
  apiUrl: process.env.NEXT_PUBLIC_YORIN_API_URL,
  debug: process.env.NODE_ENV === "development",
});

aizu.init();

export { aizu };
```

Use in your components:

```javascript
import { aizu } from "../instrumentation-client";

export default function ProductPage({ product }) {
  const handleAddToCart = async () => {
    await aizu.track("add_to_cart", {
      product_id: product.id,
      price: product.price,
    });
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

### React (Vite/CRA)

Initialize in your main entry file:

```javascript
// main.js or index.js
import { Aizu } from "aizu";

const aizu = new Aizu({
  apiKey: import.meta.env.VITE_YORIN_PUBLISHABLE_KEY, // Vite
  // apiKey: process.env.REACT_APP_YORIN_PUBLISHABLE_KEY, // CRA
  apiUrl: import.meta.env.VITE_YORIN_API_URL,
});

aizu.init();

// Make aizu available globally (optional)
window.aizu = aizu;
```

### Vue.js

Create a plugin:

```javascript
// plugins/aizu.js
import { Aizu } from "aizu";

export default {
  install(app, options) {
    const aizu = new Aizu(options);
    aizu.init();

    app.config.globalProperties.$aizu = aizu;
    app.provide("aizu", aizu);
  },
};
```

## Advanced Usage

### Event Batching

Events are automatically batched for better performance. Configure batching behavior:

```javascript
const aizu = new Aizu({
  apiKey: "pk_...",
  apiUrl: "https://us.aizu.io",
  enableBatching: true, // Enable batching
  batchSize: 20, // Send when 20 events are queued
  flushInterval: 1000, // Or send every 1 second
});
```

### Custom Click Tracking

Add `data-aizu-track` attributes to automatically track clicks:

```html
<button data-aizu-track="signup-button">Sign Up Now</button>

<a href="/pricing" data-aizu-track="pricing-link"> View Pricing </a>
```

Enable auto-tracking in config:

```javascript
const aizu = new Aizu({
  apiKey: "pk_...",
  apiUrl: "https://us.aizu.io",
  autoTrackClicks: true,
});
```

### Error Handling

The SDK handles errors gracefully and includes automatic retries:

```javascript
try {
  await aizu.track("purchase", { amount: 99.99 });
} catch (error) {
  // The SDK already retried 3 times with exponential backoff
  console.error("Failed to track event after retries:", error);
}
```

### Debug Mode

Enable detailed logging for development:

```javascript
const aizu = new Aizu({
  apiKey: "pk_...",
  apiUrl: "https://us.aizu.io",
  debug: true, // Logs all SDK operations
});
```

## Type Safety

The SDK includes comprehensive TypeScript definitions:

```typescript
import { Aizu, AizuConfig, TrackEventProperties } from "aizu";

const config: AizuConfig = {
  apiKey: "pk_...",
  apiUrl: "https://api.aizu.io",
};

const aizu = new Aizu(config);

// Type-safe event properties
interface CartEvent extends TrackEventProperties {
  product_id: string;
  quantity: number;
  price: number;
}

await aizu.track<CartEvent>("add_to_cart", {
  product_id: "SKU-123",
  quantity: 2,
  price: 49.99,
});
```

## Privacy & Compliance

### GDPR Compliance

The SDK respects user privacy and provides methods for compliance:

```javascript
// Stop tracking for opted-out users
if (userOptedOut) {
  aizu.resetAnonymousId();
  aizu.resetSession();
  // Don't call tracking methods
}

// Delete user data on request
aizu.resetAnonymousId();
aizu.resetSession();
```

### Cookie-less Tracking

The SDK uses localStorage by default but falls back to memory storage if unavailable, ensuring tracking works even with strict cookie policies.

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- All modern mobile browsers

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://aizu.io/docs](https://aizu.io/docs)
- Issues: [GitHub Issues](https://github.com/AizuGit/cdn/issues)
- Email: support@aizu.io

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

Built with ❤️ by Aizu Labs
