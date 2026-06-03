import { Outlet } from "react-router-dom";
import GuestHeader from "@/common/Header/GuestHeader/GuestHeader";
import Footer from "@/common/Footer/Footer";
import styles from "./GuestLayout.module.css";

function GuestLayout() {
  return (
    <div className={styles.layout}>
      <GuestHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default GuestLayout;
