const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');
const { broadcast } = require('../helpers/broadcast');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue cancel request received', event);
  const songId = event.pathParameters.songId;

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
    throw new Error(`[404] Song not currently queued`);
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
