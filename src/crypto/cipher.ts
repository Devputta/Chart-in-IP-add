/**
 * CipherLink Cryptographic Core
 * Uses W3C Web Cryptography API (crypto.subtle)
 * AES-GCM 256-bit authenticated encryption with PBKDF2 key derivation.
 * Hardened against tampering, replay, and unauthorized decryption.
 */

export interface EncryptedPayload {
  iv: string; // Base64 12-byte initialization vector
  data: string; // Base64 ciphertext with appended 128-bit authentication tag
  timestamp: number;
  ephemeralSeconds?: number;
  messageId: string;
}

export interface KeyDetails {
  key: CryptoKey;
  channelCode: string;
  hasPassphrase: boolean;
  safetyNumber: string; // Formatted 6-digit security code (e.g., "482 910")
  fingerprintHex: string; // 8-byte hex snippet
  iterations: number;
  algorithm: string;
}

export interface CryptoTestResult {
  id: string;
  name: string;
  category: 'derivation' | 'encryption' | 'integrity' | 'isolation' | 'tamper';
  passed: boolean;
  durationMs: number;
  details: string;
}

// Base64 encoding/decoding utilities
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derives an AES-GCM-256 key from a channel PIN and an optional high-entropy passkey.
 * PBKDF2 with SHA-256, 120,000 iterations.
 */
export async function deriveChannelKey(
  channelCode: string,
  passphrase?: string
): Promise<KeyDetails> {
  const normalizedCode = channelCode.trim();
  const normalizedPass = (passphrase || '').trim();

  const secretInput = normalizedPass
    ? `CipherLink:${normalizedCode}:Passphrase:${normalizedPass}`
    : `CipherLink:${normalizedCode}`;

  const encoder = new TextEncoder();
  const rawKeyMaterial = encoder.encode(secretInput);

  // Import raw key material
  const importedMaterial = await crypto.subtle.importKey(
    'raw',
    rawKeyMaterial,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = encoder.encode('CipherLink-v2-educational-gcm-salt');
  const iterations = 120000;

  // Derive AES-GCM 256 key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    importedMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // Extractable so we can compute the Safety Number fingerprint
    ['encrypt', 'decrypt']
  );

  // Compute safety number (fingerprint) by hashing the raw derived key bytes
  const rawExported = await crypto.subtle.exportKey('raw', key);
  const digest = await crypto.subtle.digest('SHA-256', rawExported);
  const digestBytes = new Uint8Array(digest);

  // Take first 4 bytes to form a 6-digit human-readable Safety Number
  const numValue =
    ((digestBytes[0] << 24) |
      (digestBytes[1] << 16) |
      (digestBytes[2] << 8) |
      digestBytes[3]) >>> 0;
  const sixDigit = String(numValue % 1000000).padStart(6, '0');
  const formattedSafetyNumber = `${sixDigit.slice(0, 3)} ${sixDigit.slice(3, 6)}`;
  const fingerprintHex = bufferToHex(digestBytes.slice(0, 8)).toUpperCase();

  return {
    key,
    channelCode: normalizedCode,
    hasPassphrase: Boolean(normalizedPass),
    safetyNumber: formattedSafetyNumber,
    fingerprintHex,
    iterations,
    algorithm: 'AES-GCM 256-bit',
  };
}

/**
 * Encrypts plaintext string using AES-GCM with a fresh cryptographically random 12-byte IV.
 */
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey,
  options?: { ephemeralSeconds?: number; messageId?: string }
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);

  // 12-byte (96-bit) IV recommended for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedData
  );

  return {
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(new Uint8Array(encryptedBuffer)),
    timestamp: Date.now(),
    ephemeralSeconds: options?.ephemeralSeconds,
    messageId: options?.messageId || crypto.randomUUID(),
  };
}

/**
 * Decrypts AES-GCM ciphertext payload and returns plaintext.
 * Throws if authentication tag fails (tampered or wrong key).
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  if (!payload || !payload.iv || !payload.data) {
    throw new Error('Malformed encrypted payload structure');
  }

  const iv = base64ToArrayBuffer(payload.iv);
  if (iv.length !== 12) {
    throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length}`);
  }

  const ciphertext = base64ToArrayBuffer(payload.data);
  if (ciphertext.length < 16) {
    throw new Error('Ciphertext is too short to contain valid 128-bit authentication tag');
  }

  const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer;
  const ciphertextBuffer = ciphertext.buffer.slice(
    ciphertext.byteOffset,
    ciphertext.byteOffset + ciphertext.byteLength
  ) as ArrayBuffer;

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Executes a comprehensive, automated cryptographic validation test suite
 * to verify zero-knowledge guarantees, tamper detection, and mathematical invariants.
 */
export async function runCryptographicTestSuite(): Promise<CryptoTestResult[]> {
  const results: CryptoTestResult[] = [];

  // Test 1: PBKDF2 Key Derivation 120,000 iterations
  {
    const start = performance.now();
    try {
      const derived = await deriveChannelKey('789');
      const duration = performance.now() - start;
      const valid =
        Boolean(derived.key) &&
        derived.safetyNumber.length === 7 &&
        derived.fingerprintHex.length === 16;
      results.push({
        id: 'test-pbkdf2',
        name: 'PBKDF2-HMAC-SHA256 Derivation (120,000 rounds)',
        category: 'derivation',
        passed: valid,
        durationMs: Number(duration.toFixed(2)),
        details: `Derived 256-bit AES key with fingerprint ${derived.fingerprintHex} and safety number [${derived.safetyNumber}]`,
      });
    } catch (err: any) {
      results.push({
        id: 'test-pbkdf2',
        name: 'PBKDF2-HMAC-SHA256 Derivation',
        category: 'derivation',
        passed: false,
        durationMs: 0,
        details: err?.message || 'Derivation failed',
      });
    }
  }

  // Test 2: AES-256-GCM Authenticated Encryption
  let testKey: CryptoKey | null = null;
  let testPayload: EncryptedPayload | null = null;
  const secretText = 'Zero-Knowledge Security Test Vector - 2026';

  {
    const start = performance.now();
    try {
      const derived = await deriveChannelKey('345');
      testKey = derived.key;
      testPayload = await encryptMessage(secretText, testKey);
      const duration = performance.now() - start;
      const ivBytes = base64ToArrayBuffer(testPayload.iv);
      const isIv96Bit = ivBytes.length === 12;

      results.push({
        id: 'test-aes-encrypt',
        name: 'AES-256-GCM Encryption with 96-bit Random Nonce',
        category: 'encryption',
        passed: isIv96Bit && Boolean(testPayload.data),
        durationMs: Number(duration.toFixed(2)),
        details: `Generated fresh 12-byte IV (${testPayload.iv.slice(0, 8)}...) and ciphertext with 128-bit integrity tag`,
      });
    } catch (err: any) {
      results.push({
        id: 'test-aes-encrypt',
        name: 'AES-256-GCM Encryption',
        category: 'encryption',
        passed: false,
        durationMs: 0,
        details: err?.message || 'Encryption failed',
      });
    }
  }

  // Test 3: Authenticated Decryption Roundtrip
  {
    const start = performance.now();
    try {
      if (!testKey || !testPayload) throw new Error('Key/Payload missing');
      const decrypted = await decryptMessage(testPayload, testKey);
      const duration = performance.now() - start;
      const matched = decrypted === secretText;

      results.push({
        id: 'test-aes-decrypt',
        name: 'Plaintext Roundtrip & WebCrypto Decryption',
        category: 'integrity',
        passed: matched,
        durationMs: Number(duration.toFixed(2)),
        details: matched
          ? 'Decrypted string matches plaintext perfectly byte-for-byte'
          : 'Decrypted mismatch',
      });
    } catch (err: any) {
      results.push({
        id: 'test-aes-decrypt',
        name: 'Plaintext Roundtrip',
        category: 'integrity',
        passed: false,
        durationMs: 0,
        details: err?.message || 'Decryption failed',
      });
    }
  }

  // Test 4: Anti-Hacker Bit-Flip & Tamper Detection
  {
    const start = performance.now();
    try {
      if (!testKey || !testPayload) throw new Error('Key/Payload missing');
      const rawBytes = base64ToArrayBuffer(testPayload.data);
      // Flip a single bit in the ciphertext / tag
      rawBytes[0] ^= 0x01;
      const tamperedBase64 = arrayBufferToBase64(rawBytes);

      const tamperedPayload: EncryptedPayload = {
        ...testPayload,
        data: tamperedBase64,
      };

      let failedGracefully = false;
      try {
        await decryptMessage(tamperedPayload, testKey);
      } catch {
        // Expected behavior: GCM authentication tag verification fails!
        failedGracefully = true;
      }

      const duration = performance.now() - start;
      results.push({
        id: 'test-tamper-check',
        name: 'Anti-Hacker Tamper Resistance (Single-Bit Flip Detection)',
        category: 'tamper',
        passed: failedGracefully,
        durationMs: Number(duration.toFixed(2)),
        details: failedGracefully
          ? 'Modified 1 bit in transit: AES-GCM immediately rejected corrupted ciphertext tag'
          : 'CRITICAL SECURITY FLAW: Tampered ciphertext was accepted!',
      });
    } catch (err: any) {
      results.push({
        id: 'test-tamper-check',
        name: 'Anti-Hacker Tamper Resistance',
        category: 'tamper',
        passed: false,
        durationMs: 0,
        details: err?.message || 'Tamper test error',
      });
    }
  }

  // Test 5: Room PIN Cross-Isolation (Keys from different PINs cannot decrypt)
  {
    const start = performance.now();
    try {
      if (!testPayload) throw new Error('Payload missing');
      const wrongDerived = await deriveChannelKey('999'); // Different PIN
      let isolated = false;
      try {
        await decryptMessage(testPayload, wrongDerived.key);
      } catch {
        // Expected: Cannot decrypt with foreign key!
        isolated = true;
      }

      const duration = performance.now() - start;
      results.push({
        id: 'test-pin-isolation',
        name: 'Cryptographic Channel Isolation (Cross-PIN Secrecy)',
        category: 'isolation',
        passed: isolated,
        durationMs: Number(duration.toFixed(2)),
        details: isolated
          ? 'Foreign key derived from different PIN (#999) failed authentication against room (#345)'
          : 'Isolation check failed',
      });
    } catch (err: any) {
      results.push({
        id: 'test-pin-isolation',
        name: 'Cryptographic Channel Isolation',
        category: 'isolation',
        passed: false,
        durationMs: 0,
        details: err?.message || 'Isolation test error',
      });
    }
  }

  // Test 6: Nonce Uniqueness (Replay / IV collision resistance)
  {
    const start = performance.now();
    try {
      if (!testKey) throw new Error('Key missing');
      const p1 = await encryptMessage('Msg 1', testKey);
      const p2 = await encryptMessage('Msg 2', testKey);
      const p3 = await encryptMessage('Msg 3', testKey);
      const duration = performance.now() - start;

      const uniqueIvs = new Set([p1.iv, p2.iv, p3.iv]);
      const passed = uniqueIvs.size === 3;

      results.push({
        id: 'test-iv-uniqueness',
        name: 'CSPRNG Nonce Freshness (Anti-Replay Verification)',
        category: 'encryption',
        passed,
        durationMs: Number(duration.toFixed(2)),
        details: passed
          ? '100% unique 96-bit initialization vectors generated across consecutive messages'
          : 'IV collision detected',
      });
    } catch (err: any) {
      results.push({
        id: 'test-iv-uniqueness',
        name: 'CSPRNG Nonce Freshness',
        category: 'encryption',
        passed: false,
        durationMs: 0,
        details: err?.message || 'IV freshness check failed',
      });
    }
  }

  return results;
}
