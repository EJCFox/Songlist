const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WebSocket = require('../common/websocketMessage');

const usersTableName = process.env.usersTableName;
const songQueueTableName = process.env.songQueueTableName;

exports.handler = async event => {
    console.info('Queue get request received', event);

    const { connectionId } = event.requestContext;
    const userRecord = await Dynamo.get({ ID: connectionId }, usersTableName);
    const { domainName, stage } = userRecord;

    const queueItems = await Dynamo.getAll(songQueueTableName);

    await WebSocket.send({
        domainName,
        stage,
        connectionId,
        data: {
            action: 'queueGet',
            data: queueItems.map((item) => ({
                songId: item.SongID,
                title: item.Title,
                artist: item.Artist,
                priority: item.Priority,
            }))
        },
    });

    return Responses._200({ message: "successfully sent queue" });
};
