const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WebSocket = require('../common/websocketMessage');

const usersTableName = process.env.usersTableName;
const songListTableName = process.env.songListTableName;
const songQueueTableName = process.env.songQueueTableName;

exports.handler = async event => {
    const body = JSON.parse(event.body);

    if (!body.songId) {
        return Responses._400({ message: 'Song ID must be specified' });
    }

    let songItem;
    try {
        songItem = await Dynamo.get(body.songId, songListTableName);
    } catch (error) {
        return Responses._404({ message: `Song with ID ${body.songId} not found` });
    }

    const newQueueEntry = {
        SongID: body.songId
    };

    await Dynamo.write(newQueueEntry, songQueueTableName);

    const allConnections = await Dynamo.getAll(usersTableName);
    console.log(allConnections);

    const notifications = allConnections.map(({ ID, domainName, stage }) => 
        WebSocket.send({
            domainName,
            stage,
            connectionId: ID,
            message: `${songItem.Name} by ${songItem.Artist} has been added to the queue`,
        })
    )
    await Promise.all(notifications);

    return Responses._200({ message: 'song added' });
};
