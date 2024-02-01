const EventSource = require('eventsource');
const winston = require('winston');

// Configure the logger
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

const sseUrl = 'https://api.unblockvpn.io/sse/events';

const eventSource = new EventSource(sseUrl);

eventSource.onmessage = event => {
    try {
        const data = JSON.parse(event.data);
        logger.debug(`Received SSE event: ${event.data}`);

        // Check the event type and log accordingly
        if (data.eventType.toUpperCase() === 'INSERT') {
            logger.info('Received an INSERT event:', data);
            // Add logic to handle INSERT event here
        } else if (data.eventType === 'DELETE') {
            logger.info('Received a DELETE event:', data);
            // Add logic to handle DELETE event here
        } else {
            logger.warn('Received an unsupported event type:', data.eventType);
        }

    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
    }
};

// Keep the script running
process.stdin.resume();
logger.debug('Script initialized and running.');
