import { getStudents } from "@/actions/student.actions";
import { getClasses } from "@/actions/class.actions";
import { getTeachers } from "@/actions/teacher.actions";
import StudentTable from "@/components/students/StudentTable";
import Link from "next/link";
import type { StudentFilters } from "@/types/index";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function StudentsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const filters: Partial<StudentFilters> = {
    search: sp.search,
    classId: sp.classId,
    enrollmentTeacherId: sp.enrollmentTeacherId,
    enrollmentStatus: sp.enrollmentStatus as StudentFilters["enrollmentStatus"],
    paymentStatus: sp.paymentStatus as StudentFilters["paymentStatus"],
    page: sp.page ? parseInt(sp.page) : 1,
    pageSize: 20,
  };

  const [{ students, total }, classes, teachers] = await Promise.all([
    getStudents(filters),
    getClasses(),
    getTeachers(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">学生管理</h1>
        <Link
          href="/students/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
        >
          + 新建学生
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <input
          name="search"
          defaultValue={sp.search}
          placeholder="搜索姓名/学号/电话..."
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="classId"
          defaultValue={sp.classId ?? ""}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有班级</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="enrollmentTeacherId"
          defaultValue={sp.enrollmentTeacherId ?? ""}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有招生老师</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          name="enrollmentStatus"
          defaultValue={sp.enrollmentStatus ?? ""}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有在读状态</option>
          <option value="ACTIVE">在读</option>
          <option value="WITHDRAWN">退学</option>
          <option value="GRADUATED">毕业</option>
        </select>
        <select
          name="paymentStatus"
          defaultValue={sp.paymentStatus ?? ""}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有缴费状态</option>
          <option value="PAID">已缴费</option>
          <option value="PARTIAL">部分缴费</option>
          <option value="OVERDUE">欠费</option>
        </select>
        <button
          type="submit"
          className="px-4 py-1.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700"
        >
          筛选
        </button>
        <Link
          href="/students"
          className="px-4 py-1.5 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
        >
          重置
        </Link>
      </form>

      <StudentTable
        students={students}
        total={total}
        page={filters.page ?? 1}
        pageSize={20}
      />
    </div>
  );
}
