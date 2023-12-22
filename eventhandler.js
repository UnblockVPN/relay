const EventSource = require('eventsource');
const fs = require('fs');
const { exec } = require('child_process');
const winston = require('winston');

// Winston Logger Configuration
const logger = winston.createLogger({
    level: 'debug', // Set log level to debug for detailed logging
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'debug.log' })
    ]
});

const sseUrl = 'https://api.unblockvpn.io/sse/events';
const wgConfPath = '/etc/wireguard/wg0.conf';

const eventSource = new EventSource(sseUrl);

// Handling SSE events
eventSource.onmessage = event => {
    try {
        const data = JSON.parse(event.data);
        logger.debug(`Received SSE event: ${event.data}`);
        if (data.type === 'INSERT') {
            const { ipv4_address, pubkey } = data.data;
            updateWireGuardConfig(ipv4_address, pubkey);
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
    }
};

eventSource.onerror = error => {
    logger.error(`EventSource encountered an error: ${error.message}`);
};

function updateWireGuardConfig(ip, pubkey) {
    logger.debug(`Starting updateWireGuardConfig with IP: ${ip} and pubkey: ${pubkey}`);
    const tempPath = `${wgConfPath}.tmp`;

    // Using exec to read wg0.conf with sudo
    exec(`sudo cat ${wgConfPath}`, (err, content) => {
        if (err) {
            logger.error(`Error reading wg0.conf: ${err.message}`);
            return;
        }

        const newPeerEntry = `\n[Peer]\nPublicKey = ${pubkey}\nAllowedIPs = ${ip}/32\n`;
        const updatedConfig = content + newPeerEntry;

        fs.writeFile(tempPath, updatedConfig, 'utf8', (err) => {
            if (err) {
                logger.error(`Error writing temporary wg config: ${err.message}`);
                return;
            }

            fs.rename(tempPath, wgConfPath, (err) => {
                if (err) {
                    logger.error(`Error updating wg0.conf: ${err.message}`);
                    return;
                }

                exec("sudo wg syncconf wg0 <(wg-quick strip wg0)", (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`Error executing wg syncconf: ${error.message}`);
                        return;
                    }
                    logger.debug('wg0.conf updated successfully');
                    if (stdout) {
                        logger.debug(`stdout: ${stdout}`);
                    }
                    if (stderr) {
                        logger.debug(`stderr: ${stderr}`);
                    }
                });
            });
        });
    });
};

// Keep the script running
process.stdin.resume();
