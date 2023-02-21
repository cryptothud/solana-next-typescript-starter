import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Navbar } from "./navbar";

export default function MainLayout({ children }) {

    return (
        <>
            <div className="w-screen h-[60px]">
                <ToastContainer />
                <Navbar />
                {children}
            </div>
        </>
    )
}