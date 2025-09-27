## Usage

Those templates dependencies are maintained via [pnpm](https://pnpm.io) via `pnpm up -Lri`.

This is the reason you see a `pnpm-lock.yaml`. That being said, any package manager will work. This file can be safely be removed once you clone a template.

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev` or `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)

## Linting & Formatting

Run the code formatter across the project:

```
npm run pretty
```

Run ESLint (TypeScript + Solid) across source files:

```
npm run lint
```

## Server (TypeScript)

---

The server now lives in `server/` as TypeScript sources. Quick commands:

```bash
# install deps
npm install

# run tests
npx jest

# build server (emit to server/dist)
npx tsc -p tsconfig.json

# start built server
node server/dist/index.js
```

## Server (Express + WebSocket)

A lightweight Express + WebSocket server is provided under `server/index.js` for pairing two clients.

Install dependencies and run the server:

```bash
npm install
npm run start:server
```

By default the server reads `PORT` from the project `.env` file. The front-end can use the Vite environment variable `import.meta.env.VITE_PUBLIC_API_URL` to obtain the WebSocket URL (the project includes a `.env` with `VITE_PUBLIC_API_URL=ws://localhost:4000`).

Client behaviour:

- Clients may connect with a query parameter to declare their colour: `ws://localhost:4000/?color=white`.
- Or clients may send a JSON hello message after connecting: `{ type: 'hello', color: 'black' }`.

The server logs client connections and announced colours to the console.
