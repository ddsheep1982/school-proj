import { getGrades } from "@/actions/grade.actions";
import NewClassForm from "./NewClassForm";

export default async function NewClassPage() {
  const grades = await getGrades();

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">新建班级</h1>
      <NewClassForm grades={grades} />
    </div>
  );
}
