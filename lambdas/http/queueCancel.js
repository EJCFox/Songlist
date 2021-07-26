const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');
const websocket = require('../helpers/websocket');
const validation = require('../helpers/parameterValidation');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue cancel request received', event);

  const songId = event.pathParameters.songId;
  if (!validation.isValidId(songId)) {
    return response.badRequest({ message: 'Invalid song ID' });
  }

  let oldValue;
  try {
    oldValue = await dynamo.delete(
      { SongID: songId },
      songQueueTableName,
      'attribute_exists(SongID)',
      'ALL_OLD'
    );
    console.info('Removed song from queue', oldValue);
  } catch (error) {
    return response.notFound({ message: 'Song not currently queued' });
  }

  await websocket.broadcast({
    action: 'queueCancel',
    data: {
      songId: songId,
      title: oldValue.Attributes.Title,
      artist: oldValue.Attributes.Artist,
    },
  });
  return response.successNoContent;
};
