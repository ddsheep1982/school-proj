import { auth, signOut } from "@/lib/auth";

export default async function TopBar() {
  const session = await auth();
  const user = session?.user as { name?: string; role?: string } | undefined;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.name ?? "用户"}
          {user?.role === "ADMIN" && (
            <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              管理员
            </span>
          )}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            退出
          </button>
        </form>
      </div>
    </header>
  );
}
