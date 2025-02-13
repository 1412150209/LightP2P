import {Avatar, Button, Card, Col, Drawer, Flex, Input, List, message, Row, Select, Space, Typography} from "antd";
import {useCallback, useEffect, useState} from "react";
import {Config, get_config} from "../abstract/LocalConfig.ts";
import {PoweroffOutlined} from "@ant-design/icons";
import {get_running_status, get_user_list, get_virtual_ip, start_vnt, stop_vnt, User} from "../abstract/VntControl.ts";
import {listen} from "@tauri-apps/api/event";
import {useDebounce} from "../abstract/ReactTool.ts";
import {invoke} from "@tauri-apps/api/core";
import {get_avatar, Styles} from "../abstract/AvatarBuild.ts";

function NetworkingPage() {
    // 运行状态
    const [status, setStatus] = useState<boolean>(false)
    // 本地配置
    const [config, setConfig] = useState<Config>({
        token: "",
        name: "",
        server_address_str: "",
        stun_server: null,
        device_id: "",
    })
    // 加载等待
    const [loading, setLoading] = useState<boolean>(false)
    // 设置面板
    const [drawer, setDrawer] = useState<boolean>(false)
    // 成员列表
    const [users, setUsers] = useState<Array<User>>([])
    // 本机虚拟ip
    const [virtual_ip, setVirtualIp] = useState<string>("")
    // 本机Nat类型
    const [nat_type, setNatType] = useState<string>("")

    // 头像风格
    const [style, setStyle] = useState<Styles>(Styles.Lorelei)

    // 挂载执行
    useEffect(() => {
        // 挂载时读取配置
        get_config()
            .then((config) => {
                setConfig(config)
            })
            .catch((e) => {
                message.error("读取配置失败")
                console.error(e)
            })
        // 挂载时同步状态
        get_running_status()
            .then((status) => {
                setStatus(status)
            })
            .catch((e) => {
                message.error("读取运行状态失败")
                console.error(e)
            })
        // 挂载时同步成员列表
        get_user_list()
            .then((users) => {
                setUsers(users)
            })
            .catch((e) => {
                message.error("读取成员列表失败")
                console.error(e)
            })
        // 挂载时同步虚拟ip
        get_virtual_ip()
            .then((ip) => {
                setVirtualIp(ip)
            })
            .catch((e) => {
                message.error("读取虚拟ip失败")
                console.error(e)
            })
        // 监听运行状态
        const ls1 = listen<boolean>("lers://vnt/status", (s) => {
            setStatus(s.payload)
        }).catch((e) => {
            message.error("监听运行状态失败")
            console.error(e)
        })
        // 监听成员列表
        const ls2 = listen<User[]>("lers://vnt/users", (users) => {
            setUsers(users.payload)
        }).catch((e) => {
            message.error("监听成员列表失败")
            console.error(e)
        })
        // 监听本地虚拟ip
        const ls3 = listen<string>("lers://vnt/virtual_ip", (ip) => {
            setVirtualIp(ip.payload)
        }).catch((e) => {
            message.error("监听虚拟ip失败")
            console.error(e)
        })
        // 监听本机Nat类型
        const ls4 = listen<string>("lers://vnt/nat_type", (nat_type) => {
            setNatType(nat_type.payload)
        }).catch((e) => {
            message.error("监听本机Nat类型失败")
            console.error(e)
        })
        return () => {
            // 取消监听
            ls1.then((un) => {
                if (un) {
                    un()
                }
            })
            ls2.then((un) => {
                if (un) {
                    un()
                }
            })
            ls3.then((un) => {
                if (un) {
                    un()
                }
            })
            ls4.then((un) => {
                if (un) {
                    un()
                }
            })
        }
    }, [])


    /**
     * 设置配置
     * @param config
     */
    const set_config = (config: Config) => {
        invoke("set_config", {"config": config})
            .then(() => {
                setConfig(config)
            })
            .catch((e) => {
                message.error("设置配置失败")
                console.error(e)
            })
    }

    /**
     * 防抖设置配置
     */
    const set_config_debounced = useCallback(useDebounce(set_config, 500), []);

    // 控制面板
    function ControlPanel() {
        /**
         * 处理按钮点击事件
         */
        const clickHandler = async () => {
            // 防止短时间重复点击
            setLoading(true)
            // 正在运行
            if (status) {
                await stop_vnt()
                    .then(() => {
                        setUsers([])
                    })
                    .catch((e) => {
                        message.error("停止失败")
                        console.log(e)
                    })
            } else {
                await start_vnt()
                    .catch((e) => {
                        message.error("启动失败")
                        console.log(e)
                    })
            }
            setTimeout(() => {
                setLoading(false)
            }, 1000)
        }

        // 控制按钮
        function ControlButton() {
            let text;
            let color;
            if (status) {
                text = "ON"
                color = "#1ECBE1"
            } else {
                text = "OFF"
                color = "#E1341E"
            }
            return (
                <Button
                    style={{height: "27vw", width: "27vw"}}
                    loading={loading}
                    shape={"round"}
                    icon={
                        <>
                            <PoweroffOutlined style={{
                                fontSize: "10vw",
                                color: color
                            }}/>
                            <Typography.Title level={5} style={{margin: 0}}>{text}</Typography.Title>
                        </>
                    }
                    onClick={clickHandler}
                />
            )
        }

        // 设置面板
        function SettingsPanel() {
            return (
                <Space style={{marginLeft: "3vw"}} size={"small"}>
                    <Flex vertical>
                        <Typography.Text type={"secondary"}>
                            昵称: {config.name}
                        </Typography.Text>
                        <Typography.Text type={"secondary"}>
                            组: {config.token}
                        </Typography.Text>
                        {status ?
                            <>
                                <Typography.Text copyable={{
                                    tooltips: ["复制", "复制成功"],
                                    text: virtual_ip
                                }}>
                                    虚拟ip: {virtual_ip}
                                </Typography.Text>
                                <Typography.Text type={"secondary"}>
                                    Nat类型: {nat_type}
                                </Typography.Text>
                            </>
                            :
                            null
                        }
                    </Flex>
                    {status ?
                        null
                        :
                        <Button type={"link"} disabled={status} onClick={() => {
                            setDrawer(true)
                        }}>设置</Button>}
                </Space>
            )
        }

        return (
            <Card style={{height: "28vh"}}>
                <Space align={"center"}>
                    <ControlButton/>
                    <SettingsPanel/>
                </Space>
            </Card>
        )
    }

    // 成员面板
    function MembersPanel() {
        // 获取头像
        function GetAvatar(name: string) {
            if (name.length == 0) {
                name = "Default"
            }
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + (hash << 5) - hash;
            }
            console.log(get_avatar(style, name))
            return (
                <Avatar
                    src={get_avatar(style, name)}
                    size={"large"}
                    draggable={"false"}
                >
                    {name.charAt(0).toUpperCase()}
                </Avatar>
            )
        }

        return (
            <List
                style={{userSelect: "none", marginLeft: "5vw"}}
                locale={{emptyText: "没有成员"}}
                itemLayout={"horizontal"}
                dataSource={users}
                renderItem={(user) => (
                    <List.Item>
                        <Space>
                            {GetAvatar(user.name)}
                            <Row>
                                <Col span={12}>
                                    <Typography.Text style={{margin: 0}}>
                                        {user.name}
                                    </Typography.Text>
                                </Col>
                                <Col>
                                    <Space>
                                        <Typography.Text
                                            style={{
                                                display: user.status ? "unset" : "none"
                                            }}
                                            copyable={user.status ? {
                                                tooltips: ["复制", "复制成功"],
                                                text: user.ip
                                            } : undefined}
                                        >
                                            虚拟ip: {user.ip}
                                        </Typography.Text>
                                        <Typography.Text
                                            style={{
                                                display: user.status ? "unset" : "none"
                                            }}
                                            // 判断是否成功打洞
                                            type={user.nat_traversal_type.indexOf("P2P") != -1 || user.nat_traversal_type.indexOf("PCP") != -1 ? "success" : "danger"}>
                                            {user.nat_traversal_type}
                                        </Typography.Text>
                                        <Typography.Text type={user.status ? "success" : "danger"}>
                                            {user.status ? "在线" : "离线"}
                                        </Typography.Text>
                                    </Space>
                                </Col>
                            </Row>
                        </Space>
                    </List.Item>
                )}
            />
        )
    }

    return (
        <Flex vertical>
            <ControlPanel/>
            <MembersPanel/>
            <Drawer onClose={() => {
                setDrawer(false)
            }} open={drawer} placement={"bottom"} title={"配置设置"}>
                <Space direction={"vertical"}>
                    <Input addonBefore={"昵称"}
                           defaultValue={config.name}
                           allowClear
                           count={{
                               max: 15,
                               show: true
                           }}
                           onChange={(e) => {
                               if (e.target.value && e.target.value.length <= 15)
                                   set_config_debounced({
                                       ...config,
                                       name: e.target.value,
                                   })
                           }}
                    />
                    <Input addonBefore={"虚拟组"}
                           defaultValue={config.token}
                           allowClear
                           count={{
                               max: 10,
                               show: true
                           }}
                           onChange={(e) => {
                               if (e.target.value && e.target.value.length <= 10)
                                   set_config_debounced({
                                       ...config,
                                       token: e.target.value,
                                   })
                           }}
                    />
                    <Input addonBefore={"服务器地址"}
                           defaultValue={config.server_address_str}
                           allowClear
                           onChange={(e) => {
                               if (e.target.value)
                                   set_config_debounced({
                                       ...config,
                                       server_address_str: e.target.value,
                                   })
                           }}
                    />
                    <Select
                        prefix={"头像风格："}
                        defaultValue={style}
                        onChange={(value) => {
                            setStyle(value)
                        }}
                        options={Object.keys(Styles)
                            .filter(key => isNaN(Number(key)))
                            .map((key) => {
                                return {
                                    label: key,
                                    value: key
                                }
                            })
                        }
                    />
                </Space>
            </Drawer>
        </Flex>
    )
}

export default NetworkingPage