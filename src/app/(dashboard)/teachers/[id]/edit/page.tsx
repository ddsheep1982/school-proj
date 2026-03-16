import { notFound } from "next/navigation";
import { getTeacherById } from "@/actions/teacher.actions";
import EditTeacherForm from "./EditTeacherForm";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTeacherPage({ params }: Props) {
  const { id } = await params;
  const teacher = await getTeacherById(id);
  if (!teacher) notFound();

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-3">
        <Link href={`/teachers/${id}`} className="text-gray-400 hover:text-gray-600">← {teacher.name}</Link>
        <h1 className="text-2xl font-bold">编辑招生老师</h1>
      </div>
      <EditTeacherForm id={id} name={teacher.name} phone={teacher.phone} active={teacher.active} />
    </div>
  );
}
