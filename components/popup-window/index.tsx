import { IoCloseSharp } from "react-icons/io5"

export const PopupWindow = ({ showWindow, setShowWindow, backgroundColor, backgroundBlur, popupColor, rounded, children }: { showWindow: boolean, setShowWindow: Function, backgroundColor?: string, backgroundBlur?: string, popupColor?: string, rounded?: boolean, children: any }) => {
    if (showWindow === true) {
        return (
            <div className="top-0 left-0 w-screen h-screen fixed z-[999] flex justify-center items-center" style={{ background: backgroundColor ?? "#0b0b0b80", backdropFilter: `blur(${backgroundBlur ?? "4px"})` }}>
                <div className="w-[800px] max-w-[95vw] h-[70vh] relative shadow-lg border border-[#1c1c1c] p-8 flex justify-center" style={{ background: popupColor ?? "#0b0b0b", borderRadius: rounded ? "16px" : "0" }}>
                    <div className="absolute top-0 right-0 cursor-pointer p-1" style={{ borderRadius: rounded ? "50%" : "0" }} onClick={() => setShowWindow(false)}>
                        <IoCloseSharp color="#fff" size={30} />
                    </div>
                    <div className="flex flex-col items-center gap-2 overflow-auto my-auto max-h-full w-full">
                        {children}
                    </div>
                </div>
            </div>
        )
    } else {
        <></>
    }
}