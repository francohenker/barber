import { Role } from '../enums/role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface GoogleUserPayload {
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          text?: { body: string };
          type: string;
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
            list_reply?: {
              id: string;
              title: string;
            };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}
