import {Channel, invoke} from "@tauri-apps/api/core";
import {EventEmitter} from "./EventEmitter"

export interface TerminatedPayload {
    code: number | null
    signal: number | null
}

type CommandEvent =
    | {
    event: "stdout",
    payload: string
}
    | {
    event: "error",
    payload: string
}
    | {
    event: "terminated",
    payload: TerminatedPayload
}

interface CommandEvents {
    stdout: string,
    error: string,
    terminated: TerminatedPayload
}

export class Command extends EventEmitter<CommandEvents> {
    private readonly command: string
    private readonly args: string[]
    private readonly hide: boolean

    static create(
        program: string,
        args: string | string[] = [],
        hide: boolean = false
    ): Command {
        return new Command(program, args, hide)
    }

    constructor(command: string, args: string | string[] = [], hide: boolean) {
        super();
        this.command = command
        this.args = typeof args === 'string' ? [args] : args
        this.hide = hide
    }

    async spawn(): Promise<Child> {
        const command = this.command
        const args = this.args
        const hide = this.hide

        if (typeof args === 'object') {
            Object.freeze(args)
        }

        const onEvent = new Channel<CommandEvent>()
        onEvent.onmessage = (event) => {
            switch (event.event) {
                case "stdout":
                    this.emit("stdout", event.payload)
                    break
                case "error":
                    this.emit("error", event.payload)
                    break
                case "terminated":
                    this.emit("terminated", event.payload)
                    break
            }
        }
        return await invoke<number>("command_spawn", {
            command,
            args,
            hide,
            onEvent
        }).then((pid) => new Child(pid))
    }
}

export class Child {
    pid: number

    constructor(pid: number) {
        this.pid = pid
    }

    async kill(): Promise<void> {
        await invoke("child_kill", {
            pid: this.pid
        })
    }
}
