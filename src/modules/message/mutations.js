import assert from 'assert';
import { stripId } from 'helpers/data';
import { isNil } from 'lodash';

export const Send = types => ({
  name: 'SendMessage',
  inputFields: {
    conversationId: types.ID,
    body: types.String,
  },
  outputFields: {
    changedConversation: types.Conversation,
  },
  mutateAndGetPayload: async (
    { conversationId, body },
    { db, session: { currentUserId } }
  ) => {
    assert(body, 'Messages must have bodies');
    assert(conversationId, 'Messages must have a ChaatId!');
    assert(currentUserId, 'You must be logged in!');

    // updates updatedAAt on the convo or fails if convo doesn't exist
    const currentConversation = await db.update(
      'conversations',
      { id: stripId(conversationId) },
      { updatedAt: new Date() },
    );
    assert(currentConversation, "Conversation doesn't exist!");

    // fails if the db call fails
    await db.insert('messages', {
      createdAt: new Date(),
      authoredByUserId: currentUserId,
      heldByConversationId: stripId(conversationId),
      seen: false,
      body,
    });

    return { currentConversation };
  },
});

export const View = types => ({
  name: 'ViewMessage',
  inputFields: {
    messageId: types.ID,
  },
  outputFields: {
    changedConversation: types.Conversation,
  },
  mutateAndGetPayload: async (
    { messageId },
    { db }
  ) => {
    // update the message
    const updatedMessage = await db.update(
      'messages',
      { id: stripId(messageId) },
      { seen: true },
    );
    assert(!isNil(updatedMessage), "Message doesn't exist!");

    // update the currentConversation
    const conversation = await db.update(
      'conversations',
      { id: updatedMessage[0].heldByConversationId },
      { updatedAt: new Date() },
    );
    assert(!isNil(conversation), "Conversation doesn't exist!");
    console.log(conversation);

    const changedConversation = conversation[0];

    return { changedConversation };
  },
});
