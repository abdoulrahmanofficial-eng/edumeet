import { db } from '../config/firebase';
import { Class, CreateClassRequest, User } from '../types';
import { generateId, generateInviteCode as genCode, toTimestamp } from '../utils/helpers';

export async function createClass(
  data: CreateClassRequest,
  teacherId: string,
  teacherName: string
): Promise<Class> {
  const id = generateId();
  const newClass: Class = {
    id,
    title: data.title,
    description: data.description || '',
    teacherId,
    teacherName,
    scheduledAt: data.scheduledAt,
    duration: data.duration,
    recurring: data.recurring || 'none',
    status: 'upcoming',
    roomId: `room-${id}`,
    inviteCode: genCode(),
    createdAt: toTimestamp(),
    maxStudents: data.maxStudents || 100,
  };

  await db.ref(`classes/${id}`).set(newClass);
  await db.ref(`teacher-classes/${teacherId}/${id}`).set(true);

  return newClass;
}

export async function getClass(id: string): Promise<Class | null> {
  const snapshot = await db.ref(`classes/${id}`).once('value');
  return snapshot.val();
}

export async function updateClass(
  id: string,
  data: Partial<Class>
): Promise<void> {
  await db.ref(`classes/${id}`).update(data);
}

export async function deleteClass(id: string, teacherId: string): Promise<void> {
  const classData = await getClass(id);
  if (!classData) throw new Error('Class not found');
  if (classData.teacherId !== teacherId) throw new Error('Not authorized');

  await db.ref(`classes/${id}`).remove();
  await db.ref(`teacher-classes/${teacherId}/${id}`).remove();

  const studentSnapshot = await db.ref(`class-students/${id}`).once('value');
  const students = studentSnapshot.val();
  if (students) {
    for (const studentId of Object.keys(students)) {
      await db.ref(`student-classes/${studentId}/${id}`).remove();
    }
  }
  await db.ref(`class-students/${id}`).remove();
}

export async function getTeacherClasses(teacherId: string): Promise<Class[]> {
  const snapshot = await db.ref(`teacher-classes/${teacherId}`).once('value');
  const classIds = snapshot.val();
  if (!classIds) return [];

  const classes: Class[] = [];
  for (const id of Object.keys(classIds)) {
    const classData = await getClass(id);
    if (classData) classes.push(classData);
  }

  return classes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getStudentClasses(studentId: string): Promise<Class[]> {
  const snapshot = await db.ref(`student-classes/${studentId}`).once('value');
  const classIds = snapshot.val();
  if (!classIds) return [];

  const classes: Class[] = [];
  for (const id of Object.keys(classIds)) {
    const classData = await getClass(id);
    if (classData) classes.push(classData);
  }

  return classes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function joinClass(
  inviteCode: string,
  studentId: string
): Promise<Class> {
  const allClassesSnapshot = await db.ref('classes').once('value');
  const allClasses = allClassesSnapshot.val();
  if (!allClasses) throw new Error('Invalid invite code');

  let targetClass: Class | null = null;
  for (const [id, classData] of Object.entries(allClasses)) {
    const c = classData as Class;
    if (c.inviteCode === inviteCode) {
      targetClass = { ...c, id };
      break;
    }
  }

  if (!targetClass) throw new Error('Invalid invite code');
  if (targetClass.status !== 'upcoming') throw new Error('Class is not available');

  const studentsSnapshot = await db.ref(`class-students/${targetClass.id}`).once('value');
  const enrolledStudents = studentsSnapshot.val();
  const currentCount = enrolledStudents ? Object.keys(enrolledStudents).length : 0;

  if (currentCount >= targetClass.maxStudents) {
    throw new Error('Class is full');
  }

  if (enrolledStudents && enrolledStudents[studentId]) {
    throw new Error('Already enrolled in this class');
  }

  await db.ref(`class-students/${targetClass.id}/${studentId}`).set(true);
  await db.ref(`student-classes/${studentId}/${targetClass.id}`).set(true);

  return targetClass;
}

export async function leaveClass(
  classId: string,
  studentId: string
): Promise<void> {
  await db.ref(`class-students/${classId}/${studentId}`).remove();
  await db.ref(`student-classes/${studentId}/${classId}`).remove();
}

export async function generateInviteCode(classId: string): Promise<string> {
  const code = genCode();
  await db.ref(`classes/${classId}/inviteCode`).set(code);
  return code;
}

export async function getEnrolledStudents(classId: string): Promise<User[]> {
  const snapshot = await db.ref(`class-students/${classId}`).once('value');
  const studentIds = snapshot.val();
  if (!studentIds) return [];

  const students: User[] = [];
  for (const studentId of Object.keys(studentIds)) {
    const userSnapshot = await db.ref(`users/${studentId}`).once('value');
    const userData = userSnapshot.val();
    if (userData) students.push(userData);
  }

  return students;
}
