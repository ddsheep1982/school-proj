import { notFound } from "next/navigation";
import { getStudentById } from "@/actions/student.actions";
import { getClasses } from "@/actions/class.actions";
import { getTeachers } from "@/actions/teacher.actions";
import { getAgents } from "@/actions/agent.actions";
import StudentForm from "@/components/students/StudentForm";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: Props) {
  const { id } = await params;
  const [student, classes, teachers, agents] = await Promise.all([
    getStudentById(id),
    getClasses(),
    getTeachers(),
    getAgents(),
  ]);

  if (!student) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/students/${id}`} className="text-gray-400 hover:text-gray-600">
          ← {student.name}
        </Link>
        <h1 className="text-2xl font-bold">编辑学生信息</h1>
      </div>
      <StudentForm
        classes={classes}
        teachers={teachers}
        agents={agents}
        student={student}
      />
    </div>
  );
}
