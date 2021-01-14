const amqp = require('amqplib');
const notifyUser = require('./notifyUser');
const amqpurl = "amqps://lwfovwpk:Mn8VFOAi_0UbAvLhAVU-LkuPjZ0jL-UH@jellyfish.rmq.cloudamqp.com/lwfovwpk";

async function queueOperation(channel) {
    console.log('subscriber - queue operation called for Order management');
    try {
        channel.assertQueue('order_msg_queue', { durable: true });
        const onMsg = (msg) => {
            notifyUser.sendMsg(msg.content.toString())
                .then(() => channel.ack(msg))
                .catch((e) => {
                    console.error('An error occured while channel operations during Order management', JSON.stringify(e));
                    channel.ack(msg);
                });
        };
        console.log(`Listening to the order_msg_queue`);
        channel.consume("order_msg_queue", onMsg, { noAck: false });

    } catch (e) {
        console.log('An error occured while channel operations during queue consume'+ e.message);
    }
}
async function msgChannel(connection) {
    try {
        console.log('creating channel');
        await connection.createChannel()
            .then(async (ch) => {
                ch.prefetch(1);
                await queueOperation(ch);
            })
            .catch(e => {
                return logger.error('An error occured while subscriber operations.', JSON.stringify(e));
            });

    } catch (err) {
        console.log('An err occured while Order management operations.', JSON.stringify(err));
        rej(err);
    }
}
async function subscribeToRabbitmq() {
    let connection = null;
    console.log('Establishing connection with the rabbitmq for Order management');
    await amqp.connect(amqpurl)
        .then(async (conn) => {
            console.log('connection established with the rabbitmq for Order management');
            connection = conn;
            await msgChannel(conn);
        })
        .catch(async (e) => {
            console.log('An error occured while connecting to rabbitmq , retrying connecting after 3 secs..', e.stack);
        });
    return connection;
}


module.exports = {
    subscribeToRabbitmq
}