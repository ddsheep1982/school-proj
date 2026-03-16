import { getClasses } from "@/actions/class.actions";
import { getTeachers } from "@/actions/teacher.actions";
import { getAgents } from "@/actions/agent.actions";
import StudentForm from "@/components/students/StudentForm";

export default async function NewStudentPage() {
  const [classes, teachers, agents] = await Promise.all([
    getClasses(),
    getTeachers(),
    getAgents(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">新建学生</h1>
      <StudentForm classes={classes} teachers={teachers} agents={agents} />
    </div>
  );
}
