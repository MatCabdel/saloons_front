import { Message } from '../../../conversation/models/Conversation';
import { mergeAndSortMessages } from './message-sync';

describe('mergeAndSortMessages', () => {
  const message = (id: number, sentAt: string): Message => ({
    id,
    conversationId: 10,
    sender: 2,
    senderName: 'other',
    content: `message-${id}`,
    sentAt,
  });

  it('keeps successive messages in chronological order', () => {
    const result = mergeAndSortMessages(
      [message(2, '2026-01-01T10:02:00Z')],
      [message(1, '2026-01-01T10:01:00Z')],
      10
    );

    expect(result.map(item => item.id)).toEqual([1, 2]);
  });

  it('deduplicates websocket and HTTP copies using the backend id', () => {
    const incoming = message(1, '2026-01-01T10:01:00Z');
    const result = mergeAndSortMessages([incoming], [{ ...incoming }], 10);

    expect(result).toHaveLength(1);
  });

  it('normalizes senderId from HTTP snapshots', () => {
    const incoming = message(1, '2026-01-01T10:01:00Z');
    const result = mergeAndSortMessages(
      [],
      [{ ...incoming, sender: undefined as unknown as number, senderId: 2 }],
      10
    );

    expect(result[0].sender).toBe(2);
  });

  it('does not replace live messages when a reconnect snapshot is merged', () => {
    const result = mergeAndSortMessages(
      [message(2, '2026-01-01T10:02:00Z')],
      [message(1, '2026-01-01T10:01:00Z'), message(2, '2026-01-01T10:02:00Z')],
      10
    );

    expect(result.map(item => item.id)).toEqual([1, 2]);
  });
});
