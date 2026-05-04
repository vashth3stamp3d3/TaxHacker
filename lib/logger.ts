type LogDetails = Record<string, unknown>

function serialize(details: LogDetails = {}) {
  return JSON.stringify({
    app: "formulated-tax",
    ...details,
  })
}

export function logInfo(event: string, details: LogDetails = {}) {
  console.info(serialize({ event, ...details }))
}

export function logWarn(event: string, details: LogDetails = {}) {
  console.warn(serialize({ event, ...details }))
}

export function logError(event: string, details: LogDetails = {}) {
  console.error(serialize({ event, ...details }))
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
