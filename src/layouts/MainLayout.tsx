import { Outlet } from "react-router"

export default function MainLayout() {
    return (

        <>
            {/* <Header /> //removed for now because I was overdoing it again. I need to focus on the bare minimum and then expand as and when need. */}
            <main className="max-w-4xl mx-auto p-10 border border-graphite">
                <Outlet />
            </main>
        </>

    )
}