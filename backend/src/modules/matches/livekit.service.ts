import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { randomUUID } from 'crypto';

type CreateRoomResponse = {
  name: string;
};

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  private readonly apiHost?: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = configService.get<string>('LIVEKIT_API_KEY');
    this.apiSecret = configService.get<string>('LIVEKIT_API_SECRET');
    this.apiHost = configService.get<string>('LIVEKIT_API_URL');
  }

  async createRoom(mode: string): Promise<CreateRoomResponse> {
    const roomName = `echoplay-${mode.toLowerCase()}-${randomUUID()}`;

    if (!this.apiHost || !this.apiKey || !this.apiSecret) {
      this.logger.warn('LiveKit credentials missing, returning generated room name only');
      return { name: roomName };
    }

    try {
      const response = await fetch(`${this.apiHost}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.buildBasicAuthHeader()
        },
        body: JSON.stringify({
          name: roomName,
          emptyTimeout: 60 * 60,
          maxParticipants: 16,
          metadata: JSON.stringify({ platform: 'EchoPlay', mode })
        })
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`LiveKit createRoom failed: ${response.status} ${body}`);
        return { name: roomName };
      }

      const parsed = (await response.json()) as CreateRoomResponse;
      return parsed;
    } catch (error) {
      this.logger.error('LiveKit room creation request failed', error as Error);
      return { name: roomName };
    }
  }

  createJoinToken(roomName: string, identity: string, metadata: Record<string, unknown>) {
    if (!this.apiKey || !this.apiSecret) {
      this.logger.warn('LiveKit credentials missing, returning unsigned join token');
      return `stub-token-${identity}-${roomName}`;
    }

    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity,
      ttl: 60 * 60 * 2,
      metadata: JSON.stringify(metadata)
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true
    });

    return token.toJwt();
  }

  private buildBasicAuthHeader() {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }
}
