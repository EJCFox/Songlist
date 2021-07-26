const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');
const { broadcast } = require('../helpers/broadcast');
const Validation = require('../helpers/validation');

const songListTableName = process.env.songListTableName;
const songQueueTableName = process.env.songQueueTableName;
const songHistoryTableName = process.env.songHistoryTableName;

exports.handler = async (event) => {
  console.info('Queue mark song as played request received', event);
  const songId = event.pathParameters.songId;
  if (!Validation.isValidId(songId)) {
    return Responses._400({ message: 'Invalid song ID' });
  }

  const timestamp = new Date().toISOString();
  const songItem = await Dynamo.get({ ID: songId }, songListTableName);

  try {
    await Dynamo.delete(
      { SongID: songId },
      songQueueTableName,
      'attribute_exists(SongID)'
    );
  } catch (error) {
    return Responses._404({ message: 'Song not currently queued' });
  }

  const updatedSongItem = {
    ...songItem,
    NumberOfPlays: songItem.NumberOfPlays + 1,
    LastPlayed: timestamp,
  };
  const historyItem = {
    SongID: songId,
    Timestamp: timestamp,
  };

  console.info('Updating song list entry', songItem, updatedSongItem);
  await Dynamo.write(
    updatedSongItem,
    songListTableName,
    `NumberOfPlays = :numberOfPlays`,
    { ':numberOfPlays': songItem.NumberOfPlays }
  );
  console.info('Writing history entry', historyItem);
  await Dynamo.write(historyItem, songHistoryTableName);

  await broadcast({
    action: 'queuePlayed',
    data: {
      songId: songId,
      title: updatedSongItem.Title,
      artist: updatedSongItem.Artist,
      numberOfPlays: updatedSongItem.NumberOfPlays,
      lastPlayed: updatedSongItem.LastPlayed,
    },
  });
  return Responses._204();
};
