import {Layout, Tabs, theme} from "antd";
import NetworkingPage from "../pages/NetworkingPage.tsx";
import AboutPage from "../pages/AboutPage.tsx";

const {Content} = Layout

function ContentComponent() {
    const {token: {colorBgElevated},} = theme.useToken();
    const tabs = [
        {
            key: '1',
            label: <p style={{userSelect: "none", marginTop: 0, marginBottom: 0}}>组网</p>,
            children: <NetworkingPage/>
        },
        // todo: 添加工具页面
        // {
        //     key: '2',
        //     label: <p style={{userSelect: "none", marginTop: 0, marginBottom: 0}}>工具</p>
        // },
        {
            key: '3',
            label: <p style={{userSelect: "none", marginTop: 0, marginBottom: 0}}>关于</p>,
            children: <AboutPage/>
        },
    ]

    return (
        <Content
            style={{
                background: colorBgElevated,
                flex: 1
            }}
        >
            <Tabs
                tabBarStyle={{
                    marginBottom: 0
                }}
                style={{
                    background: colorBgElevated
                }}
                centered
                defaultActiveKey="1"
                items={tabs}/>
        </Content>
    )
}

export default ContentComponent