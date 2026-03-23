import { getCampuses } from "@/actions/campus.actions";
import NewGradeForm from "./NewGradeForm";

export default async function NewGradePage() {
  const campuses = await getCampuses();

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">新建年级</h1>
      <NewGradeForm campuses={campuses} />
    </div>
  );
}
