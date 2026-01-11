import crypto from 'crypto';

/**
 * Validate Mercado Pago webhook signature
 * Based on official documentation: https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
 */

interface ValidateSignatureParams {
  xSignature: string;
  xRequestId: string;
  dataId: string;
}

export function validateMercadoPagoSignature({
  xSignature,
  xRequestId,
  dataId
}: ValidateSignatureParams): boolean {
  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    // SECURITY FIX: Always require webhook secret, never skip validation
    // Skipping validation could allow forged payment webhooks
    if (!secret) {
      console.error(
        '[MercadoPago] MERCADOPAGO_WEBHOOK_SECRET is required for webhook signature validation. ' +
        'Webhooks will be rejected without proper signature. ' +
        'Set MERCADOPAGO_WEBHOOK_SECRET in your .env file.'
      );
      return false;
    }

    // In development, log a warning but still validate
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MercadoPago] Validating webhook signature in development mode');
    }

    // Parse the x-signature header
    // Format: "ts=1234567890,v1=abc123..."
    const parts = xSignature.split(',');
    let ts: string | null = null;
    let hash: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      console.error('[MercadoPago] Invalid signature format (missing ts or v1)');
      return false;
    }

    // Build the manifest string: "id:{dataId};request-id:{xRequestId};ts:{ts};"
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Generate the expected signature
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    // Compare signatures (timing-safe comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(expectedHash)
    );

    if (!isValid) {
      console.error('[MercadoPago] Signature validation failed');
      console.error('[MercadoPago] Expected:', expectedHash);
      console.error('[MercadoPago] Received:', hash);
      console.error('[MercadoPago] Manifest:', manifest);
    }

    return isValid;
  } catch (error) {
    console.error('[MercadoPago] Error validating signature:', error);
    return false;
  }
}

/**
 * Check if signature validation should be enforced
 * SECURITY FIX: Always enforce validation if secret is set
 */
export function shouldValidateSignature(): boolean {
  // Always validate if secret is configured, regardless of environment
  // This ensures security even if NODE_ENV is misconfigured
  return !!process.env.MERCADOPAGO_WEBHOOK_SECRET;
}
