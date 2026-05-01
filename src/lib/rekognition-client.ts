import { RekognitionClient } from '@aws-sdk/client-rekognition'

/**
 * Rekognition must use the **same AWS Region as the S3 bucket** holding profile photos
 * when TargetImage uses S3Object (AWS requirement).
 *
 * Optional override (must still match bucket region): AWS_REKOGNITION_REGION
 */
export function createRekognitionClient(): RekognitionClient {
  const region =
    process.env.AWS_REKOGNITION_REGION?.trim() ||
    process.env.AWS_REGION?.trim()
  if (!region) {
    throw new Error('AWS_REGION or AWS_REKOGNITION_REGION must be set for Rekognition')
  }

  return new RekognitionClient({
    region,
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

let singleton: RekognitionClient | null = null

export function getRekognitionClient(): RekognitionClient {
  if (!singleton) singleton = createRekognitionClient()
  return singleton
}

/** DNS / firewall — caller logs full error and returns this to the client */
export function rekognitionNetworkHint(err: unknown): string | null {
  const code = (err as NodeJS.ErrnoException)?.code
  const msg  = err instanceof Error ? err.message : String(err)
  if (code === 'ENOTFOUND' || /\bENOTFOUND\b/i.test(msg)) {
    return (
      'Cannot reach AWS Rekognition (hostname did not resolve). Often a Docker or VPS DNS issue — ' +
      'try adding dns: [8.8.8.8, 8.8.4.4] under your app service in docker-compose, or fix VPC DNS / outbound HTTPS.'
    )
  }
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || /\bETIMEDOUT\b/i.test(msg)) {
    return 'Cannot connect to AWS Rekognition. Check firewall and outbound HTTPS (port 443).'
  }
  return null
}
