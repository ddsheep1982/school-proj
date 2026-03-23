import { notFound } from "next/navigation";
import { getClassById } from "@/actions/class.actions";
import { getGrades } from "@/actions/grade.actions";
import EditClassForm from "./EditClassForm";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClassPage({ params }: Props) {
  const { id } = await params;
  const [cls, grades] = await Promise.all([getClassById(id), getGrades()]);
  if (!cls) notFound();

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-3">
        <Link href={`/classes/${id}`} className="text-gray-400 hover:text-gray-600">
          ← {cls.name}
        </Link>
        <h1 className="text-2xl font-bold">编辑班级</h1>
      </div>
      <EditClassForm id={id} name={cls.name} capacity={cls.capacity} gradeId={cls.gradeId ?? ""} grades={grades} />
    </div>
  );
}
