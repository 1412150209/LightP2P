import {Select, Space} from "antd";
import {MessageInstance} from "antd/es/message/interface";
import {HookAPI} from "antd/es/modal/useModal";

export async function GpingSelect(modal: HookAPI, messageApi: MessageInstance, options: Array<{
    label: string,
    value: string
}>) {
    return new Promise<string[]>(resolve => {
        let selected: string[] = [];
        modal.confirm({
            title: "选择Ping对象",
            content: (
                <Space style={{width: "100%"}} direction={"vertical"}>
                    <Select
                        style={{width: "100%"}}
                        placeholder={"请选择需要ping的对象"}
                        mode="multiple"
                        options={options}
                        onChange={values => selected = values}
                    />
                </Space>
            ),
            onOk: () => {
                if (selected.length === 0) {
                    messageApi.error('请至少选择一个对象');
                    return Promise.reject(); // 阻止对话框关闭
                }
                resolve(selected);
            },
            onCancel: () => resolve([]), // 取消时返回空数组
            okText: "运行",
            cancelText: "取消"
        });
    });
}