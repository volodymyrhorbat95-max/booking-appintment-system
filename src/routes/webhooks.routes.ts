import { Router, Request, Response } from 'express';
import { handleIncomingMessage } from '../controllers/whatsapp.controller';
import { handleWebhook } from '../services/mercadopago.service';

const router = Router();

// Twilio WhatsApp webhook (no authentication - Twilio validates via signature)
router.post('/whatsapp', handleIncomingMessage);

// Mercado Pago webhook (no authentication - MP validates via signature)
router.post('/mercadopago', async (req: Request, res: Response) => {
  try {
    const result = await handleWebhook(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error handling Mercado Pago webhook:', error);
    res.status(500).json({ success: false, error: 'Webhook processing error' });
  }
});

export default router;
