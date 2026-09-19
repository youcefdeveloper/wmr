import pino from 'pino'

export const logger = pino({
  level: 'debug',
  formatters: {
    level: (label, number) => ({ severity: label, level: number }),
    bindings: () => ({}),
  },
  nestedKey: 'context',
})
