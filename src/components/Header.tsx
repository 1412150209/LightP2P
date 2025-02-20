import {Button, Flex, Layout, Space, theme, Typography} from "antd";
import {CloseOutlined, LineOutlined} from "@ant-design/icons";
import {Window} from "@tauri-apps/api/window";

const {Header} = Layout

function HeaderComponent() {
    const {token: {colorBgElevated},} = theme.useToken();

    return (
        <Header
            style={{
                width: "100%",
                background: colorBgElevated,
                padding: 0,
                height: "10vh"
            }}
            data-tauri-drag-region>
            <Flex style={{marginLeft: "8vw", marginRight: "5vw"}} align={"center"} justify={"space-between"}
                  data-tauri-drag-region>
                <Typography.Text style={{fontSize: "5vw"}} data-tauri-drag-region>
                    Light P2P
                </Typography.Text>
                <Space align={"center"} style={{lineHeight: "10vh"}} data-tauri-drag-region>
                    <Button size={"small"} icon={<LineOutlined/>}
                            onClick={async () => {
                                await Window.getCurrent().minimize();
                            }}
                    />
                    <Button size={"small"} icon={<CloseOutlined/>}
                            onClick={async () => {
                                await Window.getCurrent().hide();
                            }}
                    />
                </Space>
            </Flex>
        </Header>
    )
}

export default HeaderComponent