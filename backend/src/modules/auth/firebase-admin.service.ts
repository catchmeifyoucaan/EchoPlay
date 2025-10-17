import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApp, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App;
  private auth: Auth;

  constructor(private readonly configService: ConfigService) {
    this.app = this.initApp();
    this.auth = getAuth(this.app);
  }

  getAuthClient(): Auth {
    return this.auth;
  }

  private initApp(): App {
    if (getApps().length > 0) {
      return getApp();
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    try {
      if (clientEmail && privateKey) {
        return initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n')
          })
        });
      }

      this.logger.warn('Falling back to application default Firebase credentials');
      return initializeApp({
        credential: applicationDefault(),
        projectId
      });
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error as Error);
      throw error;
    }
  }
}
