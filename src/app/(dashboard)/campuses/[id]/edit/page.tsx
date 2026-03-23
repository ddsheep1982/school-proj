import { getCampuses } from "@/actions/campus.actions";
import { notFound } from "next/navigation";
import EditCampusForm from "./EditCampusForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCampusPage({ params }: Props) {
  const { id } = await params;
  const campuses = await getCampuses();
  const campus = campuses.find((c) => c.id === id);
  if (!campus) notFound();

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">编辑校区</h1>
      <EditCampusForm id={id} name={campus.name} description={campus.description ?? ""} />
    </div>
  );
}
