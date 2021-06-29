const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const { broadcast } = require('../helpers/broadcast');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async event => {
    console.info('Queue bump request received', event);
    const body = JSON.parse(event.body);

    if (!body.songId) {
        return Responses._400({ message: 'Song ID must be specified' });
    }
    const newPosition = parseInt(body.position, 10);
    console.debug(newPosition);
    if (!newPosition || newPosition <= 0) {
        console.debug('Position invalid');
        return Responses._400({ message: 'New position in queue must be specified as a positive integer' });
    }

    let queueItem;
    try {
        queueItem = await Dynamo.get({ SongID: body.songId }, songQueueTableName);
    } catch (error) {
        console.debug(`Song ${body.songId} not in queue`, error);
        return Responses._404({ message: `Song with ID ${body.songId} not found in queue` });
    }

    const priorItemsInQueue = (await Dynamo.getAll(songQueueTableName)).sort((a, b) => a.Priority - b.Priority).slice(0, newPosition);
    
    const currentQueueItemAtPosition = priorItemsInQueue[priorItemsInQueue.length - 1];

    if (currentQueueItemAtPosition.SongID === body.songId) {
        console.info(`Song already queued at position ${newPosition}`);
        return Responses._200({ message: `Song already queued at position ${newPosition}` });
    }
    
    const updatedQueueEntry = {
        ...queueItem,
        Priority: (currentQueueItemAtPosition.Priority + (priorItemsInQueue.length > 1 ? priorItemsInQueue[newPosition - 2].Priority : 0)) / 2
    };
    await Dynamo.write(updatedQueueEntry, songQueueTableName);
    
    await broadcast({ action: 'queueBump', data: {
        songId: updatedQueueEntry.SongID,
        priority: updatedQueueEntry.Priority
    }});

    return Responses._200({ message: 'song added' });
};
