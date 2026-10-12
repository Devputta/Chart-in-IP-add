import { EncryptedPayload } from '../crypto/cipher';

export interface MediaAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  sender: 'self' | 'peer';
  senderName?: string;
  plaintext: string;
  media?: MediaAttachment;
  payload: EncryptedPayload;
  timestamp: number;
  status: 'encrypting' | 'sent' | 'delivered' | 'decrypted' | 'error';
  errorMessage?: string;
  decryptionLatencyMs?: number;
  ephemeralSeconds?: number;
  expiresAt?: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ChannelInfo {
  code: string;
  passphrase?: string;
  hasPassphrase?: boolean;
  participants: number;
  peerPresent: boolean;
  peerName?: string;
  safetyNumber: string;
  fingerprintHex: string;
  joinedAt: number;
}

export interface WirePacket {
  id: string;
  direction: 'client_to_server' | 'server_to_client';
  type: string;
  timestamp: number;
  payloadPreview: string;
  raw: any;
}
