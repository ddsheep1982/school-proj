import { notFound } from "next/navigation";
import { getAgentById } from "@/actions/agent.actions";
import EditAgentForm from "./EditAgentForm";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAgentPage({ params }: Props) {
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) notFound();

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-3">
        <Link href={`/agents/${id}`} className="text-gray-400 hover:text-gray-600">← {agent.name}</Link>
        <h1 className="text-2xl font-bold">编辑招生代理</h1>
      </div>
      <EditAgentForm id={id} name={agent.name} agencyName={agent.agencyName ?? ""} phone={agent.phone} active={agent.active} />
    </div>
  );
}
