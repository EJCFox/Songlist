const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');
const { broadcast } = require('../helpers/broadcast');
const Validation = require('../helpers/validation');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue bump request received', event);

  const { songId } = event.pathParameters;
  if (!Validation.isValidId(songId)) {
    return Responses._400({ message: 'Invalid song ID' });
  }

  const { toPosition } = JSON.parse(event.body);
  if (!Validation.isPositiveInteger(toPosition)) {
    return Responses._400({ message: 'Invalid position' });
  }

  const newPosition = parseInt(toPosition, 10);
  if (!newPosition || newPosition <= 0) {
    return Responses._400({ message: `Position ${newPosition} is invalid` });
  }

  let queueItem;
  try {
    queueItem = await Dynamo.get({ SongID: songId }, songQueueTableName);
  } catch (error) {
    return Responses._404({ message: 'Song not currently queued' });
  }

  const priorItemsInQueue = (await Dynamo.getAll(songQueueTableName))
    .sort((a, b) => a.Priority - b.Priority)
    .slice(0, newPosition);

  const currentQueueItemAtPosition =
    priorItemsInQueue[priorItemsInQueue.length - 1];

  if (currentQueueItemAtPosition.SongID === songId) {
    return Responses._400({
      message: `Song already queued at position ${newPosition}`,
    });
  }

  const updatedQueueEntry = {
    ...queueItem,
    Priority:
      (currentQueueItemAtPosition.Priority +
        (priorItemsInQueue.length > 1
          ? priorItemsInQueue[newPosition - 2].Priority
          : 0)) /
      2,
  };
  console.info('Updating queue entry', queueItem, updatedQueueEntry);
  await Dynamo.write(updatedQueueEntry, songQueueTableName);

  const queueData = {
    songId: updatedQueueEntry.SongID,
    title: updatedQueueEntry.Title,
    artist: updatedQueueEntry.Artist,
    priority: updatedQueueEntry.Priority,
    position: newPosition,
  };
  console.debug('Song bumped in queue', queueData);

  await broadcast({
    action: 'queueBump',
    data: queueData,
  });
  return Responses._200(queueData);
};
