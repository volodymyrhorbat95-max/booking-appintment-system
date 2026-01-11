import { Router, Request, Response } from 'express';
import { handleIncomingMessage } from '../controllers/whatsapp.controller';
import { handleWebhook } from '../services/mercadopago.service';
import { validateMercadoPagoSignature, shouldValidateSignature } from '../utils/mercadopago';

const router = Router();

// Twilio WhatsApp webhook (no authentication - Twilio validates via signature)
router.post('/whatsapp', handleIncomingMessage);

// Mercado Pago webhook with signature validation
router.post('/mercadopago', async (req: Request, res: Response) => {
  try {
    // Validate webhook signature if configured
    if (shouldValidateSignature()) {
      const xSignature = req.headers['x-signature'] as string;
      const xRequestId = req.headers['x-request-id'] as string;
      const dataId = req.body?.data?.id;

      // Check required headers
      if (!xSignature || !xRequestId || !dataId) {
        console.error('[MercadoPago] Missing required webhook headers or data.id');
        return res.status(400).json({
          success: false,
          error: 'Missing required webhook headers'
        });
      }

      // Validate signature
      const isValid = validateMercadoPagoSignature({
        xSignature,
        xRequestId,
        dataId
      });

      if (!isValid) {
        console.error('[MercadoPago] Invalid webhook signature - rejecting');
        return res.status(403).json({
          success: false,
          error: 'Invalid signature'
        });
      }

      console.log('[MercadoPago] Webhook signature validated successfully');
    }

    // Process webhook with headers for idempotency tracking
    const headers: Record<string, string> = {
      'x-signature': req.headers['x-signature'] as string || '',
      'x-request-id': req.headers['x-request-id'] as string || '',
      'user-agent': req.headers['user-agent'] as string || '',
      'content-type': req.headers['content-type'] as string || ''
    };

    const result = await handleWebhook(req.body, headers);
    res.json(result);
  } catch (error) {
    console.error('Error handling Mercado Pago webhook:', error);
    res.status(500).json({ success: false, error: 'Webhook processing error' });
  }
});

export default router;
