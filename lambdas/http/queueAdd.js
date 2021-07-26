const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');
const websocket = require('../helpers/websocket');
const validation = require('../helpers/parameterValidation');

const songListTableName = process.env.songListTableName;
const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue add request received', event);

  const songId = event.pathParameters.songId;
  if (!validation.isValidId(songId)) {
    return response.badRequest({ message: 'Invalid song ID' });
  }

  const user = event.requestContext.authorizer.jwt.claims.preferred_username;

  let songListItem;
  try {
    songListItem = await dynamo.get({ ID: songId }, songListTableName);
  } catch (error) {
    return response.notFound({ message: 'Song not found' });
  }

  if (await dynamo.exists({ SongID: songId }, songQueueTableName)) {
    return response.badRequest({ message: 'Song already queued' });
  }

  console.debug('Adding song to queue', songListItem);
  const existingQueueItems = (await dynamo.getAll(songQueueTableName)).sort(
    (a, b) => a.Priority - b.Priority
  );
  const newQueueEntry = {
    SongID: songId,
    Artist: songListItem.Artist,
    Title: songListItem.Title,
    Priority: existingQueueItems.length
      ? existingQueueItems[existingQueueItems.length - 1].Priority + 1
      : 1,
    RequestedBy: user,
  };
  console.info('Adding queue entry', newQueueEntry);
  await dynamo.write(newQueueEntry, songQueueTableName);

  const queueData = {
    songId: newQueueEntry.SongID,
    artist: newQueueEntry.Artist,
    title: newQueueEntry.Title,
    priority: newQueueEntry.Priority,
    requestedBy: newQueueEntry.RequestedBy,
  };
  console.debug('Song added to queue', queueData);

  await websocket.broadcast({
    action: 'queueAdd',
    data: queueData,
  });
  return response.success(queueData);
};
