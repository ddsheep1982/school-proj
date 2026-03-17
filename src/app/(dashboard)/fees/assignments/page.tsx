import { getFeeStructures } from "@/actions/fee-structure.actions";
import { getFeeAssignments } from "@/actions/fee-assignment.actions";
import { getClasses } from "@/actions/class.actions";
import FeeAssignmentList from "@/components/fees/FeeAssignmentList";
import FeeAssignmentForm from "@/components/fees/FeeAssignmentForm";

export default async function FeeAssignmentsPage() {
  const [rawStructures, assignments, classes] = await Promise.all([
    getFeeStructures(),
    getFeeAssignments(),
    getClasses(),
  ]);
  const structures = rawStructures.map((s) => ({ ...s, amount: Number(s.amount) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">费用分配管理</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FeeAssignmentList assignments={assignments} />
        </div>
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4">新建费用分配</h2>
            <FeeAssignmentForm structures={structures} classes={classes} />
          </div>
        </div>
      </div>
    </div>
  );
}
