import {HookAPI} from "antd/es/modal/useModal";
import {MessageInstance} from "antd/es/message/interface";
import {compareVersion} from "../abstract/ReactTool.ts";
import PackageJson from "../../package.json";
import {Typography} from "antd";
import {openUrl} from "@tauri-apps/plugin-opener";

export async function Updater(modal: HookAPI, messageApi: MessageInstance) {
    fetch("http://8.137.114.160:5244/d/local/LightP2P/info.json")
        .then(res => res.json())
        .then(async (data) => {
            if (compareVersion(PackageJson.version, data["version"]) == -1) {
                modal.confirm({
                    title: "有新版本",
                    content: (
                        <Typography.Text style={{whiteSpace: 'pre-line'}}>
                            {data["update"]}
                        </Typography.Text>
                    ),
                    onOk: () => {
                        openUrl("http://8.137.114.160:5244/d/local/LightP2P/latest.exe")
                    },
                    okText: "下载",
                    cancelText: "取消"
                });
            } else {
                messageApi.info("当前已是最新版本")
            }
        })
}