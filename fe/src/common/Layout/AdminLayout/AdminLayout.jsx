import { Outlet } from "react-router-dom";
import AdminHeader from "@/common/Header/AdminHeader/AdminHeader";
import AdminSidebar from "@/common/Sidebar/AdminSidebar/AdminSidebar";
import styles from "../StaffLayout/StaffLayout.module.css";

function AdminLayout() {
  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <AdminHeader />
        <div className={styles.content} data-layout-scroll>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
