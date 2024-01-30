const http = require('http');
const winston = require('winston');
const retry = require('retry');

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
    const retryOptions = {
        retries: 5, // Number of times to retry the request
        factor: 1000, // Exponential backoff factor
        minTimeout: 1000, // Minimum timeout between retries
        maxTimeout: 5000 // Maximum timeout between retries
    };

    retry(async () => {
        const request = http.request(sseUrl, (response) => {
            response.on('data', (data) => {
                try {
                    const parsedData = JSON.parse(data);

                    if (parsedData.type === 'INSERT') {
                        const { ipv4_address, pubkey } = parsedData.data;
                        logger.debug(`Processing INSERT event for IP: ${ipv4_address} with pubkey: ${pubkey}`);
                        processInsertEvent(ipv4_address, pubkey);
                    } else if (parsedData.type === 'DELETE') {
                        const { ipv4_address } = parsedData.data;
                        logger.debug(`Processing DELETE event for IP: ${ipv4_address}`);
                        processDeleteEvent(ipv4_address);
                    }
                } catch (error) {
                    logger.error(`Error processing event: ${error.message}`);
                }
            });

            response.on('error', (error) => {
                logger.error(`Error receiving data from server: ${error.message}`);
            });

            response.on('end', () => {
                logger.debug('Connection to server closed.');
            });
        });

        try {
            await request.end();
        } catch (error) {
            // Handle error here, e.g. retry
            logger.error('Error sending request:', error);
        }
    }, retryOptions);
}

module.exports = {
    initializeSSE
};
