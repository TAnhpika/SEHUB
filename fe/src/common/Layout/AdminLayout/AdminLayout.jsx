import { Outlet } from "react-router-dom";
import AdminHeader from "@/common/Header/AdminHeader/AdminHeader";
import AdminSidebar from "@/common/Sidebar/AdminSidebar/AdminSidebar";
import { AdminPageProvider } from "@/features/admin/context/AdminPageContext";
import styles from "../StaffLayout/StaffLayout.module.css";

function AdminLayout() {
  return (
    <AdminPageProvider>
      <div className={styles.layout}>
        <AdminSidebar />
        <div className={styles.main}>
          <AdminHeader />
          <div className={styles.content} data-layout-scroll>
            <Outlet />
          </div>
        </div>
      </div>
    </AdminPageProvider>
  );
}

export default AdminLayout;
