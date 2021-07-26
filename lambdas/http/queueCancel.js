const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');
const { broadcast } = require('../helpers/broadcast');
const Validation = require('../helpers/validation');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue cancel request received', event);

  const songId = event.pathParameters.songId;
  if (!Validation.isValidId(songId)) {
    return Responses._400({ message: 'Invalid song ID' });
  }

  let oldValue;
  try {
    oldValue = await Dynamo.delete(
      { SongID: songId },
      songQueueTableName,
      'attribute_exists(SongID)',
      'ALL_OLD'
    );
    console.info('Removed song from queue', oldValue);
  } catch (error) {
    return Responses._404({ message: 'Song not currently queued' });
  }

  await broadcast({
    action: 'queueCancel',
    data: {
      songId: songId,
      title: oldValue.Attributes.Title,
      artist: oldValue.Attributes.Artist,
    },
  });
  return Responses._204();
};
