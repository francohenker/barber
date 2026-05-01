import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Query,
  HttpCode,
  UseGuards,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WhatsAppWebhookPayload } from '../../common/types/auth.types';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  @Post('webhook')
  @HttpCode(200)
  async receiveWebhook(@Req() req: Request) {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const webhookSecret = this.config.get<string>(
      'WHATSAPP_WEBHOOK_SECRET',
      '',
    );

    if (webhookSecret && signature) {
      const expectedSig =
        'sha256=' +
        crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');

      if (signature !== expectedSig) {
        this.logger.warn('Invalid webhook signature');
        return { status: 'invalid_signature' };
      }
    }

    const body = req.body as WhatsAppWebhookPayload;
    await this.whatsappService.processWebhook(body);
    return { status: 'ok' };
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  getLogs() {
    return this.whatsappService.getLogs();
  }
}
