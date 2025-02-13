import {Card, Divider, Flex, theme, Typography} from "antd";
import DynamicGradientTag from "../components/DynamicGradientTag.tsx";
import PackageJson from "../../package.json"

function AboutPage() {
    const {token: {colorBgElevated},} = theme.useToken();
    return (
        <Card bordered={false} styles={{
            body: {
                background: colorBgElevated
            }
        }}>
            <Typography>
                <Typography.Title level={3} style={{marginTop: 0, marginBottom: 5}}>
                    Light P2P <DynamicGradientTag>v{PackageJson.version}</DynamicGradientTag>
                </Typography.Title>
                <Typography.Paragraph>
                    <Typography.Text>
                        Light P2P是一款用于组建虚拟局域网的软件，核心使用了
                        <Typography.Link href={"https://github.com/vnt-dev/vnt"} target={"_blank"}>
                            vnt
                        </Typography.Link>
                        这个开源项目，旨在用最简单的方式创建最方便的联机环境。
                    </Typography.Text>
                </Typography.Paragraph>
                <Divider style={{marginTop: 8, marginBottom: 8}}/>
                <Typography.Title level={4} style={{marginTop: 0, marginBottom: 5}}>
                    软件作者
                </Typography.Title>
                <Typography.Link href={"https://lers.site/"} target={"_blank"}>
                    @lers梦貘
                </Typography.Link>
                <Divider style={{marginTop: 8, marginBottom: 8}}/>
                <Typography.Title level={4} style={{marginTop: 0, marginBottom: 5}}>
                    特别感谢
                </Typography.Title>
                <Flex vertical={true}>
                    <Typography.Link href={"https://github.com/vnt-dev/vnt"} target={"_blank"}>
                        vnt@github
                    </Typography.Link>
                    <Typography.Link href={"https://ant-design.antgroup.com/"} target={"_blank"}>
                        Ant Design
                    </Typography.Link>
                    <Typography.Link href={"https://tauri.app/"} target={"_blank"}>
                        Tauri
                    </Typography.Link>
                </Flex>
            </Typography>
        </Card>
    )
}

export default AboutPage