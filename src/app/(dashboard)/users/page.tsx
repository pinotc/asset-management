// src/app/(dashboard)/users/page.tsx
import { getUsers, createUser } from "@/actions/user.actions";
import { Users, Shield, PlusCircle, Mail, Key } from "lucide-react";
import { format } from "date-fns";

export default async function UsersManagementPage() {
  const response = await getUsers();
  const users = response.success ? response.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-samsung" />
          Quản lý Nhân sự & Phân quyền
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Cấp phát tài khoản MES cho các phòng ban và kỹ thuật viên bảo trì.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form thêm mới */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-factory-border shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-gray-500" /> Cấp tài khoản mới
            </h2>
            <form action={async (formData) => {
                "use server";
                await createUser(formData);
              }} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Họ và tên</label>
                <input required name="name" type="text" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none" placeholder="VD: Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1"><Mail className="inline h-3 w-3 mr-1"/> Email nội bộ</label>
                <input required name="email" type="email" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none" placeholder="nv.a@daehacable.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1"><Key className="inline h-3 w-3 mr-1"/> Mật khẩu khởi tạo</label>
                <input required name="password" type="password" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1"><Shield className="inline h-3 w-3 mr-1"/> Vai trò (Role)</label>
                <select name="role" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none bg-white">
                  <option value="USER">User (Nhân viên thường)</option>
                  <option value="TECHNICIAN">Technician (Kỹ thuật viên)</option>
                  <option value="MANAGER">Manager (Quản lý)</option>
                  <option value="ADMIN">Admin (Quản trị hệ thống)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-samsung text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition">
                Tạo tài khoản
              </button>
            </form>
          </div>
        </div>

        {/* Danh sách tài khoản */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-factory-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Nhân sự</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Ngày cấp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users?.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{user.name}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border
                          ${user.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' : 
                            user.role === 'MANAGER' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            user.role === 'TECHNICIAN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'}
                        `}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {format(new Date(user.createdAt), "dd/MM/yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!users || users.length === 0) && (
              <div className="text-center p-8 text-gray-500">Chưa có tài khoản nào.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}