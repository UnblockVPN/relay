// File: sseHandler.js
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
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'debug.log' })
    ]
});

function initializeSSE(sseUrl, processInsertEvent, processDeleteEvent) {
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = event => {
        try {
            logger.debug('File: sseHandler.js: Event received. Starting to process...');
            const data = JSON.parse(event.data);
            logger.debug(`File: sseHandler.js: Parsed event data: ${JSON.stringify(data, null, 2)}`);

            if (data.type === 'INSERT') {
                const { ipv4_address, pubkey } = data.data;
                logger.debug(`File: sseHandler.js: Processing INSERT event for IP: ${ipv4_address} with pubkey: ${pubkey}`);
                processInsertEvent(ipv4_address, pubkey);
            } else if (data.type === 'DELETE') {
                const { ipv4_address } = data.data;
                logger.debug(`File: sseHandler.js: Processing DELETE event for IP: ${ipv4_address}`);
                processDeleteEvent(ipv4_address);
            }
        } catch (error) {
            logger.error(`File: sseHandler.js: Error processing event: ${error.message}`);
        }
    };

    eventSource.onerror = error => {
        logger.error(`File: sseHandler.js: EventSource encountered an error: ${JSON.stringify(error, null, 2)}`);
    };
}

module.exports = {
    initializeSSE
};
