import { Controller, Get, Post, Req, Res, Query, HttpCode, UseGuards, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  /** Meta webhook verification (GET) */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified ✅');
      return (res as any).status(200).send(challenge);
    }
    return (res as any).status(403).send('Forbidden');
  }

  /** Meta webhook incoming messages (POST) */
  @Post('webhook')
  @HttpCode(200)
  async receiveWebhook(@Req() req: Request) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const webhookSecret = this.config.get<string>('WHATSAPP_WEBHOOK_SECRET', '');

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

    await this.whatsappService.processWebhook(req.body);
    return { status: 'ok' };
  }

  /** Admin: get message logs */
  @Get('logs')
  @UseGuards(JwtAuthGuard)
  getLogs() {
    return this.whatsappService.getLogs();
  }
}
