import {Tool, ToolControl, ToolTag} from "../abstract/ToolControl.ts";
import {message, Progress, Row, Space, Switch, Typography} from "antd";
import {useCallback, useEffect, useState} from "react";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import {useThrottle} from "../abstract/ReactTool.ts";
import {TerminatedPayload} from "../abstract/Command.ts";

export function ToolControllerItem({tool}: { tool: Tool }) {
    const [messageApi, contextHolder] = message.useMessage();

    const [running, setRunning] = useState<boolean>(false)
    const [ready, setReady] = useState<boolean>(false)
    const [progress, setProgress] = useState<number>(0)


    const controller = new ToolControl(tool, {
        after: (result: TerminatedPayload) => {
            setRunning(false)
            if (tool.callback?.after) {
                tool.callback.after(result)
            }
        },
        before: async () => {
            setRunning(true)
        },
        onError: (e) => {
            console.error(e)
            messageApi.error(e)
            setRunning(false)
            if (tool.callback?.onError) {
                tool.callback.onError(e)
            }
        },
        onStdout: (data) => {
            console.info(data)
            if (tool.callback?.onStdout) {
                tool.callback.onStdout(data)
            }
        },
    })

    // 运行
    const start = useCallback(async () => {
        // 再次检测
        controller.check()
            .then(async (s) => {
                setReady(s)
                if (s) {
                    try {
                        if (tool.callback?.before) {
                            const args = await tool.callback.before()
                                .catch((e) => {
                                    console.error(e)
                                    messageApi.error((e as Error).message)
                                })
                            if (args)
                                await controller.run(args)
                        } else {
                            await controller.run()
                        }
                    } catch (e) {
                        console.error(e)
                        messageApi.error((e as Error).message)
                    }
                } else {
                    setProgress(0)
                }
            })
    }, [])

    // 停止
    const stop = useCallback(() => {
        controller.stop()
            .catch((e) => {
                console.error(e)
                messageApi.error((e as Error).message)
            })
    }, [])

    useEffect(() => {
        controller.check()
            .then((s) => {
                setReady(s)
                if (!s) {
                    setProgress(0)
                }
            })
    }, [])

    const set_progress = useCallback(useThrottle(setProgress), [])

    return (
        <Space>
            {contextHolder}
            {tool.icon}
            <Row>
                <Space>
                    <Typography.Link href={tool.link ? tool.link : undefined} target={"_blank"}>
                        {tool.name}
                    </Typography.Link>
                    {ready ?
                        <Row>
                            {tool.tags.includes(ToolTag.Switch) &&
                                <Switch
                                    size={"small"}
                                    value={running}
                                    checkedChildren={<CheckOutlined/>}
                                    unCheckedChildren={<CloseOutlined/>}
                                    onChange={async (checked) => {
                                        if (checked) {
                                            await start()
                                        } else {
                                            stop()
                                        }
                                    }}
                                />
                            }
                            {tool.tags.includes(ToolTag.Button) &&
                                <Typography.Link
                                    style={{marginLeft: "10px"}}
                                    onClick={() => {
                                        start()
                                    }}
                                >
                                    运行
                                </Typography.Link>
                            }
                        </Row>
                        :
                        <Typography.Link
                            style={{marginLeft: "10px"}}
                            onClick={() => {
                                controller.load((payload) => {
                                    const percentage = Math.floor((payload.progressTotal / payload.total) * 100);
                                    set_progress(percentage)
                                })
                                    .then(() => {
                                        setReady(true)
                                    })
                                    .catch((e) => {
                                        console.error(e)
                                        messageApi.error((e as Error).message)
                                        setProgress(0)
                                    })
                            }}
                        >
                            加载
                            <Progress size={18} type={"dashboard"} gapDegree={0} percent={progress}/>
                        </Typography.Link>
                    }
                </Space>
                <Typography.Paragraph style={{fontSize: "4vw", marginBottom: 0}}
                                      type={"secondary"}>
                    {tool.description}
                </Typography.Paragraph>
            </Row>
            {tool.extra}
        </Space>
    )
}