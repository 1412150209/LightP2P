import {ReactNode} from "react";
import {resolveResource} from "@tauri-apps/api/path";
import {exists, mkdir} from "@tauri-apps/plugin-fs";
import {download} from "@tauri-apps/plugin-upload";
import {openUrl} from "@tauri-apps/plugin-opener";
import {Child, Command, TerminatedPayload} from "./Command.ts";

export enum ToolTag {
    // 需要下载
    Download,
    // 需要运行Command
    Command,
    // 启动使用Switch,保持单例
    Switch,
    // 启动使用按钮,可以多次启动
    Button,
    // 参数动态获取
    ArgsGet
}

export type Tool = {
    name: string,
    description: string,
    link: string,
    icon: ReactNode,
    tags: Array<ToolTag>,
    // 下载链接和位置
    download_url_position?: Record<string, string>,
    // 浏览器运行
    browser?: string,
    // 运行的命令
    command?: string,
    // 命令的参数
    args?: Array<string>,
    // 额外节点
    extra?: ReactNode,
    // 回调
    callback?: RunningCallBack
}

interface ProgressPayload {
    progress: number
    progressTotal: number
    total: number
    transferSpeed: number
}

interface RunningCallBack {
    before?: () => Promise<Array<string> | void>,
    after?: (result: TerminatedPayload) => void,
    onStdout?: (result: string) => void,
    onError?: (error: string) => void
}


export class ToolControl {
    public tool: Tool
    private child: Child | undefined
    private callback: RunningCallBack

    public constructor(tool: Tool, callback?: RunningCallBack) {
        this.tool = tool
        this.callback = callback ?? {}
    }

    public async check() {
        if (this.tool.tags.includes(ToolTag.Download) && this.tool.download_url_position) {
            // 检查文件是否存在
            for (const [_url, position] of Object.entries(this.tool.download_url_position)) {
                const path = await resolveResource(position)
                if (!await exists(path)) {
                    return false
                }
            }
        }
        return true
    }

    public async load(download_handler?: (payload: ProgressPayload) => void) {
        // 需要下载，存在下载链接
        if (this.tool.tags.includes(ToolTag.Download) && this.tool.download_url_position) {
            if (!await this.check()) {
                for (const [url, position] of Object.entries(this.tool.download_url_position)) {
                    const path = await resolveResource(position)
                    const folder = path.split("\\").slice(0, -1).join("\\")
                    // 文件夹不存在
                    if (!await exists(folder)) {
                        await mkdir(folder, {recursive: true})
                    }
                    if (!await exists(path)) {
                        // 下载文件
                        try {
                            await download(
                                url,
                                path,
                                download_handler
                            )
                        } catch (e) {
                            console.error(e)
                            throw new Error("文件下载失败")
                        }
                    }
                }
            }
        }
    }

    public async run(args?: Array<string>) {
        // 运行前
        if (this.callback.before) {
            await this.callback.before()
            // 需要动态获取参数
            if (this.tool.tags.includes(ToolTag.ArgsGet)) {
                this.tool.args = args
                if (this.tool.args === undefined || this.tool.args.length === 0) {
                    throw new Error("参数获取失败")
                }
            }
        }
        // 不需要下载，在网页打开
        if (!this.tool.tags.includes(ToolTag.Download) && this.tool.browser) {
            await openUrl(this.tool.browser)
            return
        }
        if (this.tool.tags.includes(ToolTag.Command) && this.tool.command) {
            // 运行命令
            let command = Command.create(await resolveResource(this.tool.command), this.tool.args)
            command
                .addListener("terminated", (result) => {
                    this.child = undefined
                    if (this.callback.after) {
                        this.callback.after(result)
                    }
                })
            if (this.callback.onStdout) {
                command.addListener("stdout", (result) => {
                    if (this.callback.onStdout) {
                        this.callback.onStdout(result)
                    }
                })
            }
            if (this.callback.onError) {
                command.addListener("error", (error) => {
                    if (this.callback.onError) {
                        this.callback.onError(error)
                    }
                })
            }
            this.child = await command.spawn()
        }
    }

    public async stop() {
        if (this.child) {
            await this.child.kill()
        }
    }
}