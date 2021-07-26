const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');
const websocket = require('../helpers/websocket');
const validation = require('../helpers/parameterValidation');
const { isAdminRequest } = require('../helpers/adminHelper');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue bump request received', event);

  if (!isAdminRequest(event)) {
    return response.unauthorized({
      message: 'Unauthorized: only admins can bump songs',
    });
  }

  const { songId } = event.pathParameters;
  if (!validation.isValidId(songId)) {
    return response.badRequest({ message: 'Invalid song ID' });
  }

  const { toPosition } = JSON.parse(event.body);
  if (!validation.isPositiveInteger(toPosition)) {
    return response.badRequest({ message: 'Invalid position' });
  }

  const newPosition = parseInt(toPosition, 10);
  if (!newPosition || newPosition <= 0) {
    return response.badRequest({
      message: `Position ${newPosition} is invalid`,
    });
  }

  let queueItem;
  try {
    queueItem = await dynamo.get({ SongID: songId }, songQueueTableName);
  } catch (error) {
    return response.notFound({ message: 'Song not currently queued' });
  }

  const priorItemsInQueue = (await dynamo.getAll(songQueueTableName))
    .sort((a, b) => a.Priority - b.Priority)
    .slice(0, newPosition);

  const currentQueueItemAtPosition =
    priorItemsInQueue[priorItemsInQueue.length - 1];

  if (currentQueueItemAtPosition.SongID === songId) {
    return response.badRequest({
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
  await dynamo.write(updatedQueueEntry, songQueueTableName);

  const queueData = {
    songId: updatedQueueEntry.SongID,
    title: updatedQueueEntry.Title,
    artist: updatedQueueEntry.Artist,
    priority: updatedQueueEntry.Priority,
    position: newPosition,
  };
  console.debug('Song bumped in queue', queueData);

  await websocket.broadcast({
    action: 'queueBump',
    data: queueData,
  });
  return response.success(queueData);
};
