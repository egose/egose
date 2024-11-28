import { createLogger, format, transports } from 'winston';

const colorizer = format.colorize();

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.label({ label: '[EGOSE]' }),
    format.timestamp({ format: 'YY-MM-DD HH:mm:ss' }),
    format.printf((msg: { level: string; label: string; message: string; timestamp: string }) => {
      const label = colorizer.colorize('notice', msg.label);
      const timestamp = msg.timestamp;
      const level = colorizer.colorize(msg.level, `[${msg.level.toUpperCase()}]`);
      const message = colorizer.colorize(msg.level, msg.message);
      return `${label} ${timestamp} ${level} ${message}`;
    }),
  ),
  transports: [new transports.Console()],
});
