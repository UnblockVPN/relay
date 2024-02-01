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

        // Check if data is valid and eventType is defined
        if (data && typeof data.eventType !== 'undefined') {
            if (data.eventType.toUpperCase() === 'INSERT') {
                logger.info('Received an INSERT event:', data);
                // Add logic to handle INSERT event here
            } else if (data.eventType.toUpperCase() === 'DELETE') {
                logger.info('Received a DELETE event:', data);
                // Add logic to handle DELETE event here
            } else {
                logger.warn('Received an unsupported event type:', data.eventType);
                // Handle unsupported event type gracefully
            }
        } else {
            logger.warn('Received an event with missing or undefined eventType:', data);
            // Handle missing or undefined eventType gracefully
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
        // Handle JSON parsing errors or other exceptions gracefully
    }
};




// Keep the script running
process.stdin.resume();
logger.debug('Script initialized and running.');
