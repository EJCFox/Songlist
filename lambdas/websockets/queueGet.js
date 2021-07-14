const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async event => {
    console.info('Queue get request received', event);
    const queueItems = await Dynamo.getAll(songQueueTableName);
    return Responses._200({
        action: 'queueGet',
        data: queueItems.map((item) => ({
            songId: item.SongID,
            title: item.Title,
            artist: item.Artist,
            priority: item.Priority,
        }))
    });
};
