const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');
const { broadcast } = require('../helpers/broadcast');
const Validation = require('../helpers/validation');

const songListTableName = process.env.songListTableName;
const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue add request received', event);
  
  const songId = event.pathParameters.songId;
  if (!Validation.isValidId(songId)) {
    return Responses._400({ message: 'Invalid song ID' });
  }

  let songListItem;
  try {
    songListItem = await Dynamo.get({ ID: songId }, songListTableName);
  } catch (error) {
    return Responses._404({ message: 'Song not found' });
  }

  if (await Dynamo.exists({ SongID: songId }, songQueueTableName)) {
    return Responses._400({ message: 'Song already queued' });
  }

  console.debug('Adding song to queue', songListItem);
  const existingQueueItems = (await Dynamo.getAll(songQueueTableName)).sort(
    (a, b) => a.Priority - b.Priority
  );
  const newQueueEntry = {
    SongID: songId,
    Artist: songListItem.Artist,
    Title: songListItem.Title,
    Priority: existingQueueItems.length
      ? existingQueueItems[existingQueueItems.length - 1].Priority + 1
      : 1,
  };
  console.info('Adding queue entry', newQueueEntry);
  await Dynamo.write(newQueueEntry, songQueueTableName);

  const queueData = {
    songId: newQueueEntry.SongID,
    artist: newQueueEntry.Artist,
    title: newQueueEntry.Title,
    priority: newQueueEntry.Priority,
  };
  console.debug('Song added to queue', queueData);

  await broadcast({
    action: 'queueAdd',
    data: queueData,
  });
  return Responses._200(queueData);
};
