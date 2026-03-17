import { getFeeStructures } from "@/actions/fee-structure.actions";
import FeeStructureList from "@/components/fees/FeeStructureList";
import FeeStructureForm from "@/components/fees/FeeStructureForm";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function FeeStructuresPage({ searchParams }: Props) {
  const sp = await searchParams;
  const academicYear = sp.academicYear;
  const rawStructures = await getFeeStructures(academicYear);
  const structures = rawStructures.map((s) => ({ ...s, amount: Number(s.amount) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">费用项目管理</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FeeStructureList structures={structures} academicYear={academicYear} />
        </div>
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4">新建费用项目</h2>
            <FeeStructureForm />
          </div>
        </div>
      </div>
    </div>
  );
}
