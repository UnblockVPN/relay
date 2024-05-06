const winston = require('winston');
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'peer-events.log' })
    ]
});


const { exec } = require('child_process');

function addPeer(peerData, callback) {
    const command = `sudo wg set wg0 peer ${peerData.pubkey} allowed-ips ${peerData.ipv4_address}/32`;
    logger.debug('Executing command to add peer:', { command });

    exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
            logger.error('Error executing add peer command:', { error: error?.message, stderr });
            callback(error || new Error(stderr));
        } else {
            logger.info('Peer added successfully:', { stdout });
            callback(null);
        }
    });
}

function removePeer(peerData, callback) {
    const command = `sudo wg set wg0 peer ${peerData.pubkey} remove`;
    logger.debug('Executing command to remove peer:', { command });

    exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
            logger.error('Error executing remove peer command:', { error: error?.message, stderr });
            callback(error || new Error(stderr));
        } else {
            logger.info('Peer removed successfully:', { stdout });
            callback(null);
        }
    });
}

module.exports = { addPeer, removePeer };

