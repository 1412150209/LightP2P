import {Layout, Tabs, theme} from "antd";
import NetworkingPage from "../pages/NetworkingPage.tsx";
import AboutPage from "../pages/AboutPage.tsx";
import ToolPage from "../pages/ToolPage.tsx";

const {Content} = Layout

function ContentComponent() {
    const {token: {colorBgElevated},} = theme.useToken();
    const tabs = [
        {
            key: '1',
            label: <p style={{marginTop: 0, marginBottom: 0}}>组网</p>,
            children: <NetworkingPage/>
        },
        {
            key: '2',
            label: <p style={{marginTop: 0, marginBottom: 0}}>工具</p>,
            children: <ToolPage/>
        },
        {
            key: '3',
            label: <p style={{marginTop: 0, marginBottom: 0}}>关于</p>,
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