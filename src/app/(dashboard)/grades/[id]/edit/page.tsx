import { getGrades } from "@/actions/grade.actions";
import { notFound } from "next/navigation";
import EditGradeForm from "./EditGradeForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditGradePage({ params }: Props) {
  const { id } = await params;
  const grades = await getGrades();
  const grade = grades.find((g) => g.id === id);
  if (!grade) notFound();

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">编辑年级</h1>
      <EditGradeForm id={id} name={grade.name} campusName={grade.campus.name} />
    </div>
  );
}
