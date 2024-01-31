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

        // Add logic to act on events here

    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
    }
};

eventSource.onerror = error => {
    logger.error(`EventSource encountered an error: ${error.message}`);
};

// Keep the script running
process.stdin.resume();
logger.debug('Script initialized and running.');
