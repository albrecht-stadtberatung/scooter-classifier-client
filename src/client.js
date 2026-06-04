import { Client } from '@gradio/client'
import { ACCEPTABLE, LABEL_DE } from './labels.js'

const SPACE = 'albrecht-stadtberatung/scooter-parking-compliance'

/**
 * Classify a scooter parking image.
 *
 * @param {File|Blob} image
 * @param {{ timeout?: number }} options  timeout in ms, default 120 000
 * @returns {Promise<ClassifyResult>}
 *
 * @typedef {{ label: string, ok: boolean, labelDe: string, confidences: Confidence[] }} ClassifyResult
 * @typedef {{ label: string, labelDe: string, confidence: number, ok: boolean }} Confidence
 */
export async function classify(image, { timeout = 120_000 } = {}) {
  const race = Promise.race([
    _predict(image),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeout)
    ),
  ])

  const raw = await race

  if (!raw?.label) throw new Error('Empty response from classifier')

  return {
    label: raw.label,
    ok: ACCEPTABLE.has(raw.label),
    labelDe: LABEL_DE[raw.label] ?? raw.label,
    confidences: (raw.confidences ?? []).map(c => ({
      label: c.label,
      labelDe: LABEL_DE[c.label] ?? c.label,
      confidence: c.confidence,
      ok: ACCEPTABLE.has(c.label),
    })),
  }
}

async function _predict(image) {
  const client = await Client.connect(SPACE)
  const result = await client.predict('/classify', { image })
  return result.data?.[0]
}