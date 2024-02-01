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

        // Check if data is valid and type is defined
        if (data && typeof data.type !== 'undefined') {
            if (data.type.toUpperCase() === 'INSERT') {
                logger.info('Received an INSERT event:', data);
                // Add logic to handle INSERT event here
            } else if (data.type.toUpperCase() === 'DELETE') {
                logger.info('Received a DELETE event:', data);
                // Add logic to handle DELETE event here
            } else {
                logger.warn('Received an unsupported event type:', data.type);
                // Handle unsupported event type gracefully
            }
        } else {
            logger.warn('Received an event with missing or undefined type:', data);
            // Handle missing or undefined type gracefully
        }
    } catch (error) {
        // logger.error(`Error processing event: ${error.message}`);
        // Handle JSON parsing errors or other exceptions gracefully
    }
};

// Keep the script running
process.stdin.resume();
logger.debug('Script initialized and running.');
