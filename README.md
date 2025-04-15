# AcaiJS - Native API Interface

A blazingly fast Common API Interface for Node.js using native HTTP/HTTPS libraries.

## Key Features

- Lightweight Native implementation - no external dependencies
- Modern TypeScript API with full type definitions
- Support for all common HTTP methods
- Automatic JSON parsing/serialization
- Error handling and timeouts
- Base URL and default headers support

## Installation

```bash
npm install acaijs
```

## Quick Start

```typescript
import { WebObject } from 'acaijs';

// Create a client instance
const client = new WebObject();

// Make a simple GET request
const response = await client.get('https://api.example.com/data');
console.log(response.data);

// POST some JSON data
const postResponse = await client.post(
  'https://api.example.com/create',
  { name: 'Example', value: 123 }
);
```

## API Reference

See the full documentation for detailed API reference.
