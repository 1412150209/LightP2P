import {Avatar, List, message, Modal} from "antd";
import {Tool, ToolTag} from "../abstract/ToolControl.ts";
import {ToolControllerItem} from "../components/ToolController.tsx";
import {get_user_list} from "../abstract/VntControl.ts";
import {GpingSelect} from "../tools/GPing.tsx";
import {Updater} from "../tools/Updater.tsx";
import {DownloadOutlined} from "@ant-design/icons";

function ToolPage() {
    const [modal, modalHolder] = Modal.useModal()
    const [messageApi, messageHolder] = message.useMessage();

    const tools: Array<Tool> = [
        {
            name: "GPing",
            description: "GPing是一个用于测试网络延迟的工具",
            link: "https://github.com/orf/gping",
            icon: <Avatar shape={"square"}>🚀</Avatar>,
            tags: [ToolTag.Download, ToolTag.Button, ToolTag.Command, ToolTag.ArgsGet],
            download_url_position: {
                "http://8.137.114.160:5244/d/local/LightP2P/tools/gping.exe": "./tool/gping.exe"
            },
            command: "./tool/gping.exe",
            callback: {
                before: async () => {
                    const users = await get_user_list()
                    const select = await GpingSelect(modal, messageApi, users
                        .filter(user => user.status)
                        .map(user => ({label: user.name, value: user.ip}))
                    )
                    if (select.length === 0) {
                        throw new Error("用户取消")
                    }
                    return select
                }
            },
        },
        {
            name: "更新检测",
            description: "检测当前是不是最新版本",
            link: "",
            icon: <Avatar shape={"square"} icon={<DownloadOutlined/>}/>,
            tags: [ToolTag.Button],
            callback: {
                before: async () => {
                    await Updater(modal, messageApi)
                }
            }
        }
    ]

    return (
        <>
            {modalHolder}
            {messageHolder}
            <List
                bordered
                locale={{emptyText: "没有成员"}}
                itemLayout={"horizontal"}
                dataSource={tools}
                renderItem={(tool) => (
                    <List.Item>
                        <ToolControllerItem tool={tool}/>
                    </List.Item>
                )}
            />
        </>
    )
}

export default ToolPage