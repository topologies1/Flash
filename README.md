# Flash
**Flash sets up a highly adaptable WebSocket server suitable for any use case**

<br />


## Development 


**Clone Repository**

```
git clone https://github.com/topologies1/Flash.git
```
<br >

**Create `.env` file at the root**

_edit as you needed_
```
SECRET_KEY=mySecretKey123
ENCRYPTION_KEY=your-32-byte-encryption-key
ORIGIN=http://localhost:3000
```

<br />

**Commands _>**

_open the repository on your terminal_

Install `node_modules`
```
npm install
```
Run server
```
npm run dev
```
<br />

**🌐 endpoint 👉  `http://localhost:8080`**

<br />

## Next.js Integration

**Use same server's `.env` value as password!**
```
SECRET_KEY=mySecretKey123
ENCRYPTION_KEY=your-32-byte-encryption-key
NEXT_PUBLIC_WEBSOCKET_ENDPOINT=//localhost:8080
```
<br />

**Encryption**

_`websocket.ts`_

```ts
"use server";
import crypto from "crypto";

function getUTCTimestamp() {
  return Math.floor(new Date().getTime() / 1000); // Unix timestamp in seconds
}

async function getKeyFromPassphrase() {
  const enc = new TextEncoder();
  const keyMaterial = enc.encode(process.env.ENCRYPTION_KEY);

  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("salt"), // Use a salt here
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function sendEncryptedSecretKey() {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM IV of 12 bytes
  const key = await getKeyFromPassphrase();

  const timestamp = getUTCTimestamp(); // Get the current UTC timestamp
  const secretWithTimestamp = `${timestamp}:${process.env.SECRET_KEY}`; // Add the timestamp to the secret key

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    new TextEncoder().encode(secretWithTimestamp) // Encrypt the secret + timestamp
  );

  // Split the encrypted data and tag (16 bytes at the end of the result)
  const encryptedArray = new Uint8Array(encryptedData);
  const authTag = encryptedArray.slice(-16); // Last 16 bytes is the authentication tag
  const encryptedPayload = encryptedArray.slice(0, -16); // Rest is the encrypted data

  // Send encrypted data, IV, and authTag to the server via WebSocket
  return JSON.stringify({
    encryptedSecretKey: Buffer.from(encryptedPayload).toString("hex"),
    iv: Buffer.from(iv).toString("hex"),
    authTag: Buffer.from(authTag).toString("hex"), // Send the auth tag separately
    userId: "unique-user-id",
  });
}

```
<br />

**Provider**

**_Note:_ Uses `ws://` vs `wss://`** 

- on development use: _`ws://localhost:8080`_
- on production use: _`wss://localhost:8080`_

_`socket-provider.tsx`_

```ts
"use client";
import {
  createContext,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { sendEncryptedSecretKey } from "./websocket";

export const WebSocketContext = createContext(null);

export default function WebSocketProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [socket, setSocket] = useState<any>(null);
  const [flash, setFlash] = useState<any[]>();

  useEffect(() => {
    if (!socket) {
      sendEncryptedSecretKey().then((res) => {
        const { authTag, encryptedSecretKey, iv, userId } = JSON.parse(res);
        const ws = new WebSocket(
          `ws:${process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT}?authTag=${authTag}&encryptedSecretKey=${encryptedSecretKey}&iv=${iv}&userId=${userId}`
        );
        ws.onmessage = (event) => {
          const newMessage = JSON.parse(event.data);
          setFlash((prevState) => [newMessage, ...(prevState ?? [])]);
          console.log("Received from server:", newMessage);
        };
        setSocket(ws);
      });
    }

    return () => {
      if (!!socket) {
        socket.close();
      }
    };
  }, [socket]);

  const socketValue = useMemo(() => socket, [socket]);
  const flashValue = useMemo(() => flash ?? [], [flash]);

  return (
    <WebSocketContext.Provider
      value={{ socket: socketValue, flash: flashValue } as any}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

```
<br />

**Layout**

_`src/app/layout.tsx`_

```js
import WebSocketProvider from "./socket-provider.tsx";

export default function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WebSocketProvider>
        {children}
    </WebSocketProvider>
  );
}

```
<br />

**hooks**
_`use-websocket.ts`_

```js
import { useContext } from "react";
import { WebSocketContext } from "./socket-provider";

// Custom hook to use WebSocket in any component
export default function useWebSocket(): any {
  return useContext(WebSocketContext);
}
```
<br />

**Use event data**

```ts
import useWebSocket from "./use-websocket.ts";

export default function Component(){
    const { flash } = useWebSocket();

    return <h1>Events data on {JSON.stringify(flash)}</h1>
}
```
<br />

**Send message**

```ts
import useWebSocket from "./use-websocket.ts";

export default function Component() {
  const { socket } = useWebSocket();

  function onClick() {
    socket.send(
      JSON.stringify({
        event: "accept_issue",
        to: "user_id",
        data: {
          title: "example title",
          name: "User name",
        },
      })
    );
  }

  return (
    <div>
      <h1>Events data send</h1>
      <button onClick={onClick}>Send</button>
    </div>
  );
}

```
<br />

#### 🤝 Your contributions are always appreciated!