import { db } from '../config/firebase';
import { WhiteboardAction } from '../types';
import { generateId, toTimestamp } from '../utils/helpers';

export async function saveAction(
  meetingId: string,
  action: Omit<WhiteboardAction, 'id' | 'timestamp'>
): Promise<WhiteboardAction> {
  const newAction: WhiteboardAction = {
    ...action,
    id: generateId(),
    timestamp: toTimestamp(),
  };

  await db
    .ref(`whiteboard/${meetingId}/actions/${newAction.id}`)
    .set(newAction);

  const currentIndex = await db
    .ref(`whiteboard/${meetingId}/currentIndex`)
    .once('value');
  const index = currentIndex.val() ?? -1;

  await db.ref(`whiteboard/${meetingId}/currentIndex`).set(index + 1);

  const totalActions = await db
    .ref(`whiteboard/${meetingId}/actions`)
    .once('value');
  const actions = totalActions.val() || {};
  const actionCount = Object.keys(actions).length;

  if (actionCount > index + 1) {
    const actionKeys = Object.keys(actions);
    for (let i = index + 1; i < actionKeys.length; i++) {
      await db
        .ref(`whiteboard/${meetingId}/actions/${actionKeys[i]}`)
        .remove();
    }
  }

  return newAction;
}

export async function getActions(meetingId: string): Promise<WhiteboardAction[]> {
  const snapshot = await db.ref(`whiteboard/${meetingId}/actions`).once('value');
  const data = snapshot.val();
  if (!data) return [];

  const currentIndex = await db
    .ref(`whiteboard/${meetingId}/currentIndex`)
    .once('value');
  const index = currentIndex.val() ?? Object.keys(data).length;

  return Object.values(data as Record<string, WhiteboardAction>).slice(0, index + 1);
}

export async function clearBoard(meetingId: string): Promise<void> {
  await db.ref(`whiteboard/${meetingId}`).remove();
}

export async function undoAction(meetingId: string): Promise<number> {
  const currentIndex = await db
    .ref(`whiteboard/${meetingId}/currentIndex`)
    .once('value');
  const index = currentIndex.val() ?? -1;

  if (index < 0) throw new Error('No actions to undo');

  const newIndex = index - 1;
  await db.ref(`whiteboard/${meetingId}/currentIndex`).set(newIndex);
  return newIndex;
}

export async function redoAction(meetingId: string): Promise<number> {
  const currentIndex = await db
    .ref(`whiteboard/${meetingId}/currentIndex`)
    .once('value');
  const index = currentIndex.val() ?? -1;

  const actionsSnapshot = await db
    .ref(`whiteboard/${meetingId}/actions`)
    .once('value');
  const actions = actionsSnapshot.val();
  const actionCount = actions ? Object.keys(actions).length : 0;

  if (index >= actionCount - 1) throw new Error('No actions to redo');

  const newIndex = index + 1;
  await db.ref(`whiteboard/${meetingId}/currentIndex`).set(newIndex);
  return newIndex;
}
