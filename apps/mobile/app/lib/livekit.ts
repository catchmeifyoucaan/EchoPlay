import { Room, RoomEvent, createLocalTracks, RemoteParticipant } from 'livekit-client';

export type LiveKitConnectionOptions = {
  url: string;
  token: string;
};

export const joinLiveKitRoom = async (
  { url, token }: LiveKitConnectionOptions,
  onParticipantUpdate: (participants: RemoteParticipant[]) => void
) => {
  const room = new Room();
  room.on(RoomEvent.ParticipantConnected, () => onParticipantUpdate(Array.from(room.remoteParticipants.values())));
  room.on(RoomEvent.ParticipantDisconnected, () =>
    onParticipantUpdate(Array.from(room.remoteParticipants.values()))
  );
  room.on(RoomEvent.ActiveSpeakersChanged, () =>
    onParticipantUpdate(Array.from(room.remoteParticipants.values()))
  );

  const tracks = await createLocalTracks({ audio: true });
  await room.connect(url, token, { autoSubscribe: true });
  tracks.forEach(track => room.localParticipant.publishTrack(track));

  return room;
};
